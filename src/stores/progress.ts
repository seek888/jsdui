import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Plan {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  hasPlanFile: boolean
  hasSummaryFile: boolean
}

export interface Phase {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number // 0-100
  plans: Plan[]
}

export interface SessionContext {
  currentPhase: string | null
  currentPlan: string | null
  blockers: string[]
  keyDecisions: string[]
}

export interface ProgressData {
  phases: Phase[]
  session: SessionContext
  lastUpdated: Date | null
}

// Parse markdown-style progress data (fallback when JSON is not available)
function parseMarkdownProgress(markdown: string): ProgressData {
  const phases: Phase[] = []
  const lines = markdown.split('\n')
  let currentPhase: Phase | null = null

  for (const line of lines) {
    // Phase header: ## Phase N: Name
    const phaseMatch = line.match(/^##\s+(Phase\s+\d+:\s*.+)/i)
    if (phaseMatch) {
      if (currentPhase) phases.push(currentPhase)
      const name = phaseMatch[1].trim()
      currentPhase = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        status: 'pending',
        progress: 0,
        plans: []
      }
      continue
    }

    // Progress bar: - [x] 50%
    const progressMatch = line.match(/-\s*\[[x ]\]\s*(\d+)%/)
    if (progressMatch && currentPhase) {
      currentPhase.progress = parseInt(progressMatch[1], 10)
      if (currentPhase.progress === 100) {
        currentPhase.status = 'completed'
      } else if (currentPhase.progress > 0) {
        currentPhase.status = 'in-progress'
      }
      continue
    }

    // Plan item: - [x] Plan name or - [ ] Plan name
    const planMatch = line.match(/-\s*\[([ x])\]\s*(.+)/)
    if (planMatch && currentPhase) {
      const isDone = planMatch[1] === 'x'
      const planName = planMatch[2].trim()
      currentPhase.plans.push({
        id: planName.toLowerCase().replace(/\s+/g, '-'),
        name: planName,
        status: isDone ? 'completed' : 'pending',
        hasPlanFile: false,
        hasSummaryFile: false
      })
    }
  }

  if (currentPhase) phases.push(currentPhase)

  return {
    phases,
    session: {
      currentPhase: null,
      currentPlan: null,
      blockers: [],
      keyDecisions: []
    },
    lastUpdated: new Date()
  }
}

export const useProgressStore = defineStore('progress', () => {
  // State
  const phases = ref<Phase[]>([])
  const session = ref<SessionContext>({
    currentPhase: null,
    currentPlan: null,
    blockers: [],
    keyDecisions: []
  })
  const isLoading = ref(false)
  const lastUpdated = ref<Date | null>(null)
  const error = ref<string | null>(null)

  // Cache
  const cacheTimeout = 30 * 1000 // 30 seconds
  let roadmapCache: { data: ProgressData; timestamp: number } | null = null
  let stateCache: { data: SessionContext; timestamp: number } | null = null

  // Getters
  const currentPhase = computed(() =>
    phases.value.find((p) => p.status === 'in-progress')
  )

  const incompletePlans = computed(() =>
    phases.value.flatMap((p) =>
      p.plans
        .filter((plan) => plan.status !== 'completed')
        .map((plan) => ({ ...plan, phaseName: p.name }))
    )
  )

  const hasBlockers = computed(() => session.value.blockers.length > 0)

  // Actions
  async function fetchRoadmap(): Promise<ProgressData | null> {
    // Check cache
    if (
      roadmapCache &&
      Date.now() - roadmapCache.timestamp < cacheTimeout
    ) {
      return roadmapCache.data
    }

    try {
      const result = await window.electronAPI.executeGsdTool([
        'roadmap',
        'analyze'
      ])

      if (!result.success || !result.data) {
        error.value = result.error || 'Failed to fetch roadmap'
        return null
      }

      let data: ProgressData

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(result.data)
        data = {
          phases: parsed.phases || [],
          session: session.value,
          lastUpdated: new Date()
        }

        // Update plan status based on JSON
        for (const phase of data.phases) {
          for (const plan of phase.plans) {
            plan.hasPlanFile = false
            plan.hasSummaryFile = false
          }
        }
      } catch {
        // Fallback to markdown parsing
        data = parseMarkdownProgress(result.data)
      }

      // Update cache
      roadmapCache = { data, timestamp: Date.now() }
      lastUpdated.value = data.lastUpdated

      return data
    } catch (err) {
      error.value = String(err)
      return null
    }
  }

  async function fetchStateSnapshot(): Promise<SessionContext | null> {
    // Check cache
    if (
      stateCache &&
      Date.now() - stateCache.timestamp < cacheTimeout
    ) {
      return stateCache.data
    }

    try {
      const result = await window.electronAPI.executeGsdTool([
        'state-snapshot'
      ])

      if (!result.success || !result.data) {
        // State-snapshot might not exist, use defaults
        return null
      }

      let ctx: SessionContext

      // Try JSON first
      try {
        ctx = JSON.parse(result.data)
      } catch {
        // Parse markdown-style state
        ctx = parseMarkdownState(result.data)
      }

      // Update cache
      stateCache = { data: ctx, timestamp: Date.now() }
      session.value = ctx

      return ctx
    } catch {
      return null
    }
  }

  function parseMarkdownState(markdown: string): SessionContext {
    const ctx: SessionContext = {
      currentPhase: null,
      currentPlan: null,
      blockers: [],
      keyDecisions: []
    }

    const lines = markdown.split('\n')
    let currentSection: 'blockers' | 'decisions' | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('## blockers') || trimmed.startsWith('**Blockers')) {
        currentSection = 'blockers'
        continue
      }
      if (trimmed.startsWith('## key-decisions') || trimmed.startsWith('**Key Decisions')) {
        currentSection = 'decisions'
        continue
      }

      // List items
      if (trimmed.startsWith('- ')) {
        const content = trimmed.slice(2).replace(/^\*\s*/, '').trim()
        if (currentSection === 'blockers') {
          ctx.blockers.push(content)
        } else if (currentSection === 'decisions') {
          ctx.keyDecisions.push(content)
        }
      }

      // Current location
      const locationMatch = trimmed.match(/current[_-]?(phase|plan)[:\s]+(.+)/i)
      if (locationMatch) {
        const key = locationMatch[1].toLowerCase()
        const value = locationMatch[2].trim()
        if (key === 'phase') ctx.currentPhase = value
        if (key === 'plan') ctx.currentPlan = value
      }
    }

    return ctx
  }

  async function refreshProgress() {
    isLoading.value = true
    error.value = null

    try {
      const [roadmapData, stateData] = await Promise.all([
        fetchRoadmap(),
        fetchStateSnapshot()
      ])

      if (roadmapData) {
        phases.value = roadmapData.phases
      }

      if (stateData) {
        session.value = stateData
      }

      lastUpdated.value = new Date()
    } catch (err) {
      error.value = String(err)
    } finally {
      isLoading.value = false
    }
  }

  function invalidateCache() {
    roadmapCache = null
    stateCache = null
  }

  return {
    // State
    phases,
    session,
    isLoading,
    lastUpdated,
    error,
    // Getters
    currentPhase,
    incompletePlans,
    hasBlockers,
    // Actions
    fetchRoadmap,
    fetchStateSnapshot,
    refreshProgress,
    invalidateCache
  }
})

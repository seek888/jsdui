import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const SKIP_ENV_CHECKS = import.meta.env.DEV

  // State
  const projectPath = ref<string | null>(null)
  const projectName = ref<string | null>(null)
  const nodeStatus = ref<'idle' | 'checking' | 'installed' | 'missing'>('idle')
  const nodeVersion = ref<string | null>(null)
  const claudeStatus = ref<'idle' | 'checking' | 'installed' | 'missing'>('idle')
  const claudeVersion = ref<string | null>(null)

  // Getters
  const isProjectOpen = computed(() => projectPath.value !== null)
  const isReady = computed(
    () =>
      nodeStatus.value === 'installed' && claudeStatus.value === 'installed'
  )

  // Actions
  async function checkNode() {
    if (SKIP_ENV_CHECKS) {
      nodeStatus.value = 'installed'
      nodeVersion.value = 'skipped (dev)'
      return
    }

    nodeStatus.value = 'checking'
    try {
      const result = await window.electronAPI.checkNodeVersion()
      if (result.success && result.data) {
        nodeStatus.value = 'installed'
        nodeVersion.value = result.data
      } else {
        nodeStatus.value = 'missing'
        nodeVersion.value = null
      }
    } catch {
      nodeStatus.value = 'missing'
      nodeVersion.value = null
    }
  }

  async function checkClaude() {
    if (SKIP_ENV_CHECKS) {
      claudeStatus.value = 'installed'
      claudeVersion.value = 'skipped (dev)'
      return
    }

    claudeStatus.value = 'checking'
    try {
      const result = await window.electronAPI.checkClaudeVersion()
      if (result.success && result.data) {
        claudeStatus.value = 'installed'
        claudeVersion.value = result.data
      } else {
        claudeStatus.value = 'missing'
        claudeVersion.value = null
      }
    } catch {
      claudeStatus.value = 'missing'
      claudeVersion.value = null
    }
  }

  async function openProject(path: string) {
    projectPath.value = path
    // Extract project name from path
    const parts = path.replace(/\\/g, '/').split('/')
    projectName.value = parts[parts.length - 1] || path

    // Start checking
    await Promise.all([checkNode(), checkClaude()])
  }

  function closeProject() {
    projectPath.value = null
    projectName.value = null
    nodeStatus.value = 'idle'
    nodeVersion.value = null
    claudeStatus.value = 'idle'
    claudeVersion.value = null
  }

  return {
    projectPath,
    projectName,
    nodeStatus,
    nodeVersion,
    claudeStatus,
    claudeVersion,
    isProjectOpen,
    isReady,
    checkNode,
    checkClaude,
    openProject,
    closeProject
  }
})

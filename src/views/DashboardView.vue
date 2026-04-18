<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { NCard, NButton, NGrid, NGi, NTag, NSpace, NText, NCollapse, NSpin, NEmpty } from 'naive-ui'
import { useProjectStore } from '@/stores/project'
import { useCliStore } from '@/stores/cli'
import { useProgressStore } from '@/stores/progress'
import PhaseCard from '@/components/PhaseCard.vue'
import SessionContext from '@/components/SessionContext.vue'
import AttentionPanel from '@/components/AttentionPanel.vue'

const projectStore = useProjectStore()
const cliStore = useCliStore()
const progressStore = useProgressStore()

// Expand all phases by default
const expandedPhases = computed(() =>
  progressStore.phases.map((p) => p.id)
)

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Initial load
  if (projectStore.isProjectOpen) {
    progressStore.refreshProgress()
  }

  // Auto-refresh every 30 seconds when project is open
  refreshInterval = setInterval(() => {
    if (projectStore.isProjectOpen) {
      progressStore.refreshProgress()
    }
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

function openProjectFolder() {
  if (projectStore.projectPath) {
    window.electronAPI.showItemInFolder(projectStore.projectPath)
  }
}

function handleRefresh() {
  progressStore.invalidateCache()
  progressStore.refreshProgress()
}

function handlePlanClick(_planId: string) {
  // Navigate to documents view with plan selected
  window.location.hash = '#/main/documents'
}

const lastUpdatedText = computed(() => {
  if (!progressStore.lastUpdated) return ''
  const date = progressStore.lastUpdated
  return date.toLocaleTimeString()
})
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>📊 Dashboard</h2>
      <NSpace align="center">
        <NTag v-if="projectStore.projectName" type="info">
          {{ projectStore.projectName }}
        </NTag>
        <NButton
          size="small"
          @click="openProjectFolder"
          v-if="projectStore.projectPath"
        >
          Open in Explorer
        </NButton>
      </NSpace>
    </div>

    <!-- Loading State -->
    <div v-if="progressStore.isLoading && progressStore.phases.length === 0" class="loading-state">
      <NSpin size="large" />
      <NText depth="3">Loading progress...</NText>
    </div>

    <!-- No Project Open -->
    <div v-else-if="!projectStore.isProjectOpen" class="empty-state">
      <NEmpty description="No project open" size="large">
        <template #icon>
          <span style="font-size: 64px">🔀</span>
        </template>
      </NEmpty>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      <NGrid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
        <!-- Progress Overview (spans 2 columns) -->
        <NGi :span="2" :md="2" :sm="1">
          <NCard title="Phase Progress" size="small">
            <template #header-extra>
              <NSpace align="center" :size="12">
                <NText depth="3" style="font-size: 12px">
                  {{ lastUpdatedText }}
                </NText>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :loading="progressStore.isLoading"
                  @click="handleRefresh"
                >
                  🔄
                </NButton>
              </NSpace>
            </template>

            <div v-if="progressStore.phases.length === 0" class="empty-phases">
              <NEmpty description="No phases found" size="small" />
            </div>

            <NCollapse v-else default-expanded-names="[expandedPhases[0]]">
              <PhaseCard
                v-for="phase in progressStore.phases"
                :key="phase.id"
                :phase="phase"
                :is-current="phase.status === 'in-progress'"
                @plan-click="handlePlanClick"
              />
            </NCollapse>
          </NCard>
        </NGi>

        <!-- Session Context -->
        <NGi :span="1" :md="1" :sm="1">
          <SessionContext :session="progressStore.session" />
        </NGi>

        <!-- Attention Panel -->
        <NGi :span="1" :md="1" :sm="1">
          <AttentionPanel
            :incomplete-plans="progressStore.incompletePlans"
            :blockers="progressStore.session.blockers"
            @plan-click="handlePlanClick"
          />
        </NGi>

        <!-- Command Status (spans all columns) -->
        <NGi :span="3" :md="3" :sm="1">
          <NCard title="Command Status" size="small">
            <NSpace>
              <NTag
                v-for="cmd in cliStore.commands"
                :key="cmd.id"
                :type="
                  cmd.status === 'success'
                    ? 'success'
                    : cmd.status === 'failure'
                      ? 'error'
                      : cmd.status === 'running'
                        ? 'info'
                        : 'default'
                "
                :bordered="cmd.status === 'running'"
                round
              >
                {{ cmd.icon }} {{ cmd.label }}: {{ cmd.status }}
              </NTag>
            </NSpace>
          </NCard>
        </NGi>
      </NGrid>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dashboard-header h2 {
  margin: 0;
  color: #e0e0e0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-phases {
  padding: 24px 0;
  text-align: center;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
}
</style>

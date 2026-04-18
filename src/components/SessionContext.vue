<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NEmpty, NAlert } from 'naive-ui'
import type { SessionContext } from '@/stores/progress'

const props = defineProps<{
  session: SessionContext
}>()

const hasContent = computed(() => {
  return (
    props.session.currentPhase ||
    props.session.currentPlan ||
    props.session.blockers.length > 0 ||
    props.session.keyDecisions.length > 0
  )
})
</script>

<template>
  <NCard title="Session Context" size="small">
    <template #header-extra>
      <span style="font-size: 16px">📍</span>
    </template>

    <div v-if="!hasContent" class="empty-state">
      <NEmpty description="No session data available" size="small" />
    </div>

    <div v-else class="context-content">
      <!-- Current Location -->
      <div v-if="session.currentPhase || session.currentPlan" class="context-section">
        <div class="section-label">
          <span>📍</span>
          <span>Current Location</span>
        </div>
        <div class="location-items">
          <NTag v-if="session.currentPhase" type="info" size="small">
            {{ session.currentPhase }}
          </NTag>
          <span v-if="session.currentPlan" class="plan-path">
            / {{ session.currentPlan }}
          </span>
        </div>
      </div>

      <!-- Blockers -->
      <div v-if="session.blockers.length > 0" class="context-section">
        <div class="section-label">
          <span>⚠️</span>
          <span>Blockers</span>
        </div>
        <div class="blocker-list">
          <NAlert
            v-for="(blocker, index) in session.blockers"
            :key="index"
            type="warning"
            size="small"
            :show-icon="false"
          >
            {{ blocker }}
          </NAlert>
        </div>
      </div>

      <!-- Key Decisions -->
      <div v-if="session.keyDecisions.length > 0" class="context-section">
        <div class="section-label">
          <span>💡</span>
          <span>Key Decisions</span>
        </div>
        <div class="decision-list">
          <div
            v-for="(decision, index) in session.keyDecisions"
            :key="index"
            class="decision-item"
          >
            <span class="decision-index">{{ index + 1 }}.</span>
            <span class="decision-text">{{ decision }}</span>
          </div>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.empty-state {
  padding: 20px 0;
}

.context-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.context-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.location-items {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 20px;
}

.plan-path {
  color: #666;
  font-size: 13px;
}

.blocker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 20px;
}

.decision-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 20px;
}

.decision-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #e0e0e0;
}

.decision-index {
  color: #666;
  flex-shrink: 0;
}

.decision-text {
  color: #ccc;
}
</style>

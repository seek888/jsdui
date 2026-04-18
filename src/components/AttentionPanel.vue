<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NEmpty, NAlert, NBadge, NButton, NSpace } from 'naive-ui'
import type { Phase, Plan } from '@/stores/progress'

const props = defineProps<{
  incompletePlans: Array<Plan & { phaseName: string }>
  blockers: string[]
}>()

const emit = defineEmits<{
  planClick: [planId: string]
}>()

const hasAttentionItems = computed(() => {
  return props.incompletePlans.length > 0 || props.blockers.length > 0
})

const totalItems = computed(() => {
  return props.incompletePlans.length + props.blockers.length
})

function handlePlanClick(plan: Plan & { phaseName: string }) {
  emit('planClick', plan.id)
}
</script>

<template>
  <NCard title="Attention Needed" size="small">
    <template #header-extra>
      <NSpace align="center" :size="6">
        <NBadge
          v-if="totalItems > 0"
          :value="totalItems"
          :max="99"
          type="warning"
        />
        <span style="font-size: 18px">
          {{ hasAttentionItems ? '⚠️' : '✅' }}
        </span>
      </NSpace>
    </template>

    <div v-if="!hasAttentionItems" class="empty-state">
      <NEmpty description="All clear! No pending items." size="small">
        <template #icon>
          <span style="font-size: 48px">✅</span>
        </template>
      </NEmpty>
    </div>

    <div v-else class="attention-content">
      <!-- Blockers Section -->
      <div v-if="blockers.length > 0" class="attention-section">
        <div class="section-header">
          <span>🔧</span>
          <span>Active Blockers ({{ blockers.length }})</span>
        </div>
        <div class="blocker-list">
          <NAlert
            v-for="(blocker, index) in blockers"
            :key="'blocker-' + index"
            type="error"
            size="small"
            :show-icon="true"
          >
            {{ blocker }}
          </NAlert>
        </div>
      </div>

      <!-- Incomplete Plans Section -->
      <div v-if="incompletePlans.length > 0" class="attention-section">
        <div class="section-header">
          <span>📋</span>
          <span>Pending Plans ({{ incompletePlans.length }})</span>
        </div>
        <div class="plan-list">
          <div
            v-for="plan in incompletePlans"
            :key="plan.id"
            class="pending-plan"
            @click="handlePlanClick(plan)"
          >
            <div class="plan-info">
              <NTag
                :type="plan.status === 'in-progress' ? 'info' : 'default'"
                size="tiny"
                round
              >
                {{ plan.phaseName }}
              </NTag>
              <span class="plan-name">{{ plan.name }}</span>
            </div>
            <NTag
              :type="plan.status === 'in-progress' ? 'info' : 'default'"
              size="tiny"
            >
              {{ plan.status }}
            </NTag>
          </div>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.empty-state {
  padding: 24px 0;
  text-align: center;
}

.attention-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attention-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.blocker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pending-plan {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: background-color 0.2s;
}

.pending-plan:hover {
  background: rgba(255, 255, 255, 0.08);
}

.plan-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.plan-name {
  font-size: 13px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

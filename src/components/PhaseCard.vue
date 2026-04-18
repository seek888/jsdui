<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NProgress, NBadge, NCollapse, NCollapseItem, NTag, NButton, NIcon } from 'naive-ui'
import type { Phase } from '@/stores/progress'
import PlanItem from './PlanItem.vue'

const props = defineProps<{
  phase: Phase
  isCurrent?: boolean
}>()

const emit = defineEmits<{
  planClick: [planId: string]
}>()

const statusType = computed(() => {
  switch (props.phase.status) {
    case 'completed':
      return 'success'
    case 'in-progress':
      return 'info'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
})

const statusLabel = computed(() => {
  switch (props.phase.status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'failed':
      return 'Failed'
    default:
      return 'Pending'
  }
})

const completedPlans = computed(
  () => props.phase.plans.filter((p) => p.status === 'completed').length
)

function handlePlanClick(planId: string) {
  emit('planClick', planId)
}
</script>

<template>
  <NCollapse-item :name="phase.id">
    <template #header>
      <div class="phase-header">
        <div class="phase-info">
          <NBadge
            :dot="isCurrent"
            :type="isCurrent ? 'info' : undefined"
          >
            <span class="phase-name">{{ phase.name }}</span>
          </NBadge>
          <NTag :type="statusType" size="small" round>
            {{ statusLabel }}
          </NTag>
        </div>
        <div class="phase-progress">
          <span class="progress-text">{{ phase.progress }}%</span>
          <NProgress
            type="line"
            :percentage="phase.progress"
            :show-indicator="false"
            :height="6"
            :border-radius="3"
            :fill-border-radius="3"
            :status="phase.status === 'completed' ? 'success' : undefined"
            style="width: 100px"
          />
        </div>
      </div>
    </template>

    <div class="phase-content">
      <div class="plans-header">
        <span class="plans-count">
          {{ completedPlans }} / {{ phase.plans.length }} Plans
        </span>
      </div>

      <div class="plans-list">
        <PlanItem
          v-for="plan in phase.plans"
          :key="plan.id"
          :plan="plan"
          @click="handlePlanClick(plan.id)"
        />
      </div>
    </div>
  </NCollapse-item>
</template>

<style scoped>
.phase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 12px;
}

.phase-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.phase-name {
  font-weight: 500;
}

.phase-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  color: #999;
  min-width: 35px;
  text-align: right;
}

.phase-content {
  padding: 8px 0;
}

.plans-header {
  margin-bottom: 8px;
}

.plans-count {
  font-size: 12px;
  color: #999;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

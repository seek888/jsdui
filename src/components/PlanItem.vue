<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NTooltip } from 'naive-ui'
import type { Plan } from '@/stores/progress'

const props = defineProps<{
  plan: Plan
}>()

const emit = defineEmits<{
  click: []
}>()

const statusIcon = computed(() => {
  switch (props.plan.status) {
    case 'completed':
      return '✅'
    case 'in-progress':
      return '🔄'
    case 'failed':
      return '❌'
    default:
      return '⏳'
  }
})

const statusType = computed(() => {
  switch (props.plan.status) {
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
</script>

<template>
  <div class="plan-item" @click="emit('click')">
    <div class="plan-left">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="plan-name" :class="{ completed: plan.status === 'completed' }">
        {{ plan.name }}
      </span>
    </div>

    <div class="plan-right">
      <NTooltip trigger="hover" v-if="plan.hasPlanFile">
        <template #trigger>
          <span class="doc-icon has-file">📄</span>
        </template>
        PLAN.md exists
      </NTooltip>

      <NTooltip trigger="hover" v-if="plan.hasSummaryFile">
        <template #trigger>
          <span class="doc-icon has-file">📋</span>
        </template>
        SUMMARY.md exists
      </NTooltip>

      <NTooltip trigger="hover" v-if="!plan.hasPlanFile && !plan.hasSummaryFile && plan.status === 'pending'">
        <template #trigger>
          <span class="doc-icon no-file">📝</span>
        </template>
        No documentation yet
      </NTooltip>

      <NTag :type="statusType" size="tiny" round>
        {{ plan.status }}
      </NTag>
    </div>
  </div>
</template>

<style scoped>
.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  background: rgba(255, 255, 255, 0.03);
}

.plan-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.plan-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 14px;
}

.plan-name {
  font-size: 13px;
  color: #e0e0e0;
}

.plan-name.completed {
  color: #18a058;
  text-decoration: line-through;
}

.plan-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-icon {
  font-size: 14px;
  opacity: 0.7;
}

.doc-icon.has-file {
  opacity: 1;
}

.doc-icon.no-file {
  opacity: 0.4;
}
</style>

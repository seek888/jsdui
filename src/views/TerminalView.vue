<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { NCard, NButton, NGrid, NGi, NTag, NSpace, NAlert } from 'naive-ui'
import { useCliStore } from '@/stores/cli'
import TerminalViewComponent from '@/components/TerminalView.vue'

const cliStore = useCliStore()
const terminalRef = ref<InstanceType<typeof TerminalViewComponent> | null>(null)

// Sync output lines to terminal
watch(
  () => cliStore.outputBuffer.length,
  () => {
    // Terminal component watches its own prop, so we just trigger reactivity
  }
)

onMounted(() => {
  // Initialize CLI listeners
  cliStore.initListeners()
})

function handleCopy() {
  const text = cliStore.outputBuffer.map((l) => l.text).join('\n')
  navigator.clipboard.writeText(text).catch(() => {
    // Clipboard may not be available
  })
}

function handleClear() {
  cliStore.clearOutput()
}
</script>

<template>
  <div class="terminal-page">
    <div class="terminal-page-header">
      <h2>💻 Terminal</h2>
      <NSpace>
        <NButton size="small" @click="handleCopy">Copy Output</NButton>
        <NButton size="small" @click="handleClear">Clear</NButton>
      </NSpace>
    </div>

    <NGrid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <!-- Command Panel -->
      <NGi :span="4" :md="1">
        <NCard title="Commands" size="small" class="command-panel">
          <NSpace vertical :size="8">
            <NButton
              v-for="cmd in cliStore.commands"
              :key="cmd.id"
              block
              :type="cmd.status === 'running' ? 'info' : cmd.status === 'success' ? 'success' : cmd.status === 'failure' ? 'error' : 'default'"
              :loading="cmd.status === 'running'"
              :disabled="cliStore.isRunning && cmd.status !== 'running'"
              @click="cliStore.executeCommand(cmd)"
              size="small"
            >
              {{ cmd.icon }} {{ cmd.label }}
            </NButton>
          </NSpace>
        </NCard>
      </NGi>

      <!-- Output Panel -->
      <NGi :span="4" :md="3">
        <NCard title="Output" size="small" class="output-card">
          <!-- Status bar -->
          <div class="output-status">
            <NSpace align="center">
              <NTag
                v-if="cliStore.isRunning"
                type="info"
                size="small"
              >
                🔄 Running
              </NTag>
              <NTag
                v-else-if="cliStore.lastExitCode === 0"
                type="success"
                size="small"
              >
                ✅ Completed (exit 0)
              </NTag>
              <NTag
                v-else-if="cliStore.lastExitCode !== null"
                type="error"
                size="small"
              >
                ❌ Exit {{ cliStore.lastExitCode }}
              </NTag>
              <NText depth="3" style="font-size: 12px">
                {{ cliStore.outputBuffer.length }} lines
              </NText>
            </NSpace>
          </div>

          <!-- Terminal -->
          <div class="terminal-area">
            <TerminalViewComponent
              ref="terminalRef"
              :output-lines="cliStore.outputBuffer"
              :is-running="cliStore.isRunning"
            />
          </div>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped>
.terminal-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.terminal-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.terminal-page-header h2 {
  margin: 0;
  color: #e0e0e0;
}

.command-panel {
  height: 100%;
}

.output-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.output-status {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.terminal-area {
  flex: 1;
  min-height: 400px;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NButton, NSpace, NSpin, NAlert, NText, NIcon } from 'naive-ui'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const isChecking = ref(false)
const showInstallGuide = ref(false)

onMounted(async () => {
  isChecking.value = true
  await projectStore.checkNode()
  await projectStore.checkClaude()

  if (
    projectStore.nodeStatus === 'missing' ||
    projectStore.claudeStatus === 'missing'
  ) {
    showInstallGuide.value = true
  }
  isChecking.value = false
})

function openNodeInstall() {
  window.electronAPI.openExternal('https://nodejs.org/')
}

function openClaudeInstall() {
  window.electronAPI.openExternal(
    'https://docs.anthropic.com/en/docs/claude-code/setup'
  )
}

async function openProjectFolder() {
  // Use a simple prompt for now - in production this would be a native dialog
  const input = window.prompt('Enter project path:')
  if (input && input.trim()) {
    const path = input.trim()
    const existsResult = await window.electronAPI.exists(path)
    if (existsResult.success && existsResult.data) {
      await projectStore.openProject(path)
      if (projectStore.isReady) {
        router.push('/main')
      } else {
        showInstallGuide.value = true
      }
    }
  }
}
</script>

<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <!-- Logo / Title -->
      <div class="welcome-header">
        <h1 class="app-title">JSDUI</h1>
        <p class="app-subtitle">GSD Workflow Desktop UI</p>
      </div>

      <!-- Loading State -->
      <NCard v-if="isChecking" class="check-card">
        <NSpin size="large" />
        <p style="margin-top: 16px; color: var(--text-color-secondary)">
          Checking environment...
        </p>
      </NCard>

      <!-- Install Guide -->
      <NCard v-else-if="showInstallGuide" class="check-card">
        <h3 style="margin-bottom: 16px">⚠️ Environment Setup Required</h3>

        <NSpace vertical :size="12">
          <!-- Node.js -->
          <NAlert
            v-if="projectStore.nodeStatus === 'missing'"
            type="warning"
            title="Node.js is not installed"
          >
            <template #icon>
              <span>🔴</span>
            </template>
            <NSpace align="center">
              <NText>Node.js is required to run this application.</NText>
              <NButton size="small" @click="openNodeInstall">
                Download Node.js →
              </NButton>
            </NSpace>
          </NAlert>
          <div v-else class="status-ok">
            <span>🟢</span> Node.js {{ projectStore.nodeVersion }} installed
          </div>

          <!-- Claude CLI -->
          <NAlert
            v-if="projectStore.claudeStatus === 'missing'"
            type="warning"
            title="Claude CLI is not installed"
          >
            <template #icon>
              <span>🔴</span>
            </template>
            <NSpace align="center">
              <NText>Claude CLI (gsd) is required for GSD workflow.</NText>
              <NButton size="small" @click="openClaudeInstall">
                Setup Guide →
              </NButton>
            </NSpace>
          </NAlert>
          <div v-else class="status-ok">
            <span>🟢</span> Claude CLI {{ projectStore.claudeVersion }} installed
          </div>
        </NSpace>

        <div style="margin-top: 24px; text-align: center">
          <NButton
            type="primary"
            size="large"
            @click="openProjectFolder"
            :disabled="
              projectStore.nodeStatus !== 'installed' ||
              projectStore.claudeStatus !== 'installed'
            "
          >
            Open Project Folder
          </NButton>
        </div>
      </NCard>

      <!-- Ready State -->
      <NCard v-else class="check-card">
        <div class="ready-state">
          <div class="status-item">
            <span class="status-icon">🟢</span>
            <span>Node.js {{ projectStore.nodeVersion }}</span>
          </div>
          <div class="status-item">
            <span class="status-icon">🟢</span>
            <span>Claude CLI {{ projectStore.claudeVersion }}</span>
          </div>
        </div>
        <div style="margin-top: 24px; text-align: center">
          <NButton type="primary" size="large" @click="openProjectFolder">
            Open Project Folder
          </NButton>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
}

.welcome-content {
  width: 100%;
  max-width: 520px;
  padding: 24px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 32px;
}

.app-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #4fc3f7, #81d4fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.app-subtitle {
  font-size: 16px;
  color: #90a4ae;
  margin: 8px 0 0;
}

.check-card {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.status-ok {
  padding: 8px 12px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 6px;
  color: #81c784;
}

.ready-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-icon {
  font-size: 14px;
}
</style>

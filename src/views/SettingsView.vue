<script setup lang="ts">
import {
  NCard,
  NButton,
  NText,
  NSpace,
  NSwitch,
  NSlider,
  NSelect,
  NDivider,
  useMessage
} from 'naive-ui'
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const message = useMessage()
const projectStore = useProjectStore()

// Settings state
const sidebarCollapsed = ref(false)
const fontSize = ref(14)
const terminalFontSize = ref(13)
const autoRefresh = ref(true)
const refreshInterval = ref(30)
const theme = ref('dark')
const showHiddenFiles = ref(false)
const autoSave = ref(true)
const confirmExit = ref(true)

const themeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' }
]

// Load settings on mount
onMounted(async () => {
  try {
    const all = await window.electronAPI.getSetting<Record<string, unknown>>('preferences')
    if (all.success && all.data) {
      const p = all.data as Record<string, unknown>
      sidebarCollapsed.value = (p.sidebarCollapsed as boolean) ?? false
      fontSize.value = (p.fontSize as number) ?? 14
      terminalFontSize.value = (p.terminalFontSize as number) ?? 13
      autoRefresh.value = (p.autoRefresh as boolean) ?? true
      refreshInterval.value = (p.refreshInterval as number) ?? 30
      theme.value = (p.theme as string) ?? 'dark'
      showHiddenFiles.value = (p.showHiddenFiles as boolean) ?? false
      autoSave.value = (p.autoSave as boolean) ?? true
      confirmExit.value = (p.confirmExit as boolean) ?? true
    }
  } catch {
    // Use defaults
  }
})

// Auto-save settings on change
async function savePreferences() {
  try {
    const prefs = {
      sidebarCollapsed: sidebarCollapsed.value,
      fontSize: fontSize.value,
      terminalFontSize: terminalFontSize.value,
      autoRefresh: autoRefresh.value,
      refreshInterval: refreshInterval.value,
      theme: theme.value,
      showHiddenFiles: showHiddenFiles.value,
      autoSave: autoSave.value,
      confirmExit: confirmExit.value
    }
    await window.electronAPI.setSetting('preferences', prefs)
  } catch (e) {
    message.error('Failed to save preferences')
  }
}

watch(
  [
    sidebarCollapsed,
    fontSize,
    terminalFontSize,
    autoRefresh,
    refreshInterval,
    theme,
    showHiddenFiles,
    autoSave,
    confirmExit
  ],
  () => {
    savePreferences()
  },
  { deep: true }
)

function closeProject() {
  projectStore.closeProject()
  router.push('/welcome')
}

async function getAppVersion() {
  try {
    const result = await window.electronAPI.getSetting<string>('appVersion')
    return result.success ? result.data : '0.0.1'
  } catch {
    return '0.0.1'
  }
}

const version = ref('0.0.1')
getAppVersion().then((v) => {
  version.value = v
})
</script>

<template>
  <div class="settings-view">
    <h2>⚙️ Settings</h2>

    <!-- Appearance -->
    <NCard title="Appearance" style="margin-bottom: 16px">
      <div class="setting-row">
        <div class="setting-label">
          <NText>Theme</NText>
          <NText depth="3" style="font-size: 12px">Application color scheme</NText>
        </div>
        <NSelect
          v-model:value="theme"
          :options="themeOptions"
          style="width: 140px"
          size="small"
        />
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <NText>Font Size</NText>
          <NText depth="3" style="font-size: 12px">UI font size: {{ fontSize }}px</NText>
        </div>
        <NSlider
          v-model:value="fontSize"
          :min="10"
          :max="24"
          :step="1"
          style="width: 140px"
        />
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <NText>Show Hidden Files</NText>
          <NText depth="3" style="font-size: 12px">Display files starting with .</NText>
        </div>
        <NSwitch v-model:value="showHiddenFiles" />
      </div>
    </NCard>

    <!-- Editor -->
    <NCard title="Editor" style="margin-bottom: 16px">
      <div class="setting-row">
        <div class="setting-label">
          <NText>Terminal Font Size</NText>
          <NText depth="3" style="font-size: 12px">Terminal font size: {{ terminalFontSize }}px</NText>
        </div>
        <NSlider
          v-model:value="terminalFontSize"
          :min="10"
          :max="20"
          :step="1"
          style="width: 140px"
        />
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <NText>Auto-save</NText>
          <NText depth="3" style="font-size: 12px">Automatically save changes</NText>
        </div>
        <NSwitch v-model:value="autoSave" />
      </div>
    </NCard>

    <!-- Dashboard -->
    <NCard title="Dashboard" style="margin-bottom: 16px">
      <div class="setting-row">
        <div class="setting-label">
          <NText>Auto Refresh</NText>
          <NText depth="3" style="font-size: 12px">Automatically refresh progress data</NText>
        </div>
        <NSwitch v-model:value="autoRefresh" />
      </div>

      <div class="setting-row" v-if="autoRefresh">
        <div class="setting-label">
          <NText>Refresh Interval</NText>
          <NText depth="3" style="font-size: 12px">Every {{ refreshInterval }} seconds</NText>
        </div>
        <NSlider
          v-model:value="refreshInterval"
          :min="10"
          :max="120"
          :step="10"
          style="width: 140px"
        />
      </div>
    </NCard>

    <!-- Project -->
    <NCard title="Project" style="margin-bottom: 16px">
      <div class="setting-row">
        <div class="setting-label">
          <NText>Current Project</NText>
          <NText depth="3" style="font-size: 12px; word-break: break-all">
            {{ projectStore.projectPath || 'None' }}
          </NText>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <NText>Confirm Exit</NText>
          <NText depth="3" style="font-size: 12px">Ask before closing with running tasks</NText>
        </div>
        <NSwitch v-model:value="confirmExit" />
      </div>

      <NDivider />
      <NButton @click="closeProject" type="warning">Close Project & Return to Welcome</NButton>
    </NCard>

    <!-- Keyboard Shortcuts -->
    <NCard title="Keyboard Shortcuts" style="margin-bottom: 16px">
      <div class="shortcuts-grid">
        <div class="shortcut-row">
          <NText>Toggle Sidebar</NText>
          <kbd>⌘B</kbd>
        </div>
        <div class="shortcut-row">
          <NText>Go to Dashboard</NText>
          <kbd>⌘1</kbd>
        </div>
        <div class="shortcut-row">
          <NText>Go to Documents</NText>
          <kbd>⌘2</kbd>
        </div>
        <div class="shortcut-row">
          <NText>Go to Terminal</NText>
          <kbd>⌘3</kbd>
        </div>
        <div class="shortcut-row">
          <NText>Go to Settings</NText>
          <kbd>⌘4</kbd>
        </div>
        <div class="shortcut-row">
          <NText>Open Settings</NText>
          <kbd>⌘,</kbd>
        </div>
      </div>
    </NCard>

    <!-- About -->
    <NCard title="About">
      <div class="about-info">
        <NText style="font-size: 18px; font-weight: bold; color: #4fc3f7">JSDUI</NText>
        <NText depth="3">Version {{ version }}</NText>
        <NText depth="3">GSD Workflow Desktop UI Framework</NText>
        <NText depth="3" style="margin-top: 8px">
          Built with Electron + Vue 3 + Naive UI
        </NText>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 600px;
}
.settings-view h2 {
  margin: 0 0 16px;
  color: #e0e0e0;
}
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.setting-row:last-child {
  margin-bottom: 0;
}
.setting-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.shortcuts-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
kbd {
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #aaa;
}
.about-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

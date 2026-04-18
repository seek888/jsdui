<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import {
  NMenu,
  NLayoutSider,
  NLayout,
  NLayoutContent,
  NSpace,
  NBadge,
  useMessage,
  useNotification,
  NButton
} from 'naive-ui'
import { h, ref, computed, onMounted, onUnmounted } from 'vue'
import type { MenuOption } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const notification = useNotification()

const collapsed = ref(false)

// Load sidebar state from settings
onMounted(async () => {
  try {
    const result = await window.electronAPI.getSetting<boolean>('sidebarCollapsed')
    if (result.success && result.data !== null && result.data !== undefined) {
      collapsed.value = result.data
    }
  } catch {
    // Use default
  }

  // Listen for app errors
  window.electronAPI.onAppError((error) => {
    showErrorNotification(error.type, error.message, error.detail)
  })
})

// Error type to display config
function showErrorNotification(
  type: string,
  msg: string,
  detail?: string
) {
  const config: {
    title: string
    content: string
    type: 'error' | 'warning' | 'info'
  } = {
    title: 'Error',
    content: msg + (detail ? `\n${detail}` : ''),
    type: 'error'
  }

  switch (type) {
    case 'cli-not-found':
      config.title = '🔍 CLI Not Found'
      config.content =
        'A required CLI tool could not be found. Please check your PATH and ensure all tools are installed.'
      break
    case 'file-permission':
      config.title = '🔒 Permission Denied'
      config.content =
        'Cannot access a file or directory due to permission restrictions.'
      break
    case 'process-terminated':
      config.title = '⚠️ Process Terminated'
      config.content =
        'A process was forcefully terminated. Check the terminal for details.'
      break
    case 'unknown':
    default:
      config.title = '❌ Error'
      break
  }

  notification.error({
    title: config.title,
    content: config.content,
    duration: 5000,
    keepAliveOnHover: true
  })
}

// Shortcut handlers from main process
function setupShortcutListeners() {
  // Toggle sidebar
  window.electronAPI.onShortcutToggleSidebar?.(() => {
    toggleSidebar()
  })

  // Navigate shortcuts
  window.electronAPI.onShortcutNavigate?.((path: string) => {
    router.push(path)
  })
}

async function toggleSidebar() {
  collapsed.value = !collapsed.value
  await window.electronAPI.setSetting('sidebarCollapsed', collapsed.value)
}

// ─── Menu options with keyboard shortcut hints ───────────────────────────────

const menuOptions: MenuOption[] = [
  {
    label: () =>
      h('span', { class: 'menu-item' }, [
        'Dashboard',
        h('span', { class: 'shortcut-hint' }, '⌘1')
      ]),
    key: '/main/dashboard',
    icon: () => '📊'
  },
  {
    label: () =>
      h('span', { class: 'menu-item' }, [
        'Documents',
        h('span', { class: 'shortcut-hint' }, '⌘2')
      ]),
    key: '/main/documents',
    icon: () => '📄'
  },
  {
    label: () =>
      h('span', { class: 'menu-item' }, [
        'Terminal',
        h('span', { class: 'shortcut-hint' }, '⌘3')
      ]),
    key: '/main/terminal',
    icon: () => '💻'
  },
  {
    label: () =>
      h('span', { class: 'menu-item' }, [
        'Settings',
        h('span', { class: 'shortcut-hint' }, '⌘4')
      ]),
    key: '/main/settings',
    icon: () => '⚙️'
  }
]

const activeKey = computed(() => route.path)

function handleMenuUpdate(key: string) {
  router.push(key)
}
</script>

<template>
  <NLayout has-sider style="height: 100vh">
    <!-- Sidebar -->
    <NLayoutSider
      bordered
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="220"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      class="sidebar"
    >
      <div class="sidebar-header">
        <span v-if="!collapsed" class="app-name">JSDUI</span>
        <span v-else class="app-name-collapsed">JS</span>
      </div>
      <NMenu
        :value="activeKey"
        :options="menuOptions"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        @update:value="handleMenuUpdate"
      />
    </NLayoutSider>

    <!-- Main Content -->
    <NLayout>
      <!-- Top bar with sidebar toggle hint -->
      <div class="topbar">
        <NButton
          quaternary
          size="small"
          @click="toggleSidebar"
          class="sidebar-toggle-btn"
          title="Toggle Sidebar (⌘B)"
        >
          <template #icon>☰</template>
        </NButton>
        <span class="shortcut-info">⌘B Toggle Sidebar · ⌘1-4 Navigate</span>
      </div>

      <NLayoutContent class="main-content">
        <router-view />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.sidebar {
  background: #1a1a2e !important;
  min-height: 100vh;
}

.sidebar-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-name {
  font-size: 18px;
  font-weight: 700;
  color: #4fc3f7;
  letter-spacing: 2px;
}

.app-name-collapsed {
  font-size: 14px;
  font-weight: 700;
  color: #4fc3f7;
  letter-spacing: 1px;
}

.topbar {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #12122a;
  gap: 8px;
}

.sidebar-toggle-btn {
  color: #888;
}

.sidebar-toggle-btn:hover {
  color: #4fc3f7;
}

.shortcut-info {
  font-size: 11px;
  color: #555;
  margin-left: 4px;
}

.main-content {
  background: #0f0f23;
  min-height: calc(100vh - 40px);
  padding: 16px;
}

/* Shortcut hints in menu */
:deep(.menu-item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

:deep(.shortcut-hint) {
  font-size: 11px;
  color: #555;
  font-family: monospace;
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 5px;
  border-radius: 3px;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { NCard, NButton, NSpace, NText, NSpin, NAlert } from 'naive-ui'
import { useFileTreeStore } from '@/stores/fileTree'
import { useProjectStore } from '@/stores/project'
import FileTree from '@/components/FileTree.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

const fileTreeStore = useFileTreeStore()
const projectStore = useProjectStore()

const fileContent = ref('')
const activeFilePath = ref<string | null>(null)
const isLoadingFile = ref(false)
const activeFileName = ref<string | null>(null)
const previewMode = ref(false) // false=edit, true=preview
const isDirty = ref(false)
const monacoRef = ref<InstanceType<typeof VueMonacoEditor> | null>(null)

let unsubscribeFileChange: (() => void) | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Load file content
async function loadFile(path: string) {
  if (isDirty.value) {
    // Save first
    await saveCurrentFile()
  }

  isLoadingFile.value = true
  activeFilePath.value = path
  activeFileName.value = path.split('/').pop() ?? null

  const result = await window.electronAPI.readFile(path)
  if (result.success && result.data !== undefined) {
    fileContent.value = result.data
  } else {
    fileContent.value = `// Failed to load: ${result.error}`
  }
  isDirty.value = false
  isLoadingFile.value = false
  previewMode.value = false
}

// Save current file
async function saveCurrentFile() {
  if (!activeFilePath.value) return
  const result = await window.electronAPI.writeFile(activeFilePath.value, fileContent.value)
  if (result.success) {
    isDirty.value = false
  }
}

// Handle file selection from tree
watch(
  () => fileTreeStore.selectedPath,
  async (path) => {
    if (path) {
      await loadFile(path)
    }
  }
)

// Handle external file changes (watch callback)
function handleFileChanged(info: { event: string; path: string }) {
  // Debounce 500ms
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    // If the changed file is the currently open file
    if (info.path === activeFilePath.value) {
      // Reload if not dirty
      if (!isDirty.value) {
        loadFile(info.path)
      }
    }
    // Always refresh tree
    fileTreeStore.refresh()
  }, 500)
}

function handleEditorMount(editor: unknown) {
  // Add Cmd+S / Ctrl+S shortcut
  ;(editor as { addCommand: (keyCode: number, handler: () => void) => void }).addCommand(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).monaco?.KeyMod?.MetaS ?? 2048,
    () => {
      saveCurrentFile()
    }
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(editor as { addCommand: (keyCode: number, handler: () => void) => void }).addCommand(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).monaco?.KeyMod?.CtrlS ?? 2048,
    () => {
      saveCurrentFile()
    }
  )
}

function handleEditorChange(value: string | undefined) {
  fileContent.value = value ?? ''
  isDirty.value = fileContent.value !== '' // simplified dirty check
}

onMounted(async () => {
  // Init file tree
  if (projectStore.projectPath) {
    await fileTreeStore.initTree(projectStore.projectPath)
    // Start watching .planning directory
    const planningPath = `${projectStore.projectPath}/.planning`
    const exists = await window.electronAPI.exists(planningPath)
    if (exists.success && exists.data) {
      window.electronAPI.watchDir(planningPath)
    }
  }

  // Subscribe to file changes
  unsubscribeFileChange = window.electronAPI.onFileChanged(handleFileChanged)
})

onUnmounted(() => {
  if (unsubscribeFileChange) unsubscribeFileChange()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="documents-view">
    <div class="documents-header">
      <h2>📄 Documents</h2>
      <NSpace v-if="activeFilePath">
        <NButton size="small" :type="previewMode ? 'primary' : 'default'" @click="previewMode = false">
          编辑
        </NButton>
        <NButton size="small" :type="previewMode ? 'default' : 'primary'" @click="previewMode = true">
          预览
        </NButton>
        <NButton size="small" :disabled="!isDirty" @click="saveCurrentFile">
          💾 保存
        </NButton>
      </NSpace>
    </div>

    <div class="documents-content">
      <!-- File Tree -->
      <FileTree />

      <!-- Content Area -->
      <div class="content-area">
        <NCard v-if="!activeFilePath" class="empty-state" content-style="display:flex;align-items:center;justify-content:center;">
          <div class="empty-content">
            <span class="empty-icon">📝</span>
            <NText depth="3">从左侧文件树选择一个 Markdown 文件</NText>
          </div>
        </NCard>

        <NSpin v-else-if="isLoadingFile" class="loading-spinner" />

        <template v-else>
          <!-- Dirty indicator -->
          <div v-if="isDirty" class="dirty-bar">
            <span>● 有未保存的更改</span>
            <NButton size="tiny" @click="saveCurrentFile">保存</NButton>
          </div>

          <!-- Preview mode -->
          <div v-if="previewMode" class="preview-container">
            <MarkdownPreview :content="fileContent" />
          </div>

          <!-- Edit mode with Monaco -->
          <div v-else class="editor-container">
            <VueMonacoEditor
              ref="monacoRef"
              v-model:value="fileContent"
              :options="{
                language: 'markdown',
                theme: 'vs-dark',
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 }
              }"
              @mount="handleEditorMount"
              @change="handleEditorChange"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.documents-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.documents-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.documents-header h2 {
  margin: 0;
  color: #e0e0e0;
  font-size: 18px;
}

.documents-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  height: 100%;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
}

.loading-spinner {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dirty-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: rgba(255, 167, 38, 0.12);
  border-bottom: 1px solid rgba(255, 167, 38, 0.2);
  color: #ffa726;
  font-size: 12px;
  flex-shrink: 0;
}

.preview-container {
  flex: 1;
  overflow-y: auto;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}
</style>

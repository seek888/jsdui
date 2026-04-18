<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { install } from '@guolao/vue-monaco-editor'

const props = defineProps<{
  filePath: string | null
  content: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:content': [value: string]
  save: []
  'content-changed': [value: string]
}>()

const editorContent = ref(props.content)
const isDirty = ref(false)
const originalContent = ref(props.content)
const isReadonly = computed(() => props.readonly ?? false)

// Track if content was changed externally
watch(
  () => props.content,
  (newContent) => {
    if (newContent !== editorContent.value) {
      editorContent.value = newContent
      originalContent.value = newContent
      isDirty.value = false
    }
  }
)

watch(
  () => props.filePath,
  () => {
    isDirty.value = false
  }
)

function handleMount(editor: unknown) {
  // Install custom dark theme
  ;(editor as { _themeService: { setTheme: (t: string) => void } })._themeService?.setTheme('jsdui-dark')
}

function handleChange(value: string | undefined) {
  const newVal = value ?? ''
  editorContent.value = newVal
  isDirty.value = newVal !== originalContent.value
  emit('content-changed', newVal)
}

function handleSave() {
  if (!isReadonly.value && isDirty.value) {
    emit('update:content', editorContent.value)
    originalContent.value = editorContent.value
    isDirty.value = false
    emit('save')
  }
}

// Expose save method
defineExpose({
  save: handleSave,
  isDirty,
  setContent: (content: string) => {
    editorContent.value = content
    originalContent.value = content
    isDirty.value = false
  }
})

// Keyboard shortcut: Cmd+S / Ctrl+S
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  // Install monaco editor
  try {
    install()
  } catch {
    // ignore if already installed
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="monaco-editor-wrapper">
    <div class="editor-toolbar">
      <span v-if="filePath" class="file-path">{{ filePath?.split('/').pop() }}</span>
      <span v-if="isDirty" class="dirty-indicator" title="未保存的更改">●</span>
      <button
        class="save-btn"
        :disabled="!isDirty || isReadonly"
        @click="handleSave"
        title="保存 (Cmd+S)"
      >
        💾 保存
      </button>
    </div>
    <div class="editor-body">
      <slot name="editor">
        <!-- Placeholder for external editor slot -->
        <div class="editor-placeholder">
          <span>选择文件以编辑</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.monaco-editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 36px;
}

.file-path {
  font-size: 12px;
  color: #90a4ae;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dirty-indicator {
  color: #ffa726;
  font-size: 10px;
  flex-shrink: 0;
}

.save-btn {
  background: rgba(79, 195, 247, 0.15);
  border: 1px solid rgba(79, 195, 247, 0.3);
  color: #4fc3f7;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.save-btn:hover:not(:disabled) {
  background: rgba(79, 195, 247, 0.25);
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-body {
  flex: 1;
  overflow: hidden;
}

.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #546e7a;
  font-size: 14px;
}
</style>

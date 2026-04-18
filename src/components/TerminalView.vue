<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { ClipboardAddon } from '@xterm/addon-clipboard'
import '@xterm/xterm/css/xterm.css'

interface Props {
  outputLines?: Array<{ id: number; type: string; text: string }>
  isRunning?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  outputLines: () => [],
  isRunning: false
})

const terminalRef = ref<HTMLDivElement | null>(null)
const showScrollBtn = ref(false)
const userScrolled = ref(false)

let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let clipboardAddon: ClipboardAddon | null = null

onMounted(() => {
  if (!terminalRef.value) return

  terminal = new Terminal({
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#aeafad',
      black: '#1e1e1e',
      brightBlack: '#545454',
      red: '#f44747',
      brightRed: '#f44747',
      green: '#608b4e',
      brightGreen: '#89d185',
      yellow: '#dcdcaa',
      brightYellow: '#d7ba7d',
      blue: '#569cd6',
      brightBlue: '#9cdcfe',
      magenta: '#c586c0',
      brightMagenta: '#c586c0',
      cyan: '#4ec9b0',
      brightCyan: '#4ec9b0',
      white: '#d4d4d4',
      brightWhite: '#ffffff'
    },
    fontSize: 13,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    cursorBlink: true,
    cursorStyle: 'bar',
    scrollback: 10000,
    convertEol: true
  })

  fitAddon = new FitAddon()
  clipboardAddon = new ClipboardAddon()

  terminal.loadAddon(fitAddon)
  terminal.loadAddon(clipboardAddon)

  terminal.open(terminalRef.value)
  fitAddon.fit()

  // Detect user scroll
  if (terminalRef.value) {
    const scroller = terminalRef.value.querySelector('.xterm-scroll-area')
    if (scroller) {
      scroller.addEventListener('scroll', () => {
        if (!terminal) return
        const maxScroll = scroller.scrollHeight - scroller.clientHeight
        const atBottom = maxScroll - scroller.scrollTop < 50
        userScrolled.value = !atBottom
        showScrollBtn.value = userScrolled.value && props.outputLines.length > 0
      })
    }
  }

  // Initial resize handler
  const resizeObserver = new ResizeObserver(() => {
    if (fitAddon) fitAddon.fit()
  })
  if (terminalRef.value) {
    resizeObserver.observe(terminalRef.value)
  }
})

// Watch for new output lines
watch(
  () => props.outputLines.length,
  async () => {
    if (!terminal) return

    await nextTick()

    // Only auto-scroll if user hasn't manually scrolled up
    if (!userScrolled.value && fitAddon) {
      fitAddon.fit()
      terminal.scrollToBottom()
    }

    // Check if should show scroll button
    if (userScrolled.value) {
      showScrollBtn.value = true
    }
  }
)

function scrollToBottom() {
  if (terminal) {
    terminal.scrollToBottom()
    userScrolled.value = false
    showScrollBtn.value = false
  }
}

// Expose scrollToBottom for parent
defineExpose({ scrollToBottom })

onUnmounted(() => {
  if (terminal) {
    terminal.dispose()
    terminal = null
  }
})
</script>

<template>
  <div class="terminal-wrapper">
    <div ref="terminalRef" class="terminal-container"></div>

    <!-- Scroll to bottom button -->
    <transition name="fade">
      <button
        v-if="showScrollBtn"
        class="scroll-btn"
        @click="scrollToBottom"
        title="Scroll to bottom"
      >
        ↓ Bottom
      </button>
    </transition>

    <!-- Running indicator -->
    <div v-if="isRunning" class="running-indicator">
      <span class="dot"></span> Running...
    </div>
  </div>
</template>

<style scoped>
.terminal-wrapper {
  position: relative;
  height: 100%;
  min-height: 300px;
}

.terminal-container {
  height: 100%;
  background: #1e1e1e;
  border-radius: 6px;
  padding: 8px;
}

.scroll-btn {
  position: absolute;
  bottom: 60px;
  right: 24px;
  background: rgba(79, 195, 247, 0.9);
  color: #000;
  border: none;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.scroll-btn:hover {
  background: rgba(79, 195, 247, 1);
}

.running-indicator {
  position: absolute;
  top: 8px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4fc3f7;
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #4fc3f7;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

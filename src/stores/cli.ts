import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface GsdCommand {
  id: string
  label: string
  description: string
  icon: string
  args: string[]
  status: 'idle' | 'running' | 'success' | 'failure'
  commandId?: string
}

export interface OutputLine {
  id: number
  type: 'stdout' | 'stderr' | 'system'
  text: string
  timestamp: Date
}

export const useCliStore = defineStore('cli', () => {
  // State
  const currentCommandId = ref<string | null>(null)
  const isRunning = ref(false)
  const lastExitCode = ref<number | null>(null)
  const outputBuffer = ref<OutputLine[]>([])
  const outputHistory = ref<Map<string, OutputLine[]>>(new Map())
  const lineCounter = ref(0)

  // GSD Commands definitions
  const commands = ref<GsdCommand[]>([
    {
      id: 'plan-phase',
      label: 'Plan Phase',
      description: 'Analyze project and create execution plan',
      icon: '📋',
      args: ['plan-phase'],
      status: 'idle'
    },
    {
      id: 'execute-phase',
      label: 'Execute Phase',
      description: 'Execute planned tasks',
      icon: '🚀',
      args: ['execute-phase'],
      status: 'idle'
    },
    {
      id: 'verify-work',
      label: 'Verify Work',
      description: 'Verify task completion and quality',
      icon: '✅',
      args: ['verify-work'],
      status: 'idle'
    },
    {
      id: 'generate-spec',
      label: 'Generate Spec',
      description: 'Generate project specification',
      icon: '📝',
      args: ['generate-spec'],
      status: 'idle'
    },
    {
      id: 'create-tests',
      label: 'Create Tests',
      description: 'Generate test cases',
      icon: '🧪',
      args: ['create-tests'],
      status: 'idle'
    },
    {
      id: 'refactor',
      label: 'Refactor',
      description: 'Refactor code structure',
      icon: '🔧',
      args: ['refactor'],
      status: 'idle'
    }
  ])

  // Getters
  const activeCommand = computed(() =>
    commands.value.find((c) => c.id === currentCommandId.value)
  )
  const currentOutput = computed(() => outputBuffer.value)

  // Actions
  function appendOutput(
    type: 'stdout' | 'stderr' | 'system',
    text: string
  ) {
    const lines = text.split('\n')
    for (const line of lines) {
      if (line || type === 'system') {
        outputBuffer.value.push({
          id: lineCounter.value++,
          type,
          text: line,
          timestamp: new Date()
        })
      }
    }
  }

  function clearOutput() {
    outputBuffer.value = []
  }

  async function executeCommand(cmd: GsdCommand) {
    if (isRunning.value) return

    // Reset command status
    cmd.status = 'running'
    currentCommandId.value = cmd.id
    isRunning.value = true
    lastExitCode.value = null
    clearOutput()

    appendOutput('system', `[CMD] Starting: ${cmd.label}`)
    appendOutput('system', `[CMD] gsd ${cmd.args.join(' ')}`)

    try {
      const result = await window.electronAPI.executeGsdTool(cmd.args)
      if (result.success) {
        cmd.status = 'success'
        appendOutput('system', `[CMD] ${cmd.label} completed successfully`)
      } else {
        cmd.status = 'failure'
        appendOutput('stderr', `[CMD] Error: ${result.error || 'Unknown error'}`)
      }
    } catch (err) {
      cmd.status = 'failure'
      appendOutput('stderr', `[CMD] Exception: ${String(err)}`)
    } finally {
      isRunning.value = false
    }
  }

  async function cancelCommand(cmd: GsdCommand) {
    if (!cmd.commandId || !isRunning.value) return

    try {
      await window.electronAPI.killCommand(cmd.commandId)
      appendOutput('system', `[CMD] Cancelled: ${cmd.label}`)
    } catch (err) {
      appendOutput('stderr', `[CMD] Failed to cancel: ${String(err)}`)
    }

    cmd.status = 'failure'
    isRunning.value = false
    currentCommandId.value = null
  }

  // Set up output listeners
  function initListeners() {
    window.electronAPI.onCommandOutput((data) => {
      appendOutput(data.type, data.data)
    })

    window.electronAPI.onCommandExit((data) => {
      lastExitCode.value = data.code
      const cmd = commands.value.find((c) => c.commandId === data.commandId)
      if (cmd) {
        if (data.code === 0) {
          cmd.status = 'success'
          appendOutput('system', `[CMD] Exit code: 0`)
        } else {
          cmd.status = 'failure'
          appendOutput('system', `[CMD] Exit code: ${data.code ?? 'signal'}`)
        }
      }
      if (currentCommandId.value === cmd?.id) {
        isRunning.value = false
        currentCommandId.value = null
      }
    })
  }

  return {
    commands,
    currentCommandId,
    isRunning,
    lastExitCode,
    outputBuffer,
    outputHistory,
    activeCommand,
    currentOutput,
    appendOutput,
    clearOutput,
    executeCommand,
    cancelCommand,
    initListeners
  }
})

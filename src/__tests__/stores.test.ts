import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { useCliStore } from '@/stores/cli'

// Mock global electronAPI
const mockElectronAPI = {
  checkNodeVersion: vi.fn(),
  checkClaudeVersion: vi.fn(),
  executeGsdTool: vi.fn(),
  killCommand: vi.fn(),
  onCommandOutput: vi.fn(),
  onCommandExit: vi.fn(),
}

// @ts-ignore
global.electronAPI = mockElectronAPI

describe('Project Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should have default state', () => {
    const store = useProjectStore()
    expect(store.projectPath).toBe(null)
    expect(store.projectName).toBe(null)
    expect(store.nodeVersion).toBe(null)
    expect(store.nodeStatus).toBe('idle')
    expect(store.claudeVersion).toBe(null)
    expect(store.claudeStatus).toBe('idle')
  })

  it('should check node version successfully', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkNodeVersion.mockResolvedValue({ success: true, data: 'v20.10.0' })

    await store.checkNode()
    
    expect(store.nodeStatus).toBe('installed')
    expect(store.nodeVersion).toBe('v20.10.0')
  })

  it('should handle node version check failure', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkNodeVersion.mockResolvedValue({ success: false, error: 'Not found' })

    await store.checkNode()
    
    expect(store.nodeStatus).toBe('missing')
    expect(store.nodeVersion).toBe(null)
  })

  it('should check claude version successfully', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkClaudeVersion.mockResolvedValue({ success: true, data: '1.0.0' })

    await store.checkClaude()
    
    expect(store.claudeStatus).toBe('installed')
    expect(store.claudeVersion).toBe('1.0.0')
  })

  it('should handle claude version check failure', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkClaudeVersion.mockResolvedValue({ success: false, error: 'Not found' })

    await store.checkClaude()
    
    expect(store.claudeStatus).toBe('missing')
    expect(store.claudeVersion).toBe(null)
  })

  it('should open project and check tools', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkNodeVersion.mockResolvedValue({ success: true, data: 'v20.10.0' })
    mockElectronAPI.checkClaudeVersion.mockResolvedValue({ success: true, data: '1.0.0' })

    await store.openProject('/test/project')

    expect(store.projectPath).toBe('/test/project')
    expect(store.projectName).toBe('project')
    expect(store.nodeStatus).toBe('installed')
    expect(store.claudeStatus).toBe('installed')
  })

  it('should close project and reset state', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkNodeVersion.mockResolvedValue({ success: true, data: 'v20.10.0' })
    mockElectronAPI.checkClaudeVersion.mockResolvedValue({ success: true, data: '1.0.0' })

    await store.openProject('/test/project')
    store.closeProject()

    expect(store.projectPath).toBe(null)
    expect(store.projectName).toBe(null)
    expect(store.nodeStatus).toBe('idle')
    expect(store.claudeStatus).toBe('idle')
  })

  it('should compute isProjectOpen correctly', () => {
    const store = useProjectStore()
    expect(store.isProjectOpen).toBe(false)
    
    store.projectPath = '/test/path'
    expect(store.isProjectOpen).toBe(true)
  })

  it('should compute isReady when both tools are installed', async () => {
    const store = useProjectStore()
    mockElectronAPI.checkNodeVersion.mockResolvedValue({ success: true, data: 'v20.10.0' })
    mockElectronAPI.checkClaudeVersion.mockResolvedValue({ success: true, data: '1.0.0' })

    await store.openProject('/test/project')

    expect(store.isReady).toBe(true)
  })
})

describe('CLI Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should have 6 default commands', () => {
    const store = useCliStore()
    expect(store.commands.length).toBe(6)
  })

  it('should have correct command definitions', () => {
    const store = useCliStore()
    
    const commandIds = store.commands.map(c => c.id)
    expect(commandIds).toContain('plan-phase')
    expect(commandIds).toContain('execute-phase')
    expect(commandIds).toContain('verify-work')
    expect(commandIds).toContain('generate-spec')
    expect(commandIds).toContain('create-tests')
    expect(commandIds).toContain('refactor')
  })

  it('should have idle status by default', () => {
    const store = useCliStore()
    expect(store.isRunning).toBe(false)
    expect(store.currentCommandId).toBe(null)
  })

  it('should append output correctly', () => {
    const store = useCliStore()
    store.appendOutput('stdout', 'Hello World')
    
    expect(store.outputBuffer.length).toBeGreaterThan(0)
    expect(store.currentOutput.some((o: any) => o.text === 'Hello World')).toBe(true)
  })

  it('should clear output', () => {
    const store = useCliStore()
    store.appendOutput('stdout', 'Hello')
    store.appendOutput('stdout', 'World')
    store.clearOutput()
    
    expect(store.outputBuffer.length).toBe(0)
  })

  it('should execute command successfully', async () => {
    const store = useCliStore()
    mockElectronAPI.executeGsdTool.mockResolvedValue({ success: true })

    const cmd = store.commands[0]
    await store.executeCommand(cmd)

    expect(cmd.status).toBe('success')
    expect(store.isRunning).toBe(false)
  })

  it('should handle command failure', async () => {
    const store = useCliStore()
    mockElectronAPI.executeGsdTool.mockResolvedValue({ success: false, error: 'Test error' })

    const cmd = store.commands[0]
    await store.executeCommand(cmd)

    expect(cmd.status).toBe('failure')
    expect(store.isRunning).toBe(false)
  })

  it('should not execute while already running', async () => {
    const store = useCliStore()
    mockElectronAPI.executeGsdTool.mockImplementation(() => new Promise(r => setTimeout(r, 100)))

    const cmd = store.commands[0]
    const promise = store.executeCommand(cmd)
    
    // Try to execute another command while running
    const cmd2 = store.commands[1]
    await store.executeCommand(cmd2)

    expect(store.currentCommandId).toBe(cmd.id)
    expect(cmd2.status).toBe('idle')

    await promise
  })
})

import { contextBridge, ipcRenderer } from 'electron'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtime: number
  ctime: number
}

export interface FileChangeInfo {
  event: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  isDirectory: boolean
}

export interface CommandOutput {
  commandId: string
  type: 'stdout' | 'stderr'
  data: string
}

export interface CommandExit {
  commandId: string
  code: number | null
  signal: string | null
}

export interface IpcResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface AppError {
  type: 'cli-not-found' | 'file-permission' | 'process-terminated' | 'unknown'
  message: string
  detail?: string
}

export interface ElectronAPI {
  // File operations
  readFile(path: string): Promise<IpcResult<string>>
  writeFile(path: string, content: string): Promise<IpcResult>
  readDir(path: string): Promise<IpcResult<FileInfo[]>>
  exists(path: string): Promise<IpcResult<boolean>>

  // Directory watching
  watchDir(path: string): Promise<IpcResult>
  unwatchDir(path: string): Promise<IpcResult>
  onFileChanged(callback: (info: FileChangeInfo) => void): () => void

  // Command execution
  spawnCommand(cmd: string, args: string[]): Promise<IpcResult<string>>
  killCommand(commandId: string): Promise<IpcResult>
  onCommandOutput(callback: (data: CommandOutput) => void): () => void
  onCommandExit(callback: (data: CommandExit) => void): () => void

  // GSD tools
  executeGsdTool(args: string[]): Promise<IpcResult<string>>
  checkNodeVersion(): Promise<IpcResult<string | null>>
  checkClaudeVersion(): Promise<IpcResult<string | null>>

  // Settings
  getSetting<T>(key: string): Promise<IpcResult<T | null>>
  setSetting<T>(key: string, value: T): Promise<IpcResult>

  // System
  getPlatform(): Promise<IpcResult<NodeJS.Platform>>
  openExternal(url: string): Promise<IpcResult>
  showItemInFolder(path: string): Promise<IpcResult>

  // App errors
  onAppError(callback: (error: AppError) => void): () => void

  // Shortcuts (from main process)
  onShortcutToggleSidebar(callback: () => void): () => void
  onShortcutNavigate(callback: (path: string) => void): () => void
}

// ─── API Implementation ──────────────────────────────────────────────────────

const electronAPI: ElectronAPI = {
  // File operations
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
  readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
  exists: (path) => ipcRenderer.invoke('fs:exists', path),

  // Directory watching
  watchDir: (path) => ipcRenderer.invoke('watch:watchDir', path),
  unwatchDir: (path) => ipcRenderer.invoke('watch:unwatchDir', path),
  onFileChanged: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, info: FileChangeInfo) => callback(info)
    ipcRenderer.on('file-changed', handler)
    return () => ipcRenderer.removeListener('file-changed', handler)
  },

  // Command execution
  spawnCommand: (cmd, args) => ipcRenderer.invoke('cmd:spawn', cmd, args),
  killCommand: (commandId) => ipcRenderer.invoke('cmd:kill', commandId),
  onCommandOutput: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, data: CommandOutput) => callback(data)
    ipcRenderer.on('command-output', handler)
    return () => ipcRenderer.removeListener('command-output', handler)
  },
  onCommandExit: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, data: CommandExit) => callback(data)
    ipcRenderer.on('command-exit', handler)
    return () => ipcRenderer.removeListener('command-exit', handler)
  },

  // GSD tools
  executeGsdTool: (args) => ipcRenderer.invoke('gsd:execute', args),
  checkNodeVersion: () => ipcRenderer.invoke('gsd:checkNode'),
  checkClaudeVersion: () => ipcRenderer.invoke('gsd:checkClaude'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // System
  getPlatform: () => ipcRenderer.invoke('system:getPlatform'),
  openExternal: (url) => ipcRenderer.invoke('system:openExternal', url),
  showItemInFolder: (path) => ipcRenderer.invoke('system:showItemInFolder', path),

  // App errors
  onAppError: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, error: AppError) => callback(error)
    ipcRenderer.on('app:error', handler)
    return () => ipcRenderer.removeListener('app:error', handler)
  },

  // Shortcuts (from main process)
  onShortcutToggleSidebar: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('shortcut:toggle-sidebar', handler)
    return () => ipcRenderer.removeListener('shortcut:toggle-sidebar', handler)
  },
  onShortcutNavigate: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, path: string) => callback(path)
    ipcRenderer.on('shortcut:navigate', handler)
    return () => ipcRenderer.removeListener('shortcut:navigate', handler)
  }
}

// ─── Expose ──────────────────────────────────────────────────────────────────

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error('Failed to expose electronAPI:', error)
  }
} else {
  // @ts-ignore
  window.electronAPI = electronAPI
}

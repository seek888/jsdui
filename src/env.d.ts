/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// ─── Preload API types (mirror of electron/preload/index.ts) ─────────────────

interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtime: number
  ctime: number
}

interface FileChangeInfo {
  event: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  isDirectory: boolean
}

interface CommandOutput {
  commandId: string
  type: 'stdout' | 'stderr'
  data: string
}

interface CommandExit {
  commandId: string
  code: number | null
  signal: string | null
}

interface IpcResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface AppError {
  type: 'cli-not-found' | 'file-permission' | 'process-terminated' | 'unknown'
  message: string
  detail?: string
}

interface ElectronAPI {
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

interface Window {
  electronAPI: ElectronAPI
  api: { ping: () => Promise<string> }
}

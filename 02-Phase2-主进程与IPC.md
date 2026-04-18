# Phase 2: 主进程与 IPC 通信

## 目标

实现 Electron 主进程、预加载脚本、IPC 通信机制，建立稳定的主进程-渲染进程交互基础。

## 前置依赖

Phase 1（项目脚手架）

## 任务清单

### 2.1 主进程基础

- [ ] 创建主进程入口 `electron/main/index.ts`
- [ ] 配置 BrowserWindow 创建逻辑
- [ ] 配置应用生命周期管理（ready、window-all-closed、activate）
- [ ] 配置窗口安全选项（contextIsolation、nodeIntegration: false）
- [ ] 配置 preload 脚本路径

### 2.2 Preload 脚本

- [ ] 创建预加载脚本 `electron/preload/index.ts`
- [ ] 使用 contextBridge 暴露安全的 API
- [ ] 暴露 IPC invoke 方法（read-file、write-file、spawn-command 等）
- [ ] 暴露 IPC on 监听方法（command-output、file-changed 等）
- [ ] 类型化 API 接口

### 2.3 IPC 处理函数

- [ ] 创建 IPC 处理函数注册表 `electron/main/ipc.ts`
- [ ] 实现文件读取处理（read-file）
- [ ] 实现文件写入处理（write-file）
- [ ] 实现目录读取处理（read-dir）
- [ ] 实现目录监听处理（watch-dir）
- [ ] 实现命令执行处理（spawn-command）
- [ ] 实现 electron-store 操作处理

### 2.4 错误处理机制

- [ ] 配置全局错误捕获（主进程 uncaughtException）
- [ ] 配置 promise  rejection 捕获
- [ ] 配置 electron-log 日志系统
- [ ] 实现错误日志记录
- [ ] 实现渲染进程错误转发

### 2.5 安全配置

- [ ] 配置 contextIsolation: true
- [ ] 配置 nodeIntegration: false
- [ ] 配置 sandbox: true
- [ ] 配置 Content Security Policy (CSP)
- [ ] 配置 webSecurity: true
- [ ] 实现 IPC 输入验证

## 成功标准

1. 渲染进程可通过 `window.electronAPI` 调用主进程方法
2. 文件读写 IPC 调用正常返回
3. 主进程错误被正确捕获和记录
4. preload 脚本安全隔离生效

## 预计工作量

- 任务数: 5
- 复杂度: 中

## IPC API 设计

```typescript
// 暴露给渲染进程的 API
interface ElectronAPI {
  // ========== 文件操作 ==========
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  readDir(path: string): Promise<FileInfo[]>
  exists(path: string): Promise<boolean>
  
  // ========== 目录监听 ==========
  watchDir(path: string): Promise<void>
  unwatchDir(path: string): Promise<void>
  onFileChanged(callback: (info: FileChangeInfo) => void): void
  
  // ========== 命令执行 ==========
  spawnCommand(cmd: string, args: string[]): Promise<string>  // 返回 commandId
  killCommand(commandId: string): Promise<void>
  getCommandStatus(commandId: string): Promise<CommandStatus>
  
  // 命令输出订阅（stdout/stderr 分开）
  onCommandOutput(callback: (data: CommandOutput) => void): void
  onCommandExit(callback: (data: CommandExit) => void): void
  
  // ========== GSD 工具 ==========
  executeGsdTool(args: string[]): Promise<string>  // 返回 JSON 输出
  checkNodeVersion(): Promise<string | null>
  checkClaudeVersion(): Promise<string | null>
  
  // ========== 设置 ==========
  getSetting<T>(key: string): Promise<T | null>
  setSetting<T>(key: string, value: T): Promise<void>
  getAllSettings(): Promise<Settings>
  
  // ========== 系统 ==========
  getPlatform(): 'darwin' | 'win32' | 'linux'
  openExternal(url: string): Promise<void>
  showItemInFolder(path: string): Promise<void>
}

// 类型定义
interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtime: number
}

interface FileChangeInfo {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
}

interface CommandStatus {
  id: string
  running: boolean
  startTime: number
}

interface CommandOutput {
  commandId: string
  type: 'stdout' | 'stderr'
  data: string
  timestamp: number
}

interface CommandExit {
  commandId: string
  code: number | null
  signal: string | null
}

interface Settings {
  projectPath: string | null
  sidebarCollapsed: boolean
  activeView: string
  // ... 可扩展
}
```

## 错误处理设计

```typescript
// 主进程错误分类
enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_PERMISSION_DENIED = 'FILE_PERMISSION_DENIED',
  COMMAND_NOT_FOUND = 'COMMAND_NOT_FOUND',
  COMMAND_KILL_FAILED = 'COMMAND_KILL_FAILED',
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  CLAUDE_NOT_FOUND = 'CLAUDE_NOT_FOUND',
  WATCH_DIR_FAILED = 'WATCH_DIR_FAILED',
}

// 错误响应格式
interface ElectronError {
  code: ErrorCode
  message: string
  details?: unknown
}
```

import { ipcMain, shell, app } from 'electron'
import { promises as fs, Stats } from 'fs'
import { join, resolve, isAbsolute } from 'path'
import { spawn, ChildProcess } from 'child_process'
import chokidar, { FSWatcher } from 'chokidar'
import { execFile } from 'child_process'
import { store } from './store'
import log from 'electron-log/main.js'

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

export type AppErrorType = 'cli-not-found' | 'file-permission' | 'process-terminated' | 'unknown'

export interface AppError {
  type: AppErrorType
  message: string
  detail?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classifyError(error: unknown): { type: AppErrorType; message: string; detail?: string } {
  const msg = String(error)

  if (msg.includes('ENOENT') || msg.includes('command not found') || msg.includes('spawn enoent')) {
    return { type: 'cli-not-found', message: 'CLI tool not found', detail: msg }
  }
  if (msg.includes('EACCES') || msg.includes('EPERM') || msg.includes('permission denied')) {
    return { type: 'file-permission', message: 'Permission denied', detail: msg }
  }
  if (msg.includes('SIGTERM') || msg.includes('killed') || msg.includes('ESRCH')) {
    return { type: 'process-terminated', message: 'Process was terminated', detail: msg }
  }
  return { type: 'unknown', message: msg }
}

function broadcastError(
  sender: Electron.IpcRendererEvent['sender'],
  error: unknown,
  context?: string
) {
  const classified = classifyError(error)
  if (context) {
    classified.detail = `[${context}] ${classified.detail || classified.message}`
  }
  sender.send('app:error', classified)
  log.error('Broadcast error:', classified)
}

// ─── Command management ──────────────────────────────────────────────────────

const runningCommands = new Map<string, ChildProcess>()

// ─── Directory watchers ─────────────────────────────────────────────────────

const watchers = new Map<string, FSWatcher>()

// ─── Path validation ─────────────────────────────────────────────────────────

function validatePath(path: string): string {
  const resolved = isAbsolute(path) ? path : resolve(process.cwd(), path)
  if (resolved.includes('..')) {
    throw new Error('Invalid path: path traversal not allowed')
  }
  return resolved
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function setupIpcHandlers(): void {
  // Ping
  ipcMain.handle('ping', () => 'pong')

  // ── File operations ────────────────────────────────────────────────────────

  ipcMain.handle('fs:readFile', async (event, path: string) => {
    try {
      const validPath = validatePath(path)
      const content = await fs.readFile(validPath, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      log.error('fs:readFile error:', error)
      broadcastError(event.sender, error, `readFile(${path})`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('fs:writeFile', async (event, path: string, content: string) => {
    try {
      const validPath = validatePath(path)
      await fs.writeFile(validPath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      log.error('fs:writeFile error:', error)
      broadcastError(event.sender, error, `writeFile(${path})`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('fs:readDir', async (event, dirPath: string) => {
    try {
      const validPath = validatePath(dirPath)
      const entries = await fs.readdir(validPath, { withFileTypes: true })
      const results: FileInfo[] = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(validPath, entry.name)
          let stat: Stats
          try {
            stat = await fs.stat(fullPath)
          } catch {
            return {
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              size: 0,
              mtime: 0,
              ctime: 0
            }
          }
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stat.size,
            mtime: stat.mtimeMs,
            ctime: stat.ctimeMs
          }
        })
      )
      return { success: true, data: results }
    } catch (error) {
      log.error('fs:readDir error:', error)
      broadcastError(event.sender, error, `readDir(${dirPath})`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('fs:exists', async (_, path: string) => {
    try {
      const validPath = validatePath(path)
      await fs.access(validPath)
      return { success: true, data: true }
    } catch {
      return { success: true, data: false }
    }
  })

  // ── Directory watching ─────────────────────────────────────────────────────

  ipcMain.handle('watch:watchDir', async (event, dirPath: string) => {
    try {
      const validPath = validatePath(dirPath)
      if (watchers.has(validPath)) {
        return { success: true, data: 'already watching' }
      }

      const watcher = chokidar.watch(validPath, {
        persistent: true,
        ignoreInitial: true,
        ignored: /(^|[\/\\])\../,
        depth: 1
      })

      watcher.on('all', (eventName, path) => {
        const changeInfo: FileChangeInfo = {
          event: eventName as FileChangeInfo['event'],
          path,
          isDirectory: eventName === 'addDir' || eventName === 'unlinkDir'
        }
        event.sender.send('file-changed', changeInfo)
      })

      await new Promise<void>((resolve) => {
        watcher.on('ready', () => resolve())
        watcher.on('error', () => resolve())
      })
      watchers.set(validPath, watcher)
      return { success: true }
    } catch (error) {
      log.error('watch:watchDir error:', error)
      broadcastError(event.sender, error, `watchDir(${dirPath})`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('watch:unwatchDir', async (_, dirPath: string) => {
    try {
      const validPath = validatePath(dirPath)
      const watcher = watchers.get(validPath)
      if (watcher) {
        await watcher.close()
        watchers.delete(validPath)
      }
      return { success: true }
    } catch (error) {
      log.error('watch:unwatchDir error:', error)
      return { success: false, error: String(error) }
    }
  })

  // ── Command execution ──────────────────────────────────────────────────────

  ipcMain.handle('cmd:spawn', async (event, cmd: string, args: string[]) => {
    const commandId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    try {
      if (!cmd || typeof cmd !== 'string') {
        return { success: false, error: 'Invalid command' }
      }

      const child = spawn(cmd, args, {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      runningCommands.set(commandId, child)

      child.stdout?.on('data', (data: Buffer) => {
        const output: CommandOutput = {
          commandId,
          type: 'stdout',
          data: data.toString()
        }
        event.sender.send('command-output', output)
      })

      child.stderr?.on('data', (data: Buffer) => {
        const output: CommandOutput = {
          commandId,
          type: 'stderr',
          data: data.toString()
        }
        event.sender.send('command-output', output)
      })

      child.on('exit', (code, signal) => {
        const exitInfo: CommandExit = {
          commandId,
          code,
          signal
        }
        event.sender.send('command-exit', exitInfo)
        runningCommands.delete(commandId)
      })

      child.on('error', (err) => {
        log.error(`Command ${commandId} error:`, err)
        broadcastError(event.sender, err, `cmd:spawn(${cmd})`)
        event.sender.send('command-exit', {
          commandId,
          code: -1,
          signal: null
        })
        runningCommands.delete(commandId)
      })

      return { success: true, data: commandId }
    } catch (error) {
      log.error('cmd:spawn error:', error)
      broadcastError(event.sender, error, `cmd:spawn(${cmd})`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('cmd:kill', async (_, commandId: string) => {
    try {
      const child = runningCommands.get(commandId)
      if (child) {
        child.kill('SIGTERM')
        runningCommands.delete(commandId)
      }
      return { success: true }
    } catch (error) {
      log.error('cmd:kill error:', error)
      return { success: false, error: String(error) }
    }
  })

  // ── GSD tools ──────────────────────────────────────────────────────────────

  ipcMain.handle('gsd:execute', async (event, args: string[]) => {
    try {
      const gsdPath = join(app.getAppPath(), 'gsd-tools.cjs')
      return new Promise((resolve) => {
        execFile('node', [gsdPath, ...args], { shell: false }, (error, stdout, stderr) => {
          if (error) {
            broadcastError(event.sender, error, `gsd:execute(${args.join(' ')})`)
            resolve({ success: false, error: stderr || error.message })
          } else {
            resolve({ success: true, data: stdout })
          }
        })
      })
    } catch (error) {
      log.error('gsd:execute error:', error)
      broadcastError(event.sender, error, `gsd:execute`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('gsd:checkNode', async () => {
    return new Promise((resolve) => {
      execFile('node', ['--version'], { shell: false }, (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message })
        } else {
          resolve({ success: true, data: stdout.trim() })
        }
      })
    })
  })

  ipcMain.handle('gsd:checkClaude', async () => {
    return new Promise((resolve) => {
      execFile('which', ['claude'], { shell: false }, (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve({ success: true, data: null })
        } else {
          execFile('claude', ['--version'], { shell: false }, (err2, ver) => {
            if (err2) {
              resolve({ success: true, data: null })
            } else {
              resolve({ success: true, data: ver.trim() })
            }
          })
        }
      })
    })
  })

  // ── Settings ───────────────────────────────────────────────────────────────

  ipcMain.handle('settings:get', async (_, key: string) => {
    try {
      if (typeof key !== 'string' || key.includes('..')) {
        return { success: false, error: 'Invalid key' }
      }
      const value = store.get(key) ?? null
      return { success: true, data: value }
    } catch (error) {
      log.error('settings:get error:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('settings:set', async (_, key: string, value: unknown) => {
    try {
      if (typeof key !== 'string' || key.includes('..')) {
        return { success: false, error: 'Invalid key' }
      }
      store.set(key, value)
      return { success: true }
    } catch (error) {
      log.error('settings:set error:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('settings:getAll', async () => {
    try {
      return { success: true, data: store.store }
    } catch (error) {
      log.error('settings:getAll error:', error)
      return { success: false, error: String(error) }
    }
  })

  // ── System ──────────────────────────────────────────────────────────────────

  ipcMain.handle('system:getPlatform', () => {
    return { success: true, data: process.platform }
  })

  ipcMain.handle('system:openExternal', async (_, url: string) => {
    try {
      if (!url || typeof url !== 'string' || !url.match(/^https?:\/\//)) {
        return { success: false, error: 'Invalid URL protocol' }
      }
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      log.error('system:openExternal error:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('system:showItemInFolder', async (_, path: string) => {
    try {
      const validPath = validatePath(path)
      shell.showItemInFolder(validPath)
      return { success: true }
    } catch (error) {
      log.error('system:showItemInFolder error:', error)
      return { success: false, error: String(error) }
    }
  })

  // ── App info ───────────────────────────────────────────────────────────────

  ipcMain.handle('app:getVersion', () => {
    return { success: true, data: app.getVersion() }
  })
}

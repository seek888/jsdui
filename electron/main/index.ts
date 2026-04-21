import { app, BrowserWindow, shell, ipcMain, session, globalShortcut } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'
import { existsSync } from 'fs'
import log from 'electron-log/main.js'
import { setupIpcHandlers } from './ipc'
import { store } from './store'
import { setupAutoUpdater, checkForUpdates, downloadUpdate, installUpdate } from './autoUpdater'

// Initialize electron-log
log.initialize()
log.info('Application starting...')

// Global exception handlers
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
  broadcastError('unknown', `Uncaught Exception: ${error.message}`, error.stack)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
  broadcastError('unknown', `Unhandled Rejection: ${reason}`)
})

// ─── Error broadcasting ──────────────────────────────────────────────────────

function broadcastError(
  type: 'cli-not-found' | 'file-permission' | 'process-terminated' | 'unknown',
  message: string,
  detail?: string
) {
  const allWindows = BrowserWindow.getAllWindows()
  for (const win of allWindows) {
    win.webContents.send('app:error', { type, message, detail })
  }
}

export { broadcastError }

// ─── Window management ───────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Restore saved window bounds
  const bounds = store.get('windowBounds', { width: 1200, height: 800 }) as {
    width: number
    height: number
    x?: number
    y?: number
  }

  const preloadMjs = join(__dirname, '../preload/index.mjs')
  const preloadJs = join(__dirname, '../preload/index.js')

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 600,
    minHeight: 400,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      // Prefer ESM preload output and keep a compatibility fallback.
      preload: existsSync(preloadMjs) ? preloadMjs : preloadJs,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // CSP configuration
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'"
        ]
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('windowBounds', bounds)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Register global shortcuts once window is ready
  registerGlobalShortcuts(mainWindow)
}

// ─── Global Shortcuts ────────────────────────────────────────────────────────

function registerGlobalShortcuts(win: BrowserWindow) {
  const isMac = process.platform === 'darwin'

  // Cmd/Ctrl+B - Toggle sidebar (IPC to renderer)
  globalShortcut.register(isMac ? 'Cmd+B' : 'Ctrl+B', () => {
    win.webContents.send('shortcut:toggle-sidebar')
  })

  // Cmd/Ctrl+1 - Dashboard
  globalShortcut.register(isMac ? 'Cmd+1' : 'Ctrl+1', () => {
    win.webContents.send('shortcut:navigate', '/main/dashboard')
  })

  // Cmd/Ctrl+2 - Documents
  globalShortcut.register(isMac ? 'Cmd+2' : 'Ctrl+2', () => {
    win.webContents.send('shortcut:navigate', '/main/documents')
  })

  // Cmd/Ctrl+3 - Terminal
  globalShortcut.register(isMac ? 'Cmd+3' : 'Ctrl+3', () => {
    win.webContents.send('shortcut:navigate', '/main/terminal')
  })

  // Cmd/Ctrl+4 - Settings
  globalShortcut.register(isMac ? 'Cmd+4' : 'Ctrl+4', () => {
    win.webContents.send('shortcut:navigate', '/main/settings')
  })

  // Cmd/Ctrl+, - Settings (macOS standard)
  globalShortcut.register(isMac ? 'Cmd+,' : 'Ctrl+,', () => {
    win.webContents.send('shortcut:navigate', '/main/settings')
  })

  log.info('Global shortcuts registered')
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.jsdui.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()

  // Auto-updater setup (commented out - requires GitHub Releases configured)
  // setupAutoUpdater()
  // checkForUpdates()

  // Update IPC handlers
  ipcMain.handle('update:check', async () => {
    await checkForUpdates()
    return { success: true }
  })
  ipcMain.handle('update:download', async () => {
    await downloadUpdate()
    return { success: true }
  })
  ipcMain.handle('update:install', () => {
    installUpdate()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'

// Configure auto-updater logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

// Disable auto-download - let user decide
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function getAllWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows()
}

export function setupAutoUpdater(): void {
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)
    for (const win of getAllWindows()) {
      win.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate
      })
    }
  })

  autoUpdater.on('update-not-available', () => {
    log.info('No updates available')
  })

  autoUpdater.on('download-progress', (progress) => {
    log.info(`Download progress: ${progress.percent.toFixed(1)}%`)
    for (const win of getAllWindows()) {
      win.webContents.send('update:progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total
      })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)
    for (const win of getAllWindows()) {
      win.webContents.send('update:downloaded', {
        version: info.version
      })
    }
  })

  autoUpdater.on('error', (error) => {
    log.error('Auto-updater error:', error)
  })
}

export async function checkForUpdates(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    log.error('Failed to check for updates:', error)
  }
}

export async function downloadUpdate(): Promise<void> {
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    log.error('Failed to download update:', error)
  }
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}

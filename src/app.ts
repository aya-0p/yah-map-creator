import { BrowserWindow, app, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import runEditor from './editor'
import stream from 'stream'
const logs = new stream.Duplex({
  write: (_c, _e, next) => next(),
  read: () => { }
})
export const log = (data: string) => {
  logs.push(Buffer.from(data))
}
export class CreateWindow {
  constructor() {
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'index.js')
      },
      autoHideMenuBar: true,
      title: "You are Hope Map Creator",
      icon: path.join(__dirname, "../res/icon.png")
    })
    this.window.on("closed", () => {
      if (this.editor?.isDestroyed() === false) return
      if (this.help?.isDestroyed() === false) this.help?.close()
      process.exit()
    })
  }
  showHelp() {
    if (this.help === undefined || this.help === null || this.help.isDestroyed()) {
      this.help = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        title: "You are Hope Map Creator - Help",
        webPreferences: {
          preload: path.join(__dirname, 'help.js')
        },
        icon: path.join(__dirname, "../res/icon.png")
      })
      this.help.loadFile(path.join(__dirname, "../res/help.html"))
    }
  }
  async startEditor() {
    this.editor = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'editor-page.js')
      },
      autoHideMenuBar: true,
      title: "You are Hope Map Creator - Editor",
      icon: path.join(__dirname, "../res/icon.png")
    })
    await this.editor.loadFile(path.join(__dirname, "../res/editor.html"))
    this.window.destroy()
    if (this.help?.isDestroyed() === false) this.help?.destroy()
  }
  openLog() {
    if (this.log === undefined || this.log.isDestroyed() === true)
    this.log = new BrowserWindow({
      width: 800,
      height: 600,
      title: "You are Hope Map Creator - Logs",
      webPreferences: {
        preload: path.join(__dirname, 'log-page.js')
      },
      icon: path.join(__dirname, "../res/icon.png")
    })
    this.log.loadFile(path.join(__dirname, "../res/log.html"))
  }
  window: BrowserWindow
  help: BrowserWindow | undefined
  editor: BrowserWindow | undefined
  log: BrowserWindow | undefined
}

app.whenReady().then(() => {
  const root = new CreateWindow()
  root.window.loadFile(path.join(__dirname, "../res/index.html"))
  ipcMain.handle('dialog:openPicFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(root.window, {
      title: "画像のあるフォルダを選択...",
      properties: [
        "openDirectory", "showHiddenFiles"
      ]
    })
    if (canceled) return
    return filePaths.at(0)
  })
  ipcMain.on("main:showHelp", async () => {
    log('event: main:showHelp')
    root.showHelp()
  })
  ipcMain.on('main:showRequestPage', (_, url: string) => {
    log('event: main:showRequestPage')
    shell.openExternal(url)
  })
  ipcMain.on("main:showError", async () => {
    log('event: main:showError')
    await dialog.showMessageBox(root.window, {
      title: "エラー",
      message: "入力不足の内容があります。",
      type: "warning"
    })
  })
  root.help?.webContents.on('will-navigate', (e, url) => {
    if (url.match(/^http/)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
  root.help?.webContents.on('new-window', (e, url) => {
    if (url.match(/^http/)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
  ipcMain.on('main:start', (_, device: string, distance: string, direction: string, dir: string) => {
    log('event: main:start')
    runEditor(device, distance, direction, dir, root)
  })
  logs.on('data', (data: Buffer) => {
    console.log(data.toString())
    root.log?.webContents.send('log', data.toString())
  })
  ipcMain.on("main:showLog", async () => {
    log('event: main:showLog')
    root.openLog()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

import {BrowserWindow, app, ipcMain, dialog, shell} from 'electron'
import path from 'path'
import runEditor from './editor'
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
    this.help.loadFile(path.join(__dirname, "../res/help.html"))}
  }
  async startEditor() {
    this.editor = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'editor-page.js')
      },
      autoHideMenuBar: true,
      title: "You are Hope Map Creator - editor",
      icon: path.join(__dirname, "../res/icon.png")
    })
    await this.editor.loadFile(path.join(__dirname, "../res/editor.html"))
    this.window.destroy()
    if (this.help?.isDestroyed() === false) this.help?.destroy()
  }
  window: BrowserWindow
  help: BrowserWindow | undefined
  editor: BrowserWindow | undefined
}

app.whenReady().then(() => {
  const root = new CreateWindow()
  root.window.loadFile(path.join(__dirname, "../res/index.html"))
  ipcMain.handle('dialog:openPicFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "画像のあるフォルダを選択...",
      properties: [
        "openDirectory","showHiddenFiles"
      ]
    })
    if (canceled) return
    return filePaths.at(0)
  })
  ipcMain.on("main:showHelp", async () => {
    root.showHelp()
  })
  ipcMain.on('main:showRequestPage', (_,url: string) => {
    shell.openExternal(url)
  })
  ipcMain.on("main:showError", async () => {
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
    runEditor(device, distance, direction, dir, root)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
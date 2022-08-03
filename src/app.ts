import {BrowserWindow, app, ipcMain, dialog} from 'electron'
import path from 'path'
import { makeImage } from './main'
import * as fs from 'fs-extra'
class CreateWindow {
  constructor() {
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'index.js')
      },
      autoHideMenuBar: true,
      title: "You are Hope Map Creator"
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
        }
      })
    this.help.loadFile(path.join(__dirname, "../res/help.html"))}
  }
  showRequestPage() {
    if (this.request === undefined || this.request === null || this.request.isDestroyed()) {
      this.request = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        title: "You are Hope Map Creator - Request",
        webPreferences: {
          preload: path.join(__dirname, 'request.js')
        }
      })
      this.request.loadFile(path.join(__dirname, "../res/request.html"))
    }
  }
  window: BrowserWindow
  help: BrowserWindow | undefined | null
  request: BrowserWindow | undefined | null
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
  ipcMain.handle('dialog:openCsvFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "csv ファイルを選択...",
      properties: [
        "showHiddenFiles", "openFile"
      ],
      filters: [
        { name: 'csv file', extensions: ['csv'] }
      ]
    })
    if (canceled) return
    return filePaths.at(0)
  })
  ipcMain.on('main:setSettings', async (_, type, dir, file) => {
    const settings = type
    const directory = decodeURI(dir)
    const csvFile = decodeURI(file)
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "画像を保存する場所を選択...",
      defaultPath: "output.png",
      filters: [
        { name: '画像', extensions: ['png'] }
      ]
    })
    if (canceled || !filePath) return
    const image = await makeImage(settings, csvFile, directory)
    if (image instanceof Buffer) {
      try {
        fs.writeFile(filePath, image)
        await dialog.showMessageBox({
          title: "完成",
          message: `画像を${filePath}に保存しました。`
        })
        root.window.close()
        root.help?.close()
        process.exit()
      } catch {
        await dialog.showMessageBox(root.window, {
          title: "エラー",
          message: "画像を保存中にエラーが発生しました。",
          type: "warning"
        })
      }
    } else {
      await dialog.showMessageBox(root.window, {
        title: "エラー",
        message: image,
        type: "warning"
      })
    }
  })
  ipcMain.on("main:showHelp", async () => {
    root.showHelp()
  })
  ipcMain.on("main:showRequestPage", async () => {
    root.showRequestPage()
  })
  ipcMain.on("main:showError", async () => {
    await dialog.showMessageBox(root.window, {
      title: "エラー",
      message: "入力不足の内容があります。",
      type: "warning"
    })
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
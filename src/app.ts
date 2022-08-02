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
  window: BrowserWindow
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
    return filePaths
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
    return filePaths
  })
  ipcMain.on('main:setSettings', async (_, type, dir, file) => {
    const settings = type
    const directory = dir
    const csvFile = file
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "画像を保存する場所を選択...",
      defaultPath: "output.png",
      filters: [
        { name: '画像', extensions: ['png'] }
      ]
    })
    if (canceled || !filePath) return
    const image = makeImage(settings, csvFile, directory)
     if (image instanceof Buffer) fs.writeFile(filePath, image)
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
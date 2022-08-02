
import { ipcRenderer, contextBridge } from 'electron'
contextBridge.exposeInMainWorld('electronAPI', {
  openPicFile: () => ipcRenderer.invoke('dialog:openPicFolder'),
  setSettings: (type: string, dir: string, file: string) => ipcRenderer.send('main:setSettings', type, dir, file),
  openCsvFile: () => ipcRenderer.invoke('dialog:openCsvFile')
})

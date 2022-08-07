import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openPicFile: () => ipcRenderer.invoke('dialog:openPicFolder'),
  setSettings: (device: string, distance: string, direction: string, dir: string, file: string) => ipcRenderer.send('main:setSettings', device, distance, direction, dir, file),
  openCsvFile: () => ipcRenderer.invoke('dialog:openCsvFile'),
  showHelp: () => ipcRenderer.send('main:showHelp'),
  showError: () => ipcRenderer.send('main:showError'),
  start: (device: string, distance: string, direction: string, dir: string) => ipcRenderer.send('main:start', device, distance, direction, dir)
})

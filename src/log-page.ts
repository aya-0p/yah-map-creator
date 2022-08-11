import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('log', {
  updateLog: (callback: any) => ipcRenderer.on('log', callback)
})
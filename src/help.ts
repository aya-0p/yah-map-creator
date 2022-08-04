import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  showRequestPage: (url: string) => ipcRenderer.send('main:showRequestPage', url)
})

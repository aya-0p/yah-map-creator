import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  showRequestPage: () => ipcRenderer.invoke('main:showRequestPage')
})

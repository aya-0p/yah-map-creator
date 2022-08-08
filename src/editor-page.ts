import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('editor', {
  up: () => ipcRenderer.send("key:up"),
  down: () => ipcRenderer.send("key:down"),
  left: () => ipcRenderer.send("key:left"),
  right: () => ipcRenderer.send("key:right"),
  enter: () => ipcRenderer.send("key:enter"),
  updateFunc: (callback: any) => ipcRenderer.on('editor:image', callback)
})

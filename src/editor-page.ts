import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('editor', {
  up: () => ipcRenderer.send("key:up"),
  shiftUp: () => ipcRenderer.send("key:shiftUp"),
  down: () => ipcRenderer.send("key:down"),
  left: () => ipcRenderer.send("key:left"),
  shiftLeft: () => ipcRenderer.send("key:shiftLeft"),
  right: () => ipcRenderer.send("key:right"),
  enter: () => ipcRenderer.send("key:enter"),
  updateFunc: (callback: any) => ipcRenderer.on('editor:image', callback),
  updateTitle: (callback: any) => ipcRenderer.on('editor:title', callback),
  back: () => ipcRenderer.send('key:back'),
  save: () => ipcRenderer.send('editor:save')
})

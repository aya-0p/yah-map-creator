import { ipcRenderer, contextBridge } from 'electron'
import { ImageDatas } from './types';

contextBridge.exposeInMainWorld('electron', {
  selectImg: () => ipcRenderer.send("images:loadImg"),
  selectDir: () => ipcRenderer.send("images:loadDir"),
  test: () => ipcRenderer.send("test"),
  update: (fn: Function) => ipcRenderer.on("update", (event, data: Array<ImageDatas>) => fn(data)),
  start: () => ipcRenderer.send("images:start"),
  setDefaultConfig: (configId: string) => ipcRenderer.send("images:setDefaultConfig", configId),
  setConfig: (configId: string, imagePath: string) => ipcRenderer.send("images:setConfig", configId, imagePath),
  getConfigs: () => ipcRenderer.invoke("images:getConfigs"),
  sort: (reverse: boolean) => ipcRenderer.send("images:sort", reverse),
});

import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("editor", {
  update: (fn: Function) => ipcRenderer.on("update", (event, currentImg: Buffer, nextImg: Buffer) => fn(currentImg, nextImg)),
  set: (imagePath: string, location: [number, number]) => ipcRenderer.send("main:set", imagePath, location),
  undo: () => ipcRenderer.send("main:undo"),
  end: () => ipcRenderer.send("main:end"),
  redo: () => ipcRenderer.send("main:redo"),
  selectRedos: (fn: (datas: Array<Buffer>) => number) => ipcRenderer.invoke("main:selectRedos", fn),
});

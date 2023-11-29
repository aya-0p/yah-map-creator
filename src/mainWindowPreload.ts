import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("editor", {
  update: (fn: Function) => ipcRenderer.on("update", (event, currentImg: Buffer, nextImg: Buffer) => fn(currentImg, nextImg)),
  set: (imagePath: string, location: [number, number]) => ipcRenderer.send("main:set", imagePath, location),
  back: () => ipcRenderer.send("main:back"),
  end: () => ipcRenderer.send("main:end"),
});

import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("editor", {
  up: () => ipcRenderer.send("key:up"), // 画像を1つ上に移動
  shiftUp: () => ipcRenderer.send("key:shiftUp"), // 画像を一番上に移動
  down: () => ipcRenderer.send("key:down"), // 画像を1つ下に移動
  left: () => ipcRenderer.send("key:left"), // 画像を1つ左に移動
  shiftLeft: () => ipcRenderer.send("key:shiftLeft"), // 画像を一番左に移動
  right: () => ipcRenderer.send("key:right"), // 画像を1つ右に移動
  enter: () => ipcRenderer.send("key:enter"), // 画像の位置を決定
  updateFunc: (callback: any) => ipcRenderer.on("editor:image", callback),
  updateTitle: (callback: any) => ipcRenderer.on("editor:title", callback),
  back: () => ipcRenderer.send("key:back"),
  save: () => ipcRenderer.send("editor:save"),
});

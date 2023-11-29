import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent, dialog, ipcMain } from "electron";
import { Image, ImageDatas, ProjectConfig, ProjectData } from "./types";
import fs from "fs-extra";
import path from "node:path";

export default async (config: ProjectConfig, images: Map<string, Image>, imagesWindow: BrowserWindow) => {
  const projectData: ProjectData = {
    images,
    editHistory: [],
    currentHistory: -1,
  };
  // debug
  config.mainWindow.webContents.openDevTools();
  imagesWindow.loadFile(path.join(__dirname, "../res/images2.html"));
  imagesWindow.webContents.openDevTools();
  // ---
  await new Promise<void>(async (resolve) => {
    const ipcMainEventListeners: Array<[string, (event: IpcMainEvent, ...args: any[]) => void]> = [];
    const ipcMainHandleListeners: Array<[string, (event: IpcMainInvokeEvent, ...args: any[]) => any]> = [];
    for (const [channel, listener] of ipcMainEventListeners) ipcMain.on(channel, listener);
    for (const [channel, listener] of ipcMainHandleListeners) ipcMain.handle(channel, listener);
    await new Promise<any>(async (resolve) => ipcMain.once("main:end", resolve));
    for (const [channel, listener] of ipcMainEventListeners) ipcMain.removeListener(channel, listener);
    for (const [channel, _] of ipcMainHandleListeners) ipcMain.removeHandler(channel);
  });
};

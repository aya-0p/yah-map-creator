import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent, dialog, ipcMain } from "electron";
import { Image, ImageDatas, ProjectConfig, ProjectData } from "./types";
import fs from "fs-extra";
import path from "node:path";
import { Collection } from "@discordjs/collection";

export default async (config: ProjectConfig, images: Collection<string, Image>, imagesWindow: BrowserWindow) => {
  const projectData: ProjectData = {
    images,
    editHistory: [],
    nextHistory: 0,
    nextImg: 0,
  };
  // debug
  config.mainWindow.webContents.openDevTools();
  imagesWindow.loadFile(path.join(__dirname, "../res/images2.html"));
  imagesWindow.webContents.openDevTools();
  // ---
  await new Promise<void>(async (resolve) => {
    function update() {
      let editHistory = projectData.editHistory.at(projectData.nextHistory - 1);
      if (!editHistory) {
        const nextImg = projectData.images.at(projectData.nextImg) as Image;
        editHistory = {
          imagesMap: new Map(),
          generatedThumb: nextImg.thumbImage as Buffer,
          editType: "set",
          editDesc: `画像 "${nextImg.filename}" を [0,0] に配置`,
        };
        editHistory.imagesMap.set(nextImg.filepath, [0, 0]);
        projectData.editHistory.push(editHistory);
        projectData.nextHistory++;
        projectData.nextImg++;
      }
      const thumb = editHistory.generatedThumb;
      const next = projectData.images.at(projectData.nextImg)?.selectImage ?? Buffer.alloc(0);
      config.mainWindow.webContents.send("update", thumb, next);

      const sendImgDatas: Array<ImageDatas> = [];
      let i = 0;
      for (const [_, image] of projectData.images) {
        sendImgDatas.push({
          path: image.filepath,
          name: image.filename,
          width: image.width,
          height: image.height,
          match: projectData.nextImg < i,
        });
      }
      imagesWindow.webContents.send("update", sendImgDatas);
    }
    const ipcMainEventListeners: Array<[string, (event: IpcMainEvent, ...args: any[]) => void]> = [];
    const ipcMainHandleListeners: Array<[string, (event: IpcMainInvokeEvent, ...args: any[]) => any]> = [];
    for (const [channel, listener] of ipcMainEventListeners) ipcMain.on(channel, listener);
    for (const [channel, listener] of ipcMainHandleListeners) ipcMain.handle(channel, listener);
    await new Promise<any>(async (resolve) => ipcMain.once("main:end", resolve));
    for (const [channel, listener] of ipcMainEventListeners) ipcMain.removeListener(channel, listener);
    for (const [channel, _] of ipcMainHandleListeners) ipcMain.removeHandler(channel);
  });
};

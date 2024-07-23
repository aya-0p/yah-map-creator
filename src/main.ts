import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent, dialog, ipcMain } from "electron";
import { EditHistoryController, Image, ImageConf, ImageDatas, ProjectConfig, ProjectData } from "./types";
import fs from "fs-extra";
import path from "node:path";
import { Collection } from "@discordjs/collection";

export default async (config: ProjectConfig, images: Collection<string, Image>, imagesWindow: BrowserWindow, baseConf: ImageConf) => {
  const projectData: ProjectData = {
    editHistory: new EditHistoryController(images, baseConf),
  };
  // debug
  config.mainWindow.webContents.openDevTools();
  imagesWindow.loadFile(path.join(__dirname, "../res/images2.html"));
  imagesWindow.webContents.openDevTools();
  // ---
  await new Promise<void>(async (resolve) => {
    function update(nextImagePath: string) {
      projectData.editHistory.currentHistory.thumb;
      const image = images.get(nextImagePath);
      if (!image) throw new Error("画像名と一致する画像が見つかりませんでした。");
      const {selectImage} = image;
      if (!selectImage) throw new Error("選択中の画像が生成されていません。");
    }
    const ipcMainEventListeners: Array<[string, (event: IpcMainEvent, ...args: any[]) => void]> = [
      [
        "main:set",
        async (event, imagePath: string, location: [number, number], nextImagePath: string) => {
          await projectData.editHistory.add(imagePath, location);
          update(nextImagePath);
        },
      ],
      [
        "main:undo",
        () => {
          projectData.editHistory.undo()
        }
      ],
      [
        "main:redo",
        () => {
          projectData.editHistory.redo()
        }
      ],
      [
        "main:selectRedos",
        (event, fn: (datas: Array<Buffer>) => Promise<number>) => {
          projectData.editHistory.otherRedos(async (images) => {
            const i: Array<Buffer> = [];
            for (const image of images) {
              i.push(image.thumb)
            }
            const index = await fn(i);
            const image = images.at(index);
            if (!image) throw new Error("画像名と一致する画像が見つかりませんでした。");
            return image;
          })
        }
      ]
    ];
    const ipcMainHandleListeners: Array<[string, (event: IpcMainInvokeEvent, ...args: any[]) => any]> = [];
    for (const [channel, listener] of ipcMainEventListeners) ipcMain.on(channel, listener);
    for (const [channel, listener] of ipcMainHandleListeners) ipcMain.handle(channel, listener);
    await new Promise<any>(async (resolve) => ipcMain.once("main:end", resolve));
    for (const [channel, listener] of ipcMainEventListeners) ipcMain.removeListener(channel, listener);
    for (const [channel, _] of ipcMainHandleListeners) ipcMain.removeHandler(channel);
  });
};

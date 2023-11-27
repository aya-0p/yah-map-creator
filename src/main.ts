import { BrowserWindow, dialog, ipcMain } from "electron";
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
  // ---
};

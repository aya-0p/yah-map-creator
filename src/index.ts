import { BrowserWindow, app, ipcMain } from "electron";
import os from "node:os";
import path from "node:path";
import initialize from "./initialize";
import { ImageConf, ProjectConfig, Settings } from "./types";
import { Duplex } from "node:stream";
import main from "./main";
import fs from "fs-extra";
// electron
app.on("ready", async ({ preventDefault, defaultPrevented }, launchInfo) => {
  // initialize
  const settings: Settings = fs.readJSONSync(path.join(__dirname, "../settings/config.json"));
  const config: ProjectConfig = {
    tempPath: path.join(os.tmpdir(), "map"),
    logStream: new Duplex({
      write: (_c, _e, next) => next(),
      read: () => {},
    }),
    log: console,
    mainWindow: new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "./mainWindowPreload.js"),
      },
      autoHideMenuBar: true,
      title: "You are Hope Map Creator",
      icon: path.join(__dirname, "../res/icon.png"),
    }),
    settings: settings,
    side: fs.readFileSync(path.join(__dirname, "../settings/", settings.side)),
    over: fs.readFileSync(path.join(__dirname, "../settings/", settings.over)),
    imageConfigDatas: new Map(),
    imageConfigs: new Map(),
  };
  config.log = new console.Console(config.logStream);
  for (const device of config.settings.devices) {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        const deviceId = `${device.file}_${i}_${j}`;
        config.imageConfigDatas.set(deviceId, new ImageConf(deviceId, path.join(__dirname, "../settings/", device[`img${i as 0 | 1}`]), j as 0 | 1 | 2));
        for (let deviceName of device.alias) {
          deviceName += `_${i}_${j}`;
          config.imageConfigs.set(deviceName, deviceId);
        }
      }
    }
  }
  config.mainWindow.loadFile(path.join(__dirname, "../res/main.html"));
  ipcMain.on("showHelp", () => {
    if (!config.helpWindow) {
      config.helpWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        title: "You are Hope Map Creator - Help",
        icon: path.join(__dirname, "../res/icon.png"),
      });
      config.helpWindow.once("closed", () => {
        config.helpWindow?.destroy();
        config.helpWindow = undefined;
      })
    }
    config.helpWindow.loadFile("");
  });

  // 利用する画像の選択など
  const [images, browserWindow] = await initialize(config);
  // 画像の編集
  main(config, images, browserWindow);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});



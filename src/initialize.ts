import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent, dialog, ipcMain } from "electron";
import { Image, ImageConf, ImageDatas, ProjectConfig } from "./types";
import fs from "fs-extra";
import path from "node:path";

export default async (config: ProjectConfig): Promise<[Map<string, Image>, BrowserWindow]> => {
  fs.rmdir(config.tempPath, (err) => {
    fs.mkdir(config.tempPath, (err) => {});
  });
  const imagesWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "./imagesWindowPreload.js"),
    },
    autoHideMenuBar: true,
    title: "You are Hope Map Creator - Images",
    icon: path.join(__dirname, "../res/icon.png"),
  });
  imagesWindow.loadFile(path.join(__dirname, "../res/images.html"));
  imagesWindow.webContents.openDevTools();

  /**
   * @key path
   */
  const imageList: Map<string, Image> = new Map();

  let baseConf: ImageConf | undefined = undefined;
  /**
   * 更新された画像一覧を送信
   */
  function update() {
    const images: Array<ImageDatas> = [];
    for (const [_, image] of imageList) {
      images.push({
        path: image.filepath,
        name: image.filename,
        configId: image.config?.id,
        width: image.width,
        height: image.height,
        match: image.isMatch(),
      })
    }
    imagesWindow.webContents.send("update", images);
  }
  const ipcMainEventListeners: Array<[string, (event: IpcMainEvent, ...args: any[]) => void]> = [
    /**
     * 画像の読み込み
     */
    [
      "images:loadImg",
      async () => {
        const { filePaths } = await dialog.showOpenDialog(imagesWindow, {
          title: "画像を選択...",
          properties: ["openFile", "multiSelections"],
        });
        for (const filePath of filePaths) {
          if ((await fs.stat(filePath)).isFile()) {
            const img = new Image(filePath, config, baseConf);
            imageList.set(img.filepath, img);
          }
        }
        update();
      }
    ],
    /**
     * 画像ディレクトリの読み込み
     */
    [
      "images:loadDir",
      async () => {
        const { filePaths } = await dialog.showOpenDialog(imagesWindow, {
          title: "画像のあるディレクトリを選択...",
          properties: ["openDirectory", "multiSelections"],
        });
        for (const filePath of filePaths) {
          const dir = await fs.readdir(filePath);
          for (const file of dir) {
            const pathToImg = path.join(filePath, file);
            if ((await fs.stat(pathToImg)).isFile()) {
              const img = new Image(path.join(filePath, file), config, baseConf);
              imageList.set(img.filepath, img);
            }
          }
        }
        update();
      }
    ],
    /**
     * test
     */
    [
      "test",
      () => {
        for (const [filepath, image] of imageList) {
          console.log(image.filename, image.width, image.height, image.filepath);
        }
      }
    ],
    /**
     * デフォルトの読み込み設定を変更
     */
    [
      "images:setDefaultConfig",
      (event, configId: string) => {
        const imageConfig = config.imageConfigDatas.get(config.imageConfigs.get(configId) ?? "");
        if (!imageConfig) return;
        baseConf = imageConfig;
        console.log(imageConfig.width, imageConfig.height)
        for (const [_, image] of imageList) {
          image.updateBaseConf(imageConfig);
          update()
        }
      }
    ],
    /**
     * 画像の読み込み設定を変更
     */
    [
      "images:setConfig",
      (event, configId: string, imagePaths: Array<string>) => {
        for (const imagePath of imagePaths) {
          const image = imageList.get(imagePath);
          const imageConfig = config.imageConfigDatas.get(config.imageConfigs.get(configId) ?? "");
          if (!image || !imageConfig) continue;
          image.setConf(imageConfig);
        }
        update()
      }
    ],
    [
      "images:sort",
      (event, reverse: boolean) => {
        const temp = [...imageList.values()].sort((a, b) => {
          const temp = [a.filename, b.filename].sort();
          if (reverse === (temp[0] === b.filename)) return -1;
          else return 1;
        })
        imageList.clear()
        for (const img of temp) {
          imageList.set(img.filepath, img);
        }
        update()
      }
    ],
    [
      "image:remove",
      (event, images: Array<string>) => {
        for (const image of images) {
          imageList.delete(image);
        }
        update();
      }
    ]
  ];
  const ipcMainHandleListeners: Array<[string, (event: IpcMainInvokeEvent, ...args: any[]) => any]> = [
    /**
     * 画像読み込み設定一覧を取得
     */
    [
      "images:getConfigs",
      (event) => {
        return [...config.imageConfigs.keys()];
      }
    ],
  ];

  for (const [channel, listener] of ipcMainEventListeners) ipcMain.on(channel, listener);
  for (const [channel, listener] of ipcMainHandleListeners) ipcMain.handle(channel, listener);
  await new Promise<any>(async (resolve) => ipcMain.once("images:start", resolve));
  for (const [channel, listener] of ipcMainEventListeners) ipcMain.removeListener(channel, listener);
  for (const [channel, _] of ipcMainHandleListeners) ipcMain.removeHandler(channel);
  return [imageList, imagesWindow];
};

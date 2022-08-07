import { dialog } from "electron";
import * as fs from 'fs-extra'
import path from 'path'
import sharp from "sharp";
import type { CreateWindow } from "./app";
import { fileSort } from "./build";

import { tmpRoot, deviceInfo, ViewInfo } from "./main";
export default async (device: string, distance: string, direction: string, dir: string, root: CreateWindow) => {
  async function errorOccured(error: string) {
    await dialog.showMessageBox(root.window, {
      title: "エラー",
      message: error,
      type: "warning"
    })
  }
  const rootThis: RootThis = {}
  rootThis.deviceInfo = deviceInfo.get(`${device}_${distance}_${direction}`)
  if (rootThis.deviceInfo === undefined) return await errorOccured("Device not found")
  try { rootThis.delImg = await fs.readFile(path.join(__dirname, `../settings/${`${device}_${direction}`}.png`)) } catch(_) { return "Delete image not found." }
  try { rootThis.pictureFiles = (await fs.readdir(dir)).sort(fileSort) } catch (_) { return await errorOccured("Directory not found.") }
  if (rootThis.pictureFiles.length === 0) return await errorOccured("Picture not found")
  try {fs.mkdir(path.join(tmpRoot, 'editedImages'))} catch(_) {}
  try { fs.mkdir(path.join(tmpRoot, 'reducedImages')) } catch (_) { }
  for (const image of rootThis.pictureFiles) {
    await sharp(path.join(dir, image))
      .composite([{
        input: rootThis.delImg,
        blend: 'dest-out'
      }])
      .png()
      .toFile(path.join(tmpRoot, `editedImages/${image}`))
    await sharp(path.join(tmpRoot, `editedImages/${image}`))
      .resize(360)
      .png()
      .toFile(path.join(tmpRoot, `reducedImages/${image}`))
  }
}
interface RootThis {
  pictureFiles?: Array<string>;
  deviceInfo?: ViewInfo;
  delImg?: Buffer;
}

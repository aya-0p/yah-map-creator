import { Collection } from "@discordjs/collection";
import { dialog, ipcMain } from "electron";
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
  const rootThis: RootThis = {
    imagePlace: new Collection()
  }
  rootThis.deviceInfo = deviceInfo.get(`${device}_${distance}_${direction}`)
  if (rootThis.deviceInfo === undefined) return await errorOccured("Device not found")
  try { rootThis.delImg = await fs.readFile(path.join(__dirname, `../settings/${`${device}_${direction}`}.png`)) } catch (_) { return "Delete image not found." }
  try { rootThis.pictureFiles = (await fs.readdir(dir)).sort(fileSort) } catch (_) { return await errorOccured("Directory not found.") }
  if (rootThis.pictureFiles.length === 0) return await errorOccured("Picture not found")
  try { fs.mkdir(path.join(tmpRoot, 'editedImages')) } catch (_) { }
  try { fs.mkdir(path.join(tmpRoot, 'reducedImages')) } catch (_) { }
  for (const image of rootThis.pictureFiles) {
    await sharp(path.join(dir, image))
      .ensureAlpha()
      .composite([{
        input: rootThis.delImg,
        blend: 'dest-out'
      }])
      .png()
      .toFile(path.join(tmpRoot, `editedImages/${image}`))
    await sharp(path.join(tmpRoot, `editedImages/${image}`))
      .png()
      .toFile(path.join(tmpRoot, `reducedImages/${image}`))
  }
  await root.startEditor()
  //main
  for (const image of rootThis.pictureFiles) {
    if (!rootThis.tempImage) {
      rootThis.tempImage = await fs.readFile(path.join(tmpRoot, `reducedImages/${image}`))
      rootThis.imagePlace.set(image, { x: 0, y: 0 })
      root.editor?.webContents.send("editor:image", rootThis.tempImage)
    } else {
      const { newX, newY }: { newX: number, newY: number } = await new Promise((resolve) => {
        const newImagePlace = { x: 0, y: 0 }
        const updateImage = async () => {
          const t_img = await sharp(rootThis.tempImage)
            .composite([{
              input: path.join(tmpRoot, `reducedImages/${image}`),
              top: newImagePlace.y * (rootThis.deviceInfo?.block ?? 0),
              left: newImagePlace.x * (rootThis.deviceInfo?.block ?? 0),
              blend: "over"
            }])
            .png()
            .toBuffer()
          root.editor?.webContents.send("editor:image", t_img)
        }
        const events = new Map([
          ["key:up", function up() {
            newImagePlace.y++
            updateImage()
          }],
          ["key:down", function down() {
            newImagePlace.y--
            updateImage()
          }],
          ["key:left", function left() {
            newImagePlace.x--
            updateImage()
          }],
          ["key:right", function right() {
            newImagePlace.x++
            updateImage()
          }]
        ])
        events.forEach((eventFunc, eventName) => {
          ipcMain.addListener(eventName, eventFunc)
        })

        ipcMain.once('key:enter', () => {
          events.forEach((eventFunc, eventName) => {
            ipcMain.removeListener(eventName, eventFunc)
          })
          resolve({
            newX: newImagePlace.x, newY: newImagePlace.y
          })
        })

      })

      rootThis.imagePlace.set(image, { x: newX, y: newY })
      //マップの最低値を0以上になるように移動させる
      let x_min = 0, y_min = 0;
      rootThis.imagePlace.forEach(place => {
        if (place.x < x_min) x_min = place.x
        if (place.y < y_min) y_min = place.y
      })
      rootThis.imagePlace.forEach((place, key) => {
        rootThis.imagePlace.set(key, { x: place.x - x_min, y: place.y - y_min })
      })
      //----
      let x_length = 0, y_length = 0
      rootThis.imagePlace.forEach(place => {
        if (place.x > x_length) x_length = place.x
        if (place.y > y_length) y_length = place.y
      })
      rootThis.tempImage = await sharp({
        create: {
          width: x_length * rootThis.deviceInfo.block + rootThis.deviceInfo.x,
          height: y_length * rootThis.deviceInfo.block + rootThis.deviceInfo.y,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{
          input: path.join(tmpRoot, `reducedImages/${image}`),
          top: (newY - y_min) * rootThis.deviceInfo?.block,
          left: (newX - x_min) * rootThis.deviceInfo?.block,
          blend: "over"
        }, {
          input: rootThis.tempImage,
          top: -y_min,
          left: -x_min,
          blend: "over"
          }])
        .png()
        .toBuffer()
    }
  }
}
interface RootThis {
  pictureFiles?: Array<string>;
  deviceInfo?: ViewInfo;
  delImg?: Buffer;
  imagePlace: Collection<string, { x: number, y: number }>;
  tempImage?: Buffer;
}

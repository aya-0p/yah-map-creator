import { Collection } from "@discordjs/collection";
import { dialog, ipcMain } from "electron";
import * as fs from 'fs-extra'
import path from 'path'
import sharp, { gravity, OverlayOptions } from "sharp";
import type { CreateWindow } from "./app";
import { fileSort } from "./build";

import { tmpRoot, deviceInfo, ViewInfo } from "./main";
export default async (device: string, distance: string, direction: string, dir: string, root: CreateWindow) => {
  function errorOccured(error: string) {
    dialog.showMessageBoxSync(root.window, {
      title: "エラー",
      message: error,
      type: "warning"
    })
  }
  const rootThis: RootThis = {
    imagePlace: new Collection()
  }
  rootThis.deviceInfo = deviceInfo.get(`${device}_${distance}_${direction}`)
  if (rootThis.deviceInfo === undefined) return errorOccured("Device not found")
  try { rootThis.delImg = await fs.readFile(path.join(__dirname, `../settings/${`${device}_${direction}`}.png`)) } catch (_) { return "Delete image not found." }
  try { rootThis.pictureFiles = (await fs.readdir(dir)).sort(fileSort) } catch (_) { return errorOccured("Directory not found.") }
  if (rootThis.pictureFiles.length === 0) return errorOccured("Picture not found")
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
  const lastImg = { x: 0, y: 0 }
  for (const image of rootThis.pictureFiles) {
    root.editor?.webContents.send("editor:title", `*${image}を編集中 - You are Hope Map creator - editor`)
    if (!rootThis.tempImage) {
      rootThis.tempImage = await fs.readFile(path.join(tmpRoot, `reducedImages/${image}`))
      rootThis.imagePlace.set(image, { x: 0, y: 0 })
      root.editor?.webContents.send("editor:image", rootThis.tempImage)
    } else {
      const { newX, newY }: { newX: number, newY: number } = await new Promise(async (resolve) => {
        let x_length = 0, y_length = 0
        rootThis.imagePlace.forEach(place => {
          if (place.x > x_length) x_length = place.x
          if (place.y > y_length) y_length = place.y
        })
        const newImagePlace = { x: lastImg.x + 1, y: lastImg.y + 1 }
        const updateImage = async () => {
          const t_img = await sharp({
            create: {
              width: Math.max(x_length, newImagePlace.x) * (rootThis.deviceInfo?.block ?? 0) + (rootThis.deviceInfo?.x ?? 0),
              height: Math.max(y_length, newImagePlace.y) * (rootThis.deviceInfo?.block ?? 0) + (rootThis.deviceInfo?.y ?? 0),
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
          })
            .composite([{
              input: rootThis.tempImage,
              top: 0,
              left: 0,
              blend: "over"
            }, {
              input: await sharp(path.join(tmpRoot, `reducedImages/${image}`))
                .composite([{
                  input: await sharp(path.join(__dirname, "../res/over.png"))
                    .resize(rootThis.deviceInfo?.x ?? 0, 10, { position: "north" })
                    .png()
                    .toBuffer(),
                  gravity: gravity.north,
                  blend: "over"
                }, {
                  input: await sharp(path.join(__dirname, "../res/over.png"))
                    .resize(rootThis.deviceInfo?.x ?? 0, 10, { position: "north" })
                    .png()
                    .toBuffer(),
                  gravity: gravity.south,
                  blend: "over"
                }, {
                  input: await sharp(path.join(__dirname, "../res/side.png"))
                    .resize(10, rootThis.deviceInfo?.y ?? 0, { position: "west" })
                    .png()
                    .toBuffer(),
                  gravity: gravity.west,
                  blend: "over"
                }, {
                  input: await sharp(path.join(__dirname, "../res/side.png"))
                    .resize(10, rootThis.deviceInfo?.y ?? 0, { position: "west" })
                    .png()
                    .toBuffer(),
                  gravity: gravity.east,
                  blend: "over"
                }])
                .png()
                .toBuffer(),
              top: newImagePlace.y * (rootThis.deviceInfo?.block ?? 0),
              left: newImagePlace.x * (rootThis.deviceInfo?.block ?? 0),
              blend: "over"
            }])
            .png()
            .toBuffer()
          root.editor?.webContents.send("editor:image", t_img)
        }
        await updateImage()
        const events = new Map([
          ["key:up", function up() {
            newImagePlace.y--
            updateImage()
          }],
          ["key:down", function down() {
            newImagePlace.y++
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
      lastImg.x = newX
      lastImg.y = newY
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
      const t_render = await sharp({
        create: {
          width: (x_length * rootThis.deviceInfo.block) + rootThis.deviceInfo.x,
          height: (y_length * rootThis.deviceInfo.block) + rootThis.deviceInfo.y,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{
          input: rootThis.tempImage,
          top: 0 - y_min,
          left: 0 - x_min,
          blend: "over"
        }, {
          input: path.join(tmpRoot, `reducedImages/${image}`),
          top: (newY - y_min) * rootThis.deviceInfo?.block,
          left: (newX - x_min) * rootThis.deviceInfo?.block,
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

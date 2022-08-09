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
  const rootThis: RootThis = {}
  const deviceInfomation = deviceInfo.get(`${device}_${distance}_${direction}`)
  if (deviceInfomation === undefined) return errorOccured("Device not found")
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
  const edit = { editing: true, history: new Collection<string, { x: number, y: number, image: Buffer }>(), nextEditPlace: { x: 1, y: 1 } }
  while (edit.editing === true) {
    const image = rootThis.pictureFiles[edit.history.size]
    if (image) {
      root.editor?.webContents.send("editor:title", `*${image}を編集中 - You are Hope Map creator - editor`)
      if (edit.history.size === 0) {
        edit.history.set(image, { x: 0, y: 0, image: await fs.readFile(path.join(tmpRoot, `reducedImages/${image}`)) })
        root.editor?.webContents.send("editor:image", edit.history.get(image)?.image)
      } else {
        const lastImage = edit.history.last()
        const { newX, newY, back }: { newX: number, newY: number, back: boolean } = await new Promise(async (resolve) => {
          const newImagePlace = { x: Number(edit.nextEditPlace.x), y: Number(edit.nextEditPlace.y) }
          let x_length = 0, y_length = 0
          edit.history.forEach(place => {
            if (place.x > x_length) x_length = place.x
            if (place.y > y_length) y_length = place.y
          })
          const updateImage = async () => {
            const t_img = await sharp({
              create: {
                width: Math.max(x_length, newImagePlace.x) * deviceInfomation.block + deviceInfomation.x,
                height: Math.max(y_length, newImagePlace.y) * deviceInfomation.block + deviceInfomation.y,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              }
            })
              .composite([{
                input: lastImage?.image as Buffer,
                top: 0,
                left: 0,
                blend: "over"
              }, {
                input: await sharp(path.join(tmpRoot, `reducedImages/${image}`))
                  .composite([{
                    input: await sharp(path.join(__dirname, "../res/over.png"))
                      .resize(deviceInfomation.x, 10, { position: "north" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.north,
                    blend: "over"
                  }, {
                    input: await sharp(path.join(__dirname, "../res/over.png"))
                      .resize(deviceInfomation.x, 10, { position: "north" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.south,
                    blend: "over"
                  }, {
                    input: await sharp(path.join(__dirname, "../res/side.png"))
                      .resize(10, deviceInfomation.y, { position: "west" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.west,
                    blend: "over"
                  }, {
                    input: await sharp(path.join(__dirname, "../res/side.png"))
                      .resize(10, deviceInfomation.y, { position: "west" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.east,
                    blend: "over"
                  }])
                  .png()
                  .toBuffer(),
                top: newImagePlace.y * deviceInfomation.block,
                left: newImagePlace.x * deviceInfomation.block,
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
            ["key:shiftLeft", function shiftLeft() {
              newImagePlace.x = 0
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
              newX: newImagePlace.x, newY: newImagePlace.y, back: false
            })
          })
          ipcMain.once('key:back', () => {
            events.forEach((eventFunc, eventName) => {
              ipcMain.removeListener(eventName, eventFunc)
            })
            resolve({
              newX: lastImage?.x as number, newY: lastImage?.y as number, back: true
            })
          })
        })
        if (back) {
          edit.nextEditPlace = { x: newX, y: newY }
          edit.history.delete(edit.history.lastKey() as string)
        } else {
          //マップの最低値を0以上になるように移動させる
          let x_min = 0, y_min = 0;
          edit.history.forEach(place => {
            if (place.x < x_min) x_min = place.x
            if (place.y < y_min) y_min = place.y
          })
          edit.history.forEach((place, key) => {
            edit.history.set(key, { x: place.x - Math.min(x_min, newX), y: place.y - Math.min(y_min, newY), image: place.image })
          })
          //----
          let x_length = 0, y_length = 0
          edit.history.forEach(place => {
            if (place.x > x_length) x_length = place.x
            if (place.y > y_length) y_length = place.y
          })
          const t_render = await sharp({
            create: {
              width: (Math.max(x_length, newX) * deviceInfomation.block) + deviceInfomation.x,
              height: (Math.max(y_length, newY) * deviceInfomation.block) + deviceInfomation.y,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
          })
            .composite([{
              input: lastImage?.image as Buffer,
              top: 0 - y_min,
              left: 0 - x_min,
              blend: "over"
            }, {
              input: path.join(tmpRoot, `reducedImages/${image}`),
              top: (newY - y_min) * deviceInfomation.block,
              left: (newX - x_min) * deviceInfomation.block,
              blend: "over"
            }])
            .png()
            .toBuffer()
          edit.history.set(image, { x: newX - x_min, y: newY - y_min, image: t_render })
          edit.nextEditPlace = { x: newX + 1, y: newY + 1 }
        }
      }
    }
    if (edit.history.size === rootThis.pictureFiles.length) edit.editing = false
  }
  const opt: Array<OverlayOptions> = []
  let x_length = 0, y_length = 0;
  for (const image of rootThis.pictureFiles) {
    const imgConfig = edit.history.get(image)
    if (imgConfig) {
      opt.push({
        input: path.join(tmpRoot, `reducedImages/${image}`),
        top: imgConfig.y * deviceInfomation.block,
        left: imgConfig.x * deviceInfomation.block,
        blend: "over"
      })
      if (x_length < imgConfig.x) x_length = imgConfig.x
      if (y_length < imgConfig.y) y_length = imgConfig.y
    }
  }
  const outputImage = await sharp({
    create: {
      width: x_length * deviceInfomation.block + deviceInfomation.x,
      height: y_length * deviceInfomation.block + deviceInfomation.y,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(opt)
    .png()
    .toBuffer()
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "画像を保存する場所を選択...",
    defaultPath: "output.png",
    filters: [
      { name: '画像', extensions: ['png'] }
    ]
  })
  root.editor?.webContents.send("editor:title", `完成 - You are Hope Map creator - editor`)
  if (canceled || !filePath) return
  fs.writeFileSync(filePath, outputImage)
}
interface RootThis {
  pictureFiles?: Array<string>;
  delImg?: Buffer;
}

import { Collection } from "@discordjs/collection";
import { BrowserWindow, dialog, Event, ipcMain } from "electron";
import * as fs from 'fs-extra'
import path from 'path'
import sharp, { gravity, OverlayOptions } from "sharp";
import type { CreateWindow } from "./app";
import { fileSort } from "./build";

import { tmpRoot, deviceInfo } from "./main";
export default async (device: string, distance: string, direction: string, dir: string, root: CreateWindow) => {
  let processError = false
  root.window.loadFile(path.join(__dirname, "../res/loading.html"))
  function errorOccured(error: string) {
    processError = true
    dialog.showMessageBoxSync(root.window, {
      title: "エラー",
      message: error,
      type: "warning"
    })
    root.window.loadFile(path.join(__dirname, "../res/index.html"))
  }
  const rootThis: RootThis = {}
  const deviceInfomation = deviceInfo.get(`${device}_${distance}_${direction}`)
  if (deviceInfomation === undefined) return errorOccured("選択された撮影条件での設定ファイルが見つかりませんでした。")
  try { rootThis.delImg = await fs.readFile(path.join(__dirname, `../settings/${`${device}_${direction}`}.png`)) } catch (_) { return errorOccured("選択された撮影条件での設定ファイルが見つかりませんでした。") }
  try { rootThis.pictureFiles = (await fs.readdir(dir)).sort(fileSort) } catch (_) { return errorOccured("画像フォルダが見つかりませんでした。") }
  if (rootThis.pictureFiles.length === 0) return errorOccured("画像フォルダ内に画像が見つかりませんでした。")
  try { await fs.mkdir(path.join(tmpRoot, 'editedImages')) } catch (_) { }
  try { await fs.mkdir(path.join(tmpRoot, 'thumbs')) } catch (_) { }
  try {
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
        .resize({
          width: Math.floor(deviceInfomation.x/16)*2,
          height: Math.floor(deviceInfomation.y/16)*2
        })
        .png()
        .toFile(path.join(tmpRoot, `thumbs/${image}`))
    }
  } catch (_) { return errorOccured("画像を処理できませんでした。正しくない端末を選んでいます。") }
  if (processError) return
  await root.startEditor()
  //main
  const edit = { editing: true, history: new Collection<string, { x: number, y: number, image: Buffer }>(), nextEditPlace: { x: 1, y: 1 } }
  while (edit.editing === true) {
    const onCloseFunc = (event: Event) => {
      const num = dialog.showMessageBoxSync(root.window, {
        title: "ウィンドウを閉じようとしています",
        message: "編集中です。このまま閉じますか？",
        type: "warning",
        buttons: ["編集を続ける", "閉じる"]
      })
      if (num === 0) event.preventDefault()
    }
    root.editor?.addListener('close', onCloseFunc)
    const image = rootThis.pictureFiles[edit.history.size]
    if (image) {
      root.editor?.webContents.send("editor:title", `*${image}を編集中 - You are Hope Map creator - editor`)
      if (edit.history.size === 0) {
        edit.history.set(image, { x: 0, y: 0, image: await fs.readFile(path.join(tmpRoot, `thumbs/${image}`)) })
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
            let blankX = x_length, blankY = y_length, adjustX = 0, adjustY = 0
            if (newImagePlace.x < 0) { blankX -= newImagePlace.x; adjustX = -newImagePlace.x}
            if (newImagePlace.y < 0) { blankY -= newImagePlace.y; adjustY = -newImagePlace.y }
            const t_img = await sharp({
              create: {
                width: Math.ceil((Math.max(blankX, newImagePlace.x) * deviceInfomation.block + deviceInfomation.x)/16)*2,
                height: Math.ceil((Math.max(blankY, newImagePlace.y) * deviceInfomation.block + deviceInfomation.y)/16)*2,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              }
            })
              .composite([{
                input: lastImage?.image as Buffer,
                top: Math.floor((adjustY * deviceInfomation.block)/16)*2,
                left: Math.floor((adjustX * deviceInfomation.block)/16)*2,
                blend: "over"
              }, {
                input: await sharp(path.join(tmpRoot, `thumbs/${image}`))
                  .composite([{
                    input: await sharp(path.join(__dirname, "../res/over.png"))
                      .resize(Math.floor(deviceInfomation.x/16)*2, 10, { position: "north" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.north,
                    blend: "over"
                  }, {
                    input: await sharp(path.join(__dirname, "../res/over.png"))
                      .resize(Math.floor(deviceInfomation.x/16)*2, 10, { position: "north" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.south,
                    blend: "over"
                  }, {
                    input: await sharp(path.join(__dirname, "../res/side.png"))
                      .resize(10, Math.floor(deviceInfomation.y/16)*2, { position: "west" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.west,
                    blend: "over"
                  }, {
                    input: await sharp(path.join(__dirname, "../res/side.png"))
                      .resize(10, Math.floor(deviceInfomation.y/16)*2, { position: "west" })
                      .png()
                      .toBuffer(),
                    gravity: gravity.east,
                    blend: "over"
                  }])
                  .png()
                  .toBuffer(),
                top: Math.floor(((newImagePlace.y + adjustY) * deviceInfomation.block)/16)*2,
                left: Math.floor(((newImagePlace.x + adjustX) * deviceInfomation.block)/16)*2,
                blend: "overlay"
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
          let x_length = 0, y_length = 0, adjustX = 0, adjustY = 0
          edit.history.forEach(place => {
            if (place.x > x_length) x_length = place.x
            if (place.y > y_length) y_length = place.y
          })
          if (newX < 0) {
            x_length -= newX
            adjustX = -newX
            edit.history.forEach((place, key) => {
              edit.history.set(key, { x: place.x + adjustX, y: place.y, image: place.image })
            })
          }
          if (newY < 0) {
            y_length -= newY
            adjustY = -newY
            edit.history.forEach((place, key) => {
              edit.history.set(key, { x: place.x, y: place.y + adjustY, image: place.image })
            })
          }
          const t_render = await sharp({
            create: {
              width: Math.ceil(((Math.max(x_length, newX) * deviceInfomation.block) + deviceInfomation.x)/16)*2,
              height: Math.ceil(((Math.max(y_length, newY) * deviceInfomation.block) + deviceInfomation.y)/16)*2,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
          })
            .composite([{
              input: lastImage?.image as Buffer,
              top: Math.floor((adjustY * deviceInfomation.block)/16)*2,
              left: Math.floor((adjustX * deviceInfomation.block)/16)*2,
              blend: "over"
            }, {
              input: path.join(tmpRoot, `thumbs/${image}`),
              top: Math.floor(((newY + adjustY) * deviceInfomation.block)/16)*2,
              left: Math.floor(((newX + adjustX) * deviceInfomation.block)/16)*2,
              blend: "over"
            }])
            .png()
            .toBuffer()
          edit.history.set(image, { x: newX + adjustX, y: newY + adjustY, image: t_render })
          edit.nextEditPlace = { x: newX + adjustX + 1, y: newY + adjustY + 1 }
        }
      }
    }
    if (edit.history.size === rootThis.pictureFiles.length) edit.editing = false
    root.editor?.removeListener('close', onCloseFunc)
  }
  root.editor?.webContents.send("editor:title", `画像生成中 - You are Hope Map creator - editor`)
  const opt: Array<OverlayOptions> = []
  let x_length = 0, y_length = 0;
  for (const image of rootThis.pictureFiles) {
    const imgConfig = edit.history.get(image)
    if (imgConfig) {
      opt.push({
        input: path.join(tmpRoot, `editedImages/${image}`),
        top: imgConfig.y * deviceInfomation.block,
        left: imgConfig.x * deviceInfomation.block,
        blend: "over"
      })
      if (x_length < imgConfig.x) x_length = imgConfig.x
      if (y_length < imgConfig.y) y_length = imgConfig.y
    }
  }
  const outputImage = sharp({
    create: {
      width: x_length * deviceInfomation.block + deviceInfomation.x,
      height: y_length * deviceInfomation.block + deviceInfomation.y,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(opt)
  const png = await outputImage.png().toBuffer()
  const jpeg = await outputImage.jpeg({ quality: 85 }).toBuffer()
  root.editor?.webContents.send("editor:image", png)
  root.editor?.webContents.send("editor:title", `完成 - You are Hope Map creator - editor`)
  const saveFunc = async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(root?.editor as BrowserWindow, {
      title: "画像を保存する場所を選択...",
      defaultPath: "output.png",
      filters: [
        { name: 'png形式 - 高画質(容量大)', extensions: ['png'] },
        { name: 'jpeg形式 - 中画質(容量小)', extensions: ['jpeg'] }
      ]
    })
    if (canceled || !filePath) {
      return
    }
    let imgBuffer: Buffer | undefined
    if (filePath.endsWith('png')) imgBuffer = png
    else if (filePath.endsWith('jpeg')) imgBuffer = jpeg
    else {
      errorOccured("正しい拡張子を入力してください。")
      saveFunc()
      return
    }
    fs.writeFileSync(filePath, imgBuffer)
  }
  fs.removeSync(tmpRoot)
  saveFunc()
  ipcMain.on('editor:save', () => {
    saveFunc()
  })
}
interface RootThis {
  pictureFiles?: Array<string>;
  delImg?: Buffer;
}

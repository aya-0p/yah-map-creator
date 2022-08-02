import * as fs from 'fs-extra'
import Sharp from 'sharp'
import path from 'path'
import { csv2Place, sortAndRename } from './build'

const getDeleteImage = (settings: ViewInfoWithoutImage): Promise<Buffer> => new Promise(resolve => {
  const black = {
    r: 0,
    g: 0,
    b: 0,
    alpha: 255
  }
  const img = Sharp({
    create: {
      width: settings.x,
      height: settings.y,
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0
      }
    }
  })
    .composite([
      {
        input: {
          create: {
            width: settings.x,
            height: settings.topBarBottomX,
            channels: 4,
            background: black
          }
        },
        top: 0,
        left: 0
      }, {
        input: {
          create: {
            width: settings.x - settings.animationAndKeyboard.x,
            height: settings.y - settings.animationAndKeyboard.y,
            channels: 4,
            background: black
          }
        },
        top: settings.animationAndKeyboard.y,
        left: settings.animationAndKeyboard.x
      }, {
        input: {
          create: {
            width: settings.dictionary.x,
            height: settings.y - settings.dictionary.y,
            channels: 4,
            background: black
          }
        },
        top: settings.dictionary.y,
        left: settings.dictionary.x
      }, {
        input: {
          create: {
            width: settings.player.end.x - settings.player.start.x,
            height: settings.player.end.y - settings.player.start.y,
            channels: 4,
            background: black
          }
        },
        top: settings.player.start.y,
        left: settings.player.start.x
      }
    ])
  for (const otherSettings of settings.other) {
    img.composite([{
      input: {
        create: {
          width: otherSettings.end.x - otherSettings.start.x,
          height: otherSettings.end.y - otherSettings.start.y,
          channels: 4,
          background: black
        }
      },
      top: otherSettings.start.y,
      left: otherSettings.start.x
    }])
  }
  img.png().toBuffer().then(buffer => {
    resolve(buffer)
  })
})
const deviceInfo: Map<string, ViewInfo> = new Map();
const setUp = (): void => {
  try { fs.rmdirSync(path.join(__dirname, "../tmp")) } catch { }
  fs.mkdirsSync(path.join(__dirname, "../tmp"))
  const allDeviceSettingFiles = fs.readdirSync(path.join(__dirname, "../settings"))
  for (const device of allDeviceSettingFiles) {
    const deviceName = device.split('.').at(0)
    if (deviceName && device.endsWith('.json') && device !== "schema.json") {
      const deviceSettings: DeviceInfo = fs.readJSONSync(path.join(__dirname, `../settings/${device}`))
      if (deviceSettings.Near !== undefined) {
        if (deviceSettings.Near[0]) deviceInfo.set(`${deviceName}_Near_0`, deviceSettings.Near[0])
        if (deviceSettings.Near[1]) deviceInfo.set(`${deviceName}_Near_1`, deviceSettings.Near[1])
      }
      if (deviceSettings.Medium !== undefined) {
        if (deviceSettings.Medium[0]) deviceInfo.set(`${deviceName}_Medium_0`, deviceSettings.Medium[0])
        if (deviceSettings.Medium[1]) deviceInfo.set(`${deviceName}_Medium_1`, deviceSettings.Medium[1])
      }
      if (deviceSettings.Far !== undefined) {
        if (deviceSettings.Far[0]) deviceInfo.set(`${deviceName}_Far_0`, deviceSettings.Far[0])
        if (deviceSettings.Far[1]) deviceInfo.set(`${deviceName}_Far_1`, deviceSettings.Far[1])
      }
    }
  }
}
const getMaxNum = (place: Array<Point>): { maxX: number, maxY: number } => {
  let x: number = 0, y: number = 0
  for (const point of place) {
    if (x < point.x) x = point.x
    if (y < point.y) y = point.y
  }
  return ({maxX: x, maxY: y})
}

export const makeImage = async (deviceCode: string, csvPath: string, imagesPath: string): Promise<Buffer|string> => {
  let delImg: Buffer | void
  const csvData = (await fs.readFile(csvPath)).toString()
  const place = csv2Place(csvData)
  const projectSettings = deviceInfo.get(deviceCode)
  const {maxX, maxY} = getMaxNum(place)
  if (projectSettings === undefined) return "unknown settings"
  if (projectSettings.image === false) {
    delImg = await getDeleteImage(projectSettings)
  } else {
    try { delImg = await fs.readFile(path.join(__dirname, `../settings/${deviceCode}.png`)) } catch {return "unknown settings"}
  }
  await fs.mkdirs(path.join(__dirname, '../tmp/img'))
  await fs.mkdirs(path.join(__dirname, '../tmp/img_'))
  const images = await sortAndRename(imagesPath)
  if (images.length !== place.length) return "missmatch pics and data"
  for (const image of images) {
    await Sharp(image)
      .composite([{
        input: delImg,
        blend: 'dest-out'
      }])
      .png()
      .toFile(path.join(__dirname, `../tmp/img/${image}`))
  }
  const outputImage = Sharp({
    create: {
      width: maxX * projectSettings.block + projectSettings.x,
      height: maxY * projectSettings.block + projectSettings.y,
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0
      }
    }
  })
  let index: number = 0
  const composits: Array<Sharp.OverlayOptions> = []
  for (const image of images) {
    composits.push({
      input: path.join(__dirname, `../tmp/img/${image}`),
      top: (place[index]?.y ?? 0) * projectSettings.block,
      left: (place[index]?.x ?? 0) * projectSettings.block,
      blend: "over"
    })
    index++
  }
  return await outputImage.composite(composits).png().toBuffer()
}
setUp()
/**点 */
export interface Point {
  /**上端からの距離 */
  x: number;
  /**左端からの距離 */
  y: number;
}
/**領域 */
interface Place {
  /**領域の左上 */
  start: Point;
  /**領域の右上 */
  end: Point;
}
/** ./settings/(device name).json */
type ViewInfo = ViewInfoWithoutImage | ViewInfoWithImage
/**画像無し */
interface ViewInfoWithoutImage {
  /**画像の横幅 */
  x: number;
  /**画像の縦の長さ */
  y: number;
  /**1ブロックのピクセル数 */
  block: number;
  /**上部にあるステータスバーの下端 */
  topBarBottomX: number;
  /**辞書(クラフトブック)の右上の点 */
  dictionary: Point;
  /**キーボードなどのアイコンの左上の点 */
  animationAndKeyboard: Point;
  /**プレイヤーの領域 */
  player: Place;
  /**その他の描画すべきでない領域 */
  other: Array<Place>;
  /**切り抜き用の画像があるかどうか */
  image: false;
}
/**画像あり */
interface ViewInfoWithImage {
  /**画像の横幅 */
  x: number;
  /**画像の縦の長さ */
  y: number;
  /**1ブロックのピクセル数 */
  block: number;
  /**上部にあるステータスバーの下端 */
  topBarBottomX?: number;
  /**辞書(クラフトブック)の右上の点 */
  dictionary?: Point;
  /**キーボードなどのアイコンの左上の点 */
  animationAndKeyboard?: Point;
  /**プレイヤーの領域 */
  player?: Place;
  /**その他の描画すべきでない領域 */
  other?: Array<Place>;
  /**切り抜き用の画像があるかどうか */
  image: true;
}
interface ViewInfos {
  /**向き設定が縦 */
  0?: ViewInfo;
  /**向き設定が横 */
  1?: ViewInfo;
}
interface DeviceInfo {
  /**表示が近く */
  Near?: ViewInfos;
  /**表示が中くらい */
  Medium?: ViewInfos;
  /**表示が遠く */
  Far?: ViewInfos;
}
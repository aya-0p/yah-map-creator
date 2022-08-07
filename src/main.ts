import * as fs from 'fs-extra'
import Sharp from 'sharp'
import path from 'path'
import { csv2Place, sortAndRename } from './build'
import os from 'os'
export const tmpRoot: string = path.join(os.tmpdir(), 'map')

export const deviceInfo: Map<string, ViewInfo> = new Map();
const setUp = (): void => {
  try { fs.rmdirSync(tmpRoot) } catch { }
  fs.mkdirsSync(tmpRoot)
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
  return ({ maxX: x, maxY: y })
}

export const makeImage = async (device: string, distance: string, direction: string, csvPath: string, imagesPath: string): Promise<Buffer | string> => {
  const deviceCode = `${device}_${distance}_${direction}`
  const fileName = `${device}_${direction}`
  const rootThis: rootThis = { composits: [] }
  try { rootThis.csvData = (await fs.readFile(csvPath)).toString() } catch { return "csvファイルが見つかりませんでした。" }
  try { rootThis.place = csv2Place(rootThis.csvData) } catch { return "csvファイルに問題があります。" }
  rootThis.projectSettings = deviceInfo.get(deviceCode)
  if (rootThis.projectSettings === undefined) return "選択された撮影条件での設定ファイルが見つかりませんでした。"
  try {
    const { maxX, maxY } = getMaxNum(rootThis.place)
    rootThis.maxX = maxX
    rootThis.maxY = maxY
  } catch { return "撮影データから画像の大きさを特定できませんでした。" }
  try { rootThis.delImg = await fs.readFile(path.join(__dirname, `../settings/${fileName}.png`)) } catch { return "選択された撮影条件での設定ファイルが見つかりませんでした。" }
  try { await fs.mkdirs(path.join(tmpRoot, 'img')); await fs.mkdirs(path.join(tmpRoot, 'img_')) } catch { }
  try { rootThis.images = await sortAndRename(imagesPath) } catch { return "画像をコピーする際にエラーが発生しました。" }
  if (rootThis.images.length === 0) return "画像フォルダ内に画像が見つかりませんでした。"
  if (rootThis.images.length !== rootThis.place.length) return "画像の枚数と画像データの数が違います。"
  for (const image of rootThis.images) {
    await Sharp(path.join(tmpRoot, `img_/${image}`))
      .composite([{
        input: rootThis.delImg,
        blend: 'dest-out'
      }])
      .png()
      .toFile(path.join(tmpRoot, `img/${image}`))
  }
  rootThis.outputImg = Sharp({
    create: {
      width: rootThis.maxX * rootThis.projectSettings.block + rootThis.projectSettings.x,
      height: rootThis.maxY * rootThis.projectSettings.block + rootThis.projectSettings.y,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  rootThis.images.forEach((image, index) => {
    const point = rootThis.place?.[index]
    if (rootThis.projectSettings && point) rootThis.composits.push({
      input: path.join(tmpRoot, `img/${image}`),
      top: (point.y ?? 0) * rootThis.projectSettings.block,
      left: (point.x ?? 0) * rootThis.projectSettings.block,
      blend: "over"
    })
  })
  try {
    return await rootThis.outputImg.composite(rootThis.composits).png().toBuffer()
  } catch {
    return "画像を合成中にエラーが発生しました。"
  }
}
setUp()
/**点 */
export interface Point {
  /**上端からの距離 */
  x: number;
  /**左端からの距離 */
  y: number;
}
/** ./settings/(device name).json */
export interface ViewInfo {
  /**画像の横幅 */
  x: number;
  /**画像の縦の長さ */
  y: number;
  /**1ブロックのピクセル数 */
  block: number;
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
interface rootThis {
  delImg?: Buffer;
  csvData?: string;
  place?: Array<Point>;
  projectSettings?: ViewInfo;
  maxX?: number;
  maxY?: number;
  images?: Array<string>;
  outputImg?: Sharp.Sharp;
  composits: Array<Sharp.OverlayOptions>
}
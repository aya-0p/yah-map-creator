import * as fs from 'fs-extra'
import Sharp from 'sharp'
import path from 'path'
import os from 'os'
export const tmpRoot: string = path.join(os.tmpdir(), 'map')

export const deviceInfo: Map<string, ViewInfo> = new Map();
const setUp = (): void => {
  try { fs.removeSync(tmpRoot) } catch { }
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
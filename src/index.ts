import * as fs from 'fs-extra'
import Sharp from 'sharp'
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
(async () => {
  //first setup
  const allDeviceSettingFiles = await fs.readdir('./settings')
  for (const device of allDeviceSettingFiles) {
    const deviceName = device.split('.').at(0)
      if (deviceName && device.endsWith('.json') && device !== "schema.json") {
        const deviceSettings: DeviceInfo = await fs.readJSON(`./settings/${device}`)
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
  //load inputs
  const settings: FileSettings = await fs.readJson('./run/settings.json')
  const images: Array<string> = (await fs.readdir('./run/img')).filter(value => value.endsWith('png'))
  const places: Array<Point> = await fs.readJSON('./run/place.json')
  const deviceString = `${settings.device}_${settings.view}_${settings.orientation}`
  const projectSettings = deviceInfo.get(deviceString)
  if (projectSettings === undefined) throw new ReferenceError(`Settings of device: ${settings.device}, view: ${settings.view}, orientation: ${settings.orientation} not found.`)
  if (projectSettings.image === false) {
    if (!allDeviceSettingFiles.includes(deviceString)) {
      const img = await getDeleteImage(projectSettings)
      await fs.writeFile(`./settings/${deviceString}.png`, img)
    }
  }
  await fs.mkdirs('./tmp/img')
  for (const image of images) {
    await Sharp(`./run/img/${image}`)
      .composite([{
        input: `./settings/${deviceString}.png`,
        blend: 'dest-out'
      }])
      .png()
    .toFile(`./tmp/img/${image}`)
  }
  const outputImage = Sharp({
    create: {
      width: settings.max_x * projectSettings.block + projectSettings.x,
      height: settings.max_y * projectSettings.block + projectSettings.y,
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
      input: `./tmp/img/${image}`,
      top: (places[index]?.y ?? 0) * projectSettings.block,
      left: (places[index]?.x ?? 0) * projectSettings.block,
      blend: "over"
    })
    index++
  }
  await outputImage.composite(composits).png().toFile("./output.png")
})()
/** ./run/settings.json */
interface FileSettings {
  /**デバイス名(_を使わない) */
  device: string;
  /**表示設定 */
  view: 'Near' | 'Medium' | 'Far';
  /**向き設定 */
  orientation: 0 | 1;
  /**最大撮影横(マス) */
  max_x: number;
  /**最大撮影縦(マス) */
  max_y: number;
}
/**点 */
interface Point {
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
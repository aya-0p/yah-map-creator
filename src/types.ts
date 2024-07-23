import { BrowserWindow } from "electron";
import { Duplex } from "node:stream";
import fs from "fs-extra";
import imageSize from "image-size";
import sharp, { gravity } from "sharp";
import { Collection } from "@discordjs/collection";
export interface ProjectConfig {
  /**
   * 一時フォルダへのパス
   * @example
   * `path/to/temp/map`
   */
  tempPath: string;
  logStream: Duplex;
  log: Console;
  mainWindow: BrowserWindow;
  helpWindow?: BrowserWindow;
  settings: Settings;
  side: Buffer;
  over: Buffer;
  imageConfigDatas: Map<string, ImageConf>;
}
export interface ProjectData {
  baseConf?: ImageConf;
  editHistory: EditHistoryController;
}

export class Image {
  private path: string;
  private imgBuffer: Buffer;
  private name: string;
  private baseConf?: ImageConf;
  private conf?: ImageConf;
  private useCustom: boolean = false;
  private matchConf: boolean;
  private thumbImg?: Buffer;
  private selectImg?: Buffer;
  private projectConfig: ProjectConfig;
  readonly width: number;
  readonly height: number;
  readonly fixWidth: number;
  readonly fixHeight: number;
  constructor(path: string, projectConfig: ProjectConfig, baseConf?: ImageConf) {
    this.path = path;
    this.baseConf = baseConf;
    this.projectConfig = projectConfig;
    this.name = path.split(/[\/\\]/).at(-1) ?? "";
    this.imgBuffer = fs.readFileSync(path);
    try {
      const { width, height } = imageSize(this.imgBuffer);
      this.width = width ?? NaN;
      this.height = height ?? NaN;
    } catch {
      this.width ??= NaN;
      this.height ??= NaN;
    }
    this.matchConf = this.baseConf != null && this.width === this.baseConf.width && this.height === this.baseConf.height;
    this.conf = this.baseConf;
    this.fixWidth = Math.floor(this.width / 8) * 2;
    this.fixHeight = Math.floor(this.height / 8) * 2;
  }
  get filename(): string {
    return this.name;
  }
  get filepath(): string {
    return this.path;
  }
  updateBaseConf(baseConf: ImageConf) {
    this.baseConf = baseConf;
    if (!this.useCustom) {
      this.conf = this.baseConf;
      this.matchConf = this.width === baseConf.width && this.height === baseConf.height && !this.useCustom;
    }
  }
  setConf(conf: ImageConf) {
    this.conf = conf;
    this.useCustom = true;
    this.matchConf = conf.width === this.width && conf.height === this.height;
  }
  removeConf() {
    this.conf = this.baseConf;
    this.useCustom = false;
    this.matchConf = this.baseConf != null && this.baseConf.width === this.width && this.baseConf.height === this.height;
  }
  private async updateThumb_(conf: ImageConf) {
    const resizedOverImage = await sharp(this.projectConfig.over).resize(this.fixWidth, 4, { position: "north" }).png().toBuffer();
    const resizedSideImage = await sharp(this.projectConfig.side).resize(4, this.fixHeight, { position: "west" }).png().toBuffer();
    const temp = await sharp(this.imgBuffer)
      .ensureAlpha()
      .composite([
        {
          input: conf.delImg,
          blend: "dest-out",
        },
      ])
      .png()
      .toBuffer();
    this.thumbImg = await sharp(temp)
      .resize({
        width: this.fixWidth,
        height: this.fixHeight,
      })
      .png()
      .toBuffer();
    this.selectImg = await sharp(temp)
      .resize({
        width: this.fixWidth,
        height: this.fixHeight,
      })
      .composite([
        {
          input: resizedOverImage,
          gravity: gravity.north,
          blend: "over",
        },
        {
          input: resizedOverImage,
          gravity: gravity.south,
          blend: "over",
        },
        {
          input: resizedSideImage,
          gravity: gravity.west,
          blend: "over",
        },
        {
          input: resizedSideImage,
          gravity: gravity.east,
          blend: "over",
        },
      ])
      .png()
      .toBuffer();
  }
  isMatch() {
    return this.matchConf;
  }
  get thumbImage() {
    return this.thumbImg;
  }
  get selectImage() {
    return this.selectImg;
  }
  get config() {
    return this.conf;
  }
}

export class ImageConf {
  readonly delImg: Buffer;
  readonly width: number;
  readonly height: number;
  readonly block: number;
  readonly id: string;
  readonly valid: boolean;
  readonly zoomLevel: 0 | 1 | 2;
  readonly direction: 0 | 1;
  constructor(id: string, delImgPath: string, zoomLevel: 0 | 1 | 2, direction: 0 | 1) {
    this.delImg = fs.readFileSync(delImgPath);
    try {
      const { width, height } = imageSize(this.delImg);
      this.width = width ?? NaN;
      this.height = height ?? NaN;
    } catch {
      this.width ??= NaN;
      this.height ??= NaN;
    }
    this.zoomLevel = zoomLevel;
    const blockNear = Math.max(this.width, this.height) / 8.5;
    switch (zoomLevel) {
      case 0: {
        this.block = Math.floor(blockNear / 2) * 2;
        break;
      }
      case 1: {
        this.block = Math.floor((blockNear * 0.8) / 2) * 2;
        break;
      }
      case 2: {
        this.block = Math.floor((blockNear * 0.6) / 2) * 2;
        break;
      }
    }
    this.id = id;
    this.direction = direction;
    this.valid = !(Number.isNaN(this.width) || Number.isNaN(this.height));
  }
}

export interface Settings {
  devices: Array<DeviceInfo>;
  side: string;
  over: string;
}
interface DeviceInfo {
  file: string;
  alias: Array<string>;
  img0: string;
  img1: string;
}

export interface ImageDatas {
  path: string;
  name: string;
  configId?: string;
  width: number;
  height: number;
  match: boolean;
}

/**
 * @param map map
 * @param key 挿入するkey
 * @param value 挿入するvalue
 * @param insertTo 挿入する場所
 *
 * @example
 * ```ts
 * const map = new Map<number, string>([[0, "0"], [1, "1"], [3, "3"]]);
 * console.log(map); // Map(3) { 0 => "0", 1 => "1", 3 => "3" }
 * const newMap = changeMapPlace(map, 2, "2", 2);
 * console.log(newMap); // Map(4) { 0 => "0", 1 => "1", 2 => "2", 3 => "3" }
 * ```
 */
export function changeMapPlace<K, V>(map: Map<K, V>, key: K, value: V, insertTo: number): Map<K, V> {
  const temp = new Map<K, V>();
  let i = 0;
  let isInserted: boolean;
  for (const [k, v] of map) {
    if (i === insertTo) {
      temp.set(key, value);
      isInserted = true;
    }
    temp.set(k, v);
    i++;
  }
  return temp;
}

export class EditHistoryController {
  private readonly images: Collection<string, Image> = new Collection();
  private currentHistory_: EditHistory;
  readonly firstHistory: EditHistory;
  private readonly baseConf: ImageConf;
  constructor(images: Map<string, Image>, baseConf: ImageConf) {
    for (const [key, value] of images) this.images.set(key, value);
    const image0 = this.images.at(0);
    if (!image0) throw new Error("画像が選択されていません。");
    const { thumbImage } = image0;
    if (!thumbImage) throw new Error("サムネイル画像が生成されていません。")
    this.firstHistory = this.currentHistory_ = new EditHistory(null, thumbImage, [0, 0], [0, 0], [0, 0]);
    this.baseConf = baseConf;
  }

  /**
   * 編集をもとに戻す
   */
  undo() {
    const { previousHistory } = this.currentHistory_;
    if (previousHistory) {
      this.currentHistory_ = previousHistory;
      return previousHistory;
    } else {
      return this.currentHistory_;
    }
  }

  /**
   * 編集をやり直す
   */
  redo() {
    const nextHistory = this.currentHistory_.getNextHistory();
    if (!nextHistory) return this.currentHistory_;
    else {
      this.currentHistory_ = nextHistory;
      return nextHistory;
    }
  }

  /**
   * 編集を複数から選んでやり直す
   */
  otherRedos(fn: (images: Array<EditHistory>) => Promise<EditHistory>) {
    const nextHistories = this.currentHistory_.getNextHistories();
    fn(nextHistories).then(nextHistory => {
      this.currentHistory_ = nextHistory;
    }).catch(() => {});
  }

  /**
   * 編集を追加する
   * @param imagePath 
   * @param imageAt 
   */
  async add(imagePath: string, imageAt: [number, number]) {
    const image = this.images.get(imagePath);
    if (!image) throw new Error("画像名と一致する画像が見つかりませんでした。")
    await EditHistory.createHistory(this.currentHistory_, image, imageAt, this.baseConf);
  }

  final() {

  }
  
  get currentHistory() {
    return this.currentHistory_;
  }

}

class EditHistory {
  readonly previousHistory: EditHistory | null = null;
  readonly thumb: Buffer;
  readonly at: [number, number];
  readonly adjust: [number, number];
  readonly max: [number, number];
  private readonly nextHistory: Array<EditHistory> = [];
  static async createHistory(
    previousHistory: EditHistory,
    image: Image,
    imageTo: [number, number],
    baseConf: ImageConf,
  ) {
    const adjust: [number, number] = [-Math.min(previousHistory.adjust[0], imageTo[0]), -Math.min(previousHistory.adjust[1], imageTo[1])]
    const max: [number, number] = [Math.max(previousHistory.max[0], imageTo[0]), Math.max(previousHistory.max[1], imageTo[1])]
    if (!image.thumbImage) throw new Error("サムネイル画像が生成されていません。")
    const thumb = await sharp({
        create: {
          width: Math.ceil(((adjust[0] + 1 + max[0]) * baseConf.block + baseConf.width) / 8) * 2,
          height: Math.ceil(((adjust[0] + 1 + max[1]) * baseConf.block + baseConf.height) / 8) * 2,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }
      })
      .composite([{
        input: previousHistory.thumb,
        top: Math.floor((adjust[1] + baseConf.block) / 8) * 2,
        left: Math.floor((adjust[0] + baseConf.block) / 8) * 2,
      }, {
        input: image.thumbImage,
        blend: "over",
        top: Math.floor((adjust[1] + imageTo[1]) / 8) * 2,
        left: Math.floor((adjust[0] + imageTo[0]) / 8) * 2,
      }])
      .png()
      .toBuffer()
    return new EditHistory(previousHistory, thumb, imageTo, adjust, max);
  }
  constructor(
    previousHistory: EditHistory | null,
    thumb: Buffer,
    imageTo: [number, number],
    adjust: [number, number],
    max: [number, number],
  ) {
    if (previousHistory) {
      previousHistory.addNextHistory(this);
      this.previousHistory = previousHistory;
    }
    this.thumb = thumb;
    this.at = imageTo;
    this.adjust = adjust;
    this.max = max;
  }
  private addNextHistory(nextHistory: EditHistory) {
    this.nextHistory.push(nextHistory);
  }
  getNextHistory() {
    return this.nextHistory.at(-1);
  }
  getNextHistories() {
    return this.nextHistory;
  }
}
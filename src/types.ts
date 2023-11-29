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
  images: Collection<string, Image>;
  baseConf?: ImageConf;
  editHistory: Array<EditHistory>;
  nextHistory: number;
  nextImg: number;
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
 * changeMapPlace(map, 2, "2", 2);
 * console.log(map); // Map(4) { 0 => "0", 1 => "1", 2 => "2", 3 => "3" }
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
  map.clear();
  for (const [k, v] of temp) {
    map.set(k, v);
  }
  return map;
}

export interface EditHistory {
  imagesMap: Map<string, [number, number]>;
  generatedThumb: Buffer;
  editType: "set" | "remove" | "skip" | "changeLayer";
  editDesc: string;
}

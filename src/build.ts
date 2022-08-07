import * as fs from 'fs-extra'
import path from 'path'
import { Point, tmpRoot } from './main'
export const fileSort = (a: string, b: string): number => {
  const pattern1_a = a.match(/^(?<str>.*?)(?<num>\d+)?$/)
  const pattern1_b = b.match(/^(?<str>.*?)(?<num>\d+)?$/)
  if (pattern1_a !== null && pattern1_b !== null) {
    if (pattern1_a.groups?.str === pattern1_b.groups?.str) {
      //文字列部分が同じ(何もなしを含む)
      return Number(pattern1_a.groups?.num) - Number(pattern1_b.groups?.num)
    } else {
      //文字列部分が異なる
      const pattern2_a = a.match(/^(?<str>.*?)(\((?<num>\d+)\))?$/)
      const pattern2_b = b.match(/^(?<str>.*?)(\((?<num>\d+)\))?$/)
      if (pattern2_a !== null && pattern2_b !== null) {
        if (pattern2_a.groups?.str === pattern2_b.groups?.str) {
          //文字列部分が同じ(何もなしを含む)
          return Number(pattern2_a.groups?.num) - Number(pattern2_b.groups?.num)
        } else {
          //文字列部分が異なる
          if ([a, b].sort().at(0) === a) {
            return -1
          } else {
            return 1
          }
        }
      } else {
        throw new Error("Pattern2 did not match")
      }
    }
  } else {
    throw new Error("Pattern1 did not match")
  }
}
export const sortAndRename = async (imagesPath: string): Promise<string[]> => {
  const images = (await fs.readdir(imagesPath)).filter(val => val.endsWith("png"))
  const renamedArr: Array<string> = []
  images.sort(fileSort)
  images.forEach((imageName, index) => {
    fs.copySync(path.join(imagesPath, imageName), path.join(tmpRoot, `img_/${index + 1}.png`))
    renamedArr.push(`${index + 1}.png`)
  })
  return renamedArr
}
export const csv2Place = (csv: string): Array<Point> => {
  const rawData: Array<Point> = []
  csv.split("\n").forEach(data => {
    if (new RegExp(/\d+\,\d+/).test(data.replace(/\s/g, ""))) {
      rawData.push(JSON.parse(data.replace(/\s/g, "").replace(/(\d+)\,(\d+)/, "{\"x\": $1, \"y\":$2}")))
    }
  })
  return rawData
}
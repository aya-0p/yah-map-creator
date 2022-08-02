import * as fs from 'fs-extra'
import path from 'path'
import { Point, tmpRoot } from './main'
export const sortAndRename = async (imagesPath: string): Promise<string[]> => {
  const images = (await fs.readdir(imagesPath)).filter(val => val.endsWith("png"))
  
  const renamedArr: Array<string> = []
  images.sort((a, b) => {
    let index = 0
    const p_a = a.match(/^(?<str>.*?)(?<num>\d+)?$/)
    const p_b = b.match(/^(?<str>.*?)(?<num>\d+)?$/)
    if (p_a && p_b) {
      if (p_a.groups?.str !== p_b.groups?.str) {
        const p2_a = a.match(/^(?<str>.*?)\(?(?<num>\d+)?\)?$/)
        const p2_b = b.match(/^(?<str>.*?)\(?(?<num>\d+)?\)?$/)
        if (p2_a && p2_b) {
          if (p2_a.groups?.str === p2_b.groups?.str) {
            const aNum = Number(p2_a.groups?.num)
            const bNum = Number(p2_b.groups?.num)
            if (aNum > bNum) index = 1
            if (aNum < bNum) index = -1
            return index
          } else {
            const aNum = parseInt(a)
            const bNum = parseInt(b)
            if (aNum > bNum) index = 1
            if (aNum < bNum) index = -1
            return index
          }
        } else {
          const aNum = parseInt(a)
          const bNum = parseInt(b)
          if (aNum > bNum) index = 1
          if (aNum < bNum) index = -1
          return index
        }
      } else {
        const aNum = Number(p_a.groups?.num)
        const bNum = Number(p_b.groups?.num)
        if (aNum > bNum) index = 1
        if (aNum < bNum) index = -1
        return index
      }
    } else {
      const aNum = parseInt(a)
      const bNum = parseInt(b)
      if (aNum > bNum) index = 1
      if (aNum < bNum) index = -1
      return index
    }
  })
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
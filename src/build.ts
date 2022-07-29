import * as fs from 'fs-extra'
const images = fs.readdirSync('./run/img')
images.sort((a, b) => {
  let index = 0
  const aNum = Number(a.replace(/\D/g, ""))
  const bNum = Number(b.replace(/\D/g, ""))
  if (aNum > bNum) index = 1
  if (aNum < bNum) index = -1
  return index
})
images.forEach((name, index) => {
  fs.renameSync(`./run/img/${name}`, `./run/img/${index+1}.png`)
})
const csv = fs.readFileSync('./run/list.csv').toString()
const rawData: Array<{x: string, y: string}> = []
csv.split("\n").forEach(data => {
  if (new RegExp(/\d+\,\d+/).test(data.replace(/\s/g, ""))) {
    rawData.push(JSON.parse(data.replace(/\s/g, "").replace(/(\d+)\,(\d+)/, "{\"x\": $1, \"y\":$2}")))
  }
})
fs.writeJSONSync("./run/place.json", rawData)
    
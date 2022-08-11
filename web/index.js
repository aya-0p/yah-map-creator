const express = require('express')
const app = express()
/**@type {Map<string, userContent>} */
const userComtents = new Map()
/**@type {Map<string, DeviceInfo>} */
const config = new Map()
/**@type {userContent} */
const userComtent = class {
  /**
   * @function
   * @param {string} deviceName
   * @param {string} distance
   * @param {number} direction
   * @param {Array<Buffer>} images
   */
  constructor(deviceName, distance, direction, images) {
    this.startTime = new Date()
    const inf = config.get(`${deviceName}_${distance}_${direction}`)
    if (inf === undefined) this.error = "Device configuration not found"
    else this.projectInfo = inf.projectInfo
  }
  error = ""
}
app.listen(443)
app.get('/', (_, res) => {
  res.send('test')
})


/**
 * @typedef {Object} userContent
 * @prop {Date} startTime
 * @prop {ProjectInfo} projectInfo
 * @prop {Array<Buffer>} delImg
 * @prop {string} error
 */
/**
 * @typedef {Object} ProjectInfo
 * @prop {number} x
 * @prop {number} y
 * @prop {number} block
 */
/**
 * @typedef {Object} DeviceInfo
 * @prop {ProjectInfo} projectInfo
 * @prop {Buffer} delImg
 */
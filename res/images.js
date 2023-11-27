/**
 * @typedef Electron
 * @property {() => void} selectImg
 * @property {() => void} selectDir
 * @property {() => void} test
 * @property {(fn: (datas: Array<import("../src/types.ts").ImageDatas>) => any) => void} update
 * @property {() => void} start
 * @property {(configId: string) => void} setDefaultConfig
 * @property {(configId: string, imagePath: string) => void} setConfig
 * @property {() => Promise<Array<string>>} getConfigs
 * @property {(reverse: boolean) => void} sort
 */

// init

/**
 * @type {Electron}
 */
var electron;
const fileHtml = document.getElementById("file");
const dirHtml = document.getElementById("dir");
const deviceHtml = document.getElementById("device");
const distanceHtml = document.getElementById("distance");
const directionHtml = document.getElementById("direction");
const startHtml = document.getElementById("start");
const confirmHtml = document.getElementById("confirm");
const confirmAllHtml = document.getElementById("confirmAll");
const imageListHtml = document.getElementById("imageList");

if (
  !(
    fileHtml &&
    fileHtml instanceof HTMLButtonElement &&
    dirHtml &&
    dirHtml instanceof HTMLButtonElement &&
    deviceHtml &&
    deviceHtml instanceof HTMLSelectElement &&
    distanceHtml &&
    distanceHtml instanceof HTMLSelectElement &&
    directionHtml &&
    directionHtml instanceof HTMLSelectElement &&
    startHtml &&
    startHtml instanceof HTMLButtonElement &&
    confirmHtml &&
    confirmHtml instanceof HTMLButtonElement &&
    confirmAllHtml &&
    confirmAllHtml instanceof HTMLButtonElement &&
    imageListHtml &&
    imageListHtml instanceof HTMLDivElement
  )
)
  throw "";

// ---

electron.getConfigs().then((data) => {
  // add configs
  /**
   * @type {Set<string>}
   */
  const deviceList = new Set();
  for (const device of data) deviceList.add(device.split("_")[0]);
  /**
   * @type {string | undefined}
   */
  const value = deviceHtml.selectedOptions[0]?.value;
  while (deviceHtml.children.length !== 0) deviceHtml.removeChild(deviceHtml.children[0])
  const optHtml = new Option("--デバイスを選択--", "");
  optHtml.selected = true;
  deviceHtml.appendChild(optHtml);
  for (const device of deviceList) {
    const optionHtml = new Option(device);
    if (device === value) optionHtml.selected = true;
    deviceHtml.appendChild(optionHtml);
  }
});
fileHtml.addEventListener("click", () => {
  electron.selectImg();
});
dirHtml.addEventListener("click", () => {
  electron.selectDir();
});
startHtml.addEventListener("click", () => {
  electron.start();
});
confirmAllHtml.addEventListener("click", () => {
  const device = deviceHtml.value;
  const distance = distanceHtml.value;
  const direction = directionHtml.value;
  if (device === "") return;
  if (distance === "") return;
  if (direction === "") return;
  electron.setDefaultConfig(device + distance + direction);
});

electron.update((images) => {
  const { scrollHeight } = imageListHtml;
  while (imageListHtml.children.length !== 0) imageListHtml.removeChild(imageListHtml.children[0])
  for (const image of images) {
    const span = document.createElement("span");
    const img = document.createElement("img");
    const desc = document.createElement("span");
    const title = document.createElement("span");
    const path = document.createElement("span");
    const width = document.createElement("span");
    const height = document.createElement("span");
    const device = document.createElement("span");
    const distance = document.createElement("span");
    const direction = document.createElement("span");
    img.src = image.path;
    title.innerHTML = image.name;
    path.innerHTML = "Path: " + image.path;
    width.innerHTML = "Width: " + image.width;
    height.innerHTML = "Height: " + image.height;
    const temp = image.configId?.split("_");
    if (temp) {
      device.innerHTML = "デバイス: " + temp[0];
      switch (temp[1]) {
        case "0":
          distance.innerHTML = "表示: 近く";
          break;
        case "1":
          distance.innerHTML = "表示: 中くらい";
          break;
        case "2":
          distance.innerHTML = "表示: 遠く";
          break;
      }
      switch (temp[2]) {
        case "0":
          direction.innerHTML = "向き: 縦画面";
          break;
        case "1":
          direction.innerHTML = "向き: 横画面";
          break;
      }
    } else {
      device.innerHTML = "デバイス: 未設定";
      distance.innerHTML = "表示: 未設定";
      direction.innerHTML = "向き: 未設定";
    }

    span.classList.add("content");
    img.classList.add("contentImg");
    desc.classList.add("contentDesc");

    desc.appendChild(title);
    desc.appendChild(path);
    desc.appendChild(width);
    desc.appendChild(height);
    desc.appendChild(device);
    desc.appendChild(distance);
    desc.appendChild(direction);

    span.appendChild(img);
    span.appendChild(desc);

    imageListHtml.appendChild(span);
  }
  imageListHtml.scroll(scrollHeight, 0);
});

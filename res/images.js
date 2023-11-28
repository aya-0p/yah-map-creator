/**
 * @typedef Electron
 * @property {() => void} selectImg
 * @property {() => void} selectDir
 * @property {() => void} test
 * @property {(fn: (datas: Array<import("../src/types.ts").ImageDatas>) => any) => void} update
 * @property {() => void} start
 * @property {(configId: string) => void} setDefaultConfig
 * @property {(configId: string, imagePath: Array<string>) => void} setConfig
 * @property {() => Promise<Array<string>>} getConfigs
 * @property {(reverse: boolean) => void} sort
 * @property {(images: Array<string>) => void} remove
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
const removeHtml = document.getElementById("remove");
const removeDisabledHtml = document.getElementById("removeDisabled");

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
    imageListHtml instanceof HTMLDivElement &&
    removeHtml &&
    removeHtml instanceof HTMLButtonElement &&
    removeDisabledHtml &&
    removeDisabledHtml instanceof HTMLButtonElement
  )
) {
  window.alert("ファイルが破損しています");
  throw new Error("invalid html");
}

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
removeDisabledHtml.addEventListener("click", () => {
  /** @type {Array<string>} */
  const removeList = [];
  for (const imageHtml of document.getElementsByClassName("disabled")) {
    const path = imageHtml.getElementsByClassName("path")[0]?.innerHTML.replace("Path: ", "");
    if (path) removeList.push(path);
  }
  electron.remove(removeList);
});
confirmHtml.addEventListener("click", () => {
  const device = deviceHtml.value;
  const distance = distanceHtml.value;
  const direction = directionHtml.value;
  if (device === "") return;
  if (distance === "") return;
  if (direction === "") return;
  /** @type {Array<string>} */
  const selectedList = [];
  for (const selectedHtml of document.getElementsByClassName("selected")) {
    const path = selectedHtml.getElementsByClassName("path")[0]?.innerHTML.replace("Path: ", "");
    if (path) selectedList.push(path);
  }
  electron.setConfig(device + distance + direction, selectedList);
});
removeHtml.addEventListener("click", () => {
  /** @type {Array<string>} */
  const selectedList = [];
  for (const selectedHtml of document.getElementsByClassName("selected")) {
    const path = selectedHtml.getElementsByClassName("path")[0]?.innerHTML.replace("Path: ", "");
    if (path) selectedList.push(path);
  }
  electron.remove(selectedList);
})

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
    img.setAttribute('draggable', false);
    title.innerHTML = `<b>${image.name}</b>`;
    path.innerHTML = "Path: " + image.path;
    width.innerHTML = "幅: " + image.width;
    height.innerHTML = "高さ: " + image.height;
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
      device.innerHTML = "デバイスID: 未設定";
      distance.innerHTML = "表示: 未設定";
      direction.innerHTML = "向き: 未設定";
    }

    span.classList.add("content");
    img.classList.add("contentImg");
    desc.classList.add("contentDesc");
    path.classList.add("path");


    desc.appendChild(title);
    desc.appendChild(path);
    if (Number.isNaN(image.width) || Number.isNaN(image.height)) {
      span.classList.add("disabled");
    } else {
      if (!image.match) span.classList.add("invalid");
      desc.appendChild(width);
      desc.appendChild(height);
      desc.appendChild(device);
      desc.appendChild(distance);
      desc.appendChild(direction);
      span.addEventListener("click", () => {
        if (span.classList.contains("selected")) span.classList.remove("selected");
        else span.classList.add("selected");
        showSelectItemSize();
      })
    }


    span.appendChild(img);
    span.appendChild(desc);

    imageListHtml.appendChild(span);
  }
  imageListHtml.scroll(scrollHeight, 0);
});
function showSelectItemSize() {
  const counterHtml = document.getElementById("counter");
  if (!counterHtml || !(counterHtml instanceof HTMLDivElement)) return;
  counterHtml.innerHTML = document.getElementsByClassName("selected").length + "項目選択中";
}
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
 * @property {(imagePaths: Array<string>) => void} removeConfig
 */

// init

/**
 * @type {Electron}
 */
var electron;
const imageListHtml = document.getElementById("imageList");

if (!(imageListHtml && imageListHtml instanceof HTMLDivElement)) {
  window.alert("ファイルが破損しています");
  throw new Error("invalid html");
}

// ---

/*
removeHtml.addEventListener("click", () => { */
/** @type {Array<string>} */ /*
  const selectedList = [];
  for (const selectedHtml of document.getElementsByClassName("selected")) {
    const path = selectedHtml.getElementsByClassName("path")[0]?.innerHTML.replace("Path: ", "");
    if (path) selectedList.push(path);
  }
  electron.remove(selectedList);
});*/

electron.update((images) => {
  const { scrollTop } = imageListHtml;
  while (imageListHtml.children.length !== 0) imageListHtml.removeChild(imageListHtml.children[0]);
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
    img.setAttribute("draggable", false);
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
      device.innerHTML = "デバイス: 未設定";
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
        else {
          for (const selectedHtml of document.getElementsByClassName("selected")) selectedHtml.classList.remove("selected");
          span.classList.add("selected");
        }
      });
    }

    span.appendChild(img);
    span.appendChild(desc);

    imageListHtml.appendChild(span);
  }
  imageListHtml.scroll(0, scrollTop);
});

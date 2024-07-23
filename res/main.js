/**
 * @typedef Electron
 * @property {(fn: (currentImg: Buffer, nextImg: Buffer) => any) => void} update
 * @property {(imagePath: string, location: [number, number]) => void} set
 * @property {() => void} back
 * @property {() => void} end
 */

// init

/**
 * @type {Electron}
 */
var electron;
const mainHtml = document.getElementById("main");
const subHtml = document.getElementById("sub");

if (!(
  mainHtml &&
  mainHtml instanceof HTMLImageElement &&
  subHtml &&
  subHtml instanceof HTMLImageElement
  )) {
  window.alert("ファイルが破損しています");
  throw new Error("invalid html");
}

// ---
electron.update((currentImg, nextImg) => {
  const blob1 = new Blob([currentImg], { type: "image/png" });
  const urlCreator1 = window.URL || window.webkitURL;
  const src1 = urlCreator1.createObjectURL(blob1);
  mainHtml.src = src1;
  const blob2 = new Blob([nextImg], { type: "image/png" });
  const urlCreator2 = window.URL || window.webkitURL;
  const src2 = urlCreator2.createObjectURL(blob2);
  subHtml.src = src2;
})

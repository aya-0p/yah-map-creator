window.addEventListener("keydown", (e) => {
  const code = e.code;
  switch (code) {
    case "KeyW":
    case "ArrowUp":
      if (e.shiftKey === true) window.editor.shiftUp()
      else window.editor.up()
      break;
    case "KeyS":
    case "ArrowDown":
      window.editor.down()
      break;
    case "KeyA":
    case "ArrowLeft":
      if (e.shiftKey === true) window.editor.shiftLeft()
      else window.editor.left()
      break;
    case "KeyD":
    case "ArrowRight":
      window.editor.right()
      break;
    case "Enter":
      window.editor.enter()
      break;
    case "Delete":
    case "Backspace":
      window.editor.back()
      break;
    default:
  }
});
window.editor.updateFunc((_, buffer) => {
  let blob = new Blob([buffer], { type: "image/png" });
  let urlCreator = window.URL || window.webkitURL;
  let src = urlCreator.createObjectURL(blob);
  document.getElementById("image").src = src
})
window.editor.updateTitle((_, title) => {
  document.title = title
})
document.getElementById("image").addEventListener('click', async () => {
  window.editor.save()
})
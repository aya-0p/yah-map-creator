window.addEventListener("keydown", (e) => {
  const code = e.code;
  switch (code) {
    case "ArrowUp":
      window.editor.up()
      break;
    case "ArrowDown":
      window.editor.down()
      break;
    case "ArrowLeft":
      window.editor.left()
      break;
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
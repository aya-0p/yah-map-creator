window.log.updateLog((_, buffer) => {
  const h = document.getElementById("log").innerHTML
  document.getElementById("log").innerHTML = `${buffer}<br>${h}`
})
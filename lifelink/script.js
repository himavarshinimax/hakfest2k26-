function simulateUpdate() {
  document.getElementById("hospitals").innerText =
    Math.floor(Math.random() * 10) + 20;

  document.getElementById("doctors").innerText =
    Math.floor(Math.random() * 30) + 40;

  document.getElementById("donors").innerText =
    Math.floor(Math.random() * 80) + 100;
}

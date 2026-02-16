const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = {};

app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Render Multiplayer</title>
    <style>
      body { margin: 0; overflow: hidden; background: #111; }
      canvas { background: #222; display: block; }
    </style>
  </head>
  <body>
  <canvas id="game"></canvas>

  <script src="/socket.io/socket.io.js"></script>
  <script>
  const socket = io();
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let players = {};
  let myId = null;

  socket.on("connect", () => {
    myId = socket.id;
  });

  socket.on("players", (data) => {
    players = data;
  });

  let keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup", e => keys[e.key] = false);

  function update() {
    if (!players[myId]) return;

    if (keys["ArrowUp"]) players[myId].y -= 5;
    if (keys["ArrowDown"]) players[myId].y += 5;
    if (keys["ArrowLeft"]) players[myId].x -= 5;
    if (keys["ArrowRight"]) players[myId].x += 5;

    socket.emit("move", players[myId]);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let id in players) {
      ctx.fillStyle = id === myId ? "lime" : "red";
      ctx.fillRect(players[id].x, players[id].y, 40, 40);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
  </script>
  </body>
  </html>
  `);
});

io.on("connection", (socket) => {
  players[socket.id] = {
    x: Math.random() * 500,
    y: Math.random() * 400
  };

  io.emit("players", players);

  socket.on("move", (data) => {
    players[socket.id] = data;
    io.emit("players", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players", players);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

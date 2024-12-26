// server/index.js
import { createApp } from "vue";
import { Server } from "socket.io";
import https from "https";
import fs from "fs";
import path from "path";

const keyPath = path.resolve("./cert/key.pem");
const certPath = path.resolve("./cert/cert.pem");

// HTTPS 서버 및 Socket.IO 서버 초기화
const httpsServer = https.createServer({
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
});

const io = new Server(httpsServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("offer", (data) => {
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.broadcast.emit("answer", data);
  });

  socket.on("candidate", (data) => {
    socket.broadcast.emit("candidate", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// 서버 실행
httpsServer.listen(3000, () => {
  console.log("HTTPS Server running at https://localhost:3000");
});

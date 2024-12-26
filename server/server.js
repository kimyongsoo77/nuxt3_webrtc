import fs from "fs";
import { createServer } from "https";
import WebSocket, { WebSocketServer } from "ws";
// SSL 인증서 경로
const serverKey = fs.readFileSync("../cert/key.pem");
const serverCert = fs.readFileSync("../cert/cert.pem");

const server = createServer({
  key: serverKey,
  cert: serverCert,
});

// HTTPS 서버 생성

// WebSocket 서버 생성
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("A user connected");

  ws.on("message", (message) => {
    const textMessage = message.toString();
    console.log(textMessage);

    // 메시지를 받으면 다른 클라이언트에게 전달
    wss.clients.forEach((client) => {
      // 보낸 사람을 제외하고 나머지 접속하자한테 전송한다
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(textMessage);
      }
    });
  });

  ws.on("close", () => {
    console.log("A user disconnected");
  });
});

server.listen(3000, () => {
  console.log("WebSocket server is running on https://localhost:3000");
});

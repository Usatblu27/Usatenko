const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const MESSAGES_FILE = "messages.json";
let messagesHistory = [];

try {
  messagesHistory = JSON.parse(fs.readFileSync(MESSAGES_FILE)) || [];
} catch (e) {
  console.log("Создаем новый файл сообщений");
}

app.use(express.static("public"));

app.get("/api/messages", (req, res) => {
  res.json(messagesHistory);
});

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "history",
      messages: messagesHistory,
    })
  );

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "message") {
      const messageData = {
        type: "message",
        username: data.username,
        text: data.text,
        time: new Date().toLocaleTimeString(),
      };

      messagesHistory.push(messageData);
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesHistory));

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(messageData));
        }
      });
    }
  });
});

const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

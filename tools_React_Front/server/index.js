// server.js
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server
const wss = new WebSocket.Server({ server });

// Broadcast helper
function broadcast(data) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// WebSocket events
wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");
  ws.send(JSON.stringify({ type: "system", msg: "connected to server" }));

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

// HTTP endpoint: receive logs from Android app
app.post("/log", (req, res) => {
  const log = req.body;
  if (!log) {
    return res.status(400).json({ error: "Missing log body" });
  }

  console.log("📩 Log received:", log);

  // Broadcast to WS clients
  broadcast({ type: "log", ...log, ts: Date.now() });

  res.sendStatus(200);
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Server is running. POST /log or connect via WebSocket.");
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket running on ws://localhost:${PORT}`);
});

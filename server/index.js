// server/index.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

const HEARTBEAT_INTERVAL = 30000;

wss.on("connection", (ws) => {
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // ... rest of the connection handler
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      clients.delete(ws);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(() => {});
  });
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
  clearInterval(interval);
});
// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New client connected");
  clients.add(ws);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "notification",
      title: "Connected",
      message: "Successfully connected to notification server",
    })
  );

  // Handle incoming messages
  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received:", parsedMessage);

      // Handle different message types
      switch (parsedMessage.type) {
        case "acknowledgement":
          console.log("Client acknowledged:", parsedMessage);
          break;
        // Add other message type handlers as needed
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

// Function to broadcast notification to all connected clients
const broadcastNotification = (notification) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "notification",
          ...notification,
        })
      );
      console.log('Server Sent', 
                JSON.stringify({
                        type: "notification",
                        ...notification,
                })
            );
    }
  });
};

// Example API endpoint to trigger notifications
app.post("/api/notify", express.json(), (req, res) => {
  const { title, message } = req.body;

  broadcastNotification({ title, message });

  res.json({ success: true, message: "Notification sent" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

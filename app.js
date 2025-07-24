import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "client")));

// Mock data
const devices = [
  {
    id: "light-1",
    name: "Living Room Light",
    type: "light",
    status: "Online",
    isActive: true,
  },
  {
    id: "light-2",
    name: "Bedroom Light",
    type: "light",
    status: "Online",
    isActive: false,
  },
  {
    id: "thermostat-1",
    name: "Living Room Thermostat",
    type: "thermostat",
    status: "Online",
    isActive: true,
  },
  {
    id: "camera-1",
    name: "Front Door Camera",
    type: "camera",
    status: "Online",
    isActive: true,
  },
];

const scenes = [
  {
    id: "scene-1",
    name: "Movie Night",
    description: "Dim lights, lower blinds, turn on TV",
  },
  {
    id: "scene-2",
    name: "Good Morning",
    description: "Raise blinds, turn on lights, start coffee maker",
  },
];

// API routes
app.get("/api/devices", (req, res) => {
  res.json({ devices });
});

app.get("/api/scenes", (req, res) => {
  res.json({ scenes });
});

// Process commands
function processCommand(command) {
  console.log(`Processing: ${command}`);

  if (command.toLowerCase() === "help") {
    return "Available commands: help, status, turn on/off [device], scene [name]";
  }

  if (command.toLowerCase() === "status") {
    return "All systems operational. Connected devices: " + devices.length;
  }

  if (command.toLowerCase().includes("turn on")) {
    const deviceName = command.toLowerCase().replace("turn on", "").trim();
    const device = devices.find((d) =>
      d.name.toLowerCase().includes(deviceName),
    );
    if (device) {
      device.isActive = true;
      return `Turned on ${device.name}`;
    }
    return `Device "${deviceName}" not found`;
  }

  if (command.toLowerCase().includes("turn off")) {
    const deviceName = command.toLowerCase().replace("turn off", "").trim();
    const device = devices.find((d) =>
      d.name.toLowerCase().includes(deviceName),
    );
    if (device) {
      device.isActive = false;
      return `Turned off ${device.name}`;
    }
    return `Device "${deviceName}" not found`;
  }

  if (command.toLowerCase().includes("scene")) {
    const sceneName = command.toLowerCase().replace("scene", "").trim();
    const scene = scenes.find((s) => s.name.toLowerCase().includes(sceneName));
    if (scene) {
      return `Activated scene: ${scene.name}`;
    }
    return `Scene "${sceneName}" not found`;
  }

  if (
    command.toLowerCase().startsWith("alexa") ||
    command.toLowerCase().startsWith("google")
  ) {
    const assistant = command.toLowerCase().startsWith("alexa")
      ? "Alexa"
      : "Google";
    return `${assistant} says: I heard your command`;
  }

  return "I don't understand that command. Try 'help' for available commands.";
}

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const command = message.toString();
    console.log(`Received: ${command}`);

    const response = processCommand(command);
    ws.send(response);
  });
});

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Simple Express server with WebSocket support
import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Mock data for the application
const mockDevices = [
  {
    id: "light-1",
    name: "Living Room Light",
    type: "light",
    protocol: "wifi",
    manufacturer: "Philips",
    model: "Hue",
    state: {
      power: true,
      brightness: 80,
      color: { h: 240, s: 100, v: 100 },
    },
    connected: true,
  },
  {
    id: "thermostat-1",
    name: "Living Room Thermostat",
    type: "thermostat",
    protocol: "zigbee",
    manufacturer: "Nest",
    model: "Learning Thermostat",
    state: {
      power: true,
      temperature: 72,
      mode: "heat",
    },
    connected: true,
  },
  {
    id: "camera-1",
    name: "Front Door Camera",
    type: "camera",
    protocol: "wifi",
    manufacturer: "Ring",
    model: "Doorbell Pro",
    state: {
      power: true,
      recording: false,
      motion: false,
    },
    connected: true,
  },
];

const mockScenes = [
  {
    id: "scene-1",
    name: "Movie Night",
    description: "Dim lights and set temperature for movie watching",
    deviceStates: [
      { deviceId: "light-1", state: { power: true, brightness: 30 } },
      { deviceId: "thermostat-1", state: { temperature: 72 } },
    ],
    lastActivated: new Date().toISOString(),
  },
  {
    id: "scene-2",
    name: "Good Morning",
    description: "Brighten lights and set comfortable temperature",
    deviceStates: [
      { deviceId: "light-1", state: { power: true, brightness: 100 } },
      { deviceId: "thermostat-1", state: { temperature: 70 } },
    ],
  },
  {
    id: "scene-3",
    name: "Away Mode",
    description: "Turn off lights and set energy-saving temperature",
    deviceStates: [
      { deviceId: "light-1", state: { power: false } },
      { deviceId: "thermostat-1", state: { temperature: 65 } },
    ],
  },
];

const mockAutomations = [
  {
    id: "auto-1",
    name: "Evening Lights",
    description: "Turn on lights at sunset",
    trigger: { type: "time", time: "18:00" },
    actions: [{ deviceId: "light-1", state: { power: true, brightness: 70 } }],
    enabled: true,
  },
  {
    id: "auto-2",
    name: "Night Mode",
    description: "Turn off lights and lower temperature at night",
    trigger: { type: "time", time: "23:00" },
    actions: [
      { deviceId: "light-1", state: { power: false } },
      { deviceId: "thermostat-1", state: { temperature: 68 } },
    ],
    enabled: true,
  },
];

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send initial data to client
  ws.send(
    JSON.stringify({
      type: "init",
      devices: mockDevices,
      scenes: mockScenes,
      automations: mockAutomations,
    }),
  );

  // Handle messages from client
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      if (data.type === "command") {
        handleCommand(ws, data.command);
      } else if (data.type === "get_initial_data") {
        ws.send(
          JSON.stringify({
            type: "init",
            devices: mockDevices,
            scenes: mockScenes,
            automations: mockAutomations,
          }),
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "command_response",
          result: {
            content: "Error processing your request",
          },
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Handle commands
function handleCommand(ws, command) {
  console.log("Command received:", command);

  // Simple command parsing
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes("discover")) {
    ws.send(
      JSON.stringify({
        type: "command_response",
        result: {
          content: "Discovering devices...",
          type: "discovery",
        },
      }),
    );

    // Simulate device discovery after a delay
    setTimeout(() => {
      ws.send(
        JSON.stringify({
          type: "device_discovered",
          device: {
            id: "light-2",
            name: "Bedroom Light",
            type: "light",
            protocol: "wifi",
            manufacturer: "Philips",
            model: "Hue",
            state: {
              power: false,
              brightness: 100,
            },
            connected: true,
          },
        }),
      );
    }, 2000);

    return;
  }

  if (lowerCommand.includes("turn on") || lowerCommand.includes("turn off")) {
    const isOn = lowerCommand.includes("turn on");
    let deviceName = "";

    if (lowerCommand.includes("living room light")) {
      deviceName = "Living Room Light";
    } else if (lowerCommand.includes("bedroom light")) {
      deviceName = "Bedroom Light";
    } else if (lowerCommand.includes("all lights")) {
      deviceName = "all lights";
    }

    if (deviceName) {
      if (deviceName === "all lights") {
        // Update all light devices
        mockDevices.forEach((device) => {
          if (device.type === "light") {
            device.state.power = isOn;
          }
        });

        ws.send(
          JSON.stringify({
            type: "command_response",
            result: {
              content: `All lights turned ${isOn ? "on" : "off"}`,
              type: "device_control",
            },
          }),
        );

        // Send device updates
        mockDevices.forEach((device) => {
          if (device.type === "light") {
            ws.send(
              JSON.stringify({
                type: "device_update",
                device,
              }),
            );
          }
        });
      } else {
        // Find and update specific device
        const device = mockDevices.find((d) => d.name === deviceName);
        if (device) {
          device.state.power = isOn;

          ws.send(
            JSON.stringify({
              type: "command_response",
              result: {
                content: `${deviceName} turned ${isOn ? "on" : "off"}`,
                type: "device_control",
              },
            }),
          );

          ws.send(
            JSON.stringify({
              type: "device_update",
              device,
            }),
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "command_response",
              result: {
                content: `Device "${deviceName}" not found`,
                type: "error",
              },
            }),
          );
        }
      }
      return;
    }
  }

  if (lowerCommand.includes("activate scene")) {
    const sceneName = command.replace(/activate scene/i, "").trim();
    const scene = mockScenes.find(
      (s) => s.name.toLowerCase() === sceneName.toLowerCase(),
    );

    if (scene) {
      scene.lastActivated = new Date().toISOString();

      // Apply scene states to devices
      scene.deviceStates.forEach((deviceState) => {
        const device = mockDevices.find((d) => d.id === deviceState.deviceId);
        if (device) {
          device.state = { ...device.state, ...deviceState.state };
        }
      });

      ws.send(
        JSON.stringify({
          type: "command_response",
          result: {
            content: `Scene "${scene.name}" activated`,
            type: "scene_activation",
          },
        }),
      );

      ws.send(
        JSON.stringify({
          type: "scene_activated",
          scene,
        }),
      );

      // Send device updates
      scene.deviceStates.forEach((deviceState) => {
        const device = mockDevices.find((d) => d.id === deviceState.deviceId);
        if (device) {
          ws.send(
            JSON.stringify({
              type: "device_update",
              device,
            }),
          );
        }
      });

      return;
    } else {
      ws.send(
        JSON.stringify({
          type: "command_response",
          result: {
            content: `Scene "${sceneName}" not found`,
            type: "error",
          },
        }),
      );
      return;
    }
  }

  // Default response for unrecognized commands
  ws.send(
    JSON.stringify({
      type: "command_response",
      result: {
        content: `I received your command: "${command}". This is a simulated response.`,
        type: "text",
      },
    }),
  );
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Main route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// API routes for REST clients
app.get("/api/devices", (req, res) => {
  res.json(mockDevices);
});

app.get("/api/scenes", (req, res) => {
  res.json(mockScenes);
});

app.get("/api/automations", (req, res) => {
  res.json(mockAutomations);
});

// Start server
server.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

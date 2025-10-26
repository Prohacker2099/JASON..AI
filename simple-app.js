import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer } from "ws";
import { networkInterfaces } from "os";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import multer from "multer";
import { parseFile } from "fast-csv";
import ical from "node-ical";
import moment from "moment";

const execAsync = promisify(exec);


const  = [
  {
    deviceId: "light-living-room",
    name: "Living Room Light",
    type: "light",
    status: "Online",
    isActive: true,
    capabilities: ["on", "brightness", "color"],
    details: {
      manufacturer: "Philips Hue",
      model: "Color Ambiance",
      ip: "192.168.1.100",
      location: "Living Room",
    },
    state: {
      on: true,
      brightness: 80,
      color: { h: 240, s: 50, v: 80 },
    },
  },
  {
    deviceId: "light-bedroom",
    name: "Bedroom Light",
    type: "light",
    status: "Online",
    isActive: false,
    capabilities: ["on", "brightness"],
    details: {
      manufacturer: "LIFX",
      model: "Mini",
      ip: "192.168.1.101",
      location: "Bedroom",
    },
    state: {
      on: false,
      brightness: 50,
    },
  },
  {
    deviceId: "thermostat-1",
    name: "Living Room Thermostat",
    type: "thermostat",
    status: "Online",
    isActive: true,
    capabilities: ["temperature", "mode", "fan"],
    details: {
      manufacturer: "Nest",
      model: "Learning Thermostat",
      ip: "192.168.1.102",
      location: "Living Room",
    },
    state: {
      temperature: 72,
      mode: "heat",
      fanMode: "auto",
    },
  },
  {
    deviceId: "camera-frontdoor",
    name: "Front Door Camera",
    type: "camera",
    status: "Online",
    isActive: true,
    capabilities: ["stream", "motion", "recording"],
    details: {
      manufacturer: "Ring",
      model: "Doorbell Pro",
      ip: "192.168.1.103",
      location: "Front Door",
    },
    state: {
      recording: false,
      motionDetected: false,
      lastEvent: "2023-05-15T14:32:10Z",
    },
  },
  {
    deviceId: "speaker-living",
    name: "Living Room Speaker",
    type: "speaker",
    status: "Online",
    isActive: false,
    capabilities: ["playback", "volume"],
    details: {
      manufacturer: "Sonos",
      model: "One",
      ip: "192.168.1.104",
      location: "Living Room",
    },
    state: {
      playing: false,
      volume: 40,
      track: null,
    },
  },
  {
    deviceId: "lock-frontdoor",
    name: "Front Door Lock",
    type: "lock",
    status: "Online",
    isActive: true,
    capabilities: ["lock", "battery"],
    details: {
      manufacturer: "August",
      model: "Smart Lock Pro",
      ip: "192.168.1.105",
      location: "Front Door",
    },
    state: {
      locked: true,
      battery: 85,
    },
  },
];


    if (discoveredDevices.length === 0) {
      
      discoveredDevices = [...discoveredDevices, ...];
    }

    res.json(discoveredDevices);
  } catch (error) {
    console.error("Error getting devices:", error);
    res.status(500).json({ error: "Failed to get devices" });
  }
});

app.get("/api/schedule", (req, res) => {
  try {
    const upcoming = getUpcomingEvents();
    const today = getTodayEvents();

    res.json({
      upcoming,
      today,
      all: userSchedule,
    });
  } catch (error) {
    console.error("Error getting schedule:", error);
    res.status(500).json({ error: "Failed to get schedule" });
  }
});

app.get("/api/preferences", (req, res) => {
  res.json(userPreferences);
});

app.get("/api/scenes", (req, res) => {
  
  const scenes = [
    {
      id: "scene-1",
      name: "Movie Night",
      description: "Dim lights, lower blinds, turn on TV",
      devices: ["light-living-room", "light-bedroom"],
      states: {
        "light-living-room": {
          on: true,
          brightness: 30,
          color: { h: 240, s: 100, v: 50 },
        },
        "light-bedroom": { on: false },
      },
      icon: "film",
      color: "#6366F1",
    },
    {
      id: "scene-2",
      name: "Good Morning",
      description: "Raise blinds, turn on lights, start coffee maker",
      devices: ["light-living-room", "light-bedroom"],
      states: {
        "light-living-room": {
          on: true,
          brightness: 100,
          color: { h: 40, s: 20, v: 100 },
        },
        "light-bedroom": { on: true, brightness: 100 },
      },
      icon: "sun",
      color: "#F59E0B",
    },
    {
      id: "scene-3",
      name: "Away Mode",
      description: "Turn off all lights, lock doors, arm security system",
      devices: ["light-living-room", "light-bedroom", "lock-frontdoor"],
      states: {
        "light-living-room": { on: false },
        "light-bedroom": { on: false },
        "lock-frontdoor": { locked: true },
      },
      icon: "shield",
      color: "#10B981",
    },
    {
      id: "scene-4",
      name: "Night Mode",
      description: "Dim lights, set thermostat, lock doors",
      devices: [
        "light-living-room",
        "light-bedroom",
        "thermostat-1",
        "lock-frontdoor",
      ],
      states: {
        "light-living-room": { on: false },
        "light-bedroom": { on: true, brightness: 20 },
        "thermostat-1": { temperature: 68, mode: "heat" },
        "lock-frontdoor": { locked: true },
      },
      icon: "moon",
      color: "#8B5CF6",
    },
  ];

  res.json(scenes);
});

app.get("/api/automations", (req, res) => {
  
  const automations = [
    {
      id: "auto-1",
      name: "Turn off lights at night",
      enabled: true,
      trigger: { type: "time", time: "23:00", days: [0, 1, 2, 3, 4, 5, 6] },
      conditions: [],
      actions: [
        {
          type: "device",
          deviceId: "light-living-room",
          command: { on: false },
        },
        { type: "device", deviceId: "light-bedroom", command: { on: false } },
      ],
      lastTriggered: "2023-05-14T23:00:00Z",
    },
    {
      id: "auto-2",
      name: "Lock door when leaving",
      enabled: true,
      trigger: { type: "presence", presence: "away" },
      conditions: [{ type: "time", operator: "after", time: "08:00" }],
      actions: [
        {
          type: "device",
          deviceId: "lock-frontdoor",
          command: { locked: true },
        },
      ],
      lastTriggered: "2023-05-15T08:32:15Z",
    },
    {
      id: "auto-3",
      name: "Turn on lights at sunset",
      enabled: true,
      trigger: { type: "sun", event: "sunset", offset: -15 },
      conditions: [{ type: "presence", presence: "home" }],
      actions: [
        {
          type: "device",
          deviceId: "light-living-room",
          command: { on: true, brightness: 70 },
        },
      ],
      lastTriggered: "2023-05-14T20:15:00Z",
    },
  ];

  res.json(automations);
});

app.get("/api/insights", (req, res) => {
  
  const insights = [
    {
      id: "insight-1",
      type: "energy",
      title: "Energy Usage Trend",
      description:
        "Your energy usage is down 15% this week compared to last week.",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Last Week",
            data: [4.5, 5.2, 4.8, 5.6, 4.9, 6.1, 5.3],
          },
          {
            label: "This Week",
            data: [4.1, 4.3, 3.8, 4.2, 4.5, 5.2, 4.6],
          },
        ],
      },
      timestamp: "2023-05-15T12:00:00Z",
    },
    {
      id: "insight-2",
      type: "pattern",
      title: "Usage Pattern Detected",
      description:
        "You typically turn on your living room lights at 6 PM on weekdays.",
      data: {
        deviceId: "light-living-room",
        pattern: {
          days: [1, 2, 3, 4, 5],
          time: "18:00",
          confidence: 85,
        },
      },
      timestamp: "2023-05-14T12:00:00Z",
    },
    {
      id: "insight-3",
      type: "recommendation",
      title: "Automation Recommendation",
      description:
        "Consider creating an automation to turn off your bedroom light at 11 PM.",
      data: {
        suggestion: {
          name: "Turn off bedroom light at night",
          trigger: { type: "time", time: "23:00", days: [0, 1, 2, 3, 4, 5, 6] },
          actions: [
            {
              type: "device",
              deviceId: "light-bedroom",
              command: { on: false },
            },
          ],
        },
      },
      timestamp: "2023-05-13T12:00:00Z",
    },
  ];

  res.json(insights);
});

app.post("/api/preferences", express.json(), (req, res) => {
  try {
    userPreferences = { ...userPreferences, ...req.body };
    res.json(userPreferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

app.post("/api/upload/schedule", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const events = await processScheduleFile(req.file.path);
    userSchedule = events;

    res.json({
      success: true,
      message: `Successfully processed ${events.length} events`,
      events,
    });
  } catch (error) {
    console.error("Error uploading schedule:", error);
    res.status(500).json({ error: "Failed to process schedule file" });
  }
});

app.post("/api/chat", express.json(), (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = generateEmpatheticResponse(message);

    res.json({ response });
  } catch (error) {
    console.error("Error processing chat message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Store device state updates to broadcast to all clients
  const broadcastDeviceUpdate = (deviceId, newState) => {
    const device = discoveredDevices.find((d) => d.deviceId === deviceId);
    if (device) {
      // Update device state
      device.state = { ...device.state, ...newState };

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "device_update",
            deviceId,
            state: device.state,
          }),
        );
      });
    }
  };

  ws.on("message", async (message) => {
    const data = message.toString();
    console.log(`Received: ${data}`);

    try {
      // Parse message
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(data);
      } catch (e) {
        // If not JSON, treat as plain text
        parsedMessage = { type: "chat", content: data };
      }

      // Handle different message types
      switch (parsedMessage.type) {
        case "chat":
          const response = generateEmpatheticResponse(parsedMessage.content);
          ws.send(JSON.stringify({ type: "chat", content: response }));
          break;

        case "voice":
          // Handle voice command
          const voiceResponse = generateEmpatheticResponse(
            parsedMessage.content,
          );
          ws.send(JSON.stringify({ type: "voice", content: voiceResponse }));
          break;

        case "command":
          // Handle specific commands
          let commandResponse = "I don't understand that command.";

          if (parsedMessage.content === "get_schedule") {
            const upcoming = getUpcomingEvents();
            commandResponse = JSON.stringify({
              type: "schedule",
              upcoming,
              today: getTodayEvents(),
            });
          } else if (parsedMessage.content === "get_preferences") {
            commandResponse = JSON.stringify({
              type: "preferences",
              preferences: userPreferences,
            });
          }

          ws.send(commandResponse);
          break;

        case "device_control":
          // Handle device control
          const { deviceId, command } = parsedMessage;
          if (deviceId && command) {
            // Find device
            const device = discoveredDevices.find(
              (d) => d.deviceId === deviceId,
            );
            if (device) {
              console.log(
                `Controlling device ${deviceId} with command:`,
                command,
              );

              // Update device state
              if (command.on !== undefined) {
                device.isActive = command.on;
                if (device.state) {
                  device.state.on = command.on;
                } else {
                  device.state = { on: command.on };
                }
              }

              // Handle other commands based on device type
              if (device.state) {
                // Update state with all command properties
                device.state = { ...device.state, ...command };
              }

              // Broadcast update to all clients
              broadcastDeviceUpdate(deviceId, command);

              ws.send(
                JSON.stringify({
                  type: "device_control_response",
                  deviceId,
                  success: true,
                  state: device.state,
                }),
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: "device_control_response",
                  deviceId,
                  success: false,
                  error: "Device not found",
                }),
              );
            }
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                content: "Invalid device control request",
              }),
            );
          }
          break;

        case "scene_activate":
          // Handle scene activation
          const { sceneId } = parsedMessage;
          if (sceneId) {
            console.log(`Activating scene ${sceneId}`);

            // Simulate scene activation
            setTimeout(() => {
              ws.send(
                JSON.stringify({
                  type: "scene_activate_response",
                  sceneId,
                  success: true,
                }),
              );

              // If it's movie night scene, update the devices
              if (sceneId === "scene-1") {
                broadcastDeviceUpdate("light-living-room", {
                  on: true,
                  brightness: 30,
                  color: { h: 240, s: 100, v: 50 },
                });
                broadcastDeviceUpdate("light-bedroom", { on: false });
              } else if (sceneId === "scene-2") {
                broadcastDeviceUpdate("light-living-room", {
                  on: true,
                  brightness: 100,
                  color: { h: 40, s: 20, v: 100 },
                });
                broadcastDeviceUpdate("light-bedroom", {
                  on: true,
                  brightness: 100,
                });
              }
            }, 1000);
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                content: "Invalid scene activation request",
              }),
            );
          }
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "error",
              content: "Unknown message type",
            }),
          );
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Error processing your message",
        }),
      );
    }
  });

  // Send initial message
  ws.send(
    JSON.stringify({
      type: "chat",
      content: `Hello! I'm JASON, your personal assistant. How can I help you today?`,
    }),
  );

  // Send initial device states
  ws.send(
    JSON.stringify({
      type: "initial_state",
      devices: discoveredDevices,
    }),
  );
});

// Serve HTML
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Scanning for network devices...");
  discoverNetworkDevices();
});

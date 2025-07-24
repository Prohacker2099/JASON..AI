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

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 10000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "client")));

// Fix MIME type issues
app.use((req, res, next) => {
  if (req.path.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript");
  } else if (req.path.endsWith(".css")) {
    res.setHeader("Content-Type", "text/css");
  }
  next();
});

// Store discovered devices and user data
let discoveredDevices = [];
let networkDevices = [];
let userSchedule = [];
let userPreferences = {
  name: "User",
  wakeUpTime: "07:00",
  sleepTime: "23:00",
  favoriteMusic: "Relaxing",
  weatherAlerts: true,
  trafficAlerts: true,
  darkMode: true,
  accent: "#0B84D0",
  notifications: true,
};
let conversationHistory = [];

// Mock device data
const mockDevices = [
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

// Discover real network devices
async function discoverNetworkDevices() {
  try {
    // Get local network interfaces
    const interfaces = networkInterfaces();
    const networkAddresses = [];

    // Extract IPv4 addresses
    Object.values(interfaces).forEach((iface) => {
      if (iface) {
        iface.forEach((addr) => {
          if (addr.family === "IPv4" && !addr.internal) {
            const parts = addr.address.split(".");
            const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
            networkAddresses.push({ prefix, address: addr.address });
          }
        });
      }
    });

    console.log("Network addresses:", networkAddresses);

    // Scan each network
    for (const network of networkAddresses) {
      try {
        // Use ping to find active devices
        const command =
          process.platform === "win32"
            ? `for /L %i in (1,1,10) do @ping -n 1 -w 100 ${network.prefix}.%i | find "Reply"`
            : `for i in {1..10}; do ping -c 1 -W 1 ${network.prefix}.$i | grep "64 bytes" | cut -d" " -f4 | tr -d ":"; done`;

        const { stdout } = await execAsync(command);
        const ips = stdout.split("\n").filter(Boolean);

        console.log(
          `Found ${ips.length} devices on network ${network.prefix}.0/24`,
        );

        // Add discovered devices
        for (const ip of ips) {
          const cleanIp = ip.trim();
          if (cleanIp && !networkDevices.some((d) => d.ip === cleanIp)) {
            networkDevices.push({
              ip: cleanIp,
              name: `Device at ${cleanIp}`,
              type: "unknown",
              lastSeen: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error(`Error scanning network ${network.prefix}.0/24:`, err);
      }
    }

    // Convert network devices to app format
    discoveredDevices = networkDevices.map((device, index) => ({
      deviceId: `network-${index}`,
      name: device.name,
      type: "network",
      status: "Online",
      isActive: true,
      details: {
        ip: device.ip,
        lastSeen: device.lastSeen,
      },
    }));

    console.log(`Discovered ${discoveredDevices.length} network devices`);
    return discoveredDevices;
  } catch (error) {
    console.error("Error discovering network devices:", error);
    return [];
  }
}

// Process schedule file
async function processScheduleFile(filePath) {
  const fileExt = path.extname(filePath).toLowerCase();

  try {
    if (fileExt === ".csv") {
      return await processCSVSchedule(filePath);
    } else if (fileExt === ".ics") {
      return await processICSSchedule(filePath);
    } else if (fileExt === ".json") {
      return await processJSONSchedule(filePath);
    } else {
      throw new Error("Unsupported file format");
    }
  } catch (error) {
    console.error("Error processing schedule file:", error);
    throw error;
  }
}

// Process CSV schedule
function processCSVSchedule(filePath) {
  return new Promise((resolve, reject) => {
    const events = [];

    parseFile(filePath, { headers: true })
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        events.push({
          title: row.title || row.subject || row.name || "Untitled Event",
          start: row.start || row.startTime || row.startDate || row.date,
          end: row.end || row.endTime || row.endDate || "",
          location: row.location || "",
          description: row.description || row.notes || "",
        });
      })
      .on("end", () => resolve(events));
  });
}

// Process ICS schedule
async function processICSSchedule(filePath) {
  const events = [];
  const icsEvents = await ical.parseFile(filePath);

  Object.values(icsEvents).forEach((event) => {
    if (event.type === "VEVENT") {
      events.push({
        title: event.summary || "Untitled Event",
        start: event.start ? moment(event.start).format() : "",
        end: event.end ? moment(event.end).format() : "",
        location: event.location || "",
        description: event.description || "",
      });
    }
  });

  return events;
}

// Process JSON schedule
async function processJSONSchedule(filePath) {
  const data = await fs.promises.readFile(filePath, "utf8");
  const jsonData = JSON.parse(data);

  // Handle different JSON formats
  if (Array.isArray(jsonData)) {
    return jsonData.map((event) => ({
      title: event.title || event.subject || event.name || "Untitled Event",
      start: event.start || event.startTime || event.startDate || event.date,
      end: event.end || event.endTime || event.endDate || "",
      location: event.location || "",
      description: event.description || event.notes || "",
    }));
  } else if (jsonData.events && Array.isArray(jsonData.events)) {
    return jsonData.events.map((event) => ({
      title: event.title || event.subject || event.name || "Untitled Event",
      start: event.start || event.startTime || event.startDate || event.date,
      end: event.end || event.endTime || event.endDate || "",
      location: event.location || "",
      description: event.description || event.notes || "",
    }));
  } else {
    throw new Error("Invalid JSON format");
  }
}

// Get upcoming events
function getUpcomingEvents() {
  const now = moment();

  return userSchedule
    .filter((event) => {
      const eventStart = moment(event.start);
      return eventStart.isValid() && eventStart.isAfter(now);
    })
    .sort((a, b) => moment(a.start).diff(moment(b.start)))
    .slice(0, 5);
}

// Get today's events
function getTodayEvents() {
  const now = moment();
  const startOfDay = moment().startOf("day");
  const endOfDay = moment().endOf("day");

  return userSchedule
    .filter((event) => {
      const eventStart = moment(event.start);
      return (
        eventStart.isValid() &&
        eventStart.isSameOrAfter(startOfDay) &&
        eventStart.isSameOrBefore(endOfDay)
      );
    })
    .sort((a, b) => moment(a.start).diff(moment(b.start)));
}

// Generate empathetic response
function generateEmpatheticResponse(input) {
  // Store in conversation history
  conversationHistory.push({ role: "user", content: input });

  // Simple response generation based on keywords
  let response = "";
  const lowerInput = input.toLowerCase();

  // Check for greetings
  if (
    lowerInput.includes("hello") ||
    lowerInput.includes("hi ") ||
    lowerInput === "hi"
  ) {
    response = `Hello ${userPreferences.name}! It's great to hear from you. How are you feeling today?`;
  }
  // Check for how are you
  else if (lowerInput.includes("how are you")) {
    response =
      "I'm doing well, thanks for asking! I'm here to help make your day easier. What can I assist you with?";
  }
  // Check for schedule related queries
  else if (
    lowerInput.includes("schedule") ||
    lowerInput.includes("calendar") ||
    lowerInput.includes("events")
  ) {
    const todayEvents = getTodayEvents();
    if (todayEvents.length > 0) {
      response = `I see you have ${todayEvents.length} events today. Your next event is "${todayEvents[0].title}" ${moment(todayEvents[0].start).format("h:mm A")}. Would you like me to tell you more about your schedule?`;
    } else {
      response =
        "You don't have any events scheduled for today. Looks like you have some free time!";
    }
  }
  // Check for time related queries
  else if (lowerInput.includes("time")) {
    response = `The current time is ${moment().format("h:mm A")}. Is there anything specific you need to know about your schedule?`;
  }
  // Check for feeling queries
  else if (
    lowerInput.includes("feel") ||
    lowerInput.includes("sad") ||
    lowerInput.includes("happy") ||
    lowerInput.includes("tired")
  ) {
    if (lowerInput.includes("sad")) {
      response =
        "I'm sorry to hear you're feeling down. Remember that it's okay to have off days. Would you like me to play some uplifting music or schedule some self-care time for you?";
    } else if (lowerInput.includes("happy")) {
      response =
        "I'm so glad you're feeling good today! Your positive energy is contagious. Anything special planned that's got you in such a good mood?";
    } else if (lowerInput.includes("tired")) {
      response =
        "Being tired can be tough. Maybe you could use a short break? Your next free time block is at 3 PM. Should I schedule a 15-minute rest period?";
    } else {
      response =
        "I care about how you're feeling. Would you like to talk more about it?";
    }
  }
  // Check for help queries
  else if (
    lowerInput.includes("help") ||
    lowerInput.includes("what can you do")
  ) {
    response =
      "I'm here to help you manage your schedule, control your smart devices, and be a supportive friend. You can ask me about your calendar, set reminders, or just chat if you need someone to talk to. What would you like help with today?";
  }
  // Default response
  else {
    response =
      "I'm here for you. Tell me more about what's on your mind, or if you need help with your schedule or devices.";
  }

  // Store response in conversation history
  conversationHistory.push({ role: "assistant", content: response });

  return response;
}

// API routes
app.get("/api/devices", async (req, res) => {
  try {
    // Try to discover real devices
    await discoverNetworkDevices();

    // If no real devices found, add mock devices
    if (discoveredDevices.length === 0) {
      // Add network devices
      discoveredDevices = [
        {
          deviceId: "network-router",
          name: "WiFi Router",
          type: "network",
          status: "Online",
          isActive: true,
          details: {
            manufacturer: "Netgear",
            model: "Nighthawk",
            ip: "192.168.1.1",
            lastSeen: new Date().toISOString(),
          },
        },
        {
          deviceId: "network-pc",
          name: "Desktop PC",
          type: "computer",
          status: "Online",
          isActive: true,
          details: {
            ip: "192.168.1.120",
            lastSeen: new Date().toISOString(),
          },
        },
      ];

      // Add mock smart home devices
      discoveredDevices = [...discoveredDevices, ...mockDevices];
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
  // Return mock scenes
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
  // Return mock automations
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
  // Return mock insights
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

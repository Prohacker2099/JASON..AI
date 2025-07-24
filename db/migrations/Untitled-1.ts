/**
 * JASON - The Omnipotent AI Architect
 *
 * Main server entry point.
 */

import express from "express";
import http from "http";
import WebSocket from "ws";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { Logger } from "./services/logger.js";
import apiRouter from "./routes/api.js";

// Import services
import deviceManager from "./services/mvp/deviceManager.js";
import deviceDiscovery from "./services/mvp/deviceDiscovery.js";
import localAI from "./services/localAI.js";
import automationEngine from "./services/automationEngine.js";
import sceneManager from "./services/sceneManager.js";

// Optional services (Phase 2 and 3)
import patternRecognition from "./services/patternRecognition.js";
import dataVault from "./services/dataVault.js";

// Voice assistant integrations
import hueEmulation from "./services/hueEmulation.js";
import matterBridge from "./services/matterBridge.js";
import voiceAssistantToken from "./services/voiceAssistantToken.js";

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger("Server");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api", apiRouter);

// Main route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// WebSocket connection handler
wss.on("connection", (ws) => {
  logger.info("Client connected to WebSocket");

  // Send initial device list
  const devices = deviceManager.getAllDevices();
  ws.send(
    JSON.stringify({
      type: "deviceList",
      devices,
    }),
  );

  // Handle messages from client
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "startDiscovery":
          await deviceManager.startDiscovery();
          break;

        case "stopDiscovery":
          deviceManager.stopDiscovery();
          break;

        case "controlDevice":
          await deviceManager.controlDevice(data.deviceId, data.command);
          break;

        case "activateScene":
          await sceneManager.activateScene(data.sceneId);
          break;

        case "processCommand":
          const result = await localAI.processCommand(data.command);
          ws.send(
            JSON.stringify({
              type: "commandResult",
              result,
            }),
          );
          break;

        default:
          logger.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      logger.error("Error handling WebSocket message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Failed to process message",
        }),
      );
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    logger.info("Client disconnected from WebSocket");
  });
});

// Initialize services
deviceDiscovery
  .startDiscovery()
  .then((devices) => {
    logger.info(`Discovered ${devices.length} devices`);
  })
  .catch((error) => {
    logger.error("Error during initial device discovery:", error);
  });

localAI
  .initialize()
  .then((success) => {
    if (success) {
      logger.log("Local AI initialized successfully");
    } else {
      console.error("Failed to initialize Local AI");
    }
  })
  .catch((error) => {
    console.error("Error initializing Local AI:", error);
  });

automationEngine
  .initialize()
  .then((success) => {
    if (success) {
      console.log("Automation engine initialized successfully");
    } else {
      console.error("Failed to initialize automation engine");
    }
  })
  .catch((error) => {
    console.error("Error initializing automation engine:", error);
  });

sceneManager
  .initialize()
  .then((success) => {
    if (success) {
      console.log("Scene manager initialized successfully");
    } else {
      console.error("Failed to initialize scene manager");
    }
  })
  .catch((error) => {
    console.error("Error initializing scene manager:", error);
  });

// Initialize Phase 2 services
if (process.env.ENABLE_PHASE_2 === "true") {
  patternRecognition
    .initialize()
    .then((success) => {
      if (success) {
        console.log("Pattern recognition service initialized successfully");
      } else {
        console.error("Failed to initialize pattern recognition service");
      }
    })
    .catch((error) => {
      console.error("Error initializing pattern recognition service:", error);
    });
}

// Initialize Phase 3 services
if (process.env.ENABLE_PHASE_3 === "true") {
  dataVault
    .initialize()
    .then((success) => {
      if (success) {
        console.log("Data vault initialized successfully");
      } else {
        console.error("Failed to initialize data vault");
      }
    })
    .catch((error) => {
      console.error("Error initializing data vault:", error);
    });
}

// Initialize voice assistant integrations if enabled
if (process.env.ENABLE_HUE_EMULATION === "true") {
  hueEmulation
    .initialize()
    .then((success) => {
      if (success) {
        console.log("Hue emulation initialized successfully");
      } else {
        console.error("Failed to initialize Hue emulation");
      }
    })
    .catch((error) => {
      console.error("Error initializing Hue emulation:", error);
    });
}

if (process.env.ENABLE_MATTER_BRIDGE === "true") {
  matterBridge
    .initialize()
    .then((success) => {
      if (success) {
        console.log("Matter bridge initialized successfully");
      } else {
        console.error("Failed to initialize Matter bridge");
      }
    })
    .catch((error) => {
      console.error("Error initializing Matter bridge:", error);
    });
}

if (process.env.ENABLE_TOKEN_INTEGRATION === "true") {
  voiceAssistantToken.initialize();
}

// Start server
server.listen(PORT, () => {
  console.log(`JASON server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Handle device state changes
deviceManager.on("deviceStateChanged", (device) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "deviceStateChanged",
          device,
        }),
      );
    }
  });

  // Update device in Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    hueEmulation.updateDevice(device);
  }

  // Update device in Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    matterBridge.updateDevice(device);
  }

  // Record device activity for pattern recognition (Phase 2)
  if (
    process.env.ENABLE_PHASE_2 === "true" &&
    device.lastControlSource === "user"
  ) {
    patternRecognition
      .recordUserActivity({
        userId: "default", // In MVP we use default user
        deviceId: device.id,
        action: JSON.stringify(device.state),
        timestamp: new Date().toISOString(),
      })
      .catch((error) => {
        console.error("Error recording user activity:", error);
      });
  }

  // Store device state in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault
      .storeData(
        "default", // In MVP we use default user
        "device_usage",
        device.id,
        {
          state: device.state,
          source: device.lastControlSource || "unknown",
        },
      )
      .catch((error) => {
        console.error("Error storing device state in data vault:", error);
      });
  }
});

// Handle device discovery
deviceManager.on("deviceDiscovered", (device) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "deviceDiscovered",
          device,
        }),
      );
    }
  });

  // Add device to Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    hueEmulation.addDevice(device);
  }

  // Add device to Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    matterBridge.addDevice(device);
  }
});

// Handle device removal
deviceManager.on("deviceRemoved", (deviceId) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "deviceRemoved",
          deviceId,
        }),
      );
    }
  });

  // Remove device from Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    hueEmulation.removeDevice(deviceId);
  }

  // Remove device from Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    matterBridge.removeDevice(deviceId);
  }
});

// Handle automation events
automationEngine.on("automationExecuted", (automation) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "automationExecuted",
          automation,
        }),
      );
    }
  });

  // Record automation execution in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault
      .storeData("default", "behavior", "automation", {
        automationId: automation.id,
        name: automation.name,
        actions: automation.actions,
      })
      .catch((error) => {
        console.error(
          "Error storing automation execution in data vault:",
          error,
        );
      });
  }
});

// Handle scene events
sceneManager.on("sceneActivated", (scene) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "sceneActivated",
          scene,
        }),
      );
    }
  });

  // Record scene activation in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault
      .storeData("default", "behavior", "scene", {
        sceneId: scene.id,
        name: scene.name,
      })
      .catch((error) => {
        console.error("Error storing scene activation in data vault:", error);
      });
  }
});

// Handle pattern events (Phase 2)
if (process.env.ENABLE_PHASE_2 === "true") {
  patternRecognition.on("patternDiscovered", (pattern) => {
    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "patternDiscovered",
            pattern,
          }),
        );
      }
    });

    // Generate automation suggestion
    const suggestions = patternRecognition.generateAutomationSuggestions();
    const relevantSuggestion = suggestions.find((s) =>
      s.id.includes(pattern.id),
    );

    if (relevantSuggestion) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "automationSuggestion",
              suggestion: relevantSuggestion,
            }),
          );
        }
      });
    }

    // Store pattern in data vault (Phase 3)
    if (process.env.ENABLE_PHASE_3 === "true") {
      dataVault
        .storeData("default", "behavior", "pattern", {
          patternId: pattern.id,
          type: pattern.type,
          description: pattern.description,
          confidence: pattern.confidence,
        })
        .catch((error) => {
          console.error("Error storing pattern in data vault:", error);
        });
    }
  });
}

// Handle data vault events (Phase 3)
if (process.env.ENABLE_PHASE_3 === "true") {
  dataVault.on("dividendRecorded", (dividend) => {
    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "dividendRecorded",
            dividend,
          }),
        );
      }
    });
  });

  dataVault.on("consentUpdated", (consent) => {
    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "consentUpdated",
            consent,
          }),
        );
      }
    });
  });
} // Handle notification events
automationEngine.on("notification", (notification) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "notification",
          notification,
        }),
      );
    }
  });

  // Store notification in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault
      .storeData("default", "behavior", "notification", {
        message: notification.message,
      })
      .catch((error) => {
        console.error("Error storing notification in data vault:", error);
      });
  }
});

// Handle errors from services
deviceManager.on("error", (error) => {
  logger.error("Device Manager Error:", error);
  // Optionally broadcast to clients
});

automationEngine.on("error", (error) => {
  logger.error("Automation Engine Error:", error);
  // Optionally broadcast to clients
});

sceneManager.on("error", (error) => {
  logger.error("Scene Manager Error:", error);
  // Optionally broadcast to clients
});

if (process.env.ENABLE_PHASE_2 === "true") {
  patternRecognition.on("error", (error) => {
    logger.error("Pattern Recognition Error:", error);
    // Optionally broadcast to clients
  });
}

if (process.env.ENABLE_PHASE_3 === "true") {
  dataVault.on("error", (error) => {
    logger.error("Data Vault Error:", error);
    // Optionally broadcast to clients
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    // Close WebSocket server
    wss.close(() => {
      logger.info("WebSocket server closed");
      // Stop device discovery
      deviceDiscovery.stopDiscovery();
      // Perform other cleanup if necessary
      process.exit(0);
    });
  });
}); // Added closing brace for process.on('SIGTERM')

export default server;

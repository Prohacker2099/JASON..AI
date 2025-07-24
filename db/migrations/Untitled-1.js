"use strict";
/**
 * JASON - The Omnipotent AI Architect
 *
 * Main server entry point.
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var http_1 = require("http");
var ws_1 = require("ws");
var cors_1 = require("cors");
var path_1 = require("path");
var dotenv_1 = require("dotenv");
var logger_js_1 = require("./services/logger.js");
var api_js_1 = require("./routes/api.js");
// Import services
var deviceManager_js_1 = require("./services/mvp/deviceManager.js");
var deviceDiscovery_js_1 = require("./services/mvp/deviceDiscovery.js");
var localAI_js_1 = require("./services/localAI.js");
var automationEngine_js_1 = require("./services/automationEngine.js");
var sceneManager_js_1 = require("./services/sceneManager.js");
// Optional services (Phase 2 and 3)
var patternRecognition_js_1 = require("./services/patternRecognition.js");
var dataVault_js_1 = require("./services/dataVault.js");
// Voice assistant integrations
var hueEmulation_js_1 = require("./services/hueEmulation.js");
var matterBridge_js_1 = require("./services/matterBridge.js");
var voiceAssistantToken_js_1 = require("./services/voiceAssistantToken.js");
// Load environment variables
dotenv_1.default.config();
// Initialize logger
var logger = new logger_js_1.Logger("Server");
// Create Express app
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
// Create HTTP server
var server = http_1.default.createServer(app);
// Create WebSocket server
var wss = new ws_1.default.Server({ server: server });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static files
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// API routes
app.use("/api", api_js_1.default);
// Main route
app.get("/", function (req, res) {
  res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
// WebSocket connection handler
wss.on("connection", function (ws) {
  logger.info("Client connected to WebSocket");
  // Send initial device list
  var devices = deviceManager_js_1.default.getAllDevices();
  ws.send(
    JSON.stringify({
      type: "deviceList",
      devices: devices,
    }),
  );
  // Handle messages from client
  ws.on("message", function (message) {
    return __awaiter(void 0, void 0, void 0, function () {
      var data, _a, result, error_1;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 12, , 13]);
            data = JSON.parse(message.toString());
            _a = data.type;
            switch (_a) {
              case "startDiscovery":
                return [3 /*break*/, 1];
              case "stopDiscovery":
                return [3 /*break*/, 3];
              case "controlDevice":
                return [3 /*break*/, 4];
              case "activateScene":
                return [3 /*break*/, 6];
              case "processCommand":
                return [3 /*break*/, 8];
            }
            return [3 /*break*/, 10];
          case 1:
            return [4 /*yield*/, deviceManager_js_1.default.startDiscovery()];
          case 2:
            _b.sent();
            return [3 /*break*/, 11];
          case 3:
            deviceManager_js_1.default.stopDiscovery();
            return [3 /*break*/, 11];
          case 4:
            return [
              4 /*yield*/,
              deviceManager_js_1.default.controlDevice(
                data.deviceId,
                data.command,
              ),
            ];
          case 5:
            _b.sent();
            return [3 /*break*/, 11];
          case 6:
            return [
              4 /*yield*/,
              sceneManager_js_1.default.activateScene(data.sceneId),
            ];
          case 7:
            _b.sent();
            return [3 /*break*/, 11];
          case 8:
            return [
              4 /*yield*/,
              localAI_js_1.default.processCommand(data.command),
            ];
          case 9:
            result = _b.sent();
            ws.send(
              JSON.stringify({
                type: "commandResult",
                result: result,
              }),
            );
            return [3 /*break*/, 11];
          case 10:
            logger.warn("Unknown message type: ".concat(data.type));
            _b.label = 11;
          case 11:
            return [3 /*break*/, 13];
          case 12:
            error_1 = _b.sent();
            logger.error("Error handling WebSocket message:", error_1);
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Failed to process message",
              }),
            );
            return [3 /*break*/, 13];
          case 13:
            return [2 /*return*/];
        }
      });
    });
  });
  // Handle disconnection
  ws.on("close", function () {
    logger.info("Client disconnected from WebSocket");
  });
});
// Initialize services
deviceDiscovery_js_1.default
  .startDiscovery()
  .then(function (devices) {
    logger.info("Discovered ".concat(devices.length, " devices"));
  })
  .catch(function (error) {
    logger.error("Error during initial device discovery:", error);
  });
localAI_js_1.default
  .initialize()
  .then(function (success) {
    if (success) {
      logger.log("Local AI initialized successfully");
    } else {
      console.error("Failed to initialize Local AI");
    }
  })
  .catch(function (error) {
    console.error("Error initializing Local AI:", error);
  });
automationEngine_js_1.default
  .initialize()
  .then(function (success) {
    if (success) {
      console.log("Automation engine initialized successfully");
    } else {
      console.error("Failed to initialize automation engine");
    }
  })
  .catch(function (error) {
    console.error("Error initializing automation engine:", error);
  });
sceneManager_js_1.default
  .initialize()
  .then(function (success) {
    if (success) {
      console.log("Scene manager initialized successfully");
    } else {
      console.error("Failed to initialize scene manager");
    }
  })
  .catch(function (error) {
    console.error("Error initializing scene manager:", error);
  });
// Initialize Phase 2 services
if (process.env.ENABLE_PHASE_2 === "true") {
  patternRecognition_js_1.default
    .initialize()
    .then(function (success) {
      if (success) {
        console.log("Pattern recognition service initialized successfully");
      } else {
        console.error("Failed to initialize pattern recognition service");
      }
    })
    .catch(function (error) {
      console.error("Error initializing pattern recognition service:", error);
    });
}
// Initialize Phase 3 services
if (process.env.ENABLE_PHASE_3 === "true") {
  dataVault_js_1.default
    .initialize()
    .then(function (success) {
      if (success) {
        console.log("Data vault initialized successfully");
      } else {
        console.error("Failed to initialize data vault");
      }
    })
    .catch(function (error) {
      console.error("Error initializing data vault:", error);
    });
}
// Initialize voice assistant integrations if enabled
if (process.env.ENABLE_HUE_EMULATION === "true") {
  hueEmulation_js_1.default
    .initialize()
    .then(function (success) {
      if (success) {
        console.log("Hue emulation initialized successfully");
      } else {
        console.error("Failed to initialize Hue emulation");
      }
    })
    .catch(function (error) {
      console.error("Error initializing Hue emulation:", error);
    });
}
if (process.env.ENABLE_MATTER_BRIDGE === "true") {
  matterBridge_js_1.default
    .initialize()
    .then(function (success) {
      if (success) {
        console.log("Matter bridge initialized successfully");
      } else {
        console.error("Failed to initialize Matter bridge");
      }
    })
    .catch(function (error) {
      console.error("Error initializing Matter bridge:", error);
    });
}
if (process.env.ENABLE_TOKEN_INTEGRATION === "true") {
  voiceAssistantToken_js_1.default.initialize();
}
// Start server
server.listen(PORT, function () {
  console.log("JASON server running on port ".concat(PORT));
  console.log("http://localhost:".concat(PORT));
});
// Handle device state changes
deviceManager_js_1.default.on("deviceStateChanged", function (device) {
  // Broadcast to all connected clients
  wss.clients.forEach(function (client) {
    if (client.readyState === ws_1.default.OPEN) {
      client.send(
        JSON.stringify({
          type: "deviceStateChanged",
          device: device,
        }),
      );
    }
  });
  // Update device in Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    hueEmulation_js_1.default.updateDevice(device);
  }
  // Update device in Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    matterBridge_js_1.default.updateDevice(device);
  }
  // Record device activity for pattern recognition (Phase 2)
  if (
    process.env.ENABLE_PHASE_2 === "true" &&
    device.lastControlSource === "user"
  ) {
    patternRecognition_js_1.default
      .recordUserActivity({
        userId: "default", // In MVP we use default user
        deviceId: device.id,
        action: JSON.stringify(device.state),
        timestamp: new Date().toISOString(),
      })
      .catch(function (error) {
        console.error("Error recording user activity:", error);
      });
  }
  // Store device state in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault_js_1.default
      .storeData(
        "default", // In MVP we use default user
        "device_usage",
        device.id,
        {
          state: device.state,
          source: device.lastControlSource || "unknown",
        },
      )
      .catch(function (error) {
        console.error("Error storing device state in data vault:", error);
      });
  }
});
// Handle device discovery
deviceManager_js_1.default.on("deviceDiscovered", function (device) {
  // Broadcast to all connected clients
  wss.clients.forEach(function (client) {
    if (client.readyState === ws_1.default.OPEN) {
      client.send(
        JSON.stringify({
          type: "deviceDiscovered",
          device: device,
        }),
      );
    }
  });
  // Add device to Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    hueEmulation_js_1.default.addDevice(device);
  }
  // Add device to Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    matterBridge_js_1.default.addDevice(device);
  }
});
// Handle device removal
deviceManager_js_1.default.on("deviceRemoved", function (deviceId) {
  // Broadcast to all connected clients
  wss.clients.forEach(function (client) {
    if (client.readyState === ws_1.default.OPEN) {
      client.send(
        JSON.stringify({
          type: "deviceRemoved",
          deviceId: deviceId,
        }),
      );
    }
  });
  // Remove device from Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    hueEmulation_js_1.default.removeDevice(deviceId);
  }
  // Remove device from Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    matterBridge_js_1.default.removeDevice(deviceId);
  }
});
// Handle automation events
automationEngine_js_1.default.on("automationExecuted", function (automation) {
  // Broadcast to all connected clients
  wss.clients.forEach(function (client) {
    if (client.readyState === ws_1.default.OPEN) {
      client.send(
        JSON.stringify({
          type: "automationExecuted",
          automation: automation,
        }),
      );
    }
  });
  // Record automation execution in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault_js_1.default
      .storeData("default", "behavior", "automation", {
        automationId: automation.id,
        name: automation.name,
        actions: automation.actions,
      })
      .catch(function (error) {
        console.error(
          "Error storing automation execution in data vault:",
          error,
        );
      });
  }
});
// Handle scene events
sceneManager_js_1.default.on("sceneActivated", function (scene) {
  // Broadcast to all connected clients
  wss.clients.forEach(function (client) {
    if (client.readyState === ws_1.default.OPEN) {
      client.send(
        JSON.stringify({
          type: "sceneActivated",
          scene: scene,
        }),
      );
    }
  });
  // Record scene activation in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault_js_1.default
      .storeData("default", "behavior", "scene", {
        sceneId: scene.id,
        name: scene.name,
      })
      .catch(function (error) {
        console.error("Error storing scene activation in data vault:", error);
      });
  }
});
// Handle pattern events (Phase 2)
if (process.env.ENABLE_PHASE_2 === "true") {
  patternRecognition_js_1.default.on("patternDiscovered", function (pattern) {
    // Broadcast to all connected clients
    wss.clients.forEach(function (client) {
      if (client.readyState === ws_1.default.OPEN) {
        client.send(
          JSON.stringify({
            type: "patternDiscovered",
            pattern: pattern,
          }),
        );
      }
    });
    // Generate automation suggestion
    var suggestions =
      patternRecognition_js_1.default.generateAutomationSuggestions();
    var relevantSuggestion = suggestions.find(function (s) {
      return s.id.includes(pattern.id);
    });
    if (relevantSuggestion) {
      wss.clients.forEach(function (client) {
        if (client.readyState === ws_1.default.OPEN) {
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
      dataVault_js_1.default
        .storeData("default", "behavior", "pattern", {
          patternId: pattern.id,
          type: pattern.type,
          description: pattern.description,
          confidence: pattern.confidence,
        })
        .catch(function (error) {
          console.error("Error storing pattern in data vault:", error);
        });
    }
  });
}
// Handle data vault events (Phase 3)
if (process.env.ENABLE_PHASE_3 === "true") {
  dataVault_js_1.default.on("dividendRecorded", function (dividend) {
    // Broadcast to all connected clients
    wss.clients.forEach(function (client) {
      if (client.readyState === ws_1.default.OPEN) {
        client.send(
          JSON.stringify({
            type: "dividendRecorded",
            dividend: dividend,
          }),
        );
      }
    });
  });
  dataVault_js_1.default.on("consentUpdated", function (consent) {
    // Broadcast to all connected clients
    wss.clients.forEach(function (client) {
      if (client.readyState === ws_1.default.OPEN) {
        client.send(
          JSON.stringify({
            type: "consentUpdated",
            consent: consent,
          }),
        );
      }
    });
  });
} // Handle notification events
automationEngine_js_1.default.on("notification", function (notification) {
  // Broadcast to all connected clients
  wss.clients.forEach(function (client) {
    if (client.readyState === ws_1.default.OPEN) {
      client.send(
        JSON.stringify({
          type: "notification",
          notification: notification,
        }),
      );
    }
  });
  // Store notification in data vault (Phase 3)
  if (process.env.ENABLE_PHASE_3 === "true") {
    dataVault_js_1.default
      .storeData("default", "behavior", "notification", {
        message: notification.message,
      })
      .catch(function (error) {
        console.error("Error storing notification in data vault:", error);
      });
  }
});
// Handle errors from services
deviceManager_js_1.default.on("error", function (error) {
  logger.error("Device Manager Error:", error);
  // Optionally broadcast to clients
});
automationEngine_js_1.default.on("error", function (error) {
  logger.error("Automation Engine Error:", error);
  // Optionally broadcast to clients
});
sceneManager_js_1.default.on("error", function (error) {
  logger.error("Scene Manager Error:", error);
  // Optionally broadcast to clients
});
if (process.env.ENABLE_PHASE_2 === "true") {
  patternRecognition_js_1.default.on("error", function (error) {
    logger.error("Pattern Recognition Error:", error);
    // Optionally broadcast to clients
  });
}
if (process.env.ENABLE_PHASE_3 === "true") {
  dataVault_js_1.default.on("error", function (error) {
    logger.error("Data Vault Error:", error);
    // Optionally broadcast to clients
  });
}
// Graceful shutdown
process.on("SIGTERM", function () {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(function () {
    logger.info("HTTP server closed");
    // Close WebSocket server
    wss.close(function () {
      logger.info("WebSocket server closed");
      // Stop device discovery
      deviceDiscovery_js_1.default.stopDiscovery();
      // Perform other cleanup if necessary
      process.exit(0);
    });
  });
}); // Added closing brace for process.on('SIGTERM')
exports.default = server;

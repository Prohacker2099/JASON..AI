/**
 * JASON - The Omnipotent AI Architect
 * Enhanced Server Implementation
 *
 * This server provides real-time communication with smart home devices
 * and integrates with various APIs for enhanced functionality.
 */

import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import axios from "axios";
import { createClient } from "redis";
import { NlpManager } from "node-nlp";
import { exec } from "child_process";
import { promisify } from "util";

// File path setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  port: process.env.PORT || 3000,
  dataDir: path.join(__dirname, "data"),
  deviceDiscoveryInterval: 60000, // 1 minute
  weatherApiKey: process.env.WEATHER_API_KEY || "demo_key",
  useRedisCache: process.env.USE_REDIS === "true",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  logLevel: process.env.LOG_LEVEL || "info",
};

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Device integration modules
const deviceIntegrations = {
  // These would be actual implementations in a production system
  hue: null,
  smartthings: null,
  homekit: null,
  zwave: null,
  zigbee: null,
};

// State management
let devices = [];
let scenes = [];
let automations = [];
let patterns = [];
let clients = new Set();
let deviceStates = new Map();
let sceneStates = new Map();
let automationStates = new Map();

// Initialize NLP manager for voice commands
const nlpManager = new NlpManager({ languages: ["en"] });

// Redis client for caching (optional)
let redisClient = null;

/**
 * Initialize the server
 */
async function initServer() {
  console.log("Initializing JASON server...");

  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(config.dataDir, { recursive: true });

    // Load saved data
    await loadData();

    // Initialize device integrations
    await initDeviceIntegrations();

    // Initialize NLP for voice commands
    await initNLP();

    // Initialize Redis if enabled
    if (config.useRedisCache) {
      await initRedis();
    }

    // Start device discovery
    scheduleDeviceDiscovery();

    console.log("JASON server initialized successfully");
  } catch (error) {
    console.error("Error initializing server:", error);
  }
}

/**
 * Initialize device integrations
 */
async function initDeviceIntegrations() {
  console.log("Initializing device integrations...");

  // In a real implementation, these would be actual integrations
  // For now, we'll use mock implementations

  // Mock Philips Hue integration
  deviceIntegrations.hue = {
    discover: async () => {
      console.log("Discovering Hue devices...");
      return [
        {
          id: "hue-1",
          name: "Living Room Light",
          type: "light",
          manufacturer: "Philips Hue",
          model: "White and Color Ambiance",
          connected: true,
          state: {
            power: false,
            brightness: 100,
            color: { h: 240, s: 100, v: 100 },
          },
          capabilities: ["power", "brightness", "color"],
        },
        {
          id: "hue-2",
          name: "Kitchen Light",
          type: "light",
          manufacturer: "Philips Hue",
          model: "White Ambiance",
          connected: true,
          state: {
            power: false,
            brightness: 100,
            temperature: 4000,
          },
          capabilities: ["power", "brightness", "temperature"],
        },
      ];
    },
    control: async (deviceId, command) => {
      console.log(`Controlling Hue device ${deviceId}:`, command);
      return { success: true };
    },
  };

  // Mock SmartThings integration
  deviceIntegrations.smartthings = {
    discover: async () => {
      console.log("Discovering SmartThings devices...");
      return [
        {
          id: "st-1",
          name: "Living Room Thermostat",
          type: "thermostat",
          manufacturer: "Ecobee",
          model: "SmartThermostat",
          connected: true,
          state: {
            power: true,
            temperature: 72,
            mode: "heat",
            targetTemperature: 70,
          },
          capabilities: ["power", "temperature", "mode"],
        },
        {
          id: "st-2",
          name: "Front Door Lock",
          type: "lock",
          manufacturer: "August",
          model: "Smart Lock Pro",
          connected: true,
          state: {
            locked: true,
            battery: 85,
          },
          capabilities: ["lock", "battery"],
        },
      ];
    },
    control: async (deviceId, command) => {
      console.log(`Controlling SmartThings device ${deviceId}:`, command);
      return { success: true };
    },
  };

  // Mock HomeKit integration
  deviceIntegrations.homekit = {
    discover: async () => {
      console.log("Discovering HomeKit devices...");
      return [
        {
          id: "homekit-1",
          name: "Living Room Camera",
          type: "camera",
          manufacturer: "Logitech",
          model: "Circle View",
          connected: true,
          state: {
            power: true,
            recording: false,
            motion: false,
          },
          capabilities: ["power", "recording", "motion"],
        },
      ];
    },
    control: async (deviceId, command) => {
      console.log(`Controlling HomeKit device ${deviceId}:`, command);
      return { success: true };
    },
  };

  // Mock Z-Wave integration
  deviceIntegrations.zwave = {
    discover: async () => {
      console.log("Discovering Z-Wave devices...");
      return [
        {
          id: "zwave-1",
          name: "Bedroom Light",
          type: "light",
          manufacturer: "GE",
          model: "Z-Wave Dimmer",
          connected: true,
          state: {
            power: false,
            brightness: 80,
          },
          capabilities: ["power", "brightness"],
        },
      ];
    },
    control: async (deviceId, command) => {
      console.log(`Controlling Z-Wave device ${deviceId}:`, command);
      return { success: true };
    },
  };

  // Mock Zigbee integration
  deviceIntegrations.zigbee = {
    discover: async () => {
      console.log("Discovering Zigbee devices...");
      return [
        {
          id: "zigbee-1",
          name: "Motion Sensor",
          type: "sensor",
          manufacturer: "Aqara",
          model: "Motion Sensor",
          connected: true,
          state: {
            battery: 90,
            motion: false,
            lastMotion: null,
          },
          capabilities: ["motion", "battery"],
        },
      ];
    },
    control: async (deviceId, command) => {
      console.log(`Controlling Zigbee device ${deviceId}:`, command);
      return { success: true };
    },
  };
}

/**
 * Initialize NLP for voice commands
 */
async function initNLP() {
  console.log("Initializing NLP for voice commands...");

  // Add intents and entities for device control
  nlpManager.addDocument("en", "turn on %device%", "device.power.on");
  nlpManager.addDocument("en", "turn off %device%", "device.power.off");
  nlpManager.addDocument("en", "switch on %device%", "device.power.on");
  nlpManager.addDocument("en", "switch off %device%", "device.power.off");
  nlpManager.addDocument("en", "power on %device%", "device.power.on");
  nlpManager.addDocument("en", "power off %device%", "device.power.off");

  // Brightness control
  nlpManager.addDocument(
    "en",
    "set %device% brightness to %brightness%",
    "device.brightness",
  );
  nlpManager.addDocument(
    "en",
    "dim %device% to %brightness%",
    "device.brightness",
  );
  nlpManager.addDocument(
    "en",
    "brighten %device% to %brightness%",
    "device.brightness",
  );

  // Temperature control
  nlpManager.addDocument(
    "en",
    "set %device% temperature to %temperature%",
    "device.temperature",
  );
  nlpManager.addDocument(
    "en",
    "set %device% to %temperature% degrees",
    "device.temperature",
  );

  // Scene activation
  nlpManager.addDocument("en", "activate %scene% scene", "scene.activate");
  nlpManager.addDocument("en", "turn on %scene% scene", "scene.activate");
  nlpManager.addDocument("en", "start %scene% scene", "scene.activate");

  // Weather queries
  nlpManager.addDocument("en", "what is the weather", "weather.query");
  nlpManager.addDocument(
    "en",
    "what is the weather in %location%",
    "weather.query",
  );
  nlpManager.addDocument("en", "weather forecast", "weather.query");
  nlpManager.addDocument(
    "en",
    "weather forecast for %location%",
    "weather.query",
  );

  // Time queries
  nlpManager.addDocument("en", "what time is it", "time.query");
  nlpManager.addDocument("en", "what is the time", "time.query");
  nlpManager.addDocument("en", "what day is it", "time.query.day");
  nlpManager.addDocument("en", "what is the date", "time.query.date");

  // Add entities
  nlpManager.addNamedEntityText(
    "device",
    "living room light",
    ["en"],
    ["living room light", "living room lights", "living room lamp"],
  );
  nlpManager.addNamedEntityText(
    "device",
    "kitchen light",
    ["en"],
    ["kitchen light", "kitchen lights", "kitchen lamp"],
  );
  nlpManager.addNamedEntityText(
    "device",
    "bedroom light",
    ["en"],
    ["bedroom light", "bedroom lights", "bedroom lamp"],
  );
  nlpManager.addNamedEntityText(
    "device",
    "thermostat",
    ["en"],
    ["thermostat", "temperature", "heating", "cooling"],
  );

  nlpManager.addNamedEntityText(
    "scene",
    "movie night",
    ["en"],
    ["movie night", "movie", "movie time"],
  );
  nlpManager.addNamedEntityText(
    "scene",
    "good morning",
    ["en"],
    ["good morning", "morning", "wake up"],
  );
  nlpManager.addNamedEntityText(
    "scene",
    "good night",
    ["en"],
    ["good night", "night", "sleep"],
  );

  nlpManager.addNamedEntityText(
    "location",
    "new york",
    ["en"],
    ["new york", "nyc", "new york city"],
  );
  nlpManager.addNamedEntityText(
    "location",
    "los angeles",
    ["en"],
    ["los angeles", "la", "lax"],
  );
  nlpManager.addNamedEntityText(
    "location",
    "chicago",
    ["en"],
    ["chicago", "chi"],
  );

  // Add regex entities
  nlpManager.addRegexEntity("brightness", "en", /([0-9]{1,3})(%| percent)/);
  nlpManager.addRegexEntity(
    "temperature",
    "en",
    /([0-9]{1,2})(°|degrees| degrees)/,
  );

  // Train the model
  await nlpManager.train();
  console.log("NLP model trained successfully");
}

/**
 * Initialize Redis for caching
 */
async function initRedis() {
  try {
    console.log("Initializing Redis cache...");
    redisClient = createClient({ url: config.redisUrl });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });

    await redisClient.connect();
    console.log("Redis cache initialized successfully");
  } catch (error) {
    console.error("Error initializing Redis:", error);
    config.useRedisCache = false;
  }
}

/**
 * Load saved data from disk
 */
async function loadData() {
  try {
    console.log("Loading saved data...");

    // Load devices
    try {
      const devicesData = await fs.readFile(
        path.join(config.dataDir, "devices.json"),
        "utf8",
      );
      devices = JSON.parse(devicesData);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      devices = [];
    }

    // Load scenes
    try {
      const scenesData = await fs.readFile(
        path.join(config.dataDir, "scenes.json"),
        "utf8",
      );
      scenes = JSON.parse(scenesData);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      scenes = [];
    }

    // Load automations
    try {
      const automationsData = await fs.readFile(
        path.join(config.dataDir, "automations.json"),
        "utf8",
      );
      automations = JSON.parse(automationsData);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      automations = [];
    }

    // Load patterns
    try {
      const patternsData = await fs.readFile(
        path.join(config.dataDir, "patterns.json"),
        "utf8",
      );
      patterns = JSON.parse(patternsData);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      patterns = [];
    }

    console.log(
      `Loaded ${devices.length} devices, ${scenes.length} scenes, ${automations.length} automations, and ${patterns.length} patterns`,
    );
  } catch (error) {
    console.error("Error loading data:", error);

    // Initialize with default data if loading fails
    devices = [];
    scenes = [
      {
        id: "scene-1",
        name: "Movie Night",
        description: "Dim lights and set temperature for movie watching",
        devices: ["hue-1", "st-1"],
        actions: [
          { deviceId: "hue-1", action: "setBrightness", value: 30 },
          { deviceId: "st-1", action: "setTemperature", value: 72 },
        ],
        lastActivated: null,
      },
      {
        id: "scene-2",
        name: "Good Morning",
        description:
          "Gradually brighten lights and set comfortable temperature",
        devices: ["hue-1", "hue-2", "st-1"],
        actions: [
          { deviceId: "hue-1", action: "setPower", value: true },
          { deviceId: "hue-1", action: "setBrightness", value: 100 },
          { deviceId: "hue-2", action: "setPower", value: true },
          { deviceId: "hue-2", action: "setBrightness", value: 100 },
          { deviceId: "st-1", action: "setTemperature", value: 72 },
        ],
        lastActivated: null,
      },
      {
        id: "scene-3",
        name: "Good Night",
        description: "Turn off lights and set night temperature",
        devices: ["hue-1", "hue-2", "st-1", "st-2"],
        actions: [
          { deviceId: "hue-1", action: "setPower", value: false },
          { deviceId: "hue-2", action: "setPower", value: false },
          { deviceId: "st-1", action: "setTemperature", value: 68 },
          { deviceId: "st-2", action: "setLock", value: true },
        ],
        lastActivated: null,
      },
    ];

    automations = [
      {
        id: "auto-1",
        name: "Motion Lights",
        description: "Turn on lights when motion is detected",
        enabled: true,
        trigger: {
          type: "device",
          deviceId: "zigbee-1",
          condition: "motion",
          value: true,
        },
        actions: [{ deviceId: "hue-1", action: "setPower", value: true }],
        lastTriggered: null,
      },
      {
        id: "auto-2",
        name: "Auto Night Mode",
        description: "Activate Good Night scene at 11 PM",
        enabled: true,
        trigger: {
          type: "schedule",
          time: "23:00",
          days: [0, 1, 2, 3, 4, 5, 6], // All days
        },
        actions: [{ sceneId: "scene-3", action: "activateScene" }],
        lastTriggered: null,
      },
    ];

    patterns = [];
  }
}

/**
 * Save data to disk
 */
async function saveData() {
  try {
    console.log("Saving data...");

    await fs.writeFile(
      path.join(config.dataDir, "devices.json"),
      JSON.stringify(devices, null, 2),
    );
    await fs.writeFile(
      path.join(config.dataDir, "scenes.json"),
      JSON.stringify(scenes, null, 2),
    );
    await fs.writeFile(
      path.join(config.dataDir, "automations.json"),
      JSON.stringify(automations, null, 2),
    );
    await fs.writeFile(
      path.join(config.dataDir, "patterns.json"),
      JSON.stringify(patterns, null, 2),
    );

    console.log("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

/**
 * Schedule periodic device discovery
 */
function scheduleDeviceDiscovery() {
  console.log(
    `Scheduling device discovery every ${config.deviceDiscoveryInterval / 1000} seconds`,
  );

  // Run initial discovery
  discoverDevices();

  // Schedule periodic discovery
  setInterval(discoverDevices, config.deviceDiscoveryInterval);
}

/**
 * Discover devices from all integrations
 */
async function discoverDevices() {
  console.log("Running device discovery...");

  try {
    const newDevices = [];

    // Discover devices from each integration
    for (const [name, integration] of Object.entries(deviceIntegrations)) {
      if (integration && typeof integration.discover === "function") {
        try {
          const discoveredDevices = await integration.discover();
          newDevices.push(...discoveredDevices);
        } catch (error) {
          console.error(`Error discovering devices from ${name}:`, error);
        }
      }
    }

    // Update device list
    for (const newDevice of newDevices) {
      const existingIndex = devices.findIndex((d) => d.id === newDevice.id);

      if (existingIndex === -1) {
        // New device
        devices.push(newDevice);

        // Notify clients
        broadcastToClients({
          type: "device_discovered",
          device: newDevice,
        });
      } else {
        // Update existing device
        const oldDevice = devices[existingIndex];
        devices[existingIndex] = {
          ...oldDevice,
          ...newDevice,
          state: {
            ...oldDevice.state,
            ...newDevice.state,
          },
        };

        // Notify clients if connection status changed
        if (oldDevice.connected !== newDevice.connected) {
          broadcastToClients({
            type: "device_update",
            device: devices[existingIndex],
          });
        }
      }
    }

    // Check for devices that are no longer available
    const discoveredIds = new Set(newDevices.map((d) => d.id));
    const removedDevices = devices.filter((d) => !discoveredIds.has(d.id));

    for (const removedDevice of removedDevices) {
      // Mark as disconnected instead of removing
      const index = devices.findIndex((d) => d.id === removedDevice.id);
      if (index !== -1) {
        devices[index].connected = false;

        // Notify clients
        broadcastToClients({
          type: "device_update",
          device: devices[index],
        });
      }
    }

    // Save updated device list
    await saveData();

    console.log(
      `Device discovery complete. Found ${newDevices.length} devices.`,
    );
  } catch (error) {
    console.error("Error during device discovery:", error);
  }
}

/**
 * Control a device
 * @param {string} deviceId - The device ID
 * @param {Object} command - The command to send
 * @returns {Promise<Object>} The result
 */
async function controlDevice(deviceId, command) {
  console.log(`Controlling device ${deviceId}:`, command);

  try {
    // Find the device
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    // Determine which integration to use
    const integration = determineIntegration(device);
    if (!integration) {
      throw new Error(`No integration available for device: ${deviceId}`);
    }

    // Send command to the device
    const result = await integration.control(deviceId, command);

    // Update device state
    if (result.success) {
      // Update the device state based on the command
      updateDeviceState(device, command);

      // Notify clients
      broadcastToClients({
        type: "device_update",
        device,
      });

      // Save updated device list
      await saveData();
    }

    return result;
  } catch (error) {
    console.error(`Error controlling device ${deviceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Determine which integration to use for a device
 * @param {Object} device - The device
 * @returns {Object|null} The integration to use
 */
function determineIntegration(device) {
  // In a real implementation, this would determine the integration based on the device
  // For now, we'll use a simple mapping based on device ID prefix

  if (device.id.startsWith("hue-")) {
    return deviceIntegrations.hue;
  } else if (device.id.startsWith("st-")) {
    return deviceIntegrations.smartthings;
  } else if (device.id.startsWith("homekit-")) {
    return deviceIntegrations.homekit;
  } else if (device.id.startsWith("zwave-")) {
    return deviceIntegrations.zwave;
  } else if (device.id.startsWith("zigbee-")) {
    return deviceIntegrations.zigbee;
  }

  return null;
}

/**
 * Update a device's state based on a command
 * @param {Object} device - The device to update
 * @param {Object} command - The command that was sent
 */
function updateDeviceState(device, command) {
  if (!device.state) {
    device.state = {};
  }

  // Update state based on command
  if (command.action === "setPower") {
    device.state.power = command.value;
  } else if (command.action === "setBrightness") {
    device.state.brightness = command.value;
  } else if (command.action === "setColor") {
    device.state.color = command.value;
  } else if (command.action === "setTemperature") {
    device.state.temperature = command.value;
  } else if (command.action === "setLock") {
    device.state.locked = command.value;
  }
}

/**
 * Activate a scene
 * @param {string} sceneId - The scene ID
 * @returns {Promise<Object>} The result
 */
async function activateScene(sceneId) {
  console.log(`Activating scene ${sceneId}`);

  try {
    // Find the scene
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    // Execute each action in the scene
    const results = [];
    for (const action of scene.actions) {
      if (action.deviceId) {
        // Device action
        const result = await controlDevice(action.deviceId, {
          action: action.action,
          value: action.value,
        });
        results.push(result);
      }
    }

    // Update scene's last activated time
    scene.lastActivated = new Date().toISOString();

    // Notify clients
    broadcastToClients({
      type: "scene_activated",
      scene,
    });

    // Save updated scene list
    await saveData();

    return {
      success: results.every((r) => r.success),
      results,
    };
  } catch (error) {
    console.error(`Error activating scene ${sceneId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Process a natural language command
 * @param {string} command - The command text
 * @returns {Promise<Object>} The result
 */
async function processCommand(command) {
  console.log(`Processing command: ${command}`);

  try {
    // Use NLP to understand the command
    const result = await nlpManager.process("en", command);
    console.log("NLP result:", result);

    if (result.intent === "None" || result.score < 0.7) {
      return {
        success: false,
        content:
          "I'm not sure what you want me to do. Could you try rephrasing that?",
      };
    }

    // Handle different intents
    if (result.intent.startsWith("device.power.")) {
      // Device power control
      const powerAction = result.intent.endsWith(".on");
      const deviceEntity = result.entities.find((e) => e.entity === "device");

      if (!deviceEntity) {
        return {
          success: false,
          content: "I couldn't identify which device you want to control.",
        };
      }

      // Find the device
      const deviceName = deviceEntity.option;
      const device = devices.find(
        (d) =>
          d.name.toLowerCase() === deviceName.toLowerCase() ||
          d.name.toLowerCase().includes(deviceName.toLowerCase()),
      );

      if (!device) {
        return {
          success: false,
          content: `I couldn't find a device called "${deviceName}".`,
        };
      }

      // Control the device
      const controlResult = await controlDevice(device.id, {
        action: "setPower",
        value: powerAction,
      });

      return {
        success: controlResult.success,
        content: controlResult.success
          ? `I've turned ${powerAction ? "on" : "off"} the ${device.name}.`
          : `I couldn't turn ${powerAction ? "on" : "off"} the ${device.name}.`,
        type: "device_control",
      };
    } else if (result.intent === "device.brightness") {
      // Brightness control
      const deviceEntity = result.entities.find((e) => e.entity === "device");
      const brightnessEntity = result.entities.find(
        (e) => e.entity === "brightness",
      );

      if (!deviceEntity || !brightnessEntity) {
        return {
          success: false,
          content:
            "I couldn't understand which device or brightness level you specified.",
        };
      }

      // Find the device
      const deviceName = deviceEntity.option;
      const device = devices.find(
        (d) =>
          d.name.toLowerCase() === deviceName.toLowerCase() ||
          d.name.toLowerCase().includes(deviceName.toLowerCase()),
      );

      if (!device) {
        return {
          success: false,
          content: `I couldn't find a device called "${deviceName}".`,
        };
      }

      // Parse brightness value
      const brightnessValue = parseInt(brightnessEntity.value);

      // Control the device
      const controlResult = await controlDevice(device.id, {
        action: "setBrightness",
        value: brightnessValue,
      });

      return {
        success: controlResult.success,
        content: controlResult.success
          ? `I've set the ${device.name} brightness to ${brightnessValue}%.`
          : `I couldn't set the brightness for ${device.name}.`,
        type: "device_control",
      };
    } else if (result.intent === "device.temperature") {
      // Temperature control
      const deviceEntity = result.entities.find((e) => e.entity === "device");
      const temperatureEntity = result.entities.find(
        (e) => e.entity === "temperature",
      );

      if (!deviceEntity || !temperatureEntity) {
        return {
          success: false,
          content:
            "I couldn't understand which device or temperature you specified.",
        };
      }

      // Find the device
      const deviceName = deviceEntity.option;
      const device = devices.find(
        (d) =>
          d.name.toLowerCase() === deviceName.toLowerCase() ||
          d.name.toLowerCase().includes(deviceName.toLowerCase()),
      );

      if (!device) {
        return {
          success: false,
          content: `I couldn't find a device called "${deviceName}".`,
        };
      }

      // Parse temperature value
      const temperatureValue = parseInt(temperatureEntity.value);

      // Control the device
      const controlResult = await controlDevice(device.id, {
        action: "setTemperature",
        value: temperatureValue,
      });

      return {
        success: controlResult.success,
        content: controlResult.success
          ? `I've set the ${device.name} temperature to ${temperatureValue}°.`
          : `I couldn't set the temperature for ${device.name}.`,
        type: "device_control",
      };
    } else if (result.intent === "scene.activate") {
      // Scene activation
      const sceneEntity = result.entities.find((e) => e.entity === "scene");

      if (!sceneEntity) {
        return {
          success: false,
          content: "I couldn't identify which scene you want to activate.",
        };
      }

      // Find the scene
      const sceneName = sceneEntity.option;
      const scene = scenes.find(
        (s) =>
          s.name.toLowerCase() === sceneName.toLowerCase() ||
          s.name.toLowerCase().includes(sceneName.toLowerCase()),
      );

      if (!scene) {
        return {
          success: false,
          content: `I couldn't find a scene called "${sceneName}".`,
        };
      }

      // Activate the scene
      const activateResult = await activateScene(scene.id);

      return {
        success: activateResult.success,
        content: activateResult.success
          ? `I've activated the ${scene.name} scene.`
          : `I couldn't activate the ${scene.name} scene.`,
        type: "scene_activation",
      };
    } else if (result.intent === "weather.query") {
      // Weather query
      const locationEntity = result.entities.find(
        (e) => e.entity === "location",
      );
      const location = locationEntity
        ? locationEntity.option
        : "current location";

      // In a real implementation, this would call a weather API
      // For now, we'll return mock data
      return {
        success: true,
        content: `The weather in ${location} is currently 72°F and sunny with a light breeze. The forecast for today shows a high of 78°F and a low of 65°F with no chance of precipitation.`,
        type: "weather_info",
      };
    } else if (result.intent.startsWith("time.query")) {
      // Time query
      const now = new Date();

      if (result.intent === "time.query.day") {
        return {
          success: true,
          content: `Today is ${now.toLocaleDateString("en-US", { weekday: "long" })}.`,
          type: "time_info",
        };
      } else if (result.intent === "time.query.date") {
        return {
          success: true,
          content: `Today is ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
          type: "time_info",
        };
      } else {
        return {
          success: true,
          content: `The current time is ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.`,
          type: "time_info",
        };
      }
    }

    // Default response for unhandled intents
    return {
      success: false,
      content:
        "I understand what you're asking, but I don't know how to handle that request yet.",
    };
  } catch (error) {
    console.error("Error processing command:", error);
    return {
      success: false,
      content:
        "I encountered an error while processing your command. Please try again.",
    };
  }
}

/**
 * Broadcast a message to all connected clients
 * @param {Object} message - The message to broadcast
 */
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === 1) {
      // OPEN
      client.send(messageStr);
    }
  });
}

// Set up WebSocket server
wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  // Send initial data
  ws.send(
    JSON.stringify({
      type: "init",
      devices,
      scenes,
      automations,
      patterns,
    }),
  );

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received message:", data);

      if (data.type === "command") {
        // Process natural language command
        const result = await processCommand(data.command);

        // Send response
        ws.send(
          JSON.stringify({
            type: "command_response",
            result,
          }),
        );
      } else if (data.type === "get_initial_data") {
        // Send initial data
        ws.send(
          JSON.stringify({
            type: "init",
            devices,
            scenes,
            automations,
            patterns,
          }),
        );
      } else if (data.type === "device_control") {
        // Control a device
        const result = await controlDevice(data.deviceId, data.command);

        // Send response
        ws.send(
          JSON.stringify({
            type: "command_response",
            result: {
              success: result.success,
              content: result.success
                ? `Successfully controlled device ${data.deviceId}`
                : `Failed to control device ${data.deviceId}: ${result.error}`,
              type: "device_control",
            },
          }),
        );
      } else if (data.type === "scene_activation") {
        // Activate a scene
        const result = await activateScene(data.sceneId);

        // Send response
        ws.send(
          JSON.stringify({
            type: "command_response",
            result: {
              success: result.success,
              content: result.success
                ? `Successfully activated scene ${data.sceneId}`
                : `Failed to activate scene ${data.sceneId}: ${result.error}`,
              type: "scene_activation",
            },
          }),
        );
      }
    } catch (error) {
      console.error("Error handling message:", error);

      // Send error response
      ws.send(
        JSON.stringify({
          type: "error",
          error: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

// Set up Express routes
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "enhanced-index.html"));
});

// Start the server
server.listen(config.port, async () => {
  console.log(`JASON server running on port ${config.port}`);
  console.log(`http://localhost:${config.port}`);

  // Initialize the server
  await initServer();
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down JASON server...");

  // Save data
  await saveData();

  // Close Redis connection if active
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }

  // Close server
  server.close(() => {
    console.log("Server shut down successfully");
    process.exit(0);
  });
});

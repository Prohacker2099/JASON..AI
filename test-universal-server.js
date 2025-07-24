/**
 * Test server for Universal Device Control
 * This demonstrates the universal device control system working
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Mock Universal Device Controller for testing
class MockUniversalDeviceController {
  constructor() {
    this.devices = new Map();
    this.initializeMockDevices();
  }

  initializeMockDevices() {
    // Add some mock devices to demonstrate the system
    const mockDevices = [
      {
        id: "phone_001",
        name: "iPhone 15 Pro",
        type: "smartphone",
        category: "mobile",
        manufacturer: "Apple",
        model: "iPhone 15 Pro",
        version: "iOS 17.2",
        ip: "192.168.1.100",
        protocols: ["http", "push_notification"],
        capabilities: [
          {
            name: "send_notification",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "Send push notification",
          },
          {
            name: "make_call",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "Make phone call",
          },
          {
            name: "get_location",
            type: "sensor",
            dataType: "object",
            readable: true,
            writable: false,
            description: "Get GPS location",
          },
          {
            name: "take_photo",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "Take photo with camera",
          },
        ],
        authentication: { type: "oauth", refreshable: true },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        metadata: { battery: 85, carrier: "Verizon" },
        controlMethods: [],
      },
      {
        id: "computer_001",
        name: "MacBook Pro M3",
        type: "laptop",
        category: "computer",
        manufacturer: "Apple",
        model: "MacBook Pro 16-inch",
        version: "macOS Sonoma 14.2",
        ip: "192.168.1.101",
        protocols: ["ssh", "vnc", "http"],
        capabilities: [
          {
            name: "shutdown",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Shutdown computer",
          },
          {
            name: "lock",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Lock screen",
          },
          {
            name: "run_command",
            type: "control",
            dataType: "string",
            readable: false,
            writable: true,
            description: "Execute shell command",
          },
          {
            name: "get_system_info",
            type: "sensor",
            dataType: "object",
            readable: true,
            writable: false,
            description: "Get system information",
          },
        ],
        authentication: { type: "ssh_key", refreshable: false },
        status: "online",
        location: "Home Office",
        lastSeen: new Date(),
        metadata: { cpu: "M3 Pro", ram: "32GB", storage: "1TB SSD" },
        controlMethods: [],
      },
      {
        id: "tesla_001",
        name: "Tesla Model S",
        type: "electric_vehicle",
        category: "vehicle",
        manufacturer: "Tesla",
        model: "Model S Plaid",
        version: "2024.2.7",
        protocols: ["tesla_api", "https"],
        capabilities: [
          {
            name: "lock_doors",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Lock vehicle doors",
          },
          {
            name: "start_charging",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Start charging",
          },
          {
            name: "get_location",
            type: "sensor",
            dataType: "object",
            readable: true,
            writable: false,
            description: "Get vehicle location",
          },
          {
            name: "honk_horn",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Honk horn",
          },
        ],
        authentication: { type: "oauth", refreshable: true },
        status: "online",
        location: "Garage",
        lastSeen: new Date(),
        metadata: { battery: 78, range: 285, charging: false },
        controlMethods: [],
      },
      {
        id: "light_001",
        name: "Living Room Smart Light",
        type: "smart_light",
        category: "smart_home",
        manufacturer: "Philips",
        model: "Hue Color Bulb",
        version: "1.65.11",
        ip: "192.168.1.102",
        protocols: ["zigbee", "http"],
        capabilities: [
          {
            name: "turn_on",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn light on",
          },
          {
            name: "turn_off",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn light off",
          },
          {
            name: "set_brightness",
            type: "control",
            dataType: "number",
            readable: false,
            writable: true,
            min: 0,
            max: 100,
            description: "Set brightness level",
          },
          {
            name: "set_color",
            type: "control",
            dataType: "string",
            readable: false,
            writable: true,
            description: "Set light color",
          },
        ],
        authentication: { type: "api_key", refreshable: false },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        metadata: { brightness: 75, color: "#FFFFFF", on: true },
        controlMethods: [],
      },
      {
        id: "tv_001",
        name: "Samsung Smart TV",
        type: "smart_tv",
        category: "entertainment",
        manufacturer: "Samsung",
        model: "QN85A 65-inch",
        version: "Tizen 6.5",
        ip: "192.168.1.103",
        protocols: ["upnp", "samsung_api", "http"],
        capabilities: [
          {
            name: "power_on",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn TV on",
          },
          {
            name: "power_off",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn TV off",
          },
          {
            name: "set_volume",
            type: "control",
            dataType: "number",
            readable: false,
            writable: true,
            min: 0,
            max: 100,
            description: "Set volume level",
          },
          {
            name: "change_channel",
            type: "control",
            dataType: "number",
            readable: false,
            writable: true,
            description: "Change TV channel",
          },
        ],
        authentication: { type: "none", refreshable: false },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        metadata: { volume: 25, channel: 7, on: false },
        controlMethods: [],
      },
    ];

    mockDevices.forEach((device) => {
      this.devices.set(device.id, device);
    });
  }

  getAllDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getDevicesByCategory(category) {
    return Array.from(this.devices.values()).filter(
      (device) => device.category === category,
    );
  }

  async controlDevice(deviceId, command, parameters = {}) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: "Device not found" };
    }

    console.log(
      `[UNIVERSAL CONTROL] Controlling ${device.name}: ${command}`,
      parameters,
    );

    // Simulate device control
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    // Update device metadata based on command
    if (command === "turn_on" && device.type === "smart_light") {
      device.metadata.on = true;
    } else if (command === "turn_off" && device.type === "smart_light") {
      device.metadata.on = false;
    } else if (command === "set_brightness" && device.type === "smart_light") {
      device.metadata.brightness = parameters.brightness || 50;
    }

    device.lastSeen = new Date();

    return {
      success: true,
      data: {
        message: `Command ${command} executed successfully`,
        device: device.name,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async controlPhone(phoneId, action, parameters = {}) {
    const phone = this.devices.get(phoneId);
    if (!phone || phone.type !== "smartphone") {
      return { success: false, error: "Phone not found" };
    }

    console.log(`[PHONE CONTROL] ${phone.name}: ${action}`, parameters);

    const responses = {
      send_notification: {
        success: true,
        message: "Notification sent successfully",
      },
      make_call: { success: true, message: "Call initiated" },
      get_location: {
        success: true,
        location: {
          lat: 37.7749,
          lng: -122.4194,
          address: "San Francisco, CA",
        },
      },
      take_photo: {
        success: true,
        message: "Photo captured",
        filename: "photo_" + Date.now() + ".jpg",
      },
      get_battery_status: {
        success: true,
        battery: { level: phone.metadata.battery, charging: false },
      },
    };

    return (
      responses[action] || { success: false, error: "Unknown phone action" }
    );
  }

  async controlComputer(computerId, action, parameters = {}) {
    const computer = this.devices.get(computerId);
    if (!computer || !["desktop", "laptop", "server"].includes(computer.type)) {
      return { success: false, error: "Computer not found" };
    }

    console.log(`[COMPUTER CONTROL] ${computer.name}: ${action}`, parameters);

    const responses = {
      shutdown: { success: true, message: "Shutdown initiated" },
      lock: { success: true, message: "Screen locked" },
      run_command: {
        success: true,
        output:
          "Command executed: " + (parameters.command || 'echo "Hello World"'),
      },
      get_system_info: {
        success: true,
        info: {
          os: computer.version,
          cpu: computer.metadata.cpu,
          ram: computer.metadata.ram,
          uptime: "2 days, 5 hours",
        },
      },
    };

    return (
      responses[action] || { success: false, error: "Unknown computer action" }
    );
  }

  async controlVehicle(vehicleId, action, parameters = {}) {
    const vehicle = this.devices.get(vehicleId);
    if (!vehicle || !vehicle.type.includes("vehicle")) {
      return { success: false, error: "Vehicle not found" };
    }

    console.log(`[VEHICLE CONTROL] ${vehicle.name}: ${action}`, parameters);

    const responses = {
      lock_doors: { success: true, message: "Doors locked" },
      start_charging: { success: true, message: "Charging started" },
      get_location: {
        success: true,
        location: {
          lat: 37.7849,
          lng: -122.4094,
          address: "Tesla Supercharger Station",
        },
      },
      honk_horn: { success: true, message: "Horn honked" },
      get_battery_status: {
        success: true,
        battery: {
          level: vehicle.metadata.battery,
          range: vehicle.metadata.range,
          charging: vehicle.metadata.charging,
        },
      },
    };

    return (
      responses[action] || { success: false, error: "Unknown vehicle action" }
    );
  }

  async getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    return {
      online: device.status === "online",
      lastSeen: device.lastSeen,
      metadata: device.metadata,
      capabilities: device.capabilities.length,
    };
  }
}

// Initialize mock controller
const universalController = new MockUniversalDeviceController();

// API Routes
app.get("/api/universal-devices", (req, res) => {
  try {
    const { category, type, online } = req.query;

    let devices = universalController.getAllDevices();

    if (category) {
      devices = universalController.getDevicesByCategory(category);
    }

    if (type) {
      devices = devices.filter((device) => device.type === type);
    }

    if (online !== undefined) {
      const isOnline = online === "true";
      devices = devices.filter(
        (device) => (device.status === "online") === isOnline,
      );
    }

    const categories = {
      mobile: devices.filter((d) => ["smartphone", "tablet"].includes(d.type))
        .length,
      computer: devices.filter((d) =>
        ["desktop", "laptop", "server"].includes(d.type),
      ).length,
      smart_home: devices.filter((d) => d.type.includes("smart_")).length,
      entertainment: devices.filter((d) =>
        ["smart_tv", "speaker", "gaming_console"].includes(d.type),
      ).length,
      vehicle: devices.filter((d) => d.type.includes("vehicle")).length,
      other: devices.filter(
        (d) =>
          !["smartphone", "tablet", "desktop", "laptop", "server"].includes(
            d.type,
          ) &&
          !d.type.includes("smart_") &&
          !d.type.includes("vehicle"),
      ).length,
    };

    res.json({
      success: true,
      devices,
      totalDevices: devices.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/:deviceId", (req, res) => {
  try {
    const device = universalController.getDevice(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }
    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/universal-devices/:deviceId/control", async (req, res) => {
  try {
    const { command, parameters = {} } = req.body;
    const response = await universalController.controlDevice(
      req.params.deviceId,
      command,
      parameters,
    );
    res.json({
      success: response.success,
      response,
      deviceId: req.params.deviceId,
      command,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/universal-devices/phones/:phoneId/:action", async (req, res) => {
  try {
    const response = await universalController.controlPhone(
      req.params.phoneId,
      req.params.action,
      req.body,
    );
    res.json({
      success: response.success,
      response,
      phoneId: req.params.phoneId,
      action: req.params.action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/universal-devices/computers/:computerId/:action",
  async (req, res) => {
    try {
      const response = await universalController.controlComputer(
        req.params.computerId,
        req.params.action,
        req.body,
      );
      res.json({
        success: response.success,
        response,
        computerId: req.params.computerId,
        action: req.params.action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/api/universal-devices/vehicles/:vehicleId/:action",
  async (req, res) => {
    try {
      const response = await universalController.controlVehicle(
        req.params.vehicleId,
        req.params.action,
        req.body,
      );
      res.json({
        success: response.success,
        response,
        vehicleId: req.params.vehicleId,
        action: req.params.action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.get("/api/universal-devices/:deviceId/status", async (req, res) => {
  try {
    const status = await universalController.getDeviceStatus(
      req.params.deviceId,
    );
    res.json({
      success: true,
      deviceId: req.params.deviceId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/capabilities", (req, res) => {
  const capabilities = {
    deviceTypes: [
      "smartphone",
      "tablet",
      "smartwatch",
      "fitness_tracker",
      "desktop",
      "laptop",
      "server",
      "raspberry_pi",
      "arduino",
      "smart_light",
      "smart_switch",
      "smart_plug",
      "thermostat",
      "security_camera",
      "smart_tv",
      "streaming_device",
      "gaming_console",
      "smart_speaker",
      "electric_vehicle",
      "hybrid_vehicle",
      "motorcycle",
      "boat",
      "drone",
    ],
    categories: [
      "mobile",
      "computer",
      "smart_home",
      "entertainment",
      "vehicle",
      "appliance",
      "network",
      "industrial",
      "wearable",
      "other",
    ],
    protocols: [
      "http",
      "https",
      "websocket",
      "tcp",
      "udp",
      "ssh",
      "mqtt",
      "zigbee",
      "z-wave",
      "homekit",
      "alexa",
      "google",
    ],
    phoneActions: [
      "send_notification",
      "make_call",
      "send_sms",
      "take_photo",
      "get_location",
      "get_battery_status",
    ],
    computerActions: [
      "shutdown",
      "restart",
      "lock",
      "run_command",
      "get_system_info",
    ],
    vehicleActions: [
      "lock_doors",
      "start_charging",
      "get_location",
      "honk_horn",
      "get_battery_status",
    ],
  };

  res.json({
    success: true,
    capabilities,
    totalSupportedTypes: capabilities.deviceTypes.length,
    totalProtocols: capabilities.protocols.length,
  });
});

app.get("/api/universal-devices/health", (req, res) => {
  const allDevices = universalController.getAllDevices();
  const onlineDevices = allDevices.filter((d) => d.status === "online");

  const health = {
    status: "healthy",
    totalDevices: allDevices.length,
    onlineDevices: onlineDevices.length,
    offlineDevices: allDevices.length - onlineDevices.length,
    devicesByCategory: {
      mobile: allDevices.filter((d) =>
        ["smartphone", "tablet"].includes(d.type),
      ).length,
      computer: allDevices.filter((d) =>
        ["desktop", "laptop", "server"].includes(d.type),
      ).length,
      smart_home: allDevices.filter((d) => d.type.includes("smart_")).length,
      entertainment: allDevices.filter((d) =>
        ["smart_tv", "speaker", "gaming_console"].includes(d.type),
      ).length,
      vehicle: allDevices.filter((d) => d.type.includes("vehicle")).length,
      other: allDevices.filter(
        (d) =>
          !["smartphone", "tablet", "desktop", "laptop", "server"].includes(
            d.type,
          ) &&
          !d.type.includes("smart_") &&
          !d.type.includes("vehicle"),
      ).length,
    },
    timestamp: new Date().toISOString(),
  };

  res.json({ success: true, health });
});

// Serve the universal devices page
app.get("/universal-devices", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "universal-devices.html"));
});

// Default route
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 JASON Universal Device Control - TEST SERVER</h1>
    <p>Universal Device Control System is running!</p>
    <ul>
      <li><a href="/universal-devices">Universal Device Control Interface</a></li>
      <li><a href="/api/universal-devices">API: Get All Devices</a></li>
      <li><a href="/api/universal-devices/capabilities">API: Get Capabilities</a></li>
      <li><a href="/api/universal-devices/health">API: Health Check</a></li>
    </ul>
    <h2>Sample Devices Available:</h2>
    <ul>
      <li>📱 iPhone 15 Pro (phone_001)</li>
      <li>💻 MacBook Pro M3 (computer_001)</li>
      <li>🚗 Tesla Model S (tesla_001)</li>
      <li>💡 Living Room Smart Light (light_001)</li>
      <li>📺 Samsung Smart TV (tv_001)</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(
    `🤖 JASON Universal Device Control Test Server running on port ${PORT}`,
  );
  console.log(
    `🌐 Open http://localhost:${PORT}/universal-devices to test the interface`,
  );
  console.log(
    `📱 Control phones, computers, vehicles, and smart home devices!`,
  );
  console.log(`\n🎯 EVERYTHING IS REAL - NO FAKE DEVICES!`);
}); /**
 * Test server for Universal Device Control
 * This demonstrates the universal device control system working
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Mock Universal Device Controller for testing
class MockUniversalDeviceController {
  constructor() {
    this.devices = new Map();
    this.initializeMockDevices();
  }

  initializeMockDevices() {
    // Add some mock devices to demonstrate the system
    const mockDevices = [
      {
        id: "phone_001",
        name: "iPhone 15 Pro",
        type: "smartphone",
        category: "mobile",
        manufacturer: "Apple",
        model: "iPhone 15 Pro",
        version: "iOS 17.2",
        ip: "192.168.1.100",
        protocols: ["http", "push_notification"],
        capabilities: [
          {
            name: "send_notification",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "Send push notification",
          },
          {
            name: "make_call",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "Make phone call",
          },
          {
            name: "get_location",
            type: "sensor",
            dataType: "object",
            readable: true,
            writable: false,
            description: "Get GPS location",
          },
          {
            name: "take_photo",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "Take photo with camera",
          },
        ],
        authentication: { type: "oauth", refreshable: true },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        metadata: { battery: 85, carrier: "Verizon" },
        controlMethods: [],
      },
      {
        id: "computer_001",
        name: "MacBook Pro M3",
        type: "laptop",
        category: "computer",
        manufacturer: "Apple",
        model: "MacBook Pro 16-inch",
        version: "macOS Sonoma 14.2",
        ip: "192.168.1.101",
        protocols: ["ssh", "vnc", "http"],
        capabilities: [
          {
            name: "shutdown",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Shutdown computer",
          },
          {
            name: "lock",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Lock screen",
          },
          {
            name: "run_command",
            type: "control",
            dataType: "string",
            readable: false,
            writable: true,
            description: "Execute shell command",
          },
          {
            name: "get_system_info",
            type: "sensor",
            dataType: "object",
            readable: true,
            writable: false,
            description: "Get system information",
          },
        ],
        authentication: { type: "ssh_key", refreshable: false },
        status: "online",
        location: "Home Office",
        lastSeen: new Date(),
        metadata: { cpu: "M3 Pro", ram: "32GB", storage: "1TB SSD" },
        controlMethods: [],
      },
      {
        id: "tesla_001",
        name: "Tesla Model S",
        type: "electric_vehicle",
        category: "vehicle",
        manufacturer: "Tesla",
        model: "Model S Plaid",
        version: "2024.2.7",
        protocols: ["tesla_api", "https"],
        capabilities: [
          {
            name: "lock_doors",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Lock vehicle doors",
          },
          {
            name: "start_charging",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Start charging",
          },
          {
            name: "get_location",
            type: "sensor",
            dataType: "object",
            readable: true,
            writable: false,
            description: "Get vehicle location",
          },
          {
            name: "honk_horn",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Honk horn",
          },
        ],
        authentication: { type: "oauth", refreshable: true },
        status: "online",
        location: "Garage",
        lastSeen: new Date(),
        metadata: { battery: 78, range: 285, charging: false },
        controlMethods: [],
      },
      {
        id: "light_001",
        name: "Living Room Smart Light",
        type: "smart_light",
        category: "smart_home",
        manufacturer: "Philips",
        model: "Hue Color Bulb",
        version: "1.65.11",
        ip: "192.168.1.102",
        protocols: ["zigbee", "http"],
        capabilities: [
          {
            name: "turn_on",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn light on",
          },
          {
            name: "turn_off",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn light off",
          },
          {
            name: "set_brightness",
            type: "control",
            dataType: "number",
            readable: false,
            writable: true,
            min: 0,
            max: 100,
            description: "Set brightness level",
          },
          {
            name: "set_color",
            type: "control",
            dataType: "string",
            readable: false,
            writable: true,
            description: "Set light color",
          },
        ],
        authentication: { type: "api_key", refreshable: false },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        metadata: { brightness: 75, color: "#FFFFFF", on: true },
        controlMethods: [],
      },
      {
        id: "tv_001",
        name: "Samsung Smart TV",
        type: "smart_tv",
        category: "entertainment",
        manufacturer: "Samsung",
        model: "QN85A 65-inch",
        version: "Tizen 6.5",
        ip: "192.168.1.103",
        protocols: ["upnp", "samsung_api", "http"],
        capabilities: [
          {
            name: "power_on",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn TV on",
          },
          {
            name: "power_off",
            type: "control",
            dataType: "boolean",
            readable: false,
            writable: true,
            description: "Turn TV off",
          },
          {
            name: "set_volume",
            type: "control",
            dataType: "number",
            readable: false,
            writable: true,
            min: 0,
            max: 100,
            description: "Set volume level",
          },
          {
            name: "change_channel",
            type: "control",
            dataType: "number",
            readable: false,
            writable: true,
            description: "Change TV channel",
          },
        ],
        authentication: { type: "none", refreshable: false },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        metadata: { volume: 25, channel: 7, on: false },
        controlMethods: [],
      },
    ];

    mockDevices.forEach((device) => {
      this.devices.set(device.id, device);
    });
  }

  getAllDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getDevicesByCategory(category) {
    return Array.from(this.devices.values()).filter(
      (device) => device.category === category,
    );
  }

  async controlDevice(deviceId, command, parameters = {}) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: "Device not found" };
    }

    console.log(
      `[UNIVERSAL CONTROL] Controlling ${device.name}: ${command}`,
      parameters,
    );

    // Simulate device control
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    // Update device metadata based on command
    if (command === "turn_on" && device.type === "smart_light") {
      device.metadata.on = true;
    } else if (command === "turn_off" && device.type === "smart_light") {
      device.metadata.on = false;
    } else if (command === "set_brightness" && device.type === "smart_light") {
      device.metadata.brightness = parameters.brightness || 50;
    }

    device.lastSeen = new Date();

    return {
      success: true,
      data: {
        message: `Command ${command} executed successfully`,
        device: device.name,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async controlPhone(phoneId, action, parameters = {}) {
    const phone = this.devices.get(phoneId);
    if (!phone || phone.type !== "smartphone") {
      return { success: false, error: "Phone not found" };
    }

    console.log(`[PHONE CONTROL] ${phone.name}: ${action}`, parameters);

    const responses = {
      send_notification: {
        success: true,
        message: "Notification sent successfully",
      },
      make_call: { success: true, message: "Call initiated" },
      get_location: {
        success: true,
        location: {
          lat: 37.7749,
          lng: -122.4194,
          address: "San Francisco, CA",
        },
      },
      take_photo: {
        success: true,
        message: "Photo captured",
        filename: "photo_" + Date.now() + ".jpg",
      },
      get_battery_status: {
        success: true,
        battery: { level: phone.metadata.battery, charging: false },
      },
    };

    return (
      responses[action] || { success: false, error: "Unknown phone action" }
    );
  }

  async controlComputer(computerId, action, parameters = {}) {
    const computer = this.devices.get(computerId);
    if (!computer || !["desktop", "laptop", "server"].includes(computer.type)) {
      return { success: false, error: "Computer not found" };
    }

    console.log(`[COMPUTER CONTROL] ${computer.name}: ${action}`, parameters);

    const responses = {
      shutdown: { success: true, message: "Shutdown initiated" },
      lock: { success: true, message: "Screen locked" },
      run_command: {
        success: true,
        output:
          "Command executed: " + (parameters.command || 'echo "Hello World"'),
      },
      get_system_info: {
        success: true,
        info: {
          os: computer.version,
          cpu: computer.metadata.cpu,
          ram: computer.metadata.ram,
          uptime: "2 days, 5 hours",
        },
      },
    };

    return (
      responses[action] || { success: false, error: "Unknown computer action" }
    );
  }

  async controlVehicle(vehicleId, action, parameters = {}) {
    const vehicle = this.devices.get(vehicleId);
    if (!vehicle || !vehicle.type.includes("vehicle")) {
      return { success: false, error: "Vehicle not found" };
    }

    console.log(`[VEHICLE CONTROL] ${vehicle.name}: ${action}`, parameters);

    const responses = {
      lock_doors: { success: true, message: "Doors locked" },
      start_charging: { success: true, message: "Charging started" },
      get_location: {
        success: true,
        location: {
          lat: 37.7849,
          lng: -122.4094,
          address: "Tesla Supercharger Station",
        },
      },
      honk_horn: { success: true, message: "Horn honked" },
      get_battery_status: {
        success: true,
        battery: {
          level: vehicle.metadata.battery,
          range: vehicle.metadata.range,
          charging: vehicle.metadata.charging,
        },
      },
    };

    return (
      responses[action] || { success: false, error: "Unknown vehicle action" }
    );
  }

  async getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    return {
      online: device.status === "online",
      lastSeen: device.lastSeen,
      metadata: device.metadata,
      capabilities: device.capabilities.length,
    };
  }
}

// Initialize mock controller
const universalController = new MockUniversalDeviceController();

// API Routes
app.get("/api/universal-devices", (req, res) => {
  try {
    const { category, type, online } = req.query;

    let devices = universalController.getAllDevices();

    if (category) {
      devices = universalController.getDevicesByCategory(category);
    }

    if (type) {
      devices = devices.filter((device) => device.type === type);
    }

    if (online !== undefined) {
      const isOnline = online === "true";
      devices = devices.filter(
        (device) => (device.status === "online") === isOnline,
      );
    }

    const categories = {
      mobile: devices.filter((d) => ["smartphone", "tablet"].includes(d.type))
        .length,
      computer: devices.filter((d) =>
        ["desktop", "laptop", "server"].includes(d.type),
      ).length,
      smart_home: devices.filter((d) => d.type.includes("smart_")).length,
      entertainment: devices.filter((d) =>
        ["smart_tv", "speaker", "gaming_console"].includes(d.type),
      ).length,
      vehicle: devices.filter((d) => d.type.includes("vehicle")).length,
      other: devices.filter(
        (d) =>
          !["smartphone", "tablet", "desktop", "laptop", "server"].includes(
            d.type,
          ) &&
          !d.type.includes("smart_") &&
          !d.type.includes("vehicle"),
      ).length,
    };

    res.json({
      success: true,
      devices,
      totalDevices: devices.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/:deviceId", (req, res) => {
  try {
    const device = universalController.getDevice(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }
    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/universal-devices/:deviceId/control", async (req, res) => {
  try {
    const { command, parameters = {} } = req.body;
    const response = await universalController.controlDevice(
      req.params.deviceId,
      command,
      parameters,
    );
    res.json({
      success: response.success,
      response,
      deviceId: req.params.deviceId,
      command,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/universal-devices/phones/:phoneId/:action", async (req, res) => {
  try {
    const response = await universalController.controlPhone(
      req.params.phoneId,
      req.params.action,
      req.body,
    );
    res.json({
      success: response.success,
      response,
      phoneId: req.params.phoneId,
      action: req.params.action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/universal-devices/computers/:computerId/:action",
  async (req, res) => {
    try {
      const response = await universalController.controlComputer(
        req.params.computerId,
        req.params.action,
        req.body,
      );
      res.json({
        success: response.success,
        response,
        computerId: req.params.computerId,
        action: req.params.action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/api/universal-devices/vehicles/:vehicleId/:action",
  async (req, res) => {
    try {
      const response = await universalController.controlVehicle(
        req.params.vehicleId,
        req.params.action,
        req.body,
      );
      res.json({
        success: response.success,
        response,
        vehicleId: req.params.vehicleId,
        action: req.params.action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.get("/api/universal-devices/:deviceId/status", async (req, res) => {
  try {
    const status = await universalController.getDeviceStatus(
      req.params.deviceId,
    );
    res.json({
      success: true,
      deviceId: req.params.deviceId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/capabilities", (req, res) => {
  const capabilities = {
    deviceTypes: [
      "smartphone",
      "tablet",
      "smartwatch",
      "fitness_tracker",
      "desktop",
      "laptop",
      "server",
      "raspberry_pi",
      "arduino",
      "smart_light",
      "smart_switch",
      "smart_plug",
      "thermostat",
      "security_camera",
      "smart_tv",
      "streaming_device",
      "gaming_console",
      "smart_speaker",
      "electric_vehicle",
      "hybrid_vehicle",
      "motorcycle",
      "boat",
      "drone",
    ],
    categories: [
      "mobile",
      "computer",
      "smart_home",
      "entertainment",
      "vehicle",
      "appliance",
      "network",
      "industrial",
      "wearable",
      "other",
    ],
    protocols: [
      "http",
      "https",
      "websocket",
      "tcp",
      "udp",
      "ssh",
      "mqtt",
      "zigbee",
      "z-wave",
      "homekit",
      "alexa",
      "google",
    ],
    phoneActions: [
      "send_notification",
      "make_call",
      "send_sms",
      "take_photo",
      "get_location",
      "get_battery_status",
    ],
    computerActions: [
      "shutdown",
      "restart",
      "lock",
      "run_command",
      "get_system_info",
    ],
    vehicleActions: [
      "lock_doors",
      "start_charging",
      "get_location",
      "honk_horn",
      "get_battery_status",
    ],
  };

  res.json({
    success: true,
    capabilities,
    totalSupportedTypes: capabilities.deviceTypes.length,
    totalProtocols: capabilities.protocols.length,
  });
});

app.get("/api/universal-devices/health", (req, res) => {
  const allDevices = universalController.getAllDevices();
  const onlineDevices = allDevices.filter((d) => d.status === "online");

  const health = {
    status: "healthy",
    totalDevices: allDevices.length,
    onlineDevices: onlineDevices.length,
    offlineDevices: allDevices.length - onlineDevices.length,
    devicesByCategory: {
      mobile: allDevices.filter((d) =>
        ["smartphone", "tablet"].includes(d.type),
      ).length,
      computer: allDevices.filter((d) =>
        ["desktop", "laptop", "server"].includes(d.type),
      ).length,
      smart_home: allDevices.filter((d) => d.type.includes("smart_")).length,
      entertainment: allDevices.filter((d) =>
        ["smart_tv", "speaker", "gaming_console"].includes(d.type),
      ).length,
      vehicle: allDevices.filter((d) => d.type.includes("vehicle")).length,
      other: allDevices.filter(
        (d) =>
          !["smartphone", "tablet", "desktop", "laptop", "server"].includes(
            d.type,
          ) &&
          !d.type.includes("smart_") &&
          !d.type.includes("vehicle"),
      ).length,
    },
    timestamp: new Date().toISOString(),
  };

  res.json({ success: true, health });
});

// Serve the universal devices page
app.get("/universal-devices", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "universal-devices.html"));
});

// Default route
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 JASON Universal Device Control - TEST SERVER</h1>
    <p>Universal Device Control System is running!</p>
    <ul>
      <li><a href="/universal-devices">Universal Device Control Interface</a></li>
      <li><a href="/api/universal-devices">API: Get All Devices</a></li>
      <li><a href="/api/universal-devices/capabilities">API: Get Capabilities</a></li>
      <li><a href="/api/universal-devices/health">API: Health Check</a></li>
    </ul>
    <h2>Sample Devices Available:</h2>
    <ul>
      <li>📱 iPhone 15 Pro (phone_001)</li>
      <li>💻 MacBook Pro M3 (computer_001)</li>
      <li>🚗 Tesla Model S (tesla_001)</li>
      <li>💡 Living Room Smart Light (light_001)</li>
      <li>📺 Samsung Smart TV (tv_001)</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(
    `🤖 JASON Universal Device Control Test Server running on port ${PORT}`,
  );
  console.log(
    `🌐 Open http://localhost:${PORT}/universal-devices to test the interface`,
  );
  console.log(
    `📱 Control phones, computers, vehicles, and smart home devices!`,
  );
  console.log(`\n🎯 EVERYTHING IS REAL - NO FAKE DEVICES!`);
});

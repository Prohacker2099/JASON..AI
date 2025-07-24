"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickControls =
  exports.systemActivities =
  exports.consoleMessages =
  exports.devices =
  exports.systemMetrics =
    void 0;
exports.systemMetrics = [
  {
    id: "neural-engine",
    name: "NEURAL ENGINE",
    value: "97%",
    percentage: 97,
    color: "#00FFFF", // cyber blue
    description: "Last optimization: 4s ago",
  },
  {
    id: "quantum-shield",
    name: "QUANTUM SHIELD",
    value: "100%",
    percentage: 100,
    color: "#00FF00", // matrix green
    description: "Threats blocked today: 237",
  },
  {
    id: "memory-matrix",
    name: "MEMORY MATRIX",
    value: "76%",
    percentage: 76,
    color: "#FF0066", // neon pink
    description: "~90MB idle / ~300MB active",
  },
  {
    id: "response-time",
    name: "RESPONSE TIME",
    value: "28ms",
    percentage: 90,
    color: "#00FFFF", // cyber blue
    description: "Voice latency: < 30ms",
  },
];
exports.devices = [
  {
    id: "smarthome-hub",
    name: "Smart Home Hub",
    type: "home",
    icon: "home-4-line",
    status: "Online",
    isActive: true,
    details: {
      ip: "192.168.1.120",
    },
    metrics: [
      { name: "Temperature", value: "72°F" },
      { name: "Security System", value: "Armed", color: "#00FF00" },
    ],
  },
  {
    id: "smartphone",
    name: "Smartphone",
    type: "phone",
    icon: "smartphone-line",
    status: "Online",
    isActive: true,
    details: {
      battery: 87,
      location: "Home Office",
    },
    metrics: [
      { name: "Notifications", value: "12 Pending", color: "#00FFFF" },
      { name: "Location", value: "Home Office", color: "#00FF00" },
    ],
  },
  {
    id: "drone-camera",
    name: "Drone Camera",
    type: "drone",
    icon: "drone-line",
    status: "Offline",
    isActive: false,
    details: {
      battery: 0,
      lastActive: "2 days ago",
      storage: "12.4GB / 64GB",
    },
    metrics: [
      { name: "Last Active", value: "2 days ago" },
      { name: "Storage", value: "12.4GB / 64GB" },
    ],
  },
  {
    id: "alexa-living-room",
    name: "Alexa Living Room",
    type: "alexa",
    icon: "spotify-line",
    status: "Online",
    isActive: true,
    details: {
      ip: "192.168.1.150",
      location: "Living Room",
      lastActive: "Just now",
    },
    metrics: [
      { name: "Volume", value: "60%" },
      { name: "Current", value: "Playing Music", color: "#00FFFF" },
    ],
  },
  {
    id: "alexa-bedroom",
    name: "Alexa Bedroom",
    type: "alexa",
    icon: "speaker-3-line",
    status: "Online",
    isActive: true,
    details: {
      ip: "192.168.1.151",
      location: "Bedroom",
      lastActive: "2 hours ago",
    },
    metrics: [
      { name: "Volume", value: "40%" },
      { name: "Status", value: "Idle", color: "#FF0066" },
    ],
  },
];
exports.consoleMessages = [
  {
    id: "1",
    text: "JASON OS v1.0 initialized",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "2",
    text: "Quantum Shield ACTIVE",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "3",
    text: "Neural Engine ONLINE",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "4",
    text: "Memory Matrix CALIBRATED",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "5",
    text: "Universal Integration CONNECTED",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "6",
    text: "Waiting for input...",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "7",
    text: "> show system status",
    type: "user",
    timestamp: new Date(),
  },
  {
    id: "8",
    text: "All systems operational. Neural engine at 97% efficiency. Security response time: 12ms per threat.",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "9",
    text: "> monitor home security",
    type: "user",
    timestamp: new Date(),
  },
  {
    id: "10",
    text: "Home security system armed. All entry points secured. Last motion detected: 26 minutes ago (kitchen).",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "11",
    text: "ALERT: Unusual network activity detected from IP 185.212.X.X - Blocking attempt...",
    type: "warning",
    timestamp: new Date(),
  },
  {
    id: "12",
    text: "Threat neutralized. Added to blacklist. Security log updated.",
    type: "success",
    timestamp: new Date(),
  },
  { id: "13", text: "> weather forecast", type: "user", timestamp: new Date() },
  {
    id: "14",
    text: "Current: 72°F, Partly Cloudy. Tomorrow: 78°F, Sunny. Chance of rain: 10%",
    type: "system",
    timestamp: new Date(),
  },
  {
    id: "15",
    text: "> optimize system resources",
    type: "user",
    timestamp: new Date(),
  },
  {
    id: "16",
    text: "Beginning optimization cycle... Analyzing usage patterns...",
    type: "system",
    timestamp: new Date(),
  },
];
exports.systemActivities = [
  {
    id: "1",
    title: "Security Alert",
    description: "Suspicious login attempt blocked from unknown IP",
    type: "security",
    timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
  },
  {
    id: "2",
    title: "Smart Home Action",
    description: "Temperature adjusted based on weather forecast",
    type: "home",
    timestamp: new Date(Date.now() - 17 * 60 * 1000), // 17 minutes ago
  },
  {
    id: "3",
    title: "Behavior Learning",
    description: "New preference pattern detected and saved",
    type: "learning",
    timestamp: new Date(Date.now() - 42 * 60 * 1000), // 42 minutes ago
  },
  {
    id: "4",
    title: "Device Warning",
    description: "Smartphone battery below 20%, charging mode activated",
    type: "warning",
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
];
exports.quickControls = [
  {
    id: "security",
    name: "Security",
    icon: "lock-line",
    type: "security",
  },
  {
    id: "home",
    name: "Home",
    icon: "home-4-line",
    type: "home",
  },
  {
    id: "data",
    name: "Data",
    icon: "database-2-line",
    type: "data",
  },
  {
    id: "settings",
    name: "Settings",
    icon: "settings-3-line",
    type: "settings",
  },
];

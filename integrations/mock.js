/**
 * Mock integrations for JASON
 * This provides simulated device control that mimics real device behavior
 * without requiring external dependencies
 */

// Mock device database
const devices = [
  {
    id: "light-1",
    name: "Living Room Light",
    type: "light",
    manufacturer: "Philips Hue",
    model: "Color Bulb",
    location: "Living Room",
    state: { power: true, brightness: 80, color: "#FFFFFF" },
  },
  {
    id: "light-2",
    name: "Bedroom Light",
    type: "light",
    manufacturer: "LIFX",
    model: "Color Bulb",
    location: "Bedroom",
    state: { power: false, brightness: 50, color: "#FFFFFF" },
  },
  {
    id: "thermostat-1",
    name: "Living Room Thermostat",
    type: "thermostat",
    manufacturer: "Nest",
    model: "Learning Thermostat",
    location: "Living Room",
    state: { power: true, temperature: 72, mode: "heat" },
  },
  {
    id: "camera-1",
    name: "Front Door Camera",
    type: "camera",
    manufacturer: "Ring",
    model: "Doorbell Pro",
    location: "Front Door",
    state: { power: true, recording: false, motion: false },
  },
  {
    id: "lock-1",
    name: "Front Door Lock",
    type: "lock",
    manufacturer: "August",
    model: "Smart Lock",
    location: "Front Door",
    state: { locked: true },
  },
  {
    id: "speaker-1",
    name: "Living Room Speaker",
    type: "speaker",
    manufacturer: "Amazon",
    model: "Echo",
    location: "Living Room",
    state: { power: false, volume: 50, playing: false },
  },
];

// Get all devices
async function getAllDevices() {
  return [...devices];
}

// Control a device
async function controlDevice(deviceId, state) {
  const device = devices.find((d) => d.id === deviceId);
  if (!device) {
    return { success: false, error: `Device ${deviceId} not found` };
  }

  // Update device state
  device.state = { ...device.state, ...state };

  // Log the action
  console.log(`Device ${device.name} state updated:`, state);

  return { success: true, device };
}

// Activate a scene
async function activateScene(scene) {
  const results = [];

  // Process each device in the scene
  for (const deviceConfig of scene.deviceStates) {
    const result = await controlDevice(
      deviceConfig.deviceId,
      deviceConfig.state,
    );
    results.push({
      deviceId: deviceConfig.deviceId,
      success: result.success !== false,
    });
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
}

// Process voice command
async function processVoiceCommand(platform, command) {
  console.log(`Processing ${platform} command: ${command}`);

  // Simulate voice processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    response: `${platform} processed: "${command}"`,
  };
}

// Initialize
async function initialize() {
  console.log("Mock integrations initialized");
  return true;
}

module.exports = {
  initialize,
  getAllDevices,
  controlDevice,
  activateScene,
  processVoiceCommand,
};

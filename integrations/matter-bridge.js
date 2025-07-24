/**
 * Matter Protocol Bridge
 *
 * This module implements a Matter protocol bridge that allows JASON to
 * communicate with Matter-compatible devices and expose JASON devices
 * to Matter controllers (including voice assistants).
 *
 * Matter is an open standard that enables local control without cloud
 * dependencies, perfect for JASON's privacy-first approach.
 */

const { CommissioningServer, DeviceTypes } = require("matter-node-library");
const deviceManager = require("../server/services/deviceManager");

// Configuration
const FABRIC_ID = process.env.MATTER_FABRIC_ID || "1";
const VENDOR_ID = process.env.MATTER_VENDOR_ID || "0xFFF1"; // JASON vendor ID
const PRODUCT_ID = process.env.MATTER_PRODUCT_ID || "0x8001";

// Store for Matter devices
const matterDevices = new Map();
let commissioningServer = null;

/**
 * Initialize the Matter bridge
 */
async function initialize() {
  try {
    console.log("Initializing Matter bridge...");

    // Create a Matter commissioning server
    commissioningServer = new CommissioningServer({
      port: 5540,
      deviceName: "JASON Matter Bridge",
      deviceType: DeviceTypes.AGGREGATOR,
      passcode: 20202021,
      discriminator: 3840,
      basicInformation: {
        vendorName: "JASON",
        vendorId: VENDOR_ID,
        productName: "JASON Matter Bridge",
        productId: PRODUCT_ID,
        serialNumber: `JASON-MATTER-${Math.floor(Math.random() * 1000000)}`,
        hardwareVersion: 1,
        softwareVersion: 1,
      },
    });

    // Start the commissioning server
    await commissioningServer.start();
    console.log("Matter commissioning server started");

    // Sync devices from JASON's device manager
    await syncDevicesFromJason();

    // Set up event listeners for device changes
    setupEventListeners();

    console.log("Matter bridge initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Matter bridge:", error);
    return false;
  }
}

/**
 * Sync devices from JASON's device manager
 */
async function syncDevicesFromJason() {
  try {
    // Get all devices from JASON's device manager
    const devices = await deviceManager.getAllDevices();

    // Convert JASON devices to Matter devices
    for (const device of devices) {
      // Only add devices that can be controlled
      if (
        device.capabilities &&
        (device.capabilities.includes("on") ||
          device.capabilities.includes("brightness") ||
          device.capabilities.includes("color"))
      ) {
        // Add device to Matter bridge
        await addDevice(device);
      }
    }

    console.log(
      `Synced ${matterDevices.size} devices from JASON to Matter bridge`,
    );
  } catch (error) {
    console.error("Error syncing devices from JASON:", error);
  }
}

/**
 * Set up event listeners for device changes
 */
function setupEventListeners() {
  // Listen for device state changes
  deviceManager.on("deviceStateChanged", async (device) => {
    // Update Matter device state
    await updateDevice(device);
  });

  // Listen for new devices
  deviceManager.on("deviceDiscovered", async (device) => {
    // Add device to Matter bridge
    await addDevice(device);
  });

  // Listen for device removals
  deviceManager.on("deviceRemoved", async (deviceId) => {
    // Remove device from Matter bridge
    await removeDevice(deviceId);
  });

  // Listen for Matter commands
  commissioningServer.on(
    "command",
    async (endpoint, clusterId, commandId, args) => {
      try {
        // Find the device associated with this endpoint
        const deviceEntry = Array.from(matterDevices.entries()).find(
          ([_, matterDevice]) => matterDevice.endpoint === endpoint,
        );

        if (!deviceEntry) {
          console.error(`No device found for endpoint ${endpoint}`);
          return;
        }

        const [deviceId, matterDevice] = deviceEntry;

        // Process the command based on cluster and command IDs
        const command = translateMatterCommand(clusterId, commandId, args);

        if (command) {
          // Send command to JASON device
          await deviceManager.controlDevice(deviceId, command);
          console.log(
            `Forwarded Matter command to device ${deviceId}:`,
            command,
          );
        }
      } catch (error) {
        console.error("Error processing Matter command:", error);
      }
    },
  );
}

/**
 * Translate Matter command to JASON command
 */
function translateMatterCommand(clusterId, commandId, args) {
  // OnOff cluster
  if (clusterId === 6) {
    if (commandId === 0) {
      return { on: false };
    } else if (commandId === 1) {
      return { on: true };
    } else if (commandId === 2) {
      return { on: true }; // Toggle, but we'll just turn on for simplicity
    }
  }

  // Level Control cluster
  if (clusterId === 8) {
    if (commandId === 0 || commandId === 1) {
      // Move to level or move to level with on/off
      const level = args.level || 0;
      return {
        on: true,
        brightness: Math.round((level / 254) * 100),
      };
    }
  }

  // Color Control cluster
  if (clusterId === 768) {
    if (commandId === 0) {
      // Move to hue
      const hue = args.hue || 0;
      return {
        color: {
          h: Math.round((hue / 254) * 360),
          s: 100,
          v: 100,
        },
      };
    } else if (commandId === 3) {
      // Move to saturation
      const saturation = args.saturation || 0;
      return {
        color: {
          s: Math.round((saturation / 254) * 100),
        },
      };
    } else if (commandId === 6) {
      // Move to color
      const x = args.colorX || 0;
      const y = args.colorY || 0;

      // Convert xy to hsv (simplified)
      const h = Math.round((x / 65535) * 360);
      const s = Math.round((y / 65535) * 100);

      return {
        color: {
          h,
          s,
          v: 100,
        },
      };
    }
  }

  return null;
}

/**
 * Add a device to the Matter bridge
 */
async function addDevice(device) {
  try {
    // Skip if device is already added
    if (matterDevices.has(device.id)) {
      return updateDevice(device);
    }

    // Determine device type and clusters
    const { deviceType, clusters } = getMatterDeviceType(device);

    // Create a new endpoint for the device
    const endpoint = await commissioningServer.addEndpoint({
      endpoint: matterDevices.size + 1,
      deviceType,
      clusters,
    });

    // Store the Matter device
    matterDevices.set(device.id, {
      endpoint,
      deviceType,
      clusters,
      originalDevice: device,
    });

    // Update initial state
    await updateDeviceState(device);

    console.log(
      `Added device to Matter bridge: ${device.name} (Endpoint: ${endpoint})`,
    );
    return endpoint;
  } catch (error) {
    console.error(`Error adding device ${device.id} to Matter bridge:`, error);
    return null;
  }
}

/**
 * Remove a device from the Matter bridge
 */
async function removeDevice(deviceId) {
  try {
    // Check if device exists
    if (!matterDevices.has(deviceId)) {
      return false;
    }

    const matterDevice = matterDevices.get(deviceId);

    // Remove the endpoint
    await commissioningServer.removeEndpoint(matterDevice.endpoint);

    // Remove from local store
    matterDevices.delete(deviceId);

    console.log(
      `Removed device from Matter bridge: ${deviceId} (Endpoint: ${matterDevice.endpoint})`,
    );
    return true;
  } catch (error) {
    console.error(
      `Error removing device ${deviceId} from Matter bridge:`,
      error,
    );
    return false;
  }
}

/**
 * Update a device in the Matter bridge
 */
async function updateDevice(device) {
  try {
    // Check if device exists
    if (!matterDevices.has(device.id)) {
      return await addDevice(device);
    }

    // Update device state
    await updateDeviceState(device);

    console.log(`Updated device in Matter bridge: ${device.name}`);
    return true;
  } catch (error) {
    console.error(
      `Error updating device ${device.id} in Matter bridge:`,
      error,
    );
    return false;
  }
}

/**
 * Update device state in Matter
 */
async function updateDeviceState(device) {
  try {
    // Get Matter device
    const matterDevice = matterDevices.get(device.id);
    if (!matterDevice) return false;

    const endpoint = matterDevice.endpoint;

    // Update OnOff cluster
    if (device.state && device.state.on !== undefined) {
      await commissioningServer.updateClusterState(endpoint, 6, {
        onOff: device.state.on ? 1 : 0,
      });
    }

    // Update Level Control cluster
    if (device.state && device.state.brightness !== undefined) {
      const level = Math.round((device.state.brightness / 100) * 254);
      await commissioningServer.updateClusterState(endpoint, 8, {
        currentLevel: level,
      });
    }

    // Update Color Control cluster
    if (device.state && device.state.color) {
      const { h, s, v } = device.state.color;

      // Convert HSV to xy (simplified)
      const x = Math.round((h / 360) * 65535);
      const y = Math.round((s / 100) * 65535);

      await commissioningServer.updateClusterState(endpoint, 768, {
        currentHue: Math.round((h / 360) * 254),
        currentSaturation: Math.round((s / 100) * 254),
        currentX: x,
        currentY: y,
      });
    }

    return true;
  } catch (error) {
    console.error(`Error updating state for device ${device.id}:`, error);
    return false;
  }
}

/**
 * Get Matter device type and clusters for a JASON device
 */
function getMatterDeviceType(device) {
  // Default clusters for all devices
  const baseClusters = [
    0, // Basic
    3, // Identify
    4, // Groups
    5, // Scenes
    57, // Diagnostic Logs
  ];

  // Determine device type and additional clusters
  let deviceType;
  let additionalClusters = [];

  switch (device.type) {
    case "light":
      deviceType = DeviceTypes.ON_OFF_LIGHT;
      additionalClusters.push(6); // OnOff

      if (device.capabilities && device.capabilities.includes("brightness")) {
        deviceType = DeviceTypes.DIMMABLE_LIGHT;
        additionalClusters.push(8); // Level Control
      }

      if (device.capabilities && device.capabilities.includes("color")) {
        deviceType = DeviceTypes.COLOR_TEMPERATURE_LIGHT;
        additionalClusters.push(768); // Color Control
      }
      break;

    case "switch":
    case "outlet":
      deviceType = DeviceTypes.ON_OFF_PLUG_IN_UNIT;
      additionalClusters.push(6); // OnOff
      break;

    case "thermostat":
      deviceType = DeviceTypes.THERMOSTAT;
      additionalClusters.push(513); // Thermostat
      break;

    case "sensor":
      deviceType = DeviceTypes.TEMPERATURE_SENSOR;
      additionalClusters.push(1026); // Temperature Measurement
      break;

    default:
      deviceType = DeviceTypes.ON_OFF_LIGHT;
      additionalClusters.push(6); // OnOff
  }

  return {
    deviceType,
    clusters: [...baseClusters, ...additionalClusters],
  };
}

/**
 * Get the Matter pairing code for the bridge
 */
function getPairingCode() {
  if (!commissioningServer) {
    return null;
  }

  return commissioningServer.getManualPairingCode();
}

/**
 * Get the Matter QR code for the bridge
 */
function getQRCode() {
  if (!commissioningServer) {
    return null;
  }

  return commissioningServer.getQRCode();
}

module.exports = {
  initialize,
  syncDevicesFromJason,
  addDevice,
  removeDevice,
  updateDevice,
  getPairingCode,
  getQRCode,
};

/**
 * Voice Assistant Token-Based Integration
 *
 * This module provides a secure, token-based approach for integrating with
 * voice assistants like Alexa and Google Assistant without requiring JASON
 * to store full user credentials.
 *
 * It implements a minimal cloud connector that acts as a secure bridge between
 * the voice assistant platforms and the user's local JASON instance.
 */

const crypto = require("crypto");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const deviceManager = require("../server/services/deviceManager");

// Store for active tokens
const activeTokens = new Map();
// Store for active WebSocket connections
const activeConnections = new Map();
// Store for device capabilities
const deviceCapabilities = new Map();

/**
 * Initialize the token-based integration
 */
function initialize() {
  try {
    console.log("Initializing voice assistant token-based integration...");

    // Clean up expired tokens periodically
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // Every hour

    console.log("Voice assistant token-based integration initialized");
    return true;
  } catch (error) {
    console.error(
      "Failed to initialize voice assistant token-based integration:",
      error,
    );
    return false;
  }
}

/**
 * Generate a new token for voice assistant integration
 * This token is used to establish a secure connection between
 * the voice assistant skill/action and the local JASON instance
 */
function generateToken(userId, expiryDays = 30) {
  // Generate a random token
  const token = crypto.randomBytes(32).toString("hex");

  // Calculate expiry date
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);

  // Store token with user ID and expiry
  activeTokens.set(token, {
    userId,
    expiry,
    created: new Date(),
  });

  console.log(
    `Generated voice assistant token for user ${userId}, expires ${expiry}`,
  );

  return {
    token,
    expiry,
  };
}

/**
 * Validate a token
 */
function validateToken(token) {
  // Check if token exists
  if (!activeTokens.has(token)) {
    return false;
  }

  // Check if token is expired
  const tokenData = activeTokens.get(token);
  if (tokenData.expiry < new Date()) {
    // Remove expired token
    activeTokens.delete(token);
    return false;
  }

  return tokenData;
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = new Date();
  let expiredCount = 0;

  for (const [token, data] of activeTokens.entries()) {
    if (data.expiry < now) {
      activeTokens.delete(token);
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired voice assistant tokens`);
  }
}

/**
 * Establish a WebSocket connection for real-time communication
 * between the voice assistant skill/action and the local JASON instance
 */
function establishConnection(token, ws) {
  // Validate token
  const tokenData = validateToken(token);
  if (!tokenData) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid or expired token",
      }),
    );
    ws.close();
    return false;
  }

  // Generate a connection ID
  const connectionId = uuidv4();

  // Store connection
  activeConnections.set(connectionId, {
    ws,
    userId: tokenData.userId,
    token,
    connected: new Date(),
  });

  // Set up event listeners
  ws.on("message", (message) => handleWebSocketMessage(connectionId, message));
  ws.on("close", () => handleWebSocketClose(connectionId));

  // Send confirmation
  ws.send(
    JSON.stringify({
      type: "connected",
      connectionId,
      userId: tokenData.userId,
    }),
  );

  console.log(
    `Established WebSocket connection for user ${tokenData.userId} (Connection ID: ${connectionId})`,
  );

  // Sync devices
  syncDevices(connectionId);

  return connectionId;
}

/**
 * Handle WebSocket message
 */
async function handleWebSocketMessage(connectionId, message) {
  try {
    // Get connection
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return;
    }

    // Parse message
    const data = JSON.parse(message);

    // Handle different message types
    switch (data.type) {
      case "discovery":
        await handleDiscovery(connectionId);
        break;

      case "command":
        await handleCommand(connectionId, data.deviceId, data.command);
        break;

      case "ping":
        // Respond with pong to keep connection alive
        connection.ws.send(
          JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString(),
          }),
        );
        break;

      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  } catch (error) {
    console.error(
      `Error handling WebSocket message for connection ${connectionId}:`,
      error,
    );
  }
}

/**
 * Handle WebSocket close
 */
function handleWebSocketClose(connectionId) {
  // Remove connection
  if (activeConnections.has(connectionId)) {
    const connection = activeConnections.get(connectionId);
    console.log(
      `WebSocket connection closed for user ${connection.userId} (Connection ID: ${connectionId})`,
    );
    activeConnections.delete(connectionId);
  }
}

/**
 * Handle device discovery request
 */
async function handleDiscovery(connectionId) {
  try {
    // Get connection
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return;
    }

    // Get all devices from JASON's device manager
    const devices = await deviceManager.getAllDevices();

    // Format devices for voice assistants
    const formattedDevices = devices.map(formatDeviceForVoiceAssistant);

    // Store device capabilities for future reference
    formattedDevices.forEach((device) => {
      deviceCapabilities.set(device.id, device.capabilities);
    });

    // Send devices to client
    connection.ws.send(
      JSON.stringify({
        type: "discovery_response",
        devices: formattedDevices,
      }),
    );

    console.log(
      `Sent ${formattedDevices.length} devices to connection ${connectionId}`,
    );
  } catch (error) {
    console.error(
      `Error handling discovery for connection ${connectionId}:`,
      error,
    );
  }
}

/**
 * Format device for voice assistant
 */
function formatDeviceForVoiceAssistant(device) {
  // Determine device category
  let category = "OTHER";
  let capabilities = [];

  if (device.type === "light") {
    category = "LIGHT";
    capabilities.push("PowerController");

    if (device.capabilities && device.capabilities.includes("brightness")) {
      capabilities.push("BrightnessController");
    }

    if (device.capabilities && device.capabilities.includes("color")) {
      capabilities.push("ColorController");
    }
  } else if (device.type === "switch" || device.type === "outlet") {
    category = device.type === "switch" ? "SWITCH" : "SMARTPLUG";
    capabilities.push("PowerController");
  } else if (device.type === "thermostat") {
    category = "THERMOSTAT";
    capabilities.push("ThermostatController");
  } else if (device.type === "speaker") {
    category = "SPEAKER";
    capabilities.push("Speaker");
    capabilities.push("VolumeController");
  } else if (device.type === "sensor") {
    category = "SENSOR";
    capabilities.push("TemperatureSensor");
  }

  return {
    id: device.id,
    name: device.name,
    description: device.description || `JASON ${device.type}`,
    manufacturer: device.manufacturer || "JASON",
    model: device.model || "Virtual Device",
    category,
    capabilities,
    state: {
      online: device.online !== false,
      power: device.state?.on || false,
      brightness: device.state?.brightness || 0,
      color: device.state?.color,
    },
  };
}

/**
 * Handle device command
 */
async function handleCommand(connectionId, deviceId, command) {
  try {
    // Get connection
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return;
    }

    console.log(`Received command for device ${deviceId}:`, command);

    // Send command to JASON's device manager
    const result = await deviceManager.controlDevice(deviceId, command);

    // Send response to client
    connection.ws.send(
      JSON.stringify({
        type: "command_response",
        deviceId,
        command,
        success: result.success !== false,
        state: result.state || {},
      }),
    );
  } catch (error) {
    console.error(`Error handling command for device ${deviceId}:`, error);

    // Send error response
    const connection = activeConnections.get(connectionId);
    if (connection) {
      connection.ws.send(
        JSON.stringify({
          type: "command_response",
          deviceId,
          command,
          success: false,
          error: error.message,
        }),
      );
    }
  }
}

/**
 * Sync devices to all active connections
 */
async function syncDevices(specificConnectionId = null) {
  try {
    // Get all devices from JASON's device manager
    const devices = await deviceManager.getAllDevices();

    // Format devices for voice assistants
    const formattedDevices = devices.map(formatDeviceForVoiceAssistant);

    // Store device capabilities for future reference
    formattedDevices.forEach((device) => {
      deviceCapabilities.set(device.id, device.capabilities);
    });

    // Send to specific connection or all connections
    if (specificConnectionId && activeConnections.has(specificConnectionId)) {
      const connection = activeConnections.get(specificConnectionId);
      connection.ws.send(
        JSON.stringify({
          type: "devices_update",
          devices: formattedDevices,
        }),
      );
    } else {
      // Send to all connections
      for (const [connectionId, connection] of activeConnections.entries()) {
        connection.ws.send(
          JSON.stringify({
            type: "devices_update",
            devices: formattedDevices,
          }),
        );
      }
    }
  } catch (error) {
    console.error("Error syncing devices:", error);
  }
}

/**
 * Handle device state change
 */
function handleDeviceStateChange(deviceId, state) {
  try {
    // Send state update to all connections
    for (const [connectionId, connection] of activeConnections.entries()) {
      connection.ws.send(
        JSON.stringify({
          type: "state_update",
          deviceId,
          state,
        }),
      );
    }
  } catch (error) {
    console.error(`Error handling state change for device ${deviceId}:`, error);
  }
}

// Listen for device state changes
deviceManager.on("deviceStateChanged", (device) => {
  handleDeviceStateChange(device.id, device.state);
});

// Listen for device discovery
deviceManager.on("deviceDiscovered", async () => {
  await syncDevices();
});

// Listen for device removal
deviceManager.on("deviceRemoved", async () => {
  await syncDevices();
});

module.exports = {
  initialize,
  generateToken,
  validateToken,
  establishConnection,
};

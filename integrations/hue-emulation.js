/**
 * Hue Bridge Emulation Service
 *
 * This module emulates a Philips Hue Bridge on the local network, allowing
 * voice assistants like Alexa and Google Assistant to discover and control
 * devices without requiring JASON to store user credentials.
 *
 * The emulation uses the SSDP protocol for discovery and implements the
 * Hue API endpoints that voice assistants use to control devices.
 */

const http = require("http");
const SSDP = require("node-ssdp").Server;
const ip = require("ip");
const { v4: uuidv4 } = require("uuid");
const deviceManager = require("../server/services/deviceManager");

// Configuration
const PORT = process.env.HUE_EMULATION_PORT || 8080;
const BRIDGE_ID = process.env.HUE_EMULATION_ID || generateBridgeId();
const BRIDGE_NAME = process.env.HUE_EMULATION_NAME || "JASON Hue Bridge";

// Store for virtual devices
const virtualDevices = new Map();
// Store for virtual users (no real authentication needed)
const virtualUsers = new Map();
// Default username for easy discovery
const DEFAULT_USERNAME = "jasonhueuser";

// Initialize the emulation service
function initialize() {
  try {
    console.log("Initializing Hue Bridge emulation service...");

    // Create a virtual user for discovery
    virtualUsers.set(DEFAULT_USERNAME, {
      name: "JASON User",
      created: new Date().toISOString(),
    });

    // Start HTTP server for Hue API
    startHueApiServer();

    // Start SSDP server for discovery
    startSSDPServer();

    // Sync devices from JASON's device manager
    syncDevicesFromJason();

    console.log(`Hue Bridge emulation running on port ${PORT}`);
    console.log(`Bridge ID: ${BRIDGE_ID}`);
    return true;
  } catch (error) {
    console.error("Failed to initialize Hue Bridge emulation:", error);
    return false;
  }
}

// Generate a Hue Bridge ID (format: 00:17:88:01:XX:XX:XX:XX)
function generateBridgeId() {
  const macPart = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join(":");

  return `00:17:88:01:${macPart}`;
}

// Start the HTTP server for Hue API
function startHueApiServer() {
  const server = http.createServer((req, res) => {
    try {
      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Parse URL and method
      const url = new URL(req.url, `http://${req.headers.host}`);
      const path = url.pathname;
      const method = req.method;

      console.log(`Hue API request: ${method} ${path}`);

      // Route the request
      if (path === "/api" && method === "GET") {
        handleRootApi(req, res);
      } else if (path === "/api" && method === "POST") {
        handleCreateUser(req, res);
      } else if (path.match(/^\/api\/[^/]+\/?$/)) {
        handleUserApi(req, res, path);
      } else if (path.match(/^\/api\/[^/]+\/lights\/?$/)) {
        handleLightsApi(req, res, path);
      } else if (path.match(/^\/api\/[^/]+\/lights\/[^/]+\/?$/)) {
        handleLightApi(req, res, path);
      } else if (path.match(/^\/api\/[^/]+\/lights\/[^/]+\/state\/?$/)) {
        handleLightStateApi(req, res, path, req.method);
      } else if (path === "/description.xml") {
        handleDescriptionXml(req, res);
      } else {
        // Not found
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } catch (error) {
      console.error("Error handling Hue API request:", error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Hue API server listening on port ${PORT}`);
  });

  return server;
}

// Start SSDP server for discovery
function startSSDPServer() {
  const localIp = ip.address();
  const ssdpServer = new SSDP({
    location: `http://${localIp}:${PORT}/description.xml`,
    udn: `uuid:2f402f80-da50-11e1-9b23-${BRIDGE_ID.replace(/:/g, "")}`,
    allowWildcards: true,
  });

  // Define the SSDP service type for Hue Bridge
  ssdpServer.addUSN("upnp:rootdevice");
  ssdpServer.addUSN("urn:schemas-upnp-org:device:basic:1");
  ssdpServer.addUSN("urn:schemas-upnp-org:device:Basic:1");
  ssdpServer.addUSN(
    `uuid:2f402f80-da50-11e1-9b23-${BRIDGE_ID.replace(/:/g, "")}`,
  );

  // Start the SSDP server
  ssdpServer.start();

  console.log("SSDP discovery service started");

  return ssdpServer;
}

// Sync devices from JASON's device manager
async function syncDevicesFromJason() {
  try {
    // Get all devices from JASON's device manager
    const devices = await deviceManager.getAllDevices();

    // Convert JASON devices to virtual Hue devices
    devices.forEach((device, index) => {
      // Only add devices that can be controlled (lights, switches, etc.)
      if (
        device.capabilities &&
        (device.capabilities.includes("on") ||
          device.capabilities.includes("brightness") ||
          device.capabilities.includes("color"))
      ) {
        // Create a virtual Hue device
        const virtualDevice = createVirtualHueDevice(device, index + 1);
        virtualDevices.set(virtualDevice.id.toString(), virtualDevice);
      }
    });

    console.log(
      `Synced ${virtualDevices.size} devices from JASON to Hue emulation`,
    );
  } catch (error) {
    console.error("Error syncing devices from JASON:", error);
  }
}

// Create a virtual Hue device from a JASON device
function createVirtualHueDevice(device, id) {
  // Map device type to Hue device type
  let hueType = "Extended color light"; // Default

  if (device.type === "switch" || device.type === "outlet") {
    hueType = "On/Off plug-in unit";
  } else if (
    device.type === "light" &&
    !device.capabilities.includes("color")
  ) {
    hueType = "Dimmable light";
  }

  // Create state object
  const state = {
    on: device.state?.on || false,
    bri: device.state?.brightness
      ? Math.round(device.state.brightness * 2.54)
      : 254,
    hue: 0,
    sat: 0,
    effect: "none",
    xy: [0.5, 0.5],
    ct: 500,
    alert: "none",
    colormode: "hs",
    mode: "homeautomation",
    reachable: device.online || true,
  };

  // Add color if supported
  if (
    device.capabilities &&
    device.capabilities.includes("color") &&
    device.state?.color
  ) {
    state.hue = Math.round((device.state.color.h / 360) * 65535);
    state.sat = Math.round((device.state.color.s / 100) * 254);
  }

  // Create the virtual Hue device
  return {
    id: id,
    state: state,
    swupdate: {
      state: "noupdates",
      lastinstall: "2020-01-01T00:00:00",
    },
    type: hueType,
    name: device.name || `JASON Device ${id}`,
    modelid: "JASON001",
    manufacturername: "JASON",
    productname: "JASON Virtual Device",
    capabilities: {
      certified: true,
      control: {
        mindimlevel: 1000,
        maxlumen: 800,
      },
      streaming: {
        renderer: true,
        proxy: true,
      },
    },
    config: {
      archetype: "classicbulb",
      function: "mixed",
      direction: "omnidirectional",
    },
    uniqueid: `00:17:88:01:${BRIDGE_ID.substring(12)}:${id.toString().padStart(2, "0")}-0b`,
    swversion: "1.0.0",
    originalDevice: device,
  };
}

// Handle root API request
function handleRootApi(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      name: BRIDGE_NAME,
      datastoreversion: "76",
      swversion: "1948086000",
    }),
  );
}

// Handle user creation request
function handleCreateUser(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body);

      // Always create a user (no real authentication needed)
      const username = uuidv4().replace(/-/g, "").substring(0, 16);

      virtualUsers.set(username, {
        name: data.devicetype || "JASON User",
        created: new Date().toISOString(),
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{ success: { username } }]));

      console.log(`Created virtual Hue user: ${username}`);
    } catch (error) {
      console.error("Error creating user:", error);
      res.writeHead(400);
      res.end(
        JSON.stringify([
          { error: { type: 1, description: "Invalid request" } },
        ]),
      );
    }
  });
}

// Handle user API request
function handleUserApi(req, res) {
  const username = req.url.split("/")[2];

  // Check if user exists (or use default)
  if (!virtualUsers.has(username) && username !== DEFAULT_USERNAME) {
    res.writeHead(401);
    res.end(
      JSON.stringify([
        { error: { type: 1, description: "Unauthorized user" } },
      ]),
    );
    return;
  }

  // Return full bridge state
  const fullState = {
    lights: {},
    groups: {},
    config: {
      name: BRIDGE_NAME,
      mac: BRIDGE_ID,
      dhcp: true,
      ipaddress: ip.address(),
      netmask: "255.255.255.0",
      gateway: ip.address().split(".").slice(0, 3).join(".") + ".1",
      proxyaddress: "none",
      proxyport: 0,
      UTC: new Date().toISOString().split(".")[0],
      localtime: new Date().toISOString().split(".")[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      whitelist: {},
      swversion: "1948086000",
      apiversion: "1.48.0",
      swupdate: {
        updatestate: 0,
        checkforupdate: false,
        devicetypes: { bridge: false, lights: [], sensors: [] },
        url: "",
        text: "",
        notify: false,
      },
      linkbutton: true,
      portalservices: false,
      portalconnection: "disconnected",
      portalstate: {
        signedon: false,
        incoming: false,
        outgoing: false,
        communication: "disconnected",
      },
    },
    schedules: {},
    scenes: {},
    rules: {},
    sensors: {},
    resourcelinks: {},
  };

  // Add all virtual devices
  virtualDevices.forEach((device, id) => {
    fullState.lights[id] = {
      state: device.state,
      swupdate: device.swupdate,
      type: device.type,
      name: device.name,
      modelid: device.modelid,
      manufacturername: device.manufacturername,
      productname: device.productname,
      capabilities: device.capabilities,
      config: device.config,
      uniqueid: device.uniqueid,
      swversion: device.swversion,
    };
  });

  // Add the user to whitelist
  fullState.config.whitelist[username] = {
    "last use date": new Date().toISOString().split(".")[0],
    "create date":
      virtualUsers.get(username)?.created ||
      new Date().toISOString().split(".")[0],
    name: virtualUsers.get(username)?.name || "JASON User",
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(fullState));
}

// Handle lights API request
function handleLightsApi(req, res) {
  const username = req.url.split("/")[2];

  // Check if user exists (or use default)
  if (!virtualUsers.has(username) && username !== DEFAULT_USERNAME) {
    res.writeHead(401);
    res.end(
      JSON.stringify([
        { error: { type: 1, description: "Unauthorized user" } },
      ]),
    );
    return;
  }

  // Return all lights
  const lights = {};
  virtualDevices.forEach((device, id) => {
    lights[id] = {
      state: device.state,
      swupdate: device.swupdate,
      type: device.type,
      name: device.name,
      modelid: device.modelid,
      manufacturername: device.manufacturername,
      productname: device.productname,
      capabilities: device.capabilities,
      config: device.config,
      uniqueid: device.uniqueid,
      swversion: device.swversion,
    };
  });

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(lights));
}

// Handle single light API request
function handleLightApi(req, res, path) {
  const parts = path.split("/");
  const username = parts[2];
  const lightId = parts[4];

  // Check if user exists (or use default)
  if (!virtualUsers.has(username) && username !== DEFAULT_USERNAME) {
    res.writeHead(401);
    res.end(
      JSON.stringify([
        { error: { type: 1, description: "Unauthorized user" } },
      ]),
    );
    return;
  }

  // Check if light exists
  if (!virtualDevices.has(lightId)) {
    res.writeHead(404);
    res.end(
      JSON.stringify([
        { error: { type: 3, description: "Resource not available" } },
      ]),
    );
    return;
  }

  // Return light info
  const device = virtualDevices.get(lightId);
  const lightInfo = {
    state: device.state,
    swupdate: device.swupdate,
    type: device.type,
    name: device.name,
    modelid: device.modelid,
    manufacturername: device.manufacturername,
    productname: device.productname,
    capabilities: device.capabilities,
    config: device.config,
    uniqueid: device.uniqueid,
    swversion: device.swversion,
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(lightInfo));
}

// Handle light state API request
function handleLightStateApi(req, res, path, method) {
  const parts = path.split("/");
  const username = parts[2];
  const lightId = parts[4];

  // Check if user exists (or use default)
  if (!virtualUsers.has(username) && username !== DEFAULT_USERNAME) {
    res.writeHead(401);
    res.end(
      JSON.stringify([
        { error: { type: 1, description: "Unauthorized user" } },
      ]),
    );
    return;
  }

  // Check if light exists
  if (!virtualDevices.has(lightId)) {
    res.writeHead(404);
    res.end(
      JSON.stringify([
        { error: { type: 3, description: "Resource not available" } },
      ]),
    );
    return;
  }

  // Handle PUT request to update state
  if (method === "PUT") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const stateUpdate = JSON.parse(body);
        const device = virtualDevices.get(lightId);
        const originalDevice = device.originalDevice;
        const response = [];

        // Update virtual device state
        for (const [key, value] of Object.entries(stateUpdate)) {
          device.state[key] = value;
          response.push({
            success: { [`/lights/${lightId}/state/${key}`]: value },
          });
        }

        // Forward command to actual device via JASON's device manager
        if (originalDevice && originalDevice.id) {
          const command = {};

          // Map Hue state to JASON command
          if (stateUpdate.on !== undefined) {
            command.on = stateUpdate.on;
          }

          if (stateUpdate.bri !== undefined) {
            command.brightness = Math.round((stateUpdate.bri / 254) * 100);
          }

          if (stateUpdate.hue !== undefined || stateUpdate.sat !== undefined) {
            command.color = {
              h:
                stateUpdate.hue !== undefined
                  ? Math.round((stateUpdate.hue / 65535) * 360)
                  : originalDevice.state?.color?.h || 0,
              s:
                stateUpdate.sat !== undefined
                  ? Math.round((stateUpdate.sat / 254) * 100)
                  : originalDevice.state?.color?.s || 0,
              v:
                stateUpdate.bri !== undefined
                  ? Math.round((stateUpdate.bri / 254) * 100)
                  : originalDevice.state?.color?.v || 100,
            };
          }

          // Send command to actual device
          try {
            await deviceManager.controlDevice(originalDevice.id, command);
            console.log(
              `Forwarded command to device ${originalDevice.id}:`,
              command,
            );
          } catch (error) {
            console.error(
              `Error forwarding command to device ${originalDevice.id}:`,
              error,
            );
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error("Error updating light state:", error);
        res.writeHead(400);
        res.end(
          JSON.stringify([
            { error: { type: 1, description: "Invalid request" } },
          ]),
        );
      }
    });
  } else {
    res.writeHead(405);
    res.end(
      JSON.stringify([
        { error: { type: 4, description: "Method not available" } },
      ]),
    );
  }
}

// Handle description.xml request (for SSDP discovery)
function handleDescriptionXml(req, res) {
  const localIp = ip.address();
  const bridgeIdFormatted = BRIDGE_ID.replace(/:/g, "");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
  <specVersion>
    <major>1</major>
    <minor>0</minor>
  </specVersion>
  <URLBase>http://${localIp}:${PORT}/</URLBase>
  <device>
    <deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>
    <friendlyName>Philips hue (${localIp})</friendlyName>
    <manufacturer>Signify</manufacturer>
    <manufacturerURL>https://www.signify.com/</manufacturerURL>
    <modelDescription>Philips hue Personal Wireless Lighting</modelDescription>
    <modelName>Philips hue bridge 2015</modelName>
    <modelNumber>BSB002</modelNumber>
    <modelURL>https://www.philips-hue.com/</modelURL>
    <serialNumber>${bridgeIdFormatted}</serialNumber>
    <UDN>uuid:2f402f80-da50-11e1-9b23-${bridgeIdFormatted}</UDN>
    <presentationURL>index.html</presentationURL>
    <iconList>
      <icon>
        <mimetype>image/png</mimetype>
        <height>48</height>
        <width>48</width>
        <depth>24</depth>
        <url>hue_logo_0.png</url>
      </icon>
    </iconList>
  </device>
</root>`;

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(xml);
}

// Add a device to the virtual Hue bridge
function addDevice(device) {
  const id = (virtualDevices.size + 1).toString();
  const virtualDevice = createVirtualHueDevice(device, id);
  virtualDevices.set(id, virtualDevice);
  console.log(`Added device to Hue emulation: ${device.name} (ID: ${id})`);
  return id;
}

// Remove a device from the virtual Hue bridge
function removeDevice(deviceId) {
  // Find the virtual device with the matching original device ID
  for (const [id, device] of virtualDevices.entries()) {
    if (device.originalDevice && device.originalDevice.id === deviceId) {
      virtualDevices.delete(id);
      console.log(
        `Removed device from Hue emulation: ${deviceId} (Virtual ID: ${id})`,
      );
      return true;
    }
  }

  return false;
}

// Update a device in the virtual Hue bridge
function updateDevice(device) {
  // Find the virtual device with the matching original device ID
  for (const [id, virtualDevice] of virtualDevices.entries()) {
    if (
      virtualDevice.originalDevice &&
      virtualDevice.originalDevice.id === device.id
    ) {
      // Update the virtual device
      const updatedDevice = createVirtualHueDevice(device, parseInt(id));
      virtualDevices.set(id, updatedDevice);
      console.log(
        `Updated device in Hue emulation: ${device.name} (ID: ${id})`,
      );
      return true;
    }
  }

  // If not found, add as new device
  addDevice(device);
  return true;
}

module.exports = {
  initialize,
  syncDevicesFromJason,
  addDevice,
  removeDevice,
  updateDevice,
};

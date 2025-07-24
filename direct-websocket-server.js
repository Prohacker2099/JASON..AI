// Direct WebSocket server implementation
// This file creates a standalone WebSocket server that connects to the main API

import { WebSocketServer } from "ws";
import http from "http";

// Create WebSocket server
const wss = new WebSocketServer({ port: 8992 });
console.log("WebSocket server started on port 8992");

// Store discovered devices
let cachedDevices = [];

// Fetch devices from API
async function fetchDevices() {
  return new Promise((resolve, reject) => {
    const req = http.get("http://localhost:3001/api/devices", (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response.devices || []);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
}

// Trigger a network scan
async function triggerScan() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:3001/api/scan", (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ error: e.message });
    });

    req.end();
  });
}

// Control a device
async function controlDevice(deviceId, action, value) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      action,
      value,
    });

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/devices/${deviceId}/control`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

// Handle WebSocket connections
wss.on("connection", async (ws) => {
  console.log("Client connected");

  // Send initial device list if available
  try {
    cachedDevices = await fetchDevices();
    console.log(`Sending ${cachedDevices.length} devices to client`);

    ws.send(
      JSON.stringify({
        type: "deviceList",
        devices: cachedDevices,
      }),
    );
  } catch (error) {
    console.error("Error fetching devices:", error);
  }

  // Handle messages from client
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received message:", data);

      if (data.type === "startDiscovery") {
        console.log("Starting device discovery...");

        // Trigger a scan
        const scanResult = await triggerScan();
        console.log("Scan initiated:", scanResult);

        // Wait for scan to complete
        console.log("Waiting for scan to complete...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Fetch updated devices
        cachedDevices = await fetchDevices();
        console.log(`Found ${cachedDevices.length} devices`);

        // Send updated device list
        ws.send(
          JSON.stringify({
            type: "deviceList",
            devices: cachedDevices,
          }),
        );
      } else if (data.type === "controlDevice") {
        console.log(`Controlling device ${data.deviceId}: ${data.command}`);

        // Control the device
        const result = await controlDevice(
          data.deviceId,
          data.command,
          data.params?.state,
        );

        // Send response
        ws.send(
          JSON.stringify({
            type: "controlResponse",
            requestId: data.requestId,
            success: !result.error,
            error: result.error,
          }),
        );

        // Fetch updated devices
        cachedDevices = await fetchDevices();

        // Find the controlled device
        const device = cachedDevices.find((d) => d.id === data.deviceId);
        if (device) {
          // Send device update
          ws.send(
            JSON.stringify({
              type: "deviceUpdated",
              device,
            }),
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Periodically refresh devices
setInterval(async () => {
  try {
    cachedDevices = await fetchDevices();
    console.log(`Refreshed devices: ${cachedDevices.length} found`);

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(
          JSON.stringify({
            type: "deviceList",
            devices: cachedDevices,
          }),
        );
      }
    });
  } catch (error) {
    console.error("Error refreshing devices:", error);
  }
}, 30000); // Every 30 seconds

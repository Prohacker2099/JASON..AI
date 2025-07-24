// WebSocket Debug Tool
// This script helps diagnose issues with the WebSocket server

import { WebSocket } from "ws";
import http from "http";

// Create a simple HTTP server to check if the main server is running
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:3001/api/status", (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const status = JSON.parse(data);
          console.log("✅ Main server is running:", status);
          resolve(true);
        } catch (e) {
          console.log("❌ Error parsing server status:", e.message);
          resolve(false);
        }
      });
    });

    req.on("error", (e) => {
      console.log("❌ Main server is not running:", e.message);
      resolve(false);
    });

    req.end();
  });
};

// Check devices via HTTP API
const checkDevicesAPI = () => {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:3001/api/devices", (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ API found ${response.devices?.length || 0} devices`);
          if (response.devices?.length > 0) {
            console.log(
              "First device:",
              JSON.stringify(response.devices[0], null, 2),
            );
          }
          resolve(response.devices || []);
        } catch (e) {
          console.log("❌ Error parsing devices:", e.message);
          resolve([]);
        }
      });
    });

    req.on("error", (e) => {
      console.log("❌ Error fetching devices:", e.message);
      resolve([]);
    });

    req.end();
  });
};

// Force a network scan via API
const forceScan = () => {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:3001/api/scan", (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          console.log("✅ Scan initiated:", response);
          resolve(true);
        } catch (e) {
          console.log("❌ Error parsing scan response:", e.message);
          resolve(false);
        }
      });
    });

    req.on("error", (e) => {
      console.log("❌ Error initiating scan:", e.message);
      resolve(false);
    });

    req.end();
  });
};

// Connect to WebSocket server
const connectWebSocket = () => {
  console.log("Connecting to WebSocket server...");
  const ws = new WebSocket("ws://localhost:8990");

  ws.on("open", () => {
    console.log("✅ Connected to WebSocket server");

    // Send a message to start device discovery
    console.log("Sending startDiscovery request...");
    ws.send(JSON.stringify({ type: "startDiscovery" }));
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`\n📩 Received message type: ${message.type}`);

      if (message.type === "deviceList") {
        console.log(
          `🔍 Found ${message.devices?.length || 0} devices via WebSocket`,
        );
        if (message.devices?.length > 0) {
          console.log(
            "First device:",
            JSON.stringify(message.devices[0], null, 2),
          );
        } else {
          console.log("❌ No devices in WebSocket response");
        }
      }
    } catch (e) {
      console.log("❌ Error parsing WebSocket message:", e.message);
      console.log("Raw data:", data.toString());
    }
  });

  ws.on("error", (err) => {
    console.log("❌ WebSocket error:", err.message);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  return ws;
};

// Main function
const main = async () => {
  console.log("🔍 Starting WebSocket debug tool...");

  // Check if the main server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log("❌ Please start the server first with: npm run dev");
    process.exit(1);
  }

  // Force a network scan
  console.log("\n🔍 Forcing network scan...");
  await forceScan();

  // Wait for scan to complete
  console.log("Waiting for scan to complete...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Check devices via API
  console.log("\n🔍 Checking devices via API...");
  const apiDevices = await checkDevicesAPI();

  // Connect to WebSocket
  console.log("\n🔍 Testing WebSocket connection...");
  const ws = connectWebSocket();

  // Keep the process running
  console.log("\n⏳ Waiting for WebSocket messages...");

  // Create a direct WebSocket server for testing
  console.log("\n🔧 Creating test WebSocket server on port 8991...");
  const wss = new WebSocket.Server({ port: 8991 });

  wss.on("connection", (client) => {
    console.log("✅ Client connected to test WebSocket server");

    // Send the devices we got from the API
    client.send(
      JSON.stringify({
        type: "deviceList",
        devices: apiDevices,
      }),
    );

    client.on("message", (message) => {
      console.log("Received message from client:", message.toString());
    });
  });

  console.log("✅ Test WebSocket server running on port 8991");
  console.log(
    'You can connect to it with: const ws = new WebSocket("ws://localhost:8991")',
  );
};

main().catch((err) => {
  console.error("Error in debug tool:", err);
});

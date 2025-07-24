// Simple WebSocket test client
import { WebSocket } from "ws";

// Connect to the WebSocket server
const ws = new WebSocket("ws://localhost:8991"); // Updated port to 8991

// Track connection state
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;

// Function to start device discovery
function startDiscovery() {
  if (isConnected) {
    console.log("Sending startDiscovery request...");
    ws.send(JSON.stringify({ type: "startDiscovery" }));
  } else {
    console.log("Not connected yet, waiting...");
  }
}

// Connection opened
ws.on("open", function open() {
  console.log("✅ Connected to WebSocket server");
  isConnected = true;

  // Send a message to start device discovery
  console.log("Starting device discovery...");
  startDiscovery();

  // Set up periodic discovery refresh
  setInterval(() => {
    console.log("Refreshing device list...");
    startDiscovery();
  }, 10000); // Refresh every 10 seconds
});

// Listen for messages
ws.on("message", function incoming(data) {
  try {
    const message = JSON.parse(data.toString());
    console.log(`\n📩 Received message type: ${message.type}`);

    if (message.type === "deviceList") {
      console.log(`🔍 Found ${message.devices.length} devices`);

      if (message.devices.length > 0) {
        console.log("\n📱 Devices found:");
        message.devices.forEach((device, index) => {
          console.log(`\n${index + 1}. ${device.name} (${device.type})`);
          console.log(`   ID: ${device.id}`);
          console.log(`   IP: ${device.address}`);
          console.log(`   Status: ${device.state?.power ? "ON" : "OFF"}`);
          console.log(`   Capabilities: ${device.capabilities?.join(", ")}`);
        });

        // Try to control a device if any are found
        if (message.devices.length > 0) {
          const firstDevice = message.devices[0];
          console.log(`\n🎮 Attempting to control device: ${firstDevice.name}`);

          // Send control command for the first device
          ws.send(
            JSON.stringify({
              type: "controlDevice",
              deviceId: firstDevice.id,
              command: "power",
              params: { state: !firstDevice.state.power },
              requestId: Date.now().toString(),
            }),
          );
        }
      } else {
        console.log("❌ No devices found in the response");
      }
    } else if (message.type === "controlResponse") {
      console.log(
        `\n🎮 Control response: ${message.success ? "Success" : "Failed"}`,
      );
      if (message.error) {
        console.log(`   Error: ${message.error}`);
      }
    } else if (message.type === "deviceUpdated") {
      console.log(`\n🔄 Device updated: ${message.device.name}`);
      console.log(`   New state: ${message.device.state.power ? "ON" : "OFF"}`);
    }
  } catch (error) {
    console.error("Error parsing message:", error);
    console.log("Raw message:", data.toString());
  }
});

// Handle errors
ws.on("error", function error(err) {
  console.error("❌ WebSocket error:", err.message);

  if (!isConnected && retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`Retrying connection (${retryCount}/${MAX_RETRIES})...`);
    setTimeout(() => {
      // This will trigger a new connection attempt
      ws.terminate();
      ws = new WebSocket("ws://localhost:8990");
    }, 2000);
  }
});

// Connection closed
ws.on("close", function close() {
  console.log("WebSocket connection closed");
  isConnected = false;

  if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(
      `Connection closed. Reconnecting (${retryCount}/${MAX_RETRIES})...`,
    );
    setTimeout(() => {
      ws = new WebSocket("ws://localhost:8990");
    }, 2000);
  }
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Closing WebSocket connection...");
  ws.close();
  process.exit(0);
});

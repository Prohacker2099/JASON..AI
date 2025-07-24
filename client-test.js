// Simple WebSocket client test
const WebSocket = require("ws");

// Connect to WebSocket server
console.log("Connecting to WebSocket server...");
const ws = new WebSocket("ws://localhost:8990");

// Connection opened
ws.on("open", function () {
  console.log("Connected to WebSocket server");

  // Send discovery request
  console.log("Sending discovery request...");
  ws.send(JSON.stringify({ type: "startDiscovery" }));
});

// Listen for messages
ws.on("message", function (data) {
  console.log("Received message:");
  try {
    const message = JSON.parse(data);
    console.log("Message type:", message.type);

    if (message.type === "deviceList") {
      console.log(`Found ${message.devices.length} devices`);

      if (message.devices.length > 0) {
        console.log(
          "First device:",
          JSON.stringify(message.devices[0], null, 2),
        );
      } else {
        console.log("No devices found");
      }
    }
  } catch (error) {
    console.error("Error parsing message:", error);
    console.log("Raw data:", data.toString());
  }
});

// Handle errors
ws.on("error", function (error) {
  console.error("WebSocket error:", error);
});

// Connection closed
ws.on("close", function () {
  console.log("Connection closed");
});

// Keep the process running
console.log("Waiting for messages...");

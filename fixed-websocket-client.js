// Fixed WebSocket client for JASON
import WebSocket from "ws";

// Create WebSocket connection
const ws = new WebSocket("ws://localhost:8990");

// Connection opened
ws.on("open", function () {
  console.log("Connected to WebSocket server");

  // Send discovery request immediately
  sendDiscoveryRequest();

  // Then send periodic discovery requests
  setInterval(sendDiscoveryRequest, 5000);
});

// Send discovery request
function sendDiscoveryRequest() {
  console.log("Sending discovery request...");
  ws.send(
    JSON.stringify({
      type: "startDiscovery",
    }),
  );
}

// Listen for messages
ws.on("message", function (data) {
  try {
    const message = JSON.parse(data.toString());
    console.log(`Received message type: ${message.type}`);

    if (message.type === "deviceList") {
      const devices = message.devices || [];
      console.log(`Found ${devices.length} devices`);

      if (devices.length > 0) {
        devices.forEach((device, i) => {
          console.log(`\nDevice ${i + 1}: ${device.name}`);
          console.log(`  Type: ${device.type}`);
          console.log(`  ID: ${device.id}`);
          console.log(`  Address: ${device.address}`);
          console.log(`  Power: ${device.state?.power ? "ON" : "OFF"}`);
        });

        // Try to control the first device
        const firstDevice = devices[0];
        if (firstDevice) {
          console.log(`\nAttempting to control device: ${firstDevice.name}`);

          ws.send(
            JSON.stringify({
              type: "controlDevice",
              deviceId: firstDevice.id,
              command: "power",
              params: { state: !firstDevice.state?.power },
              requestId: Date.now().toString(),
            }),
          );
        }
      }
    }
  } catch (error) {
    console.error("Error parsing message:", error);
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

// Handle process termination
process.on("SIGINT", () => {
  console.log("Closing connection...");
  ws.close();
  process.exit(0);
});

// Simple script to test WebSocket connection
import WebSocket from "ws";
import http from "http";

// Check if server is running
console.log("Checking if server is running...");
http
  .get("http://localhost:3001/api/status", (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      try {
        const status = JSON.parse(data);
        console.log("✅ Server is running:", status);
        testWebSocket();
      } catch (e) {
        console.error("❌ Error parsing server status:", e.message);
      }
    });
  })
  .on("error", (e) => {
    console.error("❌ Server is not running:", e.message);
    console.log("Please start the server with: npm run dev");
  });

// Test WebSocket connection
function testWebSocket() {
  console.log("\nTesting WebSocket connection...");
  const ws = new WebSocket("ws://localhost:8990");

  ws.on("open", () => {
    console.log("✅ Connected to WebSocket server");

    // Send discovery request
    console.log("Sending discovery request...");
    ws.send(JSON.stringify({ type: "startDiscovery" }));

    // Close after 10 seconds
    setTimeout(() => {
      console.log("Test complete, closing connection...");
      ws.close();
      process.exit(0);
    }, 10000);
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`\n📩 Received message type: ${message.type}`);

      if (message.type === "deviceList") {
        const devices = message.devices || [];
        console.log(`Found ${devices.length} devices`);

        if (devices.length > 0) {
          console.log("\nFirst device:");
          console.log(JSON.stringify(devices[0], null, 2));
        }
      }
    } catch (e) {
      console.error("❌ Error parsing message:", e.message);
    }
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
}

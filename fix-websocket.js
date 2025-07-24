// Fix for WebSocket server implementation
// This script patches the main server's WebSocket implementation

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to server index.js
const serverIndexPath = path.join(__dirname, "server", "index.js");

// Read the file
console.log(`Reading ${serverIndexPath}...`);
let content = fs.readFileSync(serverIndexPath, "utf8");

// Find the WebSocket server section
const wsSection = content.indexOf(
  "// Create WebSocket server for device discovery",
);
if (wsSection === -1) {
  console.error("Could not find WebSocket server section in server/index.js");
  process.exit(1);
}

// Find the WebSocket connection handler
const wsConnectionHandler = content.indexOf("wss.on('connection'", wsSection);
if (wsConnectionHandler === -1) {
  console.error(
    "Could not find WebSocket connection handler in server/index.js",
  );
  process.exit(1);
}

// Find the end of the WebSocket connection handler
let openBraces = 0;
let closeBraces = 0;
let endIndex = wsConnectionHandler;

for (let i = wsConnectionHandler; i < content.length; i++) {
  if (content[i] === "{") {
    openBraces++;
  } else if (content[i] === "}") {
    closeBraces++;
    if (openBraces === closeBraces) {
      endIndex = i + 1;
      break;
    }
  }
}

// Create the fixed WebSocket handler
const fixedHandler = `wss.on('connection', (ws, req) => {
  console.log(\`Client connected to device discovery WebSocket from \${req.socket.remoteAddress}\`);
  
  // Send initial device list
  sendDeviceList(ws);
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('WebSocket message received:', data.type);
      
      if (data.type === 'startDiscovery') {
        console.log('WebSocket client requested device discovery');
        
        // Start scan in background
        scanNetwork().then(() => {
          // Send updated device list
          sendDeviceList(ws);
        });
      } else if (data.type === 'controlDevice') {
        console.log(\`WebSocket client requested device control: \${data.deviceId} - \${data.command}\`);
        
        // Find the device
        const device = realDevices.find(d => d.id === data.deviceId);
        if (device) {
          // Update device state
          if (data.command === 'power') {
            device.status = data.params?.state ? 'on' : 'off';
            console.log(\`Updated device \${device.id} status to \${device.status}\`);
          }
          
          // Send success response
          ws.send(JSON.stringify({
            type: 'controlResponse',
            requestId: data.requestId,
            success: true
          }));
          
          // Send updated device info
          sendDeviceUpdate(ws, device);
        } else {
          // Send error response
          ws.send(JSON.stringify({
            type: 'controlResponse',
            requestId: data.requestId,
            success: false,
            error: 'Device not found'
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected from device discovery WebSocket');
  });
});

// Helper function to send device list to a WebSocket client
function sendDeviceList(ws) {
  if (ws.readyState !== 1) return; // Only send if connection is OPEN
  
  const deviceList = realDevices.map(device => ({
    id: device.id,
    name: device.name,
    type: device.type,
    manufacturer: device.manufacturer || 'Unknown',
    model: device.model || device.manufacturer || 'Unknown',
    address: device.ipAddress,
    mac: device.mac || '',
    capabilities: device.capabilities || [device.type],
    state: {
      power: device.status === 'on',
      online: true
    },
    online: true
  }));
  
  console.log(\`Sending \${deviceList.length} devices to WebSocket client\`);
  
  ws.send(JSON.stringify({
    type: 'deviceList',
    devices: deviceList
  }));
}

// Helper function to send device update to a WebSocket client
function sendDeviceUpdate(ws, device) {
  if (ws.readyState !== 1) return; // Only send if connection is OPEN
  
  const deviceInfo = {
    id: device.id,
    name: device.name,
    type: device.type,
    manufacturer: device.manufacturer || 'Unknown',
    model: device.model || device.manufacturer || 'Unknown',
    address: device.ipAddress,
    mac: device.mac || '',
    capabilities: device.capabilities || [device.type],
    state: {
      power: device.status === 'on',
      online: true
    },
    online: true
  };
  
  console.log(\`Sending device update for \${device.id}\`);
  
  ws.send(JSON.stringify({
    type: 'deviceUpdated',
    device: deviceInfo
  }));
}`;

// Replace the old handler with the fixed one
const newContent =
  content.substring(0, wsConnectionHandler) +
  fixedHandler +
  content.substring(endIndex);

// Write the fixed file
const backupPath = path.join(__dirname, "server", "index.js.backup");
console.log(`Creating backup at ${backupPath}...`);
fs.writeFileSync(backupPath, content);

console.log(`Writing fixed file to ${serverIndexPath}...`);
fs.writeFileSync(serverIndexPath, newContent);

console.log("Done! Please restart the server with: npm run dev");

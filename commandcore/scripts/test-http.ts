import express from 'express';
import { initHTTP } from '../src/adapters/http.js';
import { initDeviceManager } from '../src/services/deviceManager.js';
import { initRuleEngine } from '../src/rules/engine.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';

// Add __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize services
const deviceManager = await initDeviceManager();
const ruleEngine = await initRuleEngine(deviceManager);

// Initialize HTTP adapter
initHTTP(app, deviceManager, ruleEngine);

// Start the server
const PORT = 3002;
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  console.log(`Test the following endpoints:`);
  console.log(`- GET    http://localhost:${PORT}/api/devices`);
  console.log(`- POST   http://localhost:${PORT}/api/devices/test-device/command`);
  console.log('\nPress Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down HTTP server...');
  server.close(() => {
    console.log('HTTP server stopped');
    process.exit(0);
  });
});

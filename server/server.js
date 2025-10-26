import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { createLogger, format, transports } from 'winston';
import DeviceIntegrationService from './services/DeviceIntegrationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Diagnostic: log server bootstrap with absolute path
console.log(`[server/server.js] Booting server from ${__filename}`);

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'jason-server.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Device Integration Service
const deviceService = new DeviceIntegrationService(logger);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/devices', async (req, res) => {
  try {
    // Start discovery if not already running
    if (!deviceService.isDiscovering) {
      await deviceService.startDiscovery();
    }
    
    // Get all discovered devices
    const devices = Array.from(deviceService.devices.values());
    res.json(devices);
  } catch (error) {
    logger.error('Failed to get devices', { error });
    res.status(500).json({ error: 'Failed to discover devices' });
  }
});

app.post('/api/devices/control', async (req, res) => {
  const { deviceId, action, value } = req.body;
  
  try {
    const device = deviceService.getDevice(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    let result;
    if (action === 'toggle') {
      result = await deviceService.toggleDevice(deviceId);
    } else if (action === 'setBrightness') {
      result = await deviceService.setDeviceBrightness(deviceId, parseInt(value) || 50);
    } else {
      result = await deviceService.sendCommand(deviceId, action, value);
    }

    res.json({ success: true, result });
  } catch (error) {
    logger.error('Device control failed', { deviceId, action, error });
    res.status(500).json({ error: 'Device control failed', details: error.message });
  }
});

app.get('/api/schedule', async (req, res) => {
  try {
    // Get schedules from device service if implemented
    const schedules = await deviceService.getSchedules?.() || [];
    res.json({ schedules });
  } catch (error) {
    logger.error('Failed to get schedules', { error });
    res.status(500).json({ error: 'Failed to get schedules' });
  }
});

app.get('/api/preferences', async (req, res) => {
  try {
    // Get preferences from device service if implemented
    const preferences = await deviceService.getPreferences?.() || {};
    res.json({ preferences });
  } catch (error) {
    logger.error('Failed to get preferences', { error });
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Health and root routes
// Diagnostic endpoint to verify which file is serving requests
app.get('/__whoami', (req, res) => {
  res.json({ file: __filename, cwd: process.cwd(), pid: process.pid });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.type('text/plain').send('JASON Server OK');
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 JASON AI Server running on port ${PORT}`);
  logger.info('🔍 Starting device discovery...');
  
  // Start device discovery
  deviceService.discoverDevices().catch(error => {
    logger.error('Initial device discovery failed', { error });
  });
});

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Shutting down server...');
  
  try {
    // Stop device discovery if implemented
    if (deviceService.isDiscovering && typeof deviceService.stopDiscovery === 'function') {
      await deviceService.stopDiscovery();
    }
    
    // Close server
    server.close(() => {
      logger.info('✅ Server stopped');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

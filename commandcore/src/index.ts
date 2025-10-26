import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initLogger } from './utils/logger';
import { initMQTT } from './adapters/mqtt';
import { initHTTP } from './adapters/http';
import { initWebSocket } from './adapters/websocket';
import { initBLEAdapter } from './adapters/ble';
import { initDeviceManager } from './services/deviceManager';
import { initRuleEngine } from './rules/engine';

// Initialize logger
const logger = initLogger('commandcore');

async function main() {
  // Initialize Express app
  const app = express();
  const httpServer = createServer(app);
  
  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  // Initialize WebSocket server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Initialize services
  const deviceManager = await initDeviceManager();
  const ruleEngine = await initRuleEngine(deviceManager);
  
  // Initialize adapters
  await initMQTT(deviceManager, ruleEngine);
  await initHTTP(app, deviceManager, ruleEngine);
  await initWebSocket(io, deviceManager, ruleEngine);
  
  // Initialize BLE adapter if enabled
  if (process.env.ENABLE_BLE !== 'false') {
    try {
      await initBLEAdapter(deviceManager, ruleEngine);
      logger.info('BLE adapter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BLE adapter:', error);
    }
  } else {
    logger.info('BLE adapter is disabled (ENABLE_BLE=false)');
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  const PORT = process.env.PORT || 3002;
  httpServer.listen(PORT, () => {
    logger.info(`CommandCore server running on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Failed to start CommandCore:', error);
  process.exit(1);
});

// test-http-fixed.ts - Comprehensive HTTP Adapter Test Script
console.log('Script started - Loading dependencies...');

import express, { Express } from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';

console.log('Dependencies loaded');

// Import with .js extension for ESM
import { initHTTP } from '../src/adapters/http.js';
import { initDeviceManager } from '../src/services/deviceManager.js';
import { initRuleEngine } from '../src/rules/engine.js';

// Add __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple logger for testing
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  http: (...args: any[]) => console.log('[HTTP]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args)
};

// Set global logger if not set
if (!(global as any).logger) {
  (global as any).logger = logger;
  logger.debug('Global logger initialized');
}

// Set up test environment
async function setupTestEnvironment() {
  logger.debug('Setting up test environment...');
  
  try {
    // Initialize Express app
    logger.debug('Initializing Express app...');
    const app = express();
    app.use(express.json());
    logger.debug('Express app initialized');

    // Initialize services with test logger
    logger.debug('Initializing Device Manager...');
    const deviceManager = await initDeviceManager();
    logger.debug('Device Manager initialized');
    
    logger.debug('Initializing Rule Engine...');
    const ruleEngine = await initRuleEngine(deviceManager);
    logger.debug('Rule Engine initialized');
    
    // Initialize HTTP adapter
    logger.debug('Initializing HTTP adapter...');
    initHTTP(app, deviceManager, ruleEngine);
    logger.debug('HTTP adapter initialized');
    
    return { app, deviceManager, ruleEngine };
  } catch (error) {
    logger.error('Error in setupTestEnvironment:', error);
    throw error;
  }
}

// Run tests
async function runTests() {
  logger.debug('Starting test execution...');
  
  try {
    logger.info('Setting up test environment...');
    const { app } = await setupTestEnvironment();
    
    // Start the server for manual testing
    const PORT = 3002;
    logger.debug(`Starting HTTP server on port ${PORT}...`);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      const address = server.address();
      const host = typeof address === 'string' ? address : 
                  address ? `${address.address}:${address.port}` : 'unknown';
                  
      logger.info(`HTTP server running on http://${host}`);
      logger.info('\nTest the following endpoints:');
      logger.info(`- GET    http://localhost:${PORT}/api/devices`);
      logger.info(`- GET    http://localhost:${PORT}/api/devices/:id`);
      logger.info(`- POST   http://localhost:${PORT}/api/devices/:id/command`);
      logger.info('\nPress Ctrl+C to stop the server');
    });

    // Error handling for server
    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('\nShutting down HTTP server...');
      server.close(() => {
        logger.info('HTTP server stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Test failed with error:', error);
    if (error instanceof Error) {
      logger.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the tests
runTests();

// test-http-minimal.ts - Minimal HTTP Adapter Test with built-in http module

// Redirect all console output to stderr so we can see it in the test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  originalConsoleLog('[LOG]', ...args);
  process.stderr.write(`[LOG] ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}` + '\n');
};

console.error = (...args: any[]) => {
  originalConsoleError('[ERROR]', ...args);
  process.stderr.write(`[ERROR] ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}` + '\n');
};

console.log('Script started - Minimal HTTP Adapter Test');

import http from 'http';
import { AddressInfo } from 'net';

// Track execution flow
console.log('1. Starting imports...');

// Use dynamic imports to better handle ESM and track loading
async function main() {
  try {
    console.log('2. Loading express...');
    const express = (await import('express')).default;
    
    console.log('3. Loading device manager...');
    const deviceManagerModule = await import('../src/services/deviceManager.js');
    
    console.log('4. Loading rule engine...');
    const ruleEngineModule = await import('../src/rules/engine.js');
    
    console.log('5. Loading HTTP adapter...');
    const httpAdapterModule = await import('../src/adapters/http.js');
    
    // Initialize services
    console.log('6. Initializing services...');
    const deviceManager = await deviceManagerModule.initDeviceManager();
    const ruleEngine = await ruleEngineModule.initRuleEngine(deviceManager);
    
    // Setup Express
    console.log('7. Setting up Express...');
    const app = express();
    app.use(express.json());
    
    // Initialize HTTP adapter with error handling
    console.log('8. Initializing HTTP adapter...');
    try {
      httpAdapterModule.initHTTP(app, deviceManager, ruleEngine);
      console.log('8.1 HTTP adapter initialized successfully');
    } catch (error) {
      console.error('8.1 Error initializing HTTP adapter:');
      console.error(error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
    
    // Start server with enhanced error handling
    const PORT = 3002;
    console.log(`9. Starting HTTP server on port ${PORT}...`);
    
    // Declare server variable in the outer scope
    let server: import('http').Server;
    
    try {
      server = app.listen(PORT, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        console.log('\n=== HTTP Server Running ===');
        console.log(`Server: http://${address.address}:${address.port}`);
        console.log('\nTest Endpoints:');
        console.log(`GET  http://localhost:${address.port}/api/devices`);
        console.log(`GET  http://localhost:${address.port}/api/devices/:id`);
        console.log(`POST http://localhost:${address.port}/api/devices/test-device/command`);
        console.log('\nPress Ctrl+C to stop the server');
        
        // Test the server immediately after startup using http.get
        testServerConnection(address.port).catch(console.error);
      });

      // Enhanced error handling
      server.on('error', (error: NodeJS.ErrnoException) => {
        console.error('Server error event:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        process.exit(1);
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:');
        console.error(error);
        if (server) server.close(() => process.exit(1));
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        if (server) server.close(() => process.exit(1));
      });
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\nShutting down HTTP server...');
        server.close(() => {
          console.log('HTTP server stopped');
          process.exit(0);
        });
      });
      
      return server;
    } catch (error) {
      console.error('Error starting server:');
      console.error(error);
      throw error;
    }
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Function to test server connection using built-in http module
async function testServerConnection(port: number) {
  console.log('\nTesting server connection...');
  
  return new Promise<void>((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/api/devices`, (res) => {
      let data = '';
      
      console.log(`\nServer response status: ${res.statusCode} ${res.statusMessage}`);
      console.log('Response headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('Response body:', data);
          if (res.statusCode === 200) {
            console.log('Server is responding correctly!');
          } else {
            console.warn('Server responded with non-200 status');
          }
          resolve();
        } catch (error) {
          console.error('Error processing response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    // Set a timeout for the request
    req.setTimeout(5000, () => {
      console.error('Request timed out after 5 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Start the test with error handling
main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Log all uncaught exceptions
process.on('uncaughtExceptionMonitor', (error, origin) => {
  console.error('Uncaught Exception Monitor:', error, 'Origin:', origin);
});

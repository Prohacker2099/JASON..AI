// test-http-dynamic.ts - HTTP Adapter Test with Dynamic Imports
import fetch from 'node-fetch';

console.log('Script started - HTTP Adapter Test with Dynamic Imports');

// Track execution flow
console.log('1. Starting imports...');

// Function to test server connection
async function testServerConnection(port: number) {
  console.log('\nTesting server connection...');
  try {
    const response = await fetch(`http://localhost:${port}/api/devices`);
    const data = await response.json();
    console.log('Server response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to connect to server:');
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

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
      throw error; // Re-throw to be caught by the outer try-catch
    }
    
    // Start server with enhanced error handling
    const PORT = 3002;
    console.log(`9. Starting HTTP server on port ${PORT}...`);
    
    // Declare server variable in the outer scope
    let server: import('http').Server;
    
    try {
      server = app.listen(PORT, '0.0.0.0', () => {
        const address = server.address();
        const host = typeof address === 'string' ? address : 
                    address ? `${address.address}:${address.port}` : 'unknown';
        
        console.log('\n=== HTTP Server Running ===');
        console.log(`Server: http://${host}`);
        console.log('\nTest Endpoints:');
        console.log(`GET  http://localhost:${PORT}/api/devices`);
        console.log(`GET  http://localhost:${PORT}/api/devices/:id`);
        console.log(`POST http://localhost:${PORT}/api/devices/test-device/command`);
        console.log('\nPress Ctrl+C to stop the server');
        
        // Test the server immediately after startup
        testServerConnection(PORT).catch(console.error);
      });

      // Enhanced error handling
      server.on('error', (error) => {
        console.error('Server error event:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', (error as NodeJS.ErrnoException).code);
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
      
      return server;
    } catch (error) {
      console.error('Error starting server:');
      console.error(error);
      throw error;
    }

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down HTTP server...');
      server.close(() => {
        console.log('HTTP server stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Start the test
main();

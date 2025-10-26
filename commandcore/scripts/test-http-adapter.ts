// test-http-adapter.ts - Test script for HTTP Adapter
console.log('=== Starting HTTP Adapter Test ===');

async function testHttpAdapter() {
  try {
    // 1. Import required modules
    console.log('1. Importing modules...');
    const express = (await import('express')).default;
    const { initDeviceManager } = await import('../src/services/deviceManager.js');
    const { initRuleEngine } = await import('../src/rules/engine.js');
    const { initHTTP } = await import('../src/adapters/http.js');
    
    // 2. Initialize services
    console.log('\n2. Initializing services...');
    const deviceManager = await initDeviceManager();
    console.log(' - DeviceManager initialized');
    
    const ruleEngine = await initRuleEngine(deviceManager);
    console.log(' - RuleEngine initialized');
    
    // 3. Setup Express
    console.log('\n3. Setting up Express...');
    const app = express();
    app.use(express.json());
    
    // 4. Initialize HTTP Adapter
    console.log('\n4. Initializing HTTP Adapter...');
    try {
      initHTTP(app, deviceManager, ruleEngine);
      console.log(' - HTTP Adapter initialized');
    } catch (error) {
      console.error(' - Error initializing HTTP Adapter:', error);
      throw error;
    }
    
    // 5. Start the server
    console.log('\n5. Starting HTTP server...');
    const PORT = 3002;
    const server = app.listen(PORT, '127.0.0.1', () => {
      const address = server.address();
      const host = typeof address === 'string' ? address : 
                  address ? `${address.address}:${address.port}` : 'unknown';
      
      console.log(`\n=== HTTP Server Running ===`);
      console.log(`Server: http://${host}`);
      console.log('\nTest Endpoints:');
      console.log(`GET  http://localhost:${PORT}/api/devices`);
      console.log(`GET  http://localhost:${PORT}/api/devices/test-device-1`);
      console.log(`POST http://localhost:${PORT}/api/devices/test-device-1/command`);
      console.log('\nPress Ctrl+C to stop the server');
      
      // Test the server
      testServerConnection(PORT).catch(console.error);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down HTTP server...');
      server.close(() => {
        console.log('HTTP server stopped');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    process.exit(1);
  }
}

// Function to test server connection
async function testServerConnection(port: number) {
  console.log('\nTesting server connection...');
  
  return new Promise<void>(async (resolve, reject) => {
    const http = await import('http');
    
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/api/devices',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res: any) => {
      let data = '';
      
      console.log(`\n=== Server Response ===`);
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('Body:', data);
          if (res.statusCode === 200) {
            console.log('\n✅ Server is responding correctly!');
          } else {
            console.error(`\n❌ Server responded with status ${res.statusCode}`);
          }
          resolve();
        } catch (error) {
          console.error('Error processing response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error: any) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    // Set a timeout for the request
    req.setTimeout(5000, () => {
      console.error('Request timed out after 5 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the test
testHttpAdapter();

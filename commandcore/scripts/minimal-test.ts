// minimal-test.ts - Minimal test script to diagnose issues
console.log('Script started - Minimal Test');

// Track execution flow
console.log('1. Starting imports...');

try {
  // Import with .js extension for ESM
  console.log('2. Attempting to import deviceManager...');
  import('../src/services/deviceManager.js')
    .then(module => {
      console.log('3. Successfully imported deviceManager module');
      const { initDeviceManager } = module;
      
      // Run the test after successful import
      testDeviceManager(initDeviceManager)
        .then(success => {
          console.log(success ? 'Test completed successfully' : 'Test failed');
          process.exit(success ? 0 : 1);
        });
    })
    .catch(error => {
      console.error('Failed to import deviceManager:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Synchronous error during import:', error);
  process.exit(1);
}

// Move the function outside to avoid hoisting issues
async function testDeviceManager(initDeviceManager: any) {

  try {
    console.log('4. Inside testDeviceManager - Initializing Device Manager...');
    const deviceManager = await initDeviceManager();
    console.log('5. Device Manager initialized successfully');
    
    // Test basic device manager functionality
    console.log('6. Testing getAllDevices()...');
    const devices = await deviceManager.getAllDevices();
    console.log(`7. Found ${devices.length} devices`);
    
    if (Array.isArray(devices)) {
      console.log('8. Devices array is valid');
    } else {
      console.error('8. ERROR: devices is not an array:', devices);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object thrown:', error);
    }
    return false;
  }
}

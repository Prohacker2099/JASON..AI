// test-device-manager.ts - Test script for DeviceManager
console.log('=== Starting DeviceManager Test ===');

async function testDeviceManager() {
  try {
    console.log('1. Importing DeviceManager...');
    const { initDeviceManager } = await import('../src/services/deviceManager.js');
    
    console.log('2. Initializing DeviceManager...');
    const deviceManager = await initDeviceManager();
    
    console.log('3. Getting all devices...');
    const devices = await deviceManager.getAllDevices();
    
    console.log('4. Test Results:');
    console.log(`- Found ${devices.length} devices`);
    devices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.name} (${device.id}) - ${device.status}`);
    });
    
    console.log('\n=== Test Completed Successfully ===');
    process.exit(0);
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

// Run the test
testDeviceManager();

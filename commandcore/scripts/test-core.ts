import { initDeviceManager } from '../src/services/deviceManager.js';
import { initRuleEngine } from '../src/rules/engine.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Add __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Current directory:', __dirname);

async function testCore() {
  try {
    console.log('=== Starting CommandCore Test ===');
    
    // Initialize services
    console.log('Initializing Device Manager...');
    const deviceManager = await initDeviceManager();
    
    console.log('Initializing Rule Engine...');
    const ruleEngine = await initRuleEngine(deviceManager);
    
    // Test device registration
    console.log('\nTesting device registration...');
    const testDevice = {
      id: 'test-device-1',
      type: 'test',
      name: 'Test Device',
      status: 'online' as const,
      metadata: { test: true },
      capabilities: ['test'],
      state: { value: 42 }
    };
    
    await deviceManager.registerDevice(testDevice);
    console.log('Device registered successfully:', testDevice);
    
    // Test device retrieval
    const retrievedDevice = await deviceManager.getDeviceState('test-device-1');
    console.log('Retrieved device:', retrievedDevice);
    
    // Test rule creation
    console.log('\nTesting rule creation...');
    const rule = await ruleEngine.addRule({
      name: 'Test Rule',
      description: 'Test rule for verification',
      enabled: true,
      conditions: [
        {
          deviceId: 'test-device-1',
          property: 'state.value',
          operator: 'gt',
          value: 40
        }
      ],
      actions: [
        {
          type: 'log',
          target: 'Test rule triggered!',
          payload: {
            message: 'The test rule was triggered',
            deviceId: '{{deviceId}}',
            value: '{{state.value}}'
          }
        }
      ]
    });
    
    console.log('Rule created:', rule);
    
    // Test rule triggering
    console.log('\nTesting rule triggering...');
    await deviceManager.updateDeviceState('test-device-1', {
      state: { value: 45 }
    });
    
    console.log('\n=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testCore();

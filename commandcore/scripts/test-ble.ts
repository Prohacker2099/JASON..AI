import { initBLEAdapter } from '../src/adapters/ble';
import { initDeviceManager } from '../src/services/deviceManager';
import { initRuleEngine } from '../src/rules/engine';
import { Logger } from '../src/utils/logger';

// Initialize logger
const logger: Logger = console;

async function testBLE() {
  try {
    logger.info('Starting BLE Adapter Test...');
    
    // Initialize required services
    const deviceManager = await initDeviceManager();
    const ruleEngine = await initRuleEngine(deviceManager);
    
    // Initialize BLE Adapter
    const bleAdapter = await initBLEAdapter(deviceManager, ruleEngine);
    
    // Track discovered devices
    const discoveredDevices = new Set<string>();
    
    // Log discovered devices
    deviceManager.on('deviceAdded', (device) => {
      if (device.id.startsWith('ble:')) {
        discoveredDevices.add(device.id);
        logger.info(`Discovered BLE Device: ${device.name} (${device.id})`);
        logger.info('Device details:', JSON.stringify(device, null, 2));
      }
    });
    
    // Log rule triggers
    ruleEngine.on('ruleTriggered', (ruleId, deviceId, event) => {
      logger.info(`Rule ${ruleId} triggered by ${deviceId} with event:`, event);
    });
    
    // Add a test rule for BLE devices
    await ruleEngine.addRule({
      name: 'BLE Device Discovered',
      description: 'Log when a new BLE device is discovered',
      enabled: true,
      conditions: [
        {
          deviceId: '*', // Match any device
          property: 'id',
          operator: 'startsWith',
          value: 'ble:'
        }
      ],
      actions: [
        {
          type: 'log',
          target: 'New BLE device discovered',
          payload: {
            message: 'A new BLE device was discovered',
            deviceId: '{{deviceId}}',
            timestamp: '{{timestamp}}'
          }
        }
      ]
    });
    
    logger.info('BLE Adapter test started. Press Ctrl+C to exit.');
    logger.info('Scanning for BLE devices...');
    
    // Keep the script running
    process.stdin.resume();
    
  } catch (error) {
    logger.error('BLE Test Error:', error);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  logger.info('\nStopping BLE Adapter Test...');
  process.exit(0);
});

testBLE();

import noble from '@abandonware/noble';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { DeviceManager } from '../services/deviceManager';
import { RuleEngine } from '../rules/engine';

interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  advertisement: {
    localName?: string;
    txPowerLevel?: number;
    manufacturerData?: Buffer;
    serviceData?: Array<{
      uuid: string;
      data: Buffer;
    }>;
    serviceUuids?: string[];
  };
  state: 'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff' | 'poweredOn';
  connectable: boolean;
  address?: string;
  addressType?: string;
  connect(callback?: (error: string) => void): void;
  disconnect(callback?: () => void): void;
  discoverServices(serviceUuids: string[], callback?: (error: string, services: any[]) => void): void;
}

export class BLEAdapter extends EventEmitter {
  private deviceManager: DeviceManager;
  private ruleEngine: RuleEngine;
  private logger: Logger;
  private isScanning: boolean;
  private knownDevices: Map<string, BLEDevice>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectTimeout: NodeJS.Timeout | null;

  constructor(deviceManager: DeviceManager, ruleEngine: RuleEngine) {
    super();
    this.deviceManager = deviceManager;
    this.ruleEngine = ruleEngine;
    this.logger = (global as any).logger || console;
    this.isScanning = false;
    this.knownDevices = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  async init(): Promise<void> {
    this.logger.info('Initializing BLE Adapter');
    
    // Set up noble event handlers
    noble.on('stateChange', this.handleStateChange.bind(this));
    noble.on('discover', this.handleDiscover.bind(this));
    noble.on('warning', (message) => this.logger.warn(`BLE Warning: ${message}`));
    
    // Start scanning if BLE is powered on
    if (noble.state === 'poweredOn') {
      await this.startScanning();
    } else {
      this.logger.warn(`BLE is not powered on. Current state: ${noble.state}`);
    }
  }

  private async handleStateChange(state: string) {
    this.logger.info(`BLE state changed to: ${state}`);
    
    if (state === 'poweredOn') {
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      await this.startScanning();
    } else if (state === 'poweredOff') {
      this.stopScanning();
      this.attemptReconnect();
    }
  }

  private async handleDiscover(peripheral: BLEDevice) {
    try {
      const { id, address, advertisement, rssi, state } = peripheral;
      const name = peripheral.advertisement.localName || `BLE-${id}`;
      
      // Skip if we've already processed this device recently
      if (this.knownDevices.has(id)) {
        return;
      }

      this.knownDevices.set(id, peripheral);
      
      // Register or update the device in the device manager
      await this.deviceManager.registerDevice({
        id: `ble:${id}`,
        type: 'ble-device',
        name,
        status: 'online',
        metadata: {
          address,
          rssi,
          state,
          serviceUuids: advertisement.serviceUuids || [],
          manufacturerData: advertisement.manufacturerData?.toString('hex'),
        },
        capabilities: ['connect', 'discover-services'],
        state: {
          connected: false,
          lastSeen: new Date().toISOString(),
          rssi,
        },
      });

      this.logger.info(`Discovered BLE device: ${name} (${id})`);
      
      // Emit event for potential rule processing
      await this.ruleEngine.processEvent(`ble:${id}`, 'device-discovered', {
        name,
        rssi,
        ...advertisement,
      });
      
    } catch (error) {
      this.logger.error('Error processing BLE device discovery:', error);
    }
  }

  private async startScanning(): Promise<void> {
    if (this.isScanning) {
      this.logger.debug('BLE scanning already in progress');
      return;
    }

    try {
      this.isScanning = true;
      this.logger.info('Starting BLE scanning...');
      
      // Start scanning
      await noble.startScanningAsync([], true);
      
      // Set a timeout to stop scanning after a while (optional)
      setTimeout(() => this.stopScanning(), 30000);
      
    } catch (error) {
      this.isScanning = false;
      this.logger.error('Failed to start BLE scanning:', error);
      this.attemptReconnect();
    }
  }

  private stopScanning(): void {
    if (!this.isScanning) return;
    
    noble.stopScanning(() => {
      this.isScanning = false;
      this.logger.info('BLE scanning stopped');
      
      // Restart scanning after a delay
      setTimeout(() => this.startScanning(), 10000);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max BLE reconnection attempts reached. Giving up.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts++;
    
    this.logger.warn(`Attempting to reconnect to BLE in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.init();
      } catch (error) {
        this.logger.error('BLE reconnection attempt failed:', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const peripheral = this.knownDevices.get(deviceId);
      if (!peripheral) {
        throw new Error(`Device ${deviceId} not found`);
      }

      this.logger.info(`Connecting to BLE device: ${peripheral.advertisement.localName || deviceId}`);
      
      await new Promise<void>((resolve, reject) => {
        peripheral.connect((error) => {
          if (error) {
            reject(new Error(`Failed to connect to device ${deviceId}: ${error}`));
            return;
          }
          resolve();
        });
      });

      // Update device state
      await this.deviceManager.updateDeviceState(`ble:${deviceId}`, {
        state: {
          connected: true,
          lastConnected: new Date().toISOString()
        }
      });

      this.logger.info(`Successfully connected to BLE device: ${deviceId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error connecting to BLE device ${deviceId}:`, error);
      throw error;
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<boolean> {
    try {
      const peripheral = this.knownDevices.get(deviceId);
      if (!peripheral) {
        throw new Error(`Device ${deviceId} not found`);
      }

      await new Promise<void>((resolve, reject) => {
        peripheral.disconnect((error) => {
          if (error) {
            reject(new Error(`Failed to disconnect from device ${deviceId}: ${error}`));
            return;
          }
          resolve();
        });
      });

      // Update device state
      await this.deviceManager.updateDeviceState(`ble:${deviceId}`, {
        state: {
          connected: false,
          lastDisconnected: new Date().toISOString()
        }
      });

      this.logger.info(`Successfully disconnected from BLE device: ${deviceId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error disconnecting from BLE device ${deviceId}:`, error);
      throw error;
    }
  }

  async discoverServices(deviceId: string, serviceUuids: string[] = []): Promise<any[]> {
    const peripheral = this.knownDevices.get(deviceId);
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      this.logger.info(`Discovering services for BLE device: ${deviceId}`);
      
      const services = await new Promise<any[]>((resolve, reject) => {
        peripheral.discoverServices(serviceUuids, (error, services) => {
          if (error) {
            reject(new Error(`Failed to discover services: ${error}`));
            return;
          }
          resolve(services);
        });
      });

      // Update device with discovered services
      const serviceInfo = services.map(service => ({
        uuid: service.uuid,
        name: service.name,
        type: service.type,
        characteristics: service.characteristics?.map(char => ({
          uuid: char.uuid,
          name: char.name,
          type: char.type,
          properties: char.properties,
        })) || []
      }));

      await this.deviceManager.updateDeviceState(`ble:${deviceId}`, {
        metadata: {
          services: serviceInfo
        }
      });

      this.logger.info(`Discovered ${services.length} services for BLE device: ${deviceId}`);
      return serviceInfo;
      
    } catch (error) {
      this.logger.error(`Error discovering services for BLE device ${deviceId}:`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up BLE adapter...');
    
    // Stop scanning
    if (this.isScanning) {
      await noble.stopScanningAsync();
      this.isScanning = false;
    }
    
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Remove all event listeners
    noble.removeAllListeners();
    
    this.logger.info('BLE adapter cleanup complete');
  }
}

// Singleton instance
let bleAdapterInstance: BLEAdapter | null = null;

export async function initBLEAdapter(deviceManager: DeviceManager, ruleEngine: RuleEngine): Promise<BLEAdapter> {
  if (!bleAdapterInstance) {
    bleAdapterInstance = new BLEAdapter(deviceManager, ruleEngine);
    await bleAdapterInstance.init();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await bleAdapterInstance?.cleanup();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await bleAdapterInstance?.cleanup();
      process.exit(0);
    });
  }
  return bleAdapterInstance;
}

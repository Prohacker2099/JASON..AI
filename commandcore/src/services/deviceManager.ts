import { Logger } from '../utils/logger.js';

interface DeviceState {
  id: string;
  type: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: Date;
  metadata: Record<string, any>;
  capabilities: string[];
  state: Record<string, any>;
}

export class DeviceManager {
  private devices: Map<string, DeviceState>;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor() {
    this.devices = new Map();
    this.logger = (global as any).logger || console;
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing Device Manager...');
      // Load devices from persistence layer if needed
      
      // Add a test device for debugging
      await this.registerDevice({
        id: 'test-device-1',
        type: 'debug',
        name: 'Test Device',
        capabilities: ['debug'],
        state: { status: 'ready' },
        metadata: { source: 'debug' }
      });
      
      this.isInitialized = true;
      this.logger.info('Device Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Device Manager:', error);
      throw error;
    }
  }

  async registerDevice(device: Omit<DeviceState, 'lastSeen' | 'status'> & { status?: DeviceState['status'] }): Promise<DeviceState> {
    const now = new Date();
    const deviceState: DeviceState = {
      ...device,
      status: device.status || 'online',
      lastSeen: now,
      state: device.state || {},
      metadata: device.metadata || {},
      capabilities: device.capabilities || []
    };

    this.devices.set(device.id, deviceState);
    this.logger.info(`Device registered: ${device.id} (${device.name})`);
    
    return deviceState;
  }

  async updateDeviceState(deviceId: string, state: Partial<Omit<DeviceState, 'id' | 'type' | 'name'>>): Promise<DeviceState | null> {
    const device = this.devices.get(deviceId);
    if (!device) {
      this.logger.warn(`Attempted to update non-existent device: ${deviceId}`);
      return null;
    }

    const updatedDevice: DeviceState = {
      ...device,
      ...state,
      lastSeen: new Date(),
      state: { ...device.state, ...(state.state || {}) },
      metadata: { ...device.metadata, ...(state.metadata || {}) }
    };

    this.devices.set(deviceId, updatedDevice);
    this.logger.debug(`Device state updated: ${deviceId}`, state);
    
    return updatedDevice;
  }

  async getDeviceState(deviceId: string): Promise<DeviceState | null> {
    return this.devices.get(deviceId) || null;
  }

  async getAllDevices(): Promise<DeviceState[]> {
    try {
      console.log('[DeviceManager] Getting all devices...');
      const devices = Array.from(this.devices.values());
      console.log(`[DeviceManager] Found ${devices.length} devices`);
      
      // Log each device's ID and type for debugging
      devices.forEach((device, index) => {
        console.log(`[DeviceManager] Device ${index + 1}:`, {
          id: device.id,
          type: device.type,
          name: device.name,
          status: device.status
        });
      });
      
      return devices;
    } catch (error) {
      console.error('[DeviceManager] Error in getAllDevices:', error);
      if (error instanceof Error) {
        console.error('[DeviceManager] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error; // Re-throw to be handled by the caller
    }
  }

  async getDevicesByType(type: string): Promise<DeviceState[]> {
    return Array.from(this.devices.values()).filter(device => device.type === type);
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    return this.devices.delete(deviceId);
  }

  async handleDeviceHeartbeat(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    await this.updateDeviceState(deviceId, { lastSeen: new Date() });
    return true;
  }

  async executeCommand(deviceId: string, command: string, params: Record<string, any> = {}): Promise<any> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    this.logger.info(`Executing command on device ${deviceId}: ${command}`, params);
    
    // In a real implementation, this would communicate with the actual device
    // For now, we'll simulate a successful command execution
    const result = {
      success: true,
      command,
      deviceId,
      timestamp: new Date().toISOString(),
      result: {}
    };

    return result;
  }
}

// Singleton instance
let deviceManagerInstance: DeviceManager | null = null;

export async function initDeviceManager(): Promise<DeviceManager> {
  console.log('initDeviceManager called');
  try {
    if (!deviceManagerInstance) {
      console.log('Creating new DeviceManager instance');
      deviceManagerInstance = new DeviceManager();
      console.log('Initializing DeviceManager...');
      await deviceManagerInstance.init();
      console.log('DeviceManager initialized successfully');
    } else {
      console.log('Using existing DeviceManager instance');
    }
    return deviceManagerInstance;
  } catch (error) {
    console.error('Failed to initialize DeviceManager:', error);
    throw error;
  }
}

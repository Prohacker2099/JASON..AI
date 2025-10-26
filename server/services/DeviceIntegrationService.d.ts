import { Logger } from 'winston';
import { EventEmitter } from 'events';

// Define the structure of a device object for type safety
interface Device {
  deviceId: string;
  name: string;
  type: string;
  ipAddress: string;
  port: number;
  status: 'Online' | 'Offline';
  lastSeen: number;
  isActive: boolean;
  state: Record<string, any>;
}

declare class DeviceIntegrationService extends EventEmitter {
  constructor(logger: Logger);

  /**
   * Starts the discovery process for devices on the network.
   * @returns A promise that resolves when the initial discovery is complete.
   */
  discoverDevices(): Promise<Device[]>;

  /**
   * Sends a control command to a specific device.
   * @param deviceId - The ID of the device to control.
   * @param action - The control action to perform (e.g., { power: 'on' }).
   * @returns A promise that resolves with the result of the control action.
   */
  controlDevice(deviceId: string, action: Record<string, any>): Promise<boolean>;

  /**
   * Retrieves a single device by its ID.
   * @param deviceId - The ID of the device to retrieve.
   * @returns The device object or undefined if not found.
   */
  getDevice(deviceId: string): Device | undefined;

  /**
   * Retrieves all discovered devices.
   * @returns An array of all device objects.
   */
  getAllDevices(): Device[];
}

export default DeviceIntegrationService;

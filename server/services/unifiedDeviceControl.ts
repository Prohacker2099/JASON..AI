// server/services/unifiedDeviceControl.ts
// This file is temporarily commented out due to persistent module resolution issues.
import { Device, DeviceType, DeviceState } from '../../shared/types/Device';
import { deviceManager } from '../core/device/deviceManager';
import { logger } from '../utils/logger';

/**
 * UnifiedDeviceControlService provides a centralized interface for controlling and managing devices.
 * It abstracts away the underlying device protocols and interacts with the DeviceManager.
 */
export class UnifiedDeviceControlService {
  constructor() {
    logger.info('UnifiedDeviceControlService initialized.');
  }

  /**
   * Adds a new device to the system.
   * @param device The device object to add.
   */
  public addDevice(device: Device): void {
    deviceManager.addDevice(device);
    logger.info(`Device added via UnifiedControl: ${device.name} (${device.id})`);
  }

  /**
   * Sends a control command to a specific device.
   * @param deviceId The ID of the device to control.
   * @param command The command to send (e.g., 'turnOn', 'setBrightness').
   * @param payload Optional payload for the command (e.g., { brightness: 80 }).
   */
  public async sendCommand(deviceId: string, command: string, payload?: any): Promise<void> {
    await deviceManager.sendDeviceCommand(deviceId, command, payload);
    logger.info(`Command '${command}' sent to device ${deviceId} with payload:`, payload);
  }

  /**
   * Retrieves the current state of a specific device.
   * @param deviceId The ID of the device.
   * @returns The current state of the device.
   */
  public getDeviceState(deviceId: string): DeviceState | undefined {
    const device = deviceManager.getDevice(deviceId);
    return device ? device.state : undefined;
  }

  /**
   * Retrieves a list of all registered devices.
   * @returns An array of device objects.
   */
  public getAllDevices(): Device[] {
    return deviceManager.getAllDevices();
  }

  /**
   * Updates the state of an existing device.
   * @param deviceId The ID of the device to update.
   * @param newState The partial new state to apply.
   */
  public updateDeviceState(deviceId: string, newState: Partial<DeviceState>): void {
    deviceManager.updateDeviceState(deviceId, newState);
    logger.info(`Device ${deviceId} state updated via UnifiedControl:`, newState);
  }

  /**
   * Removes a device from the system.
   * @param deviceId The ID of the device to remove.
   */
  public removeDevice(deviceId: string): void {
    deviceManager.removeDevice(deviceId);
    logger.info(`Device removed via UnifiedControl: ${deviceId}`);
  }
}

export const unifiedDeviceControl = new UnifiedDeviceControlService();
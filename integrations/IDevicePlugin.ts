// IDevicePlugin.ts
/**
 * Common interface for all device plugins in the JASON ecosystem.
 * Plugins must implement this interface to be compatible with the system.
 */

export interface DeviceState {
  on?: boolean;
  brightness?: number;
  color?: {
    hue: number;
    saturation: number;
    value: number;
  };
  temperature?: number;
  motion?: boolean;
  contact?: boolean;
  battery?: number;
  [key: string]: any;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model?: string;
  firmwareVersion?: string;
  location?: string;
  capabilities: string[];
  state: DeviceState;
  lastSeen?: Date;
  connected: boolean;
}

export interface DeviceCommand {
  type: string;
  params: Record<string, any>;
}

export interface IDevicePlugin {
  /** Unique identifier for the plugin */
  name: string;

  /** Version of the plugin */
  version: string;

  /** Supported device types */
  supportedDeviceTypes: string[];

  /**
   * Discover available devices on the network
   * @returns Array of discovered devices
   */
  discover(): Promise<Device[]>;

  /**
   * Control a specific device
   * @param deviceId The ID of the device to control
   * @param command The command to execute
   * @returns Updated device state
   */
  control(deviceId: string, command: DeviceCommand): Promise<DeviceState>;

  /**
   * Add a new device to the plugin's management
   * @param device The device to add
   */
  addDevice?(device: Device): Promise<void>;

  /**
   * Remove a device from the plugin's management
   * @param deviceId The ID of the device to remove
   */
  removeDevice?(deviceId: string): Promise<void>;

  /**
   * Update device information
   * @param device The device with updated information
   */
  updateDevice?(device: Partial<Device>): Promise<void>;

  /**
   * Subscribe to device events
   * @param deviceId The ID of the device to monitor
   * @param callback Function to call when device state changes
   */
  subscribeToEvents?(
    deviceId: string,
    callback: (state: DeviceState) => void,
  ): Promise<void>;

  /**
   * Unsubscribe from device events
   * @param deviceId The ID of the device to stop monitoring
   */
  unsubscribeFromEvents?(deviceId: string): Promise<void>;

  /**
   * Get device capabilities
   * @param deviceId The ID of the device
   * @returns Array of supported capabilities
   */
  getCapabilities?(deviceId: string): Promise<string[]>;

  /**
   * Validate a command before sending to device
   * @param deviceId The ID of the device
   * @param command The command to validate
   * @returns Whether the command is valid for the device
   */
  validateCommand?(deviceId: string, command: DeviceCommand): Promise<boolean>;
}

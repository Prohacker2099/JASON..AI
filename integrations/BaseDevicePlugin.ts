import { EventEmitter } from "events";
import {
  Device,
  DeviceState,
  DeviceCommand,
  IDevicePlugin,
} from "./IDevicePlugin.js";

/**
 * Base class for device plugins providing common functionality
 */
export abstract class BaseDevicePlugin
  extends EventEmitter
  implements IDevicePlugin
{
  protected devices: Map<string, Device> = new Map();
  protected subscriptions: Map<string, Set<(state: DeviceState) => void>> =
    new Map();

  constructor(
    public readonly name: string,
    public readonly version: string,
    public readonly supportedDeviceTypes: string[],
  ) {
    super();
  }

  abstract discover(): Promise<Device[]>;
  abstract control(
    deviceId: string,
    command: DeviceCommand,
  ): Promise<DeviceState>;

  async addDevice(device: Device): Promise<void> {
    this.devices.set(device.id, device);
    this.emit("deviceAdded", device);
  }

  async removeDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      this.emit("deviceRemoved", device);
    }
  }

  async updateDevice(device: Partial<Device>): Promise<void> {
    const existingDevice = this.devices.get(device.id!);
    if (existingDevice) {
      const updatedDevice = { ...existingDevice, ...device };
      this.devices.set(device.id!, updatedDevice);
      this.emit("deviceUpdated", updatedDevice);
    }
  }

  async subscribeToEvents(
    deviceId: string,
    callback: (state: DeviceState) => void,
  ): Promise<void> {
    if (!this.subscriptions.has(deviceId)) {
      this.subscriptions.set(deviceId, new Set());
    }
    this.subscriptions.get(deviceId)!.add(callback);
  }

  async unsubscribeFromEvents(deviceId: string): Promise<void> {
    this.subscriptions.delete(deviceId);
  }

  async getCapabilities(deviceId: string): Promise<string[]> {
    const device = this.devices.get(deviceId);
    return device?.capabilities || [];
  }

  async validateCommand(
    deviceId: string,
    command: DeviceCommand,
  ): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    // Basic validation based on device capabilities
    switch (command.type) {
      case "turnOn":
      case "turnOff":
        return device.capabilities.includes("onOff");
      case "setBrightness":
        return device.capabilities.includes("brightness");
      case "setColor":
        return device.capabilities.includes("color");
      case "setTemperature":
        return device.capabilities.includes("temperature");
      default:
        return false;
    }
  }

  protected notifySubscribers(deviceId: string, state: DeviceState): void {
    const subscribers = this.subscriptions.get(deviceId);
    if (subscribers) {
      subscribers.forEach((callback) => callback(state));
    }
  }

  protected validateDeviceType(type: string): boolean {
    return this.supportedDeviceTypes.includes(type);
  }

  protected async updateDeviceState(
    deviceId: string,
    state: Partial<DeviceState>,
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.state = { ...device.state, ...state };
      device.lastSeen = new Date();
      this.notifySubscribers(deviceId, device.state);
    }
  }
}

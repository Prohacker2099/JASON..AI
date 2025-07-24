import { RealDeviceDiscovery } from "./real-device-discovery.js";
import { RealDeviceControl } from "./real-device-control.js";
import { EventEmitter } from "events";

// Main integration class
export class RealIntegration extends EventEmitter {
  private discovery: RealDeviceDiscovery;
  private control: RealDeviceControl;
  private devices: Map<string, any> = new Map();
  private initialized: boolean = false;

  constructor() {
    super();
    this.discovery = new RealDeviceDiscovery();
    this.control = new RealDeviceControl();

    // Forward events
    this.discovery.on("deviceDiscovered", (device) => {
      this.devices.set(device.id, device);
      this.emit("deviceDiscovered", device);
    });

    this.control.on("deviceStateChanged", (device) => {
      this.devices.set(device.id, device);
      this.emit("deviceStateChanged", device);
    });
  }

  // Initialize integration
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      console.log("Initializing real device integration...");

      // Discover devices
      const devices = await this.discovery.startDiscovery();

      // Update control with discovered devices
      this.control.updateDevices(devices);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing real integration:", error);
      return false;
    }
  }

  // Get all devices
  getDevices(): any[] {
    return Array.from(this.devices.values());
  }

  // Get device by ID
  getDevice(id: string): any {
    return this.devices.get(id);
  }

  // Control a device
  async controlDevice(deviceId: string, command: any): Promise<any> {
    try {
      return await this.control.controlDevice(deviceId, command);
    } catch (error) {
      console.error(`Error controlling device ${deviceId}:`, error);
      throw error;
    }
  }

  // Refresh devices
  async refreshDevices(): Promise<any[]> {
    try {
      const devices = await this.discovery.startDiscovery();
      this.control.updateDevices(devices);
      return devices;
    } catch (error) {
      console.error("Error refreshing devices:", error);
      return [];
    }
  }

  // Clean up resources
  cleanup(): void {
    this.discovery.stopDiscovery();
  }
}

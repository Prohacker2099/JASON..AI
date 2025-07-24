/**
 * Sample Plugin for JASON
 *
 * This is a sample plugin that demonstrates how to create a plugin for JASON.
 * It implements the IDevicePlugin interface to discover and control sample devices.
 */

import { EventEmitter } from "events";
import {
  IDevicePlugin,
  Device,
  DeviceCommand,
  DeviceState,
} from "../IDevicePlugin.js";
import { v4 as uuidv4 } from "uuid";

export class SamplePlugin extends EventEmitter implements IDevicePlugin {
  name = "sample-plugin";
  version = "1.0.0";
  supportedDeviceTypes = ["light", "switch", "sensor"];

  private devices: Map<string, Device> = new Map();
  private discoveryInProgress: boolean = false;

  constructor() {
    super();
    console.log("Sample plugin initialized");
  }

  /**
   * Discover sample devices
   */
  async discover(): Promise<Device[]> {
    if (this.discoveryInProgress) {
      console.warn("Discovery already in progress");
      return Array.from(this.devices.values());
    }

    this.discoveryInProgress = true;
    console.log("Starting sample device discovery...");

    try {
      // Create some sample devices
      const sampleDevices: Device[] = [
        {
          id: `sample-light-${uuidv4().substring(0, 8)}`,
          name: "Sample Smart Light",
          type: "light",
          manufacturer: "JASON",
          model: "Sample Light v1",
          firmwareVersion: "1.0.0",
          capabilities: ["on", "brightness", "color"],
          state: {
            on: false,
            brightness: 100,
            color: {
              hue: 180,
              saturation: 100,
              value: 100,
            },
          },
          connected: true,
          lastSeen: new Date(),
        },
        {
          id: `sample-switch-${uuidv4().substring(0, 8)}`,
          name: "Sample Smart Switch",
          type: "switch",
          manufacturer: "JASON",
          model: "Sample Switch v1",
          firmwareVersion: "1.0.0",
          capabilities: ["on"],
          state: {
            on: false,
          },
          connected: true,
          lastSeen: new Date(),
        },
        {
          id: `sample-sensor-${uuidv4().substring(0, 8)}`,
          name: "Sample Motion Sensor",
          type: "sensor",
          manufacturer: "JASON",
          model: "Sample Sensor v1",
          firmwareVersion: "1.0.0",
          capabilities: ["motion", "battery", "temperature"],
          state: {
            motion: false,
            battery: 90,
            temperature: 22.5,
          },
          connected: true,
          lastSeen: new Date(),
        },
      ];

      // Add discovered devices to the map
      sampleDevices.forEach((device) => {
        this.devices.set(device.id, device);
      });

      console.log(`Discovered ${sampleDevices.length} sample devices`);

      // Emit discovery events
      sampleDevices.forEach((device) => {
        console.log(`Discovered sample device: ${device.name} (${device.id})`);
        this.emit("deviceDiscovered", device);
      });

      return sampleDevices;
    } catch (error) {
      console.error("Error during sample device discovery:", error);
      return [];
    } finally {
      this.discoveryInProgress = false;
    }
  }

  /**
   * Control a sample device
   */
  async control(
    deviceId: string,
    command: DeviceCommand,
  ): Promise<DeviceState> {
    const device = this.devices.get(deviceId);

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    console.log(
      `Controlling sample device ${deviceId} with command: ${command.type}`,
    );

    try {
      const updatedState = { ...device.state };

      switch (command.type) {
        case "power":
          updatedState.on = command.params.value === true;
          break;

        case "brightness":
          if (device.capabilities.includes("brightness")) {
            updatedState.brightness = Math.min(
              100,
              Math.max(0, command.params.value),
            );
          }
          break;

        case "color":
          if (device.capabilities.includes("color") && command.params.color) {
            updatedState.color = {
              hue: command.params.color.h || updatedState.color?.hue || 0,
              saturation:
                command.params.color.s || updatedState.color?.saturation || 0,
              value: command.params.color.v || updatedState.color?.value || 0,
            };
          }
          break;

        case "motion":
          if (device.capabilities.includes("motion")) {
            updatedState.motion = command.params.value === true;
          }
          break;

        default:
          throw new Error(`Unsupported command type: ${command.type}`);
      }

      // Update device state
      device.state = updatedState;
      device.lastSeen = new Date();
      this.devices.set(deviceId, device);

      // Emit state change event
      this.emit("deviceStateChanged", { deviceId, state: updatedState });

      return updatedState;
    } catch (error) {
      console.error(`Error controlling sample device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get device capabilities
   */
  async getCapabilities(deviceId: string): Promise<string[]> {
    const device = this.devices.get(deviceId);

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    return device.capabilities;
  }

  /**
   * Validate a command before sending to device
   */
  async validateCommand(
    deviceId: string,
    command: DeviceCommand,
  ): Promise<boolean> {
    const device = this.devices.get(deviceId);

    if (!device) {
      return false;
    }

    switch (command.type) {
      case "power":
        return true;

      case "brightness":
        return device.capabilities.includes("brightness");

      case "color":
        return device.capabilities.includes("color");

      case "motion":
        return device.capabilities.includes("motion");

      default:
        return false;
    }
  }
}

// Export the plugin class
export default SamplePlugin;

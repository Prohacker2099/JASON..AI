# Plugin Development Guide

JASON supports a plugin architecture that allows you to extend its functionality with new device protocols and integrations. This guide will walk you through the process of creating a plugin for JASON.

## Plugin Architecture

Plugins in JASON are TypeScript classes that implement the `IDevicePlugin` interface. They are loaded from the `./plugins` directory at startup.

### Plugin Interface

All plugins must implement the `IDevicePlugin` interface, which is defined in `integrations/IDevicePlugin.ts`:

```typescript
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
```

### Device Types

The `Device` interface represents a smart home device:

```typescript
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
```

The `DeviceState` interface represents the state of a device:

```typescript
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
```

The `DeviceCommand` interface represents a command to control a device:

```typescript
export interface DeviceCommand {
  type: string;
  params: Record<string, any>;
}
```

## Creating a Plugin

To create a plugin for JASON, follow these steps:

1. Create a new TypeScript file in the `./plugins` directory
2. Implement the `IDevicePlugin` interface
3. Export a class that extends `EventEmitter` and implements `IDevicePlugin`

### Example Plugin

Here's an example of a simple plugin that discovers and controls Zigbee devices:

```typescript
import { EventEmitter } from "events";
import {
  IDevicePlugin,
  Device,
  DeviceCommand,
  DeviceState,
} from "../integrations/IDevicePlugin";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../server/services/logger";

const logger = new Logger("ZigbeePlugin");

export class ZigbeePlugin extends EventEmitter implements IDevicePlugin {
  name = "zigbee";
  version = "1.0.0";
  supportedDeviceTypes = ["light", "switch", "sensor", "outlet", "thermostat"];

  private devices: Map<string, Device> = new Map();
  private connected: boolean = false;
  private discoveryInProgress: boolean = false;

  constructor() {
    super();
    logger.info("Zigbee plugin initialized");
  }

  /**
   * Discover Zigbee devices on the network
   */
  async discover(): Promise<Device[]> {
    if (this.discoveryInProgress) {
      logger.warn("Discovery already in progress");
      return Array.from(this.devices.values());
    }

    this.discoveryInProgress = true;
    logger.info("Starting Zigbee device discovery...");

    try {
      // Implement your discovery logic here
      // This is just a placeholder
      const sampleDevices: Device[] = [
        {
          id: `zigbee-light-${uuidv4().substring(0, 8)}`,
          name: "Zigbee Light Bulb",
          type: "light",
          manufacturer: "IKEA",
          model: "TRADFRI LED bulb E27",
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
      ];

      // Add discovered devices to the map
      sampleDevices.forEach((device) => {
        this.devices.set(device.id, device);
      });

      logger.info(`Discovered ${sampleDevices.length} Zigbee devices`);

      // Log discovery events
      sampleDevices.forEach((device) => {
        logger.info(`Discovered Zigbee device: ${device.name} (${device.id})`);
        this.emit("deviceDiscovered", device);
      });

      return sampleDevices;
    } catch (error) {
      logger.error("Error during Zigbee device discovery:", error);
      return [];
    } finally {
      this.discoveryInProgress = false;
    }
  }

  /**
   * Control a Zigbee device
   */
  async control(
    deviceId: string,
    command: DeviceCommand,
  ): Promise<DeviceState> {
    const device = this.devices.get(deviceId);

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    logger.info(
      `Controlling Zigbee device ${deviceId} with command: ${command.type}`,
    );

    try {
      // Implement your control logic here
      // This is just a placeholder
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
      logger.error(`Error controlling Zigbee device ${deviceId}:`, error);
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

      default:
        return false;
    }
  }
}
```

## Plugin Loading

JASON loads plugins from the `./plugins` directory at startup. The `PluginLoader` service is responsible for loading and managing plugins.

### Plugin Events

Plugins can emit events to notify JASON of device state changes and other events. The following events are supported:

- `deviceDiscovered`: Emitted when a new device is discovered
- `deviceStateChanged`: Emitted when a device's state changes

### Plugin Registration

Plugins are automatically registered with JASON when they are loaded. You don't need to manually register them.

## Testing Your Plugin

To test your plugin, follow these steps:

1. Create your plugin file in the `./plugins` directory
2. Start JASON with `npm run dev`
3. Check the logs for messages from your plugin
4. Use the API to discover and control devices through your plugin

## Best Practices

- Use the `Logger` service to log messages from your plugin
- Handle errors gracefully and provide meaningful error messages
- Emit events to notify JASON of device state changes
- Use TypeScript to ensure type safety
- Follow the JASON coding style and conventions
- Document your plugin's capabilities and limitations

## Troubleshooting

If your plugin is not loading or not working as expected, check the following:

- Make sure your plugin file is in the `./plugins` directory
- Make sure your plugin class implements the `IDevicePlugin` interface
- Check the logs for error messages
- Make sure your plugin is exporting the plugin class correctly
- Verify that your plugin's `discover` and `control` methods are working correctly

## Example Plugins

JASON includes several example plugins that you can use as a reference:

- `WemoPlugin`: Discovers and controls Belkin WeMo devices
- `HuePlugin`: Discovers and controls Philips Hue devices
- `ZigbeePlugin`: Discovers and controls Zigbee devices

You can find these plugins in the `integrations` directory.

import { EventEmitter } from "events";
import { ZigbeeController } from "./zigbee";
import { ZwaveController } from "./zwave";
import { MatterController } from "./matter-controller";
import { HueController } from "./hue-controller";
import { WemoController } from "./wemo-controller";
import { AlexaBridge } from "./alexa-bridge";
import { GoogleAssistantBridge } from "./google-assistant-bridge";
import { HomeKitBridge } from "./homekit-bridge";
import { Logger } from "../server/services/logger";

const logger = new Logger("DeviceIntegrationManager");

export interface DeviceState {
  on?: boolean;
  brightness?: number;
  color?: {
    h: number;
    s: number;
    v: number;
  };
  temperature?: number;
  humidity?: number;
  motion?: boolean;
  contact?: boolean;
  battery?: number;
  [key: string]: any;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  protocol: string;
  address: string;
  bridgeId?: string;
  roomId?: string;
  capabilities: string[];
  state: DeviceState;
  lastSeen?: Date;
  firmwareVersion?: string;
  available: boolean;
}

export interface DeviceController {
  initialize(): Promise<boolean>;
  discover(): Promise<Device[]>;
  getDevices(): Device[];
  getDevice(deviceId: string): Device | undefined;
  controlDevice(deviceId: string, command: any): Promise<any>;
  on(event: string, listener: (...args: any[]) => void): this;
}

export class DeviceIntegrationManager extends EventEmitter {
  private controllers: Map<string, DeviceController> = new Map();
  private devices: Map<string, Device> = new Map();
  private initialized: boolean = false;

  constructor() {
    super();

    // Initialize controllers
    this.controllers.set("zigbee", new ZigbeeController());
    this.controllers.set("zwave", new ZwaveController());
    this.controllers.set("matter", new MatterController());
    this.controllers.set("hue", new HueController());
    this.controllers.set("wemo", new WemoController());
    this.controllers.set("alexa", new AlexaBridge());
    this.controllers.set("google", new GoogleAssistantBridge());
    this.controllers.set("homekit", new HomeKitBridge());
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    logger.info("Initializing device integration manager");

    try {
      // Initialize each controller
      for (const [protocol, controller] of this.controllers.entries()) {
        try {
          logger.info(`Initializing ${protocol} controller`);
          const success = await controller.initialize();

          if (success) {
            logger.info(`${protocol} controller initialized successfully`);

            // Set up event listeners
            controller.on("deviceDiscovered", (device: Device) => {
              this.handleDeviceDiscovered(device);
            });

            controller.on("deviceUpdated", (device: Device) => {
              this.handleDeviceUpdated(device);
            });

            controller.on("deviceRemoved", (deviceId: string) => {
              this.handleDeviceRemoved(deviceId);
            });
          } else {
            logger.warn(`Failed to initialize ${protocol} controller`);
          }
        } catch (error) {
          logger.error(`Error initializing ${protocol} controller:`, error);
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error("Error initializing device integration manager:", error);
      return false;
    }
  }

  async discoverDevices(): Promise<Device[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    logger.info("Starting device discovery across all protocols");

    const discoveredDevices: Device[] = [];

    // Run discovery on each controller
    for (const [protocol, controller] of this.controllers.entries()) {
      try {
        logger.info(`Starting discovery for ${protocol} devices`);
        const devices = await controller.discover();
        logger.info(`Discovered ${devices.length} ${protocol} devices`);

        // Add devices to our collection
        devices.forEach((device) => {
          this.devices.set(device.id, device);
          discoveredDevices.push(device);
        });
      } catch (error) {
        logger.error(`Error discovering ${protocol} devices:`, error);
      }
    }

    // Emit event with all discovered devices
    this.emit("devicesDiscovered", discoveredDevices);

    return discoveredDevices;
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getDevicesByProtocol(protocol: string): Device[] {
    return this.getDevices().filter((device) => device.protocol === protocol);
  }

  getDevicesByType(type: string): Device[] {
    return this.getDevices().filter((device) => device.type === type);
  }

  getDevicesByRoom(roomId: string): Device[] {
    return this.getDevices().filter((device) => device.roomId === roomId);
  }

  async controlDevice(deviceId: string, command: any): Promise<any> {
    const device = this.devices.get(deviceId);

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const controller = this.controllers.get(device.protocol);

    if (!controller) {
      throw new Error(
        `No controller available for protocol: ${device.protocol}`,
      );
    }

    logger.info(
      `Controlling ${device.protocol} device ${device.name}:`,
      command,
    );

    try {
      const result = await controller.controlDevice(deviceId, command);

      // Update device state in our collection
      if (result.success && result.state) {
        const updatedDevice = {
          ...device,
          state: { ...device.state, ...result.state },
        };
        this.devices.set(deviceId, updatedDevice);
        this.emit("deviceStateChanged", updatedDevice);
      }

      return result;
    } catch (error) {
      logger.error(`Error controlling device ${deviceId}:`, error);
      throw error;
    }
  }

  private handleDeviceDiscovered(device: Device): void {
    this.devices.set(device.id, device);
    this.emit("deviceDiscovered", device);
  }

  private handleDeviceUpdated(device: Device): void {
    this.devices.set(device.id, device);
    this.emit("deviceUpdated", device);
  }

  private handleDeviceRemoved(deviceId: string): void {
    this.devices.delete(deviceId);
    this.emit("deviceRemoved", deviceId);
  }
}

// Export singleton instance
export default new DeviceIntegrationManager();

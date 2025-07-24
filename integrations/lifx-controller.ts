import { IDevicePlugin } from "./IDevicePlugin.js";
import { EventEmitter } from "events";
import * as dgram from "dgram";
import fetch from "node-fetch";

export class LifxPlugin extends EventEmitter implements IDevicePlugin {
  name = "LIFX";
  private devices = new Map<string, any>();
  private socket: dgram.Socket | null = null;
  private apiToken: string | null = null;

  private readonly API_URL = "https://api.lifx.com/v1";
  private readonly UDP_PORT = 56700;
  private readonly BROADCAST_IP = "255.255.255.255";

  constructor(apiToken?: string) {
    super();
    if (apiToken) {
      this.apiToken = apiToken;
    }
    this.setupSocket();
  }

  private setupSocket() {
    this.socket = dgram.createSocket("udp4");
    this.socket.on("error", (err) => {
      console.error("LIFX discovery socket error:", err);
    });
  }

  async discover(): Promise<any[]> {
    // Try cloud API first if we have a token
    if (this.apiToken) {
      try {
        const devices = await this.discoverViaCloud();
        devices.forEach((device) => this.devices.set(device.id, device));
        return devices;
      } catch (error) {
        console.error("LIFX cloud discovery failed:", error);
      }
    }

    // Fall back to local discovery
    return this.discoverLocal();
  }

  private async discoverViaCloud(): Promise<any[]> {
    if (!this.apiToken) return [];

    try {
      const response = await fetch(`${this.API_URL}/lights/all`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`LIFX API error: ${response.statusText}`);
      }

      const devices = await response.json();
      return devices.map((device: any) => ({
        id: device.id,
        name: device.label || `LIFX ${device.id.substr(0, 6)}`,
        type: "light",
        protocol: "lifx",
        capabilities: ["power", "brightness", "color"],
        state: {
          power: device.power === "on",
          brightness: device.brightness,
          color: {
            hue: device.color.hue,
            saturation: device.color.saturation,
            kelvin: device.color.kelvin,
          },
        },
        location: device.location,
        group: device.group,
      }));
    } catch (error) {
      console.error("Error discovering LIFX devices via cloud:", error);
      return [];
    }
  }

  private async discoverLocal(): Promise<any[]> {
    if (!this.socket) {
      this.setupSocket();
    }

    return new Promise((resolve) => {
      const found = new Map<string, any>();

      if (!this.socket) {
        resolve([]);
        return;
      }

      // Listen for responses
      this.socket.on("message", (msg, rinfo) => {
        const device = this.parseDiscoveryResponse(msg, rinfo);
        if (device) {
          found.set(device.id, device);
          this.devices.set(device.id, device);
        }
      });

      // Send discovery packet
      const packet = this.createDiscoveryPacket();
      this.socket.send(
        packet,
        0,
        packet.length,
        this.UDP_PORT,
        this.BROADCAST_IP,
      );

      // Wait for responses
      setTimeout(() => {
        resolve(Array.from(found.values()));
      }, 1000);
    });
  }

  async control(deviceId: string, command: any): Promise<any> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (this.apiToken) {
      return this.controlViaCloud(device, command);
    } else {
      return this.controlLocal(device, command);
    }
  }

  private async controlViaCloud(device: any, command: any): Promise<any> {
    if (!this.apiToken) {
      throw new Error("No LIFX API token available");
    }

    const endpoint = `${this.API_URL}/lights/id:${device.id}/state`;
    const payload: any = {};

    if (command.type === "power") {
      payload.power = command.value ? "on" : "off";
    } else if (command.type === "color") {
      payload.color = command.value;
    } else if (command.type === "brightness") {
      payload.brightness = command.value;
    }

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`LIFX API error: ${response.statusText}`);
      }

      const result = await response.json();
      const newState = {
        ...device.state,
        ...payload,
      };

      device.state = newState;
      this.devices.set(device.id, device);
      this.emit("stateChanged", { deviceId: device.id, state: newState });

      return newState;
    } catch (error) {
      console.error(`Error controlling LIFX device ${device.id}:`, error);
      throw error;
    }
  }

  private async controlLocal(device: any, command: any): Promise<any> {
    // Implement local control via UDP packets
    throw new Error("Local control not yet implemented");
  }

  private createDiscoveryPacket(): Buffer {
    // Implement LIFX discovery packet creation
    return Buffer.alloc(0);
  }

  private parseDiscoveryResponse(
    msg: Buffer,
    rinfo: dgram.RemoteInfo,
  ): any | null {
    // Implement LIFX discovery response parsing
    return null;
  }

  // Cleanup resources
  destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

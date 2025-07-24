import { IDevicePlugin } from "./IDevicePlugin.js";
import { EventEmitter } from "events";
import * as dgram from "dgram";
import * as http from "http";
import * as url from "url";
import fetch from "node-fetch";

export class WemoPlugin extends EventEmitter implements IDevicePlugin {
  name = "WeMo";
  version = "1.0.0"; // Added version
  supportedDeviceTypes = ["switch", "light"]; // Added supported device types
  private devices = new Map<string, any>();
  private socket: dgram.Socket | null = null;
  private subscriptionServer: http.Server | null = null;

  private readonly SSDP_PORT = 1900;
  private readonly SSDP_ADDR = "239.255.255.250";
  private readonly SSDP_MX = 3;
  private readonly SSDP_ST = "urn:Belkin:service:basicevent:1";

  constructor() {
    super();
    this.setupSocket();
  }

  private setupSocket() {
    this.socket = dgram.createSocket("udp4");
    this.socket.on("error", (err) => {
      console.error("WeMo discovery socket error:", err);
    });
  }

  async discover(): Promise<any[]> {
    if (!this.socket) {
      this.setupSocket();
    }

    return new Promise((resolve) => {
      const found = new Map<string, any>();

      if (!this.socket) {
        resolve([]);
        return;
      }

      this.socket.on("message", (msg, rinfo) => {
        const device = this.parseDiscoveryResponse(msg.toString(), rinfo);
        if (device) {
          found.set(device.id, device);
          this.devices.set(device.id, device);
        }
      });

      // Send discovery message
      const message = Buffer.from(
        "M-SEARCH * HTTP/1.1\r\n" +
          `HOST: ${this.SSDP_ADDR}:${this.SSDP_PORT}\r\n` +
          'MAN: "ssdp:discover"\r\n' +
          `MX: ${this.SSDP_MX}\r\n` +
          `ST: ${this.SSDP_ST}\r\n\r\n`,
      );

      this.socket.send(
        message,
        0,
        message.length,
        this.SSDP_PORT,
        this.SSDP_ADDR,
      );

      // Wait for responses
      setTimeout(() => {
        resolve(Array.from(found.values()));
      }, this.SSDP_MX * 1000);
    });
  }

  async control(deviceId: string, command: any): Promise<any> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const soapAction =
      command.type === "power"
        ? "urn:Belkin:service:basicevent:1#SetBinaryState"
        : "urn:Belkin:service:basicevent:1#GetBinaryState";

    const soapBody =
      command.type === "power"
        ? `<?xml version="1.0" encoding="utf-8"?>
       <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
         <s:Body>
           <u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">
             <BinaryState>${command.value ? 1 : 0}</BinaryState>
           </u:SetBinaryState>
         </s:Body>
       </s:Envelope>`
        : `<?xml version="1.0" encoding="utf-8"?>
       <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
         <s:Body>
           <u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">
           </u:GetBinaryState>
         </s:Body>
       </s:Envelope>`;

    try {
      const response = await fetch(device.controlUrl, {
        method: "POST",
        headers: {
          SOAPACTION: `"${soapAction}"`,
          "Content-Type": 'text/xml; charset="utf-8"',
        },
        body: soapBody,
      });

      const result = await response.text();
      const state = this.parseSoapResponse(result);

      // Update device state
      device.state = state;
      this.devices.set(deviceId, device);
      this.emit("stateChanged", { deviceId, state });

      return state;
    } catch (error) {
      console.error(`Error controlling WeMo device ${deviceId}:`, error);
      throw error;
    }
  }

  private parseDiscoveryResponse(
    response: string,
    rinfo: dgram.RemoteInfo,
  ): any | null {
    try {
      const locationMatch = response.match(/LOCATION:\s*(.+)\r\n/i);
      if (!locationMatch) return null;

      const deviceUrl = locationMatch[1];
      const deviceId = Buffer.from(deviceUrl).toString("base64");

      return {
        id: deviceId,
        name: `WeMo Device (${rinfo.address})`,
        type: "switch",
        protocol: "wemo",
        controlUrl: deviceUrl,
        host: rinfo.address,
        port: rinfo.port,
        capabilities: ["power"],
        state: {
          power: false,
        },
      };
    } catch (error) {
      console.error("Error parsing WeMo discovery response:", error);
      return null;
    }
  }

  private parseSoapResponse(response: string): any {
    const match = response.match(/<BinaryState>(\d)<\/BinaryState>/);
    return {
      power: match ? match[1] === "1" : false,
    };
  }

  // Cleanup resources
  destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.subscriptionServer) {
      this.subscriptionServer.close();
      this.subscriptionServer = null;
    }
  }
}

import fetch from "node-fetch";
import { EventEmitter } from "events";

// Device control class
export class RealDeviceControl extends EventEmitter {
  private devices: Map<string, any> = new Map();

  constructor() {
    super();
  }

  // Update devices
  updateDevices(devices: any[]): void {
    devices.forEach((device) => {
      this.devices.set(device.id, device);
    });
  }

  // Control a device
  async controlDevice(deviceId: string, command: any): Promise<any> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    console.log(
      `Controlling ${device.protocol} device ${device.name}:`,
      command,
    );

    // Handle based on protocol
    switch (device.protocol) {
      case "hue":
        return await this.controlHueDevice(device, command);

      case "wemo":
        return await this.controlWemoDevice(device, command);

      case "upnp":
        return await this.controlUpnpDevice(device, command);

      default:
        throw new Error(`Unsupported protocol: ${device.protocol}`);
    }
  }

  // Control Hue device
  private async controlHueDevice(device: any, command: any): Promise<any> {
    // Check if this is a light
    if (device.type !== "light" || !device.bridgeId) {
      throw new Error("Not a Hue light or missing bridge ID");
    }

    // Get Hue username
    const username = process.env.HUE_USERNAME;
    if (!username) {
      throw new Error("Hue username not configured");
    }

    // Prepare command payload
    const payload: any = {};

    if (command.on !== undefined) {
      payload.on = command.on;
    }

    if (command.brightness !== undefined) {
      payload.bri = Math.max(
        1,
        Math.min(254, Math.round((command.brightness * 254) / 100)),
      );
    }

    if (command.color) {
      if (command.color.h !== undefined && command.color.s !== undefined) {
        payload.hue = Math.round((command.color.h * 65535) / 360);
        payload.sat = Math.round((command.color.s * 254) / 100);
      }
    }

    // Send command to Hue bridge
    const response = await fetch(
      `http://${device.address}/api/${username}/lights/${device.bridgeId}/state`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      },
    );

    const result = await response.json();

    // Check for success
    const success = result.some((item: any) =>
      Object.keys(item).some((key) => key.startsWith("success")),
    );

    if (success) {
      // Update device state
      const updatedState = { ...device.state };

      if (command.on !== undefined) {
        updatedState.on = command.on;
      }

      if (command.brightness !== undefined) {
        updatedState.brightness = command.brightness;
      }

      if (command.color) {
        updatedState.color = command.color;
      }

      const updatedDevice = { ...device, state: updatedState };
      this.devices.set(device.id, updatedDevice);
      this.emit("deviceStateChanged", updatedDevice);

      return {
        success: true,
        deviceId: device.id,
        state: updatedState,
      };
    }

    return {
      success: false,
      message: "Failed to control Hue device",
    };
  }

  // Control WeMo device
  private async controlWemoDevice(device: any, command: any): Promise<any> {
    // WeMo uses SOAP for control
    // This is a simplified implementation

    if (!device.address || !device.port) {
      throw new Error("Missing device address or port");
    }

    // Prepare SOAP action based on command
    let soapAction = "";
    let soapBody = "";

    if (command.on !== undefined) {
      soapAction = "SetBinaryState";
      soapBody = `<BinaryState>${command.on ? 1 : 0}</BinaryState>`;
    }

    if (!soapAction) {
      throw new Error("Unsupported command for WeMo device");
    }

    // Send SOAP request
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:${soapAction} xmlns:u="urn:Belkin:service:basicevent:1">
            ${soapBody}
          </u:${soapAction}>
        </s:Body>
      </s:Envelope>`;

    const response = await fetch(
      `http://${device.address}:${device.port}/upnp/control/basicevent1`,
      {
        method: "POST",
        headers: {
          "Content-Type": 'text/xml; charset="utf-8"',
          SOAPACTION: `"urn:Belkin:service:basicevent:1#${soapAction}"`,
          "Content-Length": soapEnvelope.length.toString(),
        },
        body: soapEnvelope,
      },
    );

    // Check response
    const success = response.ok;

    if (success) {
      // Update device state
      const updatedState = { ...device.state };

      if (command.on !== undefined) {
        updatedState.on = command.on;
      }

      const updatedDevice = { ...device, state: updatedState };
      this.devices.set(device.id, updatedDevice);
      this.emit("deviceStateChanged", updatedDevice);

      return {
        success: true,
        deviceId: device.id,
        state: updatedState,
      };
    }

    return {
      success: false,
      message: "Failed to control WeMo device",
    };
  }

  // Control UPnP device
  private async controlUpnpDevice(device: any, command: any): Promise<any> {
    // UPnP control is complex and varies by device type
    // This is a placeholder for real implementation

    return {
      success: false,
      message: "UPnP control not implemented yet",
    };
  }
}

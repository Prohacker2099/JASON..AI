"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealDeviceControl = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const events_1 = require("events");
// Device control class
class RealDeviceControl extends events_1.EventEmitter {
    devices = new Map();
    constructor() {
        super();
    }
    // Update devices
    updateDevices(devices) {
        devices.forEach((device) => {
            this.devices.set(device.id, device);
        });
    }
    // Control a device
    async controlDevice(deviceId, command) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        console.log(`Controlling ${device.protocol} device ${device.name}:`, command);
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
    async controlHueDevice(device, command) {
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
        const payload = {};
        if (command.on !== undefined) {
            payload.on = command.on;
        }
        if (command.brightness !== undefined) {
            payload.bri = Math.max(1, Math.min(254, Math.round((command.brightness * 254) / 100)));
        }
        if (command.color) {
            if (command.color.h !== undefined && command.color.s !== undefined) {
                payload.hue = Math.round((command.color.h * 65535) / 360);
                payload.sat = Math.round((command.color.s * 254) / 100);
            }
        }
        // Send command to Hue bridge
        const response = await (0, node_fetch_1.default)(`http://${device.address}/api/${username}/lights/${device.bridgeId}/state`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        // Check for success
        const success = result.some((item) => Object.keys(item).some((key) => key.startsWith("success")));
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
    async controlWemoDevice(device, command) {
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
        const response = await (0, node_fetch_1.default)(`http://${device.address}:${device.port}/upnp/control/basicevent1`, {
            method: "POST",
            headers: {
                "Content-Type": 'text/xml; charset="utf-8"',
                SOAPACTION: `"urn:Belkin:service:basicevent:1#${soapAction}"`,
                "Content-Length": soapEnvelope.length.toString(),
            },
            body: soapEnvelope,
        });
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
    async controlUpnpDevice(device, command) {
        // UPnP control is complex and varies by device type
        // This is a placeholder for real implementation
        return {
            success: false,
            message: "UPnP control not implemented yet",
        };
    }
}
exports.RealDeviceControl = RealDeviceControl;

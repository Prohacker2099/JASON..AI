"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WemoPlugin = void 0;
const events_1 = require("events");
const dgram = __importStar(require("dgram"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class WemoPlugin extends events_1.EventEmitter {
    name = "WeMo";
    version = "1.0.0"; // Added version
    supportedDeviceTypes = ["switch", "light"]; // Added supported device types
    devices = new Map();
    socket = null;
    subscriptionServer = null;
    SSDP_PORT = 1900;
    SSDP_ADDR = "239.255.255.250";
    SSDP_MX = 3;
    SSDP_ST = "urn:Belkin:service:basicevent:1";
    constructor() {
        super();
        this.setupSocket();
    }
    setupSocket() {
        this.socket = dgram.createSocket("udp4");
        this.socket.on("error", (err) => {
            console.error("WeMo discovery socket error:", err);
        });
    }
    async discover() {
        if (!this.socket) {
            this.setupSocket();
        }
        return new Promise((resolve) => {
            const found = new Map();
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
            const message = Buffer.from("M-SEARCH * HTTP/1.1\r\n" +
                `HOST: ${this.SSDP_ADDR}:${this.SSDP_PORT}\r\n` +
                'MAN: "ssdp:discover"\r\n' +
                `MX: ${this.SSDP_MX}\r\n` +
                `ST: ${this.SSDP_ST}\r\n\r\n`);
            this.socket.send(message, 0, message.length, this.SSDP_PORT, this.SSDP_ADDR);
            // Wait for responses
            setTimeout(() => {
                resolve(Array.from(found.values()));
            }, this.SSDP_MX * 1000);
        });
    }
    async control(deviceId, command) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        const soapAction = command.type === "power"
            ? "urn:Belkin:service:basicevent:1#SetBinaryState"
            : "urn:Belkin:service:basicevent:1#GetBinaryState";
        const soapBody = command.type === "power"
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
            const response = await (0, node_fetch_1.default)(device.controlUrl, {
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
        }
        catch (error) {
            console.error(`Error controlling WeMo device ${deviceId}:`, error);
            throw error;
        }
    }
    parseDiscoveryResponse(response, rinfo) {
        try {
            const locationMatch = response.match(/LOCATION:\s*(.+)\r\n/i);
            if (!locationMatch)
                return null;
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
        }
        catch (error) {
            console.error("Error parsing WeMo discovery response:", error);
            return null;
        }
    }
    parseSoapResponse(response) {
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
exports.WemoPlugin = WemoPlugin;

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
exports.RealDeviceDiscovery = void 0;
const dgram = __importStar(require("dgram"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const mdns = __importStar(require("mdns-js"));
const events_1 = require("events");
const logger_js_1 = require("../server/services/logger.js");
const logger = new logger_js_1.Logger("RealDeviceDiscovery");
// Device discovery class
class RealDeviceDiscovery extends events_1.EventEmitter {
    devices = new Map();
    scanning = false;
    mdnsBrowser = null;
    ssdpSocket = null;
    constructor() {
        super();
    }
    // Start device discovery
    async startDiscovery() {
        if (this.scanning)
            return Array.from(this.devices.values());
        this.scanning = true;
        logger.info("Starting real device discovery...");
        try {
            // Run discovery methods in parallel
            await Promise.all([
                this.discoverWithMdns(),
                this.discoverWithSsdp(),
                this.discoverHueBridges(),
            ]);
            logger.info(`Discovery complete. Found ${this.devices.size} devices.`);
            return Array.from(this.devices.values());
        }
        catch (error) {
            logger.error("Error during device discovery:", error);
            return [];
        }
        finally {
            this.scanning = false;
        }
    }
    // Stop discovery
    stopDiscovery() {
        if (this.mdnsBrowser) {
            this.mdnsBrowser.stop();
            this.mdnsBrowser = null;
        }
        if (this.ssdpSocket) {
            this.ssdpSocket.close();
            this.ssdpSocket = null;
        }
        this.scanning = false;
        logger.info("Device discovery stopped");
    }
    // Get discovered devices
    getDevices() {
        return Array.from(this.devices.values());
    }
    // Discover devices using mDNS
    async discoverWithMdns() {
        return new Promise((resolve) => {
            try {
                logger.info("Starting mDNS discovery...");
                this.mdnsBrowser = mdns.createBrowser(mdns.tcp("http"));
                this.mdnsBrowser.on("ready", () => {
                    this.mdnsBrowser.discover();
                });
                this.mdnsBrowser.on("update", (data) => {
                    try {
                        if (data.addresses && data.addresses.length > 0) {
                            const device = this.processMdnsDevice(data);
                            if (device) {
                                this.addDevice(device);
                            }
                        }
                    }
                    catch (err) {
                        logger.error("Error processing mDNS device:", err);
                    }
                });
                this.mdnsBrowser.on("error", (err) => {
                    logger.error("mDNS browser error:", err);
                });
                // Resolve after timeout
                setTimeout(() => {
                    resolve();
                }, 5000);
            }
            catch (error) {
                logger.error("Error in mDNS discovery:", error);
                resolve();
            }
        });
    }
    // Process mDNS device data
    processMdnsDevice(data) {
        try {
            const name = data.name || "";
            const address = data.addresses?.[0] || "";
            const hostname = data.hostname || "";
            if (!address)
                return null;
            // Determine device type
            let type = "other";
            let protocol = "mdns";
            let manufacturer = "Unknown";
            if (hostname.includes("philips-hue") || name.includes("hue")) {
                type = "bridge";
                protocol = "hue";
                manufacturer = "Philips";
            }
            else if (hostname.includes("sonos") || name.includes("sonos")) {
                type = "speaker";
                manufacturer = "Sonos";
            }
            return {
                id: `mdns-${hostname || address}`,
                name: name || hostname || `Device at ${address}`,
                manufacturer,
                type,
                protocol,
                address,
                port: data.port,
                capabilities: [],
                online: true,
            };
        }
        catch (error) {
            logger.error("Error processing mDNS device:", error);
            return null;
        }
    }
    // Discover devices using SSDP
    async discoverWithSsdp() {
        return new Promise((resolve) => {
            try {
                logger.info("Starting SSDP discovery...");
                this.ssdpSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
                const SSDP_ADDR = "239.255.255.250";
                const SSDP_PORT = 1900;
                this.ssdpSocket.on("message", (msg, rinfo) => {
                    try {
                        const message = msg.toString();
                        // Extract location header
                        const locationMatch = message.match(/LOCATION: (.*)/i);
                        if (locationMatch && locationMatch[1]) {
                            const location = locationMatch[1].trim();
                            this.fetchSsdpDescription(location, rinfo.address);
                        }
                    }
                    catch (err) {
                        logger.error("Error processing SSDP message:", err);
                    }
                });
                this.ssdpSocket.on("error", (err) => {
                    logger.error("SSDP socket error:", err);
                });
                this.ssdpSocket.bind(() => {
                    try {
                        // Send M-SEARCH request
                        const searchMessage = Buffer.from("M-SEARCH * HTTP/1.1\r\n" +
                            `HOST: ${SSDP_ADDR}:${SSDP_PORT}\r\n` +
                            'MAN: "ssdp:discover"\r\n' +
                            "MX: 3\r\n" +
                            "ST: ssdp:all\r\n\r\n");
                        this.ssdpSocket?.send(searchMessage, 0, searchMessage.length, SSDP_PORT, SSDP_ADDR);
                    }
                    catch (err) {
                        logger.error("Error sending SSDP discovery message:", err);
                    }
                    // Resolve after timeout
                    setTimeout(() => {
                        if (this.ssdpSocket) {
                            this.ssdpSocket.close();
                            this.ssdpSocket = null;
                        }
                        resolve();
                    }, 5000);
                });
            }
            catch (error) {
                logger.error("Error in SSDP discovery:", error);
                resolve();
            }
        });
    }
    // Fetch SSDP device description
    async fetchSsdpDescription(location, address) {
        try {
            const response = await (0, node_fetch_1.default)(location, { timeout: 2000 });
            const xml = await response.text();
            // Extract device info from XML
            const friendlyNameMatch = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/);
            const manufacturerMatch = xml.match(/<manufacturer>([^<]+)<\/manufacturer>/);
            const modelNameMatch = xml.match(/<modelName>([^<]+)<\/modelName>/);
            const deviceTypeMatch = xml.match(/<deviceType>([^<]+)<\/deviceType>/);
            if (!friendlyNameMatch)
                return;
            const device = {
                id: `ssdp-${address}`,
                name: friendlyNameMatch[1],
                manufacturer: manufacturerMatch ? manufacturerMatch[1] : "Unknown",
                model: modelNameMatch ? modelNameMatch[1] : "Unknown",
                type: this.getSsdpDeviceType(deviceTypeMatch ? deviceTypeMatch[1] : ""),
                protocol: "upnp",
                address,
                capabilities: [],
                online: true,
            };
            this.addDevice(device);
        }
        catch (error) {
            // Ignore fetch errors
        }
    }
    // Get device type from SSDP device type
    getSsdpDeviceType(deviceType) {
        if (deviceType.includes("MediaRenderer"))
            return "speaker";
        if (deviceType.includes("Light"))
            return "light";
        if (deviceType.includes("Switch"))
            return "switch";
        return "other";
    }
    // Discover Philips Hue bridges
    async discoverHueBridges() {
        try {
            logger.info("Discovering Hue bridges...");
            // Try to use configured bridge IP first
            if (process.env.HUE_BRIDGE_IP) {
                const bridgeIp = process.env.HUE_BRIDGE_IP;
                try {
                    const response = await (0, node_fetch_1.default)(`http://${bridgeIp}/api/config`, {
                        timeout: 2000,
                    });
                    const data = await response.json();
                    if (data.bridgeid) {
                        const device = {
                            id: `hue-bridge-${data.bridgeid}`,
                            name: data.name || "Philips Hue Bridge",
                            manufacturer: "Philips",
                            model: "Hue Bridge",
                            type: "bridge",
                            protocol: "hue",
                            address: bridgeIp,
                            capabilities: ["lights"],
                            online: true,
                        };
                        this.addDevice(device);
                        // If we have a username, discover lights
                        if (process.env.HUE_USERNAME) {
                            await this.discoverHueLights(bridgeIp);
                        }
                        return;
                    }
                }
                catch (err) {
                    logger.warn(`Failed to connect to configured Hue bridge at ${bridgeIp}:`, err);
                }
            }
            // Fall back to discovery API
            try {
                const response = await (0, node_fetch_1.default)("https://discovery.meethue.com/");
                const bridges = await response.json();
                for (const bridge of bridges) {
                    if (bridge.internalipaddress) {
                        const device = {
                            id: `hue-bridge-${bridge.id}`,
                            name: "Philips Hue Bridge",
                            manufacturer: "Philips",
                            model: "Hue Bridge",
                            type: "bridge",
                            protocol: "hue",
                            address: bridge.internalipaddress,
                            capabilities: ["lights"],
                            online: true,
                        };
                        this.addDevice(device);
                        // If we have a username, discover lights
                        if (process.env.HUE_USERNAME) {
                            await this.discoverHueLights(bridge.internalipaddress);
                        }
                    }
                }
            }
            catch (error) {
                logger.error("Error discovering Hue bridges via discovery API:", error);
            }
        }
        catch (error) {
            logger.error("Error in Hue bridge discovery:", error);
        }
    }
    // Discover Hue lights
    async discoverHueLights(bridgeIp) {
        try {
            const username = process.env.HUE_USERNAME;
            if (!username) {
                logger.warn("HUE_USERNAME not set, skipping light discovery");
                return;
            }
            logger.info(`Discovering Hue lights from bridge at ${bridgeIp}...`);
            const response = await (0, node_fetch_1.default)(`http://${bridgeIp}/api/${username}/lights`);
            const lights = await response.json();
            if (lights.error) {
                logger.error("Error from Hue API:", lights.error);
                return;
            }
            for (const [id, light] of Object.entries(lights)) {
                const device = {
                    id: `hue-light-${id}`,
                    name: light.name,
                    manufacturer: "Philips",
                    model: light.modelid || "Hue Light",
                    type: "light",
                    protocol: "hue",
                    address: bridgeIp,
                    bridgeId: id,
                    capabilities: this.getHueCapabilities(light),
                    state: {
                        on: light.state?.on || false,
                        brightness: light.state?.bri
                            ? Math.round((light.state.bri / 254) * 100)
                            : 0,
                    },
                    online: light.state?.reachable || false,
                };
                this.addDevice(device);
            }
            logger.info(`Discovered ${Object.keys(lights).length} Hue lights`);
        }
        catch (error) {
            logger.error("Error discovering Hue lights:", error);
        }
    }
    // Get Hue light capabilities
    getHueCapabilities(light) {
        const capabilities = ["on"];
        if (light.state?.bri !== undefined) {
            capabilities.push("brightness");
        }
        if (light.state?.hue !== undefined && light.state?.sat !== undefined) {
            capabilities.push("color");
        }
        if (light.state?.ct !== undefined) {
            capabilities.push("temperature");
        }
        return capabilities;
    }
    // Add device to the device map
    addDevice(device) {
        this.devices.set(device.id, device);
        this.emit("deviceDiscovered", device);
        logger.info(`Discovered device: ${device.name} (${device.protocol})`);
    }
}
exports.RealDeviceDiscovery = RealDeviceDiscovery;

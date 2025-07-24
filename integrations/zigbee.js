"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
exports.getDevices = getDevices;
exports.controlDevice = controlDevice;
exports.scanNetwork = scanNetwork;
const serialport_1 = require("serialport");
const events_1 = require("events");
// Zigbee coordinator types
var CoordinatorType;
(function (CoordinatorType) {
    CoordinatorType[CoordinatorType["CC2531"] = 0] = "CC2531";
    CoordinatorType[CoordinatorType["CC2652"] = 1] = "CC2652";
    CoordinatorType[CoordinatorType["CONBEE"] = 2] = "CONBEE";
    CoordinatorType[CoordinatorType["EMBER"] = 3] = "EMBER";
})(CoordinatorType || (CoordinatorType = {}));
// Device types
var DeviceType;
(function (DeviceType) {
    DeviceType["LIGHT"] = "light";
    DeviceType["SWITCH"] = "switch";
    DeviceType["SENSOR"] = "sensor";
    DeviceType["OUTLET"] = "outlet";
    DeviceType["LOCK"] = "lock";
    DeviceType["THERMOSTAT"] = "thermostat";
    DeviceType["OTHER"] = "other";
})(DeviceType || (DeviceType = {}));
// Zigbee coordinator class
class ZigbeeCoordinator extends events_1.EventEmitter {
    port = null;
    connected = false;
    devices = new Map();
    coordinatorType;
    path;
    constructor(path, type = CoordinatorType.CC2652) {
        super();
        this.path = path;
        this.coordinatorType = type;
    }
    /**
     * Connect to the Zigbee coordinator
     */
    async connect() {
        if (this.connected)
            return true;
        try {
            // Create serial port connection
            this.port = new serialport_1.SerialPort({
                path: this.path,
                baudRate: this.getBaudRate(),
                autoOpen: false,
            });
            return new Promise((resolve, reject) => {
                if (!this.port) {
                    reject(new Error("Serial port not initialized"));
                    return;
                }
                this.port.open((err) => {
                    if (err) {
                        console.error("Error opening Zigbee coordinator port:", err);
                        reject(err);
                        return;
                    }
                    console.log(`Connected to Zigbee coordinator at ${this.path}`);
                    this.connected = true;
                    // Set up data handler
                    this.port.on("data", (data) => {
                        this.handleData(data);
                    });
                    // Set up error handler
                    this.port.on("error", (err) => {
                        console.error("Zigbee coordinator error:", err);
                        this.emit("error", err);
                    });
                    // Set up close handler
                    this.port.on("close", () => {
                        console.log("Zigbee coordinator connection closed");
                        this.connected = false;
                        this.emit("disconnect");
                    });
                    // Initialize coordinator
                    this.initialize()
                        .then(() => {
                        resolve(true);
                    })
                        .catch(reject);
                });
            });
        }
        catch (error) {
            console.error("Error connecting to Zigbee coordinator:", error);
            return false;
        }
    }
    /**
     * Disconnect from the Zigbee coordinator
     */
    disconnect() {
        if (!this.connected || !this.port)
            return;
        try {
            this.port.close();
            this.connected = false;
            console.log("Disconnected from Zigbee coordinator");
        }
        catch (error) {
            console.error("Error disconnecting from Zigbee coordinator:", error);
        }
    }
    /**
     * Initialize the coordinator
     */
    async initialize() {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to coordinator");
        }
        try {
            // Send initialization commands based on coordinator type
            switch (this.coordinatorType) {
                case CoordinatorType.CC2531:
                case CoordinatorType.CC2652:
                    await this.sendCommand([0xfe, 0x00, 0x21, 0x10, 0x02, 0x00, 0x00]);
                    break;
                case CoordinatorType.CONBEE:
                    await this.sendCommand([0xc0, 0x0d, 0x00, 0x00, 0x05, 0x00]);
                    break;
                case CoordinatorType.EMBER:
                    await this.sendCommand([0x1a, 0xc0, 0x00, 0x00, 0x00]);
                    break;
            }
            // Wait for coordinator to initialize
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Start network scan
            await this.scanNetwork();
        }
        catch (error) {
            console.error("Error initializing Zigbee coordinator:", error);
            throw error;
        }
    }
    /**
     * Scan for Zigbee devices on the network
     */
    async scanNetwork() {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to coordinator");
        }
        try {
            console.log("Scanning for Zigbee devices...");
            // Send network scan command based on coordinator type
            switch (this.coordinatorType) {
                case CoordinatorType.CC2531:
                case CoordinatorType.CC2652:
                    await this.sendCommand([0xfe, 0x00, 0x21, 0x00, 0x01]);
                    break;
                case CoordinatorType.CONBEE:
                    await this.sendCommand([0xc0, 0x0e, 0x00, 0x00]);
                    break;
                case CoordinatorType.EMBER:
                    await this.sendCommand([0x1a, 0xc1, 0x00, 0x00]);
                    break;
            }
            // Wait for scan to complete (in a real implementation, we would wait for specific response)
            await new Promise((resolve) => setTimeout(resolve, 10000));
            return Array.from(this.devices.values());
        }
        catch (error) {
            console.error("Error scanning Zigbee network:", error);
            return [];
        }
    }
    /**
     * Send a command to the coordinator
     */
    async sendCommand(data) {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to coordinator");
        }
        return new Promise((resolve, reject) => {
            this.port.write(Buffer.from(data), (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Handle data received from the coordinator
     */
    handleData(data) {
        try {
            // Parse data based on coordinator type
            switch (this.coordinatorType) {
                case CoordinatorType.CC2531:
                case CoordinatorType.CC2652:
                    this.parseCC26xxData(data);
                    break;
                case CoordinatorType.CONBEE:
                    this.parseConbeeData(data);
                    break;
                case CoordinatorType.EMBER:
                    this.parseEmberData(data);
                    break;
            }
        }
        catch (error) {
            console.error("Error handling Zigbee data:", error);
        }
    }
    /**
     * Parse data from CC2531/CC2652 coordinator
     */
    parseCC26xxData(data) {
        // This is a simplified implementation
        // In a real implementation, we would parse the ZNP protocol
        // Check if this is a device announcement
        if (data[0] === 0xfe && data[2] === 0x45) {
            const deviceId = data.slice(3, 11).toString("hex");
            const deviceInfo = {
                id: `zigbee-${deviceId}`,
                name: `Zigbee Device ${deviceId.substring(0, 4)}`,
                type: this.determineDeviceType(data),
                manufacturer: "Unknown",
                model: "Unknown",
                protocol: "zigbee",
                networkAddress: data.readUInt16LE(11),
                capabilities: [],
                state: {},
                online: true,
                discovered: new Date().toISOString(),
            };
            this.addOrUpdateDevice(deviceInfo);
        }
    }
    /**
     * Parse data from ConBee coordinator
     */
    parseConbeeData(data) {
        // This is a simplified implementation
        // In a real implementation, we would parse the deCONZ protocol
        // Check if this is a device announcement
        if (data[0] === 0xc1 && data[1] === 0x0d) {
            const deviceId = data.slice(5, 13).toString("hex");
            const deviceInfo = {
                id: `zigbee-${deviceId}`,
                name: `Zigbee Device ${deviceId.substring(0, 4)}`,
                type: this.determineDeviceType(data),
                manufacturer: "Unknown",
                model: "Unknown",
                protocol: "zigbee",
                networkAddress: data.readUInt16LE(3),
                capabilities: [],
                state: {},
                online: true,
                discovered: new Date().toISOString(),
            };
            this.addOrUpdateDevice(deviceInfo);
        }
    }
    /**
     * Parse data from Ember coordinator
     */
    parseEmberData(data) {
        // This is a simplified implementation
        // In a real implementation, we would parse the EZSP protocol
        // Check if this is a device announcement
        if (data[0] === 0x1a && data[1] === 0xc2) {
            const deviceId = data.slice(4, 12).toString("hex");
            const deviceInfo = {
                id: `zigbee-${deviceId}`,
                name: `Zigbee Device ${deviceId.substring(0, 4)}`,
                type: this.determineDeviceType(data),
                manufacturer: "Unknown",
                model: "Unknown",
                protocol: "zigbee",
                networkAddress: data.readUInt16LE(2),
                capabilities: [],
                state: {},
                online: true,
                discovered: new Date().toISOString(),
            };
            this.addOrUpdateDevice(deviceInfo);
        }
    }
    /**
     * Determine device type from data
     */
    determineDeviceType(data) {
        // This is a simplified implementation
        // In a real implementation, we would use device profiles and clusters
        // For now, just return a default type
        return DeviceType.OTHER;
    }
    /**
     * Add or update a device
     */
    addOrUpdateDevice(deviceInfo) {
        const existingDevice = this.devices.get(deviceInfo.id);
        if (existingDevice) {
            // Update existing device
            this.devices.set(deviceInfo.id, {
                ...existingDevice,
                ...deviceInfo,
                lastSeen: new Date().toISOString(),
            });
            this.emit("deviceUpdated", this.devices.get(deviceInfo.id));
        }
        else {
            // Add new device
            this.devices.set(deviceInfo.id, {
                ...deviceInfo,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
            });
            this.emit("deviceDiscovered", this.devices.get(deviceInfo.id));
        }
    }
    /**
     * Get all discovered devices
     */
    getDevices() {
        return Array.from(this.devices.values());
    }
    /**
     * Get device by ID
     */
    getDevice(id) {
        return this.devices.get(id);
    }
    /**
     * Control a device
     */
    async controlDevice(deviceId, command) {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to coordinator");
        }
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        try {
            // Prepare command based on device type and command
            let commandData = [];
            switch (device.type) {
                case DeviceType.LIGHT:
                    commandData = this.prepareLightCommand(device, command);
                    break;
                case DeviceType.SWITCH:
                case DeviceType.OUTLET:
                    commandData = this.prepareOnOffCommand(device, command);
                    break;
                case DeviceType.THERMOSTAT:
                    commandData = this.prepareThermostatCommand(device, command);
                    break;
                default:
                    throw new Error(`Unsupported device type: ${device.type}`);
            }
            // Send command to device
            await this.sendCommand(commandData);
            // Update device state
            const newState = { ...device.state, ...command };
            device.state = newState;
            return {
                success: true,
                deviceId,
                state: newState,
            };
        }
        catch (error) {
            console.error(`Error controlling Zigbee device ${deviceId}:`, error);
            throw error;
        }
    }
    /**
     * Prepare command for light device
     */
    prepareLightCommand(device, command) {
        // This is a simplified implementation
        // In a real implementation, we would use the appropriate ZCL commands
        const networkAddress = device.networkAddress;
        if (command.on !== undefined) {
            // On/Off command
            return [
                0xfe, // SOF
                0x09, // Length
                0x21, // Command
                0x00, // Address mode (16-bit)
                networkAddress & 0xff, // Network address LSB
                (networkAddress >> 8) & 0xff, // Network address MSB
                0x01, // Endpoint
                0x00, // Cluster ID LSB (On/Off cluster)
                0x06, // Cluster ID MSB
                command.on ? 0x01 : 0x00, // Command (On/Off)
                0x00, // Transaction ID
            ];
        }
        else if (command.brightness !== undefined) {
            // Brightness command
            const level = Math.max(0, Math.min(254, Math.round(command.brightness * 2.54)));
            return [
                0xfe, // SOF
                0x0a, // Length
                0x21, // Command
                0x00, // Address mode (16-bit)
                networkAddress & 0xff, // Network address LSB
                (networkAddress >> 8) & 0xff, // Network address MSB
                0x01, // Endpoint
                0x00, // Cluster ID LSB (Level Control cluster)
                0x08, // Cluster ID MSB
                0x04, // Command (Move to Level)
                level, // Level
                0x00, // Transaction ID
            ];
        }
        else if (command.color) {
            // Color command (simplified)
            const hue = Math.round((command.color.h * 254) / 360);
            const saturation = Math.round((command.color.s * 254) / 100);
            return [
                0xfe, // SOF
                0x0c, // Length
                0x21, // Command
                0x00, // Address mode (16-bit)
                networkAddress & 0xff, // Network address LSB
                (networkAddress >> 8) & 0xff, // Network address MSB
                0x01, // Endpoint
                0x00, // Cluster ID LSB (Color Control cluster)
                0x03, // Cluster ID MSB
                0x06, // Command (Move to Hue and Saturation)
                hue, // Hue
                saturation, // Saturation
                0x00, // Transaction ID
            ];
        }
        throw new Error("Unsupported command for light device");
    }
    /**
     * Prepare command for on/off device
     */
    prepareOnOffCommand(device, command) {
        // This is a simplified implementation
        const networkAddress = device.networkAddress;
        if (command.on !== undefined) {
            // On/Off command
            return [
                0xfe, // SOF
                0x09, // Length
                0x21, // Command
                0x00, // Address mode (16-bit)
                networkAddress & 0xff, // Network address LSB
                (networkAddress >> 8) & 0xff, // Network address MSB
                0x01, // Endpoint
                0x00, // Cluster ID LSB (On/Off cluster)
                0x06, // Cluster ID MSB
                command.on ? 0x01 : 0x00, // Command (On/Off)
                0x00, // Transaction ID
            ];
        }
        throw new Error("Unsupported command for on/off device");
    }
    /**
     * Prepare command for thermostat device
     */
    prepareThermostatCommand(device, command) {
        // This is a simplified implementation
        const networkAddress = device.networkAddress;
        if (command.temperature !== undefined) {
            // Set temperature command (simplified)
            const temperature = Math.round(command.temperature * 100);
            return [
                0xfe, // SOF
                0x0b, // Length
                0x21, // Command
                0x00, // Address mode (16-bit)
                networkAddress & 0xff, // Network address LSB
                (networkAddress >> 8) & 0xff, // Network address MSB
                0x01, // Endpoint
                0x01, // Cluster ID LSB (Thermostat cluster)
                0x02, // Cluster ID MSB
                0x00, // Command (Write Attribute)
                temperature & 0xff, // Temperature LSB
                (temperature >> 8) & 0xff, // Temperature MSB
                0x00, // Transaction ID
            ];
        }
        throw new Error("Unsupported command for thermostat device");
    }
    /**
     * Get baud rate based on coordinator type
     */
    getBaudRate() {
        switch (this.coordinatorType) {
            case CoordinatorType.CC2531:
                return 115200;
            case CoordinatorType.CC2652:
                return 115200;
            case CoordinatorType.CONBEE:
                return 38400;
            case CoordinatorType.EMBER:
                return 57600;
            default:
                return 115200;
        }
    }
}
// Singleton instance
let coordinator = null;
/**
 * Initialize Zigbee coordinator
 */
async function initialize() {
    try {
        // Get coordinator path from environment variable or use default
        const path = process.env.ZIGBEE_COORDINATOR_PATH || "/dev/ttyACM0";
        // Get coordinator type from environment variable or use default
        const typeStr = process.env.ZIGBEE_COORDINATOR_TYPE || "CC2652";
        let type = CoordinatorType.CC2652;
        switch (typeStr.toUpperCase()) {
            case "CC2531":
                type = CoordinatorType.CC2531;
                break;
            case "CC2652":
                type = CoordinatorType.CC2652;
                break;
            case "CONBEE":
                type = CoordinatorType.CONBEE;
                break;
            case "EMBER":
                type = CoordinatorType.EMBER;
                break;
        }
        // Create coordinator instance
        coordinator = new ZigbeeCoordinator(path, type);
        // Connect to coordinator
        return await coordinator.connect();
    }
    catch (error) {
        console.error("Error initializing Zigbee coordinator:", error);
        return false;
    }
}
/**
 * Get all Zigbee devices
 */
function getDevices() {
    if (!coordinator) {
        return [];
    }
    return coordinator.getDevices();
}
/**
 * Control a Zigbee device
 */
async function controlDevice(deviceId, command) {
    if (!coordinator) {
        throw new Error("Zigbee coordinator not initialized");
    }
    return await coordinator.controlDevice(deviceId, command);
}
/**
 * Scan for Zigbee devices
 */
async function scanNetwork() {
    if (!coordinator) {
        throw new Error("Zigbee coordinator not initialized");
    }
    return await coordinator.scanNetwork();
}

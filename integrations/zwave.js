"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
exports.getDevices = getDevices;
exports.controlDevice = controlDevice;
exports.scanNetwork = scanNetwork;
const serialport_1 = require("serialport");
const events_1 = require("events");
// Z-Wave controller class
class ZWaveController extends events_1.EventEmitter {
    port = null;
    connected = false;
    devices = new Map();
    path;
    constructor(path) {
        super();
        this.path = path;
    }
    /**
     * Connect to the Z-Wave controller
     */
    async connect() {
        if (this.connected)
            return true;
        try {
            // Create serial port connection
            this.port = new serialport_1.SerialPort({
                path: this.path,
                baudRate: 115200,
                autoOpen: false,
            });
            return new Promise((resolve, reject) => {
                if (!this.port) {
                    reject(new Error("Serial port not initialized"));
                    return;
                }
                this.port.open((err) => {
                    if (err) {
                        console.error("Error opening Z-Wave controller port:", err);
                        reject(err);
                        return;
                    }
                    console.log(`Connected to Z-Wave controller at ${this.path}`);
                    this.connected = true;
                    // Set up data handler
                    this.port.on("data", (data) => {
                        this.handleData(data);
                    });
                    // Set up error handler
                    this.port.on("error", (err) => {
                        console.error("Z-Wave controller error:", err);
                        this.emit("error", err);
                    });
                    // Set up close handler
                    this.port.on("close", () => {
                        console.log("Z-Wave controller connection closed");
                        this.connected = false;
                        this.emit("disconnect");
                    });
                    // Initialize controller
                    this.initialize()
                        .then(() => {
                        resolve(true);
                    })
                        .catch(reject);
                });
            });
        }
        catch (error) {
            console.error("Error connecting to Z-Wave controller:", error);
            return false;
        }
    }
    /**
     * Disconnect from the Z-Wave controller
     */
    disconnect() {
        if (!this.connected || !this.port)
            return;
        try {
            this.port.close();
            this.connected = false;
            console.log("Disconnected from Z-Wave controller");
        }
        catch (error) {
            console.error("Error disconnecting from Z-Wave controller:", error);
        }
    }
    /**
     * Initialize the controller
     */
    async initialize() {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to controller");
        }
        try {
            // Send initialization commands
            await this.sendCommand([0x01, 0x03, 0x00, 0x08, 0x00]);
            // Wait for controller to initialize
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Start network scan
            await this.scanNetwork();
        }
        catch (error) {
            console.error("Error initializing Z-Wave controller:", error);
            throw error;
        }
    }
    /**
     * Scan for Z-Wave devices on the network
     */
    async scanNetwork() {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to controller");
        }
        try {
            console.log("Scanning for Z-Wave devices...");
            // Send network scan command
            await this.sendCommand([0x01, 0x02, 0x00, 0x02]);
            // Wait for scan to complete (in a real implementation, we would wait for specific response)
            await new Promise((resolve) => setTimeout(resolve, 30000));
            return Array.from(this.devices.values());
        }
        catch (error) {
            console.error("Error scanning Z-Wave network:", error);
            return [];
        }
    }
    /**
     * Send a command to the controller
     */
    async sendCommand(data) {
        if (!this.connected || !this.port) {
            throw new Error("Not connected to controller");
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
     * Handle data received from the controller
     */
    handleData(data) {
        try {
            // Parse Z-Wave protocol data
            this.parseZWaveData(data);
        }
        catch (error) {
            console.error("Error handling Z-Wave data:", error);
        }
    }
    /**
     * Parse Z-Wave protocol data
     */
    parseZWaveData(data) {
        // This is a simplified implementation
        // In a real implementation, we would parse the Z-Wave protocol
        // Check if this is a node info frame
        if (data[0] === 0x01 && data[1] === 0x04 && data[2] === 0x00) {
            const nodeId = data[3];
            const basicType = data[4];
            const genericType = data[5];
            const specificType = data[6];
            const deviceInfo = {
                id: `zwave-${nodeId}`,
                name: `Z-Wave Device ${nodeId}`,
                type: this.determineDeviceType(basicType, genericType, specificType),
                manufacturer: "Unknown",
                model: "Unknown",
                protocol: "zwave",
                nodeId,
                basicType,
                genericType,
                specificType,
                capabilities: this.determineCapabilities(genericType, specificType),
                state: {},
                online: true,
                discovered: new Date().toISOString(),
            };
            this.addOrUpdateDevice(deviceInfo);
        }
    }
    /**
     * Determine device type from Z-Wave device classes
     */
    determineDeviceType(basicType, genericType, specificType) {
        // Basic Device Class
        // 0x01: Controller, 0x02: Static Controller, 0x03: Slave, 0x04: Routing Slave
        // Generic Device Class
        switch (genericType) {
            case 0x01: // Generic Controller
                return "controller";
            case 0x02: // Static Controller
                return "controller";
            case 0x10: // Binary Switch
                return "switch";
            case 0x11: // Multilevel Switch
                return specificType === 0x01 ? "light" : "switch";
            case 0x08: // Thermostat
                return "thermostat";
            case 0x12: // Binary Sensor
                return "sensor";
            case 0x13: // Multilevel Sensor
                return "sensor";
            case 0x15: // Binary Meter
            case 0x16: // Multilevel Meter
                return "outlet";
            case 0x40: // Entry Control
                return "lock";
            default:
                return "other";
        }
    }
    /**
     * Determine device capabilities from Z-Wave device classes
     */
    determineCapabilities(genericType, specificType) {
        const capabilities = [];
        switch (genericType) {
            case 0x10: // Binary Switch
                capabilities.push("on");
                break;
            case 0x11: // Multilevel Switch
                capabilities.push("on");
                if (specificType === 0x01) {
                    capabilities.push("brightness");
                }
                break;
            case 0x08: // Thermostat
                capabilities.push("temperature");
                capabilities.push("mode");
                break;
            case 0x12: // Binary Sensor
                capabilities.push("binary");
                break;
            case 0x13: // Multilevel Sensor
                capabilities.push("value");
                break;
            case 0x15: // Binary Meter
            case 0x16: // Multilevel Meter
                capabilities.push("on");
                capabilities.push("energy");
                break;
            case 0x40: // Entry Control
                capabilities.push("lock");
                break;
        }
        return capabilities;
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
            throw new Error("Not connected to controller");
        }
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        try {
            // Prepare command based on device type and command
            let commandData = [];
            switch (device.type) {
                case "light":
                    commandData = this.prepareLightCommand(device, command);
                    break;
                case "switch":
                case "outlet":
                    commandData = this.prepareOnOffCommand(device, command);
                    break;
                case "thermostat":
                    commandData = this.prepareThermostatCommand(device, command);
                    break;
                case "lock":
                    commandData = this.prepareLockCommand(device, command);
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
            console.error(`Error controlling Z-Wave device ${deviceId}:`, error);
            throw error;
        }
    }
    /**
     * Prepare command for light device
     */
    prepareLightCommand(device, command) {
        const nodeId = device.nodeId;
        if (command.on !== undefined) {
            // Binary Switch Set command
            return [
                0x01, // SOF
                0x09, // Length
                0x00, // Request
                0x13, // SwitchBinaryCmd
                0x01, // SwitchBinarySet
                nodeId, // Node ID
                command.on ? 0xff : 0x00, // Value (ON/OFF)
                0x25, // Transmit options
                0x00, // Callback ID
            ];
        }
        else if (command.brightness !== undefined) {
            // Multilevel Switch Set command
            const level = Math.max(0, Math.min(99, Math.round(command.brightness * 0.99)));
            return [
                0x01, // SOF
                0x09, // Length
                0x00, // Request
                0x26, // SwitchMultilevelCmd
                0x01, // SwitchMultilevelSet
                nodeId, // Node ID
                level, // Value (0-99)
                0x25, // Transmit options
                0x00, // Callback ID
            ];
        }
        throw new Error("Unsupported command for light device");
    }
    /**
     * Prepare command for on/off device
     */
    prepareOnOffCommand(device, command) {
        const nodeId = device.nodeId;
        if (command.on !== undefined) {
            // Binary Switch Set command
            return [
                0x01, // SOF
                0x09, // Length
                0x00, // Request
                0x13, // SwitchBinaryCmd
                0x01, // SwitchBinarySet
                nodeId, // Node ID
                command.on ? 0xff : 0x00, // Value (ON/OFF)
                0x25, // Transmit options
                0x00, // Callback ID
            ];
        }
        throw new Error("Unsupported command for on/off device");
    }
    /**
     * Prepare command for thermostat device
     */
    prepareThermostatCommand(device, command) {
        const nodeId = device.nodeId;
        if (command.temperature !== undefined) {
            // Thermostat Setpoint Set command
            const temperature = Math.round(command.temperature * 10); // Precision of 0.1 degrees
            return [
                0x01, // SOF
                0x0b, // Length
                0x00, // Request
                0x43, // ThermostatSetpointCmd
                0x01, // ThermostatSetpointSet
                nodeId, // Node ID
                0x01, // Setpoint Type (Heating)
                0x09, // Size
                temperature & 0xff, // Value LSB
                (temperature >> 8) & 0xff, // Value MSB
                0x25, // Transmit options
                0x00, // Callback ID
            ];
        }
        else if (command.mode !== undefined) {
            // Thermostat Mode Set command
            let mode = 0;
            switch (command.mode) {
                case "off":
                    mode = 0;
                    break;
                case "heat":
                    mode = 1;
                    break;
                case "cool":
                    mode = 2;
                    break;
                case "auto":
                    mode = 3;
                    break;
                default:
                    throw new Error(`Unsupported thermostat mode: ${command.mode}`);
            }
            return [
                0x01, // SOF
                0x09, // Length
                0x00, // Request
                0x40, // ThermostatModeCmd
                0x01, // ThermostatModeSet
                nodeId, // Node ID
                mode, // Mode
                0x25, // Transmit options
                0x00, // Callback ID
            ];
        }
        throw new Error("Unsupported command for thermostat device");
    }
    /**
     * Prepare command for lock device
     */
    prepareLockCommand(device, command) {
        const nodeId = device.nodeId;
        if (command.locked !== undefined) {
            // Door Lock Set command
            return [
                0x01, // SOF
                0x09, // Length
                0x00, // Request
                0x62, // DoorLockCmd
                0x01, // DoorLockSet
                nodeId, // Node ID
                command.locked ? 0xff : 0x00, // Value (LOCKED/UNLOCKED)
                0x25, // Transmit options
                0x00, // Callback ID
            ];
        }
        throw new Error("Unsupported command for lock device");
    }
}
// Singleton instance
let controller = null;
/**
 * Initialize Z-Wave controller
 */
async function initialize() {
    try {
        // Get controller path from environment variable or use default
        const path = process.env.ZWAVE_CONTROLLER_PATH || "/dev/ttyACM0";
        // Create controller instance
        controller = new ZWaveController(path);
        // Connect to controller
        return await controller.connect();
    }
    catch (error) {
        console.error("Error initializing Z-Wave controller:", error);
        return false;
    }
}
/**
 * Get all Z-Wave devices
 */
function getDevices() {
    if (!controller) {
        return [];
    }
    return controller.getDevices();
}
/**
 * Control a Z-Wave device
 */
async function controlDevice(deviceId, command) {
    if (!controller) {
        throw new Error("Z-Wave controller not initialized");
    }
    return await controller.controlDevice(deviceId, command);
}
/**
 * Scan for Z-Wave devices
 */
async function scanNetwork() {
    if (!controller) {
        throw new Error("Z-Wave controller not initialized");
    }
    return await controller.scanNetwork();
}

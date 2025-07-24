"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealIntegration = void 0;
const real_device_discovery_js_1 = require("./real-device-discovery.js");
const real_device_control_js_1 = require("./real-device-control.js");
const events_1 = require("events");
// Main integration class
class RealIntegration extends events_1.EventEmitter {
    discovery;
    control;
    devices = new Map();
    initialized = false;
    constructor() {
        super();
        this.discovery = new real_device_discovery_js_1.RealDeviceDiscovery();
        this.control = new real_device_control_js_1.RealDeviceControl();
        // Forward events
        this.discovery.on("deviceDiscovered", (device) => {
            this.devices.set(device.id, device);
            this.emit("deviceDiscovered", device);
        });
        this.control.on("deviceStateChanged", (device) => {
            this.devices.set(device.id, device);
            this.emit("deviceStateChanged", device);
        });
    }
    // Initialize integration
    async initialize() {
        if (this.initialized)
            return true;
        try {
            console.log("Initializing real device integration...");
            // Discover devices
            const devices = await this.discovery.startDiscovery();
            // Update control with discovered devices
            this.control.updateDevices(devices);
            this.initialized = true;
            return true;
        }
        catch (error) {
            console.error("Error initializing real integration:", error);
            return false;
        }
    }
    // Get all devices
    getDevices() {
        return Array.from(this.devices.values());
    }
    // Get device by ID
    getDevice(id) {
        return this.devices.get(id);
    }
    // Control a device
    async controlDevice(deviceId, command) {
        try {
            return await this.control.controlDevice(deviceId, command);
        }
        catch (error) {
            console.error(`Error controlling device ${deviceId}:`, error);
            throw error;
        }
    }
    // Refresh devices
    async refreshDevices() {
        try {
            const devices = await this.discovery.startDiscovery();
            this.control.updateDevices(devices);
            return devices;
        }
        catch (error) {
            console.error("Error refreshing devices:", error);
            return [];
        }
    }
    // Clean up resources
    cleanup() {
        this.discovery.stopDiscovery();
    }
}
exports.RealIntegration = RealIntegration;

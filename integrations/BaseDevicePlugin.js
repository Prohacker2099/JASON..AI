"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDevicePlugin = void 0;
const events_1 = require("events");
/**
 * Base class for device plugins providing common functionality
 */
class BaseDevicePlugin extends events_1.EventEmitter {
    name;
    version;
    supportedDeviceTypes;
    devices = new Map();
    subscriptions = new Map();
    constructor(name, version, supportedDeviceTypes) {
        super();
        this.name = name;
        this.version = version;
        this.supportedDeviceTypes = supportedDeviceTypes;
    }
    async addDevice(device) {
        this.devices.set(device.id, device);
        this.emit("deviceAdded", device);
    }
    async removeDevice(deviceId) {
        const device = this.devices.get(deviceId);
        if (device) {
            this.devices.delete(deviceId);
            this.emit("deviceRemoved", device);
        }
    }
    async updateDevice(device) {
        const existingDevice = this.devices.get(device.id);
        if (existingDevice) {
            const updatedDevice = { ...existingDevice, ...device };
            this.devices.set(device.id, updatedDevice);
            this.emit("deviceUpdated", updatedDevice);
        }
    }
    async subscribeToEvents(deviceId, callback) {
        if (!this.subscriptions.has(deviceId)) {
            this.subscriptions.set(deviceId, new Set());
        }
        this.subscriptions.get(deviceId).add(callback);
    }
    async unsubscribeFromEvents(deviceId) {
        this.subscriptions.delete(deviceId);
    }
    async getCapabilities(deviceId) {
        const device = this.devices.get(deviceId);
        return device?.capabilities || [];
    }
    async validateCommand(deviceId, command) {
        const device = this.devices.get(deviceId);
        if (!device)
            return false;
        // Basic validation based on device capabilities
        switch (command.type) {
            case "turnOn":
            case "turnOff":
                return device.capabilities.includes("onOff");
            case "setBrightness":
                return device.capabilities.includes("brightness");
            case "setColor":
                return device.capabilities.includes("color");
            case "setTemperature":
                return device.capabilities.includes("temperature");
            default:
                return false;
        }
    }
    notifySubscribers(deviceId, state) {
        const subscribers = this.subscriptions.get(deviceId);
        if (subscribers) {
            subscribers.forEach((callback) => callback(state));
        }
    }
    validateDeviceType(type) {
        return this.supportedDeviceTypes.includes(type);
    }
    async updateDeviceState(deviceId, state) {
        const device = this.devices.get(deviceId);
        if (device) {
            device.state = { ...device.state, ...state };
            device.lastSeen = new Date();
            this.notifySubscribers(deviceId, device.state);
        }
    }
}
exports.BaseDevicePlugin = BaseDevicePlugin;

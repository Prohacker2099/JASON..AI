"use strict";
/**
 * Google Assistant Bridge
 *
 * This module provides integration with Google Assistant.
 * It creates a bridge between JASON and Google Assistant, allowing voice control of devices.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_js_1 = require("../server/services/logger.js");
const deviceManager_js_1 = __importDefault(require("../server/services/mvp/deviceManager.js"));
const sceneManager_js_1 = __importDefault(require("../server/services/mvp/sceneManager.js"));
const logger = new logger_js_1.Logger("GoogleAssistantBridge");
class GoogleAssistantBridge extends events_1.EventEmitter {
    initialized = false;
    accessToken = null;
    refreshToken = null;
    tokenExpiry = 0;
    constructor() {
        super();
        logger.info("Google Assistant Bridge initialized");
    }
    /**
     * Initialize the Google Assistant Bridge
     */
    async initialize() {
        if (this.initialized)
            return true;
        try {
            // Check if Google Assistant integration is enabled
            if (process.env.ENABLE_GOOGLE_ASSISTANT !== "true") {
                logger.info("Google Assistant integration is disabled");
                return false;
            }
            // Check if credentials are available
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                logger.error("Google Assistant credentials missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file");
                return false;
            }
            // If we have a refresh token, use it to get a new access token
            if (process.env.GOOGLE_REFRESH_TOKEN) {
                this.refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
                await this.refreshAccessToken();
            }
            this.initialized = true;
            logger.info("Google Assistant Bridge initialized successfully");
            return true;
        }
        catch (error) {
            logger.error("Error initializing Google Assistant Bridge:", error);
            return false;
        }
    }
    /**
     * Handle Google Assistant SYNC request
     */
    async handleSync(requestId) {
        try {
            const devices = deviceManager_js_1.default.getAllDevices();
            // Convert JASON devices to Google Assistant devices
            const googleDevices = devices.map((device) => {
                // Create Google Assistant device
                const googleDevice = {
                    id: device.id,
                    type: this.getGoogleDeviceType(device.type),
                    traits: this.getGoogleTraits(device),
                    name: {
                        name: device.name,
                        defaultNames: [device.name],
                        nicknames: [device.name],
                    },
                    willReportState: true,
                    roomHint: device.room || device.location || "Home",
                    deviceInfo: {
                        manufacturer: device.manufacturer || "JASON",
                        model: device.model || device.type,
                        hwVersion: "1.0",
                        swVersion: "1.0",
                    },
                };
                // Add device attributes based on type
                if (device.type === "light" && device.capabilities.includes("color")) {
                    googleDevice.attributes = {
                        colorModel: "hsv",
                        colorTemperatureRange: {
                            temperatureMinK: 2000,
                            temperatureMaxK: 9000,
                        },
                    };
                }
                return googleDevice;
            });
            // Add scenes as devices
            const scenes = sceneManager_js_1.default.getAllScenes();
            scenes.forEach((scene) => {
                googleDevices.push({
                    id: scene.id,
                    type: "action.devices.types.SCENE",
                    traits: ["action.devices.traits.Scene"],
                    name: {
                        name: scene.name,
                        defaultNames: [scene.name],
                        nicknames: [scene.name],
                    },
                    willReportState: false,
                    roomHint: "Home",
                    attributes: {
                        sceneReversible: false,
                    },
                });
            });
            return {
                requestId,
                payload: {
                    agentUserId: "jason-user",
                    devices: googleDevices,
                },
            };
        }
        catch (error) {
            logger.error("Error handling Google Assistant SYNC:", error);
            throw error;
        }
    }
    /**
     * Handle Google Assistant QUERY request
     */
    async handleQuery(requestId, inputs) {
        try {
            const devices = {};
            // Process each device in the request
            for (const input of inputs) {
                for (const device of input.payload.devices) {
                    const deviceId = device.id;
                    const jasonDevice = deviceManager_js_1.default.getDevice(deviceId);
                    if (jasonDevice) {
                        // Convert JASON device state to Google Assistant state
                        devices[deviceId] = {
                            status: "SUCCESS",
                            online: jasonDevice.connected,
                            ...this.getGoogleState(jasonDevice),
                        };
                    }
                    else {
                        // Check if it's a scene
                        const scene = sceneManager_js_1.default.getScene(deviceId);
                        if (scene) {
                            devices[deviceId] = {
                                status: "SUCCESS",
                                online: true,
                                activatable: true,
                            };
                        }
                        else {
                            devices[deviceId] = {
                                status: "ERROR",
                                errorCode: "deviceNotFound",
                            };
                        }
                    }
                }
            }
            return {
                requestId,
                payload: {
                    devices,
                },
            };
        }
        catch (error) {
            logger.error("Error handling Google Assistant QUERY:", error);
            throw error;
        }
    }
    /**
     * Handle Google Assistant EXECUTE request
     */
    async handleExecute(requestId, inputs) {
        try {
            const commands = [];
            const input = inputs[0];
            const { commands: execCommands } = input.payload;
            for (const command of execCommands) {
                const { devices, execution } = command;
                for (const device of devices) {
                    for (const exec of execution) {
                        // Process command
                        commands.push({
                            ids: [device.id],
                            status: "SUCCESS",
                            states: {},
                        });
                    }
                }
            }
            return {
                requestId,
                payload: {
                    commands: commands,
                },
            };
        }
        catch (error) {
            console.error("Error handling Google Assistant execute request:", error);
            throw error;
        }
    }
    async reportState(deviceId, state) {
        const generatedRequestId = Math.random().toString(36).substring(7);
        if (!process.env.GOOGLE_ACCESS_TOKEN) {
            throw new Error("Google access token not configured");
        }
        try {
            // Report state to Google Assistant
            const reportStateEndpoint = "https://homegraph.googleapis.com/v1/devices:reportStateAndNotification";
            const states = {
                [deviceId]: state,
            };
            const response = await (0, node_fetch_1.default)(reportStateEndpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requestId: generatedRequestId,
                    agentUserId: "jason-user",
                    payload: {
                        devices: {
                            states,
                        },
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Failed to report state: ${response.statusText}`);
            }
        }
        catch (error) {
            logger.error("Error reporting state to Google Assistant:", error);
            throw error;
        }
    }
    /**
     * Execute a device command
     */
    async executeDeviceCommand(device, execution) {
        const { command, params } = execution;
        switch (command) {
            case "action.devices.commands.OnOff":
                await deviceManager_js_1.default.controlDevice(device.id, {
                    type: "power",
                    params: { value: params.on },
                }, "google-assistant");
                break;
            case "action.devices.commands.BrightnessAbsolute":
                await deviceManager_js_1.default.controlDevice(device.id, {
                    type: "brightness",
                    params: { value: params.brightness },
                }, "google-assistant");
                break;
            case "action.devices.commands.ColorAbsolute":
                if (params.color.spectrumHSV) {
                    await deviceManager_js_1.default.controlDevice(device.id, {
                        type: "color",
                        params: {
                            color: {
                                h: params.color.spectrumHSV.hue,
                                s: params.color.spectrumHSV.saturation * 100,
                                v: params.color.spectrumHSV.value * 100,
                            },
                        },
                    }, "google-assistant");
                }
                else if (params.color.temperature) {
                    await deviceManager_js_1.default.controlDevice(device.id, {
                        type: "temperature",
                        params: { value: params.color.temperature },
                    }, "google-assistant");
                }
                break;
            default:
                throw new Error(`Unsupported command: ${command}`);
        }
    }
    /**
     * Get Google device type
     */
    getGoogleDeviceType(deviceType) {
        const typeMap = {
            light: "action.devices.types.LIGHT",
            switch: "action.devices.types.SWITCH",
            outlet: "action.devices.types.OUTLET",
            thermostat: "action.devices.types.THERMOSTAT",
            speaker: "action.devices.types.SPEAKER",
            tv: "action.devices.types.TV",
            camera: "action.devices.types.CAMERA",
            lock: "action.devices.types.LOCK",
            fan: "action.devices.types.FAN",
            blind: "action.devices.types.BLINDS",
            scene: "action.devices.types.SCENE",
        };
        return typeMap[deviceType] || "action.devices.types.SWITCH";
    }
    /**
     * Get Google device traits
     */
    getGoogleTraits(device) {
        const traits = [];
        // Add traits based on capabilities
        if (device.capabilities.includes("on")) {
            traits.push("action.devices.traits.OnOff");
        }
        if (device.capabilities.includes("brightness")) {
            traits.push("action.devices.traits.Brightness");
        }
        if (device.capabilities.includes("color")) {
            traits.push("action.devices.traits.ColorSetting");
        }
        if (device.type === "thermostat") {
            traits.push("action.devices.traits.TemperatureSetting");
        }
        if (device.type === "lock") {
            traits.push("action.devices.traits.LockUnlock");
        }
        if (device.type === "fan") {
            traits.push("action.devices.traits.FanSpeed");
        }
        if (device.type === "blind") {
            traits.push("action.devices.traits.OpenClose");
        }
        if (device.type === "scene") {
            traits.push("action.devices.traits.Scene");
        }
        return traits;
    }
    /**
     * Get Google device state
     */
    getGoogleState(device) {
        const state = {};
        // Add state based on capabilities
        if (device.capabilities.includes("on")) {
            state.on = device.state.on || false;
        }
        if (device.capabilities.includes("brightness")) {
            state.brightness = device.state.brightness || 0;
        }
        if (device.capabilities.includes("color") && device.state.color) {
            state.color = {
                spectrumHSV: {
                    hue: device.state.color.hue || 0,
                    saturation: (device.state.color.saturation || 0) / 100,
                    value: (device.state.color.value || 0) / 100,
                },
            };
        }
        if (device.type === "thermostat") {
            state.thermostatMode = device.state.mode || "off";
            state.thermostatTemperatureSetpoint = device.state.target || 20;
            state.thermostatTemperatureAmbient = device.state.temperature || 20;
            state.thermostatHumidityAmbient = device.state.humidity || 50;
        }
        if (device.type === "lock") {
            state.isLocked = device.state.locked || false;
        }
        if (device.type === "fan") {
            state.currentFanSpeedSetting = device.state.speed || 0;
        }
        if (device.type === "blind") {
            state.openPercent = device.state.position || 0;
        }
        return state;
    }
    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                throw new Error("No refresh token available");
            }
            const response = await (0, node_fetch_1.default)("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: this.refreshToken,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                }),
            });
            const data = (await response.json());
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.tokenExpiry = Date.now() + data.expires_in * 1000;
                logger.info("Google Assistant access token refreshed successfully");
            }
            else {
                throw new Error("Failed to refresh access token");
            }
        }
        catch (error) {
            logger.error("Error refreshing Google Assistant access token:", error);
            throw error;
        }
    }
}
// Create and export singleton instance
const googleAssistantBridge = new GoogleAssistantBridge();
exports.default = googleAssistantBridge;

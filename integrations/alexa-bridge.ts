/**
 * Alexa Bridge
 *
 * This module provides integration with Amazon Alexa.
 * It creates a bridge between JASON and Alexa, allowing voice control of devices.
 */

import { EventEmitter } from "events";
import fetch from "node-fetch";
import { Logger } from "../server/services/logger.js";
import deviceManager from "../server/services/mvp/deviceManager.js";
import sceneManager from "../server/services/mvp/sceneManager.js";

const logger = new Logger("AlexaBridge");

interface AlexaDevice {
  endpointId: string;
  manufacturerName: string;
  friendlyName: string;
  description: string;
  displayCategories: string[];
  capabilities: any[];
}

interface AlexaDirective {
  header: {
    namespace: string;
    name: string;
    messageId: string;
    correlationToken?: string;
    payloadVersion: string;
  };
  endpoint: {
    endpointId: string;
  };
  payload: any;
}

export class AlexaBridge extends EventEmitter {
  private initialized = false;
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly _refreshToken: string;
  private readonly tokenEndpoint = "https://api.amazon.com/auth/o2/token";
  private readonly eventEndpoint = "https://api.eu.amazonalexa.com/v3/events";

  constructor() {
    super();
    const { ALEXA_CLIENT_ID, ALEXA_CLIENT_SECRET, ALEXA_REFRESH_TOKEN } =
      process.env;

    if (!ALEXA_CLIENT_ID || !ALEXA_CLIENT_SECRET) {
      throw new Error("Alexa client ID or secret not configured");
    }

    this.clientId = ALEXA_CLIENT_ID;
    this.clientSecret = ALEXA_CLIENT_SECRET;
    this._refreshToken = ALEXA_REFRESH_TOKEN || "";
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      if (!this._refreshToken) {
        throw new Error("No refresh token available");
      }

      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", this._refreshToken);
      params.append("client_id", this.clientId);
      params.append("client_secret", this.clientSecret);

      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
    } catch (error) {
      logger.error("Error refreshing token:", error);
      throw error;
    }
  }

  private getAlexaCategory(deviceType: string): string {
    const categoryMap: Record<string, string> = {
      light: "LIGHT",
      switch: "SWITCH",
      outlet: "SMARTPLUG",
      thermostat: "THERMOSTAT",
      speaker: "SPEAKER",
      tv: "TV",
      camera: "CAMERA",
      lock: "SMARTLOCK",
      fan: "FAN",
      blind: "INTERIOR_BLIND",
      scene: "SCENE_TRIGGER",
      sensor: "SENSOR",
      doorbell: "DOORBELL",
      garage: "GARAGE_DOOR",
      vacuum: "VACUUM_CLEANER",
      airPurifier: "AIR_PURIFIER",
      waterHeater: "WATER_HEATER",
      securityPanel: "SECURITY_PANEL",
      battery: "ENERGY_STORAGE",
      washer: "WASHER",
      dryer: "DRYER",
      dishwasher: "DISHWASHER",
      oven: "OVEN",
      refrigerator: "REFRIGERATOR",
      doorSensor: "CONTACT_SENSOR",
      motionSensor: "MOTION_SENSOR",
      temperatureSensor: "TEMPERATURE_SENSOR",
      humiditySensor: "HUMIDITY_SENSOR",
      airQualitySensor: "AIR_QUALITY_SENSOR",
    };

    return categoryMap[deviceType.toLowerCase()] || "OTHER";
  }

  private getAlexaCapabilities(device: any): any[] {
    const capabilities: any[] = [
      {
        type: "AlexaInterface",
        interface: "Alexa",
        version: "3",
      },
      {
        type: "AlexaInterface",
        interface: "Alexa.EndpointHealth",
        version: "3",
        properties: {
          supported: [{ name: "connectivity" }],
          proactivelyReported: true,
          retrievable: true,
        },
      },
    ];

    // Power Control
    if (device.capabilities.includes("on")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.PowerController",
        version: "3",
        properties: {
          supported: [{ name: "powerState" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    // Brightness Control
    if (device.capabilities.includes("brightness")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.BrightnessController",
        version: "3",
        properties: {
          supported: [{ name: "brightness" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    // Color Control
    if (device.capabilities.includes("color")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.ColorController",
        version: "3",
        properties: {
          supported: [{ name: "color" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    // Temperature Control
    if (device.capabilities.includes("temperature")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.ThermostatController",
        version: "3",
        properties: {
          supported: [
            { name: "targetSetpoint" },
            { name: "thermostatMode" },
            { name: "temperature" },
          ],
          proactivelyReported: true,
          retrievable: true,
        },
        configuration: {
          supportedModes: ["HEAT", "COOL", "AUTO", "OFF"],
          supportsScheduling: true,
        },
      });
    }

    // Lock Control
    if (device.capabilities.includes("lock")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.LockController",
        version: "3",
        properties: {
          supported: [{ name: "lockState" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    // Camera Stream
    if (device.capabilities.includes("camera")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.CameraStreamController",
        version: "3",
        cameraStreamConfigurations: [
          {
            protocols: ["HLS"],
            resolutions: [{ width: 1920, height: 1080 }],
            authorizationTypes: ["NONE"],
            videoCodecs: ["H264"],
            audioCodecs: ["AAC"],
          },
        ],
      });
    }

    // Scene Control
    if (device.type === "scene") {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.SceneController",
        version: "3",
        supportsDeactivation: false,
        proactivelyReported: true,
      });
    }

    // Sensor Capabilities
    if (device.capabilities.includes("motion")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.MotionSensor",
        version: "3",
        properties: {
          supported: [{ name: "detectionState" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    if (device.capabilities.includes("contact")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.ContactSensor",
        version: "3",
        properties: {
          supported: [{ name: "detectionState" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    if (device.capabilities.includes("temperature")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.TemperatureSensor",
        version: "3",
        properties: {
          supported: [{ name: "temperature" }],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    // Energy Management
    if (device.capabilities.includes("energy")) {
      capabilities.push({
        type: "AlexaInterface",
        interface: "Alexa.EnergyStorage",
        version: "3",
        properties: {
          supported: [
            { name: "chargeLevel" },
            { name: "chargingState" },
            { name: "energyRemaining" },
          ],
          proactivelyReported: true,
          retrievable: true,
        },
      });
    }

    return capabilities;
  }

  private createControlResponse(
    directive: AlexaDirective,
    properties: Record<string, any>,
  ): any {
    return {
      event: {
        header: {
          namespace: "Alexa",
          name: "Response",
          messageId: directive.header.messageId,
          correlationToken: directive.header.correlationToken,
          payloadVersion: "3",
        },
        endpoint: {
          endpointId: directive.endpoint.endpointId,
        },
        payload: {},
      },
      context: {
        properties: Object.entries(properties).map(([namespace, value]) => ({
          namespace,
          ...value,
          timeOfSample: new Date().toISOString(),
          uncertaintyInMilliseconds: 0,
        })),
      },
    };
  }

  private createErrorResponse(
    directive: AlexaDirective,
    type: string,
    message: string,
  ): any {
    return {
      event: {
        header: {
          namespace: "Alexa",
          name: "ErrorResponse",
          messageId: directive.header.messageId,
          correlationToken: directive.header.correlationToken,
          payloadVersion: "3",
        },
        endpoint: {
          endpointId: directive.endpoint.endpointId,
        },
        payload: {
          type,
          message,
        },
      },
    };
  }

  /**
   * Initialize the Alexa Bridge
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if Alexa integration is enabled
      if (process.env.ENABLE_ALEXA !== "true") {
        logger.info("Alexa integration is disabled");
        return false;
      }

      // Check if credentials are available
      if (!process.env.ALEXA_CLIENT_ID || !process.env.ALEXA_CLIENT_SECRET) {
        logger.error(
          "Alexa credentials missing. Please set ALEXA_CLIENT_ID and ALEXA_CLIENT_SECRET in .env file",
        );
        return false;
      }

      // If we have a refresh token, use it to get a new access token
      if (!this.accessToken && this._refreshToken) {
        await this.refreshAccessToken();
      }

      this.initialized = true;
      logger.info("Alexa Bridge initialized successfully");
      return true;
    } catch (error) {
      logger.error("Error initializing Alexa Bridge:", error);
      return false;
    }
  }

  /**
   * Handle Alexa discovery request
   */
  public async handleDiscovery(): Promise<any> {
    try {
      const devices = deviceManager.getAllDevices();

      // Convert JASON devices to Alexa devices
      const alexaDevices = devices.map((device) => {
        // Create Alexa device
        const alexaDevice: AlexaDevice = {
          endpointId: device.id,
          manufacturerName: device.manufacturer || "JASON",
          friendlyName: device.name,
          description: `${device.type} controlled by JASON`,
          displayCategories: [this.getAlexaCategory(device.type)],
          capabilities: this.getAlexaCapabilities(device),
        };

        return alexaDevice;
      });

      return {
        event: {
          header: {
            namespace: "Alexa.Discovery",
            name: "Discover.Response",
            payloadVersion: "3",
          },
          payload: {
            endpoints: alexaDevices,
          },
        },
      };
    } catch (error) {
      logger.error("Error handling Alexa discovery:", error);
      throw error;
    }
  }

  /**
   * Handle Alexa control request
   */
  public async handleControl(directive: AlexaDirective): Promise<any> {
    try {
      const { endpointId } = directive.endpoint;
      const { namespace, name } = directive.header;

      // Get device
      const device = await deviceManager.getDevice(endpointId);

      if (!device) {
        return this.createErrorResponse(
          directive,
          "NO_SUCH_ENDPOINT",
          "Device not found",
        );
      }

      // Handle different control directives
      switch (namespace) {
        case "Alexa.PowerController": {
          const turnOn = name === "TurnOn";
          await deviceManager.controlDevice(
            endpointId,
            {
              type: "power",
              params: { value: turnOn },
            },
            "alexa",
          );
          return this.createControlResponse(directive, {
            [namespace]: {
              powerState: turnOn ? "ON" : "OFF",
            },
          });
        }

        case "Alexa.BrightnessController": {
          const brightnessValue = directive.payload.brightness;
          await deviceManager.controlDevice(
            endpointId,
            {
              type: "brightness",
              params: { value: brightnessValue },
            },
            "alexa",
          );
          return this.createControlResponse(directive, {
            [namespace]: {
              brightness: brightnessValue,
            },
          });
        }

        case "Alexa.ColorController": {
          const {
            hue,
            saturation,
            brightness: colorBrightness,
          } = directive.payload;
          await deviceManager.controlDevice(
            endpointId,
            {
              type: "color",
              params: {
                color: {
                  h: hue,
                  s: saturation * 100,
                  v: colorBrightness * 100,
                },
              },
            },
            "alexa",
          );
          return this.createControlResponse(directive, {
            [namespace]: {
              color: {
                hue,
                saturation,
                brightness: colorBrightness,
              },
            },
          });
        }

        case "Alexa.SceneController": {
          const scenes = await sceneManager.getAllScenes();
          const scene = scenes.find(
            (s) => s.name.toLowerCase() === device.name.toLowerCase(),
          );

          if (scene) {
            await sceneManager.activateScene(scene.id, "alexa");
            return this.createControlResponse(directive, {
              [namespace]: {
                status: "ACTIVATED",
              },
            });
          } else {
            return this.createErrorResponse(
              directive,
              "NO_SUCH_ENDPOINT",
              "Scene not found",
            );
          }
        }

        default:
          return this.createErrorResponse(
            directive,
            "INVALID_DIRECTIVE",
            `Unsupported namespace: ${namespace}`,
          );
      }
    } catch (error) {
      logger.error("Error handling Alexa control:", error);
      throw error;
    }
  }

  /**
   * Report state to Alexa
   */
  public async reportState(deviceId: string, state: any): Promise<void> {
    if (!this.accessToken) {
      throw new Error("Alexa access token not configured");
    }

    try {
      // Report state to Alexa
      const reportStateEndpoint = "https://api.amazonalexa.com/v3/events";

      const response = await fetch(reportStateEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: {
            properties: [
              {
                namespace: "Alexa.EndpointHealth",
                name: "connectivity",
                value: {
                  value: "OK",
                },
                timeOfSample: new Date().toISOString(),
                uncertaintyInMilliseconds: 0,
              },
              {
                namespace: "Alexa.PowerController",
                name: "powerState",
                value: state.on ? "ON" : "OFF",
                timeOfSample: new Date().toISOString(),
                uncertaintyInMilliseconds: 0,
              },
            ],
          },
          event: {
            header: {
              namespace: "Alexa",
              name: "ChangeReport",
              messageId: Math.random().toString(36).substring(7),
              payloadVersion: "3",
            },
            endpoint: {
              endpointId: deviceId,
            },
            payload: {},
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to report state: ${response.statusText}`);
      }
    } catch (error) {
      logger.error("Error reporting state to Alexa:", error);
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      if (!this._refreshToken) {
        throw new Error("No refresh token available");
      }

      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this._refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      this.accessToken = data.access_token;
    } catch (error) {
      logger.error("Error refreshing token:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const alexaBridge = new AlexaBridge();
export default alexaBridge;

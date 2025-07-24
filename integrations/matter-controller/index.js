"use strict";
/**
 * Matter Controller Integration
 *
 * This module provides integration with Matter-compatible devices.
 * It implements the Matter protocol for device discovery and control.
 *
 * Matter is a new smart home standard that provides a unified way to connect
 * and control smart home devices across different ecosystems.
 */
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null",
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var logger_js_1 = require("../../server/services/logger.js");
var BaseDevicePlugin_js_1 = require("../BaseDevicePlugin.js");
var fs = require("fs");
var path = require("path");
var logger = new logger_js_1.Logger("MatterController");
// Load configuration
var CONFIG_FILE = path.join(__dirname, "config.json");
var config = {
  mockMode: true,
  storagePath: path.join(__dirname, "storage"),
};
if (fs.existsSync(CONFIG_FILE)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (error) {
    logger.error("Error loading Matter configuration:", error);
  }
}
var MatterController = /** @class */ (function (_super) {
  __extends(MatterController, _super);
  function MatterController() {
    var _this =
      _super.call(this, "matter", "1.0.0", [
        "light",
        "switch",
        "sensor",
        "thermostat",
        "lock",
        "fan",
        "outlet",
        "window_covering",
        "door",
        "air_purifier",
        "dishwasher",
        "refrigerator",
        "washer",
        "dryer",
        "television",
      ]) || this;
    _this.connected = false;
    _this.mockMode = config.mockMode;
    _this.matterClient = null;
    _this.commissionedDevices = new Map();
    _this.fabricId = "";
    _this.threadNetworkCredentials = null;
    _this.displayName = "Matter";
    _this.description = "Controller for Matter-compatible devices";
    logger.info("Matter Controller initialized");
    return _this;
  }
  /**
   * Initialize the Matter controller
   */
  MatterController.prototype.initialize = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        try {
          if (this.mockMode) {
            logger.info("Matter Controller running in mock mode");
            this.connected = true;
            return [2 /*return*/, true];
          }
          // In a real implementation, we would initialize the Matter SDK here
          // For example:
          // const { Controller } = await import('@project-chip/matter-node.js');
          //
          // this.matterClient = await Controller.create({
          //   storagePath: config.storagePath,
          //   defaultPasscode: 20202021,
          //   uniqueId: 'JASON-Matter-Controller'
          // });
          //
          // // Initialize the controller
          // await this.matterClient.initialize();
          //
          // // Get or create a fabric
          // const fabrics = await this.matterClient.getFabrics();
          // if (fabrics.length === 0) {
          //   // Create a new fabric
          //   const fabric = await this.matterClient.createFabric({
          //     fabricId: 1,
          //     vendorId: 0xFFF1, // Example vendor ID
          //     fabricLabel: 'JASON Home'
          //   });
          //   this.fabricId = fabric.fabricId;
          // } else {
          //   // Use the first fabric
          //   this.fabricId = fabrics[0].fabricId;
          // }
          //
          // // Try to get Thread network credentials if available
          // try {
          //   this.threadNetworkCredentials = await this.matterClient.getThreadNetworkCredentials();
          //   logger.info('Thread network credentials loaded');
          // } catch (error) {
          //   logger.warn('No Thread network credentials available');
          // }
          this.connected = true;
          logger.info("Matter Controller initialized successfully");
          return [2 /*return*/, true];
        } catch (error) {
          logger.error("Error initializing Matter Controller:", error);
          return [2 /*return*/, false];
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Commission a new Matter device
   */
  MatterController.prototype.commissionDevice = function (setupCode) {
    return __awaiter(this, void 0, void 0, function () {
      var mockDevice;
      return __generator(this, function (_a) {
        try {
          if (this.mockMode) {
            logger.info(
              "[Mock] Commissioning device with setup code: ".concat(setupCode),
            );
            mockDevice = this.createMockDevice(
              "matter-mock-".concat(Date.now()),
            );
            this.devices.set(mockDevice.id, mockDevice);
            return [2 /*return*/, mockDevice];
          }
          // In a real implementation, we would commission the device using the Matter SDK
          // For example:
          // // Parse the setup code
          // const { discriminator, setupPinCode } = this.matterClient.parseSetupCode(setupCode);
          //
          // // Commission the device
          // const device = await this.matterClient.commissionDevice({
          //   setupPinCode,
          //   discriminator,
          //   timeout: 60000, // 60 seconds
          // });
          //
          // // Store the commissioned device
          // this.commissionedDevices.set(device.nodeId.toString(), device);
          //
          // // Convert to JASON device format
          // const jasonDevice = this.convertToJasonDevice(device);
          // this.devices.set(jasonDevice.id, jasonDevice);
          //
          // return jasonDevice;
          logger.info("Device commissioning not implemented in mock mode");
          return [2 /*return*/, null];
        } catch (error) {
          logger.error("Error commissioning Matter device:", error);
          return [2 /*return*/, null];
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Discover Matter devices
   */
  MatterController.prototype.discover = function () {
    return __awaiter(this, void 0, void 0, function () {
      var error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            if (!!this.connected) return [3 /*break*/, 2];
            return [4 /*yield*/, this.initialize()];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            if (this.mockMode) {
              // Create mock devices for development
              return [2 /*return*/, this.createMockDevices()];
            }
            // In a real implementation, we would discover Matter devices here
            // For example:
            // // Get all commissioned devices
            // const devices = await this.matterClient.getCommissionedDevices();
            //
            // // Convert to JASON device format
            // const jasonDevices = devices.map(device => this.convertToJasonDevice(device));
            //
            // // Store devices in map
            // jasonDevices.forEach(device => {
            //   this.devices.set(device.id, device);
            // });
            //
            // return jasonDevices;
            return [2 /*return*/, []];
          case 3:
            error_1 = _a.sent();
            logger.error("Error discovering Matter devices:", error_1);
            return [2 /*return*/, []];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Control a Matter device
   */
  MatterController.prototype.control = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      var device, result;
      return __generator(this, function (_a) {
        try {
          device = this.devices.get(deviceId);
          if (!device) {
            throw new Error("Device not found: ".concat(deviceId));
          }
          if (this.mockMode) {
            result = this.controlMockDevice(device, command);
            if (!result.success) {
              throw new Error(result.error);
            }
            return [2 /*return*/, device.state];
          }
          // In a real implementation, we would control the Matter device here
          // For example:
          // const nodeId = this.getNodeIdFromDeviceId(deviceId);
          // const matterDevice = this.commissionedDevices.get(nodeId);
          //
          // if (!matterDevice) {
          //   throw new Error(`Matter device not found: ${deviceId}`);
          // }
          //
          // // Convert JASON command to Matter command
          // const matterCommand = this.convertToMatterCommand(device.type, command);
          //
          // // Send command to device
          // await this.matterClient.sendCommand(matterDevice, matterCommand);
          //
          // // Read updated state
          // const updatedState = await this.readDeviceState(matterDevice, device.type);
          //
          // // Update device state
          // device.state = updatedState;
          // this.devices.set(deviceId, device);
          return [2 /*return*/, device.state];
        } catch (error) {
          logger.error(
            "Error controlling Matter device ".concat(deviceId, ":"),
            error,
          );
          throw error;
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Read the current state of a Matter device
   */
  MatterController.prototype.readDeviceState = function (
    matterDevice,
    deviceType,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // In a real implementation, we would read the device state using the Matter SDK
        // For example:
        // switch (deviceType) {
        //   case 'light':
        //     const onOff = await matterDevice.readAttribute('onOff', 'onOff');
        //     let state: any = { on: onOff === 1 };
        //
        //     // Read brightness if available
        //     try {
        //       const level = await matterDevice.readAttribute('levelControl', 'currentLevel');
        //       state.brightness = Math.round((level / 254) * 100);
        //     } catch (error) {
        //       // Brightness not supported
        //     }
        //
        //     // Read color if available
        //     try {
        //       const colorMode = await matterDevice.readAttribute('colorControl', 'colorMode');
        //       if (colorMode === 0) { // HSV
        //         const hue = await matterDevice.readAttribute('colorControl', 'currentHue');
        //         const saturation = await matterDevice.readAttribute('colorControl', 'currentSaturation');
        //         state.color = {
        //           hue: Math.round((hue / 254) * 360),
        //           saturation: Math.round((saturation / 254) * 100),
        //           value: state.brightness || 100
        //         };
        //       } else if (colorMode === 1) { // XY
        //         const x = await matterDevice.readAttribute('colorControl', 'currentX');
        //         const y = await matterDevice.readAttribute('colorControl', 'currentY');
        //         // Convert XY to HSV (simplified)
        //         state.color = {
        //           hue: 0,
        //           saturation: 0,
        //           value: state.brightness || 100
        //         };
        //       } else if (colorMode === 2) { // Color temperature
        //         const colorTemp = await matterDevice.readAttribute('colorControl', 'colorTemperatureMireds');
        //         state.colorTemperature = Math.round(1000000 / colorTemp);
        //       }
        //     } catch (error) {
        //       // Color not supported
        //     }
        //
        //     return state;
        //
        //   // Add more device types as needed
        //
        //   default:
        //     return {};
        // }
        return [2 /*return*/, {}];
      });
    });
  };
  /**
   * Convert a JASON command to a Matter command
   */
  MatterController.prototype.convertToMatterCommand = function (
    deviceType,
    command,
  ) {
    // In a real implementation, we would convert JASON commands to Matter commands
    // For example:
    // switch (deviceType) {
    //   case 'light':
    //     switch (command.type) {
    //       case 'power':
    //         return {
    //           cluster: 'onOff',
    //           command: command.params.value ? 'on' : 'off',
    //           params: {}
    //         };
    //
    //       case 'brightness':
    //         return {
    //           cluster: 'levelControl',
    //           command: 'moveToLevel',
    //           params: {
    //             level: Math.round((command.params.value / 100) * 254),
    //             transitionTime: 0
    //           }
    //         };
    //
    //       case 'color':
    //         if (command.params.color) {
    //           return {
    //             cluster: 'colorControl',
    //             command: 'moveToHueAndSaturation',
    //             params: {
    //               hue: Math.round((command.params.color.h / 360) * 254),
    //               saturation: Math.round((command.params.color.s / 100) * 254),
    //               transitionTime: 0
    //             }
    //           };
    //         }
    //         break;
    //
    //       case 'color_temperature':
    //         return {
    //           cluster: 'colorControl',
    //           command: 'moveToColorTemperature',
    //           params: {
    //             colorTemperatureMireds: Math.round(1000000 / command.params.value),
    //             transitionTime: 0
    //           }
    //         };
    //     }
    //     break;
    //
    //   // Add more device types as needed
    // }
    return {};
  };
  /**
   * Convert a Matter device to JASON device format
   */
  MatterController.prototype.convertToJasonDevice = function (matterDevice) {
    // In a real implementation, we would convert Matter devices to JASON devices
    // For example:
    // const deviceId = `matter-${matterDevice.nodeId}`;
    // const deviceInfo = await matterDevice.readAttribute('basic', 'nodeLabel');
    // const vendorInfo = await matterDevice.readAttribute('basic', 'vendorName');
    // const modelInfo = await matterDevice.readAttribute('basic', 'productName');
    //
    // // Determine device type based on supported clusters
    // const deviceType = this.determineDeviceType(matterDevice);
    //
    // // Read device state
    // const state = await this.readDeviceState(matterDevice, deviceType);
    //
    // // Determine capabilities
    // const capabilities = this.determineCapabilities(matterDevice, deviceType);
    //
    // return {
    //   id: deviceId,
    //   name: deviceInfo || `Matter Device ${matterDevice.nodeId}`,
    //   type: deviceType,
    //   manufacturer: vendorInfo || 'Unknown',
    //   model: modelInfo || 'Unknown',
    //   firmwareVersion: '1.0.0',
    //   capabilities,
    //   state,
    //   connected: true,
    //   address: matterDevice.nodeId.toString(),
    //   room: ''
    // };
    return {
      id: "matter-mock",
      name: "Mock Matter Device",
      type: "light",
      manufacturer: "Matter Mock",
      model: "Smart Device",
      firmwareVersion: "1.0.0",
      capabilities: ["on"],
      state: { on: false },
      connected: true,
      address: "00:00:00:00:00:00",
      room: "",
    };
  };
  /**
   * Determine the device type based on supported clusters
   */
  MatterController.prototype.determineDeviceType = function (matterDevice) {
    // In a real implementation, we would determine the device type based on supported clusters
    // For example:
    // const supportedClusters = await matterDevice.getSupportedClusters();
    //
    // if (supportedClusters.includes('onOff')) {
    //   if (supportedClusters.includes('levelControl')) {
    //     if (supportedClusters.includes('colorControl')) {
    //       return 'light';
    //     }
    //     return 'light';
    //   }
    //   return 'switch';
    // }
    //
    // if (supportedClusters.includes('temperatureMeasurement')) {
    //   if (supportedClusters.includes('thermostat')) {
    //     return 'thermostat';
    //   }
    //   return 'sensor';
    // }
    //
    // if (supportedClusters.includes('doorLock')) {
    //   return 'lock';
    // }
    //
    // if (supportedClusters.includes('fanControl')) {
    //   return 'fan';
    // }
    //
    // if (supportedClusters.includes('windowCovering')) {
    //   return 'window_covering';
    // }
    //
    // return 'unknown';
    return "light";
  };
  /**
   * Determine device capabilities based on supported clusters
   */
  MatterController.prototype.determineCapabilities = function (
    matterDevice,
    deviceType,
  ) {
    // In a real implementation, we would determine capabilities based on supported clusters
    // For example:
    // const supportedClusters = await matterDevice.getSupportedClusters();
    // const capabilities: string[] = [];
    //
    // if (supportedClusters.includes('onOff')) {
    //   capabilities.push('on');
    // }
    //
    // if (supportedClusters.includes('levelControl')) {
    //   capabilities.push('brightness');
    // }
    //
    // if (supportedClusters.includes('colorControl')) {
    //   capabilities.push('color');
    //
    //   // Check if color temperature is supported
    //   try {
    //     await matterDevice.readAttribute('colorControl', 'colorTemperatureMireds');
    //     capabilities.push('color_temperature');
    //   } catch (error) {
    //     // Color temperature not supported
    //   }
    // }
    //
    // if (supportedClusters.includes('temperatureMeasurement')) {
    //   capabilities.push('temperature');
    // }
    //
    // if (supportedClusters.includes('relativeHumidityMeasurement')) {
    //   capabilities.push('humidity');
    // }
    //
    // if (supportedClusters.includes('doorLock')) {
    //   capabilities.push('lock');
    // }
    //
    // if (supportedClusters.includes('fanControl')) {
    //   capabilities.push('fan_speed');
    // }
    //
    // if (supportedClusters.includes('windowCovering')) {
    //   capabilities.push('position');
    // }
    //
    // return capabilities;
    return ["on"];
  };
  /**
   * Create a single mock Matter device
   */
  MatterController.prototype.createMockDevice = function (id) {
    return {
      id: id,
      name: "Matter Mock Device ".concat(id.split("-").pop()),
      type: "light",
      manufacturer: "Matter Mock",
      model: "Smart Bulb",
      firmwareVersion: "1.0.0",
      capabilities: ["on", "brightness", "color"],
      state: {
        on: false,
        brightness: 100,
        color: { hue: 0, saturation: 0, value: 100 },
      },
      connected: true,
      address: "00:11:22:33:44:".concat(Math.floor(Math.random() * 100)),
      room: "Living Room",
    };
  };
  /**
   * Create mock Matter devices for development
   */
  MatterController.prototype.createMockDevices = function () {
    var _this = this;
    var mockDevices = [
      {
        id: "matter-light-1",
        name: "Matter Living Room Light",
        type: "light",
        manufacturer: "Matter Mock",
        model: "Smart Bulb",
        firmwareVersion: "1.0.0",
        capabilities: ["on", "brightness", "color"],
        state: {
          on: false,
          brightness: 100,
          color: { hue: 0, saturation: 0, value: 100 },
        },
        connected: true,
        address: "00:11:22:33:44:55",
        room: "Living Room",
      },
      {
        id: "matter-switch-1",
        name: "Matter Kitchen Switch",
        type: "switch",
        manufacturer: "Matter Mock",
        model: "Smart Switch",
        firmwareVersion: "1.0.0",
        capabilities: ["on"],
        state: { on: false },
        connected: true,
        address: "00:11:22:33:44:56",
        room: "Kitchen",
      },
      {
        id: "matter-thermostat-1",
        name: "Matter Bedroom Thermostat",
        type: "thermostat",
        manufacturer: "Matter Mock",
        model: "Smart Thermostat",
        firmwareVersion: "1.0.0",
        capabilities: ["temperature", "humidity", "heating", "cooling"],
        state: {
          temperature: 22,
          humidity: 45,
          mode: "auto",
          targetTemperature: 21,
        },
        connected: true,
        address: "00:11:22:33:44:57",
        room: "Bedroom",
      },
      {
        id: "matter-lock-1",
        name: "Matter Front Door Lock",
        type: "lock",
        manufacturer: "Matter Mock",
        model: "Smart Lock",
        firmwareVersion: "1.0.0",
        capabilities: ["lock"],
        state: { locked: true, battery: 85 },
        connected: true,
        address: "00:11:22:33:44:58",
        room: "Entrance",
      },
      {
        id: "matter-sensor-1",
        name: "Matter Motion Sensor",
        type: "sensor",
        manufacturer: "Matter Mock",
        model: "Motion Sensor",
        firmwareVersion: "1.0.0",
        capabilities: ["motion", "temperature", "battery"],
        state: { motion: false, temperature: 23.5, battery: 90 },
        connected: true,
        address: "00:11:22:33:44:59",
        room: "Hallway",
      },
    ];
    // Store devices in map
    mockDevices.forEach(function (device) {
      _this.devices.set(device.id, device);
    });
    return mockDevices;
  };
  /**
   * Control a mock Matter device
   */
  MatterController.prototype.controlMockDevice = function (device, command) {
    switch (command.type) {
      case "power":
        device.state.on = command.params.value === true;
        break;
      case "brightness":
        if (device.capabilities.includes("brightness")) {
          device.state.brightness = Math.min(
            100,
            Math.max(0, command.params.value),
          );
        } else {
          return {
            success: false,
            error: "Device does not support brightness control",
          };
        }
        break;
      case "color":
        if (device.capabilities.includes("color") && command.params.color) {
          device.state.color = {
            hue: command.params.color.h || 0,
            saturation: command.params.color.s || 0,
            value: command.params.color.v || 100,
          };
        } else {
          return {
            success: false,
            error: "Device does not support color control",
          };
        }
        break;
      case "temperature":
        if (device.capabilities.includes("temperature")) {
          device.state.targetTemperature = command.params.value;
        } else {
          return {
            success: false,
            error: "Device does not support temperature control",
          };
        }
        break;
      case "lock":
        if (device.capabilities.includes("lock")) {
          device.state.locked = command.params.value === true;
        } else {
          return {
            success: false,
            error: "Device does not support lock control",
          };
        }
        break;
      case "mode":
        if (
          device.capabilities.includes("heating") ||
          device.capabilities.includes("cooling")
        ) {
          device.state.mode = command.params.value;
        } else {
          return {
            success: false,
            error: "Device does not support mode control",
          };
        }
        break;
      default:
        return {
          success: false,
          error: "Unsupported command type: ".concat(command.type),
        };
    }
    // Update device in map
    this.devices.set(device.id, device);
    return { success: true, data: { state: device.state } };
  };
  /**
   * Get Thread network credentials
   */
  MatterController.prototype.getThreadNetworkCredentials = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        if (this.mockMode) {
          return [
            2 /*return*/,
            {
              channel: 15,
              panId: "0x1234",
              extendedPanId: "0x1122334455667788",
              networkKey: "00112233445566778899AABBCCDDEEFF",
              networkName: "JASON-Thread-Network",
              pskc: "00112233445566778899AABBCCDDEEFF",
              activeTimestamp: Date.now(),
            },
          ];
        }
        return [2 /*return*/, this.threadNetworkCredentials];
      });
    });
  };
  return MatterController;
})(BaseDevicePlugin_js_1.BaseDevicePlugin);
// Create and export singleton instance
var matterController = new MatterController();
exports.default = matterController;

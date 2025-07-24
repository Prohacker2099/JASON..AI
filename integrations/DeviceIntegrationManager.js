"use strict";
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
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.DeviceIntegrationManager = void 0;
var events_1 = require("events");
var zigbee_1 = require("./zigbee");
var zwave_1 = require("./zwave");
var matter_controller_1 = require("./matter-controller");
var hue_controller_1 = require("./hue-controller");
var wemo_controller_1 = require("./wemo-controller");
var alexa_bridge_1 = require("./alexa-bridge");
var google_assistant_bridge_1 = require("./google-assistant-bridge");
var homekit_bridge_1 = require("./homekit-bridge");
var logger_1 = require("../server/services/logger");
var logger = new logger_1.Logger("DeviceIntegrationManager");
var DeviceIntegrationManager = /** @class */ (function (_super) {
  __extends(DeviceIntegrationManager, _super);
  function DeviceIntegrationManager() {
    var _this = _super.call(this) || this;
    _this.controllers = new Map();
    _this.devices = new Map();
    _this.initialized = false;
    // Initialize controllers
    _this.controllers.set("zigbee", new zigbee_1.ZigbeeController());
    _this.controllers.set("zwave", new zwave_1.ZwaveController());
    _this.controllers.set("matter", new matter_controller_1.MatterController());
    _this.controllers.set("hue", new hue_controller_1.HueController());
    _this.controllers.set("wemo", new wemo_controller_1.WemoController());
    _this.controllers.set("alexa", new alexa_bridge_1.AlexaBridge());
    _this.controllers.set(
      "google",
      new google_assistant_bridge_1.GoogleAssistantBridge(),
    );
    _this.controllers.set("homekit", new homekit_bridge_1.HomeKitBridge());
    return _this;
  }
  DeviceIntegrationManager.prototype.initialize = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _i, _a, _b, protocol, controller, success, error_1, error_2;
      var _this = this;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            if (this.initialized) return [2 /*return*/, true];
            logger.info("Initializing device integration manager");
            _c.label = 1;
          case 1:
            _c.trys.push([1, 8, , 9]);
            ((_i = 0), (_a = this.controllers.entries()));
            _c.label = 2;
          case 2:
            if (!(_i < _a.length)) return [3 /*break*/, 7];
            ((_b = _a[_i]), (protocol = _b[0]), (controller = _b[1]));
            _c.label = 3;
          case 3:
            _c.trys.push([3, 5, , 6]);
            logger.info("Initializing ".concat(protocol, " controller"));
            return [4 /*yield*/, controller.initialize()];
          case 4:
            success = _c.sent();
            if (success) {
              logger.info(
                "".concat(protocol, " controller initialized successfully"),
              );
              // Set up event listeners
              controller.on("deviceDiscovered", function (device) {
                _this.handleDeviceDiscovered(device);
              });
              controller.on("deviceUpdated", function (device) {
                _this.handleDeviceUpdated(device);
              });
              controller.on("deviceRemoved", function (deviceId) {
                _this.handleDeviceRemoved(deviceId);
              });
            } else {
              logger.warn(
                "Failed to initialize ".concat(protocol, " controller"),
              );
            }
            return [3 /*break*/, 6];
          case 5:
            error_1 = _c.sent();
            logger.error(
              "Error initializing ".concat(protocol, " controller:"),
              error_1,
            );
            return [3 /*break*/, 6];
          case 6:
            _i++;
            return [3 /*break*/, 2];
          case 7:
            this.initialized = true;
            return [2 /*return*/, true];
          case 8:
            error_2 = _c.sent();
            logger.error(
              "Error initializing device integration manager:",
              error_2,
            );
            return [2 /*return*/, false];
          case 9:
            return [2 /*return*/];
        }
      });
    });
  };
  DeviceIntegrationManager.prototype.discoverDevices = function () {
    return __awaiter(this, void 0, void 0, function () {
      var discoveredDevices, _i, _a, _b, protocol, controller, devices, error_3;
      var _this = this;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            if (!!this.initialized) return [3 /*break*/, 2];
            return [4 /*yield*/, this.initialize()];
          case 1:
            _c.sent();
            _c.label = 2;
          case 2:
            logger.info("Starting device discovery across all protocols");
            discoveredDevices = [];
            ((_i = 0), (_a = this.controllers.entries()));
            _c.label = 3;
          case 3:
            if (!(_i < _a.length)) return [3 /*break*/, 8];
            ((_b = _a[_i]), (protocol = _b[0]), (controller = _b[1]));
            _c.label = 4;
          case 4:
            _c.trys.push([4, 6, , 7]);
            logger.info("Starting discovery for ".concat(protocol, " devices"));
            return [4 /*yield*/, controller.discover()];
          case 5:
            devices = _c.sent();
            logger.info(
              "Discovered "
                .concat(devices.length, " ")
                .concat(protocol, " devices"),
            );
            // Add devices to our collection
            devices.forEach(function (device) {
              _this.devices.set(device.id, device);
              discoveredDevices.push(device);
            });
            return [3 /*break*/, 7];
          case 6:
            error_3 = _c.sent();
            logger.error(
              "Error discovering ".concat(protocol, " devices:"),
              error_3,
            );
            return [3 /*break*/, 7];
          case 7:
            _i++;
            return [3 /*break*/, 3];
          case 8:
            // Emit event with all discovered devices
            this.emit("devicesDiscovered", discoveredDevices);
            return [2 /*return*/, discoveredDevices];
        }
      });
    });
  };
  DeviceIntegrationManager.prototype.getDevices = function () {
    return Array.from(this.devices.values());
  };
  DeviceIntegrationManager.prototype.getDevice = function (deviceId) {
    return this.devices.get(deviceId);
  };
  DeviceIntegrationManager.prototype.getDevicesByProtocol = function (
    protocol,
  ) {
    return this.getDevices().filter(function (device) {
      return device.protocol === protocol;
    });
  };
  DeviceIntegrationManager.prototype.getDevicesByType = function (type) {
    return this.getDevices().filter(function (device) {
      return device.type === type;
    });
  };
  DeviceIntegrationManager.prototype.getDevicesByRoom = function (roomId) {
    return this.getDevices().filter(function (device) {
      return device.roomId === roomId;
    });
  };
  DeviceIntegrationManager.prototype.controlDevice = function (
    deviceId,
    command,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var device, controller, result, updatedDevice, error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            device = this.devices.get(deviceId);
            if (!device) {
              throw new Error("Device not found: ".concat(deviceId));
            }
            controller = this.controllers.get(device.protocol);
            if (!controller) {
              throw new Error(
                "No controller available for protocol: ".concat(
                  device.protocol,
                ),
              );
            }
            logger.info(
              "Controlling "
                .concat(device.protocol, " device ")
                .concat(device.name, ":"),
              command,
            );
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, controller.controlDevice(deviceId, command)];
          case 2:
            result = _a.sent();
            // Update device state in our collection
            if (result.success && result.state) {
              updatedDevice = __assign(__assign({}, device), {
                state: __assign(__assign({}, device.state), result.state),
              });
              this.devices.set(deviceId, updatedDevice);
              this.emit("deviceStateChanged", updatedDevice);
            }
            return [2 /*return*/, result];
          case 3:
            error_4 = _a.sent();
            logger.error(
              "Error controlling device ".concat(deviceId, ":"),
              error_4,
            );
            throw error_4;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  DeviceIntegrationManager.prototype.handleDeviceDiscovered = function (
    device,
  ) {
    this.devices.set(device.id, device);
    this.emit("deviceDiscovered", device);
  };
  DeviceIntegrationManager.prototype.handleDeviceUpdated = function (device) {
    this.devices.set(device.id, device);
    this.emit("deviceUpdated", device);
  };
  DeviceIntegrationManager.prototype.handleDeviceRemoved = function (deviceId) {
    this.devices.delete(deviceId);
    this.emit("deviceRemoved", deviceId);
  };
  return DeviceIntegrationManager;
})(events_1.EventEmitter);
exports.DeviceIntegrationManager = DeviceIntegrationManager;
// Export singleton instance
exports.default = new DeviceIntegrationManager();

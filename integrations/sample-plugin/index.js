"use strict";
/**
 * Sample Plugin for JASON
 *
 * This is a sample plugin that demonstrates how to create a plugin for JASON.
 * It implements the IDevicePlugin interface to discover and control sample devices.
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
exports.SamplePlugin = void 0;
var events_1 = require("events");
var uuid_1 = require("uuid");
var SamplePlugin = /** @class */ (function (_super) {
  __extends(SamplePlugin, _super);
  function SamplePlugin() {
    var _this = _super.call(this) || this;
    _this.name = "sample-plugin";
    _this.version = "1.0.0";
    _this.supportedDeviceTypes = ["light", "switch", "sensor"];
    _this.devices = new Map();
    _this.discoveryInProgress = false;
    console.log("Sample plugin initialized");
    return _this;
  }
  /**
   * Discover sample devices
   */
  SamplePlugin.prototype.discover = function () {
    return __awaiter(this, void 0, void 0, function () {
      var sampleDevices;
      var _this = this;
      return __generator(this, function (_a) {
        if (this.discoveryInProgress) {
          console.warn("Discovery already in progress");
          return [2 /*return*/, Array.from(this.devices.values())];
        }
        this.discoveryInProgress = true;
        console.log("Starting sample device discovery...");
        try {
          sampleDevices = [
            {
              id: "sample-light-".concat((0, uuid_1.v4)().substring(0, 8)),
              name: "Sample Smart Light",
              type: "light",
              manufacturer: "JASON",
              model: "Sample Light v1",
              firmwareVersion: "1.0.0",
              capabilities: ["on", "brightness", "color"],
              state: {
                on: false,
                brightness: 100,
                color: {
                  hue: 180,
                  saturation: 100,
                  value: 100,
                },
              },
              connected: true,
              lastSeen: new Date(),
            },
            {
              id: "sample-switch-".concat((0, uuid_1.v4)().substring(0, 8)),
              name: "Sample Smart Switch",
              type: "switch",
              manufacturer: "JASON",
              model: "Sample Switch v1",
              firmwareVersion: "1.0.0",
              capabilities: ["on"],
              state: {
                on: false,
              },
              connected: true,
              lastSeen: new Date(),
            },
            {
              id: "sample-sensor-".concat((0, uuid_1.v4)().substring(0, 8)),
              name: "Sample Motion Sensor",
              type: "sensor",
              manufacturer: "JASON",
              model: "Sample Sensor v1",
              firmwareVersion: "1.0.0",
              capabilities: ["motion", "battery", "temperature"],
              state: {
                motion: false,
                battery: 90,
                temperature: 22.5,
              },
              connected: true,
              lastSeen: new Date(),
            },
          ];
          // Add discovered devices to the map
          sampleDevices.forEach(function (device) {
            _this.devices.set(device.id, device);
          });
          console.log(
            "Discovered ".concat(sampleDevices.length, " sample devices"),
          );
          // Emit discovery events
          sampleDevices.forEach(function (device) {
            console.log(
              "Discovered sample device: "
                .concat(device.name, " (")
                .concat(device.id, ")"),
            );
            _this.emit("deviceDiscovered", device);
          });
          return [2 /*return*/, sampleDevices];
        } catch (error) {
          console.error("Error during sample device discovery:", error);
          return [2 /*return*/, []];
        } finally {
          this.discoveryInProgress = false;
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Control a sample device
   */
  SamplePlugin.prototype.control = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      var device, updatedState;
      var _a, _b, _c;
      return __generator(this, function (_d) {
        device = this.devices.get(deviceId);
        if (!device) {
          throw new Error("Device not found: ".concat(deviceId));
        }
        console.log(
          "Controlling sample device "
            .concat(deviceId, " with command: ")
            .concat(command.type),
        );
        try {
          updatedState = __assign({}, device.state);
          switch (command.type) {
            case "power":
              updatedState.on = command.params.value === true;
              break;
            case "brightness":
              if (device.capabilities.includes("brightness")) {
                updatedState.brightness = Math.min(
                  100,
                  Math.max(0, command.params.value),
                );
              }
              break;
            case "color":
              if (
                device.capabilities.includes("color") &&
                command.params.color
              ) {
                updatedState.color = {
                  hue:
                    command.params.color.h ||
                    ((_a = updatedState.color) === null || _a === void 0
                      ? void 0
                      : _a.hue) ||
                    0,
                  saturation:
                    command.params.color.s ||
                    ((_b = updatedState.color) === null || _b === void 0
                      ? void 0
                      : _b.saturation) ||
                    0,
                  value:
                    command.params.color.v ||
                    ((_c = updatedState.color) === null || _c === void 0
                      ? void 0
                      : _c.value) ||
                    0,
                };
              }
              break;
            case "motion":
              if (device.capabilities.includes("motion")) {
                updatedState.motion = command.params.value === true;
              }
              break;
            default:
              throw new Error(
                "Unsupported command type: ".concat(command.type),
              );
          }
          // Update device state
          device.state = updatedState;
          device.lastSeen = new Date();
          this.devices.set(deviceId, device);
          // Emit state change event
          this.emit("deviceStateChanged", {
            deviceId: deviceId,
            state: updatedState,
          });
          return [2 /*return*/, updatedState];
        } catch (error) {
          console.error(
            "Error controlling sample device ".concat(deviceId, ":"),
            error,
          );
          throw error;
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Get device capabilities
   */
  SamplePlugin.prototype.getCapabilities = function (deviceId) {
    return __awaiter(this, void 0, void 0, function () {
      var device;
      return __generator(this, function (_a) {
        device = this.devices.get(deviceId);
        if (!device) {
          throw new Error("Device not found: ".concat(deviceId));
        }
        return [2 /*return*/, device.capabilities];
      });
    });
  };
  /**
   * Validate a command before sending to device
   */
  SamplePlugin.prototype.validateCommand = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      var device;
      return __generator(this, function (_a) {
        device = this.devices.get(deviceId);
        if (!device) {
          return [2 /*return*/, false];
        }
        switch (command.type) {
          case "power":
            return [2 /*return*/, true];
          case "brightness":
            return [2 /*return*/, device.capabilities.includes("brightness")];
          case "color":
            return [2 /*return*/, device.capabilities.includes("color")];
          case "motion":
            return [2 /*return*/, device.capabilities.includes("motion")];
          default:
            return [2 /*return*/, false];
        }
        return [2 /*return*/];
      });
    });
  };
  return SamplePlugin;
})(events_1.EventEmitter);
exports.SamplePlugin = SamplePlugin;
// Export the plugin class
exports.default = SamplePlugin;

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
exports.LifxPlugin = void 0;
var events_1 = require("events");
var dgram = require("dgram");
var node_fetch_1 = require("node-fetch");
var LifxPlugin = /** @class */ (function (_super) {
  __extends(LifxPlugin, _super);
  function LifxPlugin(apiToken) {
    var _this = _super.call(this) || this;
    _this.name = "LIFX";
    _this.devices = new Map();
    _this.socket = null;
    _this.apiToken = null;
    _this.API_URL = "https://api.lifx.com/v1";
    _this.UDP_PORT = 56700;
    _this.BROADCAST_IP = "255.255.255.255";
    if (apiToken) {
      _this.apiToken = apiToken;
    }
    _this.setupSocket();
    return _this;
  }
  LifxPlugin.prototype.setupSocket = function () {
    this.socket = dgram.createSocket("udp4");
    this.socket.on("error", function (err) {
      console.error("LIFX discovery socket error:", err);
    });
  };
  LifxPlugin.prototype.discover = function () {
    return __awaiter(this, void 0, void 0, function () {
      var devices, error_1;
      var _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.apiToken) return [3 /*break*/, 4];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, this.discoverViaCloud()];
          case 2:
            devices = _a.sent();
            devices.forEach(function (device) {
              return _this.devices.set(device.id, device);
            });
            return [2 /*return*/, devices];
          case 3:
            error_1 = _a.sent();
            console.error("LIFX cloud discovery failed:", error_1);
            return [3 /*break*/, 4];
          case 4:
            // Fall back to local discovery
            return [2 /*return*/, this.discoverLocal()];
        }
      });
    });
  };
  LifxPlugin.prototype.discoverViaCloud = function () {
    return __awaiter(this, void 0, void 0, function () {
      var response, devices, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.apiToken) return [2 /*return*/, []];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, , 5]);
            return [
              4 /*yield*/,
              (0, node_fetch_1.default)(
                "".concat(this.API_URL, "/lights/all"),
                {
                  headers: {
                    Authorization: "Bearer ".concat(this.apiToken),
                  },
                },
              ),
            ];
          case 2:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("LIFX API error: ".concat(response.statusText));
            }
            return [4 /*yield*/, response.json()];
          case 3:
            devices = _a.sent();
            return [
              2 /*return*/,
              devices.map(function (device) {
                return {
                  id: device.id,
                  name: device.label || "LIFX ".concat(device.id.substr(0, 6)),
                  type: "light",
                  protocol: "lifx",
                  capabilities: ["power", "brightness", "color"],
                  state: {
                    power: device.power === "on",
                    brightness: device.brightness,
                    color: {
                      hue: device.color.hue,
                      saturation: device.color.saturation,
                      kelvin: device.color.kelvin,
                    },
                  },
                  location: device.location,
                  group: device.group,
                };
              }),
            ];
          case 4:
            error_2 = _a.sent();
            console.error("Error discovering LIFX devices via cloud:", error_2);
            return [2 /*return*/, []];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  LifxPlugin.prototype.discoverLocal = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _this = this;
      return __generator(this, function (_a) {
        if (!this.socket) {
          this.setupSocket();
        }
        return [
          2 /*return*/,
          new Promise(function (resolve) {
            var found = new Map();
            if (!_this.socket) {
              resolve([]);
              return;
            }
            // Listen for responses
            _this.socket.on("message", function (msg, rinfo) {
              var device = _this.parseDiscoveryResponse(msg, rinfo);
              if (device) {
                found.set(device.id, device);
                _this.devices.set(device.id, device);
              }
            });
            // Send discovery packet
            var packet = _this.createDiscoveryPacket();
            _this.socket.send(
              packet,
              0,
              packet.length,
              _this.UDP_PORT,
              _this.BROADCAST_IP,
            );
            // Wait for responses
            setTimeout(function () {
              resolve(Array.from(found.values()));
            }, 1000);
          }),
        ];
      });
    });
  };
  LifxPlugin.prototype.control = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      var device;
      return __generator(this, function (_a) {
        device = this.devices.get(deviceId);
        if (!device) {
          throw new Error("Device ".concat(deviceId, " not found"));
        }
        if (this.apiToken) {
          return [2 /*return*/, this.controlViaCloud(device, command)];
        } else {
          return [2 /*return*/, this.controlLocal(device, command)];
        }
        return [2 /*return*/];
      });
    });
  };
  LifxPlugin.prototype.controlViaCloud = function (device, command) {
    return __awaiter(this, void 0, void 0, function () {
      var endpoint, payload, response, result, newState, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.apiToken) {
              throw new Error("No LIFX API token available");
            }
            endpoint = ""
              .concat(this.API_URL, "/lights/id:")
              .concat(device.id, "/state");
            payload = {};
            if (command.type === "power") {
              payload.power = command.value ? "on" : "off";
            } else if (command.type === "color") {
              payload.color = command.value;
            } else if (command.type === "brightness") {
              payload.brightness = command.value;
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, , 5]);
            return [
              4 /*yield*/,
              (0, node_fetch_1.default)(endpoint, {
                method: "PUT",
                headers: {
                  Authorization: "Bearer ".concat(this.apiToken),
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              }),
            ];
          case 2:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("LIFX API error: ".concat(response.statusText));
            }
            return [4 /*yield*/, response.json()];
          case 3:
            result = _a.sent();
            newState = __assign(__assign({}, device.state), payload);
            device.state = newState;
            this.devices.set(device.id, device);
            this.emit("stateChanged", { deviceId: device.id, state: newState });
            return [2 /*return*/, newState];
          case 4:
            error_3 = _a.sent();
            console.error(
              "Error controlling LIFX device ".concat(device.id, ":"),
              error_3,
            );
            throw error_3;
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  LifxPlugin.prototype.controlLocal = function (device, command) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Implement local control via UDP packets
        throw new Error("Local control not yet implemented");
      });
    });
  };
  LifxPlugin.prototype.createDiscoveryPacket = function () {
    // Implement LIFX discovery packet creation
    return Buffer.alloc(0);
  };
  LifxPlugin.prototype.parseDiscoveryResponse = function (msg, rinfo) {
    // Implement LIFX discovery response parsing
    return null;
  };
  // Cleanup resources
  LifxPlugin.prototype.destroy = function () {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  };
  return LifxPlugin;
})(events_1.EventEmitter);
exports.LifxPlugin = LifxPlugin;

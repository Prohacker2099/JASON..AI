"use strict";
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
exports.initialize = initialize;
exports.registerApp = registerApp;
exports.getLights = getLights;
exports.controlLight = controlLight;
exports.getDiscoveredLights = getDiscoveredLights;
var node_fetch_1 = require("node-fetch");
// Store discovered lights
var discoveredLights = new Map();
var bridgeIp = null;
var username = null;
/**
 * Initialize Hue integration
 */
function initialize() {
  return __awaiter(this, void 0, void 0, function () {
    var _a, error_1;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 4, , 5]);
          _a = process.env.HUE_BRIDGE_IP;
          if (_a) return [3 /*break*/, 2];
          return [4 /*yield*/, discoverBridge()];
        case 1:
          _a = _b.sent();
          _b.label = 2;
        case 2:
          // Get bridge IP from environment variable or discover it
          bridgeIp = _a;
          username = process.env.HUE_USERNAME || null;
          if (!bridgeIp) {
            console.error(
              "No Hue bridge found. Set HUE_BRIDGE_IP in .env or ensure bridge is discoverable.",
            );
            return [2 /*return*/, false];
          }
          if (!username) {
            console.error(
              "No Hue username configured. Set HUE_USERNAME in .env or press the link button and call registerApp().",
            );
            return [2 /*return*/, false];
          }
          console.log(
            "Hue integration initialized with bridge at ".concat(bridgeIp),
          );
          // Get initial lights
          return [4 /*yield*/, getLights()];
        case 3:
          // Get initial lights
          _b.sent();
          return [2 /*return*/, true];
        case 4:
          error_1 = _b.sent();
          console.error("Error initializing Hue integration:", error_1);
          return [2 /*return*/, false];
        case 5:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Discover Hue bridge on the network
 */
function discoverBridge() {
  return __awaiter(this, void 0, void 0, function () {
    var response, bridges, error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          console.log("Discovering Hue bridge...");
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("https://discovery.meethue.com/"),
          ];
        case 1:
          response = _a.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          bridges = _a.sent();
          if (bridges && bridges.length > 0 && bridges[0].internalipaddress) {
            console.log(
              "Found Hue bridge at ".concat(bridges[0].internalipaddress),
            );
            return [2 /*return*/, bridges[0].internalipaddress];
          }
          console.log("No Hue bridge found via discovery API");
          return [2 /*return*/, null];
        case 3:
          error_2 = _a.sent();
          console.error("Error discovering Hue bridge:", error_2);
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Register app with Hue bridge
 * Note: The link button on the bridge must be pressed before calling this
 */
function registerApp() {
  return __awaiter(this, void 0, void 0, function () {
    var response, result, error_3;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          if (!bridgeIp) {
            console.error("No Hue bridge IP configured");
            return [2 /*return*/, null];
          }
          console.log("Registering app with Hue bridge...");
          console.log("Make sure the link button on the Hue bridge is pressed");
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(bridgeIp, "/api"), {
              method: "POST",
              body: JSON.stringify({
                devicetype: "jason_smart_home",
              }),
            }),
          ];
        case 1:
          response = _a.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          result = _a.sent();
          if (result[0].success) {
            username = result[0].success.username;
            console.log(
              "Successfully registered app with Hue bridge. Username: ".concat(
                username,
              ),
            );
            console.log("Add this username to your .env file as HUE_USERNAME");
            return [2 /*return*/, username];
          } else if (result[0].error) {
            console.error(
              "Error registering app: ".concat(result[0].error.description),
            );
          }
          return [2 /*return*/, null];
        case 3:
          error_3 = _a.sent();
          console.error("Error registering app with Hue bridge:", error_3);
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get all lights from Hue bridge
 */
function getLights() {
  return __awaiter(this, void 0, void 0, function () {
    var response, lights, _i, _a, _b, id, light, lightInfo, error_4;
    var _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
      switch (_h.label) {
        case 0:
          _h.trys.push([0, 3, , 4]);
          if (!bridgeIp || !username) {
            console.error("Hue bridge IP or username not configured");
            return [2 /*return*/, []];
          }
          console.log("Getting lights from Hue bridge...");
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://".concat(bridgeIp, "/api/").concat(username, "/lights"),
            ),
          ];
        case 1:
          response = _h.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          lights = _h.sent();
          // Clear existing lights
          discoveredLights.clear();
          // Process lights
          for (_i = 0, _a = Object.entries(lights); _i < _a.length; _i++) {
            ((_b = _a[_i]), (id = _b[0]), (light = _b[1]));
            lightInfo = {
              id: "hue-light-".concat(id),
              name: light.name,
              manufacturer: "Philips",
              model: light.modelid || "Hue Light",
              type: "light",
              protocol: "hue",
              address: bridgeIp,
              bridgeId: id,
              capabilities: getCapabilities(light),
              state: {
                on:
                  ((_c = light.state) === null || _c === void 0
                    ? void 0
                    : _c.on) || false,
                brightness: (
                  (_d = light.state) === null || _d === void 0 ? void 0 : _d.bri
                )
                  ? Math.round((light.state.bri / 254) * 100)
                  : 0,
                color: (
                  (_e = light.state) === null || _e === void 0 ? void 0 : _e.hue
                )
                  ? {
                      h: Math.round((light.state.hue / 65535) * 360),
                      s: Math.round((light.state.sat / 254) * 100),
                      v: Math.round((light.state.bri / 254) * 100),
                    }
                  : undefined,
                reachable:
                  ((_f = light.state) === null || _f === void 0
                    ? void 0
                    : _f.reachable) || false,
              },
              online:
                ((_g = light.state) === null || _g === void 0
                  ? void 0
                  : _g.reachable) || false,
              discovered: new Date().toISOString(),
            };
            discoveredLights.set(lightInfo.id, lightInfo);
            console.log("Found Hue light: ".concat(lightInfo.name));
          }
          return [2 /*return*/, Array.from(discoveredLights.values())];
        case 3:
          error_4 = _h.sent();
          console.error("Error getting Hue lights:", error_4);
          return [2 /*return*/, []];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get capabilities for a Hue light
 */
function getCapabilities(light) {
  var _a, _b, _c, _d;
  var capabilities = ["on"];
  if (
    ((_a = light.state) === null || _a === void 0 ? void 0 : _a.bri) !==
    undefined
  ) {
    capabilities.push("brightness");
  }
  if (
    ((_b = light.state) === null || _b === void 0 ? void 0 : _b.hue) !==
      undefined &&
    ((_c = light.state) === null || _c === void 0 ? void 0 : _c.sat) !==
      undefined
  ) {
    capabilities.push("color");
  }
  if (
    ((_d = light.state) === null || _d === void 0 ? void 0 : _d.ct) !==
    undefined
  ) {
    capabilities.push("temperature");
  }
  return capabilities;
}
/**
 * Control a Hue light
 */
function controlLight(lightId, command) {
  return __awaiter(this, void 0, void 0, function () {
    var light,
      bridgeId,
      payload,
      mired,
      response,
      result,
      success,
      updatedLight,
      error_5;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 3, , 4]);
          if (!bridgeIp || !username) {
            throw new Error("Hue bridge IP or username not configured");
          }
          light = discoveredLights.get(lightId);
          if (!light) {
            throw new Error("Light not found: ".concat(lightId));
          }
          bridgeId = light.bridgeId;
          if (!bridgeId) {
            throw new Error("Bridge ID not found for light: ".concat(lightId));
          }
          payload = {};
          if (command.on !== undefined) {
            payload.on = command.on;
          }
          if (command.brightness !== undefined) {
            payload.bri = Math.max(
              1,
              Math.min(254, Math.round(command.brightness * 2.54)),
            );
          }
          if (command.color) {
            if (
              command.color.h !== undefined &&
              command.color.s !== undefined
            ) {
              payload.hue = Math.round((command.color.h * 65535) / 360);
              payload.sat = Math.round((command.color.s * 254) / 100);
            }
            if (command.color.v !== undefined) {
              payload.bri = Math.round((command.color.v * 254) / 100);
            }
          }
          if (command.temperature !== undefined) {
            mired = Math.round(1000000 / command.temperature);
            payload.ct = Math.max(153, Math.min(500, mired));
          }
          console.log(
            "Controlling Hue light ".concat(bridgeId, " with:"),
            payload,
          );
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://"
                .concat(bridgeIp, "/api/")
                .concat(username, "/lights/")
                .concat(bridgeId, "/state"),
              {
                method: "PUT",
                body: JSON.stringify(payload),
              },
            ),
          ];
        case 1:
          response = _b.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          result = _b.sent();
          success = result.some(function (item) {
            return Object.keys(item).some(function (key) {
              return key.startsWith("success");
            });
          });
          if (success) {
            updatedLight = __assign({}, light);
            if (command.on !== undefined) {
              updatedLight.state.on = command.on;
            }
            if (command.brightness !== undefined) {
              updatedLight.state.brightness = command.brightness;
            }
            if (command.color) {
              updatedLight.state.color = command.color;
            }
            discoveredLights.set(lightId, updatedLight);
          }
          return [
            2 /*return*/,
            {
              success: success,
              deviceId: lightId,
              state:
                (_a = discoveredLights.get(lightId)) === null || _a === void 0
                  ? void 0
                  : _a.state,
            },
          ];
        case 3:
          error_5 = _b.sent();
          console.error(
            "Error controlling Hue light ".concat(lightId, ":"),
            error_5,
          );
          throw error_5;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get all discovered lights
 */
function getDiscoveredLights() {
  return Array.from(discoveredLights.values());
}

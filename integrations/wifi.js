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
exports.scanNetwork = scanNetwork;
exports.controlDevice = controlDevice;
exports.getDiscoveredDevices = getDiscoveredDevices;
var node_fetch_1 = require("node-fetch");
var os_1 = require("os");
var child_process_1 = require("child_process");
var util_1 = require("util");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
// Cache for discovered devices
var discoveredDevices = new Map();
/**
 * Scan local network for WiFi devices
 */
function scanNetwork() {
  return __awaiter(this, void 0, void 0, function () {
    var interfaces,
      networkAddresses_2,
      devices,
      _i,
      networkAddresses_1,
      prefix,
      stdout,
      hosts,
      _a,
      hosts_1,
      host,
      device,
      err_1,
      err_2,
      error_1;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 13, , 14]);
          interfaces = (0, os_1.networkInterfaces)();
          networkAddresses_2 = [];
          // Extract IPv4 addresses
          Object.values(interfaces).forEach(function (iface) {
            if (iface) {
              iface.forEach(function (addr) {
                if (addr.family === "IPv4" && !addr.internal) {
                  // Get network prefix
                  var parts = addr.address.split(".");
                  var prefix = ""
                    .concat(parts[0], ".")
                    .concat(parts[1], ".")
                    .concat(parts[2]);
                  networkAddresses_2.push(prefix);
                }
              });
            }
          });
          devices = [];
          ((_i = 0), (networkAddresses_1 = networkAddresses_2));
          _b.label = 1;
        case 1:
          if (!(_i < networkAddresses_1.length)) return [3 /*break*/, 12];
          prefix = networkAddresses_1[_i];
          _b.label = 2;
        case 2:
          _b.trys.push([2, 10, , 11]);
          // Use nmap to scan network (requires nmap to be installed)
          console.log("Scanning network: ".concat(prefix, ".0/24"));
          return [
            4 /*yield*/,
            execAsync("nmap -sn ".concat(prefix, ".0/24 --open")),
          ];
        case 3:
          stdout = _b.sent().stdout;
          hosts = parseNmapOutput(stdout);
          ((_a = 0), (hosts_1 = hosts));
          _b.label = 4;
        case 4:
          if (!(_a < hosts_1.length)) return [3 /*break*/, 9];
          host = hosts_1[_a];
          _b.label = 5;
        case 5:
          _b.trys.push([5, 7, , 8]);
          return [4 /*yield*/, identifyDevice(host.ip)];
        case 6:
          device = _b.sent();
          if (device) {
            devices.push(device);
            discoveredDevices.set(device.id, device);
          }
          return [3 /*break*/, 8];
        case 7:
          err_1 = _b.sent();
          console.error(
            "Error identifying device at ".concat(host.ip, ":"),
            err_1,
          );
          return [3 /*break*/, 8];
        case 8:
          _a++;
          return [3 /*break*/, 4];
        case 9:
          return [3 /*break*/, 11];
        case 10:
          err_2 = _b.sent();
          console.error(
            "Error scanning network ".concat(prefix, ".0/24:"),
            err_2,
          );
          return [3 /*break*/, 11];
        case 11:
          _i++;
          return [3 /*break*/, 1];
        case 12:
          return [2 /*return*/, devices];
        case 13:
          error_1 = _b.sent();
          console.error("Error scanning WiFi devices:", error_1);
          return [2 /*return*/, []];
        case 14:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Parse nmap output to extract hosts
 */
function parseNmapOutput(output) {
  var hosts = [];
  var lines = output.split("\n");
  var currentHost = null;
  for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
    var line = lines_1[_i];
    // Check for IP address
    var ipMatch = line.match(
      /Nmap scan report for (?:([^\s]+) )??\(([0-9.]+)\)/,
    );
    if (ipMatch) {
      if (currentHost) {
        hosts.push(currentHost);
      }
      currentHost = {
        ip: ipMatch[2],
        hostname: ipMatch[1],
      };
      continue;
    }
    // Check for MAC address
    var macMatch = line.match(/MAC Address: ([0-9A-F:]+) \(([^)]+)\)/);
    if (macMatch && currentHost) {
      currentHost.mac = macMatch[1];
      continue;
    }
  }
  if (currentHost) {
    hosts.push(currentHost);
  }
  return hosts;
}
/**
 * Try to identify a device by its IP address
 */
function identifyDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var device, error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [
            4 /*yield*/,
            Promise.race([
              identifyHueDevice(ip),
              identifyWemoDevice(ip),
              identifyLifxDevice(ip),
              identifyTuyaDevice(ip),
              identifyGenericDevice(ip),
            ]),
          ];
        case 1:
          device = _a.sent();
          return [2 /*return*/, device];
        case 2:
          error_2 = _a.sent();
          console.error(
            "Error identifying device at ".concat(ip, ":"),
            error_2,
          );
          return [2 /*return*/, null];
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Try to identify a Philips Hue device
 */
function identifyHueDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var response, data, error_3;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(ip, "/api/v1/config"), {
              timeout: 2000,
            }),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) return [2 /*return*/, null];
          return [4 /*yield*/, response.json()];
        case 2:
          data = _a.sent();
          if (data.name && data.bridgeid) {
            return [
              2 /*return*/,
              {
                id: "hue-".concat(data.bridgeid),
                name: data.name,
                manufacturer: "Philips",
                model: "Hue Bridge",
                type: "bridge",
                protocol: "hue",
                address: ip,
                capabilities: ["lights", "scenes"],
                online: true,
                discovered: new Date().toISOString(),
              },
            ];
          }
          return [2 /*return*/, null];
        case 3:
          error_3 = _a.sent();
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Try to identify a Belkin WeMo device
 */
function identifyWemoDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var response,
      text,
      nameMatch,
      name_1,
      modelMatch,
      model,
      serialMatch,
      serial,
      error_4;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://".concat(ip, ":49153/setup.xml"),
              {
                timeout: 2000,
              },
            ),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) return [2 /*return*/, null];
          return [4 /*yield*/, response.text()];
        case 2:
          text = _a.sent();
          if (text.includes("Belkin") && text.includes("WeMo")) {
            nameMatch = text.match(/<friendlyName>([^<]+)<\/friendlyName>/);
            name_1 = nameMatch ? nameMatch[1] : "WeMo Device";
            modelMatch = text.match(/<modelName>([^<]+)<\/modelName>/);
            model = modelMatch ? modelMatch[1] : "Unknown";
            serialMatch = text.match(/<serialNumber>([^<]+)<\/serialNumber>/);
            serial = serialMatch ? serialMatch[1] : "";
            return [
              2 /*return*/,
              {
                id: "wemo-".concat(serial || ip.replace(/\./g, "-")),
                name: name_1,
                manufacturer: "Belkin",
                model: model,
                type: model.includes("Light") ? "light" : "switch",
                protocol: "wemo",
                address: ip,
                capabilities: ["on"],
                online: true,
                discovered: new Date().toISOString(),
              },
            ];
          }
          return [2 /*return*/, null];
        case 3:
          error_4 = _a.sent();
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Try to identify a LIFX device
 */
function identifyLifxDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var response, data, error_5;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(ip, ":56700/info"), {
              timeout: 2000,
            }),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) return [2 /*return*/, null];
          return [4 /*yield*/, response.json()];
        case 2:
          data = _a.sent();
          if (data.product_name && data.vendor_name === "LIFX") {
            return [
              2 /*return*/,
              {
                id: "lifx-".concat(data.device_id || ip.replace(/\./g, "-")),
                name: data.product_name,
                manufacturer: "LIFX",
                model: data.product_name,
                type: "light",
                protocol: "lifx",
                address: ip,
                capabilities: ["on", "brightness", "color"],
                online: true,
                discovered: new Date().toISOString(),
              },
            ];
          }
          return [2 /*return*/, null];
        case 3:
          error_5 = _a.sent();
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Try to identify a Tuya device
 */
function identifyTuyaDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var response, data, error_6;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(ip, "/device"), {
              timeout: 2000,
            }),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) return [2 /*return*/, null];
          return [4 /*yield*/, response.json()];
        case 2:
          data = _a.sent();
          if (data.id && data.type) {
            return [
              2 /*return*/,
              {
                id: "tuya-".concat(data.id),
                name: data.name || "Tuya Device",
                manufacturer: "Tuya",
                model: data.model || "Unknown",
                type: mapTuyaType(data.type),
                protocol: "tuya",
                address: ip,
                capabilities: getTuyaCapabilities(data.type),
                online: true,
                discovered: new Date().toISOString(),
              },
            ];
          }
          return [2 /*return*/, null];
        case 3:
          error_6 = _a.sent();
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Try to identify a generic device
 */
function identifyGenericDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var ports, _i, ports_1, port, response, text, err_3, error_7;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 9, , 10]);
          ports = [80, 8080, 443, 8443];
          ((_i = 0), (ports_1 = ports));
          _a.label = 1;
        case 1:
          if (!(_i < ports_1.length)) return [3 /*break*/, 8];
          port = ports_1[_i];
          _a.label = 2;
        case 2:
          _a.trys.push([2, 6, , 7]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(ip, ":").concat(port), {
              timeout: 1000,
            }),
          ];
        case 3:
          response = _a.sent();
          if (!response.ok) return [3 /*break*/, 5];
          return [4 /*yield*/, response.text()];
        case 4:
          text = _a.sent();
          // Try to identify device from response
          if (text.includes("camera") || text.includes("RTSP")) {
            return [
              2 /*return*/,
              {
                id: "camera-".concat(ip.replace(/\./g, "-")),
                name: "Camera at ".concat(ip),
                manufacturer: "Unknown",
                model: "IP Camera",
                type: "camera",
                protocol: "http",
                address: ip,
                port: port,
                capabilities: ["stream"],
                online: true,
                discovered: new Date().toISOString(),
              },
            ];
          }
          if (text.includes("thermostat") || text.includes("temperature")) {
            return [
              2 /*return*/,
              {
                id: "thermostat-".concat(ip.replace(/\./g, "-")),
                name: "Thermostat at ".concat(ip),
                manufacturer: "Unknown",
                model: "Smart Thermostat",
                type: "thermostat",
                protocol: "http",
                address: ip,
                port: port,
                capabilities: ["temperature"],
                online: true,
                discovered: new Date().toISOString(),
              },
            ];
          }
          // Generic device
          return [
            2 /*return*/,
            {
              id: "device-".concat(ip.replace(/\./g, "-")),
              name: "Device at ".concat(ip),
              manufacturer: "Unknown",
              model: "Unknown",
              type: "other",
              protocol: "http",
              address: ip,
              port: port,
              capabilities: [],
              online: true,
              discovered: new Date().toISOString(),
            },
          ];
        case 5:
          return [3 /*break*/, 7];
        case 6:
          err_3 = _a.sent();
          return [3 /*break*/, 7];
        case 7:
          _i++;
          return [3 /*break*/, 1];
        case 8:
          return [2 /*return*/, null];
        case 9:
          error_7 = _a.sent();
          return [2 /*return*/, null];
        case 10:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Map Tuya device type to standard type
 */
function mapTuyaType(type) {
  switch (type.toLowerCase()) {
    case "light":
    case "bulb":
      return "light";
    case "switch":
      return "switch";
    case "outlet":
    case "plug":
      return "outlet";
    case "thermostat":
      return "thermostat";
    case "camera":
      return "camera";
    case "lock":
      return "lock";
    case "sensor":
      return "sensor";
    default:
      return "other";
  }
}
/**
 * Get capabilities for Tuya device type
 */
function getTuyaCapabilities(type) {
  switch (type.toLowerCase()) {
    case "light":
    case "bulb":
      return ["on", "brightness", "color"];
    case "switch":
      return ["on"];
    case "outlet":
    case "plug":
      return ["on", "energy"];
    case "thermostat":
      return ["temperature", "mode", "target"];
    case "camera":
      return ["stream", "snapshot"];
    case "lock":
      return ["lock", "unlock"];
    case "sensor":
      return ["value"];
    default:
      return [];
  }
}
/**
 * Control a WiFi device
 */
function controlDevice(deviceId, command) {
  return __awaiter(this, void 0, void 0, function () {
    var device, _a, error_8;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 13, , 14]);
          device = discoveredDevices.get(deviceId);
          if (!device) {
            throw new Error("Device not found: ".concat(deviceId));
          }
          _a = device.protocol;
          switch (_a) {
            case "hue":
              return [3 /*break*/, 1];
            case "wemo":
              return [3 /*break*/, 3];
            case "lifx":
              return [3 /*break*/, 5];
            case "tuya":
              return [3 /*break*/, 7];
            case "http":
              return [3 /*break*/, 9];
          }
          return [3 /*break*/, 11];
        case 1:
          return [4 /*yield*/, controlHueDevice(device, command)];
        case 2:
          return [2 /*return*/, _b.sent()];
        case 3:
          return [4 /*yield*/, controlWemoDevice(device, command)];
        case 4:
          return [2 /*return*/, _b.sent()];
        case 5:
          return [4 /*yield*/, controlLifxDevice(device, command)];
        case 6:
          return [2 /*return*/, _b.sent()];
        case 7:
          return [4 /*yield*/, controlTuyaDevice(device, command)];
        case 8:
          return [2 /*return*/, _b.sent()];
        case 9:
          return [4 /*yield*/, controlHttpDevice(device, command)];
        case 10:
          return [2 /*return*/, _b.sent()];
        case 11:
          throw new Error("Unsupported protocol: ".concat(device.protocol));
        case 12:
          return [3 /*break*/, 14];
        case 13:
          error_8 = _b.sent();
          console.error(
            "Error controlling device ".concat(deviceId, ":"),
            error_8,
          );
          throw error_8;
        case 14:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Control a Philips Hue device
 */
function controlHueDevice(device, command) {
  return __awaiter(this, void 0, void 0, function () {
    var username, lightId, payload, response, result, error_9;
    var _a, _b, _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 3, , 4]);
          username = process.env.HUE_USERNAME;
          if (!username) {
            throw new Error("Hue username not configured");
          }
          lightId = device.bridgeId || command.lightId;
          if (!lightId) {
            throw new Error("Light ID not specified");
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
            // Convert color to Hue format
            // This is simplified - a real implementation would convert RGB/HSV to Hue's color space
            payload.hue = (command.color.h * 65535) / 360;
            payload.sat = (command.color.s * 254) / 100;
          }
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://"
                .concat(device.address, "/api/")
                .concat(username, "/lights/")
                .concat(lightId, "/state"),
              {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
              },
            ),
          ];
        case 1:
          response = _d.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          result = _d.sent();
          return [
            2 /*return*/,
            {
              success: true,
              deviceId: device.id,
              state: {
                on:
                  command.on !== undefined
                    ? command.on
                    : (_a = device.state) === null || _a === void 0
                      ? void 0
                      : _a.on,
                brightness:
                  command.brightness !== undefined
                    ? command.brightness
                    : (_b = device.state) === null || _b === void 0
                      ? void 0
                      : _b.brightness,
                color:
                  command.color ||
                  ((_c = device.state) === null || _c === void 0
                    ? void 0
                    : _c.color),
              },
            },
          ];
        case 3:
          error_9 = _d.sent();
          console.error("Error controlling Hue device:", error_9);
          throw error_9;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Control a Belkin WeMo device
 */
function controlWemoDevice(device, command) {
  return __awaiter(this, void 0, void 0, function () {
    var soapAction, soapBody, response, result, stateMatch, state, error_10;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          soapAction =
            command.on !== undefined
              ? "urn:Belkin:service:basicevent:1#SetBinaryState"
              : "urn:Belkin:service:basicevent:1#GetBinaryState";
          soapBody =
            command.on !== undefined
              ? '<?xml version="1.0" encoding="utf-8"?>\n         <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n           <s:Body>\n             <u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">\n               <BinaryState>'.concat(
                  command.on ? 1 : 0,
                  "</BinaryState>\n             </u:SetBinaryState>\n           </s:Body>\n         </s:Envelope>",
                )
              : '<?xml version="1.0" encoding="utf-8"?>\n         <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n           <s:Body>\n             <u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">\n             </u:GetBinaryState>\n           </s:Body>\n         </s:Envelope>';
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://".concat(
                device.address,
                ":49153/upnp/control/basicevent1",
              ),
              {
                method: "POST",
                headers: {
                  "Content-Type": 'text/xml; charset="utf-8"',
                  SOAPACTION: '"'.concat(soapAction, '"'),
                  Connection: "keep-alive",
                },
                body: soapBody,
              },
            ),
          ];
        case 1:
          response = _a.sent();
          return [4 /*yield*/, response.text()];
        case 2:
          result = _a.sent();
          stateMatch = result.match(/<BinaryState>(\d)<\/BinaryState>/);
          state = stateMatch ? stateMatch[1] === "1" : command.on;
          return [
            2 /*return*/,
            {
              success: true,
              deviceId: device.id,
              state: {
                on: state,
              },
            },
          ];
        case 3:
          error_10 = _a.sent();
          console.error("Error controlling WeMo device:", error_10);
          throw error_10;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Control a LIFX device
 */
function controlLifxDevice(device, command) {
  return __awaiter(this, void 0, void 0, function () {
    var token, payload, response, result, error_11;
    var _a, _b, _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 3, , 4]);
          token = process.env.LIFX_TOKEN;
          if (!token) {
            throw new Error("LIFX token not configured");
          }
          payload = {};
          if (command.on !== undefined) {
            payload.power = command.on ? "on" : "off";
          }
          if (command.brightness !== undefined) {
            payload.brightness = command.brightness / 100;
          }
          if (command.color) {
            payload.color = "hue:"
              .concat(command.color.h, " saturation:")
              .concat(command.color.s / 100, " brightness:")
              .concat(command.color.v / 100);
          }
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "https://api.lifx.com/v1/lights/id:".concat(
                device.id.replace("lifx-", ""),
                "/state",
              ),
              {
                method: "PUT",
                headers: {
                  Authorization: "Bearer ".concat(token),
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              },
            ),
          ];
        case 1:
          response = _d.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          result = _d.sent();
          return [
            2 /*return*/,
            {
              success: result.results.some(function (r) {
                return r.status === "ok";
              }),
              deviceId: device.id,
              state: {
                on:
                  command.on !== undefined
                    ? command.on
                    : (_a = device.state) === null || _a === void 0
                      ? void 0
                      : _a.on,
                brightness:
                  command.brightness !== undefined
                    ? command.brightness
                    : (_b = device.state) === null || _b === void 0
                      ? void 0
                      : _b.brightness,
                color:
                  command.color ||
                  ((_c = device.state) === null || _c === void 0
                    ? void 0
                    : _c.color),
              },
            },
          ];
        case 3:
          error_11 = _d.sent();
          console.error("Error controlling LIFX device:", error_11);
          throw error_11;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Control a Tuya device
 */
function controlTuyaDevice(device, command) {
  return __awaiter(this, void 0, void 0, function () {
    var accessId, accessKey, payload, response, result, error_12;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          accessId = process.env.TUYA_ACCESS_ID;
          accessKey = process.env.TUYA_ACCESS_KEY;
          if (!accessId || !accessKey) {
            throw new Error("Tuya credentials not configured");
          }
          payload = {};
          switch (device.type) {
            case "light":
              if (command.on !== undefined)
                payload.switch = command.on ? "on" : "off";
              if (command.brightness !== undefined)
                payload.bright_value = command.brightness;
              if (command.color) {
                payload.colour_data = {
                  h: command.color.h,
                  s: command.color.s,
                  v: command.color.v,
                };
              }
              break;
            case "switch":
            case "outlet":
              if (command.on !== undefined)
                payload.switch = command.on ? "on" : "off";
              break;
            case "thermostat":
              if (command.temperature !== undefined)
                payload.temp_set = command.temperature;
              if (command.mode !== undefined) payload.mode = command.mode;
              break;
            default:
              throw new Error("Unsupported device type: ".concat(device.type));
          }
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "https://openapi.tuyaus.com/v1.0/devices/".concat(
                device.id.replace("tuya-", ""),
                "/commands",
              ),
              {
                method: "POST",
                headers: {
                  client_id: accessId,
                  sign: "SIGNATURE", // Real implementation would calculate this
                  t: Date.now().toString(),
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  commands: [
                    {
                      code: "control",
                      value: payload,
                    },
                  ],
                }),
              },
            ),
          ];
        case 1:
          response = _a.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          result = _a.sent();
          return [
            2 /*return*/,
            {
              success: result.success,
              deviceId: device.id,
              state: __assign(__assign({}, device.state), command),
            },
          ];
        case 3:
          error_12 = _a.sent();
          console.error("Error controlling Tuya device:", error_12);
          throw error_12;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Control a generic HTTP device
 */
function controlHttpDevice(device, command) {
  return __awaiter(this, void 0, void 0, function () {
    var response, result, error_13;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://"
                .concat(device.address, ":")
                .concat(device.port || 80, "/control"),
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(command),
              },
            ),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) {
            throw new Error("HTTP error: ".concat(response.status));
          }
          return [4 /*yield*/, response.json()];
        case 2:
          result = _a.sent();
          return [
            2 /*return*/,
            {
              success: true,
              deviceId: device.id,
              state: __assign(__assign({}, device.state), command),
            },
          ];
        case 3:
          error_13 = _a.sent();
          console.error("Error controlling HTTP device:", error_13);
          throw error_13;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get all discovered devices
 */
function getDiscoveredDevices() {
  return Array.from(discoveredDevices.values());
}

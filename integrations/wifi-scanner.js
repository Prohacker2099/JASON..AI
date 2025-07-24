"use strict";
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
exports.getDiscoveredDevices = getDiscoveredDevices;
var child_process_1 = require("child_process");
var util_1 = require("util");
var os_1 = require("os");
var node_fetch_1 = require("node-fetch");
var mdns = require("mdns-js");
var dgram = require("dgram");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
// Store discovered devices
var discoveredDevices = new Map();
/**
 * Scan local network for WiFi devices
 */
function scanNetwork() {
  return __awaiter(this, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          console.log("Starting real WiFi network scan...");
          // Clear existing devices
          discoveredDevices.clear();
          // Run network scan methods in parallel
          return [
            4 /*yield*/,
            Promise.all([scanWithNmap(), scanWithMdns(), scanWithSsdp()]),
          ];
        case 1:
          // Run network scan methods in parallel
          _a.sent();
          // Return all discovered devices
          return [2 /*return*/, Array.from(discoveredDevices.values())];
        case 2:
          error_1 = _a.sent();
          console.error("Error scanning WiFi devices:", error_1);
          return [2 /*return*/, []];
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Scan network using nmap
 */
function scanWithNmap() {
  return __awaiter(this, void 0, void 0, function () {
    var networkPrefixes,
      _i,
      networkPrefixes_1,
      prefix,
      stdout,
      hosts,
      _a,
      hosts_1,
      host,
      err_1,
      err_2,
      error_2;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 13, , 14]);
          networkPrefixes = getNetworkPrefixes();
          ((_i = 0), (networkPrefixes_1 = networkPrefixes));
          _b.label = 1;
        case 1:
          if (!(_i < networkPrefixes_1.length)) return [3 /*break*/, 12];
          prefix = networkPrefixes_1[_i];
          _b.label = 2;
        case 2:
          _b.trys.push([2, 10, , 11]);
          console.log("Scanning network ".concat(prefix, ".0/24 with nmap..."));
          return [
            4 /*yield*/,
            execAsync("nmap -sn ".concat(prefix, ".0/24 --open")),
          ];
        case 3:
          stdout = _b.sent().stdout;
          hosts = parseNmapOutput(stdout);
          console.log(
            "Found "
              .concat(hosts.length, " hosts on network ")
              .concat(prefix, ".0/24"),
          );
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
          _b.sent();
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
          return [3 /*break*/, 14];
        case 13:
          error_2 = _b.sent();
          console.error("Error in nmap scan:", error_2);
          return [3 /*break*/, 14];
        case 14:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get network prefixes from local interfaces
 */
function getNetworkPrefixes() {
  var networkPrefixes = [];
  var interfaces = (0, os_1.networkInterfaces)();
  Object.values(interfaces).forEach(function (iface) {
    if (iface) {
      iface.forEach(function (addr) {
        if (addr.family === "IPv4" && !addr.internal) {
          var parts = addr.address.split(".");
          var prefix = ""
            .concat(parts[0], ".")
            .concat(parts[1], ".")
            .concat(parts[2]);
          if (!networkPrefixes.includes(prefix)) {
            networkPrefixes.push(prefix);
          }
        }
      });
    }
  });
  return networkPrefixes;
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
      /Nmap scan report for (?:([^\s]+) )??\\(([0-9.]+)\\)/,
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
    var macMatch = line.match(/MAC Address: ([0-9A-F:]+) \\(([^)]+)\\)/);
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
 * Scan network using mDNS/Bonjour
 */
function scanWithMdns() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        new Promise(function (resolve) {
          try {
            console.log("Scanning for mDNS/Bonjour devices...");
            // Create browser for all services
            var browser_1 = mdns.createBrowser(mdns.tcp("http"));
            browser_1.on("ready", function () {
              browser_1.discover();
            });
            browser_1.on("update", function (data) {
              try {
                // Process discovered service
                if (data.addresses && data.addresses.length > 0) {
                  processMdnsDevice(data);
                }
              } catch (err) {
                console.error("Error processing mDNS device:", err);
              }
            });
            // Resolve after a timeout to allow some devices to be discovered
            setTimeout(function () {
              browser_1.stop();
              resolve();
            }, 5000);
          } catch (error) {
            console.error("Error scanning mDNS:", error);
            resolve();
          }
        }),
      ];
    });
  });
}
/**
 * Process mDNS device data
 */
function processMdnsDevice(data) {
  var _a;
  try {
    // Extract useful information
    var name_1 = data.name || "";
    var address =
      ((_a = data.addresses) === null || _a === void 0 ? void 0 : _a[0]) || "";
    var port = data.port || 80;
    var hostname = data.hostname || "";
    // Try to determine device type and protocol
    var type = "other";
    var protocol = "mdns";
    var manufacturer = "Unknown";
    // Check for known device patterns
    if (hostname.includes("philips-hue") || name_1.includes("hue")) {
      type = "light";
      protocol = "hue";
      manufacturer = "Philips";
    } else if (hostname.includes("lifx")) {
      type = "light";
      protocol = "lifx";
      manufacturer = "LIFX";
    } else if (hostname.includes("wemo") || name_1.includes("wemo")) {
      type = "switch";
      protocol = "wemo";
      manufacturer = "Belkin";
    } else if (hostname.includes("nest") || name_1.includes("nest")) {
      type = "thermostat";
      manufacturer = "Nest";
    } else if (hostname.includes("ring") || name_1.includes("ring")) {
      type = "camera";
      manufacturer = "Ring";
    } else if (hostname.includes("sonos") || name_1.includes("sonos")) {
      type = "speaker";
      manufacturer = "Sonos";
    } else if (hostname.includes("roku") || name_1.includes("roku")) {
      type = "display";
      manufacturer = "Roku";
    } else if (
      hostname.includes("chromecast") ||
      name_1.includes("chromecast")
    ) {
      type = "display";
      manufacturer = "Google";
    } else if (hostname.includes("apple-tv") || name_1.includes("apple-tv")) {
      type = "display";
      manufacturer = "Apple";
    }
    // Create device info object
    var deviceInfo = {
      id: "mdns-".concat(hostname, "-").concat(address),
      name: name_1 || hostname,
      hostname: hostname,
      manufacturer: manufacturer,
      type: type,
      protocol: protocol,
      address: address,
      port: port,
      capabilities: [],
      online: true,
      discovered: new Date().toISOString(),
    };
    // Add to discovered devices
    discoveredDevices.set(deviceInfo.id, deviceInfo);
    console.log(
      "Discovered mDNS device: "
        .concat(deviceInfo.name, " (")
        .concat(deviceInfo.address, ")"),
    );
  } catch (error) {
    console.error("Error processing mDNS device:", error);
  }
}
/**
 * Scan network using SSDP/UPnP
 */
function scanWithSsdp() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        new Promise(function (resolve) {
          try {
            console.log("Scanning for SSDP/UPnP devices...");
            var socket_1 = dgram.createSocket({
              type: "udp4",
              reuseAddr: true,
            });
            var ssdpAddress_1 = "239.255.255.250";
            var ssdpPort_1 = 1900;
            var deviceLocations_1 = new Set();
            socket_1.on("error", function (err) {
              console.error("SSDP socket error:", err);
              socket_1.close();
              resolve();
            });
            socket_1.on("message", function (msg, rinfo) {
              try {
                var message = msg.toString();
                // Extract location header from SSDP response
                var locationMatch = message.match(/LOCATION: (.*)/i);
                if (locationMatch && locationMatch[1]) {
                  var location_1 = locationMatch[1].trim();
                  // Avoid processing the same location multiple times
                  if (!deviceLocations_1.has(location_1)) {
                    deviceLocations_1.add(location_1);
                    fetchDeviceDescription(location_1, rinfo.address);
                  }
                }
              } catch (err) {
                console.error("Error processing SSDP message:", err);
              }
            });
            socket_1.bind(function () {
              socket_1.setBroadcast(true);
              // Send M-SEARCH request
              var ssdpRequest = Buffer.from(
                "M-SEARCH * HTTP/1.1\r\n" +
                  "HOST: "
                    .concat(ssdpAddress_1, ":")
                    .concat(ssdpPort_1, "\r\n") +
                  'MAN: "ssdp:discover"\r\n' +
                  "MX: 3\r\n" +
                  "ST: ssdp:all\r\n\r\n",
              );
              socket_1.send(
                ssdpRequest,
                0,
                ssdpRequest.length,
                ssdpPort_1,
                ssdpAddress_1,
              );
              // Close socket after timeout
              setTimeout(function () {
                socket_1.close();
                resolve();
              }, 5000);
            });
          } catch (error) {
            console.error("Error scanning SSDP:", error);
            resolve();
          }
        }),
      ];
    });
  });
}
/**
 * Fetch device description from UPnP location URL
 */
function fetchDeviceDescription(location, address) {
  return __awaiter(this, void 0, void 0, function () {
    var response, xml, error_3;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(location, { timeout: 2000 }),
          ];
        case 1:
          response = _a.sent();
          return [4 /*yield*/, response.text()];
        case 2:
          xml = _a.sent();
          // Process device description
          processUpnpDevice(address, xml, location);
          return [3 /*break*/, 4];
        case 3:
          error_3 = _a.sent();
          console.error(
            "Error fetching device description from ".concat(location, ":"),
            error_3,
          );
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Process UPnP device data
 */
function processUpnpDevice(ip, description, location) {
  try {
    // Extract device information from XML
    var friendlyNameMatch = description.match(
      /<friendlyName>([^<]+)<\/friendlyName>/,
    );
    var manufacturerMatch = description.match(
      /<manufacturer>([^<]+)<\/manufacturer>/,
    );
    var modelNameMatch = description.match(/<modelName>([^<]+)<\/modelName>/);
    var deviceTypeMatch = description.match(
      /<deviceType>([^<]+)<\/deviceType>/,
    );
    var udnMatch = description.match(/<UDN>([^<]+)<\/UDN>/);
    var friendlyName = friendlyNameMatch
      ? friendlyNameMatch[1]
      : "Unknown Device";
    var manufacturer = manufacturerMatch ? manufacturerMatch[1] : "Unknown";
    var modelName = modelNameMatch ? modelNameMatch[1] : "Unknown";
    var deviceType = deviceTypeMatch ? deviceTypeMatch[1] : "";
    var udn = udnMatch ? udnMatch[1] : "";
    // Determine device type
    var type = "other";
    var capabilities = [];
    if (deviceType.includes("MediaRenderer")) {
      type = "speaker";
      capabilities = ["audio", "streaming"];
    } else if (deviceType.includes("MediaServer")) {
      type = "media";
      capabilities = ["content"];
    } else if (deviceType.includes("Light")) {
      type = "light";
      capabilities = ["on", "brightness"];
    } else if (deviceType.includes("Switch")) {
      type = "switch";
      capabilities = ["on"];
    } else if (deviceType.includes("Camera")) {
      type = "camera";
      capabilities = ["stream"];
    }
    // Create device info object
    var deviceInfo = {
      id: "upnp-".concat(udn || ip),
      name: friendlyName,
      manufacturer: manufacturer,
      model: modelName,
      type: type,
      protocol: "upnp",
      address: ip,
      capabilities: capabilities,
      online: true,
      discovered: new Date().toISOString(),
      location: location,
    };
    // Add to discovered devices
    discoveredDevices.set(deviceInfo.id, deviceInfo);
    console.log(
      "Discovered UPnP device: "
        .concat(deviceInfo.name, " (")
        .concat(deviceInfo.address, ")"),
    );
  } catch (error) {
    console.error("Error processing UPnP device:", error);
  }
}
/**
 * Try to identify a device by its IP address
 */
function identifyDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          // Try common device APIs
          return [
            4 /*yield*/,
            Promise.all([
              identifyHueDevice(ip),
              identifyWemoDevice(ip),
              identifyLifxDevice(ip),
            ]),
          ];
        case 1:
          // Try common device APIs
          _a.sent();
          return [3 /*break*/, 3];
        case 2:
          error_4 = _a.sent();
          console.error(
            "Error identifying device at ".concat(ip, ":"),
            error_4,
          );
          return [3 /*break*/, 3];
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
    var response, data, deviceInfo, error_5;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 5, , 6]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(ip, "/api/v1/config"), {
              timeout: 1000,
            }),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) return [2 /*return*/];
          return [4 /*yield*/, response.json()];
        case 2:
          data = _a.sent();
          if (!(data.name && data.bridgeid)) return [3 /*break*/, 4];
          deviceInfo = {
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
          };
          discoveredDevices.set(deviceInfo.id, deviceInfo);
          console.log(
            "Discovered Hue bridge: "
              .concat(deviceInfo.name, " (")
              .concat(deviceInfo.address, ")"),
          );
          if (!process.env.HUE_USERNAME) return [3 /*break*/, 4];
          return [4 /*yield*/, scanHueLights(ip)];
        case 3:
          _a.sent();
          _a.label = 4;
        case 4:
          return [3 /*break*/, 6];
        case 5:
          error_5 = _a.sent();
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Scan for Hue lights from a bridge
 */
function scanHueLights(bridgeIp) {
  return __awaiter(this, void 0, void 0, function () {
    var username, response, lights, _i, _a, _b, id, light, lightInfo, error_6;
    var _c, _d, _e, _f;
    return __generator(this, function (_g) {
      switch (_g.label) {
        case 0:
          _g.trys.push([0, 3, , 4]);
          username = process.env.HUE_USERNAME;
          if (!username) return [2 /*return*/];
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://".concat(bridgeIp, "/api/").concat(username, "/lights"),
            ),
          ];
        case 1:
          response = _g.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          lights = _g.sent();
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
              capabilities: getHueCapabilities(light),
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
                reachable:
                  ((_e = light.state) === null || _e === void 0
                    ? void 0
                    : _e.reachable) || false,
              },
              online:
                ((_f = light.state) === null || _f === void 0
                  ? void 0
                  : _f.reachable) || false,
              discovered: new Date().toISOString(),
            };
            discoveredDevices.set(lightInfo.id, lightInfo);
            console.log("Discovered Hue light: ".concat(lightInfo.name));
          }
          return [3 /*break*/, 4];
        case 3:
          error_6 = _g.sent();
          console.error("Error scanning Hue lights:", error_6);
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get capabilities for a Hue light
 */
function getHueCapabilities(light) {
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
 * Try to identify a Belkin WeMo device
 */
function identifyWemoDevice(ip) {
  return __awaiter(this, void 0, void 0, function () {
    var ports,
      _i,
      ports_1,
      port,
      response,
      text,
      nameMatch,
      name_2,
      modelMatch,
      model,
      serialMatch,
      serial,
      deviceInfo,
      err_3,
      error_7;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 8, , 9]);
          ports = [49153, 49152, 49154, 49151];
          ((_i = 0), (ports_1 = ports));
          _a.label = 1;
        case 1:
          if (!(_i < ports_1.length)) return [3 /*break*/, 7];
          port = ports_1[_i];
          _a.label = 2;
        case 2:
          _a.trys.push([2, 5, , 6]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)(
              "http://".concat(ip, ":").concat(port, "/setup.xml"),
              {
                timeout: 1000,
              },
            ),
          ];
        case 3:
          response = _a.sent();
          if (!response.ok) return [3 /*break*/, 6];
          return [4 /*yield*/, response.text()];
        case 4:
          text = _a.sent();
          if (text.includes("Belkin") && text.includes("WeMo")) {
            nameMatch = text.match(/<friendlyName>([^<]+)<\/friendlyName>/);
            name_2 = nameMatch ? nameMatch[1] : "WeMo Device";
            modelMatch = text.match(/<modelName>([^<]+)<\/modelName>/);
            model = modelMatch ? modelMatch[1] : "Unknown";
            serialMatch = text.match(/<serialNumber>([^<]+)<\/serialNumber>/);
            serial = serialMatch ? serialMatch[1] : "";
            deviceInfo = {
              id: "wemo-".concat(serial || ip.replace(/\./g, "-")),
              name: name_2,
              manufacturer: "Belkin",
              model: model,
              type: model.includes("Light") ? "light" : "switch",
              protocol: "wemo",
              address: ip,
              port: port,
              capabilities: ["on"],
              online: true,
              discovered: new Date().toISOString(),
            };
            discoveredDevices.set(deviceInfo.id, deviceInfo);
            console.log(
              "Discovered WeMo device: "
                .concat(deviceInfo.name, " (")
                .concat(deviceInfo.address, ")"),
            );
            return [2 /*return*/];
          }
          return [3 /*break*/, 6];
        case 5:
          err_3 = _a.sent();
          return [3 /*break*/, 6];
        case 6:
          _i++;
          return [3 /*break*/, 1];
        case 7:
          return [3 /*break*/, 9];
        case 8:
          error_7 = _a.sent();
          return [3 /*break*/, 9];
        case 9:
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
    var response, data, deviceInfo, error_8;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            (0, node_fetch_1.default)("http://".concat(ip, ":56700/info"), {
              timeout: 1000,
            }),
          ];
        case 1:
          response = _a.sent();
          if (!response.ok) return [2 /*return*/];
          return [4 /*yield*/, response.json()];
        case 2:
          data = _a.sent();
          if (data.product_name && data.vendor_name === "LIFX") {
            deviceInfo = {
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
            };
            discoveredDevices.set(deviceInfo.id, deviceInfo);
            console.log(
              "Discovered LIFX device: "
                .concat(deviceInfo.name, " (")
                .concat(deviceInfo.address, ")"),
            );
          }
          return [3 /*break*/, 4];
        case 3:
          error_8 = _a.sent();
          return [3 /*break*/, 4];
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

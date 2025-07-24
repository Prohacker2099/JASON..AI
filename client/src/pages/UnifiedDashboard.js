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
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("../components/GlassmorphicCard");
var DeviceControlPanel_1 = require("../components/DeviceControlPanel");
var HolographicBackground_1 = require("../components/HolographicBackground");
var UnifiedDashboard = function () {
  var _a;
  var _b = (0, react_1.useState)([]),
    devices = _b[0],
    setDevices = _b[1];
  var _c = (0, react_1.useState)([]),
    rooms = _c[0],
    setRooms = _c[1];
  var _d = (0, react_1.useState)("All"),
    selectedRoom = _d[0],
    setSelectedRoom = _d[1];
  var _e = (0, react_1.useState)(null),
    selectedDevice = _e[0],
    setSelectedDevice = _e[1];
  var _f = (0, react_1.useState)(true),
    loading = _f[0],
    setLoading = _f[1];
  var _g = (0, react_1.useState)(false),
    scanning = _g[0],
    setScanning = _g[1];
  var _h = (0, react_1.useState)(null),
    error = _h[0],
    setError = _h[1];
  // Fetch devices on component mount
  (0, react_1.useEffect)(function () {
    fetchDevices();
  }, []);
  // Fetch devices from API
  var fetchDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, roomsResponse, roomsData, roomsList, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setLoading(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 7, 8, 9]);
            return [4 /*yield*/, fetch("/api/devices")];
          case 2:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch devices");
            }
            return [4 /*yield*/, response.json()];
          case 3:
            data = _a.sent();
            setDevices(data);
            return [4 /*yield*/, fetch("/api/rooms")];
          case 4:
            roomsResponse = _a.sent();
            if (!roomsResponse.ok) return [3 /*break*/, 6];
            return [4 /*yield*/, roomsResponse.json()];
          case 5:
            roomsData = _a.sent();
            roomsList = Object.entries(roomsData).map(function (_a) {
              var name = _a[0],
                devices = _a[1];
              return {
                name: name,
                devices: devices,
              };
            });
            setRooms(roomsList);
            _a.label = 6;
          case 6:
            return [3 /*break*/, 9];
          case 7:
            error_1 = _a.sent();
            console.error("Error fetching devices:", error_1);
            setError("Failed to load devices. Please try again.");
            return [3 /*break*/, 9];
          case 8:
            setLoading(false);
            return [7 /*endfinally*/];
          case 9:
            return [2 /*return*/];
        }
      });
    });
  };
  // Scan for new devices
  var scanForDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setScanning(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              fetch("/api/scan", {
                method: "POST",
              }),
            ];
          case 2:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to scan for devices");
            }
            // Refresh devices list
            fetchDevices();
            return [3 /*break*/, 5];
          case 3:
            error_2 = _a.sent();
            console.error("Error scanning for devices:", error_2);
            setError("Failed to scan for devices. Please try again.");
            return [3 /*break*/, 5];
          case 4:
            setScanning(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  // Control a device
  var controlDevice = function (deviceId, command) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, result, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [
              4 /*yield*/,
              fetch("/api/devices/".concat(deviceId, "/control"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(command),
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to control device");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            result = _a.sent();
            // Update device state in local state
            setDevices(
              devices.map(function (device) {
                if (device.id === deviceId) {
                  return __assign(__assign({}, device), {
                    state: __assign(__assign({}, device.state), command),
                  });
                }
                return device;
              }),
            );
            // Update selected device if it's the one being controlled
            if (selectedDevice && selectedDevice.id === deviceId) {
              setSelectedDevice(
                __assign(__assign({}, selectedDevice), {
                  state: __assign(__assign({}, selectedDevice.state), command),
                }),
              );
            }
            return [2 /*return*/, result];
          case 3:
            error_3 = _a.sent();
            console.error(
              "Error controlling device ".concat(deviceId, ":"),
              error_3,
            );
            throw error_3;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // Filter devices by room
  var filteredDevices =
    selectedRoom === "All"
      ? devices
      : ((_a = rooms.find(function (room) {
          return room.name === selectedRoom;
        })) === null || _a === void 0
          ? void 0
          : _a.devices) || [];
  // Group devices by type
  var devicesByType = filteredDevices.reduce(function (acc, device) {
    if (!acc[device.type]) {
      acc[device.type] = [];
    }
    acc[device.type].push(device);
    return acc;
  }, {});
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <HolographicBackground_1.default />

      <div className="container mx-auto px-4 py-8">
        <framer_motion_1.motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white">
            Smart Home Dashboard
          </h1>

          <button
            onClick={scanForDevices}
            disabled={scanning}
            className="glass-button px-4 py-2 rounded-lg text-white flex items-center"
          >
            {scanning ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {scanning ? "Scanning..." : "Scan for Devices"}
          </button>
        </framer_motion_1.motion.div>

        {/* Room selector */}
        <framer_motion_1.motion.div
          className="mb-6 overflow-x-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex space-x-2 pb-2">
            <button
              onClick={function () {
                return setSelectedRoom("All");
              }}
              className={"px-4 py-2 rounded-lg ".concat(
                selectedRoom === "All"
                  ? "bg-blue-500 text-white"
                  : "glass-button text-white",
              )}
            >
              All
            </button>

            {rooms.map(function (room) {
              return (
                <button
                  key={room.name}
                  onClick={function () {
                    return setSelectedRoom(room.name);
                  }}
                  className={"px-4 py-2 rounded-lg ".concat(
                    selectedRoom === room.name
                      ? "bg-blue-500 text-white"
                      : "glass-button text-white",
                  )}
                >
                  {room.name}
                </button>
              );
            })}
          </div>
        </framer_motion_1.motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <GlassmorphicCard_1.default className="p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDevices}
              className="px-4 py-2 bg-blue-500 rounded-lg text-white"
            >
              Retry
            </button>
          </GlassmorphicCard_1.default>
        ) : filteredDevices.length === 0 ? (
          <GlassmorphicCard_1.default className="p-6 text-center">
            <p className="text-gray-300 mb-4">No devices found in this room.</p>
            <button
              onClick={scanForDevices}
              className="px-4 py-2 bg-blue-500 rounded-lg text-white"
            >
              Scan for Devices
            </button>
          </GlassmorphicCard_1.default>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device grid */}
            <div className="lg:col-span-2">
              {Object.entries(devicesByType).map(function (_a) {
                var type = _a[0],
                  devices = _a[1];
                return (
                  <framer_motion_1.motion.div
                    key={type}
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                      {type}s
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {devices.map(function (device) {
                        var _a, _b;
                        return (
                          <GlassmorphicCard_1.default
                            key={device.id}
                            className="p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={function () {
                              return setSelectedDevice(device);
                            }}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                                {renderDeviceIcon(device.type)}
                              </div>

                              <div>
                                <h3 className="text-white font-medium">
                                  {device.name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {device.manufacturer}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-gray-300 text-sm">
                                {renderDeviceStatus(device)}
                              </span>

                              {device.type === "light" ||
                              device.type === "switch" ||
                              device.type === "outlet" ? (
                                <button
                                  onClick={function (e) {
                                    var _a;
                                    e.stopPropagation();
                                    controlDevice(device.id, {
                                      on: !((_a = device.state) === null ||
                                      _a === void 0
                                        ? void 0
                                        : _a.on),
                                    });
                                  }}
                                  className={"w-10 h-6 rounded-full ".concat(
                                    (
                                      (_a = device.state) === null ||
                                      _a === void 0
                                        ? void 0
                                        : _a.on
                                    )
                                      ? "bg-blue-500"
                                      : "bg-gray-600",
                                  )}
                                >
                                  <span
                                    className={"block w-4 h-4 rounded-full bg-white transform transition-transform ".concat(
                                      (
                                        (_b = device.state) === null ||
                                        _b === void 0
                                          ? void 0
                                          : _b.on
                                      )
                                        ? "translate-x-5"
                                        : "translate-x-1",
                                    )}
                                  />
                                </button>
                              ) : null}
                            </div>
                          </GlassmorphicCard_1.default>
                        );
                      })}
                    </div>
                  </framer_motion_1.motion.div>
                );
              })}
            </div>

            {/* Device control panel */}
            <div className="lg:col-span-1">
              <framer_motion_1.motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {selectedDevice ? (
                  <DeviceControlPanel_1.default
                    device={selectedDevice}
                    onControl={function (command) {
                      return controlDevice(selectedDevice.id, command);
                    }}
                  />
                ) : (
                  <GlassmorphicCard_1.default className="p-6 text-center">
                    <p className="text-gray-300">
                      Select a device to control it.
                    </p>
                  </GlassmorphicCard_1.default>
                )}
              </framer_motion_1.motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  // Helper function to render device icon
  function renderDeviceIcon(type) {
    switch (type) {
      case "light":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        );
      case "switch":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 00-1 1v5a1 1 0 002 0V4a1 1 0 00-1-1zm-1 9a1 1 0 102 0 1 1 0 00-2 0zm-7-9a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L3.414 3H9a1 1 0 100-2H1a1 1 0 00-1 1v8a1 1 0 102 0V3zm16 0a1 1 0 00-1-1h-8a1 1 0 100 2h5.586l-3.293 3.293a1 1 0 001.414 1.414l3-3A1 1 0 0018 3z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "thermostat":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V7a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  }
  // Helper function to render device status
  function renderDeviceStatus(device) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    switch (device.type) {
      case "light":
        return ((_a = device.state) === null || _a === void 0 ? void 0 : _a.on)
          ? "On".concat(
              (
                (_b = device.state) === null || _b === void 0
                  ? void 0
                  : _b.brightness
              )
                ? " (".concat(device.state.brightness, "%)")
                : "",
            )
          : "Off";
      case "switch":
      case "outlet":
        return ((_c = device.state) === null || _c === void 0 ? void 0 : _c.on)
          ? "On"
          : "Off";
      case "thermostat":
        return (
          (_d = device.state) === null || _d === void 0
            ? void 0
            : _d.temperature
        )
          ? ""
              .concat(device.state.temperature, "\u00B0")
              .concat(
                (
                  (_e = device.state) === null || _e === void 0
                    ? void 0
                    : _e.mode
                )
                  ? " (".concat(device.state.mode, ")")
                  : "",
              )
          : "Unknown";
      case "lock":
        return (
          (_f = device.state) === null || _f === void 0 ? void 0 : _f.locked
        )
          ? "Locked"
          : "Unlocked";
      case "camera":
        return (
          (_g = device.state) === null || _g === void 0 ? void 0 : _g.recording
        )
          ? "Recording"
          : "Standby";
      case "alarm":
        return (
          (_h = device.state) === null || _h === void 0 ? void 0 : _h.armed
        )
          ? "Armed (".concat(
              ((_j = device.state) === null || _j === void 0
                ? void 0
                : _j.mode) || "unknown",
              ")",
            )
          : "Disarmed";
      default:
        return "Unknown";
    }
  }
};
exports.default = UnifiedDashboard;

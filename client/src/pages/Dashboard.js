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
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var JasonCore_1 = require("../components/JasonCore");
var GlassmorphicCard_1 = require("../components/GlassmorphicCard");
var Dashboard = function () {
  var _a = (0, react_1.useState)([]),
    devices = _a[0],
    setDevices = _a[1];
  var _b = (0, react_1.useState)({
      deviceCount: 0,
      activeDevices: 0,
      dataUsage: 0,
      securityStatus: "secure",
    }),
    networkStatus = _b[0],
    setNetworkStatus = _b[1];
  var _c = (0, react_1.useState)(true),
    loading = _c[0],
    setLoading = _c[1];
  var _d = (0, react_1.useState)(null),
    error = _d[0],
    setError = _d[1];
  // Fetch devices on component mount
  (0, react_1.useEffect)(function () {
    fetchDevices();
  }, []);
  // Fetch devices from API
  var fetchDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, activeDevices, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            return [4 /*yield*/, fetch("/api/devices")];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch devices");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setDevices(data);
            activeDevices = data.filter(function (d) {
              return d.isActive;
            }).length;
            setNetworkStatus({
              deviceCount: data.length,
              activeDevices: activeDevices,
              dataUsage: Math.random() * 100, // Simulated data usage
              securityStatus: "secure",
            });
            setError(null);
            return [3 /*break*/, 5];
          case 3:
            error_1 = _a.sent();
            console.error("Error fetching devices:", error_1);
            setError("Failed to load devices. Please try again.");
            return [3 /*break*/, 5];
          case 4:
            setLoading(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  // Group devices by type
  var devicesByType = devices.reduce(function (acc, device) {
    if (!acc[device.type]) {
      acc[device.type] = [];
    }
    acc[device.type].push(device);
    return acc;
  }, {});
  // Get device type label
  var getDeviceTypeLabel = function (type) {
    switch (type) {
      case "light":
        return "Lights";
      case "thermostat":
        return "Thermostats";
      case "camera":
        return "Cameras";
      default:
        return "".concat(type.charAt(0).toUpperCase() + type.slice(1), "s");
    }
  };
  return (
    <div className="max-w-7xl mx-auto">
      <framer_motion_1.motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gradient">JASON Dashboard</h1>
      </framer_motion_1.motion.div>

      {error && (
        <GlassmorphicCard_1.default className="p-6 mb-8 border-red-500">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-400">{error}</p>
          </div>
          <button
            onClick={fetchDevices}
            className="mt-2 text-blue-400 hover:text-blue-300"
          >
            Retry
          </button>
        </GlassmorphicCard_1.default>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* JASON Core */}
        <GlassmorphicCard_1.default className="p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-white mb-4">JASON Core</h2>
          <JasonCore_1.default
            networkStatus={networkStatus}
            className="w-full h-64"
          />
        </GlassmorphicCard_1.default>

        {/* Network Stats */}
        <GlassmorphicCard_1.default className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Network Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Devices Online</span>
                <span className="text-blue-400">
                  {networkStatus.activeDevices}/{networkStatus.deviceCount}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <framer_motion_1.motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: "".concat(
                      (networkStatus.activeDevices /
                        Math.max(networkStatus.deviceCount, 1)) *
                        100,
                      "%",
                    ),
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                ></framer_motion_1.motion.div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Data Usage</span>
                <span className="text-blue-400">
                  {Math.round(networkStatus.dataUsage)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <framer_motion_1.motion.div
                  className="bg-green-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "".concat(networkStatus.dataUsage, "%") }}
                  transition={{ duration: 1, ease: "easeOut" }}
                ></framer_motion_1.motion.div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Security Status</span>
                <span
                  className={"\n                  "
                    .concat(
                      networkStatus.securityStatus === "secure"
                        ? "text-green-400"
                        : "",
                      "\n                  ",
                    )
                    .concat(
                      networkStatus.securityStatus === "warning"
                        ? "text-yellow-400"
                        : "",
                      "\n                  ",
                    )
                    .concat(
                      networkStatus.securityStatus === "critical"
                        ? "text-red-400"
                        : "",
                      "\n                ",
                    )}
                >
                  {networkStatus.securityStatus.charAt(0).toUpperCase() +
                    networkStatus.securityStatus.slice(1)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <framer_motion_1.motion.div
                  className={"\n                    h-2 rounded-full\n                    "
                    .concat(
                      networkStatus.securityStatus === "secure"
                        ? "bg-green-500"
                        : "",
                      "\n                    ",
                    )
                    .concat(
                      networkStatus.securityStatus === "warning"
                        ? "bg-yellow-500"
                        : "",
                      "\n                    ",
                    )
                    .concat(
                      networkStatus.securityStatus === "critical"
                        ? "bg-red-500"
                        : "",
                      "\n                  ",
                    )}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                ></framer_motion_1.motion.div>
              </div>
            </div>
          </div>
        </GlassmorphicCard_1.default>

        {/* Quick Actions */}
        <GlassmorphicCard_1.default className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <framer_motion_1.motion.button
              className="glass-button p-4 rounded-lg text-white flex flex-col items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <span>All Lights</span>
            </framer_motion_1.motion.button>

            <framer_motion_1.motion.button
              className="glass-button p-4 rounded-lg text-white flex flex-col items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Security</span>
            </framer_motion_1.motion.button>

            <framer_motion_1.motion.button
              className="glass-button p-4 rounded-lg text-white flex flex-col items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span>Night Mode</span>
            </framer_motion_1.motion.button>

            <framer_motion_1.motion.button
              className="glass-button p-4 rounded-lg text-white flex flex-col items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Settings</span>
            </framer_motion_1.motion.button>
          </div>
        </GlassmorphicCard_1.default>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {Object.entries(devicesByType).map(function (_a) {
          var type = _a[0],
            typeDevices = _a[1];
          return (
            <framer_motion_1.motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {getDeviceTypeLabel(type)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {typeDevices.map(function (device) {
                  return (
                    <GlassmorphicCard_1.default key={device.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                            {device.type === "light" && (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                              </svg>
                            )}
                            {device.type === "thermostat" && (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V7a1 1 0 011-1z" />
                              </svg>
                            )}
                            {device.type === "camera" && (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {device.name}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              {device.status}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span
                            className={"w-3 h-3 rounded-full ".concat(
                              device.isActive ? "bg-green-500" : "bg-gray-500",
                              " mr-2",
                            )}
                          ></span>
                          <span className="text-gray-300 text-sm">
                            {device.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </GlassmorphicCard_1.default>
                  );
                })}
              </div>
            </framer_motion_1.motion.div>
          );
        })}
      </div>
    </div>
  );
};
exports.default = Dashboard;

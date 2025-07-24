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
exports.DeviceSelector = void 0;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var button_1 = require("./ui/button");
var switch_1 = require("./ui/switch");
var slider_1 = require("./ui/slider");
var select_1 = require("./ui/select");
var input_1 = require("./ui/input");
var lucide_react_1 = require("lucide-react");
var DeviceSelector = function (_a) {
  var selectedDevices = _a.selectedDevices,
    onDeviceSelect = _a.onDeviceSelect,
    onDeviceStateChange = _a.onDeviceStateChange,
    onRemoveDevice = _a.onRemoveDevice,
    _b = _a.singleSelect,
    singleSelect = _b === void 0 ? false : _b;
  var _c = (0, react_1.useState)([]),
    devices = _c[0],
    setDevices = _c[1];
  var _d = (0, react_1.useState)(true),
    loading = _d[0],
    setLoading = _d[1];
  var _e = (0, react_1.useState)(null),
    error = _e[0],
    setError = _e[1];
  var _f = (0, react_1.useState)(""),
    searchQuery = _f[0],
    setSearchQuery = _f[1];
  (0, react_1.useEffect)(function () {
    fetchDevices();
  }, []);
  var fetchDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            return [4 /*yield*/, fetch("/api/devices")];
          case 1:
            response = _a.sent();
            if (!response.ok) throw new Error("Failed to fetch devices");
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setDevices(data);
            return [3 /*break*/, 5];
          case 3:
            error_1 = _a.sent();
            setError("Failed to load devices");
            console.error("Error fetching devices:", error_1);
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
  var isDeviceSelected = function (deviceId) {
    return selectedDevices.some(function (d) {
      return d.deviceId === deviceId;
    });
  };
  var filteredDevices = devices.filter(function (device) {
    return (
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  var handleDeviceClick = function (device) {
    if (singleSelect) {
      onDeviceSelect === null || onDeviceSelect === void 0
        ? void 0
        : onDeviceSelect(device);
    } else {
      if (isDeviceSelected(device.id)) {
        onRemoveDevice === null || onRemoveDevice === void 0
          ? void 0
          : onRemoveDevice(device.id);
      } else {
        onDeviceSelect === null || onDeviceSelect === void 0
          ? void 0
          : onDeviceSelect(
              __assign(__assign({}, device), {
                state: {
                  on: true,
                  brightness: device.type === "light" ? 100 : undefined,
                },
              }),
            );
      }
    }
  };
  var handleStateChange = function (deviceId, changes) {
    onDeviceStateChange === null || onDeviceStateChange === void 0
      ? void 0
      : onDeviceStateChange(deviceId, changes);
  };
  var renderDeviceControls = function (device) {
    var selectedDevice = selectedDevices.find(function (d) {
      return d.deviceId === device.id;
    });
    if (!selectedDevice) return null;
    var state = selectedDevice.state || {};
    switch (device.type) {
      case "light":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <switch_1.Switch
                checked={state.on}
                onCheckedChange={function (checked) {
                  return handleStateChange(device.id, { on: checked });
                }}
              />
              <span className="text-sm text-white/60">
                {state.on ? "On" : "Off"}
              </span>
            </div>
            {state.on && (
              <div className="space-y-2">
                <label className="text-sm text-white/60">Brightness</label>
                <slider_1.Slider
                  value={[state.brightness || 100]}
                  onValueChange={function (_a) {
                    var value = _a[0];
                    return handleStateChange(device.id, { brightness: value });
                  }}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            )}
          </div>
        );
      case "switch":
      case "outlet":
        return (
          <div className="flex items-center gap-4">
            <switch_1.Switch
              checked={state.on}
              onCheckedChange={function (checked) {
                return handleStateChange(device.id, { on: checked });
              }}
            />
            <span className="text-sm text-white/60">
              {state.on ? "On" : "Off"}
            </span>
          </div>
        );
      case "thermostat":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button_1.Button
                size="sm"
                onClick={function () {
                  return handleStateChange(device.id, {
                    temperature: (state.temperature || 72) - 1,
                  });
                }}
              >
                <lucide_react_1.Minus className="w-4 h-4" />
              </button_1.Button>
              <span className="text-lg font-medium">
                {state.temperature || 72}°F
              </span>
              <button_1.Button
                size="sm"
                onClick={function () {
                  return handleStateChange(device.id, {
                    temperature: (state.temperature || 72) + 1,
                  });
                }}
              >
                <lucide_react_1.Plus className="w-4 h-4" />
              </button_1.Button>
            </div>
            <select_1.Select
              value={state.mode || "auto"}
              onValueChange={function (value) {
                return handleStateChange(device.id, { mode: value });
              }}
              options={[
                { value: "auto", label: "Auto" },
                { value: "heat", label: "Heat" },
                { value: "cool", label: "Cool" },
                { value: "off", label: "Off" },
              ]}
            />
          </div>
        );
      default:
        return null;
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <lucide_react_1.Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button_1.Button onClick={fetchDevices}>Retry</button_1.Button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Search */}
      <input_1.Input
        value={searchQuery}
        onChange={function (e) {
          return setSearchQuery(e.target.value);
        }}
        placeholder="Search devices..."
        className="bg-white/5 border-white/10"
      />

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <framer_motion_1.AnimatePresence mode="popLayout">
          {filteredDevices.map(function (device) {
            return (
              <framer_motion_1.motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <GlassmorphicCard_1.GlassmorphicCard
                  className={"p-4 cursor-pointer transition-colors ".concat(
                    isDeviceSelected(device.id)
                      ? "border-blue-500/50"
                      : "hover:border-white/20",
                  )}
                  onClick={function () {
                    return handleDeviceClick(device);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{device.name}</h4>
                      <p className="text-sm text-white/60">{device.type}</p>
                    </div>
                    {!singleSelect && isDeviceSelected(device.id) && (
                      <button_1.Button
                        size="sm"
                        variant="ghost"
                        onClick={function (e) {
                          e.stopPropagation();
                          onRemoveDevice === null || onRemoveDevice === void 0
                            ? void 0
                            : onRemoveDevice(device.id);
                        }}
                      >
                        <lucide_react_1.Minus className="w-4 h-4" />
                      </button_1.Button>
                    )}
                  </div>

                  {/* Device Controls */}
                  {isDeviceSelected(device.id) && (
                    <framer_motion_1.motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      {renderDeviceControls(device)}
                    </framer_motion_1.motion.div>
                  )}
                </GlassmorphicCard_1.GlassmorphicCard>
              </framer_motion_1.motion.div>
            );
          })}
        </framer_motion_1.AnimatePresence>
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-8 text-white/40">No devices found</div>
      )}
    </div>
  );
};
exports.DeviceSelector = DeviceSelector;

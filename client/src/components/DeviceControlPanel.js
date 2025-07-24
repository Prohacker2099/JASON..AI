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
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var DeviceControlPanel = function (_a) {
  var _b, _c, _d, _e, _f;
  var device = _a.device,
    onControl = _a.onControl,
    _g = _a.className,
    className = _g === void 0 ? "" : _g;
  var _h = (0, react_1.useState)(
      ((_b = device.state) === null || _b === void 0 ? void 0 : _b.on) || false,
    ),
    isOn = _h[0],
    setIsOn = _h[1];
  var _j = (0, react_1.useState)(
      ((_c = device.state) === null || _c === void 0
        ? void 0
        : _c.brightness) || 100,
    ),
    brightness = _j[0],
    setBrightness = _j[1];
  var _k = (0, react_1.useState)(
      ((_d = device.state) === null || _d === void 0
        ? void 0
        : _d.temperature) || 72,
    ),
    temperature = _k[0],
    setTemperature = _k[1];
  var _l = (0, react_1.useState)(
      ((_e = device.state) === null || _e === void 0 ? void 0 : _e.color) || {
        h: 240,
        s: 100,
        v: 100,
      },
    ),
    color = _l[0],
    setColor = _l[1];
  var _m = (0, react_1.useState)(
      ((_f = device.state) === null || _f === void 0 ? void 0 : _f.locked) ||
        false,
    ),
    isLocked = _m[0],
    setIsLocked = _m[1];
  var _o = (0, react_1.useState)(false),
    loading = _o[0],
    setLoading = _o[1];
  // Update state when device changes
  (0, react_1.useEffect)(
    function () {
      var _a, _b, _c, _d, _e;
      if (
        ((_a = device.state) === null || _a === void 0 ? void 0 : _a.on) !==
        undefined
      )
        setIsOn(device.state.on);
      if (
        ((_b = device.state) === null || _b === void 0
          ? void 0
          : _b.brightness) !== undefined
      )
        setBrightness(device.state.brightness);
      if (
        ((_c = device.state) === null || _c === void 0
          ? void 0
          : _c.temperature) !== undefined
      )
        setTemperature(device.state.temperature);
      if ((_d = device.state) === null || _d === void 0 ? void 0 : _d.color)
        setColor(device.state.color);
      if (
        ((_e = device.state) === null || _e === void 0 ? void 0 : _e.locked) !==
        undefined
      )
        setIsLocked(device.state.locked);
    },
    [device],
  );
  // Handle power toggle
  var handlePowerToggle = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!onControl) return [2 /*return*/];
            setLoading(true);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [4 /*yield*/, onControl({ on: !isOn })];
          case 2:
            _a.sent();
            setIsOn(!isOn);
            return [3 /*break*/, 5];
          case 3:
            error_1 = _a.sent();
            console.error("Error controlling device:", error_1);
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
  // Handle brightness change
  var handleBrightnessChange = function (value) {
    return __awaiter(void 0, void 0, void 0, function () {
      var error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!onControl) return [2 /*return*/];
            setBrightness(value);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, onControl({ brightness: value })];
          case 2:
            _a.sent();
            return [3 /*break*/, 4];
          case 3:
            error_2 = _a.sent();
            console.error("Error controlling brightness:", error_2);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // Handle temperature change
  var handleTemperatureChange = function (value) {
    return __awaiter(void 0, void 0, void 0, function () {
      var error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!onControl) return [2 /*return*/];
            setTemperature(value);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, onControl({ temperature: value })];
          case 2:
            _a.sent();
            return [3 /*break*/, 4];
          case 3:
            error_3 = _a.sent();
            console.error("Error controlling temperature:", error_3);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // Handle lock toggle
  var handleLockToggle = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!onControl) return [2 /*return*/];
            setLoading(true);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [4 /*yield*/, onControl({ locked: !isLocked })];
          case 2:
            _a.sent();
            setIsLocked(!isLocked);
            return [3 /*break*/, 5];
          case 3:
            error_4 = _a.sent();
            console.error("Error controlling lock:", error_4);
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
  // Handle color change
  var handleColorChange = function (h, s, v) {
    return __awaiter(void 0, void 0, void 0, function () {
      var newColor, error_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!onControl) return [2 /*return*/];
            newColor = { h: h, s: s, v: v };
            setColor(newColor);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, onControl({ color: newColor })];
          case 2:
            _a.sent();
            return [3 /*break*/, 4];
          case 3:
            error_5 = _a.sent();
            console.error("Error controlling color:", error_5);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // Render controls based on device type
  var renderControls = function () {
    switch (device.type) {
      case "light":
        return renderLightControls();
      case "switch":
      case "outlet":
        return renderSwitchControls();
      case "thermostat":
        return renderThermostatControls();
      case "lock":
        return renderLockControls();
      case "camera":
        return renderCameraControls();
      case "alarm":
        return renderAlarmControls();
      default:
        return renderGenericControls();
    }
  };
  // Render light controls
  var renderLightControls = function () {
    var _a, _b;
    var hasColor =
      (_a = device.capabilities) === null || _a === void 0
        ? void 0
        : _a.includes("color");
    var hasBrightness =
      (_b = device.capabilities) === null || _b === void 0
        ? void 0
        : _b.includes("brightness");
    return (
      <div className="space-y-4">
        {/* Power toggle */}
        <div className="flex items-center justify-between">
          <span className="text-white">Power</span>
          <button
            onClick={handlePowerToggle}
            disabled={loading}
            className={"\n              relative w-12 h-6 rounded-full transition-colors duration-300\n              ".concat(
              isOn ? "bg-blue-500" : "bg-gray-600",
              "\n            ",
            )}
          >
            <span
              className={"\n                absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300\n                ".concat(
                isOn ? "left-7" : "left-1",
                "\n              ",
              )}
            />
          </button>
        </div>

        {/* Brightness slider */}
        {hasBrightness && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Brightness</span>
              <span className="text-white text-sm">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={function (e) {
                return handleBrightnessChange(parseInt(e.target.value));
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={!isOn}
            />
          </div>
        )}

        {/* Color controls */}
        {hasColor && (
          <div className="space-y-2">
            <span className="text-white text-sm">Color</span>
            <div className="grid grid-cols-6 gap-2">
              {[0, 30, 60, 120, 240, 280].map(function (hue) {
                return (
                  <button
                    key={hue}
                    onClick={function () {
                      return handleColorChange(hue, 100, 100);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                    style={{
                      backgroundColor: "hsl(".concat(hue, ", 100%, 50%)"),
                    }}
                    disabled={!isOn}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  // Render switch controls
  var renderSwitchControls = function () {
    return (
      <div className="flex items-center justify-between">
        <span className="text-white">Power</span>
        <button
          onClick={handlePowerToggle}
          disabled={loading}
          className={"\n            relative w-12 h-6 rounded-full transition-colors duration-300\n            ".concat(
            isOn ? "bg-blue-500" : "bg-gray-600",
            "\n          ",
          )}
        >
          <span
            className={"\n              absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300\n              ".concat(
              isOn ? "left-7" : "left-1",
              "\n            ",
            )}
          />
        </button>
      </div>
    );
  };
  // Render thermostat controls
  var renderThermostatControls = function () {
    var _a, _b, _c;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-4xl font-bold text-white">{temperature}°</div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={function () {
              return handleTemperatureChange(temperature - 1);
            }}
            className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center"
          >
            -
          </button>

          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gray-900/80 flex items-center justify-center">
              <div className="text-4xl font-bold text-white">
                {temperature}°
              </div>
            </div>
          </div>

          <button
            onClick={function () {
              return handleTemperatureChange(temperature + 1);
            }}
            className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center"
          >
            +
          </button>
        </div>

        <div className="flex justify-around">
          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ mode: "heat" });
            }}
            className={"px-3 py-1 rounded ".concat(
              ((_a = device.state) === null || _a === void 0
                ? void 0
                : _a.mode) === "heat"
                ? "bg-red-500"
                : "bg-gray-700",
              " text-white",
            )}
          >
            Heat
          </button>
          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ mode: "cool" });
            }}
            className={"px-3 py-1 rounded ".concat(
              ((_b = device.state) === null || _b === void 0
                ? void 0
                : _b.mode) === "cool"
                ? "bg-blue-500"
                : "bg-gray-700",
              " text-white",
            )}
          >
            Cool
          </button>
          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ mode: "auto" });
            }}
            className={"px-3 py-1 rounded ".concat(
              ((_c = device.state) === null || _c === void 0
                ? void 0
                : _c.mode) === "auto"
                ? "bg-green-500"
                : "bg-gray-700",
              " text-white",
            )}
          >
            Auto
          </button>
        </div>
      </div>
    );
  };
  // Render lock controls
  var renderLockControls = function () {
    return (
      <div className="flex flex-col items-center justify-center">
        <button
          onClick={handleLockToggle}
          disabled={loading}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mb-4"
        >
          <svg
            className={"w-12 h-12 ".concat(
              isLocked ? "text-blue-500" : "text-gray-400",
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isLocked ? (
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            ) : (
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
            )}
          </svg>
        </button>

        <div className="text-white text-lg font-medium">
          {isLocked ? "Locked" : "Unlocked"}
        </div>
      </div>
    );
  };
  // Render camera controls
  var renderCameraControls = function () {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">Camera Feed</span>
          </div>
        </div>

        <div className="flex justify-around">
          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ recording: true });
            }}
            className="px-3 py-1 rounded bg-red-500 text-white flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <circle cx="10" cy="10" r="6" />
            </svg>
            Record
          </button>

          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ snapshot: true });
            }}
            className="px-3 py-1 rounded bg-blue-500 text-white flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            Snapshot
          </button>
        </div>
      </div>
    );
  };
  // Render alarm controls
  var renderAlarmControls = function () {
    var _a, _b, _c, _d, _e, _f, _g;
    return (
      <div className="space-y-4">
        <div className="flex justify-around">
          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ armed: true, mode: "away" });
            }}
            className={"px-4 py-2 rounded ".concat(
              ((_a = device.state) === null || _a === void 0
                ? void 0
                : _a.armed) &&
                ((_b = device.state) === null || _b === void 0
                  ? void 0
                  : _b.mode) === "away"
                ? "bg-red-500"
                : "bg-gray-700",
              " text-white",
            )}
          >
            Arm Away
          </button>

          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ armed: true, mode: "home" });
            }}
            className={"px-4 py-2 rounded ".concat(
              ((_c = device.state) === null || _c === void 0
                ? void 0
                : _c.armed) &&
                ((_d = device.state) === null || _d === void 0
                  ? void 0
                  : _d.mode) === "home"
                ? "bg-yellow-500"
                : "bg-gray-700",
              " text-white",
            )}
          >
            Arm Home
          </button>

          <button
            onClick={function () {
              return onControl === null || onControl === void 0
                ? void 0
                : onControl({ armed: false, mode: "disarmed" });
            }}
            className={"px-4 py-2 rounded ".concat(
              !((_e = device.state) === null || _e === void 0
                ? void 0
                : _e.armed)
                ? "bg-green-500"
                : "bg-gray-700",
              " text-white",
            )}
          >
            Disarm
          </button>
        </div>

        <div className="text-center text-white">
          Status:{" "}
          <span className="font-bold">
            {((_f = device.state) === null || _f === void 0 ? void 0 : _f.armed)
              ? "Armed (".concat(
                  (_g = device.state) === null || _g === void 0
                    ? void 0
                    : _g.mode,
                  ")",
                )
              : "Disarmed"}
          </span>
        </div>
      </div>
    );
  };
  // Render generic controls
  var renderGenericControls = function () {
    return (
      <div className="text-center text-gray-400">
        <p>No specific controls available for this device type.</p>
        <p className="text-sm">Device type: {device.type}</p>
      </div>
    );
  };
  return (
    <GlassmorphicCard_1.default className={"p-6 ".concat(className)}>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
          {renderDeviceIcon()}
        </div>

        <div>
          <h3 className="text-xl font-bold text-white">{device.name}</h3>
          <p className="text-gray-300 text-sm">
            {device.manufacturer} {device.model}
          </p>
        </div>
      </div>

      {renderControls()}
    </GlassmorphicCard_1.default>
  );
  // Helper function to render device icon
  function renderDeviceIcon() {
    switch (device.type) {
      case "light":
        return (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        );
      case "switch":
        return (
          <svg
            className="w-6 h-6 text-white"
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
            className="w-6 h-6 text-white"
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
      case "lock":
        return (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "camera":
        return (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "alarm":
        return (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6 text-white"
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
};
exports.default = DeviceControlPanel;

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAutomator = void 0;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var button_1 = require("./ui/button");
var switch_1 = require("./ui/switch");
var select_1 = require("./ui/select");
var input_1 = require("./ui/input");
var DeviceSelector_1 = require("./DeviceSelector");
var lucide_react_1 = require("lucide-react");
var luxon_1 = require("luxon");
var SceneAutomator = function (_a) {
  var _b;
  var automation = _a.automation,
    onChange = _a.onChange;
  var _c = (0, react_1.useState)(
      (_b =
        automation === null || automation === void 0
          ? void 0
          : automation.enabled) !== null && _b !== void 0
        ? _b
        : false,
    ),
    enabled = _c[0],
    setEnabled = _c[1];
  var _d = (0, react_1.useState)(
      (automation === null || automation === void 0
        ? void 0
        : automation.type) || "device",
    ),
    type = _d[0],
    setType = _d[1];
  var _e = (0, react_1.useState)(
      (automation === null || automation === void 0
        ? void 0
        : automation.trigger) || {},
    ),
    trigger = _e[0],
    setTrigger = _e[1];
  (0, react_1.useEffect)(
    function () {
      if (enabled) {
        var newAutomation = {
          id:
            (automation === null || automation === void 0
              ? void 0
              : automation.id) || crypto.randomUUID(),
          type: type,
          trigger: trigger,
          enabled: enabled,
          lastTriggered:
            automation === null || automation === void 0
              ? void 0
              : automation.lastTriggered,
        };
        onChange(newAutomation);
      } else {
        onChange(undefined);
      }
    },
    [type, trigger, enabled],
  );
  var renderTriggerConfig = function () {
    var _a, _b, _c, _d, _e;
    switch (type) {
      case "device":
        return (
          <div className="space-y-4">
            <DeviceSelector_1.DeviceSelector
              selectedDevices={
                trigger.deviceId ? [{ deviceId: trigger.deviceId }] : []
              }
              onDeviceSelect={function (device) {
                return setTrigger(
                  __assign(__assign({}, trigger), { deviceId: device.id }),
                );
              }}
              singleSelect
            />
            {trigger.deviceId && (
              <>
                <select_1.Select
                  value={trigger.condition || ""}
                  onValueChange={function (value) {
                    return setTrigger(
                      __assign(__assign({}, trigger), { condition: value }),
                    );
                  }}
                  options={[
                    { value: "on", label: "Turned On" },
                    { value: "off", label: "Turned Off" },
                    { value: "motion", label: "Motion Detected" },
                    { value: "noMotion", label: "No Motion" },
                    { value: "brightness", label: "Brightness Level" },
                    { value: "temperature", label: "Temperature Level" },
                  ]}
                  placeholder="Select condition..."
                />

                {["brightness", "temperature"].includes(
                  trigger.condition || "",
                ) && (
                  <div className="space-y-2">
                    <input_1.Input
                      type="number"
                      value={trigger.value || ""}
                      onChange={function (e) {
                        return setTrigger(
                          __assign(__assign({}, trigger), {
                            value: Number(e.target.value),
                          }),
                        );
                      }}
                      placeholder={"Enter ".concat(
                        trigger.condition,
                        " value...",
                      )}
                      min={0}
                      max={trigger.condition === "brightness" ? 100 : 100}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      case "time":
        return (
          <div className="space-y-4">
            <input_1.Input
              type="time"
              value={trigger.time || ""}
              onChange={function (e) {
                return setTrigger(
                  __assign(__assign({}, trigger), { time: e.target.value }),
                );
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
        );
      case "location":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60">Latitude</label>
                <input_1.Input
                  type="number"
                  value={
                    ((_a = trigger.location) === null || _a === void 0
                      ? void 0
                      : _a.latitude) || ""
                  }
                  onChange={function (e) {
                    return setTrigger(
                      __assign(__assign({}, trigger), {
                        location: __assign(__assign({}, trigger.location), {
                          latitude: Number(e.target.value),
                        }),
                      }),
                    );
                  }}
                  step="0.000001"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Longitude</label>
                <input_1.Input
                  type="number"
                  value={
                    ((_b = trigger.location) === null || _b === void 0
                      ? void 0
                      : _b.longitude) || ""
                  }
                  onChange={function (e) {
                    return setTrigger(
                      __assign(__assign({}, trigger), {
                        location: __assign(__assign({}, trigger.location), {
                          longitude: Number(e.target.value),
                        }),
                      }),
                    );
                  }}
                  step="0.000001"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-white/60">Radius (meters)</label>
              <input_1.Input
                type="number"
                value={
                  ((_c = trigger.location) === null || _c === void 0
                    ? void 0
                    : _c.radius) || ""
                }
                onChange={function (e) {
                  return setTrigger(
                    __assign(__assign({}, trigger), {
                      location: __assign(__assign({}, trigger.location), {
                        radius: Number(e.target.value),
                      }),
                    }),
                  );
                }}
                min={1}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
        );
      case "weather":
        return (
          <div className="space-y-4">
            <select_1.Select
              value={
                ((_d = trigger.weather) === null || _d === void 0
                  ? void 0
                  : _d.condition) || ""
              }
              onValueChange={function (value) {
                return setTrigger(
                  __assign(__assign({}, trigger), {
                    weather: __assign(__assign({}, trigger.weather), {
                      condition: value,
                    }),
                  }),
                );
              }}
              options={[
                { value: "temperature", label: "Temperature" },
                { value: "humidity", label: "Humidity" },
                { value: "precipitation", label: "Precipitation" },
                { value: "cloudCover", label: "Cloud Cover" },
                { value: "sunsetTime", label: "Sunset Time" },
                { value: "sunriseTime", label: "Sunrise Time" },
              ]}
              placeholder="Select weather condition..."
            />

            {((_e = trigger.weather) === null || _e === void 0
              ? void 0
              : _e.condition) && (
              <input_1.Input
                type={
                  ["sunsetTime", "sunriseTime"].includes(
                    trigger.weather.condition,
                  )
                    ? "time"
                    : "number"
                }
                value={trigger.weather.value || ""}
                onChange={function (e) {
                  return setTrigger(
                    __assign(__assign({}, trigger), {
                      weather: __assign(__assign({}, trigger.weather), {
                        value: e.target.value,
                      }),
                    }),
                  );
                }}
                placeholder={"Enter ".concat(
                  trigger.weather.condition,
                  " value...",
                )}
                className="bg-white/5 border-white/10"
              />
            )}
          </div>
        );
      case "custom":
        return (
          <div className="space-y-4">
            <textarea
              value={trigger.customLogic || ""}
              onChange={function (e) {
                return setTrigger(
                  __assign(__assign({}, trigger), {
                    customLogic: e.target.value,
                  }),
                );
              }}
              placeholder="Enter custom JavaScript logic..."
              className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-white/90"
            />
          </div>
        );
    }
  };
  return (
    <GlassmorphicCard_1.default className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Automation</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/60">Enable Automation</span>
          <switch_1.Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {enabled && (
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Automation Type */}
          <div className="grid grid-cols-5 gap-4">
            <button_1.Button
              variant={type === "device" ? "default" : "outline"}
              onClick={function () {
                return setType("device");
              }}
              className="flex flex-col items-center p-4"
            >
              <lucide_react_1.Device className="w-6 h-6 mb-2" />
              <span>Device</span>
            </button_1.Button>
            <button_1.Button
              variant={type === "time" ? "default" : "outline"}
              onClick={function () {
                return setType("time");
              }}
              className="flex flex-col items-center p-4"
            >
              <lucide_react_1.Toggle className="w-6 h-6 mb-2" />
              <span>Time</span>
            </button_1.Button>
            <button_1.Button
              variant={type === "location" ? "default" : "outline"}
              onClick={function () {
                return setType("location");
              }}
              className="flex flex-col items-center p-4"
            >
              <lucide_react_1.MapPin className="w-6 h-6 mb-2" />
              <span>Location</span>
            </button_1.Button>
            <button_1.Button
              variant={type === "weather" ? "default" : "outline"}
              onClick={function () {
                return setType("weather");
              }}
              className="flex flex-col items-center p-4"
            >
              <lucide_react_1.Cloud className="w-6 h-6 mb-2" />
              <span>Weather</span>
            </button_1.Button>
            <button_1.Button
              variant={type === "custom" ? "default" : "outline"}
              onClick={function () {
                return setType("custom");
              }}
              className="flex flex-col items-center p-4"
            >
              <lucide_react_1.Code className="w-6 h-6 mb-2" />
              <span>Custom</span>
            </button_1.Button>
          </div>

          {/* Trigger Configuration */}
          <div className="mt-6">{renderTriggerConfig()}</div>

          {/* Last Triggered */}
          {(automation === null || automation === void 0
            ? void 0
            : automation.lastTriggered) && (
            <div className="text-sm text-white/60">
              Last triggered:{" "}
              {luxon_1.DateTime.fromISO(
                automation.lastTriggered,
              ).toLocaleString(luxon_1.DateTime.DATETIME_FULL)}
            </div>
          )}
        </framer_motion_1.motion.div>
      )}
    </GlassmorphicCard_1.default>
  );
};
exports.SceneAutomator = SceneAutomator;

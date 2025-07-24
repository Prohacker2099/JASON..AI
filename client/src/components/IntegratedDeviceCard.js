"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var switch_1 = require("./ui/switch");
var slider_1 = require("./ui/slider");
var lucide_react_1 = require("lucide-react");
var IntegratedDeviceCard = function (_a) {
  var device = _a.device,
    onControl = _a.onControl;
  var handlePowerToggle = function (checked) {
    onControl(device.id, { on: checked });
  };
  var handleBrightnessChange = function (value) {
    onControl(device.id, { brightness: value[0] });
  };
  var getDeviceIcon = function () {
    switch (device.type) {
      case "light":
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case "switch":
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "thermostat":
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        );
      default:
        return <lucide_react_1.Settings className="h-6 w-6" />;
    }
  };
  var getColorStyle = function () {
    if (device.capabilities.includes("color") && device.state.color) {
      var _a = device.state.color,
        h = _a.h,
        s = _a.s,
        v = _a.v;
      return {
        backgroundColor: "hsla("
          .concat(h, ", ")
          .concat(s, "%, ")
          .concat(v, "%, 0.3)"),
        borderColor: "hsla("
          .concat(h, ", ")
          .concat(s, "%, ")
          .concat(v, "%, 0.5)"),
      };
    }
    return {};
  };
  return (
    <card_1.Card
      className="overflow-hidden transition-all hover:shadow-md"
      style={getColorStyle()}
    >
      <card_1.CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={"p-2 rounded-full mr-3 ".concat(
                device.state.on
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400",
              )}
            >
              {getDeviceIcon()}
            </div>
            <div>
              <h3 className="font-medium">{device.name}</h3>
              <p className="text-xs text-gray-500">
                {device.manufacturer} • {device.serviceName || device.serviceId}
              </p>
            </div>
          </div>
          <switch_1.Switch
            checked={device.state.on || false}
            onCheckedChange={handlePowerToggle}
          />
        </div>

        {device.capabilities.includes("brightness") && device.state.on && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Brightness</span>
              <span className="text-xs font-medium">
                {device.state.brightness || 0}%
              </span>
            </div>
            <slider_1.Slider
              value={[device.state.brightness || 0]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleBrightnessChange}
            />
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button_1.Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={function () {
              return onControl(device.id, { refresh: true });
            }}
          >
            <lucide_react_1.RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </button_1.Button>

          <button_1.Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={function () {
              return onControl(device.id, { on: !device.state.on });
            }}
          >
            <lucide_react_1.Power className="h-3 w-3 mr-1" />
            {device.state.on ? "Turn Off" : "Turn On"}
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>
  );
};
exports.default = IntegratedDeviceCard;

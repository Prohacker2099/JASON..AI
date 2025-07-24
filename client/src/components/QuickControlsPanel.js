"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QuickControlsPanel;
var HexButton_1 = require("./HexButton");
function QuickControlsPanel(_a) {
  var controls = _a.controls,
    onControlClick = _a.onControlClick;
  var getControlColor = function (type) {
    switch (type) {
      case "security":
        return "#00FFFF"; // cyber blue
      case "home":
        return "#00FF00"; // matrix green
      case "data":
        return "#FF0066"; // neon pink
      case "settings":
        return "#FF3300"; // warning red
      default:
        return "#00FFFF";
    }
  };
  return (
    <div className="holographic-panel rounded-xl p-5 glow-border">
      <h3 className="text-lg font-medium text-[#00FFFF] mb-3">
        Quick Controls
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {controls.map(function (control) {
          return (
            <HexButton_1.default
              key={control.id}
              icon={control.icon}
              label={control.name}
              color={getControlColor(control.type)}
              onClick={function () {
                return onControlClick(control.id);
              }}
            />
          );
        })}
      </div>

      <button className="w-full bg-[#00FFFF]/20 hover:bg-[#00FFFF]/30 text-[#00FFFF] py-2 rounded-lg mt-3 text-sm font-medium transition-all">
        Voice Command
      </button>
    </div>
  );
}

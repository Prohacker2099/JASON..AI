"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HexButton;
function HexButton(_a) {
  var icon = _a.icon,
    label = _a.label,
    color = _a.color,
    onClick = _a.onClick;
  return (
    <button
      className="hex-button bg-[#1A1A1A]/40 p-3 flex flex-col items-center focus:outline-none"
      onClick={onClick}
    >
      <i
        className={"ri-".concat(icon, " text-xl")}
        style={{ color: color }}
      ></i>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CircularProgress;
function CircularProgress(_a) {
  var percentage = _a.percentage,
    color = _a.color,
    _b = _a.size,
    size = _b === void 0 ? 40 : _b;
  // Calculate stroke dash offset based on percentage (0-100)
  var radius = 50;
  var circumference = 2 * Math.PI * radius;
  var strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="animate-pulse-slow"
        />
      </svg>
    </div>
  );
}

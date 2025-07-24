"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SystemMetricCard;
var CircularProgress_1 = require("./CircularProgress");
function SystemMetricCard(_a) {
  var metric = _a.metric;
  return (
    <div className="bg-[#1A1A1A]/40 rounded-lg p-3 hover:bg-[#1A1A1A]/60 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs text-gray-400">{metric.name}</h4>
          <p className="text-xl font-bold" style={{ color: metric.color }}>
            {metric.value}
          </p>
        </div>
        <CircularProgress_1.default
          percentage={metric.percentage || 0}
          color={metric.color}
        />
      </div>
      <div className="mt-2 text-xs text-gray-400 font-['JetBrains_Mono']">
        <span>{metric.description}</span>
      </div>
    </div>
  );
}

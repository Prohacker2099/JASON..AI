"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightsPanel;
var react_1 = require("react");
function InsightsPanel(_a) {
  var insights = _a.insights,
    onAction = _a.onAction;
  var getTypeColor = function (type) {
    switch (type) {
      case "prediction":
        return "#00FFFF";
      case "suggestion":
        return "#00FF00";
      case "alert":
        return "#FF3300";
      default:
        return "#FFFFFF";
    }
  };
  return (
    <div className="holographic-panel rounded-xl p-4 glow-border">
      <h3 className="text-lg font-medium text-[#00FFFF] mb-3">AI Insights</h3>

      <div className="space-y-3">
        {insights.map(function (insight) {
          return (
            <div
              key={insight.id}
              className="bg-[#1A1A1A]/60 rounded-lg p-3 backdrop-blur-sm"
            >
              <div className="flex items-center mb-2">
                <div
                  className="h-2 w-2 rounded-full mr-2"
                  style={{ backgroundColor: getTypeColor(insight.type) }}
                ></div>
                <span
                  className="text-sm font-medium"
                  style={{ color: getTypeColor(insight.type) }}
                >
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </span>
              </div>

              <p className="text-white/90 mb-2">{insight.content}</p>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1 rounded-lg text-xs bg-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF]/30"
                  onClick={function () {
                    return onAction(insight.id, "apply");
                  }}
                >
                  Apply
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-xs bg-[#1A1A1A]/60 text-gray-400 hover:bg-[#1A1A1A]/80"
                  onClick={function () {
                    return onAction(insight.id, "dismiss");
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}

        {insights.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            No insights available yet
          </div>
        )}
      </div>
    </div>
  );
}

"use strict";
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightPanel;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
function InsightPanel(_a) {
  var insights = _a.insights,
    onInsightAction = _a.onInsightAction;
  var _b = (0, react_1.useState)("all"),
    selectedCategory = _b[0],
    setSelectedCategory = _b[1];
  var _c = (0, react_1.useState)([]),
    filteredInsights = _c[0],
    setFilteredInsights = _c[1];
  (0, react_1.useEffect)(
    function () {
      setFilteredInsights(
        selectedCategory === "all"
          ? insights
          : insights.filter(function (insight) {
              return insight.category === selectedCategory;
            }),
      );
    },
    [insights, selectedCategory],
  );
  var getInsightColor = function (type) {
    switch (type) {
      case "prediction":
        return "#00FFFF"; // cyber blue
      case "suggestion":
        return "#00FF00"; // matrix green
      case "alert":
        return "#FF3300"; // warning red
      case "optimization":
        return "#FF0066"; // neon pink
      default:
        return "#00FFFF";
    }
  };
  var categories = __spreadArray(
    ["all"],
    new Set(
      insights.map(function (i) {
        return i.category;
      }),
    ),
    true,
  );
  return (
    <div className="holographic-panel rounded-xl p-5 glow-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-[#00FFFF]">AI Insights</h3>
        <div className="flex space-x-2">
          {categories.map(function (category) {
            return (
              <button
                key={category}
                className={"px-3 py-1 rounded-lg text-sm transition-all ".concat(
                  selectedCategory === category
                    ? "bg-[#00FFFF]/20 text-[#00FFFF]"
                    : "bg-[#1A1A1A]/60 text-gray-400 hover:bg-[#1A1A1A]/80",
                )}
                onClick={function () {
                  return setSelectedCategory(category);
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <framer_motion_1.AnimatePresence>
          {filteredInsights.map(function (insight) {
            return (
              <framer_motion_1.motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative bg-[#1A1A1A]/60 rounded-lg p-4 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: getInsightColor(insight.type),
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: getInsightColor(insight.type) }}
                      >
                        {insight.type.charAt(0).toUpperCase() +
                          insight.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-white/90">{insight.content}</p>
                  </div>

                  {insight.actionable && (
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={function () {
                          return onInsightAction(insight.id, "apply");
                        }}
                        className="px-3 py-1 rounded-lg text-sm bg-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF]/30 transition-all"
                      >
                        Apply
                      </button>
                      <button
                        onClick={function () {
                          return onInsightAction(insight.id, "dismiss");
                        }}
                        className="px-3 py-1 rounded-lg text-sm bg-[#1A1A1A]/60 text-gray-400 hover:bg-[#1A1A1A]/80 transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

                <div className="absolute top-2 right-2">
                  <div className="flex items-center space-x-1">
                    <div className="text-xs text-gray-400">Priority</div>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3].map(function (level) {
                        return (
                          <div
                            key={level}
                            className={"h-1.5 w-1.5 rounded-full ".concat(
                              level <= insight.priority
                                ? "bg-[#00FFFF]"
                                : "bg-gray-600",
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            );
          })}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>
  );
}

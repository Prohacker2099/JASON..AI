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
exports.default = CatalystPanel;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
function CatalystPanel(_a) {
  var catalysts = _a.catalysts,
    onCatalystActivate = _a.onCatalystActivate;
  var _b = (0, react_1.useState)("all"),
    activeCategory = _b[0],
    setActiveCategory = _b[1];
  var filteredCatalysts =
    activeCategory === "all"
      ? catalysts
      : catalysts.filter(function (c) {
          return c.category === activeCategory;
        });
  var categories = __spreadArray(
    ["all"],
    new Set(
      catalysts.map(function (c) {
        return c.category;
      }),
    ),
    true,
  );
  var getCatalystColor = function (type) {
    switch (type) {
      case "automation":
        return "#00FFFF"; // cyber blue
      case "creativity":
        return "#FF0066"; // neon pink
      case "productivity":
        return "#00FF00"; // matrix green
      case "wellness":
        return "#FFB700"; // amber
      default:
        return "#00FFFF";
    }
  };
  var getImpactIndicator = function (impact) {
    switch (impact) {
      case "high":
        return Array(3).fill(0);
      case "medium":
        return Array(2).fill(0);
      case "low":
        return Array(1).fill(0);
      default:
        return [];
    }
  };
  return (
    <div className="holographic-panel rounded-xl p-5 glow-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-[#00FFFF]">Catalysts</h3>
        <div className="flex space-x-2">
          {categories.map(function (category) {
            return (
              <button
                key={category}
                className={"px-3 py-1 rounded-lg text-sm transition-all ".concat(
                  activeCategory === category
                    ? "bg-[#00FFFF]/20 text-[#00FFFF]"
                    : "bg-[#1A1A1A]/60 text-gray-400 hover:bg-[#1A1A1A]/80",
                )}
                onClick={function () {
                  return setActiveCategory(category);
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filteredCatalysts.map(function (catalyst) {
          return (
            <framer_motion_1.motion.div
              key={catalyst.id}
              whileHover={{ scale: 1.03 }}
              className="bg-[#1A1A1A]/60 rounded-lg p-4 backdrop-blur-sm cursor-pointer border border-transparent hover:border-[#00FFFF]/30 transition-all"
              onClick={function () {
                return onCatalystActivate(catalyst.id);
              }}
            >
              <div className="flex items-start mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{
                    backgroundColor: "".concat(
                      getCatalystColor(catalyst.type),
                      "20",
                    ),
                  }}
                >
                  <i
                    className={"".concat(catalyst.icon, " text-xl")}
                    style={{ color: getCatalystColor(catalyst.type) }}
                  ></i>
                </div>

                <div className="flex-1">
                  <h4 className="font-medium text-white">{catalyst.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-xs"
                      style={{ color: getCatalystColor(catalyst.type) }}
                    >
                      {catalyst.type.charAt(0).toUpperCase() +
                        catalyst.type.slice(1)}
                    </span>

                    <div className="flex space-x-0.5">
                      {getImpactIndicator(catalyst.impact).map(function (_, i) {
                        return (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: getCatalystColor(catalyst.type),
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-300 line-clamp-2">
                {catalyst.description}
              </p>

              <div className="mt-3 flex justify-end">
                <button className="px-3 py-1 rounded-lg text-xs bg-[#00FFFF]/10 text-[#00FFFF] hover:bg-[#00FFFF]/20 transition-all">
                  Activate
                </button>
              </div>
            </framer_motion_1.motion.div>
          );
        })}
      </div>
    </div>
  );
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CatalystsPanel;
var react_1 = require("react");
function CatalystsPanel(_a) {
  var catalysts = _a.catalysts,
    onActivate = _a.onActivate;
  var getTypeColor = function (type) {
    switch (type) {
      case "automation":
        return "#00FFFF";
      case "creativity":
        return "#FF0066";
      case "productivity":
        return "#00FF00";
      case "wellness":
        return "#FFB700";
      default:
        return "#FFFFFF";
    }
  };
  return (
    <div className="holographic-panel rounded-xl p-4 glow-border">
      <h3 className="text-lg font-medium text-[#00FFFF] mb-3">Catalysts</h3>

      <div className="grid grid-cols-2 gap-3">
        {catalysts.map(function (catalyst) {
          return (
            <div
              key={catalyst.id}
              className="bg-[#1A1A1A]/60 rounded-lg p-3 backdrop-blur-sm cursor-pointer hover:bg-[#1A1A1A]/80"
              onClick={function () {
                return onActivate(catalyst.id);
              }}
            >
              <div className="flex items-center mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-2"
                  style={{
                    backgroundColor: "".concat(
                      getTypeColor(catalyst.type),
                      "20",
                    ),
                  }}
                >
                  <i
                    className={"".concat(catalyst.icon, " text-lg")}
                    style={{ color: getTypeColor(catalyst.type) }}
                  ></i>
                </div>
                <span className="font-medium text-white">{catalyst.name}</span>
              </div>

              <p className="text-sm text-gray-300 line-clamp-2">
                {catalyst.description}
              </p>

              <div className="mt-2 text-right">
                <button className="px-3 py-1 rounded-lg text-xs bg-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF]/30">
                  Activate
                </button>
              </div>
            </div>
          );
        })}

        {catalysts.length === 0 && (
          <div className="text-center py-6 text-gray-400 col-span-2">
            No catalysts available yet
          </div>
        )}
      </div>
    </div>
  );
}

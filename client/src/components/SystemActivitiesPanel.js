"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SystemActivitiesPanel;
var date_fns_1 = require("date-fns");
function SystemActivitiesPanel(_a) {
  var activities = _a.activities;
  var getActivityIcon = function (type) {
    switch (type) {
      case "security":
        return "ri-alarm-warning-line text-[#FF0066]";
      case "home":
        return "ri-home-gear-line text-[#00FF00]";
      case "learning":
        return "ri-user-heart-line text-[#00FFFF]";
      case "warning":
        return "ri-battery-low-line text-[#FF3300]";
      default:
        return "ri-information-line text-[#00FFFF]";
    }
  };
  var getActivityBackground = function (type) {
    switch (type) {
      case "security":
        return "bg-[#FF0066]/20";
      case "home":
        return "bg-[#00FF00]/20";
      case "learning":
        return "bg-[#00FFFF]/20";
      case "warning":
        return "bg-[#FF3300]/20";
      default:
        return "bg-[#00FFFF]/20";
    }
  };
  return (
    <div className="holographic-panel rounded-xl p-5 glow-border">
      <h3 className="text-lg font-medium text-[#00FFFF] mb-3">
        System Activities
      </h3>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {activities.map(function (activity) {
          return (
            <div key={activity.id} className="bg-[#1A1A1A]/40 p-3 rounded-lg">
              <div className="flex items-start">
                <div
                  className={"h-8 w-8 flex items-center justify-center ".concat(
                    getActivityBackground(activity.type),
                    " rounded-full mr-3",
                  )}
                >
                  <i className={getActivityIcon(activity.type)}></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <p className="text-xs text-gray-400">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(0, date_fns_1.formatDistanceToNow)(activity.timestamp, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

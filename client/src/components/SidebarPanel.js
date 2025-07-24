"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SidebarPanel;
var AvatarPanel_1 = require("./AvatarPanel");
var SystemActivitiesPanel_1 = require("./SystemActivitiesPanel");
var QuickControlsPanel_1 = require("./QuickControlsPanel");
var ServiceConnectionStatus_1 = require("./ServiceConnectionStatus");
function SidebarPanel(_a) {
  var activities = _a.activities,
    quickControls = _a.quickControls,
    onControlClick = _a.onControlClick;
  return (
    <aside className="lg:col-span-4 grid grid-cols-1 gap-6">
      <AvatarPanel_1.default />
      <ServiceConnectionStatus_1.default />
      <SystemActivitiesPanel_1.default activities={activities} />
      <QuickControlsPanel_1.default
        controls={quickControls}
        onControlClick={onControlClick}
      />
    </aside>
  );
}

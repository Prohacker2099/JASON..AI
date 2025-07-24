"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var switch_1 = require("./ui/switch");
var alert_1 = require("./ui/alert");
var lucide_react_1 = require("lucide-react");
var GoogleAssistantSetup = function (_a) {
  var enabled = _a.enabled,
    onToggle = _a.onToggle,
    isLoading = _a.isLoading;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            Google Assistant Local Integration
          </h3>
          <p className="text-sm text-gray-500">
            Enable local discovery and control of JASON devices by Google
            Assistant.
          </p>
        </div>
        <switch_1.Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={isLoading}
        />
      </div>

      {enabled && (
        <alert_1.Alert>
          <lucide_react_1.InfoIcon className="h-4 w-4" />
          <alert_1.AlertTitle>How to connect</alert_1.AlertTitle>
          <alert_1.AlertDescription>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Open the Google Home app on your mobile device</li>
              <li>Tap the "+" icon in the top left corner</li>
              <li>Select "Set up device" then "Works with Google"</li>
              <li>Search for "JASON" in the list of services</li>
              <li>Follow the instructions to complete the setup</li>
              <li>Your JASON-controlled devices will appear in Google Home</li>
            </ol>
            <p className="mt-2 text-sm">
              This integration uses local discovery protocols so Google
              Assistant can find and control your devices without requiring you
              to share your credentials with JASON.
            </p>
          </alert_1.AlertDescription>
        </alert_1.Alert>
      )}
    </div>
  );
};
exports.default = GoogleAssistantSetup;

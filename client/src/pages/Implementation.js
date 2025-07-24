"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var tabs_1 = require("../components/ui/tabs");
var DeviceIntegrationPanel_1 = require("../components/DeviceIntegrationPanel");
var AILearningPanel_1 = require("../components/AILearningPanel");
var DataDividendPanel_1 = require("../components/DataDividendPanel");
var DeveloperMarketplacePanel_1 = require("../components/DeveloperMarketplacePanel");
var HardwareHubPanel_1 = require("../components/HardwareHubPanel");
var Implementation = function () {
  var _a = (0, react_1.useState)("device-integration"),
    activeTab = _a[0],
    setActiveTab = _a[1];
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">JASON Implementation</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Explore the implementation of JASON's five key expansion areas
        </p>
      </div>

      <tabs_1.Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <tabs_1.TabsList className="grid grid-cols-5 mb-8">
          <tabs_1.TabsTrigger value="device-integration">
            Device Integration
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="ai-learning">
            AI Learning
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="data-dividend">
            Data Dividend
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="marketplace">
            Marketplace
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="hardware">Hardware Hub</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="device-integration">
          <DeviceIntegrationPanel_1.default />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="ai-learning">
          <AILearningPanel_1.default />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="data-dividend">
          <DataDividendPanel_1.default />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="marketplace">
          <DeveloperMarketplacePanel_1.default />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="hardware">
          <HardwareHubPanel_1.default />
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>
  );
};
exports.default = Implementation;

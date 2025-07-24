"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var IntegratedDevicesPanel_1 = require("../components/IntegratedDevicesPanel");
var IntegratedDevices = function () {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Integrated Devices</h1>
      <IntegratedDevicesPanel_1.default />
    </div>
  );
};
exports.default = IntegratedDevices;

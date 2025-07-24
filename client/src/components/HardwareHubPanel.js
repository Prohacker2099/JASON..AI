"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var badge_1 = require("./ui/badge");
var progress_1 = require("./ui/progress");
var tabs_1 = require("./ui/tabs");
var lucide_react_1 = require("lucide-react");
var roadmapService_1 = require("../lib/roadmapService");
var HardwareHubPanel = function () {
  var _a, _b, _c, _d;
  var _e = (0, react_1.useState)("devices"),
    activeTab = _e[0],
    setActiveTab = _e[1];
  var _f = (0, react_1.useState)(true),
    loading = _f[0],
    setLoading = _f[1];
  var _g = (0, react_1.useState)(null),
    updating = _g[0],
    setUpdating = _g[1];
  var _h = (0, react_1.useState)(null),
    error = _h[0],
    setError = _h[1];
  var _j = (0, react_1.useState)([]),
    devices = _j[0],
    setDevices = _j[1];
  var _k = (0, react_1.useState)([]),
    firmwareVersions = _k[0],
    setFirmwareVersions = _k[1];
  var _l = (0, react_1.useState)(null),
    selectedDevice = _l[0],
    setSelectedDevice = _l[1];
  var _m = (0, react_1.useState)(null),
    healthReport = _m[0],
    setHealthReport = _m[1];
  // Mock owner ID for demo purposes
  var ownerId = "user-123";
  (0, react_1.useEffect)(function () {
    fetchData();
  }, []);
  var fetchData = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var devicesData, device, firmwareData, healthData, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setLoading(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 6, 7, 8]);
            return [
              4 /*yield*/,
              roadmapService_1.default.getHardwareDevices(ownerId),
            ];
          case 2:
            devicesData = _a.sent();
            setDevices(devicesData.devices || []);
            if (!(devicesData.devices && devicesData.devices.length > 0))
              return [3 /*break*/, 5];
            device = devicesData.devices[0];
            setSelectedDevice(device);
            return [
              4 /*yield*/,
              roadmapService_1.default.getFirmwareVersions(device.model),
            ];
          case 3:
            firmwareData = _a.sent();
            setFirmwareVersions(firmwareData.versions || []);
            return [
              4 /*yield*/,
              roadmapService_1.default.getDeviceHealthReport(device.id),
            ];
          case 4:
            healthData = _a.sent();
            setHealthReport(healthData.healthReport || null);
            _a.label = 5;
          case 5:
            return [3 /*break*/, 8];
          case 6:
            err_1 = _a.sent();
            console.error("Error fetching hardware data:", err_1);
            setError("Failed to load hardware data");
            return [3 /*break*/, 8];
          case 7:
            setLoading(false);
            return [7 /*endfinally*/];
          case 8:
            return [2 /*return*/];
        }
      });
    });
  };
  var selectDevice = function (device) {
    return __awaiter(void 0, void 0, void 0, function () {
      var firmwareData, healthData, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setSelectedDevice(device);
            setLoading(true);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, 5, 6]);
            return [
              4 /*yield*/,
              roadmapService_1.default.getFirmwareVersions(device.model),
            ];
          case 2:
            firmwareData = _a.sent();
            setFirmwareVersions(firmwareData.versions || []);
            return [
              4 /*yield*/,
              roadmapService_1.default.getDeviceHealthReport(device.id),
            ];
          case 3:
            healthData = _a.sent();
            setHealthReport(healthData.healthReport || null);
            return [3 /*break*/, 6];
          case 4:
            err_2 = _a.sent();
            console.error("Error fetching device details:", err_2);
            setError("Failed to load device details");
            return [3 /*break*/, 6];
          case 5:
            setLoading(false);
            return [7 /*endfinally*/];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  var updateFirmware = function (deviceId, version) {
    return __awaiter(void 0, void 0, void 0, function () {
      var err_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setUpdating(deviceId);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [
              4 /*yield*/,
              roadmapService_1.default.updateDeviceFirmware(deviceId, version),
            ];
          case 2:
            _a.sent();
            // In a real implementation, we would listen for update progress events
            // For now, just wait a bit and refresh the device data
            setTimeout(function () {
              return __awaiter(void 0, void 0, void 0, function () {
                var deviceData_1, healthData, err_4;
                return __generator(this, function (_a) {
                  switch (_a.label) {
                    case 0:
                      _a.trys.push([0, 3, 4, 5]);
                      return [
                        4 /*yield*/,
                        roadmapService_1.default.getDeviceDetails(deviceId),
                      ];
                    case 1:
                      deviceData_1 = _a.sent();
                      // Update the device in the devices list
                      setDevices(
                        devices.map(function (d) {
                          return d.id === deviceId ? deviceData_1.device : d;
                        }),
                      );
                      // Update selected device if it's the one being updated
                      if (selectedDevice && selectedDevice.id === deviceId) {
                        setSelectedDevice(deviceData_1.device);
                      }
                      return [
                        4 /*yield*/,
                        roadmapService_1.default.getDeviceHealthReport(
                          deviceId,
                        ),
                      ];
                    case 2:
                      healthData = _a.sent();
                      setHealthReport(healthData.healthReport || null);
                      return [3 /*break*/, 5];
                    case 3:
                      err_4 = _a.sent();
                      console.error("Error refreshing device data:", err_4);
                      return [3 /*break*/, 5];
                    case 4:
                      setUpdating(null);
                      return [7 /*endfinally*/];
                    case 5:
                      return [2 /*return*/];
                  }
                });
              });
            }, 5000);
            return [3 /*break*/, 4];
          case 3:
            err_3 = _a.sent();
            console.error("Error updating firmware:", err_3);
            setError("Failed to update firmware");
            setUpdating(null);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  if (loading && !selectedDevice) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Hardware Hub</card_1.CardTitle>
          <card_1.CardDescription>
            Loading hardware data...
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="flex justify-center py-8">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  if (error && !selectedDevice) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Hardware Hub</card_1.CardTitle>
          <card_1.CardDescription>
            Error loading hardware data
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="text-red-400">{error}</div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button onClick={fetchData}>Retry</button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    );
  }
  return (
    <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
      <card_1.CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <card_1.CardTitle>Hardware Hub</card_1.CardTitle>
            <card_1.CardDescription>
              Designing and manufacturing dedicated hardware for optimal
              performance
            </card_1.CardDescription>
          </div>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-sm font-medium">Your Devices</h3>
            {devices.length > 0 ? (
              <div className="space-y-2">
                {devices.map(function (device, index) {
                  return (
                    <card_1.Card
                      key={index}
                      className={"bg-gray-800/30 border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors ".concat(
                        selectedDevice && selectedDevice.id === device.id
                          ? "border-blue-500"
                          : "",
                      )}
                      onClick={function () {
                        return selectDevice(device);
                      }}
                    >
                      <card_1.CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{device.model}</div>
                            <div className="text-xs text-gray-400">
                              S/N: {device.serialNumber}
                            </div>
                          </div>
                          <badge_1.Badge
                            className={
                              device.status === "online"
                                ? "bg-green-600"
                                : device.status === "updating"
                                  ? "bg-blue-600"
                                  : "bg-red-600"
                            }
                          >
                            {device.status}
                          </badge_1.Badge>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>
                  );
                })}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No hardware devices available
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            {selectedDevice ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {selectedDevice.model}
                  </h3>
                  {updating === selectedDevice.id ? (
                    <badge_1.Badge className="bg-blue-600">
                      Updating Firmware...
                    </badge_1.Badge>
                  ) : (
                    <badge_1.Badge
                      className={
                        selectedDevice.status === "online"
                          ? "bg-green-600"
                          : selectedDevice.status === "updating"
                            ? "bg-blue-600"
                            : "bg-red-600"
                      }
                    >
                      {selectedDevice.status}
                    </badge_1.Badge>
                  )}
                </div>

                <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
                  <tabs_1.TabsList className="grid grid-cols-3 mb-4">
                    <tabs_1.TabsTrigger value="devices">
                      Device Info
                    </tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="health">
                      Health
                    </tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="firmware">
                      Firmware
                    </tabs_1.TabsTrigger>
                  </tabs_1.TabsList>

                  <tabs_1.TabsContent value="devices" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <card_1.Card className="bg-gray-800/30 border-gray-700">
                        <card_1.CardHeader className="pb-2">
                          <card_1.CardTitle className="text-sm flex items-center">
                            <lucide_react_1.HardDrive className="mr-2 h-4 w-4" />
                            Device Information
                          </card_1.CardTitle>
                        </card_1.CardHeader>
                        <card_1.CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Model</span>
                            <span className="text-sm">
                              {selectedDevice.model}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              Serial Number
                            </span>
                            <span className="text-sm">
                              {selectedDevice.serialNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              Firmware
                            </span>
                            <span className="text-sm">
                              {selectedDevice.firmwareVersion}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              Registration Date
                            </span>
                            <span className="text-sm">
                              {new Date(
                                selectedDevice.registrationDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              Last Seen
                            </span>
                            <span className="text-sm">
                              {new Date(
                                selectedDevice.lastSeen,
                              ).toLocaleString()}
                            </span>
                          </div>
                        </card_1.CardContent>
                      </card_1.Card>

                      <card_1.Card className="bg-gray-800/30 border-gray-700">
                        <card_1.CardHeader className="pb-2">
                          <card_1.CardTitle className="text-sm flex items-center">
                            <lucide_react_1.Wifi className="mr-2 h-4 w-4" />
                            Network Information
                          </card_1.CardTitle>
                        </card_1.CardHeader>
                        <card_1.CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              Connection Type
                            </span>
                            <badge_1.Badge variant="outline">
                              {selectedDevice.networkInfo.connectionType}
                            </badge_1.Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              IP Address
                            </span>
                            <span className="text-sm">
                              {selectedDevice.networkInfo.ipAddress || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">
                              MAC Address
                            </span>
                            <span className="text-sm">
                              {selectedDevice.networkInfo.macAddress}
                            </span>
                          </div>
                          {selectedDevice.networkInfo.signalStrength !==
                            undefined && (
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-400">
                                  Signal Strength
                                </span>
                                <span className="text-sm">
                                  {selectedDevice.networkInfo.signalStrength}%
                                </span>
                              </div>
                              <progress_1.Progress
                                value={
                                  selectedDevice.networkInfo.signalStrength
                                }
                                className="h-2"
                              />
                            </div>
                          )}
                        </card_1.CardContent>
                      </card_1.Card>
                    </div>

                    <card_1.Card className="bg-gray-800/30 border-gray-700">
                      <card_1.CardHeader className="pb-2">
                        <card_1.CardTitle className="text-sm flex items-center">
                          <lucide_react_1.Cpu className="mr-2 h-4 w-4" />
                          Capabilities
                        </card_1.CardTitle>
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedDevice.capabilities.map(
                            function (capability, index) {
                              return (
                                <badge_1.Badge key={index} variant="outline">
                                  {capability}
                                </badge_1.Badge>
                              );
                            },
                          )}
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>
                  </tabs_1.TabsContent>

                  <tabs_1.TabsContent value="health" className="space-y-4">
                    {healthReport ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <card_1.Card className="bg-gray-800/30 border-gray-700">
                            <card_1.CardHeader className="pb-2">
                              <card_1.CardTitle className="text-sm">
                                Health Status
                              </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                              <badge_1.Badge
                                className={
                                  healthReport.health.status === "healthy"
                                    ? "bg-green-600"
                                    : "bg-amber-600"
                                }
                              >
                                {healthReport.health.status === "healthy"
                                  ? "Healthy"
                                  : "Needs Attention"}
                              </badge_1.Badge>
                            </card_1.CardContent>
                          </card_1.Card>

                          <card_1.Card className="bg-gray-800/30 border-gray-700">
                            <card_1.CardHeader className="pb-2">
                              <card_1.CardTitle className="text-sm">
                                Warranty
                              </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                              <badge_1.Badge
                                className={
                                  (
                                    (_a = healthReport.registration) === null ||
                                    _a === void 0
                                      ? void 0
                                      : _a.warrantyActive
                                  )
                                    ? "bg-green-600"
                                    : "bg-red-600"
                                }
                              >
                                {(
                                  (_b = healthReport.registration) === null ||
                                  _b === void 0
                                    ? void 0
                                    : _b.warrantyActive
                                )
                                  ? "Active"
                                  : "Expired"}
                              </badge_1.Badge>
                              {((_c = healthReport.registration) === null ||
                              _c === void 0
                                ? void 0
                                : _c.warrantyExpiration) && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Expires:{" "}
                                  {new Date(
                                    healthReport.registration.warrantyExpiration,
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </card_1.CardContent>
                          </card_1.Card>

                          <card_1.Card className="bg-gray-800/30 border-gray-700">
                            <card_1.CardHeader className="pb-2">
                              <card_1.CardTitle className="text-sm">
                                Firmware
                              </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                              <div className="flex items-center">
                                <badge_1.Badge
                                  className={
                                    healthReport.firmware.updateAvailable
                                      ? healthReport.firmware.isCritical
                                        ? "bg-red-600"
                                        : "bg-amber-600"
                                      : "bg-green-600"
                                  }
                                >
                                  {healthReport.firmware.updateAvailable
                                    ? healthReport.firmware.isCritical
                                      ? "Critical Update"
                                      : "Update Available"
                                    : "Up to Date"}
                                </badge_1.Badge>
                              </div>
                              {healthReport.firmware.updateAvailable && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Latest: {healthReport.firmware.latestVersion}
                                </div>
                              )}
                            </card_1.CardContent>
                          </card_1.Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <card_1.Card className="bg-gray-800/30 border-gray-700">
                            <card_1.CardHeader className="pb-2">
                              <card_1.CardTitle className="text-sm flex items-center">
                                <lucide_react_1.Thermometer className="mr-2 h-4 w-4" />
                                Diagnostics
                              </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent className="space-y-3">
                              {healthReport.health.diagnostics.cpuUsage !==
                                undefined && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">
                                      CPU Usage
                                    </span>
                                    <span className="text-sm">
                                      {healthReport.health.diagnostics.cpuUsage}
                                      %
                                    </span>
                                  </div>
                                  <progress_1.Progress
                                    value={
                                      healthReport.health.diagnostics.cpuUsage
                                    }
                                    className={"h-2 ".concat(
                                      healthReport.health.diagnostics.cpuUsage >
                                        80
                                        ? "bg-red-600"
                                        : "",
                                    )}
                                  />
                                </div>
                              )}

                              {healthReport.health.diagnostics.memoryUsage !==
                                undefined && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">
                                      Memory Usage
                                    </span>
                                    <span className="text-sm">
                                      {
                                        healthReport.health.diagnostics
                                          .memoryUsage
                                      }
                                      %
                                    </span>
                                  </div>
                                  <progress_1.Progress
                                    value={
                                      healthReport.health.diagnostics
                                        .memoryUsage
                                    }
                                    className={"h-2 ".concat(
                                      healthReport.health.diagnostics
                                        .memoryUsage > 80
                                        ? "bg-red-600"
                                        : "",
                                    )}
                                  />
                                </div>
                              )}

                              {healthReport.health.diagnostics.storageUsage !==
                                undefined && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">
                                      Storage Usage
                                    </span>
                                    <span className="text-sm">
                                      {
                                        healthReport.health.diagnostics
                                          .storageUsage
                                      }
                                      %
                                    </span>
                                  </div>
                                  <progress_1.Progress
                                    value={
                                      healthReport.health.diagnostics
                                        .storageUsage
                                    }
                                    className={"h-2 ".concat(
                                      healthReport.health.diagnostics
                                        .storageUsage > 80
                                        ? "bg-red-600"
                                        : "",
                                    )}
                                  />
                                </div>
                              )}

                              {healthReport.health.diagnostics.temperature !==
                                undefined && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">
                                      Temperature
                                    </span>
                                    <span className="text-sm">
                                      {
                                        healthReport.health.diagnostics
                                          .temperature
                                      }
                                      °C
                                    </span>
                                  </div>
                                  <progress_1.Progress
                                    value={
                                      (healthReport.health.diagnostics
                                        .temperature /
                                        100) *
                                      100
                                    }
                                    className={"h-2 ".concat(
                                      healthReport.health.diagnostics
                                        .temperature > 70
                                        ? "bg-red-600"
                                        : "",
                                    )}
                                  />
                                </div>
                              )}

                              {healthReport.health.diagnostics.uptime !==
                                undefined && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-400">
                                    Uptime
                                  </span>
                                  <span className="text-sm">
                                    {Math.floor(
                                      healthReport.health.diagnostics.uptime /
                                        86400,
                                    )}
                                    d{" "}
                                    {Math.floor(
                                      (healthReport.health.diagnostics.uptime %
                                        86400) /
                                        3600,
                                    )}
                                    h
                                  </span>
                                </div>
                              )}
                            </card_1.CardContent>
                          </card_1.Card>

                          <card_1.Card className="bg-gray-800/30 border-gray-700">
                            <card_1.CardHeader className="pb-2">
                              <card_1.CardTitle className="text-sm">
                                Issues & Recommendations
                              </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                              {healthReport.health.issues.length > 0 ? (
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">
                                      Issues Detected
                                    </h4>
                                    <ul className="space-y-1">
                                      {healthReport.health.issues.map(
                                        function (issue, index) {
                                          return (
                                            <li
                                              key={index}
                                              className="text-xs text-red-400 flex items-start"
                                            >
                                              <span className="mr-2">•</span>
                                              <span>{issue}</span>
                                            </li>
                                          );
                                        },
                                      )}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-medium mb-1">
                                      Recommended Actions
                                    </h4>
                                    <ul className="space-y-1">
                                      {healthReport.health.recommendedActions.map(
                                        function (action, index) {
                                          return (
                                            <li
                                              key={index}
                                              className="text-xs text-blue-400 flex items-start"
                                            >
                                              <span className="mr-2">•</span>
                                              <span>{action}</span>
                                            </li>
                                          );
                                        },
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-green-400 py-4">
                                  No issues detected
                                </div>
                              )}
                            </card_1.CardContent>
                          </card_1.Card>
                        </div>
                      </>
                    ) : (
                      <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                        {loading ? (
                          <div className="flex justify-center items-center">
                            <lucide_react_1.Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                            <span>Loading health report...</span>
                          </div>
                        ) : (
                          "No health report available"
                        )}
                      </div>
                    )}
                  </tabs_1.TabsContent>

                  <tabs_1.TabsContent value="firmware" className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">
                        Current Firmware: {selectedDevice.firmwareVersion}
                      </h3>
                      {((_d =
                        healthReport === null || healthReport === void 0
                          ? void 0
                          : healthReport.firmware) === null || _d === void 0
                        ? void 0
                        : _d.updateAvailable) && (
                        <button_1.Button
                          onClick={function () {
                            return updateFirmware(selectedDevice.id);
                          }}
                          disabled={
                            updating === selectedDevice.id ||
                            selectedDevice.status === "updating"
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {updating === selectedDevice.id ? (
                            <>
                              <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <lucide_react_1.RefreshCw className="mr-2 h-4 w-4" />
                              Update to {healthReport.firmware.latestVersion}
                            </>
                          )}
                        </button_1.Button>
                      )}
                    </div>

                    {firmwareVersions.length > 0 ? (
                      <div className="space-y-3">
                        {firmwareVersions.map(function (version, index) {
                          var isCurrent =
                            version.version === selectedDevice.firmwareVersion;
                          var isNewer =
                            !isCurrent &&
                            version.releaseDate >
                              new Date(selectedDevice.lastSeen).toISOString();
                          return (
                            <card_1.Card
                              key={index}
                              className={"bg-gray-800/30 border-gray-700 ".concat(
                                isCurrent ? "border-green-500" : "",
                              )}
                            >
                              <card_1.CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                  <card_1.CardTitle className="text-sm">
                                    Version {version.version}
                                  </card_1.CardTitle>
                                  <div className="flex space-x-2">
                                    <badge_1.Badge
                                      className={
                                        version.status === "stable"
                                          ? "bg-green-600"
                                          : version.status === "beta"
                                            ? "bg-amber-600"
                                            : "bg-red-600"
                                      }
                                    >
                                      {version.status}
                                    </badge_1.Badge>
                                    {isCurrent && (
                                      <badge_1.Badge className="bg-blue-600">
                                        Current
                                      </badge_1.Badge>
                                    )}
                                  </div>
                                </div>
                                <card_1.CardDescription className="text-xs">
                                  Released:{" "}
                                  {new Date(
                                    version.releaseDate,
                                  ).toLocaleDateString()}
                                </card_1.CardDescription>
                              </card_1.CardHeader>
                              <card_1.CardContent className="pb-2">
                                <div className="text-xs whitespace-pre-line">
                                  {version.releaseNotes}
                                </div>
                                {version.requiredVersion && (
                                  <div className="text-xs text-amber-400 mt-2">
                                    Requires version {version.requiredVersion}{" "}
                                    or higher
                                  </div>
                                )}
                              </card_1.CardContent>
                              <card_1.CardFooter className="pt-0">
                                {!isCurrent && isNewer && (
                                  <button_1.Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto"
                                    disabled={
                                      updating === selectedDevice.id ||
                                      selectedDevice.status === "updating"
                                    }
                                    onClick={function () {
                                      return updateFirmware(
                                        selectedDevice.id,
                                        version.version,
                                      );
                                    }}
                                  >
                                    {updating === selectedDevice.id ? (
                                      <>
                                        <lucide_react_1.Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      "Install"
                                    )}
                                  </button_1.Button>
                                )}
                              </card_1.CardFooter>
                            </card_1.Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                        {loading ? (
                          <div className="flex justify-center items-center">
                            <lucide_react_1.Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                            <span>Loading firmware versions...</span>
                          </div>
                        ) : (
                          "No firmware versions available"
                        )}
                      </div>
                    )}
                  </tabs_1.TabsContent>
                </tabs_1.Tabs>
              </>
            ) : (
              <div className="border border-gray-700 rounded-md p-8 text-center text-gray-400">
                Select a device to view details
              </div>
            )}
          </div>
        </div>
      </card_1.CardContent>
      <card_1.CardFooter className="flex justify-between border-t border-gray-700 pt-4">
        <span className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
        <button_1.Button variant="outline" size="sm" onClick={fetchData}>
          Refresh
        </button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = HardwareHubPanel;

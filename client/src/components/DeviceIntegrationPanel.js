"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
var react_1 = require("react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var badge_1 = require("./ui/badge");
var tabs_1 = require("./ui/tabs");
var lucide_react_1 = require("lucide-react");
var roadmapService_1 = require("../lib/roadmapService");
var realTimeService_1 = require("../lib/realTimeService");
var use_toast_1 = require("./ui/use-toast");
var DeviceIntegrationPanel = function () {
  var _a, _b;
  var _c = (0, react_1.useState)("protocols"),
    activeTab = _c[0],
    setActiveTab = _c[1];
  var _d = (0, react_1.useState)(true),
    loading = _d[0],
    setLoading = _d[1];
  var _e = (0, react_1.useState)(false),
    discovering = _e[0],
    setDiscovering = _e[1];
  var _f = (0, react_1.useState)(null),
    error = _f[0],
    setError = _f[1];
  var _g = (0, react_1.useState)(null),
    integrationStatus = _g[0],
    setIntegrationStatus = _g[1];
  var _h = (0, react_1.useState)([]),
    discoveredDevices = _h[0],
    setDiscoveredDevices = _h[1];
  var toast = (0, use_toast_1.useToast)().toast;
  (0, react_1.useEffect)(function () {
    fetchIntegrationStatus();
    // Set up real-time event listeners
    realTimeService_1.default.on("deviceDiscovered", handleDeviceDiscovered);
    realTimeService_1.default.on("discoveryComplete", handleDiscoveryComplete);
    return function () {
      // Clean up event listeners
      realTimeService_1.default.removeListener(
        "deviceDiscovered",
        handleDeviceDiscovered,
      );
      realTimeService_1.default.removeListener(
        "discoveryComplete",
        handleDiscoveryComplete,
      );
    };
  }, []);
  var handleDeviceDiscovered = function (device) {
    setDiscoveredDevices(function (prev) {
      // Check if device already exists
      var exists = prev.some(function (d) {
        return d.id === device.id;
      });
      if (exists) {
        return prev.map(function (d) {
          return d.id === device.id ? device : d;
        });
      } else {
        return __spreadArray(__spreadArray([], prev, true), [device], false);
      }
    });
    // Update the connected devices count
    if (integrationStatus) {
      setIntegrationStatus(
        __assign(__assign({}, integrationStatus), {
          connectedDevices: (integrationStatus.connectedDevices || 0) + 1,
        }),
      );
    }
  };
  var handleDiscoveryComplete = function () {
    setDiscovering(false);
    toast({
      title: "Discovery Complete",
      description: "Found ".concat(discoveredDevices.length, " devices"),
    });
    // Refresh the full status
    fetchIntegrationStatus();
  };
  var fetchIntegrationStatus = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var status_1, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setLoading(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              roadmapService_1.default.getDeviceIntegrationStatus(),
            ];
          case 2:
            status_1 = _a.sent();
            setIntegrationStatus(status_1);
            // Reset discovered devices list when refreshing status
            setDiscoveredDevices([]);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            console.error("Error fetching integration status:", err_1);
            setError("Failed to load device integration status");
            return [3 /*break*/, 5];
          case 4:
            setLoading(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  var startDiscovery = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setDiscovering(true);
            setError(null);
            setDiscoveredDevices([]);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [
              4 /*yield*/,
              roadmapService_1.default.startDeviceDiscovery(),
            ];
          case 2:
            _a.sent();
            // In a real implementation with WebSockets, the discovery events would come in real-time
            // and the discoveryComplete event would be fired when done
            // For fallback in case WebSockets aren't working, set a timeout
            setTimeout(function () {
              if (discovering) {
                fetchIntegrationStatus();
                setDiscovering(false);
              }
            }, 10000);
            return [3 /*break*/, 4];
          case 3:
            err_2 = _a.sent();
            console.error("Error starting device discovery:", err_2);
            setError("Failed to start device discovery");
            setDiscovering(false);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  if (loading) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Device Integration</card_1.CardTitle>
          <card_1.CardDescription>
            Loading integration status...
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="flex justify-center py-8">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  if (error) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Device Integration</card_1.CardTitle>
          <card_1.CardDescription>
            Error loading integration status
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="text-red-400">{error}</div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button onClick={fetchIntegrationStatus}>
            Retry
          </button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    );
  }
  return (
    <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
      <card_1.CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <card_1.CardTitle>Device Integration</card_1.CardTitle>
            <card_1.CardDescription>
              Extending support to a comprehensive range of smart home protocols
              and devices
            </card_1.CardDescription>
          </div>
          <button_1.Button
            onClick={startDiscovery}
            disabled={discovering}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {discovering ? (
              <>
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Discovering...
              </>
            ) : (
              "Discover Devices"
            )}
          </button_1.Button>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Connected Devices</span>
            <badge_1.Badge>
              {(integrationStatus === null || integrationStatus === void 0
                ? void 0
                : integrationStatus.connectedDevices) || 0}
            </badge_1.Badge>
          </div>
        </div>

        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid grid-cols-3 mb-4">
            <tabs_1.TabsTrigger value="protocols">Protocols</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="deviceTypes">
              Device Types
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="discovered">
              Discovered
              {discoveredDevices.length > 0 && (
                <badge_1.Badge variant="secondary" className="ml-2">
                  {discoveredDevices.length}
                </badge_1.Badge>
              )}
            </tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="protocols" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {((_a =
                integrationStatus === null || integrationStatus === void 0
                  ? void 0
                  : integrationStatus.supportedProtocols) === null ||
              _a === void 0
                ? void 0
                : _a.length) > 0 ? (
                integrationStatus.supportedProtocols.map(function (protocol) {
                  return (
                    <badge_1.Badge
                      key={protocol}
                      variant="outline"
                      className="px-3 py-1"
                    >
                      {protocol}
                    </badge_1.Badge>
                  );
                })
              ) : (
                <p className="text-gray-400">No protocols available</p>
              )}
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="deviceTypes" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {((_b =
                integrationStatus === null || integrationStatus === void 0
                  ? void 0
                  : integrationStatus.supportedDeviceTypes) === null ||
              _b === void 0
                ? void 0
                : _b.length) > 0 ? (
                integrationStatus.supportedDeviceTypes.map(function (type) {
                  return (
                    <badge_1.Badge
                      key={type}
                      variant="outline"
                      className="px-3 py-1"
                    >
                      {type}
                    </badge_1.Badge>
                  );
                })
              ) : (
                <p className="text-gray-400">No device types available</p>
              )}
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="discovered" className="space-y-4">
            {discovering && (
              <div className="flex items-center justify-center p-4 mb-4 border border-blue-500/30 bg-blue-500/10 rounded-md">
                <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                <span className="text-sm">Discovering devices...</span>
              </div>
            )}

            {discoveredDevices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {discoveredDevices.map(function (device) {
                  return (
                    <div
                      key={device.id}
                      className="border border-gray-700 rounded-md p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {device.friendlyName || device.id}
                          </div>
                          <div className="text-xs text-gray-400">
                            {device.manufacturer} {device.model}
                          </div>
                        </div>
                        <badge_1.Badge>
                          {device.protocol || device.type}
                        </badge_1.Badge>
                      </div>
                      {device.state && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-400">State:</div>
                          <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                            {Object.entries(device.state).map(function (_a) {
                              var key = _a[0],
                                value = _a[1];
                              return (
                                <div key={key} className="flex justify-between">
                                  <span>{key}:</span>
                                  <span className="font-mono">
                                    {typeof value === "object"
                                      ? JSON.stringify(value).substring(0, 15) +
                                        "..."
                                      : String(value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center">
                {discovering ? (
                  <span className="text-gray-400">
                    Searching for devices...
                  </span>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400">No devices discovered yet</p>
                    <button_1.Button
                      variant="outline"
                      size="sm"
                      onClick={startDiscovery}
                      className="mx-auto"
                    >
                      <lucide_react_1.Search className="h-4 w-4 mr-2" />
                      Start Discovery
                    </button_1.Button>
                  </div>
                )}
              </div>
            )}
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
      <card_1.CardFooter className="flex justify-between border-t border-gray-700 pt-4">
        <span className="text-xs text-gray-400">
          Last updated:{" "}
          {(
            integrationStatus === null || integrationStatus === void 0
              ? void 0
              : integrationStatus.lastUpdated
          )
            ? new Date(integrationStatus.lastUpdated).toLocaleTimeString()
            : new Date().toLocaleTimeString()}
        </span>
        <button_1.Button
          variant="outline"
          size="sm"
          onClick={fetchIntegrationStatus}
        >
          <lucide_react_1.RefreshCw className="h-3 w-3 mr-2" />
          Refresh
        </button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = DeviceIntegrationPanel;

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Devices;
var react_1 = require("react");
var wouter_1 = require("wouter");
var HeaderComponent_1 = require("@/components/HeaderComponent");
var FooterComponent_1 = require("@/components/FooterComponent");
var NotificationPanel_1 = require("@/components/NotificationPanel");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var badge_1 = require("@/components/ui/badge");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
var queryClient_1 = require("@/lib/queryClient");
var socket_1 = require("@/lib/socket");
var lucide_react_1 = require("lucide-react");
function Devices() {
  var _this = this;
  var _a = (0, react_1.useState)([]),
    devices = _a[0],
    setDevices = _a[1];
  var _b = (0, react_1.useState)(true),
    loading = _b[0],
    setLoading = _b[1];
  var _c = (0, react_1.useState)(null),
    notification = _c[0],
    setNotification = _c[1];
  var _d = (0, react_1.useState)(false),
    scanDialogOpen = _d[0],
    setScanDialogOpen = _d[1];
  var _e = (0, react_1.useState)(false),
    scanning = _e[0],
    setScanning = _e[1];
  // Connect to WebSocket for real-time updates
  var _f = (0, socket_1.useWebSocket)("/ws", {}),
    data = _f.data,
    sendMessage = _f.sendMessage,
    isConnected = _f.isConnected;
  // Load devices on initial render
  (0, react_1.useEffect)(function () {
    fetchDevices();
  }, []);
  // Process incoming WebSocket data
  (0, react_1.useEffect)(
    function () {
      if (data && Object.keys(data).length > 0) {
        if (
          data.type === "device_update" ||
          data.type === "discovery-complete"
        ) {
          // Refresh devices when we get an update
          fetchDevices();
        }
      }
    },
    [data],
  );
  // Fetch devices from the API
  var fetchDevices = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var response, data_1, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            return [
              4 /*yield*/,
              (0, queryClient_1.apiRequest)("GET", "/api/devices"),
            ];
          case 1:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 2:
            data_1 = _a.sent();
            if (data_1 && Array.isArray(data_1)) {
              setDevices(data_1);
            } else {
              setDevices([]);
            }
            return [3 /*break*/, 5];
          case 3:
            error_1 = _a.sent();
            console.error("Error fetching devices:", error_1);
            setDevices([]);
            setNotification({
              id: Date.now().toString(),
              title: "Error",
              message: "Failed to fetch devices. Please try again.",
              icon: "error-warning-line",
              type: "error",
              timestamp: new Date(),
              read: false,
            });
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
  // Trigger a device network scan
  var handleScanNetwork = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var error_2;
      var _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            setScanning(true);
            setScanDialogOpen(false);
            setNotification({
              id: Date.now().toString(),
              title: "Scanning Network",
              message: "Searching for devices on your network...",
              icon: "radar-line",
              type: "info",
              timestamp: new Date(),
              read: false,
            });
            return [
              4 /*yield*/,
              (0, queryClient_1.apiRequest)("POST", "/api/devices/scan"),
            ];
          case 1:
            _a.sent();
            // Wait a moment for devices to be discovered
            setTimeout(function () {
              return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                  switch (_a.label) {
                    case 0:
                      return [4 /*yield*/, fetchDevices()];
                    case 1:
                      _a.sent();
                      setNotification({
                        id: Date.now().toString(),
                        title: "Scan Complete",
                        message: "Network scan completed successfully.",
                        icon: "check-line",
                        type: "success",
                        timestamp: new Date(),
                        read: false,
                      });
                      setScanning(false);
                      return [2 /*return*/];
                  }
                });
              });
            }, 5000);
            return [3 /*break*/, 3];
          case 2:
            error_2 = _a.sent();
            console.error("Error scanning network:", error_2);
            setNotification({
              id: Date.now().toString(),
              title: "Scan Failed",
              message: "Failed to scan network for devices.",
              icon: "error-warning-line",
              type: "error",
              timestamp: new Date(),
              read: false,
            });
            setScanning(false);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  // Toggle a device on/off
  var handleToggleDevice = function (device) {
    return __awaiter(_this, void 0, void 0, function () {
      var newState_1, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!device.id) return [2 /*return*/];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 5]);
            newState_1 = !device.isActive;
            // Optimistically update UI
            setDevices(
              devices.map(function (d) {
                return d.id === device.id
                  ? __assign(__assign({}, d), { isActive: newState_1 })
                  : d;
              }),
            );
            // Send update to server
            return [
              4 /*yield*/,
              (0, queryClient_1.apiRequest)(
                "POST",
                "/api/devices/".concat(device.id, "/toggle"),
                {
                  isActive: newState_1,
                },
              ),
            ];
          case 2:
            // Send update to server
            _a.sent();
            setNotification({
              id: Date.now().toString(),
              title: "Device Updated",
              message: ""
                .concat(device.name, " is now ")
                .concat(newState_1 ? "active" : "inactive", "."),
              icon: "device-line",
              type: "success",
              timestamp: new Date(),
              read: false,
            });
            return [3 /*break*/, 5];
          case 3:
            error_3 = _a.sent();
            console.error("Error toggling device:", error_3);
            // Revert the optimistic update
            return [4 /*yield*/, fetchDevices()];
          case 4:
            // Revert the optimistic update
            _a.sent();
            setNotification({
              id: Date.now().toString(),
              title: "Update Failed",
              message: "Failed to update ".concat(device.name, "."),
              icon: "error-warning-line",
              type: "error",
              timestamp: new Date(),
              read: false,
            });
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  // Group devices by type
  var devicesByType = {};
  devices.forEach(function (device) {
    var type = device.type || "Unknown";
    if (!devicesByType[type]) {
      devicesByType[type] = [];
    }
    devicesByType[type].push(device);
  });
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent_1.default />

      <main className="flex flex-col px-4 py-6 flex-grow">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#00FFFF]">Devices</h1>

            <div className="flex items-center space-x-2">
              <button_1.Button
                variant="outline"
                className="border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/10"
                onClick={function () {
                  return fetchDevices();
                }}
                disabled={loading}
              >
                {loading ? (
                  <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <lucide_react_1.RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </button_1.Button>

              <button_1.Button
                variant="default"
                className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black"
                onClick={function () {
                  return setScanDialogOpen(true);
                }}
                disabled={scanning}
              >
                {scanning ? (
                  <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <lucide_react_1.Plus className="mr-2 h-4 w-4" />
                )}
                Scan Network
              </button_1.Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <lucide_react_1.Loader2 className="h-8 w-8 text-[#00FFFF] animate-spin" />
              <span className="ml-3 text-white">Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30">
              <card_1.CardHeader>
                <card_1.CardTitle className="text-white">
                  No Devices Found
                </card_1.CardTitle>
                <card_1.CardDescription>
                  Click "Scan Network" to search for devices on your network
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <p className="text-gray-400 mb-4">
                  JASON can discover and control devices on your network
                  including:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <badge_1.Badge variant="outline" className="justify-center">
                    Alexa Devices
                  </badge_1.Badge>
                  <badge_1.Badge variant="outline" className="justify-center">
                    TP-Link Smart Devices
                  </badge_1.Badge>
                  <badge_1.Badge variant="outline" className="justify-center">
                    IKEA Tradfri
                  </badge_1.Badge>
                  <badge_1.Badge variant="outline" className="justify-center">
                    Philips Hue
                  </badge_1.Badge>
                  <badge_1.Badge variant="outline" className="justify-center">
                    MQTT Devices
                  </badge_1.Badge>
                  <badge_1.Badge variant="outline" className="justify-center">
                    Network Devices
                  </badge_1.Badge>
                </div>
              </card_1.CardContent>
              <card_1.CardFooter>
                <button_1.Button
                  className="w-full bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black"
                  onClick={function () {
                    return setScanDialogOpen(true);
                  }}
                >
                  <lucide_react_1.Plus className="mr-2 h-4 w-4" />
                  Scan for Devices
                </button_1.Button>
              </card_1.CardFooter>
            </card_1.Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(devicesByType).map(function (_a) {
                var type = _a[0],
                  devicesOfType = _a[1];
                return (
                  <div key={type}>
                    <div className="flex items-center mb-4">
                      <h2 className="text-2xl font-bold text-[#00FFFF] mr-2">
                        {type} Devices
                      </h2>
                      <div className="bg-[#0D1117] border border-[#00FFFF]/30 rounded-full px-3 py-1 text-sm text-[#00FFFF]">
                        {devicesOfType.length}{" "}
                        {devicesOfType.length === 1 ? "device" : "devices"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {devicesOfType.map(function (device) {
                        return (
                          <card_1.Card
                            key={device.id}
                            className="bg-[#1A1A1A] border border-[#00FFFF]/30 hover:border-[#00FFFF] transition-all"
                          >
                            <card_1.CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <card_1.CardTitle className="text-white">
                                    {device.name}
                                  </card_1.CardTitle>
                                  <card_1.CardDescription>
                                    {device.status === "Online" ? (
                                      <span className="text-[#00FF00]">
                                        ● Online
                                      </span>
                                    ) : device.status === "Offline" ? (
                                      <span className="text-[#FF3300]">
                                        ● Offline
                                      </span>
                                    ) : (
                                      <span className="text-yellow-500">
                                        ● Standby
                                      </span>
                                    )}
                                  </card_1.CardDescription>
                                </div>
                                <div className="flex space-x-1">
                                  <button_1.Button
                                    variant="ghost"
                                    size="icon"
                                    className={"rounded-full ".concat(
                                      device.isActive
                                        ? "text-[#00FF00]"
                                        : "text-gray-400",
                                    )}
                                    onClick={function () {
                                      return handleToggleDevice(device);
                                    }}
                                    disabled={device.status === "Offline"}
                                  >
                                    {device.isActive ? (
                                      <lucide_react_1.Power className="h-5 w-5" />
                                    ) : (
                                      <lucide_react_1.PowerOff className="h-5 w-5" />
                                    )}
                                  </button_1.Button>
                                  <button_1.Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-gray-400 hover:text-white"
                                  >
                                    <lucide_react_1.Settings2 className="h-5 w-5" />
                                  </button_1.Button>
                                </div>
                              </div>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                              {device.details &&
                                Object.entries(device.details).length > 0 && (
                                  <div className="mt-2 space-y-1 text-sm">
                                    {device.details.location && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          Location
                                        </span>
                                        <span className="text-white">
                                          {device.details.location}
                                        </span>
                                      </div>
                                    )}
                                    {device.details.ip && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          IP Address
                                        </span>
                                        <span className="text-white">
                                          {device.details.ip}
                                        </span>
                                      </div>
                                    )}
                                    {device.details.lastActive && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          Last Active
                                        </span>
                                        <span className="text-white">
                                          {new Date(
                                            device.details.lastActive,
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                              {device.metrics && device.metrics.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-[#00FFFF]/10">
                                  {device.metrics.map(function (metric, index) {
                                    return (
                                      <div
                                        key={index}
                                        className="flex justify-between items-center mb-1"
                                      >
                                        <span className="text-gray-400">
                                          {metric.name}
                                        </span>
                                        <span
                                          className="text-white font-medium"
                                          style={{
                                            color: metric.color || "white",
                                          }}
                                        >
                                          {metric.value}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </card_1.CardContent>
                            {device.type === "alexa" && (
                              <card_1.CardFooter className="pt-0">
                                <wouter_1.Link href="/command-console">
                                  <a className="w-full">
                                    <button_1.Button
                                      variant="outline"
                                      className="w-full border-[#00FFFF]/30 hover:border-[#00FFFF] hover:bg-[#00FFFF]/10"
                                    >
                                      Send Commands
                                    </button_1.Button>
                                  </a>
                                </wouter_1.Link>
                              </card_1.CardFooter>
                            )}
                          </card_1.Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <FooterComponent_1.default />

      <NotificationPanel_1.default
        notification={notification}
        onClose={function () {
          return setNotification(null);
        }}
      />

      <alert_dialog_1.AlertDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
      >
        <alert_dialog_1.AlertDialogContent className="bg-[#1A1A1A] border border-[#00FFFF]/30">
          <alert_dialog_1.AlertDialogHeader>
            <alert_dialog_1.AlertDialogTitle className="text-white">
              Scan Network for Devices
            </alert_dialog_1.AlertDialogTitle>
            <alert_dialog_1.AlertDialogDescription>
              This will scan your network for smart devices that JASON can
              control, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Alexa devices</li>
                <li>TP-Link smart devices</li>
                <li>Philips Hue bridges and bulbs</li>
                <li>IKEA Tradfri gateways and devices</li>
                <li>Other network-enabled devices</li>
              </ul>
            </alert_dialog_1.AlertDialogDescription>
          </alert_dialog_1.AlertDialogHeader>
          <alert_dialog_1.AlertDialogFooter>
            <alert_dialog_1.AlertDialogCancel className="bg-transparent border border-gray-600 hover:bg-gray-800 text-white">
              Cancel
            </alert_dialog_1.AlertDialogCancel>
            <alert_dialog_1.AlertDialogAction
              className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black"
              onClick={handleScanNetwork}
            >
              Start Scan
            </alert_dialog_1.AlertDialogAction>
          </alert_dialog_1.AlertDialogFooter>
        </alert_dialog_1.AlertDialogContent>
      </alert_dialog_1.AlertDialog>
    </div>
  );
}

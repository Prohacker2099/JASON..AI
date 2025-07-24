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
var react_1 = require("react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var alert_1 = require("./ui/alert");
var lucide_react_1 = require("lucide-react");
var IntegratedDeviceCard_1 = require("./IntegratedDeviceCard");
var IntegratedDevicesPanel = function () {
  var _a = (0, react_1.useState)([]),
    devices = _a[0],
    setDevices = _a[1];
  var _b = (0, react_1.useState)(true),
    loading = _b[0],
    setLoading = _b[1];
  var _c = (0, react_1.useState)(null),
    error = _c[0],
    setError = _c[1];
  var _d = (0, react_1.useState)(false),
    refreshing = _d[0],
    setRefreshing = _d[1];
  // Fetch devices on component mount
  (0, react_1.useEffect)(function () {
    fetchDevices();
  }, []);
  // Fetch devices from integrated services
  var fetchDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, integratedDevices, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            return [4 /*yield*/, fetch("/api/devices")];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch devices");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            integratedDevices = data.devices.filter(function (device) {
              return device.serviceId;
            });
            setDevices(integratedDevices);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            setError("Failed to load devices");
            console.error(err_1);
            return [3 /*break*/, 5];
          case 4:
            setLoading(false);
            setRefreshing(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  // Handle device control
  var handleDeviceControl = function (deviceId, command) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 5, , 6]);
            if (!command.refresh) return [3 /*break*/, 2];
            return [4 /*yield*/, fetchDevices()];
          case 1:
            _a.sent();
            return [2 /*return*/];
          case 2:
            return [
              4 /*yield*/,
              fetch("/api/devices/".concat(deviceId, "/control"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ command: command }),
              }),
            ];
          case 3:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to control device");
            }
            return [4 /*yield*/, response.json()];
          case 4:
            data = _a.sent();
            // Update device state in the local state
            setDevices(function (prevDevices) {
              return prevDevices.map(function (device) {
                return device.id === deviceId
                  ? __assign(__assign({}, device), {
                      state: __assign(__assign({}, device.state), command),
                    })
                  : device;
              });
            });
            return [3 /*break*/, 6];
          case 5:
            err_2 = _a.sent();
            console.error(
              "Error controlling device ".concat(deviceId, ":"),
              err_2,
            );
            return [3 /*break*/, 6];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  // Group devices by service
  var devicesByService = devices.reduce(function (acc, device) {
    var serviceId = device.serviceId || "unknown";
    if (!acc[serviceId]) {
      acc[serviceId] = [];
    }
    acc[serviceId].push(device);
    return acc;
  }, {});
  return (
    <card_1.Card className="w-full">
      <card_1.CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <card_1.CardTitle>Integrated Devices</card_1.CardTitle>
            <card_1.CardDescription>
              Devices from your connected services
            </card_1.CardDescription>
          </div>
          <button_1.Button
            variant="outline"
            size="sm"
            onClick={function () {
              setRefreshing(true);
              fetchDevices();
            }}
            disabled={loading || refreshing}
          >
            <lucide_react_1.RefreshCw
              className={"mr-2 h-4 w-4 ".concat(
                refreshing ? "animate-spin" : "",
              )}
            />
            Refresh
          </button_1.Button>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        {error && (
          <alert_1.Alert variant="destructive" className="mb-4">
            <alert_1.AlertTitle>Error</alert_1.AlertTitle>
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>
        )}

        {loading ? (
          <p>Loading devices...</p>
        ) : devices.length === 0 ? (
          <alert_1.Alert>
            <lucide_react_1.InfoIcon className="h-4 w-4" />
            <alert_1.AlertTitle>No integrated devices found</alert_1.AlertTitle>
            <alert_1.AlertDescription>
              Connect to services in the Integrations page to discover devices.
            </alert_1.AlertDescription>
          </alert_1.Alert>
        ) : (
          <div className="space-y-6">
            {Object.entries(devicesByService).map(function (_a) {
              var serviceId = _a[0],
                serviceDevices = _a[1];
              return (
                <div key={serviceId}>
                  <h3 className="text-lg font-medium mb-3">
                    {serviceDevices[0].serviceName || serviceId}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceDevices.map(function (device) {
                      return (
                        <IntegratedDeviceCard_1.default
                          key={device.id}
                          device={device}
                          onControl={handleDeviceControl}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </card_1.CardContent>
    </card_1.Card>
  );
};
exports.default = IntegratedDevicesPanel;

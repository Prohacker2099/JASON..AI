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
var recharts_1 = require("recharts");
var DeviceUsageChart = function (_a) {
  var _b = _a.timeRange,
    timeRange = _b === void 0 ? "week" : _b,
    _c = _a.viewType,
    viewType = _c === void 0 ? "time" : _c,
    roomId = _a.roomId,
    _d = _a.className,
    className = _d === void 0 ? "" : _d,
    _e = _a.height,
    height = _e === void 0 ? 300 : _e,
    _f = _a.limit,
    limit = _f === void 0 ? 10 : _f;
  var _g = (0, react_1.useState)([]),
    data = _g[0],
    setData = _g[1];
  var _h = (0, react_1.useState)(true),
    isLoading = _h[0],
    setIsLoading = _h[1];
  var _j = (0, react_1.useState)(null),
    error = _j[0],
    setError = _j[1];
  var _k = (0, react_1.useState)(null),
    mostUsedDevice = _k[0],
    setMostUsedDevice = _k[1];
  var _l = (0, react_1.useState)(0),
    totalUsageTime = _l[0],
    setTotalUsageTime = _l[1];
  var _m = (0, react_1.useState)(0),
    totalEnergy = _m[0],
    setTotalEnergy = _m[1];
  // Colors for different categories
  var categoryColors = {
    Lighting: "#3B82F6",
    Climate: "#10B981",
    Security: "#8B5CF6",
    Entertainment: "#F59E0B",
    Appliance: "#EF4444",
    Other: "#6B7280",
  };
  // Colors for bars
  var barColors = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#6366F1",
    "#14B8A6",
    "#F97316",
    "#8B5CF6",
  ];
  (0, react_1.useEffect)(
    function () {
      var fetchUsageData = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var endpoint,
            response,
            result,
            totalTime,
            totalEnergyUsage,
            sorted,
            err_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                setIsLoading(true);
                setError(null);
                _a.label = 1;
              case 1:
                _a.trys.push([1, 4, 5, 6]);
                endpoint = "/api/data/device-usage?timeRange=".concat(
                  timeRange,
                );
                if (roomId) {
                  endpoint += "&roomId=".concat(roomId);
                }
                return [4 /*yield*/, fetch(endpoint)];
              case 2:
                response = _a.sent();
                if (!response.ok) {
                  throw new Error("Failed to fetch device usage data");
                }
                return [4 /*yield*/, response.json()];
              case 3:
                result = _a.sent();
                setData(result.data);
                totalTime = result.data.reduce(function (sum, device) {
                  return sum + device.usageTime;
                }, 0);
                setTotalUsageTime(parseFloat(totalTime.toFixed(1)));
                totalEnergyUsage = result.data.reduce(function (sum, device) {
                  return sum + (device.energy || 0);
                }, 0);
                setTotalEnergy(parseFloat(totalEnergyUsage.toFixed(1)));
                // Find most used device
                if (result.data.length > 0) {
                  sorted = __spreadArray([], result.data, true).sort(
                    function (a, b) {
                      return viewType === "time"
                        ? b.usageTime - a.usageTime
                        : viewType === "energy"
                          ? (b.energy || 0) - (a.energy || 0)
                          : b.usageCount - a.usageCount;
                    },
                  );
                  setMostUsedDevice(sorted[0].deviceName);
                }
                return [3 /*break*/, 6];
              case 4:
                err_1 = _a.sent();
                console.error("Error fetching device usage data:", err_1);
                setError("Failed to load device usage data");
                // Generate mock data for development
                generateMockData();
                return [3 /*break*/, 6];
              case 5:
                setIsLoading(false);
                return [7 /*endfinally*/];
              case 6:
                return [2 /*return*/];
            }
          });
        });
      };
      var generateMockData = function () {
        var deviceTypes = [
          "Light",
          "Thermostat",
          "Camera",
          "Speaker",
          "TV",
          "Lock",
          "Vacuum",
        ];
        var categories = [
          "Lighting",
          "Climate",
          "Security",
          "Entertainment",
          "Appliance",
          "Other",
        ];
        var mockData = [];
        // Generate 8-12 devices with random usage data
        var deviceCount = Math.floor(Math.random() * 5) + 8;
        for (var i = 0; i < deviceCount; i++) {
          var deviceType =
            deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
          var category =
            categories[Math.floor(Math.random() * categories.length)];
          var deviceName = ""
            .concat(deviceType, " ")
            .concat(Math.floor(Math.random() * 3) + 1);
          // Generate usage time in hours (0.5 to 12 hours)
          var usageTime = parseFloat((Math.random() * 11.5 + 0.5).toFixed(1));
          // Generate usage count (1 to 50 times)
          var usageCount = Math.floor(Math.random() * 50) + 1;
          // Generate energy usage (0.1 to 5 kWh)
          var energy = parseFloat((Math.random() * 4.9 + 0.1).toFixed(1));
          mockData.push({
            deviceId: "device-".concat(i),
            deviceName: deviceName,
            usageTime: usageTime,
            usageCount: usageCount,
            category: category,
            energy: energy,
          });
        }
        // Sort by usage time, count, or energy
        if (viewType === "time") {
          mockData.sort(function (a, b) {
            return b.usageTime - a.usageTime;
          });
        } else if (viewType === "count") {
          mockData.sort(function (a, b) {
            return b.usageCount - a.usageCount;
          });
        } else if (viewType === "energy") {
          mockData.sort(function (a, b) {
            return (b.energy || 0) - (a.energy || 0);
          });
        }
        setData(mockData);
        // Calculate totals
        var totalTime = mockData.reduce(function (sum, device) {
          return sum + device.usageTime;
        }, 0);
        setTotalUsageTime(parseFloat(totalTime.toFixed(1)));
        var totalEnergyUsage = mockData.reduce(function (sum, device) {
          return sum + (device.energy || 0);
        }, 0);
        setTotalEnergy(parseFloat(totalEnergyUsage.toFixed(1)));
        // Set most used device
        if (mockData.length > 0) {
          setMostUsedDevice(mockData[0].deviceName);
        }
      };
      fetchUsageData();
    },
    [timeRange, viewType, roomId],
  );
  // Prepare data for the selected view type
  var prepareChartData = function () {
    if (viewType === "category") {
      // For category view, aggregate by category
      var categoryData_1 = {};
      data.forEach(function (device) {
        if (!categoryData_1[device.category]) {
          categoryData_1[device.category] = { value: 0, name: device.category };
        }
        if (viewType === "energy") {
          categoryData_1[device.category].value += device.energy || 0;
        } else if (viewType === "count") {
          categoryData_1[device.category].value += device.usageCount;
        } else {
          categoryData_1[device.category].value += device.usageTime;
        }
      });
      return Object.values(categoryData_1).map(function (item) {
        return {
          name: item.name,
          value: parseFloat(item.value.toFixed(1)),
        };
      });
    } else {
      // For time, count, or energy view, use bar chart data
      return data
        .map(function (device) {
          return {
            name:
              device.deviceName.length > 15
                ? device.deviceName.substring(0, 12) + "..."
                : device.deviceName,
            value:
              viewType === "time"
                ? device.usageTime
                : viewType === "energy"
                  ? device.energy || 0
                  : device.usageCount,
            category: device.category,
          };
        })
        .slice(0, limit); // Limit to top N devices
    }
  };
  var CustomTooltip = function (_a) {
    var active = _a.active,
      payload = _a.payload,
      label = _a.label;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md bg-gray-800 p-3 shadow-md">
          <p className="mb-1 font-medium text-white">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-gray-300">
            {viewType === "time"
              ? "Usage Time: "
              : viewType === "energy"
                ? "Energy Usage: "
                : "Usage Count: "}
            <span className="font-medium text-white">
              {payload[0].value}
              {viewType === "time"
                ? " hours"
                : viewType === "energy"
                  ? " kWh"
                  : " times"}
            </span>
          </p>
          {viewType !== "category" && (
            <p className="text-sm text-gray-300">
              Category:{" "}
              <span className="font-medium text-white">
                {payload[0].payload.category}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  var CustomPieTooltip = function (_a) {
    var active = _a.active,
      payload = _a.payload;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md bg-gray-800 p-3 shadow-md">
          <p className="mb-1 font-medium text-white">{payload[0].name}</p>
          <p className="text-sm text-gray-300">
            {viewType === "time"
              ? "Usage Time: "
              : viewType === "energy"
                ? "Energy Usage: "
                : "Usage Count: "}
            <span className="font-medium text-white">
              {payload[0].value}
              {viewType === "time"
                ? " hours"
                : viewType === "energy"
                  ? " kWh"
                  : " times"}
            </span>
          </p>
          <p className="text-sm text-gray-300">
            Percentage:{" "}
            <span className="font-medium text-white">
              {"".concat((payload[0].percent * 100).toFixed(1), "%")}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  if (isLoading) {
    return (
      <div
        className={"flex items-center justify-center ".concat(className)}
        style={{ height: height }}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={"flex flex-col items-center justify-center ".concat(
          className,
        )}
        style={{ height: height }}
      >
        <p className="text-red-400">{error}</p>
      </div>
    );
  }
  var chartData = prepareChartData();
  return (
    <div className={"".concat(className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Device Usage</h3>
          <p className="text-sm text-gray-400">
            {timeRange === "day"
              ? "Today"
              : timeRange === "week"
                ? "This Week"
                : "This Month"}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            className={"rounded-md px-3 py-1 text-sm ".concat(
              viewType === "time"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300",
            )}
            onClick={function () {
              return viewType !== "time" && setIsLoading(true);
            }}
          >
            Time
          </button>
          <button
            className={"rounded-md px-3 py-1 text-sm ".concat(
              viewType === "count"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300",
            )}
            onClick={function () {
              return viewType !== "count" && setIsLoading(true);
            }}
          >
            Count
          </button>
          <button
            className={"rounded-md px-3 py-1 text-sm ".concat(
              viewType === "energy"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300",
            )}
            onClick={function () {
              return viewType !== "energy" && setIsLoading(true);
            }}
          >
            Energy
          </button>
          <button
            className={"rounded-md px-3 py-1 text-sm ".concat(
              viewType === "category"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300",
            )}
            onClick={function () {
              return viewType !== "category" && setIsLoading(true);
            }}
          >
            Category
          </button>
        </div>
      </div>

      <div className="mb-2 flex justify-between">
        {mostUsedDevice && (
          <p className="text-sm text-blue-300">
            Most used: <span className="font-semibold">{mostUsedDevice}</span>
          </p>
        )}
        <p className="text-sm text-gray-400">
          {viewType === "time"
            ? "Total: ".concat(totalUsageTime, " hours")
            : viewType === "energy"
              ? "Total: ".concat(totalEnergy, " kWh")
              : ""}
        </p>
      </div>

      <div style={{ height: typeof height === "number" ? height : height }}>
        <recharts_1.ResponsiveContainer width="100%" height="100%">
          {viewType === "category" ? (
            <recharts_1.PieChart>
              <recharts_1.Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={function (_a) {
                  var name = _a.name,
                    percent = _a.percent;
                  return ""
                    .concat(name, " (")
                    .concat((percent * 100).toFixed(0), "%)");
                }}
              >
                {chartData.map(function (entry, index) {
                  return (
                    <recharts_1.Cell
                      key={"cell-".concat(index)}
                      fill={categoryColors[entry.name] || categoryColors.Other}
                    />
                  );
                })}
              </recharts_1.Pie>
              <recharts_1.Tooltip content={<CustomPieTooltip />} />
              <recharts_1.Legend />
            </recharts_1.PieChart>
          ) : (
            <recharts_1.BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <recharts_1.CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                horizontal={false}
              />
              <recharts_1.XAxis
                type="number"
                tick={{ fill: "#9CA3AF" }}
                axisLine={{ stroke: "#4B5563" }}
                tickLine={{ stroke: "#4B5563" }}
                unit={
                  viewType === "time"
                    ? " hrs"
                    : viewType === "energy"
                      ? " kWh"
                      : ""
                }
              />
              <recharts_1.YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#9CA3AF" }}
                axisLine={{ stroke: "#4B5563" }}
                tickLine={{ stroke: "#4B5563" }}
                width={100}
              />
              <recharts_1.Tooltip content={<CustomTooltip />} />
              <recharts_1.Bar
                dataKey="value"
                name={
                  viewType === "time"
                    ? "Usage Time (hours)"
                    : viewType === "energy"
                      ? "Energy Usage (kWh)"
                      : "Usage Count"
                }
              >
                {chartData.map(function (entry, index) {
                  return (
                    <recharts_1.Cell
                      key={"cell-".concat(index)}
                      fill={
                        categoryColors[entry.category] ||
                        barColors[index % barColors.length]
                      }
                    />
                  );
                })}
              </recharts_1.Bar>
            </recharts_1.BarChart>
          )}
        </recharts_1.ResponsiveContainer>
      </div>
    </div>
  );
};
exports.default = DeviceUsageChart;

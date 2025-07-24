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
var recharts_1 = require("recharts");
var EnergyConsumptionChart = function (_a) {
  var _b = _a.timeRange,
    timeRange = _b === void 0 ? "day" : _b,
    deviceId = _a.deviceId,
    roomId = _a.roomId,
    _c = _a.className,
    className = _c === void 0 ? "" : _c,
    _d = _a.showBaseline,
    showBaseline = _d === void 0 ? true : _d,
    _e = _a.showTooltips,
    showTooltips = _e === void 0 ? true : _e,
    _f = _a.height,
    height = _f === void 0 ? 300 : _f,
    _g = _a.colorScheme,
    colorScheme = _g === void 0 ? "blue" : _g;
  var _h = (0, react_1.useState)([]),
    data = _h[0],
    setData = _h[1];
  var _j = (0, react_1.useState)(true),
    isLoading = _j[0],
    setIsLoading = _j[1];
  var _k = (0, react_1.useState)(null),
    error = _k[0],
    setError = _k[1];
  var _l = (0, react_1.useState)(0),
    totalConsumption = _l[0],
    setTotalConsumption = _l[1];
  var _m = (0, react_1.useState)(0),
    comparisonPercentage = _m[0],
    setComparisonPercentage = _m[1];
  var _o = (0, react_1.useState)(0),
    costEstimate = _o[0],
    setCostEstimate = _o[1];
  // Color schemes
  var colorSchemes = {
    blue: {
      main: "#3b82f6",
      light: "#93c5fd",
      dark: "#1d4ed8",
      gradient: ["#3b82f6", "#1d4ed8"],
    },
    green: {
      main: "#10b981",
      light: "#6ee7b7",
      dark: "#047857",
      gradient: ["#10b981", "#047857"],
    },
    purple: {
      main: "#8b5cf6",
      light: "#c4b5fd",
      dark: "#6d28d9",
      gradient: ["#8b5cf6", "#6d28d9"],
    },
    orange: {
      main: "#f59e0b",
      light: "#fcd34d",
      dark: "#d97706",
      gradient: ["#f59e0b", "#d97706"],
    },
  };
  var colors = colorSchemes[colorScheme];
  (0, react_1.useEffect)(
    function () {
      var fetchEnergyData = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var endpoint, response, result, err_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                setIsLoading(true);
                setError(null);
                _a.label = 1;
              case 1:
                _a.trys.push([1, 4, 5, 6]);
                endpoint = "/api/data/energy?timeRange=".concat(timeRange);
                if (deviceId) {
                  endpoint += "&deviceId=".concat(deviceId);
                }
                if (roomId) {
                  endpoint += "&roomId=".concat(roomId);
                }
                return [4 /*yield*/, fetch(endpoint)];
              case 2:
                response = _a.sent();
                if (!response.ok) {
                  throw new Error("Failed to fetch energy data");
                }
                return [4 /*yield*/, response.json()];
              case 3:
                result = _a.sent();
                setData(result.data);
                setTotalConsumption(result.totalConsumption || 0);
                setComparisonPercentage(result.comparisonPercentage || 0);
                setCostEstimate(result.costEstimate || 0);
                return [3 /*break*/, 6];
              case 4:
                err_1 = _a.sent();
                console.error("Error fetching energy data:", err_1);
                setError("Failed to load energy consumption data");
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
        var mockData = [];
        var now = new Date();
        var points =
          timeRange === "day"
            ? 24
            : timeRange === "week"
              ? 7
              : timeRange === "month"
                ? 30
                : 12;
        var total = 0;
        for (var i = 0; i < points; i++) {
          var date = new Date();
          if (timeRange === "day") {
            date.setHours(now.getHours() - (points - i - 1));
            date.setMinutes(0);
            date.setSeconds(0);
          } else if (timeRange === "week") {
            date.setDate(now.getDate() - (points - i - 1));
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
          } else if (timeRange === "month") {
            date.setDate(now.getDate() - (points - i - 1));
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
          } else {
            date.setMonth(now.getMonth() - (points - i - 1));
            date.setDate(1);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
          }
          // Generate a value between 0.5 and 4.5 kWh with some randomness
          var baseValue = 2.5;
          var randomFactor = Math.random() * 2 - 1; // Between -1 and 1
          var timeOfDayFactor =
            timeRange === "day"
              ? Math.sin((date.getHours() / 24) * Math.PI) * 1.5 // Higher during day, lower at night
              : 0;
          var value = baseValue + randomFactor + timeOfDayFactor;
          value = Math.max(0.5, Math.min(4.5, value));
          // Generate baseline (previous period) with slight variation
          var baseline = value * (0.9 + Math.random() * 0.3);
          total += value;
          mockData.push({
            timestamp: date.toISOString(),
            value: parseFloat(value.toFixed(2)),
            baseline: parseFloat(baseline.toFixed(2)),
          });
        }
        setData(mockData);
        // Calculate mock total consumption
        setTotalConsumption(parseFloat(total.toFixed(2)));
        // Generate random comparison percentage between -15 and +15
        var comparison = (Math.random() * 30 - 15).toFixed(1);
        setComparisonPercentage(parseFloat(comparison));
        // Calculate mock cost estimate (assuming $0.15 per kWh)
        setCostEstimate(parseFloat((total * 0.15).toFixed(2)));
      };
      fetchEnergyData();
    },
    [timeRange, deviceId, roomId],
  );
  var formatXAxis = function (tickItem) {
    var date = new Date(tickItem);
    if (timeRange === "day") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (timeRange === "week") {
      return date.toLocaleDateString([], { weekday: "short" });
    } else if (timeRange === "month") {
      return date.toLocaleDateString([], { day: "numeric" });
    } else {
      return date.toLocaleDateString([], { month: "short" });
    }
  };
  var CustomTooltip = function (_a) {
    var active = _a.active,
      payload = _a.payload,
      label = _a.label;
    if (active && payload && payload.length) {
      var date = new Date(label);
      var formattedDate = void 0;
      if (timeRange === "day") {
        formattedDate = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (timeRange === "week" || timeRange === "month") {
        formattedDate = date.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else {
        formattedDate = date.toLocaleDateString([], {
          month: "long",
          year: "numeric",
        });
      }
      return (
        <div className="rounded-md bg-gray-800 p-3 shadow-md">
          <p className="mb-1 font-medium text-gray-300">{formattedDate}</p>
          <p className="text-sm text-white">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
            Current: {payload[0].value} kWh
          </p>
          {showBaseline && payload[1] && (
            <p className="text-sm text-gray-300">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400 mr-1"></span>
              Previous: {payload[1].value} kWh
            </p>
          )}
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
  return (
    <div className={"".concat(className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Energy Consumption
          </h3>
          <p className="text-sm text-gray-400">
            {timeRange === "day"
              ? "Today"
              : timeRange === "week"
                ? "This Week"
                : timeRange === "month"
                  ? "This Month"
                  : "This Year"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {totalConsumption} kWh
          </p>
          <div className="flex items-center justify-end space-x-2">
            <p
              className={"text-sm ".concat(
                comparisonPercentage < 0 ? "text-green-400" : "text-red-400",
              )}
            >
              {comparisonPercentage < 0 ? "↓" : "↑"}{" "}
              {Math.abs(comparisonPercentage)}%
            </p>
            <p className="text-sm text-gray-400">~${costEstimate}</p>
          </div>
        </div>
      </div>

      <div style={{ height: typeof height === "number" ? height : height }}>
        <recharts_1.ResponsiveContainer width="100%" height="100%">
          <recharts_1.AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.main} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.main} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <recharts_1.XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fill: "#9CA3AF" }}
              axisLine={{ stroke: "#4B5563" }}
              tickLine={{ stroke: "#4B5563" }}
            />
            <recharts_1.YAxis
              tick={{ fill: "#9CA3AF" }}
              axisLine={{ stroke: "#4B5563" }}
              tickLine={{ stroke: "#4B5563" }}
              unit=" kWh"
            />
            <recharts_1.CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            {showTooltips && <recharts_1.Tooltip content={<CustomTooltip />} />}
            <recharts_1.Legend />
            <recharts_1.Area
              type="monotone"
              dataKey="value"
              name="Energy"
              stroke={colors.main}
              fillOpacity={1}
              fill="url(#colorEnergy)"
              activeDot={{
                r: 6,
                stroke: colors.dark,
                strokeWidth: 1,
                fill: colors.main,
              }}
            />
            {showBaseline && (
              <recharts_1.Area
                type="monotone"
                dataKey="baseline"
                name="Previous Period"
                stroke="#9CA3AF"
                fillOpacity={0.3}
                fill="url(#colorBaseline)"
                strokeDasharray="5 5"
              />
            )}
          </recharts_1.AreaChart>
        </recharts_1.ResponsiveContainer>
      </div>
    </div>
  );
};
exports.default = EnergyConsumptionChart;

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
var EnvironmentalTrendsChart = function (_a) {
  var _b = _a.timeRange,
    timeRange = _b === void 0 ? "day" : _b,
    _c = _a.metricType,
    metricType = _c === void 0 ? "temperature" : _c,
    roomId = _a.roomId,
    deviceId = _a.deviceId,
    _d = _a.className,
    className = _d === void 0 ? "" : _d,
    _e = _a.showOptimalRange,
    showOptimalRange = _e === void 0 ? true : _e,
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
  var _l = (0, react_1.useState)(null),
    currentValue = _l[0],
    setCurrentValue = _l[1];
  var _m = (0, react_1.useState)(null),
    changeRate = _m[0],
    setChangeRate = _m[1];
  var _o = (0, react_1.useState)(null),
    optimalRange = _o[0],
    setOptimalRange = _o[1];
  var _p = (0, react_1.useState)(""),
    unit = _p[0],
    setUnit = _p[1];
  // Color schemes
  var colorSchemes = {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f59e0b",
    red: "#ef4444",
  };
  var color = colorSchemes[colorScheme];
  // Get metric display information
  var getMetricInfo = function () {
    switch (metricType) {
      case "temperature":
        return {
          label: "Temperature",
          unit: "°C",
          optimalRange: [19, 24],
          color: colorSchemes.red,
        };
      case "humidity":
        return {
          label: "Humidity",
          unit: "%",
          optimalRange: [40, 60],
          color: colorSchemes.blue,
        };
      case "air_quality":
        return {
          label: "Air Quality",
          unit: "AQI",
          optimalRange: [0, 50],
          color: colorSchemes.green,
        };
      case "light":
        return {
          label: "Light Level",
          unit: "lux",
          optimalRange: [300, 500],
          color: colorSchemes.orange,
        };
      case "noise":
        return {
          label: "Noise Level",
          unit: "dB",
          optimalRange: [0, 45],
          color: colorSchemes.purple,
        };
      case "co2":
        return {
          label: "CO₂ Level",
          unit: "ppm",
          optimalRange: [400, 1000],
          color: colorSchemes.green,
        };
      default:
        return {
          label: "Value",
          unit: "",
          optimalRange: null,
          color: colorSchemes.blue,
        };
    }
  };
  var metricInfo = getMetricInfo();
  (0, react_1.useEffect)(
    function () {
      setUnit(metricInfo.unit);
      setOptimalRange(metricInfo.optimalRange);
      var fetchEnvironmentalData = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var endpoint,
            response,
            result,
            firstValue,
            lastValue,
            changePercentage,
            err_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                setIsLoading(true);
                setError(null);
                _a.label = 1;
              case 1:
                _a.trys.push([1, 4, 5, 6]);
                endpoint = "/api/data/environmental?timeRange="
                  .concat(timeRange, "&metricType=")
                  .concat(metricType);
                if (roomId) {
                  endpoint += "&roomId=".concat(roomId);
                }
                if (deviceId) {
                  endpoint += "&deviceId=".concat(deviceId);
                }
                return [4 /*yield*/, fetch(endpoint)];
              case 2:
                response = _a.sent();
                if (!response.ok) {
                  throw new Error("Failed to fetch environmental data");
                }
                return [4 /*yield*/, response.json()];
              case 3:
                result = _a.sent();
                setData(result.data);
                // Set current value and change rate
                if (result.data.length > 0) {
                  setCurrentValue(result.data[result.data.length - 1].value);
                  // Calculate change rate if we have enough data
                  if (result.data.length > 1) {
                    firstValue = result.data[0].value;
                    lastValue = result.data[result.data.length - 1].value;
                    changePercentage =
                      ((lastValue - firstValue) / firstValue) * 100;
                    setChangeRate(parseFloat(changePercentage.toFixed(1)));
                  }
                }
                return [3 /*break*/, 6];
              case 4:
                err_1 = _a.sent();
                console.error("Error fetching environmental data:", err_1);
                setError("Failed to load environmental data");
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
        var points = timeRange === "day" ? 24 : timeRange === "week" ? 7 : 30;
        // Generate base values based on metric type
        var baseValue = 0;
        var fluctuation = 0;
        var optimalValue = 0;
        switch (metricType) {
          case "temperature":
            baseValue = 22; // 22°C
            fluctuation = 3; // ±3°C
            optimalValue = 21; // 21°C is optimal
            break;
          case "humidity":
            baseValue = 45; // 45%
            fluctuation = 10; // ±10%
            optimalValue = 50; // 50% is optimal
            break;
          case "air_quality":
            baseValue = 50; // 50 AQI (good)
            fluctuation = 20; // ±20 AQI
            optimalValue = 25; // 25 AQI is optimal
            break;
          case "light":
            baseValue = 400; // 400 lux
            fluctuation = 200; // ±200 lux
            optimalValue = 450; // 450 lux is optimal
            break;
          case "noise":
            baseValue = 40; // 40 dB
            fluctuation = 15; // ±15 dB
            optimalValue = 35; // 35 dB is optimal
            break;
          case "co2":
            baseValue = 800; // 800 ppm
            fluctuation = 300; // ±300 ppm
            optimalValue = 600; // 600 ppm is optimal
            break;
        }
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
          } else {
            date.setDate(now.getDate() - (points - i - 1));
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
          }
          // Add time-of-day variations for temperature and light
          var timeOfDayFactor = 0;
          if (metricType === "temperature" && timeRange === "day") {
            // Temperature peaks in afternoon, lowest at night
            var hour = date.getHours();
            timeOfDayFactor = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 2;
          } else if (metricType === "light" && timeRange === "day") {
            // Light follows daylight pattern
            var hour = date.getHours();
            if (hour >= 6 && hour <= 18) {
              timeOfDayFactor = Math.sin(((hour - 6) / 12) * Math.PI) * 300;
            } else {
              timeOfDayFactor = 0;
            }
          }
          // Generate a value with some randomness
          var randomFactor = (Math.random() * 2 - 1) * fluctuation * 0.5;
          var value = baseValue + randomFactor + timeOfDayFactor;
          // Ensure values stay in reasonable ranges
          if (metricType === "humidity") {
            value = Math.max(20, Math.min(90, value));
          } else if (metricType === "air_quality") {
            value = Math.max(0, Math.min(150, value));
          } else if (metricType === "light") {
            value = Math.max(0, value);
          }
          mockData.push({
            timestamp: date.toISOString(),
            value: parseFloat(value.toFixed(1)),
            optimal: optimalValue,
          });
        }
        setData(mockData);
        // Set current value to the last data point
        if (mockData.length > 0) {
          setCurrentValue(mockData[mockData.length - 1].value);
          // Calculate mock change rate
          var firstValue = mockData[0].value;
          var lastValue = mockData[mockData.length - 1].value;
          var changePercentage = ((lastValue - firstValue) / firstValue) * 100;
          setChangeRate(parseFloat(changePercentage.toFixed(1)));
        }
      };
      fetchEnvironmentalData();
    },
    [timeRange, metricType, roomId, deviceId],
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
    } else {
      return date.toLocaleDateString([], { day: "numeric" });
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
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            ></span>{" "}
            {metricInfo.label}: {payload[0].value} {unit}
          </p>
          {showOptimalRange && payload[1] && (
            <p className="text-sm text-gray-300">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>{" "}
              Optimal: {payload[1].value} {unit}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  // Determine if current value is within optimal range
  var isWithinOptimalRange = function () {
    if (!optimalRange || currentValue === null) return null;
    return currentValue >= optimalRange[0] && currentValue <= optimalRange[1];
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
            {metricInfo.label}
          </h3>
          <p className="text-sm text-gray-400">
            {timeRange === "day"
              ? "Today"
              : timeRange === "week"
                ? "This Week"
                : "This Month"}
          </p>
        </div>

        <div className="text-right">
          {currentValue !== null && (
            <div className="flex items-center justify-end">
              <p className="text-2xl font-bold text-white">
                {currentValue} {unit}
              </p>
              {isWithinOptimalRange() !== null && (
                <span
                  className={"ml-2 rounded-full p-1 ".concat(
                    isWithinOptimalRange()
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400",
                  )}
                >
                  {isWithinOptimalRange() ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              )}
            </div>
          )}
          {changeRate !== null && (
            <p
              className={"text-sm ".concat(
                changeRate < 0 ? "text-blue-400" : "text-red-400",
              )}
            >
              {changeRate < 0 ? "↓" : "↑"} {Math.abs(changeRate)}% change
            </p>
          )}
        </div>
      </div>

      <div style={{ height: typeof height === "number" ? height : height }}>
        <recharts_1.ResponsiveContainer width="100%" height="100%">
          <recharts_1.LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <recharts_1.CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
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
              unit={" ".concat(unit)}
              domain={
                metricType === "temperature"
                  ? ["auto", "auto"]
                  : metricType === "humidity"
                    ? [0, 100]
                    : metricType === "air_quality"
                      ? [0, "auto"]
                      : metricType === "light"
                        ? [0, "auto"]
                        : metricType === "noise"
                          ? [0, "auto"]
                          : metricType === "co2"
                            ? [400, "auto"]
                            : ["auto", "auto"]
              }
            />
            <recharts_1.Tooltip content={<CustomTooltip />} />
            <recharts_1.Legend />

            {/* Optimal range reference lines */}
            {showOptimalRange && optimalRange && (
              <>
                <recharts_1.ReferenceLine
                  y={optimalRange[0]}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  label={{
                    value: "Min: ".concat(optimalRange[0]).concat(unit),
                    position: "insideBottomLeft",
                    fill: "#10B981",
                    fontSize: 12,
                  }}
                />
                <recharts_1.ReferenceLine
                  y={optimalRange[1]}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  label={{
                    value: "Max: ".concat(optimalRange[1]).concat(unit),
                    position: "insideTopLeft",
                    fill: "#10B981",
                    fontSize: 12,
                  }}
                />
              </>
            )}

            <recharts_1.Line
              type="monotone"
              dataKey="value"
              name={metricInfo.label}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1, fill: color, stroke: color }}
              activeDot={{ r: 6, strokeWidth: 1, fill: color, stroke: "#fff" }}
            />
            {showOptimalRange && (
              <recharts_1.Line
                type="monotone"
                dataKey="optimal"
                name="Optimal"
                stroke="#9CA3AF"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
            )}
          </recharts_1.LineChart>
        </recharts_1.ResponsiveContainer>
      </div>
    </div>
  );
};
exports.default = EnvironmentalTrendsChart;

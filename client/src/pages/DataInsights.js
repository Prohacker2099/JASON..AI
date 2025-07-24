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
var framer_motion_1 = require("framer-motion");
var EnergyConsumptionChart_1 = require("../components/DataInsights/EnergyConsumptionChart");
var EnvironmentalTrendsChart_1 = require("../components/DataInsights/EnvironmentalTrendsChart");
var DeviceUsageChart_1 = require("../components/DataInsights/DeviceUsageChart");
var AdaptiveCard_1 = require("../components/AdaptiveCard");
var DataInsights = function () {
  var _a = (0, react_1.useState)("week"),
    timeRange = _a[0],
    setTimeRange = _a[1];
  var _b = (0, react_1.useState)(null),
    selectedRoom = _b[0],
    setSelectedRoom = _b[1];
  var _c = (0, react_1.useState)([]),
    rooms = _c[0],
    setRooms = _c[1];
  var _d = (0, react_1.useState)([]),
    devices = _d[0],
    setDevices = _d[1];
  var _e = (0, react_1.useState)([]),
    insights = _e[0],
    setInsights = _e[1];
  var _f = (0, react_1.useState)(true),
    isLoading = _f[0],
    setIsLoading = _f[1];
  (0, react_1.useEffect)(
    function () {
      var fetchData = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var roomsResponse,
            roomsData,
            devicesResponse,
            devicesData,
            insightsResponse,
            insightsData,
            error_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                setIsLoading(true);
                _a.label = 1;
              case 1:
                _a.trys.push([1, 11, 12, 13]);
                return [4 /*yield*/, fetch("/api/rooms")];
              case 2:
                roomsResponse = _a.sent();
                if (!roomsResponse.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, roomsResponse.json()];
              case 3:
                roomsData = _a.sent();
                setRooms(roomsData);
                _a.label = 4;
              case 4:
                return [4 /*yield*/, fetch("/api/devices")];
              case 5:
                devicesResponse = _a.sent();
                if (!devicesResponse.ok) return [3 /*break*/, 7];
                return [4 /*yield*/, devicesResponse.json()];
              case 6:
                devicesData = _a.sent();
                setDevices(devicesData);
                _a.label = 7;
              case 7:
                return [
                  4 /*yield*/,
                  fetch("/api/insights?timeRange=".concat(timeRange)),
                ];
              case 8:
                insightsResponse = _a.sent();
                if (!insightsResponse.ok) return [3 /*break*/, 10];
                return [4 /*yield*/, insightsResponse.json()];
              case 9:
                insightsData = _a.sent();
                setInsights(insightsData);
                _a.label = 10;
              case 10:
                return [3 /*break*/, 13];
              case 11:
                error_1 = _a.sent();
                console.error("Error fetching data:", error_1);
                // Mock data for development
                setRooms([
                  { id: "living-room", name: "Living Room" },
                  { id: "kitchen", name: "Kitchen" },
                  { id: "bedroom", name: "Bedroom" },
                  { id: "bathroom", name: "Bathroom" },
                ]);
                setDevices([
                  { id: "light-1", name: "Living Room Light", type: "light" },
                  {
                    id: "thermostat-1",
                    name: "Smart Thermostat",
                    type: "thermostat",
                  },
                  { id: "tv-1", name: "Living Room TV", type: "entertainment" },
                  {
                    id: "speaker-1",
                    name: "Kitchen Speaker",
                    type: "entertainment",
                  },
                ]);
                setInsights([
                  {
                    id: "insight-1",
                    title: "Energy Saving Opportunity",
                    description:
                      "Your living room lights are often left on when no one is present. Consider adding a motion sensor to automatically turn them off.",
                    priority: "medium",
                    type: "energy",
                    potentialSavings: 15.2,
                  },
                  {
                    id: "insight-2",
                    title: "Optimal Temperature",
                    description:
                      "Your bedroom temperature is frequently set below recommended sleeping temperatures. Setting it to 19-21°C could improve sleep quality and save energy.",
                    priority: "low",
                    type: "comfort",
                    potentialSavings: 8.5,
                  },
                  {
                    id: "insight-3",
                    title: "Peak Usage Alert",
                    description:
                      "Your energy usage peaks between 6-8pm when electricity rates are highest. Consider shifting some activities to off-peak hours.",
                    priority: "high",
                    type: "energy",
                    potentialSavings: 22.7,
                  },
                ]);
                return [3 /*break*/, 13];
              case 12:
                setIsLoading(false);
                return [7 /*endfinally*/];
              case 13:
                return [2 /*return*/];
            }
          });
        });
      };
      fetchData();
    },
    [timeRange],
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <framer_motion_1.motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white">Data Insights</h1>
        <p className="mt-2 text-gray-400">
          Visualize and analyze your smart home data to optimize energy usage
          and comfort
        </p>
      </framer_motion_1.motion.div>

      {/* Time Range Selector */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={function () {
              return setTimeRange("day");
            }}
            className={"rounded-md px-4 py-2 ".concat(
              timeRange === "day"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700",
            )}
          >
            Day
          </button>
          <button
            onClick={function () {
              return setTimeRange("week");
            }}
            className={"rounded-md px-4 py-2 ".concat(
              timeRange === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700",
            )}
          >
            Week
          </button>
          <button
            onClick={function () {
              return setTimeRange("month");
            }}
            className={"rounded-md px-4 py-2 ".concat(
              timeRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700",
            )}
          >
            Month
          </button>
        </div>

        {/* Room Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Filter by room:</span>
          <select
            value={selectedRoom || ""}
            onChange={function (e) {
              return setSelectedRoom(e.target.value || null);
            }}
            className="rounded-md bg-gray-800 px-3 py-2 text-white"
          >
            <option value="">All Rooms</option>
            {rooms.map(function (room) {
              return (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Charts */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="glass rounded-xl p-6">
          <EnergyConsumptionChart_1.default
            timeRange={timeRange}
            roomId={selectedRoom || undefined}
            colorScheme="blue"
          />
        </div>

        <div className="glass rounded-xl p-6">
          <DeviceUsageChart_1.default
            timeRange={timeRange}
            viewType="time"
            roomId={selectedRoom || undefined}
          />
        </div>
      </div>

      {/* Environmental Charts */}
      <h2 className="mb-4 text-2xl font-bold text-white">
        Environmental Trends
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        <div className="glass rounded-xl p-6">
          <EnvironmentalTrendsChart_1.default
            timeRange={timeRange}
            metricType="temperature"
            roomId={selectedRoom || undefined}
            colorScheme="red"
          />
        </div>

        <div className="glass rounded-xl p-6">
          <EnvironmentalTrendsChart_1.default
            timeRange={timeRange}
            metricType="humidity"
            roomId={selectedRoom || undefined}
            colorScheme="blue"
          />
        </div>

        <div className="glass rounded-xl p-6">
          <EnvironmentalTrendsChart_1.default
            timeRange={timeRange}
            metricType="air_quality"
            roomId={selectedRoom || undefined}
            colorScheme="green"
          />
        </div>
      </div>

      {/* AI Insights */}
      <h2 className="mb-4 text-2xl font-bold text-white">AI Insights</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {insights.map(function (insight) {
          return (
            <AdaptiveCard_1.default
              key={insight.id}
              title={insight.title}
              priority={insight.priority}
              contextInfo={"Potential savings: $".concat(
                insight.potentialSavings.toFixed(2),
                " per month",
              )}
              icon={
                insight.type === "energy" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ) : insight.type === "comfort" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                )
              }
            >
              <p className="text-gray-300">{insight.description}</p>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                  Apply
                </button>
                <button className="rounded border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700">
                  Ignore
                </button>
              </div>
            </AdaptiveCard_1.default>
          );
        })}
      </div>
    </div>
  );
};
exports.default = DataInsights;

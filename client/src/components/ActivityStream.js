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
var framer_motion_1 = require("framer-motion");
var ActivityStream = function (_a) {
  var _b = _a.className,
    className = _b === void 0 ? "" : _b,
    _c = _a.maxItems,
    maxItems = _c === void 0 ? 10 : _c;
  var _d = (0, react_1.useState)([]),
    activities = _d[0],
    setActivities = _d[1];
  var _e = (0, react_1.useState)(true),
    loading = _e[0],
    setLoading = _e[1];
  (0, react_1.useEffect)(
    function () {
      var fetchActivities = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var response, data, error_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 3, 4, 5]);
                return [4 /*yield*/, fetch("/api/activities/recent")];
              case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
              case 2:
                data = _a.sent();
                setActivities(data);
                return [3 /*break*/, 5];
              case 3:
                error_1 = _a.sent();
                console.error("Failed to fetch activities:", error_1);
                // Use mock data for development
                setActivities([
                  {
                    id: "1",
                    type: "user",
                    message: "Front Door unlocked",
                    timestamp: new Date(),
                    actor: "Sarah",
                    details: "Using mobile app",
                  },
                  {
                    id: "2",
                    type: "automation",
                    message: "Living Room lights adjusted",
                    timestamp: new Date(Date.now() - 5 * 60 * 1000),
                    actor: "JASON",
                    details: "Learning: evening ambiance",
                  },
                  {
                    id: "3",
                    type: "alert",
                    message: "Water leak detected",
                    timestamp: new Date(Date.now() - 15 * 60 * 1000),
                    actor: "Basement Sensor",
                    details: "Anomaly: High moisture level",
                  },
                ]);
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
      fetchActivities();
      var eventSource = new EventSource("/api/activities/stream");
      eventSource.onmessage = function (event) {
        var newActivity = JSON.parse(event.data);
        setActivities(function (prev) {
          return __spreadArray([newActivity], prev, true).slice(0, maxItems);
        });
      };
      return function () {
        return eventSource.close();
      };
    },
    [maxItems],
  );
  var getActivityIcon = function (type) {
    switch (type) {
      case "device":
        return "🔌";
      case "automation":
        return "⚡";
      case "alert":
        return "⚠️";
      case "learning":
        return "🧠";
      case "user":
        return "👤";
      default:
        return "📝";
    }
  };
  var getActivityStyle = function (type) {
    switch (type) {
      case "alert":
        return "border-red-500/30 bg-red-500/10";
      case "learning":
        return "border-purple-500/30 bg-purple-500/10";
      case "automation":
        return "border-blue-500/30 bg-blue-500/10";
      case "user":
        return "border-green-500/30 bg-green-500/10";
      default:
        return "border-gray-500/30 bg-gray-800/30";
    }
  };
  if (loading) {
    return (
      <div className={"rounded-xl bg-gray-800/30 p-4 ".concat(className)}>
        <div className="flex animate-pulse space-x-4">
          <div className="h-12 w-12 rounded-full bg-gray-700"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 w-3/4 rounded bg-gray-700"></div>
            <div className="space-y-2">
              <div className="h-4 w-5/6 rounded bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={"rounded-xl bg-gray-800/30 p-4 ".concat(className)}>
      <h3 className="mb-4 text-lg font-semibold text-white">Activity Stream</h3>
      <div className="space-y-3">
        <framer_motion_1.AnimatePresence>
          {activities.map(function (activity) {
            return (
              <framer_motion_1.motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={"flex items-start space-x-3 rounded-lg border p-3 ".concat(
                  getActivityStyle(activity.type),
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                  <span role="img" aria-label={activity.type}>
                    {activity.icon || getActivityIcon(activity.type)}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-white">
                    <span className="font-medium text-blue-400">
                      {activity.actor}
                    </span>{" "}
                    {activity.message}
                  </p>
                  {activity.details && (
                    <p className="mt-1 text-xs text-gray-400">
                      {activity.details}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </framer_motion_1.motion.div>
            );
          })}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>
  );
};
exports.default = ActivityStream;

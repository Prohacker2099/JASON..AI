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
exports.useAdaptiveTheme = void 0;
var react_1 = require("react");
var useAdaptiveTheme = function () {
  var _a = (0, react_1.useState)({
      primary: "from-blue-500 to-purple-600",
      secondary: "from-indigo-500 to-purple-500",
      accent: "blue-400",
      background: "bg-gray-900",
      cardBackground: "bg-gray-800/30",
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
    }),
    theme = _a[0],
    setTheme = _a[1];
  var getTimeBasedTheme = function (hour) {
    if (hour >= 5 && hour < 12) {
      // Morning
      return {
        primary: "from-amber-400 to-orange-500",
        secondary: "from-yellow-300 to-amber-500",
        background: "bg-gradient-to-br from-sky-900 to-indigo-900",
        cardBackground: "bg-sky-800/20",
      };
    } else if (hour >= 12 && hour < 17) {
      // Afternoon
      return {
        primary: "from-sky-400 to-blue-500",
        secondary: "from-blue-400 to-indigo-500",
        background: "bg-gradient-to-br from-blue-900 to-indigo-900",
        cardBackground: "bg-blue-800/20",
      };
    } else if (hour >= 17 && hour < 22) {
      // Evening
      return {
        primary: "from-purple-400 to-pink-500",
        secondary: "from-indigo-400 to-purple-500",
        background: "bg-gradient-to-br from-purple-900 to-indigo-900",
        cardBackground: "bg-purple-800/20",
      };
    } else {
      // Night
      return {
        primary: "from-indigo-400 to-blue-500",
        secondary: "from-blue-400 to-indigo-500",
        background: "bg-gradient-to-br from-gray-900 to-indigo-900",
        cardBackground: "bg-gray-800/20",
      };
    }
  };
  var getWeatherBasedTheme = function (weather) {
    if (weather.condition.includes("rain")) {
      return {
        primary: "from-blue-400 to-indigo-500",
        accent: "blue-300",
        cardBackground: "bg-blue-900/20",
      };
    } else if (weather.condition.includes("snow")) {
      return {
        primary: "from-blue-200 to-indigo-400",
        accent: "blue-200",
        cardBackground: "bg-blue-800/10",
      };
    } else if (weather.condition.includes("cloud")) {
      return {
        primary: "from-gray-400 to-blue-500",
        accent: "gray-300",
        cardBackground: "bg-gray-800/20",
      };
    } else if (!weather.isDay) {
      return {
        primary: "from-indigo-400 to-purple-500",
        accent: "indigo-300",
        cardBackground: "bg-indigo-900/20",
      };
    } else {
      return {
        primary: "from-amber-400 to-orange-500",
        accent: "amber-300",
        cardBackground: "bg-amber-900/20",
      };
    }
  };
  (0, react_1.useEffect)(function () {
    var updateTheme = function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var hour, timeTheme, response, weatherData, weatherTheme_1, error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              hour = new Date().getHours();
              timeTheme = getTimeBasedTheme(hour);
              _a.label = 1;
            case 1:
              _a.trys.push([1, 4, , 5]);
              return [4 /*yield*/, fetch("/api/weather/current")];
            case 2:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 3:
              weatherData = _a.sent();
              weatherTheme_1 = getWeatherBasedTheme(weatherData);
              setTheme(function (prevTheme) {
                return __assign(
                  __assign(__assign({}, prevTheme), timeTheme),
                  weatherTheme_1,
                );
              });
              return [3 /*break*/, 5];
            case 4:
              error_1 = _a.sent();
              // Fallback to just time-based theme if weather fetch fails
              setTheme(function (prevTheme) {
                return __assign(__assign({}, prevTheme), timeTheme);
              });
              return [3 /*break*/, 5];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    };
    updateTheme();
    var interval = setInterval(updateTheme, 5 * 60 * 1000); // Update every 5 minutes
    return function () {
      return clearInterval(interval);
    };
  }, []);
  return theme;
};
exports.useAdaptiveTheme = useAdaptiveTheme;

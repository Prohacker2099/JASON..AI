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
var ProactiveNudges = function (_a) {
  var _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var _c = (0, react_1.useState)([]),
    suggestions = _c[0],
    setSuggestions = _c[1];
  var _d = (0, react_1.useState)(true),
    loading = _d[0],
    setLoading = _d[1];
  (0, react_1.useEffect)(function () {
    var fetchSuggestions = function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 3, 4, 5]);
              return [4 /*yield*/, fetch("/api/suggestions/proactive")];
            case 1:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 2:
              data = _a.sent();
              setSuggestions(data);
              return [3 /*break*/, 5];
            case 3:
              error_1 = _a.sent();
              console.error("Failed to fetch suggestions:", error_1);
              // Mock data for development
              setSuggestions([
                {
                  id: "1",
                  title: 'Create "Leaving Home" Scene',
                  description:
                    "I've noticed you always turn off the lights when leaving for work. Would you like me to create an automated scene?",
                  type: "scene",
                  confidence: 0.89,
                  actions: [
                    {
                      label: "Create Scene",
                      action: function () {
                        return console.log("Creating scene...");
                      },
                    },
                    {
                      label: "Not Now",
                      action: function () {
                        return console.log("Dismissed");
                      },
                    },
                  ],
                },
                {
                  id: "2",
                  title: "Pre-cool Living Room",
                  description:
                    "Your living room typically cools down around now. Pre-cool by 2 degrees?",
                  type: "comfort",
                  confidence: 0.75,
                  actions: [
                    {
                      label: "Adjust Temperature",
                      action: function () {
                        return console.log("Adjusting temperature...");
                      },
                    },
                    {
                      label: "Skip",
                      action: function () {
                        return console.log("Skipped");
                      },
                    },
                  ],
                  expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
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
    fetchSuggestions();
    var interval = setInterval(fetchSuggestions, 5 * 60 * 1000); // Refresh every 5 minutes
    return function () {
      return clearInterval(interval);
    };
  }, []);
  var handleAction = function (suggestionId, action) {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, action()];
          case 1:
            _a.sent();
            setSuggestions(function (prev) {
              return prev.filter(function (s) {
                return s.id !== suggestionId;
              });
            });
            return [2 /*return*/];
        }
      });
    });
  };
  var getSuggestionIcon = function (type) {
    switch (type) {
      case "scene":
        return "🎬";
      case "automation":
        return "⚡";
      case "optimization":
        return "📊";
      case "comfort":
        return "🌡️";
      case "security":
        return "🔒";
      default:
        return "💡";
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
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <div className={"space-y-4 ".concat(className)}>
      <framer_motion_1.AnimatePresence>
        {suggestions.map(function (suggestion) {
          return (
            <framer_motion_1.motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-purple-500/10 p-4"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 text-2xl">
                  <span role="img" aria-label={suggestion.type}>
                    {getSuggestionIcon(suggestion.type)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-white">
                    {suggestion.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-300">
                    {suggestion.description}
                  </p>

                  {suggestion.confidence > 0.8 && (
                    <div className="mt-2 flex items-center text-xs text-green-400">
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      High Confidence Suggestion
                    </div>
                  )}

                  <div className="mt-4 flex space-x-3">
                    {suggestion.actions.map(function (action, index) {
                      return (
                        <button
                          key={index}
                          onClick={function () {
                            return handleAction(suggestion.id, action.action);
                          }}
                          className={"rounded-lg px-4 py-2 text-sm font-medium transition-colors ".concat(
                            index === 0
                              ? "bg-purple-500 text-white hover:bg-purple-600"
                              : "border border-purple-500/30 text-purple-400 hover:bg-purple-500/20",
                          )}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>

                  {suggestion.expiresAt && (
                    <p className="mt-3 text-xs text-gray-500">
                      Expires in{" "}
                      {Math.round(
                        (new Date(suggestion.expiresAt).getTime() -
                          Date.now()) /
                          60000,
                      )}{" "}
                      minutes
                    </p>
                  )}
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-800/50">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    inlineSize: "".concat(suggestion.confidence * 100, "%"),
                  }}
                />
              </div>
            </framer_motion_1.motion.div>
          );
        })}
      </framer_motion_1.AnimatePresence>
    </div>
  );
};
exports.default = ProactiveNudges;

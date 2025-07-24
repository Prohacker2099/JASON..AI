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
var framer_motion_1 = require("framer-motion");
var AdaptiveCard_js_1 = require("./AdaptiveCard.js");
var ActivityStream_js_1 = require("./ActivityStream.js");
var ProactiveNudges_js_1 = require("./ProactiveNudges.js");
var useAdaptiveTheme_js_1 = require("../hooks/useAdaptiveTheme.js");
var ContextualDashboard = function (_a) {
  var userId = _a.userId,
    _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var theme = (0, useAdaptiveTheme_js_1.useAdaptiveTheme)();
  var _c = (0, react_1.useState)([]),
    cards = _c[0],
    setCards = _c[1];
  var _d = (0, react_1.useState)(true),
    loading = _d[0],
    setLoading = _d[1];
  var _e = (0, react_1.useState)(null),
    error = _e[0],
    setError = _e[1];
  var _f = (0, react_1.useState)(null),
    userPreferences = _f[0],
    setUserPreferences = _f[1];
  var _g = (0, react_1.useState)("morning"),
    timeOfDay = _g[0],
    setTimeOfDay = _g[1];
  // Determine time of day
  (0, react_1.useEffect)(function () {
    var hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay("morning");
    } else if (hour >= 12 && hour < 17) {
      setTimeOfDay("afternoon");
    } else if (hour >= 17 && hour < 22) {
      setTimeOfDay("evening");
    } else {
      setTimeOfDay("night");
    }
  }, []);
  // Fetch user preferences and contextual cards
  (0, react_1.useEffect)(
    function () {
      var fetchData = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var prefsResponse, prefsData, cardsResponse, cardsData, err_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                setLoading(true);
                setError(null);
                _a.label = 1;
              case 1:
                _a.trys.push([1, 6, 7, 8]);
                return [
                  4 /*yield*/,
                  fetch("/api/users/".concat(userId, "/preferences")),
                ];
              case 2:
                prefsResponse = _a.sent();
                if (!prefsResponse.ok) {
                  throw new Error("Failed to fetch user preferences");
                }
                return [4 /*yield*/, prefsResponse.json()];
              case 3:
                prefsData = _a.sent();
                setUserPreferences(prefsData);
                return [
                  4 /*yield*/,
                  fetch(
                    "/api/users/"
                      .concat(userId, "/contextual-cards?timeOfDay=")
                      .concat(timeOfDay),
                  ),
                ];
              case 4:
                cardsResponse = _a.sent();
                if (!cardsResponse.ok) {
                  throw new Error("Failed to fetch contextual cards");
                }
                return [4 /*yield*/, cardsResponse.json()];
              case 5:
                cardsData = _a.sent();
                setCards(cardsData);
                return [3 /*break*/, 8];
              case 6:
                err_1 = _a.sent();
                console.error("Error fetching contextual data:", err_1);
                setError("Failed to load your personalized dashboard");
                // Generate mock data for development
                generateMockCards();
                return [3 /*break*/, 8];
              case 7:
                setLoading(false);
                return [7 /*endfinally*/];
              case 8:
                return [2 /*return*/];
            }
          });
        });
      };
      fetchData();
    },
    [userId, timeOfDay],
  );
  // Generate mock cards for development
  var generateMockCards = function () {
    var mockCards = [
      {
        id: "card-1",
        title: "Good Morning Routine",
        content: (
          <div>
            <p className="mb-2 text-gray-300">
              Your morning routine is ready to activate.
            </p>
            <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Start Routine
            </button>
          </div>
        ),
        priority: "medium",
        contextInfo: "Based on your usual morning schedule",
        type: "automation",
        interactionCount: 15,
        lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        dismissible: true,
        expandable: true,
      },
      {
        id: "card-2",
        title: "Energy Usage Alert",
        content: (
          <div>
            <p className="mb-2 text-gray-300">
              Your living room lights have been on for 8 hours.
            </p>
            <div className="flex space-x-2">
              <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Turn Off
              </button>
              <button className="rounded border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700">
                Ignore
              </button>
            </div>
          </div>
        ),
        priority: "high",
        type: "alert",
        interactionCount: 3,
        lastInteraction: null,
        dismissible: true,
        expandable: true,
      },
      {
        id: "card-3",
        title: "New Automation Suggestion",
        content: (
          <div>
            <p className="mb-2 text-gray-300">
              I've noticed you typically turn on the kitchen lights and start
              the coffee maker around 7:00 AM on weekdays. Would you like to
              automate this?
            </p>
            <div className="flex space-x-2">
              <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Create Automation
              </button>
              <button className="rounded border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700">
                Not Now
              </button>
            </div>
          </div>
        ),
        priority: "medium",
        contextInfo: "Based on your activity patterns over the last 2 weeks",
        type: "suggestion",
        interactionCount: 0,
        lastInteraction: null,
        dismissible: true,
        expandable: true,
      },
      {
        id: "card-4",
        title: "Weather Impact",
        content: (
          <div>
            <p className="mb-2 text-gray-300">
              Rain is expected this afternoon. Would you like me to close the
              windows and adjust the thermostat when it starts?
            </p>
            <div className="flex space-x-2">
              <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Yes, Please
              </button>
              <button className="rounded border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700">
                No Thanks
              </button>
            </div>
          </div>
        ),
        priority: "medium",
        contextInfo: "Based on weather forecast and your preferences",
        type: "insight",
        interactionCount: 7,
        lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        dismissible: true,
        expandable: true,
      },
      {
        id: "card-5",
        title: "Security Camera Motion",
        content: (
          <div>
            <p className="mb-2 text-gray-300">
              Motion detected at the front door camera at 8:32 AM.
            </p>
            <div className="rounded bg-gray-800 p-2">
              <div className="aspect-video bg-gray-900"></div>
              <p className="mt-2 text-xs text-gray-400">
                Tap to view recording
              </p>
            </div>
          </div>
        ),
        priority: "high",
        type: "alert",
        interactionCount: 1,
        lastInteraction: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        dismissible: true,
        expandable: true,
      },
    ];
    setCards(mockCards);
  };
  // Handle card dismissal
  var handleDismiss = function (cardId) {
    setCards(
      cards.filter(function (card) {
        return card.id !== cardId;
      }),
    );
  };
  // Handle card expansion
  var handleExpand = function (cardId) {
    // Update interaction count
    setCards(
      cards.map(function (card) {
        return card.id === cardId
          ? __assign(__assign({}, card), {
              interactionCount: card.interactionCount + 1,
              lastInteraction: new Date(),
            })
          : card;
      }),
    );
  };
  // Sort cards by priority and relevance
  var sortedCards = __spreadArray([], cards, true).sort(function (a, b) {
    // First sort by priority
    var priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    var priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // Then by interaction recency (if available)
    if (a.lastInteraction && b.lastInteraction) {
      return b.lastInteraction.getTime() - a.lastInteraction.getTime();
    }
    // Then by interaction count (higher count = more relevant)
    return b.interactionCount - a.interactionCount;
  });
  // Get icon for card type
  var getCardIcon = function (type) {
    switch (type) {
      case "device":
        return (
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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "automation":
        return (
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      case "alert":
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "insight":
        return (
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "suggestion":
        return (
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
        );
      default:
        return null;
    }
  };
  if (loading) {
    return (
      <div
        className={"flex items-center justify-center p-8 ".concat(className)}
      >
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={"p-8 ".concat(className)}>
        <div className="rounded-lg bg-red-900/20 p-4 text-red-400">
          <p>{error}</p>
          <button
            className="mt-2 text-blue-400 hover:text-blue-300"
            onClick={function () {
              return generateMockCards();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      className={""
        .concat(className, " ")
        .concat(
          theme.background,
          " min-h-screen p-6 transition-colors duration-1000",
        )}
    >
      <framer_motion_1.motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-6 text-2xl font-bold text-white">
          {timeOfDay === "morning" && "Good Morning"}
          {timeOfDay === "afternoon" && "Good Afternoon"}
          {timeOfDay === "evening" && "Good Evening"}
          {timeOfDay === "night" && "Good Night"}
          {(
            userPreferences === null || userPreferences === void 0
              ? void 0
              : userPreferences.name
          )
            ? ", ".concat(userPreferences.name)
            : ""}
        </h2>

        {/* Proactive Nudges Section */}
        <ProactiveNudges_js_1.default className="mb-8" />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Cards Section - 3 columns */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedCards.map(function (card) {
              return (
                <AdaptiveCard_js_1.default
                  key={card.id}
                  title={card.title}
                  icon={getCardIcon(card.type)}
                  priority={card.priority}
                  contextInfo={card.contextInfo}
                  onDismiss={function () {
                    return handleDismiss(card.id);
                  }}
                  onExpand={function () {
                    return handleExpand(card.id);
                  }}
                  expandable={card.expandable}
                  dismissible={card.dismissible}
                  interactionCount={card.interactionCount}
                  lastInteraction={card.lastInteraction || undefined}
                  className="h-full"
                >
                  {card.content}
                </AdaptiveCard_js_1.default>
              );
            })}
          </div>

          {/* Activity Stream - 1 column */}
          <div className="lg:col-span-1">
            <ActivityStream_js_1.default className="sticky top-6" />
          </div>
        </div>

        {sortedCards.length === 0 && (
          <div className="rounded-xl bg-gray-800/50 p-8 text-center">
            <p className="text-gray-400">No cards to display right now.</p>
          </div>
        )}
      </framer_motion_1.motion.div>
    </div>
  );
};
exports.default = ContextualDashboard;

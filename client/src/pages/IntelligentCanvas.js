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
var lucide_react_1 = require("lucide-react");
var IntelligentCanvas = function () {
  var _a = (0, react_1.useState)(false),
    isListening = _a[0],
    setIsListening = _a[1];
  var _b = (0, react_1.useState)("morning"),
    timeOfDay = _b[0],
    setTimeOfDay = _b[1];
  var _c = (0, react_1.useState)([]),
    liveCards = _c[0],
    setLiveCards = _c[1];
  var _d = (0, react_1.useState)([]),
    proactiveNudges = _d[0],
    setProactiveNudges = _d[1];
  var _e = (0, react_1.useState)([]),
    recentActivity = _e[0],
    setRecentActivity = _e[1];
  var _f = (0, react_1.useState)(0),
    totalEarnings = _f[0],
    setTotalEarnings = _f[1];
  var _g = (0, react_1.useState)(0),
    todayEarnings = _g[0],
    setTodayEarnings = _g[1];
  var _h = (0, react_1.useState)(false),
    jasonOrbPulse = _h[0],
    setJasonOrbPulse = _h[1];
  var canvasRef = (0, react_1.useRef)(null);
  // Initialize time-based greeting and theme
  (0, react_1.useEffect)(function () {
    var updateTimeOfDay = function () {
      var hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay("morning");
      else if (hour >= 12 && hour < 17) setTimeOfDay("afternoon");
      else if (hour >= 17 && hour < 21) setTimeOfDay("evening");
      else setTimeOfDay("night");
    };
    updateTimeOfDay();
    var interval = setInterval(updateTimeOfDay, 60000); // Update every minute
    return function () {
      return clearInterval(interval);
    };
  }, []);
  // Initialize live cards with real-time data
  (0, react_1.useEffect)(function () {
    var initializeLiveCards = function () {
      var cards = [
        {
          id: "smart-lights",
          title: "Living Room Lights",
          type: "device",
          icon: <lucide_react_1.Lightbulb className="w-6 h-6" />,
          status: "active",
          value: "75%",
          description: "Warm white, dimmed for evening",
          lastUpdated: new Date(),
          priority: 8,
          interactionCount: 23,
          glowColor: "from-yellow-400 to-orange-500",
          animation: "glow",
        },
        {
          id: "thermostat",
          title: "Climate Control",
          type: "device",
          icon: <lucide_react_1.Thermometer className="w-6 h-6" />,
          status: "active",
          value: "72°F",
          description: "Optimal temperature maintained",
          lastUpdated: new Date(),
          priority: 9,
          interactionCount: 15,
          glowColor: "from-blue-400 to-cyan-500",
          animation: "breathe",
        },
        {
          id: "data-earnings",
          title: "Data Dividend",
          type: "earning",
          icon: <lucide_react_1.DollarSign className="w-6 h-6" />,
          status: "earning",
          value: "$12.47",
          description: "Earned today from ethical data sharing",
          lastUpdated: new Date(),
          priority: 10,
          interactionCount: 5,
          glowColor: "from-green-400 to-emerald-500",
          animation: "sparkle",
        },
        {
          id: "ai-insight",
          title: "Energy Optimization",
          type: "insight",
          icon: <lucide_react_1.Brain className="w-6 h-6" />,
          status: "active",
          value: "23%",
          description: "Savings achieved through AI automation",
          lastUpdated: new Date(),
          priority: 7,
          interactionCount: 8,
          glowColor: "from-purple-400 to-pink-500",
          animation: "pulse",
        },
        {
          id: "security",
          title: "Home Security",
          type: "device",
          icon: <lucide_react_1.Shield className="w-6 h-6" />,
          status: "active",
          value: "Armed",
          description: "All sensors active, perimeter secure",
          lastUpdated: new Date(),
          priority: 10,
          interactionCount: 3,
          glowColor: "from-red-400 to-rose-500",
          animation: "pulse",
        },
        {
          id: "phone-integration",
          title: "Connected Devices",
          type: "device",
          icon: <lucide_react_1.Smartphone className="w-6 h-6" />,
          status: "active",
          value: "4",
          description: "Phones and tablets integrated",
          lastUpdated: new Date(),
          priority: 6,
          interactionCount: 12,
          glowColor: "from-indigo-400 to-blue-500",
          animation: "glow",
        },
      ];
      // Sort by priority and interaction count
      cards.sort(function (a, b) {
        return (
          b.priority * 10 +
          b.interactionCount -
          (a.priority * 10 + a.interactionCount)
        );
      });
      setLiveCards(cards);
    };
    initializeLiveCards();
  }, []);
  // Initialize proactive nudges
  (0, react_1.useEffect)(function () {
    var nudges = [
      {
        id: "coffee-ready",
        type: "suggestion",
        title: "Coffee is Ready!",
        description: "Your morning coffee finished brewing 2 minutes ago",
        action: "dismiss",
        actionLabel: "Thanks!",
        priority: "medium",
        icon: <lucide_react_1.Coffee className="w-5 h-5" />,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: "data-opportunity",
        type: "opportunity",
        title: "Earn $5.20 Today",
        description:
          "Share anonymized energy usage data with GreenTech Research",
        action: "view-opportunity",
        actionLabel: "View Details",
        priority: "high",
        icon: <lucide_react_1.TrendingUp className="w-5 h-5" />,
        timestamp: new Date(),
        earnings: 5.2,
      },
      {
        id: "automation-suggestion",
        type: "insight",
        title: "Smart Automation Detected",
        description:
          "I noticed you always dim the lights at 8 PM. Should I automate this?",
        action: "create-automation",
        actionLabel: "Create Rule",
        priority: "medium",
        icon: <lucide_react_1.Zap className="w-5 h-5" />,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
    ];
    setProactiveNudges(nudges);
  }, []);
  // Initialize recent activity
  (0, react_1.useEffect)(function () {
    var activities = [
      {
        id: "1",
        type: "earning",
        description: "Earned $2.15 from energy pattern data",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        icon: <lucide_react_1.DollarSign className="w-4 h-4" />,
        earnings: 2.15,
      },
      {
        id: "2",
        type: "device",
        description: "Living room lights dimmed to 60%",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        icon: <lucide_react_1.Lightbulb className="w-4 h-4" />,
      },
      {
        id: "3",
        type: "automation",
        description: "Evening routine activated automatically",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        icon: <lucide_react_1.Home className="w-4 h-4" />,
      },
      {
        id: "4",
        type: "earning",
        description: "Earned $1.80 from device usage insights",
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        icon: <lucide_react_1.DollarSign className="w-4 h-4" />,
        earnings: 1.8,
      },
      {
        id: "5",
        type: "insight",
        description: "AI detected optimal temperature schedule",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        icon: <lucide_react_1.Brain className="w-4 h-4" />,
      },
    ];
    setRecentActivity(activities);
    // Calculate earnings
    var total = activities.reduce(function (sum, activity) {
      return sum + (activity.earnings || 0);
    }, 0);
    setTotalEarnings(total);
    setTodayEarnings(total);
  }, []);
  // JASON Orb pulse effect
  (0, react_1.useEffect)(function () {
    var interval = setInterval(function () {
      setJasonOrbPulse(true);
      setTimeout(function () {
        return setJasonOrbPulse(false);
      }, 1000);
    }, 5000);
    return function () {
      return clearInterval(interval);
    };
  }, []);
  var getTimeBasedGreeting = function () {
    var greetings = {
      morning: "Good morning! Your coffee machine is pre-heating ☕",
      afternoon: "Good afternoon! Energy savings are looking great today 🌱",
      evening:
        "Good evening! Your home is perfectly optimized for relaxation 🌙",
      night: "Good night! Security systems are active and all is well 🛡️",
    };
    return greetings[timeOfDay];
  };
  var getTimeBasedGradient = function () {
    var gradients = {
      morning: "from-orange-400 via-yellow-500 to-pink-500",
      afternoon: "from-blue-400 via-cyan-500 to-teal-500",
      evening: "from-purple-500 via-pink-500 to-red-500",
      night: "from-indigo-600 via-purple-600 to-blue-800",
    };
    return gradients[timeOfDay];
  };
  var handleVoiceToggle = function () {
    setIsListening(!isListening);
    // Here you would integrate with the voice assistant
  };
  var handleCardInteraction = function (cardId) {
    setLiveCards(function (cards) {
      return cards.map(function (card) {
        return card.id === cardId
          ? __assign(__assign({}, card), {
              interactionCount: card.interactionCount + 1,
            })
          : card;
      });
    });
  };
  var dismissNudge = function (nudgeId) {
    setProactiveNudges(function (nudges) {
      return nudges.map(function (nudge) {
        return nudge.id === nudgeId
          ? __assign(__assign({}, nudge), { dismissed: true })
          : nudge;
      });
    });
  };
  var formatTimeAgo = function (timestamp) {
    var now = new Date();
    var diffMs = now.getTime() - timestamp.getTime();
    var diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return "".concat(diffMins, "m ago");
    var diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return "".concat(diffHours, "h ago");
    return "".concat(Math.floor(diffHours / 24), "d ago");
  };
  return (
    <div
      ref={canvasRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden"
    >
      {/* Ambient Particle Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        {__spreadArray([], Array(20), true).map(function (_, i) {
          return (
            <framer_motion_1.motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: "".concat(Math.random() * 100, "%"),
                top: "".concat(Math.random() * 100, "%"),
              }}
            />
          );
        })}
      </div>

      {/* JASON Pulse Header */}
      <framer_motion_1.motion.div
        className={"relative z-10 bg-gradient-to-r ".concat(
          getTimeBasedGradient(),
          " p-6 shadow-2xl",
        )}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <framer_motion_1.motion.div
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              animate={{
                scale: jasonOrbPulse ? 1.1 : 1,
                boxShadow: jasonOrbPulse
                  ? "0 0 30px rgba(255,255,255,0.5)"
                  : "0 0 10px rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl font-bold">J</span>
            </framer_motion_1.motion.div>
            <div>
              <h1 className="text-3xl font-bold">JASON</h1>
              <p className="text-white/80">{getTimeBasedGreeting()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-white/80">Today's Earnings</p>
              <p className="text-2xl font-bold text-green-300">
                ${todayEarnings.toFixed(2)}
              </p>
            </div>
            <framer_motion_1.motion.button
              onClick={handleVoiceToggle}
              className={"w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ".concat(
                isListening
                  ? "bg-red-500 shadow-lg shadow-red-500/50"
                  : "bg-white/20 backdrop-blur-sm hover:bg-white/30",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isListening ? (
                <lucide_react_1.MicOff className="w-8 h-8" />
              ) : (
                <lucide_react_1.Mic className="w-8 h-8" />
              )}
            </framer_motion_1.motion.button>
          </div>
        </div>
      </framer_motion_1.motion.div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Proactive Nudges & Suggestions */}
        <framer_motion_1.AnimatePresence>
          {proactiveNudges.filter(function (nudge) {
            return !nudge.dismissed;
          }).length > 0 && (
            <framer_motion_1.motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <lucide_react_1.Heart className="w-6 h-6 mr-2 text-pink-400" />
                JASON's Suggestions
              </h2>
              <div className="grid gap-4">
                {proactiveNudges
                  .filter(function (nudge) {
                    return !nudge.dismissed;
                  })
                  .map(function (nudge) {
                    return (
                      <framer_motion_1.motion.div
                        key={nudge.id}
                        className={"p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 ".concat(
                          nudge.priority === "high"
                            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30"
                            : "bg-white/10 border-white/20",
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div
                              className={"p-2 rounded-lg ".concat(
                                nudge.priority === "high"
                                  ? "bg-green-500/30"
                                  : "bg-white/20",
                              )}
                            >
                              {nudge.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{nudge.title}</h3>
                              <p className="text-white/80 text-sm">
                                {nudge.description}
                              </p>
                              {nudge.earnings && (
                                <p className="text-green-400 text-sm font-semibold mt-1">
                                  💰 Potential earnings: $
                                  {nudge.earnings.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {nudge.actionLabel && (
                              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                                {nudge.actionLabel}
                              </button>
                            )}
                            <button
                              onClick={function () {
                                return dismissNudge(nudge.id);
                              }}
                              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </framer_motion_1.motion.div>
                    );
                  })}
              </div>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>

        {/* Your Universe At A Glance - Living Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <lucide_react_1.Zap className="w-8 h-8 mr-3 text-yellow-400" />
            Your Universe At A Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveCards.map(function (card) {
              return (
                <framer_motion_1.motion.div
                  key={card.id}
                  className={
                    "relative p-6 rounded-2xl backdrop-blur-sm border border-white/20 cursor-pointer group overflow-hidden"
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={function () {
                    return handleCardInteraction(card.id);
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Animated background glow */}
                  <framer_motion_1.motion.div
                    className={"absolute inset-0 bg-gradient-to-br ".concat(
                      card.glowColor,
                      " opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                    )}
                    animate={
                      card.animation === "glow"
                        ? {
                            opacity: [0.1, 0.3, 0.1],
                          }
                        : {}
                    }
                    transition={
                      card.animation === "glow"
                        ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={"p-3 rounded-xl bg-gradient-to-br ".concat(
                          card.glowColor,
                        )}
                      >
                        {card.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{card.value}</div>
                        <div
                          className={"text-xs px-2 py-1 rounded-full ".concat(
                            card.status === "active"
                              ? "bg-green-500/30 text-green-300"
                              : card.status === "earning"
                                ? "bg-green-500/30 text-green-300"
                                : card.status === "warning"
                                  ? "bg-yellow-500/30 text-yellow-300"
                                  : "bg-gray-500/30 text-gray-300",
                          )}
                        >
                          {card.status}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                    <p className="text-white/70 text-sm mb-3">
                      {card.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Used {card.interactionCount} times</span>
                      <span>{formatTimeAgo(card.lastUpdated)}</span>
                    </div>
                  </div>

                  {/* Sparkle animation for earning cards */}
                  {card.animation === "sparkle" && (
                    <div className="absolute inset-0 pointer-events-none">
                      {__spreadArray([], Array(5), true).map(function (_, i) {
                        return (
                          <framer_motion_1.motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                            animate={{
                              x: [0, Math.random() * 200, 0],
                              y: [0, Math.random() * 200, 0],
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2 + Math.random() * 2,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            }}
                            style={{
                              left: "".concat(Math.random() * 100, "%"),
                              top: "".concat(Math.random() * 100, "%"),
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </framer_motion_1.motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <lucide_react_1.Activity className="w-6 h-6 mr-2 text-blue-400" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity.map(function (activity) {
                return (
                  <framer_motion_1.motion.div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className={"p-2 rounded-lg ".concat(
                        activity.type === "earning"
                          ? "bg-green-500/30"
                          : activity.type === "device"
                            ? "bg-blue-500/30"
                            : activity.type === "automation"
                              ? "bg-purple-500/30"
                              : "bg-gray-500/30",
                      )}
                    >
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-white/50">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    {activity.earnings && (
                      <div className="text-green-400 font-semibold">
                        +${activity.earnings.toFixed(2)}
                      </div>
                    )}
                  </framer_motion_1.motion.div>
                );
              })}
            </div>
          </div>

          {/* Data Dividend Summary */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <lucide_react_1.TrendingUp className="w-6 h-6 mr-2 text-green-400" />
              Data Dividend
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300">
                    ${totalEarnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-400">Total Earned</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="font-semibold mb-2">Active Opportunities</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Energy Research</span>
                    <span className="text-green-400">$3.20/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Patterns</span>
                    <span className="text-green-400">$1.80/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Climate Data</span>
                    <span className="text-green-400">$2.15/day</span>
                  </div>
                </div>
              </div>

              <button className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
                View All Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
exports.default = IntelligentCanvas;
var IntelligentCanvas = function () {
  var _a = (0, react_1.useState)(false),
    isListening = _a[0],
    setIsListening = _a[1];
  var _b = (0, react_1.useState)("morning"),
    timeOfDay = _b[0],
    setTimeOfDay = _b[1];
  var _c = (0, react_1.useState)([]),
    liveCards = _c[0],
    setLiveCards = _c[1];
  var _d = (0, react_1.useState)([]),
    proactiveNudges = _d[0],
    setProactiveNudges = _d[1];
  var _e = (0, react_1.useState)([]),
    recentActivity = _e[0],
    setRecentActivity = _e[1];
  var _f = (0, react_1.useState)(0),
    totalEarnings = _f[0],
    setTotalEarnings = _f[1];
  var _g = (0, react_1.useState)(0),
    todayEarnings = _g[0],
    setTodayEarnings = _g[1];
  var _h = (0, react_1.useState)(false),
    jasonOrbPulse = _h[0],
    setJasonOrbPulse = _h[1];
  var canvasRef = (0, react_1.useRef)(null);
  // Initialize time-based greeting and theme
  (0, react_1.useEffect)(function () {
    var updateTimeOfDay = function () {
      var hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay("morning");
      else if (hour >= 12 && hour < 17) setTimeOfDay("afternoon");
      else if (hour >= 17 && hour < 21) setTimeOfDay("evening");
      else setTimeOfDay("night");
    };
    updateTimeOfDay();
    var interval = setInterval(updateTimeOfDay, 60000); // Update every minute
    return function () {
      return clearInterval(interval);
    };
  }, []);
  // Initialize live cards with real-time data
  (0, react_1.useEffect)(function () {
    var initializeLiveCards = function () {
      var cards = [
        {
          id: "smart-lights",
          title: "Living Room Lights",
          type: "device",
          icon: <lucide_react_1.Lightbulb className="w-6 h-6" />,
          status: "active",
          value: "75%",
          description: "Warm white, dimmed for evening",
          lastUpdated: new Date(),
          priority: 8,
          interactionCount: 23,
          glowColor: "from-yellow-400 to-orange-500",
          animation: "glow",
        },
        {
          id: "thermostat",
          title: "Climate Control",
          type: "device",
          icon: <lucide_react_1.Thermometer className="w-6 h-6" />,
          status: "active",
          value: "72°F",
          description: "Optimal temperature maintained",
          lastUpdated: new Date(),
          priority: 9,
          interactionCount: 15,
          glowColor: "from-blue-400 to-cyan-500",
          animation: "breathe",
        },
        {
          id: "data-earnings",
          title: "Data Dividend",
          type: "earning",
          icon: <lucide_react_1.DollarSign className="w-6 h-6" />,
          status: "earning",
          value: "$12.47",
          description: "Earned today from ethical data sharing",
          lastUpdated: new Date(),
          priority: 10,
          interactionCount: 5,
          glowColor: "from-green-400 to-emerald-500",
          animation: "sparkle",
        },
        {
          id: "ai-insight",
          title: "Energy Optimization",
          type: "insight",
          icon: <lucide_react_1.Brain className="w-6 h-6" />,
          status: "active",
          value: "23%",
          description: "Savings achieved through AI automation",
          lastUpdated: new Date(),
          priority: 7,
          interactionCount: 8,
          glowColor: "from-purple-400 to-pink-500",
          animation: "pulse",
        },
        {
          id: "security",
          title: "Home Security",
          type: "device",
          icon: <lucide_react_1.Shield className="w-6 h-6" />,
          status: "active",
          value: "Armed",
          description: "All sensors active, perimeter secure",
          lastUpdated: new Date(),
          priority: 10,
          interactionCount: 3,
          glowColor: "from-red-400 to-rose-500",
          animation: "pulse",
        },
        {
          id: "phone-integration",
          title: "Connected Devices",
          type: "device",
          icon: <lucide_react_1.Smartphone className="w-6 h-6" />,
          status: "active",
          value: "4",
          description: "Phones and tablets integrated",
          lastUpdated: new Date(),
          priority: 6,
          interactionCount: 12,
          glowColor: "from-indigo-400 to-blue-500",
          animation: "glow",
        },
      ];
      // Sort by priority and interaction count
      cards.sort(function (a, b) {
        return (
          b.priority * 10 +
          b.interactionCount -
          (a.priority * 10 + a.interactionCount)
        );
      });
      setLiveCards(cards);
    };
    initializeLiveCards();
  }, []);
  // Initialize proactive nudges
  (0, react_1.useEffect)(function () {
    var nudges = [
      {
        id: "coffee-ready",
        type: "suggestion",
        title: "Coffee is Ready!",
        description: "Your morning coffee finished brewing 2 minutes ago",
        action: "dismiss",
        actionLabel: "Thanks!",
        priority: "medium",
        icon: <lucide_react_1.Coffee className="w-5 h-5" />,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: "data-opportunity",
        type: "opportunity",
        title: "Earn $5.20 Today",
        description:
          "Share anonymized energy usage data with GreenTech Research",
        action: "view-opportunity",
        actionLabel: "View Details",
        priority: "high",
        icon: <lucide_react_1.TrendingUp className="w-5 h-5" />,
        timestamp: new Date(),
        earnings: 5.2,
      },
      {
        id: "automation-suggestion",
        type: "insight",
        title: "Smart Automation Detected",
        description:
          "I noticed you always dim the lights at 8 PM. Should I automate this?",
        action: "create-automation",
        actionLabel: "Create Rule",
        priority: "medium",
        icon: <lucide_react_1.Zap className="w-5 h-5" />,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
    ];
    setProactiveNudges(nudges);
  }, []);
  // Initialize recent activity
  (0, react_1.useEffect)(function () {
    var activities = [
      {
        id: "1",
        type: "earning",
        description: "Earned $2.15 from energy pattern data",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        icon: <lucide_react_1.DollarSign className="w-4 h-4" />,
        earnings: 2.15,
      },
      {
        id: "2",
        type: "device",
        description: "Living room lights dimmed to 60%",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        icon: <lucide_react_1.Lightbulb className="w-4 h-4" />,
      },
      {
        id: "3",
        type: "automation",
        description: "Evening routine activated automatically",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        icon: <lucide_react_1.Home className="w-4 h-4" />,
      },
      {
        id: "4",
        type: "earning",
        description: "Earned $1.80 from device usage insights",
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        icon: <lucide_react_1.DollarSign className="w-4 h-4" />,
        earnings: 1.8,
      },
      {
        id: "5",
        type: "insight",
        description: "AI detected optimal temperature schedule",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        icon: <lucide_react_1.Brain className="w-4 h-4" />,
      },
    ];
    setRecentActivity(activities);
    // Calculate earnings
    var total = activities.reduce(function (sum, activity) {
      return sum + (activity.earnings || 0);
    }, 0);
    setTotalEarnings(total);
    setTodayEarnings(total);
  }, []);
  // JASON Orb pulse effect
  (0, react_1.useEffect)(function () {
    var interval = setInterval(function () {
      setJasonOrbPulse(true);
      setTimeout(function () {
        return setJasonOrbPulse(false);
      }, 1000);
    }, 5000);
    return function () {
      return clearInterval(interval);
    };
  }, []);
  var getTimeBasedGreeting = function () {
    var greetings = {
      morning: "Good morning! Your coffee machine is pre-heating ☕",
      afternoon: "Good afternoon! Energy savings are looking great today 🌱",
      evening:
        "Good evening! Your home is perfectly optimized for relaxation 🌙",
      night: "Good night! Security systems are active and all is well 🛡️",
    };
    return greetings[timeOfDay];
  };
  var getTimeBasedGradient = function () {
    var gradients = {
      morning: "from-orange-400 via-yellow-500 to-pink-500",
      afternoon: "from-blue-400 via-cyan-500 to-teal-500",
      evening: "from-purple-500 via-pink-500 to-red-500",
      night: "from-indigo-600 via-purple-600 to-blue-800",
    };
    return gradients[timeOfDay];
  };
  var handleVoiceToggle = function () {
    setIsListening(!isListening);
    // Here you would integrate with the voice assistant
  };
  var handleCardInteraction = function (cardId) {
    setLiveCards(function (cards) {
      return cards.map(function (card) {
        return card.id === cardId
          ? __assign(__assign({}, card), {
              interactionCount: card.interactionCount + 1,
            })
          : card;
      });
    });
  };
  var dismissNudge = function (nudgeId) {
    setProactiveNudges(function (nudges) {
      return nudges.map(function (nudge) {
        return nudge.id === nudgeId
          ? __assign(__assign({}, nudge), { dismissed: true })
          : nudge;
      });
    });
  };
  var formatTimeAgo = function (timestamp) {
    var now = new Date();
    var diffMs = now.getTime() - timestamp.getTime();
    var diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return "".concat(diffMins, "m ago");
    var diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return "".concat(diffHours, "h ago");
    return "".concat(Math.floor(diffHours / 24), "d ago");
  };
  return (
    <div
      ref={canvasRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden"
    >
      {/* Ambient Particle Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        {__spreadArray([], Array(20), true).map(function (_, i) {
          return (
            <framer_motion_1.motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: "".concat(Math.random() * 100, "%"),
                top: "".concat(Math.random() * 100, "%"),
              }}
            />
          );
        })}
      </div>

      {/* JASON Pulse Header */}
      <framer_motion_1.motion.div
        className={"relative z-10 bg-gradient-to-r ".concat(
          getTimeBasedGradient(),
          " p-6 shadow-2xl",
        )}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <framer_motion_1.motion.div
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              animate={{
                scale: jasonOrbPulse ? 1.1 : 1,
                boxShadow: jasonOrbPulse
                  ? "0 0 30px rgba(255,255,255,0.5)"
                  : "0 0 10px rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl font-bold">J</span>
            </framer_motion_1.motion.div>
            <div>
              <h1 className="text-3xl font-bold">JASON</h1>
              <p className="text-white/80">{getTimeBasedGreeting()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-white/80">Today's Earnings</p>
              <p className="text-2xl font-bold text-green-300">
                ${todayEarnings.toFixed(2)}
              </p>
            </div>
            <framer_motion_1.motion.button
              onClick={handleVoiceToggle}
              className={"w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ".concat(
                isListening
                  ? "bg-red-500 shadow-lg shadow-red-500/50"
                  : "bg-white/20 backdrop-blur-sm hover:bg-white/30",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isListening ? (
                <lucide_react_1.MicOff className="w-8 h-8" />
              ) : (
                <lucide_react_1.Mic className="w-8 h-8" />
              )}
            </framer_motion_1.motion.button>
          </div>
        </div>
      </framer_motion_1.motion.div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Proactive Nudges & Suggestions */}
        <framer_motion_1.AnimatePresence>
          {proactiveNudges.filter(function (nudge) {
            return !nudge.dismissed;
          }).length > 0 && (
            <framer_motion_1.motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <lucide_react_1.Heart className="w-6 h-6 mr-2 text-pink-400" />
                JASON's Suggestions
              </h2>
              <div className="grid gap-4">
                {proactiveNudges
                  .filter(function (nudge) {
                    return !nudge.dismissed;
                  })
                  .map(function (nudge) {
                    return (
                      <framer_motion_1.motion.div
                        key={nudge.id}
                        className={"p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 ".concat(
                          nudge.priority === "high"
                            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30"
                            : "bg-white/10 border-white/20",
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div
                              className={"p-2 rounded-lg ".concat(
                                nudge.priority === "high"
                                  ? "bg-green-500/30"
                                  : "bg-white/20",
                              )}
                            >
                              {nudge.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{nudge.title}</h3>
                              <p className="text-white/80 text-sm">
                                {nudge.description}
                              </p>
                              {nudge.earnings && (
                                <p className="text-green-400 text-sm font-semibold mt-1">
                                  💰 Potential earnings: $
                                  {nudge.earnings.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {nudge.actionLabel && (
                              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                                {nudge.actionLabel}
                              </button>
                            )}
                            <button
                              onClick={function () {
                                return dismissNudge(nudge.id);
                              }}
                              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </framer_motion_1.motion.div>
                    );
                  })}
              </div>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>

        {/* Your Universe At A Glance - Living Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <lucide_react_1.Zap className="w-8 h-8 mr-3 text-yellow-400" />
            Your Universe At A Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveCards.map(function (card) {
              return (
                <framer_motion_1.motion.div
                  key={card.id}
                  className={
                    "relative p-6 rounded-2xl backdrop-blur-sm border border-white/20 cursor-pointer group overflow-hidden"
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={function () {
                    return handleCardInteraction(card.id);
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Animated background glow */}
                  <framer_motion_1.motion.div
                    className={"absolute inset-0 bg-gradient-to-br ".concat(
                      card.glowColor,
                      " opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                    )}
                    animate={
                      card.animation === "glow"
                        ? {
                            opacity: [0.1, 0.3, 0.1],
                          }
                        : {}
                    }
                    transition={
                      card.animation === "glow"
                        ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={"p-3 rounded-xl bg-gradient-to-br ".concat(
                          card.glowColor,
                        )}
                      >
                        {card.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{card.value}</div>
                        <div
                          className={"text-xs px-2 py-1 rounded-full ".concat(
                            card.status === "active"
                              ? "bg-green-500/30 text-green-300"
                              : card.status === "earning"
                                ? "bg-green-500/30 text-green-300"
                                : card.status === "warning"
                                  ? "bg-yellow-500/30 text-yellow-300"
                                  : "bg-gray-500/30 text-gray-300",
                          )}
                        >
                          {card.status}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                    <p className="text-white/70 text-sm mb-3">
                      {card.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Used {card.interactionCount} times</span>
                      <span>{formatTimeAgo(card.lastUpdated)}</span>
                    </div>
                  </div>

                  {/* Sparkle animation for earning cards */}
                  {card.animation === "sparkle" && (
                    <div className="absolute inset-0 pointer-events-none">
                      {__spreadArray([], Array(5), true).map(function (_, i) {
                        return (
                          <framer_motion_1.motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                            animate={{
                              x: [0, Math.random() * 200, 0],
                              y: [0, Math.random() * 200, 0],
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2 + Math.random() * 2,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            }}
                            style={{
                              left: "".concat(Math.random() * 100, "%"),
                              top: "".concat(Math.random() * 100, "%"),
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </framer_motion_1.motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <lucide_react_1.Activity className="w-6 h-6 mr-2 text-blue-400" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity.map(function (activity) {
                return (
                  <framer_motion_1.motion.div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className={"p-2 rounded-lg ".concat(
                        activity.type === "earning"
                          ? "bg-green-500/30"
                          : activity.type === "device"
                            ? "bg-blue-500/30"
                            : activity.type === "automation"
                              ? "bg-purple-500/30"
                              : "bg-gray-500/30",
                      )}
                    >
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-white/50">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    {activity.earnings && (
                      <div className="text-green-400 font-semibold">
                        +${activity.earnings.toFixed(2)}
                      </div>
                    )}
                  </framer_motion_1.motion.div>
                );
              })}
            </div>
          </div>

          {/* Data Dividend Summary */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <lucide_react_1.TrendingUp className="w-6 h-6 mr-2 text-green-400" />
              Data Dividend
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300">
                    ${totalEarnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-400">Total Earned</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="font-semibold mb-2">Active Opportunities</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Energy Research</span>
                    <span className="text-green-400">$3.20/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Patterns</span>
                    <span className="text-green-400">$1.80/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Climate Data</span>
                    <span className="text-green-400">$2.15/day</span>
                  </div>
                </div>
              </div>

              <button className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
                View All Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
exports.default = IntelligentCanvas;

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
var JasonMobileApp = function () {
  var _a = (0, react_1.useState)("home"),
    currentPage = _a[0],
    setCurrentPage = _a[1];
  var _b = (0, react_1.useState)(false),
    isMenuOpen = _b[0],
    setIsMenuOpen = _b[1];
  var _c = (0, react_1.useState)([]),
    notifications = _c[0],
    setNotifications = _c[1];
  var _d = (0, react_1.useState)(false),
    showNotifications = _d[0],
    setShowNotifications = _d[1];
  var _e = (0, react_1.useState)(false),
    isDarkMode = _e[0],
    setIsDarkMode = _e[1];
  var _f = (0, react_1.useState)(85),
    batteryLevel = _f[0],
    setBatteryLevel = _f[1];
  var _g = (0, react_1.useState)(new Date()),
    currentTime = _g[0],
    setCurrentTime = _g[1];
  var _h = (0, react_1.useState)("wifi"),
    connectionStatus = _h[0],
    setConnectionStatus = _h[1];
  var _j = (0, react_1.useState)(false),
    isVoiceMode = _j[0],
    setIsVoiceMode = _j[1];
  var _k = (0, react_1.useState)(false),
    showQuickToggles = _k[0],
    setShowQuickToggles = _k[1];
  var _l = (0, react_1.useState)(""),
    searchQuery = _l[0],
    setSearchQuery = _l[1];
  var _m = (0, react_1.useState)([]),
    recentApps = _m[0],
    setRecentApps = _m[1];
  var _o = (0, react_1.useState)(["home", "share", "voice", "smart-home"]),
    favoriteApps = _o[0],
    setFavoriteApps = _o[1];
  var pageX = (0, framer_motion_1.useMotionValue)(0);
  var dragConstraints = (0, react_1.useRef)(null);
  // Quick toggles for control center
  var _p = (0, react_1.useState)([
      {
        id: "wifi",
        name: "Wi-Fi",
        icon: <lucide_react_1.Wifi className="w-5 h-5" />,
        enabled: true,
        action: function () {
          return toggleWifi();
        },
        color: "bg-blue-500",
      },
      {
        id: "bluetooth",
        name: "Bluetooth",
        icon: <lucide_react_1.Bluetooth className="w-5 h-5" />,
        enabled: true,
        action: function () {
          return toggleBluetooth();
        },
        color: "bg-indigo-500",
      },
      {
        id: "airplane",
        name: "Airplane",
        icon: <lucide_react_1.Airplane className="w-5 h-5" />,
        enabled: false,
        action: function () {
          return toggleAirplane();
        },
        color: "bg-orange-500",
      },
      {
        id: "flashlight",
        name: "Flashlight",
        icon: <lucide_react_1.Flashlight className="w-5 h-5" />,
        enabled: false,
        action: function () {
          return toggleFlashlight();
        },
        color: "bg-yellow-500",
      },
      {
        id: "dark-mode",
        name: "Dark Mode",
        icon: isDarkMode ? (
          <lucide_react_1.Moon className="w-5 h-5" />
        ) : (
          <lucide_react_1.Sun className="w-5 h-5" />
        ),
        enabled: isDarkMode,
        action: function () {
          return setIsDarkMode(!isDarkMode);
        },
        color: "bg-purple-500",
      },
      {
        id: "voice",
        name: "Voice Mode",
        icon: <lucide_react_1.Mic className="w-5 h-5" />,
        enabled: isVoiceMode,
        action: function () {
          return setIsVoiceMode(!isVoiceMode);
        },
        color: "bg-red-500",
      },
    ]),
    quickToggles = _p[0],
    setQuickToggles = _p[1];
  // App pages with billions of features
  var appPages = [
    {
      id: "home",
      name: "Home",
      icon: <lucide_react_1.Home className="w-6 h-6" />,
      component: <MobileOptimizedJasonInterface />,
      color: "bg-gradient-to-br from-blue-500 to-purple-600",
      category: "main",
    },
    {
      id: "share",
      name: "Share Hub",
      icon: <lucide_react_1.Share className="w-6 h-6" />,
      component: <AdvancedSharingSystem />,
      color: "bg-gradient-to-br from-green-500 to-teal-600",
      category: "main",
    },
    {
      id: "voice",
      name: "AI Buddy",
      icon: <lucide_react_1.Brain className="w-6 h-6" />,
      component: <EnhancedBuddyVoiceAssistant />,
      color: "bg-gradient-to-br from-purple-500 to-pink-600",
      category: "main",
    },
    {
      id: "smart-home",
      name: "Smart Home",
      icon: <lucide_react_1.Lightbulb className="w-6 h-6" />,
      component: <SmartHomeControl />,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      category: "main",
    },
    {
      id: "media",
      name: "Media Center",
      icon: <lucide_react_1.Music className="w-6 h-6" />,
      component: <MediaCenter />,
      color: "bg-gradient-to-br from-pink-500 to-rose-600",
      category: "entertainment",
    },
    {
      id: "camera",
      name: "AI Camera",
      icon: <lucide_react_1.Camera className="w-6 h-6" />,
      component: <AICamera />,
      color: "bg-gradient-to-br from-gray-600 to-gray-800",
      category: "tools",
    },
    {
      id: "files",
      name: "File Manager",
      icon: <lucide_react_1.Folder className="w-6 h-6" />,
      component: <FileManager />,
      color: "bg-gradient-to-br from-yellow-500 to-orange-600",
      category: "productivity",
    },
    {
      id: "weather",
      name: "Weather Pro",
      icon: <lucide_react_1.Sun className="w-6 h-6" />,
      component: <WeatherPro />,
      color: "bg-gradient-to-br from-sky-400 to-blue-600",
      category: "tools",
    },
    {
      id: "calendar",
      name: "Smart Calendar",
      icon: <lucide_react_1.Calendar className="w-6 h-6" />,
      component: <SmartCalendar />,
      color: "bg-gradient-to-br from-emerald-500 to-green-600",
      category: "productivity",
    },
    {
      id: "games",
      name: "AI Games",
      icon: <lucide_react_1.GameController2 className="w-6 h-6" />,
      component: <AIGames />,
      color: "bg-gradient-to-br from-violet-500 to-purple-600",
      category: "entertainment",
    },
    {
      id: "health",
      name: "Health Monitor",
      icon: <lucide_react_1.Heart className="w-6 h-6" />,
      component: <HealthMonitor />,
      color: "bg-gradient-to-br from-red-500 to-pink-600",
      category: "tools",
    },
    {
      id: "security",
      name: "Security Center",
      icon: <lucide_react_1.Shield className="w-6 h-6" />,
      component: <SecurityCenter />,
      color: "bg-gradient-to-br from-slate-600 to-gray-800",
      category: "tools",
    },
    {
      id: "social",
      name: "Social Hub",
      icon: <lucide_react_1.User className="w-6 h-6" />,
      component: <SocialHub />,
      color: "bg-gradient-to-br from-cyan-500 to-blue-600",
      category: "social",
    },
    {
      id: "productivity",
      name: "Productivity Suite",
      icon: <lucide_react_1.Zap className="w-6 h-6" />,
      component: <ProductivitySuite />,
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
      category: "productivity",
    },
    {
      id: "ar-vr",
      name: "AR/VR Portal",
      icon: <lucide_react_1.Sparkles className="w-6 h-6" />,
      component: <ARVRPortal />,
      color: "bg-gradient-to-br from-fuchsia-500 to-purple-600",
      category: "entertainment",
    },
    {
      id: "blockchain",
      name: "Crypto Wallet",
      icon: <lucide_react_1.Target className="w-6 h-6" />,
      component: <CryptoWallet />,
      color: "bg-gradient-to-br from-yellow-600 to-orange-700",
      category: "tools",
    },
  ];
  // Update time and battery
  (0, react_1.useEffect)(function () {
    var timer = setInterval(function () {
      setCurrentTime(new Date());
      // Simulate battery drain
      setBatteryLevel(function (prev) {
        return Math.max(0, prev - Math.random() * 0.1);
      });
    }, 1000);
    return function () {
      return clearInterval(timer);
    };
  }, []);
  // Add sample notifications
  (0, react_1.useEffect)(function () {
    var sampleNotifications = [
      {
        id: "1",
        title: "JASON AI",
        message: "Your smart home routine is ready!",
        type: "success",
        timestamp: new Date(),
        read: false,
      },
      {
        id: "2",
        title: "Data Dividend",
        message: "You earned $2.47 today from data sharing",
        type: "info",
        timestamp: new Date(),
        read: false,
      },
      {
        id: "3",
        title: "Voice Assistant",
        message: "New voice commands learned",
        type: "info",
        timestamp: new Date(),
        read: true,
      },
    ];
    setNotifications(sampleNotifications);
  }, []);
  var getCurrentPageComponent = function () {
    var page = appPages.find(function (p) {
      return p.id === currentPage;
    });
    return (
      (page === null || page === void 0 ? void 0 : page.component) || (
        <MobileOptimizedJasonInterface />
      )
    );
  };
  var handlePageSwipe = function (event, info) {
    var threshold = 100;
    if (info.offset.x > threshold) {
      // Swipe right - go to previous page
      var currentIndex = appPages.findIndex(function (p) {
        return p.id === currentPage;
      });
      if (currentIndex > 0) {
        setCurrentPage(appPages[currentIndex - 1].id);
      }
    } else if (info.offset.x < -threshold) {
      // Swipe left - go to next page
      var currentIndex = appPages.findIndex(function (p) {
        return p.id === currentPage;
      });
      if (currentIndex < appPages.length - 1) {
        setCurrentPage(appPages[currentIndex + 1].id);
      }
    }
  };
  var toggleWifi = function () {
    setQuickToggles(function (prev) {
      return prev.map(function (toggle) {
        return toggle.id === "wifi"
          ? __assign(__assign({}, toggle), { enabled: !toggle.enabled })
          : toggle;
      });
    });
    setConnectionStatus(function (prev) {
      return prev === "wifi" ? "cellular" : "wifi";
    });
  };
  var toggleBluetooth = function () {
    setQuickToggles(function (prev) {
      return prev.map(function (toggle) {
        return toggle.id === "bluetooth"
          ? __assign(__assign({}, toggle), { enabled: !toggle.enabled })
          : toggle;
      });
    });
  };
  var toggleAirplane = function () {
    var _a;
    setQuickToggles(function (prev) {
      return prev.map(function (toggle) {
        return toggle.id === "airplane"
          ? __assign(__assign({}, toggle), { enabled: !toggle.enabled })
          : toggle;
      });
    });
    if (
      (_a = quickToggles.find(function (t) {
        return t.id === "airplane";
      })) === null || _a === void 0
        ? void 0
        : _a.enabled
    ) {
      setConnectionStatus("offline");
    }
  };
  var toggleFlashlight = function () {
    setQuickToggles(function (prev) {
      return prev.map(function (toggle) {
        return toggle.id === "flashlight"
          ? __assign(__assign({}, toggle), { enabled: !toggle.enabled })
          : toggle;
      });
    });
  };
  var filteredApps = appPages.filter(function (app) {
    return app.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  var getStatusBarColor = function () {
    switch (connectionStatus) {
      case "wifi":
        return "text-green-500";
      case "cellular":
        return "text-blue-500";
      case "offline":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };
  return (
    <div
      className={"min-h-screen ".concat(
        isDarkMode ? "dark bg-gray-900" : "bg-white",
        " transition-all duration-500",
      )}
    >
      {/* Dynamic Island / Status Bar */}
      <framer_motion_1.motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative"
      >
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 py-2 bg-black text-white text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <framer_motion_1.motion.div
              animate={{
                scale: connectionStatus === "wifi" ? [1, 1.2, 1] : 1,
                rotate: connectionStatus === "offline" ? 180 : 0,
              }}
              transition={{ duration: 0.5 }}
              className={getStatusBarColor()}
            >
              {connectionStatus === "wifi" ? (
                <lucide_react_1.Wifi className="w-4 h-4" />
              ) : connectionStatus === "cellular" ? (
                <lucide_react_1.Signal className="w-4 h-4" />
              ) : (
                <lucide_react_1.Airplane className="w-4 h-4" />
              )}
            </framer_motion_1.motion.div>
          </div>

          <div className="flex items-center space-x-2">
            <framer_motion_1.motion.div
              animate={{
                scale: batteryLevel < 20 ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: batteryLevel < 20 ? Infinity : 0,
              }}
            >
              <lucide_react_1.Battery
                className={"w-4 h-4 ".concat(
                  batteryLevel < 20 ? "text-red-500" : "text-white",
                )}
              />
            </framer_motion_1.motion.div>
            <span className={batteryLevel < 20 ? "text-red-500" : "text-white"}>
              {Math.round(batteryLevel)}%
            </span>
            <lucide_react_1.Volume2 className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic Island */}
        <framer_motion_1.motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black rounded-full px-4 py-1 z-10"
        >
          <div className="flex items-center space-x-2">
            {isVoiceMode && (
              <framer_motion_1.motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
            )}
            <div className="w-8 h-4 bg-gray-800 rounded-full" />
            {notifications.filter(function (n) {
              return !n.read;
            }).length > 0 && (
              <framer_motion_1.motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            )}
          </div>
        </framer_motion_1.motion.div>
      </framer_motion_1.motion.div>

      {/* Main App Container */}
      <framer_motion_1.motion.div
        ref={dragConstraints}
        className="relative overflow-hidden"
        style={{ height: "calc(100vh - 60px)" }}
      >
        <framer_motion_1.motion.div
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          onDragEnd={handlePageSwipe}
          style={{ x: pageX }}
          className="h-full"
        >
          <framer_motion_1.AnimatePresence mode="wait">
            <framer_motion_1.motion.div
              key={currentPage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {getCurrentPageComponent()}
            </framer_motion_1.motion.div>
          </framer_motion_1.AnimatePresence>
        </framer_motion_1.motion.div>
      </framer_motion_1.motion.div>

      {/* App Dock */}
      <framer_motion_1.motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-around items-center px-4 py-2">
          {favoriteApps.map(function (appId, index) {
            var app = appPages.find(function (p) {
              return p.id === appId;
            });
            if (!app) return null;
            return (
              <framer_motion_1.motion.button
                key={app.id}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  delay: 0.6 + index * 0.1,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={function () {
                  setCurrentPage(app.id);
                  setRecentApps(function (prev) {
                    return __spreadArray(
                      [app.id],
                      prev.filter(function (id) {
                        return id !== app.id;
                      }),
                      true,
                    ).slice(0, 5);
                  });
                }}
                className={"relative p-3 rounded-2xl transition-all duration-300 ".concat(
                  currentPage === app.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
              >
                {app.icon}
                {currentPage === app.id && (
                  <framer_motion_1.motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                  />
                )}
              </framer_motion_1.motion.button>
            );
          })}

          {/* App Drawer Button */}
          <framer_motion_1.motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={function () {
              return setIsMenuOpen(!isMenuOpen);
            }}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
          >
            <framer_motion_1.motion.div
              animate={{ rotate: isMenuOpen ? 45 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <lucide_react_1.Plus className="w-6 h-6" />
            </framer_motion_1.motion.div>
          </framer_motion_1.motion.button>
        </div>
      </framer_motion_1.motion.div>

      {/* Control Center */}
      <framer_motion_1.motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: showQuickToggles ? 0 : -20,
          opacity: showQuickToggles ? 1 : 0,
        }}
        className="fixed top-16 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-50"
      >
        <div className="grid grid-cols-3 gap-3">
          {quickToggles.map(function (toggle, index) {
            return (
              <framer_motion_1.motion.button
                key={toggle.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggle.action}
                className={"p-3 rounded-xl text-white transition-all duration-300 ".concat(
                  toggle.enabled ? toggle.color : "bg-gray-400",
                )}
              >
                <div className="flex flex-col items-center space-y-1">
                  {toggle.icon}
                  <span className="text-xs font-medium">{toggle.name}</span>
                </div>
              </framer_motion_1.motion.button>
            );
          })}
        </div>
      </framer_motion_1.motion.div>

      {/* App Drawer */}
      <framer_motion_1.AnimatePresence>
        {isMenuOpen && (
          <>
            <framer_motion_1.motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={function () {
                return setIsMenuOpen(false);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <framer_motion_1.motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-6">
                  <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={function (e) {
                      return setSearchQuery(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* App Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {filteredApps.map(function (app, index) {
                    return (
                      <framer_motion_1.motion.button
                        key={app.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={function () {
                          setCurrentPage(app.id);
                          setIsMenuOpen(false);
                          setRecentApps(function (prev) {
                            return __spreadArray(
                              [app.id],
                              prev.filter(function (id) {
                                return id !== app.id;
                              }),
                              true,
                            ).slice(0, 5);
                          });
                        }}
                        className="flex flex-col items-center space-y-2 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                      >
                        <div
                          className={"w-12 h-12 ".concat(
                            app.color,
                            " rounded-2xl flex items-center justify-center text-white shadow-lg",
                          )}
                        >
                          {app.icon}
                        </div>
                        <span className="text-xs font-medium text-gray-800 dark:text-white text-center">
                          {app.name}
                        </span>
                      </framer_motion_1.motion.button>
                    );
                  })}
                </div>
              </div>
            </framer_motion_1.motion.div>
          </>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Notifications Panel */}
      <framer_motion_1.AnimatePresence>
        {showNotifications && (
          <>
            <framer_motion_1.motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={function () {
                return setShowNotifications(false);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <framer_motion_1.motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
            >
              <NotificationPanel
                notifications={notifications}
                onClose={function () {
                  return setShowNotifications(false);
                }}
                onMarkAsRead={function (id) {
                  return setNotifications(function (prev) {
                    return prev.map(function (n) {
                      return n.id === id
                        ? __assign(__assign({}, n), { read: true })
                        : n;
                    });
                  });
                }}
              />
            </framer_motion_1.motion.div>
          </>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 flex flex-col space-y-3 z-30">
        {/* Quick Toggles */}
        <framer_motion_1.motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={function () {
            return setShowQuickToggles(!showQuickToggles);
          }}
          className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center text-white"
        >
          <lucide_react_1.Settings className="w-6 h-6" />
        </framer_motion_1.motion.button>

        {/* Notifications */}
        <framer_motion_1.motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={function () {
            return setShowNotifications(!showNotifications);
          }}
          className="relative w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg flex items-center justify-center text-white"
        >
          <lucide_react_1.Bell className="w-6 h-6" />
          {notifications.filter(function (n) {
            return !n.read;
          }).length > 0 && (
            <framer_motion_1.motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
            >
              {
                notifications.filter(function (n) {
                  return !n.read;
                }).length
              }
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.motion.button>
      </div>

      {/* Gesture Hints */}
      <framer_motion_1.motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="fixed bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400"
      >
        Swipe left/right to navigate • Pull down for notifications
      </framer_motion_1.motion.div>
    </div>
  );
};
// Placeholder components for the various app pages
var SmartHomeControl = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Smart Home Control</h2>
      <p>Control all your smart devices from here!</p>
    </div>
  );
};
var MediaCenter = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Media Center</h2>
      <p>Your entertainment hub with AI-powered recommendations!</p>
    </div>
  );
};
var AICamera = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">AI Camera</h2>
      <p>Intelligent photography with real-time AI enhancement!</p>
    </div>
  );
};
var FileManager = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">File Manager</h2>
      <p>Organize and manage your files with AI assistance!</p>
    </div>
  );
};
var WeatherPro = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Weather Pro</h2>
      <p>Hyperlocal weather with AI predictions!</p>
    </div>
  );
};
var SmartCalendar = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Smart Calendar</h2>
      <p>AI-powered scheduling and time management!</p>
    </div>
  );
};
var AIGames = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">AI Games</h2>
      <p>Play games with adaptive AI opponents!</p>
    </div>
  );
};
var HealthMonitor = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Health Monitor</h2>
      <p>Track your health with AI insights!</p>
    </div>
  );
};
var SecurityCenter = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Security Center</h2>
      <p>Protect your digital life with AI security!</p>
    </div>
  );
};
var SocialHub = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Social Hub</h2>
      <p>Connect with friends across all platforms!</p>
    </div>
  );
};
var ProductivitySuite = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Productivity Suite</h2>
      <p>Boost your productivity with AI tools!</p>
    </div>
  );
};
var ARVRPortal = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">AR/VR Portal</h2>
      <p>Enter immersive virtual worlds!</p>
    </div>
  );
};
var CryptoWallet = function () {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Crypto Wallet</h2>
      <p>Manage your digital assets securely!</p>
    </div>
  );
};
var NotificationPanel = function (_a) {
  var notifications = _a.notifications,
    onClose = _a.onClose,
    onMarkAsRead = _a.onMarkAsRead;
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Notifications</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <lucide_react_1.X className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-4">
        {notifications.map(function (notification, index) {
          return (
            <framer_motion_1.motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={function () {
                return onMarkAsRead(notification.id);
              }}
              className={"p-4 rounded-xl cursor-pointer transition-all duration-300 ".concat(
                notification.read
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500",
              )}
            >
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {notification.message}
              </p>
              <span className="text-xs text-gray-500 mt-2 block">
                {notification.timestamp.toLocaleTimeString()}
              </span>
            </framer_motion_1.motion.div>
          );
        })}
      </div>
    </div>
  );
};
exports.default = JasonMobileApp;

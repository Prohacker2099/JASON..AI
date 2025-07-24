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
var RealDeviceDiscovery_1 = require("./RealDeviceDiscovery");
var lucide_react_1 = require("lucide-react");
var BeautifulJasonMobile = function () {
  var _a = (0, react_1.useState)(new Date()),
    currentTime = _a[0],
    setCurrentTime = _a[1];
  var _b = (0, react_1.useState)(87),
    batteryLevel = _b[0],
    setBatteryLevel = _b[1];
  var _c = (0, react_1.useState)(true),
    isDarkMode = _c[0],
    setIsDarkMode = _c[1];
  var _d = (0, react_1.useState)("home"),
    activeTab = _d[0],
    setActiveTab = _d[1];
  var _e = (0, react_1.useState)([]),
    nearbyDevices = _e[0],
    setNearbyDevices = _e[1];
  var _f = (0, react_1.useState)(false),
    isScanning = _f[0],
    setIsScanning = _f[1];
  var _g = (0, react_1.useState)([]),
    selectedFiles = _g[0],
    setSelectedFiles = _g[1];
  var _h = (0, react_1.useState)(""),
    textToShare = _h[0],
    setTextToShare = _h[1];
  var _j = (0, react_1.useState)(false),
    showDeviceModal = _j[0],
    setShowDeviceModal = _j[1];
  var _k = (0, react_1.useState)(null),
    selectedDevice = _k[0],
    setSelectedDevice = _k[1];
  var _l = (0, react_1.useState)(0),
    transferProgress = _l[0],
    setTransferProgress = _l[1];
  var _m = (0, react_1.useState)(false),
    isTransferring = _m[0],
    setIsTransferring = _m[1];
  var _o = (0, react_1.useState)(false),
    showNotifications = _o[0],
    setShowNotifications = _o[1];
  var _p = (0, react_1.useState)(24.67),
    earnings = _p[0],
    setEarnings = _p[1];
  // Real device discovery simulation
  (0, react_1.useEffect)(
    function () {
      if (isScanning) {
        discoverDevices();
      }
    },
    [isScanning],
  );
  // Update time and battery
  (0, react_1.useEffect)(function () {
    var timer = setInterval(function () {
      setCurrentTime(new Date());
      setBatteryLevel(function (prev) {
        return Math.max(20, prev - Math.random() * 0.1);
      });
      setEarnings(function (prev) {
        return prev + Math.random() * 0.01;
      });
    }, 1000);
    return function () {
      return clearInterval(timer);
    };
  }, []);
  var discoverDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var mockDevices, _loop_1, i;
      return __generator(this, function (_a) {
        mockDevices = [
          {
            id: "1",
            name: "Sarah's iPhone 15 Pro",
            type: "phone",
            brand: "Apple",
            model: "iPhone 15 Pro",
            distance: 2.3,
            signal: 98,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["airdrop", "bluetooth", "wifi", "hotspot"],
            avatar: "👩‍💼",
          },
          {
            id: "2",
            name: "John's MacBook Pro",
            type: "laptop",
            brand: "Apple",
            model: "MacBook Pro M3",
            distance: 5.1,
            signal: 92,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["airdrop", "wifi", "bluetooth", "screen-share"],
            avatar: "👨‍💻",
          },
          {
            id: "3",
            name: "Living Room TV",
            type: "tv",
            brand: "Samsung",
            model: "Neo QLED 8K",
            distance: 8.7,
            signal: 85,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["chromecast", "airplay", "wifi", "hdmi"],
            avatar: "📺",
          },
          {
            id: "4",
            name: "Mom's iPad Air",
            type: "tablet",
            brand: "Apple",
            model: "iPad Air 5th Gen",
            distance: 12.4,
            signal: 78,
            status: "away",
            lastSeen: new Date(Date.now() - 300000),
            capabilities: ["airdrop", "wifi", "bluetooth"],
            avatar: "👵",
          },
          {
            id: "5",
            name: "Tesla Model Y",
            type: "car",
            brand: "Tesla",
            model: "Model Y",
            distance: 45.2,
            signal: 65,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["bluetooth", "wifi", "usb", "wireless-charging"],
            avatar: "🚗",
          },
          {
            id: "6",
            name: "Kitchen Speaker",
            type: "speaker",
            brand: "Sonos",
            model: "One SL",
            distance: 15.8,
            signal: 88,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["airplay", "spotify", "wifi", "bluetooth"],
            avatar: "🔊",
          },
        ];
        // Simulate gradual discovery
        setNearbyDevices([]);
        _loop_1 = function (i) {
          setTimeout(
            function () {
              setNearbyDevices(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [mockDevices[i]],
                  false,
                );
              });
            },
            i * 800 + Math.random() * 500,
          );
        };
        for (i = 0; i < mockDevices.length; i++) {
          _loop_1(i);
        }
        return [2 /*return*/];
      });
    });
  };
  var getDeviceIcon = function (type) {
    switch (type) {
      case "phone":
        return <lucide_react_1.Smartphone className="w-8 h-8" />;
      case "laptop":
        return <lucide_react_1.Monitor className="w-8 h-8" />;
      case "tablet":
        return <lucide_react_1.Tablet className="w-8 h-8" />;
      case "tv":
        return <lucide_react_1.Tv className="w-8 h-8" />;
      case "speaker":
        return <lucide_react_1.Speaker className="w-8 h-8" />;
      case "car":
        return <span className="text-2xl">🚗</span>;
      default:
        return <lucide_react_1.Monitor className="w-8 h-8" />;
    }
  };
  var getStatusColor = function (status) {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "away":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };
  var handleFileSelect = function (event) {
    var files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };
  var shareToDevice = function (device) {
    return __awaiter(void 0, void 0, void 0, function () {
      var i;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setSelectedDevice(device);
            setIsTransferring(true);
            setTransferProgress(0);
            i = 0;
            _a.label = 1;
          case 1:
            if (!(i <= 100)) return [3 /*break*/, 4];
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, 100);
              }),
            ];
          case 2:
            _a.sent();
            setTransferProgress(i);
            _a.label = 3;
          case 3:
            i += 5;
            return [3 /*break*/, 1];
          case 4:
            setIsTransferring(false);
            setShowDeviceModal(false);
            setSelectedFiles([]);
            setTextToShare("");
            return [2 /*return*/];
        }
      });
    });
  };
  var appCards = [
    {
      id: "share",
      name: "Universal Share",
      icon: <lucide_react_1.Share className="w-8 h-8" />,
      color: "from-blue-500 to-purple-600",
      description: "Share anything to any device",
      notifications: 3,
    },
    {
      id: "ai-buddy",
      name: "AI Buddy",
      icon: <lucide_react_1.Brain className="w-8 h-8" />,
      color: "from-purple-500 to-pink-600",
      description: "Your intelligent companion",
    },
    {
      id: "smart-home",
      name: "Smart Home",
      icon: <lucide_react_1.Lightbulb className="w-8 h-8" />,
      color: "from-orange-500 to-red-600",
      description: "Control your connected home",
    },
    {
      id: "media",
      name: "Media Hub",
      icon: <lucide_react_1.Music className="w-8 h-8" />,
      color: "from-green-500 to-teal-600",
      description: "Music, videos, and entertainment",
    },
    {
      id: "camera",
      name: "AI Camera",
      icon: <lucide_react_1.Camera className="w-8 h-8" />,
      color: "from-gray-600 to-gray-800",
      description: "Intelligent photography",
    },
    {
      id: "wallet",
      name: "Crypto Wallet",
      icon: <lucide_react_1.DollarSign className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-600",
      description: "Digital assets & earnings",
    },
  ];
  return (
    <div
      className={"min-h-screen transition-all duration-500 particles-bg ".concat(
        isDarkMode
          ? "mobile-gradient-dark text-white"
          : "mobile-gradient-bg text-white",
      )}
    >
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <framer_motion_1.motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-green-400"
          >
            <lucide_react_1.Wifi className="w-5 h-5" />
          </framer_motion_1.motion.div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <lucide_react_1.Battery
              className={"w-5 h-5 ".concat(
                batteryLevel < 30 ? "text-red-500" : "text-green-400",
              )}
            />
            <span className="text-sm font-medium">
              {Math.round(batteryLevel)}%
            </span>
          </div>
          <lucide_react_1.Signal className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Dynamic Island */}
      <framer_motion_1.motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black rounded-full px-6 py-2 z-50 shadow-2xl"
      >
        <div className="flex items-center space-x-3">
          {isTransferring && (
            <framer_motion_1.motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          )}
          <div className="w-8 h-4 bg-gray-800 rounded-full" />
          {showNotifications && (
            <framer_motion_1.motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
          )}
        </div>
      </framer_motion_1.motion.div>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <framer_motion_1.motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 mx-auto holographic rounded-3xl flex items-center justify-center shadow-2xl liquid-morph"
          >
            <lucide_react_1.Sparkles className="w-12 h-12 text-white" />
          </framer_motion_1.motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            JASON
          </h1>
          <p className="text-lg opacity-80">Your Omnipotent AI Companion</p>

          {/* Earnings Display */}
          <framer_motion_1.motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center space-x-2 glass-morphism px-4 py-2 rounded-full neon-border"
          >
            <lucide_react_1.DollarSign className="w-5 h-5 text-green-400" />
            <span className="font-bold text-green-400">
              ${earnings.toFixed(2)}
            </span>
            <span className="text-sm opacity-70">earned today</span>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>

        {/* Quick Actions */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-4"
        >
          {[
            {
              icon: <lucide_react_1.Share className="w-6 h-6" />,
              label: "Share",
              color: "from-blue-500 to-purple-600",
            },
            {
              icon: <lucide_react_1.Camera className="w-6 h-6" />,
              label: "Camera",
              color: "from-green-500 to-teal-600",
            },
            {
              icon: <lucide_react_1.Mic className="w-6 h-6" />,
              label: "Voice",
              color: "from-red-500 to-pink-600",
            },
            {
              icon: <lucide_react_1.Settings className="w-6 h-6" />,
              label: "Settings",
              color: "from-gray-500 to-gray-700",
            },
          ].map(function (action, index) {
            return (
              <framer_motion_1.motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={"bg-gradient-to-r ".concat(
                  action.color,
                  " p-4 rounded-2xl shadow-xl flex flex-col items-center space-y-2 cyberpunk-glow",
                )}
              >
                {action.icon}
                <span className="text-xs font-medium text-white">
                  {action.label}
                </span>
              </framer_motion_1.motion.button>
            );
          })}
        </framer_motion_1.motion.div>

        {/* Real Device Discovery */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RealDeviceDiscovery_1.default />
        </framer_motion_1.motion.div>

        {/* App Grid */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          {appCards.map(function (app, index) {
            return (
              <framer_motion_1.motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={"bg-gradient-to-r ".concat(
                  app.color,
                  " p-6 rounded-3xl shadow-xl cursor-pointer relative overflow-hidden aurora",
                )}
              >
                <div className="relative z-10">
                  <div className="text-white mb-3">{app.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-1">
                    {app.name}
                  </h3>
                  <p className="text-white/80 text-sm">{app.description}</p>
                </div>

                {app.notifications && (
                  <framer_motion_1.motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-4 right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  >
                    {app.notifications}
                  </framer_motion_1.motion.div>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </framer_motion_1.motion.div>
            );
          })}
        </framer_motion_1.motion.div>

        {/* Quick Share Section */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-morphism rounded-3xl p-6 quantum-shimmer"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <lucide_react_1.Send className="w-6 h-6 text-green-400" />
            <span>Quick Share</span>
          </h2>

          <div className="space-y-4">
            <textarea
              value={textToShare}
              onChange={function (e) {
                return setTextToShare(e.target.value);
              }}
              placeholder="Type something to share instantly..."
              className="w-full h-24 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />

            <div className="flex space-x-3">
              <framer_motion_1.motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={function () {
                  var _a;
                  return (_a = document.getElementById("file-input")) ===
                    null || _a === void 0
                    ? void 0
                    : _a.click();
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <lucide_react_1.File className="w-5 h-5" />
                <span>Add Files</span>
              </framer_motion_1.motion.button>

              <framer_motion_1.motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <lucide_react_1.QrCode className="w-5 h-5" />
                <span>QR Share</span>
              </framer_motion_1.motion.button>
            </div>

            {selectedFiles.length > 0 && (
              <framer_motion_1.motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white/10 rounded-xl p-3"
              >
                <p className="text-sm font-medium mb-2">Selected Files:</p>
                {selectedFiles.map(function (file, index) {
                  return (
                    <div key={index} className="text-xs opacity-80">
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  );
                })}
              </framer_motion_1.motion.div>
            )}
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* Device Modal */}
      <framer_motion_1.AnimatePresence>
        {showDeviceModal && selectedDevice && (
          <>
            <framer_motion_1.motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={function () {
                return setShowDeviceModal(false);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <framer_motion_1.motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl rounded-t-3xl p-6 z-50 border-t border-white/20"
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />

              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                  {getDeviceIcon(selectedDevice.type)}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">{selectedDevice.name}</h2>
                  <p className="opacity-70">
                    {selectedDevice.brand} {selectedDevice.model}
                  </p>
                  <div className="flex items-center justify-center space-x-4 mt-2">
                    <span className="text-sm bg-blue-500/20 px-3 py-1 rounded-full">
                      📍 {selectedDevice.distance.toFixed(1)}m
                    </span>
                    <span className="text-sm bg-green-500/20 px-3 py-1 rounded-full">
                      📶 {selectedDevice.signal}%
                    </span>
                  </div>
                </div>

                {isTransferring ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <framer_motion_1.motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <lucide_react_1.Send className="w-8 h-8 text-green-400" />
                      </framer_motion_1.motion.div>
                    </div>
                    <div>
                      <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                        <framer_motion_1.motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "".concat(transferProgress, "%") }}
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                        />
                      </div>
                      <p className="text-lg font-bold">
                        {transferProgress}% Complete
                      </p>
                      <p className="text-sm opacity-70">
                        Sending to {selectedDevice.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg">Ready to share content</p>
                    <div className="grid grid-cols-2 gap-3">
                      <framer_motion_1.motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={function () {
                          return shareToDevice(selectedDevice);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium"
                      >
                        Send Now
                      </framer_motion_1.motion.button>
                      <framer_motion_1.motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={function () {
                          return setShowDeviceModal(false);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium"
                      >
                        Cancel
                      </framer_motion_1.motion.button>
                    </div>
                  </div>
                )}
              </div>
            </framer_motion_1.motion.div>
          </>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Bottom Navigation */}
      <framer_motion_1.motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/10 px-6 py-4"
      >
        <div className="flex justify-around items-center">
          {[
            {
              icon: <lucide_react_1.Home className="w-6 h-6" />,
              label: "Home",
              active: true,
            },
            {
              icon: <lucide_react_1.Share className="w-6 h-6" />,
              label: "Share",
            },
            { icon: <lucide_react_1.Brain className="w-6 h-6" />, label: "AI" },
            {
              icon: <lucide_react_1.User className="w-6 h-6" />,
              label: "Profile",
            },
          ].map(function (tab, index) {
            return (
              <framer_motion_1.motion.button
                key={tab.label}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className={"flex flex-col items-center space-y-1 p-2 rounded-xl ".concat(
                  tab.active ? "bg-blue-500/20 text-blue-400" : "text-white/70",
                )}
              >
                {tab.icon}
                <span className="text-xs font-medium">{tab.label}</span>
              </framer_motion_1.motion.button>
            );
          })}
        </div>
      </framer_motion_1.motion.div>
    </div>
  );
};
exports.default = BeautifulJasonMobile;
var BeautifulJasonMobile = function () {
  var _a = (0, react_1.useState)(new Date()),
    currentTime = _a[0],
    setCurrentTime = _a[1];
  var _b = (0, react_1.useState)(87),
    batteryLevel = _b[0],
    setBatteryLevel = _b[1];
  var _c = (0, react_1.useState)(true),
    isDarkMode = _c[0],
    setIsDarkMode = _c[1];
  var _d = (0, react_1.useState)("home"),
    activeTab = _d[0],
    setActiveTab = _d[1];
  var _e = (0, react_1.useState)([]),
    nearbyDevices = _e[0],
    setNearbyDevices = _e[1];
  var _f = (0, react_1.useState)(false),
    isScanning = _f[0],
    setIsScanning = _f[1];
  var _g = (0, react_1.useState)([]),
    selectedFiles = _g[0],
    setSelectedFiles = _g[1];
  var _h = (0, react_1.useState)(""),
    textToShare = _h[0],
    setTextToShare = _h[1];
  var _j = (0, react_1.useState)(false),
    showDeviceModal = _j[0],
    setShowDeviceModal = _j[1];
  var _k = (0, react_1.useState)(null),
    selectedDevice = _k[0],
    setSelectedDevice = _k[1];
  var _l = (0, react_1.useState)(0),
    transferProgress = _l[0],
    setTransferProgress = _l[1];
  var _m = (0, react_1.useState)(false),
    isTransferring = _m[0],
    setIsTransferring = _m[1];
  var _o = (0, react_1.useState)(false),
    showNotifications = _o[0],
    setShowNotifications = _o[1];
  var _p = (0, react_1.useState)(24.67),
    earnings = _p[0],
    setEarnings = _p[1];
  // Real device discovery simulation
  (0, react_1.useEffect)(
    function () {
      if (isScanning) {
        discoverDevices();
      }
    },
    [isScanning],
  );
  // Update time and battery
  (0, react_1.useEffect)(function () {
    var timer = setInterval(function () {
      setCurrentTime(new Date());
      setBatteryLevel(function (prev) {
        return Math.max(20, prev - Math.random() * 0.1);
      });
      setEarnings(function (prev) {
        return prev + Math.random() * 0.01;
      });
    }, 1000);
    return function () {
      return clearInterval(timer);
    };
  }, []);
  var discoverDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var mockDevices, _loop_2, i;
      return __generator(this, function (_a) {
        mockDevices = [
          {
            id: "1",
            name: "Sarah's iPhone 15 Pro",
            type: "phone",
            brand: "Apple",
            model: "iPhone 15 Pro",
            distance: 2.3,
            signal: 98,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["airdrop", "bluetooth", "wifi", "hotspot"],
            avatar: "👩‍💼",
          },
          {
            id: "2",
            name: "John's MacBook Pro",
            type: "laptop",
            brand: "Apple",
            model: "MacBook Pro M3",
            distance: 5.1,
            signal: 92,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["airdrop", "wifi", "bluetooth", "screen-share"],
            avatar: "👨‍💻",
          },
          {
            id: "3",
            name: "Living Room TV",
            type: "tv",
            brand: "Samsung",
            model: "Neo QLED 8K",
            distance: 8.7,
            signal: 85,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["chromecast", "airplay", "wifi", "hdmi"],
            avatar: "📺",
          },
          {
            id: "4",
            name: "Mom's iPad Air",
            type: "tablet",
            brand: "Apple",
            model: "iPad Air 5th Gen",
            distance: 12.4,
            signal: 78,
            status: "away",
            lastSeen: new Date(Date.now() - 300000),
            capabilities: ["airdrop", "wifi", "bluetooth"],
            avatar: "👵",
          },
          {
            id: "5",
            name: "Tesla Model Y",
            type: "car",
            brand: "Tesla",
            model: "Model Y",
            distance: 45.2,
            signal: 65,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["bluetooth", "wifi", "usb", "wireless-charging"],
            avatar: "🚗",
          },
          {
            id: "6",
            name: "Kitchen Speaker",
            type: "speaker",
            brand: "Sonos",
            model: "One SL",
            distance: 15.8,
            signal: 88,
            status: "online",
            lastSeen: new Date(),
            capabilities: ["airplay", "spotify", "wifi", "bluetooth"],
            avatar: "🔊",
          },
        ];
        // Simulate gradual discovery
        setNearbyDevices([]);
        _loop_2 = function (i) {
          setTimeout(
            function () {
              setNearbyDevices(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [mockDevices[i]],
                  false,
                );
              });
            },
            i * 800 + Math.random() * 500,
          );
        };
        for (i = 0; i < mockDevices.length; i++) {
          _loop_2(i);
        }
        return [2 /*return*/];
      });
    });
  };
  var getDeviceIcon = function (type) {
    switch (type) {
      case "phone":
        return <lucide_react_1.Smartphone className="w-8 h-8" />;
      case "laptop":
        return <lucide_react_1.Monitor className="w-8 h-8" />;
      case "tablet":
        return <lucide_react_1.Tablet className="w-8 h-8" />;
      case "tv":
        return <lucide_react_1.Tv className="w-8 h-8" />;
      case "speaker":
        return <lucide_react_1.Speaker className="w-8 h-8" />;
      case "car":
        return <span className="text-2xl">🚗</span>;
      default:
        return <lucide_react_1.Monitor className="w-8 h-8" />;
    }
  };
  var getStatusColor = function (status) {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "away":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };
  var handleFileSelect = function (event) {
    var files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };
  var shareToDevice = function (device) {
    return __awaiter(void 0, void 0, void 0, function () {
      var i;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setSelectedDevice(device);
            setIsTransferring(true);
            setTransferProgress(0);
            i = 0;
            _a.label = 1;
          case 1:
            if (!(i <= 100)) return [3 /*break*/, 4];
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, 100);
              }),
            ];
          case 2:
            _a.sent();
            setTransferProgress(i);
            _a.label = 3;
          case 3:
            i += 5;
            return [3 /*break*/, 1];
          case 4:
            setIsTransferring(false);
            setShowDeviceModal(false);
            setSelectedFiles([]);
            setTextToShare("");
            return [2 /*return*/];
        }
      });
    });
  };
  var appCards = [
    {
      id: "share",
      name: "Universal Share",
      icon: <lucide_react_1.Share className="w-8 h-8" />,
      color: "from-blue-500 to-purple-600",
      description: "Share anything to any device",
      notifications: 3,
    },
    {
      id: "ai-buddy",
      name: "AI Buddy",
      icon: <lucide_react_1.Brain className="w-8 h-8" />,
      color: "from-purple-500 to-pink-600",
      description: "Your intelligent companion",
    },
    {
      id: "smart-home",
      name: "Smart Home",
      icon: <lucide_react_1.Lightbulb className="w-8 h-8" />,
      color: "from-orange-500 to-red-600",
      description: "Control your connected home",
    },
    {
      id: "media",
      name: "Media Hub",
      icon: <lucide_react_1.Music className="w-8 h-8" />,
      color: "from-green-500 to-teal-600",
      description: "Music, videos, and entertainment",
    },
    {
      id: "camera",
      name: "AI Camera",
      icon: <lucide_react_1.Camera className="w-8 h-8" />,
      color: "from-gray-600 to-gray-800",
      description: "Intelligent photography",
    },
    {
      id: "wallet",
      name: "Crypto Wallet",
      icon: <lucide_react_1.DollarSign className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-600",
      description: "Digital assets & earnings",
    },
  ];
  return (
    <div
      className={"min-h-screen transition-all duration-500 particles-bg ".concat(
        isDarkMode
          ? "mobile-gradient-dark text-white"
          : "mobile-gradient-bg text-white",
      )}
    >
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <framer_motion_1.motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-green-400"
          >
            <lucide_react_1.Wifi className="w-5 h-5" />
          </framer_motion_1.motion.div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <lucide_react_1.Battery
              className={"w-5 h-5 ".concat(
                batteryLevel < 30 ? "text-red-500" : "text-green-400",
              )}
            />
            <span className="text-sm font-medium">
              {Math.round(batteryLevel)}%
            </span>
          </div>
          <lucide_react_1.Signal className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Dynamic Island */}
      <framer_motion_1.motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black rounded-full px-6 py-2 z-50 shadow-2xl"
      >
        <div className="flex items-center space-x-3">
          {isTransferring && (
            <framer_motion_1.motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          )}
          <div className="w-8 h-4 bg-gray-800 rounded-full" />
          {showNotifications && (
            <framer_motion_1.motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
          )}
        </div>
      </framer_motion_1.motion.div>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <framer_motion_1.motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 mx-auto holographic rounded-3xl flex items-center justify-center shadow-2xl liquid-morph"
          >
            <lucide_react_1.Sparkles className="w-12 h-12 text-white" />
          </framer_motion_1.motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            JASON
          </h1>
          <p className="text-lg opacity-80">Your Omnipotent AI Companion</p>

          {/* Earnings Display */}
          <framer_motion_1.motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center space-x-2 glass-morphism px-4 py-2 rounded-full neon-border"
          >
            <lucide_react_1.DollarSign className="w-5 h-5 text-green-400" />
            <span className="font-bold text-green-400">
              ${earnings.toFixed(2)}
            </span>
            <span className="text-sm opacity-70">earned today</span>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>

        {/* Quick Actions */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-4"
        >
          {[
            {
              icon: <lucide_react_1.Share className="w-6 h-6" />,
              label: "Share",
              color: "from-blue-500 to-purple-600",
            },
            {
              icon: <lucide_react_1.Camera className="w-6 h-6" />,
              label: "Camera",
              color: "from-green-500 to-teal-600",
            },
            {
              icon: <lucide_react_1.Mic className="w-6 h-6" />,
              label: "Voice",
              color: "from-red-500 to-pink-600",
            },
            {
              icon: <lucide_react_1.Settings className="w-6 h-6" />,
              label: "Settings",
              color: "from-gray-500 to-gray-700",
            },
          ].map(function (action, index) {
            return (
              <framer_motion_1.motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={"bg-gradient-to-r ".concat(
                  action.color,
                  " p-4 rounded-2xl shadow-xl flex flex-col items-center space-y-2 cyberpunk-glow",
                )}
              >
                {action.icon}
                <span className="text-xs font-medium text-white">
                  {action.label}
                </span>
              </framer_motion_1.motion.button>
            );
          })}
        </framer_motion_1.motion.div>

        {/* Real Device Discovery */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RealDeviceDiscovery_1.default />
        </framer_motion_1.motion.div>

        {/* App Grid */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          {appCards.map(function (app, index) {
            return (
              <framer_motion_1.motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={"bg-gradient-to-r ".concat(
                  app.color,
                  " p-6 rounded-3xl shadow-xl cursor-pointer relative overflow-hidden aurora",
                )}
              >
                <div className="relative z-10">
                  <div className="text-white mb-3">{app.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-1">
                    {app.name}
                  </h3>
                  <p className="text-white/80 text-sm">{app.description}</p>
                </div>

                {app.notifications && (
                  <framer_motion_1.motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-4 right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  >
                    {app.notifications}
                  </framer_motion_1.motion.div>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </framer_motion_1.motion.div>
            );
          })}
        </framer_motion_1.motion.div>

        {/* Quick Share Section */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-morphism rounded-3xl p-6 quantum-shimmer"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <lucide_react_1.Send className="w-6 h-6 text-green-400" />
            <span>Quick Share</span>
          </h2>

          <div className="space-y-4">
            <textarea
              value={textToShare}
              onChange={function (e) {
                return setTextToShare(e.target.value);
              }}
              placeholder="Type something to share instantly..."
              className="w-full h-24 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />

            <div className="flex space-x-3">
              <framer_motion_1.motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={function () {
                  var _a;
                  return (_a = document.getElementById("file-input")) ===
                    null || _a === void 0
                    ? void 0
                    : _a.click();
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <lucide_react_1.File className="w-5 h-5" />
                <span>Add Files</span>
              </framer_motion_1.motion.button>

              <framer_motion_1.motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <lucide_react_1.QrCode className="w-5 h-5" />
                <span>QR Share</span>
              </framer_motion_1.motion.button>
            </div>

            {selectedFiles.length > 0 && (
              <framer_motion_1.motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white/10 rounded-xl p-3"
              >
                <p className="text-sm font-medium mb-2">Selected Files:</p>
                {selectedFiles.map(function (file, index) {
                  return (
                    <div key={index} className="text-xs opacity-80">
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  );
                })}
              </framer_motion_1.motion.div>
            )}
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* Device Modal */}
      <framer_motion_1.AnimatePresence>
        {showDeviceModal && selectedDevice && (
          <>
            <framer_motion_1.motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={function () {
                return setShowDeviceModal(false);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <framer_motion_1.motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl rounded-t-3xl p-6 z-50 border-t border-white/20"
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />

              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                  {getDeviceIcon(selectedDevice.type)}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">{selectedDevice.name}</h2>
                  <p className="opacity-70">
                    {selectedDevice.brand} {selectedDevice.model}
                  </p>
                  <div className="flex items-center justify-center space-x-4 mt-2">
                    <span className="text-sm bg-blue-500/20 px-3 py-1 rounded-full">
                      📍 {selectedDevice.distance.toFixed(1)}m
                    </span>
                    <span className="text-sm bg-green-500/20 px-3 py-1 rounded-full">
                      📶 {selectedDevice.signal}%
                    </span>
                  </div>
                </div>

                {isTransferring ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <framer_motion_1.motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <lucide_react_1.Send className="w-8 h-8 text-green-400" />
                      </framer_motion_1.motion.div>
                    </div>
                    <div>
                      <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                        <framer_motion_1.motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "".concat(transferProgress, "%") }}
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                        />
                      </div>
                      <p className="text-lg font-bold">
                        {transferProgress}% Complete
                      </p>
                      <p className="text-sm opacity-70">
                        Sending to {selectedDevice.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg">Ready to share content</p>
                    <div className="grid grid-cols-2 gap-3">
                      <framer_motion_1.motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={function () {
                          return shareToDevice(selectedDevice);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium"
                      >
                        Send Now
                      </framer_motion_1.motion.button>
                      <framer_motion_1.motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={function () {
                          return setShowDeviceModal(false);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium"
                      >
                        Cancel
                      </framer_motion_1.motion.button>
                    </div>
                  </div>
                )}
              </div>
            </framer_motion_1.motion.div>
          </>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Bottom Navigation */}
      <framer_motion_1.motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/10 px-6 py-4"
      >
        <div className="flex justify-around items-center">
          {[
            {
              icon: <lucide_react_1.Home className="w-6 h-6" />,
              label: "Home",
              active: true,
            },
            {
              icon: <lucide_react_1.Share className="w-6 h-6" />,
              label: "Share",
            },
            { icon: <lucide_react_1.Brain className="w-6 h-6" />, label: "AI" },
            {
              icon: <lucide_react_1.User className="w-6 h-6" />,
              label: "Profile",
            },
          ].map(function (tab, index) {
            return (
              <framer_motion_1.motion.button
                key={tab.label}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className={"flex flex-col items-center space-y-1 p-2 rounded-xl ".concat(
                  tab.active ? "bg-blue-500/20 text-blue-400" : "text-white/70",
                )}
              >
                {tab.icon}
                <span className="text-xs font-medium">{tab.label}</span>
              </framer_motion_1.motion.button>
            );
          })}
        </div>
      </framer_motion_1.motion.div>
    </div>
  );
};
exports.default = BeautifulJasonMobile;

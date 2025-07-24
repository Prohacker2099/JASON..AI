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
  // Real device discovery
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
      var response, data, devices_1, _loop_1, i, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            setNearbyDevices([]);
            return [4 /*yield*/, fetch("/api/devices")];
          case 1:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            if (data.success && data.data) {
              devices_1 = data.data.map(function (device) {
                var _a, _b;
                return {
                  id: device.id,
                  name: device.name,
                  type: mapDeviceType(device.type),
                  brand: device.manufacturer || "Unknown",
                  model: device.model || "Unknown",
                  distance: calculateDistance(
                    (_a = device.metadata) === null || _a === void 0
                      ? void 0
                      : _a.ip,
                  ),
                  signal: calculateSignalStrength(
                    (_b = device.metadata) === null || _b === void 0
                      ? void 0
                      : _b.ip,
                  ),
                  status: device.online ? "online" : "offline",
                  lastSeen: new Date(device.lastSeenAt),
                  capabilities: device.capabilities || [],
                  avatar: getDeviceAvatar(device.type, device.name),
                };
              });
              _loop_1 = function (i) {
                setTimeout(
                  function () {
                    setNearbyDevices(function (prev) {
                      return __spreadArray(
                        __spreadArray([], prev, true),
                        [devices_1[i]],
                        false,
                      );
                    });
                  },
                  i * 500 + Math.random() * 300,
                );
              };
              // Simulate gradual discovery for better UX
              for (i = 0; i < devices_1.length; i++) {
                _loop_1(i);
              }
            } else {
              console.warn("No devices found or API error");
              // Fallback to some mock devices if no real devices found
              addFallbackDevices();
            }
            return [3 /*break*/, 4];
          case 3:
            error_1 = _a.sent();
            console.error("Error discovering devices:", error_1);
            // Fallback to mock devices on error
            addFallbackDevices();
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  var mapDeviceType = function (serverType) {
    switch (serverType.toLowerCase()) {
      case "computer":
      case "laptop":
        return "laptop";
      case "phone":
      case "smartphone":
        return "phone";
      case "tablet":
        return "tablet";
      case "tv":
      case "smart-tv":
      case "media":
        return "tv";
      case "speaker":
        return "speaker";
      case "car":
        return "car";
      default:
        return "phone"; // Default to phone for unknown types
    }
  };
  var calculateDistance = function (ip) {
    if (!ip) return Math.random() * 50 + 1;
    // Simple distance calculation based on IP (this is just for demo)
    var parts = ip.split(".").map(Number);
    var lastOctet = parts[3] || 0;
    // Closer IPs (lower last octet) are considered closer
    return Math.max(1, (lastOctet / 254) * 50);
  };
  var calculateSignalStrength = function (ip) {
    if (!ip) return Math.floor(Math.random() * 40) + 60;
    // Signal strength inversely related to distance
    var distance = calculateDistance(ip);
    return Math.max(30, Math.floor(100 - distance * 1.5));
  };
  var getDeviceAvatar = function (type, name) {
    var nameLower = name.toLowerCase();
    if (nameLower.includes("iphone") || nameLower.includes("ios")) return "📱";
    if (
      nameLower.includes("android") ||
      nameLower.includes("samsung") ||
      nameLower.includes("pixel")
    )
      return "🤖";
    if (nameLower.includes("macbook") || nameLower.includes("mac")) return "💻";
    if (nameLower.includes("windows") || nameLower.includes("pc")) return "🖥️";
    if (nameLower.includes("ipad") || nameLower.includes("tablet")) return "📱";
    if (nameLower.includes("tv") || nameLower.includes("chromecast"))
      return "📺";
    if (nameLower.includes("speaker") || nameLower.includes("sonos"))
      return "🔊";
    if (nameLower.includes("tesla") || nameLower.includes("car")) return "🚗";
    // Default avatars based on type
    switch (type.toLowerCase()) {
      case "phone":
        return "📱";
      case "computer":
        return "💻";
      case "laptop":
        return "💻";
      case "tablet":
        return "📱";
      case "tv":
        return "📺";
      case "speaker":
        return "🔊";
      case "car":
        return "🚗";
      default:
        return "📱";
    }
  };
  var addFallbackDevices = function () {
    var fallbackDevices = [
      {
        id: "fallback-1",
        name: "Your Device",
        type: "phone",
        brand: "Unknown",
        model: "Unknown",
        distance: 0.1,
        signal: 100,
        status: "online",
        lastSeen: new Date(),
        capabilities: ["wifi", "bluetooth"],
        avatar: "📱",
      },
    ];
    setNearbyDevices(fallbackDevices);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="relative z-10 flex justify-between items-center px-6 py-4 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-xl">
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
        className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-xl rounded-full px-6 py-3 z-50 shadow-2xl border border-white/20"
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
      <div className="relative z-10 px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <framer_motion_1.motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl"
          >
            <lucide_react_1.Sparkles className="w-16 h-16 text-white" />
          </framer_motion_1.motion.div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              JASON
            </h1>
            <p className="text-xl opacity-80">Your Omnipotent AI Companion</p>
          </div>

          {/* Earnings Display */}
          <framer_motion_1.motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20"
          >
            <lucide_react_1.DollarSign className="w-6 h-6 text-green-400" />
            <span className="font-bold text-green-400 text-lg">
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
                  " p-4 rounded-2xl shadow-xl flex flex-col items-center space-y-2 backdrop-blur-xl border border-white/20",
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

        {/* Device Discovery Section */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Nearby Devices
            </h2>
            <framer_motion_1.motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={function () {
                return setIsScanning(!isScanning);
              }}
              className={"px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all duration-300 backdrop-blur-xl border ".concat(
                isScanning
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
              )}
            >
              <lucide_react_1.Search
                className={"w-4 h-4 ".concat(isScanning ? "animate-spin" : "")}
              />
              <span>{isScanning ? "Stop Scan" : "Scan"}</span>
            </framer_motion_1.motion.button>
          </div>

          <framer_motion_1.AnimatePresence>
            {nearbyDevices.length > 0 && (
              <framer_motion_1.motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-3"
              >
                {nearbyDevices.map(function (device, index) {
                  return (
                    <framer_motion_1.motion.div
                      key={device.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 cursor-pointer group"
                      onClick={function () {
                        return setSelectedDevice(device);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                            {getDeviceIcon(device.type)}
                          </div>
                          <div
                            className={"absolute -bottom-1 -right-1 w-4 h-4 ".concat(
                              getStatusColor(device.status),
                              " rounded-full border-2 border-white",
                            )}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white">
                              {device.name}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/70">
                              {device.brand}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-white/60">
                              {device.distance.toFixed(1)}m away
                            </span>
                            <div className="flex items-center space-x-1">
                              <lucide_react_1.Signal className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400">
                                {device.signal}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{device.avatar}</span>
                          <lucide_react_1.ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
                        </div>
                      </div>
                    </framer_motion_1.motion.div>
                  );
                })}
              </framer_motion_1.motion.div>
            )}
          </framer_motion_1.AnimatePresence>

          {isScanning && nearbyDevices.length === 0 && (
            <framer_motion_1.motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <framer_motion_1.motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white/60">Scanning for devices...</p>
            </framer_motion_1.motion.div>
          )}
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
                  " p-6 rounded-3xl shadow-xl cursor-pointer relative overflow-hidden backdrop-blur-xl border border-white/20",
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
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Quick Share
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Share Text
              </label>
              <textarea
                value={textToShare}
                onChange={function (e) {
                  return setTextToShare(e.target.value);
                }}
                placeholder="Type something to share..."
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Share Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
            </div>

            {(selectedFiles.length > 0 || textToShare) && (
              <framer_motion_1.motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-wrap gap-2"
              >
                {selectedFiles.map(function (file, index) {
                  return (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                    >
                      {file.name}
                    </span>
                  );
                })}
                {textToShare && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    Text message
                  </span>
                )}
              </framer_motion_1.motion.div>
            )}
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* Device Modal */}
      <framer_motion_1.AnimatePresence>
        {selectedDevice && (
          <framer_motion_1.motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={function () {
              return setSelectedDevice(null);
            }}
          >
            <framer_motion_1.motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full"
              onClick={function (e) {
                return e.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Share to Device
                </h3>
                <button
                  onClick={function () {
                    return setSelectedDevice(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <lucide_react_1.X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  {getDeviceIcon(selectedDevice.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {selectedDevice.name}
                  </h4>
                  <p className="text-white/60">
                    {selectedDevice.brand} {selectedDevice.model}
                  </p>
                  <p className="text-sm text-white/50">
                    {selectedDevice.distance.toFixed(1)}m away
                  </p>
                </div>
              </div>

              {isTransferring ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Transferring...</span>
                    <span className="text-white">{transferProgress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <framer_motion_1.motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ width: "".concat(transferProgress, "%") }}
                    />
                  </div>
                </div>
              ) : (
                <framer_motion_1.motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={function () {
                    return shareToDevice(selectedDevice);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium"
                >
                  Start Transfer
                </framer_motion_1.motion.button>
              )}
            </framer_motion_1.motion.div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      <style jsx>
        {
          "\n        @keyframes blob {\n          0% {\n            transform: translate(0px, 0px) scale(1);\n          }\n          33% {\n            transform: translate(30px, -50px) scale(1.1);\n          }\n          66% {\n            transform: translate(-20px, 20px) scale(0.9);\n          }\n          100% {\n            transform: translate(0px, 0px) scale(1);\n          }\n        }\n        .animate-blob {\n          animation: blob 7s infinite;\n        }\n        .animation-delay-2000 {\n          animation-delay: 2s;\n        }\n        .animation-delay-4000 {\n          animation-delay: 4s;\n        }\n      "
        }
      </style>
    </div>
  );
};
exports.default = BeautifulJasonMobile;

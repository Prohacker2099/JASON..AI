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
var lucide_react_1 = require("lucide-react");
var AdvancedSharingSystem = function () {
  var _a = (0, react_1.useState)("share"),
    activeTab = _a[0],
    setActiveTab = _a[1];
  var _b = (0, react_1.useState)([]),
    selectedItems = _b[0],
    setSelectedItems = _b[1];
  var _c = (0, react_1.useState)([]),
    availableTargets = _c[0],
    setAvailableTargets = _c[1];
  var _d = (0, react_1.useState)([]),
    shareHistory = _d[0],
    setShareHistory = _d[1];
  var _e = (0, react_1.useState)(false),
    isScanning = _e[0],
    setIsScanning = _e[1];
  var _f = (0, react_1.useState)("nearby"),
    shareMethod = _f[0],
    setShareMethod = _f[1];
  var _g = (0, react_1.useState)(""),
    textToShare = _g[0],
    setTextToShare = _g[1];
  var _h = (0, react_1.useState)({
      password: "",
      expiresIn: "24h",
      allowDownload: true,
      allowCopy: true,
      trackViews: true,
    }),
    linkSettings = _h[0],
    setLinkSettings = _h[1];
  var _j = (0, react_1.useState)(null),
    currentSession = _j[0],
    setCurrentSession = _j[1];
  var _k = (0, react_1.useState)(false),
    showQRCode = _k[0],
    setShowQRCode = _k[1];
  var _l = (0, react_1.useState)([]),
    clipboard = _l[0],
    setClipboard = _l[1];
  var _m = (0, react_1.useState)(""),
    searchQuery = _m[0],
    setSearchQuery = _m[1];
  var _o = (0, react_1.useState)("all"),
    filterType = _o[0],
    setFilterType = _o[1];
  var fileInputRef = (0, react_1.useRef)(null);
  var qrCodeRef = (0, react_1.useRef)(null);
  var dragRef = (0, react_1.useRef)(null);
  // Sample data
  var _p = (0, react_1.useState)([
      {
        id: "1",
        type: "text",
        name: "Meeting Notes",
        content: "Important meeting notes from today...",
        created: new Date(),
        shared: false,
        shareCount: 0,
        allowDownload: true,
        allowCopy: true,
        trackViews: true,
        views: 0,
      },
      {
        id: "2",
        type: "image",
        name: "vacation.jpg",
        content: "/path/to/vacation.jpg",
        size: 2048000,
        thumbnail: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        created: new Date(),
        shared: true,
        shareCount: 5,
        allowDownload: true,
        allowCopy: false,
        trackViews: true,
        views: 12,
      },
    ]),
    shareableItems = _p[0],
    setShareableItems = _p[1];
  // Initialize nearby devices scanning
  (0, react_1.useEffect)(
    function () {
      if (isScanning) {
        scanForNearbyDevices();
      }
    },
    [isScanning],
  );
  var scanForNearbyDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var mockDevices, _loop_1, i;
      return __generator(this, function (_a) {
        mockDevices = [
          {
            id: "device-1",
            name: "John's iPhone",
            type: "device",
            icon: <lucide_react_1.Smartphone className="w-6 h-6" />,
            status: "online",
            capabilities: ["airdrop", "bluetooth", "wifi"],
            distance: 2,
            signal: 95,
          },
          {
            id: "device-2",
            name: "Sarah's MacBook",
            type: "device",
            icon: <lucide_react_1.Monitor className="w-6 h-6" />,
            status: "online",
            capabilities: ["airdrop", "wifi"],
            distance: 5,
            signal: 87,
          },
          {
            id: "device-3",
            name: "Living Room TV",
            type: "device",
            icon: <lucide_react_1.Monitor className="w-6 h-6" />,
            status: "online",
            capabilities: ["chromecast", "wifi"],
            distance: 8,
            signal: 78,
          },
        ];
        _loop_1 = function (i) {
          setTimeout(function () {
            setAvailableTargets(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                [mockDevices[i]],
                false,
              );
            });
          }, i * 1000);
        };
        // Simulate gradual discovery
        for (i = 0; i < mockDevices.length; i++) {
          _loop_1(i);
        }
        return [2 /*return*/];
      });
    });
  };
  var handleFileSelect = function (files) {
    Array.from(files).forEach(function (file) {
      var newItem = {
        id: Date.now().toString() + Math.random(),
        type: getFileType(file.type),
        name: file.name,
        content: URL.createObjectURL(file),
        size: file.size,
        created: new Date(),
        shared: false,
        shareCount: 0,
        allowDownload: true,
        allowCopy: true,
        trackViews: true,
        views: 0,
      };
      setShareableItems(function (prev) {
        return __spreadArray(__spreadArray([], prev, true), [newItem], false);
      });
    });
  };
  var getFileType = function (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
  };
  var getItemIcon = function (type) {
    switch (type) {
      case "text":
        return <lucide_react_1.FileText className="w-6 h-6" />;
      case "image":
        return <lucide_react_1.Image className="w-6 h-6" />;
      case "video":
        return <lucide_react_1.Video className="w-6 h-6" />;
      case "audio":
        return <lucide_react_1.Music className="w-6 h-6" />;
      case "link":
        return <lucide_react_1.Link className="w-6 h-6" />;
      case "contact":
        return <lucide_react_1.Users className="w-6 h-6" />;
      case "location":
        return <lucide_react_1.Target className="w-6 h-6" />;
      default:
        return <lucide_react_1.File className="w-6 h-6" />;
    }
  };
  var handleShare = function (targets) {
    return __awaiter(void 0, void 0, void 0, function () {
      var session, _loop_2, progress;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (selectedItems.length === 0) return [2 /*return*/];
            session = {
              id: Date.now().toString(),
              items: selectedItems,
              targets: targets,
              status: "preparing",
              progress: 0,
              startTime: new Date(),
              totalSize: selectedItems.reduce(function (sum, item) {
                return sum + (item.size || 0);
              }, 0),
              transferredSize: 0,
            };
            setCurrentSession(session);
            _loop_2 = function (progress) {
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    return [
                      4 /*yield*/,
                      new Promise(function (resolve) {
                        return setTimeout(resolve, 200);
                      }),
                    ];
                  case 1:
                    _b.sent();
                    setCurrentSession(function (prev) {
                      return prev
                        ? __assign(__assign({}, prev), {
                            progress: progress,
                            status: progress === 100 ? "completed" : "sending",
                            transferredSize: (prev.totalSize * progress) / 100,
                            transferSpeed: Math.random() * 10 + 5, // MB/s
                          })
                        : null;
                    });
                    return [2 /*return*/];
                }
              });
            };
            progress = 0;
            _a.label = 1;
          case 1:
            if (!(progress <= 100)) return [3 /*break*/, 4];
            return [5 /*yield**/, _loop_2(progress)];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            progress += 10;
            return [3 /*break*/, 1];
          case 4:
            // Update share history
            setShareHistory(function (prev) {
              return __spreadArray([session], prev, true);
            });
            setCurrentSession(null);
            setSelectedItems([]);
            return [2 /*return*/];
        }
      });
    });
  };
  var generateShareLink = function (item) {
    var baseUrl = window.location.origin;
    var shareId = btoa(item.id + Date.now());
    return "".concat(baseUrl, "/share/").concat(shareId);
  };
  var generateQRCode = function (content) {
    // In a real implementation, use a QR code library
    setShowQRCode(true);
  };
  var copyToClipboard = function (content) {
    return __awaiter(void 0, void 0, void 0, function () {
      var error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [4 /*yield*/, navigator.clipboard.writeText(content)];
          case 1:
            _a.sent();
            setClipboard(function (prev) {
              return __spreadArray(
                [{ content: content, timestamp: new Date() }],
                prev.slice(0, 9),
                true,
              );
            });
            return [3 /*break*/, 3];
          case 2:
            error_1 = _a.sent();
            console.error("Failed to copy to clipboard:", error_1);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  var formatFileSize = function (bytes) {
    var sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };
  var formatTransferSpeed = function (bytesPerSecond) {
    return "".concat((bytesPerSecond / 1024 / 1024).toFixed(1), " MB/s");
  };
  var filteredItems = shareableItems.filter(function (item) {
    var matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    var matchesFilter =
      filterType === "all" ||
      (filterType === "text" && item.type === "text") ||
      (filterType === "files" && ["file", "pdf", "code"].includes(item.type)) ||
      (filterType === "media" &&
        ["image", "video", "audio"].includes(item.type));
    return matchesSearch && matchesFilter;
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <framer_motion_1.motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Advanced Sharing
            </h1>
            <div className="flex items-center space-x-2">
              <framer_motion_1.motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={function () {
                  return setIsScanning(!isScanning);
                }}
                className={"p-2 rounded-full ".concat(
                  isScanning ? "bg-green-500" : "bg-blue-500",
                  " text-white shadow-lg",
                )}
              >
                {isScanning ? (
                  <lucide_react_1.Wifi className="w-5 h-5" />
                ) : (
                  <lucide_react_1.Search className="w-5 h-5" />
                )}
              </framer_motion_1.motion.button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {[
              { id: "share", label: "Share", icon: lucide_react_1.Share },
              {
                id: "receive",
                label: "Receive",
                icon: lucide_react_1.Download,
              },
              { id: "history", label: "History", icon: lucide_react_1.Clock },
              { id: "settings", label: "Settings", icon: Settings },
            ].map(function (tab) {
              return (
                <framer_motion_1.motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={function () {
                    return setActiveTab(tab.id);
                  }}
                  className={"flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-300 ".concat(
                    activeTab === tab.id
                      ? "bg-white dark:bg-gray-600 shadow-md text-purple-600 dark:text-purple-400"
                      : "text-gray-600 dark:text-gray-400",
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </framer_motion_1.motion.button>
              );
            })}
          </div>
        </div>
      </framer_motion_1.motion.header>

      {/* Main Content */}
      <main className="p-4">
        <framer_motion_1.AnimatePresence mode="wait">
          {activeTab === "share" && (
            <framer_motion_1.motion.div
              key="share"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              {/* Quick Text Share */}
              <framer_motion_1.motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <lucide_react_1.MessageCircle className="w-5 h-5 text-blue-500" />
                  <span>Quick Text Share</span>
                </h2>
                <div className="space-y-4">
                  <textarea
                    value={textToShare}
                    onChange={function (e) {
                      return setTextToShare(e.target.value);
                    }}
                    placeholder="Type or paste text to share..."
                    className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  />
                  <div className="flex space-x-2">
                    <framer_motion_1.motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={function () {
                        return copyToClipboard(textToShare);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg"
                    >
                      <lucide_react_1.Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </framer_motion_1.motion.button>
                    <framer_motion_1.motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={function () {
                        return generateQRCode(textToShare);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg"
                    >
                      <lucide_react_1.QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </framer_motion_1.motion.button>
                    <framer_motion_1.motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg"
                    >
                      <lucide_react_1.Link className="w-4 h-4" />
                      <span>Share Link</span>
                    </framer_motion_1.motion.button>
                  </div>
                </div>
              </framer_motion_1.motion.div>

              {/* File Upload Area */}
              <framer_motion_1.motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <lucide_react_1.Upload className="w-5 h-5 text-green-500" />
                  <span>File Upload</span>
                </h2>
                <div
                  ref={dragRef}
                  onClick={function () {
                    var _a;
                    return (_a = fileInputRef.current) === null || _a === void 0
                      ? void 0
                      : _a.click();
                  }}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors duration-300"
                >
                  <lucide_react_1.CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag & drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports images, videos, documents, and more
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={function (e) {
                    return e.target.files && handleFileSelect(e.target.files);
                  }}
                />
              </framer_motion_1.motion.div>

              {/* Shareable Items */}
              <framer_motion_1.motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center space-x-2">
                    <lucide_react_1.Folder className="w-5 h-5 text-orange-500" />
                    <span>Your Items</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={function (e) {
                          return setSearchQuery(e.target.value);
                        }}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={function (e) {
                        return setFilterType(e.target.value);
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    >
                      <option value="all">All</option>
                      <option value="text">Text</option>
                      <option value="files">Files</option>
                      <option value="media">Media</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map(function (item, index) {
                    return (
                      <framer_motion_1.motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onClick={function () {
                          setSelectedItems(function (prev) {
                            return prev.find(function (i) {
                              return i.id === item.id;
                            })
                              ? prev.filter(function (i) {
                                  return i.id !== item.id;
                                })
                              : __spreadArray(
                                  __spreadArray([], prev, true),
                                  [item],
                                  false,
                                );
                          });
                        }}
                        className={"p-4 rounded-xl cursor-pointer transition-all duration-300 ".concat(
                          selectedItems.find(function (i) {
                            return i.id === item.id;
                          })
                            ? "bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600",
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-gray-600 dark:text-gray-400">
                            {getItemIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 dark:text-white truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {item.type === "text"
                                ? item.content
                                : "".concat(item.type.toUpperCase())}
                            </p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                              {item.size && (
                                <span>{formatFileSize(item.size)}</span>
                              )}
                              {item.shared && (
                                <span className="text-green-500">Shared</span>
                              )}
                              {item.shareCount > 0 && (
                                <span>{item.shareCount} shares</span>
                              )}
                              {item.views > 0 && (
                                <span>{item.views} views</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </framer_motion_1.motion.div>
                    );
                  })}
                </div>

                {selectedItems.length > 0 && (
                  <framer_motion_1.motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-purple-50 dark:bg-purple-900 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        {selectedItems.length} item(s) selected
                      </span>
                      <div className="flex space-x-2">
                        <framer_motion_1.motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={function () {
                            return setSelectedItems([]);
                          }}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg"
                        >
                          Clear
                        </framer_motion_1.motion.button>
                        <framer_motion_1.motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={function () {
                            return handleShare(
                              availableTargets.filter(function (t) {
                                return t.status === "online";
                              }),
                            );
                          }}
                          className="px-3 py-1 text-sm bg-purple-500 text-white rounded-lg"
                        >
                          Share Now
                        </framer_motion_1.motion.button>
                      </div>
                    </div>
                  </framer_motion_1.motion.div>
                )}
              </framer_motion_1.motion.div>

              {/* Nearby Devices */}
              {isScanning && (
                <framer_motion_1.motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <lucide_react_1.Wifi className="w-5 h-5 text-blue-500" />
                    <span>Nearby Devices</span>
                    <framer_motion_1.motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTargets.map(function (target, index) {
                      return (
                        <framer_motion_1.motion.div
                          key={target.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {target.icon}
                              <div
                                className={"absolute -top-1 -right-1 w-3 h-3 rounded-full ".concat(
                                  target.status === "online"
                                    ? "bg-green-500"
                                    : target.status === "busy"
                                      ? "bg-yellow-500"
                                      : target.status === "away"
                                        ? "bg-orange-500"
                                        : "bg-gray-500",
                                )}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800 dark:text-white">
                                {target.name}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {target.distance && (
                                  <span>{target.distance}m away</span>
                                )}
                                {target.signal && (
                                  <span>{target.signal}% signal</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </framer_motion_1.motion.div>
                      );
                    })}
                  </div>
                </framer_motion_1.motion.div>
              )}
            </framer_motion_1.motion.div>
          )}

          {activeTab === "receive" && (
            <framer_motion_1.motion.div
              key="receive"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <ReceiveTab />
            </framer_motion_1.motion.div>
          )}

          {activeTab === "history" && (
            <framer_motion_1.motion.div
              key="history"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <HistoryTab shareHistory={shareHistory} />
            </framer_motion_1.motion.div>
          )}

          {activeTab === "settings" && (
            <framer_motion_1.motion.div
              key="settings"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <SettingsTab />
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>
      </main>

      {/* Transfer Progress Modal */}
      <framer_motion_1.AnimatePresence>
        {currentSession && (
          <framer_motion_1.motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <framer_motion_1.motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <TransferProgress session={currentSession} />
            </framer_motion_1.motion.div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      {/* QR Code Modal */}
      <framer_motion_1.AnimatePresence>
        {showQRCode && (
          <framer_motion_1.motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={function () {
              return setShowQRCode(false);
            }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <framer_motion_1.motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={function (e) {
                return e.stopPropagation();
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4"
            >
              <QRCodeDisplay
                content={textToShare}
                onClose={function () {
                  return setShowQRCode(false);
                }}
              />
            </framer_motion_1.motion.div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>
    </div>
  );
};
// Additional Components
var ReceiveTab = function () {
  return (
    <div className="space-y-6">
      <framer_motion_1.motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl text-center"
      >
        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <lucide_react_1.Download className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Ready to Receive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your device is discoverable and ready to receive files from nearby
          devices.
        </p>
        <div className="flex justify-center space-x-4">
          <framer_motion_1.motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-lg"
          >
            Start Receiving
          </framer_motion_1.motion.button>
          <framer_motion_1.motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-lg"
          >
            Stop
          </framer_motion_1.motion.button>
        </div>
      </framer_motion_1.motion.div>
    </div>
  );
};
var HistoryTab = function (_a) {
  var shareHistory = _a.shareHistory;
  return (
    <div className="space-y-4">
      {shareHistory.map(function (session, index) {
        return (
          <framer_motion_1.motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800 dark:text-white">
                {session.items.length} item(s) to {session.targets.length}{" "}
                device(s)
              </h3>
              <span
                className={"px-2 py-1 rounded-full text-xs ".concat(
                  session.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : session.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800",
                )}
              >
                {session.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {session.startTime.toLocaleString()}
            </div>
          </framer_motion_1.motion.div>
        );
      })}
    </div>
  );
};
var SettingsTab = function () {
  return (
    <div className="space-y-6">
      <framer_motion_1.motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold mb-4">Sharing Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Auto-accept from trusted devices</span>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <span>Show in nearby devices</span>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span>Require password for links</span>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </framer_motion_1.motion.div>
    </div>
  );
};
var TransferProgress = function (_a) {
  var session = _a.session;
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-4">Sharing Files</h3>
      <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <lucide_react_1.Send className="w-8 h-8 text-white" />
      </div>
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <framer_motion_1.motion.div
            initial={{ width: 0 }}
            animate={{ width: "".concat(session.progress, "%") }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {session.progress}% complete
        </p>
      </div>
      {session.transferSpeed && (
        <p className="text-sm text-gray-500">
          {formatTransferSpeed(session.transferSpeed)}
        </p>
      )}
    </div>
  );
};
var QRCodeDisplay = function (_a) {
  var content = _a.content,
    onClose = _a.onClose;
  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">QR Code</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <lucide_react_1.X className="w-5 h-5" />
        </button>
      </div>
      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <lucide_react_1.QrCode className="w-32 h-32 text-gray-400" />
      </div>
      <p className="text-sm text-gray-600">
        Scan this QR code to access the shared content
      </p>
    </div>
  );
};
exports.default = AdvancedSharingSystem;

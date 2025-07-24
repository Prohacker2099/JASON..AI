"use strict";
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
var MobileOptimizedJasonInterface = function () {
  var _a = (0, react_1.useState)("home"),
    activeTab = _a[0],
    setActiveTab = _a[1];
  var _b = (0, react_1.useState)(false),
    isMenuOpen = _b[0],
    setIsMenuOpen = _b[1];
  var _c = (0, react_1.useState)(""),
    searchQuery = _c[0],
    setSearchQuery = _c[1];
  var _d = (0, react_1.useState)([]),
    selectedFiles = _d[0],
    setSelectedFiles = _d[1];
  var _e = (0, react_1.useState)("/"),
    currentPath = _e[0],
    setCurrentPath = _e[1];
  var _f = (0, react_1.useState)("grid"),
    viewMode = _f[0],
    setViewMode = _f[1];
  var _g = (0, react_1.useState)(false),
    showQuickActions = _g[0],
    setShowQuickActions = _g[1];
  var _h = (0, react_1.useState)([]),
    clipboard = _h[0],
    setClipboard = _h[1];
  var _j = (0, react_1.useState)(false),
    isDarkMode = _j[0],
    setIsDarkMode = _j[1];
  var _k = (0, react_1.useState)([]),
    notifications = _k[0],
    setNotifications = _k[1];
  var _l = (0, react_1.useState)(false),
    isVoiceMode = _l[0],
    setIsVoiceMode = _l[1];
  var _m = (0, react_1.useState)(85),
    batteryLevel = _m[0],
    setBatteryLevel = _m[1];
  var _o = (0, react_1.useState)("wifi"),
    connectionStatus = _o[0],
    setConnectionStatus = _o[1];
  var _p = (0, react_1.useState)(new Date()),
    currentTime = _p[0],
    setCurrentTime = _p[1];
  var fileInputRef = (0, react_1.useRef)(null);
  var dragRef = (0, react_1.useRef)(null);
  var _q = (0, react_1.useState)(false),
    isDragging = _q[0],
    setIsDragging = _q[1];
  // Sample file data
  var _r = (0, react_1.useState)([
      {
        id: "1",
        name: "My Documents",
        type: "folder",
        modified: new Date(),
        path: "/documents",
      },
      {
        id: "2",
        name: "Photos",
        type: "folder",
        modified: new Date(),
        path: "/photos",
      },
      {
        id: "3",
        name: "vacation.jpg",
        type: "image",
        size: 2048000,
        modified: new Date(),
        starred: true,
        path: "/photos/vacation.jpg",
      },
      {
        id: "4",
        name: "presentation.pdf",
        type: "document",
        size: 5120000,
        modified: new Date(),
        shared: true,
        path: "/documents/presentation.pdf",
      },
    ]),
    files = _r[0],
    setFiles = _r[1];
  // Quick Actions
  var quickActions = [
    {
      id: "share-text",
      label: "Share Text",
      icon: <lucide_react_1.MessageCircle className="w-5 h-5" />,
      color: "bg-blue-500",
      action: function () {
        return handleShareText();
      },
      category: "sharing",
    },
    {
      id: "share-file",
      label: "Share File",
      icon: <lucide_react_1.Share className="w-5 h-5" />,
      color: "bg-green-500",
      action: function () {
        return handleShareFile();
      },
      category: "sharing",
    },
    {
      id: "take-photo",
      label: "Take Photo",
      icon: <lucide_react_1.Camera className="w-5 h-5" />,
      color: "bg-purple-500",
      action: function () {
        return handleTakePhoto();
      },
      category: "media",
    },
    {
      id: "record-voice",
      label: "Voice Note",
      icon: <lucide_react_1.Mic className="w-5 h-5" />,
      color: "bg-red-500",
      action: function () {
        return handleVoiceRecord();
      },
      category: "media",
    },
    {
      id: "scan-qr",
      label: "Scan QR",
      icon: <lucide_react_1.QrCode className="w-5 h-5" />,
      color: "bg-yellow-500",
      action: function () {
        return handleQRScan();
      },
      category: "tools",
    },
    {
      id: "ai-assistant",
      label: "AI Help",
      icon: <lucide_react_1.Brain className="w-5 h-5" />,
      color: "bg-indigo-500",
      action: function () {
        return handleAIAssistant();
      },
      category: "ai",
    },
    {
      id: "smart-home",
      label: "Smart Home",
      icon: <lucide_react_1.Home className="w-5 h-5" />,
      color: "bg-orange-500",
      action: function () {
        return handleSmartHome();
      },
      category: "control",
    },
    {
      id: "clipboard",
      label: "Clipboard",
      icon: <lucide_react_1.Copy className="w-5 h-5" />,
      color: "bg-teal-500",
      action: function () {
        return handleClipboard();
      },
      category: "tools",
    },
  ];
  // App Widgets
  var appWidgets = [
    {
      id: "weather",
      title: "Weather",
      icon: <lucide_react_1.Sun className="w-6 h-6" />,
      component: <WeatherWidget />,
      size: "medium",
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
    },
    {
      id: "music",
      title: "Music Player",
      icon: <lucide_react_1.Music className="w-6 h-6" />,
      component: <MusicWidget />,
      size: "large",
      color: "bg-gradient-to-br from-purple-400 to-pink-600",
    },
    {
      id: "calendar",
      title: "Calendar",
      icon: <lucide_react_1.Calendar className="w-6 h-6" />,
      component: <CalendarWidget />,
      size: "medium",
      color: "bg-gradient-to-br from-green-400 to-green-600",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: <lucide_react_1.TrendingUp className="w-6 h-6" />,
      component: <AnalyticsWidget />,
      size: "large",
      color: "bg-gradient-to-br from-orange-400 to-red-600",
    },
  ];
  // Animation variants
  var containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 },
    },
  };
  var itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };
  var slideVariants = {
    enter: function (direction) {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: function (direction) {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
      };
    },
  };
  // Update time every second
  (0, react_1.useEffect)(function () {
    var timer = setInterval(function () {
      setCurrentTime(new Date());
    }, 1000);
    return function () {
      return clearInterval(timer);
    };
  }, []);
  // Handle file operations
  var handleFileSelect = function (fileId) {
    setSelectedFiles(function (prev) {
      return prev.includes(fileId)
        ? prev.filter(function (id) {
            return id !== fileId;
          })
        : __spreadArray(__spreadArray([], prev, true), [fileId], false);
    });
  };
  var handleFileUpload = (0, react_1.useCallback)(
    function (files) {
      Array.from(files).forEach(function (file) {
        var newFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: getFileType(file.type),
          size: file.size,
          modified: new Date(),
          path: currentPath + file.name,
        };
        setFiles(function (prev) {
          return __spreadArray(__spreadArray([], prev, true), [newFile], false);
        });
      });
    },
    [currentPath],
  );
  var getFileType = function (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return "document";
    return "file";
  };
  var getFileIcon = function (type) {
    switch (type) {
      case "folder":
        return <lucide_react_1.Folder className="w-6 h-6" />;
      case "image":
        return <lucide_react_1.Image className="w-6 h-6" />;
      case "video":
        return <lucide_react_1.Video className="w-6 h-6" />;
      case "audio":
        return <lucide_react_1.Music className="w-6 h-6" />;
      case "document":
        return <lucide_react_1.Pdf className="w-6 h-6" />;
      default:
        return <lucide_react_1.File className="w-6 h-6" />;
    }
  };
  // Action handlers
  var handleShareText = function () {
    // Implement text sharing
    console.log("Sharing text...");
  };
  var handleShareFile = function () {
    if (selectedFiles.length > 0) {
      // Implement file sharing
      console.log("Sharing files:", selectedFiles);
    }
  };
  var handleTakePhoto = function () {
    // Implement camera functionality
    console.log("Taking photo...");
  };
  var handleVoiceRecord = function () {
    setIsVoiceMode(!isVoiceMode);
  };
  var handleQRScan = function () {
    // Implement QR scanning
    console.log("Scanning QR code...");
  };
  var handleAIAssistant = function () {
    // Implement AI assistant
    console.log("Opening AI assistant...");
  };
  var handleSmartHome = function () {
    // Implement smart home controls
    console.log("Opening smart home controls...");
  };
  var handleClipboard = function () {
    // Show clipboard manager
    console.log("Opening clipboard...");
  };
  var formatFileSize = function (bytes) {
    var sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };
  // Drag and drop handlers
  var handleDragOver = function (e) {
    e.preventDefault();
    setIsDragging(true);
  };
  var handleDragLeave = function (e) {
    e.preventDefault();
    setIsDragging(false);
  };
  var handleDrop = function (e) {
    e.preventDefault();
    setIsDragging(false);
    var files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };
  return (
    <div
      className={"min-h-screen ".concat(
        isDarkMode ? "dark bg-gray-900" : "bg-gray-50",
        " transition-colors duration-300",
      )}
    >
      {/* Status Bar */}
      <framer_motion_1.motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center px-4 py-2 bg-black text-white text-sm"
      >
        <div className="flex items-center space-x-2">
          <span>
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <framer_motion_1.motion.div
            animate={{ rotate: connectionStatus === "wifi" ? 0 : 360 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {connectionStatus === "wifi" ? (
              <lucide_react_1.Wifi className="w-4 h-4" />
            ) : (
              <lucide_react_1.Signal className="w-4 h-4" />
            )}
          </framer_motion_1.motion.div>
        </div>
        <div className="flex items-center space-x-2">
          <lucide_react_1.Battery className="w-4 h-4" />
          <span>{batteryLevel}%</span>
          <lucide_react_1.Volume2 className="w-4 h-4" />
        </div>
      </framer_motion_1.motion.div>

      {/* Header */}
      <framer_motion_1.motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <framer_motion_1.motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={function () {
              return setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
          >
            <lucide_react_1.Menu className="w-6 h-6" />
          </framer_motion_1.motion.button>

          <framer_motion_1.motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            JASON
          </framer_motion_1.motion.h1>

          <div className="flex items-center space-x-2">
            <framer_motion_1.motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={function () {
                return setIsVoiceMode(!isVoiceMode);
              }}
              className={"p-2 rounded-full ".concat(
                isVoiceMode ? "bg-red-500" : "bg-blue-500",
                " text-white shadow-lg",
              )}
            >
              {isVoiceMode ? (
                <lucide_react_1.MicOff className="w-5 h-5" />
              ) : (
                <lucide_react_1.Mic className="w-5 h-5" />
              )}
            </framer_motion_1.motion.button>

            <framer_motion_1.motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={function () {
                return setIsDarkMode(!isDarkMode);
              }}
              className="p-2 rounded-full bg-gray-500 text-white shadow-lg"
            >
              {isDarkMode ? (
                <lucide_react_1.Sun className="w-5 h-5" />
              ) : (
                <lucide_react_1.Moon className="w-5 h-5" />
              )}
            </framer_motion_1.motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <framer_motion_1.motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4 }}
          className="px-4 pb-3"
        >
          <div className="relative">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files, apps, or ask JASON..."
              value={searchQuery}
              onChange={function (e) {
                return setSearchQuery(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            {searchQuery && (
              <framer_motion_1.motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={function () {
                  return setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <lucide_react_1.X className="w-5 h-5" />
              </framer_motion_1.motion.button>
            )}
          </div>
        </framer_motion_1.motion.div>
      </framer_motion_1.motion.header>

      {/* Quick Actions Floating Button */}
      <framer_motion_1.motion.div
        className="fixed bottom-20 right-4 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <framer_motion_1.motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={function () {
            return setShowQuickActions(!showQuickActions);
          }}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white"
        >
          <framer_motion_1.motion.div
            animate={{ rotate: showQuickActions ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <lucide_react_1.Plus className="w-8 h-8" />
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.button>

        {/* Quick Actions Menu */}
        <framer_motion_1.AnimatePresence>
          {showQuickActions && (
            <framer_motion_1.motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 w-80"
            >
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map(function (action, index) {
                  return (
                    <framer_motion_1.motion.button
                      key={action.id}
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={action.action}
                      className={"".concat(
                        action.color,
                        " text-white p-3 rounded-xl flex flex-col items-center space-y-1 shadow-lg",
                      )}
                    >
                      {action.icon}
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </framer_motion_1.motion.button>
                  );
                })}
              </div>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>
      </framer_motion_1.motion.div>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <framer_motion_1.AnimatePresence mode="wait">
          {activeTab === "home" && (
            <framer_motion_1.motion.div
              key="home"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* App Widgets */}
              <framer_motion_1.motion.div variants={itemVariants}>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Dashboard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appWidgets.map(function (widget, index) {
                    return (
                      <framer_motion_1.motion.div
                        key={widget.id}
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={""
                          .concat(
                            widget.color,
                            " rounded-2xl p-6 text-white shadow-xl ",
                          )
                          .concat(
                            widget.size === "large" ? "md:col-span-2" : "",
                          )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {widget.title}
                          </h3>
                          {widget.icon}
                        </div>
                        {widget.component}
                      </framer_motion_1.motion.div>
                    );
                  })}
                </div>
              </framer_motion_1.motion.div>

              {/* Recent Files */}
              <framer_motion_1.motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Recent Files
                  </h2>
                  <div className="flex items-center space-x-2">
                    <framer_motion_1.motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={function () {
                        return setViewMode(
                          viewMode === "grid" ? "list" : "grid",
                        );
                      }}
                      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
                    >
                      {viewMode === "grid" ? (
                        <lucide_react_1.List className="w-5 h-5" />
                      ) : (
                        <lucide_react_1.Grid className="w-5 h-5" />
                      )}
                    </framer_motion_1.motion.button>
                  </div>
                </div>

                <div
                  ref={dragRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={""
                    .concat(
                      viewMode === "grid"
                        ? "grid grid-cols-2 md:grid-cols-4 gap-4"
                        : "space-y-2",
                      " ",
                    )
                    .concat(
                      isDragging
                        ? "bg-blue-100 dark:bg-blue-900 border-2 border-dashed border-blue-400"
                        : "",
                      " \n                  rounded-xl p-4 transition-all duration-300",
                    )}
                >
                  {files.slice(0, 8).map(function (file, index) {
                    return (
                      <framer_motion_1.motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={function () {
                          return handleFileSelect(file.id);
                        }}
                        className={"".concat(
                          selectedFiles.includes(file.id)
                            ? "ring-2 ring-purple-500"
                            : "",
                          " bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg cursor-pointer transition-all duration-300",
                        )}
                      >
                        {viewMode === "grid" ? (
                          <div className="text-center">
                            <div className="flex justify-center mb-2 text-gray-600 dark:text-gray-400">
                              {getFileIcon(file.type)}
                            </div>
                            <h3 className="font-medium text-sm text-gray-800 dark:text-white truncate">
                              {file.name}
                            </h3>
                            {file.size && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(file.size)}
                              </p>
                            )}
                            <div className="flex justify-center space-x-1 mt-2">
                              {file.starred && (
                                <lucide_react_1.Star className="w-3 h-3 text-yellow-500" />
                              )}
                              {file.shared && (
                                <lucide_react_1.Share className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-600 dark:text-gray-400">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800 dark:text-white">
                                {file.name}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {file.size && (
                                  <span>{formatFileSize(file.size)}</span>
                                )}
                                <span>
                                  {file.modified.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              {file.starred && (
                                <lucide_react_1.Star className="w-4 h-4 text-yellow-500" />
                              )}
                              {file.shared && (
                                <lucide_react_1.Share className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        )}
                      </framer_motion_1.motion.div>
                    );
                  })}
                </div>
              </framer_motion_1.motion.div>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <framer_motion_1.motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2"
      >
        <div className="flex justify-around items-center">
          {[
            { id: "home", icon: lucide_react_1.Home, label: "Home" },
            { id: "files", icon: lucide_react_1.Folder, label: "Files" },
            { id: "share", icon: lucide_react_1.Share, label: "Share" },
            { id: "ai", icon: lucide_react_1.Brain, label: "AI" },
            {
              id: "settings",
              icon: lucide_react_1.Settings,
              label: "Settings",
            },
          ].map(function (tab, index) {
            return (
              <framer_motion_1.motion.button
                key={tab.id}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={function () {
                  return setActiveTab(tab.id);
                }}
                className={"flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ".concat(
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </framer_motion_1.motion.button>
            );
          })}
        </div>
      </framer_motion_1.motion.nav>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={function (e) {
          return e.target.files && handleFileUpload(e.target.files);
        }}
      />

      {/* Side Menu */}
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
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            <framer_motion_1.motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
            >
              <SideMenu
                onClose={function () {
                  return setIsMenuOpen(false);
                }}
              />
            </framer_motion_1.motion.div>
          </>
        )}
      </framer_motion_1.AnimatePresence>
    </div>
  );
};
// Widget Components
var WeatherWidget = function () {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">72°F</p>
          <p className="text-sm opacity-80">Sunny</p>
        </div>
        <lucide_react_1.Sun className="w-12 h-12" />
      </div>
      <div className="flex justify-between text-sm opacity-80">
        <span>High: 78°</span>
        <span>Low: 65°</span>
      </div>
    </div>
  );
};
var MusicWidget = function () {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
          <lucide_react_1.Music className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold">Now Playing</p>
          <p className="text-sm opacity-80">Chill Vibes Playlist</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <SkipBack className="w-6 h-6" />
        <framer_motion_1.motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
        >
          <Play className="w-6 h-6" />
        </framer_motion_1.motion.button>
        <SkipForward className="w-6 h-6" />
      </div>
    </div>
  );
};
var CalendarWidget = function () {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Today's Events</p>
        <lucide_react_1.Calendar className="w-5 h-5" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm">Team Meeting - 2:00 PM</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm">Dinner with Friends - 7:00 PM</span>
        </div>
      </div>
    </div>
  );
};
var AnalyticsWidget = function () {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Data Earnings</p>
        <lucide_react_1.TrendingUp className="w-5 h-5" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">$24.67</p>
          <p className="text-sm opacity-80">This Month</p>
        </div>
        <div>
          <p className="text-2xl font-bold">+12%</p>
          <p className="text-sm opacity-80">Growth</p>
        </div>
      </div>
    </div>
  );
};
var SideMenu = function (_a) {
  var onClose = _a.onClose;
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Menu
        </h2>
        <framer_motion_1.motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <lucide_react_1.X className="w-5 h-5" />
        </framer_motion_1.motion.button>
      </div>

      <div className="space-y-4">
        {[
          {
            icon: lucide_react_1.User,
            label: "Profile",
            color: "text-blue-500",
          },
          {
            icon: lucide_react_1.Settings,
            label: "Settings",
            color: "text-gray-500",
          },
          {
            icon: lucide_react_1.Shield,
            label: "Privacy",
            color: "text-green-500",
          },
          {
            icon: lucide_react_1.Bell,
            label: "Notifications",
            color: "text-yellow-500",
          },
          {
            icon: lucide_react_1.Heart,
            label: "Favorites",
            color: "text-red-500",
          },
          {
            icon: lucide_react_1.Download,
            label: "Downloads",
            color: "text-purple-500",
          },
          {
            icon: lucide_react_1.Cloud,
            label: "Cloud Storage",
            color: "text-indigo-500",
          },
          {
            icon: HelpCircle,
            label: "Help & Support",
            color: "text-orange-500",
          },
        ].map(function (item, index) {
          return (
            <framer_motion_1.motion.button
              key={item.label}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-4 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              <item.icon className={"w-6 h-6 ".concat(item.color)} />
              <span className="text-gray-800 dark:text-white font-medium">
                {item.label}
              </span>
            </framer_motion_1.motion.button>
          );
        })}
      </div>
    </div>
  );
};
exports.default = MobileOptimizedJasonInterface;

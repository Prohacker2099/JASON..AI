"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var AlexaConnectButton = function (_a) {
  var className = _a.className;
  var _b = (0, react_1.useState)("loading"),
    status = _b[0],
    setStatus = _b[1];
  (0, react_1.useEffect)(function () {
    // Check authentication status
    fetch("/api/auth/status")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        setStatus(data.authenticated ? "connected" : "disconnected");
      })
      .catch(function () {
        setStatus("disconnected");
      });
  }, []);
  var handleConnect = function () {
    // Redirect to Amazon OAuth flow
    window.location.href = "/api/auth/amazon?redirectUrl=".concat(
      encodeURIComponent(window.location.pathname),
    );
  };
  var handleDisconnect = function () {
    // Logout
    window.location.href = "/api/auth/logout";
  };
  if (status === "loading") {
    return (
      <framer_motion_1.motion.div
        className={"relative flex items-center justify-center p-4 ".concat(
          className,
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </framer_motion_1.motion.div>
    );
  }
  return (
    <framer_motion_1.motion.button
      onClick={status === "connected" ? handleDisconnect : handleConnect}
      className={"\n        relative overflow-hidden group\n        px-6 py-3 rounded-full\n        flex items-center justify-center gap-2\n        bg-gradient-to-r from-blue-600/80 to-purple-600/80\n        backdrop-blur-xl\n        border border-white/10\n        text-white font-medium\n        shadow-lg shadow-blue-500/20\n        transition-all duration-300\n        hover:shadow-xl hover:shadow-blue-500/40\n        hover:scale-105\n        ".concat(
        className,
        "\n      ",
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-full" />

      {/* Holographic effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Glow effect */}
      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300" />

      {/* Icon */}
      <svg
        className="w-5 h-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8h-6V8h6v2z"
          fill="currentColor"
        />
      </svg>

      {/* Text */}
      <span className="relative z-10">
        {status === "connected" ? "Disconnect Alexa" : "Connect with Alexa"}
      </span>

      {/* Shimmer effect */}
      <framer_motion_1.motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 200, opacity: 0.5 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "loop" }}
      />
    </framer_motion_1.motion.button>
  );
};
exports.default = AlexaConnectButton;

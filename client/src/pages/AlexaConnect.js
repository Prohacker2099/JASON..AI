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
var GlassmorphicCard_1 = require("../components/GlassmorphicCard");
var AlexaConnectButton_1 = require("../components/AlexaConnectButton");
var AlexaConnect = function () {
  var _a = (0, react_1.useState)("loading"),
    status = _a[0],
    setStatus = _a[1];
  var _b = (0, react_1.useState)([]),
    devices = _b[0],
    setDevices = _b[1];
  (0, react_1.useEffect)(function () {
    // Check Alexa connection status
    fetch("/api/alexa/status")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        setStatus(data.status === "connected" ? "connected" : "disconnected");
        if (data.devices && Array.isArray(data.devices)) {
          setDevices(data.devices);
        }
      })
      .catch(function () {
        setStatus("disconnected");
      });
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {__spreadArray([], Array(20), true).map(function (_, i) {
          return (
            <framer_motion_1.motion.div
              key={i}
              className="absolute rounded-full bg-blue-500/10 backdrop-blur-3xl"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                left: "".concat(Math.random() * 100, "%"),
                top: "".concat(Math.random() * 100, "%"),
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: Math.random() * 20 + 10,
              }}
            />
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">
        <framer_motion_1.motion.h1
          className="text-4xl md:text-5xl font-bold text-white text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Connect with Alexa
          </span>
        </framer_motion_1.motion.h1>

        <GlassmorphicCard_1.default className="p-8 mb-8">
          <div className="text-center">
            <framer_motion_1.motion.div
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3,
              }}
            >
              <svg
                className="w-12 h-12 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8h-6V8h6v2z"
                  fill="currentColor"
                />
              </svg>
            </framer_motion_1.motion.div>

            <framer_motion_1.motion.h2
              className="text-2xl font-bold text-white mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {status === "connected"
                ? "Your Alexa Account is Connected"
                : "Connect Your Alexa Account"}
            </framer_motion_1.motion.h2>

            <framer_motion_1.motion.p
              className="text-gray-300 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {status === "connected"
                ? "Your Amazon Alexa account is successfully linked. You can now control your Alexa devices through JASON."
                : "Link your Amazon account to enable Alexa integration. This allows JASON to discover and control your Alexa-enabled devices."}
            </framer_motion_1.motion.p>

            <AlexaConnectButton_1.default className="mx-auto" />
          </div>
        </GlassmorphicCard_1.default>

        {status === "connected" && devices.length > 0 && (
          <framer_motion_1.motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Your Alexa Devices
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map(function (device) {
                return (
                  <GlassmorphicCard_1.default
                    key={device.id}
                    className="p-4"
                    glowColor="rgba(56, 189, 248, 0.2)"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <svg
                          className="w-5 h-5 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">
                          {device.name}
                        </h4>
                        <p className="text-gray-400 text-sm">{device.model}</p>
                      </div>
                    </div>
                  </GlassmorphicCard_1.default>
                );
              })}
            </div>
          </framer_motion_1.motion.div>
        )}
      </div>
    </div>
  );
};
exports.default = AlexaConnect;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var AlexaDeviceCard_1 = require("./AlexaDeviceCard");
var react_router_dom_1 = require("react-router-dom");
var ConnectedDevicesPanel = function () {
  var _a = (0, react_1.useState)([]),
    devices = _a[0],
    setDevices = _a[1];
  var _b = (0, react_1.useState)(true),
    loading = _b[0],
    setLoading = _b[1];
  var _c = (0, react_1.useState)(null),
    error = _c[0],
    setError = _c[1];
  (0, react_1.useEffect)(function () {
    // Fetch devices from API
    fetch("/api/devices")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        setDevices(data);
        setLoading(false);
      })
      .catch(function (err) {
        console.error("Error fetching devices:", err);
        setError("Failed to load devices");
        setLoading(false);
      });
  }, []);
  var alexaDevices = devices.filter(function (device) {
    return device.integration === "alexa";
  });
  var hasAlexaDevices = alexaDevices.length > 0;
  return (
    <GlassmorphicCard_1.default className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Connected Devices</h2>
        <react_router_dom_1.Link
          to="/devices"
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
        >
          View All
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </react_router_dom_1.Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button
            className="mt-2 text-blue-400 hover:text-blue-300"
            onClick={function () {
              return window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No devices connected yet</p>
          <react_router_dom_1.Link
            to="/connect/alexa"
            className="glass-button px-4 py-2 rounded-lg text-white inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
            Connect Device
          </react_router_dom_1.Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {alexaDevices.slice(0, 2).map(function (device) {
              return (
                <AlexaDeviceCard_1.default
                  key={device.id}
                  id={device.id}
                  name={device.name}
                  type={device.type}
                  status={device.status}
                />
              );
            })}
          </div>

          {!hasAlexaDevices && (
            <framer_motion_1.motion.div
              className="glass-card p-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8h-6V8h6v2z" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h4 className="text-white font-medium">Connect Alexa</h4>
                  <p className="text-gray-400 text-sm">
                    Link your Amazon account to control Alexa devices
                  </p>
                </div>
                <react_router_dom_1.Link
                  to="/connect/alexa"
                  className="glass-button px-3 py-1 rounded-lg text-white text-sm"
                >
                  Connect
                </react_router_dom_1.Link>
              </div>
            </framer_motion_1.motion.div>
          )}

          <div className="text-center">
            <react_router_dom_1.Link
              to="/devices"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center"
            >
              View All Devices
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </react_router_dom_1.Link>
          </div>
        </>
      )}
    </GlassmorphicCard_1.default>
  );
};
exports.default = ConnectedDevicesPanel;

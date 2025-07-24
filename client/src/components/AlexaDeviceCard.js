"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var AlexaDeviceCard = function (_a) {
  var id = _a.id,
    name = _a.name,
    type = _a.type,
    status = _a.status,
    onCommand = _a.onCommand;
  return (
    <GlassmorphicCard_1.default className="p-4 h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8h-6V8h6v2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">{name}</h3>
            <div className="flex items-center">
              <span
                className={"inline-block w-2 h-2 rounded-full mr-2 ".concat(
                  status === "online" ? "bg-green-500" : "bg-red-500",
                )}
              ></span>
              <span className="text-gray-300 text-sm">
                {status === "online" ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-grow">
          <p className="text-gray-300 text-sm mb-4">
            {type === "speaker" ? "Echo Device" : "Alexa-enabled Device"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <framer_motion_1.motion.button
            className="glass-button rounded-lg py-2 px-3 text-sm text-white flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={function () {
              return onCommand && onCommand("play music on ".concat(name));
            }}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </framer_motion_1.motion.button>

          <framer_motion_1.motion.button
            className="glass-button rounded-lg py-2 px-3 text-sm text-white flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={function () {
              return onCommand && onCommand("stop on ".concat(name));
            }}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop
          </framer_motion_1.motion.button>
        </div>
      </div>
    </GlassmorphicCard_1.default>
  );
};
exports.default = AlexaDeviceCard;

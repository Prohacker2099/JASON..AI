import React from "react";
import { motion } from "framer-motion";

const DeviceCard = ({ device, onToggle }) => {
  const getDeviceIcon = () => {
    switch (device.type) {
      case "light":
        return (
          <svg
            className="w-6 h-6 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        );
      case "thermostat":
        return (
          <svg
            className="w-6 h-6 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V7a1 1 0 011-1z" />
          </svg>
        );
      case "camera":
        return (
          <svg
            className="w-6 h-6 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case "speaker":
        return (
          <svg
            className="w-6 h-6 text-purple-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <motion.div
      className={`backdrop-blur-md ${device.state.power ? "bg-gray-800/50 border-blue-500/30" : "bg-gray-900/30 border-gray-700/30"} border rounded-xl p-6 h-full`}
      whileHover={{
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <motion.div
            className={`w-10 h-10 rounded-full ${device.state.power ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gray-700"} flex items-center justify-center mr-3`}
            animate={{
              scale: device.state.power ? [1, 1.1, 1] : 1,
              rotate: device.state.power ? [0, 5, -5, 0] : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            {getDeviceIcon()}
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-white">{device.name}</h2>
            <p className="text-gray-400 text-sm">{device.status}</p>
          </div>
        </div>
        <motion.div
          className={`w-12 h-6 rounded-full flex items-center ${device.state.power ? "bg-blue-600" : "bg-gray-700"} cursor-pointer`}
          onClick={() => onToggle(device.id)}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-md"
            animate={{ x: device.state.power ? 26 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.div>
      </div>

      {device.type === "light" && device.state.power && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-300 text-sm">Brightness</span>
            <span className="text-blue-400 text-sm">
              {device.state.brightness}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <motion.div
              className="bg-blue-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${device.state.brightness}%` }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
        </div>
      )}

      {device.type === "thermostat" && device.state.power && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-gray-300 text-sm">Temperature</span>
          <div className="flex items-center">
            <motion.button
              className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
            <span className="mx-3 text-white font-medium">
              {device.state.temperature}°F
            </span>
            <motion.button
              className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      )}

      {device.type === "camera" && device.state.power && (
        <div className="mt-4">
          <motion.button
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            View Camera
          </motion.button>
        </div>
      )}

      {device.type === "speaker" && device.state.power && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-300 text-sm">Volume</span>
            <span className="text-purple-400 text-sm">
              {device.state.volume}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <motion.div
              className="bg-purple-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${device.state.volume}%` }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DeviceCard;

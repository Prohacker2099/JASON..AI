import React from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Shield,
  ShieldAlert,
  Bell,
} from "lucide-react";

const JasonInsightsCard = ({
  userName,
  temperature,
  temperatureUnit,
  weatherCondition,
  securityStatus,
  lightsOn,
  totalLights,
  timeOfDay,
  notifications,
}) => {
  // Get greeting based on time of day
  const getGreeting = () => {
    switch (timeOfDay) {
      case "morning":
        return "Good morning";
      case "afternoon":
        return "Good afternoon";
      case "evening":
        return "Good evening";
      case "night":
        return "Good night";
      default:
        return "Hello";
    }
  };

  // Get weather icon based on condition and time
  const getWeatherIcon = () => {
    const isDay = timeOfDay === "morning" || timeOfDay === "afternoon";

    if (weatherCondition === "clear") {
      return isDay ? (
        <Sun className="h-6 w-6 text-yellow-400" />
      ) : (
        <Moon className="h-6 w-6 text-blue-200" />
      );
    } else {
      return isDay ? (
        <CloudSun className="h-6 w-6 text-gray-400" />
      ) : (
        <CloudMoon className="h-6 w-6 text-gray-400" />
      );
    }
  };

  // Get security icon based on status
  const getSecurityIcon = () => {
    switch (securityStatus) {
      case "armed":
        return <Shield className="h-6 w-6 text-green-400" />;
      case "disarmed":
        return <Shield className="h-6 w-6 text-gray-400" />;
      case "alert":
        return <ShieldAlert className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <motion.div
      className="mb-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass-card p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {getGreeting()}, {userName}
            </h2>
            <p className="text-gray-400">Here's your home status</p>
          </div>
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white font-bold">J</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Weather */}
          <div className="bg-surface/50 rounded-lg p-3 flex flex-col items-center">
            {getWeatherIcon()}
            <span className="text-lg font-semibold mt-1">
              {temperature}°{temperatureUnit}
            </span>
            <span className="text-xs text-gray-400">Indoor</span>
          </div>

          {/* Security */}
          <div className="bg-surface/50 rounded-lg p-3 flex flex-col items-center">
            {getSecurityIcon()}
            <span className="text-lg font-semibold mt-1">
              {securityStatus === "armed"
                ? "Armed"
                : securityStatus === "alert"
                  ? "Alert"
                  : "Disarmed"}
            </span>
            <span className="text-xs text-gray-400">Security</span>
          </div>

          {/* Lights */}
          <div className="bg-surface/50 rounded-lg p-3 flex flex-col items-center">
            <div className="relative">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 21H15M12 3V4M18.364 5.636L17.657 6.343M21 12H20M4 12H3M6.343 6.343L5.636 5.636M12 18C8.686 18 6 15.314 6 12C6 8.686 8.686 6 12 6C15.314 6 18 8.686 18 12C18 15.314 15.314 18 12 18Z"
                  stroke={lightsOn > 0 ? "#F59E0B" : "#6B7280"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold mt-1">
              {lightsOn}/{totalLights}
            </span>
            <span className="text-xs text-gray-400">Lights On</span>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Bell className="h-4 w-4 mr-2 text-jason-amber" />
              <h3 className="text-sm font-medium">Recent Notifications</h3>
            </div>

            <div className="space-y-2">
              {notifications.slice(0, 2).map((notification) => (
                <motion.div
                  key={notification.id}
                  className="bg-surface/30 rounded-lg p-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between">
                    <p className="text-sm">{notification.message}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.time}
                  </p>
                </motion.div>
              ))}

              {notifications.length > 2 && (
                <div className="text-center">
                  <button className="text-xs text-jason-electric">
                    View all {notifications.length} notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default JasonInsightsCard;

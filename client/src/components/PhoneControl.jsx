import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Bell,
  Settings,
  Play,
  RefreshCw,
  Wifi,
  Bluetooth,
  Sun,
  Volume2,
  RotateCw,
  Plane,
  Camera,
  Info,
} from "lucide-react";
import phoneService from "../services/phoneService";

const PhoneControl = () => {
  const [phones, setPhones] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [phoneDetails, setPhoneDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [notification, setNotification] = useState({
    title: "JASON Notification",
    message: "This is a test notification",
    priority: "normal",
    sound: true,
    vibrate: true,
  });
  const [settings, setSettings] = useState({
    wifi: true,
    bluetooth: true,
    brightness: 50,
    volume: 50,
    rotation: true,
    airplane: false,
  });
  const [appId, setAppId] = useState("");

  // Fetch phones on component mount
  useEffect(() => {
    fetchPhones();
  }, []);

  // Fetch phone details when a phone is selected
  useEffect(() => {
    if (selectedPhone) {
      fetchPhoneDetails(selectedPhone.id);
    }
  }, [selectedPhone]);

  // Fetch phones
  const fetchPhones = async () => {
    setIsLoading(true);
    try {
      const devices = await phoneService.getPhones();
      setPhones(devices);
      if (devices.length > 0 && !selectedPhone) {
        setSelectedPhone(devices[0]);
      }
    } catch (error) {
      console.error("Error fetching phones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh phones
  const refreshPhones = async () => {
    setIsRefreshing(true);
    await fetchPhones();
    setIsRefreshing(false);
  };

  // Fetch phone details
  const fetchPhoneDetails = async (id) => {
    setIsLoading(true);
    try {
      const details = await phoneService.getPhoneDetails(id);
      setPhoneDetails(details);
    } catch (error) {
      console.error("Error fetching phone details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!selectedPhone) return;

    try {
      const result = await phoneService.sendNotification(
        selectedPhone.id,
        notification,
      );
      if (result.success) {
        // Show success message
        alert("Notification sent successfully");
      } else {
        // Show error message
        alert(`Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Control settings
  const handleControlSetting = async (setting, value) => {
    if (!selectedPhone) return;

    try {
      const result = await phoneService.controlSettings(selectedPhone.id, {
        setting,
        value,
      });
      if (result.success) {
        // Update local state
        setSettings((prev) => ({ ...prev, [setting]: value }));
        // Show success message
        alert(`${setting} set to ${value}`);
      } else {
        // Show error message
        alert(`Failed to control ${setting}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error controlling ${setting}:`, error);
      alert(`Error: ${error.message}`);
    }
  };

  // Launch app
  const handleLaunchApp = async () => {
    if (!selectedPhone || !appId) return;

    try {
      const result = await phoneService.launchApp(selectedPhone.id, { appId });
      if (result.success) {
        // Show success message
        alert(`App ${appId} launched successfully`);
      } else {
        // Show error message
        alert(`Failed to launch app: ${result.error}`);
      }
    } catch (error) {
      console.error("Error launching app:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Take screenshot
  const handleTakeScreenshot = async () => {
    if (!selectedPhone) return;

    try {
      const result = await phoneService.takeScreenshot(selectedPhone.id);
      if (result.success) {
        setScreenshot(`data:image/png;base64,${result.screenshot}`);
      } else {
        // Show error message
        alert(`Failed to take screenshot: ${result.error}`);
      }
    } catch (error) {
      console.error("Error taking screenshot:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle notification input change
  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotification((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle settings input change
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue =
      type === "checkbox"
        ? checked
        : type === "range"
          ? parseInt(value)
          : value;

    setSettings((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Render loading state
  if (isLoading && !phones.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-t-jason-electric border-gray-300 rounded-full mb-4"
        />
        <p className="text-gray-400">Scanning for phones...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Smartphone className="h-5 w-5 mr-2 text-jason-electric" />
          Phone Control
        </h2>
        <motion.button
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
          whileTap={{ scale: 0.95 }}
          onClick={refreshPhones}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </motion.button>
      </div>

      {phones.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Phones Found</h3>
          <p className="text-gray-400 mb-4">
            Connect your phone via USB, Bluetooth, or network to control it.
          </p>
          <button className="btn" onClick={refreshPhones}>
            Scan for Phones
          </button>
        </div>
      ) : (
        <div>
          {/* Phone Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Phone
            </label>
            <div className="flex flex-wrap gap-3">
              {phones.map((phone) => (
                <motion.button
                  key={phone.id}
                  className={`flex items-center p-3 rounded-lg border ${
                    selectedPhone?.id === phone.id
                      ? "border-jason-electric bg-jason-electric/10"
                      : "border-gray-700 bg-gray-800/50"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPhone(phone)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{phone.name}</h3>
                    <p className="text-xs text-gray-400">
                      {phone.manufacturer} • {phone.platform}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {selectedPhone && (
            <div>
              {/* Tabs */}
              <div className="border-b border-gray-700 mb-6">
                <div className="flex space-x-4">
                  <button
                    className={`py-2 px-1 border-b-2 ${
                      activeTab === "info"
                        ? "border-jason-electric text-jason-electric"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setActiveTab("info")}
                  >
                    <Info className="h-4 w-4 inline mr-1" />
                    Info
                  </button>
                  <button
                    className={`py-2 px-1 border-b-2 ${
                      activeTab === "notifications"
                        ? "border-jason-electric text-jason-electric"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="h-4 w-4 inline mr-1" />
                    Notifications
                  </button>
                  <button
                    className={`py-2 px-1 border-b-2 ${
                      activeTab === "settings"
                        ? "border-jason-electric text-jason-electric"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-4 w-4 inline mr-1" />
                    Settings
                  </button>
                  <button
                    className={`py-2 px-1 border-b-2 ${
                      activeTab === "apps"
                        ? "border-jason-electric text-jason-electric"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setActiveTab("apps")}
                  >
                    <Play className="h-4 w-4 inline mr-1" />
                    Apps
                  </button>
                  <button
                    className={`py-2 px-1 border-b-2 ${
                      activeTab === "screenshot"
                        ? "border-jason-electric text-jason-electric"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setActiveTab("screenshot")}
                  >
                    <Camera className="h-4 w-4 inline mr-1" />
                    Screenshot
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div>
                {/* Info Tab */}
                {activeTab === "info" && (
                  <div>
                    {phoneDetails ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Device
                            </h4>
                            <p className="font-medium">{phoneDetails.name}</p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Manufacturer
                            </h4>
                            <p className="font-medium">
                              {phoneDetails.manufacturer}
                            </p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Platform
                            </h4>
                            <p className="font-medium">
                              {phoneDetails.platform}
                            </p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Connection
                            </h4>
                            <p className="font-medium">
                              {phoneDetails.connection}
                            </p>
                          </div>
                          {phoneDetails.batteryLevel !== undefined && (
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Battery
                              </h4>
                              <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    phoneDetails.batteryLevel > 50
                                      ? "bg-green-500"
                                      : phoneDetails.batteryLevel > 20
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${phoneDetails.batteryLevel}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-right text-xs mt-1">
                                {phoneDetails.batteryLevel}%
                              </p>
                            </div>
                          )}
                          {phoneDetails.androidVersion && (
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Android Version
                              </h4>
                              <p className="font-medium">
                                {phoneDetails.androidVersion}
                              </p>
                            </div>
                          )}
                          {phoneDetails.iosVersion && (
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                iOS Version
                              </h4>
                              <p className="font-medium">
                                {phoneDetails.iosVersion}
                              </p>
                            </div>
                          )}
                        </div>

                        {phoneDetails.installedApps && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium mb-2">
                              Installed Apps
                            </h4>
                            <div className="bg-gray-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                              <ul className="space-y-1">
                                {phoneDetails.installedApps.map(
                                  (app, index) => (
                                    <li key={index} className="text-sm">
                                      {typeof app === "string"
                                        ? app
                                        : `${app.name} (${app.id})`}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-8 h-8 border-2 border-t-jason-electric border-gray-300 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={notification.title}
                          onChange={handleNotificationChange}
                          className="w-full p-2 bg-gray-800/50 rounded-lg border border-gray-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={notification.message}
                          onChange={handleNotificationChange}
                          className="w-full p-2 bg-gray-800/50 rounded-lg border border-gray-700 h-24"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={notification.priority}
                          onChange={handleNotificationChange}
                          className="w-full p-2 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sound"
                            name="sound"
                            checked={notification.sound}
                            onChange={handleNotificationChange}
                            className="mr-2"
                          />
                          <label htmlFor="sound" className="text-sm">
                            Play Sound
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="vibrate"
                            name="vibrate"
                            checked={notification.vibrate}
                            onChange={handleNotificationChange}
                            className="mr-2"
                          />
                          <label htmlFor="vibrate" className="text-sm">
                            Vibrate
                          </label>
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn w-full"
                          onClick={handleSendNotification}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Send Notification
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Wifi className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Wi-Fi</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="wifi"
                          checked={settings.wifi}
                          onChange={handleSettingsChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jason-electric"></div>
                      </label>
                    </div>
                    <button
                      className="btn btn-outline w-full"
                      onClick={() =>
                        handleControlSetting("wifi", !settings.wifi)
                      }
                    >
                      {settings.wifi ? "Turn Off Wi-Fi" : "Turn On Wi-Fi"}
                    </button>

                    <div className="border-t border-gray-700 pt-4"></div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Bluetooth className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Bluetooth</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="bluetooth"
                          checked={settings.bluetooth}
                          onChange={handleSettingsChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jason-electric"></div>
                      </label>
                    </div>
                    <button
                      className="btn btn-outline w-full"
                      onClick={() =>
                        handleControlSetting("bluetooth", !settings.bluetooth)
                      }
                    >
                      {settings.bluetooth
                        ? "Turn Off Bluetooth"
                        : "Turn On Bluetooth"}
                    </button>

                    <div className="border-t border-gray-700 pt-4"></div>

                    <div>
                      <div className="flex items-center mb-2">
                        <Sun className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Brightness: {settings.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        name="brightness"
                        min="0"
                        max="100"
                        value={settings.brightness}
                        onChange={handleSettingsChange}
                        className="w-full"
                      />
                      <button
                        className="btn btn-outline w-full mt-2"
                        onClick={() =>
                          handleControlSetting(
                            "brightness",
                            settings.brightness,
                          )
                        }
                      >
                        Set Brightness
                      </button>
                    </div>

                    <div className="border-t border-gray-700 pt-4"></div>

                    <div>
                      <div className="flex items-center mb-2">
                        <Volume2 className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Volume: {settings.volume}%</span>
                      </div>
                      <input
                        type="range"
                        name="volume"
                        min="0"
                        max="100"
                        value={settings.volume}
                        onChange={handleSettingsChange}
                        className="w-full"
                      />
                      <button
                        className="btn btn-outline w-full mt-2"
                        onClick={() =>
                          handleControlSetting("volume", settings.volume)
                        }
                      >
                        Set Volume
                      </button>
                    </div>

                    <div className="border-t border-gray-700 pt-4"></div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <RotateCw className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Auto Rotation</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="rotation"
                          checked={settings.rotation}
                          onChange={handleSettingsChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jason-electric"></div>
                      </label>
                    </div>
                    <button
                      className="btn btn-outline w-full"
                      onClick={() =>
                        handleControlSetting("rotation", !settings.rotation)
                      }
                    >
                      {settings.rotation
                        ? "Disable Auto Rotation"
                        : "Enable Auto Rotation"}
                    </button>

                    <div className="border-t border-gray-700 pt-4"></div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Plane className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Airplane Mode</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="airplane"
                          checked={settings.airplane}
                          onChange={handleSettingsChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jason-electric"></div>
                      </label>
                    </div>
                    <button
                      className="btn btn-outline w-full"
                      onClick={() =>
                        handleControlSetting("airplane", !settings.airplane)
                      }
                    >
                      {settings.airplane
                        ? "Turn Off Airplane Mode"
                        : "Turn On Airplane Mode"}
                    </button>
                  </div>
                )}

                {/* Apps Tab */}
                {activeTab === "apps" && (
                  <div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          App ID / Package Name
                        </label>
                        <input
                          type="text"
                          value={appId}
                          onChange={(e) => setAppId(e.target.value)}
                          placeholder="com.example.app"
                          className="w-full p-2 bg-gray-800/50 rounded-lg border border-gray-700"
                        />
                      </div>
                      <button
                        className="btn w-full"
                        onClick={handleLaunchApp}
                        disabled={!appId}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Launch App
                      </button>

                      {phoneDetails?.installedApps && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">
                            Installed Apps
                          </h4>
                          <div className="bg-gray-800/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                            <ul className="space-y-1">
                              {phoneDetails.installedApps.map((app, index) => {
                                const appIdValue =
                                  typeof app === "string" ? app : app.id;
                                const appName =
                                  typeof app === "string" ? app : app.name;

                                return (
                                  <li
                                    key={index}
                                    className="flex justify-between items-center py-1"
                                  >
                                    <span className="text-sm">{appName}</span>
                                    <button
                                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                                      onClick={() => setAppId(appIdValue)}
                                    >
                                      Select
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Screenshot Tab */}
                {activeTab === "screenshot" && (
                  <div>
                    <div className="flex justify-center mb-4">
                      <button className="btn" onClick={handleTakeScreenshot}>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Screenshot
                      </button>
                    </div>

                    {screenshot ? (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={screenshot}
                          alt="Phone Screenshot"
                          className="max-w-full max-h-96 border border-gray-700 rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 bg-gray-800/50 rounded-lg border border-gray-700">
                        <Camera className="h-12 w-12 text-gray-500 mb-4" />
                        <p className="text-gray-400">No screenshot available</p>
                        <p className="text-xs text-gray-500">
                          Click the button above to take a screenshot
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneControl;

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import JasonHomeHeader from "../components/JasonHomeHeader";
import JasonInsightsCard from "../components/JasonInsightsCard";
import QuickActionsCarousel from "../components/QuickActionsCarousel";
import RoomsGrid from "../components/RoomsGrid";
import JasonVoiceActivation from "../components/JasonVoiceActivation";
import BottomNavigation from "../components/BottomNavigation";

const JasonHomeDashboard = () => {
  const [userName, setUserName] = useState("John");
  const [timeOfDay, setTimeOfDay] = useState("evening");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "package",
      message: "Package delivered to your front door",
      time: "10 minutes ago",
    },
    {
      id: "2",
      type: "security",
      message: "Front door was left unlocked",
      time: "1 hour ago",
    },
    {
      id: "3",
      type: "energy",
      message: "Energy usage is 15% lower than last week",
      time: "3 hours ago",
    },
  ]);

  // Set time of day based on current time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay("morning");
    } else if (hour >= 12 && hour < 17) {
      setTimeOfDay("afternoon");
    } else if (hour >= 17 && hour < 22) {
      setTimeOfDay("evening");
    } else {
      setTimeOfDay("night");
    }
  }, []);

  // Handle voice command
  const handleVoiceCommand = (command) => {
    console.log("Voice command received:", command);
    // Process command here
  };

  // Handle room click
  const handleRoomClick = (roomId) => {
    console.log("Room clicked:", roomId);
    // Navigate to room detail page
  };

  // Handle AI button click
  const handleAIClick = () => {
    setShowVoiceModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      {/* Header */}
      <JasonHomeHeader
        homeName="My Home"
        onMicClick={() => setShowVoiceModal(true)}
      />

      <div className="container mx-auto px-4 pt-4 pb-24">
        {/* JASON Insights Card */}
        <JasonInsightsCard
          userName={userName}
          temperature={22}
          temperatureUnit="C"
          weatherCondition="clear"
          securityStatus="armed"
          lightsOn={2}
          totalLights={8}
          timeOfDay={timeOfDay}
          notifications={notifications}
        />

        {/* Quick Actions */}
        <QuickActionsCarousel />

        {/* Rooms Grid */}
        <RoomsGrid onRoomClick={handleRoomClick} />

        {/* Recently Active Devices */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Recently Active</h2>

          <div className="space-y-3">
            {[
              { name: "Living Room Lights", time: "5 minutes ago", icon: "💡" },
              {
                name: "Kitchen Thermostat",
                time: "20 minutes ago",
                icon: "🌡️",
              },
              { name: "Front Door Lock", time: "1 hour ago", icon: "🔒" },
            ].map((device, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 bg-surface rounded-lg border border-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 3 }}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                    <span className="text-xl">{device.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-xs text-gray-400">{device.time}</p>
                  </div>
                </div>
                <div className="text-jason-electric">
                  <span className="text-xs">Details</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Activation */}
      <JasonVoiceActivation onCommand={handleVoiceCommand} />

      {/* Bottom Navigation */}
      <BottomNavigation onAIClick={handleAIClick} />
    </div>
  );
};

export default JasonHomeDashboard;

import React from "react";
import { motion } from "framer-motion";
import { Home, Grid, Zap, User, Sparkles } from "lucide-react";

const BottomNavigation = ({ onAIClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-lg border-t border-gray-800 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-3">
          <NavItem
            icon={<Home className="h-6 w-6" />}
            label="Home"
            isActive={true}
          />
          <NavItem icon={<Grid className="h-6 w-6" />} label="Rooms" />
          <AIButton onClick={onAIClick} />
          <NavItem icon={<Zap className="h-6 w-6" />} label="Scenes" />
          <NavItem icon={<User className="h-6 w-6" />} label="Profile" />
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, isActive = false, onClick }) => {
  return (
    <motion.button
      className="flex flex-col items-center"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      <div
        className={`p-1 ${isActive ? "text-jason-electric" : "text-gray-400"}`}
      >
        {icon}
      </div>
      <span
        className={`text-xs mt-1 ${isActive ? "text-white" : "text-gray-400"}`}
      >
        {label}
      </span>
    </motion.button>
  );
};

const AIButton = ({ onClick }) => {
  return (
    <motion.button
      className="relative -top-5"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center shadow-lg shadow-blue-500/30">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
    </motion.button>
  );
};

export default BottomNavigation;

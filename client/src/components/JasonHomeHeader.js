import React from "react";
import { motion } from "framer-motion";
import { Mic, Bell, Settings } from "lucide-react";

const JasonHomeHeader = ({ homeName, onMicClick }) => {
  return (
    <header className="bg-surface/50 backdrop-blur-lg sticky top-0 z-10 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center mr-3"
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-white font-bold">J</span>
          </motion.div>
          <h1 className="text-lg font-semibold">{homeName}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            className="w-9 h-9 rounded-full bg-gray-800/50 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            onClick={onMicClick}
          >
            <Mic className="h-5 w-5 text-jason-electric" />
          </motion.button>

          <motion.button
            className="w-9 h-9 rounded-full bg-gray-800/50 flex items-center justify-center relative"
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>

          <motion.button
            className="w-9 h-9 rounded-full bg-gray-800/50 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default JasonHomeHeader;

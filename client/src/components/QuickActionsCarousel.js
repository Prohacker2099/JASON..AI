import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Lock, Tv, Coffee, Fan } from "lucide-react";

const QuickActionsCarousel = () => {
  const actions = [
    {
      name: "Night Mode",
      icon: <Moon className="h-5 w-5" />,
      color: "bg-indigo-500",
    },
    {
      name: "Morning",
      icon: <Sun className="h-5 w-5" />,
      color: "bg-amber-500",
    },
    {
      name: "Lock All",
      icon: <Lock className="h-5 w-5" />,
      color: "bg-red-500",
    },
    { name: "TV Time", icon: <Tv className="h-5 w-5" />, color: "bg-blue-500" },
    {
      name: "Coffee",
      icon: <Coffee className="h-5 w-5" />,
      color: "bg-amber-700",
    },
    { name: "Fan", icon: <Fan className="h-5 w-5" />, color: "bg-cyan-500" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>

      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex space-x-4">
          {actions.map((action, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-full ${action.color} flex items-center justify-center mb-2 shadow-lg`}
                >
                  {action.icon}
                </div>
                <span className="text-xs">{action.name}</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsCarousel;

import React from "react";
import { motion } from "framer-motion";

const RoomsGrid = ({ onRoomClick }) => {
  const rooms = [
    { id: "living-room", name: "Living Room", devices: 5, icon: "🛋️" },
    { id: "kitchen", name: "Kitchen", devices: 3, icon: "🍳" },
    { id: "bedroom", name: "Bedroom", devices: 4, icon: "🛏️" },
    { id: "bathroom", name: "Bathroom", devices: 2, icon: "🚿" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Rooms</h2>

      <div className="grid grid-cols-2 gap-4">
        {rooms.map((room, index) => (
          <motion.div
            key={room.id}
            className="bg-surface/50 rounded-lg p-4 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRoomClick(room.id)}
          >
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                <span className="text-xl">{room.icon}</span>
              </div>
              <div>
                <h3 className="font-medium">{room.name}</h3>
                <p className="text-xs text-gray-400">{room.devices} devices</p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(3, room.devices) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-jason-electric"
                    ></div>
                  ),
                )}
                {room.devices > 3 && (
                  <div className="text-xs text-gray-400">
                    +{room.devices - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-jason-electric">View</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RoomsGrid;

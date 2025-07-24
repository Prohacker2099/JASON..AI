import React from "react";
import { motion } from "framer-motion";

const GlassmorphicCard = ({ children, className = "", onClick, ...props }) => {
  return (
    <motion.div
      className={`backdrop-blur-md bg-gray-800/30 border border-gray-700/30 rounded-xl ${className}`}
      whileHover={onClick ? { y: -5, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphicCard;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard = function (_a) {
  var children = _a.children,
    _b = _a.className,
    className = _b === void 0 ? "" : _b,
    _c = _a.hoverEffect,
    hoverEffect = _c === void 0 ? true : _c,
    _d = _a.glowColor,
    glowColor = _d === void 0 ? "rgba(56, 189, 248, 0.3)" : _d;
  return (
    <framer_motion_1.motion.div
      className={"\n        relative overflow-hidden\n        rounded-2xl\n        bg-gradient-to-br from-white/10 to-white/5\n        backdrop-blur-xl\n        border border-white/10\n        shadow-lg\n        "
        .concat(hoverEffect ? "group" : "", "\n        ")
        .concat(className, "\n      ")}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hoverEffect ? { scale: 1.02 } : undefined}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl" />

      {/* Holographic effect */}
      <div
        className={"\n          absolute inset-0 \n          bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 \n          rounded-2xl opacity-0 \n          ".concat(
          hoverEffect ? "group-hover:opacity-100" : "",
          " \n          transition-opacity duration-300\n        ",
        )}
      />

      {/* Glow effect */}
      <div
        className={"\n          absolute -inset-px \n          bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 \n          rounded-2xl opacity-0 blur-xl \n          ".concat(
          hoverEffect ? "group-hover:opacity-70" : "",
          " \n          transition-opacity duration-300\n        ",
        )}
        style={{ background: glowColor }}
      />

      {/* Shimmer effect */}
      <framer_motion_1.motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 400, opacity: 0.5 }}
        transition={{ repeat: Infinity, duration: 3, repeatType: "loop" }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </framer_motion_1.motion.div>
  );
};
exports.default = GlassmorphicCard;

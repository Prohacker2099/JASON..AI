"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var outline_1 = require("@heroicons/react/24/outline");
var switch_js_1 = require("./ui/switch.js");
var DeviceCard = function (_a) {
  var device = _a.device,
    onClick = _a.onClick,
    onControl = _a.onControl,
    _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var _c = (0, react_1.useState)(false),
    isExpanded = _c[0],
    setIsExpanded = _c[1];
  var _d = (0, react_1.useState)(false),
    isHovered = _d[0],
    setIsHovered = _d[1];
  var handleToggle = function (checked) {
    if (onControl) {
      onControl({ isActive: checked });
    }
  };
  // Card animation variants
  var cardVariants = {
    initial: {
      scale: 0.96,
      opacity: 0,
      y: 20,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };
  // Status indicator animation
  var statusVariants = {
    offline: { scale: 1, backgroundColor: "#EF4444" },
    online: {
      scale: [1, 1.2, 1],
      backgroundColor: "#10B981",
      transition: { repeat: Infinity, repeatDelay: 5 },
    },
    standby: {
      scale: 1,
      backgroundColor: "#F59E0B",
    },
  };
  return (
    <framer_motion_1.motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={cardVariants}
      onClick={onClick}
      onHoverStart={function () {
        return setIsHovered(true);
      }}
      onHoverEnd={function () {
        return setIsHovered(false);
      }}
      className={"\n        relative overflow-hidden rounded-xl\n        bg-gradient-to-br from-white/10 to-white/5\n        border border-white/10\n        backdrop-blur-md\n        p-6 shadow-xl\n        ".concat(
        className,
        "\n      ",
      )}
    >
      {/* Status Indicator */}
      <framer_motion_1.motion.div
        variants={statusVariants}
        animate={device.status.toLowerCase()}
        className="absolute top-4 right-4 h-2 w-2 rounded-full"
      />

      {/* Device Icon & Type */}
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-lg bg-white/10 mr-3">
          <img src={device.icon} alt={device.type} className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{device.name}</h3>
          <p className="text-sm text-white/60">{device.type}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <switch_js_1.Switch
            checked={device.isActive}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-blue-500"
          />
          <span className="text-sm text-white/80">
            {device.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <framer_motion_1.motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={function () {
            return setIsExpanded(!isExpanded);
          }}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <outline_1.ChevronDownIcon
            className={"w-5 h-5 text-white transition-transform duration-300 ".concat(
              isExpanded ? "rotate-180" : "",
            )}
          />
        </framer_motion_1.motion.button>
      </div>

      {/* Expanded Details */}
      <framer_motion_1.AnimatePresence>
        {isExpanded && (
          <framer_motion_1.motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="space-y-2 text-sm text-white/60">
              {device.details.ip && <p>IP: {device.details.ip}</p>}
              {device.details.location && (
                <p>Location: {device.details.location}</p>
              )}
              {device.details.lastActive && (
                <p>Last Active: {device.details.lastActive}</p>
              )}
              {device.metrics && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {device.metrics.map(function (metric, index) {
                    return (
                      <div
                        key={index}
                        className="p-2 rounded-lg bg-white/5"
                        style={{
                          color: metric.color || "inherit",
                        }}
                      >
                        <p className="text-xs opacity-70">{metric.name}</p>
                        <p className="font-medium">{metric.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Background Gradient Animation */}
      <framer_motion_1.motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isHovered
            ? "radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.1) 0%, transparent 100%)"
            : "none",
        }}
        transition={{ duration: 0.3 }}
        style={{
          "--x": "50%",
          "--y": "50%",
        }}
        onMouseMove={function (e) {
          var rect = e.currentTarget.getBoundingClientRect();
          var x = ((e.clientX - rect.left) / rect.width) * 100;
          var y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty("--x", "".concat(x, "%"));
          e.currentTarget.style.setProperty("--y", "".concat(y, "%"));
        }}
      />
    </framer_motion_1.motion.div>
  );
};
exports.default = DeviceCard;

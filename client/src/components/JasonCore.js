"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var JasonCore = function (_a) {
  var networkStatus = _a.networkStatus,
    _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var canvasRef = (0, react_1.useRef)(null);
  // Calculate activity level from 0-1 based on network status
  var activityLevel = Math.min(
    1,
    (networkStatus.activeDevices / Math.max(networkStatus.deviceCount, 1)) *
      (networkStatus.dataUsage / 100),
  );
  // Determine core color based on security status
  var getCoreColor = function () {
    switch (networkStatus.securityStatus) {
      case "secure":
        return ["rgba(16, 185, 129, 0.8)", "rgba(59, 130, 246, 0.8)"];
      case "warning":
        return ["rgba(245, 158, 11, 0.8)", "rgba(249, 115, 22, 0.8)"];
      case "critical":
        return ["rgba(239, 68, 68, 0.8)", "rgba(220, 38, 38, 0.8)"];
      default:
        return ["rgba(59, 130, 246, 0.8)", "rgba(139, 92, 246, 0.8)"];
    }
  };
  // Core animation
  (0, react_1.useEffect)(
    function () {
      var canvas = canvasRef.current;
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Set canvas dimensions
      var resizeCanvas = function () {
        var size = Math.min(300, window.innerWidth * 0.8);
        canvas.width = size;
        canvas.height = size;
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      // Animation variables
      var time = 0;
      var particles = [];
      var particleCount = 100;
      var colors = getCoreColor();
      // Create particles
      for (var i = 0; i < particleCount; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
          },
          life: Math.random() * 100 + 50,
        });
      }
      // Animation function
      var animate = function () {
        time += 0.01;
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw core
        var gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2,
        );
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
        gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // Draw particles
        particles.forEach(function (particle, index) {
          // Update particle position
          particle.x += particle.velocity.x * activityLevel;
          particle.y += particle.velocity.y * activityLevel;
          particle.life -= 0.5;
          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.life / 100;
          ctx.fill();
          // Reset particle if it's dead or out of bounds
          if (
            particle.life <= 0 ||
            particle.x < 0 ||
            particle.x > canvas.width ||
            particle.y < 0 ||
            particle.y > canvas.height
          ) {
            particles[index] = {
              x: canvas.width / 2,
              y: canvas.height / 2,
              radius: Math.random() * 2 + 1,
              color: colors[Math.floor(Math.random() * colors.length)],
              velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
              },
              life: Math.random() * 100 + 50,
            };
          }
        });
        // Draw pulsating core
        var coreSize = 50 + Math.sin(time) * 5;
        var coreGradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          coreSize,
        );
        coreGradient.addColorStop(0, colors[0]);
        coreGradient.addColorStop(1, colors[1]);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.globalAlpha = 1;
        ctx.fill();
        requestAnimationFrame(animate);
      };
      animate();
      return function () {
        window.removeEventListener("resize", resizeCanvas);
      };
    },
    [activityLevel, networkStatus.securityStatus],
  );
  return (
    <div className={"relative ".concat(className)}>
      <canvas ref={canvasRef} className="z-10" />

      {/* Aura Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
        <framer_motion_1.motion.div
          className="aura-ring aura-ring-1"
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <framer_motion_1.motion.div
          className="aura-ring aura-ring-2"
          animate={{
            rotate: -360,
            scale: [1, 1.03, 1],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <framer_motion_1.motion.div
          className="aura-ring aura-ring-3"
          animate={{
            rotate: 360,
            scale: [1, 1.02, 1],
          }}
          transition={{
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>

      {/* Network Stats */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center z-20 w-full">
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white text-lg font-medium"
        >
          {networkStatus.deviceCount} Devices
        </framer_motion_1.motion.div>
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-blue-300 text-sm"
        >
          {networkStatus.activeDevices} Active
        </framer_motion_1.motion.div>
      </div>
    </div>
  );
};
exports.default = JasonCore;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var ParticleBackground = function (_a) {
  var _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var canvasRef = (0, react_1.useRef)(null);
  (0, react_1.useEffect)(function () {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Set canvas dimensions
    var resizeCanvas = function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    // Particle settings
    var particleCount = 100;
    var particles = [];
    // Create particles
    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        color: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#8b5cf6" : "#10b981",
        velocity: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
        },
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    // Animation function
    var animate = function () {
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = "rgba(5, 11, 20, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Update and draw particles
      particles.forEach(function (particle) {
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        // Draw connections between nearby particles
        particles.forEach(function (otherParticle) {
          var dx = particle.x - otherParticle.x;
          var dy = particle.y - otherParticle.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = 0.1 * (1 - distance / 100);
            ctx.stroke();
          }
        });
      });
      // Reset global alpha
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };
    animate();
    return function () {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className={"fixed top-0 left-0 w-full h-full -z-10 ".concat(className)}
    />
  );
};
exports.default = ParticleBackground;

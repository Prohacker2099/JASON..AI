"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var HolographicBackground = function (_a) {
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
    // Create holographic grid effect
    var time = 0;
    var gridSize = 30;
    var speed = 0.0005;
    var animate = function () {
      time += speed;
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw horizontal lines
      for (var y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        // Create wavy effect
        for (var x = 0; x < canvas.width; x += 5) {
          var wave = Math.sin(x * 0.01 + time) * 2;
          ctx.lineTo(x, y + wave);
        }
        // Set line style
        ctx.strokeStyle = "rgba(56, 189, 248, ".concat(
          0.1 - (y / canvas.height) * 0.05,
          ")",
        );
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Draw vertical lines
      for (var x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        // Create wavy effect
        for (var y = 0; y < canvas.height; y += 5) {
          var wave = Math.sin(y * 0.01 + time) * 2;
          ctx.lineTo(x + wave, y);
        }
        // Set line style
        ctx.strokeStyle = "rgba(168, 85, 247, ".concat(
          0.1 - (x / canvas.width) * 0.05,
          ")",
        );
        ctx.lineWidth = 1;
        ctx.stroke();
      }
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
      className={"fixed inset-0 pointer-events-none z-0 ".concat(className)}
    />
  );
};
exports.default = HolographicBackground;

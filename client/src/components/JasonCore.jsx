import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const JasonCore = ({ networkStatus, className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Set up animation
    let particles = [];
    const particleCount = 100;
    const maxSize = 5;
    const maxSpeed = 1;
    const connectionDistance = 100;
    const colors = ["#3B82F6", "#8B5CF6", "#EC4899"];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * maxSize + 1,
        speedX: (Math.random() - 0.5) * maxSpeed,
        speedY: (Math.random() - 0.5) * maxSpeed,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Bounce off edges
        if (particle.x < 0 || particle.x > width) {
          particle.speedX *= -1;
        }

        if (particle.y < 0 || particle.y > height) {
          particle.speedY *= -1;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particle.x;
          const dy = particles[j].y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / connectionDistance})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });

      // Draw center core
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        70,
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
      gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Pulse effect
      const time = Date.now() / 1000;
      const pulseSize = 40 + Math.sin(time * 2) * 5;

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Request next frame
      requestAnimationFrame(animate);
    };

    // Start animation
    const animationId = requestAnimationFrame(animate);

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full h-full rounded-lg"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-2"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          <span className="text-white font-bold text-2xl">J</span>
        </motion.div>

        <h3 className="text-white font-bold text-lg">JASON Core</h3>
        <p className="text-blue-300 text-sm mt-1">AI Assistant</p>

        <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="text-center">
            <div className="text-blue-400 text-sm">Devices</div>
            <div className="text-white font-medium">
              {networkStatus.activeDevices}/{networkStatus.deviceCount}
            </div>
          </div>

          <div className="text-center">
            <div className="text-blue-400 text-sm">Security</div>
            <div
              className={`font-medium ${
                networkStatus.securityStatus === "secure"
                  ? "text-green-400"
                  : networkStatus.securityStatus === "warning"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {networkStatus.securityStatus.charAt(0).toUpperCase() +
                networkStatus.securityStatus.slice(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JasonCore;

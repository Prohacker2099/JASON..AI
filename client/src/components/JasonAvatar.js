/**
 * JASON Avatar Component
 * An animated avatar representing JASON's AI presence
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const JasonAvatar = ({
  state = "idle",
  size = "md",
  pulseEffect = true,
  deviceActivity,
  className,
  onClick,
}) => {
  const [waveIntensity, setWaveIntensity] = useState(0);
  const [activityMessage, setActivityMessage] = useState("");

  // Animate wave intensity based on state
  useEffect(() => {
    if (
      state === "speaking" ||
      state === "listening" ||
      state === "controlling"
    ) {
      const interval = setInterval(() => {
        setWaveIntensity(Math.random());
      }, 100);
      return () => clearInterval(interval);
    }
    setWaveIntensity(0);
  }, [state]);

  // Update activity message when device activity changes
  useEffect(() => {
    if (deviceActivity) {
      setActivityMessage(`${deviceActivity.action} ${deviceActivity.name}`);
      setTimeout(() => setActivityMessage(""), 3000);
    }
  }, [deviceActivity]);

  const getContainerClasses = () => {
    let classes =
      "relative rounded-full transition-all duration-250 flex items-center justify-center cursor-pointer";

    // Size variants
    if (size === "sm") classes += " w-10 h-10";
    if (size === "md") classes += " w-14 h-14";
    if (size === "lg") classes += " w-20 h-20";

    // State-based colors and animations
    if (state !== "error")
      classes += " bg-gradient-to-br from-jason-sapphire to-jason-electric";
    if (state === "error")
      classes += " bg-gradient-to-br from-red-500 to-red-600";
    if (state === "thinking") classes += " jason-thinking";
    if (pulseEffect && state === "idle") classes += " animate-pulse";
    if (state === "controlling") classes += " animate-glow";

    // Interactive states
    if (onClick) {
      classes += " hover:shadow-lg";
      if (state !== "error") classes += " hover:shadow-jason-electric/30";
      if (state === "error") classes += " hover:shadow-red-500/30";
      classes += " hover:transform hover:scale-105";
    }

    if (className) classes += ` ${className}`;

    return classes;
  };

  const getLogoClasses = () => {
    let classes = "absolute transition-all duration-150";

    if (size === "sm") classes += " w-6 h-6";
    if (size === "md") classes += " w-8 h-8";
    if (size === "lg") classes += " w-12 h-12";
    if (state === "idle") classes += " opacity-90";
    if (state !== "idle") classes += " opacity-100 scale-105";

    return classes;
  };

  // Wave animation for speaking/listening/controlling states
  const renderWaves = () => {
    if (
      state !== "speaking" &&
      state !== "listening" &&
      state !== "controlling"
    )
      return null;

    return (
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`absolute inset-0 rounded-full border-2 ${
              state !== "controlling"
                ? "border-white/30"
                : "border-jason-electric/30"
            } animate-[wave_2s_ease-out_infinite]`}
            style={{
              animationDelay: `${i * 0.2}s`,
              transform: `scale(${1 + (i + 1) * 0.1 * waveIntensity})`,
            }}
          />
        ))}
      </div>
    );
  };

  // Render device control icon based on activity
  const renderActivityIcon = () => {
    if (!deviceActivity) return null;

    const icons = {
      light: (
        <svg
          className="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      thermostat: (
        <svg
          className="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      // Add more device icons as needed
    };

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="absolute -top-1 -right-1 bg-jason-electric rounded-full p-1"
      >
        {icons[deviceActivity.type]}
      </motion.div>
    );
  };

  // Render activity message
  const renderActivityMessage = () => {
    if (!activityMessage) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-white/80 whitespace-nowrap"
      >
        {activityMessage}
      </motion.div>
    );
  };

  return (
    <div className="relative">
      <div className={getContainerClasses()} onClick={onClick}>
        {/* Background pattern - simplified to avoid SVG reference */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-jason-sapphire/20 to-jason-electric/20" />
        </div>

        {/* Animation waves */}
        {renderWaves()}

        {/* JASON Logo */}
        <div className={getLogoClasses()}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>

        {/* Device activity icon */}
        {renderActivityIcon()}
      </div>

      {/* Activity message */}
      {renderActivityMessage()}
    </div>
  );
};

export default JasonAvatar;

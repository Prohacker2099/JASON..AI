import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const JasonHomeOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [homeName, setHomeName] = useState("");

  const steps = [
    {
      title: "Welcome to JASON",
      description: "Your intuitive smart home, powered by advanced AI",
      content: (
        <div className="flex flex-col items-center">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-white font-bold text-6xl">J</span>
          </motion.div>

          <motion.p
            className="text-center text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            JASON connects all your smart devices into one seamless experience,
            learning from your habits to create the perfect home environment.
          </motion.p>
        </div>
      ),
    },
    {
      title: "Personalize Your Experience",
      description: "Let's get to know you better",
      content: (
        <div className="w-full">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              What should we call you?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full p-3 bg-surface/50 rounded-lg border border-gray-700 text-white"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              What would you like to name your home?
            </label>
            <input
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              placeholder="e.g. My Home, Beach House, etc."
              className="w-full p-3 bg-surface/50 rounded-lg border border-gray-700 text-white"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Connect Your Devices",
      description: "JASON works with all your favorite smart home brands",
      content: (
        <div className="w-full">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              "Philips Hue",
              "Nest",
              "Ring",
              "Sonos",
              "Ecobee",
              "SmartThings",
            ].map((brand, index) => (
              <motion.div
                key={index}
                className="p-4 bg-surface/50 rounded-lg border border-gray-700 flex items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{brand}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm">
            You can connect your devices after setup or do it now
          </p>
        </div>
      ),
    },
    {
      title: "All Set!",
      description: "You're ready to experience the future of smart homes",
      content: (
        <div className="flex flex-col items-center">
          <motion.div
            className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Check className="h-12 w-12 text-white" />
          </motion.div>

          <motion.p
            className="text-center text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {name ? `Welcome, ${name}!` : "Welcome!"} Your smart home journey
            begins now. JASON is ready to make your life easier, more
            comfortable, and more connected.
          </motion.p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass-card p-6">
          {/* Progress indicator */}
          <div className="flex mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 mx-1 rounded-full ${index <= currentStep ? "bg-jason-electric" : "bg-gray-700"}`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="mb-8">
            <motion.h2
              className="text-2xl font-bold mb-2"
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].title}
            </motion.h2>

            <motion.p
              className="text-gray-400 mb-6"
              key={`desc-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {steps[currentStep].description}
            </motion.p>

            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex justify-end">
            <motion.button
              className="px-6 py-2 bg-jason-electric rounded-full text-white font-medium flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
            >
              <span>
                {currentStep < steps.length - 1 ? "Next" : "Get Started"}
              </span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JasonHomeOnboarding;

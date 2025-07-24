import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";

const JasonVoiceActivation = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setTranscript("Turn on the living room lights");
      setIsListening(false);

      // Process command
      setTimeout(() => {
        onCommand("Turn on the living room lights");
        setShowModal(false);
        setTranscript("");
      }, 1000);
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsListening(false);
    setTranscript("");
  };

  return (
    <>
      {/* Floating Voice Button */}
      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center shadow-lg shadow-blue-500/30 z-10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
      >
        <Mic className="h-6 w-6 text-white" />
      </motion.button>

      {/* Voice Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface w-full max-w-md rounded-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-800">
                <h3 className="text-lg font-semibold">JASON Voice</h3>
                <button onClick={closeModal}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center">
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center mb-6"
                  animate={
                    isListening
                      ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }
                      : {}
                  }
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="text-white text-4xl font-bold">J</span>
                </motion.div>

                <div className="text-center mb-6">
                  {isListening ? (
                    <>
                      <h4 className="text-lg font-medium mb-2">Listening...</h4>
                      <p className="text-gray-400">Say a command</p>
                    </>
                  ) : transcript ? (
                    <>
                      <h4 className="text-lg font-medium mb-2">I heard:</h4>
                      <p className="text-jason-electric">{transcript}</p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-medium mb-2">
                        How can I help?
                      </h4>
                      <p className="text-gray-400">Tap the button and speak</p>
                    </>
                  )}
                </div>

                <div className="flex space-x-4">
                  {!isListening ? (
                    <motion.button
                      className="px-6 py-2 bg-jason-electric rounded-full text-white font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startListening}
                    >
                      Start Listening
                    </motion.button>
                  ) : (
                    <motion.button
                      className="px-6 py-2 bg-red-500 rounded-full text-white font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopListening}
                    >
                      Stop Listening
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default JasonVoiceActivation;

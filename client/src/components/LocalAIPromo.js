import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const LocalAIPromo = () => {
  const goldShimmer = {
    initial: { backgroundPosition: "0% 50%" },
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        repeat: Infinity,
        duration: 3,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-yellow-900 opacity-80 z-0" />
      {/* Removed problematic background image */}

      <motion.div
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.7 }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-6 md:mb-0 md:mr-8 w-full md:w-1/2">
            <motion.h2
              className="text-2xl md:text-3xl font-bold mb-3"
              {...goldShimmer}
            >
              JASON Local AI Assistant
            </motion.h2>

            <motion.p
              className="text-gray-200 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Experience the power of AI without sending your data to the cloud.
              Our advanced local AI model runs entirely on your device.
            </motion.p>

            <motion.ul
              className="space-y-2 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {[
                "Complete privacy — your data never leaves your device",
                "No API tokens or subscription costs",
                "Works offline with no internet connection",
                "Instant responses without network latency",
                "Control your smart home with natural language",
              ].map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-start"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <span className="text-yellow-500 mr-2">✓</span>
                  <span>{feature}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Link
                to="/ai-chat"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-medium rounded-full shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40 transform transition duration-300 hover:scale-105"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Try JASON AI Now
              </Link>
            </motion.div>
          </div>

          <div className="w-full md:w-1/2 relative">
            <div className="relative rounded-lg overflow-hidden h-64 shadow-2xl">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />

              <div className="absolute inset-0 z-10">
                <div className="flex flex-col h-full p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-400">
                      JASON AI Terminal
                    </div>
                  </div>

                  <div className="flex-grow overflow-hidden terminal-animation">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                    >
                      <div className="text-green-500 mb-1">
                        $ initiating JASON AI
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                    >
                      <div className="text-white mb-1">
                        Loading language models...
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.8 }}
                    >
                      <div className="text-white mb-1">
                        Initializing neural networks...
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 2.1 }}
                    >
                      <div className="text-white mb-1">
                        Optimizing for local hardware...
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 2.4 }}
                    >
                      <div className="text-yellow-500 mb-1">
                        JASON AI loaded successfully
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 2.7 }}
                    >
                      <div className="text-white mb-1">
                        User > How can you help me?
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 3.0 }}
                      className="text-yellow-400"
                    >
                      <div className="typing-animation">
                        JASON > I can control your smart home, answer questions,
                        write code, analyze data, and much more - all locally on
                        your device with complete privacy.
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    className="h-1 bg-yellow-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, delay: 3.3 }}
                  />
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -bottom-3 -right-3 text-xs bg-yellow-900/50 border border-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-yellow-300"
              initial={{ opacity: 0, y: 20, rotate: -5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.5, delay: 3.6 }}
            >
              100% Private & Secure
            </motion.div>

            <motion.div
              className="absolute -top-3 -left-3 text-xs bg-yellow-900/50 border border-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-yellow-300"
              initial={{ opacity: 0, y: -20, rotate: 5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.5, delay: 3.8 }}
            >
              No API Calls
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .typing-animation {
          overflow: hidden;
          border-right: 2px solid rgba(255, 215, 0, 0.75);
          white-space: nowrap;
          margin: 0;
          animation:
            typing 3.5s steps(40, end),
            blink-caret 0.75s step-end infinite;
        }

        @keyframes typing {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes blink-caret {
          from,
          to {
            border-color: transparent;
          }
          50% {
            border-color: rgba(255, 215, 0, 0.75);
          }
        }

        .terminal-animation {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          padding: 8px;
          font-family: "Courier New", monospace;
          font-size: 0.9rem;
          line-height: 1.4;
        }
      `}</style>
    </motion.div>
  );
};

export default LocalAIPromo;

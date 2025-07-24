import React, { useState, useEffect } from "react";

const VoiceAssistant = ({ onClose, onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [error, setError] = useState(null);

  // Check if speech recognition is available
  const speechRecognitionAvailable =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startListening = () => {
    setIsListening(true);
    setPulseAnimation(true);
    setTranscript("");
    setResponse("");
    setError(null);

    if (speechRecognitionAvailable) {
      // Use real speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const command = event.results[0][0].transcript;
        setTranscript(command);
        setIsListening(false);
        setPulseAnimation(false);

        // Process command if handler provided
        if (onCommand) {
          onCommand(command)
            .then((response) => {
              setResponse(response);
            })
            .catch((error) => {
              setError("Sorry, I couldn't process your request.");
              console.error("Error processing command:", error);
            });
        } else {
          setResponse(
            "I can help you control your smart devices, check the weather, set reminders, and more.",
          );
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setPulseAnimation(false);
        setError("I couldn't hear you. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
        setPulseAnimation(false);
      };

      recognition.start();
    } else {
      // Fallback for browsers without speech recognition
      setTimeout(() => {
        const sampleCommands = [
          "Turn on the living room lights",
          "Scan for devices",
          "What devices did you find?",
          "Is the front door locked?",
        ];
        const command =
          sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
        setTranscript(command);
        setIsListening(false);
        setPulseAnimation(false);

        // Process command if handler provided
        if (onCommand) {
          onCommand(command)
            .then((response) => {
              setResponse(response);
            })
            .catch((error) => {
              setError("Sorry, I couldn't process your request.");
              console.error("Error processing command:", error);
            });
        } else {
          setResponse(
            "I can help you control your smart devices, check the weather, set reminders, and more.",
          );
        }
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-blue-500">
        <div className="p-4 bg-gradient-to-r from-blue-900 to-purple-900">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">
              JASON Voice Assistant
            </h3>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-800 min-h-[200px]">
          {transcript && (
            <div className="mb-4">
              <div className="text-sm text-gray-400">You said:</div>
              <div className="text-white">{transcript}</div>
            </div>
          )}

          {response && (
            <div className="mb-4">
              <div className="text-sm text-gray-400">JASON:</div>
              <div className="text-white">{response}</div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-500 rounded">
              <div className="text-red-400">{error}</div>
            </div>
          )}

          {!transcript && !response && !error && (
            <div className="text-center text-gray-400 my-8">
              Click the microphone to start speaking
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-900 flex justify-center">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening ? "bg-red-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <div className={`relative ${pulseAnimation ? "animate-ping" : ""}`}>
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                ></path>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;

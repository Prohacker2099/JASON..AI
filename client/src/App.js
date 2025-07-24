import React, { useState, useEffect } from "react";
import VoiceAssistant from "./components/VoiceAssistant";

const App = () => {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Fetch devices when component mounts
    fetchDevices();

    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Set up voice activation listener
    setupVoiceActivation();

    return () => {
      // Clean up voice activation listener
      cleanupVoiceActivation();
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const setupVoiceActivation = () => {
    // Only set up if speech recognition is available
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.toLowerCase();

      // Check for wake word
      if (
        transcript.includes("hey jason") ||
        transcript.includes("hey, jason")
      ) {
        setShowVoiceAssistant(true);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    // Start listening
    try {
      recognition.start();

      // Store recognition instance for cleanup
      window.jasonVoiceRecognition = recognition;
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
    }
  };

  const cleanupVoiceActivation = () => {
    // Stop recognition if it exists
    if (window.jasonVoiceRecognition) {
      try {
        window.jasonVoiceRecognition.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  };

  const handleVoiceCommand = async (command) => {
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        throw new Error("Failed to process voice command");
      }

      const data = await response.json();

      // Refresh devices after voice command
      fetchDevices();

      return data.response;
    } catch (error) {
      console.error("Error processing voice command:", error);
      return "Sorry, I couldn't process your request.";
    }
  };

  const toggleDeviceStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "on" ? "off" : "on";
    try {
      const response = await fetch(`/api/devices/${id}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "setStatus", value: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to control device");
      }

      // Update local state
      setDevices(
        devices.map((device) =>
          device.id === id ? { ...device, status: newStatus } : device,
        ),
      );
    } catch (error) {
      console.error("Error toggling device:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-4xl">J</span>
          </div>
          <h2 className="mt-4 text-white text-xl">Loading JASON...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      {/* Header */}
      <header className="bg-surface/50 backdrop-blur-md sticky top-0 z-10 border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center mr-3">
              <span className="text-white font-bold">J</span>
            </div>
            <h1 className="text-xl font-semibold">JASON</h1>
          </div>

          <button
            onClick={() => setShowVoiceAssistant(true)}
            className="w-10 h-10 rounded-full bg-jason-electric/20 flex items-center justify-center text-jason-electric"
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              ></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-3 ${activeTab === "dashboard" ? "border-b-2 border-jason-electric" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`flex-1 py-3 ${activeTab === "devices" ? "border-b-2 border-jason-electric" : ""}`}
          onClick={() => setActiveTab("devices")}
        >
          Devices
        </button>
        <button
          className={`flex-1 py-3 ${activeTab === "discovery" ? "border-b-2 border-jason-electric" : ""}`}
          onClick={() => setActiveTab("discovery")}
        >
          Discovery
        </button>
      </div>

      {/* Content */}
      <main className="p-4">
        {activeTab === "dashboard" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Welcome to JASON</h2>
            <div className="bg-surface p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2">Voice Buddy</h3>
              <p className="text-sm mb-3">Ask me anything about your home</p>
              <button
                onClick={() => setShowVoiceAssistant(true)}
                className="w-full py-2 bg-jason-electric rounded-md text-white"
              >
                Activate Voice Buddy
              </button>
            </div>

            <h3 className="font-bold mb-2">Quick Controls</h3>
            {devices.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {devices.slice(0, 4).map((device) => (
                  <div key={device.id} className="bg-surface p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-gray-400">{device.type}</p>
                      </div>
                      {device.status === "on" || device.status === "off" ? (
                        <button
                          onClick={() =>
                            toggleDeviceStatus(device.id, device.status)
                          }
                          className={`w-12 h-6 rounded-full relative ${device.status === "on" ? "bg-jason-electric" : "bg-gray-700"}`}
                        >
                          <span
                            className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${device.status === "on" ? "translate-x-6" : "translate-x-1"}`}
                          ></span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {device.status || "unknown"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface p-4 rounded-lg text-center">
                <p className="text-gray-400">No devices found yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "devices" && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Devices</h2>
            {devices.length > 0 ? (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.id} className="bg-surface p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-gray-400">{device.type}</p>
                      </div>
                      {device.status === "on" || device.status === "off" ? (
                        <button
                          onClick={() =>
                            toggleDeviceStatus(device.id, device.status)
                          }
                          className={`w-12 h-6 rounded-full relative ${device.status === "on" ? "bg-jason-electric" : "bg-gray-700"}`}
                        >
                          <span
                            className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${device.status === "on" ? "translate-x-6" : "translate-x-1"}`}
                          ></span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {device.status || "unknown"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface p-4 rounded-lg text-center">
                <p className="text-gray-400">No devices found yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "discovery" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Device Discovery</h2>
            <div className="bg-surface p-4 rounded-lg text-center">
              <p className="text-gray-400 mb-3">
                Say "Hey JASON, scan for devices" to start discovery
              </p>
              <button
                onClick={() => setShowVoiceAssistant(true)}
                className="px-4 py-2 bg-jason-electric rounded-md text-white text-sm"
              >
                Open Voice Assistant
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-800 p-4 flex justify-around">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={
            activeTab === "dashboard" ? "text-jason-electric" : "text-gray-400"
          }
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            ></path>
          </svg>
        </button>

        <button
          onClick={() => setActiveTab("devices")}
          className={
            activeTab === "devices" ? "text-jason-electric" : "text-gray-400"
          }
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            ></path>
          </svg>
        </button>

        <button
          onClick={() => setShowVoiceAssistant(true)}
          className="bg-jason-electric p-3 rounded-full -mt-8 border-4 border-background"
        >
          <svg
            className="w-6 h-6 text-white"
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
        </button>

        <button
          onClick={() => setActiveTab("discovery")}
          className={
            activeTab === "discovery" ? "text-jason-electric" : "text-gray-400"
          }
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </button>

        <button className="text-gray-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </button>
      </div>

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistant
          onClose={() => setShowVoiceAssistant(false)}
          onCommand={handleVoiceCommand}
        />
      )}
    </div>
  );
};

export default App;

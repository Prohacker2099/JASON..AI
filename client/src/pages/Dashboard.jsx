import React, { useState, useEffect } from "react";
import VoiceAssistant from "../components/VoiceAssistant";

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  useEffect(() => {
    // Fetch devices from the API
    const fetchDevices = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/devices");
        const data = await response.json();
        if (data.success) {
          setDevices(data.devices || []);
        } else {
          console.log("Failed to fetch devices:", data);
          setDevices([]); // Set empty array if no success
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
        setDevices([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const scanDevices = async () => {
    setScanning(true);
    try {
      // First trigger a device discovery
      const scanResponse = await fetch(
        "http://localhost:3001/api/devices/discover",
        {
          method: "POST",
        },
      );

      if (scanResponse.ok) {
        // Then fetch the updated device list
        const response = await fetch("http://localhost:3001/api/devices");
        const data = await response.json();
        if (data.success) {
          setDevices(data.devices || []);
        }
      } else {
        console.error("Failed to scan for devices");
      }
    } catch (error) {
      console.error("Error scanning for devices:", error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <header className="bg-glass shadow-glow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="logo-container mr-3">
              <div className="logo-circle"></div>
              <div className="logo-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold text-gradient">JASON</h1>
          </div>
          <nav>
            <ul className="flex space-x-2">
              <li>
                <a href="#dashboard" className="nav-link active">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#devices" className="nav-link">
                  Devices
                </a>
              </li>
              <li>
                <a href="#settings" className="nav-link">
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gradient">Dashboard</h2>
          <div className="text-sm text-glow">{new Date().toLocaleString()}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card animate-in">
            <div className="card-header">
              <h3 className="text-xl font-semibold">Connected Devices</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="p-3 bg-gray-800 bg-opacity-50 rounded animate-pulse">
                  <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : devices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="p-3 bg-gray-800 bg-opacity-50 rounded"
                    >
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-gray-400">
                        {device.type} - {device.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-800 bg-opacity-50 rounded text-center">
                  No devices found. Click "Scan Devices" to discover.
                </div>
              )}
            </div>
          </div>

          <div className="card animate-in" style={{ "--delay": "0.2s" }}>
            <div className="card-header">
              <h3 className="text-xl font-semibold">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="action-button"
                  onClick={scanDevices}
                  disabled={scanning}
                >
                  <div className="icon-container">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>{scanning ? "Scanning..." : "Scan Devices"}</span>
                </button>
                <button
                  className="action-button"
                  onClick={() => setShowVoiceAssistant(true)}
                >
                  <div className="icon-container">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 19V23"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 23H16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>Voice Assistant</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="card animate-in" style={{ "--delay": "0.4s" }}>
            <div className="card-header">
              <h3 className="text-xl font-semibold">JASON Status</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="status-item">
                  <div className="status-label">System</div>
                  <div className="status-value">
                    <span className="status-indicator online"></span>
                    Online
                  </div>
                </div>
                <div className="status-item">
                  <div className="status-label">API</div>
                  <div className="status-value">
                    <span className="status-indicator online"></span>
                    Connected
                  </div>
                </div>
                <div className="status-item">
                  <div className="status-label">Voice Assistant</div>
                  <div className="status-value">
                    <span className="status-indicator online"></span>
                    Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-glass py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>JASON - Personal Assistant &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {showVoiceAssistant && (
        <VoiceAssistant onClose={() => setShowVoiceAssistant(false)} />
      )}
    </div>
  );
};

export default Dashboard;

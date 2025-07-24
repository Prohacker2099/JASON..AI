import React, { useState, useEffect } from "react";

const CrossDevice = () => {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    // Fetch phones from the API
    const fetchPhones = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/phones");
        const data = await response.json();
        if (data.success) {
          setPhones(data.devices || []);
        }
      } catch (error) {
        console.error("Error fetching phones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhones();
  }, []);

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleSendNotification = async () => {
    if (!selectedDevice) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/phones/${selectedDevice.id}/notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Test Notification",
            message: "This is a test notification from JASON",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        alert("Notification sent successfully!");
      } else {
        alert(`Failed to send notification: ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Error sending notification");
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
                <a href="/" className="nav-link">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/cross-device" className="nav-link active">
                  Cross-Device
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gradient">
            Cross-Device Control
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold">Connected Phones</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="p-3 bg-gray-800 bg-opacity-50 rounded animate-pulse">
                  <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : phones.length > 0 ? (
                <div className="space-y-3">
                  {phones.map((phone) => (
                    <div
                      key={phone.id}
                      className={`p-3 bg-gray-800 bg-opacity-50 rounded cursor-pointer hover:bg-gray-700 ${selectedDevice?.id === phone.id ? "border border-blue-500" : ""}`}
                      onClick={() => handleDeviceSelect(phone)}
                    >
                      <div className="font-medium">{phone.name}</div>
                      <div className="text-sm text-gray-400">
                        {phone.platform} - {phone.connectionType}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-800 bg-opacity-50 rounded text-center">
                  No phones found. Make sure your phone is connected.
                </div>
              )}
            </div>
          </div>

          <div className="card md:col-span-2">
            <div className="card-header">
              <h3 className="text-xl font-semibold">Device Control</h3>
            </div>
            <div className="card-body">
              {selectedDevice ? (
                <div>
                  <div className="mb-4">
                    <h4 className="text-lg font-medium">
                      {selectedDevice.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {selectedDevice.manufacturer} {selectedDevice.model} -{" "}
                      {selectedDevice.platform}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800 bg-opacity-50 rounded">
                      <h5 className="font-medium mb-2">Notifications</h5>
                      <button
                        className="btn-primary w-full"
                        onClick={handleSendNotification}
                      >
                        Send Test Notification
                      </button>
                    </div>

                    <div className="p-4 bg-gray-800 bg-opacity-50 rounded">
                      <h5 className="font-medium mb-2">Location</h5>
                      <button
                        className="btn-primary w-full"
                        onClick={() => alert("Location feature coming soon")}
                      >
                        Get Location
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-800 bg-opacity-50 rounded text-center">
                  Select a device to control
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-glass py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>JASON - Personal Assistant &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default CrossDevice;

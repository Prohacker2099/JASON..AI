import React, { useState, useEffect, useRef } from "react";
import crossDeviceCommunication from "../utils/crossDeviceCommunication";

const CrossDeviceControl = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [commandText, setCommandText] = useState("");
  const [commandParams, setCommandParams] = useState("{}");
  const [notifications, setNotifications] = useState([]);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const videoRef = useRef(null);

  // Initialize cross-device communication on component mount
  useEffect(() => {
    // Initialize when component mounts
    const initialize = async () => {
      try {
        const success = await crossDeviceCommunication.initialize();
        if (success) {
          setConnectionStatus("connected");
          loadConnectedDevices();
        }
      } catch (error) {
        console.error(
          "Failed to initialize cross-device communication:",
          error,
        );
      }
    };

    initialize();

    // Set up event listeners
    crossDeviceCommunication.on("connected", () => {
      setConnectionStatus("connected");
      loadConnectedDevices();
    });

    crossDeviceCommunication.on("disconnected", () => {
      setConnectionStatus("disconnected");
    });

    crossDeviceCommunication.on("notification", (data) => {
      setNotifications((prev) => [...prev, data]);
    });

    crossDeviceCommunication.on("fileSendProgress", (data) => {
      setTransferProgress(data.percentage);
    });

    crossDeviceCommunication.on("fileTransferComplete", (data) => {
      setIsTransferring(false);
      setTransferProgress(0);
      alert(`File transfer complete: ${data.filename}`);
    });

    crossDeviceCommunication.on("streamFrame", (data) => {
      if (videoRef.current) {
        const img = new Image();
        img.onload = () => {
          const canvas = videoRef.current;
          const ctx = canvas.getContext("2d");

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };

        img.src = `data:image/jpeg;base64,${data.frame}`;
      }
    });

    // Clean up event listeners on unmount
    return () => {
      crossDeviceCommunication.off("connected");
      crossDeviceCommunication.off("disconnected");
      crossDeviceCommunication.off("notification");
      crossDeviceCommunication.off("fileSendProgress");
      crossDeviceCommunication.off("fileTransferComplete");
      crossDeviceCommunication.off("streamFrame");
    };
  }, []);

  // Load connected devices
  const loadConnectedDevices = async () => {
    try {
      const response = await crossDeviceCommunication.getConnectedDevices();
      if (response.success) {
        setConnectedDevices(response.devices);
      }
    } catch (error) {
      console.error("Error loading connected devices:", error);
    }
  };

  // Handle send command
  const handleSendCommand = async () => {
    if (!selectedDevice) {
      alert("Please select a device");
      return;
    }

    try {
      const params = JSON.parse(commandParams);
      const response = await crossDeviceCommunication.sendDeviceCommand(
        selectedDevice,
        commandText,
        params,
      );

      alert(`Command response: ${JSON.stringify(response)}`);
    } catch (error) {
      alert(`Error sending command: ${error.message}`);
    }
  };

  // Handle send notification
  const handleSendNotification = async () => {
    if (!selectedDevice) {
      alert("Please select a device");
      return;
    }

    if (!notificationTitle) {
      alert("Please enter a notification title");
      return;
    }

    try {
      const success = await crossDeviceCommunication.sendNotification(
        selectedDevice,
        notificationTitle,
        notificationBody,
      );

      if (success) {
        alert("Notification sent");
        setNotificationTitle("");
        setNotificationBody("");
      } else {
        alert("Failed to send notification");
      }
    } catch (error) {
      alert(`Error sending notification: ${error.message}`);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle file transfer
  const handleTransferFile = async () => {
    if (!selectedDevice) {
      alert("Please select a device");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    try {
      setIsTransferring(true);
      setTransferProgress(0);

      await crossDeviceCommunication.sendFile(selectedDevice, selectedFile);
    } catch (error) {
      alert(`Error transferring file: ${error.message}`);
      setIsTransferring(false);
    }
  };

  // Handle request screen sharing
  const handleRequestScreenSharing = async () => {
    if (!selectedDevice) {
      alert("Please select a device");
      return;
    }

    try {
      const response =
        await crossDeviceCommunication.requestScreenSharing(selectedDevice);

      if (response.success) {
        setIsStreaming(true);
        setStreamId(response.streamId);
        alert("Screen sharing request sent");
      } else {
        alert(`Failed to request screen sharing: ${response.error}`);
      }
    } catch (error) {
      alert(`Error requesting screen sharing: ${error.message}`);
    }
  };

  // Handle stop screen sharing
  const handleStopScreenSharing = async () => {
    if (!streamId) return;

    try {
      await crossDeviceCommunication.sendDeviceCommand(
        selectedDevice,
        "stop_screen_sharing",
        { streamId },
      );

      setIsStreaming(false);
      setStreamId(null);
    } catch (error) {
      alert(`Error stopping screen sharing: ${error.message}`);
    }
  };

  // Start local screen sharing
  const handleShareMyScreen = async () => {
    try {
      const response = await crossDeviceCommunication.startScreenSharing({
        targetDevice: selectedDevice,
      });

      if (response.success) {
        setIsStreaming(true);
        setStreamId(response.streamId);
        alert("Screen sharing started");
      } else {
        alert(`Failed to start screen sharing: ${response.error}`);
      }
    } catch (error) {
      alert(`Error starting screen sharing: ${error.message}`);
    }
  };

  // Stop local screen sharing
  const handleStopMyScreenSharing = async () => {
    if (!streamId) return;

    try {
      const response = await crossDeviceCommunication.stopScreenSharing({
        streamId,
        targetDevice: selectedDevice,
      });

      if (response.success) {
        setIsStreaming(false);
        setStreamId(null);
        alert("Screen sharing stopped");
      }
    } catch (error) {
      alert(`Error stopping screen sharing: ${error.message}`);
    }
  };

  // Refresh device list
  const handleRefreshDevices = () => {
    loadConnectedDevices();
  };

  return (
    <div className="cross-device-control">
      <h2>Cross-Device Control</h2>

      <div className="connection-status">
        Status: <span className={connectionStatus}>{connectionStatus}</span>
      </div>

      <div className="device-list">
        <div className="section-header">
          <h3>Connected Devices</h3>
          <button onClick={handleRefreshDevices}>Refresh</button>
        </div>

        <select
          value={selectedDevice || ""}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          <option value="">Select a device</option>
          {connectedDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.metadata?.deviceType || "Unknown"} - {device.deviceId}
            </option>
          ))}
        </select>
      </div>

      <div className="command-section">
        <h3>Send Command</h3>
        <input
          type="text"
          placeholder="Command (e.g. take_photo, get_location)"
          value={commandText}
          onChange={(e) => setCommandText(e.target.value)}
        />
        <textarea
          placeholder="Parameters (JSON format)"
          value={commandParams}
          onChange={(e) => setCommandParams(e.target.value)}
          rows={3}
        />
        <button onClick={handleSendCommand} disabled={!selectedDevice}>
          Send Command
        </button>
      </div>

      <div className="notification-section">
        <h3>Send Notification</h3>
        <input
          type="text"
          placeholder="Title"
          value={notificationTitle}
          onChange={(e) => setNotificationTitle(e.target.value)}
        />
        <textarea
          placeholder="Message"
          value={notificationBody}
          onChange={(e) => setNotificationBody(e.target.value)}
          rows={3}
        />
        <button onClick={handleSendNotification} disabled={!selectedDevice}>
          Send Notification
        </button>
      </div>

      <div className="file-transfer-section">
        <h3>File Transfer</h3>
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleTransferFile}
          disabled={!selectedDevice || !selectedFile || isTransferring}
        >
          {isTransferring
            ? `Transferring (${transferProgress}%)`
            : "Transfer File"}
        </button>
        {isTransferring && (
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${transferProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="screen-sharing-section">
        <h3>Screen Sharing</h3>
        {!isStreaming ? (
          <div>
            <button
              onClick={handleRequestScreenSharing}
              disabled={!selectedDevice}
            >
              Request Screen Sharing
            </button>
            <button onClick={handleShareMyScreen} disabled={!selectedDevice}>
              Share My Screen
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleStopScreenSharing}
              disabled={!selectedDevice}
            >
              Stop Remote Sharing
            </button>
            <button
              onClick={handleStopMyScreenSharing}
              disabled={!selectedDevice}
            >
              Stop My Sharing
            </button>
          </div>
        )}

        <div className="stream-container">
          <canvas ref={videoRef} width="640" height="360"></canvas>
        </div>
      </div>

      <div className="notifications-section">
        <h3>Received Notifications</h3>
        <div className="notification-list">
          {notifications.length === 0 ? (
            <p>No notifications received</p>
          ) : (
            <ul>
              {notifications.map((notification, index) => (
                <li key={index}>
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                  <small>
                    {new Date(notification.timestamp).toLocaleString()}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style jsx>{`
        .cross-device-control {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .connection-status {
          margin-bottom: 20px;
        }

        .connection-status .connected {
          color: green;
          font-weight: bold;
        }

        .connection-status .disconnected {
          color: red;
          font-weight: bold;
        }

        .device-list,
        .command-section,
        .notification-section,
        .file-transfer-section,
        .screen-sharing-section,
        .notifications-section {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
        }

        select,
        input,
        textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        button {
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
          margin-bottom: 10px;
        }

        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 10px;
        }

        .progress {
          height: 100%;
          background-color: #0070f3;
          transition: width 0.3s ease;
        }

        .stream-container {
          margin-top: 15px;
          width: 640px;
          height: 360px;
          max-width: 100%;
          background-color: #000;
          border-radius: 5px;
        }

        .notification-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-list ul {
          list-style-type: none;
          padding: 0;
        }

        .notification-list li {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .notification-list li:last-child {
          border-bottom: none;
        }

        .notification-list small {
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default CrossDeviceControl;

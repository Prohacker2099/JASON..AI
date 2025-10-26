import React, { useState, useEffect, useRef } from 'react';

interface SmartDevice {
  id: string;
  type: string; // e.g., 'light', 'thermostat', 'sensor'
  name: string;
  status: {
    on: boolean;
    temperature?: number;
    brightness?: number;
    // Add other relevant device properties here
  };
}

interface PremiumFeaturesState {
  devices: SmartDevice[];
  loading: boolean;
  error: string | null;
}

const PremiumFeatures: React.FC = () => {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        websocketRef.current = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket server address

        websocketRef.current.onopen = () => {
          console.log('Connected to WebSocket server');
          setLoading(false);
        };

        websocketRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'deviceUpdate') {
            const updatedDevice = data.device;
            const existingDeviceIndex = devices.findIndex((d) => d.id === updatedDevice.id);
            if (existingDeviceIndex !== -1) {
              const updatedDevices = [...devices];
              updatedDevices[existingDeviceIndex] = updatedDevice;
              setDevices(updatedDevices);
            } else {
              setDevices([...devices, updatedDevice]);
            }
          }
        };

        websocketRef.current.onclose = () => {
          console.log('Disconnected from WebSocket server');
          setLoading(true);
          setError('Failed to connect to WebSocket server');
        };

        websocketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('WebSocket error: ' + error);
          setLoading(true);
        };
      } catch (err) {
        setError('Error connecting to WebSocket: ' + err);
        setLoading(true);
      }
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const handleDeviceChange = (deviceId: string, newValue: any) => {
    // Simulate sending a device update to the WebSocket server
    // In a real implementation, this would be replaced with sending the actual update
    // through the WebSocket connection.
    const updateMessage = {
      type: 'deviceUpdate',
      device: {
        id: deviceId,
        type: devices.find(d => d.id === deviceId)?.type || 'unknown',
        name: devices.find(d => d.id === deviceId)?.name || 'unknown',
        status: {
          [deviceId]: newValue, // Replace with actual device properties
        },
      },
    };
    console.log("Sending update message:", updateMessage);
  };

  if (loading) {
    return <div>Loading premium features...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Premium Features</h2>
      <ul>
        {devices.map((device) => (
          <li key={device.id}>
            <strong>{device.name}</strong>: {device.status ? (
              JSON.stringify(device.status)
            ) : (
              'No status available'
            )}
            <button onClick={() => handleDeviceChange(device.id, device.status)}>
              Update
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PremiumFeatures;

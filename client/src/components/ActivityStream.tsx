import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Define types for device states and actions
interface Device {
  id: string;
  type: 'light' | 'thermostat' | 'lock' | 'appliance';
  name: string;
  status: DeviceStatus;
  capabilities: DeviceCapabilities;
}

interface DeviceCapabilities {
  on?: boolean;
  off?: boolean;
  temperature?: number;
  brightness?: number;
  lock?: boolean;
}

enum DeviceStatus {
  ONLINE,
  OFFLINE,
  ERROR,
}

interface ActivityStreamProps {
  devices: Device[];
}

const ActivityStream: React.FC<ActivityStreamProps> = ({ devices }) => {
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (socketRef.current === null) {
      socketRef.current = io('http://localhost:3000'); // Replace with your server URL
      socketRef.current.on('connect', () => {
        console.log('Connected to server');
      });
      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from server');
      });
      socketRef.current.on('serverMessage', (message: string) => {
        setActivityLog((prevLog) => [...prevLog, message]);
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    // Simulate sending a message to the server to update the device state
    if (socketRef.current) {
      socketRef.current.emit('deviceUpdate', { id: deviceId, newValue: { status: 'ONLINE' } });
    }
  };

  return (
    <div>
      <h1>JASON - The Omnipotent AI Architect</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <h2>Activity Stream</h2>
      <ul>
        {activityLog.map((logEntry, index) => (
          <li key={index}>{logEntry}</li>
        ))}
      </ul>
      {/* Device Controls - Example: Light Control */}
      {devices.some(device => device.type === 'light') && (
        <div>
          <h3>Light Control</h3>
          <button onClick={() => {
              if(socketRef.current) {
                socketRef.current.emit('deviceUpdate', { id: devices.find(d => d.type === 'light')?.id || 'light1', newValue: { status: 'ON' } });
              }
            }}>Turn On</button>
          <button onClick={() => {
              if(socketRef.current) {
                socketRef.current.emit('deviceUpdate', { id: devices.find(d => d.type === 'light')?.id || 'light1', newValue: { status: 'OFF' } });
              }
            }}>Turn Off</button>
        </div>
      )}
    </div>
  );
};

export default ActivityStream;

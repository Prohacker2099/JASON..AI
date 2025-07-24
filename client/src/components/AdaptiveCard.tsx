import React, { useState, useEffect } from 'react';

// Define a type for smart devices
interface SmartDevice {
  id: string;
  type: string; // e.g., 'light', 'thermostat', 'lock'
  name: string;
  status: {
    on: boolean;
    temperature?: number;
    lockState?: 'locked' | 'unlocked';
    brightness?: number;
    // Add other device-specific properties here
  };
}

export default function AdaptiveCard({ title, description }) {
  const [devices, setDevices] = useState<SmartDevice[]>([
    { id: 'light1', type: 'light', name: 'Living Room Light', status: { on: false, brightness: 50 } },
    { id: 'thermostat1', type: 'thermostat', name: 'Living Room Thermostat', status: { on: true, temperature: 22 } },
    { id: 'lock1', type: 'lock', name: 'Front Door Lock', status: { on: true, lockState: 'locked' } },
  ]);

  useEffect(() => {
    // Simulate a WebSocket connection for real-time device updates
    const ws = new WebSocket('ws://localhost:8765'); // Replace with your WebSocket server URL

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      console.log('Received device update:', data);

      // Update device state based on received data
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === data.deviceId
            ? { ...device, status: data.status }
            : device
        )
      );
    });

    return () => {
      ws.removeEventListener('message', () => {});
    };
  }, []);

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
      <h2>{title}</h2>
      <p>{description}</p>

      <h3>JASON's Core Functions: The Orchestration of an Intelligent Life</h3>

      <p>JASON operates as the singular, intelligent nervous system for your world, seamlessly integrating a vast array of functionalities. JASON eliminates smart home chaos. It meticulously discovers and controls *every* device in your home, regardless of brand or protocol – from Philips Hue lights and Nest thermostats to Zigbee sensors, Z-Wave locks, and the latest Matter-enabled appliances. Through its "Universal Device Abstraction Layer," disparate technologies speak one language, allowing you to manage your entire environment from a single, intuitive interface, ending the frustration of multiple apps and fragmented ecosystems. JASON's AI constantly learns new device types and protocols, ensuring near-instant support for any new smart device on the market.</p>

      <h4>2. Proactive AI & Hyper-Personalization</h4>

      <p>This is where JASON comes alive. Its advanced AI doesn't just follow rules; it *learns you*. JASON continuously observes your behaviors, preferences, and interactions across all your devices, building a deep, evolving understanding of your lifestyle.</p>

      <ul>
        {devices.map((device) => (
          <li key={device.id}>
            <strong>{device.name}</strong> - {device.type} - {device.status.on ? 'On' : 'Off'}
          </li>
        ))}
      </ul>
    </div>
  );
}

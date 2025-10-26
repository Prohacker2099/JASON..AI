import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen: string;
  brightness?: number;
  temperature?: number;
  power?: number;
  battery?: number;
}

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const DeviceCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const DeviceName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
`;

const DeviceType = styled.p`
  color: #a0a0a0;
  margin-bottom: 1rem;
`;

const Stat = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/devices');
      setDevices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch devices. Ensure server is running on port 3001.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const controlDevice = async (deviceId: string, action: string) => {
    try {
      await axios.post('http://localhost:3001/api/devices/control', {
        deviceId,
        action
      });
      fetchDevices();
    } catch (err) {
      setError('Failed to control device');
    }
  };

  if (loading) {
    return (
      <AppContainer>
        <Header>
          <Title>JASON AI</Title>
          <p>Loading devices...</p>
        </Header>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <Header>
          <Title>JASON AI</Title>
          <p>{error}</p>
          <Button onClick={fetchDevices}>Retry</Button>
        </Header>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <Title>JASON AI</Title>
        <p>AI-Powered Device Management</p>
      </Header>

      <DeviceGrid>
        <AnimatePresence>
          {devices.map((device, index) => (
            <DeviceCard
              key={device.deviceId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <DeviceName>{device.name}</DeviceName>
              <DeviceType>{device.type} - {device.status}</DeviceType>
              
              <Stat>
                <span>Battery:</span>
                <span>{device.battery || 100}%</span>
              </Stat>
              
              <Stat>
                <span>Power:</span>
                <span>{device.power || 0}W</span>
              </Stat>
              
              <Stat>
                <span>Temperature:</span>
                <span>{device.temperature || 22}°C</span>
              </Stat>
              
              <Stat>
                <span>Brightness:</span>
                <span>{device.brightness || 50}%</span>
              </Stat>
              
              <Button onClick={() => controlDevice(device.deviceId, 'toggle')}>
                Toggle Power
              </Button>
            </DeviceCard>
          ))}
        </AnimatePresence>
      </DeviceGrid>
    </AppContainer>
  );
}

export default App;

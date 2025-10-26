import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// Enhanced device interface
interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen: string;
  lastUpdate?: string;
  brightness?: number;
  temperature?: number;
  power?: number;
  location?: string;
  battery?: number;
  humidity?: number;
  signalStrength?: number;
}

// Advanced animations
const aurora = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const particleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
`;

const neonPulse = keyframes`
  0%, 100% { text-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6; }
  50% { text-shadow: 0 0 20px #8b5cf6, 0 0 30px #8b5cf6, 0 0 40px #8b5cf6; }
`;

const holographicShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const energyWave = keyframes`
  0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Enhanced glassmorphism with aurora effects
const AppContainer = styled(motion.div)`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f172a 75%, #0a0a0a 100%);
  background-size: 400% 400%;
  animation: ${aurora} 15s ease infinite;
  color: #e0e0e0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
    animation: ${energyWave} 20s ease-in-out infinite;
    pointer-events: none;
  }
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
`;

const Particle = styled(motion.div)<{ delay: number; x: number; y: number }>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  border-radius: 50%;
  animation: ${particleFloat} 6s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  box-shadow: 0 0 10px currentColor;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
`;

const Header = styled(motion.header)`
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const Logo = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${holographicShift} 3s ease-in-out infinite;
  text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  letter-spacing: 2px;
`;

const StatusBar = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
`;

const StatusIndicator = styled(motion.div)<{ status: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.status === 'online' ? '#00ff88' : '#ff4757'};
  animation: ${pulse} 2s infinite;
  box-shadow: 0 0 10px currentColor;
`;

const MainContent = styled(motion.main)`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
`;

const DashboardHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const DashboardTitle = styled(motion.h2)`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #00ffff, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  animation: ${neonPulse} 4s ease-in-out infinite;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const DeviceGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const DeviceCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #00ffff, #ff00ff, #ffff00);
    animation: ${holographicShift} 3s ease-in-out infinite;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 
      0 20px 60px rgba(0, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const DeviceName = styled(motion.h3)`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const DeviceType = styled.span`
  font-size: 0.9rem;
  color: #a0a0a0;
  font-weight: 500;
`;

const DeviceStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
`;

const StatItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-bottom: 0.25rem;
`;

const StatValue = styled(motion.span)`
  font-size: 1.1rem;
  font-weight: 700;
  color: #00ffff;
`;

const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ControlButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SliderControl = styled(motion.input)`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #00ffff, #ff00ff);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
`;

const LoadingContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 255, 255, 0.1);
  border-top: 4px solid #00ffff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled(motion.div)`
  font-size: 1.2rem;
  color: #00ffff;
  text-align: center;
  animation: ${neonPulse} 2s ease-in-out infinite;
`;

const ErrorContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 16px;
  padding: 2rem;
  color: #ff4757;
  backdrop-filter: blur(20px);
  max-width: 400px;
`;

const RefreshButton = styled(motion.button)`
  background: linear-gradient(135deg, #ff4757, #ff6b7a);
  border: none;
  border-radius: 12px;
  color: white;
  padding: 1rem 2rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4);
  }
`;

// Particle system component
const ParticleSystem: React.FC = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 6,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <ParticleContainer>
      {particles.map(particle => (
        <Particle
          key={particle.id}
          delay={particle.delay}
          x={particle.x}
          y={particle.y}
        />
      ))}
    </ParticleContainer>
  );
};

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const controls = useAnimation();

  const fetchDevices = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/devices');
      setDevices(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch devices. Ensure the server is running on port 3001.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const controlDevice = async (deviceId: string, action: string, value?: any) => {
    try {
      await axios.post('http://localhost:3001/api/devices/control', {
        deviceId,
        action,
        value
      });
      fetchDevices();
    } catch (err) {
      setError('Failed to control device');
    }
  };

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const totalPower = devices.reduce((sum, d) => sum + (d.power || 0), 0);
  const avgBattery = devices.length > 0 
    ? Math.round(devices.reduce((sum, d) => sum + (d.battery || 100), 0) / devices.length)
    : 100;

  if (loading) {
    return (
      <AppContainer>
        <LoadingContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner />
          <LoadingText
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Initializing JASON AI Neural Network...
          </LoadingText>
        </LoadingContainer>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <ErrorContainer
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ErrorMessage>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ff4757' }}>Connection Error</h3>
            <p>{error}</p>
            <RefreshButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setLoading(true);
                fetchDevices();
              }}
            >
              Retry Connection
            </RefreshButton>
          </ErrorMessage>
        </ErrorContainer>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ParticleSystem />
      
      <Header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Logo>JASON AI</Logo>
        <StatusBar>
          <StatusIndicator status="online" />
          <span>{onlineDevices}/{totalDevices} Online</span>
        </StatusBar>
      </Header>

      <MainContent>
        <DashboardHeader
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <DashboardTitle>AI-Powered Device Management</DashboardTitle>
          
          <StatsGrid>
            <StatCard
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatLabel>Total Devices</StatLabel>
              <StatValue>{totalDevices}</StatValue>
            </StatCard>
            
            <StatCard
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatLabel>Online Devices</StatLabel>
              <StatValue>{onlineDevices}</StatValue>
            </StatCard>
            
            <StatCard
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatLabel>Total Power</StatLabel>
              <StatValue>{totalPower}W</StatValue>
            </StatCard>
            
            <StatCard
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatLabel>Avg Battery</StatLabel>
              <StatValue>{avgBattery}%</StatValue>
            </StatCard>
          </StatsGrid>
        </DashboardHeader>

        <DeviceGrid
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <AnimatePresence>
            {devices.map((device, index) => (
              <DeviceCard
                key={device.deviceId}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -50 }}
                transition={{ 
                  delay: index * 0.1, 
                  duration: 0.5,
                  type: "spring", 
                  stiffness: 100 
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300 }
                }}
                layout
              >
                <DeviceHeader>
                  <div>
                    <DeviceName>{device.name}</DeviceName>
                    <DeviceType>{device.type}</DeviceType>
                  </div>
                  <StatusIndicator status={device.status} />
                </DeviceHeader>

                <DeviceStats>
                  <StatItem>
                    <StatLabel>Battery</StatLabel>
                    <StatValue>{device.battery || 100}%</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Power</StatLabel>
                    <StatValue>{device.power || 0}W</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Temp</StatLabel>
                    <StatValue>{device.temperature || 22}°C</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Brightness</StatLabel>
                    <StatValue>{device.brightness || 50}%</StatValue>
                  </StatItem>
                </DeviceStats>

                <ControlPanel>
                  <ControlButton
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => controlDevice(device.deviceId, 'toggle')}
                  >
                    Toggle Power
                  </ControlButton>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>Brightness:</span>
                    <SliderControl
                      type="range"
                      min="0"
                      max="100"
                      value={device.brightness || 50}
                      onChange={(e) => controlDevice(device.deviceId, 'setBrightness', parseInt(e.target.value))}
                    />
                    <span>{device.brightness || 50}%</span>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                    Last seen: {new Date(device.lastSeen).toLocaleString()}
                  </div>
                </ControlPanel>
              </DeviceCard>
            ))}
          </AnimatePresence>
        </DeviceGrid>
      </MainContent>
    </AppContainer>
  );
}

export default App;

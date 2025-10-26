import React, { useState, useEffect, useRef } from 'react';
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

// Ultra-modern animations
const morphingGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const floatingOrb = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
  33% { transform: translateY(-30px) rotate(120deg) scale(1.1); }
  66% { transform: translateY(-15px) rotate(240deg) scale(0.9); }
`;

const neonPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff;
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 30px #ff00ff, 0 0 60px #ff00ff, 0 0 90px #ff00ff;
    filter: brightness(1.2);
  }
`;

// Ultra-modern styling
const AppContainer = styled.div`
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at top, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at bottom, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 25%, #16213e 50%, #0f172a 75%, #0a0a0a 100%);
  background-size: 400% 400%;
  animation: ${morphingGradient} 20s ease infinite;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
  position: relative;
`;

const Particle = styled(motion.div)<{ delay: number; x: number; y: number; size: number }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00);
  border-radius: 50%;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  box-shadow: 0 0 ${props => props.size * 2}px currentColor;
  filter: blur(0.5px);
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${morphingGradient} 3s ease-in-out infinite;
  letter-spacing: 2px;
`;

const StatusBadge = styled.div<{ online: number; total: number }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
`;

const MainContent = styled.main`
  padding: 8rem 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const HeroTitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 900;
  background: linear-gradient(45deg, #00ffff, #8b5cf6, #ff00ff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  animation: ${morphingGradient} 4s ease-in-out infinite;
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #a0a0a0;
  font-weight: 300;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem;
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 900;
  color: #00ffff;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const DeviceCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 32px;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
  
  &:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 30px 80px rgba(0, 255, 255, 0.2);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const DeviceName = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const DeviceType = styled.div`
  font-size: 1rem;
  color: #a0a0a0;
`;

const StatusIndicator = styled.div<{ status: string }>`
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: ${props => props.status === 'online' 
    ? 'linear-gradient(135deg, #00ff88, #00cc6a)' 
    : 'linear-gradient(135deg, #ff4757, #ff3742)'};
  color: white;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #00ffff;
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ControlButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
`;

const BrightnessControl = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
`;

const BrightnessSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #667eea, #764ba2);
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 255, 255, 0.1);
  border-top: 4px solid #00ffff;
  border-radius: 50%;
  animation: spin 2s linear infinite;
  margin-bottom: 2rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
`;

const ErrorCard = styled.div`
  background: rgba(255, 71, 87, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 24px;
  padding: 2rem;
  max-width: 400px;
  color: #ff4757;
`;

const RetryButton = styled.button`
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
  }
`;

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/devices');
      const data = response.data;
      
      // Handle various response formats
      const deviceArray = Array.isArray(data) ? data : 
                        (data.devices && Array.isArray(data.devices) ? data.devices : 
                        (data.data && Array.isArray(data.data) ? data.data : []));
      
      setDevices(deviceArray);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Unable to connect to JASON AI Network. Ensure server is running on port 3001.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, [retryCount]);

  const controlDevice = async (deviceId: string, action: string, value?: any) => {
    try {
      await axios.post('http://localhost:3001/api/devices/control', {
        deviceId,
        action,
        value
      });
      fetchDevices();
    } catch (err) {
      console.error('Error controlling device:', err);
      setError('Failed to control device');
    }
  };

  // Create particle system
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 8,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
  }));

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const totalPower = devices.reduce((sum, d) => sum + (d.power || 0), 0);
  const avgBattery = devices.length > 0 
    ? Math.round(devices.reduce((sum, d) => sum + (d.battery || 100), 0) / devices.length)
    : 100;

  if (loading) {
    return (
      <AppContainer>
        {particles.map(particle => (
          <Particle
            key={particle.id}
            delay={particle.delay}
            x={particle.x}
            y={particle.y}
            size={particle.size}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ 
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: particle.delay 
            }}
          />
        ))}
        <LoadingContainer>
          <LoadingSpinner />
          <h2 style={{ color: '#00ffff', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>
            Activating JASON AI Neural Network...
          </h2>
        </LoadingContainer>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <ErrorContainer>
          <ErrorCard>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
              Network Connection Error
            </h3>
            <p>{error}</p>
            <RetryButton onClick={() => {
              setLoading(true);
              setRetryCount(prev => prev + 1);
            }}>
              Reconnect
            </RetryButton>
          </ErrorCard>
        </ErrorContainer>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {particles.map(particle => (
        <Particle
          key={particle.id}
          delay={particle.delay}
          x={particle.x}
          y={particle.y}
          size={particle.size}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ 
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: particle.delay 
          }}
        />
      ))}
      
      <Header>
        <Logo>JASON AI</Logo>
        <StatusBadge online={onlineDevices} total={totalDevices}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: onlineDevices > 0 ? '#00ff88' : '#ff4757',
            marginRight: '0.5rem'
          }} />
          {onlineDevices}/{totalDevices} ONLINE
        </StatusBadge>
      </Header>

      <MainContent>
        <HeroSection>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <HeroTitle>AI-Powered Device Control</HeroTitle>
            <HeroSubtitle>Manage your smart ecosystem with neural precision</HeroSubtitle>
          </motion.div>
        </HeroSection>

        <StatsGrid>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <StatCard whileHover={{ scale: 1.05 }}>
              <StatValue>{totalDevices}</StatValue>
              <StatLabel>Total Devices</StatLabel>
            </StatCard>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <StatCard whileHover={{ scale: 1.05 }}>
              <StatValue>{onlineDevices}</StatValue>
              <StatLabel>Online</StatLabel>
            </StatCard>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <StatCard whileHover={{ scale: 1.05 }}>
              <StatValue>{totalPower}W</StatValue>
              <StatLabel>Total Power</StatLabel>
            </StatCard>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <StatCard whileHover={{ scale: 1.05 }}>
              <StatValue>{avgBattery}%</StatValue>
              <StatLabel>Avg Battery</StatLabel>
            </StatCard>
          </motion.div>
        </StatsGrid>

        <DeviceGrid>
          <AnimatePresence>
            {devices.map((device, index) => (
              <motion.div
                key={device.deviceId}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
              >
                <DeviceCard>
                  <DeviceHeader>
                    <div>
                      <DeviceName>{device.name}</DeviceName>
                      <DeviceType>{device.type}</DeviceType>
                    </div>
                    <StatusIndicator status={device.status}>
                      {device.status}
                    </StatusIndicator>
                  </DeviceHeader>

                  <MetricsGrid>
                    <Metric>
                      <MetricValue>{device.battery || 100}%</MetricValue>
                      <MetricLabel>Battery</MetricLabel>
                    </Metric>
                    <Metric>
                      <MetricValue>{device.power || 0}W</MetricValue>
                      <MetricLabel>Power</MetricLabel>
                    </Metric>
                    <Metric>
                      <MetricValue>{device.temperature || 22}°C</MetricValue>
                      <MetricLabel>Temp</MetricLabel>
                    </Metric>
                    <Metric>
                      <MetricValue>{device.brightness || 50}%</MetricValue>
                      <MetricLabel>Brightness</MetricLabel>
                    </Metric>
                  </MetricsGrid>

                  <div style={{ marginTop: '2rem' }}>
                    <ControlButton
                      onClick={() => controlDevice(device.deviceId, 'toggle')}
                    >
                      {device.status === 'online' ? 'Turn Off' : 'Turn On'}
                    </ControlButton>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px'
                    }}>
                      <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
                        Brightness:
                      </span>
                      <BrightnessSlider
                        type="range"
                        min="0"
                        max="100"
                        value={device.brightness || 50}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          controlDevice(device.deviceId, 'setBrightness', parseInt(e.target.value))
                        }
                      />
                      <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
                        {device.brightness || 50}%
                      </span>
                    </div>
                  </div>
                </DeviceCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </DeviceGrid>

        {devices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ textAlign: 'center', padding: '4rem', color: '#a0a0a0' }}
          >
            <h3>🚀 No devices connected</h3>
            <p>Connect your devices to the JASON AI network to get started</p>
          </motion.div>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;

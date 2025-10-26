import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Enhanced animations and effects
const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4); }
`;

const dataFlow = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Enhanced styled components with glassmorphism
const DashboardContainer = styled(motion.div)`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  background-attachment: fixed;
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
`;

const GlassCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const NeonText = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${glowPulse} 3s ease-in-out infinite;
  text-align: center;
  margin-bottom: 3rem;
`;

const DeviceCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: ${dataFlow} 3s infinite;
  }
`;

const StatusIndicator = styled(motion.div)`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  box-shadow: ${props => props.status === 'online' 
    ? '0 0 10px #10b981' 
    : '0 0 10px #ef4444'};
  animation: ${float} 2s ease-in-out infinite;
`;

const AnimatedChart = styled(motion.div)`
  width: 100%;
  height: 300px;
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ControlButton = styled(motion.button)`
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
  }
`;

interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen: string;
  metrics?: {
    temperature?: number;
    humidity?: number;
    power?: number;
  };
}

interface EnhancedDashboardProps {
  devices: Device[];
  onDeviceControl: (deviceId: string, action: string) => void;
}

const AnimatedDashboard: React.FC<EnhancedDashboardProps> = ({ devices, onDeviceControl }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const chartData = devices.map(device => ({
    name: device.name,
    status: device.status === 'online' ? 1 : 0,
    lastSeen: new Date(device.lastSeen).getHours(),
    temperature: device.metrics?.temperature || 0,
    power: device.metrics?.power || 0,
  }));

  const pieData = [
    { name: 'Online', value: devices.filter(d => d.status === 'online').length, color: '#10b981' },
    { name: 'Offline', value: devices.filter(d => d.status === 'offline').length, color: '#ef4444' },
  ];

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <NeonText
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        JASON AI Control Center
      </NeonText>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <GlassCard
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 style={{ color: '#e0e0e0', marginBottom: '1rem' }}>Device Overview</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#3b82f6', fontSize: '2rem', margin: 0 }}>{devices.length}</h2>
              <p style={{ color: '#9ca3af', margin: 0 }}>Total Devices</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {devices.filter(d => d.status === 'online').length}
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>Online</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {devices.filter(d => d.status === 'offline').length}
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>Offline</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 style={{ color: '#e0e0e0', marginBottom: '1rem' }}>System Health</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ color: '#e0e0e0', marginBottom: '2rem', fontSize: '1.5rem' }}>Live Device Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {devices.map((device, index) => (
              <DeviceCard
                key={device.deviceId}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: '#e0e0e0', margin: 0 }}>{device.name}</h4>
                  <StatusIndicator status={device.status} />
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0.5rem 0' }}>Type: {device.type}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                  Last seen: {new Date(device.lastSeen).toLocaleString()}
                </p>
                {device.metrics && (
                  <div style={{ marginTop: '1rem' }}>
                    {device.metrics.temperature && (
                      <p style={{ color: '#06b6d4', fontSize: '0.8rem' }}>
                        🌡️ {device.metrics.temperature}°C
                      </p>
                    )}
                    {device.metrics.power && (
                      <p style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                        ⚡ {device.metrics.power}W
                      </p>
                    )}
                  </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <ControlButton
                    onClick={() => onDeviceControl(device.deviceId, 'toggle')}
                    whileTap={{ scale: 0.95 }}
                  >
                    Toggle
                  </ControlButton>
                  <ControlButton
                    onClick={() => onDeviceControl(device.deviceId, 'status')}
                    whileTap={{ scale: 0.95 }}
                  >
                    Status
                  </ControlButton>
                </div>
              </DeviceCard>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatedChart
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="temperature" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="power" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </AnimatedChart>
    </DashboardContainer>
  );
};

export default AnimatedDashboard;

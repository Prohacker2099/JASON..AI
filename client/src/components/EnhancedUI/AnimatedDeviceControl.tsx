import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Advanced animations
const pulseRing = keyframes`
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
`;

const energyFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const hologramFlicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
  75% { opacity: 0.9; }
`;

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Enhanced glassmorphism with holographic effects
const ControlContainer = styled(motion.div)`
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(139, 92, 246, 0.1) 50%, 
    rgba(236, 72, 153, 0.1) 100%);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 32px;
  padding: 3rem;
  margin: 2rem;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      transparent 30%, 
      rgba(59, 130, 246, 0.1) 50%, 
      transparent 70%);
    animation: ${energyFlow} 3s ease-in-out infinite;
  }
`;

const DeviceGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
`;

const HolographicCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 24px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s ease;
  
  &:hover {
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      transparent, 
      rgba(59, 130, 246, 0.1), 
      transparent 30%
    );
    animation: ${spinAnimation} 3s linear infinite;
    opacity: 0.5;
  }
`;

const ControlRing = styled(motion.div)`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg, 
    #3b82f6, 
    #8b5cf6, 
    #ec4899, 
    #f59e0b, 
    #3b82f6
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem auto;
  position: relative;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
  }
  
  &:hover {
    animation: ${pulseRing} 1.5s ease-in-out infinite;
  }
`;

interface StatusOrbProps {
  status: 'online' | 'offline';
}

const StatusOrb = styled(motion.div)<StatusOrbProps>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.status === 'online' 
    ? 'radial-gradient(circle, #10b981, #059669)' 
    : 'radial-gradient(circle, #ef4444, #dc2626)'};
  box-shadow: ${props => props.status === 'online'
    ? '0 0 20px #10b981, inset 0 0 10px rgba(255,255,255,0.3)'
    : '0 0 20px #ef4444, inset 0 0 10px rgba(255,255,255,0.3)'};
  animation: ${hologramFlicker} 2s ease-in-out infinite;
`;

const AnimatedSlider = styled(motion.input)`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: radial-gradient(circle, #3b82f6, #1e40af);
    cursor: pointer;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  }
`;

const CommandButton = styled(motion.button)`
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2), 
    rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 1rem 2rem;
  color: #e0e0e0;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    border-color: rgba(59, 130, 246, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  brightness?: number;
  temperature?: number;
  power?: number;
  lastUpdate: string;
}

interface AnimatedDeviceControlProps {
  devices: Device[];
  onDeviceControl: (deviceId: string, action: string, value?: any) => void;
}

const AnimatedDeviceControl: React.FC<AnimatedDeviceControlProps> = ({ devices, onDeviceControl }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [controlValue, setControlValue] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleControlAction = async (deviceId: string, action: string, value?: any) => {
    setIsAnimating(true);
    await onDeviceControl(deviceId, action, value);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const deviceCommands = {
    light: ['toggle', 'brightness', 'color', 'schedule'],
    thermostat: ['set_temperature', 'schedule', 'mode'],
    camera: ['record', 'snapshot', 'pan', 'zoom'],
    speaker: ['play', 'pause', 'volume', 'playlist'],
    car: ['start', 'lock', 'climate', 'location'],
    default: ['toggle', 'status', 'reset', 'update']
  };

  return (
    <ControlContainer
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2
        style={{
          color: '#e0e0e0',
          fontSize: '2.5rem',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: '3rem',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Holographic Device Control
      </motion.h2>

      <DeviceGrid>
        <AnimatePresence>
          {devices.map((device, index) => (
            <HolographicCard
              key={device.deviceId}
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ rotateY: 5, scale: 1.02 }}
              onClick={() => setSelectedDevice(device)}
            >
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#e0e0e0', fontSize: '1.5rem', margin: 0 }}>{device.name}</h3>
                  <StatusOrb status={device.status} />
                </div>
                
                <p style={{ color: '#9ca3af', margin: '0.5rem 0' }}>Type: {device.type}</p>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0' }}>Status: {device.status}</p>
                
                {device.brightness && (
                  <div style={{ margin: '1rem 0' }}>
                    <p style={{ color: '#e0e0e0', marginBottom: '0.5rem' }}>Brightness: {device.brightness}%</p>
                    <AnimatedSlider
                      type="range"
                      min="0"
                      max="100"
                      value={device.brightness}
                      onChange={(e) => handleControlAction(device.deviceId, 'set_brightness', parseInt(e.target.value))}
                    />
                  </div>
                )}
                
                {device.temperature && (
                  <p style={{ color: '#06b6d4' }}>🌡️ {device.temperature}°C</p>
                )}
                
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {(deviceCommands[device.type as keyof typeof deviceCommands] || deviceCommands.default).map((command) => (
                    <CommandButton
                      key={command}
                      onClick={() => handleControlAction(device.deviceId, command)}
                      disabled={isAnimating}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {command.replace('_', ' ')}
                    </CommandButton>
                  ))}
                </div>
              </div>
            </HolographicCard>
          ))}
        </AnimatePresence>
      </DeviceGrid>

      {selectedDevice && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '24px',
            padding: '2rem',
            zIndex: 1000,
            minWidth: '400px'
          }}
        >
          <h3 style={{ color: '#e0e0e0', marginBottom: '1rem' }}>{selectedDevice.name} Controls</h3>
          <ControlRing
            animate={{ rotate: isAnimating ? 360 : 0 }}
            transition={{ duration: 1 }}
          >
            <div style={{ color: '#e0e0e0', fontSize: '1.5rem', fontWeight: 'bold', zIndex: 10 }}>
              {selectedDevice.status === 'online' ? 'ON' : 'OFF'}
            </div>
          </ControlRing>
          <button
            onClick={() => setSelectedDevice(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </motion.div>
      )}
    </ControlContainer>
  );
};

export default AnimatedDeviceControl;

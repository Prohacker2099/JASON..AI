import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Box, Sphere, Cylinder } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const DeviceControl3D: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>('living-room');
  const [devices, setDevices] = useState([
    { id: 'light1', name: 'Smart Light 1', type: 'light', room: 'living-room', position: [2, 1, 0], status: 'on', brightness: 80, color: '#ffff88' },
    { id: 'light2', name: 'Smart Light 2', type: 'light', room: 'living-room', position: [-2, 1, 0], status: 'off', brightness: 0, color: '#ffffff' },
    { id: 'thermostat', name: 'Smart Thermostat', type: 'hvac', room: 'living-room', position: [0, 0.5, -3], status: 'on', temperature: 22, targetTemp: 23 },
    { id: 'plug1', name: 'Smart Plug 1', type: 'plug', room: 'living-room', position: [3, 0, 2], status: 'on', power: 45 },
    { id: 'plug2', name: 'Smart Plug 2', type: 'plug', room: 'living-room', position: [-3, 0, 2], status: 'off', power: 0 },
    { id: 'speaker', name: 'Smart Speaker', type: 'media', room: 'living-room', position: [0, 0.8, 3], status: 'on', volume: 60 },
    { id: 'kitchen-light', name: 'Kitchen Light', type: 'light', room: 'kitchen', position: [0, 1.5, 0], status: 'on', brightness: 90, color: '#ffffff' },
    { id: 'fridge', name: 'Smart Fridge', type: 'appliance', room: 'kitchen', position: [-2, 1, -2], status: 'on', temperature: 4 },
    { id: 'bedroom-light', name: 'Bedroom Light', type: 'light', room: 'bedroom', position: [0, 1, 0], status: 'off', brightness: 0, color: '#ffaa88' }
  ]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const rooms = [
    { id: 'living-room', name: 'Living Room', color: '#00ffff' },
    { id: 'kitchen', name: 'Kitchen', color: '#ffff00' },
    { id: 'bedroom', name: 'Bedroom', color: '#ff00ff' },
    { id: 'bathroom', name: 'Bathroom', color: '#00ff00' }
  ];

  const toggleDevice = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: device.status === 'on' ? 'off' : 'on' }
        : device
    ));
  };

  const updateDeviceProperty = (deviceId: string, property: string, value: any) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, [property]: value }
        : device
    ));
  };

  const roomDevices = devices.filter(device => device.room === selectedRoom);

  return (
    <motion.div
      className="device-control-3d"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      <div className="control-header">
        <h2 className="control-title">3D Device Control</h2>
        <div className="room-selector">
          {rooms.map(room => (
            <motion.button
              key={room.id}
              className={`room-btn ${selectedRoom === room.id ? 'active' : ''}`}
              onClick={() => setSelectedRoom(room.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ '--room-color': room.color } as React.CSSProperties}
            >
              {room.name}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="control-3d-container">
        <Canvas camera={{ position: [8, 6, 8], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <RoomEnvironment room={selectedRoom} />
          <DeviceNodes 
            devices={roomDevices} 
            onDeviceSelect={setSelectedDevice}
            onDeviceToggle={toggleDevice}
          />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>

      <div className="control-sidebar">
        <DeviceList 
          devices={roomDevices}
          selectedDevice={selectedDevice}
          onDeviceSelect={setSelectedDevice}
          onDeviceToggle={toggleDevice}
          onDeviceUpdate={updateDeviceProperty}
        />
      </div>
    </motion.div>
  );
};

const RoomEnvironment: React.FC<{ room: string }> = ({ room }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  const getRoomColor = () => {
    switch (room) {
      case 'living-room': return '#001133';
      case 'kitchen': return '#331100';
      case 'bedroom': return '#330011';
      case 'bathroom': return '#003311';
      default: return '#111111';
    }
  };

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color={getRoomColor()} />
      </mesh>
      
      {/* Walls */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[10, 4, 0.2]} />
        <meshStandardMaterial color={getRoomColor()} transparent opacity={0.3} />
      </mesh>
      
      <mesh position={[-5, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 10]} />
        <meshStandardMaterial color={getRoomColor()} transparent opacity={0.3} />
      </mesh>
      
      <mesh position={[5, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 10]} />
        <meshStandardMaterial color={getRoomColor()} transparent opacity={0.3} />
      </mesh>

      {/* Room-specific furniture */}
      {room === 'living-room' && <LivingRoomFurniture />}
      {room === 'kitchen' && <KitchenFurniture />}
      {room === 'bedroom' && <BedroomFurniture />}
    </group>
  );
};

const LivingRoomFurniture: React.FC = () => (
  <group>
    {/* Sofa */}
    <mesh position={[0, 0.3, 1]}>
      <boxGeometry args={[3, 0.6, 1]} />
      <meshStandardMaterial color="#444444" />
    </mesh>
    {/* Coffee Table */}
    <mesh position={[0, 0.2, -0.5]}>
      <boxGeometry args={[1.5, 0.4, 0.8]} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
  </group>
);

const KitchenFurniture: React.FC = () => (
  <group>
    {/* Counter */}
    <mesh position={[2, 0.4, -2]}>
      <boxGeometry args={[4, 0.8, 1]} />
      <meshStandardMaterial color="#CCCCCC" />
    </mesh>
    {/* Island */}
    <mesh position={[0, 0.4, 0]}>
      <boxGeometry args={[2, 0.8, 1]} />
      <meshStandardMaterial color="#CCCCCC" />
    </mesh>
  </group>
);

const BedroomFurniture: React.FC = () => (
  <group>
    {/* Bed */}
    <mesh position={[0, 0.3, 1]}>
      <boxGeometry args={[2, 0.6, 3]} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
    {/* Nightstand */}
    <mesh position={[1.5, 0.3, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#654321" />
    </mesh>
  </group>
);

const DeviceNodes: React.FC<{
  devices: any[];
  onDeviceSelect: (deviceId: string) => void;
  onDeviceToggle: (deviceId: string) => void;
}> = ({ devices, onDeviceSelect, onDeviceToggle }) => {
  return (
    <group>
      {devices.map(device => (
        <DeviceNode
          key={device.id}
          device={device}
          onSelect={() => onDeviceSelect(device.id)}
          onToggle={() => onDeviceToggle(device.id)}
        />
      ))}
    </group>
  );
};

const DeviceNode: React.FC<{
  device: any;
  onSelect: () => void;
  onToggle: () => void;
}> = ({ device, onSelect, onToggle }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (device.status === 'on') {
        meshRef.current.rotation.y += 0.01;
      }
      
      const scale = hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const getDeviceGeometry = () => {
    switch (device.type) {
      case 'light':
        return <Sphere args={[0.3]} />;
      case 'hvac':
        return <Box args={[0.6, 0.4, 0.2]} />;
      case 'plug':
        return <Box args={[0.2, 0.2, 0.2]} />;
      case 'media':
        return <Cylinder args={[0.3, 0.3, 0.4]} />;
      case 'appliance':
        return <Box args={[0.8, 1.2, 0.6]} />;
      default:
        return <Box args={[0.3, 0.3, 0.3]} />;
    }
  };

  const getDeviceColor = () => {
    if (device.status === 'off') return '#333333';
    
    switch (device.type) {
      case 'light':
        return device.color || '#ffff88';
      case 'hvac':
        return '#0088ff';
      case 'plug':
        return device.status === 'on' ? '#00ff00' : '#333333';
      case 'media':
        return '#ff00ff';
      case 'appliance':
        return '#ffffff';
      default:
        return '#888888';
    }
  };

  return (
    <group position={device.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (e.detail === 2) { // Double click
            onToggle();
          } else {
            onSelect();
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {getDeviceGeometry()}
        <meshStandardMaterial
          color={getDeviceColor()}
          emissive={getDeviceColor()}
          emissiveIntensity={device.status === 'on' ? 0.3 : 0.1}
          transparent
          opacity={device.status === 'on' ? 1 : 0.5}
        />
      </mesh>
      
      {/* Device Status Indicator */}
      {device.status === 'on' && (
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
      
      {hovered && (
        <Html distanceFactor={8}>
          <div className="device-3d-tooltip">
            <div className="tooltip-name">{device.name}</div>
            <div className="tooltip-status">{device.status.toUpperCase()}</div>
            {device.type === 'light' && device.status === 'on' && (
              <div className="tooltip-detail">Brightness: {device.brightness}%</div>
            )}
            {device.type === 'hvac' && (
              <div className="tooltip-detail">{device.temperature}°C → {device.targetTemp}°C</div>
            )}
            {device.type === 'plug' && device.status === 'on' && (
              <div className="tooltip-detail">Power: {device.power}W</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

const DeviceList: React.FC<{
  devices: any[];
  selectedDevice: string | null;
  onDeviceSelect: (deviceId: string) => void;
  onDeviceToggle: (deviceId: string) => void;
  onDeviceUpdate: (deviceId: string, property: string, value: any) => void;
}> = ({ devices, selectedDevice, onDeviceSelect, onDeviceToggle, onDeviceUpdate }) => {
  return (
    <div className="device-list">
      <h3>Room Devices</h3>
      
      <div className="devices-grid">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            isSelected={selectedDevice === device.id}
            onSelect={() => onDeviceSelect(device.id)}
            onToggle={() => onDeviceToggle(device.id)}
            onUpdate={onDeviceUpdate}
          />
        ))}
      </div>
      
      <div className="room-controls">
        <button className="control-btn primary full-width">
          💡 All Lights On
        </button>
        <button className="control-btn secondary full-width">
          🌙 Night Mode
        </button>
        <button className="control-btn danger full-width">
          ⚡ Emergency Off
        </button>
      </div>
    </div>
  );
};

const DeviceCard: React.FC<{
  device: any;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onUpdate: (deviceId: string, property: string, value: any) => void;
}> = ({ device, isSelected, onSelect, onToggle, onUpdate }) => {
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'light': return '💡';
      case 'hvac': return '🌡️';
      case 'plug': return '🔌';
      case 'media': return '🔊';
      case 'appliance': return '🏠';
      default: return '⚡';
    }
  };

  return (
    <motion.div
      className={`device-card ${isSelected ? 'selected' : ''} ${device.status}`}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="device-header">
        <div className="device-icon">{getDeviceIcon()}</div>
        <div className="device-info">
          <div className="device-name">{device.name}</div>
          <div className="device-type">{device.type.toUpperCase()}</div>
        </div>
        <button
          className={`toggle-btn ${device.status}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {device.status === 'on' ? '🟢' : '🔴'}
        </button>
      </div>
      
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="device-controls"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {device.type === 'light' && device.status === 'on' && (
              <div className="control-group">
                <label>Brightness: {device.brightness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={device.brightness}
                  onChange={(e) => onUpdate(device.id, 'brightness', parseInt(e.target.value))}
                  className="slider"
                />
              </div>
            )}
            
            {device.type === 'hvac' && (
              <div className="control-group">
                <label>Target: {device.targetTemp}°C</label>
                <input
                  type="range"
                  min="16"
                  max="30"
                  value={device.targetTemp}
                  onChange={(e) => onUpdate(device.id, 'targetTemp', parseInt(e.target.value))}
                  className="slider"
                />
              </div>
            )}
            
            {device.type === 'media' && device.status === 'on' && (
              <div className="control-group">
                <label>Volume: {device.volume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={device.volume}
                  onChange={(e) => onUpdate(device.id, 'volume', parseInt(e.target.value))}
                  className="slider"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DeviceControl3D;

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, Box, Sphere, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const ARInterface: React.FC = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [handTracking, setHandTracking] = useState(false);
  const [spatialMapping, setSpatialMapping] = useState(false);
  const [arDevices, setArDevices] = useState([
    { id: 'ar-light1', name: 'AR Light Control', position: [2, 1.5, -1], type: 'light', active: true },
    { id: 'ar-temp', name: 'AR Temperature', position: [-2, 1, -1], type: 'sensor', active: true },
    { id: 'ar-energy', name: 'AR Energy Flow', position: [0, 2, -2], type: 'energy', active: true },
    { id: 'ar-security', name: 'AR Security Panel', position: [3, 0.5, 0], type: 'security', active: false }
  ]);

  useEffect(() => {
    // Check for WebXR support
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setArSupported(supported);
      });
    }
  }, []);

  const startARSession = async () => {
    if (!arSupported) {
      alert('AR not supported on this device');
      return;
    }

    try {
      setIsARActive(true);
      setSpatialMapping(true);
      setHandTracking(true);
    } catch (error) {
      console.error('Failed to start AR session:', error);
      setIsARActive(false);
    }
  };

  const stopARSession = () => {
    setIsARActive(false);
    setSpatialMapping(false);
    setHandTracking(false);
  };

  return (
    <motion.div
      className="ar-interface"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      <div className="ar-header">
        <h2 className="ar-title">Augmented Reality Interface</h2>
        <div className="ar-status">
          <div className={`status-indicator ${arSupported ? 'supported' : 'unsupported'}`}>
            AR {arSupported ? 'Supported' : 'Not Supported'}
          </div>
          <div className={`status-indicator ${isARActive ? 'active' : 'inactive'}`}>
            AR {isARActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className="ar-controls">
        <motion.button
          className={`ar-btn primary ${isARActive ? 'active' : ''}`}
          onClick={isARActive ? stopARSession : startARSession}
          disabled={!arSupported}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isARActive ? '🛑 Stop AR' : '🥽 Start AR'}
        </motion.button>
        
        <div className="ar-features">
          <label className="feature-toggle">
            <input 
              type="checkbox" 
              checked={handTracking} 
              onChange={(e) => setHandTracking(e.target.checked)}
              disabled={!isARActive}
            />
            <span>👋 Hand Tracking</span>
          </label>
          
          <label className="feature-toggle">
            <input 
              type="checkbox" 
              checked={spatialMapping} 
              onChange={(e) => setSpatialMapping(e.target.checked)}
              disabled={!isARActive}
            />
            <span>🗺️ Spatial Mapping</span>
          </label>
        </div>
      </div>

      <div className="ar-preview-container">
        <Canvas camera={{ position: [0, 1.6, 3], fov: 75 }}>
          <Suspense fallback={null}>
            <ARScene 
              isActive={isARActive}
              devices={arDevices}
              handTracking={handTracking}
              spatialMapping={spatialMapping}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="ar-sidebar">
        <ARDevicePanel devices={arDevices} setDevices={setArDevices} />
        <ARGestureGuide />
        <ARSettings />
      </div>
    </motion.div>
  );
};

const ARScene: React.FC<{
  isActive: boolean;
  devices: any[];
  handTracking: boolean;
  spatialMapping: boolean;
}> = ({ isActive, devices, handTracking, spatialMapping }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      
      {/* AR Environment */}
      <AREnvironment spatialMapping={spatialMapping} />
      
      {/* AR Devices */}
      {devices.map(device => (
        <ARDevice key={device.id} device={device} isActive={isActive} />
      ))}
      
      {/* Hand Tracking Visualization */}
      {handTracking && <HandTrackingVisualization />}
      
      {/* AR Grid */}
      {isActive && <ARGrid />}
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </group>
  );
};

const AREnvironment: React.FC<{ spatialMapping: boolean }> = ({ spatialMapping }) => {
  return (
    <group>
      {/* Floor plane */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial 
          color="#222222" 
          transparent 
          opacity={spatialMapping ? 0.3 : 0.1}
          wireframe={spatialMapping}
        />
      </mesh>
      
      {spatialMapping && (
        <>
          {/* Spatial mapping points */}
          <SpatialMappingPoints />
          
          {/* Room boundaries */}
          <mesh position={[0, 1, -3]} rotation={[0, 0, 0]}>
            <planeGeometry args={[8, 2]} />
            <meshStandardMaterial color="#333333" transparent opacity={0.2} wireframe />
          </mesh>
        </>
      )}
    </group>
  );
};

const SpatialMappingPoints: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
    }
  });

  const positions = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#00ffff" size={0.02} />
    </points>
  );
};

const ARDevice: React.FC<{ device: any; isActive: boolean }> = ({ device, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y += 0.01;
      const scale = hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const getDeviceColor = () => {
    switch (device.type) {
      case 'light': return '#ffff00';
      case 'sensor': return '#00ff00';
      case 'energy': return '#00ffff';
      case 'security': return '#ff0000';
      default: return '#ffffff';
    }
  };

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'light': return '💡';
      case 'sensor': return '🌡️';
      case 'energy': return '⚡';
      case 'security': return '🔒';
      default: return '📱';
    }
  };

  return (
    <group position={device.position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={device.active}
      >
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial
          color={getDeviceColor()}
          emissive={getDeviceColor()}
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* AR UI Panel */}
      {device.active && (
        <Html distanceFactor={6}>
          <div className="ar-device-panel">
            <div className="ar-panel-header">
              <span className="ar-device-icon">{getDeviceIcon()}</span>
              <span className="ar-device-name">{device.name}</span>
            </div>
            <div className="ar-panel-content">
              <ARDeviceControls device={device} />
            </div>
          </div>
        </Html>
      )}
      
      {/* Holographic effect */}
      {isActive && device.active && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshBasicMaterial
            color={getDeviceColor()}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
};

const ARDeviceControls: React.FC<{ device: any }> = ({ device }) => {
  switch (device.type) {
    case 'light':
      return (
        <div className="ar-controls">
          <button className="ar-control-btn">Toggle</button>
          <input type="range" min="0" max="100" defaultValue="80" className="ar-slider" />
        </div>
      );
    case 'sensor':
      return (
        <div className="ar-sensor-data">
          <div className="sensor-reading">22°C</div>
          <div className="sensor-status">Normal</div>
        </div>
      );
    case 'energy':
      return (
        <div className="ar-energy-display">
          <div className="energy-value">2.4 kW</div>
          <div className="energy-flow">↗️ Consuming</div>
        </div>
      );
    case 'security':
      return (
        <div className="ar-security-panel">
          <button className="ar-control-btn danger">Arm</button>
          <div className="security-status">Disarmed</div>
        </div>
      );
    default:
      return <div>Device Controls</div>;
  }
};

const HandTrackingVisualization: React.FC = () => {
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (leftHandRef.current) {
      leftHandRef.current.position.x = -1 + Math.sin(state.clock.elapsedTime) * 0.3;
      leftHandRef.current.position.y = 1.2 + Math.cos(state.clock.elapsedTime * 1.5) * 0.2;
    }
    
    if (rightHandRef.current) {
      rightHandRef.current.position.x = 1 + Math.sin(state.clock.elapsedTime + Math.PI) * 0.3;
      rightHandRef.current.position.y = 1.2 + Math.cos(state.clock.elapsedTime * 1.5 + Math.PI) * 0.2;
    }
  });

  return (
    <group>
      {/* Left Hand */}
      <group ref={leftHandRef} position={[-1, 1.2, 1]}>
        <mesh>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
        {/* Fingers */}
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[i * 0.02 - 0.04, 0.08, 0]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="#ff00ff" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Right Hand */}
      <group ref={rightHandRef} position={[1, 1.2, 1]}>
        <mesh>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        {/* Fingers */}
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[i * 0.02 - 0.04, 0.08, 0]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const ARGrid: React.FC = () => {
  return (
    <group>
      {/* Grid lines */}
      {[...Array(21)].map((_, i) => (
        <group key={i}>
          <mesh position={[(i - 10) * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.002, 0.002, 10]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, 0, (i - 10) * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 10]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const ARDevicePanel: React.FC<{ 
  devices: any[]; 
  setDevices: (devices: any[]) => void; 
}> = ({ devices, setDevices }) => {
  const toggleDevice = (deviceId: string) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, active: !device.active }
        : device
    ));
  };

  return (
    <div className="ar-device-panel-sidebar">
      <h3>AR Devices</h3>
      <div className="ar-devices-list">
        {devices.map(device => (
          <motion.div
            key={device.id}
            className={`ar-device-item ${device.active ? 'active' : 'inactive'}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="device-info">
              <div className="device-name">{device.name}</div>
              <div className="device-type">{device.type}</div>
            </div>
            <button
              className={`toggle-btn ${device.active ? 'on' : 'off'}`}
              onClick={() => toggleDevice(device.id)}
            >
              {device.active ? '👁️' : '👁️‍🗨️'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ARGestureGuide: React.FC = () => {
  const gestures = [
    { gesture: '👋', action: 'Wave to activate', description: 'Wave your hand to wake up AR interface' },
    { gesture: '👆', action: 'Point to select', description: 'Point at devices to select them' },
    { gesture: '✊', action: 'Grab to move', description: 'Make a fist to grab and move objects' },
    { gesture: '🤏', action: 'Pinch to scale', description: 'Pinch to resize AR elements' },
    { gesture: '✋', action: 'Palm to dismiss', description: 'Show palm to close panels' }
  ];

  return (
    <div className="ar-gesture-guide">
      <h3>Gesture Controls</h3>
      <div className="gestures-list">
        {gestures.map((item, index) => (
          <motion.div
            key={index}
            className="gesture-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="gesture-icon">{item.gesture}</div>
            <div className="gesture-info">
              <div className="gesture-action">{item.action}</div>
              <div className="gesture-description">{item.description}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ARSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    brightness: 80,
    contrast: 70,
    trackingAccuracy: 90,
    renderQuality: 'high'
  });

  return (
    <div className="ar-settings">
      <h3>AR Settings</h3>
      
      <div className="setting-group">
        <label>Brightness: {settings.brightness}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.brightness}
          onChange={(e) => setSettings(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
          className="setting-slider"
        />
      </div>
      
      <div className="setting-group">
        <label>Contrast: {settings.contrast}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.contrast}
          onChange={(e) => setSettings(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
          className="setting-slider"
        />
      </div>
      
      <div className="setting-group">
        <label>Tracking Accuracy: {settings.trackingAccuracy}%</label>
        <input
          type="range"
          min="50"
          max="100"
          value={settings.trackingAccuracy}
          onChange={(e) => setSettings(prev => ({ ...prev, trackingAccuracy: parseInt(e.target.value) }))}
          className="setting-slider"
        />
      </div>
      
      <div className="setting-group">
        <label>Render Quality</label>
        <select
          value={settings.renderQuality}
          onChange={(e) => setSettings(prev => ({ ...prev, renderQuality: e.target.value }))}
          className="setting-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>
    </div>
  );
};

export default ARInterface;

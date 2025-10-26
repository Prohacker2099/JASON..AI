import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface EnergyVisualizationProps {
  data: any[];
}

const EnergyVisualization: React.FC<EnergyVisualizationProps> = ({ data }) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [energyFlow, setEnergyFlow] = useState({
    consumption: 2.4,
    production: 0.8,
    storage: 15.6,
    grid: 1.6
  });

  return (
    <motion.div
      className="energy-visualization"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      <div className="energy-header">
        <h2 className="energy-title">Energy Flow Visualization</h2>
        <div className="energy-controls">
          <button className="view-toggle active">3D View</button>
          <button className="view-toggle">Chart View</button>
          <button className="view-toggle">Map View</button>
        </div>
      </div>

      <div className="energy-3d-container">
        <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <EnergyFlowVisualization energyFlow={energyFlow} />
          <DeviceNodes onDeviceSelect={setSelectedDevice} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>

      <div className="energy-sidebar">
        <EnergyMetrics energyFlow={energyFlow} />
        <DeviceDetails selectedDevice={selectedDevice} />
        <EnergyControls />
      </div>
    </motion.div>
  );
};

const EnergyFlowVisualization: React.FC<{ energyFlow: any }> = ({ energyFlow }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Energy Hub */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#0066ff" 
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Energy Flow Lines */}
      <EnergyFlowLines energyFlow={energyFlow} />
      
      {/* Energy Sources */}
      <EnergySource position={[5, 2, 0]} type="solar" value={energyFlow.production} />
      <EnergySource position={[-5, 2, 0]} type="grid" value={energyFlow.grid} />
      <EnergySource position={[0, -3, 5]} type="battery" value={energyFlow.storage} />
      <EnergySource position={[0, 3, -5]} type="consumption" value={energyFlow.consumption} />
    </group>
  );
};

const EnergyFlowLines: React.FC<{ energyFlow: any }> = ({ energyFlow }) => {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial;
          material.opacity = 0.5 + 0.3 * Math.sin(state.clock.elapsedTime * 2 + index);
        }
      });
    }
  });

  const createFlowLine = (start: THREE.Vector3, end: THREE.Vector3, color: string) => {
    const points = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      // Add some curve to the line
      point.y += Math.sin(t * Math.PI) * 0.5;
      points.push(point);
    }
    
    return (
      <line key={`${start.x}-${end.x}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </line>
    );
  };

  return (
    <group ref={linesRef}>
      {createFlowLine(new THREE.Vector3(5, 2, 0), new THREE.Vector3(0, 0, 0), '#ffff00')}
      {createFlowLine(new THREE.Vector3(-5, 2, 0), new THREE.Vector3(0, 0, 0), '#ff6600')}
      {createFlowLine(new THREE.Vector3(0, -3, 5), new THREE.Vector3(0, 0, 0), '#00ff00')}
      {createFlowLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3, -5), '#ff0066')}
    </group>
  );
};

const EnergySource: React.FC<{ 
  position: [number, number, number]; 
  type: string; 
  value: number; 
}> = ({ position, type, value }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.scale.setScalar(1 + 0.1 * Math.sin(state.clock.elapsedTime * 2));
    }
  });

  const getColor = () => {
    switch (type) {
      case 'solar': return '#ffff00';
      case 'grid': return '#ff6600';
      case 'battery': return '#00ff00';
      case 'consumption': return '#ff0066';
      default: return '#ffffff';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'solar': return '☀️';
      case 'grid': return '🏭';
      case 'battery': return '🔋';
      case 'consumption': return '🏠';
      default: return '⚡';
    }
  };

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={0.2}
        />
      </mesh>
      <Html distanceFactor={10}>
        <div className="energy-source-label">
          <div className="source-icon">{getIcon()}</div>
          <div className="source-value">{value.toFixed(1)} kW</div>
          <div className="source-type">{type.toUpperCase()}</div>
        </div>
      </Html>
    </group>
  );
};

const DeviceNodes: React.FC<{ onDeviceSelect: (device: string) => void }> = ({ onDeviceSelect }) => {
  const devices = [
    { id: 'light1', name: 'Living Room', position: [3, 1, 3], power: 0.06, status: 'on' },
    { id: 'light2', name: 'Kitchen', position: [-3, 1, 3], power: 0.08, status: 'on' },
    { id: 'hvac', name: 'HVAC System', position: [0, 2, -3], power: 1.2, status: 'on' },
    { id: 'fridge', name: 'Refrigerator', position: [4, 0, -2], power: 0.15, status: 'on' },
    { id: 'washer', name: 'Washing Machine', position: [-4, 0, -2], power: 0.45, status: 'off' },
    { id: 'tv', name: 'Smart TV', position: [2, 1, -4], power: 0.12, status: 'on' }
  ];

  return (
    <group>
      {devices.map((device) => (
        <DeviceNode
          key={device.id}
          device={device}
          onClick={() => onDeviceSelect(device.id)}
        />
      ))}
    </group>
  );
};

const DeviceNode: React.FC<{ 
  device: any; 
  onClick: () => void; 
}> = ({ device, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      if (hovered) {
        meshRef.current.scale.setScalar(1.2);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const getDeviceColor = () => {
    return device.status === 'on' ? '#00ff00' : '#666666';
  };

  return (
    <group position={device.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial 
          color={getDeviceColor()} 
          emissive={getDeviceColor()} 
          emissiveIntensity={device.status === 'on' ? 0.3 : 0.1}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={8}>
          <div className="device-tooltip">
            <div className="device-name">{device.name}</div>
            <div className="device-power">{device.power} kW</div>
            <div className="device-status">{device.status.toUpperCase()}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

const EnergyMetrics: React.FC<{ energyFlow: any }> = ({ energyFlow }) => {
  return (
    <div className="energy-metrics">
      <h3>Real-Time Metrics</h3>
      <div className="metric-grid">
        <div className="metric-item consumption">
          <div className="metric-icon">🏠</div>
          <div className="metric-data">
            <div className="metric-value">{energyFlow.consumption} kW</div>
            <div className="metric-label">Consumption</div>
          </div>
        </div>
        
        <div className="metric-item production">
          <div className="metric-icon">☀️</div>
          <div className="metric-data">
            <div className="metric-value">{energyFlow.production} kW</div>
            <div className="metric-label">Solar Production</div>
          </div>
        </div>
        
        <div className="metric-item storage">
          <div className="metric-icon">🔋</div>
          <div className="metric-data">
            <div className="metric-value">{energyFlow.storage} kWh</div>
            <div className="metric-label">Battery Storage</div>
          </div>
        </div>
        
        <div className="metric-item grid">
          <div className="metric-icon">🏭</div>
          <div className="metric-data">
            <div className="metric-value">{energyFlow.grid} kW</div>
            <div className="metric-label">Grid Import</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeviceDetails: React.FC<{ selectedDevice: string | null }> = ({ selectedDevice }) => {
  if (!selectedDevice) {
    return (
      <div className="device-details">
        <h3>Device Details</h3>
        <p>Select a device to view details</p>
      </div>
    );
  }

  return (
    <div className="device-details">
      <h3>Device: {selectedDevice}</h3>
      <div className="device-info">
        <div className="info-row">
          <span>Status:</span>
          <span className="status-on">Online</span>
        </div>
        <div className="info-row">
          <span>Power:</span>
          <span>0.12 kW</span>
        </div>
        <div className="info-row">
          <span>Today:</span>
          <span>2.8 kWh</span>
        </div>
        <div className="info-row">
          <span>Efficiency:</span>
          <span>94%</span>
        </div>
      </div>
      
      <div className="device-controls">
        <button className="control-btn primary">Toggle</button>
        <button className="control-btn secondary">Schedule</button>
        <button className="control-btn secondary">Settings</button>
      </div>
    </div>
  );
};

const EnergyControls: React.FC = () => {
  return (
    <div className="energy-controls-panel">
      <h3>Quick Controls</h3>
      
      <div className="control-section">
        <h4>Optimization</h4>
        <button className="control-btn primary full-width">
          ⚡ Optimize Now
        </button>
        <button className="control-btn secondary full-width">
          📊 Generate Report
        </button>
      </div>
      
      <div className="control-section">
        <h4>Emergency</h4>
        <button className="control-btn danger full-width">
          🚨 Emergency Shutdown
        </button>
      </div>
      
      <div className="control-section">
        <h4>Automation</h4>
        <label className="toggle-switch">
          <input type="checkbox" defaultChecked />
          <span className="slider">Auto Optimization</span>
        </label>
        <label className="toggle-switch">
          <input type="checkbox" defaultChecked />
          <span className="slider">Load Balancing</span>
        </label>
      </div>
    </div>
  );
};

export default EnergyVisualization;

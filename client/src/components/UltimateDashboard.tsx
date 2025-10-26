import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text3D, Float } from '@react-three/drei';
import * as THREE from 'three';

interface UltimateDashboardProps {
  energyData: any[];
  aiPredictions?: any[];
  quantumState: string;
}

const UltimateDashboard: React.FC<UltimateDashboardProps> = ({ 
  energyData, 
  aiPredictions = [], 
  quantumState 
}) => {
  const [systemStatus, setSystemStatus] = useState({
    cpu: 45,
    memory: 67,
    network: 89,
    devices: 12,
    uptime: '2d 14h 32m'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(50, Math.min(100, prev.network + (Math.random() - 0.5) * 5))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="ultimate-dashboard"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6 }}
    >
      <div className="dashboard-grid">
        <HolographicCard title="System Status" className="status-card">
          <SystemStatusDisplay status={systemStatus} />
        </HolographicCard>

        <HolographicCard title="Energy Flow" className="energy-card">
          <RealTimeEnergyFlow data={energyData} />
        </HolographicCard>

        <HolographicCard title="AI Predictions" className="ai-card">
          <AIPredictionDisplay predictions={aiPredictions} />
        </HolographicCard>

        <HolographicCard title="Quantum State" className="quantum-card">
          <QuantumStateDisplay state={quantumState} />
        </HolographicCard>

        <HolographicCard title="Device Network" className="network-card">
          <DeviceNetworkVisualization />
        </HolographicCard>

        <HolographicCard title="Performance" className="performance-card">
          <PerformanceMetrics />
        </HolographicCard>
      </div>
    </motion.div>
  );
};

const HolographicCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => {
  return (
    <motion.div
      className={`holographic-card ${className}`}
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 255, 255, 0.3)',
        borderColor: '#00ffff'
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="card-glow" />
      </div>
      <div className="card-content">
        {children}
      </div>
      <div className="card-border-animation" />
    </motion.div>
  );
};

const SystemStatusDisplay: React.FC<{ status: any }> = ({ status }) => {
  return (
    <div className="system-status">
      <div className="status-grid">
        <StatusMeter label="CPU" value={status.cpu} color="#00ffff" />
        <StatusMeter label="Memory" value={status.memory} color="#ffff00" />
        <StatusMeter label="Network" value={status.network} color="#00ff00" />
      </div>
      
      <div className="status-info">
        <div className="info-item">
          <span className="label">Active Devices:</span>
          <motion.span 
            className="value"
            animate={{ color: ['#00ffff', '#ffffff', '#00ffff'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {status.devices}
          </motion.span>
        </div>
        <div className="info-item">
          <span className="label">Uptime:</span>
          <span className="value">{status.uptime}</span>
        </div>
      </div>
    </div>
  );
};

const StatusMeter: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;

  return (
    <div className="status-meter">
      <svg className="meter-svg" width="100" height="100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={circumference * 0.25}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{
            filter: `drop-shadow(0 0 10px ${color})`
          }}
        />
      </svg>
      <div className="meter-content">
        <div className="meter-value" style={{ color }}>{value}%</div>
        <div className="meter-label">{label}</div>
      </div>
    </div>
  );
};

const RealTimeEnergyFlow: React.FC<{ data: any[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPower, setCurrentPower] = useState(2.4);
  const [dailyUsage, setDailyUsage] = useState(48.7);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const time = Date.now() * 0.001;
      
      // Draw flowing energy particles
      for (let i = 0; i < 50; i++) {
        const x = (i * 10 + time * 50) % canvas.width;
        const y = canvas.height / 2 + Math.sin(time + i * 0.1) * 20;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${180 + Math.sin(time + i) * 60}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
      }
      
      // Draw energy wave
      ctx.beginPath();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
      
      for (let x = 0; x < canvas.width; x += 2) {
        const y = canvas.height / 2 + Math.sin((x + time * 100) * 0.02) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPower(prev => Math.max(0.5, Math.min(5.0, prev + (Math.random() - 0.5) * 0.5)));
      setDailyUsage(prev => prev + Math.random() * 0.1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="energy-flow">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={200}
        className="energy-canvas"
      />
      <div className="energy-stats">
        <div className="stat">
          <span className="stat-label">Current:</span>
          <span className="stat-value">{currentPower.toFixed(1)} kW</span>
        </div>
        <div className="stat">
          <span className="stat-label">Today:</span>
          <span className="stat-value">{dailyUsage.toFixed(1)} kWh</span>
        </div>
      </div>
    </div>
  );
};

const AIPredictionDisplay: React.FC<{ predictions: any[] }> = ({ predictions }) => {
  const [currentPredictions, setCurrentPredictions] = useState([
    { label: 'Energy Peak', value: '18:30 - 19:45' },
    { label: 'Optimization', value: '15% savings' },
    { label: 'Maintenance', value: 'Device #3 in 5 days' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const savings = Math.floor(Math.random() * 20 + 10);
      const days = Math.floor(Math.random() * 10 + 1);
      setCurrentPredictions([
        { label: 'Energy Peak', value: '18:30 - 19:45' },
        { label: 'Optimization', value: `${savings}% savings` },
        { label: 'Maintenance', value: `Device #3 in ${days} days` }
      ]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-predictions">
      <div className="prediction-brain">
        <motion.div
          className="brain-core"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 360]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🧠
        </motion.div>
        <div className="neural-network">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="neural-node"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="prediction-list">
        {currentPredictions.map((prediction, index) => (
          <motion.div
            key={index}
            className="prediction-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <span className="prediction-label">{prediction.label}:</span>
            <span className="prediction-value">{prediction.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const QuantumStateDisplay: React.FC<{ state: string }> = ({ state }) => {
  return (
    <div className="quantum-display">
      <div className="quantum-visualization">
        <motion.div
          className="quantum-sphere"
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 360],
            scale: state === 'superposition' ? [1, 1.3, 1] : [1]
          }}
          transition={{
            duration: state === 'superposition' ? 2 : 4,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="sphere-inner">
            {state === 'superposition' && '⚛️'}
            {state === 'collapsed' && '🔬'}
            {state === 'entangled' && '🔗'}
          </div>
        </motion.div>
        
        <div className="quantum-particles">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="quantum-particle"
              animate={{
                x: Math.cos(i * 30 * Math.PI / 180) * 50,
                y: Math.sin(i * 30 * Math.PI / 180) * 50,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="quantum-state-info">
        <div className="state-label">Current State:</div>
        <div className="state-value">{state.toUpperCase()}</div>
      </div>
    </div>
  );
};

const DeviceNetworkVisualization: React.FC = () => {
  const [connectedDevices, setConnectedDevices] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedDevices(Math.floor(Math.random() * 4 + 6));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="device-network">
      <svg className="network-svg" width="100%" height="200">
        {/* Central hub */}
        <motion.circle
          cx="200"
          cy="100"
          r="20"
          fill="#00ffff"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />
        
        {/* Device nodes */}
        {[...Array(connectedDevices)].map((_, i) => {
          const angle = (i * (360 / connectedDevices)) * Math.PI / 180;
          const x = 200 + Math.cos(angle) * 80;
          const y = 100 + Math.sin(angle) * 80;
          
          return (
            <g key={i}>
              <motion.line
                x1="200"
                y1="100"
                x2={x}
                y2={y}
                stroke="#00ffff"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="8"
                fill="#ffff00"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    throughput: 87,
    latency: 23,
    efficiency: 94
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        throughput: Math.max(60, Math.min(100, prev.throughput + (Math.random() - 0.5) * 10)),
        latency: Math.max(5, Math.min(50, prev.latency + (Math.random() - 0.5) * 8)),
        efficiency: Math.max(80, Math.min(100, prev.efficiency + (Math.random() - 0.5) * 5))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-metrics">
      <div className="metric-bars">
        <PerformanceBar label="Throughput" value={metrics.throughput} color="#00ff00" />
        <PerformanceBar label="Latency" value={100 - metrics.latency} color="#ffff00" />
        <PerformanceBar label="Efficiency" value={metrics.efficiency} color="#00ffff" />
      </div>
    </div>
  );
};

const PerformanceBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  return (
    <div className="performance-bar">
      <div className="bar-label">{label}</div>
      <div className="bar-container">
        <motion.div
          className="bar-fill"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
      <div className="bar-value">{Math.round(value)}%</div>
    </div>
  );
};

export default UltimateDashboard;

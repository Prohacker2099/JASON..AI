import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const HolographicStatusBar: React.FC = () => {
  const [systemStats, setSystemStats] = useState({
    connection: 'Online',
    power: '2.4kW',
    security: 'Secure',
    performance: 'Optimal',
    devices: 12,
    uptime: '2d 14h 32m'
  });

  const [networkActivity, setNetworkActivity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkActivity(Math.random() * 100);
      setSystemStats(prev => ({
        ...prev,
        power: `${(Math.random() * 2 + 1.5).toFixed(1)}kW`,
        devices: Math.floor(Math.random() * 5 + 10)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="holographic-status-bar"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <div className="status-items">
        <StatusItem 
          icon="🌐" 
          label="Connected" 
          value={systemStats.connection}
          status="online"
        />
        <StatusItem 
          icon="⚡" 
          label="Power" 
          value={systemStats.power}
          status="normal"
        />
        <StatusItem 
          icon="🔒" 
          label="Security" 
          value={systemStats.security}
          status="secure"
        />
        <StatusItem 
          icon="🚀" 
          label="Performance" 
          value={systemStats.performance}
          status="optimal"
        />
        <StatusItem 
          icon="📱" 
          label="Devices" 
          value={systemStats.devices.toString()}
          status="normal"
        />
        <StatusItem 
          icon="⏱️" 
          label="Uptime" 
          value={systemStats.uptime}
          status="normal"
        />
      </div>

      {/* Network Activity Indicator */}
      <div className="network-activity">
        <div className="activity-label">Network</div>
        <div className="activity-bars">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="activity-bar"
              animate={{
                height: `${Math.max(20, networkActivity - i * 15)}%`,
                opacity: networkActivity > i * 20 ? 1 : 0.3
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Holographic Scan Line */}
      <div className="scan-line" />
    </motion.div>
  );
};

const StatusItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  status: 'online' | 'offline' | 'normal' | 'warning' | 'error' | 'secure' | 'optimal';
}> = ({ icon, label, value, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'secure':
      case 'optimal':
        return '#00ff00';
      case 'warning':
        return '#ffff00';
      case 'error':
      case 'offline':
        return '#ff0000';
      default:
        return '#00ffff';
    }
  };

  return (
    <motion.div 
      className="status-item"
      whileHover={{ 
        scale: 1.05,
        boxShadow: `0 0 15px ${getStatusColor()}`
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.span 
        className="status-icon"
        animate={{
          filter: `drop-shadow(0 0 8px ${getStatusColor()})`
        }}
      >
        {icon}
      </motion.span>
      <div className="status-text">
        <div className="status-label">{label}</div>
        <motion.div 
          className="status-value"
          style={{ color: getStatusColor() }}
          animate={{
            textShadow: `0 0 10px ${getStatusColor()}`
          }}
        >
          {value}
        </motion.div>
      </div>
      <div 
        className="status-pulse"
        style={{ backgroundColor: getStatusColor() }}
      />
    </motion.div>
  );
};

export default HolographicStatusBar;

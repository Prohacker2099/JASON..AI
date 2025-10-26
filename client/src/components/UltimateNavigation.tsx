import React from 'react';
import { motion } from 'framer-motion';

interface UltimateNavigationProps {
  activeView: string;
  setActiveView: (view: any) => void;
  theme: string;
  setTheme: (theme: any) => void;
}

const UltimateNavigation: React.FC<UltimateNavigationProps> = ({ 
  activeView, 
  setActiveView, 
  theme, 
  setTheme 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', color: '#00ffff' },
    { id: 'energy', label: 'Energy', icon: '⚡', color: '#ffff00' },
    { id: 'devices', label: 'Devices', icon: '🔌', color: '#00ff00' },
    { id: 'ai', label: 'AI Brain', icon: '🧠', color: '#ff00ff' },
    { id: 'quantum', label: 'Quantum', icon: '⚛️', color: '#ff6600' },
    { id: 'ar', label: 'AR View', icon: '🥽', color: '#ff0066' }
  ];

  return (
    <motion.nav 
      className="ultimate-navigation"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      <div className="nav-brand">
        <motion.div 
          className="logo"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🚀
        </motion.div>
        <span className="brand-text">ULTIMATE JASON</span>
      </div>

      <div className="nav-items">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            whileHover={{ 
              scale: 1.1,
              boxShadow: `0 0 20px ${item.color}`,
              backgroundColor: `${item.color}20`
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              '--item-color': item.color
            } as React.CSSProperties}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activeView === item.id && (
              <motion.div
                className="active-indicator"
                layoutId="activeIndicator"
                style={{ backgroundColor: item.color }}
              />
            )}
          </motion.button>
        ))}
      </div>

      <div className="nav-controls">
        <motion.button
          className="theme-toggle"
          onClick={() => {
            const themes = ['dark', 'light', 'quantum'];
            const currentIndex = themes.indexOf(theme);
            const nextIndex = (currentIndex + 1) % themes.length;
            setTheme(themes[nextIndex]);
          }}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
        >
          {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🌌'}
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default UltimateNavigation;

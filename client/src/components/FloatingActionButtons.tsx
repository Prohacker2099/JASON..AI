import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingActionButtons: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    { 
      icon: '🎯', 
      label: 'Quick Actions', 
      color: '#ff6600',
      action: () => console.log('Quick Actions')
    },
    { 
      icon: '⚙️', 
      label: 'Settings', 
      color: '#00ffff',
      action: () => console.log('Settings')
    },
    { 
      icon: '📊', 
      label: 'Analytics', 
      color: '#ff00ff',
      action: () => console.log('Analytics')
    },
    { 
      icon: '🔔', 
      label: 'Alerts', 
      color: '#ffff00',
      action: () => console.log('Alerts')
    },
    { 
      icon: '💡', 
      label: 'Optimize', 
      color: '#00ff00',
      action: () => console.log('Optimize')
    }
  ];

  return (
    <div className="floating-actions">
      {/* Main FAB */}
      <motion.button
        className="main-fab"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          rotate: isExpanded ? 45 : 0,
          backgroundColor: isExpanded ? '#ff0066' : '#0066ff'
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isExpanded ? '✕' : '✚'}
        </motion.span>
      </motion.button>

      {/* Action Buttons */}
      <AnimatePresence>
        {isExpanded && actions.map((action, index) => (
          <motion.button
            key={action.label}
            className="floating-action"
            style={{ '--action-color': action.color } as React.CSSProperties}
            initial={{ 
              scale: 0, 
              rotate: -180,
              y: 0
            }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: -(70 * (index + 1))
            }}
            exit={{ 
              scale: 0, 
              rotate: 180,
              y: 0
            }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.4,
              type: "spring",
              stiffness: 200
            }}
            whileHover={{ 
              scale: 1.2,
              boxShadow: `0 0 30px ${action.color}`,
              rotate: 360
            }}
            whileTap={{ scale: 0.9 }}
            onClick={action.action}
          >
            <span className="action-icon">{action.icon}</span>
            
            {/* Tooltip */}
            <motion.div
              className="action-tooltip"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.2 }}
            >
              {action.label}
            </motion.div>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Background Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fab-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionButtons;

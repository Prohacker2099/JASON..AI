import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring as useReactSpring, animated, config } from '@react-spring/web';
import UltimateNavigation from './UltimateNavigation';
import VoiceControlIndicator from './VoiceControlIndicator';
import UltimateDashboard from './UltimateDashboard';
import EnergyVisualization from './EnergyVisualization';
import DeviceControl3D from './DeviceControl3D';
import AIInterface from './AIInterface';
import QuantumInterface from './QuantumInterface';
import ARInterface from './ARInterface';
import HolographicStatusBar from './HolographicStatusBar';
import FloatingActionButtons from './FloatingActionButtons';
import ParticleBackground from './ParticleBackground';

// Advanced animation variants
const pageVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.8, 
    rotateY: -90,
    filter: 'blur(10px)'
  },
  in: { 
    opacity: 1, 
    scale: 1, 
    rotateY: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  out: { 
    opacity: 0, 
    scale: 1.1, 
    rotateY: 90,
    filter: 'blur(10px)',
    transition: {
      duration: 0.6,
      ease: [0.55, 0.085, 0.68, 0.53]
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.8,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const UltimateJasonUI: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'energy' | 'devices' | 'ai' | 'quantum' | 'ar'>('dashboard');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'quantum'>('quantum');
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [quantumState, setQuantumState] = useState<'superposition' | 'collapsed' | 'entangled'>('superposition');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Advanced spring animations
  const mainAnimation = useReactSpring({
    from: { opacity: 0, transform: 'scale(0.8) rotateY(-180deg)' },
    to: { opacity: 1, transform: 'scale(1) rotateY(0deg)' },
    config: config.slow
  });

  const backgroundAnimation = useReactSpring({
    from: { backgroundPosition: '0% 0%' },
    to: { backgroundPosition: '100% 100%' },
    config: { duration: 20000 },
    loop: true
  });

  const parallaxAnimation = useReactSpring({
    transform: `translate3d(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px, 0)`,
    config: config.gentle
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / window.innerWidth,
        y: (e.clientY - window.innerHeight / 2) / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'energy_update') setEnergyData(prev => [...prev.slice(-99), data.data]);
      if (data.type === 'quantum_result') setQuantumState(data.data.state);
    };
    return () => ws.close();
  }, []);

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('dashboard')) setActiveView('dashboard');
    else if (lowerCommand.includes('energy')) setActiveView('energy');
    else if (lowerCommand.includes('devices')) setActiveView('devices');
    else if (lowerCommand.includes('ai') || lowerCommand.includes('artificial intelligence')) setActiveView('ai');
    else if (lowerCommand.includes('quantum')) setActiveView('quantum');
    else if (lowerCommand.includes('ar') || lowerCommand.includes('augmented reality')) setActiveView('ar');
    else if (lowerCommand.includes('theme')) {
      const themes: ('dark' | 'light' | 'quantum')[] = ['dark', 'light', 'quantum'];
      const currentIndex = themes.indexOf(theme);
      setTheme(themes[(currentIndex + 1) % themes.length]);
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <UltimateDashboard energyData={energyData} quantumState={quantumState} />;
      case 'energy': return <EnergyVisualization data={energyData} />;
      case 'devices': return <DeviceControl3D />;
      case 'ai': return <AIInterface />;
      case 'quantum': return <QuantumInterface state={quantumState} />;
      case 'ar': return <ARInterface />;
      default: return <UltimateDashboard energyData={energyData} quantumState={quantumState} />;
    }
  };

  const themeStyles = {
    dark: {
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#ffffff'
    },
    light: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      color: '#1a202c'
    },
    quantum: {
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a0b2e 25%, #2d1b69 50%, #3730a3 75%, #4c1d95 100%)',
      color: '#e0e7ff'
    }
  };

  return (
    <animated.div 
      style={{
        ...mainAnimation,
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        ...themeStyles[theme]
      }}
    >
      {/* Enhanced Particle Background */}
      <ParticleBackground 
        theme={theme} 
        intensity="high" 
        className="absolute inset-0" 
      />
      
      {/* Animated Background Gradient */}
      <animated.div
        style={{
          ...backgroundAnimation,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at 25% 25%, ${theme === 'quantum' ? '#8b5cf6' : theme === 'light' ? '#3b82f6' : '#4f46e5'}22 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${theme === 'quantum' ? '#d946ef' : theme === 'light' ? '#10b981' : '#06b6d4'}22 0%, transparent 50%)`,
          zIndex: -1
        }}
      />

      {/* Parallax Container */}
      <animated.div style={parallaxAnimation}>
        {/* Main UI Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            position: 'relative',
            zIndex: 10,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Navigation */}
          <motion.div variants={itemVariants}>
            <UltimateNavigation 
              activeView={activeView}
              onViewChange={setActiveView}
              theme={theme}
              onThemeChange={setTheme}
            />
          </motion.div>

          {/* Voice Control */}
          <motion.div 
            variants={itemVariants}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000
            }}
          >
            <VoiceControlIndicator 
              isActive={isVoiceActive}
              onToggle={setIsVoiceActive}
              onCommand={handleVoiceCommand}
            />
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            style={{
              flex: 1,
              position: 'relative',
              padding: '20px'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                style={{
                  width: '100%',
                  height: '100%'
                }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Status Bar */}
          <motion.div variants={itemVariants}>
            <HolographicStatusBar />
          </motion.div>

          {/* Floating Action Buttons */}
          <FloatingActionButtons />
        </motion.div>
      </animated.div>
    </animated.div>
  );
};

export default UltimateJasonUI;

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { FaMicrophone } from 'react-icons/fa';
import useAmbientSound from '../../hooks/useAmbientSound';
import useHapticFeedback from '../../hooks/useHapticFeedback';
import { useAppContext } from '../../App';
import { Device } from '../../lib/types';
import Box from '@mui/material/Box'; // Import Box separately

import '../../styles/animations.css';
import '../../styles/background.css';
import '../../styles/MainLayout.css';
import '../../styles/JasonPulseHeader.css'; // New CSS for header animations

interface MainLayoutProps {}

const MotionBox = motion(Box); // Create a motion-enabled Box component

const MainLayout: React.FC<MainLayoutProps> = () => {
  const { devices, updateDeviceValue } = useAppContext();
  const { playSound, stopSound } = useAmbientSound();
  const { triggerHapticFeedback } = useHapticFeedback();

  const [ambientLighting, setAmbientLighting] = useState({
    brightness: 75,
    color: 'warmWhite',
  });

  const [temperature, setTemperature] = useState(22);

  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicRef = useRef<HTMLAudioElement>(null);

  const [greeting, setGreeting] = useState('');
  const [proactiveInsight, setProactiveInsight] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    let newGreeting = '';
    if (hour < 12) {
      newGreeting = 'Good Morning';
    } else if (hour < 18) {
      newGreeting = 'Good Afternoon';
    } else {
      newGreeting = 'Good Evening';
    }
    setGreeting(`${newGreeting}, User!`);

    const insights = [
      "Your coffee machine is pre-heating.",
      "Traffic looks clear for your commute.",
      "The living room lights are still on.",
      "You have an upcoming meeting in 15 minutes."
    ];
    setProactiveInsight(insights[Math.floor(Math.random() * insights.length)]);

    const timer = setInterval(() => {
      setAmbientLighting((prev) => ({
        ...prev,
        brightness: Math.max(10, Math.min(100, Math.floor(Math.random() * 90) + 10)),
        color: ['warmWhite', 'softBlue', 'sunsetOrange'][Math.floor(Math.random() * 3)],
      }));

      setTemperature(Math.max(18, Math.min(28, Math.floor(Math.random() * 10) + 18)));

      setMusicPlaying(!musicPlaying);
    }, 50000);

    return () => clearInterval(timer);
  }, []);

  const handleBrightnessChange = (brightness: number) => {
    updateDeviceValue('ambientLight', brightness);
  };

  const handleTemperatureChange = (temp: number) => {
    updateDeviceValue('thermostat', temp);
  };

  const handlePlayPause = () => {
    if (musicPlaying) {
      musicRef.current?.pause();
      setMusicPlaying(false);
      stopSound();
    } else {
      musicRef.current?.play();
      setMusicPlaying(true);
      playSound('activate');
    }
    triggerHapticFeedback('light');
  };

  const handleVoiceButtonClick = () => {
    setIsListening(!isListening);
    triggerHapticFeedback('medium');
    if (!isListening) {
      playSound('listening', true);
    } else {
      stopSound();
    }
  };

  return (
    <div className="main-layout">
      <header className="jason-pulse-header">
        <div className="header-background-animation">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-1 animation-delay-500"></div>
          <div className="particle particle-2 animation-delay-1000"></div>
        </div>
        <div className="header-content">
          <h1 className="header-title animate-fadeIn animation-delay-100">JASON - The Omnipotent AI Architect</h1>
          <div className="header-greeting animate-fadeInUp animation-delay-200">
            <span className="greeting-text">{greeting}</span>
            <span className="proactive-insight">{proactiveInsight}</span>
          </div>
          <MotionBox
            className={`voice-assistant-button ${isListening ? 'listening' : ''}`}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            onClick={handleVoiceButtonClick}
            sx={{
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'primary.main',
              color: 'white',
              cursor: 'pointer',
              border: 'none',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            <FaMicrophone className="voice-icon" />
          </MotionBox>
        </div>
      </header>
      <main>
        <h2>{new Date().toLocaleTimeString()}</h2>
        <p>Ambient Lighting: Brightness: {ambientLighting.brightness}%, Color: {ambientLighting.color}</p>
        <p>Temperature: {temperature}°C</p>
        <button onClick={handlePlayPause} disabled={!musicRef.current}>
          {musicPlaying ? 'Pause Music' : 'Play Music'}
        </button>
        {musicPlaying && (
          <audio ref={musicRef} id="musicPlayer" src="https://www.kozco.com/sounds/default.mp3" />
        )}
        <p>Device Status: {JSON.stringify(devices)}</p>
      </main>
    </div>
  );
};

export default MainLayout;

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import type { SpeechRecognition } from '../lib/types';

interface VoiceControlIndicatorProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  onCommand: (command: string) => void;
}

const VoiceControlIndicator: React.FC<VoiceControlIndicatorProps> = ({ 
  isActive, 
  onToggle, 
  onCommand 
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isActiveRef = useRef<boolean>(isActive);

  const pulseAnimation = useSpring({
    from: { transform: 'scale(1)' },
    to: { transform: isActive ? 'scale(1.3)' : 'scale(1)' },
    config: { duration: 1000 },
    loop: isActive ? { reverse: true } : false
  });

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          handleVoiceCommand(transcript.toLowerCase());
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          onToggle(false);
        };

        recognitionRef.current.onend = () => {
          if (isActiveRef.current) {
            recognitionRef.current?.start();
          }
        };
      }
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (isActive && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (!isActive && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isActive]);

  const handleVoiceCommand = (command: string) => {
    try { onCommand(command); } catch {}
    // Voice command processing
    if (command.includes('dashboard') || command.includes('home')) {
      window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'dashboard' }));
    } else if (command.includes('energy') || command.includes('power')) {
      window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'energy' }));
    } else if (command.includes('devices') || command.includes('control')) {
      window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'devices' }));
    } else if (command.includes('ai') || command.includes('brain')) {
      window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'ai' }));
    } else if (command.includes('quantum')) {
      window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'quantum' }));
    } else if (command.includes('ar') || command.includes('augmented')) {
      window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'ar' }));
    } else if (command.includes('lights on')) {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'lights', state: 'on' } }));
    } else if (command.includes('lights off')) {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'lights', state: 'off' } }));
    } else if (command.includes('optimize energy')) {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'optimize' } }));
    }
  };

  const toggleVoiceControl = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    onToggle(!isActive);
  };

  return (
    <motion.div 
      className="voice-control"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1, duration: 0.6 }}
    >
      <animated.button
        className={`voice-button ${isActive ? 'active' : ''}`}
        onClick={toggleVoiceControl}
        style={pulseAnimation}
      >
        <div className="voice-waves">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="wave"
              animate={isActive ? {
                scaleY: [1, 2, 1],
                opacity: [0.3, 1, 0.3]
              } : {}}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
        🎤
      </animated.button>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="voice-status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="listening-indicator">
              <motion.div
                className="pulse-ring"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              Listening...
            </div>
            <div className="voice-commands">
              <div className="command-hint">Try: "Show dashboard", "Turn on lights", "Optimize energy"</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceControlIndicator;

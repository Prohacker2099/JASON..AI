import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { useSmartHomeContext } from '../lib/SmartHomeContext';
import { voiceService } from '../services/voice';
import JasonOrb from './JasonOrb';
import useHapticFeedback from '../hooks/useHapticFeedback';
import useAmbientSound from '../hooks/useAmbientSound';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../lib/types';

interface JasonVoiceAssistantProps {
  // No specific props needed for now, as it will interact with global context/services
}

const JasonVoiceAssistant: React.FC<JasonVoiceAssistantProps> = () => {
  const { updateDeviceState } = useSmartHomeContext();
  const { triggerHapticFeedback } = useHapticFeedback();
  const { playSound, stopSound } = useAmbientSound();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onstart = () => {
            setIsListening(true);
            setVoiceCommand('');
            setResponse('');
            setError('');
            triggerHapticFeedback('light');
            playSound('listening', true);
            console.log('Voice recognition started');
          };

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setVoiceCommand(transcript);
            setIsListening(false);
            stopSound();
            setIsProcessing(true);
            playSound('processing', true);
            processVoiceCommand(transcript);
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
            setIsProcessing(false);
            stopSound();
            triggerHapticFeedback('error');
            playSound('error');
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
            if (!isProcessing) {
              stopSound();
            }
          };
        }
      }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, [triggerHapticFeedback, playSound, stopSound, isProcessing]);

  const speakResponse = useCallback(async (text: string) => {
    if (!synthRef.current) return;

    return new Promise<void>(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        resolve();
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        resolve();
      };
      synthRef.current.speak(utterance);
    });
  }, []);

  const processVoiceCommand = useCallback(async (command: string) => {
    try {
      const nluResponse = await voiceService.processCommand(command);
      const reply = (nluResponse && typeof (nluResponse as any).reply === 'string')
        ? String((nluResponse as any).reply)
        : 'Okay.';
      setResponse(reply);
      await speakResponse(reply);

      setIsProcessing(false);
      stopSound();
      triggerHapticFeedback('success');
      playSound('success');
    } catch (err) {
      console.error('Error processing voice command:', err);
      setError('Sorry, I encountered an error processing your command.');
      setIsProcessing(false);
      stopSound();
      triggerHapticFeedback('error');
      playSound('error');
    }
  }, [updateDeviceState, triggerHapticFeedback, playSound, stopSound, speakResponse]);

  const handleVoiceActivation = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  }, [isListening]);

  return (
    <Box
      sx={{
        p: 3,
        border: '1px solid #333',
        borderRadius: '12px',
        textAlign: 'center',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        maxWidth: 400,
        margin: 'auto',
        mt: 4,
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ color: '#90caf9' }}>
        JASON Voice Ecosystem
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Your Good Buddy, powered by advanced AI.
      </Typography>

      <JasonOrb
        isListening={isListening}
        isProcessing={isProcessing}
        onClick={handleVoiceActivation}
      />

      {isListening && (
        <Typography variant="body2" sx={{ mt: 2, color: '#90caf9' }}>
          Listening...
        </Typography>
      )}
      {isProcessing && (
        <Typography variant="body2" sx={{ mt: 2, color: '#f48fb1' }}>
          Processing...
        </Typography>
      )}
      {voiceCommand && (
        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
          You said: "{voiceCommand}"
        </Typography>
      )}
      {response && (
        <Typography variant="body1" sx={{ mt: 2, color: '#e0e0e0' }}>
          JASON: "{response}"
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default JasonVoiceAssistant;

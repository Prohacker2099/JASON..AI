import { useCallback, useRef } from 'react';

type SoundType = 'activate' | 'deactivate' | 'listening' | 'processing' | 'success' | 'error' | 'ambient_default' | 'confirmation_tone' | 'click';

const soundPaths: { [key in SoundType]: string } = {
  activate: '/assets/audio/activate.mp3',
  deactivate: '/assets/audio/deactivate.mp3', // Assuming you have this sound file
  listening: '/assets/audio/listening.mp3',
  processing: '/assets/audio/processing.mp3',
  success: '/assets/audio/success.mp3',
  error: '/assets/audio/error.mp3',
  ambient_default: '/assets/audio/ambient_default.mp3',
  confirmation_tone: '/assets/audio/confirmation_tone.mp3',
  click: '/assets/audio/click.mp3', // Assuming you have this sound file
};

const useAmbientSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSoundRef = useRef<string | null>(null);

  const playSound = useCallback((type: SoundType, loop: boolean = false, volume: number = 0.5) => {
    const soundUrl = soundPaths[type];
    if (!soundUrl) {
      console.warn(`Sound type ${type} not found.`);
      return;
    }

    if (audioRef.current && currentSoundRef.current === soundUrl) {
      // If the same sound is already playing, do nothing
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(soundUrl);
    audio.loop = loop;
    audio.volume = volume;
    audio.play().catch(e => console.error(`Error playing sound ${soundUrl}:`, e));
    audioRef.current = audio;
    currentSoundRef.current = soundUrl;
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      currentSoundRef.current = null;
    }
  }, []);

  const setAmbientVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  return { playSound, stopSound, setAmbientVolume, currentSound: currentSoundRef.current };
};

export default useAmbientSound;
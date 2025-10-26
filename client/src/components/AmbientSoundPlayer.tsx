import React, { useEffect } from 'react';
import useAmbientSound from '../hooks/useAmbientSound';

interface AmbientSoundPlayerProps {
  soundUrl: string;
  loop?: boolean;
  volume?: number;
  isPlaying: boolean;
}

const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  soundUrl,
  loop = true,
  volume = 0.3,
  isPlaying,
}) => {
  const { playSound, stopSound, setAmbientVolume, currentSound } = useAmbientSound();

  useEffect(() => {
    setAmbientVolume(volume);
  }, [volume, setAmbientVolume]);

  useEffect(() => {
    if (isPlaying && soundUrl && currentSound !== soundUrl) {
      // Assuming soundUrl directly maps to a SoundType or is a full path
      // For simplicity, let's assume soundUrl is the full path and we need to map it to a SoundType
      // This might require a more robust mapping or passing SoundType directly
      // For now, we'll just pass 'ambient_default' if soundUrl matches, otherwise a generic 'activate'
      const soundType = soundUrl.includes('ambient_default') ? 'ambient_default' : 'activate';
      playSound(soundType, loop, volume);
    } else if (!isPlaying && currentSound === soundUrl) {
      stopSound();
    }
  }, [isPlaying, soundUrl, loop, playSound, stopSound, currentSound, volume, setAmbientVolume]);

  // This component doesn't render anything visible, it just manages audio playback
  return null;
};

export default AmbientSoundPlayer;
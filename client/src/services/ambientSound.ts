// client/src/services/ambientSound.ts

class AmbientSoundService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private currentSound: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.setVolume(0.3); // Default volume
    }
  }

  private async loadSound(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized.');
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  public async playSound(soundUrl: string, loop: boolean = true) {
    if (!this.audioContext) {
      console.warn('AudioContext not available. Cannot play sound.');
      return;
    }

    if (this.isPlaying && this.currentSound === soundUrl) {
      // Already playing this sound
      return;
    }

    this.stopSound(); // Stop any currently playing sound

    try {
      this.audioBuffer = await this.loadSound(soundUrl);
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = this.audioBuffer;
      this.currentSource.loop = loop;
      this.currentSource.connect(this.gainNode!);
      this.currentSource.start(0);
      this.isPlaying = true;
      this.currentSound = soundUrl;
      console.log(`Playing ambient sound: ${soundUrl}`);
    } catch (error) {
      console.error('Error playing sound:', error);
      this.isPlaying = false;
      this.currentSound = null;
    }
  }

  public stopSound() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = null;
      this.isPlaying = false;
      this.currentSound = null;
      console.log('Stopped ambient sound.');
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSound(): string | null {
    return this.currentSound;
  }
}

export const ambientSoundService = new AmbientSoundService();
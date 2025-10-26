// client/src/services/voice.ts

import axios from 'axios';

interface NLUResponse {
  intent: string;
  entities: { [key: string]: any };
  response: string;
}

class VoiceService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private baseUrl: string = 'http://localhost:3001/api/nlu'; // NLU service endpoint

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.setVolume(0.8); // Default volume for voice feedback
    }
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized.');
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  public async playConfirmationTone(toneUrl: string) {
    if (!this.audioContext) {
      console.warn('AudioContext not available. Cannot play confirmation tone.');
      return;
    }

    try {
      const audioBuffer = await this.loadAudioBuffer(toneUrl);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode!);
      source.start(0);
      console.log(`Playing confirmation tone: ${toneUrl}`);
    } catch (error) {
      console.error('Error playing confirmation tone:', error);
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  public async processCommand(command: string): Promise<NLUResponse> {
    try {
      const response = await axios.post<NLUResponse>(`${this.baseUrl}/process`, { command });
      return response.data;
    } catch (error) {
      console.error('Error processing command with NLU service:', error);
      throw new Error('Failed to process command with NLU service.');
    }
  }
}

export const voiceService = new VoiceService();
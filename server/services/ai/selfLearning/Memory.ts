export interface Experience {
  state: Float32Array;
  actionIndex: number;
  reward: number;
  nextState: Float32Array;
  done: boolean;
}

export class ExperienceReplayBuffer {
  private buffer: Experience[] = [];
  private index = 0;

  constructor(private capacity = 5000) {}

  add(exp: Experience) {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(exp);
    } else {
      this.buffer[this.index] = exp;
    }
    this.index = (this.index + 1) % this.capacity;
  }

  size(): number {
    return this.buffer.length;
  }

  sample(batchSize: number): Experience[] {
    const n = Math.min(batchSize, this.buffer.length);
    const result: Experience[] = [];
    for (let i = 0; i < n; i++) {
      const j = Math.floor(Math.random() * this.buffer.length);
      result.push(this.buffer[j]);
    }
    return result;
  }

  clear() {
    this.buffer = [];
    this.index = 0;
  }
}

import os from 'os';

export type ContextState = {
  timeISO: string;
  timezone: string;
  hostname: string;
  focusedApp?: string;
  calendarToday?: Array<{ title: string; when: string }>;
  mood?: 'calm' | 'focused' | 'tired' | 'stressed' | 'happy' | 'neutral';
};

class ContextManager {
  private state: ContextState = {
    timeISO: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    hostname: os.hostname(),
    focusedApp: undefined,
    calendarToday: [],
    mood: 'neutral',
  };

  status(): ContextState {
    this.state.timeISO = new Date().toISOString();
    return { ...this.state };
  }

  setMood(mood: ContextState['mood']) {
    if (!mood) return this.state;
    this.state.mood = mood;
    return { ...this.state };
  }
}

export const contextManager = new ContextManager();

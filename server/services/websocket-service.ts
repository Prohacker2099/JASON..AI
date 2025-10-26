import { Response } from 'express';
import { EventEmitter } from 'events';

type SSEClient = { id: string; res: Response };

class SSEBroker extends EventEmitter {
  private clients: Map<string, SSEClient> = new Map();

  addClient(res: Response): string {
    const id = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.clients.set(id, { id, res });
    return id;
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  broadcast(event: string, data: any) {
    const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
    for (const { res } of this.clients.values()) {
      try { res.write(payload); } catch { /* ignore */ }
    }
  }
}

export const sseBroker = new SSEBroker();

// Hooks
export function hookDeviceManager(dm: { on: Function }) {
  try {
    dm.on('deviceStateChange', (device: any) => sseBroker.broadcast('deviceStateChange', device));
  } catch { /* optional */ }
}

export function hookAiEngine(ai: { on: Function }) {
  try {
    ai.on('insight', (ins: any) => sseBroker.broadcast('aiInsight', ins));
    ai.on('event', (ev: any) => sseBroker.broadcast('aiEvent', ev));
  } catch { /* optional */ }
}

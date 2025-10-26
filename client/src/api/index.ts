export type MarketplaceItem = {
  id: string;
  name: string;
  type: string;
  developerId: string;
  price: number;
  downloads?: number;
  rating?: number;
};

export type LearningInsight = {
  id: string;
  summary: string;
  timestamp: string;
};

export type ZonePolicy = {
  maxBrightness?: number;
  turnOffIdlePlugs?: boolean;
  hvacSetpoint?: number;
};

export type EnergyPolicy = {
  enabled: boolean;
  quietHours?: { from: string; to: string };
  zones: Record<string, ZonePolicy>;
  idleMinutesCutoff: number;
};

export type PowerDevice = {
  id: string;
  name: string;
  type: string; // e.g., 'plug', 'light'
  zone: string;
  state: any & { power?: number; brightness?: number };
};

const BASE = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:3001';

async function j(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  async listItems(): Promise<MarketplaceItem[]> {
    const res = await fetch(`${BASE}/api/marketplace/items`);
    return j(res);
  },
  async submitItem(input: { name: string; type: string; developerId: string; price?: number }) {
    const res = await fetch(`${BASE}/api/marketplace/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify(input),
    });
    return j(res);
  },
  async purchase(input: { userId: string; itemId: string }) {
    const res = await fetch(`${BASE}/api/marketplace/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': input.userId },
      body: JSON.stringify(input),
    });
    return j(res);
  },
  async learn(event: string, data?: Record<string, any>) {
    const res = await fetch(`${BASE}/api/ai/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify({ event, data }),
    });
    return j(res);
  },
  async insights(): Promise<LearningInsight[]> {
    const res = await fetch(`${BASE}/api/ai/insights`);
    return j(res);
  },
  async getEnergyPolicy(): Promise<EnergyPolicy> {
    const res = await fetch(`${BASE}/api/energy/policy`);
    return j(res);
  },
  async setEnergyPolicy(patch: Partial<EnergyPolicy>) {
    const res = await fetch(`${BASE}/api/energy/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return j(res);
  },
  async runEnergyOptimize() {
    const res = await fetch(`${BASE}/api/energy/optimize`, { method: 'POST' });
    return j(res);
  },
  async listPowerDevices(): Promise<{ devices: PowerDevice[] }> {
    const res = await fetch(`${BASE}/api/power/devices`);
    return j(res);
  },
  async toggleSocket(id: string) {
    const res = await fetch(`${BASE}/api/power/socket/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
    return j(res);
  },
  async setLightBrightness(id: string, brightness: number) {
    const res = await fetch(`${BASE}/api/power/light/${encodeURIComponent(id)}/brightness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brightness }),
    });
    return j(res);
  },
  eventsUrl(): string {
    return `${BASE}/api/events`;
  },
};

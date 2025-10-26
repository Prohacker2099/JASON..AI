export interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'on' | 'off' | 'standby';
  protocol: string;
  lastSeen: string;
  lastUpdate?: string;
  brightness?: number;
  temperature?: number;
  power?: number;
  location?: string;
  battery?: number;
  humidity?: number;
  signalStrength?: number;
}

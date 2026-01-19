import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001/api';

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// Feature flag for Unified Device Control (provided at build/run via Vite env)
export const USE_UC = (import.meta.env.VITE_USE_UNIFIED_DEVICE_CONTROL as string) === 'true';

export type DeviceStatus = 'online' | 'offline';
export type DeviceType = 'smart-light' | 'thermostat' | 'security-camera' | 'smart-plug' | string;

export interface DeviceMetrics {
  brightness?: number;
  power?: number;
  battery?: number;
  temperature?: number;
  humidity?: number;
  [key: string]: any;
}

export interface Device {
  deviceId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  lastSeen: string;
  room?: string;
  metrics: DeviceMetrics;
  actions?: {
    power?: boolean;
    brightness?: boolean;
    temperature?: boolean;
  };
}

export const api = {
  async getDevices() {
    const res = await http.get<Device[]>('/devices');
    return res.data;
  },
  async controlDevice(deviceId: string, action: string, value?: any) {
    const res = await http.post('/devices/control', { deviceId, action, value });
    return res.data;
  },
  async toggleDevice(deviceId: string) {
    return this.controlDevice(deviceId, 'toggle');
  },
  async setBrightness(deviceId: string, brightness: number) {
    return this.controlDevice(deviceId, 'setBrightness', brightness);
  },
  async ucSendCommand(deviceId: string, command: string, payload?: any) {
    const res = await http.post('/devices/uc/sendCommand', { deviceId, command, payload });
    return res.data;
  },
  async getActivityLogs(limit = 50) {
    const res = await http.get<{ logs: any[] }>('/activity/logs', { params: { limit } });
    return res.data;
  },
  async getBDIStatus() {
    const res = await http.get('/bdi/status');
    return res.data;
  },
  async getContextCurrent() {
    const res = await http.get('/context/current');
    return res.data;
  },
  async getOrchJobs() {
    const res = await http.get('/orch/jobs');
    return res.data;
  },
  async getStyleProfile(params?: { channel?: string; recipient?: string; taskType?: string }) {
    const res = await http.get('/ai/style/profile', { params: params || {} });
    return res.data;
  },
};

export default api;

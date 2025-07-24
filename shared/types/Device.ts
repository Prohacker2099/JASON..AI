/**
 * Device type definitions for JASON
 */

export interface DeviceState {
  on?: boolean;
  brightness?: number;
  color?: {
    hue: number;
    saturation: number;
    value: number;
  };
  temperature?: number;
  humidity?: number;
  motion?: boolean;
  contact?: boolean;
  battery?: number;
  power?: number;
  energy?: number;
  [key: string]: any;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  capabilities: string[];
  state: DeviceState;
  connected: boolean;
  lastSeen?: Date;
  address?: string;
  location?: string;
  room?: string;
  lastControlSource?: string;
  [key: string]: any;
}

export interface DeviceCommand {
  type: string;
  action: string; // Add action property
  parameters?: Record<string, any>; // Change params to parameters and make optional
}

export interface DeviceResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, any>;
}

export interface DeviceDiscoveryOptions {
  timeout?: number;
  protocols?: string[];
  includeOffline?: boolean;
}

export interface DeviceFilter {
  type?: string | string[];
  manufacturer?: string | string[];
  room?: string | string[];
  capability?: string | string[];
  online?: boolean;
}

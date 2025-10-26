/**
 * Device type definitions for JASON
 */

export enum DeviceType {
  LIGHT = 'light',
  THERMOSTAT = 'thermostat',
  SPEAKER = 'speaker',
  SECURITY_CAMERA = 'security_camera',
  SENSOR = 'sensor',
  MEDIA_PLAYER = 'media_player',
  CAR = 'car',
  COFFEE_MACHINE = 'coffee_machine',
  DOOR_LOCK = 'door_lock',
  APPLIANCE = 'appliance',
  COMMUNICATION = 'communication', // For messages, calls
  BROWSER = 'browser', // For JASON Cognition Engine & Browser
  WELLNESS = 'wellness', // For biometric data
  PRODUCTIVITY = 'productivity', // For calendar integration
  SECURITY_SYSTEM = 'security_system', // New device type for security system
}

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
  type: DeviceType; // Use the enum here
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
  protocol?: string; // Add protocol property
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

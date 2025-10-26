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
  COMMUNICATION = 'communication',
  BROWSER = 'browser',
  WELLNESS = 'wellness',
  PRODUCTIVITY = 'productivity',
  SECURITY_SYSTEM = 'security_system', // New device type for security system
}

export interface DeviceState {
  on?: boolean;
  brightness?: number;
  color?: string;
  temperature?: number;
  mode?: string;
  playing?: string;
  volume?: number; // Added for speaker
  locked?: boolean;
  motionDetected?: boolean;
  motion?: boolean; // Added for sensor
  preheating?: boolean;
  defrosted?: boolean;
  battery?: number;
  brewing?: boolean;
  running?: boolean;
  cycle?: string;
  recording?: boolean;
  sleepScore?: number;
  heartRate?: number;
  upcomingEvents?: any[];
  unreadMessages?: number;
  missedCalls?: number;
  active?: boolean;
  currentUrl?: string;
  armed?: boolean; // Added for security system
  sensors?: Record<string, string>; // Added for security system
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  state: DeviceState;
  status?: string; // Added for summary status display
  icon?: string; // Added for icon path or emoji
}

export interface SmartHomeEvent {
  timestamp: string;
  type: string;
  payload: any;
}

// New interfaces for Proactive AI & Hyper-Personalization
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

export interface CarStatus {
  id: string;
  batteryLevel: number; // Percentage
  fuelLevel?: number; // Percentage
  location: string;
  isReady: boolean; // e.g., pre-heated, defrosted, charged
  eta?: string; // Estimated time of arrival if navigating
}

export interface SceneSuggestion {
  id: string;
  name: string;
  description: string;
  devices: { deviceId: string; state: any }[];
  reason: string; // AI-generated reason for the suggestion
}

export interface PredictiveAutomation {
  id: string;
  type: string; // e.g., 'energy_saving', 'security_alert'
  prediction: string; // Human-readable prediction
  suggestedAction: string;
  confidence: number; // 0-1
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    SpeechGrammarList: any; // Add SpeechGrammarList to global Window interface
  }
}

export interface SpeechGrammarList {
  readonly length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(uri: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

export interface SpeechGrammar {
  src: string;
  weight: number;
}

export interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  abort(): void;
  start(): void;
  stop(): void;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly emma: Document | null;
  readonly interpretation: any;
  readonly literal: string | null;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

export declare enum SpeechRecognitionErrorCode {
  "no-speech",
  "aborted",
  "audio-capture",
  "network",
  "not-allowed",
  "service-not-allowed",
  "bad-grammar",
  "language-not-supported",
}

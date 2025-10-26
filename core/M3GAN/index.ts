// core/M3GAN/index.ts
// M3GAN (Model 3 Generative Autonomous Neural) - Main Export

export { default as M3GANCore } from './M3GANCore';
export { default as M3GANIntegration } from './M3GANIntegration';

// Core Modules
export { default as VisualCortex } from './modules/VisualCortex';
export { default as AudioCortex } from './modules/AudioCortex';
export { default as HTNPlanner } from './modules/HTNPlanner';
export { default as MoralityEngine } from './modules/MoralityEngine';
export { default as LocalExecutionAgent } from './modules/LocalExecutionAgent';
export { default as CloudReasoningCore } from './modules/CloudReasoningCore';
export { default as SelfCorrectionLoop } from './modules/SelfCorrectionLoop';
export { default as EmergencyKillSwitch } from './modules/EmergencyKillSwitch';
export { default as AuditLogger } from './modules/AuditLogger';
export { default as DeviceFluidityManager } from './modules/DeviceFluidityManager';
export { default as M3GANEyeInterface } from './modules/M3GANEyeInterface';
export { default as StylePreferenceEngine } from './modules/StylePreferenceEngine';

// Types and Interfaces
export type { M3GANConfig, M3GANState, TaskContext } from './M3GANCore';
export type { M3GANIntegrationConfig } from './M3GANIntegration';

// Visual Cortex Types
export type { 
  PersonDetection, 
  GestureRecognition, 
  EnvironmentMapping, 
  VisualCortexConfig 
} from './modules/VisualCortex';

// Audio Cortex Types
export type { 
  SpeechRecognition, 
  EmotionDetection, 
  ToneAnalysis, 
  AudioCortexConfig 
} from './modules/AudioCortex';

// HTN Planner Types
export type { Task, Plan, HTNPlannerConfig } from './modules/HTNPlanner';

// Morality Engine Types
export type { 
  EthicalRule, 
  EthicalViolation, 
  ConsentRequest, 
  BiasDetection, 
  MoralityEngineConfig 
} from './modules/MoralityEngine';

// Local Execution Agent Types
export type { 
  DeviceCommand, 
  ExecutionResult, 
  DeviceResponse, 
  LEAConfig 
} from './modules/LocalExecutionAgent';

// Cloud Reasoning Core Types
export type { 
  CloudReasoningRequest, 
  CloudReasoningResponse, 
  CloudReasoningConfig 
} from './modules/CloudReasoningCore';

// Self-Correction Loop Types
export type { 
  CorrectionAnalysis, 
  AnalysisFinding, 
  Recommendation, 
  LearningInsight, 
  SCRLConfig 
} from './modules/SelfCorrectionLoop';

// Emergency Kill Switch Types
export type { EmergencyEvent, KillSwitchConfig } from './modules/EmergencyKillSwitch';

// Audit Logger Types
export type { 
  AuditEntry, 
  AuditQuery, 
  AuditStats, 
  AuditLoggerConfig 
} from './modules/AuditLogger';

// Device Fluidity Manager Types
export type { 
  Device, 
  SessionContext, 
  DeviceFluidityConfig 
} from './modules/DeviceFluidityManager';

// M3GAN Eye Interface Types
export type { 
  M3GANEyeStatus, 
  TaskFeed, 
  ControlPanel, 
  M3GANEyeConfig 
} from './modules/M3GANEyeInterface';

// Style Preference Engine Types
export type { 
  UserStyleProfile, 
  InteractionPattern, 
  StylePreferenceConfig 
} from './modules/StylePreferenceEngine';

// M3GAN System Information
export const M3GAN_INFO = {
  name: 'M3GAN',
  fullName: 'Model 3 Generative Autonomous Neural',
  version: '1.0.0',
  description: 'Humanoid AI designed to serve as a real-time emotional, logistical, and protective companion',
  capabilities: [
    'Visual Intelligence',
    'Audio Intelligence', 
    'Autonomous Decision-Making',
    'Emotional Intelligence',
    'Ethical Decision-Making',
    'Self-Learning',
    'Emergency Safety Systems',
    'Comprehensive Audit Logging'
  ],
  modules: [
    'VisualCortex',
    'AudioCortex', 
    'HTNPlanner',
    'MoralityEngine',
    'LocalExecutionAgent',
    'CloudReasoningCore',
    'SelfCorrectionLoop',
    'EmergencyKillSwitch',
    'AuditLogger',
    'DeviceFluidityManager',
    'M3GANEyeInterface',
    'StylePreferenceEngine'
  ],
  ethicalPrinciples: [
    'Harm Prevention',
    'Consent-Driven Access',
    'Bias Filtering',
    'Transparency',
    'Privacy Protection',
    'Fairness and Equality'
  ],
  safetyFeatures: [
    'Emergency Kill Switch',
    'Ethical Boundary Enforcement',
    'Audit Trail',
    'Consent Management',
    'Bias Detection',
    'Transparency Logging'
  ]
} as const;

// M3GAN Factory Function
export function createM3GAN(config: M3GANConfig): M3GANCore {
  return new M3GANCore(config);
}

// M3GAN Integration Factory Function
export function createM3GANIntegration(config: M3GANIntegrationConfig): M3GANIntegration {
  return new M3GANIntegration(config);
}

// Default M3GAN Configuration
export const DEFAULT_M3GAN_CONFIG: M3GANConfig = {
  userId: 'default_user',
  deviceId: 'default_device',
  permissions: {
    visualAccess: true,
    audioAccess: true,
    deviceControl: true,
    networkAccess: true,
    cloudReasoning: true
  },
  ethicalBoundaries: {
    harmPrevention: true,
    consentRequired: true,
    transparencyMode: true,
    auditLogging: true
  },
  learningSettings: {
    enableLearning: true,
    feedbackRequired: true,
    moralValidation: true
  }
};

// Default M3GAN Integration Configuration
export const DEFAULT_M3GAN_INTEGRATION_CONFIG: M3GANIntegrationConfig = {
  userId: 'default_user',
  deviceId: 'default_device',
  enableVisualCortex: true,
  enableAudioCortex: true,
  enableHTNPlanner: true,
  enableMoralityEngine: true,
  enableLocalExecution: true,
  enableCloudReasoning: true,
  enableSelfCorrection: true,
  enableEmergencyKillSwitch: true,
  enableAuditLogging: true,
  integrationMode: 'full'
};

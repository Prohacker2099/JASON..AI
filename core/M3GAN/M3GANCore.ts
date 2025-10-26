// core/M3GAN/M3GANCore.ts
// M3GAN (Model 3 Generative Autonomous Neural) - Humanoid AI Companion

import { EventEmitter } from 'events';
import { logger } from '../../server/src/utils/logger';
import { VisualCortex } from './modules/VisualCortex';
import { AudioCortex } from './modules/AudioCortex';
import { HTNPlanner } from './modules/HTNPlanner';
import { MoralityEngine } from './modules/MoralityEngine';
import { LocalExecutionAgent } from './modules/LocalExecutionAgent';
import { CloudReasoningCore } from './modules/CloudReasoningCore';
import { SelfCorrectionLoop } from './modules/SelfCorrectionLoop';
import { EmergencyKillSwitch } from './modules/EmergencyKillSwitch';
import { AuditLogger } from './modules/AuditLogger';
import { DeviceFluidityManager } from './modules/DeviceFluidityManager';
import { M3GANEyeInterface } from './modules/M3GANEyeInterface';
import { StylePreferenceEngine } from './modules/StylePreferenceEngine';

export interface M3GANConfig {
  userId: string;
  deviceId: string;
  permissions: {
    visualAccess: boolean;
    audioAccess: boolean;
    deviceControl: boolean;
    networkAccess: boolean;
    cloudReasoning: boolean;
  };
  ethicalBoundaries: {
    harmPrevention: boolean;
    consentRequired: boolean;
    transparencyMode: boolean;
    auditLogging: boolean;
  };
  learningSettings: {
    enableLearning: boolean;
    feedbackRequired: boolean;
    moralValidation: boolean;
  };
}

export interface M3GANState {
  isActive: boolean;
  currentTask: string | null;
  emotionalState: 'neutral' | 'concerned' | 'alert' | 'happy' | 'sad';
  userMood: 'neutral' | 'stressed' | 'happy' | 'tired' | 'focused';
  systemHealth: 'optimal' | 'degraded' | 'critical';
  lastInteraction: Date;
  trustLevel: number; // 0-1 scale
}

export interface TaskContext {
  taskId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresConsent: boolean;
  estimatedDuration: number;
  dependencies: string[];
  ethicalImplications: string[];
}

export class M3GANCore extends EventEmitter {
  private config: M3GANConfig;
  private state: M3GANState;
  
  // Core Modules
  private visualCortex: VisualCortex;
  private audioCortex: AudioCortex;
  private htnPlanner: HTNPlanner;
  private moralityEngine: MoralityEngine;
  private localExecutionAgent: LocalExecutionAgent;
  private cloudReasoningCore: CloudReasoningCore;
  private selfCorrectionLoop: SelfCorrectionLoop;
  private emergencyKillSwitch: EmergencyKillSwitch;
  private auditLogger: AuditLogger;
  private deviceFluidityManager: DeviceFluidityManager;
  private m3ganEyeInterface: M3GANEyeInterface;
  private stylePreferenceEngine: StylePreferenceEngine;

  constructor(config: M3GANConfig) {
    super();
    this.config = config;
    this.state = this.initializeState();
    
    logger.info('M3GAN Core initializing...', { userId: config.userId });
    
    this.initializeModules();
    this.setupEventHandlers();
    this.performSystemCheck();
  }

  private initializeState(): M3GANState {
    return {
      isActive: false,
      currentTask: null,
      emotionalState: 'neutral',
      userMood: 'neutral',
      systemHealth: 'optimal',
      lastInteraction: new Date(),
      trustLevel: 0.5
    };
  }

  private initializeModules(): void {
    try {
      // Initialize core modules
      this.visualCortex = new VisualCortex(this.config);
      this.audioCortex = new AudioCortex(this.config);
      this.htnPlanner = new HTNPlanner(this.config);
      this.moralityEngine = new MoralityEngine(this.config);
      this.localExecutionAgent = new LocalExecutionAgent(this.config);
      this.cloudReasoningCore = new CloudReasoningCore(this.config);
      this.selfCorrectionLoop = new SelfCorrectionLoop(this.config);
      this.emergencyKillSwitch = new EmergencyKillSwitch(this.config);
      this.auditLogger = new AuditLogger(this.config);
      this.deviceFluidityManager = new DeviceFluidityManager(this.config);
      this.m3ganEyeInterface = new M3GANEyeInterface(this.config);
      this.stylePreferenceEngine = new StylePreferenceEngine(this.config);

      logger.info('M3GAN modules initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize M3GAN modules:', error);
      throw new Error('M3GAN initialization failed');
    }
  }

  private setupEventHandlers(): void {
    // Visual Cortex Events
    this.visualCortex.on('personDetected', (person) => {
      this.handlePersonDetection(person);
    });

    this.visualCortex.on('gestureRecognized', (gesture) => {
      this.handleGestureRecognition(gesture);
    });

    this.visualCortex.on('environmentChanged', (change) => {
      this.handleEnvironmentChange(change);
    });

    // Audio Cortex Events
    this.audioCortex.on('speechRecognized', (speech) => {
      this.handleSpeechRecognition(speech);
    });

    this.audioCortex.on('emotionDetected', (emotion) => {
      this.handleEmotionDetection(emotion);
    });

    this.audioCortex.on('toneAnalyzed', (tone) => {
      this.handleToneAnalysis(tone);
    });

    // HTN Planner Events
    this.htnPlanner.on('taskPlanned', (task) => {
      this.handleTaskPlanning(task);
    });

    this.htnPlanner.on('taskFailed', (task) => {
      this.handleTaskFailure(task);
    });

    // Morality Engine Events
    this.moralityEngine.on('ethicalViolation', (violation) => {
      this.handleEthicalViolation(violation);
    });

    this.moralityEngine.on('consentRequired', (request) => {
      this.handleConsentRequest(request);
    });

    // Emergency Kill Switch Events
    this.emergencyKillSwitch.on('emergencyStop', () => {
      this.handleEmergencyStop();
    });
  }

  private async performSystemCheck(): Promise<void> {
    try {
      logger.info('Performing M3GAN system check...');
      
      // Check module health
      const moduleHealth = await this.checkModuleHealth();
      
      // Verify ethical boundaries
      const ethicalStatus = await this.moralityEngine.verifyBoundaries();
      
      // Test emergency systems
      const emergencyStatus = await this.emergencyKillSwitch.testSystem();
      
      if (moduleHealth && ethicalStatus && emergencyStatus) {
        this.state.systemHealth = 'optimal';
        this.state.isActive = true;
        logger.info('M3GAN system check passed - all systems operational');
        this.emit('systemReady');
      } else {
        this.state.systemHealth = 'degraded';
        logger.warn('M3GAN system check failed - degraded mode');
        this.emit('systemDegraded');
      }
    } catch (error) {
      logger.error('M3GAN system check failed:', error);
      this.state.systemHealth = 'critical';
      this.emit('systemCritical');
    }
  }

  private async checkModuleHealth(): Promise<boolean> {
    const modules = [
      this.visualCortex,
      this.audioCortex,
      this.htnPlanner,
      this.moralityEngine,
      this.localExecutionAgent,
      this.cloudReasoningCore,
      this.selfCorrectionLoop
    ];

    for (const module of modules) {
      if (!await module.isHealthy()) {
        return false;
      }
    }
    return true;
  }

  // Public API Methods
  public async processUserInput(input: string, context?: any): Promise<string> {
    if (!this.state.isActive) {
      throw new Error('M3GAN is not active');
    }

    try {
      // Log the interaction
      await this.auditLogger.logInteraction('userInput', { input, context });

      // Check ethical implications
      const ethicalCheck = await this.moralityEngine.validateInput(input);
      if (!ethicalCheck.approved) {
        await this.auditLogger.logViolation('inputRejected', ethicalCheck.reason);
        return `I cannot process that request: ${ethicalCheck.reason}`;
      }

      // Plan the task
      const task = await this.htnPlanner.planTask(input, context);
      
      // Execute the task
      const result = await this.executeTask(task);
      
      // Update state
      this.state.lastInteraction = new Date();
      this.state.currentTask = task.id;

      return result;
    } catch (error) {
      logger.error('Error processing user input:', error);
      await this.auditLogger.logError('inputProcessing', error);
      return 'I encountered an error processing your request. Please try again.';
    }
  }

  public async executeTask(task: TaskContext): Promise<string> {
    try {
      // Check if consent is required
      if (task.requiresConsent) {
        const consent = await this.requestConsent(task);
        if (!consent.granted) {
          return 'Task execution cancelled - consent not granted.';
        }
      }

      // Execute locally if possible
      if (this.localExecutionAgent.canExecute(task)) {
        return await this.localExecutionAgent.execute(task);
      }

      // Fall back to cloud reasoning
      if (this.config.permissions.cloudReasoning) {
        return await this.cloudReasoningCore.execute(task);
      }

      return 'Task cannot be executed with current permissions.';
    } catch (error) {
      logger.error('Task execution failed:', error);
      await this.selfCorrectionLoop.analyzeFailure(task, error);
      throw error;
    }
  }

  public async requestConsent(task: TaskContext): Promise<{ granted: boolean; reason?: string }> {
    // This would typically involve UI interaction
    // For now, we'll simulate consent based on trust level
    const trustThreshold = 0.7;
    
    if (this.state.trustLevel > trustThreshold) {
      return { granted: true };
    }

    // Emit event for UI to handle consent request
    this.emit('consentRequired', {
      taskId: task.taskId,
      description: task.description,
      implications: task.ethicalImplications
    });

    // In a real implementation, this would wait for user response
    return { granted: false, reason: 'Consent required from user' };
  }

  public async updateEmotionalState(emotion: M3GANState['emotionalState']): Promise<void> {
    this.state.emotionalState = emotion;
    await this.auditLogger.logStateChange('emotionalState', emotion);
    this.emit('emotionalStateChanged', emotion);
  }

  public async updateUserMood(mood: M3GANState['userMood']): Promise<void> {
    this.state.userMood = mood;
    await this.auditLogger.logStateChange('userMood', mood);
    this.emit('userMoodChanged', mood);
  }

  public async adjustTrustLevel(delta: number): Promise<void> {
    this.state.trustLevel = Math.max(0, Math.min(1, this.state.trustLevel + delta));
    await this.auditLogger.logStateChange('trustLevel', this.state.trustLevel);
    this.emit('trustLevelChanged', this.state.trustLevel);
  }

  public getState(): M3GANState {
    return { ...this.state };
  }

  public getConfig(): M3GANConfig {
    return { ...this.config };
  }

  public async shutdown(): Promise<void> {
    logger.info('M3GAN shutting down...');
    
    this.state.isActive = false;
    
    // Shutdown modules gracefully
    await Promise.all([
      this.visualCortex.shutdown(),
      this.audioCortex.shutdown(),
      this.htnPlanner.shutdown(),
      this.localExecutionAgent.shutdown(),
      this.cloudReasoningCore.shutdown(),
      this.selfCorrectionLoop.shutdown()
    ]);

    await this.auditLogger.logShutdown();
    this.emit('shutdown');
  }

  // Event Handlers
  private handlePersonDetection(person: any): void {
    logger.info('Person detected:', person);
    this.emit('personDetected', person);
  }

  private handleGestureRecognition(gesture: any): void {
    logger.info('Gesture recognized:', gesture);
    this.emit('gestureRecognized', gesture);
  }

  private handleEnvironmentChange(change: any): void {
    logger.info('Environment changed:', change);
    this.emit('environmentChanged', change);
  }

  private handleSpeechRecognition(speech: any): void {
    logger.info('Speech recognized:', speech);
    this.emit('speechRecognized', speech);
  }

  private handleEmotionDetection(emotion: any): void {
    logger.info('Emotion detected:', emotion);
    this.updateUserMood(emotion.mood);
  }

  private handleToneAnalysis(tone: any): void {
    logger.info('Tone analyzed:', tone);
    this.emit('toneAnalyzed', tone);
  }

  private handleTaskPlanning(task: TaskContext): void {
    logger.info('Task planned:', task);
    this.emit('taskPlanned', task);
  }

  private handleTaskFailure(task: TaskContext): void {
    logger.warn('Task failed:', task);
    this.emit('taskFailed', task);
  }

  private handleEthicalViolation(violation: any): void {
    logger.error('Ethical violation detected:', violation);
    this.emit('ethicalViolation', violation);
  }

  private handleConsentRequest(request: any): void {
    logger.info('Consent required:', request);
    this.emit('consentRequired', request);
  }

  private handleEmergencyStop(): void {
    logger.critical('Emergency stop activated!');
    this.state.isActive = false;
    this.state.systemHealth = 'critical';
    this.emit('emergencyStop');
  }
}

export default M3GANCore;

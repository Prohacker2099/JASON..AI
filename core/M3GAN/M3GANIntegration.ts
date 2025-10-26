// core/M3GAN/M3GANIntegration.ts
// M3GAN Integration with JASON System

import { EventEmitter } from 'events';
import { logger } from '../../server/src/utils/logger';
import M3GANCore, { M3GANConfig, M3GANState } from './M3GANCore';
import { LocalAI } from '../LocalAI';
import { CognitionEngine } from '../CognitionEngine';
import { VoiceAssistant } from '../VoiceAssistant';

export interface M3GANIntegrationConfig {
  userId: string;
  deviceId: string;
  enableVisualCortex: boolean;
  enableAudioCortex: boolean;
  enableHTNPlanner: boolean;
  enableMoralityEngine: boolean;
  enableLocalExecution: boolean;
  enableCloudReasoning: boolean;
  enableSelfCorrection: boolean;
  enableEmergencyKillSwitch: boolean;
  enableAuditLogging: boolean;
  integrationMode: 'full' | 'partial' | 'minimal';
}

export class M3GANIntegration extends EventEmitter {
  private config: M3GANIntegrationConfig;
  private m3ganCore: M3GANCore | null = null;
  private localAI: LocalAI;
  private cognitionEngine: CognitionEngine;
  private voiceAssistant: VoiceAssistant;
  private isActive: boolean = false;

  constructor(config: M3GANIntegrationConfig) {
    super();
    this.config = config;
    logger.info('M3GAN Integration initializing...', { userId: config.userId });
    
    // Initialize existing JASON components
    this.localAI = new LocalAI();
    this.cognitionEngine = new CognitionEngine();
    this.voiceAssistant = new VoiceAssistant();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize M3GAN Core
      await this.initializeM3GANCore();
      
      // Setup integration bridges
      await this.setupIntegrationBridges();
      
      // Start M3GAN services
      await this.startM3GANServices();
      
      this.isActive = true;
      logger.info('M3GAN Integration initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('M3GAN Integration initialization failed:', error);
      throw error;
    }
  }

  private async initializeM3GANCore(): Promise<void> {
    const m3ganConfig: M3GANConfig = {
      userId: this.config.userId,
      deviceId: this.config.deviceId,
      permissions: {
        visualAccess: this.config.enableVisualCortex,
        audioAccess: this.config.enableAudioCortex,
        deviceControl: this.config.enableLocalExecution,
        networkAccess: this.config.enableCloudReasoning,
        cloudReasoning: this.config.enableCloudReasoning
      },
      ethicalBoundaries: {
        harmPrevention: true,
        consentRequired: true,
        transparencyMode: true,
        auditLogging: this.config.enableAuditLogging
      },
      learningSettings: {
        enableLearning: true,
        feedbackRequired: true,
        moralValidation: true
      }
    };

    this.m3ganCore = new M3GANCore(m3ganConfig);
    
    // Setup M3GAN event handlers
    this.setupM3GANEventHandlers();
  }

  private setupM3GANEventHandlers(): void {
    if (!this.m3ganCore) return;

    // System events
    this.m3ganCore.on('systemReady', () => {
      logger.info('M3GAN system ready');
      this.emit('m3ganReady');
    });

    this.m3ganCore.on('systemDegraded', () => {
      logger.warn('M3GAN system degraded');
      this.emit('m3ganDegraded');
    });

    this.m3ganCore.on('systemCritical', () => {
      logger.error('M3GAN system critical');
      this.emit('m3ganCritical');
    });

    // Visual events
    this.m3ganCore.on('personDetected', (person) => {
      logger.info('Person detected via M3GAN:', person);
      this.emit('personDetected', person);
    });

    this.m3ganCore.on('gestureRecognized', (gesture) => {
      logger.info('Gesture recognized via M3GAN:', gesture);
      this.emit('gestureRecognized', gesture);
    });

    // Audio events
    this.m3ganCore.on('speechRecognized', (speech) => {
      logger.info('Speech recognized via M3GAN:', speech);
      this.emit('speechRecognized', speech);
    });

    this.m3ganCore.on('emotionDetected', (emotion) => {
      logger.info('Emotion detected via M3GAN:', emotion);
      this.emit('emotionDetected', emotion);
    });

    // Task events
    this.m3ganCore.on('taskPlanned', (task) => {
      logger.info('Task planned via M3GAN:', task);
      this.emit('taskPlanned', task);
    });

    this.m3ganCore.on('taskFailed', (task) => {
      logger.warn('Task failed via M3GAN:', task);
      this.emit('taskFailed', task);
    });

    // Ethical events
    this.m3ganCore.on('ethicalViolation', (violation) => {
      logger.error('Ethical violation detected:', violation);
      this.emit('ethicalViolation', violation);
    });

    this.m3ganCore.on('consentRequired', (request) => {
      logger.info('Consent required:', request);
      this.emit('consentRequired', request);
    });

    // Emergency events
    this.m3ganCore.on('emergencyStop', () => {
      logger.critical('EMERGENCY STOP ACTIVATED!');
      this.emit('emergencyStop');
    });
  }

  private async setupIntegrationBridges(): Promise<void> {
    // Bridge M3GAN with existing JASON components
    
    // Bridge with LocalAI
    this.localAI.on('newInsight', (insight) => {
      if (this.m3ganCore) {
        // Share insights with M3GAN
        this.m3ganCore.emit('jasonInsight', insight);
      }
    });

    // Bridge with CognitionEngine
    this.cognitionEngine.on('knowledgeUpdated', (knowledge) => {
      if (this.m3ganCore) {
        // Share knowledge updates with M3GAN
        this.m3ganCore.emit('jasonKnowledge', knowledge);
      }
    });

    // Bridge with VoiceAssistant
    this.voiceAssistant.on('commandProcessed', (command) => {
      if (this.m3ganCore) {
        // Process voice commands through M3GAN
        this.processVoiceCommandThroughM3GAN(command);
      }
    });

    // Bridge M3GAN events back to JASON components
    if (this.m3ganCore) {
      this.m3ganCore.on('emotionalStateChanged', (emotion) => {
        // Update LocalAI with emotional state
        this.localAI.emit('emotionalStateUpdate', emotion);
      });

      this.m3ganCore.on('userMoodChanged', (mood) => {
        // Update VoiceAssistant with user mood
        this.voiceAssistant.emit('userMoodUpdate', mood);
      });
    }
  }

  private async processVoiceCommandThroughM3GAN(command: any): Promise<void> {
    if (!this.m3ganCore) return;

    try {
      const response = await this.m3ganCore.processUserInput(command.text, {
        source: 'voice',
        confidence: command.confidence,
        timestamp: command.timestamp
      });

      // Send response back through voice assistant
      this.voiceAssistant.speak(response);
    } catch (error) {
      logger.error('Error processing voice command through M3GAN:', error);
      this.voiceAssistant.speak('I encountered an error processing your request.');
    }
  }

  private async startM3GANServices(): Promise<void> {
    if (!this.m3ganCore) return;

    try {
      // Start visual cortex if enabled
      if (this.config.enableVisualCortex) {
        await this.m3ganCore.visualCortex.startListening();
        logger.info('M3GAN Visual Cortex started');
      }

      // Start audio cortex if enabled
      if (this.config.enableAudioCortex) {
        await this.m3ganCore.audioCortex.startListening();
        logger.info('M3GAN Audio Cortex started');
      }

      logger.info('M3GAN services started successfully');
    } catch (error) {
      logger.error('Failed to start M3GAN services:', error);
      throw error;
    }
  }

  // Public API Methods
  public async processUserInput(input: string, context?: any): Promise<string> {
    if (!this.isActive || !this.m3ganCore) {
      throw new Error('M3GAN Integration is not active');
    }

    try {
      logger.info('Processing user input through M3GAN Integration:', { input: input.substring(0, 100) });
      
      // Process through M3GAN Core
      const response = await this.m3ganCore.processUserInput(input, context);
      
      // Also process through existing JASON components for comparison/fallback
      const jasonResponse = await this.localAI.processQuery(input, this.config.userId);
      
      // Combine responses or choose the best one
      const finalResponse = this.combineResponses(response, jasonResponse);
      
      logger.info('User input processed successfully');
      return finalResponse;
    } catch (error) {
      logger.error('Error processing user input:', error);
      
      // Fallback to existing JASON system
      try {
        return await this.localAI.processQuery(input, this.config.userId);
      } catch (fallbackError) {
        logger.error('Fallback processing also failed:', fallbackError);
        return 'I encountered an error processing your request. Please try again.';
      }
    }
  }

  private combineResponses(m3ganResponse: string, jasonResponse: string): string {
    // Simple response combination logic
    // In a more sophisticated implementation, this would use AI to combine responses
    
    if (m3ganResponse.length > jasonResponse.length) {
      return m3ganResponse;
    } else {
      return jasonResponse;
    }
  }

  public async getM3GANState(): Promise<M3GANState | null> {
    if (!this.m3ganCore) return null;
    return this.m3ganCore.getState();
  }

  public async getM3GANConfig(): Promise<M3GANConfig | null> {
    if (!this.m3ganCore) return null;
    return this.m3ganCore.getConfig();
  }

  public async updateM3GANEmotionalState(emotion: M3GANState['emotionalState']): Promise<void> {
    if (!this.m3ganCore) return;
    await this.m3ganCore.updateEmotionalState(emotion);
  }

  public async updateM3GANUserMood(mood: M3GANState['userMood']): Promise<void> {
    if (!this.m3ganCore) return;
    await this.m3ganCore.updateUserMood(mood);
  }

  public async adjustM3GANTrustLevel(delta: number): Promise<void> {
    if (!this.m3ganCore) return;
    await this.m3ganCore.adjustTrustLevel(delta);
  }

  public async getIntegrationStatus(): Promise<{
    isActive: boolean;
    m3ganActive: boolean;
    services: {
      visualCortex: boolean;
      audioCortex: boolean;
      htnPlanner: boolean;
      moralityEngine: boolean;
      localExecution: boolean;
      cloudReasoning: boolean;
      selfCorrection: boolean;
      emergencyKillSwitch: boolean;
      auditLogging: boolean;
    };
  }> {
    const m3ganState = await this.getM3GANState();
    
    return {
      isActive: this.isActive,
      m3ganActive: m3ganState?.isActive || false,
      services: {
        visualCortex: this.config.enableVisualCortex,
        audioCortex: this.config.enableAudioCortex,
        htnPlanner: this.config.enableHTNPlanner,
        moralityEngine: this.config.enableMoralityEngine,
        localExecution: this.config.enableLocalExecution,
        cloudReasoning: this.config.enableCloudReasoning,
        selfCorrection: this.config.enableSelfCorrection,
        emergencyKillSwitch: this.config.enableEmergencyKillSwitch,
        auditLogging: this.config.enableAuditLogging
      }
    };
  }

  public async updateConfig(newConfig: Partial<M3GANIntegrationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('M3GAN Integration config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      if (!this.isActive) return false;
      
      if (this.m3ganCore) {
        const m3ganState = await this.getM3GANState();
        return m3ganState?.isActive || false;
      }
      
      return false;
    } catch (error) {
      logger.error('M3GAN Integration health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('M3GAN Integration shutting down...');
    
    this.isActive = false;
    
    // Shutdown M3GAN Core
    if (this.m3ganCore) {
      await this.m3ganCore.shutdown();
    }
    
    logger.info('M3GAN Integration shutdown complete');
    this.emit('shutdown');
  }
}

export default M3GANIntegration;

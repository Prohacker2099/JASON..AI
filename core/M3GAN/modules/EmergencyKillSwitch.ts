// core/M3GAN/modules/EmergencyKillSwitch.ts
// Emergency Kill Switch for M3GAN

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface EmergencyEvent {
  id: string;
  type: 'manual' | 'automatic' | 'system' | 'ethical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export interface KillSwitchConfig {
  userId: string;
  enablePhysicalSwitch: boolean;
  enableDigitalOverride: boolean;
  enableAutomaticTriggers: boolean;
  enableEthicalTriggers: boolean;
  emergencyContacts: string[];
  autoRestartDelay: number; // milliseconds
  maxEmergencyEvents: number;
}

export class EmergencyKillSwitch extends EventEmitter {
  private config: KillSwitchConfig;
  private isActive: boolean = false;
  private isEngaged: boolean = false;
  private emergencyEvents: EmergencyEvent[] = [];
  private physicalSwitchState: boolean = false;
  private digitalOverrideState: boolean = false;
  private automaticTriggers: Map<string, any> = new Map();
  private ethicalTriggers: Map<string, any> = new Map();

  constructor(config: KillSwitchConfig) {
    super();
    this.config = config;
    logger.info('Emergency Kill Switch initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize physical switch monitoring
      if (this.config.enablePhysicalSwitch) {
        await this.initializePhysicalSwitch();
      }
      
      // Initialize digital override
      if (this.config.enableDigitalOverride) {
        await this.initializeDigitalOverride();
      }
      
      // Initialize automatic triggers
      if (this.config.enableAutomaticTriggers) {
        await this.initializeAutomaticTriggers();
      }
      
      // Initialize ethical triggers
      if (this.config.enableEthicalTriggers) {
        await this.initializeEthicalTriggers();
      }
      
      this.isActive = true;
      logger.info('Emergency Kill Switch initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Emergency Kill Switch initialization failed:', error);
      throw error;
    }
  }

  private async initializePhysicalSwitch(): Promise<void> {
    logger.info('Initializing physical emergency switch...');
    
    // In a real implementation, this would interface with physical hardware
    // For now, simulate physical switch state
    this.physicalSwitchState = false;
    
    // Simulate monitoring physical switch
    setInterval(() => {
      this.checkPhysicalSwitch();
    }, 1000);
    
    logger.info('Physical emergency switch initialized');
  }

  private async initializeDigitalOverride(): Promise<void> {
    logger.info('Initializing digital emergency override...');
    
    // In a real implementation, this would set up digital override mechanisms
    this.digitalOverrideState = false;
    
    logger.info('Digital emergency override initialized');
  }

  private async initializeAutomaticTriggers(): Promise<void> {
    logger.info('Initializing automatic emergency triggers...');
    
    // Define automatic triggers
    const triggers = [
      {
        id: 'system_overload',
        condition: 'system_resources > 95%',
        action: 'emergency_stop',
        severity: 'high'
      },
      {
        id: 'security_breach',
        condition: 'unauthorized_access_detected',
        action: 'emergency_stop',
        severity: 'critical'
      },
      {
        id: 'hardware_failure',
        condition: 'critical_hardware_failure',
        action: 'emergency_stop',
        severity: 'critical'
      },
      {
        id: 'network_anomaly',
        condition: 'suspicious_network_activity',
        action: 'emergency_stop',
        severity: 'high'
      }
    ];

    triggers.forEach(trigger => {
      this.automaticTriggers.set(trigger.id, trigger);
    });
    
    logger.info(`Initialized ${triggers.length} automatic triggers`);
  }

  private async initializeEthicalTriggers(): Promise<void> {
    logger.info('Initializing ethical emergency triggers...');
    
    // Define ethical triggers
    const triggers = [
      {
        id: 'harm_prevention',
        condition: 'potential_harm_detected',
        action: 'emergency_stop',
        severity: 'critical'
      },
      {
        id: 'privacy_violation',
        condition: 'unauthorized_data_access',
        action: 'emergency_stop',
        severity: 'high'
      },
      {
        id: 'consent_violation',
        condition: 'action_without_consent',
        action: 'emergency_stop',
        severity: 'high'
      },
      {
        id: 'bias_detection',
        condition: 'harmful_bias_detected',
        action: 'emergency_stop',
        severity: 'medium'
      }
    ];

    triggers.forEach(trigger => {
      this.ethicalTriggers.set(trigger.id, trigger);
    });
    
    logger.info(`Initialized ${triggers.length} ethical triggers`);
  }

  private checkPhysicalSwitch(): void {
    // In a real implementation, this would check actual physical switch state
    // For simulation, randomly trigger physical switch
    if (Math.random() < 0.001) { // 0.1% chance per second
      this.triggerPhysicalSwitch();
    }
  }

  private triggerPhysicalSwitch(): void {
    logger.critical('Physical emergency switch activated!');
    this.physicalSwitchState = true;
    this.engageEmergencyStop('physical', 'Physical emergency switch activated');
  }

  // Public API Methods
  public async engageEmergencyStop(type: EmergencyEvent['type'], description: string, context?: any): Promise<void> {
    if (this.isEngaged) {
      logger.warn('Emergency stop already engaged');
      return;
    }

    try {
      logger.critical('EMERGENCY STOP ENGAGED:', { type, description });
      
      this.isEngaged = true;
      
      // Create emergency event
      const emergencyEvent: EmergencyEvent = {
        id: `emergency_${Date.now()}`,
        type,
        severity: 'critical',
        description,
        context: context || {},
        timestamp: new Date(),
        resolved: false
      };
      
      this.emergencyEvents.push(emergencyEvent);
      
      // Limit number of emergency events
      if (this.emergencyEvents.length > this.config.maxEmergencyEvents) {
        this.emergencyEvents = this.emergencyEvents.slice(-this.config.maxEmergencyEvents);
      }
      
      // Emit emergency stop event
      this.emit('emergencyStop', emergencyEvent);
      
      // Notify emergency contacts
      await this.notifyEmergencyContacts(emergencyEvent);
      
      // Start auto-restart timer if configured
      if (this.config.autoRestartDelay > 0) {
        setTimeout(() => {
          this.disengageEmergencyStop('automatic_restart', 'System auto-restart after emergency stop');
        }, this.config.autoRestartDelay);
      }
      
    } catch (error) {
      logger.error('Failed to engage emergency stop:', error);
    }
  }

  public async disengageEmergencyStop(resolution: string, description: string): Promise<void> {
    if (!this.isEngaged) {
      logger.warn('Emergency stop not engaged');
      return;
    }

    try {
      logger.info('Disengaging emergency stop:', { resolution, description });
      
      this.isEngaged = false;
      this.physicalSwitchState = false;
      this.digitalOverrideState = false;
      
      // Update latest emergency event
      const latestEvent = this.emergencyEvents[this.emergencyEvents.length - 1];
      if (latestEvent) {
        latestEvent.resolved = true;
        latestEvent.resolution = resolution;
      }
      
      // Emit disengage event
      this.emit('emergencyDisengaged', { resolution, description, timestamp: new Date() });
      
    } catch (error) {
      logger.error('Failed to disengage emergency stop:', error);
    }
  }

  public async triggerAutomaticEmergency(triggerId: string, context?: any): Promise<void> {
    const trigger = this.automaticTriggers.get(triggerId);
    if (!trigger) {
      logger.error('Unknown automatic trigger:', triggerId);
      return;
    }

    logger.warn('Automatic emergency trigger activated:', { triggerId, condition: trigger.condition });
    
    await this.engageEmergencyStop('automatic', `Automatic trigger: ${trigger.condition}`, {
      triggerId,
      trigger,
      context
    });
  }

  public async triggerEthicalEmergency(triggerId: string, context?: any): Promise<void> {
    const trigger = this.ethicalTriggers.get(triggerId);
    if (!trigger) {
      logger.error('Unknown ethical trigger:', triggerId);
      return;
    }

    logger.warn('Ethical emergency trigger activated:', { triggerId, condition: trigger.condition });
    
    await this.engageEmergencyStop('ethical', `Ethical trigger: ${trigger.condition}`, {
      triggerId,
      trigger,
      context
    });
  }

  public async activateDigitalOverride(reason: string): Promise<void> {
    if (!this.config.enableDigitalOverride) {
      throw new Error('Digital override is disabled');
    }

    logger.warn('Digital emergency override activated:', reason);
    this.digitalOverrideState = true;
    
    await this.engageEmergencyStop('manual', `Digital override: ${reason}`, {
      overrideType: 'digital',
      reason
    });
  }

  public async testSystem(): Promise<boolean> {
    try {
      logger.info('Testing emergency kill switch system...');
      
      // Test physical switch
      if (this.config.enablePhysicalSwitch) {
        // Simulate physical switch test
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Test digital override
      if (this.config.enableDigitalOverride) {
        // Simulate digital override test
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Test automatic triggers
      if (this.config.enableAutomaticTriggers) {
        for (const [triggerId, trigger] of this.automaticTriggers) {
          // Simulate trigger test
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Test ethical triggers
      if (this.config.enableEthicalTriggers) {
        for (const [triggerId, trigger] of this.ethicalTriggers) {
          // Simulate trigger test
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      logger.info('Emergency kill switch system test completed successfully');
      return true;
    } catch (error) {
      logger.error('Emergency kill switch system test failed:', error);
      return false;
    }
  }

  public async getEmergencyEvents(): Promise<EmergencyEvent[]> {
    return [...this.emergencyEvents];
  }

  public async getSystemStatus(): Promise<{
    isActive: boolean;
    isEngaged: boolean;
    physicalSwitchState: boolean;
    digitalOverrideState: boolean;
    emergencyEventCount: number;
    lastEmergencyEvent?: EmergencyEvent;
  }> {
    return {
      isActive: this.isActive,
      isEngaged: this.isEngaged,
      physicalSwitchState: this.physicalSwitchState,
      digitalOverrideState: this.digitalOverrideState,
      emergencyEventCount: this.emergencyEvents.length,
      lastEmergencyEvent: this.emergencyEvents[this.emergencyEvents.length - 1]
    };
  }

  public async updateConfig(newConfig: Partial<KillSwitchConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Emergency Kill Switch config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && !this.isEngaged;
    } catch (error) {
      logger.error('Emergency Kill Switch health check failed:', error);
      return false;
    }
  }

  private async notifyEmergencyContacts(emergencyEvent: EmergencyEvent): Promise<void> {
    if (this.config.emergencyContacts.length === 0) {
      logger.warn('No emergency contacts configured');
      return;
    }

    logger.info('Notifying emergency contacts:', { 
      contactCount: this.config.emergencyContacts.length,
      eventId: emergencyEvent.id 
    });

    // In a real implementation, this would send actual notifications
    // For now, just log the notification
    for (const contact of this.config.emergencyContacts) {
      logger.info(`Emergency notification sent to: ${contact}`);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Emergency Kill Switch shutting down...');
    
    this.isActive = false;
    
    // Clear triggers
    this.automaticTriggers.clear();
    this.ethicalTriggers.clear();
    
    logger.info('Emergency Kill Switch shutdown complete');
    this.emit('shutdown');
  }
}

export default EmergencyKillSwitch;

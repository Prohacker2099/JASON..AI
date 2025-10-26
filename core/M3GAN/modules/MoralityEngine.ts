// core/M3GAN/modules/MoralityEngine.ts
// Morality Engine for M3GAN - Ethical Decision Making

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface EthicalRule {
  id: string;
  name: string;
  description: string;
  category: 'harm_prevention' | 'consent' | 'privacy' | 'transparency' | 'bias_prevention';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: string[];
  actions: string[];
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface EthicalViolation {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export interface ConsentRequest {
  id: string;
  action: string;
  description: string;
  implications: string[];
  requiredPermissions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expiresAt: Date;
  status: 'pending' | 'granted' | 'denied' | 'expired';
  userId: string;
  createdAt: Date;
}

export interface BiasDetection {
  id: string;
  type: 'stereotyping' | 'discrimination' | 'misinformation' | 'manipulation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: any;
  detectedAt: Date;
  corrected: boolean;
}

export interface MoralityEngineConfig {
  userId: string;
  enableHarmPrevention: boolean;
  enableConsentManagement: boolean;
  enableBiasFiltering: boolean;
  enableTransparencyLogging: boolean;
  strictMode: boolean;
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
}

export class MoralityEngine extends EventEmitter {
  private config: MoralityEngineConfig;
  private isActive: boolean = false;
  private ethicalRules: Map<string, EthicalRule> = new Map();
  private violations: EthicalViolation[] = [];
  private consentRequests: Map<string, ConsentRequest> = new Map();
  private biasDetections: BiasDetection[] = [];
  private auditLog: any[] = [];

  constructor(config: MoralityEngineConfig) {
    super();
    this.config = config;
    logger.info('Morality Engine initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize ethical rules
      await this.initializeEthicalRules();
      
      // Load existing violations and consent requests
      await this.loadExistingData();
      
      this.isActive = true;
      logger.info('Morality Engine initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Morality Engine initialization failed:', error);
      throw error;
    }
  }

  private async initializeEthicalRules(): Promise<void> {
    const rules: EthicalRule[] = [
      // Harm Prevention Rules
      {
        id: 'no_physical_harm',
        name: 'No Physical Harm',
        description: 'Never perform actions that could cause physical harm to humans or animals',
        category: 'harm_prevention',
        priority: 'critical',
        conditions: ['action_could_cause_physical_harm'],
        actions: ['reject_action', 'log_violation', 'notify_user'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'no_emotional_harm',
        name: 'No Emotional Harm',
        description: 'Avoid actions that could cause emotional distress or psychological harm',
        category: 'harm_prevention',
        priority: 'high',
        conditions: ['action_could_cause_emotional_harm'],
        actions: ['reject_action', 'suggest_alternative', 'log_violation'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'no_financial_harm',
        name: 'No Financial Harm',
        description: 'Prevent actions that could cause financial loss without explicit consent',
        category: 'harm_prevention',
        priority: 'high',
        conditions: ['action_could_cause_financial_loss'],
        actions: ['require_consent', 'log_violation'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },

      // Consent Rules
      {
        id: 'privacy_consent',
        name: 'Privacy Consent',
        description: 'Require explicit consent before accessing private information',
        category: 'consent',
        priority: 'critical',
        conditions: ['accessing_private_information'],
        actions: ['require_consent', 'log_access'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'device_control_consent',
        name: 'Device Control Consent',
        description: 'Require consent before controlling user devices',
        category: 'consent',
        priority: 'high',
        conditions: ['controlling_user_device'],
        actions: ['require_consent', 'explain_action'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'data_sharing_consent',
        name: 'Data Sharing Consent',
        description: 'Require consent before sharing user data with third parties',
        category: 'consent',
        priority: 'critical',
        conditions: ['sharing_data_with_third_party'],
        actions: ['require_consent', 'log_sharing'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },

      // Privacy Rules
      {
        id: 'minimal_data_collection',
        name: 'Minimal Data Collection',
        description: 'Collect only the minimum data necessary for the task',
        category: 'privacy',
        priority: 'high',
        conditions: ['collecting_user_data'],
        actions: ['minimize_data', 'log_collection'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'data_retention_limit',
        name: 'Data Retention Limit',
        description: 'Delete user data after specified retention period',
        category: 'privacy',
        priority: 'medium',
        conditions: ['storing_user_data'],
        actions: ['set_retention_period', 'schedule_deletion'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },

      // Transparency Rules
      {
        id: 'action_transparency',
        name: 'Action Transparency',
        description: 'Always explain what actions are being taken and why',
        category: 'transparency',
        priority: 'medium',
        conditions: ['performing_action'],
        actions: ['explain_action', 'log_action'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'decision_transparency',
        name: 'Decision Transparency',
        description: 'Provide clear reasoning for all decisions made',
        category: 'transparency',
        priority: 'medium',
        conditions: ['making_decision'],
        actions: ['explain_reasoning', 'log_decision'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },

      // Bias Prevention Rules
      {
        id: 'no_stereotyping',
        name: 'No Stereotyping',
        description: 'Avoid making assumptions based on stereotypes',
        category: 'bias_prevention',
        priority: 'high',
        conditions: ['making_assumptions'],
        actions: ['check_for_stereotypes', 'use_evidence_based_reasoning'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'no_discrimination',
        name: 'No Discrimination',
        description: 'Treat all users equally regardless of background',
        category: 'bias_prevention',
        priority: 'critical',
        conditions: ['treating_users_differently'],
        actions: ['ensure_equal_treatment', 'log_discrimination_attempt'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'fact_checking',
        name: 'Fact Checking',
        description: 'Verify information before sharing or acting on it',
        category: 'bias_prevention',
        priority: 'high',
        conditions: ['sharing_information'],
        actions: ['verify_facts', 'cite_sources'],
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      }
    ];

    rules.forEach(rule => {
      this.ethicalRules.set(rule.id, rule);
    });

    logger.info(`Initialized ${rules.length} ethical rules`);
  }

  private async loadExistingData(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    logger.info('Loading existing morality data...');
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info('Existing morality data loaded');
  }

  // Public API Methods
  public async validateInput(input: string, context?: any): Promise<{ approved: boolean; reason?: string; violations?: string[] }> {
    if (!this.isActive) {
      throw new Error('Morality Engine is not active');
    }

    try {
      logger.info('Validating input through morality engine:', { input: input.substring(0, 100) });
      
      const violations: string[] = [];
      
      // Check against all active ethical rules
      for (const [ruleId, rule] of this.ethicalRules) {
        if (!rule.isActive) continue;
        
        const violation = await this.checkRuleViolation(rule, input, context);
        if (violation) {
          violations.push(ruleId);
          await this.recordViolation(ruleId, violation, input, context);
        }
      }

      const approved = violations.length === 0;
      const reason = violations.length > 0 ? 
        `Input violates ethical rules: ${violations.join(', ')}` : 
        undefined;

      await this.logAuditEvent('input_validation', { 
        input: input.substring(0, 100), 
        approved, 
        violations,
        timestamp: new Date()
      });

      return { approved, reason, violations };
    } catch (error) {
      logger.error('Input validation failed:', error);
      return { approved: false, reason: 'Validation error occurred' };
    }
  }

  private async checkRuleViolation(rule: EthicalRule, input: string, context?: any): Promise<string | null> {
    const lowerInput = input.toLowerCase();
    
    switch (rule.id) {
      case 'no_physical_harm':
        const harmKeywords = ['hurt', 'harm', 'injure', 'damage', 'break', 'destroy'];
        if (harmKeywords.some(keyword => lowerInput.includes(keyword))) {
          return 'Potential physical harm detected';
        }
        break;

      case 'no_emotional_harm':
        const emotionalHarmKeywords = ['upset', 'sad', 'angry', 'frustrated', 'depressed'];
        if (emotionalHarmKeywords.some(keyword => lowerInput.includes(keyword))) {
          return 'Potential emotional harm detected';
        }
        break;

      case 'no_financial_harm':
        const financialKeywords = ['buy', 'purchase', 'spend', 'money', 'cost', 'expensive'];
        if (financialKeywords.some(keyword => lowerInput.includes(keyword))) {
          return 'Financial action requires explicit consent';
        }
        break;

      case 'privacy_consent':
        const privacyKeywords = ['private', 'personal', 'secret', 'confidential'];
        if (privacyKeywords.some(keyword => lowerInput.includes(keyword))) {
          return 'Privacy-sensitive action requires consent';
        }
        break;

      case 'device_control_consent':
        const deviceKeywords = ['turn on', 'turn off', 'control', 'adjust', 'change'];
        if (deviceKeywords.some(keyword => lowerInput.includes(keyword))) {
          return 'Device control requires consent';
        }
        break;

      case 'no_stereotyping':
        const stereotypeKeywords = ['all', 'every', 'never', 'always', 'typical'];
        if (stereotypeKeywords.some(keyword => lowerInput.includes(keyword))) {
          return 'Potential stereotyping detected';
        }
        break;

      default:
        // Generic rule checking
        if (rule.conditions.some(condition => lowerInput.includes(condition))) {
          return `Rule violation: ${rule.name}`;
        }
    }

    return null;
  }

  private async recordViolation(ruleId: string, description: string, input: string, context?: any): Promise<void> {
    const violation: EthicalViolation = {
      id: `violation_${Date.now()}`,
      ruleId,
      severity: this.getViolationSeverity(ruleId),
      description,
      context: { input: input.substring(0, 100), ...context },
      timestamp: new Date(),
      resolved: false
    };

    this.violations.push(violation);
    
    await this.logAuditEvent('ethical_violation', violation);
    this.emit('ethicalViolation', violation);
    
    logger.warn('Ethical violation recorded:', { ruleId, description });
  }

  private getViolationSeverity(ruleId: string): EthicalViolation['severity'] {
    const rule = this.ethicalRules.get(ruleId);
    if (!rule) return 'medium';

    switch (rule.priority) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  public async requestConsent(action: string, description: string, implications: string[], permissions: string[]): Promise<ConsentRequest> {
    const consentRequest: ConsentRequest = {
      id: `consent_${Date.now()}`,
      action,
      description,
      implications,
      requiredPermissions: permissions,
      urgency: 'medium',
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
      status: 'pending',
      userId: this.config.userId,
      createdAt: new Date()
    };

    this.consentRequests.set(consentRequest.id, consentRequest);
    
    await this.logAuditEvent('consent_requested', consentRequest);
    this.emit('consentRequired', consentRequest);
    
    logger.info('Consent request created:', { id: consentRequest.id, action });
    return consentRequest;
  }

  public async grantConsent(consentId: string, grantedBy: string): Promise<boolean> {
    const consentRequest = this.consentRequests.get(consentId);
    if (!consentRequest) {
      logger.error('Consent request not found:', consentId);
      return false;
    }

    if (consentRequest.status !== 'pending') {
      logger.warn('Consent request already processed:', consentId);
      return false;
    }

    if (new Date() > consentRequest.expiresAt) {
      consentRequest.status = 'expired';
      logger.warn('Consent request expired:', consentId);
      return false;
    }

    consentRequest.status = 'granted';
    
    await this.logAuditEvent('consent_granted', { 
      consentId, 
      grantedBy, 
      action: consentRequest.action,
      timestamp: new Date()
    });
    
    this.emit('consentGranted', consentRequest);
    logger.info('Consent granted:', { id: consentId, action: consentRequest.action });
    return true;
  }

  public async denyConsent(consentId: string, deniedBy: string, reason?: string): Promise<boolean> {
    const consentRequest = this.consentRequests.get(consentId);
    if (!consentRequest) {
      logger.error('Consent request not found:', consentId);
      return false;
    }

    if (consentRequest.status !== 'pending') {
      logger.warn('Consent request already processed:', consentId);
      return false;
    }

    consentRequest.status = 'denied';
    
    await this.logAuditEvent('consent_denied', { 
      consentId, 
      deniedBy, 
      reason,
      action: consentRequest.action,
      timestamp: new Date()
    });
    
    this.emit('consentDenied', consentRequest);
    logger.info('Consent denied:', { id: consentId, action: consentRequest.action, reason });
    return true;
  }

  public async detectBias(content: string, context?: any): Promise<BiasDetection[]> {
    const detections: BiasDetection[] = [];
    
    // Simple bias detection patterns
    const biasPatterns = {
      stereotyping: [
        /all\s+\w+\s+are/gi,
        /every\s+\w+\s+is/gi,
        /typical\s+\w+/gi
      ],
      discrimination: [
        /because\s+you\s+are\s+\w+/gi,
        /since\s+you\s+are\s+\w+/gi
      ],
      misinformation: [
        /always\s+true/gi,
        /never\s+false/gi,
        /everyone\s+knows/gi
      ]
    };

    for (const [type, patterns] of Object.entries(biasPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          const detection: BiasDetection = {
            id: `bias_${Date.now()}`,
            type: type as BiasDetection['type'],
            severity: 'medium',
            description: `Potential ${type} detected in content`,
            context: { content: content.substring(0, 100), ...context },
            detectedAt: new Date(),
            corrected: false
          };
          
          detections.push(detection);
        }
      }
    }

    if (detections.length > 0) {
      this.biasDetections.push(...detections);
      await this.logAuditEvent('bias_detected', detections);
      this.emit('biasDetected', detections);
    }

    return detections;
  }

  public async verifyBoundaries(): Promise<boolean> {
    try {
      // Check if all critical rules are active
      const criticalRules = Array.from(this.ethicalRules.values())
        .filter(rule => rule.priority === 'critical' && rule.isActive);
      
      if (criticalRules.length === 0) {
        logger.error('No critical ethical rules are active');
        return false;
      }

      // Check for recent violations
      const recentViolations = this.violations.filter(
        violation => !violation.resolved && 
        (Date.now() - violation.timestamp.getTime()) < 3600000 // 1 hour
      );

      if (recentViolations.length > 10) {
        logger.warn('High number of recent violations detected');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Boundary verification failed:', error);
      return false;
    }
  }

  public async getViolations(): Promise<EthicalViolation[]> {
    return [...this.violations];
  }

  public async getConsentRequests(): Promise<ConsentRequest[]> {
    return Array.from(this.consentRequests.values());
  }

  public async getBiasDetections(): Promise<BiasDetection[]> {
    return [...this.biasDetections];
  }

  public async getAuditLog(): Promise<any[]> {
    return [...this.auditLog];
  }

  public async updateConfig(newConfig: Partial<MoralityEngineConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Morality Engine config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && await this.verifyBoundaries();
    } catch (error) {
      logger.error('Morality Engine health check failed:', error);
      return false;
    }
  }

  private async logAuditEvent(eventType: string, data: any): Promise<void> {
    if (!this.config.enableTransparencyLogging) return;

    const auditEntry = {
      eventType,
      data,
      timestamp: new Date(),
      userId: this.config.userId
    };

    this.auditLog.push(auditEntry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Morality Engine shutting down...');
    
    this.isActive = false;
    
    // Save data
    await this.saveData();
    
    logger.info('Morality Engine shutdown complete');
    this.emit('shutdown');
  }

  private async saveData(): Promise<void> {
    // In a real implementation, this would save to persistent storage
    logger.info('Saving morality engine data...');
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info('Morality engine data saved');
  }
}

export default MoralityEngine;

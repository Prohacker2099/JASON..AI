// core/M3GAN/modules/AuditLogger.ts
// Audit Logger for M3GAN

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface AuditEntry {
  id: string;
  eventType: string;
  category: 'user_action' | 'system_event' | 'security_event' | 'ethical_event' | 'performance_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  data: any;
  userId: string;
  sessionId?: string;
  timestamp: Date;
  source: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  categories?: AuditEntry['category'][];
  severities?: AuditEntry['severity'][];
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEntries: number;
  entriesByCategory: Record<string, number>;
  entriesBySeverity: Record<string, number>;
  entriesByEventType: Record<string, number>;
  recentActivity: number; // entries in last 24 hours
  criticalEvents: number; // critical events in last 24 hours
}

export interface AuditLoggerConfig {
  userId: string;
  enableAuditLogging: boolean;
  enableSecurityLogging: boolean;
  enablePerformanceLogging: boolean;
  enableEthicalLogging: boolean;
  logLevel: 'minimal' | 'standard' | 'comprehensive';
  maxEntries: number;
  retentionDays: number;
  enableEncryption: boolean;
  enableCompression: boolean;
}

export class AuditLogger extends EventEmitter {
  private config: AuditLoggerConfig;
  private isActive: boolean = false;
  private auditEntries: AuditEntry[] = [];
  private sessionId: string;
  private entryCounter: number = 0;

  constructor(config: AuditLoggerConfig) {
    super();
    this.config = config;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Audit Logger initializing...', { userId: config.userId, sessionId: this.sessionId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing audit entries
      await this.loadExistingEntries();
      
      // Start cleanup routine
      this.startCleanupRoutine();
      
      this.isActive = true;
      logger.info('Audit Logger initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Audit Logger initialization failed:', error);
      throw error;
    }
  }

  private async loadExistingEntries(): Promise<void> {
    logger.info('Loading existing audit entries...');
    
    // In a real implementation, this would load from persistent storage
    // For now, simulate loading some initial entries
    const initialEntries: AuditEntry[] = [
      {
        id: `audit_${Date.now() - 86400000}`,
        eventType: 'system_startup',
        category: 'system_event',
        severity: 'medium',
        description: 'M3GAN system started',
        data: { version: '1.0.0', components: ['core', 'visual', 'audio'] },
        userId: this.config.userId,
        sessionId: `session_${Date.now() - 86400000}`,
        timestamp: new Date(Date.now() - 86400000),
        source: 'system'
      }
    ];

    this.auditEntries = initialEntries;
    logger.info(`Loaded ${initialEntries.length} existing audit entries`);
  }

  private startCleanupRoutine(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.performCleanup();
    }, 3600000);
  }

  private async performCleanup(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
      const initialCount = this.auditEntries.length;
      
      // Remove old entries
      this.auditEntries = this.auditEntries.filter(entry => entry.timestamp > cutoffDate);
      
      // Limit total entries
      if (this.auditEntries.length > this.config.maxEntries) {
        this.auditEntries = this.auditEntries.slice(-this.config.maxEntries);
      }
      
      const removedCount = initialCount - this.auditEntries.length;
      if (removedCount > 0) {
        logger.info(`Audit cleanup completed: removed ${removedCount} old entries`);
      }
    } catch (error) {
      logger.error('Audit cleanup failed:', error);
    }
  }

  // Public API Methods
  public async logInteraction(eventType: string, data: any, severity: AuditEntry['severity'] = 'low'): Promise<void> {
    if (!this.config.enableAuditLogging) return;

    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType,
      category: 'user_action',
      severity,
      description: `User interaction: ${eventType}`,
      data,
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'user_interface'
    };

    await this.addAuditEntry(entry);
  }

  public async logSystemEvent(eventType: string, data: any, severity: AuditEntry['severity'] = 'medium'): Promise<void> {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType,
      category: 'system_event',
      severity,
      description: `System event: ${eventType}`,
      data,
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'system'
    };

    await this.addAuditEntry(entry);
  }

  public async logSecurityEvent(eventType: string, data: any, severity: AuditEntry['severity'] = 'high'): Promise<void> {
    if (!this.config.enableSecurityLogging) return;

    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType,
      category: 'security_event',
      severity,
      description: `Security event: ${eventType}`,
      data,
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'security_system'
    };

    await this.addAuditEntry(entry);
  }

  public async logEthicalEvent(eventType: string, data: any, severity: AuditEntry['severity'] = 'medium'): Promise<void> {
    if (!this.config.enableEthicalLogging) return;

    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType,
      category: 'ethical_event',
      severity,
      description: `Ethical event: ${eventType}`,
      data,
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'morality_engine'
    };

    await this.addAuditEntry(entry);
  }

  public async logPerformanceEvent(eventType: string, data: any, severity: AuditEntry['severity'] = 'low'): Promise<void> {
    if (!this.config.enablePerformanceLogging) return;

    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType,
      category: 'performance_event',
      severity,
      description: `Performance event: ${eventType}`,
      data,
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'performance_monitor'
    };

    await this.addAuditEntry(entry);
  }

  public async logViolation(violationType: string, reason: string, data?: any): Promise<void> {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType: 'ethical_violation',
      category: 'ethical_event',
      severity: 'high',
      description: `Ethical violation: ${violationType}`,
      data: {
        violationType,
        reason,
        ...data
      },
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'morality_engine'
    };

    await this.addAuditEntry(entry);
  }

  public async logStateChange(stateType: string, newValue: any, oldValue?: any): Promise<void> {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType: 'state_change',
      category: 'system_event',
      severity: 'low',
      description: `State change: ${stateType}`,
      data: {
        stateType,
        newValue,
        oldValue
      },
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'state_manager'
    };

    await this.addAuditEntry(entry);
  }

  public async logError(errorType: string, error: any, context?: any): Promise<void> {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType: 'error',
      category: 'system_event',
      severity: 'high',
      description: `Error: ${errorType}`,
      data: {
        errorType,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        context
      },
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'error_handler'
    };

    await this.addAuditEntry(entry);
  }

  public async logShutdown(): Promise<void> {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++this.entryCounter}`,
      eventType: 'system_shutdown',
      category: 'system_event',
      severity: 'medium',
      description: 'M3GAN system shutdown',
      data: {
        sessionId: this.sessionId,
        totalEntries: this.auditEntries.length,
        uptime: Date.now() - parseInt(this.sessionId.split('_')[1])
      },
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      source: 'system'
    };

    await this.addAuditEntry(entry);
  }

  private async addAuditEntry(entry: AuditEntry): Promise<void> {
    try {
      // Add to audit entries
      this.auditEntries.push(entry);
      
      // Emit audit event
      this.emit('auditEntry', entry);
      
      // Log to system logger based on severity
      switch (entry.severity) {
        case 'critical':
          logger.error('CRITICAL AUDIT:', entry);
          break;
        case 'high':
          logger.warn('HIGH AUDIT:', entry);
          break;
        case 'medium':
          logger.info('MEDIUM AUDIT:', entry);
          break;
        case 'low':
          logger.debug('LOW AUDIT:', entry);
          break;
      }
      
    } catch (error) {
      logger.error('Failed to add audit entry:', error);
    }
  }

  public async queryAuditLog(query: AuditQuery): Promise<AuditEntry[]> {
    let filteredEntries = [...this.auditEntries];
    
    // Apply filters
    if (query.startDate) {
      filteredEntries = filteredEntries.filter(entry => entry.timestamp >= query.startDate!);
    }
    
    if (query.endDate) {
      filteredEntries = filteredEntries.filter(entry => entry.timestamp <= query.endDate!);
    }
    
    if (query.eventTypes && query.eventTypes.length > 0) {
      filteredEntries = filteredEntries.filter(entry => query.eventTypes!.includes(entry.eventType));
    }
    
    if (query.categories && query.categories.length > 0) {
      filteredEntries = filteredEntries.filter(entry => query.categories!.includes(entry.category));
    }
    
    if (query.severities && query.severities.length > 0) {
      filteredEntries = filteredEntries.filter(entry => query.severities!.includes(entry.severity));
    }
    
    if (query.userId) {
      filteredEntries = filteredEntries.filter(entry => entry.userId === query.userId);
    }
    
    // Sort by timestamp (newest first)
    filteredEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    if (query.offset) {
      filteredEntries = filteredEntries.slice(query.offset);
    }
    
    if (query.limit) {
      filteredEntries = filteredEntries.slice(0, query.limit);
    }
    
    return filteredEntries;
  }

  public async getAuditStats(): Promise<AuditStats> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEntries = this.auditEntries.filter(entry => entry.timestamp > last24Hours);
    const criticalEntries = recentEntries.filter(entry => entry.severity === 'critical');
    
    const entriesByCategory: Record<string, number> = {};
    const entriesBySeverity: Record<string, number> = {};
    const entriesByEventType: Record<string, number> = {};
    
    this.auditEntries.forEach(entry => {
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
      entriesBySeverity[entry.severity] = (entriesBySeverity[entry.severity] || 0) + 1;
      entriesByEventType[entry.eventType] = (entriesByEventType[entry.eventType] || 0) + 1;
    });
    
    return {
      totalEntries: this.auditEntries.length,
      entriesByCategory,
      entriesBySeverity,
      entriesByEventType,
      recentActivity: recentEntries.length,
      criticalEvents: criticalEntries.length
    };
  }

  public async exportAuditLog(format: 'json' | 'csv' | 'txt' = 'json'): Promise<string> {
    const entries = this.auditEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
      
      case 'csv':
        const headers = ['id', 'eventType', 'category', 'severity', 'description', 'userId', 'timestamp', 'source'];
        const csvRows = [headers.join(',')];
        
        entries.forEach(entry => {
          const row = headers.map(header => {
            const value = entry[header as keyof AuditEntry];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          });
          csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
      
      case 'txt':
        return entries.map(entry => 
          `[${entry.timestamp.toISOString()}] ${entry.severity.toUpperCase()} - ${entry.eventType}: ${entry.description}`
        ).join('\n');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  public async updateConfig(newConfig: Partial<AuditLoggerConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Audit Logger config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && this.auditEntries.length >= 0;
    } catch (error) {
      logger.error('Audit Logger health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Audit Logger shutting down...');
    
    this.isActive = false;
    
    // Log shutdown
    await this.logShutdown();
    
    // Save audit entries
    await this.saveAuditEntries();
    
    logger.info('Audit Logger shutdown complete');
    this.emit('shutdown');
  }

  private async saveAuditEntries(): Promise<void> {
    // In a real implementation, this would save to persistent storage
    logger.info('Saving audit entries...');
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info(`Saved ${this.auditEntries.length} audit entries`);
  }
}

export default AuditLogger;

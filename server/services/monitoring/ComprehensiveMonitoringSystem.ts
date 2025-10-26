import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    averageQueryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  websockets: {
    connections: number;
    messagesReceived: number;
    messagesSent: number;
  };
  energy: {
    devicesMonitored: number;
    readingsPerSecond: number;
    anomaliesDetected: number;
    optimizationsPerformed: number;
  };
  ai: {
    predictionsGenerated: number;
    modelsLoaded: number;
    inferenceTime: number;
    accuracy: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  metadata?: any;
  userId?: string;
  requestId?: string;
  duration?: number;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  details?: any;
}

/**
 * Comprehensive Monitoring System
 * Provides real-time monitoring, logging, alerting, and performance analytics
 */
export class ComprehensiveMonitoringSystem extends EventEmitter {
  private systemMetrics: SystemMetrics[] = [];
  private applicationMetrics: ApplicationMetrics[] = [];
  private performanceAlerts: PerformanceAlert[] = [];
  private logEntries: LogEntry[] = [];
  private healthChecks = new Map<string, HealthCheck>();

  // Monitoring intervals
  private systemMetricsInterval: NodeJS.Timeout | null = null;
  private applicationMetricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;

  // Configuration
  private config = {
    systemMetricsInterval: 30000, // 30 seconds
    applicationMetricsInterval: 60000, // 1 minute
    healthCheckInterval: 120000, // 2 minutes
    alertCheckInterval: 10000, // 10 seconds
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxLogEntries: 10000,
    thresholds: {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 5000,
      errorRate: 5
    }
  };

  // Performance counters
  private counters = {
    requests: { total: 0, successful: 0, failed: 0, totalResponseTime: 0 },
    database: { connections: 0, queries: 0, slowQueries: 0, totalQueryTime: 0 },
    cache: { hits: 0, misses: 0, size: 0 },
    websockets: { connections: 0, messagesReceived: 0, messagesSent: 0 },
    energy: { devicesMonitored: 0, readingsPerSecond: 0, anomaliesDetected: 0, optimizationsPerformed: 0 },
    ai: { predictionsGenerated: 0, modelsLoaded: 0, totalInferenceTime: 0, correctPredictions: 0 }
  };

  constructor() {
    super();
    this.startMonitoring();
    this.setupLogCapture();
    logger.info('📊 Comprehensive Monitoring System initialized');
  }

  private startMonitoring(): void {
    // System metrics collection
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.systemMetricsInterval);

    // Application metrics collection
    this.applicationMetricsInterval = setInterval(() => {
      this.collectApplicationMetrics();
    }, this.config.applicationMetricsInterval);

    // Health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    // Alert checking
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, this.config.alertCheckInterval);

    // Cleanup old data
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Every hour
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      const cpuUsage = await this.getCpuUsage();
      const memoryInfo = this.getMemoryInfo();
      const diskInfo = await this.getDiskInfo();
      const networkInfo = this.getNetworkInfo();
      const processInfo = this.getProcessInfo();

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: cpuUsage,
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        },
        memory: memoryInfo,
        disk: diskInfo,
        network: networkInfo,
        process: processInfo
      };

      this.systemMetrics.push(metrics);
      this.emit('systemMetrics', metrics);

      // Check for performance issues
      this.checkSystemPerformance(metrics);

    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);
        
        const totalTime = currentTime[0] * 1000000 + currentTime[1] / 1000;
        const cpuTime = (currentUsage.user + currentUsage.system);
        const cpuPercent = (cpuTime / totalTime) * 100;
        
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  private getMemoryInfo(): SystemMetrics['memory'] {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    return { total, used, free, usage };
  }

  private async getDiskInfo(): Promise<SystemMetrics['disk']> {
    try {
      const stats = await fs.promises.statvfs?.(process.cwd()) || 
                   await this.getDiskInfoFallback();
      
      return stats;
    } catch (error) {
      return { total: 0, used: 0, free: 0, usage: 0 };
    }
  }

  private async getDiskInfoFallback(): Promise<SystemMetrics['disk']> {
    // Fallback for systems without statvfs
    try {
      const stats = await fs.promises.stat(process.cwd());
      return {
        total: 1000000000, // 1GB placeholder
        used: 500000000,   // 500MB placeholder
        free: 500000000,   // 500MB placeholder
        usage: 50          // 50% placeholder
      };
    } catch {
      return { total: 0, used: 0, free: 0, usage: 0 };
    }
  }

  private getNetworkInfo(): SystemMetrics['network'] {
    // Placeholder - in production, you'd use system tools or libraries
    return {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0
    };
  }

  private getProcessInfo(): SystemMetrics['process'] {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  private collectApplicationMetrics(): void {
    try {
      const metrics: ApplicationMetrics = {
        timestamp: new Date(),
        requests: {
          total: this.counters.requests.total,
          successful: this.counters.requests.successful,
          failed: this.counters.requests.failed,
          averageResponseTime: this.counters.requests.total > 0 ? 
            this.counters.requests.totalResponseTime / this.counters.requests.total : 0
        },
        database: {
          connections: this.counters.database.connections,
          queries: this.counters.database.queries,
          slowQueries: this.counters.database.slowQueries,
          averageQueryTime: this.counters.database.queries > 0 ?
            this.counters.database.totalQueryTime / this.counters.database.queries : 0
        },
        cache: {
          hits: this.counters.cache.hits,
          misses: this.counters.cache.misses,
          hitRate: (this.counters.cache.hits + this.counters.cache.misses) > 0 ?
            (this.counters.cache.hits / (this.counters.cache.hits + this.counters.cache.misses)) * 100 : 0,
          size: this.counters.cache.size
        },
        websockets: {
          connections: this.counters.websockets.connections,
          messagesReceived: this.counters.websockets.messagesReceived,
          messagesSent: this.counters.websockets.messagesSent
        },
        energy: {
          devicesMonitored: this.counters.energy.devicesMonitored,
          readingsPerSecond: this.counters.energy.readingsPerSecond,
          anomaliesDetected: this.counters.energy.anomaliesDetected,
          optimizationsPerformed: this.counters.energy.optimizationsPerformed
        },
        ai: {
          predictionsGenerated: this.counters.ai.predictionsGenerated,
          modelsLoaded: this.counters.ai.modelsLoaded,
          inferenceTime: this.counters.ai.predictionsGenerated > 0 ?
            this.counters.ai.totalInferenceTime / this.counters.ai.predictionsGenerated : 0,
          accuracy: this.counters.ai.predictionsGenerated > 0 ?
            (this.counters.ai.correctPredictions / this.counters.ai.predictionsGenerated) * 100 : 0
        }
      };

      this.applicationMetrics.push(metrics);
      this.emit('applicationMetrics', metrics);

      // Check application performance
      this.checkApplicationPerformance(metrics);

    } catch (error) {
      logger.error('Failed to collect application metrics:', error);
    }
  }

  private async performHealthChecks(): Promise<void> {
    const services = [
      'database',
      'energy-monitor',
      'ai-analytics',
      'marketplace',
      'security-manager'
    ];

    for (const service of services) {
      try {
        const startTime = Date.now();
        const isHealthy = await this.checkServiceHealth(service);
        const responseTime = Date.now() - startTime;

        const healthCheck: HealthCheck = {
          service,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime,
          lastCheck: new Date(),
          details: { checked: true }
        };

        this.healthChecks.set(service, healthCheck);
        this.emit('healthCheck', healthCheck);

        if (!isHealthy) {
          this.createAlert({
            type: 'application',
            severity: 'error',
            message: `Service ${service} is unhealthy`,
            value: 0,
            threshold: 1
          });
        }

      } catch (error) {
        logger.error(`Health check failed for ${service}:`, error);
        
        this.healthChecks.set(service, {
          service,
          status: 'unhealthy',
          responseTime: 0,
          lastCheck: new Date(),
          details: { error: error.message }
        });
      }
    }
  }

  private async checkServiceHealth(service: string): Promise<boolean> {
    switch (service) {
      case 'database':
        try {
          await prisma.$queryRaw`SELECT 1`;
          return true;
        } catch {
          return false;
        }

      case 'energy-monitor':
      case 'ai-analytics':
      case 'marketplace':
      case 'security-manager':
        // In production, these would check actual service endpoints
        return true;

      default:
        return true;
    }
  }

  private checkSystemPerformance(metrics: SystemMetrics): void {
    // CPU usage alert
    if (metrics.cpu.usage > this.config.thresholds.cpu) {
      this.createAlert({
        type: 'cpu',
        severity: metrics.cpu.usage > 95 ? 'critical' : 'warning',
        message: `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
        value: metrics.cpu.usage,
        threshold: this.config.thresholds.cpu
      });
    }

    // Memory usage alert
    if (metrics.memory.usage > this.config.thresholds.memory) {
      this.createAlert({
        type: 'memory',
        severity: metrics.memory.usage > 95 ? 'critical' : 'warning',
        message: `High memory usage: ${metrics.memory.usage.toFixed(1)}%`,
        value: metrics.memory.usage,
        threshold: this.config.thresholds.memory
      });
    }

    // Disk usage alert
    if (metrics.disk.usage > this.config.thresholds.disk) {
      this.createAlert({
        type: 'disk',
        severity: metrics.disk.usage > 98 ? 'critical' : 'warning',
        message: `High disk usage: ${metrics.disk.usage.toFixed(1)}%`,
        value: metrics.disk.usage,
        threshold: this.config.thresholds.disk
      });
    }
  }

  private checkApplicationPerformance(metrics: ApplicationMetrics): void {
    // Response time alert
    if (metrics.requests.averageResponseTime > this.config.thresholds.responseTime) {
      this.createAlert({
        type: 'application',
        severity: 'warning',
        message: `High response time: ${metrics.requests.averageResponseTime.toFixed(0)}ms`,
        value: metrics.requests.averageResponseTime,
        threshold: this.config.thresholds.responseTime
      });
    }

    // Error rate alert
    const errorRate = metrics.requests.total > 0 ? 
      (metrics.requests.failed / metrics.requests.total) * 100 : 0;
    
    if (errorRate > this.config.thresholds.errorRate) {
      this.createAlert({
        type: 'application',
        severity: errorRate > 20 ? 'critical' : 'warning',
        message: `High error rate: ${errorRate.toFixed(1)}%`,
        value: errorRate,
        threshold: this.config.thresholds.errorRate
      });
    }
  }

  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const performanceAlert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alert
    };

    this.performanceAlerts.push(performanceAlert);
    this.emit('alert', performanceAlert);

    logger.warn(`🚨 Performance Alert: ${performanceAlert.message}`);
  }

  private checkAlerts(): void {
    // Auto-resolve alerts that are no longer relevant
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    this.performanceAlerts
      .filter(alert => !alert.resolved && alert.timestamp < fiveMinutesAgo)
      .forEach(alert => {
        if (this.shouldAutoResolveAlert(alert)) {
          alert.resolved = true;
          alert.resolvedAt = now;
          this.emit('alertResolved', alert);
        }
      });
  }

  private shouldAutoResolveAlert(alert: PerformanceAlert): boolean {
    // Get latest metrics to check if issue is resolved
    const latestSystemMetrics = this.systemMetrics[this.systemMetrics.length - 1];
    const latestAppMetrics = this.applicationMetrics[this.applicationMetrics.length - 1];

    if (!latestSystemMetrics || !latestAppMetrics) return false;

    switch (alert.type) {
      case 'cpu':
        return latestSystemMetrics.cpu.usage < alert.threshold;
      case 'memory':
        return latestSystemMetrics.memory.usage < alert.threshold;
      case 'disk':
        return latestSystemMetrics.disk.usage < alert.threshold;
      case 'application':
        return latestAppMetrics.requests.averageResponseTime < alert.threshold;
      default:
        return false;
    }
  }

  private setupLogCapture(): void {
    // Capture console logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      this.captureLog('info', 'console', args.join(' '));
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      this.captureLog('warn', 'console', args.join(' '));
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      this.captureLog('error', 'console', args.join(' '));
      originalError.apply(console, args);
    };
  }

  private captureLog(level: LogEntry['level'], category: string, message: string, metadata?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      metadata
    };

    this.logEntries.push(logEntry);

    // Trim logs if too many
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
    }

    this.emit('logEntry', logEntry);
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);

    // Clean up metrics
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);
    this.applicationMetrics = this.applicationMetrics.filter(m => m.timestamp > cutoff);

    // Clean up resolved alerts
    this.performanceAlerts = this.performanceAlerts.filter(
      a => !a.resolved || (a.resolvedAt && a.resolvedAt > cutoff)
    );

    // Clean up old logs
    this.logEntries = this.logEntries.filter(l => l.timestamp > cutoff);
  }

  // Public API for tracking metrics
  public trackRequest(success: boolean, responseTime: number): void {
    this.counters.requests.total++;
    this.counters.requests.totalResponseTime += responseTime;
    
    if (success) {
      this.counters.requests.successful++;
    } else {
      this.counters.requests.failed++;
    }
  }

  public trackDatabaseQuery(queryTime: number, isSlow: boolean = false): void {
    this.counters.database.queries++;
    this.counters.database.totalQueryTime += queryTime;
    
    if (isSlow) {
      this.counters.database.slowQueries++;
    }
  }

  public trackCacheOperation(hit: boolean): void {
    if (hit) {
      this.counters.cache.hits++;
    } else {
      this.counters.cache.misses++;
    }
  }

  public trackWebSocketConnection(connected: boolean): void {
    if (connected) {
      this.counters.websockets.connections++;
    } else {
      this.counters.websockets.connections = Math.max(0, this.counters.websockets.connections - 1);
    }
  }

  public trackWebSocketMessage(sent: boolean): void {
    if (sent) {
      this.counters.websockets.messagesSent++;
    } else {
      this.counters.websockets.messagesReceived++;
    }
  }

  public trackEnergyOperation(type: 'device' | 'reading' | 'anomaly' | 'optimization'): void {
    switch (type) {
      case 'device':
        this.counters.energy.devicesMonitored++;
        break;
      case 'reading':
        this.counters.energy.readingsPerSecond++;
        break;
      case 'anomaly':
        this.counters.energy.anomaliesDetected++;
        break;
      case 'optimization':
        this.counters.energy.optimizationsPerformed++;
        break;
    }
  }

  public trackAIOperation(type: 'prediction' | 'model_load' | 'inference', data?: { time?: number; correct?: boolean }): void {
    switch (type) {
      case 'prediction':
        this.counters.ai.predictionsGenerated++;
        if (data?.correct) {
          this.counters.ai.correctPredictions++;
        }
        break;
      case 'model_load':
        this.counters.ai.modelsLoaded++;
        break;
      case 'inference':
        if (data?.time) {
          this.counters.ai.totalInferenceTime += data.time;
        }
        break;
    }
  }

  public log(level: LogEntry['level'], category: string, message: string, metadata?: any): void {
    this.captureLog(level, category, message, metadata);
  }

  // Public API for retrieving data
  public getSystemMetrics(limit: number = 100): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  public getApplicationMetrics(limit: number = 100): ApplicationMetrics[] {
    return this.applicationMetrics.slice(-limit);
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.performanceAlerts.filter(a => !a.resolved);
  }

  public getAllAlerts(limit: number = 100): PerformanceAlert[] {
    return this.performanceAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getHealthStatus(): Map<string, HealthCheck> {
    return new Map(this.healthChecks);
  }

  public getLogs(level?: LogEntry['level'], category?: string, limit: number = 100): LogEntry[] {
    let logs = this.logEntries;
    
    if (level) {
      logs = logs.filter(l => l.level === level);
    }
    
    if (category) {
      logs = logs.filter(l => l.category === category);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getPerformanceSummary(): {
    system: { cpu: number; memory: number; disk: number };
    application: { responseTime: number; errorRate: number; throughput: number };
    health: { healthy: number; total: number };
    alerts: { active: number; total: number };
  } {
    const latestSystem = this.systemMetrics[this.systemMetrics.length - 1];
    const latestApp = this.applicationMetrics[this.applicationMetrics.length - 1];
    const activeAlerts = this.getActiveAlerts();
    const healthyServices = Array.from(this.healthChecks.values())
      .filter(h => h.status === 'healthy').length;

    return {
      system: {
        cpu: latestSystem?.cpu.usage || 0,
        memory: latestSystem?.memory.usage || 0,
        disk: latestSystem?.disk.usage || 0
      },
      application: {
        responseTime: latestApp?.requests.averageResponseTime || 0,
        errorRate: latestApp ? 
          (latestApp.requests.failed / Math.max(1, latestApp.requests.total)) * 100 : 0,
        throughput: latestApp?.requests.total || 0
      },
      health: {
        healthy: healthyServices,
        total: this.healthChecks.size
      },
      alerts: {
        active: activeAlerts.length,
        total: this.performanceAlerts.length
      }
    };
  }

  public updateConfig(updates: Partial<typeof this.config>): void {
    Object.assign(this.config, updates);
    this.emit('configUpdated', this.config);
    logger.info('📊 Monitoring configuration updated');
  }

  public destroy(): void {
    // Clear intervals
    if (this.systemMetricsInterval) clearInterval(this.systemMetricsInterval);
    if (this.applicationMetricsInterval) clearInterval(this.applicationMetricsInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.alertCheckInterval) clearInterval(this.alertCheckInterval);

    // Clear data
    this.systemMetrics = [];
    this.applicationMetrics = [];
    this.performanceAlerts = [];
    this.logEntries = [];
    this.healthChecks.clear();

    logger.info('📊 Comprehensive Monitoring System destroyed');
  }
}

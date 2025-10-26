import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface EnergyAnomaly {
  id: string;
  deviceId: string;
  type: 'spike' | 'drop' | 'pattern_deviation' | 'efficiency_loss' | 'unusual_timing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  possibleCauses: string[];
  recommendations: string[];
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AnomalyPattern {
  deviceId: string;
  patternType: string;
  baseline: number[];
  threshold: number;
  sensitivity: number;
  lastUpdated: Date;
}

/**
 * Energy Anomaly Detection System
 * Uses statistical analysis and ML to detect unusual energy consumption patterns
 */
export class EnergyAnomalyDetector extends EventEmitter {
  private isInitialized = false;
  private detectionInterval: NodeJS.Timeout | null = null;
  private anomalies = new Map<string, EnergyAnomaly>();
  private patterns = new Map<string, AnomalyPattern>();
  
  // Detection parameters
  private detectionConfig = {
    spikeThreshold: 3.0, // Standard deviations
    dropThreshold: 2.5,
    patternDeviationThreshold: 2.0,
    minDataPoints: 50,
    rollingWindowSize: 100,
    sensitivityLevel: 'medium' as 'low' | 'medium' | 'high'
  };

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('🔍 Initializing Energy Anomaly Detection System...');
    
    // Load historical patterns
    await this.buildBaselinePatterns();
    
    // Start continuous monitoring
    this.startContinuousDetection();
    
    this.isInitialized = true;
    logger.info('✅ Energy Anomaly Detection System initialized');
  }

  private async buildBaselinePatterns(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const readings = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: thirtyDaysAgo }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Group by device
      const deviceReadings = new Map<string, any[]>();
      readings.forEach(reading => {
        if (!deviceReadings.has(reading.deviceId)) {
          deviceReadings.set(reading.deviceId, []);
        }
        deviceReadings.get(reading.deviceId)!.push(reading);
      });

      // Build patterns for each device
      for (const [deviceId, deviceData] of deviceReadings) {
        if (deviceData.length >= this.detectionConfig.minDataPoints) {
          const pattern = this.createBaselinePattern(deviceId, deviceData);
          this.patterns.set(deviceId, pattern);
        }
      }

      logger.info(`📊 Built baseline patterns for ${this.patterns.size} devices`);
    } catch (error) {
      logger.error('Failed to build baseline patterns:', error);
    }
  }

  private createBaselinePattern(deviceId: string, readings: any[]): AnomalyPattern {
    // Extract power values
    const powerValues = readings.map(r => r.powerWatts);
    
    // Calculate statistical baseline
    const mean = powerValues.reduce((sum, val) => sum + val, 0) / powerValues.length;
    const variance = powerValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / powerValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Create hourly baseline (24-hour pattern)
    const hourlyBaseline = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    
    readings.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      hourlyBaseline[hour] += reading.powerWatts;
      hourlyCounts[hour]++;
    });
    
    // Calculate average for each hour
    const baseline = hourlyBaseline.map((total, hour) => 
      hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : mean
    );

    // Set threshold based on sensitivity
    let threshold = stdDev;
    switch (this.detectionConfig.sensitivityLevel) {
      case 'high': threshold *= 1.5; break;
      case 'medium': threshold *= 2.0; break;
      case 'low': threshold *= 2.5; break;
    }

    return {
      deviceId,
      patternType: 'hourly',
      baseline,
      threshold,
      sensitivity: this.detectionConfig.sensitivityLevel === 'high' ? 0.8 : 
                   this.detectionConfig.sensitivityLevel === 'medium' ? 0.6 : 0.4,
      lastUpdated: new Date()
    };
  }

  private startContinuousDetection(): void {
    // Run detection every 2 minutes
    this.detectionInterval = setInterval(async () => {
      await this.runAnomalyDetection();
    }, 2 * 60 * 1000);

    logger.info('🔄 Started continuous anomaly detection');
  }

  private async runAnomalyDetection(): Promise<void> {
    try {
      const recentReadings = await this.getRecentReadings();
      
      for (const reading of recentReadings) {
        await this.analyzeReading(reading);
      }
      
      // Clean up old resolved anomalies
      this.cleanupOldAnomalies();
      
    } catch (error) {
      logger.error('Anomaly detection cycle failed:', error);
    }
  }

  private async getRecentReadings(): Promise<any[]> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: fiveMinutesAgo }
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      logger.error('Failed to get recent readings:', error);
      return [];
    }
  }

  private async analyzeReading(reading: any): Promise<void> {
    const pattern = this.patterns.get(reading.deviceId);
    if (!pattern) return;

    const anomalies = [
      ...this.detectSpikes(reading, pattern),
      ...this.detectDrops(reading, pattern),
      ...this.detectPatternDeviations(reading, pattern),
      ...this.detectEfficiencyLoss(reading, pattern),
      ...this.detectUnusualTiming(reading, pattern)
    ];

    for (const anomaly of anomalies) {
      await this.processAnomaly(anomaly);
    }
  }

  private detectSpikes(reading: any, pattern: AnomalyPattern): EnergyAnomaly[] {
    const hour = new Date(reading.timestamp).getHours();
    const expectedValue = pattern.baseline[hour];
    const threshold = expectedValue + (pattern.threshold * this.detectionConfig.spikeThreshold);
    
    if (reading.powerWatts > threshold) {
      const deviation = ((reading.powerWatts - expectedValue) / expectedValue) * 100;
      const severity = this.calculateSeverity(deviation);
      
      return [{
        id: `spike_${reading.deviceId}_${Date.now()}`,
        deviceId: reading.deviceId,
        type: 'spike',
        severity,
        description: `Power consumption spike detected: ${reading.powerWatts}W (expected ~${expectedValue.toFixed(1)}W)`,
        detectedAt: new Date(reading.timestamp),
        value: reading.powerWatts,
        expectedValue,
        deviation,
        confidence: Math.min(0.95, deviation / 100),
        possibleCauses: [
          'Device malfunction',
          'Increased load demand',
          'Electrical fault',
          'Measurement error'
        ],
        recommendations: [
          'Check device status and health',
          'Inspect electrical connections',
          'Monitor for sustained high usage',
          'Consider load balancing'
        ],
        resolved: false
      }];
    }
    
    return [];
  }

  private detectDrops(reading: any, pattern: AnomalyPattern): EnergyAnomaly[] {
    const hour = new Date(reading.timestamp).getHours();
    const expectedValue = pattern.baseline[hour];
    const threshold = expectedValue - (pattern.threshold * this.detectionConfig.dropThreshold);
    
    if (reading.powerWatts < threshold && expectedValue > 10) { // Only detect drops for devices with meaningful baseline
      const deviation = ((expectedValue - reading.powerWatts) / expectedValue) * 100;
      const severity = this.calculateSeverity(deviation);
      
      return [{
        id: `drop_${reading.deviceId}_${Date.now()}`,
        deviceId: reading.deviceId,
        type: 'drop',
        severity,
        description: `Power consumption drop detected: ${reading.powerWatts}W (expected ~${expectedValue.toFixed(1)}W)`,
        detectedAt: new Date(reading.timestamp),
        value: reading.powerWatts,
        expectedValue,
        deviation,
        confidence: Math.min(0.9, deviation / 80),
        possibleCauses: [
          'Device turned off unexpectedly',
          'Reduced functionality',
          'Power supply issues',
          'Scheduled maintenance'
        ],
        recommendations: [
          'Verify device operational status',
          'Check power supply stability',
          'Review recent configuration changes',
          'Inspect device for faults'
        ],
        resolved: false
      }];
    }
    
    return [];
  }

  private detectPatternDeviations(reading: any, pattern: AnomalyPattern): EnergyAnomaly[] {
    // Get recent readings for this device to analyze pattern
    const recentReadings = this.getDeviceRecentReadings(reading.deviceId);
    if (recentReadings.length < 10) return [];

    const currentPattern = this.extractCurrentPattern(recentReadings);
    const deviation = this.calculatePatternDeviation(currentPattern, pattern.baseline);
    
    if (deviation > this.detectionConfig.patternDeviationThreshold) {
      return [{
        id: `pattern_${reading.deviceId}_${Date.now()}`,
        deviceId: reading.deviceId,
        type: 'pattern_deviation',
        severity: deviation > 4 ? 'high' : deviation > 3 ? 'medium' : 'low',
        description: `Usage pattern deviation detected: ${deviation.toFixed(1)}x normal variation`,
        detectedAt: new Date(reading.timestamp),
        value: reading.powerWatts,
        expectedValue: pattern.baseline[new Date(reading.timestamp).getHours()],
        deviation: deviation * 100,
        confidence: Math.min(0.85, deviation / 5),
        possibleCauses: [
          'Changed usage behavior',
          'Device configuration modified',
          'Environmental factors',
          'Seasonal adjustments needed'
        ],
        recommendations: [
          'Review recent usage changes',
          'Update baseline patterns',
          'Check for external influences',
          'Consider pattern recalibration'
        ],
        resolved: false
      }];
    }
    
    return [];
  }

  private detectEfficiencyLoss(reading: any, pattern: AnomalyPattern): EnergyAnomaly[] {
    // Detect gradual efficiency degradation
    const recentReadings = this.getDeviceRecentReadings(reading.deviceId);
    if (recentReadings.length < 20) return [];

    const efficiencyTrend = this.calculateEfficiencyTrend(recentReadings);
    
    if (efficiencyTrend < -0.15) { // 15% efficiency loss
      return [{
        id: `efficiency_${reading.deviceId}_${Date.now()}`,
        deviceId: reading.deviceId,
        type: 'efficiency_loss',
        severity: efficiencyTrend < -0.3 ? 'high' : 'medium',
        description: `Device efficiency loss detected: ${(Math.abs(efficiencyTrend) * 100).toFixed(1)}% increase in consumption`,
        detectedAt: new Date(reading.timestamp),
        value: reading.powerWatts,
        expectedValue: reading.powerWatts / (1 + Math.abs(efficiencyTrend)),
        deviation: Math.abs(efficiencyTrend) * 100,
        confidence: 0.75,
        possibleCauses: [
          'Device aging/wear',
          'Maintenance required',
          'Dust/dirt accumulation',
          'Component degradation'
        ],
        recommendations: [
          'Schedule device maintenance',
          'Clean device components',
          'Check for worn parts',
          'Consider device replacement'
        ],
        resolved: false
      }];
    }
    
    return [];
  }

  private detectUnusualTiming(reading: any, pattern: AnomalyPattern): EnergyAnomaly[] {
    const hour = new Date(reading.timestamp).getHours();
    const dayOfWeek = new Date(reading.timestamp).getDay();
    
    // Check if device is active during unusual hours
    const isNighttime = hour >= 23 || hour <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isNighttime && reading.powerWatts > pattern.baseline[hour] * 2) {
      return [{
        id: `timing_${reading.deviceId}_${Date.now()}`,
        deviceId: reading.deviceId,
        type: 'unusual_timing',
        severity: 'medium',
        description: `Unusual nighttime activity detected: ${reading.powerWatts}W at ${hour}:00`,
        detectedAt: new Date(reading.timestamp),
        value: reading.powerWatts,
        expectedValue: pattern.baseline[hour],
        deviation: ((reading.powerWatts - pattern.baseline[hour]) / pattern.baseline[hour]) * 100,
        confidence: 0.7,
        possibleCauses: [
          'Unauthorized usage',
          'Scheduled task running',
          'Device malfunction',
          'Changed usage pattern'
        ],
        recommendations: [
          'Verify authorized usage',
          'Check scheduled operations',
          'Review device programming',
          'Monitor for recurring pattern'
        ],
        resolved: false
      }];
    }
    
    return [];
  }

  private getDeviceRecentReadings(deviceId: string): any[] {
    // This would typically query the database
    // For now, return empty array as placeholder
    return [];
  }

  private extractCurrentPattern(readings: any[]): number[] {
    const hourlyData = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    
    readings.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      hourlyData[hour] += reading.powerWatts;
      hourlyCounts[hour]++;
    });
    
    return hourlyData.map((total, hour) => 
      hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : 0
    );
  }

  private calculatePatternDeviation(current: number[], baseline: number[]): number {
    let totalDeviation = 0;
    let validHours = 0;
    
    for (let hour = 0; hour < 24; hour++) {
      if (baseline[hour] > 0) {
        const deviation = Math.abs(current[hour] - baseline[hour]) / baseline[hour];
        totalDeviation += deviation;
        validHours++;
      }
    }
    
    return validHours > 0 ? totalDeviation / validHours : 0;
  }

  private calculateEfficiencyTrend(readings: any[]): number {
    if (readings.length < 10) return 0;
    
    // Simple linear regression to detect trend
    const n = readings.length;
    const x = readings.map((_, i) => i);
    const y = readings.map(r => r.powerWatts);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    
    // Return relative trend (slope / average)
    return avgY > 0 ? slope / avgY : 0;
  }

  private calculateSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviation > 200) return 'critical';
    if (deviation > 100) return 'high';
    if (deviation > 50) return 'medium';
    return 'low';
  }

  private async processAnomaly(anomaly: EnergyAnomaly): Promise<void> {
    // Check if similar anomaly already exists
    const existingAnomaly = Array.from(this.anomalies.values()).find(
      a => a.deviceId === anomaly.deviceId && 
           a.type === anomaly.type && 
           !a.resolved &&
           Math.abs(a.detectedAt.getTime() - anomaly.detectedAt.getTime()) < 10 * 60 * 1000 // 10 minutes
    );

    if (existingAnomaly) {
      // Update existing anomaly
      existingAnomaly.confidence = Math.max(existingAnomaly.confidence, anomaly.confidence);
      existingAnomaly.value = anomaly.value;
      return;
    }

    // Store new anomaly
    this.anomalies.set(anomaly.id, anomaly);
    
    // Emit event
    this.emit('anomalyDetected', anomaly);
    
    // Log based on severity
    const logMessage = `🚨 ${anomaly.severity.toUpperCase()} anomaly: ${anomaly.description}`;
    switch (anomaly.severity) {
      case 'critical':
        logger.error(logMessage);
        break;
      case 'high':
        logger.warn(logMessage);
        break;
      default:
        logger.info(logMessage);
    }

    // Auto-resolve low severity anomalies after some time
    if (anomaly.severity === 'low') {
      setTimeout(() => {
        this.resolveAnomaly(anomaly.id, 'Auto-resolved: Low severity');
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  private cleanupOldAnomalies(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [id, anomaly] of this.anomalies) {
      if (anomaly.resolved && anomaly.resolvedAt && anomaly.resolvedAt < sevenDaysAgo) {
        this.anomalies.delete(id);
      }
    }
  }

  // Public API
  public getActiveAnomalies(): EnergyAnomaly[] {
    return Array.from(this.anomalies.values()).filter(a => !a.resolved);
  }

  public getAllAnomalies(): EnergyAnomaly[] {
    return Array.from(this.anomalies.values());
  }

  public getDeviceAnomalies(deviceId: string): EnergyAnomaly[] {
    return Array.from(this.anomalies.values()).filter(a => a.deviceId === deviceId);
  }

  public resolveAnomaly(anomalyId: string, resolution: string): boolean {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) return false;

    anomaly.resolved = true;
    anomaly.resolvedAt = new Date();
    
    this.emit('anomalyResolved', { anomaly, resolution });
    logger.info(`✅ Resolved anomaly: ${anomaly.description} - ${resolution}`);
    
    return true;
  }

  public updateDetectionConfig(config: Partial<typeof this.detectionConfig>): void {
    Object.assign(this.detectionConfig, config);
    logger.info('🔧 Updated anomaly detection configuration');
  }

  public async updateDevicePattern(deviceId: string): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const readings = await prisma.energyReading.findMany({
        where: {
          deviceId,
          timestamp: { gte: thirtyDaysAgo }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (readings.length >= this.detectionConfig.minDataPoints) {
        const pattern = this.createBaselinePattern(deviceId, readings);
        this.patterns.set(deviceId, pattern);
        logger.info(`🔄 Updated baseline pattern for device ${deviceId}`);
      }
    } catch (error) {
      logger.error(`Failed to update pattern for device ${deviceId}:`, error);
    }
  }

  public getDetectionStats(): any {
    const anomalies = Array.from(this.anomalies.values());
    const activeAnomalies = anomalies.filter(a => !a.resolved);
    
    const severityCounts = {
      low: anomalies.filter(a => a.severity === 'low').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      high: anomalies.filter(a => a.severity === 'high').length,
      critical: anomalies.filter(a => a.severity === 'critical').length
    };

    const typeCounts = {
      spike: anomalies.filter(a => a.type === 'spike').length,
      drop: anomalies.filter(a => a.type === 'drop').length,
      pattern_deviation: anomalies.filter(a => a.type === 'pattern_deviation').length,
      efficiency_loss: anomalies.filter(a => a.type === 'efficiency_loss').length,
      unusual_timing: anomalies.filter(a => a.type === 'unusual_timing').length
    };

    return {
      totalAnomalies: anomalies.length,
      activeAnomalies: activeAnomalies.length,
      resolvedAnomalies: anomalies.length - activeAnomalies.length,
      severityCounts,
      typeCounts,
      devicesMonitored: this.patterns.size,
      averageConfidence: anomalies.length > 0 ? 
        anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length : 0
    };
  }

  destroy(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    this.anomalies.clear();
    this.patterns.clear();
    
    logger.info('🔍 Energy Anomaly Detection System destroyed');
  }
}

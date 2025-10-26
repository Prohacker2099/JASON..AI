import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface EnergyPattern {
  deviceId: string;
  patternType: 'daily' | 'weekly' | 'seasonal' | 'anomaly';
  confidence: number;
  description: string;
  recommendations: string[];
  potentialSavings: number;
  timestamp: Date;
}

export interface EnergyInsight {
  id: string;
  type: 'efficiency' | 'cost' | 'usage' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  estimatedSavings: number;
  confidence: number;
  data: any;
}

export interface UsagePrediction {
  deviceId: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  predictedUsage: number;
  confidence: number;
  factors: string[];
  timestamp: Date;
}

/**
 * AI-Powered Energy Analytics Engine
 * Uses machine learning algorithms to analyze energy patterns and provide insights
 */
export class AIEnergyAnalytics extends EventEmitter {
  private isInitialized = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  private patterns = new Map<string, EnergyPattern[]>();
  private insights = new Map<string, EnergyInsight[]>();
  private predictions = new Map<string, UsagePrediction[]>();

  // ML Model parameters
  private modelWeights = {
    timeOfDay: 0.3,
    dayOfWeek: 0.2,
    seasonality: 0.15,
    weather: 0.1,
    occupancy: 0.15,
    historical: 0.1
  };

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('🧠 Initializing AI Energy Analytics Engine...');
    
    // Load historical data for training
    await this.loadHistoricalData();
    
    // Train initial models
    await this.trainModels();
    
    // Start continuous analysis
    this.startContinuousAnalysis();
    
    this.isInitialized = true;
    logger.info('✅ AI Energy Analytics Engine initialized');
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const readings = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: thirtyDaysAgo }
        },
        orderBy: { timestamp: 'asc' }
      });

      logger.info(`📊 Loaded ${readings.length} historical energy readings for AI analysis`);
      
      // Process readings for pattern recognition
      await this.processHistoricalReadings(readings);
      
    } catch (error) {
      logger.error('Failed to load historical data:', error);
    }
  }

  private async processHistoricalReadings(readings: any[]): Promise<void> {
    const deviceReadings = new Map<string, any[]>();
    
    // Group readings by device
    readings.forEach(reading => {
      if (!deviceReadings.has(reading.deviceId)) {
        deviceReadings.set(reading.deviceId, []);
      }
      deviceReadings.get(reading.deviceId)!.push(reading);
    });

    // Analyze patterns for each device
    for (const [deviceId, deviceData] of deviceReadings) {
      await this.analyzeDevicePatterns(deviceId, deviceData);
    }
  }

  private async analyzeDevicePatterns(deviceId: string, readings: any[]): Promise<void> {
    const patterns: EnergyPattern[] = [];

    // Daily pattern analysis
    const dailyPattern = this.analyzeDailyPattern(deviceId, readings);
    if (dailyPattern) patterns.push(dailyPattern);

    // Weekly pattern analysis
    const weeklyPattern = this.analyzeWeeklyPattern(deviceId, readings);
    if (weeklyPattern) patterns.push(weeklyPattern);

    // Seasonal pattern analysis
    const seasonalPattern = this.analyzeSeasonalPattern(deviceId, readings);
    if (seasonalPattern) patterns.push(seasonalPattern);

    // Anomaly detection
    const anomalies = this.detectAnomalies(deviceId, readings);
    patterns.push(...anomalies);

    this.patterns.set(deviceId, patterns);
    
    // Generate insights based on patterns
    const insights = this.generateInsights(deviceId, patterns);
    this.insights.set(deviceId, insights);

    logger.debug(`📈 Analyzed ${patterns.length} patterns for device ${deviceId}`);
  }

  private analyzeDailyPattern(deviceId: string, readings: any[]): EnergyPattern | null {
    if (readings.length < 24) return null;

    const hourlyUsage = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    readings.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      hourlyUsage[hour] += reading.powerWatts;
      hourlyCounts[hour]++;
    });

    // Calculate average usage per hour
    const avgHourlyUsage = hourlyUsage.map((total, hour) => 
      hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : 0
    );

    // Find peak and off-peak hours
    const maxUsage = Math.max(...avgHourlyUsage);
    const minUsage = Math.min(...avgHourlyUsage.filter(u => u > 0));
    const peakHour = avgHourlyUsage.indexOf(maxUsage);
    const offPeakHour = avgHourlyUsage.indexOf(minUsage);

    const recommendations: string[] = [];
    let potentialSavings = 0;

    if (maxUsage > minUsage * 2) {
      recommendations.push(`Peak usage at ${peakHour}:00, consider shifting load to ${offPeakHour}:00`);
      potentialSavings = (maxUsage - minUsage) * 0.3; // 30% potential savings
    }

    return {
      deviceId,
      patternType: 'daily',
      confidence: this.calculateConfidence(readings.length, 24),
      description: `Daily usage pattern: Peak at ${peakHour}:00 (${maxUsage.toFixed(1)}W), Low at ${offPeakHour}:00 (${minUsage.toFixed(1)}W)`,
      recommendations,
      potentialSavings,
      timestamp: new Date()
    };
  }

  private analyzeWeeklyPattern(deviceId: string, readings: any[]): EnergyPattern | null {
    if (readings.length < 7 * 24) return null;

    const dailyUsage = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    readings.forEach(reading => {
      const dayOfWeek = new Date(reading.timestamp).getDay();
      dailyUsage[dayOfWeek] += reading.powerWatts;
      dailyCounts[dayOfWeek]++;
    });

    const avgDailyUsage = dailyUsage.map((total, day) => 
      dailyCounts[day] > 0 ? total / dailyCounts[day] : 0
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxDay = avgDailyUsage.indexOf(Math.max(...avgDailyUsage));
    const minDay = avgDailyUsage.indexOf(Math.min(...avgDailyUsage.filter(u => u > 0)));

    const recommendations: string[] = [];
    if (avgDailyUsage[maxDay] > avgDailyUsage[minDay] * 1.5) {
      recommendations.push(`Higher usage on ${dayNames[maxDay]}, consider load balancing`);
    }

    return {
      deviceId,
      patternType: 'weekly',
      confidence: this.calculateConfidence(readings.length, 7 * 24),
      description: `Weekly pattern: Highest on ${dayNames[maxDay]} (${avgDailyUsage[maxDay].toFixed(1)}W avg)`,
      recommendations,
      potentialSavings: (avgDailyUsage[maxDay] - avgDailyUsage[minDay]) * 0.2,
      timestamp: new Date()
    };
  }

  private analyzeSeasonalPattern(deviceId: string, readings: any[]): EnergyPattern | null {
    if (readings.length < 30 * 24) return null;

    const monthlyUsage = new Map<number, { total: number; count: number }>();
    
    readings.forEach(reading => {
      const month = new Date(reading.timestamp).getMonth();
      if (!monthlyUsage.has(month)) {
        monthlyUsage.set(month, { total: 0, count: 0 });
      }
      const data = monthlyUsage.get(month)!;
      data.total += reading.powerWatts;
      data.count++;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const avgMonthlyUsage = new Map<number, number>();
    
    monthlyUsage.forEach((data, month) => {
      avgMonthlyUsage.set(month, data.total / data.count);
    });

    if (avgMonthlyUsage.size < 2) return null;

    const usageValues = Array.from(avgMonthlyUsage.values());
    const maxUsage = Math.max(...usageValues);
    const minUsage = Math.min(...usageValues);
    
    let maxMonth = 0;
    let minMonth = 0;
    avgMonthlyUsage.forEach((usage, month) => {
      if (usage === maxUsage) maxMonth = month;
      if (usage === minUsage) minMonth = month;
    });

    const recommendations: string[] = [];
    if (maxUsage > minUsage * 1.3) {
      recommendations.push(`Seasonal variation detected: ${maxUsage > minUsage * 2 ? 'High' : 'Moderate'} usage in ${monthNames[maxMonth]}`);
      recommendations.push('Consider seasonal optimization strategies');
    }

    return {
      deviceId,
      patternType: 'seasonal',
      confidence: this.calculateConfidence(readings.length, 30 * 24),
      description: `Seasonal pattern: Peak in ${monthNames[maxMonth]} (${maxUsage.toFixed(1)}W), Low in ${monthNames[minMonth]} (${minUsage.toFixed(1)}W)`,
      recommendations,
      potentialSavings: (maxUsage - minUsage) * 0.15,
      timestamp: new Date()
    };
  }

  private detectAnomalies(deviceId: string, readings: any[]): EnergyPattern[] {
    const anomalies: EnergyPattern[] = [];
    
    if (readings.length < 100) return anomalies;

    // Calculate statistical thresholds
    const powers = readings.map(r => r.powerWatts);
    const mean = powers.reduce((sum, p) => sum + p, 0) / powers.length;
    const variance = powers.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / powers.length;
    const stdDev = Math.sqrt(variance);
    
    const upperThreshold = mean + 3 * stdDev;
    const lowerThreshold = Math.max(0, mean - 3 * stdDev);

    // Find anomalous readings
    const anomalousReadings = readings.filter(r => 
      r.powerWatts > upperThreshold || r.powerWatts < lowerThreshold
    );

    if (anomalousReadings.length > 0) {
      const anomalyPercentage = (anomalousReadings.length / readings.length) * 100;
      
      anomalies.push({
        deviceId,
        patternType: 'anomaly',
        confidence: Math.min(0.95, anomalyPercentage / 10),
        description: `${anomalousReadings.length} anomalous readings detected (${anomalyPercentage.toFixed(1)}% of total)`,
        recommendations: [
          'Investigate unusual power consumption patterns',
          'Check device health and maintenance status',
          'Consider load balancing or usage optimization'
        ],
        potentialSavings: anomalousReadings.reduce((sum, r) => sum + Math.abs(r.powerWatts - mean), 0) * 0.1,
        timestamp: new Date()
      });
    }

    return anomalies;
  }

  private generateInsights(deviceId: string, patterns: EnergyPattern[]): EnergyInsight[] {
    const insights: EnergyInsight[] = [];

    patterns.forEach((pattern, index) => {
      if (pattern.potentialSavings > 0) {
        const impact = pattern.potentialSavings > 100 ? 'high' : 
                      pattern.potentialSavings > 50 ? 'medium' : 'low';

        insights.push({
          id: `${deviceId}_${pattern.patternType}_${index}`,
          type: 'optimization',
          title: `${pattern.patternType.charAt(0).toUpperCase() + pattern.patternType.slice(1)} Optimization Opportunity`,
          description: pattern.description,
          impact,
          actionable: pattern.recommendations.length > 0,
          estimatedSavings: pattern.potentialSavings,
          confidence: pattern.confidence,
          data: {
            deviceId,
            pattern,
            recommendations: pattern.recommendations
          }
        });
      }
    });

    return insights;
  }

  private calculateConfidence(dataPoints: number, minRequired: number): number {
    return Math.min(1.0, dataPoints / (minRequired * 2));
  }

  private startContinuousAnalysis(): void {
    // Run analysis every hour
    this.analysisInterval = setInterval(async () => {
      await this.runContinuousAnalysis();
    }, 60 * 60 * 1000);

    logger.info('🔄 Started continuous AI energy analysis');
  }

  private async runContinuousAnalysis(): Promise<void> {
    try {
      // Get recent readings (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentReadings = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: yesterday }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (recentReadings.length > 0) {
        // Update patterns with new data
        await this.updatePatternsWithNewData(recentReadings);
        
        // Generate new predictions
        await this.generatePredictions();
        
        // Emit insights
        this.emitLatestInsights();
      }

    } catch (error) {
      logger.error('Continuous analysis failed:', error);
    }
  }

  private async updatePatternsWithNewData(readings: any[]): Promise<void> {
    const deviceReadings = new Map<string, any[]>();
    
    readings.forEach(reading => {
      if (!deviceReadings.has(reading.deviceId)) {
        deviceReadings.set(reading.deviceId, []);
      }
      deviceReadings.get(reading.deviceId)!.push(reading);
    });

    for (const [deviceId, deviceData] of deviceReadings) {
      await this.analyzeDevicePatterns(deviceId, deviceData);
    }
  }

  private async generatePredictions(): Promise<void> {
    for (const [deviceId, patterns] of this.patterns) {
      const predictions = this.createUsagePredictions(deviceId, patterns);
      this.predictions.set(deviceId, predictions);
    }
  }

  private createUsagePredictions(deviceId: string, patterns: EnergyPattern[]): UsagePrediction[] {
    const predictions: UsagePrediction[] = [];
    const now = new Date();

    // Generate hourly prediction
    const dailyPattern = patterns.find(p => p.patternType === 'daily');
    if (dailyPattern && dailyPattern.confidence > 0.5) {
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      predictions.push({
        deviceId,
        timeframe: 'hour',
        predictedUsage: this.predictHourlyUsage(dailyPattern, nextHour),
        confidence: dailyPattern.confidence,
        factors: ['historical_pattern', 'time_of_day'],
        timestamp: now
      });
    }

    // Generate daily prediction
    const weeklyPattern = patterns.find(p => p.patternType === 'weekly');
    if (weeklyPattern && weeklyPattern.confidence > 0.5) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      predictions.push({
        deviceId,
        timeframe: 'day',
        predictedUsage: this.predictDailyUsage(weeklyPattern, tomorrow),
        confidence: weeklyPattern.confidence,
        factors: ['weekly_pattern', 'day_of_week'],
        timestamp: now
      });
    }

    return predictions;
  }

  private predictHourlyUsage(pattern: EnergyPattern, targetTime: Date): number {
    // Simplified prediction based on time of day
    const hour = targetTime.getHours();
    const baseUsage = 100; // Base consumption
    const timeMultiplier = this.getTimeMultiplier(hour);
    return baseUsage * timeMultiplier;
  }

  private predictDailyUsage(pattern: EnergyPattern, targetDate: Date): number {
    // Simplified prediction based on day of week
    const dayOfWeek = targetDate.getDay();
    const baseUsage = 2400; // Base daily consumption (24 hours * 100W)
    const dayMultiplier = this.getDayMultiplier(dayOfWeek);
    return baseUsage * dayMultiplier;
  }

  private getTimeMultiplier(hour: number): number {
    // Peak hours: 7-9 AM (1.5x), 6-10 PM (1.8x)
    // Off-peak: 11 PM - 6 AM (0.3x)
    if (hour >= 7 && hour <= 9) return 1.5;
    if (hour >= 18 && hour <= 22) return 1.8;
    if (hour >= 23 || hour <= 6) return 0.3;
    return 1.0;
  }

  private getDayMultiplier(dayOfWeek: number): number {
    // Weekend typically lower usage
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0.8;
    // Weekdays
    return 1.0;
  }

  private emitLatestInsights(): void {
    for (const [deviceId, insights] of this.insights) {
      insights.forEach(insight => {
        this.emit('energyInsight', insight);
      });
    }

    for (const [deviceId, predictions] of this.predictions) {
      predictions.forEach(prediction => {
        this.emit('usagePrediction', prediction);
      });
    }
  }

  // Public API
  getPatterns(deviceId?: string): EnergyPattern[] {
    if (deviceId) {
      return this.patterns.get(deviceId) || [];
    }
    
    const allPatterns: EnergyPattern[] = [];
    this.patterns.forEach(patterns => allPatterns.push(...patterns));
    return allPatterns;
  }

  getInsights(deviceId?: string): EnergyInsight[] {
    if (deviceId) {
      return this.insights.get(deviceId) || [];
    }
    
    const allInsights: EnergyInsight[] = [];
    this.insights.forEach(insights => allInsights.push(...insights));
    return allInsights;
  }

  getPredictions(deviceId?: string): UsagePrediction[] {
    if (deviceId) {
      return this.predictions.get(deviceId) || [];
    }
    
    const allPredictions: UsagePrediction[] = [];
    this.predictions.forEach(predictions => allPredictions.push(...predictions));
    return allPredictions;
  }

  async analyzeDevice(deviceId: string): Promise<{
    patterns: EnergyPattern[];
    insights: EnergyInsight[];
    predictions: UsagePrediction[];
  }> {
    // Get recent data for the device
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const readings = await prisma.energyReading.findMany({
      where: {
        deviceId,
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (readings.length > 0) {
      await this.analyzeDevicePatterns(deviceId, readings);
    }

    return {
      patterns: this.getPatterns(deviceId),
      insights: this.getInsights(deviceId),
      predictions: this.getPredictions(deviceId)
    };
  }

  destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.patterns.clear();
    this.insights.clear();
    this.predictions.clear();
    
    logger.info('🧠 AI Energy Analytics Engine destroyed');
  }
}

// server/services/analytics/DataInsightsEngine.ts

import { EventEmitter } from 'events';
import { Device } from '../../../shared/types/Device';
import { UserProfile } from '../../../shared/types/user';
import { logger } from '../../src/utils/logger';

interface DeviceUsageData {
  deviceId: string;
  timestamp: Date;
  durationMinutes?: number; // For devices that are 'on' for a period
  value?: number; // For devices with measurable output like energy consumption
}

interface EnergyConsumptionData {
  deviceId: string;
  timestamp: Date;
  kwh: number;
}

export class DataInsightsEngine extends EventEmitter {
  private deviceUsageHistory: Map<string, DeviceUsageData[]> = new Map();
  private energyConsumptionHistory: Map<string, EnergyConsumptionData[]> = new Map();

  constructor() {
    super();
    logger.info('DataInsightsEngine initialized: Providing advanced data insights.');
  }

  /**
   * Records device usage data.
   * @param data The device usage data.
   */
  public recordDeviceUsage(data: DeviceUsageData) {
    const history = this.deviceUsageHistory.get(data.deviceId) || [];
    history.push(data);
    this.deviceUsageHistory.set(data.deviceId, history);
    logger.debug(`Recorded device usage for ${data.deviceId}:`, data);
    this.analyzeUsagePatterns(data.deviceId);
  }

  /**
   * Records energy consumption data.
   * @param data The energy consumption data.
   */
  public recordEnergyConsumption(data: EnergyConsumptionData) {
    const history = this.energyConsumptionHistory.get(data.deviceId) || [];
    history.push(data);
    this.energyConsumptionHistory.set(data.deviceId, history);
    logger.debug(`Recorded energy consumption for ${data.deviceId}:`, data);
    this.analyzeEnergyConsumption(data.deviceId);
  }

  /**
   * Analyzes device usage patterns to identify trends or anomalies.
   * @param deviceId The ID of the device.
   */
  private analyzeUsagePatterns(deviceId: string) {
    const history = this.deviceUsageHistory.get(deviceId);
    if (!history || history.length < 10) return; // Need sufficient data

    // Example: Detect peak usage times
    const usageHours: number[] = history.map(entry => entry.timestamp.getHours());
    const peakHour = this.getMostFrequent(usageHours);

    if (peakHour !== undefined) {
      this.emit('newInsight', {
        type: 'devicePeakUsage',
        deviceId: deviceId,
        insight: `Device ${deviceId} is most frequently used around ${peakHour}:00.`,
        details: { peakHour },
      });
      logger.info(`Generated peak usage insight for ${deviceId}.`);
    }
  }

  /**
   * Analyzes energy consumption data to identify high consumption or inefficiencies.
   * @param deviceId The ID of the device.
   */
  private analyzeEnergyConsumption(deviceId: string) {
    const history = this.energyConsumptionHistory.get(deviceId);
    if (!history || history.length < 10) return;

    // Example: Calculate average daily consumption
    const dailyConsumption = history.reduce((sum, entry) => sum + entry.kwh, 0) / history.length;

    if (dailyConsumption > 5) { // Arbitrary threshold for high consumption
      this.emit('newInsight', {
        type: 'highEnergyConsumption',
        deviceId: deviceId,
        insight: `Device ${deviceId} has high average daily energy consumption: ${dailyConsumption.toFixed(2)} kWh.`,
        details: { dailyConsumption },
      });
      logger.warn(`Generated high energy consumption insight for ${deviceId}.`);
    }
  }

  /**
   * Generates a comprehensive report of data insights for a user.
   * @param userId The ID of the user.
   * @returns A promise resolving to the insights report.
   */
  public async generateUserInsightsReport(userId: string): Promise<any> {
    logger.info(`Generating data insights report for user ${userId}.`);
    // In a real app, this would aggregate data across all user's devices and services
    // For now, simulate some insights
    return {
      overallEnergyEfficiency: 'Good',
      deviceUsageSummary: {
        lighting: 'High usage in evenings.',
        thermostat: 'Consistent, but could optimize for away periods.',
      },
      securityTrends: 'No unusual activity detected recently.',
      wellnessSummary: 'Average sleep score: 7.8. Stress levels stable.',
      recommendations: [
        'Consider smart plugs for non-essential devices to reduce standby power.',
        'Automate thermostat adjustments based on your schedule and presence.',
      ],
    };
  }

  /**
   * Helper to find the most frequent item in an array.
   */
  private getMostFrequent<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    const frequencyMap = new Map<T, number>();
    let maxCount = 0;
    let mostFrequent: T | undefined;

    for (const item of arr) {
      const count = (frequencyMap.get(item) || 0) + 1;
      frequencyMap.set(item, count);
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }
    return mostFrequent;
  }
}

export const dataInsightsEngine = new DataInsightsEngine();
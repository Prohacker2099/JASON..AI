import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface EnergyRate {
  id: string;
  name: string;
  baseRate: number; // $/kWh
  peakRate?: number; // $/kWh during peak hours
  offPeakRate?: number; // $/kWh during off-peak hours
  peakHours: { start: string; end: string }[];
  demandCharge?: number; // $/kW for peak demand
  connectionFee?: number; // Monthly connection fee
  currency: string;
  timezone: string;
}

export interface EnergyBill {
  id: string;
  deviceId: string;
  deviceName: string;
  periodStart: Date;
  periodEnd: Date;
  energyKwh: number;
  peakDemandKw: number;
  baseCharge: number;
  peakCharge: number;
  offPeakCharge: number;
  demandCharge: number;
  connectionFee: number;
  totalCost: number;
  currency: string;
}

export interface RealTimeUsage {
  deviceId: string;
  timestamp: Date;
  powerWatts: number;
  energyKwh: number;
  currentCost: number;
  projectedDailyCost: number;
  projectedMonthlyCost: number;
}

export class EnergyCostCalculator extends EventEmitter {
  private currentRate: EnergyRate;
  private usageCache = new Map<string, RealTimeUsage>();

  constructor() {
    super();
    
    // Default energy rate
    this.currentRate = {
      id: 'default',
      name: 'Default Rate',
      baseRate: 0.12, // $0.12/kWh
      peakRate: 0.18,
      offPeakRate: 0.08,
      peakHours: [{ start: '17:00', end: '21:00' }],
      demandCharge: 15.0, // $15/kW
      connectionFee: 25.0, // $25/month
      currency: 'USD',
      timezone: 'America/New_York'
    };
    
    // Default energy rate (US average)
    this.currentRate = {
      id: 'default_us',
      name: 'US Average Rate',
      baseRate: 0.15, // $0.15 per kWh
      peakRate: 0.22, // $0.22 per kWh during peak
      offPeakRate: 0.08, // $0.08 per kWh during off-peak
      peakHours: [
        { start: '16:00', end: '21:00' }, // 4 PM - 9 PM weekdays
      ],
      demandCharge: 15.00, // $15 per kW of peak demand
      connectionFee: 12.50, // $12.50 monthly connection fee
      currency: 'USD',
      timezone: 'America/New_York'
    };
  }

  setEnergyRate(rate: EnergyRate): void {
    this.currentRate = rate;
    this.emit('rateChanged', rate);
    logger.info(`💰 Energy rate updated: ${rate.name} - $${rate.baseRate}/kWh`);
  }

  calculateRealTimeCost(deviceId: string, powerWatts: number, energyKwh: number): RealTimeUsage {
    const now = new Date();
    const currentRate = this.getCurrentRate(now);
    
    // Current hourly cost
    const currentCost = (powerWatts / 1000) * currentRate;
    
    // Project daily cost (24 hours at current usage)
    const projectedDailyCost = currentCost * 24;
    
    // Project monthly cost (30 days)
    const projectedMonthlyCost = projectedDailyCost * 30;

    const usage: RealTimeUsage = {
      deviceId,
      timestamp: now,
      powerWatts,
      energyKwh,
      currentCost,
      projectedDailyCost,
      projectedMonthlyCost
    };

    this.usageCache.set(deviceId, usage);
    this.emit('usageCalculated', usage);

    return usage;
  }

  private getCurrentRate(timestamp: Date): number {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Check if current time is in peak hours
    const isWeekday = timestamp.getDay() >= 1 && timestamp.getDay() <= 5;
    
    if (isWeekday && this.currentRate.peakHours) {
      for (const peakPeriod of this.currentRate.peakHours) {
        if (this.isTimeInRange(timeString, peakPeriod.start, peakPeriod.end)) {
          return this.currentRate.peakRate || this.currentRate.baseRate;
        }
      }
    }

    // Check for off-peak rate (typically late night/early morning)
    if (hour >= 22 || hour <= 6) {
      return this.currentRate.offPeakRate || this.currentRate.baseRate;
    }

    return this.currentRate.baseRate;
  }

  private isTimeInRange(time: string, start: string, end: string): boolean {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    } else {
      // Handles ranges that cross midnight
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async generateBill(deviceId: string, periodStart: Date, periodEnd: Date): Promise<EnergyBill> {
    try {
      // Get energy readings for the period
      const readings = await prisma.energyReading.findMany({
        where: {
          deviceId,
          timestamp: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (readings.length === 0) {
        throw new Error(`No energy readings found for device ${deviceId} in the specified period`);
      }

      // Calculate total energy consumption
      const totalEnergyKwh = readings[readings.length - 1].energyKwh - readings[0].energyKwh;
      
      // Calculate peak demand (highest power reading)
      const peakDemandKw = Math.max(...readings.map(r => r.powerWatts)) / 1000;

      // Calculate charges by time period
      let baseCharge = 0;
      let peakCharge = 0;
      let offPeakCharge = 0;

      for (let i = 1; i < readings.length; i++) {
        const reading = readings[i];
        const prevReading = readings[i - 1];
        const energyUsed = reading.energyKwh - prevReading.energyKwh;
        const rate = this.getCurrentRate(reading.timestamp);

        if (rate === this.currentRate.peakRate) {
          peakCharge += energyUsed * rate;
        } else if (rate === this.currentRate.offPeakRate) {
          offPeakCharge += energyUsed * rate;
        } else {
          baseCharge += energyUsed * rate;
        }
      }

      // Calculate demand charge
      const demandCharge = (this.currentRate.demandCharge || 0) * peakDemandKw;

      // Connection fee (prorated for the period)
      const periodDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
      const connectionFee = (this.currentRate.connectionFee || 0) * (periodDays / 30);

      const totalCost = baseCharge + peakCharge + offPeakCharge + demandCharge + connectionFee;

      // Get device name
      const device = await prisma.energyDevice?.findUnique({ where: { id: deviceId } });
      const deviceName = device?.name || `Device ${deviceId}`;

      const bill: EnergyBill = {
        id: `bill_${deviceId}_${periodStart.getTime()}`,
        deviceId,
        deviceName,
        periodStart,
        periodEnd,
        energyKwh: totalEnergyKwh,
        peakDemandKw,
        baseCharge,
        peakCharge,
        offPeakCharge,
        demandCharge,
        connectionFee,
        totalCost,
        currency: this.currentRate.currency
      };

      // Store bill in database
      await this.storeBill(bill);

      this.emit('billGenerated', bill);
      logger.info(`💰 Generated bill for ${deviceName}: $${totalCost.toFixed(2)}`);

      return bill;
    } catch (error) {
      logger.error(`Failed to generate bill for device ${deviceId}:`, error);
      throw error;
    }
  }

  private async storeBill(bill: EnergyBill): Promise<void> {
    try {
      await prisma.energyBill.create({
        data: {
          id: bill.id,
          deviceId: bill.deviceId,
          deviceName: bill.deviceName,
          periodStart: bill.periodStart,
          periodEnd: bill.periodEnd,
          energyKwh: bill.energyKwh,
          peakDemandKw: bill.peakDemandKw,
          baseCharge: bill.baseCharge,
          peakCharge: bill.peakCharge,
          offPeakCharge: bill.offPeakCharge,
          demandCharge: bill.demandCharge,
          connectionFee: bill.connectionFee,
          totalCost: bill.totalCost,
          currency: bill.currency
        }
      });
    } catch (error) {
      logger.error('Failed to store energy bill:', error);
    }
  }

  async getTotalCostForPeriod(startDate: Date, endDate: Date): Promise<number> {
    try {
      const bills = await prisma.energyBill.findMany({
        where: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate }
        }
      });

      return bills.reduce((total, bill) => total + bill.totalCost, 0);
    } catch (error) {
      logger.error('Failed to get total cost for period:', error);
      return 0;
    }
  }

  async getDeviceCostRanking(days: number = 30): Promise<Array<{ deviceId: string; deviceName: string; totalCost: number }>> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const bills = await prisma.energyBill.findMany({
        where: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate }
        }
      });

      const deviceCosts = new Map<string, { deviceName: string; totalCost: number }>();

      for (const bill of bills) {
        const existing = deviceCosts.get(bill.deviceId);
        if (existing) {
          existing.totalCost += bill.totalCost;
        } else {
          deviceCosts.set(bill.deviceId, {
            deviceName: bill.deviceName,
            totalCost: bill.totalCost
          });
        }
      }

      return Array.from(deviceCosts.entries())
        .map(([deviceId, data]) => ({
          deviceId,
          deviceName: data.deviceName,
          totalCost: data.totalCost
        }))
        .sort((a, b) => b.totalCost - a.totalCost);
    } catch (error) {
      logger.error('Failed to get device cost ranking:', error);
      return [];
    }
  }

  getRealTimeUsage(deviceId: string): RealTimeUsage | undefined {
    return this.usageCache.get(deviceId);
  }

  getAllRealTimeUsage(): RealTimeUsage[] {
    return Array.from(this.usageCache.values());
  }

  // Energy saving recommendations
  async getEnergySavingRecommendations(): Promise<Array<{
    deviceId: string;
    deviceName: string;
    recommendation: string;
    potentialSavings: number;
  }>> {
    const recommendations: Array<{
      deviceId: string;
      deviceName: string;
      recommendation: string;
      potentialSavings: number;
    }> = [];

    const usage = this.getAllRealTimeUsage();

    for (const deviceUsage of usage) {
      const device = await this.getDeviceInfo(deviceUsage.deviceId);
      
      // High power consumption recommendation
      if (deviceUsage.powerWatts > 1000) {
        recommendations.push({
          deviceId: deviceUsage.deviceId,
          deviceName: device?.name || 'Unknown Device',
          recommendation: 'Consider reducing usage during peak hours (4-9 PM) to save on peak rate charges',
          potentialSavings: deviceUsage.projectedMonthlyCost * 0.3
        });
      }

      // Always-on device recommendation
      if (deviceUsage.powerWatts > 10 && deviceUsage.powerWatts < 100) {
        recommendations.push({
          deviceId: deviceUsage.deviceId,
          deviceName: device?.name || 'Unknown Device',
          recommendation: 'This device appears to be always on. Consider using a smart plug with scheduling',
          potentialSavings: deviceUsage.projectedMonthlyCost * 0.5
        });
      }

      // Peak hour usage recommendation
      const now = new Date();
      const currentRate = this.getCurrentRate(now);
      if (currentRate === this.currentRate.peakRate && deviceUsage.powerWatts > 500) {
        recommendations.push({
          deviceId: deviceUsage.deviceId,
          deviceName: device?.name || 'Unknown Device',
          recommendation: 'Currently using high power during peak rate period. Consider delaying usage to off-peak hours',
          potentialSavings: (deviceUsage.currentCost - (deviceUsage.powerWatts / 1000) * (this.currentRate.offPeakRate || this.currentRate.baseRate)) * 5 * 30 // 5 hours * 30 days
        });
      }
    }

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  private async getDeviceInfo(deviceId: string): Promise<{ name: string } | null> {
    try {
      const device = await prisma.energyDevice?.findUnique({ where: { id: deviceId } });
      return device ? { name: device.name } : null;
    } catch (error) {
      return null;
    }
  }

  // Utility rate comparison
  compareRates(alternativeRate: EnergyRate, currentUsageKwh: number): {
    currentCost: number;
    alternativeCost: number;
    savings: number;
    recommendation: string;
  } {
    const currentCost = currentUsageKwh * this.currentRate.baseRate;
    const alternativeCost = currentUsageKwh * alternativeRate.baseRate;
    const savings = currentCost - alternativeCost;

    let recommendation = '';
    if (savings > 0) {
      recommendation = `Switch to ${alternativeRate.name} to save $${savings.toFixed(2)} per month`;
    } else if (savings < 0) {
      recommendation = `Current rate is better by $${Math.abs(savings).toFixed(2)} per month`;
    } else {
      recommendation = 'Both rates are equivalent for your usage pattern';
    }

    return {
      currentCost,
      alternativeCost,
      savings,
      recommendation
    };
  }
}

export const energyCostCalculator = new EnergyCostCalculator();

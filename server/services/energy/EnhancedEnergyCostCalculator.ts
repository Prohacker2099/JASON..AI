import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface EnergyTariff {
  id: string;
  name: string;
  provider: string;
  type: 'fixed' | 'time_of_use' | 'tiered' | 'demand' | 'real_time';
  currency: string;
  rates: {
    peak?: number;
    offPeak?: number;
    shoulder?: number;
    fixed?: number;
    tiers?: { threshold: number; rate: number }[];
    demandCharge?: number;
    connectionFee?: number;
  };
  timeSchedule?: {
    peak: { start: string; end: string }[];
    offPeak: { start: string; end: string }[];
    shoulder?: { start: string; end: string }[];
  };
  seasonalAdjustments?: {
    summer: number;
    winter: number;
    spring: number;
    autumn: number;
  };
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
}

export interface CostCalculation {
  deviceId: string;
  period: {
    start: Date;
    end: Date;
  };
  energyUsed: number; // kWh
  peakUsage: number;
  offPeakUsage: number;
  shoulderUsage: number;
  costs: {
    energy: number;
    demand: number;
    connection: number;
    taxes: number;
    total: number;
  };
  tariffUsed: string;
  breakdown: {
    timeSlot: string;
    usage: number;
    rate: number;
    cost: number;
  }[];
  projectedMonthlyCost: number;
  comparisonWithAlternativeTariffs: {
    tariffId: string;
    estimatedCost: number;
    savings: number;
  }[];
}

export interface RealTimePricing {
  timestamp: Date;
  pricePerKwh: number;
  demandCharge: number;
  gridLoad: number;
  renewablePercentage: number;
  carbonIntensity: number;
  priceSignal: 'low' | 'medium' | 'high' | 'critical';
  forecastNext24h: {
    hour: number;
    price: number;
    signal: string;
  }[];
}

/**
 * Enhanced Energy Cost Calculator with Dynamic Pricing
 * Supports multiple tariff types, real-time pricing, and cost optimization
 */
export class EnhancedEnergyCostCalculator extends EventEmitter {
  private tariffs = new Map<string, EnergyTariff>();
  private activeTariff: EnergyTariff | null = null;
  private realTimePricing: RealTimePricing | null = null;
  private costHistory: CostCalculation[] = [];
  private pricingInterval: NodeJS.Timeout | null = null;

  // Tax and fee configurations
  private taxConfig = {
    salesTax: 0.08, // 8%
    utilityTax: 0.03, // 3%
    renewableEnergySurcharge: 0.015, // 1.5%
    transmissionFee: 0.02 // $0.02/kWh
  };

  constructor() {
    super();
    this.initializeDefaultTariffs();
    this.startRealTimePricing();
  }

  private initializeDefaultTariffs(): void {
    // Create default tariff structures
    const defaultTariffs: EnergyTariff[] = [
      {
        id: 'residential_tou',
        name: 'Residential Time-of-Use',
        provider: 'Local Utility',
        type: 'time_of_use',
        currency: 'USD',
        rates: {
          peak: 0.32,
          offPeak: 0.18,
          shoulder: 0.25,
          connectionFee: 15.00
        },
        timeSchedule: {
          peak: [
            { start: '16:00', end: '21:00' }
          ],
          offPeak: [
            { start: '22:00', end: '06:00' }
          ],
          shoulder: [
            { start: '06:00', end: '16:00' },
            { start: '21:00', end: '22:00' }
          ]
        },
        seasonalAdjustments: {
          summer: 1.15,
          winter: 1.05,
          spring: 0.95,
          autumn: 0.98
        },
        validFrom: new Date('2024-01-01'),
        isActive: true
      },
      {
        id: 'commercial_demand',
        name: 'Commercial Demand Rate',
        provider: 'Local Utility',
        type: 'demand',
        currency: 'USD',
        rates: {
          fixed: 0.22,
          demandCharge: 18.50, // $/kW
          connectionFee: 45.00
        },
        validFrom: new Date('2024-01-01'),
        isActive: false
      },
      {
        id: 'tiered_residential',
        name: 'Tiered Residential',
        provider: 'Local Utility',
        type: 'tiered',
        currency: 'USD',
        rates: {
          tiers: [
            { threshold: 500, rate: 0.15 },
            { threshold: 1000, rate: 0.22 },
            { threshold: Infinity, rate: 0.35 }
          ],
          connectionFee: 12.00
        },
        validFrom: new Date('2024-01-01'),
        isActive: false
      },
      {
        id: 'real_time_pricing',
        name: 'Real-Time Pricing',
        provider: 'Grid Operator',
        type: 'real_time',
        currency: 'USD',
        rates: {
          connectionFee: 8.00
        },
        validFrom: new Date('2024-01-01'),
        isActive: false
      }
    ];

    defaultTariffs.forEach(tariff => {
      this.tariffs.set(tariff.id, tariff);
    });

    // Set default active tariff
    this.activeTariff = this.tariffs.get('residential_tou') || null;
    
    logger.info(`💰 Initialized ${this.tariffs.size} energy tariffs`);
  }

  private startRealTimePricing(): void {
    // Update real-time pricing every 5 minutes
    this.pricingInterval = setInterval(async () => {
      await this.updateRealTimePricing();
    }, 5 * 60 * 1000);

    // Initial update
    this.updateRealTimePricing();
  }

  private async updateRealTimePricing(): Promise<void> {
    try {
      // Simulate real-time pricing data
      // In production, this would fetch from grid operator APIs
      const now = new Date();
      const hour = now.getHours();
      
      // Base price varies by time of day and grid conditions
      let basePrice = 0.20;
      
      // Time-based adjustments
      if (hour >= 16 && hour <= 20) basePrice *= 1.8; // Peak hours
      else if (hour >= 22 || hour <= 6) basePrice *= 0.7; // Off-peak
      
      // Add random market fluctuations
      const marketVariation = (Math.random() - 0.5) * 0.1;
      basePrice += marketVariation;
      
      // Simulate grid load and renewable generation
      const gridLoad = 0.6 + Math.random() * 0.4; // 60-100%
      const renewablePercentage = Math.max(0, 0.3 + (Math.random() - 0.5) * 0.4); // 10-50%
      
      // Adjust price based on grid conditions
      basePrice *= (1 + gridLoad * 0.3);
      basePrice *= (1 - renewablePercentage * 0.2);
      
      // Calculate carbon intensity (g CO2/kWh)
      const carbonIntensity = 400 * (1 - renewablePercentage) + 50 * renewablePercentage;
      
      // Determine price signal
      let priceSignal: 'low' | 'medium' | 'high' | 'critical';
      if (basePrice < 0.15) priceSignal = 'low';
      else if (basePrice < 0.25) priceSignal = 'medium';
      else if (basePrice < 0.40) priceSignal = 'high';
      else priceSignal = 'critical';
      
      // Generate 24-hour forecast
      const forecastNext24h = [];
      for (let i = 0; i < 24; i++) {
        const forecastHour = (hour + i) % 24;
        let forecastPrice = basePrice;
        
        // Apply hourly patterns
        if (forecastHour >= 16 && forecastHour <= 20) forecastPrice *= 1.6;
        else if (forecastHour >= 22 || forecastHour <= 6) forecastPrice *= 0.8;
        
        // Add some randomness
        forecastPrice += (Math.random() - 0.5) * 0.05;
        
        let signal = 'medium';
        if (forecastPrice < 0.18) signal = 'low';
        else if (forecastPrice > 0.35) signal = 'high';
        
        forecastNext24h.push({
          hour: forecastHour,
          price: Math.round(forecastPrice * 1000) / 1000,
          signal
        });
      }
      
      this.realTimePricing = {
        timestamp: now,
        pricePerKwh: Math.round(basePrice * 1000) / 1000,
        demandCharge: 15.0 + gridLoad * 10,
        gridLoad,
        renewablePercentage,
        carbonIntensity: Math.round(carbonIntensity),
        priceSignal,
        forecastNext24h
      };
      
      this.emit('realTimePriceUpdate', this.realTimePricing);
      
    } catch (error) {
      logger.error('Failed to update real-time pricing:', error);
    }
  }

  public async calculateDeviceCost(
    deviceId: string,
    startDate: Date,
    endDate: Date,
    tariffId?: string
  ): Promise<CostCalculation | null> {
    try {
      const tariff = tariffId ? this.tariffs.get(tariffId) : this.activeTariff;
      if (!tariff) {
        logger.error('No tariff available for cost calculation');
        return null;
      }

      // Get energy readings for the period
      const readings = await prisma.energyReading.findMany({
        where: {
          deviceId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (readings.length === 0) {
        return null;
      }

      // Calculate total energy usage
      const totalEnergyWh = readings.reduce((sum, reading) => sum + reading.powerWatts, 0);
      const energyUsed = totalEnergyWh / 1000; // Convert to kWh

      // Calculate time-based usage breakdown
      const usageBreakdown = this.calculateUsageBreakdown(readings, tariff);
      
      // Calculate costs based on tariff type
      const costs = await this.calculateCostsByTariffType(tariff, usageBreakdown, energyUsed);
      
      // Add taxes and fees
      const taxedCosts = this.applyTaxesAndFees(costs, energyUsed);
      
      // Project monthly cost
      const periodDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const projectedMonthlyCost = (taxedCosts.total / periodDays) * 30;
      
      // Compare with alternative tariffs
      const comparisonWithAlternativeTariffs = await this.compareWithAlternativeTariffs(
        usageBreakdown, energyUsed, tariff.id
      );

      const calculation: CostCalculation = {
        deviceId,
        period: { start: startDate, end: endDate },
        energyUsed,
        peakUsage: usageBreakdown.peak,
        offPeakUsage: usageBreakdown.offPeak,
        shoulderUsage: usageBreakdown.shoulder,
        costs: taxedCosts,
        tariffUsed: tariff.id,
        breakdown: usageBreakdown.breakdown,
        projectedMonthlyCost,
        comparisonWithAlternativeTariffs
      };

      // Store calculation
      this.costHistory.push(calculation);
      
      // Emit event
      this.emit('costCalculated', calculation);
      
      return calculation;

    } catch (error) {
      logger.error('Failed to calculate device cost:', error);
      return null;
    }
  }

  private calculateUsageBreakdown(readings: any[], tariff: EnergyTariff): any {
    let peakUsage = 0;
    let offPeakUsage = 0;
    let shoulderUsage = 0;
    const breakdown: any[] = [];

    readings.forEach(reading => {
      const timestamp = new Date(reading.timestamp);
      const timeString = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
      const energyKwh = reading.powerWatts / 1000;
      
      let timeSlot = 'standard';
      let rate = tariff.rates.fixed || 0.20;

      if (tariff.type === 'time_of_use' && tariff.timeSchedule) {
        if (this.isTimeInSchedule(timeString, tariff.timeSchedule.peak || [])) {
          timeSlot = 'peak';
          rate = tariff.rates.peak || 0.30;
          peakUsage += energyKwh;
        } else if (this.isTimeInSchedule(timeString, tariff.timeSchedule.offPeak || [])) {
          timeSlot = 'offPeak';
          rate = tariff.rates.offPeak || 0.15;
          offPeakUsage += energyKwh;
        } else if (tariff.timeSchedule.shoulder && this.isTimeInSchedule(timeString, tariff.timeSchedule.shoulder)) {
          timeSlot = 'shoulder';
          rate = tariff.rates.shoulder || 0.22;
          shoulderUsage += energyKwh;
        }
      }

      // Apply seasonal adjustments
      const season = this.getSeason(timestamp);
      const seasonalMultiplier = tariff.seasonalAdjustments?.[season] || 1.0;
      rate *= seasonalMultiplier;

      breakdown.push({
        timeSlot,
        usage: energyKwh,
        rate,
        cost: energyKwh * rate
      });
    });

    return {
      peak: peakUsage,
      offPeak: offPeakUsage,
      shoulder: shoulderUsage,
      breakdown
    };
  }

  private isTimeInSchedule(timeString: string, schedule: { start: string; end: string }[]): boolean {
    return schedule.some(period => {
      const time = this.timeStringToMinutes(timeString);
      const start = this.timeStringToMinutes(period.start);
      const end = this.timeStringToMinutes(period.end);
      
      if (start <= end) {
        return time >= start && time <= end;
      } else {
        // Crosses midnight
        return time >= start || time <= end;
      }
    });
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getSeason(date: Date): 'summer' | 'winter' | 'spring' | 'autumn' {
    const month = date.getMonth() + 1;
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    return 'autumn';
  }

  private async calculateCostsByTariffType(tariff: EnergyTariff, usageBreakdown: any, totalEnergy: number): Promise<any> {
    let energyCost = 0;
    let demandCost = 0;
    const connectionCost = tariff.rates.connectionFee || 0;

    switch (tariff.type) {
      case 'time_of_use':
        energyCost = usageBreakdown.breakdown.reduce((sum: number, item: any) => sum + item.cost, 0);
        break;

      case 'tiered':
        energyCost = this.calculateTieredCost(totalEnergy, tariff.rates.tiers || []);
        break;

      case 'demand':
        energyCost = totalEnergy * (tariff.rates.fixed || 0.20);
        // Calculate demand charge based on peak usage
        const peakDemand = Math.max(...usageBreakdown.breakdown.map((item: any) => item.usage));
        demandCost = peakDemand * (tariff.rates.demandCharge || 0);
        break;

      case 'real_time':
        energyCost = await this.calculateRealTimeCost(usageBreakdown.breakdown);
        break;

      case 'fixed':
      default:
        energyCost = totalEnergy * (tariff.rates.fixed || 0.20);
        break;
    }

    return {
      energy: energyCost,
      demand: demandCost,
      connection: connectionCost,
      taxes: 0, // Will be calculated in applyTaxesAndFees
      total: energyCost + demandCost + connectionCost
    };
  }

  private calculateTieredCost(totalEnergy: number, tiers: { threshold: number; rate: number }[]): number {
    let cost = 0;
    let remainingEnergy = totalEnergy;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const previousThreshold = i > 0 ? tiers[i - 1].threshold : 0;
      const tierCapacity = tier.threshold - previousThreshold;
      const energyInTier = Math.min(remainingEnergy, tierCapacity);

      cost += energyInTier * tier.rate;
      remainingEnergy -= energyInTier;

      if (remainingEnergy <= 0) break;
    }

    return cost;
  }

  private async calculateRealTimeCost(breakdown: any[]): Promise<number> {
    if (!this.realTimePricing) {
      return breakdown.reduce((sum, item) => sum + item.cost, 0);
    }

    // Use real-time pricing for calculation
    return breakdown.reduce((sum, item) => {
      const rtPrice = this.realTimePricing!.pricePerKwh;
      return sum + (item.usage * rtPrice);
    }, 0);
  }

  private applyTaxesAndFees(costs: any, energyUsed: number): any {
    const subtotal = costs.energy + costs.demand + costs.connection;
    
    const salesTax = subtotal * this.taxConfig.salesTax;
    const utilityTax = subtotal * this.taxConfig.utilityTax;
    const renewableSurcharge = energyUsed * this.taxConfig.renewableEnergySurcharge;
    const transmissionFee = energyUsed * this.taxConfig.transmissionFee;
    
    const totalTaxes = salesTax + utilityTax + renewableSurcharge + transmissionFee;
    
    return {
      ...costs,
      taxes: totalTaxes,
      total: subtotal + totalTaxes
    };
  }

  private async compareWithAlternativeTariffs(
    usageBreakdown: any,
    energyUsed: number,
    currentTariffId: string
  ): Promise<any[]> {
    const comparisons = [];

    for (const [tariffId, tariff] of this.tariffs) {
      if (tariffId === currentTariffId || !tariff.isActive) continue;

      try {
        const costs = await this.calculateCostsByTariffType(tariff, usageBreakdown, energyUsed);
        const taxedCosts = this.applyTaxesAndFees(costs, energyUsed);
        
        comparisons.push({
          tariffId,
          estimatedCost: taxedCosts.total,
          savings: 0 // Will be calculated relative to current tariff
        });
      } catch (error) {
        logger.error(`Failed to calculate cost for tariff ${tariffId}:`, error);
      }
    }

    return comparisons;
  }

  // Public API
  public getTariffs(): EnergyTariff[] {
    return Array.from(this.tariffs.values());
  }

  public getActiveTariff(): EnergyTariff | null {
    return this.activeTariff;
  }

  public setActiveTariff(tariffId: string): boolean {
    const tariff = this.tariffs.get(tariffId);
    if (!tariff) return false;

    this.activeTariff = tariff;
    this.emit('activeTariffChanged', tariff);
    logger.info(`💰 Active tariff changed to: ${tariff.name}`);
    return true;
  }

  public addTariff(tariff: EnergyTariff): void {
    this.tariffs.set(tariff.id, tariff);
    this.emit('tariffAdded', tariff);
    logger.info(`➕ Added new tariff: ${tariff.name}`);
  }

  public updateTariff(tariffId: string, updates: Partial<EnergyTariff>): boolean {
    const tariff = this.tariffs.get(tariffId);
    if (!tariff) return false;

    Object.assign(tariff, updates);
    this.tariffs.set(tariffId, tariff);
    this.emit('tariffUpdated', tariff);
    logger.info(`✏️ Updated tariff: ${tariff.name}`);
    return true;
  }

  public getRealTimePricing(): RealTimePricing | null {
    return this.realTimePricing;
  }

  public getCostHistory(deviceId?: string, limit: number = 100): CostCalculation[] {
    let history = this.costHistory;
    
    if (deviceId) {
      history = history.filter(calc => calc.deviceId === deviceId);
    }
    
    return history
      .sort((a, b) => b.period.end.getTime() - a.period.end.getTime())
      .slice(0, limit);
  }

  public async calculateTotalCost(startDate: Date, endDate: Date): Promise<{
    totalCost: number;
    deviceBreakdown: { deviceId: string; cost: number }[];
    tariffBreakdown: { tariffId: string; cost: number }[];
  }> {
    try {
      const devices = await this.getActiveDevices();
      const deviceBreakdown = [];
      let totalCost = 0;

      for (const device of devices) {
        const calculation = await this.calculateDeviceCost(device.deviceId, startDate, endDate);
        if (calculation) {
          deviceBreakdown.push({
            deviceId: device.deviceId,
            cost: calculation.costs.total
          });
          totalCost += calculation.costs.total;
        }
      }

      // Group by tariff
      const tariffBreakdown = new Map<string, number>();
      this.costHistory
        .filter(calc => calc.period.start >= startDate && calc.period.end <= endDate)
        .forEach(calc => {
          const current = tariffBreakdown.get(calc.tariffUsed) || 0;
          tariffBreakdown.set(calc.tariffUsed, current + calc.costs.total);
        });

      return {
        totalCost,
        deviceBreakdown,
        tariffBreakdown: Array.from(tariffBreakdown.entries()).map(([tariffId, cost]) => ({
          tariffId,
          cost
        }))
      };
    } catch (error) {
      logger.error('Failed to calculate total cost:', error);
      return {
        totalCost: 0,
        deviceBreakdown: [],
        tariffBreakdown: []
      };
    }
  }

  private async getActiveDevices(): Promise<any[]> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: oneDayAgo }
        },
        select: {
          deviceId: true
        },
        distinct: ['deviceId']
      });
    } catch (error) {
      logger.error('Failed to get active devices:', error);
      return [];
    }
  }

  public updateTaxConfig(config: Partial<typeof this.taxConfig>): void {
    Object.assign(this.taxConfig, config);
    this.emit('taxConfigUpdated', this.taxConfig);
    logger.info('💰 Tax configuration updated');
  }

  public async getOptimalTariffRecommendation(deviceId: string): Promise<{
    recommendedTariff: string;
    estimatedSavings: number;
    reason: string;
  } | null> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      const calculation = await this.calculateDeviceCost(deviceId, thirtyDaysAgo, now);
      if (!calculation) return null;

      // Find the tariff with lowest cost
      const bestAlternative = calculation.comparisonWithAlternativeTariffs
        .sort((a, b) => a.estimatedCost - b.estimatedCost)[0];

      if (bestAlternative && bestAlternative.estimatedCost < calculation.costs.total) {
        const savings = calculation.costs.total - bestAlternative.estimatedCost;
        const tariff = this.tariffs.get(bestAlternative.tariffId);
        
        return {
          recommendedTariff: bestAlternative.tariffId,
          estimatedSavings: savings,
          reason: `Switch to ${tariff?.name} could save $${savings.toFixed(2)} per month`
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to get optimal tariff recommendation:', error);
      return null;
    }
  }

  destroy(): void {
    if (this.pricingInterval) {
      clearInterval(this.pricingInterval);
      this.pricingInterval = null;
    }
    
    this.tariffs.clear();
    this.costHistory = [];
    
    logger.info('💰 Enhanced Energy Cost Calculator destroyed');
  }
}

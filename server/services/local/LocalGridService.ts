import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface GridData {
  timestamp: Date;
  load: number; // 0-1 (percentage of grid capacity)
  frequency: number; // Hz
  voltage: number; // kV
  renewableGeneration: {
    solar: number; // MW
    wind: number; // MW
    hydro: number; // MW
    total: number; // MW
    percentage: number; // 0-1
  };
  fossilGeneration: {
    coal: number; // MW
    gas: number; // MW
    nuclear: number; // MW
    total: number; // MW
    percentage: number; // 0-1
  };
  totalGeneration: number; // MW
  carbonIntensity: number; // g CO2/kWh
  priceSignal: 'low' | 'medium' | 'high' | 'critical';
  demandResponse: {
    active: boolean;
    level: number; // 0-5
    message: string;
  };
}

export interface EnergyPrice {
  timestamp: Date;
  pricePerKwh: number; // $/kWh
  demandCharge: number; // $/kW
  transmissionFee: number; // $/kWh
  distributionFee: number; // $/kWh
  taxes: number; // $/kWh
  totalPrice: number; // $/kWh
  priceSignal: GridData['priceSignal'];
  forecast24h: {
    hour: number;
    price: number;
    signal: string;
  }[];
}

export interface GridEvent {
  id: string;
  type: 'outage' | 'maintenance' | 'high_demand' | 'renewable_surge' | 'emergency';
  severity: 'info' | 'warning' | 'critical';
  startTime: Date;
  endTime?: Date;
  affectedAreas: string[];
  description: string;
  impact: {
    expectedDuration: number; // minutes
    affectedCustomers: number;
    priceImpact: number; // multiplier
  };
}

/**
 * Local Grid Service - No External APIs Required
 * Simulates realistic grid conditions, pricing, and renewable energy data
 */
export class LocalGridService extends EventEmitter {
  private currentGridData: GridData;
  private currentPricing: EnergyPrice;
  private activeEvents: GridEvent[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  
  // Grid configuration
  private config = {
    region: 'Northeast US',
    gridCapacity: 50000, // MW
    basePrice: 0.12, // $/kWh
    updateInterval: 5 * 60 * 1000, // 5 minutes
    renewableCapacity: {
      solar: 8000, // MW
      wind: 12000, // MW
      hydro: 5000 // MW
    },
    fossilCapacity: {
      coal: 15000, // MW
      gas: 20000, // MW
      nuclear: 10000 // MW
    }
  };

  // Seasonal and time-based patterns
  private demandPatterns = {
    hourly: [0.6, 0.55, 0.5, 0.48, 0.5, 0.6, 0.75, 0.85, 0.9, 0.85, 0.8, 0.82, 0.85, 0.88, 0.9, 0.95, 1.0, 0.98, 0.95, 0.9, 0.85, 0.8, 0.75, 0.65],
    seasonal: {
      winter: 1.2,
      spring: 0.9,
      summer: 1.1,
      autumn: 0.95
    },
    weekly: [0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 0.85] // Mon-Sun
  };

  constructor(region?: string) {
    super();
    
    if (region) {
      this.config.region = region;
    }

    this.generateInitialGridData();
    this.generateInitialPricing();
    this.startGridUpdates();
    
    logger.info('⚡ Local Grid Service initialized');
  }

  private generateInitialGridData(): void {
    const now = new Date();
    this.currentGridData = this.generateGridData(now);
  }

  private generateInitialPricing(): void {
    const now = new Date();
    this.currentPricing = this.generatePricingData(now);
  }

  private generateGridData(timestamp: Date): GridData {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const season = this.getSeason(timestamp);
    
    // Calculate base demand
    const hourlyFactor = this.demandPatterns.hourly[hour];
    const seasonalFactor = this.demandPatterns.seasonal[season];
    const weeklyFactor = this.demandPatterns.weekly[dayOfWeek];
    const randomVariation = 0.9 + Math.random() * 0.2; // ±10%
    
    const baseDemand = this.config.gridCapacity * 0.7; // 70% average utilization
    const currentDemand = baseDemand * hourlyFactor * seasonalFactor * weeklyFactor * randomVariation;
    const load = Math.min(1, currentDemand / this.config.gridCapacity);
    
    // Grid frequency (should be close to 60Hz)
    const frequencyVariation = (Math.random() - 0.5) * 0.2;
    const loadFrequencyEffect = (1 - load) * 0.1;
    const frequency = 60 + frequencyVariation + loadFrequencyEffect;
    
    // Grid voltage
    const baseVoltage = 345; // kV transmission
    const voltageVariation = (Math.random() - 0.5) * 10;
    const loadVoltageEffect = load * -5; // Higher load = lower voltage
    const voltage = baseVoltage + voltageVariation + loadVoltageEffect;
    
    // Renewable generation (weather dependent)
    const solarGeneration = this.calculateSolarGeneration(timestamp);
    const windGeneration = this.calculateWindGeneration(timestamp);
    const hydroGeneration = this.config.renewableCapacity.hydro * (0.8 + Math.random() * 0.4); // 80-120% capacity
    
    const totalRenewable = solarGeneration + windGeneration + hydroGeneration;
    const renewablePercentage = totalRenewable / currentDemand;
    
    // Fossil generation fills the gap
    const remainingDemand = Math.max(0, currentDemand - totalRenewable);
    const coalGeneration = Math.min(this.config.fossilCapacity.coal, remainingDemand * 0.3);
    const gasGeneration = Math.min(this.config.fossilCapacity.gas, remainingDemand * 0.5);
    const nuclearGeneration = Math.min(this.config.fossilCapacity.nuclear, remainingDemand * 0.2);
    
    const totalFossil = coalGeneration + gasGeneration + nuclearGeneration;
    const fossilPercentage = totalFossil / currentDemand;
    
    // Carbon intensity calculation
    const carbonFactors = { coal: 820, gas: 350, nuclear: 12 }; // g CO2/kWh
    const carbonIntensity = (
      (coalGeneration * carbonFactors.coal) +
      (gasGeneration * carbonFactors.gas) +
      (nuclearGeneration * carbonFactors.nuclear)
    ) / currentDemand;
    
    // Price signal based on load and renewable availability
    let priceSignal: GridData['priceSignal'] = 'medium';
    if (load > 0.9 || renewablePercentage < 0.2) priceSignal = 'critical';
    else if (load > 0.8 || renewablePercentage < 0.4) priceSignal = 'high';
    else if (load < 0.6 && renewablePercentage > 0.7) priceSignal = 'low';
    
    // Demand response
    const demandResponse = {
      active: load > 0.85,
      level: Math.min(5, Math.floor((load - 0.8) * 10)),
      message: this.getDemandResponseMessage(load, renewablePercentage)
    };
    
    return {
      timestamp,
      load,
      frequency: Math.round(frequency * 100) / 100,
      voltage: Math.round(voltage * 10) / 10,
      renewableGeneration: {
        solar: Math.round(solarGeneration),
        wind: Math.round(windGeneration),
        hydro: Math.round(hydroGeneration),
        total: Math.round(totalRenewable),
        percentage: Math.round(renewablePercentage * 1000) / 10
      },
      fossilGeneration: {
        coal: Math.round(coalGeneration),
        gas: Math.round(gasGeneration),
        nuclear: Math.round(nuclearGeneration),
        total: Math.round(totalFossil),
        percentage: Math.round(fossilPercentage * 1000) / 10
      },
      totalGeneration: Math.round(currentDemand),
      carbonIntensity: Math.round(carbonIntensity),
      priceSignal,
      demandResponse
    };
  }

  private generatePricingData(timestamp: Date): EnergyPrice {
    const gridData = this.currentGridData || this.generateGridData(timestamp);
    
    // Base pricing with time-of-use
    const hour = timestamp.getHours();
    let timeOfUseMultiplier = 1.0;
    
    if (hour >= 16 && hour <= 20) timeOfUseMultiplier = 1.8; // Peak hours
    else if (hour >= 22 || hour <= 6) timeOfUseMultiplier = 0.7; // Off-peak
    else if (hour >= 10 && hour <= 16) timeOfUseMultiplier = 1.2; // Mid-peak
    
    // Load-based pricing
    const loadMultiplier = 0.8 + (gridData.load * 0.6); // 0.8 to 1.4
    
    // Renewable availability discount
    const renewableDiscount = gridData.renewableGeneration.percentage * 0.002; // Up to 20% discount
    
    // Carbon pricing
    const carbonPrice = gridData.carbonIntensity * 0.00005; // $0.05 per ton CO2
    
    // Calculate final price
    const basePrice = this.config.basePrice;
    const energyPrice = basePrice * timeOfUseMultiplier * loadMultiplier - renewableDiscount + carbonPrice;
    
    // Additional fees
    const demandCharge = 15 + (gridData.load * 10); // $15-25/kW
    const transmissionFee = 0.02;
    const distributionFee = 0.03;
    const taxes = energyPrice * 0.08; // 8% tax
    
    const totalPrice = energyPrice + transmissionFee + distributionFee + taxes;
    
    // Generate 24-hour forecast
    const forecast24h = [];
    for (let i = 1; i <= 24; i++) {
      const forecastTime = new Date(timestamp.getTime() + i * 60 * 60 * 1000);
      const forecastGrid = this.generateGridData(forecastTime);
      const forecastHour = forecastTime.getHours();
      
      let forecastMultiplier = 1.0;
      if (forecastHour >= 16 && forecastHour <= 20) forecastMultiplier = 1.8;
      else if (forecastHour >= 22 || forecastHour <= 6) forecastMultiplier = 0.7;
      else if (forecastHour >= 10 && forecastHour <= 16) forecastMultiplier = 1.2;
      
      const forecastLoadMultiplier = 0.8 + (forecastGrid.load * 0.6);
      const forecastRenewableDiscount = forecastGrid.renewableGeneration.percentage * 0.002;
      const forecastPrice = basePrice * forecastMultiplier * forecastLoadMultiplier - forecastRenewableDiscount;
      
      let signal = 'medium';
      if (forecastPrice > energyPrice * 1.3) signal = 'high';
      else if (forecastPrice < energyPrice * 0.8) signal = 'low';
      
      forecast24h.push({
        hour: forecastHour,
        price: Math.round(forecastPrice * 1000) / 1000,
        signal
      });
    }
    
    return {
      timestamp,
      pricePerKwh: Math.round(energyPrice * 1000) / 1000,
      demandCharge: Math.round(demandCharge * 100) / 100,
      transmissionFee,
      distributionFee,
      taxes: Math.round(taxes * 1000) / 1000,
      totalPrice: Math.round(totalPrice * 1000) / 1000,
      priceSignal: gridData.priceSignal,
      forecast24h
    };
  }

  private calculateSolarGeneration(timestamp: Date): number {
    const hour = timestamp.getHours();
    const month = timestamp.getMonth() + 1;
    
    // Solar generation curve (0 at night, peak at noon)
    let solarFactor = 0;
    if (hour >= 6 && hour <= 18) {
      const solarHour = hour - 12; // Center around noon
      solarFactor = Math.max(0, Math.cos((solarHour * Math.PI) / 12));
    }
    
    // Seasonal variation
    const seasonalFactor = 0.7 + 0.3 * Math.cos(((month - 6) * Math.PI) / 6);
    
    // Weather impact (simplified)
    const weatherFactor = 0.8 + Math.random() * 0.4; // 80-120% of potential
    
    return this.config.renewableCapacity.solar * solarFactor * seasonalFactor * weatherFactor;
  }

  private calculateWindGeneration(timestamp: Date): number {
    const hour = timestamp.getHours();
    
    // Wind is typically stronger at night and in winter
    const hourlyFactor = 0.7 + 0.3 * Math.cos(((hour - 3) * Math.PI) / 12); // Peak around 3 AM
    const seasonalFactor = this.getSeason(timestamp) === 'winter' ? 1.2 : 0.9;
    const weatherFactor = 0.6 + Math.random() * 0.8; // 60-140% variability
    
    return this.config.renewableCapacity.wind * hourlyFactor * seasonalFactor * weatherFactor;
  }

  private getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  private getDemandResponseMessage(load: number, renewablePercentage: number): string {
    if (load > 0.95) return 'Critical peak demand - reduce usage immediately';
    if (load > 0.9) return 'High demand period - please conserve energy';
    if (load > 0.85) return 'Peak demand alert - consider deferring non-essential usage';
    if (renewablePercentage > 0.8) return 'High renewable generation - great time to use energy';
    return 'Normal grid conditions';
  }

  private startGridUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateGridData();
    }, this.config.updateInterval);
  }

  private updateGridData(): void {
    const now = new Date();
    
    // Generate new grid data
    this.currentGridData = this.generateGridData(now);
    this.currentPricing = this.generatePricingData(now);
    
    // Check for grid events
    this.checkForGridEvents();
    
    // Emit updates
    this.emit('gridUpdate', this.currentGridData);
    this.emit('pricingUpdate', this.currentPricing);
    
    logger.debug('⚡ Grid data updated:', {
      load: `${(this.currentGridData.load * 100).toFixed(1)}%`,
      renewable: `${this.currentGridData.renewableGeneration.percentage}%`,
      price: `$${this.currentPricing.pricePerKwh}/kWh`,
      signal: this.currentGridData.priceSignal
    });
  }

  private checkForGridEvents(): void {
    // Simulate random grid events
    if (Math.random() < 0.001) { // 0.1% chance per update
      this.generateGridEvent();
    }
    
    // Clean up expired events
    this.activeEvents = this.activeEvents.filter(event => {
      if (event.endTime && new Date() > event.endTime) {
        this.emit('gridEventResolved', event);
        return false;
      }
      return true;
    });
  }

  private generateGridEvent(): void {
    const eventTypes: GridEvent['type'][] = ['outage', 'maintenance', 'high_demand', 'renewable_surge', 'emergency'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const event: GridEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this.getEventSeverity(type),
      startTime: new Date(),
      endTime: new Date(Date.now() + (30 + Math.random() * 120) * 60 * 1000), // 30-150 minutes
      affectedAreas: this.getAffectedAreas(),
      description: this.getEventDescription(type),
      impact: {
        expectedDuration: 30 + Math.random() * 120,
        affectedCustomers: Math.floor(Math.random() * 50000),
        priceImpact: type === 'renewable_surge' ? 0.8 : 1.2
      }
    };
    
    this.activeEvents.push(event);
    this.emit('gridEvent', event);
    
    logger.warn('⚠️ Grid event:', event.description);
  }

  private getEventSeverity(type: GridEvent['type']): GridEvent['severity'] {
    switch (type) {
      case 'emergency': return 'critical';
      case 'outage': return 'critical';
      case 'high_demand': return 'warning';
      case 'maintenance': return 'info';
      case 'renewable_surge': return 'info';
      default: return 'warning';
    }
  }

  private getAffectedAreas(): string[] {
    const areas = ['Downtown', 'Industrial District', 'Residential North', 'Residential South', 'Commercial Zone'];
    const numAreas = 1 + Math.floor(Math.random() * 3);
    return areas.sort(() => Math.random() - 0.5).slice(0, numAreas);
  }

  private getEventDescription(type: GridEvent['type']): string {
    switch (type) {
      case 'outage': return 'Unplanned power outage due to equipment failure';
      case 'maintenance': return 'Scheduled maintenance on transmission lines';
      case 'high_demand': return 'Exceptionally high electricity demand';
      case 'renewable_surge': return 'High renewable energy generation causing grid balancing';
      case 'emergency': return 'Emergency grid stabilization procedures activated';
      default: return 'Grid operational event';
    }
  }

  // Public API
  public getCurrentGridData(): GridData {
    return { ...this.currentGridData };
  }

  public getCurrentPricing(): EnergyPrice {
    return { ...this.currentPricing };
  }

  public getActiveEvents(): GridEvent[] {
    return this.activeEvents.map(event => ({ ...event }));
  }

  public getGridStatus(): {
    operational: boolean;
    load: number;
    renewablePercentage: number;
    priceSignal: string;
    activeEvents: number;
  } {
    return {
      operational: this.currentGridData.load < 0.98,
      load: this.currentGridData.load,
      renewablePercentage: this.currentGridData.renewableGeneration.percentage,
      priceSignal: this.currentGridData.priceSignal,
      activeEvents: this.activeEvents.length
    };
  }

  public getPriceForecast(hours: number = 24): EnergyPrice['forecast24h'] {
    return this.currentPricing.forecast24h.slice(0, hours);
  }

  public setRegion(region: string): void {
    this.config.region = region;
    
    // Adjust capacity based on region (simplified)
    if (region.includes('California')) {
      this.config.renewableCapacity.solar *= 1.5;
      this.config.basePrice = 0.18;
    } else if (region.includes('Texas')) {
      this.config.renewableCapacity.wind *= 1.8;
      this.config.basePrice = 0.09;
    } else if (region.includes('Northeast')) {
      this.config.fossilCapacity.nuclear *= 1.3;
      this.config.basePrice = 0.15;
    }
    
    // Regenerate data for new region
    this.generateInitialGridData();
    this.generateInitialPricing();
    
    this.emit('regionChanged', region);
    logger.info('🌍 Grid region updated:', region);
  }

  public getRegion(): string {
    return this.config.region;
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.removeAllListeners();
    logger.info('⚡ Local Grid Service destroyed');
  }
}

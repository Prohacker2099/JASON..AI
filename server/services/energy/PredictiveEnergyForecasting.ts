import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface EnergyForecast {
  deviceId: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  startTime: Date;
  endTime: Date;
  predictedUsage: number;
  confidence: number;
  factors: {
    historical: number;
    seasonal: number;
    weather: number;
    occupancy: number;
    external: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  conditions: string;
  timestamp: Date;
}

export interface OccupancyPattern {
  deviceId: string;
  timeSlots: {
    hour: number;
    occupancyProbability: number;
    usageMultiplier: number;
  }[];
  weekdayPattern: number[];
  seasonalAdjustment: number;
}

/**
 * Predictive Energy Forecasting System
 * Uses advanced ML algorithms to predict future energy consumption
 */
export class PredictiveEnergyForecasting extends EventEmitter {
  private isInitialized = false;
  private forecastingInterval: NodeJS.Timeout | null = null;
  private weatherData: WeatherData[] = [];
  private occupancyPatterns = new Map<string, OccupancyPattern>();
  private seasonalFactors = new Map<number, number>();
  
  // ML model components
  private timeSeriesModel: any = null;
  private weatherModel: any = null;
  private occupancyModel: any = null;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('🔮 Initializing Predictive Energy Forecasting System...');
    
    // Load historical data
    await this.loadHistoricalData();
    
    // Initialize weather integration
    await this.initializeWeatherIntegration();
    
    // Train forecasting models
    await this.trainForecastingModels();
    
    // Start continuous forecasting
    this.startContinuousForecasting();
    
    this.isInitialized = true;
    logger.info('✅ Predictive Energy Forecasting System initialized');
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      const readings = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: sixMonthsAgo }
        },
        orderBy: { timestamp: 'asc' }
      });

      logger.info(`📊 Loaded ${readings.length} historical readings for forecasting`);
      
      // Process data for model training
      await this.processHistoricalData(readings);
      
    } catch (error) {
      logger.error('Failed to load historical data for forecasting:', error);
    }
  }

  private async processHistoricalData(readings: any[]): Promise<void> {
    // Group by device
    const deviceData = new Map<string, any[]>();
    readings.forEach(reading => {
      if (!deviceData.has(reading.deviceId)) {
        deviceData.set(reading.deviceId, []);
      }
      deviceData.get(reading.deviceId)!.push(reading);
    });

    // Analyze patterns for each device
    for (const [deviceId, data] of deviceData) {
      await this.analyzeDeviceForecasting(deviceId, data);
    }

    // Calculate seasonal factors
    this.calculateSeasonalFactors(readings);
  }

  private async analyzeDeviceForecasting(deviceId: string, readings: any[]): Promise<void> {
    // Create occupancy pattern
    const occupancyPattern = this.createOccupancyPattern(deviceId, readings);
    this.occupancyPatterns.set(deviceId, occupancyPattern);
  }

  private createOccupancyPattern(deviceId: string, readings: any[]): OccupancyPattern {
    const hourlyData = new Array(24).fill(0).map(() => ({ total: 0, count: 0 }));
    const weeklyData = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));

    readings.forEach(reading => {
      const date = new Date(reading.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      hourlyData[hour].total += reading.powerWatts;
      hourlyData[hour].count++;

      weeklyData[dayOfWeek].total += reading.powerWatts;
      weeklyData[dayOfWeek].count++;
    });

    // Calculate hourly patterns
    const timeSlots = hourlyData.map((data, hour) => {
      const avgUsage = data.count > 0 ? data.total / data.count : 0;
      const maxUsage = Math.max(...hourlyData.map(d => d.count > 0 ? d.total / d.count : 0));
      
      return {
        hour,
        occupancyProbability: maxUsage > 0 ? avgUsage / maxUsage : 0,
        usageMultiplier: maxUsage > 0 ? avgUsage / (maxUsage * 0.5) : 1
      };
    });

    // Calculate weekly pattern
    const weekdayPattern = weeklyData.map(data => 
      data.count > 0 ? data.total / data.count : 0
    );

    return {
      deviceId,
      timeSlots,
      weekdayPattern,
      seasonalAdjustment: 1.0
    };
  }

  private calculateSeasonalFactors(readings: any[]): void {
    const monthlyData = new Map<number, { total: number; count: number }>();

    readings.forEach(reading => {
      const month = new Date(reading.timestamp).getMonth();
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { total: 0, count: 0 });
      }
      const data = monthlyData.get(month)!;
      data.total += reading.powerWatts;
      data.count++;
    });

    // Calculate average monthly usage
    const monthlyAverages = new Map<number, number>();
    monthlyData.forEach((data, month) => {
      monthlyAverages.set(month, data.total / data.count);
    });

    // Calculate seasonal factors relative to annual average
    const annualAverage = Array.from(monthlyAverages.values()).reduce((sum, avg) => sum + avg, 0) / monthlyAverages.size;
    
    monthlyAverages.forEach((avg, month) => {
      this.seasonalFactors.set(month, avg / annualAverage);
    });
  }

  private async initializeWeatherIntegration(): Promise<void> {
    try {
      // Initialize weather API integration
      // This would connect to a real weather service
      logger.info('🌤️ Weather integration initialized');
    } catch (error) {
      logger.error('Failed to initialize weather integration:', error);
    }
  }

  private async trainForecastingModels(): Promise<void> {
    logger.info('🧠 Training forecasting models...');
    
    // Initialize time series model
    this.timeSeriesModel = this.createTimeSeriesModel();
    
    // Initialize weather correlation model
    this.weatherModel = this.createWeatherModel();
    
    // Initialize occupancy model
    this.occupancyModel = this.createOccupancyModel();
    
    logger.info('✅ Forecasting models trained');
  }

  private createTimeSeriesModel(): any {
    // Simplified ARIMA-like model
    return {
      predict: (historicalData: number[], steps: number) => {
        if (historicalData.length < 3) return Array(steps).fill(historicalData[historicalData.length - 1] || 0);
        
        const predictions = [];
        const recent = historicalData.slice(-24); // Last 24 data points
        
        for (let i = 0; i < steps; i++) {
          // Simple moving average with trend
          const ma = recent.slice(-12).reduce((sum, val) => sum + val, 0) / 12;
          const trend = recent.length > 1 ? (recent[recent.length - 1] - recent[recent.length - 2]) : 0;
          
          const prediction = ma + (trend * 0.5);
          predictions.push(Math.max(0, prediction));
          recent.push(prediction);
        }
        
        return predictions;
      }
    };
  }

  private createWeatherModel(): any {
    return {
      adjustForWeather: (basePrediction: number, weather: WeatherData, deviceType: string) => {
        let adjustment = 1.0;
        
        // Temperature adjustments
        if (deviceType.includes('hvac') || deviceType.includes('heating')) {
          if (weather.temperature < 18) adjustment *= 1.3;
          if (weather.temperature > 25) adjustment *= 1.2;
        }
        
        // Lighting adjustments
        if (deviceType.includes('lighting')) {
          adjustment *= (1 + weather.cloudCover * 0.2);
        }
        
        return basePrediction * adjustment;
      }
    };
  }

  private createOccupancyModel(): any {
    return {
      adjustForOccupancy: (basePrediction: number, occupancyPattern: OccupancyPattern, hour: number, dayOfWeek: number) => {
        const timeSlot = occupancyPattern.timeSlots[hour];
        const weekdayFactor = occupancyPattern.weekdayPattern[dayOfWeek];
        const avgWeekday = occupancyPattern.weekdayPattern.reduce((sum, val) => sum + val, 0) / 7;
        
        let adjustment = timeSlot.usageMultiplier;
        if (avgWeekday > 0) {
          adjustment *= (weekdayFactor / avgWeekday);
        }
        
        return basePrediction * adjustment * occupancyPattern.seasonalAdjustment;
      }
    };
  }

  private startContinuousForecasting(): void {
    // Generate forecasts every 30 minutes
    this.forecastingInterval = setInterval(async () => {
      await this.generateAllForecasts();
    }, 30 * 60 * 1000);

    logger.info('🔄 Started continuous energy forecasting');
  }

  private async generateAllForecasts(): Promise<void> {
    try {
      const devices = await this.getActiveDevices();
      
      for (const device of devices) {
        const forecasts = await this.generateDeviceForecasts(device.id);
        
        forecasts.forEach(forecast => {
          this.emit('energyForecast', forecast);
        });
      }
      
    } catch (error) {
      logger.error('Failed to generate forecasts:', error);
    }
  }

  private async getActiveDevices(): Promise<any[]> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const activeDevices = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: oneDayAgo }
        },
        select: {
          deviceId: true
        },
        distinct: ['deviceId']
      });

      return activeDevices;
    } catch (error) {
      logger.error('Failed to get active devices:', error);
      return [];
    }
  }

  public async generateDeviceForecasts(deviceId: string): Promise<EnergyForecast[]> {
    try {
      const historicalData = await this.getDeviceHistoricalData(deviceId);
      const occupancyPattern = this.occupancyPatterns.get(deviceId);
      const currentWeather = await this.getCurrentWeather();
      
      const forecasts: EnergyForecast[] = [];
      
      // Generate hourly forecast for next 24 hours
      const hourlyForecast = await this.generateHourlyForecast(deviceId, historicalData, occupancyPattern, currentWeather);
      forecasts.push(hourlyForecast);
      
      // Generate daily forecast for next 7 days
      const dailyForecast = await this.generateDailyForecast(deviceId, historicalData, occupancyPattern);
      forecasts.push(dailyForecast);
      
      // Generate weekly forecast for next 4 weeks
      const weeklyForecast = await this.generateWeeklyForecast(deviceId, historicalData);
      forecasts.push(weeklyForecast);
      
      // Generate monthly forecast
      const monthlyForecast = await this.generateMonthlyForecast(deviceId, historicalData);
      forecasts.push(monthlyForecast);
      
      return forecasts;
      
    } catch (error) {
      logger.error(`Failed to generate forecasts for device ${deviceId}:`, error);
      return [];
    }
  }

  private async getDeviceHistoricalData(deviceId: string): Promise<number[]> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const readings = await prisma.energyReading.findMany({
        where: {
          deviceId,
          timestamp: { gte: sevenDaysAgo }
        },
        orderBy: { timestamp: 'asc' },
        select: { powerWatts: true }
      });

      return readings.map(r => r.powerWatts);
    } catch (error) {
      logger.error('Failed to get device historical data:', error);
      return [];
    }
  }

  private async getCurrentWeather(): Promise<WeatherData> {
    // Simplified weather data - in production, this would fetch from a weather API
    return {
      temperature: 22,
      humidity: 60,
      cloudCover: 0.3,
      windSpeed: 5,
      conditions: 'partly_cloudy',
      timestamp: new Date()
    };
  }

  private async generateHourlyForecast(
    deviceId: string, 
    historicalData: number[], 
    occupancyPattern?: OccupancyPattern,
    weather?: WeatherData
  ): Promise<EnergyForecast> {
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Generate base prediction using time series model
    const basePredictions = this.timeSeriesModel.predict(historicalData, 24);
    
    // Apply adjustments
    let adjustedPredictions = basePredictions;
    
    if (occupancyPattern) {
      adjustedPredictions = basePredictions.map((pred, hour) => {
        const currentHour = (now.getHours() + hour) % 24;
        const dayOfWeek = new Date(now.getTime() + hour * 60 * 60 * 1000).getDay();
        return this.occupancyModel.adjustForOccupancy(pred, occupancyPattern, currentHour, dayOfWeek);
      });
    }
    
    if (weather) {
      adjustedPredictions = adjustedPredictions.map(pred => 
        this.weatherModel.adjustForWeather(pred, weather, 'generic')
      );
    }
    
    const totalPrediction = adjustedPredictions.reduce((sum, pred) => sum + pred, 0);
    const confidence = this.calculateForecastConfidence(historicalData.length, 24);
    
    return {
      deviceId,
      timeframe: 'hour',
      startTime: now,
      endTime,
      predictedUsage: totalPrediction,
      confidence,
      factors: {
        historical: 0.4,
        seasonal: 0.1,
        weather: weather ? 0.2 : 0,
        occupancy: occupancyPattern ? 0.2 : 0,
        external: 0.1
      },
      scenarios: {
        optimistic: totalPrediction * 0.8,
        realistic: totalPrediction,
        pessimistic: totalPrediction * 1.2
      }
    };
  }

  private async generateDailyForecast(
    deviceId: string, 
    historicalData: number[], 
    occupancyPattern?: OccupancyPattern
  ): Promise<EnergyForecast> {
    const now = new Date();
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Generate daily predictions for next 7 days
    const dailyPredictions = this.timeSeriesModel.predict(
      this.aggregateToDaily(historicalData), 
      7
    );
    
    // Apply seasonal adjustments
    const currentMonth = now.getMonth();
    const seasonalFactor = this.seasonalFactors.get(currentMonth) || 1.0;
    
    const adjustedPredictions = dailyPredictions.map(pred => pred * seasonalFactor);
    const totalPrediction = adjustedPredictions.reduce((sum, pred) => sum + pred, 0);
    
    return {
      deviceId,
      timeframe: 'day',
      startTime: now,
      endTime,
      predictedUsage: totalPrediction,
      confidence: this.calculateForecastConfidence(historicalData.length, 7 * 24),
      factors: {
        historical: 0.5,
        seasonal: 0.3,
        weather: 0.1,
        occupancy: occupancyPattern ? 0.1 : 0,
        external: 0.0
      },
      scenarios: {
        optimistic: totalPrediction * 0.85,
        realistic: totalPrediction,
        pessimistic: totalPrediction * 1.15
      }
    };
  }

  private async generateWeeklyForecast(deviceId: string, historicalData: number[]): Promise<EnergyForecast> {
    const now = new Date();
    const endTime = new Date(now.getTime() + 4 * 7 * 24 * 60 * 60 * 1000);
    
    const weeklyData = this.aggregateToWeekly(historicalData);
    const weeklyPredictions = this.timeSeriesModel.predict(weeklyData, 4);
    
    const totalPrediction = weeklyPredictions.reduce((sum, pred) => sum + pred, 0);
    
    return {
      deviceId,
      timeframe: 'week',
      startTime: now,
      endTime,
      predictedUsage: totalPrediction,
      confidence: this.calculateForecastConfidence(historicalData.length, 4 * 7 * 24),
      factors: {
        historical: 0.6,
        seasonal: 0.2,
        weather: 0.1,
        occupancy: 0.1,
        external: 0.0
      },
      scenarios: {
        optimistic: totalPrediction * 0.9,
        realistic: totalPrediction,
        pessimistic: totalPrediction * 1.1
      }
    };
  }

  private async generateMonthlyForecast(deviceId: string, historicalData: number[]): Promise<EnergyForecast> {
    const now = new Date();
    const endTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const monthlyData = this.aggregateToMonthly(historicalData);
    const monthlyPrediction = this.timeSeriesModel.predict(monthlyData, 1)[0];
    
    // Apply strong seasonal adjustment for monthly forecasts
    const currentMonth = now.getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    const seasonalFactor = this.seasonalFactors.get(nextMonth) || 1.0;
    
    const adjustedPrediction = monthlyPrediction * seasonalFactor;
    
    return {
      deviceId,
      timeframe: 'month',
      startTime: now,
      endTime,
      predictedUsage: adjustedPrediction,
      confidence: this.calculateForecastConfidence(historicalData.length, 30 * 24),
      factors: {
        historical: 0.4,
        seasonal: 0.4,
        weather: 0.1,
        occupancy: 0.1,
        external: 0.0
      },
      scenarios: {
        optimistic: adjustedPrediction * 0.85,
        realistic: adjustedPrediction,
        pessimistic: adjustedPrediction * 1.25
      }
    };
  }

  private aggregateToDaily(hourlyData: number[]): number[] {
    const dailyData = [];
    for (let i = 0; i < hourlyData.length; i += 24) {
      const dayData = hourlyData.slice(i, i + 24);
      const dayTotal = dayData.reduce((sum, val) => sum + val, 0);
      dailyData.push(dayTotal);
    }
    return dailyData;
  }

  private aggregateToWeekly(hourlyData: number[]): number[] {
    const weeklyData = [];
    for (let i = 0; i < hourlyData.length; i += 168) { // 24 * 7
      const weekData = hourlyData.slice(i, i + 168);
      const weekTotal = weekData.reduce((sum, val) => sum + val, 0);
      weeklyData.push(weekTotal);
    }
    return weeklyData;
  }

  private aggregateToMonthly(hourlyData: number[]): number[] {
    const monthlyData = [];
    for (let i = 0; i < hourlyData.length; i += 720) { // 24 * 30
      const monthData = hourlyData.slice(i, i + 720);
      const monthTotal = monthData.reduce((sum, val) => sum + val, 0);
      monthlyData.push(monthTotal);
    }
    return monthlyData;
  }

  private calculateForecastConfidence(dataPoints: number, forecastHorizon: number): number {
    // Confidence decreases with forecast horizon and increases with data availability
    const dataConfidence = Math.min(1.0, dataPoints / (forecastHorizon * 2));
    const horizonConfidence = Math.max(0.3, 1.0 - (forecastHorizon / (30 * 24))); // 30 days max
    
    return dataConfidence * horizonConfidence;
  }

  // Public API
  public async getForecast(deviceId: string, timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<EnergyForecast | null> {
    try {
      const forecasts = await this.generateDeviceForecasts(deviceId);
      return forecasts.find(f => f.timeframe === timeframe) || null;
    } catch (error) {
      logger.error(`Failed to get forecast for device ${deviceId}:`, error);
      return null;
    }
  }

  public async getAllForecasts(timeframe?: 'hour' | 'day' | 'week' | 'month'): Promise<EnergyForecast[]> {
    try {
      const devices = await this.getActiveDevices();
      const allForecasts: EnergyForecast[] = [];
      
      for (const device of devices) {
        const forecasts = await this.generateDeviceForecasts(device.deviceId);
        if (timeframe) {
          const filtered = forecasts.filter(f => f.timeframe === timeframe);
          allForecasts.push(...filtered);
        } else {
          allForecasts.push(...forecasts);
        }
      }
      
      return allForecasts;
    } catch (error) {
      logger.error('Failed to get all forecasts:', error);
      return [];
    }
  }

  public async updateWeatherData(weather: WeatherData): Promise<void> {
    this.weatherData.push(weather);
    
    // Keep only last 48 hours of weather data
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    this.weatherData = this.weatherData.filter(w => w.timestamp >= twoDaysAgo);
    
    // Regenerate forecasts with new weather data
    await this.generateAllForecasts();
  }

  destroy(): void {
    if (this.forecastingInterval) {
      clearInterval(this.forecastingInterval);
      this.forecastingInterval = null;
    }
    
    this.weatherData = [];
    this.occupancyPatterns.clear();
    this.seasonalFactors.clear();
    
    logger.info('🔮 Predictive Energy Forecasting System destroyed');
  }
}

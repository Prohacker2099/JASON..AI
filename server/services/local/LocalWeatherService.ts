import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface WeatherData {
  timestamp: Date;
  temperature: number; // Celsius
  humidity: number; // Percentage
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // degrees
  cloudCover: number; // Percentage
  visibility: number; // km
  uvIndex: number;
  precipitation: number; // mm
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
  solarIrradiance: number; // W/m²
  dewPoint: number; // Celsius
}

export interface WeatherForecast {
  timestamp: Date;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  humidity: number;
  precipitation: {
    probability: number;
    amount: number;
  };
  windSpeed: number;
  condition: WeatherData['condition'];
  solarIrradiance: number;
}

/**
 * Local Weather Service - No External APIs Required
 * Generates realistic weather data based on location, season, and time patterns
 */
export class LocalWeatherService extends EventEmitter {
  private currentWeather: WeatherData;
  private forecast: WeatherForecast[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private config = {
    location: {
      latitude: 40.7128, // Default: New York
      longitude: -74.0060,
      timezone: 'America/New_York',
      elevation: 10 // meters
    },
    updateInterval: 10 * 60 * 1000, // 10 minutes
    forecastDays: 7
  };

  // Weather patterns based on season and time
  private weatherPatterns = {
    spring: {
      tempRange: { min: 10, max: 25 },
      humidity: { min: 40, max: 70 },
      precipitation: 0.3,
      conditions: ['clear', 'cloudy', 'rainy']
    },
    summer: {
      tempRange: { min: 20, max: 35 },
      humidity: { min: 50, max: 80 },
      precipitation: 0.2,
      conditions: ['clear', 'cloudy', 'stormy']
    },
    autumn: {
      tempRange: { min: 5, max: 20 },
      humidity: { min: 45, max: 75 },
      precipitation: 0.25,
      conditions: ['clear', 'cloudy', 'rainy', 'foggy']
    },
    winter: {
      tempRange: { min: -5, max: 10 },
      humidity: { min: 30, max: 60 },
      precipitation: 0.35,
      conditions: ['clear', 'cloudy', 'snowy', 'foggy']
    }
  };

  constructor(location?: { latitude: number; longitude: number; timezone?: string }) {
    super();
    
    if (location) {
      this.config.location = { ...this.config.location, ...location };
    }

    this.generateInitialWeather();
    this.generateForecast();
    this.startWeatherUpdates();
    
    logger.info('🌤️ Local Weather Service initialized');
  }

  private generateInitialWeather(): void {
    const now = new Date();
    const season = this.getSeason(now);
    const timeOfDay = this.getTimeOfDay(now);
    
    this.currentWeather = this.generateWeatherData(now, season, timeOfDay);
  }

  private generateWeatherData(timestamp: Date, season: keyof typeof this.weatherPatterns, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): WeatherData {
    const pattern = this.weatherPatterns[season];
    
    // Base temperature with daily and seasonal variation
    const baseTemp = (pattern.tempRange.min + pattern.tempRange.max) / 2;
    const dailyVariation = this.getDailyTemperatureVariation(timeOfDay);
    const randomVariation = (Math.random() - 0.5) * 5;
    const temperature = Math.round((baseTemp + dailyVariation + randomVariation) * 10) / 10;
    
    // Humidity with temperature correlation
    const baseHumidity = (pattern.humidity.min + pattern.humidity.max) / 2;
    const tempHumidityCorrelation = (temperature - baseTemp) * -1.5; // Higher temp = lower humidity
    const humidity = Math.max(20, Math.min(100, Math.round(baseHumidity + tempHumidityCorrelation + (Math.random() - 0.5) * 20)));
    
    // Pressure with weather system simulation
    const basePressure = 1013.25;
    const pressureVariation = (Math.random() - 0.5) * 40;
    const pressure = Math.round((basePressure + pressureVariation) * 10) / 10;
    
    // Wind based on pressure and season
    const windSpeed = Math.max(0, Math.round((Math.random() * 15 + (1020 - pressure) * 0.5) * 10) / 10);
    const windDirection = Math.round(Math.random() * 360);
    
    // Cloud cover influences other conditions
    const cloudCover = Math.round(Math.random() * 100);
    
    // Visibility based on humidity and conditions
    const baseVisibility = 20;
    const humidityReduction = (humidity - 50) * 0.2;
    const visibility = Math.max(0.1, Math.round((baseVisibility - humidityReduction) * 10) / 10);
    
    // UV Index based on cloud cover and time
    const maxUV = this.getMaxUVForSeason(season);
    const timeUVFactor = this.getUVTimeOfDayFactor(timeOfDay);
    const cloudUVReduction = cloudCover * 0.01;
    const uvIndex = Math.max(0, Math.round(maxUV * timeUVFactor * (1 - cloudUVReduction)));
    
    // Precipitation
    const precipitationChance = pattern.precipitation + (cloudCover * 0.005);
    const precipitation = Math.random() < precipitationChance ? Math.round(Math.random() * 10 * 10) / 10 : 0;
    
    // Weather condition
    const condition = this.determineWeatherCondition(temperature, humidity, cloudCover, precipitation, season);
    
    // Solar irradiance
    const maxSolar = 1000; // W/m²
    const solarTimeOfDayFactor = this.getSolarTimeOfDayFactor(timeOfDay);
    const solarCloudReduction = cloudCover * 0.008;
    const solarIrradiance = Math.max(0, Math.round(maxSolar * solarTimeOfDayFactor * (1 - solarCloudReduction)));
    
    // Dew point
    const dewPoint = Math.round((temperature - ((100 - humidity) / 5)) * 10) / 10;
    
    return {
      timestamp,
      temperature,
      humidity,
      pressure,
      windSpeed,
      windDirection,
      cloudCover,
      visibility,
      uvIndex,
      precipitation,
      condition,
      solarIrradiance,
      dewPoint
    };
  }

  private getSeason(date: Date): keyof typeof this.weatherPatterns {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getDailyTemperatureVariation(timeOfDay: string): number {
    switch (timeOfDay) {
      case 'morning': return -2;
      case 'afternoon': return 3;
      case 'evening': return 1;
      case 'night': return -4;
      default: return 0;
    }
  }

  private getMaxUVForSeason(season: keyof typeof this.weatherPatterns): number {
    switch (season) {
      case 'spring': return 7;
      case 'summer': return 10;
      case 'autumn': return 5;
      case 'winter': return 3;
      default: return 5;
    }
  }

  private getUVTimeOfDayFactor(timeOfDay: string): number {
    switch (timeOfDay) {
      case 'morning': return 0.6;
      case 'afternoon': return 1.0;
      case 'evening': return 0.3;
      case 'night': return 0;
      default: return 0.5;
    }
  }

  private getSolarTimeOfDayFactor(timeOfDay: string): number {
    switch (timeOfDay) {
      case 'morning': return 0.7;
      case 'afternoon': return 1.0;
      case 'evening': return 0.4;
      case 'night': return 0;
      default: return 0.5;
    }
  }

  private determineWeatherCondition(
    temperature: number,
    humidity: number,
    cloudCover: number,
    precipitation: number,
    season: keyof typeof this.weatherPatterns
  ): WeatherData['condition'] {
    if (precipitation > 0) {
      if (season === 'winter' && temperature < 2) return 'snowy';
      if (precipitation > 5) return 'stormy';
      return 'rainy';
    }
    
    if (humidity > 90 && cloudCover > 80) return 'foggy';
    if (cloudCover > 70) return 'cloudy';
    
    return 'clear';
  }

  private generateForecast(): void {
    this.forecast = [];
    const now = new Date();
    
    for (let i = 1; i <= this.config.forecastDays; i++) {
      const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const season = this.getSeason(forecastDate);
      
      // Generate weather for different times of day
      const morningWeather = this.generateWeatherData(forecastDate, season, 'morning');
      const afternoonWeather = this.generateWeatherData(forecastDate, season, 'afternoon');
      const eveningWeather = this.generateWeatherData(forecastDate, season, 'evening');
      
      const forecast: WeatherForecast = {
        timestamp: forecastDate,
        temperature: {
          min: Math.min(morningWeather.temperature, eveningWeather.temperature),
          max: afternoonWeather.temperature,
          current: afternoonWeather.temperature
        },
        humidity: afternoonWeather.humidity,
        precipitation: {
          probability: Math.max(
            morningWeather.precipitation > 0 ? 1 : 0,
            afternoonWeather.precipitation > 0 ? 1 : 0,
            eveningWeather.precipitation > 0 ? 1 : 0
          ) * 100,
          amount: Math.max(morningWeather.precipitation, afternoonWeather.precipitation, eveningWeather.precipitation)
        },
        windSpeed: afternoonWeather.windSpeed,
        condition: afternoonWeather.condition,
        solarIrradiance: afternoonWeather.solarIrradiance
      };
      
      this.forecast.push(forecast);
    }
  }

  private startWeatherUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateWeather();
    }, this.config.updateInterval);
  }

  private updateWeather(): void {
    const now = new Date();
    const season = this.getSeason(now);
    const timeOfDay = this.getTimeOfDay(now);
    
    // Generate new weather with some continuity from current weather
    const newWeather = this.generateWeatherData(now, season, timeOfDay);
    
    // Apply some smoothing to avoid dramatic changes
    newWeather.temperature = this.smoothTransition(this.currentWeather.temperature, newWeather.temperature, 0.3);
    newWeather.humidity = this.smoothTransition(this.currentWeather.humidity, newWeather.humidity, 0.2);
    newWeather.pressure = this.smoothTransition(this.currentWeather.pressure, newWeather.pressure, 0.1);
    
    this.currentWeather = newWeather;
    
    // Update forecast
    this.generateForecast();
    
    // Emit weather update event
    this.emit('weatherUpdate', this.currentWeather);
    
    logger.debug('🌤️ Weather updated:', {
      temp: this.currentWeather.temperature,
      condition: this.currentWeather.condition,
      humidity: this.currentWeather.humidity
    });
  }

  private smoothTransition(current: number, target: number, factor: number): number {
    return Math.round((current + (target - current) * factor) * 10) / 10;
  }

  // Public API
  public getCurrentWeather(): WeatherData {
    return { ...this.currentWeather };
  }

  public getForecast(days?: number): WeatherForecast[] {
    const requestedDays = days || this.config.forecastDays;
    return this.forecast.slice(0, requestedDays).map(f => ({ ...f }));
  }

  public getHourlyForecast(hours: number = 24): WeatherData[] {
    const hourlyData: WeatherData[] = [];
    const now = new Date();
    
    for (let i = 1; i <= hours; i++) {
      const hourDate = new Date(now.getTime() + i * 60 * 60 * 1000);
      const season = this.getSeason(hourDate);
      const timeOfDay = this.getTimeOfDay(hourDate);
      
      hourlyData.push(this.generateWeatherData(hourDate, season, timeOfDay));
    }
    
    return hourlyData;
  }

  public getWeatherForEnergyForecasting(): {
    current: {
      temperature: number;
      solarIrradiance: number;
      windSpeed: number;
      cloudCover: number;
    };
    forecast24h: {
      hour: number;
      temperature: number;
      solarIrradiance: number;
      windSpeed: number;
    }[];
  } {
    const hourlyForecast = this.getHourlyForecast(24);
    
    return {
      current: {
        temperature: this.currentWeather.temperature,
        solarIrradiance: this.currentWeather.solarIrradiance,
        windSpeed: this.currentWeather.windSpeed,
        cloudCover: this.currentWeather.cloudCover
      },
      forecast24h: hourlyForecast.map((weather, index) => ({
        hour: (new Date().getHours() + index + 1) % 24,
        temperature: weather.temperature,
        solarIrradiance: weather.solarIrradiance,
        windSpeed: weather.windSpeed
      }))
    };
  }

  public setLocation(latitude: number, longitude: number, timezone?: string): void {
    this.config.location.latitude = latitude;
    this.config.location.longitude = longitude;
    if (timezone) {
      this.config.location.timezone = timezone;
    }
    
    // Regenerate weather for new location
    this.generateInitialWeather();
    this.generateForecast();
    
    this.emit('locationChanged', this.config.location);
    logger.info('🌍 Weather location updated:', this.config.location);
  }

  public getLocation(): typeof this.config.location {
    return { ...this.config.location };
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.removeAllListeners();
    logger.info('🌤️ Local Weather Service destroyed');
  }
}

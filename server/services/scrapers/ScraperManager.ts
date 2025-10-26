import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { energyPriceScraper, EnergyPriceData, WeatherData } from './EnergyPriceScraper';
import { deviceDiscoveryScraper, ScrapedDeviceInfo } from './DeviceDiscoveryScraper';
import { marketDataScraper, CryptoPrice, StockPrice, CommodityPrice } from './MarketDataScraper';
import { prisma } from '../../utils/prisma';

/**
 * Central manager for all web scrapers
 * Replaces multiple paid APIs with free web scraping
 */
export class ScraperManager extends EventEmitter {
  private isInitialized = false;
  private scraperInterval: NodeJS.Timeout | null = null;
  private cache = new Map<string, { data: any; timestamp: Date; ttl: number }>();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('🕷️ Initializing scraper manager...');

    try {
      await Promise.all([
        energyPriceScraper.initialize(),
        deviceDiscoveryScraper.initialize(),
        marketDataScraper.initialize()
      ]);

      this.isInitialized = true;
      this.startPeriodicScraping();
      
      logger.info('✅ Scraper manager initialized - NO PAID APIS NEEDED');
    } catch (error) {
      logger.error('Failed to initialize scraper manager:', error);
      throw error;
    }
  }

  private startPeriodicScraping(): void {
    // ULTRA-AGGRESSIVE: Run scrapers every 1 SECOND
    this.scraperInterval = setInterval(async () => {
      await this.runAllScrapers();
    }, 1000);

    // Run initial scraping immediately
    setTimeout(() => this.runAllScrapers(), 100);
  }

  private async runAllScrapers(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // PARALLEL AGGRESSIVE SCRAPING - ALL AT ONCE
      const scrapingPromises = [
        this.scrapeEnergyDataAggressively(),
        this.scrapeMarketDataAggressively(),
        this.scrapeWeatherDataAggressively(),
        this.scrapeDeviceDataAggressively(),
        this.scrapeCommodityDataAggressively()
      ];

      const results = await Promise.allSettled(scrapingPromises);
      
      // Count successful scrapes
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      const duration = Date.now() - startTime;
      
      // Emit real-time update
      this.emit('scrapingComplete', {
        timestamp: new Date(),
        duration,
        successful,
        failed,
        totalScrapers: scrapingPromises.length
      });

      // Broadcast via WebSocket if available
      this.broadcastUpdate({
        type: 'scraping_update',
        data: { successful, failed, duration },
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('AGGRESSIVE scraping failed:', error);
    }
  }

  private async scrapeEnergyDataAggressively(): Promise<void> {
    const [energyPrices, weatherData, utilityRates] = await Promise.allSettled([
      energyPriceScraper.scrapeEnergyPrices(),
      energyPriceScraper.scrapeWeatherData(),
      energyPriceScraper.scrapeUtilityRates('con_edison', 'NY')
    ]);

    if (energyPrices.status === 'fulfilled') {
      this.cacheData('energy_prices', energyPrices.value, 1); // 1 second TTL for real-time
    }
    if (weatherData.status === 'fulfilled' && weatherData.value) {
      this.cacheData('weather_data', weatherData.value, 1);
    }
    if (utilityRates.status === 'fulfilled' && utilityRates.value) {
      this.cacheData('utility_rates', utilityRates.value, 1);
    }
  }

  private async scrapeMarketDataAggressively(): Promise<void> {
    const [crypto, stocks, commodities, currency] = await Promise.allSettled([
      marketDataScraper.scrapeCryptoPrices(['bitcoin', 'ethereum']),
      marketDataScraper.scrapeStockPrices(['AAPL', 'GOOGL', 'TSLA']),
      marketDataScraper.scrapeCommodityPrices(),
      marketDataScraper.scrapeCurrencyRates('USD')
    ]);

    if (crypto.status === 'fulfilled') {
      this.cacheData('crypto_prices', crypto.value, 1);
    }
    if (stocks.status === 'fulfilled') {
      this.cacheData('stock_prices', stocks.value, 1);
    }
    if (commodities.status === 'fulfilled') {
      this.cacheData('commodity_prices', commodities.value, 1);
    }
    if (currency.status === 'fulfilled') {
      this.cacheData('currency_rates', currency.value, 1);
    }
  }

  private async scrapeWeatherDataAggressively(): Promise<void> {
    const locations = ['New York', 'Los Angeles', 'Chicago'];
    const weatherPromises = locations.map(loc => 
      energyPriceScraper.scrapeWeatherData(loc)
    );

    const results = await Promise.allSettled(weatherPromises);
    const weatherData: any[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        weatherData.push({
          location: locations[index],
          ...result.value
        });
      }
    });

    if (weatherData.length > 0) {
      this.cacheData('multi_weather_data', weatherData, 1);
    }
  }

  private async scrapeDeviceDataAggressively(): Promise<void> {
    // Only scrape device data every 10 seconds to avoid overwhelming manufacturer sites
    const lastDeviceScrape = this.cache.get('last_device_scrape')?.timestamp;
    if (lastDeviceScrape && (Date.now() - lastDeviceScrape.getTime()) < 10000) {
      return;
    }

    const [tasmota, shelly, zigbee] = await Promise.allSettled([
      deviceDiscoveryScraper.scrapeTasmotaDevices(),
      deviceDiscoveryScraper.scrapeShellyDevices(),
      deviceDiscoveryScraper.scrapeZigbeeDevices()
    ]);

    const allDevices: any[] = [];
    if (tasmota.status === 'fulfilled') allDevices.push(...tasmota.value);
    if (shelly.status === 'fulfilled') allDevices.push(...shelly.value);
    if (zigbee.status === 'fulfilled') allDevices.push(...zigbee.value);

    if (allDevices.length > 0) {
      this.cacheData('device_database', allDevices, 10);
      this.cacheData('last_device_scrape', new Date(), 10);
    }
  }

  private async scrapeCommodityDataAggressively(): Promise<void> {
    const [commodities, energyFutures] = await Promise.allSettled([
      marketDataScraper.scrapeCommodityPrices(),
      marketDataScraper.scrapeEnergyFutures()
    ]);

    if (commodities.status === 'fulfilled') {
      this.cacheData('commodity_prices', commodities.value, 1);
    }
    if (energyFutures.status === 'fulfilled') {
      this.cacheData('energy_futures', energyFutures.value, 1);
    }
  }

  private broadcastUpdate(data: any): void {
    // Emit for WebSocket broadcasting
    this.emit('realTimeUpdate', data);
  }

  private cacheData(key: string, data: any, ttlMinutes: number): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  private isCacheExpired(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return true;
    
    const now = Date.now();
    const cacheTime = cached.timestamp.getTime();
    return (now - cacheTime) > cached.ttl;
  }

  // Public API methods
  async getEnergyPrices(region?: string): Promise<EnergyPriceData[]> {
    const cached = this.cache.get('energy_prices');
    if (cached && !this.isCacheExpired('energy_prices')) {
      return cached.data.filter((price: EnergyPriceData) => 
        !region || price.region.toLowerCase().includes(region.toLowerCase())
      );
    }

    // Fetch fresh data
    const prices = await energyPriceScraper.scrapeEnergyPrices(region);
    this.cacheData('energy_prices', prices, 60);
    return prices;
  }

  async getWeatherData(location?: string): Promise<WeatherData | null> {
    const cached = this.cache.get('weather_data');
    if (cached && !this.isCacheExpired('weather_data')) {
      return cached.data;
    }

    const weather = await energyPriceScraper.scrapeWeatherData(location);
    if (weather) {
      this.cacheData('weather_data', weather, 15);
    }
    return weather;
  }

  async getCryptoPrices(symbols?: string[]): Promise<CryptoPrice[]> {
    const cached = this.cache.get('crypto_prices');
    if (cached && !this.isCacheExpired('crypto_prices')) {
      return symbols ? 
        cached.data.filter((price: CryptoPrice) => symbols.includes(price.symbol.toLowerCase())) :
        cached.data;
    }

    const prices = await marketDataScraper.scrapeCryptoPrices(symbols);
    this.cacheData('crypto_prices', prices, 5);
    return prices;
  }

  async getStockPrices(symbols?: string[]): Promise<StockPrice[]> {
    const cached = this.cache.get('stock_prices');
    if (cached && !this.isCacheExpired('stock_prices')) {
      return symbols ? 
        cached.data.filter((price: StockPrice) => symbols.includes(price.symbol)) :
        cached.data;
    }

    const prices = await marketDataScraper.scrapeStockPrices(symbols);
    this.cacheData('stock_prices', prices, 15);
    return prices;
  }

  async getDeviceDatabase(): Promise<ScrapedDeviceInfo[]> {
    const cached = this.cache.get('device_database');
    if (cached && !this.isCacheExpired('device_database')) {
      return cached.data;
    }

    // Scrape all device databases
    const [tasmota, shelly, zigbee, kasa] = await Promise.all([
      deviceDiscoveryScraper.scrapeTasmotaDevices(),
      deviceDiscoveryScraper.scrapeShellyDevices(),
      deviceDiscoveryScraper.scrapeZigbeeDevices(),
      deviceDiscoveryScraper.scrapeKasaDevices()
    ]);

    const allDevices = [...tasmota, ...shelly, ...zigbee, ...kasa];
    this.cacheData('device_database', allDevices, 1440);
    return allDevices;
  }

  async findDeviceInfo(manufacturer: string, model: string): Promise<ScrapedDeviceInfo | null> {
    const devices = await this.getDeviceDatabase();
    return devices.find(device => 
      device.manufacturer.toLowerCase().includes(manufacturer.toLowerCase()) &&
      device.model.toLowerCase().includes(model.toLowerCase())
    ) || null;
  }

  async getUtilityRates(company: string, region: string): Promise<EnergyPriceData | null> {
    const cacheKey = `utility_${company}_${region}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isCacheExpired(cacheKey)) {
      return cached.data;
    }

    const rates = await energyPriceScraper.scrapeUtilityRates(company, region);
    if (rates) {
      this.cacheData(cacheKey, rates, 1440); // 24 hours
    }
    return rates;
  }

  async getCommodityPrices(): Promise<CommodityPrice[]> {
    const cached = this.cache.get('commodity_prices');
    if (cached && !this.isCacheExpired('commodity_prices')) {
      return cached.data;
    }

    const prices = await marketDataScraper.scrapeCommodityPrices();
    this.cacheData('commodity_prices', prices, 60);
    return prices;
  }

  async getCurrencyRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    const cacheKey = `currency_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isCacheExpired(cacheKey)) {
      return cached.data;
    }

    const rates = await marketDataScraper.scrapeCurrencyRates(baseCurrency);
    this.cacheData(cacheKey, rates, 60);
    return rates;
  }

  // Analytics and insights
  async getEnergyMarketInsights(): Promise<{
    averagePrice: number;
    priceRange: { min: number; max: number };
    recommendations: string[];
  }> {
    const prices = await this.getEnergyPrices();
    
    if (prices.length === 0) {
      return {
        averagePrice: 0.15,
        priceRange: { min: 0.08, max: 0.25 },
        recommendations: ['No current price data available']
      };
    }

    const rates = prices.map(p => p.baseRate);
    const averagePrice = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const minPrice = Math.min(...rates);
    const maxPrice = Math.max(...rates);

    const recommendations: string[] = [];
    
    if (averagePrice > 0.20) {
      recommendations.push('Energy prices are high - consider energy-saving measures');
    }
    
    if (maxPrice - minPrice > 0.10) {
      recommendations.push('Significant price variation detected - consider time-of-use optimization');
    }

    return {
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      recommendations
    };
  }

  // Health check
  getScraperStatus(): {
    initialized: boolean;
    cacheSize: number;
    lastScraping: Date | null;
    activeScrapers: string[];
  } {
    return {
      initialized: this.isInitialized,
      cacheSize: this.cache.size,
      lastScraping: this.cache.get('energy_prices')?.timestamp || null,
      activeScrapers: ['energy', 'weather', 'crypto', 'stocks', 'devices', 'commodities']
    };
  }

  async destroy(): Promise<void> {
    if (this.scraperInterval) {
      clearInterval(this.scraperInterval);
      this.scraperInterval = null;
    }

    await Promise.all([
      energyPriceScraper.destroy(),
      deviceDiscoveryScraper.destroy(),
      marketDataScraper.destroy()
    ]);

    this.cache.clear();
    this.isInitialized = false;
    this.removeAllListeners();
    
    logger.info('🕷️ Scraper manager destroyed');
  }
}

export const scraperManager = new ScraperManager();

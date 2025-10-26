import * as puppeteer from 'puppeteer';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

export interface EnergyPriceData {
  provider: string;
  region: string;
  baseRate: number;
  peakRate?: number;
  offPeakRate?: number;
  currency: string;
  lastUpdated: Date;
  source: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  uvIndex: number;
  timestamp: Date;
}

/**
 * Web scraper to get real energy prices and weather data
 * Replaces need for paid APIs
 */
export class EnergyPriceScraper extends EventEmitter {
  private browser: puppeteer.Browser | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      });
      this.isInitialized = true;
      logger.info('🕷️ ULTRA-FAST Energy price scraper initialized');
    } catch (error) {
      logger.error('Failed to initialize scraper:', error);
      throw error;
    }
  }

  /**
   * Scrape energy prices from utility websites
   */
  async scrapeEnergyPrices(region: string = 'US'): Promise<EnergyPriceData[]> {
    if (!this.browser) await this.initialize();
    
    const prices: EnergyPriceData[] = [];
    const page = await this.browser!.newPage();

    try {
      // Scrape EIA (Energy Information Administration) data
      await page.goto('https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a', {
        waitUntil: 'networkidle2'
      });

      // Wait for data to load
      await page.waitForSelector('table', { timeout: 10000 });

      const eiaData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr'));
        const data: any[] = [];
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 3) {
            const region = cells[0]?.textContent?.trim();
            const rate = parseFloat(cells[1]?.textContent?.replace(/[^\d.]/g, '') || '0');
            if (region && rate > 0) {
              data.push({ region, rate });
            }
          }
        });
        
        return data;
      });

      // Process EIA data
      eiaData.forEach((item: any) => {
        prices.push({
          provider: 'US Average',
          region: item.region,
          baseRate: item.rate / 100, // Convert cents to dollars
          currency: 'USD',
          lastUpdated: new Date(),
          source: 'EIA'
        });
      });

      logger.info(`📊 Scraped ${prices.length} energy price records`);
      
    } catch (error) {
      logger.error('Failed to scrape energy prices:', error);
      
      // Fallback to default rates
      prices.push({
        provider: 'Default',
        region: 'US',
        baseRate: 0.15,
        peakRate: 0.22,
        offPeakRate: 0.08,
        currency: 'USD',
        lastUpdated: new Date(),
        source: 'Fallback'
      });
    } finally {
      await page.close();
    }

    return prices;
  }

  /**
   * Scrape weather data from free weather services
   */
  async scrapeWeatherData(location: string = 'New York'): Promise<WeatherData | null> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();

    try {
      // Use OpenWeatherMap's free tier or weather.gov
      await page.goto(`https://weather.gov/`, {
        waitUntil: 'networkidle2'
      });

      // Search for location
      await page.type('#inputstring', location);
      await page.click('#btnSearch');
      await page.waitForNavigation();

      const weatherData = await page.evaluate(() => {
        const tempElement = document.querySelector('.myforecast-current-lrg');
        const humidityElement = document.querySelector('[data-testid="humidity"]');
        const windElement = document.querySelector('[data-testid="wind"]');
        
        return {
          temperature: parseFloat(tempElement?.textContent?.replace(/[^\d.]/g, '') || '20'),
          humidity: parseFloat(humidityElement?.textContent?.replace(/[^\d.]/g, '') || '50'),
          windSpeed: parseFloat(windElement?.textContent?.replace(/[^\d.]/g, '') || '5'),
          cloudCover: 50, // Default
          uvIndex: 5 // Default
        };
      });

      const result: WeatherData = {
        ...weatherData,
        timestamp: new Date()
      };

      logger.info(`🌤️ Scraped weather data for ${location}`);
      return result;

    } catch (error) {
      logger.error('Failed to scrape weather data:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape utility company rates
   */
  async scrapeUtilityRates(utilityCompany: string, region: string): Promise<EnergyPriceData | null> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();

    try {
      // Common utility company websites
      const utilityUrls: Record<string, string> = {
        'con_edison': 'https://www.coned.com/en/accounts-billing/your-bill/time-of-use',
        'pge': 'https://www.pge.com/en_US/residential/rate-plans/rate-plan-options/time-of-use-base-plan/time-of-use-plan.page',
        'southern_company': 'https://www.southerncompany.com/customers/rates-and-pricing.html',
        'duke_energy': 'https://www.duke-energy.com/home/billing/rates'
      };

      const url = utilityUrls[utilityCompany.toLowerCase().replace(/\s+/g, '_')];
      if (!url) {
        logger.warn(`No URL mapping for utility: ${utilityCompany}`);
        return null;
      }

      await page.goto(url, { waitUntil: 'networkidle2' });

      const rateData = await page.evaluate(() => {
        // Look for rate information in common patterns
        const rateElements = document.querySelectorAll('*');
        let baseRate = 0;
        let peakRate = 0;
        let offPeakRate = 0;

        Array.from(rateElements).forEach(element => {
          const text = element.textContent?.toLowerCase() || '';
          const match = text.match(/(\d+\.?\d*)\s*¢?\s*\/?\s*kwh/);
          if (match) {
            const rate = parseFloat(match[1]);
            if (text.includes('peak') && rate > peakRate) {
              peakRate = rate;
            } else if (text.includes('off-peak') && rate > offPeakRate) {
              offPeakRate = rate;
            } else if (rate > baseRate) {
              baseRate = rate;
            }
          }
        });

        return { baseRate, peakRate, offPeakRate };
      });

      if (rateData.baseRate > 0) {
        const result: EnergyPriceData = {
          provider: utilityCompany,
          region,
          baseRate: rateData.baseRate / 100, // Convert cents to dollars
          peakRate: rateData.peakRate > 0 ? rateData.peakRate / 100 : undefined,
          offPeakRate: rateData.offPeakRate > 0 ? rateData.offPeakRate / 100 : undefined,
          currency: 'USD',
          lastUpdated: new Date(),
          source: 'Utility Website'
        };

        logger.info(`💰 Scraped rates for ${utilityCompany}: $${result.baseRate}/kWh`);
        return result;
      }

    } catch (error) {
      logger.error(`Failed to scrape utility rates for ${utilityCompany}:`, error);
    } finally {
      await page.close();
    }

    return null;
  }

  /**
   * Scrape solar/renewable energy data
   */
  async scrapeSolarData(location: string): Promise<{ solarIrradiance: number; optimalTilt: number } | null> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();

    try {
      // Use NREL PVWatts or similar free solar calculators
      await page.goto('https://pvwatts.nrel.gov/pvwatts.php', {
        waitUntil: 'networkidle2'
      });

      // Enter location
      await page.type('#address', location);
      await page.click('#search-button');
      await page.waitForTimeout(3000);

      const solarData = await page.evaluate(() => {
        // Extract solar irradiance and optimal tilt data
        const irradianceElement = document.querySelector('[data-field="solar_resource"]');
        const tiltElement = document.querySelector('[data-field="tilt"]');
        
        return {
          solarIrradiance: parseFloat(irradianceElement?.textContent?.replace(/[^\d.]/g, '') || '5'),
          optimalTilt: parseFloat(tiltElement?.textContent?.replace(/[^\d.]/g, '') || '30')
        };
      });

      logger.info(`☀️ Scraped solar data for ${location}`);
      return solarData;

    } catch (error) {
      logger.error('Failed to scrape solar data:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  async destroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info('🕷️ Energy price scraper destroyed');
    }
  }
}

export const energyPriceScraper = new EnergyPriceScraper();

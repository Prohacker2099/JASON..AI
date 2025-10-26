import * as puppeteer from 'puppeteer';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import axios from 'axios';

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: Date;
}

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: Date;
}

export interface CommodityPrice {
  commodity: string;
  price: number;
  unit: string;
  change: number;
  lastUpdated: Date;
}

/**
 * Scrapes financial market data without paid APIs
 */
export class MarketDataScraper extends EventEmitter {
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
      logger.info('🕷️ ULTRA-FAST Market data scraper initialized');
    } catch (error) {
      logger.error('Failed to initialize market scraper:', error);
      throw error;
    }
  }

  /**
   * Scrape cryptocurrency prices from CoinGecko
   */
  async scrapeCryptoPrices(symbols: string[] = ['bitcoin', 'ethereum', 'cardano']): Promise<CryptoPrice[]> {
    if (!this.browser) await this.initialize();
    
    const prices: CryptoPrice[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://www.coingecko.com/', {
        waitUntil: 'networkidle2'
      });

      for (const symbol of symbols) {
        try {
          await page.goto(`https://www.coingecko.com/en/coins/${symbol}`, {
            waitUntil: 'networkidle2'
          });

          const cryptoData = await page.evaluate(() => {
            const priceElement = document.querySelector('.no-wrap');
            const nameElement = document.querySelector('h1');
            const changeElement = document.querySelector('.text-green-500, .text-red-500');
            const marketCapElement = document.querySelector('[data-target="price.marketCap"]');
            const volumeElement = document.querySelector('[data-target="price.totalVolume"]');

            return {
              name: nameElement?.textContent?.trim() || '',
              price: parseFloat(priceElement?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              change24h: parseFloat(changeElement?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              marketCap: parseFloat(marketCapElement?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              volume24h: parseFloat(volumeElement?.textContent?.replace(/[^0-9.]/g, '') || '0')
            };
          });

          if (cryptoData.price > 0) {
            prices.push({
              symbol: symbol.toUpperCase(),
              name: cryptoData.name,
              price: cryptoData.price,
              change24h: cryptoData.change24h,
              marketCap: cryptoData.marketCap,
              volume24h: cryptoData.volume24h,
              lastUpdated: new Date()
            });
          }

          await page.waitForTimeout(1000); // Rate limiting
        } catch (error) {
          logger.error(`Failed to scrape ${symbol}:`, error);
        }
      }

      logger.info(`₿ Scraped ${prices.length} crypto prices`);

    } catch (error) {
      logger.error('Failed to scrape crypto prices:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  /**
   * Scrape stock prices from Yahoo Finance
   */
  async scrapeStockPrices(symbols: string[] = ['AAPL', 'GOOGL', 'TSLA']): Promise<StockPrice[]> {
    if (!this.browser) await this.initialize();
    
    const prices: StockPrice[] = [];
    const page = await this.browser!.newPage();

    try {
      for (const symbol of symbols) {
        try {
          await page.goto(`https://finance.yahoo.com/quote/${symbol}`, {
            waitUntil: 'networkidle2'
          });

          const stockData = await page.evaluate(() => {
            const priceElement = document.querySelector('[data-symbol] [data-field="regularMarketPrice"]');
            const nameElement = document.querySelector('h1');
            const changeElement = document.querySelector('[data-field="regularMarketChange"]');
            const changePercentElement = document.querySelector('[data-field="regularMarketChangePercent"]');
            const volumeElement = document.querySelector('[data-field="regularMarketVolume"]');

            return {
              name: nameElement?.textContent?.split('(')[0]?.trim() || '',
              price: parseFloat(priceElement?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              change: parseFloat(changeElement?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              changePercent: parseFloat(changePercentElement?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              volume: parseFloat(volumeElement?.textContent?.replace(/[^0-9.]/g, '') || '0')
            };
          });

          if (stockData.price > 0) {
            prices.push({
              symbol: symbol.toUpperCase(),
              name: stockData.name,
              price: stockData.price,
              change: stockData.change,
              changePercent: stockData.changePercent,
              volume: stockData.volume,
              lastUpdated: new Date()
            });
          }

          await page.waitForTimeout(1000); // Rate limiting
        } catch (error) {
          logger.error(`Failed to scrape ${symbol}:`, error);
        }
      }

      logger.info(`📊 Scraped ${prices.length} stock prices`);

    } catch (error) {
      logger.error('Failed to scrape stock prices:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  /**
   * Scrape commodity prices
   */
  async scrapeCommodityPrices(): Promise<CommodityPrice[]> {
    if (!this.browser) await this.initialize();
    
    const prices: CommodityPrice[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://www.investing.com/commodities/', {
        waitUntil: 'networkidle2'
      });

      const commodityData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr'));
        return rows.slice(1).map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 4) {
            return {
              name: cells[0]?.textContent?.trim() || '',
              price: parseFloat(cells[1]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              change: parseFloat(cells[2]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              unit: 'USD'
            };
          }
          return null;
        }).filter(Boolean);
      });

      commodityData.forEach((commodity: any) => {
        if (commodity && commodity.price > 0) {
          prices.push({
            commodity: commodity.name,
            price: commodity.price,
            unit: commodity.unit,
            change: commodity.change,
            lastUpdated: new Date()
          });
        }
      });

      logger.info(`🛢️ Scraped ${prices.length} commodity prices`);

    } catch (error) {
      logger.error('Failed to scrape commodity prices:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  /**
   * Scrape energy futures prices
   */
  async scrapeEnergyFutures(): Promise<CommodityPrice[]> {
    if (!this.browser) await this.initialize();
    
    const prices: CommodityPrice[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://www.cmegroup.com/markets/energy.html', {
        waitUntil: 'networkidle2'
      });

      const energyData = await page.evaluate(() => {
        const priceElements = Array.from(document.querySelectorAll('.price-data'));
        return priceElements.map(element => {
          const name = element.querySelector('.product-name')?.textContent?.trim() || '';
          const price = parseFloat(element.querySelector('.last-price')?.textContent?.replace(/[^0-9.]/g, '') || '0');
          const change = parseFloat(element.querySelector('.net-change')?.textContent?.replace(/[^0-9.-]/g, '') || '0');
          
          return { name, price, change };
        }).filter(item => item.price > 0);
      });

      energyData.forEach((item: any) => {
        prices.push({
          commodity: item.name,
          price: item.price,
          unit: 'USD',
          change: item.change,
          lastUpdated: new Date()
        });
      });

      logger.info(`⚡ Scraped ${prices.length} energy futures prices`);

    } catch (error) {
      logger.error('Failed to scrape energy futures:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  /**
   * Get currency exchange rates
   */
  async scrapeCurrencyRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    if (!this.browser) await this.initialize();
    
    const rates: Record<string, number> = {};
    const page = await this.browser!.newPage();

    try {
      await page.goto(`https://www.xe.com/currencyconverter/convert/?Amount=1&From=${baseCurrency}&To=EUR`, {
        waitUntil: 'networkidle2'
      });

      const currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
      
      for (const currency of currencies) {
        try {
          await page.goto(`https://www.xe.com/currencyconverter/convert/?Amount=1&From=${baseCurrency}&To=${currency}`, {
            waitUntil: 'networkidle2'
          });

          const rate = await page.evaluate(() => {
            const rateElement = document.querySelector('.result__BigRate-sc-1bsijpp-1');
            return parseFloat(rateElement?.textContent?.replace(/[^0-9.]/g, '') || '0');
          });

          if (rate > 0) {
            rates[currency] = rate;
          }

          await page.waitForTimeout(500);
        } catch (error) {
          logger.error(`Failed to get rate for ${currency}:`, error);
        }
      }

      logger.info(`💱 Scraped ${Object.keys(rates).length} currency rates`);

    } catch (error) {
      logger.error('Failed to scrape currency rates:', error);
    } finally {
      await page.close();
    }

    return rates;
  }

  async destroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info('📈 Market data scraper destroyed');
    }
  }
}

export const marketDataScraper = new MarketDataScraper();

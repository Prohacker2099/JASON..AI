import * as puppeteer from 'puppeteer';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import axios from 'axios';

export interface ScrapedDeviceInfo {
  manufacturer: string;
  model: string;
  deviceType: string;
  maxPower: number;
  protocol: string;
  firmwareUrl?: string;
  manualUrl?: string;
  specifications: Record<string, any>;
}

/**
 * Scrapes device information from manufacturer websites
 * Replaces need for device database APIs
 */
export class DeviceDiscoveryScraper extends EventEmitter {
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
      logger.info('🕷️ ULTRA-FAST Device discovery scraper initialized');
    } catch (error) {
      logger.error('Failed to initialize device scraper:', error);
      throw error;
    }
  }

  /**
   * Scrape Tasmota device database
   */
  async scrapeTasmotaDevices(): Promise<ScrapedDeviceInfo[]> {
    if (!this.browser) await this.initialize();
    
    const devices: ScrapedDeviceInfo[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://templates.blakadder.com/index.html', {
        waitUntil: 'networkidle2'
      });

      const deviceData = await page.evaluate(() => {
        const deviceCards = Array.from(document.querySelectorAll('.device-card, .card'));
        return deviceCards.map(card => {
          const name = card.querySelector('.device-name, .card-title')?.textContent?.trim() || '';
          const manufacturer = card.querySelector('.manufacturer')?.textContent?.trim() || 'Unknown';
          const type = card.querySelector('.device-type, .type')?.textContent?.trim() || 'smart_plug';
          const power = card.querySelector('.power, .max-power')?.textContent?.match(/(\d+)W/)?.[1] || '3680';
          
          return {
            name,
            manufacturer,
            type,
            power: parseInt(power)
          };
        }).filter(device => device.name);
      });

      deviceData.forEach(device => {
        devices.push({
          manufacturer: device.manufacturer,
          model: device.name,
          deviceType: this.mapDeviceType(device.type),
          maxPower: device.power,
          protocol: 'wifi',
          specifications: {
            firmware: 'Tasmota',
            connectivity: 'WiFi'
          }
        });
      });

      logger.info(`📱 Scraped ${devices.length} Tasmota devices`);

    } catch (error) {
      logger.error('Failed to scrape Tasmota devices:', error);
    } finally {
      await page.close();
    }

    return devices;
  }

  /**
   * Scrape Shelly device specifications
   */
  async scrapeShellyDevices(): Promise<ScrapedDeviceInfo[]> {
    if (!this.browser) await this.initialize();
    
    const devices: ScrapedDeviceInfo[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://shelly.cloud/products/', {
        waitUntil: 'networkidle2'
      });

      const deviceData = await page.evaluate(() => {
        const productCards = Array.from(document.querySelectorAll('.product-card, .device-item'));
        return productCards.map(card => {
          const name = card.querySelector('.product-name, h3, h4')?.textContent?.trim() || '';
          const specs = card.querySelector('.specs, .specifications')?.textContent || '';
          const powerMatch = specs.match(/(\d+)W/);
          const power = powerMatch ? parseInt(powerMatch[1]) : 3500;
          
          return {
            name,
            power,
            specs
          };
        }).filter(device => device.name);
      });

      deviceData.forEach(device => {
        devices.push({
          manufacturer: 'Shelly',
          model: device.name,
          deviceType: this.determineShellyType(device.name),
          maxPower: device.power,
          protocol: 'wifi',
          specifications: {
            firmware: 'Shelly',
            connectivity: 'WiFi',
            specs: device.specs
          }
        });
      });

      logger.info(`🐚 Scraped ${devices.length} Shelly devices`);

    } catch (error) {
      logger.error('Failed to scrape Shelly devices:', error);
    } finally {
      await page.close();
    }

    return devices;
  }

  /**
   * Scrape Zigbee device database
   */
  async scrapeZigbeeDevices(): Promise<ScrapedDeviceInfo[]> {
    if (!this.browser) await this.initialize();
    
    const devices: ScrapedDeviceInfo[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://zigbee.blakadder.com/index.html', {
        waitUntil: 'networkidle2'
      });

      const deviceData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr'));
        return rows.slice(1).map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 4) {
            return {
              manufacturer: cells[0]?.textContent?.trim() || '',
              model: cells[1]?.textContent?.trim() || '',
              type: cells[2]?.textContent?.trim() || '',
              supported: cells[3]?.textContent?.trim() || ''
            };
          }
          return null;
        }).filter(Boolean);
      });

      deviceData.forEach(device => {
        if (device && device.supported.toLowerCase().includes('yes')) {
          devices.push({
            manufacturer: device.manufacturer,
            model: device.model,
            deviceType: this.mapZigbeeType(device.type),
            maxPower: this.estimateZigbeePower(device.type),
            protocol: 'zigbee',
            specifications: {
              zigbeeSupported: true,
              deviceType: device.type
            }
          });
        }
      });

      logger.info(`⚡ Scraped ${devices.length} Zigbee devices`);

    } catch (error) {
      logger.error('Failed to scrape Zigbee devices:', error);
    } finally {
      await page.close();
    }

    return devices;
  }

  /**
   * Scrape TP-Link Kasa device information
   */
  async scrapeKasaDevices(): Promise<ScrapedDeviceInfo[]> {
    if (!this.browser) await this.initialize();
    
    const devices: ScrapedDeviceInfo[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto('https://www.tp-link.com/us/smart-home/', {
        waitUntil: 'networkidle2'
      });

      const deviceData = await page.evaluate(() => {
        const productCards = Array.from(document.querySelectorAll('.product-item, .device-card'));
        return productCards.map(card => {
          const name = card.querySelector('.product-name, h3')?.textContent?.trim() || '';
          const model = card.querySelector('.model-number')?.textContent?.trim() || name;
          const specs = card.querySelector('.specifications')?.textContent || '';
          
          return {
            name,
            model,
            specs
          };
        }).filter(device => device.name);
      });

      deviceData.forEach(device => {
        devices.push({
          manufacturer: 'TP-Link',
          model: device.model,
          deviceType: this.determineKasaType(device.name),
          maxPower: this.estimateKasaPower(device.model),
          protocol: 'wifi',
          specifications: {
            firmware: 'Kasa',
            connectivity: 'WiFi',
            specs: device.specs
          }
        });
      });

      logger.info(`🔌 Scraped ${devices.length} Kasa devices`);

    } catch (error) {
      logger.error('Failed to scrape Kasa devices:', error);
    } finally {
      await page.close();
    }

    return devices;
  }

  /**
   * Get device firmware updates
   */
  async scrapeFirmwareUpdates(manufacturer: string, model: string): Promise<{
    version: string;
    downloadUrl: string;
    releaseNotes: string;
  } | null> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();

    try {
      let searchUrl = '';
      
      switch (manufacturer.toLowerCase()) {
        case 'tasmota':
          searchUrl = 'https://github.com/arendst/Tasmota/releases/latest';
          break;
        case 'shelly':
          searchUrl = `https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Shelly/#shellygetdeviceinfo`;
          break;
        case 'tp-link':
          searchUrl = `https://www.tp-link.com/us/support/download/${model.toLowerCase()}/`;
          break;
        default:
          return null;
      }

      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      const firmwareInfo = await page.evaluate(() => {
        const versionElement = document.querySelector('.release-header h1, .version');
        const downloadElement = document.querySelector('a[href*=".bin"], a[href*=".zip"]');
        const notesElement = document.querySelector('.release-notes, .changelog');
        
        return {
          version: versionElement?.textContent?.trim() || '',
          downloadUrl: downloadElement?.getAttribute('href') || '',
          releaseNotes: notesElement?.textContent?.trim() || ''
        };
      });

      if (firmwareInfo.version) {
        logger.info(`🔄 Found firmware update for ${manufacturer} ${model}: ${firmwareInfo.version}`);
        return firmwareInfo;
      }

    } catch (error) {
      logger.error(`Failed to scrape firmware for ${manufacturer} ${model}:`, error);
    } finally {
      await page.close();
    }

    return null;
  }

  // Helper methods for device type mapping
  private mapDeviceType(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('plug') || t.includes('socket')) return 'smart_plug';
    if (t.includes('light') || t.includes('bulb') || t.includes('strip')) return 'lighting';
    if (t.includes('switch')) return 'smart_plug';
    if (t.includes('meter')) return 'smart_meter';
    if (t.includes('sensor')) return 'smart_plug';
    return 'smart_plug';
  }

  private determineShellyType(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('plug')) return 'smart_plug';
    if (n.includes('1pm') || n.includes('2.5')) return 'smart_plug';
    if (n.includes('dimmer') || n.includes('rgbw')) return 'lighting';
    if (n.includes('em')) return 'smart_meter';
    return 'smart_plug';
  }

  private mapZigbeeType(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('plug') || t.includes('outlet')) return 'smart_plug';
    if (t.includes('light') || t.includes('bulb')) return 'lighting';
    if (t.includes('switch')) return 'smart_plug';
    if (t.includes('sensor')) return 'smart_plug';
    return 'smart_plug';
  }

  private determineKasaType(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('plug')) return 'smart_plug';
    if (n.includes('switch')) return 'smart_plug';
    if (n.includes('bulb') || n.includes('light')) return 'lighting';
    return 'smart_plug';
  }

  private estimateZigbeePower(type: string): number {
    const t = type.toLowerCase();
    if (t.includes('plug')) return 3680;
    if (t.includes('light')) return 100;
    if (t.includes('sensor')) return 5;
    return 3680;
  }

  private estimateKasaPower(model: string): number {
    const m = model.toLowerCase();
    if (m.includes('hs110')) return 3680;
    if (m.includes('kp115')) return 1800;
    if (m.includes('kl') || m.includes('lb')) return 100;
    return 3680;
  }

  async destroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info('🔍 Device discovery scraper destroyed');
    }
  }
}

export const deviceDiscoveryScraper = new DeviceDiscoveryScraper();

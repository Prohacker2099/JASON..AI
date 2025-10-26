import express, { Request, Response } from 'express';
import { scraperManager } from '../services/scrapers/ScraperManager';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * API endpoints for web scraper data
 * Replaces paid API dependencies
 */

// Energy price endpoints
router.get('/energy/prices', async (req: Request, res: Response) => {
  try {
    const { region } = req.query;
    const prices = await scraperManager.getEnergyPrices(region as string);
    res.json({
      success: true,
      data: prices,
      source: 'web_scraping',
      cached: true
    });
  } catch (error) {
    logger.error('Failed to get energy prices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch energy prices' });
  }
});

router.get('/energy/insights', async (req: Request, res: Response) => {
  try {
    const insights = await scraperManager.getEnergyMarketInsights();
    res.json({
      success: true,
      data: insights,
      source: 'web_scraping'
    });
  } catch (error) {
    logger.error('Failed to get energy insights:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch energy insights' });
  }
});

router.get('/energy/utility/:company/:region', async (req: Request, res: Response) => {
  try {
    const { company, region } = req.params;
    const rates = await scraperManager.getUtilityRates(company, region);
    res.json({
      success: true,
      data: rates,
      source: 'utility_website_scraping'
    });
  } catch (error) {
    logger.error('Failed to get utility rates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch utility rates' });
  }
});

// Weather endpoint
router.get('/weather', async (req: Request, res: Response) => {
  try {
    const { location } = req.query;
    const weather = await scraperManager.getWeatherData(location as string);
    res.json({
      success: true,
      data: weather,
      source: 'weather_gov_scraping'
    });
  } catch (error) {
    logger.error('Failed to get weather data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
  }
});

// Market data endpoints
router.get('/market/crypto', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;
    const symbolArray = symbols ? (symbols as string).split(',') : undefined;
    const prices = await scraperManager.getCryptoPrices(symbolArray);
    res.json({
      success: true,
      data: prices,
      source: 'coingecko_scraping'
    });
  } catch (error) {
    logger.error('Failed to get crypto prices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crypto prices' });
  }
});

router.get('/market/stocks', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;
    const symbolArray = symbols ? (symbols as string).split(',') : undefined;
    const prices = await scraperManager.getStockPrices(symbolArray);
    res.json({
      success: true,
      data: prices,
      source: 'yahoo_finance_scraping'
    });
  } catch (error) {
    logger.error('Failed to get stock prices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock prices' });
  }
});

router.get('/market/commodities', async (req: Request, res: Response) => {
  try {
    const prices = await scraperManager.getCommodityPrices();
    res.json({
      success: true,
      data: prices,
      source: 'investing_com_scraping'
    });
  } catch (error) {
    logger.error('Failed to get commodity prices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch commodity prices' });
  }
});

router.get('/market/currency/:base', async (req: Request, res: Response) => {
  try {
    const { base } = req.params;
    const rates = await scraperManager.getCurrencyRates(base);
    res.json({
      success: true,
      data: rates,
      source: 'xe_com_scraping'
    });
  } catch (error) {
    logger.error('Failed to get currency rates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch currency rates' });
  }
});

// Device database endpoints
router.get('/devices/database', async (req: Request, res: Response) => {
  try {
    const devices = await scraperManager.getDeviceDatabase();
    res.json({
      success: true,
      data: devices,
      count: devices.length,
      source: 'manufacturer_website_scraping'
    });
  } catch (error) {
    logger.error('Failed to get device database:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch device database' });
  }
});

router.get('/devices/find/:manufacturer/:model', async (req: Request, res: Response) => {
  try {
    const { manufacturer, model } = req.params;
    const device = await scraperManager.findDeviceInfo(manufacturer, model);
    res.json({
      success: true,
      data: device,
      source: 'device_database_scraping'
    });
  } catch (error) {
    logger.error('Failed to find device info:', error);
    res.status(500).json({ success: false, error: 'Failed to find device info' });
  }
});

// Scraper status and health
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = scraperManager.getScraperStatus();
    res.json({
      success: true,
      data: status,
      message: 'All scrapers operational - NO PAID APIS REQUIRED'
    });
  } catch (error) {
    logger.error('Failed to get scraper status:', error);
    res.status(500).json({ success: false, error: 'Failed to get scraper status' });
  }
});

// Force refresh endpoints
router.post('/refresh/energy', async (req: Request, res: Response) => {
  try {
    const prices = await scraperManager.getEnergyPrices();
    res.json({
      success: true,
      message: 'Energy prices refreshed',
      count: prices.length
    });
  } catch (error) {
    logger.error('Failed to refresh energy prices:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh energy prices' });
  }
});

router.post('/refresh/market', async (req: Request, res: Response) => {
  try {
    const [crypto, stocks, commodities] = await Promise.all([
      scraperManager.getCryptoPrices(),
      scraperManager.getStockPrices(),
      scraperManager.getCommodityPrices()
    ]);
    
    res.json({
      success: true,
      message: 'Market data refreshed',
      data: {
        crypto: crypto.length,
        stocks: stocks.length,
        commodities: commodities.length
      }
    });
  } catch (error) {
    logger.error('Failed to refresh market data:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh market data' });
  }
});

export default router;

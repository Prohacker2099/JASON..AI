import express, { Request, Response } from 'express';
import { realEnergyMonitor } from '../services/energy/RealEnergyMonitor';
import { realDeviceController } from '../services/energy/RealDeviceController';
import { energyCostCalculator } from '../services/energy/EnergyCostCalculator';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all energy devices
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const devices = realEnergyMonitor.getDevices().map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      protocol: device.protocol,
      isOnline: device.isOnline,
      lastReading: device.lastReading,
      maxPower: device.maxPower,
      location: device.location,
      realTimeUsage: energyCostCalculator.getRealTimeUsage(device.id)
    }));

    res.json({ devices, total: devices.length });
  } catch (error) {
    logger.error('Failed to get energy devices:', error);
    res.status(500).json({ error: 'Failed to get energy devices' });
  }
});

// Get energy history for a device
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { deviceId, hours = 24 } = req.query;
    
    if (deviceId) {
      const history = await realEnergyMonitor.getDeviceHistory(deviceId, hours);
      res.json({ history });
    } else {
      // Get aggregated history for all devices
      const devices = realEnergyMonitor.getDevices();
      const allHistory = [];
      
      for (const device of devices) {
        const deviceHistory = await realEnergyMonitor.getDeviceHistory(
          device.id, 
          parseInt(hours as string)
        );
        allHistory.push(...deviceHistory);
      }
      
      // Sort by timestamp and aggregate by time periods
      const aggregated = allHistory
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .reduce((acc, reading) => {
          const timeKey = new Date(reading.timestamp).toISOString().slice(0, 16); // Minute precision
          const existing = acc.find(r => r.timestamp === timeKey);
          
          if (existing) {
            existing.powerWatts += reading.powerWatts;
            existing.energyKwh += reading.energyKwh;
            existing.cost = energyCostCalculator.calculateRealTimeCost('total', existing.powerWatts, existing.energyKwh).currentCost;
          } else {
            acc.push({
              timestamp: timeKey,
              powerWatts: reading.powerWatts,
              energyKwh: reading.energyKwh,
              cost: energyCostCalculator.calculateRealTimeCost('total', reading.powerWatts, reading.energyKwh).currentCost
            });
          }
          
          return acc;
        }, [] as any[]);
      
      res.json({ history: aggregated });
    }
  } catch (error) {
    logger.error('Failed to get energy history:', error);
    res.status(500).json({ error: 'Failed to get energy history' });
  }
});

// Control a device
router.post('/control/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { action, params } = req.body;
    const command = { action, params };
    const success = await realDeviceController.sendCommand(deviceId, action, params);
    
    if (success) {
      res.json({ success: true, message: `Device ${deviceId} controlled successfully` });
    } else {
      res.status(400).json({ success: false, error: 'Device control failed' });
    }
  } catch (error) {
    logger.error(`Failed to control device ${req.params.deviceId}:`, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Optimize energy usage
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const result = await realDeviceController.optimizeEnergy();
    res.json(result);
  } catch (error) {
    logger.error('Energy optimization failed:', error);
    res.status(500).json({ error: 'Energy optimization failed' });
  }
});

// Get total energy usage
router.get('/usage/total', async (req: Request, res: Response) => {
  try {
    const { hours = 24 } = req.query;
    const consumption = await realEnergyMonitor.getTotalConsumption();
    const totalCost = await energyCostCalculator.getTotalCostForPeriod(
      new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000),
      new Date()
    );
    
    res.json({ 
      totalUsageKwh: consumption,
      totalCost,
      period: `${hours} hours`
    });
  } catch (error) {
    logger.error('Failed to get total energy usage:', error);
    res.status(500).json({ error: 'Failed to get total energy usage' });
  }
});

// Generate energy bill
router.post('/bill/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.body;
    
    const bill = await energyCostCalculator.generateBill(
      deviceId,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(bill);
  } catch (error) {
    logger.error(`Failed to generate bill for device ${req.params.deviceId}:`, error);
    res.status(500).json({ error: 'Failed to generate energy bill' });
  }
});

// Get device cost ranking
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const ranking = await energyCostCalculator.getDeviceCostRanking(parseInt(days as string));
    res.json({ ranking });
  } catch (error) {
    logger.error('Failed to get device cost ranking:', error);
    res.status(500).json({ error: 'Failed to get device cost ranking' });
  }
});

// Get energy saving recommendations
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const recommendations = await energyCostCalculator.getEnergySavingRecommendations();
    res.json({ recommendations });
  } catch (error) {
    logger.error('Failed to get energy recommendations:', error);
    res.status(500).json({ error: 'Failed to get energy recommendations' });
  }
});

// Set energy rate
router.get('/bill', async (req: Request, res: Response) => {
  try {
    const rate = req.body;
    energyCostCalculator.setEnergyRate(rate);
    res.json({ success: true, message: 'Energy rate updated' });
  } catch (error) {
    logger.error('Failed to set energy rate:', error);
    res.status(500).json({ error: 'Failed to set energy rate' });
  }
});

// Real-time energy data stream
router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendData = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial data
  const devices = realEnergyMonitor.getDevices();
  sendData({ type: 'initial', devices });

  // Listen for real-time updates
  const onEnergyReading = (reading: any) => {
    const usage = energyCostCalculator.calculateRealTimeCost(
      reading.deviceId,
      reading.powerWatts,
      reading.energyKwh
    );
    sendData({ type: 'energy_reading', reading, usage });
  };

  const onDeviceDiscovered = (device: any) => {
    sendData({ type: 'device_discovered', device });
  };

  const onDeviceUpdated = (device: any) => {
    sendData({ type: 'device_updated', device });
  };

  realEnergyMonitor.on('energyReading', onEnergyReading);
  realEnergyMonitor.on('deviceDiscovered', onDeviceDiscovered);
  realDeviceController.on('deviceUpdated', onDeviceUpdated);

  // Clean up on client disconnect
  req.on('close', () => {
    realEnergyMonitor.off('energyReading', onEnergyReading);
    realEnergyMonitor.off('deviceDiscovered', onDeviceDiscovered);
    realDeviceController.off('deviceUpdated', onDeviceUpdated);
  });
});

// Start energy monitoring
router.post('/start', async (req: Request, res: Response) => {
  try {
    await realEnergyMonitor.startMonitoring();
    await realDeviceController.initialize();
    res.json({ success: true, message: 'Energy monitoring started' });
  } catch (error) {
    logger.error('Failed to start energy monitoring:', error);
    res.status(500).json({ error: 'Failed to start energy monitoring' });
  }
});

// Stop energy monitoring
router.post('/stop', async (req: Request, res: Response) => {
  try {
    await realEnergyMonitor.stopMonitoring();
    res.json({ success: true, message: 'Energy monitoring stopped' });
  } catch (error) {
    logger.error('Failed to stop energy monitoring:', error);
    res.status(500).json({ error: 'Failed to stop energy monitoring' });
  }
});

export default router;

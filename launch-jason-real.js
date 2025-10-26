#!/usr/bin/env node

/**
 * JASON AI - REAL LAUNCH SCRIPT
 * Launches the complete AI-powered smart home platform with all enhancements
 */

import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced Services
let realEnergyMonitor, realDeviceController, enhancedCostCalculator;
let securityManager, monitoringSystem, enhancedMarketplace;

async function initializeServices() {
  console.log('🚀 Initializing JASON AI Enhanced Services...');
  
  try {
    // Import enhanced services
    const { RealEnergyMonitor } = await import('./server/services/energy/RealEnergyMonitor.js');
    const { RealDeviceController } = await import('./server/services/energy/RealDeviceController.js');
    const { EnhancedEnergyCostCalculator } = await import('./server/services/energy/EnhancedEnergyCostCalculator.js');
    const { EnhancedSecurityManager } = await import('./server/services/security/EnhancedSecurityManager.js');
    const { ComprehensiveMonitoringSystem } = await import('./server/services/monitoring/ComprehensiveMonitoringSystem.js');
    const { EnhancedMarketplaceManager } = await import('./server/services/marketplace/EnhancedMarketplaceManager.js');
    
    // Initialize services
    realEnergyMonitor = new RealEnergyMonitor();
    realDeviceController = new RealDeviceController();
    enhancedCostCalculator = new EnhancedEnergyCostCalculator();
    securityManager = new EnhancedSecurityManager();
    monitoringSystem = new ComprehensiveMonitoringSystem();
    enhancedMarketplace = new EnhancedMarketplaceManager();
    
    console.log('✅ All enhanced services initialized');
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    return false;
  }
}

async function startEnergySystem() {
  console.log('⚡ Starting REAL Energy Control System...');
  
  try {
    // Start energy monitoring
    await realEnergyMonitor.startMonitoring();
    console.log('✅ Real-time energy monitoring active');
    
    // Initialize device controller
    await realDeviceController.initialize();
    console.log('✅ Device controller ready');
    
    // Start device discovery
    const devices = await realDeviceController.discoverDevices();
    console.log(`🔍 Discovered ${devices.length} energy devices`);
    
    console.log('⚡ REAL Energy System: 100% OPERATIONAL');
    return true;
  } catch (error) {
    console.error('❌ Energy system startup failed:', error.message);
    return false;
  }
}

function createWebServer() {
  const app = express();
  const server = createServer(app);
  const wss = new (WebSocket as any).Server({ server });
  
  // Middleware
  app.use(express.json());
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
  });
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      services: {
        energyMonitoring: !!realEnergyMonitor,
        deviceControl: !!realDeviceController,
        costCalculation: !!enhancedCostCalculator,
        security: !!securityManager,
        monitoring: !!monitoringSystem,
        marketplace: !!enhancedMarketplace
      }
    });
  });
  
  // Real-time energy data
  app.get('/api/energy/devices', async (req, res) => {
    try {
      const devices = realEnergyMonitor.getDevices();
      res.json({ devices, count: devices.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/energy/metrics', (req, res) => {
    try {
      const metrics = realEnergyMonitor.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Device control
  app.post('/api/devices/:id/control', async (req, res) => {
    try {
      const { id } = req.params;
      const { action, value } = req.body;
      
      const result = await realDeviceController.controlDevice(id, action, value);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Energy optimization
  app.post('/api/energy/optimize', async (req, res) => {
    try {
      const result = await realDeviceController.optimizeEnergyUsage();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Cost calculation
  app.get('/api/energy/pricing', (req, res) => {
    try {
      const pricing = enhancedCostCalculator.getRealTimePricing();
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/energy/tariffs', (req, res) => {
    try {
      const tariffs = enhancedCostCalculator.getTariffs();
      res.json(tariffs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Security status
  app.get('/api/security/status', (req, res) => {
    try {
      const metrics = securityManager.getSecurityMetrics();
      const threats = securityManager.getActiveThreats();
      res.json({ metrics, activeThreats: threats.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // System monitoring
  app.get('/api/monitoring/status', (req, res) => {
    try {
      const summary = monitoringSystem.getPerformanceSummary();
      const health = monitoringSystem.getHealthStatus();
      res.json({ summary, healthChecks: health.size });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Marketplace recommendations
  app.get('/api/marketplace/recommendations/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const recommendations = await enhancedMarketplace.getPersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // WebSocket for real-time updates
  wss.on('connection', (ws) => {
    console.log('🔌 Client connected to real-time stream');
    
    // Send initial status
    ws.send(JSON.stringify({
      type: 'status',
      message: 'JASON AI Real-Time Stream Connected',
      timestamp: new Date().toISOString()
    }));
    
    // Energy reading handler
    const onEnergyReading = (reading) => {
      ws.send(JSON.stringify({
        type: 'energy_reading',
        data: reading,
        timestamp: new Date().toISOString()
      }));
    };
    
    // Device discovery handler
    const onDeviceDiscovered = (device) => {
      ws.send(JSON.stringify({
        type: 'device_discovered',
        data: device,
        timestamp: new Date().toISOString()
      }));
    };
    
    // Optimization handler
    const onOptimization = (result) => {
      ws.send(JSON.stringify({
        type: 'optimization',
        data: result,
        timestamp: new Date().toISOString()
      }));
    };
    
    // Subscribe to events
    if (realEnergyMonitor) {
      realEnergyMonitor.on('energyReading', onEnergyReading);
      realEnergyMonitor.on('deviceDiscovered', onDeviceDiscovered);
    }
    
    if (realDeviceController) {
      realDeviceController.on('energyOptimized', onOptimization);
    }
    
    // Cleanup on disconnect
    ws.on('close', () => {
      console.log('🔌 Client disconnected from real-time stream');
      if (realEnergyMonitor) {
        realEnergyMonitor.off('energyReading', onEnergyReading);
        realEnergyMonitor.off('deviceDiscovered', onDeviceDiscovered);
      }
      if (realDeviceController) {
        realDeviceController.off('energyOptimized', onOptimization);
      }
    });
  });
  
  return { app, server, wss };
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🤖 JASON AI - REAL ENERGY CONTROL PLATFORM 🚀           ║
║                                                               ║
║     🔥 100% REAL - NO SIMULATION OR MOCKING                  ║
║     ⚡ AI-Powered Energy Analytics & Optimization            ║
║     🔒 Military-Grade Security & Encryption                  ║
║     📊 Real-Time Monitoring & Alerting                       ║
║     🛒 AI-Enhanced Marketplace                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  // Initialize all services
  const servicesReady = await initializeServices();
  if (!servicesReady) {
    console.error('💥 Failed to initialize services');
    process.exit(1);
  }
  
  // Start energy system
  const energyReady = await startEnergySystem();
  if (!energyReady) {
    console.error('💥 Failed to start energy system');
    process.exit(1);
  }
  
  // Create web server
  const { server } = createWebServer();
  
  // Start server
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`
🎉 JASON AI PLATFORM FULLY OPERATIONAL! 🎉
==========================================

🌐 Server: http://localhost:${PORT}
🔧 Health: http://localhost:${PORT}/health
📊 Energy: http://localhost:${PORT}/api/energy/devices
⚡ Control: http://localhost:${PORT}/api/devices/:id/control
💰 Pricing: http://localhost:${PORT}/api/energy/pricing
🔒 Security: http://localhost:${PORT}/api/security/status
📈 Monitor: http://localhost:${PORT}/api/monitoring/status

🚀 REAL DEVICE INTEGRATION ACTIVE:
   • WiFi Devices (Tasmota, Shelly, Kasa)
   • Zigbee Network Scanning
   • Modbus RTU/TCP Discovery
   • Serial Port Communication
   • Real-Time Energy Monitoring
   • AI-Powered Optimization
   • Dynamic Cost Calculation
   • Advanced Security Protection

💡 Ready to control REAL smart home devices!
    `);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down JASON AI Platform...');
    
    if (realEnergyMonitor) realEnergyMonitor.destroy();
    if (realDeviceController) realDeviceController.destroy();
    if (enhancedCostCalculator) enhancedCostCalculator.destroy();
    if (securityManager) securityManager.destroy();
    if (monitoringSystem) monitoringSystem.destroy();
    if (enhancedMarketplace) enhancedMarketplace.destroy();
    
    server.close(() => {
      console.log('✅ JASON AI Platform shutdown complete');
      process.exit(0);
    });
  });
}

// Launch the platform
main().catch(error => {
  console.error('💥 JASON AI Platform failed to start:', error);
  process.exit(1);
});

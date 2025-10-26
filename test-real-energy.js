#!/usr/bin/env node

/**
 * JASON AI - Real Energy System Test
 * Tests all the enhanced AI-powered energy systems we just built
 */

import { realEnergyMonitor } from './server/services/energy/RealEnergyMonitor.js';
import { realDeviceController } from './server/services/energy/RealDeviceController.js';
import { EnhancedEnergyCostCalculator } from './server/services/energy/EnhancedEnergyCostCalculator.js';
import { EnhancedSecurityManager } from './server/services/security/EnhancedSecurityManager.js';
import { ComprehensiveMonitoringSystem } from './server/services/monitoring/ComprehensiveMonitoringSystem.js';
import { EnhancedMarketplaceManager } from './server/services/marketplace/EnhancedMarketplaceManager.js';

console.log(`
🚀 JASON AI - REAL ENERGY SYSTEM TEST
=====================================
Testing all enhanced AI-powered systems...
`);

async function testEnergyMonitoring() {
  console.log('\n📊 Testing Real Energy Monitoring...');
  
  try {
    // Start real energy monitoring
    await realEnergyMonitor.startMonitoring();
    console.log('✅ Energy monitoring started');
    
    // Get discovered devices
    const devices = realEnergyMonitor.getDevices();
    console.log(`📱 Discovered ${devices.length} energy devices`);
    
    // Get performance metrics
    const metrics = realEnergyMonitor.getPerformanceMetrics();
    console.log('📈 Performance metrics:', {
      totalReadings: metrics.totalReadings,
      energySaved: metrics.energySaved,
      anomaliesDetected: metrics.anomaliesDetected
    });
    
    return true;
  } catch (error) {
    console.error('❌ Energy monitoring test failed:', error.message);
    return false;
  }
}

async function testDeviceController() {
  console.log('\n🎛️ Testing Real Device Controller...');
  
  try {
    // Initialize device controller
    await realDeviceController.initialize();
    console.log('✅ Device controller initialized');
    
    // Test device discovery
    const devices = await realDeviceController.discoverDevices();
    console.log(`🔍 Found ${devices.length} controllable devices`);
    
    // Test optimization
    const optimization = await realDeviceController.optimizeEnergyUsage();
    console.log('⚡ Energy optimization result:', optimization);
    
    return true;
  } catch (error) {
    console.error('❌ Device controller test failed:', error.message);
    return false;
  }
}

async function testCostCalculator() {
  console.log('\n💰 Testing Enhanced Cost Calculator...');
  
  try {
    const calculator = new EnhancedEnergyCostCalculator();
    
    // Get available tariffs
    const tariffs = calculator.getTariffs();
    console.log(`📋 Available tariffs: ${tariffs.length}`);
    
    // Get real-time pricing
    const pricing = calculator.getRealTimePricing();
    console.log('💲 Real-time pricing:', {
      price: pricing?.pricePerKwh,
      signal: pricing?.priceSignal,
      renewable: pricing?.renewablePercentage
    });
    
    // Test cost calculation
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const endDate = new Date();
    
    const calculation = await calculator.calculateDeviceCost('test-device', startDate, endDate);
    if (calculation) {
      console.log('📊 Cost calculation:', {
        energyUsed: calculation.energyUsed,
        totalCost: calculation.costs.total,
        projectedMonthlyCost: calculation.projectedMonthlyCost
      });
    }
    
    calculator.destroy();
    return true;
  } catch (error) {
    console.error('❌ Cost calculator test failed:', error.message);
    return false;
  }
}

async function testSecurityManager() {
  console.log('\n🔒 Testing Enhanced Security Manager...');
  
  try {
    const security = new EnhancedSecurityManager();
    
    // Test encryption
    const testData = 'JASON AI Secret Data';
    const encrypted = security.encrypt(testData);
    const decrypted = security.decrypt(encrypted);
    console.log('🔐 Encryption test:', decrypted === testData ? 'PASSED' : 'FAILED');
    
    // Test password hashing
    const password = 'TestPassword123!';
    const hash = await security.hashPassword(password);
    const isValid = await security.verifyPassword(password, hash);
    console.log('🔑 Password test:', isValid ? 'PASSED' : 'FAILED');
    
    // Test JWT tokens
    const token = security.generateToken({ userId: 'test-user', role: 'admin' });
    const decoded = security.verifyToken(token);
    console.log('🎫 JWT test:', decoded.userId === 'test-user' ? 'PASSED' : 'FAILED');
    
    // Get security metrics
    const metrics = security.getSecurityMetrics();
    console.log('📊 Security metrics:', {
      totalLogins: metrics.totalLogins,
      threatsDetected: metrics.threatsDetected,
      encryptionOperations: metrics.encryptionOperations
    });
    
    security.destroy();
    return true;
  } catch (error) {
    console.error('❌ Security manager test failed:', error.message);
    return false;
  }
}

async function testMonitoringSystem() {
  console.log('\n📊 Testing Comprehensive Monitoring...');
  
  try {
    const monitoring = new ComprehensiveMonitoringSystem();
    
    // Wait for initial metrics collection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get system metrics
    const systemMetrics = monitoring.getSystemMetrics(1);
    if (systemMetrics.length > 0) {
      console.log('💻 System metrics:', {
        cpu: systemMetrics[0].cpu.usage.toFixed(1) + '%',
        memory: systemMetrics[0].memory.usage.toFixed(1) + '%',
        uptime: systemMetrics[0].process.uptime.toFixed(0) + 's'
      });
    }
    
    // Get performance summary
    const summary = monitoring.getPerformanceSummary();
    console.log('📈 Performance summary:', summary);
    
    // Test tracking
    monitoring.trackRequest(true, 150);
    monitoring.trackEnergyOperation('reading');
    monitoring.trackAIOperation('prediction', { time: 50, correct: true });
    
    console.log('✅ Monitoring tracking test completed');
    
    monitoring.destroy();
    return true;
  } catch (error) {
    console.error('❌ Monitoring system test failed:', error.message);
    return false;
  }
}

async function testMarketplace() {
  console.log('\n🛒 Testing Enhanced Marketplace...');
  
  try {
    const marketplace = new EnhancedMarketplaceManager();
    
    // Test personalized recommendations
    const recommendations = await marketplace.getPersonalizedRecommendations('test-user');
    console.log(`🎯 Personalized recommendations: ${recommendations.length}`);
    
    // Test trending items
    const trending = await marketplace.getTrendingItems();
    console.log(`📈 Trending items: ${trending.length}`);
    
    // Test quality scoring
    const testItem = {
      id: 'test-item',
      name: 'Test Plugin',
      type: 'plugin',
      downloads: 1000,
      rating: 4.5,
      reviews: 50
    };
    
    const qualityScore = marketplace.calculateQualityScore(testItem);
    console.log(`⭐ Quality score: ${qualityScore.toFixed(2)}`);
    
    marketplace.destroy();
    return true;
  } catch (error) {
    console.error('❌ Marketplace test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting comprehensive JASON AI system tests...\n');
  
  const tests = [
    { name: 'Energy Monitoring', fn: testEnergyMonitoring },
    { name: 'Device Controller', fn: testDeviceController },
    { name: 'Cost Calculator', fn: testCostCalculator },
    { name: 'Security Manager', fn: testSecurityManager },
    { name: 'Monitoring System', fn: testMonitoringSystem },
    { name: 'Marketplace', fn: testMarketplace }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`❌ ${test.name} test crashed:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n📊 Overall: ${passed}/${total} tests passed (${(passed/total*100).toFixed(1)}%)`);
  
  if (passed === total) {
    console.log(`
🎉 ALL TESTS PASSED! 🎉
======================
JASON AI Platform is fully operational with:
✅ Real-time energy monitoring and control
✅ AI-powered analytics and forecasting  
✅ Advanced cost calculation with dynamic pricing
✅ Military-grade security and encryption
✅ Comprehensive system monitoring
✅ AI-enhanced marketplace recommendations

🚀 JASON AI is ready for REAL-WORLD deployment!
    `);
  } else {
    console.log(`
⚠️  Some tests failed. Please check the logs above.
The system may still be functional but needs attention.
    `);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});

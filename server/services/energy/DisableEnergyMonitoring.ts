/**
 * This module provides mock implementations of energy monitoring services
 * to prevent startup errors when hardware is not available.
 */
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

// Mock PowerGridIntegration
export class MockPowerGridIntegration extends EventEmitter {
  private isMonitoring = false;

  async startGridMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    logger.info('[MOCK] Power grid monitoring disabled (hardware not available)');
    this.isMonitoring = true;
    this.emit('gridMonitoringStarted');
  }

  async stopGridMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;
    logger.info('[MOCK] Power grid monitoring stopped');
    this.isMonitoring = false;
    this.emit('gridMonitoringStopped');
  }

  getGridConnections() {
    return [];
  }

  getGridConnection() {
    return undefined;
  }

  getCurrentGridStatus() {
    return {
      totalImported: 0,
      totalExported: 0,
      currentPower: 0,
      voltage: 230,
      frequency: 50,
      gridHealth: 'good' as const
    };
  }

  async getGridHistory() {
    return [];
  }
}

// Mock RealEnergyMonitor
export class MockRealEnergyMonitor extends EventEmitter {
  private isMonitoring = false;

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    logger.info('[MOCK] Energy monitoring disabled (hardware not available)');
    this.isMonitoring = true;
    this.emit('monitoringStarted');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;
    logger.info('[MOCK] Energy monitoring stopped');
    this.isMonitoring = false;
    this.emit('monitoringStopped');
  }

  getDevices() {
    return [];
  }

  getDevice() {
    return undefined;
  }

  async getDeviceHistory() {
    return [];
  }

  async getTotalConsumption() {
    return { current: 0, today: 0, thisMonth: 0 };
  }

  destroy() {
    this.stopMonitoring();
  }
}

// Export mock instances to replace the real ones
export const powerGridIntegration = new MockPowerGridIntegration();
export const realEnergyMonitor = new MockRealEnergyMonitor();

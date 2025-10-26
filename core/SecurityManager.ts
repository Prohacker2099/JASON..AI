// core/SecurityManager.ts

import { EventEmitter } from 'events';
import { SecurityGuardian } from './SecurityGuardian';
import { Device } from '../shared/types/Device.js';
import { deviceManager } from '../server/core/device/management/deviceManager.js'; // Corrected import path
import { logger } from '../server/utils/logger.js'; // Corrected import path

interface SecuritySetting {
  id: string;
  name: string;
  enabled: boolean;
  // Add more security-specific settings
}

export class SecurityManager extends EventEmitter {
  private securityGuardian: SecurityGuardian;
  private securitySettings: Map<string, SecuritySetting> = new Map();

  constructor() {
    super();
    this.securityGuardian = new SecurityGuardian();
    logger.info('SecurityManager initialized.');
    this.initializeListeners();
    this.initializeDefaultSettings();
  }

  private initializeListeners() {
    // Listen for security alerts from the SecurityGuardian
    this.securityGuardian.on('securityAlert', (alert) => {
      logger.warn('SecurityManager received security alert:', alert);
      this.handleSecurityAlert(alert);
    });

    // Listen for device state changes from the central device manager
    deviceManager.on('deviceStateChange', (device: Device) => {
      this.securityGuardian.recordDeviceActivity(device);
    });
  }

  private initializeDefaultSettings() {
    this.securitySettings.set('motionDetection', { id: 'motionDetection', name: 'Motion Detection', enabled: true });
    this.securitySettings.set('doorWindowMonitoring', { id: 'doorWindowMonitoring', name: 'Door/Window Monitoring', enabled: true });
    this.securitySettings.set('unusualPowerConsumption', { id: 'unusualPowerConsumption', name: 'Unusual Power Consumption Alert', enabled: true });
    this.securitySettings.set('geoFencingAlerts', { id: 'geoFencingAlerts', name: 'Geo-fencing Entry/Exit Alerts', enabled: true });
    logger.info('Default security settings initialized.');
  }

  /**
   * Enables or disables a specific security feature.
   * @param settingId The ID of the security setting.
   * @param enabled Whether to enable or disable the feature.
   */
  public updateSecuritySetting(settingId: string, enabled: boolean) {
    const setting = this.securitySettings.get(settingId);
    if (setting) {
      setting.enabled = enabled;
      this.securitySettings.set(settingId, setting);
      logger.info(`Security setting "${setting.name}" updated to ${enabled ? 'enabled' : 'disabled'}.`);
      this.emit('securitySettingUpdated', setting);
    } else {
      logger.warn(`Security setting "${settingId}" not found.`);
    }
  }

  /**
   * Retrieves the current state of all security settings.
   * @returns An array of security settings.
   */
  public getAllSecuritySettings(): SecuritySetting[] {
    return Array.from(this.securitySettings.values());
  }

  /**
   * Handles a security alert received from the SecurityGuardian.
   * This could involve escalating the alert, triggering automations, etc.
   * @param alert The security alert.
   */
  private handleSecurityAlert(alert: any) {
    logger.error(`SecurityManager handling alert: ${alert.type} - ${alert.details.reason}`);
    // Example: Send a push notification to the user
    // Example: Trigger an alarm or record video
    this.emit('escalatedSecurityAlert', alert);
  }

  /**
   * Manually triggers a security scan or check.
   */
  public async performSecurityScan(): Promise<void> {
    logger.info('Performing a manual security scan...');
    // This would involve requesting SecurityGuardian to re-evaluate all known device activities.
    // For now, just log the action.
    logger.info('Security scan completed. (Actual scan logic to be implemented)');
  }
}

export const securityManager = new SecurityManager();
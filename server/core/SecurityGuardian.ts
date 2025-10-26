import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { Device } from '../../shared/types/Device';

export interface SecurityEvent {
  type: string;
  deviceId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export class SecurityGuardian extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Evaluate device/activity metrics and emit security alerts if anomalies are detected.
   */
  public evaluateAnomaly(
    device: Device,
    userPresence?: { status: 'home' | 'away' },
    metrics?: { openCloseEvents?: number; averageActivity?: number; motionDetected?: boolean }
  ) {
    const openCloseEvents = metrics?.openCloseEvents ?? 0;
    const averageActivity = metrics?.averageActivity ?? 0;
    const motionDetected = metrics?.motionDetected ?? false;

    const away = userPresence?.status === 'away';

    if (away && (motionDetected || (averageActivity > 0 && openCloseEvents > averageActivity * 2))) {
      const anomaly: SecurityEvent = {
        type: motionDetected ? 'motionDetected' : 'doorWindowAnomaly',
        deviceId: device.id,
        timestamp: new Date(),
        details: {
          reason: motionDetected
            ? 'Motion detected while no one is home'
            : 'Door/Window activity unusually high while away',
          openCloseEvents,
          averageActivity,
        },
      };
      this.emit('securityAlert', anomaly);
      logger.warn(`SECURITY ALERT: ${anomaly.details?.reason} in ${device.name}`);
    }
  }
}

export const securityGuardian = new SecurityGuardian();
// server/core/device/DeviceDiscovery.ts

import { EventEmitter } from 'events';
import { Device, DeviceType } from '../../../shared/types/Device';

export class DeviceDiscovery extends EventEmitter {
  private discoveryTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  public startDiscovery() {
    // Simulated discovery: emit a couple of devices shortly after start
    if (this.discoveryTimer) return; // already running

    this.discoveryTimer = setTimeout(() => {
      const light: Device = {
        id: 'sim-light-1',
        name: 'Living Room Light',
        type: DeviceType.LIGHT,
        protocol: 'sim',
        capabilities: ['onOff', 'brightness', 'color'],
        state: { on: false, brightness: 0, color: { hue: 0, saturation: 0, value: 100 } },
        connected: true,
      };
      this.emit('deviceDiscovered', light);

      const thermostat: Device = {
        id: 'sim-thermostat-1',
        name: 'Hallway Thermostat',
        type: DeviceType.THERMOSTAT,
        protocol: 'sim',
        capabilities: ['temperatureControl', 'modeControl'],
        state: { temperature: 20, mode: 'auto' },
        connected: true,
      };
      this.emit('deviceDiscovered', thermostat);

      console.log('Simulated devices discovered.');
      this.discoveryTimer = null;
    }, 500);
  }

  public stopDiscovery() {
    if (this.discoveryTimer) {
      clearTimeout(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    console.log('Stopping device discovery.');
  }
}
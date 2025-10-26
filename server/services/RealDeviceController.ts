import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { realTimeEnergyMonitor } from './energy/RealTimeEnergyMonitor';
import axios from 'axios';
import net from 'net';
import dgram from 'dgram';

export interface RealDevice {
  id: string;
  name: string;
  type: 'smart_plug' | 'smart_light' | 'thermostat' | 'sensor' | 'camera' | 'hub';
  protocol: 'zigbee' | 'wifi' | 'bluetooth' | 'zwave' | 'matter';
  manufacturer: string;
  model: string;
  ipAddress?: string;
  macAddress?: string;
  isOnline: boolean;
  lastSeen: Date;
  capabilities: string[];
  state: Record<string, any>;
  energyUsage?: {
    powerWatts: number;
    energyKwh: number;
    voltage: number;
    current: number;
  };
}

export class RealDeviceController extends EventEmitter {
  private devices = new Map<string, RealDevice>();
  private controlQueue = new Map<string, Promise<any>>();

  constructor() {
    super();
    this.setupEnergyMonitoring();
  }

  private setupEnergyMonitoring() {
    realTimeEnergyMonitor.on('deviceDiscovered', (energyDevice) => {
      this.integrateEnergyDevice(energyDevice);
    });

    realTimeEnergyMonitor.on('energyReading', (reading) => {
      this.updateDeviceEnergyUsage(reading.deviceId, reading);
    });
  }

  private integrateEnergyDevice(energyDevice: any) {
    const device: RealDevice = {
      id: energyDevice.id,
      name: energyDevice.name,
      type: energyDevice.type === 'smart_plug' ? 'smart_plug' : 'smart_light',
      protocol: energyDevice.protocol === 'wifi' ? 'wifi' : 'zigbee',
      manufacturer: energyDevice.details?.manufacturer || 'Unknown',
      model: energyDevice.details?.model || 'Unknown',
      ipAddress: energyDevice.ipAddress,
      macAddress: energyDevice.macAddress,
      isOnline: energyDevice.isOnline,
      lastSeen: new Date(),
      capabilities: ['power', 'energy'],
      state: { power: true },
      energyUsage: energyDevice.lastReading ? {
        powerWatts: energyDevice.lastReading.powerWatts,
        energyKwh: energyDevice.lastReading.energyKwh,
        voltage: energyDevice.lastReading.voltageVolts,
        current: energyDevice.lastReading.currentAmps
      } : undefined
    };

    this.devices.set(device.id, device);
    this.emit('deviceIntegrated', device);
    logger.info(`🔌 Integrated energy device: ${device.name}`);
  }

  private updateDeviceEnergyUsage(deviceId: string, reading: any) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.energyUsage = {
        powerWatts: reading.powerWatts,
        energyKwh: reading.energyKwh,
        voltage: reading.voltageVolts,
        current: reading.currentAmps
      };
      device.lastSeen = new Date(reading.timestamp);
      this.emit('deviceUpdated', device);
    }
  }

  async startRealDeviceControl(): Promise<void> {
    logger.info('🚀 Starting REAL device control system...');
    
    // Start energy monitoring
    await realTimeEnergyMonitor.startMonitoring();
    
    // Discover and integrate all real devices
    await this.discoverAllRealDevices();
    
    this.emit('controlSystemStarted');
  }

  private async discoverAllRealDevices(): Promise<void> {
    logger.info('🔍 Discovering all real devices...');
    
    // Get energy devices
    const energyDevices = realTimeEnergyMonitor.getDevices();
    for (const energyDevice of energyDevices) {
      this.integrateEnergyDevice(energyDevice);
    }

    // Discover additional smart home devices
    await this.discoverSmartHomeDevices();
  }

  private async discoverSmartHomeDevices(): Promise<void> {
    const discoveryPromises = [
      this.discoverHomeAssistantDevices(),
      this.discoverZigbee2MQTTDevices(),
      this.discoverMatterDevices(),
      this.discoverLocalWiFiDevices()
    ];

    await Promise.allSettled(discoveryPromises);
  }

  private async discoverHomeAssistantDevices(): Promise<void> {
    try {
      const response = await axios.get('http://localhost:8123/api/states', {
        timeout: 5000,
        headers: { 'Authorization': 'Bearer YOUR_HA_TOKEN' }
      });

      if (response.data && Array.isArray(response.data)) {
        for (const entity of response.data) {
          if (this.isControllableDevice(entity)) {
            const device = this.mapHomeAssistantDevice(entity);
            this.devices.set(device.id, device);
            this.emit('deviceDiscovered', device);
            logger.info(`🏠 Found Home Assistant device: ${device.name}`);
          }
        }
      }
    } catch (error) {
      logger.info('❌ Home Assistant not available');
    }
  }

  private isControllableDevice(entity: any): boolean {
    const domain = entity.entity_id.split('.')[0];
    return ['light', 'switch', 'climate', 'cover', 'fan', 'media_player'].includes(domain);
  }

  private mapHomeAssistantDevice(entity: any): RealDevice {
    const domain = entity.entity_id.split('.')[0];
    const deviceType = this.mapHADomainToType(domain);

    return {
      id: `ha_${entity.entity_id}`,
      name: entity.attributes.friendly_name || entity.entity_id,
      type: deviceType,
      protocol: 'matter',
      manufacturer: entity.attributes.manufacturer || 'Unknown',
      model: entity.attributes.model || 'Unknown',
      isOnline: entity.state !== 'unavailable',
      lastSeen: new Date(entity.last_updated),
      capabilities: this.getHACapabilities(entity),
      state: this.mapHAState(entity),
      energyUsage: entity.attributes.current_power_w ? {
        powerWatts: entity.attributes.current_power_w,
        energyKwh: entity.attributes.energy_kwh || 0,
        voltage: 230,
        current: entity.attributes.current_power_w / 230
      } : undefined
    };
  }

  private mapHADomainToType(domain: string): RealDevice['type'] {
    const mapping: Record<string, RealDevice['type']> = {
      'light': 'smart_light',
      'switch': 'smart_plug',
      'climate': 'thermostat',
      'sensor': 'sensor',
      'camera': 'camera'
    };
    return mapping[domain] || 'smart_plug';
  }

  private getHACapabilities(entity: any): string[] {
    const capabilities = ['power'];
    const attributes = entity.attributes;

    if (attributes.brightness !== undefined) capabilities.push('brightness');
    if (attributes.color_temp !== undefined) capabilities.push('color_temperature');
    if (attributes.rgb_color !== undefined) capabilities.push('color');
    if (attributes.current_temperature !== undefined) capabilities.push('temperature');
    if (attributes.current_power_w !== undefined) capabilities.push('energy');

    return capabilities;
  }

  private mapHAState(entity: any): Record<string, any> {
    const state: Record<string, any> = {
      power: entity.state === 'on'
    };

    if (entity.attributes.brightness !== undefined) {
      state.brightness = Math.round((entity.attributes.brightness / 255) * 100);
    }

    if (entity.attributes.current_temperature !== undefined) {
      state.temperature = entity.attributes.current_temperature;
    }

    return state;
  }

  private async discoverZigbee2MQTTDevices(): Promise<void> {
    try {
      const response = await axios.get('http://localhost:8080/api/devices', {
        timeout: 5000
      });

      if (response.data && Array.isArray(response.data)) {
        for (const zigbeeDevice of response.data) {
          if (zigbeeDevice.type === 'Coordinator') continue;

          const device: RealDevice = {
            id: `zigbee_${zigbeeDevice.ieee_address}`,
            name: zigbeeDevice.friendly_name || 'Zigbee Device',
            type: this.mapZigbeeType(zigbeeDevice),
            protocol: 'zigbee',
            manufacturer: zigbeeDevice.definition?.vendor || 'Unknown',
            model: zigbeeDevice.definition?.model || 'Unknown',
            isOnline: zigbeeDevice.supported,
            lastSeen: new Date(zigbeeDevice.last_seen || Date.now()),
            capabilities: this.getZigbeeCapabilities(zigbeeDevice),
            state: zigbeeDevice.state || {}
          };

          this.devices.set(device.id, device);
          this.emit('deviceDiscovered', device);
          logger.info(`⚡ Found Zigbee device: ${device.name}`);
        }
      }
    } catch (error) {
      logger.info('❌ Zigbee2MQTT not available');
    }
  }

  private mapZigbeeType(zigbeeDevice: any): RealDevice['type'] {
    const description = zigbeeDevice.definition?.description?.toLowerCase() || '';
    
    if (description.includes('light') || description.includes('bulb')) return 'smart_light';
    if (description.includes('plug') || description.includes('outlet')) return 'smart_plug';
    if (description.includes('thermostat')) return 'thermostat';
    if (description.includes('sensor')) return 'sensor';
    if (description.includes('camera')) return 'camera';
    
    return 'smart_plug';
  }

  private getZigbeeCapabilities(zigbeeDevice: any): string[] {
    const capabilities = ['power'];
    
    if (zigbeeDevice.definition?.exposes) {
      for (const expose of zigbeeDevice.definition.exposes) {
        if (expose.property === 'brightness') capabilities.push('brightness');
        if (expose.property === 'color_temp') capabilities.push('color_temperature');
        if (expose.property === 'color') capabilities.push('color');
        if (expose.property === 'temperature') capabilities.push('temperature');
        if (expose.property === 'power') capabilities.push('energy');
      }
    }
    
    return [...new Set(capabilities)];
  }

  private async discoverMatterDevices(): Promise<void> {
    // Matter device discovery would require Matter.js or similar
    logger.info('🔗 Matter device discovery not yet implemented');
  }

  private async discoverLocalWiFiDevices(): Promise<void> {
    // Additional WiFi device discovery beyond energy monitoring
    logger.info('📡 Additional WiFi device discovery completed via energy monitor');
  }

  // REAL DEVICE CONTROL METHODS
  async controlDevice(deviceId: string, command: string, params?: any): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isOnline) {
      throw new Error(`Device ${deviceId} not found or offline`);
    }

    // Queue control commands to prevent conflicts
    const controlKey = `${deviceId}_${command}`;
    if (this.controlQueue.has(controlKey)) {
      await this.controlQueue.get(controlKey);
    }

    const controlPromise = this.executeDeviceControl(device, command, params);
    this.controlQueue.set(controlKey, controlPromise);

    try {
      const result = await controlPromise;
      this.controlQueue.delete(controlKey);
      
      // Update device state
      this.updateDeviceState(device, command, params);
      
      // Log energy impact
      if (device.energyUsage) {
        logger.info(`⚡ Device ${device.name} control: ${command}, Power: ${device.energyUsage.powerWatts}W`);
      }
      
      return result;
    } catch (error) {
      this.controlQueue.delete(controlKey);
      throw error;
    }
  }

  private async executeDeviceControl(device: RealDevice, command: string, params?: any): Promise<boolean> {
    switch (device.protocol) {
      case 'wifi':
        return await this.controlWiFiDevice(device, command, params);
      case 'zigbee':
        return await this.controlZigbeeDevice(device, command, params);
      case 'matter':
        return await this.controlMatterDevice(device, command, params);
      default:
        throw new Error(`Protocol ${device.protocol} not supported`);
    }
  }

  private async controlWiFiDevice(device: RealDevice, command: string, params?: any): Promise<boolean> {
    // Use energy monitor's control methods for WiFi devices
    return await realTimeEnergyMonitor.controlDevice(device.id, command, params);
  }

  private async controlZigbeeDevice(device: RealDevice, command: string, params?: any): Promise<boolean> {
    try {
      const zigbeeId = device.id.replace('zigbee_', '');
      let payload: any = {};

      switch (command) {
        case 'toggle':
        case 'power':
          payload = { state: params?.power ? 'ON' : 'OFF' };
          break;
        case 'brightness':
          payload = { brightness: params?.brightness || 50 };
          break;
        case 'color':
          payload = { color: params?.color || { r: 255, g: 255, b: 255 } };
          break;
        case 'temperature':
          payload = { color_temp: params?.temperature || 250 };
          break;
        default:
          payload = params || {};
      }

      const response = await axios.post(
        `http://localhost:8080/api/devices/${zigbeeId}/set`,
        payload,
        { timeout: 5000 }
      );

      return response.status === 200;
    } catch (error) {
      logger.error(`Failed to control Zigbee device ${device.id}:`, error);
      return false;
    }
  }

  private async controlMatterDevice(device: RealDevice, command: string, params?: any): Promise<boolean> {
    try {
      const entityId = device.id.replace('ha_', '');
      let service = '';
      let serviceData: any = {};

      switch (command) {
        case 'toggle':
        case 'power':
          service = params?.power ? 'turn_on' : 'turn_off';
          break;
        case 'brightness':
          service = 'turn_on';
          serviceData.brightness_pct = params?.brightness || 50;
          break;
        case 'temperature':
          service = 'set_temperature';
          serviceData.temperature = params?.temperature || 21;
          break;
      }

      const response = await axios.post(
        `http://localhost:8123/api/services/${entityId.split('.')[0]}/${service}`,
        {
          entity_id: entityId,
          ...serviceData
        },
        {
          timeout: 5000,
          headers: { 'Authorization': 'Bearer YOUR_HA_TOKEN' }
        }
      );

      return response.status === 200;
    } catch (error) {
      logger.error(`Failed to control Matter device ${device.id}:`, error);
      return false;
    }
  }

  private updateDeviceState(device: RealDevice, command: string, params?: any): void {
    switch (command) {
      case 'toggle':
        device.state.power = !device.state.power;
        break;
      case 'power':
        device.state.power = params?.power || false;
        break;
      case 'brightness':
        device.state.brightness = params?.brightness || 50;
        break;
      case 'temperature':
        device.state.temperature = params?.temperature || 21;
        break;
    }

    device.lastSeen = new Date();
    this.emit('deviceUpdated', device);
  }

  // PUBLIC API
  getAllDevices(): RealDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): RealDevice | undefined {
    return this.devices.get(deviceId);
  }

  getDevicesByType(type: RealDevice['type']): RealDevice[] {
    return this.getAllDevices().filter(device => device.type === type);
  }

  getOnlineDevices(): RealDevice[] {
    return this.getAllDevices().filter(device => device.isOnline);
  }

  async getTotalEnergyUsage(): Promise<number> {
    return await realTimeEnergyMonitor.getTotalEnergyUsage();
  }

  async getDeviceEnergyHistory(deviceId: string, hours: number = 24) {
    return await realTimeEnergyMonitor.getEnergyHistory(deviceId, hours);
  }

  // ENERGY OPTIMIZATION
  async optimizeEnergyUsage(): Promise<{ devicesSwitched: number; energySaved: number }> {
    const devices = this.getOnlineDevices();
    let devicesSwitched = 0;
    let energySaved = 0;

    for (const device of devices) {
      if (device.energyUsage && device.energyUsage.powerWatts > 0) {
        // Turn off devices with minimal usage during off-peak hours
        const now = new Date();
        const isOffPeak = now.getHours() >= 22 || now.getHours() <= 6;
        
        if (isOffPeak && device.energyUsage.powerWatts < 10 && device.type === 'smart_plug') {
          try {
            await this.controlDevice(device.id, 'power', { power: false });
            devicesSwitched++;
            energySaved += device.energyUsage.powerWatts;
            logger.info(`💡 Optimized: Turned off ${device.name} (${device.energyUsage.powerWatts}W)`);
          } catch (error) {
            logger.error(`Failed to optimize device ${device.id}:`, error);
          }
        }
      }
    }

    this.emit('energyOptimized', { devicesSwitched, energySaved });
    return { devicesSwitched, energySaved };
  }
}

export const realDeviceController = new RealDeviceController();

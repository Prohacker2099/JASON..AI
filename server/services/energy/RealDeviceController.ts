import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { realEnergyMonitor, RealEnergyDevice } from './RealEnergyMonitor';
import axios from 'axios';
import net from 'net';
import { SerialPort } from 'serialport';

/**
 * REAL Device Controller - NO SIMULATION OR MOCKING
 * Controls actual physical devices using real protocols
 */
export class RealDeviceController extends EventEmitter {
  private devices = new Map<string, RealEnergyDevice>();
  private isInitialized = false;
  private serialPorts = new Map<string, SerialPort>();

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    realEnergyMonitor.on('deviceDiscovered', (device: RealEnergyDevice) => {
      this.devices.set(device.id, device);
      this.emit('deviceUpdated', device);
      logger.info(`🔌 Real device controller registered: ${device.name}`);
    });

    realEnergyMonitor.on('energyReading', (reading) => {
      this.emit('energyReading', reading);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('🚀 Initializing REAL Device Controller - NO SIMULATION');
    
    await realEnergyMonitor.startMonitoring();
    
    const devices = realEnergyMonitor.getDevices();
    devices.forEach(device => {
      this.devices.set(device.id, device);
    });

    this.isInitialized = true;
    logger.info(`✅ Real device controller initialized with ${this.devices.size} REAL devices`);
  }

  listDevices(): RealEnergyDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): RealEnergyDevice | undefined {
    return this.devices.get(deviceId);
  }

  getDeviceState(deviceId: string): any {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    return {
      id: device.id,
      name: device.name,
      type: device.type,
      protocol: device.protocol,
      isOnline: device.isOnline,
      power: device.lastReading?.powerWatts || 0,
      voltage: device.lastReading?.voltageVolts || 0,
      current: device.lastReading?.currentAmps || 0,
      energy: device.lastReading?.energyKwh || 0,
      temperature: device.lastReading?.temperature,
      lastSeen: device.lastReading?.timestamp?.toISOString(),
      location: device.location,
      maxPower: device.maxPower,
      manufacturer: device.manufacturer,
      model: device.model,
      firmwareVersion: device.firmwareVersion,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress
    };
  }

  async sendCommand(deviceId: string, command: string, params: any = {}): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      logger.warn(`Device not found: ${deviceId}`);
      return false;
    }

    logger.info(`📡 Sending REAL command to ${device.name}: ${command}`, params);
    
    try {
      let success = false;
      
      switch (device.protocol) {
        case 'wifi':
          success = await this.sendWiFiCommand(device, command, params);
          break;
        case 'zigbee':
          success = await this.sendZigbeeCommand(device, command, params);
          break;
        case 'modbus':
          success = await this.sendModbusCommand(device, command, params);
          break;
        case 'serial':
          success = await this.sendSerialCommand(device, command, params);
          break;
        default:
          logger.warn(`Unsupported protocol: ${device.protocol}`);
          return false;
      }
      
      if (success) {
        this.emit('commandSent', { deviceId, command, params });
      }
      
      return success;
    } catch (error) {
      logger.error(`Command failed for ${device.name}:`, error);
      return false;
    }
  }

  private async sendWiFiCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    if (!device.ipAddress) return false;

    if (device.manufacturer === 'Tasmota') {
      return this.sendTasmotaCommand(device, command, params);
    } else if (device.manufacturer === 'Shelly') {
      return this.sendShellyCommand(device, command, params);
    } else if (device.manufacturer === 'TP-Link') {
      return this.sendKasaCommand(device, command, params);
    }

    return false;
  }

  private async sendTasmotaCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    try {
      let tasmotaCmd = '';
      
      switch (command) {
        case 'toggle':
          tasmotaCmd = 'Power%20TOGGLE';
          break;
        case 'setBrightness':
          if (params.brightness !== undefined) {
            tasmotaCmd = `Dimmer%20${params.brightness}`;
          }
          break;
        case 'setColor':
          if (params.color) {
            tasmotaCmd = `Color%20${params.color}`;
          }
          break;
        case 'on':
          tasmotaCmd = 'Power%20ON';
          break;
        case 'off':
          tasmotaCmd = 'Power%20OFF';
          break;
        default:
          return false;
      }

      const response = await axios.get(`http://${device.ipAddress}/cm?cmnd=${tasmotaCmd}`, {
        timeout: 5000
      });

      return response.status === 200;
    } catch (error) {
      logger.error(`Tasmota command failed:`, error);
      return false;
    }
  }

  private async sendShellyCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    try {
      let shellyUrl = '';
      
      switch (command) {
        case 'toggle':
          shellyUrl = `/relay/0?turn=toggle`;
          break;
        case 'on':
          shellyUrl = `/relay/0?turn=on`;
          break;
        case 'off':
          shellyUrl = `/relay/0?turn=off`;
          break;
        case 'setBrightness':
          if (params.brightness !== undefined) {
            shellyUrl = `/light/0?brightness=${params.brightness}`;
          }
          break;
        default:
          return false;
      }

      const response = await axios.get(`http://${device.ipAddress}${shellyUrl}`, {
        timeout: 5000
      });

      return response.status === 200;
    } catch (error) {
      logger.error(`Shelly command failed:`, error);
      return false;
    }
  }

  private async sendKasaCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let kasaCmd = '';
      
      switch (command) {
        case 'toggle':
        case 'on':
          kasaCmd = '{"system":{"set_relay_state":{"state":1}}}';
          break;
        case 'off':
          kasaCmd = '{"system":{"set_relay_state":{"state":0}}}';
          break;
        case 'setBrightness':
          if (params.brightness !== undefined) {
            kasaCmd = `{"smartlife.iot.dimmer":{"set_brightness":{"brightness":${params.brightness}}}}`;
          }
          break;
        default:
          resolve(false);
          return;
      }

      const encodedCmd = this.encodeKasaCommand(kasaCmd);
      
      socket.setTimeout(5000);
      socket.connect(9999, device.ipAddress!, () => {
        socket.write(encodedCmd);
      });

      socket.on('data', (data) => {
        try {
          const decoded = this.decodeKasaResponse(data);
          const response = JSON.parse(decoded);
          resolve(response.system?.set_relay_state?.err_code === 0 || 
                  response['smartlife.iot.dimmer']?.set_brightness?.err_code === 0);
        } catch (error) {
          resolve(false);
        }
        socket.destroy();
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  private async sendZigbeeCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    // Send command via Zigbee2MQTT
    try {
      let zigbeeCmd: any = {};
      
      switch (command) {
        case 'toggle':
          zigbeeCmd = { state: 'TOGGLE' };
          break;
        case 'on':
          zigbeeCmd = { state: 'ON' };
          break;
        case 'off':
          zigbeeCmd = { state: 'OFF' };
          break;
        case 'setBrightness':
          if (params.brightness !== undefined) {
            zigbeeCmd = { brightness: Math.round((params.brightness / 100) * 254) };
          }
          break;
        default:
          return false;
      }

      const response = await axios.post(
        `http://localhost:8080/api/${device.zigbeeId}/set`,
        zigbeeCmd,
        { timeout: 5000 }
      );

      return response.status === 200;
    } catch (error) {
      logger.error(`Zigbee command failed:`, error);
      return false;
    }
  }

  private async sendModbusCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    // Implement Modbus command sending
    logger.warn('Modbus commands not yet implemented');
    return false;
  }

  private async sendSerialCommand(device: RealEnergyDevice, command: string, params: any): Promise<boolean> {
    // Implement serial command sending
    logger.warn('Serial commands not yet implemented');
    return false;
  }

  async toggleDevice(deviceId: string): Promise<boolean> {
    return this.sendCommand(deviceId, 'toggle');
  }

  async setBrightness(deviceId: string, brightness: number): Promise<boolean> {
    return this.sendCommand(deviceId, 'setBrightness', { brightness });
  }

  async setHvacSetpoint(deviceId: string, setpoint: number): Promise<boolean> {
    return this.sendCommand(deviceId, 'setSetpoint', { setpoint });
  }

  async optimizeEnergy(): Promise<{ actions: number; devices: string[] }> {
    logger.info('⚡ Running REAL energy optimization on physical devices');
    
    let actions = 0;
    const optimizedDevices: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    const isQuietHours = hour >= 22 || hour <= 6;
    const isPeakHours = (hour >= 17 && hour <= 21);

    for (const device of this.devices.values()) {
      if (!device.isOnline || !device.lastReading) continue;

      const currentPower = device.lastReading.powerWatts;
      let optimized = false;

      // Lighting optimization
      if (device.type === 'lighting' && currentPower > 0) {
        if (isQuietHours && currentPower > 20) {
          await this.setBrightness(device.id, 30);
          optimized = true;
        } else if (isPeakHours && currentPower > 50) {
          await this.setBrightness(device.id, 70);
          optimized = true;
        }
      }

      // Smart plug optimization
      if (device.type === 'smart_plug') {
        if (currentPower < 5 && currentPower > 0) {
          // Turn off devices with standby power
          await this.sendCommand(device.id, 'off');
          optimized = true;
        }
      }

      // HVAC optimization
      if (device.type === 'hvac' && currentPower > 500) {
        if (isQuietHours) {
          await this.setHvacSetpoint(device.id, 21);
          optimized = true;
        } else if (isPeakHours) {
          await this.setHvacSetpoint(device.id, 22);
          optimized = true;
        }
      }

      if (optimized) {
        actions++;
        optimizedDevices.push(device.id);
        logger.info(`🎯 Optimized REAL device: ${device.name}`);
      }
    }

    const result = { actions, devices: optimizedDevices };
    this.emit('energyOptimized', result);
    
    logger.info(`✅ REAL energy optimization complete: ${actions} physical devices controlled`);
    return result;
  }

  async getEnergyStats(): Promise<any> {
    const consumption = await realEnergyMonitor.getTotalConsumption();
    const devices = this.listDevices();
    
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const totalDevices = devices.length;
    
    const devicesByType = devices.reduce((acc, device) => {
      acc[device.type] = (acc[device.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const devicesByProtocol = devices.reduce((acc, device) => {
      acc[device.protocol] = (acc[device.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      consumption,
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: totalDevices - onlineDevices,
        byType: devicesByType,
        byProtocol: devicesByProtocol
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async getDeviceHistory(deviceId: string, hours: number = 24): Promise<any[]> {
    return realEnergyMonitor.getDeviceHistory(deviceId, hours);
  }

  // Kasa protocol helpers
  private encodeKasaCommand(cmd: string): Buffer {
    const buf = Buffer.alloc(cmd.length + 4);
    buf.writeUInt32BE(cmd.length, 0);
    let key = 171;
    for (let i = 0; i < cmd.length; i++) {
      const byte = cmd.charCodeAt(i) ^ key;
      key = byte;
      buf[i + 4] = byte;
    }
    return buf;
  }

  private decodeKasaResponse(data: Buffer): string {
    let key = 171;
    let result = '';
    for (let i = 4; i < data.length; i++) {
      const byte = data[i] ^ key;
      key = data[i];
      result += String.fromCharCode(byte);
    }
    return result;
  }

  destroy(): void {
    realEnergyMonitor.destroy();
    
    // Close serial ports
    for (const [port, serial] of this.serialPorts) {
      if (serial.isOpen) {
        serial.close();
      }
    }
    this.serialPorts.clear();
    
    this.removeAllListeners();
  }
}

export const realDeviceController = new RealDeviceController();

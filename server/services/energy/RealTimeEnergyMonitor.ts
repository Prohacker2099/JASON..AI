import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';
import dgram from 'dgram';
import net from 'net';
import axios from 'axios';

export interface EnergyReading {
  deviceId: string;
  timestamp: Date;
  powerWatts: number;
  voltageVolts: number;
  currentAmps: number;
  energyKwh: number;
  frequency: number;
  powerFactor: number;
  temperature?: number;
}

export interface EnergyDevice {
  id: string;
  name: string;
  type: 'smart_plug' | 'smart_meter' | 'solar_panel' | 'battery' | 'hvac' | 'lighting';
  protocol: 'zigbee' | 'zwave' | 'wifi' | 'modbus' | 'matter';
  ipAddress?: string;
  macAddress?: string;
  zigbeeId?: string;
  zwaveNodeId?: number;
  isOnline: boolean;
  lastReading?: EnergyReading;
  maxPower: number;
  location: string;
}

export class RealTimeEnergyMonitor extends EventEmitter {
  private devices = new Map<string, EnergyDevice>();
  private pollingInterval: NodeJS.Timeout | null = null;
  private udpSocket: dgram.Socket;
  private isMonitoring = false;

  constructor() {
    super();
    this.udpSocket = dgram.createSocket('udp4');
    this.setupUdpListener();
  }

  private setupUdpListener() {
    this.udpSocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'energy_reading') {
          this.processEnergyReading(data, rinfo.address);
        }
      } catch (error) {
        // Ignore malformed UDP messages
      }
    });

    this.udpSocket.bind(8266, () => {
      logger.info('🔌 Energy Monitor UDP listener started on port 8266');
    });
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    logger.info('⚡ Starting real-time energy monitoring...');

    // Discover energy devices on network
    await this.discoverEnergyDevices();

    // Start polling devices every 5 seconds
    this.pollingInterval = setInterval(() => {
      this.pollAllDevices().catch(error => 
        logger.error('Energy polling error:', error)
      );
    }, 5000);

    this.emit('monitoringStarted');
  }

  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.udpSocket.close();
    logger.info('⚡ Energy monitoring stopped');
    this.emit('monitoringStopped');
  }

  private async discoverEnergyDevices(): Promise<void> {
    logger.info('🔍 Discovering real energy devices...');

    // Scan for Tasmota devices (common ESP8266/ESP32 energy monitors)
    await this.discoverTasmotaDevices();
    
    // Scan for Shelly devices
    await this.discoverShellyDevices();
    
    // Scan for TP-Link Kasa smart plugs
    await this.discoverKasaDevices();
    
    // Scan for Zigbee devices via coordinator
    await this.discoverZigbeeDevices();

    logger.info(`✅ Discovered ${this.devices.size} energy devices`);
  }

  private async discoverTasmotaDevices(): Promise<void> {
    // Scan local network for Tasmota devices
    const networkBase = '192.168.1'; // Adjust based on your network
    const promises: Promise<void>[] = [];

    for (let i = 1; i < 255; i++) {
      const ip = `${networkBase}.${i}`;
      promises.push(this.checkTasmotaDevice(ip));
    }

    await Promise.allSettled(promises);
  }

  private async checkTasmotaDevice(ip: string): Promise<void> {
    try {
      const response = await axios.get(`http://${ip}/cm?cmnd=Status%200`, {
        timeout: 2000
      });

      if (response.data && response.data.Status) {
        const device: EnergyDevice = {
          id: `tasmota_${ip.replace(/\./g, '_')}`,
          name: response.data.Status.DeviceName || `Tasmota Device ${ip}`,
          type: 'smart_plug',
          protocol: 'wifi',
          ipAddress: ip,
          isOnline: true,
          maxPower: 3680, // Standard 16A plug
          location: 'Unknown'
        };

        this.devices.set(device.id, device);
        logger.info(`📱 Found Tasmota device: ${device.name} at ${ip}`);
        this.emit('deviceDiscovered', device);
      }
    } catch (error) {
      // Device not found or not Tasmota
    }
  }

  private async discoverShellyDevices(): Promise<void> {
    // Shelly devices respond to mDNS queries
    const networkBase = '192.168.1';
    const promises: Promise<void>[] = [];

    for (let i = 1; i < 255; i++) {
      const ip = `${networkBase}.${i}`;
      promises.push(this.checkShellyDevice(ip));
    }

    await Promise.allSettled(promises);
  }

  private async checkShellyDevice(ip: string): Promise<void> {
    try {
      const response = await axios.get(`http://${ip}/shelly`, {
        timeout: 2000
      });

      if (response.data && response.data.type) {
        const device: EnergyDevice = {
          id: `shelly_${response.data.mac.replace(/:/g, '_')}`,
          name: `Shelly ${response.data.type}`,
          type: 'smart_plug',
          protocol: 'wifi',
          ipAddress: ip,
          macAddress: response.data.mac,
          isOnline: true,
          maxPower: 3680,
          location: 'Unknown'
        };

        this.devices.set(device.id, device);
        logger.info(`🐚 Found Shelly device: ${device.name} at ${ip}`);
        this.emit('deviceDiscovered', device);
      }
    } catch (error) {
      // Device not found or not Shelly
    }
  }

  private async discoverKasaDevices(): Promise<void> {
    // TP-Link Kasa devices use port 9999
    const networkBase = '192.168.1';
    const promises: Promise<void>[] = [];

    for (let i = 1; i < 255; i++) {
      const ip = `${networkBase}.${i}`;
      promises.push(this.checkKasaDevice(ip));
    }

    await Promise.allSettled(promises);
  }

  private async checkKasaDevice(ip: string): Promise<void> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const kasaQuery = Buffer.from('{"system":{"get_sysinfo":{}}}');
      
      socket.setTimeout(2000);
      socket.connect(9999, ip, () => {
        socket.write(kasaQuery);
      });

      socket.on('data', (data) => {
        try {
          // Kasa uses XOR encryption, decode it
          const decoded = this.decodeKasaResponse(data);
          const response = JSON.parse(decoded);
          
          if (response.system && response.system.get_sysinfo) {
            const info = response.system.get_sysinfo;
            const device: EnergyDevice = {
              id: `kasa_${info.deviceId}`,
              name: info.alias || `Kasa Device ${ip}`,
              type: 'smart_plug',
              protocol: 'wifi',
              ipAddress: ip,
              macAddress: info.mac,
              isOnline: true,
              maxPower: 3680,
              location: 'Unknown'
            };

            this.devices.set(device.id, device);
            logger.info(`🔌 Found Kasa device: ${device.name} at ${ip}`);
            this.emit('deviceDiscovered', device);
          }
        } catch (error) {
          // Invalid response
        }
        socket.destroy();
        resolve();
      });

      socket.on('error', () => {
        socket.destroy();
        resolve();
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve();
      });
    });
  }

  private decodeKasaResponse(data: Buffer): string {
    // TP-Link Kasa XOR decoding
    let key = 171;
    let result = '';
    for (let i = 4; i < data.length; i++) {
      const byte = data[i] ^ key;
      key = data[i];
      result += String.fromCharCode(byte);
    }
    return result;
  }

  private async discoverZigbeeDevices(): Promise<void> {
    // This would connect to a Zigbee coordinator like Zigbee2MQTT
    try {
      const response = await axios.get('http://localhost:8080/api/devices', {
        timeout: 5000
      });

      if (response.data && Array.isArray(response.data)) {
        for (const zigbeeDevice of response.data) {
          if (zigbeeDevice.definition && zigbeeDevice.definition.exposes) {
            const hasEnergyMeasurement = zigbeeDevice.definition.exposes.some(
              (expose: any) => expose.property === 'power' || expose.property === 'energy'
            );

            if (hasEnergyMeasurement) {
              const device: EnergyDevice = {
                id: `zigbee_${zigbeeDevice.ieee_address}`,
                name: zigbeeDevice.friendly_name || zigbeeDevice.definition.model,
                type: 'smart_plug',
                protocol: 'zigbee',
                zigbeeId: zigbeeDevice.ieee_address,
                isOnline: zigbeeDevice.supported,
                maxPower: 3680,
                location: 'Unknown'
              };

              this.devices.set(device.id, device);
              logger.info(`⚡ Found Zigbee energy device: ${device.name}`);
              this.emit('deviceDiscovered', device);
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Zigbee coordinator not available');
    }
  }

  private async pollAllDevices(): Promise<void> {
    const pollPromises = Array.from(this.devices.values()).map(device => 
      this.pollDevice(device).catch(error => 
        logger.error(`Failed to poll device ${device.id}:`, error)
      )
    );

    await Promise.allSettled(pollPromises);
  }

  private async pollDevice(device: EnergyDevice): Promise<void> {
    try {
      let reading: EnergyReading | null = null;

      switch (device.protocol) {
        case 'wifi':
          if (device.id.startsWith('tasmota_')) {
            reading = await this.pollTasmotaDevice(device);
          } else if (device.id.startsWith('shelly_')) {
            reading = await this.pollShellyDevice(device);
          } else if (device.id.startsWith('kasa_')) {
            reading = await this.pollKasaDevice(device);
          }
          break;
        case 'zigbee':
          reading = await this.pollZigbeeDevice(device);
          break;
      }

      if (reading) {
        device.lastReading = reading;
        device.isOnline = true;
        
        // Store reading in database
        await this.storeEnergyReading(reading);
        
        // Emit real-time update
        this.emit('energyReading', reading);
        
        // Check for anomalies
        this.checkEnergyAnomalies(device, reading);
      }
    } catch (error) {
      device.isOnline = false;
      logger.error(`Failed to poll device ${device.id}:`, error);
    }
  }

  private async pollTasmotaDevice(device: EnergyDevice): Promise<EnergyReading | null> {
    const response = await axios.get(`http://${device.ipAddress}/cm?cmnd=Status%208`, {
      timeout: 5000
    });

    if (response.data && response.data.StatusSNS && response.data.StatusSNS.ENERGY) {
      const energy = response.data.StatusSNS.ENERGY;
      return {
        deviceId: device.id,
        timestamp: new Date(),
        powerWatts: parseFloat(energy.Power) || 0,
        voltageVolts: parseFloat(energy.Voltage) || 0,
        currentAmps: parseFloat(energy.Current) || 0,
        energyKwh: parseFloat(energy.Total) || 0,
        frequency: parseFloat(energy.Frequency) || 50,
        powerFactor: parseFloat(energy.Factor) || 1.0
      };
    }

    return null;
  }

  private async pollShellyDevice(device: EnergyDevice): Promise<EnergyReading | null> {
    const response = await axios.get(`http://${device.ipAddress}/meter/0`, {
      timeout: 5000
    });

    if (response.data) {
      return {
        deviceId: device.id,
        timestamp: new Date(),
        powerWatts: response.data.power || 0,
        voltageVolts: response.data.voltage || 0,
        currentAmps: (response.data.power || 0) / (response.data.voltage || 230),
        energyKwh: (response.data.total || 0) / 60000, // Wh to kWh
        frequency: 50,
        powerFactor: 1.0
      };
    }

    return null;
  }

  private async pollKasaDevice(device: EnergyDevice): Promise<EnergyReading | null> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const kasaQuery = Buffer.from('{"emeter":{"get_realtime":{}}}');
      
      socket.setTimeout(5000);
      socket.connect(9999, device.ipAddress!, () => {
        socket.write(kasaQuery);
      });

      socket.on('data', (data) => {
        try {
          const decoded = this.decodeKasaResponse(data);
          const response = JSON.parse(decoded);
          
          if (response.emeter && response.emeter.get_realtime) {
            const realtime = response.emeter.get_realtime;
            const reading: EnergyReading = {
              deviceId: device.id,
              timestamp: new Date(),
              powerWatts: realtime.power_mw / 1000 || 0,
              voltageVolts: realtime.voltage_mv / 1000 || 0,
              currentAmps: realtime.current_ma / 1000 || 0,
              energyKwh: realtime.total_wh / 1000 || 0,
              frequency: 50,
              powerFactor: 1.0
            };
            resolve(reading);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
        socket.destroy();
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(null);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(null);
      });
    });
  }

  private async pollZigbeeDevice(device: EnergyDevice): Promise<EnergyReading | null> {
    try {
      const response = await axios.get(`http://localhost:8080/api/devices/${device.zigbeeId}`, {
        timeout: 5000
      });

      if (response.data && response.data.state) {
        const state = response.data.state;
        return {
          deviceId: device.id,
          timestamp: new Date(),
          powerWatts: state.power || 0,
          voltageVolts: state.voltage || 230,
          currentAmps: state.current || 0,
          energyKwh: state.energy || 0,
          frequency: 50,
          powerFactor: 1.0
        };
      }
    } catch (error) {
      // Zigbee coordinator not available
    }

    return null;
  }

  private async storeEnergyReading(reading: EnergyReading): Promise<void> {
    try {
      await prisma.energyReading.create({
        data: {
          deviceId: reading.deviceId,
          timestamp: reading.timestamp,
          powerWatts: reading.powerWatts,
          voltageVolts: reading.voltageVolts,
          currentAmps: reading.currentAmps,
          energyKwh: reading.energyKwh,
          frequency: reading.frequency,
          powerFactor: reading.powerFactor,
          temperature: reading.temperature
        }
      });
    } catch (error) {
      logger.error('Failed to store energy reading:', error);
    }
  }

  private checkEnergyAnomalies(device: EnergyDevice, reading: EnergyReading): void {
    // Check for power spikes
    if (reading.powerWatts > device.maxPower * 0.9) {
      this.emit('powerSpike', { device, reading });
      logger.warn(`⚠️ Power spike detected on ${device.name}: ${reading.powerWatts}W`);
    }

    // Check for voltage anomalies
    if (reading.voltageVolts < 200 || reading.voltageVolts > 250) {
      this.emit('voltageAnomaly', { device, reading });
      logger.warn(`⚠️ Voltage anomaly on ${device.name}: ${reading.voltageVolts}V`);
    }

    // Check for sudden power drops (device offline)
    if (device.lastReading && device.lastReading.powerWatts > 10 && reading.powerWatts < 1) {
      this.emit('deviceOffline', { device, reading });
      logger.warn(`⚠️ Device ${device.name} appears to have gone offline`);
    }
  }

  private processEnergyReading(data: any, sourceIp: string): void {
    // Process UDP energy readings from custom devices
    if (data.deviceId && data.power !== undefined) {
      const reading: EnergyReading = {
        deviceId: data.deviceId,
        timestamp: new Date(data.timestamp || Date.now()),
        powerWatts: data.power,
        voltageVolts: data.voltage || 230,
        currentAmps: data.current || 0,
        energyKwh: data.energy || 0,
        frequency: data.frequency || 50,
        powerFactor: data.powerFactor || 1.0,
        temperature: data.temperature
      };

      this.storeEnergyReading(reading);
      this.emit('energyReading', reading);
    }
  }

  // Public API methods
  getDevices(): EnergyDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): EnergyDevice | undefined {
    return this.devices.get(deviceId);
  }

  async getEnergyHistory(deviceId: string, hours: number = 24): Promise<EnergyReading[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    try {
      const readings = await prisma.energyReading.findMany({
        where: {
          deviceId,
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'desc' }
      });

      return readings.map((r: any) => ({
        deviceId: r.deviceId,
        timestamp: r.timestamp,
        powerWatts: r.powerWatts,
        voltageVolts: r.voltageVolts,
        currentAmps: r.currentAmps,
        energyKwh: r.energyKwh,
        frequency: r.frequency,
        powerFactor: r.powerFactor,
        temperature: r.temperature || undefined
      }));
    } catch (error) {
      logger.error('Failed to get energy history:', error);
      return [];
    }
  }

  async getTotalEnergyUsage(hours: number = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    try {
      const result = await prisma.energyReading.aggregate({
        where: { timestamp: { gte: since } },
        _sum: { powerWatts: true }
      });

      return (result._sum.powerWatts || 0) / 1000; // Convert to kWh
    } catch (error) {
      logger.error('Failed to get total energy usage:', error);
      return 0;
    }
  }

  async controlDevice(deviceId: string, action: string, params?: any): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isOnline) {
      return false;
    }

    try {
      switch (device.protocol) {
        case 'wifi':
          if (device.id.startsWith('tasmota_')) {
            return await this.controlTasmotaDevice(device, action, params);
          } else if (device.id.startsWith('shelly_')) {
            return await this.controlShellyDevice(device, action, params);
          } else if (device.id.startsWith('kasa_')) {
            return await this.controlKasaDevice(device, action, params);
          }
          break;
        case 'zigbee':
          return await this.controlZigbeeDevice(device, action, params);
      }
    } catch (error) {
      logger.error(`Failed to control device ${deviceId}:`, error);
    }

    return false;
  }

  private async controlTasmotaDevice(device: EnergyDevice, action: string, params?: any): Promise<boolean> {
    let command = '';
    
    switch (action) {
      case 'toggle':
        command = 'Power%20TOGGLE';
        break;
      case 'on':
        command = 'Power%20On';
        break;
      case 'off':
        command = 'Power%20Off';
        break;
      default:
        return false;
    }

    const response = await axios.get(`http://${device.ipAddress}/cm?cmnd=${command}`, {
      timeout: 5000
    });

    return response.status === 200;
  }

  private async controlShellyDevice(device: EnergyDevice, action: string, params?: any): Promise<boolean> {
    let endpoint = '';
    
    switch (action) {
      case 'toggle':
        endpoint = '/relay/0?turn=toggle';
        break;
      case 'on':
        endpoint = '/relay/0?turn=on';
        break;
      case 'off':
        endpoint = '/relay/0?turn=off';
        break;
      default:
        return false;
    }

    const response = await axios.get(`http://${device.ipAddress}${endpoint}`, {
      timeout: 5000
    });

    return response.status === 200;
  }

  private async controlKasaDevice(device: EnergyDevice, action: string, params?: any): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let command = '';
      
      switch (action) {
        case 'on':
          command = '{"system":{"set_relay_state":{"state":1}}}';
          break;
        case 'off':
          command = '{"system":{"set_relay_state":{"state":0}}}';
          break;
        case 'toggle':
          // Would need to get current state first, simplified for now
          command = '{"system":{"set_relay_state":{"state":1}}}';
          break;
        default:
          resolve(false);
          return;
      }

      socket.setTimeout(5000);
      socket.connect(9999, device.ipAddress!, () => {
        socket.write(Buffer.from(command));
      });

      socket.on('data', () => {
        socket.destroy();
        resolve(true);
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

  private async controlZigbeeDevice(device: EnergyDevice, action: string, params?: any): Promise<boolean> {
    try {
      let payload: any = {};
      
      switch (action) {
        case 'toggle':
          payload = { state: 'TOGGLE' };
          break;
        case 'on':
          payload = { state: 'ON' };
          break;
        case 'off':
          payload = { state: 'OFF' };
          break;
        default:
          return false;
      }

      const response = await axios.post(
        `http://localhost:8080/api/devices/${device.zigbeeId}/set`,
        payload,
        { timeout: 5000 }
      );

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const realTimeEnergyMonitor = new RealTimeEnergyMonitor();

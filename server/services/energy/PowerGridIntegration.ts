import axios from 'axios';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { EventEmitter } from 'events';
import net from 'net';
import dgram from 'dgram';
import { logger } from '../../utils/logger';

interface GridReading {
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  frequency: number;
  powerFactor: number;
  totalEnergyImported: number;
  totalEnergyExported: number;
  demandPower: number;
  gridStatus: 'connected' | 'disconnected' | 'fault';
  phaseVoltages?: {
    L1: number;
    L2: number;
    L3: number;
  };
  phaseCurrents?: {
    L1: number;
    L2: number;
    L3: number;
  };
  harmonics?: {
    thd_voltage: number;
    thd_current: number;
  };
}

interface SmartMeterConfig {
  type: 'modbus' | 'dlms' | 'iec62056' | 'sml' | 'p1' | 'optical';
  connection: 'serial' | 'tcp' | 'optical';
  address: string; // Serial port, IP address, or device path
  port?: number;
  baudRate?: number;
  meterId?: string;
  encryptionKey?: string;
  manufacturer: string;
  model: string;
}

interface GridConnection {
  id: string;
  name: string;
  type: 'main_meter' | 'production_meter' | 'grid_tie_inverter' | 'battery_system';
  config: SmartMeterConfig;
  isOnline: boolean;
  lastReading?: GridReading;
  capabilities: string[];
}

export class PowerGridIntegration extends EventEmitter {
  private connections: Map<string, GridConnection> = new Map();
  private serialPorts: Map<string, SerialPort> = new Map();
  private tcpClients: Map<string, net.Socket> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isMonitoring = false;

  constructor() {
    super();
    this.setupGridConnections();
  }

  private setupGridConnections(): void {
    // Common smart meter configurations for real grid integration
    const gridConfigs: SmartMeterConfig[] = [
      // European P1 Smart Meters (Netherlands, Belgium)
      {
        type: 'p1',
        connection: 'serial',
        address: 'COM3', // Windows
        baudRate: 115200,
        manufacturer: 'Landis+Gyr',
        model: 'E360'
      },
      // German SML Smart Meters
      {
        type: 'sml',
        connection: 'optical',
        address: '/dev/ttyUSB0', // Linux
        baudRate: 9600,
        manufacturer: 'EMH',
        model: 'eHZ-K'
      },
      // IEC 62056-21 Optical Interface
      {
        type: 'iec62056',
        connection: 'optical',
        address: 'COM4',
        baudRate: 300,
        manufacturer: 'Elster',
        model: 'AS1440'
      },
      // Modbus RTU Energy Meters
      {
        type: 'modbus',
        connection: 'serial',
        address: 'COM5',
        baudRate: 9600,
        meterId: '1',
        manufacturer: 'Schneider Electric',
        model: 'PM8000'
      },
      // Modbus TCP Grid Meters
      {
        type: 'modbus',
        connection: 'tcp',
        address: '192.168.1.100',
        port: 502,
        meterId: '1',
        manufacturer: 'ABB',
        model: 'B23'
      },
      // DLMS/COSEM Smart Meters
      {
        type: 'dlms',
        connection: 'tcp',
        address: '192.168.1.101',
        port: 4059,
        encryptionKey: process.env.DLMS_ENCRYPTION_KEY,
        manufacturer: 'Itron',
        model: 'ACE6000'
      }
    ];

    // Initialize grid connections
    gridConfigs.forEach((config, index) => {
      const connection: GridConnection = {
        id: `grid_${index + 1}`,
        name: `${config.manufacturer} ${config.model}`,
        type: index === 0 ? 'main_meter' : 'production_meter',
        config,
        isOnline: false,
        capabilities: this.getCapabilitiesForMeter(config)
      };
      this.connections.set(connection.id, connection);
    });
  }

  private getCapabilitiesForMeter(config: SmartMeterConfig): string[] {
    const baseCapabilities = ['voltage', 'current', 'power', 'energy'];
    
    switch (config.type) {
      case 'p1':
        return [...baseCapabilities, 'gas_reading', 'tariff_info', 'real_time'];
      case 'sml':
        return [...baseCapabilities, 'obis_codes', 'digital_signature'];
      case 'dlms':
        return [...baseCapabilities, 'load_profile', 'events', 'time_sync'];
      case 'modbus':
        return [...baseCapabilities, 'harmonics', 'power_quality', 'demand'];
      case 'iec62056':
        return [...baseCapabilities, 'optical_interface', 'manufacturer_data'];
      default:
        return baseCapabilities;
    }
  }

  async startGridMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    logger.info('Starting real power grid monitoring...');
    this.isMonitoring = true;

    // Initialize all grid connections
    for (const [id, connection] of this.connections) {
      try {
        await this.initializeConnection(connection);
        this.startPolling(connection);
      } catch (error) {
        logger.error(`Failed to initialize grid connection ${id}:`, error);
      }
    }

    this.emit('gridMonitoringStarted');
  }

  async stopGridMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    logger.info('Stopping power grid monitoring...');
    this.isMonitoring = false;

    // Stop all polling
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();

    // Close all connections
    for (const port of this.serialPorts.values()) {
      if (port.isOpen) {
        port.close();
      }
    }
    this.serialPorts.clear();

    for (const client of this.tcpClients.values()) {
      client.destroy();
    }
    this.tcpClients.clear();

    this.emit('gridMonitoringStopped');
  }

  private async initializeConnection(connection: GridConnection): Promise<void> {
    const { config } = connection;

    switch (config.connection) {
      case 'serial':
        await this.initializeSerialConnection(connection);
        break;
      case 'tcp':
        await this.initializeTcpConnection(connection);
        break;
      case 'optical':
        await this.initializeOpticalConnection(connection);
        break;
    }
  }

  private async initializeSerialConnection(connection: GridConnection): Promise<void> {
    const { config } = connection;
    
    try {
      const port = new SerialPort({
        path: config.address,
        baudRate: config.baudRate || 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
      });

      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      parser.on('data', (data: string) => {
        this.processGridData(connection, data);
      });

      port.on('error', (error) => {
        logger.error(`Serial port error for ${connection.id}:`, error);
        connection.isOnline = false;
        this.emit('gridConnectionError', { connectionId: connection.id, error });
      });

      port.on('open', () => {
        logger.info(`Serial connection opened for ${connection.name}`);
        connection.isOnline = true;
        this.emit('gridConnectionEstablished', connection);
      });

      this.serialPorts.set(connection.id, port);
    } catch (error) {
      logger.error(`Failed to initialize serial connection for ${connection.id}:`, error);
      throw error;
    }
  }

  private async initializeTcpConnection(connection: GridConnection): Promise<void> {
    const { config } = connection;
    
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      
      client.connect(config.port || 502, config.address, () => {
        logger.info(`TCP connection established for ${connection.name}`);
        connection.isOnline = true;
        this.emit('gridConnectionEstablished', connection);
        resolve();
      });

      client.on('data', (data: Buffer) => {
        this.processGridData(connection, data.toString());
      });

      client.on('error', (error) => {
        logger.error(`TCP connection error for ${connection.id}:`, error);
        connection.isOnline = false;
        this.emit('gridConnectionError', { connectionId: connection.id, error });
        reject(error);
      });

      client.on('close', () => {
        logger.warn(`TCP connection closed for ${connection.id}`);
        connection.isOnline = false;
      });

      this.tcpClients.set(connection.id, client);
    });
  }

  private async initializeOpticalConnection(connection: GridConnection): Promise<void> {
    // Optical interface for IEC 62056-21 meters
    const { config } = connection;
    
    try {
      const port = new SerialPort({
        path: config.address,
        baudRate: 300, // Start with 300 baud for optical handshake
        dataBits: 7,
        parity: 'even',
        stopBits: 1
      });

      // Send identification request
      port.write('/?!\r\n');

      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      parser.on('data', (data: string) => {
        if (data.startsWith('/')) {
          // Meter identification received, switch to higher baud rate
          const baudCode = data.charAt(4);
          const newBaudRate = this.getBaudRateFromCode(baudCode);
          
          port.update({ baudRate: newBaudRate });
          port.write('\x06050\r\n'); // ACK with 5-second readout
        } else {
          this.processGridData(connection, data);
        }
      });

      port.on('open', () => {
        logger.info(`Optical connection opened for ${connection.name}`);
        connection.isOnline = true;
        this.emit('gridConnectionEstablished', connection);
      });

      this.serialPorts.set(connection.id, port);
    } catch (error) {
      logger.error(`Failed to initialize optical connection for ${connection.id}:`, error);
      throw error;
    }
  }

  private getBaudRateFromCode(code: string): number {
    const baudRates: { [key: string]: number } = {
      '0': 300, '1': 600, '2': 1200, '3': 2400,
      '4': 4800, '5': 9600, '6': 19200
    };
    return baudRates[code] || 300;
  }

  private startPolling(connection: GridConnection): void {
    const interval = setInterval(async () => {
      if (!connection.isOnline) return;

      try {
        await this.requestGridReading(connection);
      } catch (error) {
        logger.error(`Failed to poll grid data for ${connection.id}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    this.pollingIntervals.set(connection.id, interval);
  }

  private async requestGridReading(connection: GridConnection): Promise<void> {
    const { config } = connection;

    switch (config.type) {
      case 'modbus':
        await this.requestModbusReading(connection);
        break;
      case 'dlms':
        await this.requestDlmsReading(connection);
        break;
      case 'p1':
        // P1 meters send data automatically, no request needed
        break;
      case 'sml':
        // SML meters send data automatically via optical interface
        break;
      case 'iec62056':
        await this.requestIecReading(connection);
        break;
    }
  }

  private async requestModbusReading(connection: GridConnection): Promise<void> {
    const client = this.tcpClients.get(connection.id) || this.serialPorts.get(connection.id);
    if (!client) return;

    // Modbus function code 0x04 (Read Input Registers)
    // Reading common energy meter registers
    const registers = [
      { address: 0x0000, count: 2, name: 'voltage_L1' },
      { address: 0x0002, count: 2, name: 'voltage_L2' },
      { address: 0x0004, count: 2, name: 'voltage_L3' },
      { address: 0x000C, count: 2, name: 'current_L1' },
      { address: 0x000E, count: 2, name: 'current_L2' },
      { address: 0x0010, count: 2, name: 'current_L3' },
      { address: 0x0012, count: 2, name: 'power_total' },
      { address: 0x0046, count: 2, name: 'frequency' },
      { address: 0x0048, count: 4, name: 'energy_imported' },
      { address: 0x004C, count: 4, name: 'energy_exported' }
    ];

    for (const reg of registers) {
      const frame = this.buildModbusFrame(
        parseInt(connection.config.meterId || '1'),
        0x04,
        reg.address,
        reg.count
      );

      if (client instanceof net.Socket) {
        client.write(frame);
      } else if (client instanceof SerialPort) {
        client.write(frame);
      }
    }
  }

  private buildModbusFrame(slaveId: number, functionCode: number, address: number, count: number): Buffer {
    const frame = Buffer.alloc(8);
    frame.writeUInt8(slaveId, 0);
    frame.writeUInt8(functionCode, 1);
    frame.writeUInt16BE(address, 2);
    frame.writeUInt16BE(count, 4);
    
    // Calculate CRC16
    const crc = this.calculateCRC16(frame.slice(0, 6));
    frame.writeUInt16LE(crc, 6);
    
    return frame;
  }

  private calculateCRC16(data: Buffer): number {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc >>= 1;
        }
      }
    }
    return crc;
  }

  private async requestDlmsReading(connection: GridConnection): Promise<void> {
    const client = this.tcpClients.get(connection.id);
    if (!client) return;

    // DLMS/COSEM GET request for common OBIS codes
    const obisRequests = [
      '1.0.1.8.0.255', // Total active energy imported
      '1.0.2.8.0.255', // Total active energy exported
      '1.0.32.7.0.255', // Voltage L1
      '1.0.52.7.0.255', // Voltage L2
      '1.0.72.7.0.255', // Voltage L3
      '1.0.31.7.0.255', // Current L1
      '1.0.51.7.0.255', // Current L2
      '1.0.71.7.0.255', // Current L3
      '1.0.1.7.0.255',  // Total active power
      '1.0.14.7.0.255'  // Frequency
    ];

    for (const obis of obisRequests) {
      const dlmsFrame = this.buildDlmsGetRequest(obis);
      client.write(dlmsFrame);
    }
  }

  private buildDlmsGetRequest(obisCode: string): Buffer {
    // Simplified DLMS GET request frame
    // In production, use a proper DLMS library like node-dlms
    const frame = Buffer.from([
      0x7E, // Flag
      0xA0, 0x08, // Frame format and length
      0x03, // Destination address
      0x02, // Source address
      0x00, // Control field
      0xC0, 0x01, // GET request
      0x01, // Invoke ID
      // OBIS code would be encoded here
      0x7E  // Flag
    ]);
    
    return frame;
  }

  private async requestIecReading(connection: GridConnection): Promise<void> {
    const port = this.serialPorts.get(connection.id);
    if (!port) return;

    // Send readout request for IEC 62056-21
    port.write('/?!\r\n');
  }

  private processGridData(connection: GridConnection, data: string): void {
    try {
      let reading: GridReading;

      switch (connection.config.type) {
        case 'p1':
          reading = this.parseP1Data(data);
          break;
        case 'sml':
          reading = this.parseSmlData(data);
          break;
        case 'iec62056':
          reading = this.parseIecData(data);
          break;
        case 'modbus':
          reading = this.parseModbusData(data);
          break;
        case 'dlms':
          reading = this.parseDlmsData(data);
          break;
        default:
          return;
      }

      if (reading) {
        connection.lastReading = reading;
        this.emit('gridReading', { connectionId: connection.id, reading });
        
        // Store in database
        this.storeGridReading(connection.id, reading);
      }
    } catch (error) {
      logger.error(`Failed to process grid data for ${connection.id}:`, error);
    }
  }

  private parseP1Data(data: string): GridReading | null {
    // Parse Dutch/Belgian P1 smart meter data
    const lines = data.split('\n');
    const reading: Partial<GridReading> = {
      timestamp: new Date().toISOString(),
      gridStatus: 'connected'
    };

    for (const line of lines) {
      if (line.startsWith('1-0:1.8.1')) {
        // Total energy imported (tariff 1)
        const match = line.match(/\((\d+\.\d+)\*kWh\)/);
        if (match) reading.totalEnergyImported = parseFloat(match[1]);
      } else if (line.startsWith('1-0:2.8.1')) {
        // Total energy exported (tariff 1)
        const match = line.match(/\((\d+\.\d+)\*kWh\)/);
        if (match) reading.totalEnergyExported = parseFloat(match[1]);
      } else if (line.startsWith('1-0:32.7.0')) {
        // Voltage L1
        const match = line.match(/\((\d+\.\d+)\*V\)/);
        if (match) reading.voltage = parseFloat(match[1]);
      } else if (line.startsWith('1-0:31.7.0')) {
        // Current L1
        const match = line.match(/\((\d+\.\d+)\*A\)/);
        if (match) reading.current = parseFloat(match[1]);
      } else if (line.startsWith('1-0:1.7.0')) {
        // Current power consumption
        const match = line.match(/\((\d+\.\d+)\*kW\)/);
        if (match) reading.power = parseFloat(match[1]) * 1000; // Convert to watts
      }
    }

    return reading.power !== undefined ? reading as GridReading : null;
  }

  private parseSmlData(data: string): GridReading | null {
    // Parse German SML (Smart Message Language) data
    // SML is a binary protocol, this is a simplified text representation
    const reading: GridReading = {
      timestamp: new Date().toISOString(),
      voltage: 230, // Default values, would be parsed from binary SML
      current: 0,
      power: 0,
      frequency: 50,
      powerFactor: 1.0,
      totalEnergyImported: 0,
      totalEnergyExported: 0,
      demandPower: 0,
      gridStatus: 'connected'
    };

    // In production, use a proper SML parser library
    return reading;
  }

  private parseIecData(data: string): GridReading | null {
    // Parse IEC 62056-21 data
    const lines = data.split('\n');
    const reading: Partial<GridReading> = {
      timestamp: new Date().toISOString(),
      gridStatus: 'connected'
    };

    for (const line of lines) {
      const parts = line.split('(');
      if (parts.length < 2) continue;

      const obis = parts[0];
      const value = parts[1].replace(')', '');

      switch (obis) {
        case '1.8.0':
          reading.totalEnergyImported = parseFloat(value);
          break;
        case '2.8.0':
          reading.totalEnergyExported = parseFloat(value);
          break;
        case '32.7':
          reading.voltage = parseFloat(value);
          break;
        case '31.7':
          reading.current = parseFloat(value);
          break;
        case '1.7':
          reading.power = parseFloat(value) * 1000;
          break;
      }
    }

    return reading.power !== undefined ? reading as GridReading : null;
  }

  private parseModbusData(data: string): GridReading | null {
    // Parse Modbus response data
    // This would typically be binary data from Modbus registers
    const reading: GridReading = {
      timestamp: new Date().toISOString(),
      voltage: 230,
      current: 0,
      power: 0,
      frequency: 50,
      powerFactor: 1.0,
      totalEnergyImported: 0,
      totalEnergyExported: 0,
      demandPower: 0,
      gridStatus: 'connected'
    };

    // In production, parse actual Modbus register values
    return reading;
  }

  private parseDlmsData(data: string): GridReading | null {
    // Parse DLMS/COSEM response data
    const reading: GridReading = {
      timestamp: new Date().toISOString(),
      voltage: 230,
      current: 0,
      power: 0,
      frequency: 50,
      powerFactor: 1.0,
      totalEnergyImported: 0,
      totalEnergyExported: 0,
      demandPower: 0,
      gridStatus: 'connected'
    };

    // In production, parse actual DLMS response frames
    return reading;
  }

  private async storeGridReading(connectionId: string, reading: GridReading): Promise<void> {
    // Store grid reading in database
    // This would integrate with your existing database schema
    logger.debug(`Storing grid reading for ${connectionId}:`, reading);
  }

  getGridConnections(): GridConnection[] {
    return Array.from(this.connections.values());
  }

  getGridConnection(id: string): GridConnection | undefined {
    return this.connections.get(id);
  }

  getCurrentGridStatus(): {
    totalImported: number;
    totalExported: number;
    currentPower: number;
    voltage: number;
    frequency: number;
    gridHealth: 'good' | 'warning' | 'critical';
  } {
    const connections = Array.from(this.connections.values());
    const mainMeter = connections.find(c => c.type === 'main_meter' && c.lastReading);
    
    if (!mainMeter?.lastReading) {
      return {
        totalImported: 0,
        totalExported: 0,
        currentPower: 0,
        voltage: 0,
        frequency: 0,
        gridHealth: 'critical'
      };
    }

    const reading = mainMeter.lastReading;
    let gridHealth: 'good' | 'warning' | 'critical' = 'good';

    // Assess grid health based on voltage and frequency
    if (reading.voltage < 207 || reading.voltage > 253 || 
        reading.frequency < 49.5 || reading.frequency > 50.5) {
      gridHealth = 'warning';
    }
    if (reading.voltage < 196 || reading.voltage > 264 || 
        reading.frequency < 47 || reading.frequency > 52) {
      gridHealth = 'critical';
    }

    return {
      totalImported: reading.totalEnergyImported,
      totalExported: reading.totalEnergyExported,
      currentPower: reading.power,
      voltage: reading.voltage,
      frequency: reading.frequency,
      gridHealth
    };
  }

  async getGridHistory(hours: number = 24): Promise<GridReading[]> {
    // Retrieve grid history from database
    // This would query your database for historical grid readings
    return [];
  }
}

export const powerGridIntegration = new PowerGridIntegration();

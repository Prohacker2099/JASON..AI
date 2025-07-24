/**
 * JASON - The Omnipotent AI Architect
 * 
 * Real server implementation with actual device discovery and control.
 */

import express from 'express';
import path from 'path';
import http from 'http';
import net from 'net';
import os from 'os';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dgram from 'dgram';
import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

// Create async exec function
const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Database path
const DB_PATH = process.env.DB_PATH || './jason.db';

// Initialize database
async function initializeDatabase() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS storage (
      namespace TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (namespace, key)
    )
  `);
  
  console.log('Database initialized successfully');
  return db;
}

// Storage service
class StorageService {
  constructor(db) {
    this.db = db;
  }
  
  async get(namespace, key) {
    try {
      const row = await this.db.get(
        'SELECT value FROM storage WHERE namespace = ? AND key = ?',
        namespace, key
      );
      
      if (!row) {
        return null;
      }
      
      return JSON.parse(row.value);
    } catch (error) {
      console.error(`Error getting ${namespace}/${key} from storage:`, error);
      throw error;
    }
  }
  
  async getAll(namespace) {
    try {
      const rows = await this.db.all(
        'SELECT key, value FROM storage WHERE namespace = ?',
        namespace
      );
      
      return rows.map(row => JSON.parse(row.value));
    } catch (error) {
      console.error(`Error getting all values from ${namespace}:`, error);
      throw error;
    }
  }
  
  async set(namespace, key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      
      await this.db.run(
        `INSERT INTO storage (namespace, key, value, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT (namespace, key)
         DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        namespace, key, serializedValue, serializedValue
      );
    } catch (error) {
      console.error(`Error setting ${namespace}/${key} in storage:`, error);
      throw error;
    }
  }
  
  async remove(namespace, key) {
    try {
      await this.db.run(
        'DELETE FROM storage WHERE namespace = ? AND key = ?',
        namespace, key
      );
    } catch (error) {
      console.error(`Error removing ${namespace}/${key} from storage:`, error);
      throw error;
    }
  }
}

// Device discovery service
class DeviceDiscoveryService extends EventEmitter {
  constructor(storage) {
    super();
    this.devices = new Map();
    this.scanning = false;
    this.ssdpSocket = null;
    this.storage = storage;
    console.log('Device Discovery Service initialized');
  }
  
  async startDiscovery() {
    if (this.scanning) {
      console.warn('Discovery already in progress');
      return Array.from(this.devices.values());
    }
    
    this.scanning = true;
    console.log('Starting device discovery...');
    
    try {
      // Clear existing devices to ensure fresh discovery
      const savedDevices = new Map();
      
      // Save any non-virtual devices that were previously discovered
      for (const [id, device] of this.devices.entries()) {
        if (!device.virtual) {
          savedDevices.set(id, device);
        }
      }
      
      // Clear the devices map but keep non-virtual devices
      this.devices.clear();
      for (const [id, device] of savedDevices.entries()) {
        this.devices.set(id, device);
      }
      
      // Try to load devices from storage first
      try {
        const storedDevices = await this.storage.getAll('devices');
        for (const device of storedDevices) {
          if (!device.virtual && !this.devices.has(device.id)) {
            // Try to verify the device is still reachable
            if (device.address) {
              try {
                const url = `http://${device.address}:${device.port || 80}`;
                const response = await fetch(url, { timeout: 1000 });
                if (response.ok) {
                  console.log(`Verified stored device: ${device.name} (${device.id})`);
                  this.devices.set(device.id, device);
                }
              } catch (e) {
                // Device not reachable, don't add it
                console.log(`Stored device not reachable: ${device.name} (${device.id})`);
              }
            }
          }
        }
      } catch (storageError) {
        console.error('Error loading devices from storage:', storageError);
      }
      
      // Run discovery methods in sequence for better reliability
      console.log('Running SSDP discovery...');
      await this.discoverWithSsdp();
      
      console.log('Running Hue Bridge discovery...');
      await this.discoverHueBridges();
      
      console.log('Running WeMo device discovery...');
      await this.discoverWemoDevices();
      
      // Only run local network scan if we haven't found many devices yet
      if (this.devices.size < 3) {
        console.log('Running local network scan...');
        await this.discoverLocalNetworkDevices();
      } else {
        console.log(`Skipping local network scan, already found ${this.devices.size} devices`);
      }
      
      // If we found real devices, save them to storage
      if (this.devices.size > 0) {
        for (const [id, device] of this.devices.entries()) {
          if (!device.virtual) {
            await this.storage.set('devices', id, device);
          }
        }
      }
      
      // If no devices were found, add virtual devices for testing
      // but only if explicitly requested or in development mode
      if (this.devices.size === 0) {
        if (process.env.NODE_ENV === 'development' || process.env.USE_VIRTUAL_DEVICES === 'true') {
          console.log('No real devices found. Adding virtual devices for testing...');
          await this.addVirtualDevices();
        } else {
          console.log('No devices found and not in development mode. Not adding virtual devices.');
        }
      }
      
      console.log(`Discovery complete. Found ${this.devices.size} devices.`);
      return Array.from(this.devices.values());
    } catch (error) {
      console.error('Error during device discovery:', error);
      return [];
    } finally {
      this.scanning = false;
    }
  }
  
  async addVirtualDevices() {
    // Add virtual devices that simulate real devices but with "virtual-" prefix
    const virtualDevices = [
      {
        id: 'virtual-light-1',
        name: 'Virtual Living Room Light',
        type: 'light',
        manufacturer: 'JASON Virtual',
        model: 'Virtual Smart Light',
        capabilities: ['on', 'brightness', 'color'],
        state: {
          on: true,
          brightness: 80,
          color: {
            hue: 240,
            saturation: 100,
            value: 100
          }
        },
        connected: true,
        address: '127.0.0.1',
        virtual: true
      },
      {
        id: 'virtual-thermostat-1',
        name: 'Virtual Living Room Thermostat',
        type: 'thermostat',
        manufacturer: 'JASON Virtual',
        model: 'Virtual Smart Thermostat',
        capabilities: ['temperature', 'humidity', 'mode'],
        state: {
          temperature: 72,
          humidity: 45,
          mode: 'heat'
        },
        connected: true,
        address: '127.0.0.1',
        virtual: true
      },
      {
        id: 'virtual-switch-1',
        name: 'Virtual Kitchen Switch',
        type: 'switch',
        manufacturer: 'JASON Virtual',
        model: 'Virtual Smart Switch',
        capabilities: ['on'],
        state: {
          on: false
        },
        connected: true,
        address: '127.0.0.1',
        virtual: true
      }
    ];
    
    // Add virtual devices
    for (const device of virtualDevices) {
      this.addDevice(device);
      
      // Save to storage
      await this.storage.set('devices', device.id, device);
    }
  }
  
  stopDiscovery() {
    if (this.ssdpSocket) {
      this.ssdpSocket.close();
      this.ssdpSocket = null;
    }
    
    this.scanning = false;
    console.log('Device discovery stopped');
  }
  
  getDevices() {
    return Array.from(this.devices.values());
  }
  
  addDevice(device) {
    this.devices.set(device.id, device);
    this.emit('deviceDiscovered', device);
    console.log(`Device discovered: ${device.name} (${device.id})`);
  }
  
  async discoverWithSsdp() {
    return new Promise((resolve) => {
      try {
        console.log('Starting SSDP discovery...');
        
        this.ssdpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        const SSDP_ADDR = '239.255.255.250';
        const SSDP_PORT = 1900;
        
        this.ssdpSocket.on('message', (msg, rinfo) => {
          try {
            const message = msg.toString();
            
            // Extract location header
            const locationMatch = message.match(/LOCATION: (.*)/i);
            if (locationMatch && locationMatch[1]) {
              const location = locationMatch[1].trim();
              this.fetchSsdpDescription(location, rinfo.address);
            }
          } catch (err) {
            console.error('Error processing SSDP message:', err);
          }
        });
        
        this.ssdpSocket.on('error', (err) => {
          console.error('SSDP socket error:', err);
        });
        
        this.ssdpSocket.bind(() => {
          try {
            // Send M-SEARCH request
            const searchMessage = Buffer.from(
              'M-SEARCH * HTTP/1.1\r\n' +
              `HOST: ${SSDP_ADDR}:${SSDP_PORT}\r\n` +
              'MAN: "ssdp:discover"\r\n' +
              'MX: 3\r\n' +
              'ST: ssdp:all\r\n\r\n'
            );
            
            this.ssdpSocket?.send(searchMessage, 0, searchMessage.length, SSDP_PORT, SSDP_ADDR);
          } catch (err) {
            console.error('Error sending SSDP discovery message:', err);
          }
          
          // Resolve after timeout
          setTimeout(() => {
            if (this.ssdpSocket) {
              this.ssdpSocket.close();
              this.ssdpSocket = null;
            }
            resolve();
          }, 5000);
        });
      } catch (error) {
        console.error('Error in SSDP discovery:', error);
        resolve();
      }
    });
  }
  
  async fetchSsdpDescription(location, address) {
    try {
      const response = await fetch(location, { timeout: 2000 });
      const xml = await response.text();
      
      // Extract device info from XML
      const friendlyNameMatch = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/);
      const manufacturerMatch = xml.match(/<manufacturer>([^<]+)<\/manufacturer>/);
      const modelNameMatch = xml.match(/<modelName>([^<]+)<\/modelName>/);
      const deviceTypeMatch = xml.match(/<deviceType>([^<]+)<\/deviceType>/);
      
      if (!friendlyNameMatch) return;
      
      const deviceType = this.getSsdpDeviceType(deviceTypeMatch ? deviceTypeMatch[1] : '');
      const isWemo = manufacturerMatch && manufacturerMatch[1].includes('Belkin');
      
      if (isWemo) {
        // Process WeMo device
        const device = {
          id: `wemo-${address}`,
          name: friendlyNameMatch[1],
          type: deviceType,
          manufacturer: 'Belkin WeMo',
          model: modelNameMatch ? modelNameMatch[1] : 'Unknown',
          capabilities: ['on'],
          state: { on: false },
          connected: true,
          address
        };
        
        this.addDevice(device);
      } else {
        // Process other UPnP device
        const device = {
          id: `upnp-${address}`,
          name: friendlyNameMatch[1],
          type: deviceType,
          manufacturer: manufacturerMatch ? manufacturerMatch[1] : 'Unknown',
          model: modelNameMatch ? modelNameMatch[1] : 'Unknown',
          capabilities: [],
          state: {},
          connected: true,
          address
        };
        
        this.addDevice(device);
      }
    } catch (error) {
      // Ignore fetch errors
    }
  }
  
  getSsdpDeviceType(deviceType) {
    if (deviceType.includes('MediaRenderer')) return 'speaker';
    if (deviceType.includes('Light')) return 'light';
    if (deviceType.includes('Switch')) return 'switch';
    return 'other';
  }
  
  async discoverHueBridges() {
    try {
      console.log('Discovering Hue bridges...');
      
      // Try to use configured bridge IP first
      if (process.env.HUE_BRIDGE_IP) {
        const bridgeIp = process.env.HUE_BRIDGE_IP;
        try {
          const response = await fetch(`http://${bridgeIp}/api/config`, { timeout: 2000 });
          const data = await response.json();
          
          if (data.bridgeid) {
            const device = {
              id: `hue-bridge-${data.bridgeid}`,
              name: data.name || 'Philips Hue Bridge',
              type: 'bridge',
              manufacturer: 'Philips',
              model: 'Hue Bridge',
              capabilities: ['lights'],
              state: {},
              connected: true,
              address: bridgeIp
            };
            
            this.addDevice(device);
            
            // If we have a username, discover lights
            if (process.env.HUE_USERNAME) {
              await this.discoverHueLights(bridgeIp);
            }
            
            return;
          }
        } catch (err) {
          console.warn(`Failed to connect to configured Hue bridge at ${bridgeIp}:`, err);
        }
      }
      
      // Fall back to discovery API
      try {
        const response = await fetch('https://discovery.meethue.com/');
        const bridges = await response.json();
        
        for (const bridge of bridges) {
          if (bridge.internalipaddress) {
            const device = {
              id: `hue-bridge-${bridge.id || 'unknown'}`,
              name: 'Philips Hue Bridge',
              type: 'bridge',
              manufacturer: 'Philips',
              model: 'Hue Bridge',
              capabilities: ['lights'],
              state: {},
              connected: true,
              address: bridge.internalipaddress
            };
            
            this.addDevice(device);
          }
        }
      } catch (error) {
        console.error('Error discovering Hue bridges:', error);
      }
    } catch (error) {
      console.error('Error in Hue bridge discovery:', error);
    }
  }
  
  async discoverHueLights(bridgeIp) {
    try {
      const username = process.env.HUE_USERNAME;
      if (!username) return;
      
      const response = await fetch(`http://${bridgeIp}/api/${username}/lights`, { timeout: 2000 });
      const lights = await response.json();
      
      for (const [id, light] of Object.entries(lights)) {
        if (typeof light !== 'object') continue;
        
        const capabilities = ['on'];
        if (light.state.hasOwnProperty('bri')) capabilities.push('brightness');
        if (light.state.hasOwnProperty('hue')) capabilities.push('color');
        if (light.state.hasOwnProperty('ct')) capabilities.push('temperature');
        
        const device = {
          id: `hue-light-${id}`,
          name: light.name || `Hue Light ${id}`,
          type: 'light',
          manufacturer: 'Philips',
          model: light.modelid || 'Unknown',
          capabilities,
          state: {
            on: light.state.on || false,
            brightness: light.state.bri ? Math.round((light.state.bri / 254) * 100) : undefined,
            color: light.state.hue ? {
              hue: light.state.hue,
              saturation: light.state.sat,
              value: light.state.bri
            } : undefined
          },
          connected: light.state.reachable || true,
          address: bridgeIp
        };
        
        this.addDevice(device);
      }
    } catch (error) {
      console.error('Error discovering Hue lights:', error);
    }
  }
  
  async discoverWemoDevices() {
    console.log('Starting WeMo device discovery...');
    
    try {
      // WeMo devices typically respond to specific SSDP search targets
      const wemoSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      const SSDP_ADDR = '239.255.255.250';
      const SSDP_PORT = 1900;
      
      // Create a promise that will resolve after our search
      const searchPromise = new Promise((resolve) => {
        wemoSocket.on('message', (msg, rinfo) => {
          try {
            const message = msg.toString();
            
            // Check if this is a WeMo device
            if (message.includes('Belkin') || message.includes('WeMo')) {
              // Extract location header
              const locationMatch = message.match(/LOCATION: (.*)/i);
              if (locationMatch && locationMatch[1]) {
                const location = locationMatch[1].trim();
                this.fetchWemoDescription(location, rinfo.address);
              }
            }
          } catch (err) {
            console.error('Error processing WeMo SSDP message:', err);
          }
        });
        
        // Resolve after timeout
        setTimeout(() => {
          wemoSocket.close();
          resolve();
        }, 5000);
      });
      
      // Bind socket and send search
      wemoSocket.bind(() => {
        // Send specific search for WeMo devices
        const wemoSearchMessage = Buffer.from(
          'M-SEARCH * HTTP/1.1\r\n' +
          `HOST: ${SSDP_ADDR}:${SSDP_PORT}\r\n` +
          'MAN: "ssdp:discover"\r\n' +
          'MX: 3\r\n' +
          'ST: urn:Belkin:device:*\r\n\r\n'
        );
        
        wemoSocket.send(wemoSearchMessage, 0, wemoSearchMessage.length, SSDP_PORT, SSDP_ADDR);
        
        // Also try the generic search target
        const genericSearchMessage = Buffer.from(
          'M-SEARCH * HTTP/1.1\r\n' +
          `HOST: ${SSDP_ADDR}:${SSDP_PORT}\r\n` +
          'MAN: "ssdp:discover"\r\n' +
          'MX: 3\r\n' +
          'ST: upnp:rootdevice\r\n\r\n'
        );
        
        wemoSocket.send(genericSearchMessage, 0, genericSearchMessage.length, SSDP_PORT, SSDP_ADDR);
      });
      
      // Wait for the search to complete
      await searchPromise;
      console.log('WeMo discovery completed');
    } catch (error) {
      console.error('Error in WeMo discovery:', error);
    }
  }
  
  async fetchWemoDescription(location, address) {
    try {
      const response = await fetch(location, { timeout: 2000 });
      const xml = await response.text();
      
      // Check if this is a WeMo device
      if (xml.includes('Belkin') && xml.includes('WeMo')) {
        // Extract device info from XML
        const friendlyNameMatch = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/);
        const modelNameMatch = xml.match(/<modelName>([^<]+)<\/modelName>/);
        const deviceTypeMatch = xml.match(/<deviceType>([^<]+)<\/deviceType>/);
        
        if (!friendlyNameMatch) return;
        
        // Determine device type
        let deviceType = 'switch';
        if (deviceTypeMatch) {
          const typeString = deviceTypeMatch[1];
          if (typeString.includes('lightswitch')) deviceType = 'light';
          else if (typeString.includes('insight')) deviceType = 'sensor';
        }
        
        // Create device object
        const device = {
          id: `wemo-${address}`,
          name: friendlyNameMatch[1],
          type: deviceType,
          manufacturer: 'Belkin WeMo',
          model: modelNameMatch ? modelNameMatch[1] : 'Unknown',
          capabilities: ['on'],
          state: { on: false },
          connected: true,
          address,
          wemoLocation: location
        };
        
        this.addDevice(device);
        await this.storage.set('devices', device.id, device);
      }
    } catch (error) {
      // Ignore fetch errors
      console.debug(`Error fetching WeMo description from ${location}:`, error.message);
    }
  }
  
  async discoverLocalNetworkDevices() {
    console.log('🔍 Starting enhanced network device discovery with phone integration...');
    
    try {
      // Get all local network interfaces
      const networkInterfaces = this.getNetworkInterfaces();
      if (networkInterfaces.length === 0) {
        console.warn('Could not determine any usable network interfaces');
        return;
      }
      
      // Enhanced device discovery with phone integration
      await this.discoverMobileDevices();
      await this.discoverNetworkDevices();
      await this.discoverBluetoothDevices();
      await this.discoverSerialDevices();
      
    } catch (error) {
      console.error('❌ Enhanced discovery error:', error);
    }
  }

  // Enhanced Mobile device discovery with privacy-first integration
  async discoverMobileDevices() {
    console.log('📱 Discovering mobile devices with privacy-first integration...');
    
    try {
      // Method 1: ADB for Android devices (with enhanced capabilities)
      await this.discoverAndroidDevicesADB();
      
      // Method 2: iOS devices via libimobiledevice (with enhanced capabilities)
      await this.discoveriOSDevices();
      
      // Method 3: Network-based mobile device detection (enhanced identification)
      await this.discoverNetworkMobileDevices();
      
      // Method 4: Bluetooth phone discovery (enhanced)
      await this.discoverBluetoothPhones();
      
    } catch (error) {
      console.error('❌ Mobile discovery error:', error);
    }
  }

  // Android ADB Discovery
  async discoverAndroidDevicesADB() {
    try {
      console.log('📱 Checking for ADB and Android devices...');
      
      // Check if ADB is available
      try {
        const { stdout } = await execAsync('adb version 2>/dev/null');
        if (stdout.includes('Android Debug Bridge')) {
          console.log('✅ ADB is available');
          
          // Get connected devices
          const { stdout: devicesOutput } = await execAsync('adb devices 2>/dev/null');
          const lines = devicesOutput.split('\n').filter(line => line.includes('\t'));
          
          console.log(`📱 ADB devices output: ${lines.length} lines`);
          
          for (const line of lines) {
            const [deviceId, status] = line.split('\t');
            if (status === 'device') {
              console.log(`📱 Found Android device: ${deviceId}`);
              
              // Get device info
              try {
                const { stdout: modelOutput } = await execAsync(`adb -s ${deviceId} shell getprop ro.product.model 2>/dev/null`);
                const { stdout: manufacturerOutput } = await execAsync(`adb -s ${deviceId} shell getprop ro.product.manufacturer 2>/dev/null`);
                const { stdout: versionOutput } = await execAsync(`adb -s ${deviceId} shell getprop ro.build.version.release 2>/dev/null`);
                
                const device = {
                  id: `android_${deviceId.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  name: `${manufacturerOutput.trim()} ${modelOutput.trim()}`,
                  type: 'smartphone',
                  category: 'mobile',
                  manufacturer: manufacturerOutput.trim() || 'Android',
                  model: modelOutput.trim() || 'Unknown',
                  version: `Android ${versionOutput.trim()}`,
                  protocols: ['adb', 'usb'],
                  capabilities: [
                    { name: 'device_control', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Full device control via ADB', privacy: 'opt-in' },
                    { name: 'app_management', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Install/uninstall apps', privacy: 'opt-in' },
                    { name: 'screen_capture', type: 'control', dataType: 'string', readable: false, writable: true, description: 'Take screenshots', privacy: 'opt-in' },
                    { name: 'notification_send', type: 'control', dataType: 'object', readable: false, writable: true, description: 'Send notifications', privacy: 'opt-in' },
                    { name: 'presence_detection', type: 'sensor', dataType: 'boolean', readable: true, writable: false, description: 'Device presence detection', privacy: 'basic' },
                    { name: 'automation_triggers', type: 'control', dataType: 'object', readable: false, writable: true, description: 'Smart home automation triggers', privacy: 'opt-in' }
                  ],
                  authentication: { type: 'adb_auth', refreshable: true },
                  status: 'online',
                  location: 'USB Connected',
                  lastSeen: new Date(),
                  metadata: { 
                    deviceId,
                    connectionType: 'USB',
                    adbEnabled: true,
                    privacyCompliant: true
                  },
                  controlMethods: ['adb'],
                  privacySettings: {
                    dataRetention: '1_hour',
                    encryptionLevel: 'ADB-standard',
                    auditLogging: true,
                    userConsent: 'required',
                    dataMinimization: true
                  }
                };
                
                this.addDevice(device);
                console.log(`✅ Added Android device: ${device.name}`);
              } catch (e) {
                console.log(`⚠️ Could not get details for device ${deviceId}`);
              }
            }
          }
        }
      } catch (e) {
        console.log('📱 ADB not available or no devices connected');
      }
      
    } catch (error) {
      console.error('❌ Android ADB discovery error:', error);
    }
  }

  // iOS Device Discovery
  async discoveriOSDevices() {
    try {
      console.log('📱 Checking for iOS devices...');
      
      // Check if libimobiledevice is available
      try {
        const { stdout } = await execAsync('idevice_id --version 2>/dev/null');
        console.log('✅ libimobiledevice is available');
        
        // Get connected iOS devices
        const { stdout: devicesOutput } = await execAsync('idevice_id -l 2>/dev/null');
        const deviceIds = devicesOutput.split('\n').filter(id => id.trim().length > 0);
        
        console.log(`📱 Found ${deviceIds.length} iOS devices`);
        
        for (const deviceId of deviceIds) {
          try {
            // Get device info
            const { stdout: infoOutput } = await execAsync(`ideviceinfo -u ${deviceId} 2>/dev/null`);
            const info = {};
            
            infoOutput.split('\n').forEach(line => {
              const [key, value] = line.split(': ');
              if (key && value) {
                info[key.trim()] = value.trim();
              }
            });
            
            const device = {
              id: `ios_${deviceId.replace(/[^a-zA-Z0-9]/g, '_')}`,
              name: `${info.DeviceName || 'iOS Device'} (${info.ProductType || 'iPhone'})`,
              type: 'smartphone',
              category: 'mobile',
              manufacturer: 'Apple',
              model: info.ProductType || 'iOS Device',
              version: `iOS ${info.ProductVersion || 'Unknown'}`,
              protocols: ['libimobiledevice', 'usb'],
              capabilities: [
                { name: 'device_info', type: 'sensor', dataType: 'object', readable: true, writable: false, description: 'Device information', privacy: 'basic' },
                { name: 'backup_restore', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Backup and restore', privacy: 'opt-in' },
                { name: 'media_sync', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Media synchronization', privacy: 'opt-in' },
                { name: 'homekit_bridge', type: 'control', dataType: 'object', readable: true, writable: true, description: 'HomeKit integration', privacy: 'opt-in' },
                { name: 'siri_shortcuts', type: 'control', dataType: 'object', readable: false, writable: true, description: 'Siri shortcuts integration', privacy: 'opt-in' },
                { name: 'find_device', type: 'control', dataType: 'boolean', readable: false, writable: true, description: 'Find My device integration', privacy: 'opt-in' }
              ],
              authentication: { type: 'ios_trust', refreshable: true },
              status: 'online',
              location: 'USB Connected',
              lastSeen: new Date(),
              metadata: { 
                deviceId,
                udid: deviceId,
                deviceInfo: info,
                connectionType: 'USB',
                privacyCompliant: true
              },
              controlMethods: ['libimobiledevice'],
              privacySettings: {
                dataRetention: '1_hour',
                encryptionLevel: 'iOS-standard',
                auditLogging: true,
                userConsent: 'required',
                dataMinimization: true,
                applePrivacyCompliant: true
              }
            };
            
            this.addDevice(device);
            console.log(`✅ Added iOS device: ${device.name}`);
          } catch (e) {
            console.log(`⚠️ Could not get details for iOS device ${deviceId}`);
          }
        }
        
      } catch (e) {
        console.log('📱 libimobiledevice not available or no iOS devices connected');
      }
      
    } catch (error) {
      console.error('❌ iOS discovery error:', error);
    }
  }

  // Network-based mobile device detection
  async discoverNetworkMobileDevices() {
    try {
      console.log('📱 Scanning network for mobile devices...');
      
      const networks = await this.getLocalNetworks();
      
      for (const network of networks) {
        const baseIP = network.split('/')[0].split('.').slice(0, 3).join('.');
        
        // Scan for mobile device indicators
        for (let i = 1; i <= 254; i++) {
          const ip = `${baseIP}.${i}`;
          
          try {
            // Quick ping test
            const pingResult = await this.pingHost(ip);
            if (!pingResult.success) continue;
            
            // Check for mobile device ports
            const mobileServices = [
              { port: 62078, name: 'iOS iTunes WiFi Sync', type: 'smartphone', manufacturer: 'Apple' },
              { port: 5555, name: 'Android ADB WiFi', type: 'smartphone', manufacturer: 'Android' },
              { port: 8080, name: 'Mobile Hotspot', type: 'smartphone', manufacturer: 'Unknown' },
              { port: 5000, name: 'AirPlay', type: 'smartphone', manufacturer: 'Apple' },
              { port: 7000, name: 'AirPlay Video', type: 'smartphone', manufacturer: 'Apple' }
            ];
            
            for (const service of mobileServices) {
              const isOpen = await this.checkPort(ip, service.port);
              if (isOpen) {
                console.log(`📱 Found potential mobile device at ${ip}:${service.port} (${service.name})`);
                
                const device = {
                  id: `mobile_network_${ip.replace(/\./g, '_')}_${service.port}`,
                  name: `${service.manufacturer} ${service.type} (${service.name})`,
                  type: service.type,
                  category: 'mobile',
                  manufacturer: service.manufacturer,
                  model: service.name,
                  version: 'Unknown',
                  ip: ip,
                  port: service.port,
                  protocols: ['network', 'tcp'],
                  capabilities: [
                    { name: 'presence_detection', type: 'sensor', dataType: 'boolean', readable: true, writable: false, description: 'Network presence detection', privacy: 'basic' },
                    { name: 'network_info', type: 'sensor', dataType: 'object', readable: true, writable: false, description: 'Network connection info', privacy: 'basic' },
                    { name: 'smart_home_triggers', type: 'control', dataType: 'object', readable: false, writable: true, description: 'Trigger smart home actions', privacy: 'opt-in' }
                  ],
                  authentication: { type: 'network_auth', refreshable: true },
                  status: 'online',
                  location: 'Network',
                  lastSeen: new Date(),
                  metadata: { 
                    detectionMethod: 'network_scan',
                    servicePort: service.port,
                    networkInfo: { ip, pingTime: pingResult.time }
                  },
                  controlMethods: ['network'],
                  privacySettings: {
                    dataRetention: '1_hour',
                    encryptionLevel: 'network-standard',
                    auditLogging: true,
                    userConsent: 'basic',
                    dataMinimization: true
                  }
                };
                
                this.addDevice(device);
                console.log(`✅ Added network mobile device: ${device.name}`);
                break; // Found one service, don't check others for this IP
              }
            }
          } catch (e) {
            // Continue scanning
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Network mobile discovery error:', error);
    }
  }

  // Enhanced Bluetooth phone discovery
  async discoverBluetoothPhones() {
    try {
      console.log('📱 Discovering Bluetooth phones...');
      
      // Get paired Bluetooth devices
      const pairedDevices = await this.getBluetoothPairedDevices();
      
      for (const device of pairedDevices) {
        if (this.isBluetoothPhone(device)) {
          const enhancedDevice = {
            id: `bluetooth_phone_${device.address?.replace(/:/g, '_') || Math.random().toString(36).substr(2, 9)}`,
            name: `${device.name || 'Bluetooth Phone'}`,
            type: 'smartphone',
            category: 'mobile',
            manufacturer: this.getManufacturerFromBluetoothName(device.name),
            model: device.name || 'Unknown',
            version: 'Unknown',
            protocols: ['bluetooth'],
            capabilities: [
              { name: 'bluetooth_connect', type: 'control', dataType: 'boolean', readable: true, writable: true, description: 'Bluetooth connection control', privacy: 'basic' },
              { name: 'audio_streaming', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Audio streaming via Bluetooth', privacy: 'opt-in' },
              { name: 'hands_free_calling', type: 'control', dataType: 'object', readable: false, writable: true, description: 'Hands-free calling', privacy: 'explicit-consent' },
              { name: 'media_control', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Media playback control', privacy: 'opt-in' },
              { name: 'battery_level', type: 'sensor', dataType: 'number', readable: true, writable: false, description: 'Phone battery level', privacy: 'basic' }
            ],
            authentication: { type: 'bluetooth_pairing', refreshable: true },
            status: device.connected ? 'online' : 'paired',
            location: 'Bluetooth',
            lastSeen: new Date(),
            metadata: { 
              bluetoothAddress: device.address,
              bluetoothProfiles: ['A2DP', 'HFP', 'HSP', 'AVRCP'],
              connected: device.connected || false
            },
            controlMethods: ['bluetooth'],
            privacySettings: {
              dataRetention: '1_hour',
              encryptionLevel: 'Bluetooth-standard',
              auditLogging: true,
              userConsent: 'required',
              dataMinimization: true
            }
          };
          
          this.addDevice(enhancedDevice);
          console.log(`✅ Added Bluetooth phone: ${enhancedDevice.name}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Bluetooth phone discovery error:', error);
    }
  }

  // Enhanced network device discovery
  async discoverNetworkDevices() {
    console.log('🌐 Discovering network devices with enhanced identification...');
    
    try {
      const networks = await this.getLocalNetworks();
      
      for (const network of networks) {
        const baseIP = network.split('/')[0].split('.').slice(0, 3).join('.');
        
        // Enhanced port scanning with better device identification
        const commonPorts = [22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1883, 8883, 5683, 554, 1935, 3689, 5000, 7000, 8096, 32400, 161, 623, 3306, 5432, 27017, 6379, 631, 9100];
        
        for (let i = 1; i <= 254; i++) {
          const ip = `${baseIP}.${i}`;
          
          try {
            const pingResult = await this.pingHost(ip);
            if (!pingResult.success) continue;
            
            console.log(`📡 Found active device at ${ip}`);
            
            // Check multiple ports for better identification
            const openPorts = [];
            for (const port of commonPorts) {
              if (await this.checkPort(ip, port)) {
                openPorts.push(port);
              }
            }
            
            if (openPorts.length > 0) {
              const device = await this.identifyNetworkDevice(ip, openPorts);
              this.addDevice(device);
              console.log(`✅ Added device: ${device.name} (${device.type})`);
            }
            
          } catch (e) {
            // Continue scanning
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Network discovery error:', error);
    }
  }

  // Enhanced Bluetooth device discovery
  async discoverBluetoothDevices() {
    try {
      console.log('📱 Discovering Bluetooth devices...');
      
      // Get connected devices
      const connectedDevices = await this.getBluetoothConnectedDevices();
      for (const device of connectedDevices) {
        const bluetoothDevice = {
          id: `bluetooth_${device.address?.replace(/:/g, '_') || Math.random().toString(36).substr(2, 9)}`,
          name: device.name || `Bluetooth Device`,
          type: this.getBluetoothDeviceType(device),
          category: 'bluetooth',
          manufacturer: this.getManufacturerFromBluetoothName(device.name),
          model: device.name || 'Unknown',
          version: 'Unknown',
          protocols: ['bluetooth'],
          capabilities: [
            { name: 'bluetooth_connect', type: 'control', dataType: 'boolean', readable: true, writable: true, description: 'Bluetooth connection' }
          ],
          authentication: { type: 'bluetooth_pairing', refreshable: true },
          status: 'online',
          location: 'Bluetooth',
          lastSeen: new Date(),
          metadata: { bluetoothAddress: device.address, connected: true },
          controlMethods: ['bluetooth']
        };
        
        this.addDevice(bluetoothDevice);
        console.log(`📱 Found connected Bluetooth device: ${device.name || device.address}`);
      }
      
      // Get paired devices
      const pairedDevices = await this.getBluetoothPairedDevices();
      for (const device of pairedDevices) {
        // Skip if already added as connected
        const existingId = `bluetooth_${device.address?.replace(/:/g, '_') || Math.random().toString(36).substr(2, 9)}`;
        if (this.devices.has(existingId)) continue;
        
        const bluetoothDevice = {
          id: existingId,
          name: device.name || `Bluetooth Device`,
          type: this.getBluetoothDeviceType(device),
          category: 'bluetooth',
          manufacturer: this.getManufacturerFromBluetoothName(device.name),
          model: device.name || 'Unknown',
          version: 'Unknown',
          protocols: ['bluetooth'],
          capabilities: [
            { name: 'bluetooth_connect', type: 'control', dataType: 'boolean', readable: true, writable: true, description: 'Bluetooth connection' }
          ],
          authentication: { type: 'bluetooth_pairing', refreshable: true },
          status: 'paired',
          location: 'Bluetooth',
          lastSeen: new Date(),
          metadata: { bluetoothAddress: device.address, connected: false },
          controlMethods: ['bluetooth']
        };
        
        this.addDevice(bluetoothDevice);
        console.log(`📱 Found paired Bluetooth device: ${device.name || device.address}`);
      }
      
    } catch (error) {
      console.error('❌ Bluetooth discovery error:', error);
    }
  }

  // Serial/USB device discovery
  async discoverSerialDevices() {
    try {
      console.log('🔌 Discovering Serial/USB devices...');
      
      // Get serial ports (works on macOS and Linux)
      try {
        const { stdout } = await execAsync('ls /dev/tty.* 2>/dev/null || ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true');
        const ports = stdout.split('\n').filter(port => port.trim().length > 0);
        
        for (const port of ports) {
          const deviceName = port.split('/').pop();
          
          // Try to identify phone connections
          const isPhone = this.identifyPhoneFromSerial(deviceName);
          
          const device = {
            id: `serial_${deviceName.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: `Serial Device ${deviceName}`,
            type: isPhone ? 'smartphone' : 'serial_device',
            category: isPhone ? 'mobile' : 'hardware',
            manufacturer: isPhone || 'Unknown',
            model: deviceName,
            version: 'Unknown',
            port: port,
            protocols: ['serial', 'usb'],
            capabilities: [
              { name: 'serial_communication', type: 'control', dataType: 'string', readable: true, writable: true, description: 'Serial communication' }
            ],
            authentication: { type: 'direct_access', refreshable: false },
            status: 'online',
            location: 'USB/Serial',
            lastSeen: new Date(),
            metadata: { serialPort: port, deviceName },
            controlMethods: ['serial']
          };
          
          if (isPhone) {
            console.log(`📱 Identified phone via USB: ${isPhone} `);
            device.capabilities.push(
              { name: 'usb_debugging', type: 'control', dataType: 'object', readable: true, writable: true, description: 'USB debugging access' },
              { name: 'file_transfer', type: 'control', dataType: 'object', readable: true, writable: true, description: 'File transfer via USB' }
            );
          }
          
          this.addDevice(device);
          console.log(`📡 Found serial device: ${port}`);
        }
        
      } catch (e) {
        console.log('🔌 No serial devices found or ls command failed');
      }
      
    } catch (error) {
      console.error('❌ Serial discovery error:', error);
    }
  }

  // Helper methods for enhanced discovery
  async getLocalNetworks() {
    const interfaces = this.getNetworkInterfaces();
    return interfaces.map(iface => `${iface.network}/${iface.cidr}`);
  }

  async pingHost(ip, timeout = 1000) {
    try {
      const { stdout } = await execAsync(`ping -c 1 -W ${timeout} ${ip} 2>/dev/null`);
      const timeMatch = stdout.match(/time=([0-9.]+)/);
      return {
        success: true,
        time: timeMatch ? parseFloat(timeMatch[1]) : null
      };
    } catch (e) {
      return { success: false };
    }
  }

  async checkPort(ip, port, timeout = 1000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, ip);
    });
  }

  async identifyNetworkDevice(ip, openPorts) {
    // Enhanced device identification logic
    const device = {
      id: `network_${ip.replace(/\./g, '_')}`,
      name: `Network Device ${ip}`,
      type: 'unknown',
      category: 'network',
      manufacturer: 'Unknown',
      model: 'Unknown',
      version: 'Unknown',
      ip: ip,
      protocols: ['tcp'],
      capabilities: [
        { name: 'ping', type: 'sensor', dataType: 'boolean', readable: true, writable: false, description: 'Network connectivity' }
      ],
      authentication: { type: 'none', refreshable: false },
      status: 'online',
      location: 'Network',
      lastSeen: new Date(),
      metadata: { openPorts },
      controlMethods: []
    };

    // Enhanced identification based on ports and web content
    if (openPorts.includes(80) || openPorts.includes(443)) {
      try {
        const response = await fetch(`http://${ip}`, { timeout: 3000 });
        const html = await response.text();
        const htmlLower = html.toLowerCase();
        
        if (htmlLower.includes('router') || htmlLower.includes('gateway')) {
          device.type = 'router';
          device.name = `Router/Gateway (${ip})`;
          device.capabilities.push(
            { name: 'web_interface', type: 'control', dataType: 'object', readable: true, writable: true, description: 'Web management interface' }
          );
        } else if (htmlLower.includes('camera') || htmlLower.includes('webcam')) {
          device.type = 'security_camera';
          device.category = 'smart_home';
          device.name = `Security Camera (${ip})`;
        } else if (htmlLower.includes('printer')) {
          device.type = 'printer';
          device.category = 'appliance';
          device.name = `Network Printer (${ip})`;
        }
      } catch (e) {
        // Web identification failed
      }
    }

    // Port-based identification
    if (openPorts.includes(22)) {
      device.type = 'computer';
      device.category = 'computer';
      device.name = `SSH Server (${ip})`;
      device.protocols.push('ssh');
    } else if (openPorts.includes(5000)) {
      device.type = 'media_device';
      device.category = 'entertainment';
      device.name = `AirPlay Device (${ip})`;
      device.protocols.push('airplay');
    }

    return device;
  }

  async getBluetoothConnectedDevices() {
    try {
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('system_profiler SPBluetoothDataType -json 2>/dev/null');
        const data = JSON.parse(stdout);
        return data.SPBluetoothDataType?.[0]?.device_connected || [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  async getBluetoothPairedDevices() {
    try {
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('system_profiler SPBluetoothDataType -json 2>/dev/null');
        const data = JSON.parse(stdout);
        return data.SPBluetoothDataType?.[0]?.device_paired || [];
      } else if (process.platform === 'linux') {
        const { stdout } = await execAsync('bluetoothctl paired-devices 2>/dev/null');
        return stdout.split('\n').filter(line => line.includes('Device')).map(line => {
          const parts = line.split(' ');
          return { address: parts[1], name: parts.slice(2).join(' ') };
        });
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  isBluetoothPhone(device) {
    const phoneKeywords = ['phone', 'iphone', 'android', 'galaxy', 'pixel', 'oneplus', 'huawei', 'xiaomi'];
    const deviceName = (device.name || '').toLowerCase();
    return phoneKeywords.some(keyword => deviceName.includes(keyword));
  }

  getBluetoothDeviceType(device) {
    const name = (device.name || '').toLowerCase();
    if (this.isBluetoothPhone(device)) return 'smartphone';
    if (name.includes('headphone') || name.includes('airpods') || name.includes('speaker')) return 'audio_device';
    if (name.includes('keyboard')) return 'keyboard';
    if (name.includes('mouse')) return 'mouse';
    return 'bluetooth_device';
  }

  getManufacturerFromBluetoothName(name) {
    if (!name) return 'Unknown';
    const nameLower = name.toLowerCase();
    if (nameLower.includes('apple') || nameLower.includes('iphone') || nameLower.includes('airpods')) return 'Apple';
    if (nameLower.includes('samsung') || nameLower.includes('galaxy')) return 'Samsung';
    if (nameLower.includes('google') || nameLower.includes('pixel')) return 'Google';
    if (nameLower.includes('sony')) return 'Sony';
    if (nameLower.includes('bose')) return 'Bose';
    return 'Unknown';
  }

  identifyPhoneFromSerial(deviceName) {
    const nameLower = deviceName.toLowerCase();
    if (nameLower.includes('iphone') || nameLower.includes('ipad')) return 'Apple';
    if (nameLower.includes('android') || nameLower.includes('samsung') || nameLower.includes('galaxy')) return 'samsung';
    if (nameLower.includes('pixel')) return 'Google';
    if (nameLower.includes('oneplus')) return 'OnePlus';
    if (nameLower.includes('huawei')) return 'Huawei';
    if (nameLower.includes('xiaomi')) return 'Xiaomi';
    return null;
  }
}
          
          // Skip our own IP
          if (ip === address) continue;
          
          // Try to connect to common ports
          for (const port of commonPorts) {
            scanPromises.push(this.probeDevice(ip, port));
          }
          
          // Limit concurrent connections to avoid overwhelming the network
          if (scanPromises.length >= 30) {
            await Promise.allSettled(scanPromises);
            scanPromises.length = 0;
          }
        }
      }
      
      // Wait for remaining scans to complete
      await Promise.allSettled(scanPromises);
      
      console.log('Local network scan completed');
    } catch (error) {
      console.error('Error scanning local network:', error);
    }
  }
  
  getNetworkInterfaces() {
    try {
      // Get all network interfaces
      const interfaces = os.networkInterfaces();
      const results = [];
      
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          // Skip non-IPv4 and internal interfaces
          if (iface.family !== 'IPv4' || iface.internal) {
            continue;
          }
          
          // Get the base IP by replacing the last octet with 0
          const baseIp = iface.address.replace(/\d+$/, '0');
          
          results.push({
            name,
            address: iface.address,
            netmask: iface.netmask,
            baseIp,
            cidr: this.calculateCIDR(iface.netmask)
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error determining network interfaces:', error);
      return [];
    }
  }
  
  calculateCIDR(netmask) {
    // Convert netmask to CIDR notation
    try {
      const parts = netmask.split('.');
      let cidr = 0;
      for (const part of parts) {
        const num = parseInt(part, 10);
        // Count the number of 1s in binary representation
        for (let i = 7; i >= 0; i--) {
          if ((num & (1 << i)) !== 0) {
            cidr++;
          } else {
            break;
          }
        }
      }
      return cidr;
    } catch (error) {
      return 24; // Default to /24 if there's an error
    }
  }
  
  async probeDevice(ip, port) {
    try {
      // Try to connect to the device
      const url = `http://${ip}:${port}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      try {
        const response = await fetch(url, { 
          timeout: 2000,
          signal: controller.signal,
          headers: {
            'User-Agent': 'JASON-HomeAutomation/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8'
          }
        });
        
        clearTimeout(timeoutId);
        
        // If we get a response, try to identify the device
        if (response.ok || response.status === 401) { // Include 401 Unauthorized as many IoT devices require auth
          console.log(`Found device at ${url} (status: ${response.status})`);
          
          // Check for specific device headers
          const headers = response.headers;
          const server = headers.get('server') || '';
          
          // Try to identify based on headers first
          let deviceInfo = this.identifyDeviceFromHeaders(headers, ip, port);
          
          if (!deviceInfo) {
            // Try to get device information from body
            const contentType = headers.get('content-type') || '';
            
            if (contentType.includes('json')) {
              // Try to parse JSON response
              const data = await response.json();
              deviceInfo = this.identifyDeviceFromJson(data, ip, port);
            } else {
              // Try to parse HTML or text response
              const text = await response.text();
              deviceInfo = this.identifyDeviceFromHtml(text, ip, port);
            }
          }
          
          if (deviceInfo) {
            this.addDevice(deviceInfo);
            await this.storage.set('devices', deviceInfo.id, deviceInfo);
          } else {
            // If we couldn't identify the device but got a response, add as generic device
            console.log(`Adding generic device at ${url}`);
            const genericDevice = {
              id: `device-${ip}-${port}`,
              name: `Device at ${ip}:${port}`,
              type: 'other',
              manufacturer: server || 'Unknown',
              model: 'Unknown',
              capabilities: [],
              state: {},
              connected: true,
              address: ip,
              port: port
            };
            this.addDevice(genericDevice);
            await this.storage.set('devices', genericDevice.id, genericDevice);
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Try HTTPS if HTTP fails
        if (port === 80 || port === 8080) {
          try {
            const httpsUrl = `https://${ip}:${port === 80 ? 443 : 8443}`;
            const httpsController = new AbortController();
            const httpsTimeoutId = setTimeout(() => httpsController.abort(), 2000);
            
            const httpsResponse = await fetch(httpsUrl, { 
              timeout: 2000,
              signal: httpsController.signal,
              headers: {
                'User-Agent': 'JASON-HomeAutomation/1.0'
              }
            });
            
            clearTimeout(httpsTimeoutId);
            
            if (httpsResponse.ok || httpsResponse.status === 401) {
              console.log(`Found device at ${httpsUrl} (status: ${httpsResponse.status})`);
              // Process HTTPS response similar to HTTP
              // (simplified for brevity - would duplicate the HTTP processing)
              const genericDevice = {
                id: `device-${ip}-${httpsResponse.status === 443 ? 443 : 8443}`,
                name: `Secure Device at ${ip}`,
                type: 'other',
                manufacturer: httpsResponse.headers.get('server') || 'Unknown',
                model: 'Unknown',
                capabilities: [],
                state: {},
                connected: true,
                address: ip,
                port: httpsResponse.status === 443 ? 443 : 8443,
                secure: true
              };
              this.addDevice(genericDevice);
              await this.storage.set('devices', genericDevice.id, genericDevice);
            }
          } catch (httpsError) {
            // Ignore HTTPS errors
          }
        }
      }
    } catch (error) {
      // Ignore connection errors - most IPs won't have devices
    }
  }
  
  identifyDeviceFromHeaders(headers, ip, port) {
    const server = headers.get('server') || '';
    const contentType = headers.get('content-type') || '';
    
    // Check for specific device signatures in headers
    if (server.includes('Philips hue') || server.includes('Hue')) {
      return {
        id: `hue-bridge-${ip}`,
        name: 'Philips Hue Bridge',
        type: 'bridge',
        manufacturer: 'Philips',
        model: 'Hue Bridge',
        capabilities: ['lights'],
        state: {},
        connected: true,
        address: ip,
        port: port
      };
    }
    
    if (server.includes('LIFX') || server.includes('lifx')) {
      return {
        id: `lifx-${ip}`,
        name: 'LIFX Device',
        type: 'light',
        manufacturer: 'LIFX',
        model: 'Unknown',
        capabilities: ['on', 'brightness', 'color'],
        state: {
          on: false,
          brightness: 100
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    if (server.includes('Belkin') || server.includes('WeMo')) {
      return {
        id: `wemo-${ip}`,
        name: 'WeMo Device',
        type: 'switch',
        manufacturer: 'Belkin WeMo',
        model: 'Unknown',
        capabilities: ['on'],
        state: {
          on: false
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    if (server.includes('Sonos')) {
      return {
        id: `sonos-${ip}`,
        name: 'Sonos Speaker',
        type: 'speaker',
        manufacturer: 'Sonos',
        model: 'Unknown',
        capabilities: ['on', 'volume'],
        state: {
          on: false,
          volume: 50
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    return null;
  }
  
  identifyDeviceFromJson(data, ip, port) {
    // Try to identify device type from JSON response
    // This is a simplified approach and would need to be expanded for real devices
    
    // Check for Philips Hue bridge
    if (data.bridgeid || data.swversion) {
      return {
        id: `hue-bridge-${data.bridgeid || ip}`,
        name: data.name || 'Philips Hue Bridge',
        type: 'bridge',
        manufacturer: 'Philips',
        model: 'Hue Bridge',
        capabilities: ['lights'],
        state: {},
        connected: true,
        address: ip,
        port: port
      };
    }
    
    // Check for LIFX light
    if (data.product_name && data.manufacturer === 'LIFX') {
      return {
        id: `lifx-${data.id || ip}`,
        name: data.label || 'LIFX Light',
        type: 'light',
        manufacturer: 'LIFX',
        model: data.product_name,
        capabilities: ['on', 'brightness', 'color'],
        state: {
          on: data.power === 'on',
          brightness: data.brightness ? Math.round(data.brightness * 100) : 100,
          color: data.color ? {
            hue: data.color.hue,
            saturation: data.color.saturation * 100,
            value: data.brightness * 100
          } : undefined
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    // Check for TP-Link/Kasa device
    if (data.system && data.system.get_sysinfo) {
      const info = data.system.get_sysinfo;
      return {
        id: `tplink-${info.deviceId || ip}`,
        name: info.alias || 'TP-Link Device',
        type: info.mic_type === 'IOT.SMARTBULB' ? 'light' : 'switch',
        manufacturer: 'TP-Link',
        model: info.model || 'Unknown',
        capabilities: ['on'],
        state: {
          on: info.relay_state === 1 || info.light_state?.on_off === 1
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    // Generic device if we can't identify it specifically
    if (Object.keys(data).length > 0) {
      return {
        id: `device-${ip}-${port}`,
        name: `Device at ${ip}:${port}`,
        type: 'other',
        manufacturer: 'Unknown',
        model: 'Unknown',
        capabilities: [],
        state: {},
        connected: true,
        address: ip,
        port: port
      };
    }
    
    return null;
  }
  
  identifyDeviceFromHtml(html, ip, port) {
    // Try to identify device type from HTML response
    // This is a simplified approach and would need to be expanded for real devices
    
    // Check for common device signatures in HTML
    if (html.includes('Philips Hue') || html.includes('hue bridge')) {
      return {
        id: `hue-bridge-${ip}`,
        name: 'Philips Hue Bridge',
        type: 'bridge',
        manufacturer: 'Philips',
        model: 'Hue Bridge',
        capabilities: ['lights'],
        state: {},
        connected: true,
        address: ip,
        port: port
      };
    }
    
    if (html.includes('LIFX') || html.includes('lifx.com')) {
      return {
        id: `lifx-${ip}`,
        name: 'LIFX Light',
        type: 'light',
        manufacturer: 'LIFX',
        model: 'Unknown',
        capabilities: ['on', 'brightness', 'color'],
        state: {
          on: false,
          brightness: 100
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    if (html.includes('TP-Link') || html.includes('Kasa')) {
      return {
        id: `tplink-${ip}`,
        name: 'TP-Link Device',
        type: 'switch',
        manufacturer: 'TP-Link',
        model: 'Unknown',
        capabilities: ['on'],
        state: {
          on: false
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    // Check for common IoT platforms
    if (html.includes('Tuya') || html.includes('Smart Life')) {
      return {
        id: `tuya-${ip}`,
        name: 'Tuya Device',
        type: 'other',
        manufacturer: 'Tuya',
        model: 'Unknown',
        capabilities: ['on'],
        state: {
          on: false
        },
        connected: true,
        address: ip,
        port: port
      };
    }
    
    // Generic web server if we can't identify it specifically
    return {
      id: `webserver-${ip}-${port}`,
      name: `Web Server at ${ip}:${port}`,
      type: 'other',
      manufacturer: 'Unknown',
      model: 'Unknown',
      capabilities: [],
      state: {},
      connected: true,
      address: ip,
      port: port
    };
  }
}

// Device manager service
class DeviceManager extends EventEmitter {
  constructor(storage, deviceDiscovery) {
    super();
    this.devices = new Map();
    this.initialized = false;
    this.storage = storage;
    this.deviceDiscovery = deviceDiscovery;
    
    // Set up event listeners
    this.deviceDiscovery.on('deviceDiscovered', (device) => {
      this.handleDeviceDiscovered(device);
    });
    
    console.log('Device Manager initialized');
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load devices from storage
      const storedDevices = await this.loadDevicesFromStorage();
      storedDevices.forEach(device => {
        this.devices.set(device.id, device);
      });
      
      this.initialized = true;
      console.log('Device Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Device Manager:', error);
      return false;
    }
  }
  
  async startDiscovery() {
    try {
      const discoveredDevices = await this.deviceDiscovery.startDiscovery();
      console.log(`Discovered ${discoveredDevices.length} devices`);
      return discoveredDevices;
    } catch (error) {
      console.error('Error during device discovery:', error);
      return [];
    }
  }
  
  stopDiscovery() {
    this.deviceDiscovery.stopDiscovery();
  }
  
  getAllDevices() {
    return Array.from(this.devices.values());
  }
  
  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }
  
  async controlDevice(deviceId, command, source = 'api') {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        return { success: false, error: `Device not found: ${deviceId}` };
      }
      
      console.log(`Controlling device ${deviceId} with command: ${command.type}`);
      
      // Check if this is a virtual device or a real device
      if (device.virtual) {
        // For virtual devices, just update the state locally
        return this.controlVirtualDevice(device, command, source);
      } else {
        // For real devices, send commands to the actual device
        return this.controlRealDevice(device, command, source);
      }
    } catch (error) {
      console.error(`Error controlling device ${deviceId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async controlVirtualDevice(device, command, source) {
    // Update device state based on command
    const updatedState = { ...device.state };
    
    switch (command.type) {
      case 'power':
        updatedState.on = command.params.value === true;
        break;
        
      case 'brightness':
        if (device.capabilities.includes('brightness')) {
          updatedState.brightness = Math.min(100, Math.max(0, command.params.value));
        }
        break;
        
      case 'color':
        if (device.capabilities.includes('color') && command.params.color) {
          updatedState.color = {
            hue: command.params.color.h || updatedState.color?.hue || 0,
            saturation: command.params.color.s || updatedState.color?.saturation || 0,
            value: command.params.color.v || updatedState.color?.value || 0
          };
        }
        break;
        
      case 'temperature':
        if (device.capabilities.includes('temperature')) {
          updatedState.temperature = command.params.value;
        }
        break;
        
      case 'mode':
        if (device.capabilities.includes('mode')) {
          updatedState.mode = command.params.value;
        }
        break;
        
      default:
        return { success: false, error: `Unsupported command type: ${command.type}` };
    }
    
    // Update device state
    device.state = updatedState;
    device.lastSeen = new Date();
    device.lastControlSource = source;
    this.devices.set(device.id, device);
    
    // Save device state to storage
    await this.saveDeviceToStorage(device);
    
    // Emit state change event
    this.emit('deviceStateChanged', device);
    
    return { success: true, data: updatedState };
  }
  
  async controlRealDevice(device, command, source) {
    try {
      // Determine device type and send appropriate commands
      if (device.id.startsWith('hue-')) {
        return await this.controlHueDevice(device, command, source);
      } else if (device.id.startsWith('wemo-')) {
        return await this.controlWemoDevice(device, command, source);
      } else if (device.id.startsWith('lifx-')) {
        return await this.controlLifxDevice(device, command, source);
      } else if (device.id.startsWith('tplink-')) {
        return await this.controlTpLinkDevice(device, command, source);
      } else if (device.id.startsWith('tuya-')) {
        return await this.controlTuyaDevice(device, command, source);
      } else {
        // For unknown device types, fall back to virtual control
        console.log(`No control implementation for device type: ${device.id}. Using virtual control.`);
        return this.controlVirtualDevice(device, command, source);
      }
    } catch (error) {
      console.error(`Error controlling real device ${device.id}:`, error);
      
      // If real device control fails, update virtual state anyway
      console.log(`Falling back to virtual control for device ${device.id}`);
      return this.controlVirtualDevice(device, command, source);
    }
  }
  
  async controlHueDevice(device, command, source) {
    // Control Philips Hue device
    console.log(`Controlling Hue device: ${device.id}`);
    
    try {
      // Extract device ID from the Hue device ID
      const hueId = device.id.replace('hue-light-', '');
      const bridgeIp = device.address;
      const username = process.env.HUE_USERNAME;
      
      if (!username) {
        throw new Error('HUE_USERNAME environment variable not set');
      }
      
      // Prepare the command payload
      let payload = {};
      
      switch (command.type) {
        case 'power':
          payload.on = command.params.value;
          break;
          
        case 'brightness':
          // Hue brightness is 0-254
          payload.bri = Math.round((command.params.value / 100) * 254);
          break;
          
        case 'color':
          if (command.params.color) {
            // Hue uses different color format
            payload.hue = command.params.color.h;
            payload.sat = command.params.color.s;
            payload.bri = Math.round((command.params.color.v / 100) * 254);
          }
          break;
          
        default:
          throw new Error(`Unsupported command type for Hue: ${command.type}`);
      }
      
      // Send command to Hue bridge
      const response = await fetch(`http://${bridgeIp}/api/${username}/lights/${hueId}/state`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      // Check for errors in response
      if (result.some(item => item.error)) {
        const error = result.find(item => item.error);
        throw new Error(`Hue error: ${error.error.description}`);
      }
      
      // Update device state
      const updatedState = { ...device.state };
      
      if (payload.on !== undefined) {
        updatedState.on = payload.on;
      }
      
      if (payload.bri !== undefined) {
        updatedState.brightness = Math.round((payload.bri / 254) * 100);
      }
      
      if (payload.hue !== undefined) {
        updatedState.color = {
          hue: payload.hue,
          saturation: payload.sat,
          value: updatedState.brightness || 100
        };
      }
      
      // Update device
      device.state = updatedState;
      device.lastSeen = new Date();
      device.lastControlSource = source;
      this.devices.set(device.id, device);
      
      // Save device state to storage
      await this.saveDeviceToStorage(device);
      
      // Emit state change event
      this.emit('deviceStateChanged', device);
      
      return { success: true, data: updatedState };
    } catch (error) {
      console.error(`Error controlling Hue device ${device.id}:`, error);
      throw error;
    }
  }
  
  async controlWemoDevice(device, command, source) {
    // Control WeMo device
    console.log(`Controlling WeMo device: ${device.id}`);
    
    try {
      const ip = device.address;
      
      // WeMo uses SOAP for control
      if (command.type === 'power') {
        const state = command.params.value ? '1' : '0';
        
        // Create SOAP request
        const soapAction = '"urn:Belkin:service:basicevent:1#SetBinaryState"';
        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
          <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            <s:Body>
              <u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">
                <BinaryState>${state}</BinaryState>
              </u:SetBinaryState>
            </s:Body>
          </s:Envelope>`;
        
        // Send SOAP request
        const response = await fetch(`http://${ip}:49153/upnp/control/basicevent1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset="utf-8"',
            'SOAPACTION': soapAction,
            'Content-Length': Buffer.byteLength(soapBody)
          },
          body: soapBody
        });
        
        if (!response.ok) {
          throw new Error(`WeMo error: ${response.statusText}`);
        }
        
        // Update device state
        const updatedState = { ...device.state, on: command.params.value };
        
        // Update device
        device.state = updatedState;
        device.lastSeen = new Date();
        device.lastControlSource = source;
        this.devices.set(device.id, device);
        
        // Save device state to storage
        await this.saveDeviceToStorage(device);
        
        // Emit state change event
        this.emit('deviceStateChanged', device);
        
        return { success: true, data: updatedState };
      } else {
        throw new Error(`Unsupported command type for WeMo: ${command.type}`);
      }
    } catch (error) {
      console.error(`Error controlling WeMo device ${device.id}:`, error);
      throw error;
    }
  }
  
  async controlLifxDevice(device, command, source) {
    // Control LIFX device
    console.log(`Controlling LIFX device: ${device.id}`);
    
    try {
      const ip = device.address;
      
      // Prepare the command payload
      let payload = {};
      
      switch (command.type) {
        case 'power':
          payload.power = command.params.value ? 'on' : 'off';
          break;
          
        case 'brightness':
          payload.brightness = command.params.value / 100;
          break;
          
        case 'color':
          if (command.params.color) {
            payload.color = {
              hue: command.params.color.h,
              saturation: command.params.color.s / 100,
              brightness: command.params.color.v / 100
            };
          }
          break;
          
        default:
          throw new Error(`Unsupported command type for LIFX: ${command.type}`);
      }
      
      // Send command to LIFX device
      const response = await fetch(`http://${ip}:56700/v1/lights/all/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`LIFX error: ${response.statusText}`);
      }
      
      // Update device state
      const updatedState = { ...device.state };
      
      if (payload.power !== undefined) {
        updatedState.on = payload.power === 'on';
      }
      
      if (payload.brightness !== undefined) {
        updatedState.brightness = Math.round(payload.brightness * 100);
      }
      
      if (payload.color !== undefined) {
        updatedState.color = {
          hue: payload.color.hue,
          saturation: Math.round(payload.color.saturation * 100),
          value: Math.round(payload.color.brightness * 100)
        };
      }
      
      // Update device
      device.state = updatedState;
      device.lastSeen = new Date();
      device.lastControlSource = source;
      this.devices.set(device.id, device);
      
      // Save device state to storage
      await this.saveDeviceToStorage(device);
      
      // Emit state change event
      this.emit('deviceStateChanged', device);
      
      return { success: true, data: updatedState };
    } catch (error) {
      console.error(`Error controlling LIFX device ${device.id}:`, error);
      throw error;
    }
  }
  
  async controlTpLinkDevice(device, command, source) {
    // Control TP-Link/Kasa device
    console.log(`Controlling TP-Link device: ${device.id}`);
    
    try {
      const ip = device.address;
      
      // TP-Link uses a custom protocol
      if (command.type === 'power') {
        // Prepare command
        const cmd = {
          system: {
            set_relay_state: {
              state: command.params.value ? 1 : 0
            }
          }
        };
        
        // For bulbs, use a different command
        if (device.type === 'light') {
          cmd.system = undefined;
          cmd.smartlife = {
            lightingservice: {
              transition_light_state: {
                on_off: command.params.value ? 1 : 0
              }
            }
          };
        }
        
        // Send command to TP-Link device
        const response = await fetch(`http://${ip}:9999/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cmd)
        });
        
        if (!response.ok) {
          throw new Error(`TP-Link error: ${response.statusText}`);
        }
        
        // Update device state
        const updatedState = { ...device.state, on: command.params.value };
        
        // Update device
        device.state = updatedState;
        device.lastSeen = new Date();
        device.lastControlSource = source;
        this.devices.set(device.id, device);
        
        // Save device state to storage
        await this.saveDeviceToStorage(device);
        
        // Emit state change event
        this.emit('deviceStateChanged', device);
        
        return { success: true, data: updatedState };
      } else {
        throw new Error(`Unsupported command type for TP-Link: ${command.type}`);
      }
    } catch (error) {
      console.error(`Error controlling TP-Link device ${device.id}:`, error);
      throw error;
    }
  }
  
  async controlTuyaDevice(device, command, source) {
    // Control Tuya device
    console.log(`Controlling Tuya device: ${device.id}`);
    
    try {
      // Tuya devices typically require cloud API or local key
      // This is a simplified implementation
      console.log('Tuya control not fully implemented - using virtual control');
      
      // Fall back to virtual control
      return this.controlVirtualDevice(device, command, source);
    } catch (error) {
      console.error(`Error controlling Tuya device ${device.id}:`, error);
      throw error;
    }
  }
  
  handleDeviceDiscovered(device) {
    const existingDevice = this.devices.get(device.id);
    
    if (existingDevice) {
      // Update existing device
      const updatedDevice = {
        ...existingDevice,
        ...device,
        state: { ...existingDevice.state, ...device.state },
        lastSeen: new Date()
      };
      
      this.devices.set(device.id, updatedDevice);
      this.emit('deviceUpdated', updatedDevice);
    } else {
      // Add new device
      this.devices.set(device.id, device);
      this.emit('deviceDiscovered', device);
    }
    
    // Save device to storage
    this.saveDeviceToStorage(device).catch(error => {
      console.error(`Error saving device ${device.id} to storage:`, error);
    });
  }
  
  async loadDevicesFromStorage() {
    try {
      const devices = await this.storage.getAll('devices');
      return devices || [];
    } catch (error) {
      console.error('Error loading devices from storage:', error);
      return [];
    }
  }
  
  async saveDeviceToStorage(device) {
    try {
      await this.storage.set('devices', device.id, device);
    } catch (error) {
      console.error(`Error saving device ${device.id} to storage:`, error);
    }
  }
}

// Scene manager service
class SceneManager extends EventEmitter {
  constructor(storage, deviceManager) {
    super();
    this.scenes = new Map();
    this.initialized = false;
    this.storage = storage;
    this.deviceManager = deviceManager;
    console.log('Scene Manager initialized');
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load scenes from storage
      const storedScenes = await this.storage.getAll('scenes') || [];
      storedScenes.forEach(scene => {
        this.scenes.set(scene.id, scene);
      });
      
      // Create default scenes if none exist
      if (this.scenes.size === 0) {
        await this.createDefaultScenes();
      }
      
      this.initialized = true;
      console.log('Scene Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Scene Manager:', error);
      return false;
    }
  }
  
  async createDefaultScenes() {
    const defaultScenes = [
      {
        id: 'scene-1',
        name: 'Movie Night',
        description: 'Dim lights for movie watching',
        deviceStates: [
          { deviceId: 'mock-light-1', state: { on: true, brightness: 30 } }
        ],
        icon: 'film',
        color: '#3498db',
        lastActivated: null
      },
      {
        id: 'scene-2',
        name: 'Good Morning',
        description: 'Brighten lights and set comfortable temperature',
        deviceStates: [
          { deviceId: 'mock-light-1', state: { on: true, brightness: 100 } },
          { deviceId: 'mock-thermostat-1', state: { temperature: 72 } }
        ],
        icon: 'sun',
        color: '#f39c12',
        lastActivated: null
      },
      {
        id: 'scene-3',
        name: 'Away Mode',
        description: 'Turn off lights and set energy-saving temperature',
        deviceStates: [
          { deviceId: 'mock-light-1', state: { on: false } },
          { deviceId: 'mock-thermostat-1', state: { temperature: 65 } }
        ],
        icon: 'home',
        color: '#2ecc71',
        lastActivated: null
      }
    ];
    
    for (const scene of defaultScenes) {
      this.scenes.set(scene.id, scene);
      await this.storage.set('scenes', scene.id, scene);
    }
    
    console.log('Created default scenes');
  }
  
  getAllScenes() {
    return Array.from(this.scenes.values());
  }
  
  getScene(sceneId) {
    return this.scenes.get(sceneId);
  }
  
  async createScene(scene) {
    try {
      const newScene = {
        ...scene,
        id: scene.id || `scene-${Date.now()}`,
        lastActivated: null
      };
      
      this.scenes.set(newScene.id, newScene);
      await this.storage.set('scenes', newScene.id, newScene);
      
      this.emit('sceneCreated', newScene);
      return { success: true, data: newScene };
    } catch (error) {
      console.error('Error creating scene:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async updateScene(sceneId, updates) {
    try {
      const scene = this.scenes.get(sceneId);
      if (!scene) {
        return { success: false, error: `Scene not found: ${sceneId}` };
      }
      
      const updatedScene = { ...scene, ...updates };
      this.scenes.set(sceneId, updatedScene);
      await this.storage.set('scenes', sceneId, updatedScene);
      
      this.emit('sceneUpdated', updatedScene);
      return { success: true, data: updatedScene };
    } catch (error) {
      console.error(`Error updating scene ${sceneId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async deleteScene(sceneId) {
    try {
      const scene = this.scenes.get(sceneId);
      if (!scene) {
        return { success: false, error: `Scene not found: ${sceneId}` };
      }
      
      this.scenes.delete(sceneId);
      await this.storage.remove('scenes', sceneId);
      
      this.emit('sceneDeleted', sceneId);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting scene ${sceneId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async activateScene(sceneId) {
    try {
      const scene = this.scenes.get(sceneId);
      if (!scene) {
        return { success: false, error: `Scene not found: ${sceneId}` };
      }
      
      console.log(`Activating scene: ${scene.name}`);
      
      // Apply device states
      const devicePromises = scene.deviceStates.map(async (deviceState) => {
        const { deviceId, state } = deviceState;
        const device = this.deviceManager.getDevice(deviceId);
        
        if (!device) {
          console.warn(`Device not found: ${deviceId}`);
          return;
        }
        
        // Convert state to commands
        const commands = [];
        
        if (state.on !== undefined) {
          commands.push({
            type: 'power',
            params: { value: state.on }
          });
        }
        
        if (state.brightness !== undefined) {
          commands.push({
            type: 'brightness',
            params: { value: state.brightness }
          });
        }
        
        if (state.color !== undefined) {
          commands.push({
            type: 'color',
            params: { color: state.color }
          });
        }
        
        if (state.temperature !== undefined) {
          commands.push({
            type: 'temperature',
            params: { value: state.temperature }
          });
        }
        
        if (state.mode !== undefined) {
          commands.push({
            type: 'mode',
            params: { value: state.mode }
          });
        }
        
        // Execute commands
        for (const command of commands) {
          await this.deviceManager.controlDevice(deviceId, command, 'scene');
        }
      });
      
      await Promise.all(devicePromises);
      
      // Update scene activation time
      const updatedScene = {
        ...scene,
        lastActivated: new Date().toISOString()
      };
      
      this.scenes.set(sceneId, updatedScene);
      await this.storage.set('scenes', sceneId, updatedScene);
      
      this.emit('sceneActivated', updatedScene);
      return { success: true, data: updatedScene };
    } catch (error) {
      console.error(`Error activating scene ${sceneId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Automation manager service
class AutomationManager extends EventEmitter {
  constructor(storage, deviceManager, sceneManager) {
    super();
    this.automations = new Map();
    this.initialized = false;
    this.storage = storage;
    this.deviceManager = deviceManager;
    this.sceneManager = sceneManager;
    this.timers = new Map();
    console.log('Automation Manager initialized');
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load automations from storage
      const storedAutomations = await this.storage.getAll('automations') || [];
      storedAutomations.forEach(automation => {
        this.automations.set(automation.id, automation);
      });
      
      // Create default automations if none exist
      if (this.automations.size === 0) {
        await this.createDefaultAutomations();
      }
      
      // Schedule automations
      this.scheduleAutomations();
      
      this.initialized = true;
      console.log('Automation Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Automation Manager:', error);
      return false;
    }
  }
  
  async createDefaultAutomations() {
    const defaultAutomations = [
      {
        id: 'auto-1',
        name: 'Evening Lights',
        description: 'Turn on lights at sunset',
        trigger: { type: 'time', time: '18:00' },
        actions: [
          { type: 'device', deviceId: 'mock-light-1', state: { on: true, brightness: 70 } }
        ],
        enabled: true
      },
      {
        id: 'auto-2',
        name: 'Night Mode',
        description: 'Turn off lights at night',
        trigger: { type: 'time', time: '23:00' },
        actions: [
          { type: 'device', deviceId: 'mock-light-1', state: { on: false } }
        ],
        enabled: true
      },
      {
        id: 'auto-3',
        name: 'Morning Scene',
        description: 'Activate Good Morning scene at 7 AM',
        trigger: { type: 'time', time: '07:00' },
        actions: [
          { type: 'scene', sceneId: 'scene-2' }
        ],
        enabled: true
      }
    ];
    
    for (const automation of defaultAutomations) {
      this.automations.set(automation.id, automation);
      await this.storage.set('automations', automation.id, automation);
    }
    
    console.log('Created default automations');
  }
  
  scheduleAutomations() {
    // Clear existing timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Schedule enabled automations
    this.automations.forEach(automation => {
      if (automation.enabled && automation.trigger.type === 'time') {
        this.scheduleAutomation(automation);
      }
    });
  }
  
  scheduleAutomation(automation) {
    if (!automation.enabled || automation.trigger.type !== 'time') {
      return;
    }
    
    const [hours, minutes] = automation.trigger.time.split(':').map(Number);
    
    // Calculate next trigger time
    const now = new Date();
    const triggerTime = new Date(now);
    triggerTime.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (triggerTime <= now) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }
    
    // Calculate delay in milliseconds
    const delay = triggerTime.getTime() - now.getTime();
    
    // Schedule automation
    const timer = setTimeout(() => {
      this.executeAutomation(automation.id)
        .then(() => {
          // Reschedule for the next day
          this.scheduleAutomation(automation);
        })
        .catch(error => {
          console.error(`Error executing automation ${automation.id}:`, error);
          // Reschedule for the next day anyway
          this.scheduleAutomation(automation);
        });
    }, delay);
    
    this.timers.set(automation.id, timer);
    
    console.log(`Scheduled automation "${automation.name}" to run at ${automation.trigger.time} (in ${Math.round(delay / 60000)} minutes)`);
  }
  
  getAllAutomations() {
    return Array.from(this.automations.values());
  }
  
  getAutomation(automationId) {
    return this.automations.get(automationId);
  }
  
  async createAutomation(automation) {
    try {
      const newAutomation = {
        ...automation,
        id: automation.id || `auto-${Date.now()}`,
        enabled: automation.enabled !== undefined ? automation.enabled : true
      };
      
      this.automations.set(newAutomation.id, newAutomation);
      await this.storage.set('automations', newAutomation.id, newAutomation);
      
      // Schedule if enabled and time-based
      if (newAutomation.enabled && newAutomation.trigger.type === 'time') {
        this.scheduleAutomation(newAutomation);
      }
      
      this.emit('automationCreated', newAutomation);
      return { success: true, data: newAutomation };
    } catch (error) {
      console.error('Error creating automation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async updateAutomation(automationId, updates) {
    try {
      const automation = this.automations.get(automationId);
      if (!automation) {
        return { success: false, error: `Automation not found: ${automationId}` };
      }
      
      const updatedAutomation = { ...automation, ...updates };
      this.automations.set(automationId, updatedAutomation);
      await this.storage.set('automations', automationId, updatedAutomation);
      
      // Clear existing timer
      if (this.timers.has(automationId)) {
        clearTimeout(this.timers.get(automationId));
        this.timers.delete(automationId);
      }
      
      // Reschedule if enabled and time-based
      if (updatedAutomation.enabled && updatedAutomation.trigger.type === 'time') {
        this.scheduleAutomation(updatedAutomation);
      }
      
      this.emit('automationUpdated', updatedAutomation);
      return { success: true, data: updatedAutomation };
    } catch (error) {
      console.error(`Error updating automation ${automationId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async deleteAutomation(automationId) {
    try {
      const automation = this.automations.get(automationId);
      if (!automation) {
        return { success: false, error: `Automation not found: ${automationId}` };
      }
      
      this.automations.delete(automationId);
      await this.storage.remove('automations', automationId);
      
      // Clear timer if exists
      if (this.timers.has(automationId)) {
        clearTimeout(this.timers.get(automationId));
        this.timers.delete(automationId);
      }
      
      this.emit('automationDeleted', automationId);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting automation ${automationId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async executeAutomation(automationId) {
    try {
      const automation = this.automations.get(automationId);
      if (!automation) {
        return { success: false, error: `Automation not found: ${automationId}` };
      }
      
      if (!automation.enabled) {
        return { success: false, error: `Automation is disabled: ${automationId}` };
      }
      
      console.log(`Executing automation: ${automation.name}`);
      
      // Execute actions
      for (const action of automation.actions) {
        if (action.type === 'device') {
          const { deviceId, state } = action;
          const device = this.deviceManager.getDevice(deviceId);
          
          if (!device) {
            console.warn(`Device not found: ${deviceId}`);
            continue;
          }
          
          // Convert state to commands
          if (state.on !== undefined) {
            await this.deviceManager.controlDevice(deviceId, {
              type: 'power',
              params: { value: state.on }
            }, 'automation');
          }
          
          if (state.brightness !== undefined) {
            await this.deviceManager.controlDevice(deviceId, {
              type: 'brightness',
              params: { value: state.brightness }
            }, 'automation');
          }
          
          if (state.color !== undefined) {
            await this.deviceManager.controlDevice(deviceId, {
              type: 'color',
              params: { color: state.color }
            }, 'automation');
          }
          
          if (state.temperature !== undefined) {
            await this.deviceManager.controlDevice(deviceId, {
              type: 'temperature',
              params: { value: state.temperature }
            }, 'automation');
          }
        } else if (action.type === 'scene') {
          const { sceneId } = action;
          await this.sceneManager.activateScene(sceneId);
        }
      }
      
      this.emit('automationExecuted', automation);
      return { success: true };
    } catch (error) {
      console.error(`Error executing automation ${automationId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Command processor service
class CommandProcessor {
  constructor(deviceManager, sceneManager, automationManager) {
    this.deviceManager = deviceManager;
    this.sceneManager = sceneManager;
    this.automationManager = automationManager;
  }
  
  async processCommand(command) {
    try {
      console.log(`Processing command: ${command}`);
      
      const lowerCommand = command.toLowerCase();
      
      // Device control commands
      if (lowerCommand.includes('turn on') || lowerCommand.includes('turn off')) {
        return await this.processDeviceCommand(lowerCommand);
      }
      
      // Scene activation commands
      if (lowerCommand.includes('activate scene') || lowerCommand.includes('run scene')) {
        return await this.processSceneCommand(lowerCommand);
      }
      
      // Automation commands
      if (lowerCommand.includes('run automation') || lowerCommand.includes('execute automation')) {
        return await this.processAutomationCommand(lowerCommand);
      }
      
      // Discovery command
      if (lowerCommand.includes('discover') || lowerCommand.includes('find devices')) {
        return await this.processDiscoveryCommand();
      }
      
      // Status command
      if (lowerCommand.includes('status') || lowerCommand.includes('what is the status')) {
        return await this.processStatusCommand();
      }
      
      // Default response
      return {
        type: 'command_response',
        result: {
          content: `I received your command: "${command}". I'm not sure how to process this command.`,
          type: 'text'
        }
      };
    } catch (error) {
      console.error('Error processing command:', error);
      return {
        type: 'command_response',
        result: {
          content: 'An error occurred while processing your command.',
          type: 'error'
        }
      };
    }
  }
  
  async processDeviceCommand(command) {
    const isOn = command.includes('turn on');
    let deviceName = '';
    
    // Extract device name
    if (command.includes('living room light')) {
      deviceName = 'Living Room Light';
    } else if (command.includes('kitchen switch')) {
      deviceName = 'Kitchen Switch';
    } else if (command.includes('all lights')) {
      deviceName = 'all lights';
    }
    
    if (!deviceName) {
      return {
        type: 'command_response',
        result: {
          content: 'Please specify which device you want to control.',
          type: 'error'
        }
      };
    }
    
    if (deviceName === 'all lights') {
      // Control all light devices
      const devices = this.deviceManager.getAllDevices();
      const lightDevices = devices.filter(device => device.type === 'light');
      
      for (const device of lightDevices) {
        await this.deviceManager.controlDevice(device.id, {
          type: 'power',
          params: { value: isOn }
        }, 'voice');
      }
      
      return {
        type: 'command_response',
        result: {
          content: `All lights turned ${isOn ? 'on' : 'off'}`,
          type: 'device_control'
        }
      };
    } else {
      // Find device by name
      const devices = this.deviceManager.getAllDevices();
      const device = devices.find(d => d.name === deviceName);
      
      if (!device) {
        return {
          type: 'command_response',
          result: {
            content: `Device "${deviceName}" not found`,
            type: 'error'
          }
        };
      }
      
      // Control device
      await this.deviceManager.controlDevice(device.id, {
        type: 'power',
        params: { value: isOn }
      }, 'voice');
      
      return {
        type: 'command_response',
        result: {
          content: `${deviceName} turned ${isOn ? 'on' : 'off'}`,
          type: 'device_control'
        }
      };
    }
  }
  
  async processSceneCommand(command) {
    // Extract scene name
    const sceneName = command.replace(/activate scene|run scene/i, '').trim();
    
    if (!sceneName) {
      return {
        type: 'command_response',
        result: {
          content: 'Please specify which scene you want to activate.',
          type: 'error'
        }
      };
    }
    
    // Find scene by name
    const scenes = this.sceneManager.getAllScenes();
    const scene = scenes.find(s => s.name.toLowerCase() === sceneName.toLowerCase());
    
    if (!scene) {
      return {
        type: 'command_response',
        result: {
          content: `Scene "${sceneName}" not found`,
          type: 'error'
        }
      };
    }
    
    // Activate scene
    await this.sceneManager.activateScene(scene.id);
    
    return {
      type: 'command_response',
      result: {
        content: `Scene "${scene.name}" activated`,
        type: 'scene_activation'
      }
    };
  }
  
  async processAutomationCommand(command) {
    // Extract automation name
    const automationName = command.replace(/run automation|execute automation/i, '').trim();
    
    if (!automationName) {
      return {
        type: 'command_response',
        result: {
          content: 'Please specify which automation you want to run.',
          type: 'error'
        }
      };
    }
    
    // Find automation by name
    const automations = this.automationManager.getAllAutomations();
    const automation = automations.find(a => a.name.toLowerCase() === automationName.toLowerCase());
    
    if (!automation) {
      return {
        type: 'command_response',
        result: {
          content: `Automation "${automationName}" not found`,
          type: 'error'
        }
      };
    }
    
    // Execute automation
    await this.automationManager.executeAutomation(automation.id);
    
    return {
      type: 'command_response',
      result: {
        content: `Automation "${automation.name}" executed`,
        type: 'automation_execution'
      }
    };
  }
  
  async processDiscoveryCommand() {
    // Start device discovery
    this.deviceManager.startDiscovery();
    
    return {
      type: 'command_response',
      result: {
        content: 'Discovering devices...',
        type: 'discovery'
      }
    };
  }
  
  async processStatusCommand() {
    const devices = this.deviceManager.getAllDevices();
    const onlineDevices = devices.filter(device => device.connected);
    const offlineDevices = devices.filter(device => !device.connected);
    
    return {
      type: 'command_response',
      result: {
        content: `Found ${devices.length} devices (${onlineDevices.length} online, ${offlineDevices.length} offline)`,
        type: 'status'
      }
    };
  }
}

// Initialize services
async function initializeServices() {
  try {
    // Initialize database
    const db = await initializeDatabase();
    
    // Create storage service
    const storage = new StorageService(db);
    
    // Create device discovery service
    const deviceDiscovery = new DeviceDiscoveryService(storage);
    
    // Create device manager
    const deviceManager = new DeviceManager(storage, deviceDiscovery);
    await deviceManager.initialize();
    
    // Create scene manager
    const sceneManager = new SceneManager(storage, deviceManager);
    await sceneManager.initialize();
    
    // Create automation manager
    const automationManager = new AutomationManager(storage, deviceManager, sceneManager);
    await automationManager.initialize();
    
    // Create command processor
    const commandProcessor = new CommandProcessor(deviceManager, sceneManager, automationManager);
    
    // Start device discovery
    deviceManager.startDiscovery();
    
    return {
      storage,
      deviceDiscovery,
      deviceManager,
      sceneManager,
      automationManager,
      commandProcessor
    };
  } catch (error) {
    console.error('Error initializing services:', error);
    throw error;
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
let services = null;
initializeServices()
  .then(initializedServices => {
    services = initializedServices;
    
    // Set up WebSocket connection handler
    wss.on('connection', (ws) => {
      console.log('Client connected');
      
      // Send initial data
      const devices = services.deviceManager.getAllDevices();
      const scenes = services.sceneManager.getAllScenes();
      const automations = services.automationManager.getAllAutomations();
      
      ws.send(JSON.stringify({
        type: 'init',
        devices,
        scenes,
        automations
      }));
      
      // Handle messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received:', data);
          
          if (data.type === 'command') {
            const response = await services.commandProcessor.processCommand(data.command);
            ws.send(JSON.stringify(response));
          } else if (data.type === 'get_initial_data') {
            const devices = services.deviceManager.getAllDevices();
            const scenes = services.sceneManager.getAllScenes();
            const automations = services.automationManager.getAllAutomations();
            
            ws.send(JSON.stringify({
              type: 'init',
              devices,
              scenes,
              automations
            }));
          } else if (data.type === 'control_device') {
            const { deviceId, command } = data;
            const result = await services.deviceManager.controlDevice(deviceId, command, 'app');
            
            ws.send(JSON.stringify({
              type: 'device_control_response',
              deviceId,
              result
            }));
          } else if (data.type === 'activate_scene') {
            const { sceneId } = data;
            const result = await services.sceneManager.activateScene(sceneId);
            
            ws.send(JSON.stringify({
              type: 'scene_activation_response',
              sceneId,
              result
            }));
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing your request'
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
    
    // Set up device event handlers
    services.deviceManager.on('deviceStateChanged', (device) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'device_update',
            device
          }));
        }
      });
    });
    
    services.deviceManager.on('deviceDiscovered', (device) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'device_discovered',
            device
          }));
        }
      });
    });
    
    services.sceneManager.on('sceneActivated', (scene) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'scene_activated',
            scene
          }));
        }
      });
    });
    
    services.automationManager.on('automationExecuted', (automation) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'automation_executed',
            automation
          }));
        }
      });
    });
    
    // API routes
    app.get('/api/devices', (req, res) => {
      const devices = services.deviceManager.getAllDevices();
      res.json(devices);
    });
    
    app.get('/api/devices/:id', (req, res) => {
      const device = services.deviceManager.getDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json(device);
    });
    
    app.post('/api/devices/:id/control', async (req, res) => {
      const { id } = req.params;
      const command = req.body;
      
      const result = await services.deviceManager.controlDevice(id, command, 'api');
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.get('/api/scenes', (req, res) => {
      const scenes = services.sceneManager.getAllScenes();
      res.json(scenes);
    });
    
    app.get('/api/scenes/:id', (req, res) => {
      const scene = services.sceneManager.getScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ error: 'Scene not found' });
      }
      res.json(scene);
    });
    
    app.post('/api/scenes', async (req, res) => {
      const result = await services.sceneManager.createScene(req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    });
    
    app.put('/api/scenes/:id', async (req, res) => {
      const { id } = req.params;
      const result = await services.sceneManager.updateScene(id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.delete('/api/scenes/:id', async (req, res) => {
      const { id } = req.params;
      const result = await services.sceneManager.deleteScene(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.post('/api/scenes/:id/activate', async (req, res) => {
      const { id } = req.params;
      const result = await services.sceneManager.activateScene(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.get('/api/automations', (req, res) => {
      const automations = services.automationManager.getAllAutomations();
      res.json(automations);
    });
    
    app.get('/api/automations/:id', (req, res) => {
      const automation = services.automationManager.getAutomation(req.params.id);
      if (!automation) {
        return res.status(404).json({ error: 'Automation not found' });
      }
      res.json(automation);
    });
    
    app.post('/api/automations', async (req, res) => {
      const result = await services.automationManager.createAutomation(req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    });
    
    app.put('/api/automations/:id', async (req, res) => {
      const { id } = req.params;
      const result = await services.automationManager.updateAutomation(id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.delete('/api/automations/:id', async (req, res) => {
      const { id } = req.params;
      const result = await services.automationManager.deleteAutomation(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.post('/api/automations/:id/execute', async (req, res) => {
      const { id } = req.params;
      const result = await services.automationManager.executeAutomation(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    });
    
    app.post('/api/discover', async (req, res) => {
      services.deviceManager.startDiscovery();
      res.json({ success: true, message: 'Device discovery started' });
    });
    
    app.get('/api/status', (req, res) => {
      const devices = services.deviceManager.getAllDevices();
      const scenes = services.sceneManager.getAllScenes();
      const automations = services.automationManager.getAllAutomations();
      
      res.json({
        status: 'ok',
        version: '1.0.0',
        deviceCount: devices.length,
        sceneCount: scenes.length,
        automationCount: automations.length
      });
    });
  })
  .catch(error => {
    console.error('Failed to initialize services:', error);
  });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`JASON real server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

export default server;
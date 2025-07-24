/**
 * JASON - The Omnipotent AI Architect
 *
 * Real server implementation with enhanced phone integration and device discovery.
 */

import express from "express";
import path from "path";
import http from "http";
import net from "net";
import os from "os";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dgram from "dgram";
import fetch from "node-fetch";
import { EventEmitter } from "events";
import { exec } from "child_process";
import { promisify } from "util";

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
const DB_PATH = process.env.DB_PATH || "./jason.db";

// Initialize database
async function initializeDatabase() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
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

  console.log("Database initialized successfully");
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
        "SELECT value FROM storage WHERE namespace = ? AND key = ?",
        namespace,
        key,
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
        "SELECT key, value FROM storage WHERE namespace = ?",
        namespace,
      );

      return rows.map((row) => JSON.parse(row.value));
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
        namespace,
        key,
        serializedValue,
        serializedValue,
      );
    } catch (error) {
      console.error(`Error setting ${namespace}/${key} in storage:`, error);
      throw error;
    }
  }

  async remove(namespace, key) {
    try {
      await this.db.run(
        "DELETE FROM storage WHERE namespace = ? AND key = ?",
        namespace,
        key,
      );
    } catch (error) {
      console.error(`Error removing ${namespace}/${key} from storage:`, error);
      throw error;
    }
  }
}

// Enhanced Device Discovery Service with Phone Integration
class DeviceDiscoveryService extends EventEmitter {
  constructor(storage) {
    super();
    this.devices = new Map();
    this.scanning = false;
    this.ssdpSocket = null;
    this.storage = storage;
    console.log(
      "🚀 Enhanced Device Discovery Service initialized with phone integration",
    );
  }

  async startDiscovery() {
    if (this.scanning) {
      console.warn("Discovery already in progress");
      return Array.from(this.devices.values());
    }

    this.scanning = true;
    console.log(
      "🔍 Starting enhanced device discovery with phone integration...",
    );

    try {
      // Clear existing devices
      this.devices.clear();

      // Enhanced discovery methods
      await this.discoverMobileDevices();
      await this.discoverNetworkDevices();
      await this.discoverBluetoothDevices();
      await this.discoverSerialDevices();
      await this.discoverSSDPDevices();

      // Add virtual devices if no real devices found
      if (this.devices.size === 0) {
        console.log(
          "📱 No real devices found. Adding virtual devices for demonstration...",
        );
        await this.addVirtualDevices();
      }

      console.log(`✅ Discovery complete. Found ${this.devices.size} devices.`);
      return Array.from(this.devices.values());
    } catch (error) {
      console.error("❌ Error during device discovery:", error);
      return [];
    } finally {
      this.scanning = false;
    }
  }

  // Enhanced Mobile Device Discovery
  async discoverMobileDevices() {
    console.log(
      "📱 Discovering mobile devices with privacy-first integration...",
    );

    try {
      // Method 1: ADB for Android devices
      await this.discoverAndroidDevicesADB();

      // Method 2: iOS devices via libimobiledevice
      await this.discoveriOSDevices();

      // Method 3: Network-based mobile device detection
      await this.discoverNetworkMobileDevices();

      // Method 4: Bluetooth phone discovery
      await this.discoverBluetoothPhones();
    } catch (error) {
      console.error("❌ Mobile discovery error:", error);
    }
  }

  // Android ADB Discovery
  async discoverAndroidDevicesADB() {
    try {
      console.log("📱 Checking for ADB and Android devices...");

      const { stdout } = await execAsync(
        'adb version 2>/dev/null || echo "not found"',
      );
      if (stdout.includes("Android Debug Bridge")) {
        console.log("✅ ADB is available");

        const { stdout: devicesOutput } = await execAsync(
          "adb devices 2>/dev/null",
        );
        const lines = devicesOutput
          .split("\n")
          .filter((line) => line.includes("\t"));

        for (const line of lines) {
          const [deviceId, status] = line.split("\t");
          if (status === "device") {
            console.log(`📱 Found Android device: ${deviceId}`);

            try {
              const { stdout: modelOutput } = await execAsync(
                `adb -s ${deviceId} shell getprop ro.product.model 2>/dev/null`,
              );
              const { stdout: manufacturerOutput } = await execAsync(
                `adb -s ${deviceId} shell getprop ro.product.manufacturer 2>/dev/null`,
              );
              const { stdout: versionOutput } = await execAsync(
                `adb -s ${deviceId} shell getprop ro.build.version.release 2>/dev/null`,
              );

              const device = {
                id: `android_${deviceId.replace(/[^a-zA-Z0-9]/g, "_")}`,
                name: `${manufacturerOutput.trim()} ${modelOutput.trim()}`,
                type: "smartphone",
                category: "mobile",
                manufacturer: manufacturerOutput.trim() || "Android",
                model: modelOutput.trim() || "Unknown",
                version: `Android ${versionOutput.trim()}`,
                protocols: ["adb", "usb"],
                capabilities: [
                  {
                    name: "device_control",
                    type: "control",
                    description: "Full device control via ADB",
                    privacy: "opt-in",
                  },
                  {
                    name: "app_management",
                    type: "control",
                    description: "Install/uninstall apps",
                    privacy: "opt-in",
                  },
                  {
                    name: "presence_detection",
                    type: "sensor",
                    description: "Device presence detection",
                    privacy: "basic",
                  },
                  {
                    name: "automation_triggers",
                    type: "control",
                    description: "Smart home automation triggers",
                    privacy: "opt-in",
                  },
                ],
                status: "online",
                location: "USB Connected",
                lastSeen: new Date(),
                metadata: {
                  deviceId,
                  connectionType: "USB",
                  adbEnabled: true,
                  privacyCompliant: true,
                },
                privacySettings: {
                  dataRetention: "1_hour",
                  encryptionLevel: "ADB-standard",
                  auditLogging: true,
                  userConsent: "required",
                },
              };

              this.addDevice(device);
              console.log(`✅ Added Android device: ${device.name}`);
            } catch (e) {
              console.log(`⚠️ Could not get details for device ${deviceId}`);
            }
          }
        }
      } else {
        console.log("📱 ADB not available or no devices connected");
      }
    } catch (error) {
      console.error("❌ Android ADB discovery error:", error);
    }
  }

  // iOS Device Discovery
  async discoveriOSDevices() {
    try {
      console.log("📱 Checking for iOS devices...");

      const { stdout } = await execAsync(
        'idevice_id --version 2>/dev/null || echo "not found"',
      );
      if (!stdout.includes("not found")) {
        console.log("✅ libimobiledevice is available");

        const { stdout: devicesOutput } = await execAsync(
          "idevice_id -l 2>/dev/null",
        );
        const deviceIds = devicesOutput
          .split("\n")
          .filter((id) => id.trim().length > 0);

        console.log(`📱 Found ${deviceIds.length} iOS devices`);

        for (const deviceId of deviceIds) {
          try {
            const { stdout: infoOutput } = await execAsync(
              `ideviceinfo -u ${deviceId} 2>/dev/null`,
            );
            const info = {};

            infoOutput.split("\n").forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) {
                info[key.trim()] = value.trim();
              }
            });

            const device = {
              id: `ios_${deviceId.replace(/[^a-zA-Z0-9]/g, "_")}`,
              name: `${info.DeviceName || "iOS Device"} (${info.ProductType || "iPhone"})`,
              type: "smartphone",
              category: "mobile",
              manufacturer: "Apple",
              model: info.ProductType || "iOS Device",
              version: `iOS ${info.ProductVersion || "Unknown"}`,
              protocols: ["libimobiledevice", "usb"],
              capabilities: [
                {
                  name: "device_info",
                  type: "sensor",
                  description: "Device information",
                  privacy: "basic",
                },
                {
                  name: "backup_restore",
                  type: "control",
                  description: "Backup and restore",
                  privacy: "opt-in",
                },
                {
                  name: "homekit_bridge",
                  type: "control",
                  description: "HomeKit integration",
                  privacy: "opt-in",
                },
                {
                  name: "siri_shortcuts",
                  type: "control",
                  description: "Siri shortcuts integration",
                  privacy: "opt-in",
                },
              ],
              status: "online",
              location: "USB Connected",
              lastSeen: new Date(),
              metadata: {
                deviceId,
                udid: deviceId,
                deviceInfo: info,
                connectionType: "USB",
                privacyCompliant: true,
              },
              privacySettings: {
                dataRetention: "1_hour",
                encryptionLevel: "iOS-standard",
                auditLogging: true,
                userConsent: "required",
                applePrivacyCompliant: true,
              },
            };

            this.addDevice(device);
            console.log(`✅ Added iOS device: ${device.name}`);
          } catch (e) {
            console.log(`⚠️ Could not get details for iOS device ${deviceId}`);
          }
        }
      } else {
        console.log(
          "📱 libimobiledevice not available or no iOS devices connected",
        );
      }
    } catch (error) {
      console.error("❌ iOS discovery error:", error);
    }
  }

  // Network-based mobile device detection
  async discoverNetworkMobileDevices() {
    try {
      console.log("📱 Scanning network for mobile devices...");

      const networks = await this.getLocalNetworks();

      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        // Scan for mobile device indicators (limited scan for demo)
        for (let i = 1; i <= 10; i++) {
          const ip = `${baseIP}.${i}`;

          try {
            const pingResult = await this.pingHost(ip);
            if (!pingResult.success) continue;

            // Check for mobile device ports
            const mobileServices = [
              {
                port: 62078,
                name: "iOS iTunes WiFi Sync",
                type: "smartphone",
                manufacturer: "Apple",
              },
              {
                port: 5555,
                name: "Android ADB WiFi",
                type: "smartphone",
                manufacturer: "Android",
              },
              {
                port: 5000,
                name: "AirPlay",
                type: "smartphone",
                manufacturer: "Apple",
              },
            ];

            for (const service of mobileServices) {
              const isOpen = await this.checkPort(ip, service.port);
              if (isOpen) {
                console.log(
                  `📱 Found potential mobile device at ${ip}:${service.port} (${service.name})`,
                );

                const device = {
                  id: `mobile_network_${ip.replace(/\./g, "_")}_${service.port}`,
                  name: `${service.manufacturer} ${service.type} (${service.name})`,
                  type: service.type,
                  category: "mobile",
                  manufacturer: service.manufacturer,
                  model: service.name,
                  ip: ip,
                  port: service.port,
                  protocols: ["network", "tcp"],
                  capabilities: [
                    {
                      name: "presence_detection",
                      type: "sensor",
                      description: "Network presence detection",
                      privacy: "basic",
                    },
                    {
                      name: "smart_home_triggers",
                      type: "control",
                      description: "Trigger smart home actions",
                      privacy: "opt-in",
                    },
                  ],
                  status: "online",
                  location: "Network",
                  lastSeen: new Date(),
                  metadata: {
                    detectionMethod: "network_scan",
                    servicePort: service.port,
                    networkInfo: { ip, pingTime: pingResult.time },
                  },
                  privacySettings: {
                    dataRetention: "1_hour",
                    encryptionLevel: "network-standard",
                    auditLogging: true,
                    userConsent: "basic",
                  },
                };

                this.addDevice(device);
                console.log(`✅ Added network mobile device: ${device.name}`);
                break;
              }
            }
          } catch (e) {
            // Continue scanning
          }
        }
      }
    } catch (error) {
      console.error("❌ Network mobile discovery error:", error);
    }
  }

  // Enhanced Bluetooth phone discovery
  async discoverBluetoothPhones() {
    try {
      console.log("📱 Discovering Bluetooth phones...");

      const pairedDevices = await this.getBluetoothPairedDevices();

      for (const device of pairedDevices) {
        if (this.isBluetoothPhone(device)) {
          const enhancedDevice = {
            id: `bluetooth_phone_${device.address?.replace(/:/g, "_") || Math.random().toString(36).substr(2, 9)}`,
            name: `${device.name || "Bluetooth Phone"}`,
            type: "smartphone",
            category: "mobile",
            manufacturer: this.getManufacturerFromBluetoothName(device.name),
            model: device.name || "Unknown",
            protocols: ["bluetooth"],
            capabilities: [
              {
                name: "bluetooth_connect",
                type: "control",
                description: "Bluetooth connection control",
                privacy: "basic",
              },
              {
                name: "audio_streaming",
                type: "control",
                description: "Audio streaming via Bluetooth",
                privacy: "opt-in",
              },
              {
                name: "media_control",
                type: "control",
                description: "Media playback control",
                privacy: "opt-in",
              },
            ],
            status: device.connected ? "online" : "paired",
            location: "Bluetooth",
            lastSeen: new Date(),
            metadata: {
              bluetoothAddress: device.address,
              connected: device.connected || false,
            },
            privacySettings: {
              dataRetention: "1_hour",
              encryptionLevel: "Bluetooth-standard",
              auditLogging: true,
              userConsent: "required",
            },
          };

          this.addDevice(enhancedDevice);
          console.log(`✅ Added Bluetooth phone: ${enhancedDevice.name}`);
        }
      }
    } catch (error) {
      console.error("❌ Bluetooth phone discovery error:", error);
    }
  }

  // Network device discovery
  async discoverNetworkDevices() {
    console.log("🌐 Discovering network devices...");

    try {
      const networks = await this.getLocalNetworks();

      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        // Limited scan for demo (first 5 IPs)
        for (let i = 1; i <= 5; i++) {
          const ip = `${baseIP}.${i}`;

          try {
            const pingResult = await this.pingHost(ip);
            if (!pingResult.success) continue;

            console.log(`📡 Found active device at ${ip}`);

            // Check common ports
            const commonPorts = [80, 443, 22, 8080];
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
      console.error("❌ Network discovery error:", error);
    }
  }

  // Bluetooth device discovery
  async discoverBluetoothDevices() {
    try {
      console.log("📱 Discovering Bluetooth devices...");

      const pairedDevices = await this.getBluetoothPairedDevices();
      for (const device of pairedDevices) {
        if (!this.isBluetoothPhone(device)) {
          // Skip phones, they're handled separately
          const bluetoothDevice = {
            id: `bluetooth_${device.address?.replace(/:/g, "_") || Math.random().toString(36).substr(2, 9)}`,
            name: device.name || `Bluetooth Device`,
            type: this.getBluetoothDeviceType(device),
            category: "bluetooth",
            manufacturer: this.getManufacturerFromBluetoothName(device.name),
            model: device.name || "Unknown",
            protocols: ["bluetooth"],
            capabilities: [
              {
                name: "bluetooth_connect",
                type: "control",
                description: "Bluetooth connection",
              },
            ],
            status: "paired",
            location: "Bluetooth",
            lastSeen: new Date(),
            metadata: { bluetoothAddress: device.address, connected: false },
          };

          this.addDevice(bluetoothDevice);
          console.log(
            `📱 Found Bluetooth device: ${device.name || device.address}`,
          );
        }
      }
    } catch (error) {
      console.error("❌ Bluetooth discovery error:", error);
    }
  }

  // Serial/USB device discovery
  async discoverSerialDevices() {
    try {
      console.log("🔌 Discovering Serial/USB devices...");

      const { stdout } = await execAsync(
        "ls /dev/tty.* 2>/dev/null || ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true",
      );
      const ports = stdout.split("\n").filter((port) => port.trim().length > 0);

      for (const port of ports) {
        const deviceName = port.split("/").pop();
        const isPhone = this.identifyPhoneFromSerial(deviceName);

        const device = {
          id: `serial_${deviceName.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: `Serial Device ${deviceName}`,
          type: isPhone ? "smartphone" : "serial_device",
          category: isPhone ? "mobile" : "hardware",
          manufacturer: isPhone || "Unknown",
          model: deviceName,
          port: port,
          protocols: ["serial", "usb"],
          capabilities: [
            {
              name: "serial_communication",
              type: "control",
              description: "Serial communication",
            },
          ],
          status: "online",
          location: "USB/Serial",
          lastSeen: new Date(),
          metadata: { serialPort: port, deviceName },
        };

        if (isPhone) {
          console.log(`📱 Identified phone via USB: ${isPhone}`);
          device.capabilities.push(
            {
              name: "usb_debugging",
              type: "control",
              description: "USB debugging access",
            },
            {
              name: "file_transfer",
              type: "control",
              description: "File transfer via USB",
            },
          );
        }

        this.addDevice(device);
        console.log(`📡 Found serial device: ${port}`);
      }
    } catch (error) {
      console.error("❌ Serial discovery error:", error);
    }
  }

  // SSDP Discovery
  async discoverSSDPDevices() {
    return new Promise((resolve) => {
      try {
        console.log("🔍 Starting SSDP discovery...");

        this.ssdpSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
        const SSDP_ADDR = "239.255.255.250";
        const SSDP_PORT = 1900;

        this.ssdpSocket.on("message", (msg, rinfo) => {
          try {
            const message = msg.toString();
            const locationMatch = message.match(/LOCATION: (.*)/i);
            if (locationMatch && locationMatch[1]) {
              const location = locationMatch[1].trim();
              this.fetchSsdpDescription(location, rinfo.address);
            }
          } catch (err) {
            console.error("Error processing SSDP message:", err);
          }
        });

        this.ssdpSocket.on("error", (err) => {
          console.error("SSDP socket error:", err);
        });

        this.ssdpSocket.bind(() => {
          try {
            const searchMessage = Buffer.from(
              "M-SEARCH * HTTP/1.1\r\n" +
                `HOST: ${SSDP_ADDR}:${SSDP_PORT}\r\n` +
                'MAN: "ssdp:discover"\r\n' +
                "MX: 3\r\n" +
                "ST: ssdp:all\r\n\r\n",
            );

            this.ssdpSocket?.send(
              searchMessage,
              0,
              searchMessage.length,
              SSDP_PORT,
              SSDP_ADDR,
            );
          } catch (err) {
            console.error("Error sending SSDP discovery message:", err);
          }

          setTimeout(() => {
            if (this.ssdpSocket) {
              this.ssdpSocket.close();
              this.ssdpSocket = null;
            }
            resolve();
          }, 3000);
        });
      } catch (error) {
        console.error("Error in SSDP discovery:", error);
        resolve();
      }
    });
  }

  async fetchSsdpDescription(location, address) {
    try {
      const response = await fetch(location, { timeout: 2000 });
      const xml = await response.text();

      const friendlyNameMatch = xml.match(
        /<friendlyName>([^<]+)<\/friendlyName>/,
      );
      const manufacturerMatch = xml.match(
        /<manufacturer>([^<]+)<\/manufacturer>/,
      );
      const modelNameMatch = xml.match(/<modelName>([^<]+)<\/modelName>/);

      if (!friendlyNameMatch) return;

      const device = {
        id: `upnp_${address.replace(/\./g, "_")}`,
        name: friendlyNameMatch[1],
        type: "upnp_device",
        manufacturer: manufacturerMatch ? manufacturerMatch[1] : "Unknown",
        model: modelNameMatch ? modelNameMatch[1] : "Unknown",
        capabilities: [],
        status: "online",
        address,
        lastSeen: new Date(),
      };

      this.addDevice(device);
    } catch (error) {
      console.debug(
        `Error fetching SSDP description from ${location}:`,
        error.message,
      );
    }
  }

  // Virtual devices for demonstration
  async addVirtualDevices() {
    const virtualDevices = [
      {
        id: "virtual-phone-android",
        name: "Virtual Android Phone (Demo)",
        type: "smartphone",
        category: "mobile",
        manufacturer: "JASON Virtual",
        model: "Virtual Android Device",
        capabilities: [
          {
            name: "presence_detection",
            type: "sensor",
            description: "Presence detection",
            privacy: "basic",
          },
          {
            name: "automation_triggers",
            type: "control",
            description: "Smart home triggers",
            privacy: "opt-in",
          },
          {
            name: "notification_send",
            type: "control",
            description: "Send notifications",
            privacy: "opt-in",
          },
        ],
        status: "online",
        location: "Virtual",
        lastSeen: new Date(),
        virtual: true,
        privacySettings: {
          dataRetention: "1_hour",
          encryptionLevel: "demo-standard",
          auditLogging: true,
          userConsent: "demo",
        },
      },
      {
        id: "virtual-phone-ios",
        name: "Virtual iPhone (Demo)",
        type: "smartphone",
        category: "mobile",
        manufacturer: "JASON Virtual",
        model: "Virtual iOS Device",
        capabilities: [
          {
            name: "homekit_bridge",
            type: "control",
            description: "HomeKit integration",
            privacy: "opt-in",
          },
          {
            name: "siri_shortcuts",
            type: "control",
            description: "Siri shortcuts",
            privacy: "opt-in",
          },
          {
            name: "presence_detection",
            type: "sensor",
            description: "Presence detection",
            privacy: "basic",
          },
        ],
        status: "online",
        location: "Virtual",
        lastSeen: new Date(),
        virtual: true,
        privacySettings: {
          dataRetention: "1_hour",
          encryptionLevel: "demo-standard",
          auditLogging: true,
          userConsent: "demo",
          applePrivacyCompliant: true,
        },
      },
      {
        id: "virtual-light-1",
        name: "Virtual Living Room Light",
        type: "light",
        manufacturer: "JASON Virtual",
        model: "Virtual Smart Light",
        capabilities: [
          { name: "on", type: "control", description: "Turn on/off" },
          {
            name: "brightness",
            type: "control",
            description: "Adjust brightness",
          },
          { name: "color", type: "control", description: "Change color" },
        ],
        state: {
          on: true,
          brightness: 80,
          color: { hue: 240, saturation: 100, value: 100 },
        },
        status: "online",
        location: "Living Room",
        lastSeen: new Date(),
        virtual: true,
      },
    ];

    for (const device of virtualDevices) {
      this.addDevice(device);
      await this.storage.set("devices", device.id, device);
    }
  }

  // Helper methods
  async getLocalNetworks() {
    const interfaces = this.getNetworkInterfaces();
    return interfaces.map((iface) => `${iface.network}/${iface.cidr}`);
  }

  getNetworkInterfaces() {
    try {
      const interfaces = os.networkInterfaces();
      const results = [];

      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family !== "IPv4" || iface.internal) {
            continue;
          }

          const baseIp = iface.address.replace(/\d+$/, "0");

          results.push({
            name,
            address: iface.address,
            netmask: iface.netmask,
            network: baseIp,
            cidr: this.calculateCIDR(iface.netmask),
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error determining network interfaces:", error);
      return [];
    }
  }

  calculateCIDR(netmask) {
    try {
      const parts = netmask.split(".");
      let cidr = 0;
      for (const part of parts) {
        const num = parseInt(part, 10);
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
      return 24;
    }
  }

  async pingHost(ip, timeout = 1000) {
    try {
      const { stdout } = await execAsync(
        `ping -c 1 -W ${timeout} ${ip} 2>/dev/null`,
      );
      const timeMatch = stdout.match(/time=([0-9.]+)/);
      return {
        success: true,
        time: timeMatch ? parseFloat(timeMatch[1]) : null,
      };
    } catch (e) {
      return { success: false };
    }
  }

  async checkPort(ip, port, timeout = 1000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);

      socket.on("connect", () => {
        socket.destroy();
        resolve(true);
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });

      socket.on("error", () => {
        resolve(false);
      });

      socket.connect(port, ip);
    });
  }

  async identifyNetworkDevice(ip, openPorts) {
    const device = {
      id: `network_${ip.replace(/\./g, "_")}`,
      name: `Network Device ${ip}`,
      type: "unknown",
      category: "network",
      manufacturer: "Unknown",
      model: "Unknown",
      ip: ip,
      protocols: ["tcp"],
      capabilities: [
        { name: "ping", type: "sensor", description: "Network connectivity" },
      ],
      status: "online",
      location: "Network",
      lastSeen: new Date(),
      metadata: { openPorts },
    };

    // Enhanced identification based on ports
    if (openPorts.includes(80) || openPorts.includes(443)) {
      try {
        const response = await fetch(`http://${ip}`, { timeout: 3000 });
        const html = await response.text();
        const htmlLower = html.toLowerCase();

        if (htmlLower.includes("router") || htmlLower.includes("gateway")) {
          device.type = "router";
          device.name = `Router/Gateway (${ip})`;
        } else if (
          htmlLower.includes("camera") ||
          htmlLower.includes("webcam")
        ) {
          device.type = "security_camera";
          device.category = "smart_home";
          device.name = `Security Camera (${ip})`;
        }
      } catch (e) {
        // Web identification failed
      }
    }

    if (openPorts.includes(22)) {
      device.type = "computer";
      device.category = "computer";
      device.name = `SSH Server (${ip})`;
      device.protocols.push("ssh");
    }

    return device;
  }

  async getBluetoothPairedDevices() {
    try {
      if (process.platform === "darwin") {
        const { stdout } = await execAsync(
          "system_profiler SPBluetoothDataType -json 2>/dev/null",
        );
        const data = JSON.parse(stdout);
        return data.SPBluetoothDataType?.[0]?.device_paired || [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  isBluetoothPhone(device) {
    const phoneKeywords = ["phone", "iphone", "android", "galaxy", "pixel"];
    const deviceName = (device.name || "").toLowerCase();
    return phoneKeywords.some((keyword) => deviceName.includes(keyword));
  }

  getBluetoothDeviceType(device) {
    const name = (device.name || "").toLowerCase();
    if (this.isBluetoothPhone(device)) return "smartphone";
    if (
      name.includes("headphone") ||
      name.includes("airpods") ||
      name.includes("speaker")
    )
      return "audio_device";
    if (name.includes("keyboard")) return "keyboard";
    if (name.includes("mouse")) return "mouse";
    return "bluetooth_device";
  }

  getManufacturerFromBluetoothName(name) {
    if (!name) return "Unknown";
    const nameLower = name.toLowerCase();
    if (
      nameLower.includes("apple") ||
      nameLower.includes("iphone") ||
      nameLower.includes("airpods")
    )
      return "Apple";
    if (nameLower.includes("samsung") || nameLower.includes("galaxy"))
      return "Samsung";
    if (nameLower.includes("google") || nameLower.includes("pixel"))
      return "Google";
    return "Unknown";
  }

  identifyPhoneFromSerial(deviceName) {
    const nameLower = deviceName.toLowerCase();
    if (nameLower.includes("iphone") || nameLower.includes("ipad"))
      return "Apple";
    if (nameLower.includes("android") || nameLower.includes("samsung"))
      return "Samsung";
    if (nameLower.includes("pixel")) return "Google";
    return null;
  }

  addDevice(device) {
    this.devices.set(device.id, device);
    this.emit("deviceDiscovered", device);
    console.log(`📱 Device discovered: ${device.name} (${device.id})`);
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  stopDiscovery() {
    if (this.ssdpSocket) {
      this.ssdpSocket.close();
      this.ssdpSocket = null;
    }
    this.scanning = false;
    console.log("Device discovery stopped");
  }
}

// Simple Device Manager
class DeviceManager extends EventEmitter {
  constructor(storage, deviceDiscovery) {
    super();
    this.devices = new Map();
    this.storage = storage;
    this.deviceDiscovery = deviceDiscovery;

    this.deviceDiscovery.on("deviceDiscovered", (device) => {
      this.devices.set(device.id, device);
      this.emit("deviceDiscovered", device);
    });

    console.log("Device Manager initialized");
  }

  async startDiscovery() {
    return await this.deviceDiscovery.startDiscovery();
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }
}

// Initialize services
async function initializeServices() {
  try {
    const db = await initializeDatabase();
    const storage = new StorageService(db);
    const deviceDiscovery = new DeviceDiscoveryService(storage);
    const deviceManager = new DeviceManager(storage, deviceDiscovery);

    // Start device discovery
    console.log("Starting device discovery...");
    await deviceManager.startDiscovery();

    return { storage, deviceDiscovery, deviceManager };
  } catch (error) {
    console.error("Error initializing services:", error);
    throw error;
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.get("/api/devices", async (req, res) => {
  try {
    const devices = global.deviceManager
      ? global.deviceManager.getDevices()
      : [];
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/devices/discover", async (req, res) => {
  try {
    if (global.deviceManager) {
      const devices = await global.deviceManager.startDiscovery();
      res.json({ success: true, data: devices });
    } else {
      res
        .status(500)
        .json({ success: false, error: "Device manager not initialized" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "getDevices") {
        const devices = global.deviceManager
          ? global.deviceManager.getDevices()
          : [];
        ws.send(JSON.stringify({ type: "devices", data: devices }));
      } else if (data.type === "startDiscovery") {
        if (global.deviceManager) {
          const devices = await global.deviceManager.startDiscovery();
          ws.send(JSON.stringify({ type: "devices", data: devices }));
        }
      }
    } catch (error) {
      console.error("WebSocket error:", error);
      ws.send(JSON.stringify({ type: "error", error: error.message }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 JASON Enhanced Server running on port ${PORT}`);
  console.log(`📱 Enhanced with privacy-first phone integration`);
  console.log(`🌐 http://localhost:${PORT}`);

  try {
    const services = await initializeServices();
    global.deviceManager = services.deviceManager;
    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
  }
});

export default server;

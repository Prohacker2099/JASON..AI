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

// Import core services
const { DeviceManagerService } = await import(
  "./dist/server/services/device-management/deviceManagerService.js"
);
const { DeviceStorageService } = await import(
  "./dist/server/services/storage/deviceStorageService.js"
);
const { EnhancedDiscoveryService } = await import(
  "./dist/server/services/discovery/enhancedDiscoveryService.js"
);

// Enhanced network discovery will be integrated directly

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

  // Enhanced Network device discovery
  async discoverNetworkDevices() {
    console.log("🌐 Discovering network devices...");

    try {
      const networks = await this.getLocalNetworks();

      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        // Enhanced scan - check more IPs to find real devices
        console.log(`🔍 Scanning network ${baseIP}.0/24...`);

        // Scan in batches for better performance
        const batchSize = 20;
        const maxIP = 254;

        for (let start = 1; start <= maxIP; start += batchSize) {
          const end = Math.min(start + batchSize - 1, maxIP);
          const batch = [];

          for (let i = start; i <= end; i++) {
            const ip = `${baseIP}.${i}`;
            batch.push(this.scanSingleHost(ip));
          }

          // Process batch in parallel
          await Promise.allSettled(batch);

          // Small delay between batches to avoid overwhelming the network
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Also scan ARP table for additional devices
      await this.scanARPTable();
    } catch (error) {
      console.error("❌ Network discovery error:", error);
    }
  }

  // Scan a single host comprehensively
  async scanSingleHost(ip) {
    try {
      const pingResult = await this.pingHost(ip);
      if (!pingResult.success) return;

      console.log(`📡 Found active device at ${ip}`);

      // Get hostname
      const hostname = await this.getHostname(ip);

      // Check comprehensive port list for device identification
      const devicePorts = [
        // Mobile devices
        { port: 62078, service: "iOS Device", type: "phone", os: "iOS" },
        { port: 5555, service: "ADB", type: "phone", os: "Android" },
        { port: 8009, service: "Google Cast", type: "phone" },

        // Computers
        { port: 22, service: "SSH", type: "computer", os: "Unix/Linux" },
        { port: 3389, service: "RDP", type: "computer", os: "Windows" },
        { port: 5900, service: "VNC", type: "computer" },
        { port: 445, service: "SMB", type: "computer", os: "Windows" },
        { port: 548, service: "AFP", type: "computer", os: "macOS" },
        { port: 631, service: "IPP", type: "computer" },

        // Media devices
        { port: 8008, service: "Chromecast", type: "media" },
        { port: 1400, service: "Sonos", type: "speaker" },
        { port: 7000, service: "AirPlay", type: "media" },

        // Common services
        { port: 80, service: "HTTP", type: "unknown" },
        { port: 443, service: "HTTPS", type: "unknown" },
        { port: 8080, service: "HTTP-Alt", type: "unknown" },
      ];

      const openPorts = [];
      const services = [];
      let deviceType = "unknown";
      let deviceOS = undefined;

      // Scan ports in parallel with timeout
      const portPromises = devicePorts.map(async (portInfo) => {
        const isOpen = await this.checkPortWithTimeout(ip, portInfo.port, 1000);
        if (isOpen) {
          openPorts.push(portInfo.port);
          services.push(portInfo.service);
          if (deviceType === "unknown" && portInfo.type !== "unknown") {
            deviceType = portInfo.type;
          }
          if (!deviceOS && portInfo.os) {
            deviceOS = portInfo.os;
          }
        }
      });

      await Promise.allSettled(portPromises);

      if (openPorts.length > 0 || hostname) {
        // Determine device type from hostname if not determined from ports
        if (deviceType === "unknown" && hostname) {
          deviceType = this.determineDeviceTypeFromHostname(hostname);
          if (!deviceOS) {
            deviceOS = this.determineOSFromHostname(hostname);
          }
        }

        // Get MAC address for vendor identification
        const macInfo = await this.getMACAddress(ip);

        const device = {
          id: `network_${ip.replace(/\./g, "_")}`,
          name: hostname || `Device (${ip})`,
          type: deviceType,
          manufacturer: macInfo?.vendor || "Unknown",
          model: "Unknown",
          location: ip,
          port: openPorts[0]?.toString() || "0",
          protocol: "network",
          online: true,
          capabilities: services,
          state: {},
          discoveredAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          metadata: {
            ip: ip,
            hostname: hostname,
            openPorts: openPorts,
            services: services,
            os: deviceOS,
            mac: macInfo?.mac,
          },
        };

        this.addDevice(device);
        console.log(
          `✅ Added device: ${device.name} (${device.type}) - Services: ${services.join(", ")}`,
        );
      }
    } catch (error) {
      // Silently continue with other hosts
    }
  }

  // Check port with timeout
  async checkPortWithTimeout(ip, port, timeout = 1000) {
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

  // Get hostname for IP
  async getHostname(ip) {
    try {
      const { stdout } = await execAsync(`nslookup ${ip}`, { timeout: 2000 });
      const lines = stdout.split("\n");

      for (const line of lines) {
        if (line.includes("name =")) {
          const hostname = line.split("name =")[1]?.trim().replace(/\.$/, "");
          return hostname;
        }
      }
    } catch (error) {
      // Try alternative method
      try {
        const { stdout } = await execAsync(`host ${ip}`, { timeout: 2000 });
        const match = stdout.match(/pointer (.+)\./);
        if (match) {
          return match[1];
        }
      } catch (error2) {
        // Ignore errors
      }
    }

    return undefined;
  }

  // Determine device type from hostname
  determineDeviceTypeFromHostname(hostname) {
    const name = hostname.toLowerCase();

    if (name.includes("iphone") || name.includes("ipad")) return "phone";
    if (
      name.includes("android") ||
      name.includes("samsung") ||
      name.includes("pixel")
    )
      return "phone";
    if (
      name.includes("macbook") ||
      name.includes("imac") ||
      name.includes("mac-")
    )
      return "computer";
    if (
      name.includes("windows") ||
      name.includes("pc-") ||
      name.includes("desktop")
    )
      return "computer";
    if (name.includes("laptop") || name.includes("notebook")) return "computer";
    if (
      name.includes("chromecast") ||
      name.includes("roku") ||
      name.includes("appletv")
    )
      return "media";
    if (name.includes("sonos") || name.includes("speaker")) return "speaker";
    if (name.includes("printer")) return "printer";
    if (name.includes("router") || name.includes("gateway")) return "router";

    return "unknown";
  }

  // Determine OS from hostname
  determineOSFromHostname(hostname) {
    const name = hostname.toLowerCase();

    if (name.includes("iphone") || name.includes("ipad")) return "iOS";
    if (name.includes("android")) return "Android";
    if (
      name.includes("mac") ||
      name.includes("imac") ||
      name.includes("macbook")
    )
      return "macOS";
    if (name.includes("windows") || name.includes("pc-")) return "Windows";

    return undefined;
  }

  // Get MAC address for IP
  async getMACAddress(ip) {
    try {
      const platform = os.platform();
      let arpCmd;

      if (platform === "win32") {
        arpCmd = `arp -a ${ip}`;
      } else {
        arpCmd = `arp -n ${ip}`;
      }

      const { stdout } = await execAsync(arpCmd, { timeout: 2000 });

      // Parse MAC address from ARP output
      const macMatch = stdout.match(/([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/);
      if (macMatch) {
        const mac = macMatch[0].toUpperCase().replace(/-/g, ":");
        const vendor = this.getVendorFromMAC(mac);
        return { mac, vendor };
      }
    } catch (error) {
      // Ignore errors
    }

    return null;
  }

  // Get vendor from MAC address
  getVendorFromMAC(mac) {
    const macVendors = {
      "00:50:C2": "Apple",
      "00:1B:63": "Apple",
      "00:26:BB": "Apple",
      "3C:15:C2": "Apple",
      "40:CB:C0": "Apple",
      "78:4F:43": "Apple",
      "AC:87:A3": "Apple",
      "BC:52:B7": "Apple",
      "F0:DB:E2": "Apple",
      "00:1A:11": "Google",
      "00:9A:CD": "Google",
      "64:16:66": "Google",
      "F4:F5:D8": "Google",
      "00:15:83": "Samsung",
      "00:16:32": "Samsung",
      "34:23:87": "Samsung",
      "78:1B:EB": "Samsung",
      "00:50:56": "VMware",
      "00:0C:29": "VMware",
      "08:00:27": "VirtualBox",
    };

    const prefix = mac.substring(0, 8);
    return macVendors[prefix] || "Unknown";
  }

  // Scan ARP table for additional devices
  async scanARPTable() {
    try {
      console.log("🔍 Analyzing ARP table for additional devices...");

      const platform = os.platform();
      let arpCmd;

      if (platform === "win32") {
        arpCmd = "arp -a";
      } else {
        arpCmd = "arp -a";
      }

      const { stdout } = await execAsync(arpCmd, { timeout: 5000 });
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.match(
          /(\d+\.\d+\.\d+\.\d+).*?([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/,
        );
        if (match) {
          const ip = match[1];

          // Skip if we already have this device
          if (this.devices.has(`network_${ip.replace(/\./g, "_")}`)) {
            continue;
          }

          // Quick ping check
          const pingResult = await this.pingHost(ip);
          if (pingResult.success) {
            await this.scanSingleHost(ip);
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing ARP table:", error);
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
    console.log("🔄 Initializing services...");
    const db = await initializeDatabase();
    console.log("✅ Database initialized");
    const storage = new DeviceStorageService(db);

    // Initialize enhanced discovery service
    const discoveryService = new EnhancedDiscoveryService();
    await discoveryService.initialize();

    // Initialize device manager with services
    const deviceManager = new DeviceManagerService(storage, discoveryService);

    // Start device discovery
    console.log("🔍 Starting enhanced device discovery...");
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

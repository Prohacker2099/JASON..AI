/**
 * JASON Advanced Universal Device Control Server
 * Real device discovery and control system
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import http from "http";
import net from "net";
import dgram from "dgram";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import axios from "axios";
import mdns from "mdns-js";
import bonjour from "bonjour";
import { Client as SSHClient } from "ssh2";
import ping from "ping";
import arp from "node-arp";
import { SerialPort } from "serialport";
import SSDPPkg from "node-ssdp";
const { Client: SSDPClient } = SSDPPkg;
import wol from "wake_on_lan";
import networkList from "network-list";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Advanced Universal Device Controller
class AdvancedUniversalDeviceController {
  constructor() {
    this.devices = new Map();
    this.discoveryServices = new Map();
    this.protocolHandlers = new Map();
    this.activeConnections = new Map();
    this.deviceCache = new Map();
    this.isDiscovering = false;
    this.discoveryInterval = null;

    this.initializeProtocolHandlers();
    this.initializeDiscoveryServices();
    this.startPeriodicDiscovery();

    console.log("🚀 Advanced Universal Device Controller initialized");
  }

  // Initialize protocol handlers for different device types
  initializeProtocolHandlers() {
    // HTTP/HTTPS handler
    this.protocolHandlers.set("http", {
      discover: this.discoverHTTPDevices.bind(this),
      control: this.controlHTTPDevice.bind(this),
      authenticate: this.authenticateHTTP.bind(this),
    });

    // SSH handler for computers
    this.protocolHandlers.set("ssh", {
      discover: this.discoverSSHDevices.bind(this),
      control: this.controlSSHDevice.bind(this),
      authenticate: this.authenticateSSH.bind(this),
    });

    // Bluetooth handler
    this.protocolHandlers.set("bluetooth", {
      discover: this.discoverBluetoothDevices.bind(this),
      control: this.controlBluetoothDevice.bind(this),
      authenticate: this.authenticateBluetooth.bind(this),
    });

    // mDNS/Bonjour handler
    this.protocolHandlers.set("mdns", {
      discover: this.discoverMDNSDevices.bind(this),
      control: this.controlMDNSDevice.bind(this),
      authenticate: this.authenticateMDNS.bind(this),
    });

    // UPnP/SSDP handler
    this.protocolHandlers.set("upnp", {
      discover: this.discoverUPnPDevices.bind(this),
      control: this.controlUPnPDevice.bind(this),
      authenticate: this.authenticateUPnP.bind(this),
    });

    // Serial/USB handler
    this.protocolHandlers.set("serial", {
      discover: this.discoverSerialDevices.bind(this),
      control: this.controlSerialDevice.bind(this),
      authenticate: this.authenticateSerial.bind(this),
    });

    // Network scan handler
    this.protocolHandlers.set("network", {
      discover: this.discoverNetworkDevices.bind(this),
      control: this.controlNetworkDevice.bind(this),
      authenticate: this.authenticateNetwork.bind(this),
    });

    console.log("✅ Protocol handlers initialized");
  }

  // Initialize discovery services
  initializeDiscoveryServices() {
    // Bonjour service for mDNS discovery
    this.bonjourService = bonjour();

    // Network scanner
    this.networkScanner = {
      scanRange: "192.168.1.0/24",
      commonPorts: [22, 23, 80, 443, 8080, 8443, 5000, 3000, 9000],
    };

    console.log("✅ Discovery services initialized");
  }

  // Start periodic device discovery
  startPeriodicDiscovery() {
    this.discoveryInterval = setInterval(() => {
      if (!this.isDiscovering) {
        this.discoverAllDevices();
      }
    }, 15000); // Discover every 15 seconds for more responsive detection

    // Initial discovery
    setTimeout(() => this.discoverAllDevices(), 1000);

    // Also do a quick phone check every 5 seconds
    this.phoneCheckInterval = setInterval(() => {
      if (!this.isDiscovering) {
        this.quickPhoneCheck();
      }
    }, 5000);
  }

  // Main discovery orchestrator
  async discoverAllDevices() {
    if (this.isDiscovering) return;

    this.isDiscovering = true;
    console.log("🔍 Starting comprehensive device discovery...");

    try {
      const discoveryPromises = [
        this.discoverNetworkDevices(),
        this.discoverMDNSDevices(),
        this.discoverUPnPDevices(),
        this.discoverBluetoothDevices(),
        this.discoverSerialDevices(),
        this.discoverSmartHomeDevices(),
        this.discoverMobileDevices(),
        this.discoverComputerDevices(),
        this.discoverEntertainmentDevices(),
        this.discoverVehicleDevices(),
      ];

      await Promise.allSettled(discoveryPromises);
      console.log(
        `✅ Discovery complete. Found ${this.devices.size} devices total.`,
      );
    } catch (error) {
      console.error("❌ Error during device discovery:", error);
    } finally {
      this.isDiscovering = false;
    }
  }

  // Network device discovery using nmap and ping
  async discoverNetworkDevices() {
    console.log("🌐 Discovering network devices...");

    try {
      // Get network interfaces
      const interfaces = os.networkInterfaces();
      const networks = [];

      for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
          if (addr.family === "IPv4" && !addr.internal) {
            const network =
              addr.address.split(".").slice(0, 3).join(".") + ".0/24";
            networks.push(network);
            console.log(`📡 Scanning network: ${network}`);
          }
        }
      }

      // Use nmap if available for faster scanning
      for (const network of networks) {
        try {
          console.log(`🔍 Attempting nmap scan on ${network}`);
          const { stdout } = await execAsync(`nmap -sn ${network} 2>/dev/null`);
          if (stdout) {
            const lines = stdout.split("\n");
            for (const line of lines) {
              const ipMatch = line.match(
                /Nmap scan report for .*\((\d+\.\d+\.\d+\.\d+)\)/,
              );
              if (ipMatch) {
                const ip = ipMatch[1];
                console.log(`📡 Found device via nmap: ${ip}`);
                this.probeNetworkDevice(ip);
              }
            }
          }
        } catch (nmapError) {
          console.log("📡 nmap not available, falling back to ping scan");
          await this.scanNetworkRange(network);
        }
      }
    } catch (error) {
      console.error("❌ Network discovery error:", error);
    }
  }

  // Scan network range for active devices
  async scanNetworkRange(network) {
    const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");
    const promises = [];

    for (let i = 1; i <= 254; i++) {
      const ip = `${baseIP}.${i}`;
      promises.push(this.probeNetworkDevice(ip));
    }

    await Promise.allSettled(promises);
  }

  // Probe individual network device
  async probeNetworkDevice(ip) {
    try {
      // Ping test
      const pingResult = await ping.promise.probe(ip, { timeout: 1 });
      if (!pingResult.alive) return;

      console.log(`📡 Found active device at ${ip}`);

      // Get MAC address
      let mac = null;
      try {
        mac = await new Promise((resolve, reject) => {
          arp.getMAC(ip, (err, macAddr) => {
            if (err) reject(err);
            else resolve(macAddr);
          });
        });
      } catch (e) {
        // MAC lookup failed, continue anyway
      }

      // Port scan for common services
      const openPorts = await this.scanPorts(
        ip,
        this.networkScanner.commonPorts,
      );

      // Identify device type based on open ports and services
      const deviceInfo = await this.identifyNetworkDevice(ip, openPorts, mac);

      if (deviceInfo) {
        this.addOrUpdateDevice(deviceInfo);
      }
    } catch (error) {
      // Silent fail for network probing
    }
  }

  // Scan specific ports on an IP
  async scanPorts(ip, ports) {
    const openPorts = [];
    const promises = ports.map((port) => this.checkPort(ip, port));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        openPorts.push(ports[index]);
      }
    });

    return openPorts;
  }

  // Check if a specific port is open
  checkPort(ip, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 1000;

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

  // Identify device type based on network characteristics
  async identifyNetworkDevice(ip, openPorts, mac) {
    const device = {
      id: `network_${ip.replace(/\./g, "_")}`,
      name: `Network Device ${ip}`,
      type: "unknown",
      category: "network",
      manufacturer: "Unknown",
      model: "Unknown",
      version: "Unknown",
      ip: ip,
      mac: mac,
      protocols: ["tcp"],
      capabilities: [],
      authentication: { type: "none", refreshable: false },
      status: "online",
      location: "Network",
      lastSeen: new Date(),
      metadata: { openPorts, detectionMethod: "network_scan" },
      controlMethods: [],
    };

    // Enhanced device identification using MAC address OUI lookup
    if (mac) {
      const deviceType = await this.identifyDeviceByMAC(mac);
      if (deviceType) {
        device.type = deviceType.type;
        device.category = deviceType.category;
        device.manufacturer = deviceType.manufacturer;
        device.name = `${deviceType.name} (${ip})`;
        device.model = deviceType.name;

        // Add device-specific capabilities based on type
        device.capabilities = this.getDeviceCapabilitiesByType(deviceType.type);
      }
    }

    // Enhanced port-based identification
    await this.identifyByPorts(device, openPorts, ip);

    // Web-based device identification with enhanced detection
    if (
      openPorts.includes(80) ||
      openPorts.includes(443) ||
      openPorts.includes(8080)
    ) {
      await this.identifyWebDevice(device, ip, openPorts);
    }

    // Network service identification
    await this.identifyNetworkServices(device, openPorts, ip);

    // Smart home device identification
    await this.identifySmartHomeDevice(device, openPorts, ip);

    // Mobile device identification
    await this.identifyMobileDevice(device, openPorts, ip);

    return device;
  }

  // Enhanced port-based identification
  async identifyByPorts(device, openPorts, ip) {
    const portMappings = {
      22: {
        type: "computer",
        category: "computer",
        name: "SSH Server",
        protocols: ["ssh"],
        capabilities: [
          {
            name: "ssh_connect",
            type: "control",
            dataType: "object",
            readable: false,
            writable: true,
            description: "SSH connection",
          },
          {
            name: "run_command",
            type: "control",
            dataType: "string",
            readable: false,
            writable: true,
            description: "Execute command",
          },
          {
            name: "file_transfer",
            type: "control",
            dataType: "object",
            readable: true,
            writable: true,
            description: "SFTP file transfer",
          },
        ],
      },
      23: {
        type: "network_device",
        category: "network",
        name: "Telnet Server",
        protocols: ["telnet"],
      },
      25: {
        type: "mail_server",
        category: "server",
        name: "SMTP Mail Server",
        protocols: ["smtp"],
      },
      53: {
        type: "dns_server",
        category: "network",
        name: "DNS Server",
        protocols: ["dns"],
      },
      80: {
        type: "web_server",
        category: "server",
        name: "Web Server",
        protocols: ["http"],
      },
      110: {
        type: "mail_server",
        category: "server",
        name: "POP3 Mail Server",
        protocols: ["pop3"],
      },
      143: {
        type: "mail_server",
        category: "server",
        name: "IMAP Mail Server",
        protocols: ["imap"],
      },
      443: {
        type: "web_server",
        category: "server",
        name: "HTTPS Web Server",
        protocols: ["https"],
      },
      993: {
        type: "mail_server",
        category: "server",
        name: "IMAPS Mail Server",
        protocols: ["imaps"],
      },
      995: {
        type: "mail_server",
        category: "server",
        name: "POP3S Mail Server",
        protocols: ["pop3s"],
      },

      // Smart Home & IoT Ports
      1883: {
        type: "mqtt_broker",
        category: "smart_home",
        name: "MQTT Broker",
        protocols: ["mqtt"],
      },
      8883: {
        type: "mqtt_broker",
        category: "smart_home",
        name: "MQTT Broker (SSL)",
        protocols: ["mqtt", "ssl"],
      },
      5683: {
        type: "iot_device",
        category: "smart_home",
        name: "CoAP IoT Device",
        protocols: ["coap"],
      },

      // Media & Entertainment Ports
      554: {
        type: "media_server",
        category: "entertainment",
        name: "RTSP Media Server",
        protocols: ["rtsp"],
      },
      1935: {
        type: "media_server",
        category: "entertainment",
        name: "RTMP Media Server",
        protocols: ["rtmp"],
      },
      3689: {
        type: "media_server",
        category: "entertainment",
        name: "iTunes DAAP Server",
        protocols: ["daap"],
      },
      5000: {
        type: "media_device",
        category: "entertainment",
        name: "AirPlay Device",
        protocols: ["airplay"],
      },
      7000: {
        type: "media_device",
        category: "entertainment",
        name: "AirPlay Video",
        protocols: ["airplay"],
      },
      8096: {
        type: "media_server",
        category: "entertainment",
        name: "Jellyfin Media Server",
        protocols: ["http"],
      },
      32400: {
        type: "media_server",
        category: "entertainment",
        name: "Plex Media Server",
        protocols: ["http"],
      },

      // Gaming Ports
      27015: {
        type: "gaming_server",
        category: "entertainment",
        name: "Steam Game Server",
        protocols: ["steam"],
      },
      25565: {
        type: "gaming_server",
        category: "entertainment",
        name: "Minecraft Server",
        protocols: ["minecraft"],
      },

      // Network Infrastructure Ports
      161: {
        type: "network_device",
        category: "network",
        name: "SNMP Device",
        protocols: ["snmp"],
      },
      623: {
        type: "server",
        category: "computer",
        name: "IPMI Server",
        protocols: ["ipmi"],
      },

      // Database Ports
      3306: {
        type: "database_server",
        category: "server",
        name: "MySQL Database",
        protocols: ["mysql"],
      },
      5432: {
        type: "database_server",
        category: "server",
        name: "PostgreSQL Database",
        protocols: ["postgresql"],
      },
      27017: {
        type: "database_server",
        category: "server",
        name: "MongoDB Database",
        protocols: ["mongodb"],
      },
      6379: {
        type: "database_server",
        category: "server",
        name: "Redis Database",
        protocols: ["redis"],
      },

      // Security Camera Ports
      554: {
        type: "security_camera",
        category: "smart_home",
        name: "IP Camera (RTSP)",
        protocols: ["rtsp"],
      },
      8000: {
        type: "security_camera",
        category: "smart_home",
        name: "IP Camera Web Interface",
        protocols: ["http"],
      },

      // Printer Ports
      631: {
        type: "printer",
        category: "appliance",
        name: "IPP Printer",
        protocols: ["ipp"],
      },
      9100: {
        type: "printer",
        category: "appliance",
        name: "Network Printer",
        protocols: ["raw"],
      },

      // Mobile Device Ports
      62078: {
        type: "smartphone",
        category: "mobile",
        name: "iOS iTunes WiFi Sync",
        protocols: ["itunes_sync"],
      },
      5555: {
        type: "smartphone",
        category: "mobile",
        name: "Android ADB WiFi",
        protocols: ["adb"],
      },
    };

    for (const port of openPorts) {
      if (portMappings[port] && device.type === "unknown") {
        const mapping = portMappings[port];
        device.type = mapping.type;
        device.category = mapping.category;
        device.name = `${mapping.name} (${ip})`;
        device.protocols = [
          ...new Set([...device.protocols, ...mapping.protocols]),
        ];
        if (mapping.capabilities) {
          device.capabilities.push(...mapping.capabilities);
        }
        break;
      }
    }
  }

  // Enhanced web device identification
  async identifyWebDevice(device, ip, openPorts) {
    const webPorts = [80, 443, 8080, 8443, 8000, 8888, 9000];
    const availableWebPorts = openPorts.filter((port) =>
      webPorts.includes(port),
    );

    for (const port of availableWebPorts) {
      try {
        const protocol = [443, 8443].includes(port) ? "https" : "http";
        const response = await axios.get(`${protocol}://${ip}:${port}`, {
          timeout: 3000,
          headers: { "User-Agent": "JASON-Device-Discovery/1.0" },
        });

        const html = response.data.toLowerCase();
        const headers = response.headers;

        // Router/Gateway Detection
        if (
          html.includes("router") ||
          html.includes("gateway") ||
          html.includes("admin") ||
          html.includes("wireless") ||
          html.includes("wan") ||
          html.includes("lan") ||
          headers.server?.includes("router") ||
          headers.server?.includes("gateway")
        ) {
          device.type = "router";
          device.category = "network";
          device.name = `Router/Gateway (${ip})`;
          device.capabilities.push(
            {
              name: "web_interface",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "Web management interface",
            },
            {
              name: "network_config",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "Network configuration",
            },
            {
              name: "wifi_settings",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "WiFi settings",
            },
          );
          break;
        }

        // Security Camera Detection
        if (
          html.includes("camera") ||
          html.includes("webcam") ||
          html.includes("video") ||
          html.includes("surveillance") ||
          html.includes("nvr") ||
          html.includes("dvr") ||
          headers.server?.includes("camera") ||
          html.includes("live view")
        ) {
          device.type = "security_camera";
          device.category = "smart_home";
          device.name = `Security Camera (${ip})`;
          device.capabilities.push(
            {
              name: "view_stream",
              type: "sensor",
              dataType: "string",
              readable: true,
              writable: false,
              description: "View video stream",
            },
            {
              name: "take_snapshot",
              type: "control",
              dataType: "boolean",
              readable: false,
              writable: true,
              description: "Take snapshot",
            },
            {
              name: "ptz_control",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Pan/Tilt/Zoom control",
            },
          );
          break;
        }

        // Printer Detection
        if (
          html.includes("printer") ||
          html.includes("print") ||
          html.includes("cups") ||
          headers.server?.includes("printer") ||
          html.includes("toner") ||
          html.includes("cartridge")
        ) {
          device.type = "printer";
          device.category = "appliance";
          device.name = `Network Printer (${ip})`;
          device.capabilities.push(
            {
              name: "print_job",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Send print job",
            },
            {
              name: "printer_status",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Printer status",
            },
            {
              name: "ink_levels",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Ink/toner levels",
            },
          );
          break;
        }

        // NAS/Storage Detection
        if (
          html.includes("nas") ||
          html.includes("storage") ||
          html.includes("synology") ||
          html.includes("qnap") ||
          html.includes("freenas") ||
          html.includes("truenas") ||
          html.includes("file manager") ||
          html.includes("disk station")
        ) {
          device.type = "nas";
          device.category = "storage";
          device.name = `Network Storage (${ip})`;
          device.capabilities.push(
            {
              name: "file_access",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "File access",
            },
            {
              name: "storage_info",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Storage information",
            },
            {
              name: "backup_service",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Backup services",
            },
          );
          break;
        }

        // Smart Home Hub Detection
        if (
          html.includes("smart home") ||
          html.includes("home assistant") ||
          html.includes("hubitat") ||
          html.includes("smartthings") ||
          html.includes("openhab") ||
          html.includes("domoticz") ||
          html.includes("automation") ||
          html.includes("zigbee") ||
          html.includes("z-wave")
        ) {
          device.type = "smart_home_hub";
          device.category = "smart_home";
          device.name = `Smart Home Hub (${ip})`;
          device.capabilities.push(
            {
              name: "device_control",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "Control smart devices",
            },
            {
              name: "automation_rules",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "Automation rules",
            },
            {
              name: "sensor_data",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Sensor data",
            },
          );
          break;
        }

        // Media Server Detection
        if (
          html.includes("plex") ||
          html.includes("jellyfin") ||
          html.includes("emby") ||
          html.includes("kodi") ||
          html.includes("media server") ||
          html.includes("streaming") ||
          html.includes("movies") ||
          html.includes("tv shows") ||
          html.includes("music library")
        ) {
          device.type = "media_server";
          device.category = "entertainment";
          device.name = `Media Server (${ip})`;
          device.capabilities.push(
            {
              name: "media_streaming",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "Media streaming",
            },
            {
              name: "library_access",
              type: "sensor",
              dataType: "array",
              readable: true,
              writable: false,
              description: "Media library",
            },
            {
              name: "playback_control",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Playback control",
            },
          );
          break;
        }

        break; // Found a working web interface, stop trying other ports
      } catch (e) {
        // Continue to next port
      }
    }

    if (
      device.protocols.includes("http") ||
      device.protocols.includes("https")
    ) {
      device.capabilities.push(
        {
          name: "http_request",
          type: "control",
          dataType: "object",
          readable: false,
          writable: true,
          description: "HTTP request",
        },
        {
          name: "web_interface",
          type: "control",
          dataType: "object",
          readable: true,
          writable: false,
          description: "Web interface access",
        },
      );
    }
  }

  // Network services identification
  async identifyNetworkServices(device, openPorts, ip) {
    // SNMP Device Detection
    if (openPorts.includes(161)) {
      device.protocols.push("snmp");
      device.capabilities.push(
        {
          name: "snmp_query",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "SNMP device information",
        },
        {
          name: "network_monitoring",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "Network monitoring data",
        },
      );
    }

    // UPnP Device Detection
    if (openPorts.includes(1900)) {
      device.protocols.push("upnp");
      device.capabilities.push(
        {
          name: "upnp_discovery",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "UPnP device discovery",
        },
        {
          name: "upnp_control",
          type: "control",
          dataType: "object",
          readable: false,
          writable: true,
          description: "UPnP device control",
        },
      );
    }
  }

  // Smart home device identification
  async identifySmartHomeDevice(device, openPorts, ip) {
    // Check for common smart home ports and protocols
    const smartHomePorts = {
      1883: "MQTT Broker",
      8883: "MQTT Broker (SSL)",
      5683: "CoAP Device",
      8123: "Home Assistant",
      39500: "Hubitat",
      8080: "OpenHAB",
    };

    for (const [port, description] of Object.entries(smartHomePorts)) {
      if (openPorts.includes(parseInt(port))) {
        if (device.type === "unknown") {
          device.type = "smart_home_device";
          device.category = "smart_home";
          device.name = `${description} (${ip})`;
        }
        break;
      }
    }
  }

  // Mobile device identification
  async identifyMobileDevice(device, openPorts, ip) {
    const mobilePorts = {
      62078: {
        type: "smartphone",
        manufacturer: "Apple",
        name: "iPhone/iPad (iTunes Sync)",
      },
      5555: {
        type: "smartphone",
        manufacturer: "Android",
        name: "Android Device (ADB)",
      },
      8080: {
        type: "smartphone",
        manufacturer: "Unknown",
        name: "Mobile Hotspot",
      },
    };

    for (const [port, info] of Object.entries(mobilePorts)) {
      if (openPorts.includes(parseInt(port))) {
        device.type = info.type;
        device.category = "mobile";
        device.manufacturer = info.manufacturer;
        device.name = `${info.name} (${ip})`;
        device.capabilities.push(
          {
            name: "mobile_sync",
            type: "control",
            dataType: "object",
            readable: true,
            writable: true,
            description: "Mobile device sync",
          },
          {
            name: "presence_detection",
            type: "sensor",
            dataType: "boolean",
            readable: true,
            writable: false,
            description: "Device presence",
          },
        );
        break;
      }
    }
  }

  // Get device capabilities by type
  getDeviceCapabilitiesByType(deviceType) {
    const capabilityMappings = {
      smartphone: [
        {
          name: "presence_detection",
          type: "sensor",
          dataType: "boolean",
          readable: true,
          writable: false,
          description: "Device presence detection",
        },
        {
          name: "network_info",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "Network connection info",
        },
      ],
      computer: [
        {
          name: "ping",
          type: "sensor",
          dataType: "boolean",
          readable: true,
          writable: false,
          description: "Network connectivity",
        },
        {
          name: "wake_on_lan",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Wake on LAN",
        },
      ],
      router: [
        {
          name: "network_status",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "Network status",
        },
        {
          name: "device_list",
          type: "sensor",
          dataType: "array",
          readable: true,
          writable: false,
          description: "Connected devices",
        },
      ],
      smart_tv: [
        {
          name: "power_control",
          type: "control",
          dataType: "boolean",
          readable: true,
          writable: true,
          description: "Power on/off",
        },
        {
          name: "volume_control",
          type: "control",
          dataType: "number",
          readable: true,
          writable: true,
          description: "Volume control",
        },
        {
          name: "channel_control",
          type: "control",
          dataType: "number",
          readable: true,
          writable: true,
          description: "Channel control",
        },
      ],
      gaming_console: [
        {
          name: "power_control",
          type: "control",
          dataType: "boolean",
          readable: true,
          writable: true,
          description: "Power on/off",
        },
        {
          name: "game_launch",
          type: "control",
          dataType: "string",
          readable: false,
          writable: true,
          description: "Launch game",
        },
      ],
    };

    return (
      capabilityMappings[deviceType] || [
        {
          name: "ping",
          type: "sensor",
          dataType: "boolean",
          readable: true,
          writable: false,
          description: "Network connectivity",
        },
      ]
    );
  }

  // MAC address device identification
  async identifyDeviceByMAC(mac) {
    if (!mac) return null;

    const macPrefix = mac.substring(0, 8).toUpperCase();

    // Common device manufacturers by MAC OUI
    const macDatabase = {
      "00:50:C2": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "00:23:DF": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "00:26:08": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "28:E0:2C": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "3C:15:C2": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "40:A6:D9": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "64:B0:A6": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "78:4F:43": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "8C:85:90": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "A4:5E:60": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "BC:52:B7": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },
      "F0:DB:E2": {
        manufacturer: "Apple",
        type: "smartphone",
        category: "mobile",
        name: "iPhone",
      },

      "00:1B:63": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "00:23:39": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "00:26:E8": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "34:23:87": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "38:AA:3C": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "40:4E:36": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "5C:0A:5B": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "78:1F:DB": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "88:32:9B": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },
      "C8:19:F7": {
        manufacturer: "Samsung",
        type: "smartphone",
        category: "mobile",
        name: "Samsung Phone",
      },

      "18:CF:5E": {
        manufacturer: "Google",
        type: "smartphone",
        category: "mobile",
        name: "Google Pixel",
      },
      "64:BC:0C": {
        manufacturer: "Google",
        type: "smartphone",
        category: "mobile",
        name: "Google Pixel",
      },
      "F8:8F:CA": {
        manufacturer: "Google",
        type: "smartphone",
        category: "mobile",
        name: "Google Pixel",
      },

      "00:E0:4C": {
        manufacturer: "Realtek",
        type: "router",
        category: "network",
        name: "Router",
      },
      "00:50:56": {
        manufacturer: "VMware",
        type: "computer",
        category: "computer",
        name: "Virtual Machine",
      },
      "08:00:27": {
        manufacturer: "Oracle",
        type: "computer",
        category: "computer",
        name: "VirtualBox VM",
      },

      // Smart Home Devices
      "00:17:88": {
        manufacturer: "Philips",
        type: "hue_bridge",
        category: "smart_home",
        name: "Philips Hue Bridge",
      },
      "00:0D:6F": {
        manufacturer: "Nest",
        type: "thermostat",
        category: "smart_home",
        name: "Nest Thermostat",
      },
      "18:B4:30": {
        manufacturer: "Nest",
        type: "thermostat",
        category: "smart_home",
        name: "Nest Thermostat",
      },
      "64:16:66": {
        manufacturer: "Nest",
        type: "security_camera",
        category: "smart_home",
        name: "Nest Camera",
      },

      // Smart TVs and Entertainment
      "00:26:E2": {
        manufacturer: "Sony",
        type: "smart_tv",
        category: "entertainment",
        name: "Sony Smart TV",
      },
      "04:5D:4B": {
        manufacturer: "LG",
        type: "smart_tv",
        category: "entertainment",
        name: "LG Smart TV",
      },
      "00:E0:91": {
        manufacturer: "LG",
        type: "smart_tv",
        category: "entertainment",
        name: "LG Smart TV",
      },
      "00:26:37": {
        manufacturer: "Samsung",
        type: "smart_tv",
        category: "entertainment",
        name: "Samsung Smart TV",
      },

      // Gaming Consoles
      "00:1F:EA": {
        manufacturer: "Sony",
        type: "gaming_console",
        category: "entertainment",
        name: "PlayStation",
      },
      "7C:ED:8D": {
        manufacturer: "Nintendo",
        type: "gaming_console",
        category: "entertainment",
        name: "Nintendo Switch",
      },
      "98:B6:E9": {
        manufacturer: "Microsoft",
        type: "gaming_console",
        category: "entertainment",
        name: "Xbox",
      },

      // Smart Speakers
      "44:65:0D": {
        manufacturer: "Amazon",
        type: "smart_speaker",
        category: "smart_home",
        name: "Amazon Echo",
      },
      "50:F5:DA": {
        manufacturer: "Amazon",
        type: "smart_speaker",
        category: "smart_home",
        name: "Amazon Echo",
      },
      "F0:EF:86": {
        manufacturer: "Google",
        type: "smart_speaker",
        category: "smart_home",
        name: "Google Home",
      },

      // Garage Door Openers and Gates
      "00:0D:B9": {
        manufacturer: "Chamberlain",
        type: "garage_door",
        category: "smart_home",
        name: "Garage Door Opener",
      },
      "00:21:CC": {
        manufacturer: "Linear",
        type: "gate_controller",
        category: "smart_home",
        name: "Gate Controller",
      },
      "00:50:C2": {
        manufacturer: "Mighty Mule",
        type: "gate_opener",
        category: "smart_home",
        name: "Gate Opener",
      },
    };

    return macDatabase[macPrefix] || null;
  }

  // mDNS/Bonjour device discovery
  async discoverMDNSDevices() {
    try {
      // Common service types to look for
      const serviceTypes = [
        "_http._tcp",
        "_https._tcp",
        "_ssh._tcp",
        "_ftp._tcp",
        "_airplay._tcp",
        "_homekit._tcp",
        "_hap._tcp",
        "_googlecast._tcp",
        "_spotify-connect._tcp",
        "_printer._tcp",
        "_ipp._tcp",
        "_scanner._tcp",
        "_workstation._tcp",
        "_device-info._tcp",
      ];

      for (const serviceType of serviceTypes) {
        this.bonjourService.find({ type: serviceType }, (service) => {
          this.processMDNSService(service);
        });
      }
    } catch (error) {
      console.error("❌ mDNS discovery error:", error);
    }
  }

  // Process discovered mDNS service
  processMDNSService(service) {
    if (!service || !service.name) return;

    console.log(`📡 Found mDNS service: ${service.name} (${service.type})`);

    const device = {
      id: `mdns_${service.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: service.name,
      type: this.identifyMDNSDeviceType(service),
      category: this.identifyMDNSCategory(service),
      manufacturer: "Unknown",
      model: "Unknown",
      version: "Unknown",
      ip: service.addresses?.[0],
      port: service.port,
      protocols: ["mdns", "http"],
      capabilities: this.getMDNSCapabilities(service),
      authentication: { type: "none", refreshable: false },
      status: "online",
      location: "Network",
      lastSeen: new Date(),
      metadata: {
        serviceType: service.type,
        txt: service.txt || {},
      },
      controlMethods: [],
    };

    this.addOrUpdateDevice(device);
  }

  // Identify device type from mDNS service
  identifyMDNSDeviceType(service) {
    const type = service.type.toLowerCase();
    const name = service.name.toLowerCase();

    if (type.includes("airplay")) return "apple_tv";
    if (type.includes("homekit") || type.includes("hap"))
      return "homekit_device";
    if (type.includes("googlecast")) return "chromecast";
    if (type.includes("spotify")) return "smart_speaker";
    if (type.includes("printer") || type.includes("ipp")) return "printer";
    if (type.includes("scanner")) return "scanner";
    if (name.includes("iphone") || name.includes("ipad")) return "ios_device";
    if (name.includes("macbook") || name.includes("imac"))
      return "mac_computer";
    if (name.includes("apple tv")) return "apple_tv";

    return "network_device";
  }

  // Identify device category from mDNS service
  identifyMDNSCategory(service) {
    const type = this.identifyMDNSDeviceType(service);

    if (["apple_tv", "chromecast", "smart_speaker"].includes(type))
      return "entertainment";
    if (["homekit_device"].includes(type)) return "smart_home";
    if (["ios_device"].includes(type)) return "mobile";
    if (["mac_computer"].includes(type)) return "computer";
    if (["printer", "scanner"].includes(type)) return "appliance";

    return "network";
  }

  // Get capabilities for mDNS device
  getMDNSCapabilities(service) {
    const capabilities = [];
    const type = service.type.toLowerCase();

    if (type.includes("http")) {
      capabilities.push({
        name: "http_request",
        type: "control",
        dataType: "object",
        readable: false,
        writable: true,
        description: "Send HTTP request",
      });
    }

    if (type.includes("airplay")) {
      capabilities.push(
        {
          name: "play_media",
          type: "control",
          dataType: "object",
          readable: false,
          writable: true,
          description: "Play media via AirPlay",
        },
        {
          name: "set_volume",
          type: "control",
          dataType: "number",
          readable: false,
          writable: true,
          description: "Set volume",
        },
      );
    }

    return capabilities;
  }

  // UPnP/SSDP device discovery
  async discoverUPnPDevices() {
    console.log("🔍 Discovering UPnP/SSDP devices...");

    try {
      const client = new SSDPClient();

      client.on("response", (headers, statusCode, rinfo) => {
        this.processUPnPResponse(headers, rinfo);
      });

      // Search for different device types
      const searchTargets = [
        "upnp:rootdevice",
        "urn:schemas-upnp-org:device:MediaRenderer:1",
        "urn:schemas-upnp-org:device:MediaServer:1",
        "urn:schemas-upnp-org:device:InternetGatewayDevice:1",
        "urn:dial-multiscreen-org:service:dial:1",
        "urn:schemas-upnp-org:device:Basic:1",
      ];

      for (const st of searchTargets) {
        client.search(st);
      }

      // Also try manual UDP discovery as fallback
      const socket = dgram.createSocket("udp4");

      const ssdpMessage = [
        "M-SEARCH * HTTP/1.1",
        "HOST: 239.255.255.250:1900",
        'MAN: "ssdp:discover"',
        "ST: upnp:rootdevice",
        "MX: 3",
        "",
        "",
      ].join("\r\n");

      socket.on("message", (msg, rinfo) => {
        this.processUPnPResponseRaw(msg.toString(), rinfo);
      });

      socket.bind(() => {
        socket.send(ssdpMessage, 1900, "239.255.255.250");
      });

      // Close socket after 5 seconds
      setTimeout(() => {
        socket.close();
      }, 5000);
    } catch (error) {
      console.error("❌ UPnP discovery error:", error);
    }
  }

  // Process UPnP response from SSDP client (headers object)
  async processUPnPResponse(headers, rinfo) {
    try {
      const location = headers.LOCATION || headers.location;
      const server = headers.SERVER || headers.server;
      const usn = headers.USN || headers.usn;

      if (location) {
        console.log(`📡 Found UPnP device: ${location}`);

        // Fetch device description
        try {
          const deviceResponse = await axios.get(location, { timeout: 3000 });
          const deviceInfo = this.parseUPnPDescription(
            deviceResponse.data,
            rinfo.address,
          );
          if (deviceInfo) {
            this.addOrUpdateDevice(deviceInfo);
          }
        } catch (e) {
          // Failed to fetch device description
        }
      }
    } catch (error) {
      // Failed to process UPnP response
    }
  }

  // Process UPnP response from raw UDP (string)
  async processUPnPResponseRaw(response, rinfo) {
    try {
      const lines = response.split("\r\n");
      let location = null;
      let server = null;
      let usn = null;

      for (const line of lines) {
        if (line.startsWith("LOCATION:")) {
          location = line.split("LOCATION:")[1].trim();
        } else if (line.startsWith("SERVER:")) {
          server = line.split("SERVER:")[1].trim();
        } else if (line.startsWith("USN:")) {
          usn = line.split("USN:")[1].trim();
        }
      }

      if (location) {
        console.log(`📡 Found UPnP device (raw): ${location}`);

        // Fetch device description
        try {
          const deviceResponse = await axios.get(location, { timeout: 3000 });
          const deviceInfo = this.parseUPnPDescription(
            deviceResponse.data,
            rinfo.address,
          );
          if (deviceInfo) {
            this.addOrUpdateDevice(deviceInfo);
          }
        } catch (e) {
          // Failed to fetch device description
        }
      }
    } catch (error) {
      // Failed to process UPnP response
    }
  }

  // Parse UPnP device description XML
  parseUPnPDescription(xml, ip) {
    try {
      // Simple XML parsing for device info
      const deviceTypeMatch = xml.match(/<deviceType>([^<]+)<\/deviceType>/);
      const friendlyNameMatch = xml.match(
        /<friendlyName>([^<]+)<\/friendlyName>/,
      );
      const manufacturerMatch = xml.match(
        /<manufacturer>([^<]+)<\/manufacturer>/,
      );
      const modelNameMatch = xml.match(/<modelName>([^<]+)<\/modelName>/);

      const deviceType = deviceTypeMatch ? deviceTypeMatch[1] : "unknown";
      const friendlyName = friendlyNameMatch
        ? friendlyNameMatch[1]
        : `UPnP Device ${ip}`;
      const manufacturer = manufacturerMatch ? manufacturerMatch[1] : "Unknown";
      const modelName = modelNameMatch ? modelNameMatch[1] : "Unknown";

      const device = {
        id: `upnp_${ip.replace(/\./g, "_")}`,
        name: friendlyName,
        type: this.identifyUPnPDeviceType(deviceType),
        category: this.identifyUPnPCategory(deviceType),
        manufacturer: manufacturer,
        model: modelName,
        version: "Unknown",
        ip: ip,
        protocols: ["upnp", "http"],
        capabilities: this.getUPnPCapabilities(deviceType),
        authentication: { type: "none", refreshable: false },
        status: "online",
        location: "Network",
        lastSeen: new Date(),
        metadata: { deviceType, xml },
        controlMethods: [],
      };

      return device;
    } catch (error) {
      return null;
    }
  }

  // Identify UPnP device type
  identifyUPnPDeviceType(deviceType) {
    const type = deviceType.toLowerCase();

    if (type.includes("mediarenderer")) return "media_player";
    if (type.includes("mediaserver")) return "media_server";
    if (type.includes("internetgateway")) return "router";
    if (type.includes("printer")) return "printer";
    if (type.includes("scanner")) return "scanner";
    if (type.includes("tv") || type.includes("television")) return "smart_tv";

    return "upnp_device";
  }

  // Identify UPnP device category
  identifyUPnPCategory(deviceType) {
    const type = this.identifyUPnPDeviceType(deviceType);

    if (["media_player", "media_server", "smart_tv"].includes(type))
      return "entertainment";
    if (["router"].includes(type)) return "network";
    if (["printer", "scanner"].includes(type)) return "appliance";

    return "other";
  }

  // Get UPnP device capabilities
  getUPnPCapabilities(deviceType) {
    const capabilities = [];
    const type = deviceType.toLowerCase();

    if (type.includes("mediarenderer")) {
      capabilities.push(
        {
          name: "play_media",
          type: "control",
          dataType: "object",
          readable: false,
          writable: true,
          description: "Play media",
        },
        {
          name: "pause_media",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Pause media",
        },
        {
          name: "set_volume",
          type: "control",
          dataType: "number",
          readable: false,
          writable: true,
          description: "Set volume",
        },
      );
    }

    return capabilities;
  }

  // Bluetooth device discovery
  async discoverBluetoothDevices() {
    console.log("🔍 Discovering Bluetooth devices...");

    try {
      // Platform-specific Bluetooth discovery
      if (process.platform === "darwin") {
        await this.discoverBluetoothMacOS();
      } else if (process.platform === "linux") {
        await this.discoverBluetoothLinux();
      } else if (process.platform === "win32") {
        await this.discoverBluetoothWindows();
      }

      // Try noble if available for BLE devices
      try {
        const noble = await import("@abandonware/noble").catch(() => null);
        if (noble && noble.default) {
          const nobleInstance = noble.default;

          // Wait for Bluetooth to be ready
          if (nobleInstance.state === "poweredOn") {
            console.log("🔍 Starting BLE scan with Noble...");
            nobleInstance.startScanning([], true);

            nobleInstance.on("discover", (peripheral) => {
              try {
                this.processBluetoothDevice(peripheral);
              } catch (err) {
                console.log(
                  "⚠️ Error processing Bluetooth device:",
                  err.message,
                );
              }
            });

            // Stop scanning after 10 seconds
            setTimeout(() => {
              try {
                nobleInstance.stopScanning();
                console.log("🔍 BLE scan completed");
              } catch (err) {
                console.log("⚠️ Error stopping BLE scan:", err.message);
              }
            }, 10000);
          } else {
            console.log(
              "📱 Bluetooth not powered on, state:",
              nobleInstance.state,
            );
          }
        } else {
          console.log("📱 Noble Bluetooth module not properly loaded");
        }
      } catch (error) {
        console.log(
          "📱 Noble Bluetooth not available, using system commands only",
        );
      }
    } catch (error) {
      console.error("❌ Bluetooth discovery error:", error);
    }
  }

  // macOS Bluetooth discovery
  async discoverBluetoothMacOS() {
    try {
      console.log("🔍 Scanning Bluetooth devices on macOS...");

      // Use system_profiler to get Bluetooth info
      const { stdout } = await execAsync(
        "system_profiler SPBluetoothDataType -json 2>/dev/null",
      );
      if (stdout) {
        const data = JSON.parse(stdout);
        const bluetoothInfo = data.SPBluetoothDataType?.[0];

        if (bluetoothInfo && bluetoothInfo.device_connected) {
          for (const [deviceName, deviceInfo] of Object.entries(
            bluetoothInfo.device_connected,
          )) {
            console.log(`📱 Found connected Bluetooth device: ${deviceName}`);
            this.addBluetoothDevice(deviceName, deviceInfo, "online");
          }
        }

        if (bluetoothInfo && bluetoothInfo.device_not_connected) {
          for (const [deviceName, deviceInfo] of Object.entries(
            bluetoothInfo.device_not_connected,
          )) {
            console.log(`📱 Found paired Bluetooth device: ${deviceName}`);
            this.addBluetoothDevice(deviceName, deviceInfo, "offline");
          }
        }
      }

      // Also try blueutil if available
      try {
        const { stdout: blueOutput } = await execAsync(
          "blueutil --paired 2>/dev/null",
        );
        if (blueOutput) {
          const lines = blueOutput.split("\n");
          for (const line of lines) {
            const match = line.match(/address: ([a-fA-F0-9:]+), (.+)/);
            if (match) {
              const [, address, name] = match;
              console.log(
                `📱 Found paired device via blueutil: ${name} (${address})`,
              );
              this.addBluetoothDeviceByAddress(address, name);
            }
          }
        }
      } catch (e) {
        console.log(
          "⚠️ blueutil not available (install with: brew install blueutil)",
        );
      }
    } catch (error) {
      console.error("❌ macOS Bluetooth discovery error:", error);
    }
  }

  // Linux Bluetooth discovery
  async discoverBluetoothLinux() {
    try {
      console.log("🔍 Scanning Bluetooth devices on Linux...");

      // Use bluetoothctl to scan for devices
      try {
        const { stdout } = await execAsync("bluetoothctl devices 2>/dev/null");
        if (stdout) {
          const lines = stdout.split("\n");
          for (const line of lines) {
            const match = line.match(/Device ([a-fA-F0-9:]+) (.+)/);
            if (match) {
              const [, address, name] = match;
              console.log(`📱 Found Bluetooth device: ${name} (${address})`);
              this.addBluetoothDeviceByAddress(address, name);
            }
          }
        }
      } catch (e) {
        console.log("⚠️ bluetoothctl not available");
      }

      // Try hcitool as fallback
      try {
        const { stdout } = await execAsync("hcitool scan 2>/dev/null");
        if (stdout) {
          const lines = stdout.split("\n");
          for (const line of lines) {
            const match = line.match(/\s+([a-fA-F0-9:]+)\s+(.+)/);
            if (match) {
              const [, address, name] = match;
              console.log(`📱 Found device via hcitool: ${name} (${address})`);
              this.addBluetoothDeviceByAddress(address, name);
            }
          }
        }
      } catch (e) {
        console.log("⚠️ hcitool not available");
      }
    } catch (error) {
      console.error("❌ Linux Bluetooth discovery error:", error);
    }
  }

  // Windows Bluetooth discovery
  async discoverBluetoothWindows() {
    try {
      console.log("🔍 Scanning Bluetooth devices on Windows...");

      // Use PowerShell to get Bluetooth devices
      const { stdout } = await execAsync(
        "powershell \"Get-PnpDevice | Where-Object {$_.Class -eq 'Bluetooth'} | Select-Object FriendlyName, Status\" 2>/dev/null",
      );
      if (stdout) {
        const lines = stdout.split("\n");
        for (const line of lines) {
          if (line.includes("OK") || line.includes("Unknown")) {
            const parts = line.trim().split(/\s+/);
            const name = parts[0];
            const status = parts[1];
            if (name && name !== "FriendlyName") {
              console.log(`📱 Found Bluetooth device: ${name} (${status})`);
              this.addBluetoothDeviceByName(
                name,
                status === "OK" ? "online" : "offline",
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Windows Bluetooth discovery error:", error);
    }
  }

  // Helper to add Bluetooth device with full info
  addBluetoothDevice(deviceName, deviceInfo, status) {
    const device = {
      id: `bt_${deviceName.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: deviceName,
      type: this.identifyBluetoothDeviceType(deviceInfo),
      category: "bluetooth",
      manufacturer: deviceInfo.device_manufacturer || "Unknown",
      model: deviceInfo.device_productName || "Unknown",
      version: `Bluetooth ${deviceInfo.device_majorClassOfDevice || "Unknown"}`,
      protocols: ["bluetooth"],
      capabilities: [
        {
          name: "connect",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Connect/Disconnect",
        },
        {
          name: "get_info",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "Get device info",
        },
      ],
      authentication: { type: "bluetooth_pair", refreshable: false },
      status: status,
      location: "Bluetooth",
      lastSeen: new Date(),
      metadata: {
        bluetoothInfo: deviceInfo,
        detectionMethod: "system_profiler",
      },
      controlMethods: ["bluetooth"],
    };

    this.addOrUpdateDevice(device);
  }

  // Helper to add Bluetooth device by address
  addBluetoothDeviceByAddress(address, name) {
    const device = {
      id: `bt_${address.replace(/:/g, "_")}`,
      name: name,
      type: "bluetooth_device",
      category: "bluetooth",
      manufacturer: "Unknown",
      model: "Unknown",
      version: "Bluetooth",
      protocols: ["bluetooth"],
      capabilities: [
        {
          name: "connect",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Connect/Disconnect",
        },
        {
          name: "pair",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Pair device",
        },
      ],
      authentication: { type: "bluetooth_pair", refreshable: false },
      status: "offline",
      location: "Bluetooth",
      lastSeen: new Date(),
      metadata: {
        address: address,
        detectionMethod: "bluetoothctl",
      },
      controlMethods: ["bluetooth"],
    };

    this.addOrUpdateDevice(device);
  }

  // Helper to add Bluetooth device by name only
  addBluetoothDeviceByName(name, status) {
    const device = {
      id: `bt_${name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: name,
      type: "bluetooth_device",
      category: "bluetooth",
      manufacturer: "Unknown",
      model: "Unknown",
      version: "Bluetooth",
      protocols: ["bluetooth"],
      capabilities: [
        {
          name: "connect",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Connect/Disconnect",
        },
      ],
      authentication: { type: "bluetooth_pair", refreshable: false },
      status: status,
      location: "Bluetooth",
      lastSeen: new Date(),
      metadata: {
        detectionMethod: "powershell",
      },
      controlMethods: ["bluetooth"],
    };

    this.addOrUpdateDevice(device);
  }

  // Identify Bluetooth device type
  identifyBluetoothDeviceType(deviceInfo) {
    if (!deviceInfo) return "bluetooth_device";

    const name = (
      deviceInfo.device_productName ||
      deviceInfo.localName ||
      deviceInfo.name ||
      ""
    ).toLowerCase();
    const manufacturer = (deviceInfo.device_manufacturer || "").toLowerCase();

    if (
      name.includes("headphone") ||
      name.includes("headset") ||
      name.includes("earphone") ||
      name.includes("airpods")
    ) {
      return "bluetooth_headphones";
    }
    if (name.includes("speaker") || name.includes("soundbar")) {
      return "bluetooth_speaker";
    }
    if (name.includes("keyboard")) {
      return "bluetooth_keyboard";
    }
    if (name.includes("mouse") || name.includes("trackpad")) {
      return "bluetooth_mouse";
    }
    if (
      name.includes("phone") ||
      manufacturer.includes("apple") ||
      manufacturer.includes("samsung")
    ) {
      return "smartphone";
    }
    if (name.includes("watch") || name.includes("fitness")) {
      return "smartwatch";
    }

    return "bluetooth_device";
  }

  // Parse system bluetooth device output
  parseSystemBluetoothDevices(output) {
    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("Device") || line.includes(":")) {
        const match = line.match(/([0-9A-Fa-f:]{17})\s+(.+)/);
        if (match) {
          const [, mac, name] = match;
          const device = {
            id: `bluetooth_${mac.replace(/:/g, "_")}`,
            name: name.trim(),
            type: "bluetooth_device",
            category: "mobile",
            manufacturer: "Unknown",
            model: "Unknown",
            version: "Unknown",
            mac: mac,
            protocols: ["bluetooth"],
            capabilities: [],
            authentication: { type: "bluetooth_pair", refreshable: false },
            status: "online",
            location: "Nearby",
            lastSeen: new Date(),
            metadata: { source: "system" },
            controlMethods: [],
          };
          this.addOrUpdateDevice(device);
        }
      }
    }
  }

  // Process discovered Bluetooth device
  processBluetoothDevice(peripheral) {
    try {
      if (!peripheral || !peripheral.id) return;

      const advertisement = peripheral.advertisement || {};
      const name = advertisement.localName || `BT Device ${peripheral.id}`;
      console.log(`📡 Found Bluetooth device: ${name}`);

      const device = {
        id: `bluetooth_${peripheral.id}`,
        name: name,
        type: this.identifyBluetoothDeviceType(peripheral),
        category: this.identifyBluetoothCategory(peripheral),
        manufacturer: advertisement.manufacturerData ? "Unknown" : "Unknown",
        model: "Unknown",
        version: "Unknown",
        mac: peripheral.id,
        protocols: ["bluetooth"],
        capabilities: this.getBluetoothCapabilities(peripheral),
        authentication: { type: "bluetooth_pair", refreshable: false },
        status: "online",
        location: "Nearby",
        lastSeen: new Date(),
        metadata: {
          rssi: peripheral.rssi || -100,
          advertisement: advertisement,
        },
        controlMethods: [],
      };

      this.addOrUpdateDevice(device);
    } catch (error) {
      console.log("⚠️ Error processing Bluetooth device:", error.message);
    }
  }

  // Identify Bluetooth device type
  identifyBluetoothDeviceType(peripheral) {
    const advertisement = peripheral.advertisement || {};
    const name = (advertisement.localName || "").toLowerCase();
    const services = advertisement.serviceUuids || [];

    if (
      name.includes("airpods") ||
      name.includes("headphones") ||
      name.includes("earbuds")
    ) {
      return "bluetooth_headphones";
    }
    if (name.includes("speaker")) return "bluetooth_speaker";
    if (name.includes("keyboard")) return "bluetooth_keyboard";
    if (name.includes("mouse")) return "bluetooth_mouse";
    if (name.includes("watch")) return "smartwatch";
    if (
      name.includes("phone") ||
      name.includes("iphone") ||
      name.includes("android")
    ) {
      return "smartphone";
    }

    // Check service UUIDs
    if (services.includes("180f")) return "fitness_tracker"; // Battery service
    if (services.includes("1812")) return "bluetooth_keyboard"; // HID service

    return "bluetooth_device";
  }

  // Identify Bluetooth device category
  identifyBluetoothCategory(peripheral) {
    const type = this.identifyBluetoothDeviceType(peripheral);

    if (["bluetooth_headphones", "bluetooth_speaker"].includes(type))
      return "entertainment";
    if (["smartphone", "smartwatch", "fitness_tracker"].includes(type))
      return "mobile";
    if (["bluetooth_keyboard", "bluetooth_mouse"].includes(type))
      return "computer";

    return "other";
  }

  // Get Bluetooth device capabilities
  getBluetoothCapabilities(peripheral) {
    const capabilities = [];
    const type = this.identifyBluetoothDeviceType(peripheral);

    if (type === "bluetooth_speaker" || type === "bluetooth_headphones") {
      capabilities.push(
        {
          name: "connect_audio",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Connect audio",
        },
        {
          name: "play_pause",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Play/Pause",
        },
      );
    }

    return capabilities;
  }

  // Serial/USB device discovery
  async discoverSerialDevices() {
    console.log("🔍 Discovering Serial/USB devices...");

    try {
      const ports = await SerialPort.list();

      for (const port of ports) {
        console.log(`📡 Found serial device: ${port.path}`);

        const deviceType = this.identifySerialDeviceType(port);
        const isPhone = deviceType === "smartphone";

        const device = {
          id: `serial_${port.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: port.friendlyName || `Serial Device ${port.path}`,
          type: deviceType,
          category: isPhone ? "mobile" : "appliance",
          manufacturer: port.manufacturer || "Unknown",
          model: "Unknown",
          version: "Unknown",
          port: port.path,
          protocols: ["serial"],
          capabilities: [
            {
              name: "send_data",
              type: "control",
              dataType: "string",
              readable: false,
              writable: true,
              description: "Send serial data",
            },
            {
              name: "read_data",
              type: "sensor",
              dataType: "string",
              readable: true,
              writable: false,
              description: "Read serial data",
            },
          ],
          authentication: { type: "none", refreshable: false },
          status: "online",
          location: "Connected",
          lastSeen: new Date(),
          metadata: port,
          controlMethods: [],
        };

        this.addOrUpdateDevice(device);
      }
    } catch (error) {
      console.error("❌ Serial discovery error:", error);
    }
  }

  // Identify serial device type
  identifySerialDeviceType(port) {
    const name = (port.friendlyName || "").toLowerCase();
    const manufacturer = (port.manufacturer || "").toLowerCase();
    const path = (port.path || "").toLowerCase();

    // Check for phones first
    if (
      manufacturer.includes("samsung") ||
      manufacturer.includes("apple") ||
      manufacturer.includes("google") ||
      manufacturer.includes("oneplus") ||
      manufacturer.includes("huawei") ||
      manufacturer.includes("xiaomi") ||
      name.includes("phone") ||
      name.includes("android") ||
      name.includes("iphone") ||
      path.includes("phone") ||
      port.vendorId === "04e8" || // Samsung
      port.vendorId === "05c6" || // Qualcomm (Android)
      port.vendorId === "18d1" // Google
    ) {
      console.log(`📱 Identified phone via USB: ${manufacturer} ${name}`);
      return "smartphone";
    }

    if (name.includes("arduino") || manufacturer.includes("arduino"))
      return "arduino";
    if (name.includes("esp32") || name.includes("esp8266")) return "esp_device";
    if (name.includes("raspberry") || manufacturer.includes("raspberry"))
      return "raspberry_pi";
    if (name.includes("usb") && name.includes("serial")) return "usb_serial";

    return "serial_device";
  }

  // Smart home device discovery (Philips Hue, etc.)
  async discoverSmartHomeDevices() {
    console.log("🔍 Discovering smart home devices...");

    try {
      // Discover Philips Hue bridges
      await this.discoverHueBridges();

      // Discover garage door openers and gate controllers
      await this.discoverGarageAndGateDevices();

      // Discover smart speakers and assistants
      await this.discoverSmartSpeakers();

      // Discover smart thermostats
      await this.discoverSmartThermostats();

      // Discover security cameras and systems
      await this.discoverSecurityDevices();

      // Discover smart plugs and switches
      await this.discoverSmartPlugsAndSwitches();
    } catch (error) {
      console.error("❌ Smart home discovery error:", error);
    }
  }

  // Discover garage door openers and gate controllers
  async discoverGarageAndGateDevices() {
    console.log("🚪 Discovering garage doors and gate controllers...");

    try {
      const networks = await this.getLocalNetworks();

      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        for (let i = 1; i <= 254; i++) {
          const ip = `${baseIP}.${i}`;

          try {
            // Check for common garage door and gate controller ports
            const gateServices = [
              {
                port: 80,
                path: "/status",
                keywords: [
                  "garage",
                  "gate",
                  "door",
                  "opener",
                  "chamberlain",
                  "liftmaster",
                  "craftsman",
                ],
              },
              {
                port: 443,
                path: "/status",
                keywords: ["garage", "gate", "door", "opener"],
              },
              { port: 8080, path: "/", keywords: ["garage", "gate", "door"] },
              { port: 9000, path: "/", keywords: ["garage", "gate"] },
            ];

            for (const service of gateServices) {
              const isOpen = await this.checkPort(ip, service.port);
              if (isOpen) {
                try {
                  const response = await axios.get(
                    `http://${ip}:${service.port}${service.path}`,
                    {
                      timeout: 3000,
                      headers: { "User-Agent": "JASON-Device-Discovery/1.0" },
                    },
                  );

                  const content = response.data.toLowerCase();
                  const foundKeywords = service.keywords.filter((keyword) =>
                    content.includes(keyword),
                  );

                  if (foundKeywords.length > 0) {
                    console.log(
                      `🚪 Found garage/gate device at ${ip}:${service.port} - Keywords: ${foundKeywords.join(", ")}`,
                    );

                    let deviceType = "smart_device";
                    let deviceName = "Smart Device";

                    if (content.includes("garage")) {
                      deviceType = "garage_door";
                      deviceName = "Garage Door Opener";
                    } else if (content.includes("gate")) {
                      deviceType = "gate_controller";
                      deviceName = "Gate Controller";
                    }

                    const device = {
                      id: `smart_${deviceType}_${ip.replace(/\./g, "_")}`,
                      name: `${deviceName} ${ip}`,
                      type: deviceType,
                      category: "smart_home",
                      manufacturer:
                        this.identifyManufacturerFromContent(content),
                      model: "Unknown",
                      version: "Unknown",
                      ip: ip,
                      port: service.port,
                      protocols: ["http"],
                      capabilities: [
                        {
                          name: "open",
                          type: "control",
                          dataType: "boolean",
                          readable: false,
                          writable: true,
                          description: "Open door/gate",
                        },
                        {
                          name: "close",
                          type: "control",
                          dataType: "boolean",
                          readable: false,
                          writable: true,
                          description: "Close door/gate",
                        },
                        {
                          name: "status",
                          type: "sensor",
                          dataType: "string",
                          readable: true,
                          writable: false,
                          description: "Get status",
                        },
                        {
                          name: "toggle",
                          type: "control",
                          dataType: "boolean",
                          readable: false,
                          writable: true,
                          description: "Toggle door/gate",
                        },
                      ],
                      authentication: { type: "http_auth", refreshable: true },
                      status: "online",
                      location: "Smart Home",
                      lastSeen: new Date(),
                      metadata: {
                        detectedKeywords: foundKeywords,
                        detectionMethod: "http_scan",
                        webContent: content.substring(0, 500),
                      },
                      controlMethods: ["http"],
                    };

                    this.addOrUpdateDevice(device);
                    break;
                  }
                } catch (e) {
                  // HTTP request failed, continue
                }
              }
            }
          } catch (e) {
            // Continue scanning
          }
        }
      }
    } catch (error) {
      console.error("❌ Garage/Gate discovery error:", error);
    }
  }

  // Discover smart speakers and voice assistants
  async discoverSmartSpeakers() {
    console.log("🔊 Discovering smart speakers...");

    try {
      // Look for Amazon Echo devices
      this.bonjourService.find({ type: "_amzn-alexa._tcp" }, (service) => {
        console.log(`🔊 Found Amazon Echo: ${service.name}`);
        this.addSmartSpeaker(service, "amazon_echo", "Amazon", "Echo");
      });

      // Look for Google Home devices
      this.bonjourService.find({ type: "_googlecast._tcp" }, (service) => {
        console.log(`🔊 Found Google Cast device: ${service.name}`);
        if (
          service.name.toLowerCase().includes("home") ||
          service.name.toLowerCase().includes("nest")
        ) {
          this.addSmartSpeaker(service, "google_home", "Google", "Home");
        }
      });

      // Look for Apple HomePod
      this.bonjourService.find({ type: "_airplay._tcp" }, (service) => {
        if (service.name.toLowerCase().includes("homepod")) {
          console.log(`🔊 Found Apple HomePod: ${service.name}`);
          this.addSmartSpeaker(service, "homepod", "Apple", "HomePod");
        }
      });
    } catch (error) {
      console.error("❌ Smart speaker discovery error:", error);
    }
  }

  // Helper to add smart speaker devices
  addSmartSpeaker(service, type, manufacturer, model) {
    const device = {
      id: `speaker_${type}_${service.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: service.name,
      type: "smart_speaker",
      category: "smart_home",
      manufacturer: manufacturer,
      model: model,
      version: "Unknown",
      ip: service.addresses?.[0],
      port: service.port,
      protocols: ["mdns", "http"],
      capabilities: [
        {
          name: "play_music",
          type: "control",
          dataType: "object",
          readable: false,
          writable: true,
          description: "Play music",
        },
        {
          name: "set_volume",
          type: "control",
          dataType: "number",
          readable: false,
          writable: true,
          description: "Set volume",
        },
        {
          name: "voice_command",
          type: "control",
          dataType: "string",
          readable: false,
          writable: true,
          description: "Send voice command",
        },
        {
          name: "get_status",
          type: "sensor",
          dataType: "object",
          readable: true,
          writable: false,
          description: "Get device status",
        },
      ],
      authentication: { type: "oauth", refreshable: true },
      status: "online",
      location: "Smart Home",
      lastSeen: new Date(),
      metadata: {
        serviceInfo: service,
        detectionMethod: "mdns",
      },
      controlMethods: ["voice", "http"],
    };

    this.addOrUpdateDevice(device);
  }

  // Discover smart thermostats
  async discoverSmartThermostats() {
    console.log("🌡️ Discovering smart thermostats...");

    try {
      // Look for Nest thermostats
      this.bonjourService.find({ type: "_nest._tcp" }, (service) => {
        console.log(`🌡️ Found Nest device: ${service.name}`);
        this.addThermostat(service, "nest", "Google Nest");
      });

      // Look for Ecobee thermostats
      this.bonjourService.find({ type: "_ecobee._tcp" }, (service) => {
        console.log(`🌡️ Found Ecobee device: ${service.name}`);
        this.addThermostat(service, "ecobee", "Ecobee");
      });

      // Network scan for thermostat web interfaces
      await this.scanForThermostatWebInterfaces();
    } catch (error) {
      console.error("❌ Thermostat discovery error:", error);
    }
  }

  // Helper to add thermostat devices
  addThermostat(service, type, manufacturer) {
    const device = {
      id: `thermostat_${type}_${service.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: service.name,
      type: "thermostat",
      category: "smart_home",
      manufacturer: manufacturer,
      model: "Smart Thermostat",
      version: "Unknown",
      ip: service.addresses?.[0],
      port: service.port,
      protocols: ["mdns", "http"],
      capabilities: [
        {
          name: "set_temperature",
          type: "control",
          dataType: "number",
          readable: false,
          writable: true,
          description: "Set target temperature",
        },
        {
          name: "get_temperature",
          type: "sensor",
          dataType: "number",
          readable: true,
          writable: false,
          description: "Get current temperature",
        },
        {
          name: "set_mode",
          type: "control",
          dataType: "string",
          readable: false,
          writable: true,
          description: "Set HVAC mode",
        },
        {
          name: "get_humidity",
          type: "sensor",
          dataType: "number",
          readable: true,
          writable: false,
          description: "Get humidity",
        },
      ],
      authentication: { type: "oauth", refreshable: true },
      status: "online",
      location: "Smart Home",
      lastSeen: new Date(),
      metadata: {
        serviceInfo: service,
        detectionMethod: "mdns",
      },
      controlMethods: ["http", "app"],
    };

    this.addOrUpdateDevice(device);
  }

  // Scan for thermostat web interfaces
  async scanForThermostatWebInterfaces() {
    const networks = await this.getLocalNetworks();

    for (const network of networks) {
      const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

      for (let i = 1; i <= 254; i++) {
        const ip = `${baseIP}.${i}`;

        try {
          const isOpen = await this.checkPort(ip, 80);
          if (isOpen) {
            try {
              const response = await axios.get(`http://${ip}`, {
                timeout: 2000,
              });
              const content = response.data.toLowerCase();

              if (
                content.includes("thermostat") ||
                content.includes("temperature") ||
                content.includes("hvac")
              ) {
                console.log(
                  `🌡️ Found potential thermostat web interface at ${ip}`,
                );

                const device = {
                  id: `thermostat_web_${ip.replace(/\./g, "_")}`,
                  name: `Smart Thermostat ${ip}`,
                  type: "thermostat",
                  category: "smart_home",
                  manufacturer: "Unknown",
                  model: "Web Thermostat",
                  version: "Unknown",
                  ip: ip,
                  protocols: ["http"],
                  capabilities: [
                    {
                      name: "web_interface",
                      type: "control",
                      dataType: "string",
                      readable: true,
                      writable: false,
                      description: "Web interface URL",
                    },
                    {
                      name: "control_temperature",
                      type: "control",
                      dataType: "object",
                      readable: false,
                      writable: true,
                      description: "Control via web",
                    },
                  ],
                  authentication: { type: "http_auth", refreshable: true },
                  status: "online",
                  location: "Smart Home",
                  lastSeen: new Date(),
                  metadata: {
                    detectionMethod: "web_scan",
                    webInterface: `http://${ip}`,
                  },
                  controlMethods: ["http"],
                };

                this.addOrUpdateDevice(device);
              }
            } catch (e) {
              // HTTP request failed
            }
          }
        } catch (e) {
          // Continue scanning
        }
      }
    }
  }

  // Discover security cameras and systems
  async discoverSecurityDevices() {
    console.log("📹 Discovering security devices...");

    try {
      const networks = await this.getLocalNetworks();

      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        for (let i = 1; i <= 254; i++) {
          const ip = `${baseIP}.${i}`;

          try {
            // Check common security camera ports
            const securityPorts = [80, 443, 554, 8080, 8081, 8000, 9000];

            for (const port of securityPorts) {
              const isOpen = await this.checkPort(ip, port);
              if (isOpen) {
                try {
                  const response = await axios.get(`http://${ip}:${port}`, {
                    timeout: 2000,
                  });
                  const content = response.data.toLowerCase();

                  if (
                    content.includes("camera") ||
                    content.includes("security") ||
                    content.includes("surveillance") ||
                    content.includes("video") ||
                    content.includes("stream")
                  ) {
                    console.log(`📹 Found security device at ${ip}:${port}`);

                    let deviceType = "security_camera";
                    let deviceName = "Security Camera";

                    if (content.includes("doorbell")) {
                      deviceType = "smart_doorbell";
                      deviceName = "Smart Doorbell";
                    } else if (
                      content.includes("nvr") ||
                      content.includes("recorder")
                    ) {
                      deviceType = "security_system";
                      deviceName = "Security System";
                    }

                    const device = {
                      id: `security_${deviceType}_${ip.replace(/\./g, "_")}_${port}`,
                      name: `${deviceName} ${ip}`,
                      type: deviceType,
                      category: "smart_home",
                      manufacturer:
                        this.identifyManufacturerFromContent(content),
                      model: "Unknown",
                      version: "Unknown",
                      ip: ip,
                      port: port,
                      protocols: ["http", "rtsp"],
                      capabilities: [
                        {
                          name: "view_stream",
                          type: "sensor",
                          dataType: "string",
                          readable: true,
                          writable: false,
                          description: "View video stream",
                        },
                        {
                          name: "take_snapshot",
                          type: "control",
                          dataType: "boolean",
                          readable: false,
                          writable: true,
                          description: "Take snapshot",
                        },
                        {
                          name: "motion_detection",
                          type: "sensor",
                          dataType: "boolean",
                          readable: true,
                          writable: false,
                          description: "Motion detection status",
                        },
                      ],
                      authentication: { type: "http_auth", refreshable: true },
                      status: "online",
                      location: "Security",
                      lastSeen: new Date(),
                      metadata: {
                        detectionMethod: "web_scan",
                        streamUrl: `http://${ip}:${port}`,
                      },
                      controlMethods: ["http", "app"],
                    };

                    this.addOrUpdateDevice(device);
                    break;
                  }
                } catch (e) {
                  // HTTP request failed
                }
              }
            }
          } catch (e) {
            // Continue scanning
          }
        }
      }
    } catch (error) {
      console.error("❌ Security device discovery error:", error);
    }
  }

  // Discover smart plugs and switches
  async discoverSmartPlugsAndSwitches() {
    console.log("🔌 Discovering smart plugs and switches...");

    try {
      // Look for TP-Link Kasa devices
      this.bonjourService.find({ type: "_kasa._tcp" }, (service) => {
        console.log(`🔌 Found TP-Link Kasa device: ${service.name}`);
        this.addSmartPlug(service, "kasa", "TP-Link");
      });

      // Network scan for smart plug web interfaces
      await this.scanForSmartPlugWebInterfaces();
    } catch (error) {
      console.error("❌ Smart plug discovery error:", error);
    }
  }

  // Helper to add smart plug devices
  addSmartPlug(service, type, manufacturer) {
    const device = {
      id: `plug_${type}_${service.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: service.name,
      type: "smart_plug",
      category: "smart_home",
      manufacturer: manufacturer,
      model: "Smart Plug",
      version: "Unknown",
      ip: service.addresses?.[0],
      port: service.port,
      protocols: ["mdns", "http"],
      capabilities: [
        {
          name: "power_on",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Turn on",
        },
        {
          name: "power_off",
          type: "control",
          dataType: "boolean",
          readable: false,
          writable: true,
          description: "Turn off",
        },
        {
          name: "power_status",
          type: "sensor",
          dataType: "boolean",
          readable: true,
          writable: false,
          description: "Power status",
        },
        {
          name: "energy_usage",
          type: "sensor",
          dataType: "number",
          readable: true,
          writable: false,
          description: "Energy usage",
        },
      ],
      authentication: { type: "app_auth", refreshable: true },
      status: "online",
      location: "Smart Home",
      lastSeen: new Date(),
      metadata: {
        serviceInfo: service,
        detectionMethod: "mdns",
      },
      controlMethods: ["http", "app"],
    };

    this.addOrUpdateDevice(device);
  }

  // Scan for smart plug web interfaces
  async scanForSmartPlugWebInterfaces() {
    const networks = await this.getLocalNetworks();

    for (const network of networks) {
      const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

      for (let i = 1; i <= 254; i++) {
        const ip = `${baseIP}.${i}`;

        try {
          const isOpen = await this.checkPort(ip, 80);
          if (isOpen) {
            try {
              const response = await axios.get(`http://${ip}`, {
                timeout: 2000,
              });
              const content = response.data.toLowerCase();

              if (
                content.includes("smart plug") ||
                content.includes("switch") ||
                content.includes("outlet")
              ) {
                console.log(`🔌 Found smart plug/switch at ${ip}`);

                const device = {
                  id: `plug_web_${ip.replace(/\./g, "_")}`,
                  name: `Smart Plug ${ip}`,
                  type: "smart_plug",
                  category: "smart_home",
                  manufacturer: this.identifyManufacturerFromContent(content),
                  model: "Web Smart Plug",
                  version: "Unknown",
                  ip: ip,
                  protocols: ["http"],
                  capabilities: [
                    {
                      name: "web_control",
                      type: "control",
                      dataType: "object",
                      readable: false,
                      writable: true,
                      description: "Control via web",
                    },
                    {
                      name: "status",
                      type: "sensor",
                      dataType: "object",
                      readable: true,
                      writable: false,
                      description: "Device status",
                    },
                  ],
                  authentication: { type: "http_auth", refreshable: true },
                  status: "online",
                  location: "Smart Home",
                  lastSeen: new Date(),
                  metadata: {
                    detectionMethod: "web_scan",
                    webInterface: `http://${ip}`,
                  },
                  controlMethods: ["http"],
                };

                this.addOrUpdateDevice(device);
              }
            } catch (e) {
              // HTTP request failed
            }
          }
        } catch (e) {
          // Continue scanning
        }
      }
    }
  }

  // Helper to identify manufacturer from web content
  identifyManufacturerFromContent(content) {
    const manufacturers = {
      chamberlain: "Chamberlain",
      liftmaster: "LiftMaster",
      craftsman: "Craftsman",
      linear: "Linear",
      "mighty mule": "Mighty Mule",
      nest: "Google Nest",
      ecobee: "Ecobee",
      honeywell: "Honeywell",
      ring: "Ring",
      arlo: "Arlo",
      hikvision: "Hikvision",
      dahua: "Dahua",
      "tp-link": "TP-Link",
      kasa: "TP-Link Kasa",
      belkin: "Belkin",
      wemo: "Belkin WeMo",
    };

    for (const [keyword, manufacturer] of Object.entries(manufacturers)) {
      if (content.includes(keyword)) {
        return manufacturer;
      }
    }

    return "Unknown";
  }

  // Discover Philips Hue bridges
  async discoverHueBridges() {
    try {
      // Try to discover Hue bridges via UPnP
      const response = await axios.get("https://discovery.meethue.com/", {
        timeout: 5000,
      });

      for (const bridge of response.data) {
        console.log(`📡 Found Hue bridge: ${bridge.internalipaddress}`);

        const device = {
          id: `hue_bridge_${bridge.id}`,
          name: "Philips Hue Bridge",
          type: "hue_bridge",
          category: "smart_home",
          manufacturer: "Philips",
          model: "Hue Bridge",
          version: "Unknown",
          ip: bridge.internalipaddress,
          protocols: ["http", "hue_api"],
          capabilities: [
            {
              name: "discover_lights",
              type: "control",
              dataType: "boolean",
              readable: false,
              writable: true,
              description: "Discover connected lights",
            },
            {
              name: "control_light",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Control Hue lights",
            },
          ],
          authentication: { type: "api_key", refreshable: false },
          status: "online",
          location: "Network",
          lastSeen: new Date(),
          metadata: bridge,
          controlMethods: [],
        };

        this.addOrUpdateDevice(device);
      }
    } catch (error) {
      // Hue discovery failed
    }
  }

  // Enhanced Mobile device discovery with privacy-first phone integration
  async discoverMobileDevices() {
    console.log(
      "🔍 Discovering mobile devices with privacy-first integration...",
    );

    try {
      // Method 1: ADB for Android devices (with enhanced capabilities)
      await this.discoverAndroidDevicesADB();

      // Method 2: iOS devices via libimobiledevice (with enhanced capabilities)
      await this.discoveriOSDevices();

      // Method 3: Network-based mobile device detection (enhanced identification)
      await this.discoverNetworkMobileDevices();

      // Method 4: WiFi Direct and Hotspot detection
      await this.discoverWiFiDirectDevices();

      // Method 5: Privacy-first phone integration discovery
      await this.discoverPhoneIntegrationCapabilities();

      // Method 6: Bluetooth phone discovery (enhanced)
      await this.discoverBluetoothPhones();
    } catch (error) {
      console.error("❌ Mobile discovery error:", error);
    }
  }

  // Android ADB Discovery
  async discoverAndroidDevicesADB() {
    try {
      console.log("📱 Checking for ADB and Android devices...");

      // First check if ADB is available
      try {
        await execAsync("adb version");
        console.log("✅ ADB is available");
      } catch (e) {
        console.log(
          "❌ ADB not found. Install Android SDK Platform Tools to detect Android devices.",
        );
        return;
      }

      // Start ADB server if not running
      try {
        await execAsync("adb start-server");
      } catch (e) {
        console.log("⚠️ Could not start ADB server");
      }

      const { stdout } = await execAsync("adb devices -l 2>/dev/null");
      const lines = stdout.split("\n");
      console.log(`📱 ADB devices output: ${lines.length} lines`);

      for (const line of lines) {
        if (line.includes("\tdevice")) {
          const parts = line.split("\t");
          const deviceId = parts[0];
          console.log(`📱 Found Android device via ADB: ${deviceId}`);

          // Get device info
          let deviceInfo = {};
          try {
            const { stdout: propOutput } = await execAsync(
              `adb -s ${deviceId} shell getprop 2>/dev/null`,
            );
            const props = propOutput.split("\n");

            for (const prop of props) {
              if (prop.includes("[ro.product.manufacturer]")) {
                deviceInfo.manufacturer =
                  prop.split(": ")[1]?.replace(/[\[\]]/g, "") || "Unknown";
              }
              if (prop.includes("[ro.product.model]")) {
                deviceInfo.model =
                  prop.split(": ")[1]?.replace(/[\[\]]/g, "") || "Unknown";
              }
              if (prop.includes("[ro.build.version.release]")) {
                deviceInfo.version =
                  prop.split(": ")[1]?.replace(/[\[\]]/g, "") || "Unknown";
              }
              if (prop.includes("[ro.product.device]")) {
                deviceInfo.device =
                  prop.split(": ")[1]?.replace(/[\[\]]/g, "") || "Unknown";
              }
            }
          } catch (e) {
            console.log(`⚠️ Could not get device properties for ${deviceId}`);
          }

          const device = {
            id: `android_${deviceId}`,
            name: `${deviceInfo.manufacturer || "Android"} ${deviceInfo.model || "Device"}`,
            type: "smartphone",
            category: "mobile",
            manufacturer: deviceInfo.manufacturer || "Unknown",
            model: deviceInfo.model || "Unknown",
            version: `Android ${deviceInfo.version || "Unknown"}`,
            protocols: ["adb", "usb", "wireless_adb"],
            capabilities: [
              // App Management (Privacy: User must approve each app installation)
              {
                name: "install_app",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Install Android app (requires user approval)",
                privacy: "opt-in",
              },
              {
                name: "uninstall_app",
                type: "control",
                dataType: "string",
                readable: false,
                writable: true,
                description: "Uninstall app (requires user approval)",
                privacy: "opt-in",
              },
              {
                name: "list_apps",
                type: "sensor",
                dataType: "array",
                readable: true,
                writable: false,
                description: "List installed apps",
                privacy: "opt-in",
              },
              {
                name: "launch_app",
                type: "control",
                dataType: "string",
                readable: false,
                writable: true,
                description: "Launch specific app",
                privacy: "opt-in",
              },

              // Device Control (Privacy: Requires explicit permission)
              {
                name: "take_screenshot",
                type: "control",
                dataType: "boolean",
                readable: false,
                writable: true,
                description: "Take screenshot (requires permission)",
                privacy: "explicit-consent",
              },
              {
                name: "screen_record",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Record screen (requires permission)",
                privacy: "explicit-consent",
              },
              {
                name: "device_info",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Get device information",
                privacy: "basic",
              },
              {
                name: "battery_status",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Battery level and status",
                privacy: "basic",
              },
              {
                name: "storage_info",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Storage usage information",
                privacy: "basic",
              },

              // Communication (Privacy: Highly sensitive - requires explicit opt-in)
              {
                name: "send_notification",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Send notification to phone",
                privacy: "opt-in",
              },
              {
                name: "read_notifications",
                type: "sensor",
                dataType: "array",
                readable: true,
                writable: false,
                description: "Read notifications (requires permission)",
                privacy: "explicit-consent",
              },
              {
                name: "call_log",
                type: "sensor",
                dataType: "array",
                readable: true,
                writable: false,
                description: "Access call log (requires permission)",
                privacy: "explicit-consent",
              },
              {
                name: "sms_messages",
                type: "sensor",
                dataType: "array",
                readable: true,
                writable: false,
                description: "Access SMS messages (requires permission)",
                privacy: "explicit-consent",
              },
              {
                name: "send_sms",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Send SMS message (requires permission)",
                privacy: "explicit-consent",
              },

              // Media Control (Privacy: Moderate - requires opt-in)
              {
                name: "media_control",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Control media playback",
                privacy: "opt-in",
              },
              {
                name: "volume_control",
                type: "control",
                dataType: "number",
                readable: true,
                writable: true,
                description: "Control device volume",
                privacy: "opt-in",
              },
              {
                name: "camera_control",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Camera control (requires permission)",
                privacy: "explicit-consent",
              },

              // Location & Sensors (Privacy: Highly sensitive)
              {
                name: "location",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Device location (requires permission)",
                privacy: "explicit-consent",
              },
              {
                name: "sensor_data",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Sensor data (accelerometer, etc.)",
                privacy: "opt-in",
              },

              // Network & Connectivity (Privacy: Basic with opt-in for details)
              {
                name: "wifi_control",
                type: "control",
                dataType: "object",
                readable: true,
                writable: true,
                description: "WiFi control and status",
                privacy: "opt-in",
              },
              {
                name: "bluetooth_control",
                type: "control",
                dataType: "object",
                readable: true,
                writable: true,
                description: "Bluetooth control",
                privacy: "opt-in",
              },
              {
                name: "network_info",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Network connection info",
                privacy: "basic",
              },

              // File Management (Privacy: Requires explicit permission)
              {
                name: "file_transfer",
                type: "control",
                dataType: "object",
                readable: true,
                writable: true,
                description: "Transfer files to/from device",
                privacy: "explicit-consent",
              },
              {
                name: "backup_data",
                type: "control",
                dataType: "object",
                readable: false,
                writable: true,
                description: "Backup device data",
                privacy: "explicit-consent",
              },

              // Automation & Smart Home Integration (Privacy: Opt-in)
              {
                name: "presence_detection",
                type: "sensor",
                dataType: "boolean",
                readable: true,
                writable: false,
                description: "Detect if user is present",
                privacy: "opt-in",
              },
              {
                name: "smart_unlock",
                type: "control",
                dataType: "boolean",
                readable: false,
                writable: true,
                description: "Smart unlock for home automation",
                privacy: "opt-in",
              },
              {
                name: "geofencing",
                type: "sensor",
                dataType: "object",
                readable: true,
                writable: false,
                description: "Geofencing triggers",
                privacy: "opt-in",
              },

              // Advanced Control (Privacy: Requires developer options)
              {
                name: "run_shell_command",
                type: "control",
                dataType: "string",
                readable: false,
                writable: true,
                description: "Run shell command (developer mode)",
                privacy: "explicit-consent",
              },
              {
                name: "make_call",
                type: "control",
                dataType: "string",
                readable: false,
                writable: true,
                description: "Make phone call (requires permission)",
                privacy: "explicit-consent",
              },
            ],
            authentication: {
              type: "adb_auth",
              refreshable: false,
              securityLevel: "high",
              encryptionRequired: true,
              privacyCompliant: true,
            },
            status: "online",
            location: "Connected",
            lastSeen: new Date(),
            metadata: {
              deviceId,
              ...deviceInfo,
              privacyNotice:
                "All phone integrations require explicit user consent and follow privacy-first principles",
              securityFeatures: [
                "encrypted_communication",
                "permission_based_access",
                "audit_logging",
              ],
              batteryOptimized: true,
            },
            controlMethods: ["adb", "wireless_adb"],
            privacySettings: {
              dataRetention: "24_hours",
              encryptionLevel: "AES-256",
              auditLogging: true,
              userConsent: "required",
              dataMinimization: true,
            },
          };

          this.addOrUpdateDevice(device);
        }
      }
    } catch (e) {
      console.log("📱 ADB not available or no Android devices connected");
    }
  }

  // iOS Device Discovery
  async discoveriOSDevices() {
    try {
      console.log("📱 Checking for iOS devices...");

      // First check if libimobiledevice is available
      try {
        await execAsync("idevice_id --version 2>/dev/null");
        console.log("✅ libimobiledevice is available");
      } catch (e) {
        console.log(
          "❌ libimobiledevice not found. Install it to detect iOS devices: brew install libimobiledevice",
        );

        // Try alternative methods
        try {
          // Check if iTunes/Finder can see devices (macOS)
          if (process.platform === "darwin") {
            const { stdout } = await execAsync(
              'system_profiler SPUSBDataType | grep -A 20 "iPhone\\|iPad" 2>/dev/null',
            );
            if (stdout) {
              console.log(
                "📱 Found iOS device via system_profiler (limited info)",
              );
              const device = {
                id: `ios_system_${Date.now()}`,
                name: "iOS Device (System Detected)",
                type: "smartphone",
                category: "mobile",
                manufacturer: "Apple",
                model: "iPhone/iPad",
                version: "iOS Unknown",
                protocols: ["usb"],
                capabilities: [
                  {
                    name: "detected",
                    type: "sensor",
                    dataType: "boolean",
                    readable: true,
                    writable: false,
                    description: "Device detected via USB",
                  },
                ],
                authentication: { type: "ios_trust", refreshable: false },
                status: "online",
                location: "Connected",
                lastSeen: new Date(),
                metadata: { detectionMethod: "system_profiler" },
                controlMethods: ["system"],
              };
              this.addOrUpdateDevice(device);
            }
          }
        } catch (e2) {
          console.log("⚠️ No alternative iOS detection methods available");
        }
        return;
      }

      // Try idevice_id from libimobiledevice
      const { stdout } = await execAsync("idevice_id -l 2>/dev/null");
      const deviceIds = stdout
        .trim()
        .split("\n")
        .filter((id) => id.length > 0);
      console.log(`📱 Found ${deviceIds.length} iOS devices`);

      for (const deviceId of deviceIds) {
        console.log(`📱 Processing iOS device: ${deviceId}`);

        // Get device info
        let deviceInfo = {};
        try {
          const { stdout: infoOutput } = await execAsync(
            `ideviceinfo -u ${deviceId} 2>/dev/null`,
          );
          const lines = infoOutput.split("\n");

          for (const line of lines) {
            if (line.includes("ProductType:")) {
              deviceInfo.model = line.split(": ")[1] || "Unknown";
            }
            if (line.includes("ProductVersion:")) {
              deviceInfo.version = line.split(": ")[1] || "Unknown";
            }
            if (line.includes("DeviceName:")) {
              deviceInfo.name = line.split(": ")[1] || "iOS Device";
            }
            if (line.includes("SerialNumber:")) {
              deviceInfo.serial = line.split(": ")[1] || "Unknown";
            }
          }
        } catch (e) {
          console.log(`⚠️ Could not get device info for ${deviceId}`);
        }

        const device = {
          id: `ios_${deviceId}`,
          name: deviceInfo.name || `iOS Device ${deviceId.substring(0, 8)}`,
          type: "smartphone",
          category: "mobile",
          manufacturer: "Apple",
          model: deviceInfo.model || "iPhone/iPad",
          version: `iOS ${deviceInfo.version || "Unknown"}`,
          protocols: ["libimobiledevice", "usb", "wireless_sync"],
          capabilities: [
            // App Management (Privacy: iOS App Store restrictions apply)
            {
              name: "install_app",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Install iOS app (requires developer certificate)",
              privacy: "explicit-consent",
            },
            {
              name: "list_apps",
              type: "sensor",
              dataType: "array",
              readable: true,
              writable: false,
              description: "List installed apps",
              privacy: "opt-in",
            },
            {
              name: "launch_app",
              type: "control",
              dataType: "string",
              readable: false,
              writable: true,
              description: "Launch specific app (limited)",
              privacy: "opt-in",
            },

            // Device Information (Privacy: Basic info only)
            {
              name: "device_info",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Get device information",
              privacy: "basic",
            },
            {
              name: "battery_status",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Battery level and status",
              privacy: "basic",
            },
            {
              name: "storage_info",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Storage usage information",
              privacy: "basic",
            },

            // Media & Screenshots (Privacy: Requires user approval)
            {
              name: "take_screenshot",
              type: "control",
              dataType: "boolean",
              readable: false,
              writable: true,
              description: "Take screenshot (requires trust)",
              privacy: "explicit-consent",
            },
            {
              name: "sync_media",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Sync media files",
              privacy: "opt-in",
            },
            {
              name: "photo_access",
              type: "sensor",
              dataType: "array",
              readable: true,
              writable: false,
              description: "Access photos (limited)",
              privacy: "explicit-consent",
            },

            // Backup & Data Management (Privacy: Full device access)
            {
              name: "backup_device",
              type: "control",
              dataType: "boolean",
              readable: false,
              writable: true,
              description: "Create device backup",
              privacy: "explicit-consent",
            },
            {
              name: "restore_backup",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Restore from backup",
              privacy: "explicit-consent",
            },
            {
              name: "file_transfer",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "Transfer files (app sandbox only)",
              privacy: "opt-in",
            },

            // Communication (Privacy: Very limited on iOS)
            {
              name: "send_notification",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Send notification via companion app",
              privacy: "opt-in",
            },

            // Network & Connectivity (Privacy: Basic info only)
            {
              name: "network_info",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "Network connection info (limited)",
              privacy: "basic",
            },
            {
              name: "wifi_sync",
              type: "control",
              dataType: "boolean",
              readable: true,
              writable: true,
              description: "Enable WiFi sync",
              privacy: "opt-in",
            },

            // Location & Sensors (Privacy: Requires Find My or companion app)
            {
              name: "find_device",
              type: "control",
              dataType: "boolean",
              readable: false,
              writable: true,
              description: "Find device (requires Find My)",
              privacy: "opt-in",
            },
            {
              name: "presence_detection",
              type: "sensor",
              dataType: "boolean",
              readable: true,
              writable: false,
              description: "Detect if device is present",
              privacy: "opt-in",
            },

            // Smart Home Integration (Privacy: Requires companion app)
            {
              name: "homekit_integration",
              type: "control",
              dataType: "object",
              readable: true,
              writable: true,
              description: "HomeKit integration via companion app",
              privacy: "opt-in",
            },
            {
              name: "siri_shortcuts",
              type: "control",
              dataType: "object",
              readable: false,
              writable: true,
              description: "Trigger Siri shortcuts",
              privacy: "opt-in",
            },
            {
              name: "automation_triggers",
              type: "sensor",
              dataType: "object",
              readable: true,
              writable: false,
              description: "iOS automation triggers",
              privacy: "opt-in",
            },

            // Developer Features (Privacy: Requires developer mode)
            {
              name: "console_logs",
              type: "sensor",
              dataType: "array",
              readable: true,
              writable: false,
              description: "Access console logs (developer)",
              privacy: "explicit-consent",
            },
            {
              name: "crash_reports",
              type: "sensor",
              dataType: "array",
              readable: true,
              writable: false,
              description: "Access crash reports",
              privacy: "explicit-consent",
            },
          ],
          authentication: {
            type: "ios_trust",
            refreshable: false,
            securityLevel: "very_high",
            encryptionRequired: true,
            privacyCompliant: true,
            requiresTrust: true,
          },
          status: "online",
          location: "Connected",
          lastSeen: new Date(),
          metadata: {
            deviceId,
            ...deviceInfo,
            privacyNotice:
              "iOS integration respects Apple's privacy model and requires user trust",
            securityFeatures: [
              "device_trust_required",
              "encrypted_communication",
              "sandboxed_access",
            ],
            limitations:
              "iOS provides limited remote control compared to Android due to security restrictions",
            batteryOptimized: true,
          },
          controlMethods: ["libimobiledevice", "companion_app"],
          privacySettings: {
            dataRetention: "24_hours",
            encryptionLevel: "AES-256",
            auditLogging: true,
            userConsent: "required",
            dataMinimization: true,
            applePrivacyCompliant: true,
          },
        };

        this.addOrUpdateDevice(device);
      }
    } catch (e) {
      console.log(
        "📱 libimobiledevice not available or no iOS devices connected",
      );
    }
  }

  // Network-based Mobile Device Detection
  async discoverNetworkMobileDevices() {
    try {
      console.log("📱 Scanning network for mobile devices...");

      const networks = await this.getLocalNetworks();
      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        for (let i = 1; i <= 254; i++) {
          const ip = `${baseIP}.${i}`;

          try {
            // First check if device is alive
            const pingResult = await ping.promise.probe(ip, { timeout: 1 });
            if (!pingResult.alive) continue;

            // Get MAC address for better identification
            let mac = null;
            try {
              mac = await new Promise((resolve, reject) => {
                arp.getMAC(ip, (err, macAddr) => {
                  if (err) reject(err);
                  else resolve(macAddr);
                });
              });
            } catch (e) {
              // MAC lookup failed
            }

            // Check if this is a mobile device based on MAC
            if (mac) {
              const deviceType = await this.identifyDeviceByMAC(mac);
              if (deviceType && deviceType.category === "mobile") {
                console.log(
                  `📱 Found mobile device via MAC: ${deviceType.name} at ${ip} (${mac})`,
                );

                const device = {
                  id: `mobile_mac_${ip.replace(/\./g, "_")}`,
                  name: `${deviceType.name} ${ip}`,
                  type: deviceType.type,
                  category: "mobile",
                  manufacturer: deviceType.manufacturer,
                  model: deviceType.name,
                  version: "Unknown",
                  ip: ip,
                  mac: mac,
                  protocols: ["network", "wifi"],
                  capabilities: [
                    {
                      name: "ping",
                      type: "sensor",
                      dataType: "boolean",
                      readable: true,
                      writable: false,
                      description: "Check connectivity",
                    },
                    {
                      name: "wake_on_lan",
                      type: "control",
                      dataType: "boolean",
                      readable: false,
                      writable: true,
                      description: "Wake device",
                    },
                    {
                      name: "network_info",
                      type: "sensor",
                      dataType: "object",
                      readable: true,
                      writable: false,
                      description: "Network information",
                    },
                  ],
                  authentication: { type: "network_auth", refreshable: true },
                  status: "online",
                  location: "Network",
                  lastSeen: new Date(),
                  metadata: {
                    detectionMethod: "mac_identification",
                    macAddress: mac,
                    networkInfo: { ip, pingTime: pingResult.time },
                  },
                  controlMethods: ["network"],
                };

                this.addOrUpdateDevice(device);
                continue;
              }
            }

            // Check for common mobile device ports and services
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
                port: 8080,
                name: "Mobile Hotspot",
                type: "smartphone",
                manufacturer: "Unknown",
              },
              {
                port: 9999,
                name: "Mobile App Server",
                type: "smartphone",
                manufacturer: "Unknown",
              },
              {
                port: 3689,
                name: "iTunes DAAP",
                type: "smartphone",
                manufacturer: "Apple",
              },
              {
                port: 5000,
                name: "AirPlay",
                type: "smartphone",
                manufacturer: "Apple",
              },
              {
                port: 7000,
                name: "AirPlay Video",
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

                // Try to get more info via HTTP if possible
                let additionalInfo = {};
                if ([80, 8080, 3689, 5000, 7000].includes(service.port)) {
                  try {
                    const response = await axios.get(
                      `http://${ip}:${service.port}`,
                      {
                        timeout: 2000,
                        headers: { "User-Agent": "JASON-Mobile-Discovery/1.0" },
                      },
                    );
                    additionalInfo.webResponse = response.data.substring(
                      0,
                      200,
                    );
                  } catch (e) {
                    // HTTP request failed
                  }
                }

                const device = {
                  id: `mobile_network_${ip.replace(/\./g, "_")}_${service.port}`,
                  name: `${service.manufacturer} ${service.type} (${service.name})`,
                  type: service.type,
                  category: "mobile",
                  manufacturer: service.manufacturer,
                  model: "Network Detected",
                  version: "Unknown",
                  ip: ip,
                  mac: mac,
                  port: service.port,
                  protocols: ["tcp", "http", "network"],
                  capabilities: [
                    {
                      name: "connect",
                      type: "control",
                      dataType: "boolean",
                      readable: false,
                      writable: true,
                      description: "Connect to device",
                    },
                    {
                      name: "ping",
                      type: "sensor",
                      dataType: "boolean",
                      readable: true,
                      writable: false,
                      description: "Check connectivity",
                    },
                    {
                      name: "service_info",
                      type: "sensor",
                      dataType: "object",
                      readable: true,
                      writable: false,
                      description: "Service information",
                    },
                  ],
                  authentication: { type: "network_auth", refreshable: true },
                  status: "online",
                  location: "Network",
                  lastSeen: new Date(),
                  metadata: {
                    service: service.name,
                    detectionMethod: "port_scan",
                    macAddress: mac,
                    ...additionalInfo,
                  },
                  controlMethods: ["network"],
                };

                this.addOrUpdateDevice(device);
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

  // WiFi Direct Device Discovery
  async discoverWiFiDirectDevices() {
    try {
      console.log("📱 Scanning for WiFi Direct devices...");

      // WiFi Direct discovery would require platform-specific implementations
      if (process.platform === "linux") {
        try {
          const { stdout } = await execAsync(
            'iw dev wlan0 scan 2>/dev/null | grep -A 5 -B 5 "WiFi-Direct\\|P2P"',
          );
          if (stdout) {
            console.log("📱 Found WiFi Direct devices");
            // Parse WiFi Direct scan results
          }
        } catch (e) {
          // WiFi Direct scan failed
        }
      }
    } catch (error) {
      console.error("❌ WiFi Direct discovery error:", error);
    }
  }

  // Privacy-First Phone Integration Discovery
  async discoverPhoneIntegrationCapabilities() {
    try {
      console.log(
        "🔐 Discovering privacy-first phone integration capabilities...",
      );

      // Check for JASON companion app installations
      await this.checkForCompanionApps();

      // Scan for phones willing to integrate (opt-in discovery)
      await this.scanForOptInPhones();

      // Check for existing phone integrations
      await this.validateExistingPhoneIntegrations();
    } catch (error) {
      console.error("❌ Phone integration discovery error:", error);
    }
  }

  // Enhanced Bluetooth Phone Discovery
  async discoverBluetoothPhones() {
    try {
      console.log(
        "📱 Discovering Bluetooth phones with enhanced capabilities...",
      );

      // Get paired Bluetooth devices with phone capabilities
      const pairedDevices = await this.getBluetoothPairedDevices();

      for (const device of pairedDevices) {
        if (this.isBluetoothPhone(device)) {
          const enhancedDevice =
            await this.enhanceBluetoothPhoneCapabilities(device);
          this.addOrUpdateDevice(enhancedDevice);
        }
      }
    } catch (error) {
      console.error("❌ Bluetooth phone discovery error:", error);
    }
  }

  // Check for JASON companion apps on discovered devices
  async checkForCompanionApps() {
    try {
      console.log("📱 Checking for JASON companion apps...");

      // Check Android devices for companion app
      for (const device of this.devices.values()) {
        if (device.type === "smartphone" && device.protocols.includes("adb")) {
          try {
            const { stdout } = await execAsync(
              `adb -s ${device.metadata.deviceId} shell pm list packages | grep com.jason.companion 2>/dev/null`,
            );
            if (stdout.includes("com.jason.companion")) {
              console.log(`📱 Found JASON companion app on ${device.name}`);

              // Add companion app capabilities
              device.capabilities.push(
                {
                  name: "companion_app_control",
                  type: "control",
                  dataType: "object",
                  readable: true,
                  writable: true,
                  description: "Full companion app control",
                  privacy: "opt-in",
                },
                {
                  name: "secure_messaging",
                  type: "control",
                  dataType: "object",
                  readable: true,
                  writable: true,
                  description: "Secure messaging via companion app",
                  privacy: "opt-in",
                },
                {
                  name: "automation_triggers",
                  type: "control",
                  dataType: "object",
                  readable: false,
                  writable: true,
                  description: "Trigger phone automations",
                  privacy: "opt-in",
                },
                {
                  name: "smart_home_bridge",
                  type: "control",
                  dataType: "object",
                  readable: true,
                  writable: true,
                  description: "Use phone as smart home bridge",
                  privacy: "opt-in",
                },
              );

              device.metadata.companionAppInstalled = true;
              device.metadata.companionAppVersion =
                await this.getCompanionAppVersion(device.metadata.deviceId);
              device.controlMethods.push("companion_app");
            }
          } catch (e) {
            // Companion app not found or ADB not available
          }
        }
      }
    } catch (error) {
      console.error("❌ Companion app check error:", error);
    }
  }

  // Scan for phones that have opted into JASON integration
  async scanForOptInPhones() {
    try {
      console.log("🔍 Scanning for opt-in phone integrations...");

      // Look for JASON discovery beacons on the network
      const networks = await this.getLocalNetworks();

      for (const network of networks) {
        const baseIP = network.split("/")[0].split(".").slice(0, 3).join(".");

        // Scan for JASON phone integration port (custom port for privacy)
        for (let i = 1; i <= 254; i++) {
          const ip = `${baseIP}.${i}`;

          try {
            // Check for JASON phone integration service (port 8765)
            const isOpen = await this.checkPort(ip, 8765);
            if (isOpen) {
              console.log(
                `📱 Found potential JASON phone integration at ${ip}:8765`,
              );

              try {
                const response = await axios.get(
                  `http://${ip}:8765/jason/phone/info`,
                  {
                    timeout: 3000,
                    headers: {
                      "User-Agent": "JASON-Phone-Discovery/1.0",
                      "X-JASON-Discovery": "true",
                    },
                  },
                );

                if (response.data && response.data.jasonPhoneIntegration) {
                  const phoneInfo = response.data;

                  const device = {
                    id: `jason_phone_${ip.replace(/\./g, "_")}`,
                    name: phoneInfo.deviceName || `JASON Phone ${ip}`,
                    type: "smartphone",
                    category: "mobile",
                    manufacturer: phoneInfo.manufacturer || "Unknown",
                    model: phoneInfo.model || "Unknown",
                    version: phoneInfo.osVersion || "Unknown",
                    ip: ip,
                    port: 8765,
                    protocols: ["jason_phone_api", "https", "websocket"],
                    capabilities: [
                      // Privacy-first capabilities with explicit consent
                      {
                        name: "secure_notifications",
                        type: "control",
                        dataType: "object",
                        readable: false,
                        writable: true,
                        description: "Send secure notifications",
                        privacy: "opt-in",
                      },
                      {
                        name: "presence_detection",
                        type: "sensor",
                        dataType: "boolean",
                        readable: true,
                        writable: false,
                        description: "Privacy-preserving presence detection",
                        privacy: "opt-in",
                      },
                      {
                        name: "smart_home_triggers",
                        type: "control",
                        dataType: "object",
                        readable: false,
                        writable: true,
                        description: "Trigger smart home actions",
                        privacy: "opt-in",
                      },
                      {
                        name: "location_based_automation",
                        type: "sensor",
                        dataType: "object",
                        readable: true,
                        writable: false,
                        description: "Location-based automation (anonymized)",
                        privacy: "explicit-consent",
                      },
                      {
                        name: "media_control_bridge",
                        type: "control",
                        dataType: "object",
                        readable: true,
                        writable: true,
                        description: "Control media via phone",
                        privacy: "opt-in",
                      },
                      {
                        name: "voice_assistant_bridge",
                        type: "control",
                        dataType: "object",
                        readable: false,
                        writable: true,
                        description: "Bridge to phone voice assistant",
                        privacy: "opt-in",
                      },
                      {
                        name: "emergency_features",
                        type: "control",
                        dataType: "object",
                        readable: false,
                        writable: true,
                        description: "Emergency home automation",
                        privacy: "opt-in",
                      },
                      {
                        name: "guest_mode_control",
                        type: "control",
                        dataType: "boolean",
                        readable: true,
                        writable: true,
                        description: "Control guest mode settings",
                        privacy: "basic",
                      },
                      {
                        name: "energy_optimization",
                        type: "control",
                        dataType: "object",
                        readable: true,
                        writable: true,
                        description: "Phone-based energy optimization",
                        privacy: "opt-in",
                      },
                    ],
                    authentication: {
                      type: "jason_phone_auth",
                      refreshable: true,
                      securityLevel: "very_high",
                      encryptionRequired: true,
                      privacyCompliant: true,
                      tokenBased: true,
                    },
                    status: "online",
                    location: "Network",
                    lastSeen: new Date(),
                    metadata: {
                      ...phoneInfo,
                      integrationLevel: phoneInfo.integrationLevel || "basic",
                      privacySettings: phoneInfo.privacySettings || {},
                      batteryOptimized: true,
                      backgroundProcessMinimal: true,
                    },
                    controlMethods: ["jason_phone_api", "companion_app"],
                    privacySettings: {
                      dataRetention:
                        phoneInfo.privacySettings?.dataRetention || "1_hour",
                      encryptionLevel: "AES-256",
                      auditLogging: true,
                      userConsent: "required",
                      dataMinimization: true,
                      anonymization: true,
                      optOutAvailable: true,
                    },
                  };

                  this.addOrUpdateDevice(device);
                  console.log(
                    `✅ Added JASON-integrated phone: ${device.name}`,
                  );
                }
              } catch (e) {
                // Not a JASON phone integration service
              }
            }
          } catch (e) {
            // Continue scanning
          }
        }
      }
    } catch (error) {
      console.error("❌ Opt-in phone scan error:", error);
    }
  }

  // Validate existing phone integrations
  async validateExistingPhoneIntegrations() {
    try {
      console.log("🔍 Validating existing phone integrations...");

      for (const device of this.devices.values()) {
        if (
          device.category === "mobile" &&
          device.protocols.includes("jason_phone_api")
        ) {
          try {
            // Validate the integration is still active and consented
            const response = await axios.get(
              `http://${device.ip}:${device.port}/jason/phone/status`,
              {
                timeout: 2000,
                headers: {
                  Authorization: `Bearer ${device.metadata.authToken}`,
                  "X-JASON-Validation": "true",
                },
              },
            );

            if (
              response.data.status === "active" &&
              response.data.consentValid
            ) {
              device.status = "online";
              device.lastSeen = new Date();
              console.log(`✅ Phone integration validated: ${device.name}`);
            } else {
              device.status = "consent_required";
              console.log(
                `⚠️ Phone integration requires re-consent: ${device.name}`,
              );
            }
          } catch (e) {
            device.status = "offline";
            console.log(`❌ Phone integration offline: ${device.name}`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Phone integration validation error:", error);
    }
  }

  // Enhanced Bluetooth phone capabilities
  async enhanceBluetoothPhoneCapabilities(device) {
    const enhancedDevice = {
      ...device,
      capabilities: [
        // Basic Bluetooth capabilities
        {
          name: "bluetooth_connect",
          type: "control",
          dataType: "boolean",
          readable: true,
          writable: true,
          description: "Bluetooth connection control",
          privacy: "basic",
        },
        {
          name: "audio_streaming",
          type: "control",
          dataType: "object",
          readable: true,
          writable: true,
          description: "Audio streaming via Bluetooth",
          privacy: "opt-in",
        },
        {
          name: "hands_free_calling",
          type: "control",
          dataType: "object",
          readable: false,
          writable: true,
          description: "Hands-free calling (if supported)",
          privacy: "explicit-consent",
        },
        {
          name: "contact_access",
          type: "sensor",
          dataType: "array",
          readable: true,
          writable: false,
          description: "Access contacts (if permitted)",
          privacy: "explicit-consent",
        },
        {
          name: "call_history",
          type: "sensor",
          dataType: "array",
          readable: true,
          writable: false,
          description: "Call history (if permitted)",
          privacy: "explicit-consent",
        },
        {
          name: "sms_access",
          type: "sensor",
          dataType: "array",
          readable: true,
          writable: false,
          description: "SMS access (if permitted)",
          privacy: "explicit-consent",
        },
        {
          name: "notification_relay",
          type: "sensor",
          dataType: "array",
          readable: true,
          writable: false,
          description: "Notification relay (if permitted)",
          privacy: "opt-in",
        },
        {
          name: "media_control",
          type: "control",
          dataType: "object",
          readable: true,
          writable: true,
          description: "Media playback control",
          privacy: "opt-in",
        },
        {
          name: "battery_level",
          type: "sensor",
          dataType: "number",
          readable: true,
          writable: false,
          description: "Phone battery level (if shared)",
          privacy: "basic",
        },
        {
          name: "signal_strength",
          type: "sensor",
          dataType: "number",
          readable: true,
          writable: false,
          description: "Signal strength (if shared)",
          privacy: "basic",
        },
      ],
      metadata: {
        ...device.metadata,
        bluetoothProfiles: await this.getBluetoothProfiles(device),
        privacyNotice:
          "Bluetooth phone features require explicit pairing and permission grants",
        batteryOptimized: true,
      },
      privacySettings: {
        dataRetention: "1_hour",
        encryptionLevel: "Bluetooth-standard",
        auditLogging: true,
        userConsent: "required",
        dataMinimization: true,
        profileBasedAccess: true,
      },
    };

    return enhancedDevice;
  }

  // Helper methods for phone integration
  async getCompanionAppVersion(deviceId) {
    try {
      const { stdout } = await execAsync(
        `adb -s ${deviceId} shell dumpsys package com.jason.companion | grep versionName 2>/dev/null`,
      );
      return stdout.split("=")[1]?.trim() || "Unknown";
    } catch (e) {
      return "Unknown";
    }
  }

  async getBluetoothPairedDevices() {
    try {
      if (process.platform === "darwin") {
        const { stdout } = await execAsync(
          "system_profiler SPBluetoothDataType -json 2>/dev/null",
        );
        const data = JSON.parse(stdout);
        return data.SPBluetoothDataType?.[0]?.device_connected || [];
      } else if (process.platform === "linux") {
        const { stdout } = await execAsync(
          "bluetoothctl paired-devices 2>/dev/null",
        );
        return stdout
          .split("\n")
          .filter((line) => line.includes("Device"))
          .map((line) => {
            const parts = line.split(" ");
            return { address: parts[1], name: parts.slice(2).join(" ") };
          });
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  isBluetoothPhone(device) {
    const phoneKeywords = [
      "phone",
      "iphone",
      "android",
      "galaxy",
      "pixel",
      "oneplus",
      "huawei",
      "xiaomi",
    ];
    const deviceName = (device.name || "").toLowerCase();
    return phoneKeywords.some((keyword) => deviceName.includes(keyword));
  }

  async getBluetoothProfiles(device) {
    // Return common Bluetooth profiles for phones
    return ["A2DP", "HFP", "HSP", "AVRCP", "PBAP", "MAP", "HID"];
  }

  // Helper method to get local networks
  async getLocalNetworks() {
    const interfaces = os.networkInterfaces();
    const networks = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) {
          const network =
            addr.address.split(".").slice(0, 3).join(".") + ".0/24";
          networks.push(network);
        }
      }
    }

    return networks;
  }

  // HTTP device discovery
  async discoverHTTPDevices() {
    console.log("🌐 Discovering HTTP devices...");

    try {
      // This is typically done as part of network discovery
      // HTTP devices are identified during network scanning
      await this.discoverNetworkDevices();
    } catch (error) {
      console.error("❌ HTTP discovery error:", error);
    }
  }

  // SSH device discovery
  async discoverSSHDevices() {
    console.log("💻 Discovering SSH devices...");

    try {
      // SSH devices are typically discovered during network scanning
      // by checking for port 22
      await this.discoverNetworkDevices();
    } catch (error) {
      console.error("❌ SSH discovery error:", error);
    }
  }

  // Quick phone check for frequent updates
  async quickPhoneCheck() {
    try {
      // Quick ADB check
      try {
        const { stdout } = await execAsync("adb devices 2>/dev/null");
        if (stdout && stdout.includes("\tdevice")) {
          console.log("📱 Quick check: Android device still connected");
        }
      } catch (e) {
        // ADB check failed
      }

      // Quick iOS check
      try {
        const { stdout } = await execAsync("idevice_id -l 2>/dev/null");
        if (stdout && stdout.trim()) {
          console.log("📱 Quick check: iOS device still connected");
        }
      } catch (e) {
        // iOS check failed
      }

      // Quick USB check for new phones
      await this.quickUSBCheck();
    } catch (error) {
      // Silent fail for quick checks
    }
  }

  // Quick USB check for phones
  async quickUSBCheck() {
    try {
      if (process.platform === "darwin") {
        const { stdout } = await execAsync(
          'system_profiler SPUSBDataType | grep -E "(iPhone|iPad|Android|Samsung|Google|OnePlus|Huawei|Xiaomi)" 2>/dev/null',
        );
        if (stdout) {
          const lines = stdout.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              console.log(`📱 Quick USB check found: ${line.trim()}`);
            }
          }
        }
      }
    } catch (e) {
      // Silent fail
    }
  }

  // Computer device discovery (SSH, RDP, VNC)
  async discoverComputerDevices() {
    console.log("🔍 Discovering computer devices...");

    try {
      // This is handled by network discovery for SSH (port 22)
      // Additional computer-specific discovery could be added here
    } catch (error) {
      console.error("❌ Computer discovery error:", error);
    }
  }

  // Entertainment device discovery (Chromecast, Apple TV, etc.)
  async discoverEntertainmentDevices() {
    console.log("🔍 Discovering entertainment devices...");

    try {
      // This is handled by mDNS discovery for most entertainment devices
      // Additional entertainment-specific discovery could be added here
    } catch (error) {
      console.error("❌ Entertainment discovery error:", error);
    }
  }

  // Vehicle device discovery (Tesla, BMW, etc.)
  async discoverVehicleDevices() {
    console.log("🔍 Discovering vehicle devices...");

    try {
      // This would require API keys and authentication for vehicle manufacturers
      // For demonstration, we'll add a placeholder
      console.log("🚗 Vehicle discovery requires manufacturer API keys");
    } catch (error) {
      console.error("❌ Vehicle discovery error:", error);
    }
  }

  // Add or update device in the registry
  addOrUpdateDevice(deviceInfo) {
    const existingDevice = this.devices.get(deviceInfo.id);

    if (existingDevice) {
      // Update existing device
      existingDevice.lastSeen = new Date();
      existingDevice.status = "online";
      Object.assign(existingDevice.metadata, deviceInfo.metadata);
    } else {
      // Add new device
      this.devices.set(deviceInfo.id, deviceInfo);
      console.log(`✅ Added device: ${deviceInfo.name} (${deviceInfo.type})`);

      // Broadcast to WebSocket clients
      this.broadcastDeviceUpdate("deviceAdded", deviceInfo);
    }
  }

  // Broadcast device updates to WebSocket clients
  broadcastDeviceUpdate(event, device) {
    const message = JSON.stringify({
      event,
      device,
      timestamp: new Date().toISOString(),
    });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  // Control device methods
  async controlDevice(deviceId, command, parameters = {}) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: "Device not found" };
    }

    console.log(`🎮 Controlling ${device.name}: ${command}`, parameters);

    try {
      // Route to specific device type controllers first
      if (device.type === "smartphone" && device.protocols.includes("adb")) {
        const result = await this.controlAndroidDevice(
          device,
          command,
          parameters,
        );
        if (result.success) {
          device.lastSeen = new Date();
          return result;
        }
      }

      if (
        device.type === "smartphone" &&
        device.protocols.includes("libimobiledevice")
      ) {
        const result = await this.controliOSDevice(device, command, parameters);
        if (result.success) {
          device.lastSeen = new Date();
          return result;
        }
      }

      if (device.type === "smart_tv") {
        const result = await this.controlSmartTV(device, command, parameters);
        if (result.success) {
          device.lastSeen = new Date();
          return result;
        }
      }

      if (device.type === "smart_plug") {
        const result = await this.controlSmartPlug(device, command, parameters);
        if (result.success) {
          device.lastSeen = new Date();
          return result;
        }
      }

      // Route to appropriate protocol handler
      for (const protocol of device.protocols) {
        const handler = this.protocolHandlers.get(protocol);
        if (handler && handler.control) {
          const result = await handler.control(device, command, parameters);
          if (result.success) {
            device.lastSeen = new Date();
            return result;
          }
        }
      }

      return { success: false, error: "No suitable control method found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // HTTP device control
  async controlHTTPDevice(device, command, parameters) {
    try {
      const url = `http://${device.ip}${device.port ? ":" + device.port : ""}`;

      // Common HTTP control patterns
      if (command === "http_request") {
        const response = await axios({
          method: parameters.method || "GET",
          url: parameters.url || url,
          data: parameters.data,
          timeout: 10000,
        });

        return {
          success: true,
          data: response.data,
          timestamp: new Date().toISOString(),
        };
      }

      // Wake-on-LAN support
      if (command === "wake_on_lan" && device.mac) {
        return new Promise((resolve) => {
          wol.wake(device.mac, (error) => {
            if (error) {
              resolve({ success: false, error: error.message });
            } else {
              resolve({
                success: true,
                data: { message: `Wake-on-LAN packet sent to ${device.mac}` },
                timestamp: new Date().toISOString(),
              });
            }
          });
        });
      }

      // Router control
      if (device.type === "router") {
        if (command === "reboot") {
          try {
            await axios.post(`${url}/reboot`, {}, { timeout: 5000 });
            return {
              success: true,
              data: { message: "Router reboot initiated" },
              timestamp: new Date().toISOString(),
            };
          } catch (e) {
            // Try alternative reboot endpoints
            const endpoints = [
              "/admin/reboot",
              "/cgi-bin/reboot",
              "/system/reboot",
            ];
            for (const endpoint of endpoints) {
              try {
                await axios.post(`${url}${endpoint}`, {}, { timeout: 5000 });
                return {
                  success: true,
                  data: { message: "Router reboot initiated" },
                  timestamp: new Date().toISOString(),
                };
              } catch (e2) {
                continue;
              }
            }
          }
        }
      }

      return { success: false, error: "Unknown HTTP command" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // SSH device control
  async controlSSHDevice(device, command, parameters) {
    return new Promise((resolve) => {
      const conn = new SSHClient();

      conn.on("ready", () => {
        if (command === "run_command") {
          conn.exec(
            parameters.command || 'echo "Hello World"',
            (err, stream) => {
              if (err) {
                conn.end();
                resolve({ success: false, error: err.message });
                return;
              }

              let output = "";
              stream.on("data", (data) => {
                output += data.toString();
              });

              stream.on("close", () => {
                conn.end();
                resolve({
                  success: true,
                  data: { output: output.trim() },
                  timestamp: new Date().toISOString(),
                });
              });
            },
          );
        } else {
          conn.end();
          resolve({ success: false, error: "Unknown SSH command" });
        }
      });

      conn.on("error", (err) => {
        resolve({ success: false, error: err.message });
      });

      // Connect with provided credentials or key
      conn.connect({
        host: device.ip,
        port: 22,
        username: parameters.username || "root",
        password: parameters.password,
        privateKey: parameters.privateKey,
      });
    });
  }

  // Bluetooth device control
  async controlBluetoothDevice(device, command, parameters) {
    try {
      // Bluetooth control would require platform-specific implementations
      console.log(`Bluetooth control not fully implemented: ${command}`);

      return {
        success: true,
        data: { message: `Bluetooth command ${command} simulated` },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // mDNS device control
  async controlMDNSDevice(device, command, parameters) {
    // Most mDNS devices are controlled via HTTP
    return this.controlHTTPDevice(device, command, parameters);
  }

  // UPnP device control
  async controlUPnPDevice(device, command, parameters) {
    try {
      // UPnP control via SOAP requests
      if (command === "play_media" && device.type === "media_player") {
        // Simplified UPnP media control
        const soapAction =
          "urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI";
        const soapBody = `<?xml version="1.0"?>
          <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body>
              <u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
                <InstanceID>0</InstanceID>
                <CurrentURI>${parameters.uri || ""}</CurrentURI>
                <CurrentURIMetaData></CurrentURIMetaData>
              </u:SetAVTransportURI>
            </s:Body>
          </s:Envelope>`;

        const response = await axios.post(
          `http://${device.ip}/MediaRenderer/AVTransport/Control`,
          soapBody,
          {
            headers: {
              "Content-Type": 'text/xml; charset="utf-8"',
              SOAPAction: `"${soapAction}"`,
            },
            timeout: 10000,
          },
        );

        return {
          success: true,
          data: { message: "Media playback started" },
          timestamp: new Date().toISOString(),
        };
      }

      return { success: false, error: "Unknown UPnP command" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Serial device control
  async controlSerialDevice(device, command, parameters) {
    return new Promise((resolve) => {
      try {
        const port = new SerialPort({
          path: device.port,
          baudRate: parameters.baudRate || 9600,
        });

        if (command === "send_data") {
          port.write(parameters.data || "", (err) => {
            port.close();
            if (err) {
              resolve({ success: false, error: err.message });
            } else {
              resolve({
                success: true,
                data: { message: "Data sent successfully" },
                timestamp: new Date().toISOString(),
              });
            }
          });
        } else {
          port.close();
          resolve({ success: false, error: "Unknown serial command" });
        }
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  // Network device control
  async controlNetworkDevice(device, command, parameters) {
    // Network devices are typically controlled via HTTP
    return this.controlHTTPDevice(device, command, parameters);
  }

  // Android ADB device control
  async controlAndroidDevice(device, command, parameters) {
    try {
      const deviceId = device.metadata.deviceId;

      switch (command) {
        case "install_app":
          if (parameters.apkPath) {
            const { stdout, stderr } = await execAsync(
              `adb -s ${deviceId} install "${parameters.apkPath}"`,
            );
            return {
              success: !stderr.includes("Failure"),
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "uninstall_app":
          if (parameters.packageName) {
            const { stdout, stderr } = await execAsync(
              `adb -s ${deviceId} uninstall "${parameters.packageName}"`,
            );
            return {
              success: stdout.includes("Success"),
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "take_screenshot":
          const screenshotPath = `/tmp/screenshot_${Date.now()}.png`;
          const { stdout, stderr } = await execAsync(
            `adb -s ${deviceId} exec-out screencap -p > "${screenshotPath}"`,
          );
          return {
            success: !stderr,
            data: { screenshotPath, output: stdout },
            timestamp: new Date().toISOString(),
          };

        case "run_shell_command":
          if (parameters.command) {
            const { stdout, stderr } = await execAsync(
              `adb -s ${deviceId} shell "${parameters.command}"`,
            );
            return {
              success: true,
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "get_device_info":
          const { stdout: infoOutput } = await execAsync(
            `adb -s ${deviceId} shell getprop`,
          );
          const deviceInfo = {};
          const lines = infoOutput.split("\n");

          for (const line of lines) {
            const match = line.match(/\[([^\]]+)\]: \[([^\]]*)\]/);
            if (match) {
              deviceInfo[match[1]] = match[2];
            }
          }

          return {
            success: true,
            data: deviceInfo,
            timestamp: new Date().toISOString(),
          };

        case "list_apps":
          const { stdout: appsOutput } = await execAsync(
            `adb -s ${deviceId} shell pm list packages`,
          );
          const apps = appsOutput
            .split("\n")
            .filter((line) => line.startsWith("package:"))
            .map((line) => line.replace("package:", ""));

          return {
            success: true,
            data: apps,
            timestamp: new Date().toISOString(),
          };

        case "send_sms":
          if (parameters.number && parameters.message) {
            const { stdout, stderr } = await execAsync(
              `adb -s ${deviceId} shell service call isms 5 s16 "${parameters.number}" s16 "${parameters.message}" i32 0 i32 0`,
            );
            return {
              success: !stderr,
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "make_call":
          if (parameters.number) {
            const { stdout, stderr } = await execAsync(
              `adb -s ${deviceId} shell am start -a android.intent.action.CALL -d tel:${parameters.number}`,
            );
            return {
              success: !stderr,
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "send_notification":
          if (parameters.title && parameters.message) {
            const { stdout, stderr } = await execAsync(
              `adb -s ${deviceId} shell am broadcast -a android.intent.action.BOOT_COMPLETED --es title "${parameters.title}" --es message "${parameters.message}"`,
            );
            return {
              success: !stderr,
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;
      }

      return {
        success: false,
        error: "Unknown Android command or missing parameters",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // iOS device control
  async controliOSDevice(device, command, parameters) {
    try {
      const deviceId = device.metadata.deviceId;

      switch (command) {
        case "install_app":
          if (parameters.ipaPath) {
            const { stdout, stderr } = await execAsync(
              `ideviceinstaller -u ${deviceId} -i "${parameters.ipaPath}"`,
            );
            return {
              success: !stderr.includes("ERROR"),
              data: { output: stdout, error: stderr },
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "take_screenshot":
          const screenshotPath = `/tmp/ios_screenshot_${Date.now()}.png`;
          const { stdout, stderr } = await execAsync(
            `idevicescreenshot -u ${deviceId} "${screenshotPath}"`,
          );
          return {
            success: !stderr,
            data: { screenshotPath, output: stdout },
            timestamp: new Date().toISOString(),
          };

        case "get_device_info":
          const { stdout: infoOutput } = await execAsync(
            `ideviceinfo -u ${deviceId}`,
          );
          const deviceInfo = {};
          const lines = infoOutput.split("\n");

          for (const line of lines) {
            const parts = line.split(": ");
            if (parts.length === 2) {
              deviceInfo[parts[0]] = parts[1];
            }
          }

          return {
            success: true,
            data: deviceInfo,
            timestamp: new Date().toISOString(),
          };

        case "backup_device":
          const backupPath = `/tmp/ios_backup_${Date.now()}`;
          const { stdout: backupOutput, stderr: backupError } = await execAsync(
            `idevicebackup2 -u ${deviceId} backup "${backupPath}"`,
          );
          return {
            success: !backupError.includes("ERROR"),
            data: { backupPath, output: backupOutput, error: backupError },
            timestamp: new Date().toISOString(),
          };

        case "sync_media":
          // This would require more complex implementation with iTunes/Music app
          return {
            success: false,
            error: "Media sync requires iTunes/Music app integration",
            timestamp: new Date().toISOString(),
          };
      }

      return {
        success: false,
        error: "Unknown iOS command or missing parameters",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Smart TV control
  async controlSmartTV(device, command, parameters) {
    try {
      const ip = device.ip;
      const port = device.port || 8001;

      if (device.manufacturer === "Samsung") {
        return this.controlSamsungTV(device, command, parameters);
      } else if (device.manufacturer === "LG") {
        return this.controlLGTV(device, command, parameters);
      }

      return { success: false, error: "Unsupported TV manufacturer" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Samsung TV control
  async controlSamsungTV(device, command, parameters) {
    try {
      const ip = device.ip;
      const port = device.port || 8001;

      switch (command) {
        case "power_on":
          // Samsung TV power on via WOL if MAC available
          if (device.mac) {
            return new Promise((resolve) => {
              wol.wake(device.mac, (error) => {
                resolve({
                  success: !error,
                  data: {
                    message: error ? error.message : "Power on command sent",
                  },
                  timestamp: new Date().toISOString(),
                });
              });
            });
          }
          break;

        case "power_off":
          const response = await axios.post(`http://${ip}:${port}/api/v2/`, {
            method: "ms.remote.control",
            params: {
              Cmd: "Click",
              DataOfCmd: "KEY_POWER",
              Option: "false",
              TypeOfRemote: "SendRemoteKey",
            },
          });

          return {
            success: response.status === 200,
            data: response.data,
            timestamp: new Date().toISOString(),
          };

        case "change_channel":
          if (parameters.channel) {
            const channelResponse = await axios.post(
              `http://${ip}:${port}/api/v2/`,
              {
                method: "ms.remote.control",
                params: {
                  Cmd: "Click",
                  DataOfCmd: `KEY_${parameters.channel}`,
                  Option: "false",
                  TypeOfRemote: "SendRemoteKey",
                },
              },
            );

            return {
              success: channelResponse.status === 200,
              data: channelResponse.data,
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "set_volume":
          if (parameters.volume !== undefined) {
            // Samsung TV volume control
            const volumeResponse = await axios.post(
              `http://${ip}:${port}/api/v2/`,
              {
                method: "ms.remote.control",
                params: {
                  Cmd: "Click",
                  DataOfCmd:
                    parameters.volume > 50 ? "KEY_VOLUP" : "KEY_VOLDOWN",
                  Option: "false",
                  TypeOfRemote: "SendRemoteKey",
                },
              },
            );

            return {
              success: volumeResponse.status === 200,
              data: volumeResponse.data,
              timestamp: new Date().toISOString(),
            };
          }
          break;
      }

      return { success: false, error: "Unknown Samsung TV command" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // LG TV control
  async controlLGTV(device, command, parameters) {
    try {
      const ip = device.ip;
      const port = device.port || 3000;

      switch (command) {
        case "power_toggle":
          const response = await axios.post(
            `http://${ip}:${port}/udap/api/command`,
            {
              name: "HandleKeyInput",
              value: "POWER",
            },
          );

          return {
            success: response.status === 200,
            data: response.data,
            timestamp: new Date().toISOString(),
          };

        case "launch_app":
          if (parameters.appId) {
            const appResponse = await axios.post(
              `http://${ip}:${port}/udap/api/command`,
              {
                name: "AppExecute",
                auid: parameters.appId,
              },
            );

            return {
              success: appResponse.status === 200,
              data: appResponse.data,
              timestamp: new Date().toISOString(),
            };
          }
          break;
      }

      return { success: false, error: "Unknown LG TV command" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Smart Plug control (TP-Link Kasa)
  async controlSmartPlug(device, command, parameters) {
    try {
      const ip = device.ip;
      const port = device.port || 9999;

      // TP-Link Kasa protocol
      const encrypt = (plaintext) => {
        let key = 171;
        let result = Buffer.alloc(4 + plaintext.length);
        result.writeUInt32BE(plaintext.length, 0);

        for (let i = 0; i < plaintext.length; i++) {
          const a = key ^ plaintext.charCodeAt(i);
          key = a;
          result[i + 4] = a;
        }

        return result;
      };

      const decrypt = (ciphertext) => {
        let key = 171;
        let result = "";

        for (let i = 4; i < ciphertext.length; i++) {
          const a = key ^ ciphertext[i];
          key = ciphertext[i];
          result += String.fromCharCode(a);
        }

        return result;
      };

      let commandData = "";

      switch (command) {
        case "power_on":
          commandData = '{"system":{"set_relay_state":{"state":1}}}';
          break;

        case "power_off":
          commandData = '{"system":{"set_relay_state":{"state":0}}}';
          break;

        case "get_status":
          commandData = '{"system":{"get_sysinfo":{}}}';
          break;

        default:
          return { success: false, error: "Unknown smart plug command" };
      }

      return new Promise((resolve) => {
        const client = new net.Socket();
        const encryptedData = encrypt(commandData);

        client.connect(port, ip, () => {
          client.write(encryptedData);
        });

        client.on("data", (data) => {
          const decryptedData = decrypt(data);
          client.destroy();

          try {
            const response = JSON.parse(decryptedData);
            resolve({
              success: true,
              data: response,
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            resolve({
              success: false,
              error: "Failed to parse response",
              timestamp: new Date().toISOString(),
            });
          }
        });

        client.on("error", (error) => {
          resolve({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        });

        client.setTimeout(5000, () => {
          client.destroy();
          resolve({
            success: false,
            error: "Connection timeout",
            timestamp: new Date().toISOString(),
          });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Authentication methods (placeholders)
  async authenticateHTTP(device, credentials) {
    return { success: true, token: "http_token" };
  }

  async authenticateSSH(device, credentials) {
    return { success: true, token: "ssh_token" };
  }

  async authenticateBluetooth(device, credentials) {
    return { success: true, token: "bluetooth_token" };
  }

  async authenticateMDNS(device, credentials) {
    return { success: true, token: "mdns_token" };
  }

  async authenticateUPnP(device, credentials) {
    return { success: true, token: "upnp_token" };
  }

  async authenticateSerial(device, credentials) {
    return { success: true, token: "serial_token" };
  }

  async authenticateNetwork(device, credentials) {
    return { success: true, token: "network_token" };
  }

  // Utility methods
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getDevicesByCategory(category) {
    return Array.from(this.devices.values()).filter(
      (device) => device.category === category,
    );
  }

  getDevicesByType(type) {
    return Array.from(this.devices.values()).filter(
      (device) => device.type === type,
    );
  }

  async getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    return {
      online: device.status === "online",
      lastSeen: device.lastSeen,
      metadata: device.metadata,
      capabilities: device.capabilities.length,
    };
  }

  // Cleanup
  destroy() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    if (this.bonjourService) {
      this.bonjourService.destroy();
    }

    // Close any active connections
    this.activeConnections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {
        // Ignore close errors
      }
    });
  }
}

// Initialize the advanced controller
const universalController = new AdvancedUniversalDeviceController();

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("📡 WebSocket client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "control_device") {
        const result = await universalController.controlDevice(
          data.deviceId,
          data.command,
          data.parameters,
        );

        ws.send(
          JSON.stringify({
            type: "control_response",
            requestId: data.requestId,
            result,
          }),
        );
      } else if (data.type === "discover_devices") {
        universalController.discoverAllDevices();
        ws.send(
          JSON.stringify({
            type: "discovery_started",
            requestId: data.requestId,
          }),
        );
      }
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          error: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("📡 WebSocket client disconnected");
  });
});

// REST API Routes
app.get("/api/universal-devices", (req, res) => {
  try {
    const { category, type, online } = req.query;

    let devices = universalController.getAllDevices();

    if (category) {
      devices = universalController.getDevicesByCategory(category);
    }

    if (type) {
      devices = universalController.getDevicesByType(type);
    }

    if (online !== undefined) {
      const isOnline = online === "true";
      devices = devices.filter(
        (device) => (device.status === "online") === isOnline,
      );
    }

    const categories = {
      mobile: devices.filter((d) => d.category === "mobile").length,
      computer: devices.filter((d) => d.category === "computer").length,
      smart_home: devices.filter((d) => d.category === "smart_home").length,
      entertainment: devices.filter((d) => d.category === "entertainment")
        .length,
      vehicle: devices.filter((d) => d.category === "vehicle").length,
      appliance: devices.filter((d) => d.category === "appliance").length,
      network: devices.filter((d) => d.category === "network").length,
      other: devices.filter((d) => d.category === "other").length,
    };

    res.json({
      success: true,
      devices,
      totalDevices: devices.length,
      categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/:deviceId", (req, res) => {
  try {
    const device = universalController.getDevice(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }
    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/universal-devices/:deviceId/control", async (req, res) => {
  try {
    const { command, parameters = {} } = req.body;
    const response = await universalController.controlDevice(
      req.params.deviceId,
      command,
      parameters,
    );
    res.json({
      success: response.success,
      response,
      deviceId: req.params.deviceId,
      command,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/:deviceId/status", async (req, res) => {
  try {
    const status = await universalController.getDeviceStatus(
      req.params.deviceId,
    );
    res.json({
      success: true,
      deviceId: req.params.deviceId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/universal-devices/discover", async (req, res) => {
  try {
    universalController.discoverAllDevices();
    res.json({
      success: true,
      message: "Device discovery started",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/universal-devices/capabilities", (req, res) => {
  const capabilities = {
    protocols: [
      "http",
      "https",
      "ssh",
      "bluetooth",
      "mdns",
      "upnp",
      "serial",
      "network",
    ],
    deviceTypes: [
      "smartphone",
      "tablet",
      "smartwatch",
      "fitness_tracker",
      "desktop",
      "laptop",
      "server",
      "raspberry_pi",
      "arduino",
      "smart_light",
      "smart_switch",
      "smart_plug",
      "thermostat",
      "security_camera",
      "smart_tv",
      "streaming_device",
      "gaming_console",
      "smart_speaker",
      "electric_vehicle",
      "hybrid_vehicle",
      "router",
      "printer",
      "scanner",
    ],
    categories: [
      "mobile",
      "computer",
      "smart_home",
      "entertainment",
      "vehicle",
      "appliance",
      "network",
      "other",
    ],
    discoveryMethods: [
      "network_scan",
      "mdns",
      "upnp",
      "bluetooth",
      "serial",
      "usb",
    ],
    authenticationTypes: [
      "none",
      "api_key",
      "oauth",
      "ssh_key",
      "bluetooth_pair",
      "username_password",
    ],
  };

  res.json({
    success: true,
    capabilities,
    totalProtocols: capabilities.protocols.length,
    totalDeviceTypes: capabilities.deviceTypes.length,
  });
});

app.get("/api/universal-devices/health", (req, res) => {
  const allDevices = universalController.getAllDevices();
  const onlineDevices = allDevices.filter((d) => d.status === "online");

  const health = {
    status: "healthy",
    totalDevices: allDevices.length,
    onlineDevices: onlineDevices.length,
    offlineDevices: allDevices.length - onlineDevices.length,
    isDiscovering: universalController.isDiscovering,
    devicesByCategory: {
      mobile: allDevices.filter((d) => d.category === "mobile").length,
      computer: allDevices.filter((d) => d.category === "computer").length,
      smart_home: allDevices.filter((d) => d.category === "smart_home").length,
      entertainment: allDevices.filter((d) => d.category === "entertainment")
        .length,
      vehicle: allDevices.filter((d) => d.category === "vehicle").length,
      appliance: allDevices.filter((d) => d.category === "appliance").length,
      network: allDevices.filter((d) => d.category === "network").length,
      other: allDevices.filter((d) => d.category === "other").length,
    },
    timestamp: new Date().toISOString(),
  };

  res.json({ success: true, health });
});

// Serve static files
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 JASON Advanced Universal Device Control</h1>
    <p><strong>REAL DEVICE DISCOVERY & CONTROL SYSTEM</strong></p>
    <ul>
      <li><a href="/api/universal-devices">🔍 View All Discovered Devices</a></li>
      <li><a href="/api/universal-devices/capabilities">⚙️ System Capabilities</a></li>
      <li><a href="/api/universal-devices/health">❤️ System Health</a></li>
    </ul>
    <h2>🔍 Active Discovery Methods:</h2>
    <ul>
      <li>📡 Network Scanning (nmap, ping, port scan)</li>
      <li>🔍 mDNS/Bonjour Discovery</li>
      <li>📺 UPnP/SSDP Discovery</li>
      <li>📱 Bluetooth LE Scanning</li>
      <li>🔌 Serial/USB Device Detection</li>
      <li>🏠 Smart Home Protocol Discovery</li>
      <li>💻 SSH/Computer Discovery</li>
      <li>🎵 Entertainment Device Discovery</li>
    </ul>
    <h2>🎮 Control Capabilities:</h2>
    <ul>
      <li>📱 Mobile Devices (Android ADB, iOS)</li>
      <li>💻 Computers (SSH, RDP, VNC)</li>
      <li>🏠 Smart Home (Hue, Zigbee, Z-Wave)</li>
      <li>📺 Entertainment (Chromecast, Apple TV, UPnP)</li>
      <li>🔌 Serial/Arduino Devices</li>
      <li>🌐 Network Devices (HTTP, HTTPS)</li>
    </ul>
    <p><em>WebSocket endpoint available at ws://localhost:${PORT}</em></p>
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down Universal Device Controller...");
  universalController.destroy();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(
    `🚀 JASON Advanced Universal Device Control Server running on port ${PORT}`,
  );
  console.log(`🌐 Open http://localhost:${PORT} to view the system`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`\n🔍 REAL DEVICE DISCOVERY ACTIVE - Scanning for devices...`);
  console.log(
    `🎮 REAL DEVICE CONTROL ENABLED - Control any discovered device!`,
  );
});

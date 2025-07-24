import { networkInterfaces } from "os";
import * as dgram from "dgram";
import fetch from "node-fetch";
import * as mdns from "mdns-js";
import { EventEmitter } from "events";
import { Logger } from "../server/services/logger.js";

const logger = new Logger("RealDeviceDiscovery");

// Device discovery class
export class RealDeviceDiscovery extends EventEmitter {
  private devices: Map<string, any> = new Map();
  private scanning: boolean = false;
  private mdnsBrowser: any = null;
  private ssdpSocket: dgram.Socket | null = null;

  constructor() {
    super();
  }

  // Start device discovery
  async startDiscovery(): Promise<any[]> {
    if (this.scanning) return Array.from(this.devices.values());

    this.scanning = true;
    logger.info("Starting real device discovery...");

    try {
      // Run discovery methods in parallel
      await Promise.all([
        this.discoverWithMdns(),
        this.discoverWithSsdp(),
        this.discoverHueBridges(),
      ]);

      logger.info(`Discovery complete. Found ${this.devices.size} devices.`);
      return Array.from(this.devices.values());
    } catch (error) {
      logger.error("Error during device discovery:", error);
      return [];
    } finally {
      this.scanning = false;
    }
  }

  // Stop discovery
  stopDiscovery(): void {
    if (this.mdnsBrowser) {
      this.mdnsBrowser.stop();
      this.mdnsBrowser = null;
    }

    if (this.ssdpSocket) {
      this.ssdpSocket.close();
      this.ssdpSocket = null;
    }

    this.scanning = false;
    logger.info("Device discovery stopped");
  }

  // Get discovered devices
  getDevices(): any[] {
    return Array.from(this.devices.values());
  }

  // Discover devices using mDNS
  private async discoverWithMdns(): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        logger.info("Starting mDNS discovery...");
        this.mdnsBrowser = mdns.createBrowser(mdns.tcp("http"));

        this.mdnsBrowser.on("ready", () => {
          this.mdnsBrowser.discover();
        });

        this.mdnsBrowser.on("update", (data: any) => {
          try {
            if (data.addresses && data.addresses.length > 0) {
              const device = this.processMdnsDevice(data);
              if (device) {
                this.addDevice(device);
              }
            }
          } catch (err) {
            logger.error("Error processing mDNS device:", err);
          }
        });

        this.mdnsBrowser.on("error", (err: Error) => {
          logger.error("mDNS browser error:", err);
        });

        // Resolve after timeout
        setTimeout(() => {
          resolve();
        }, 5000);
      } catch (error) {
        logger.error("Error in mDNS discovery:", error);
        resolve();
      }
    });
  }

  // Process mDNS device data
  private processMdnsDevice(data: any): any | null {
    try {
      const name = data.name || "";
      const address = data.addresses?.[0] || "";
      const hostname = data.hostname || "";

      if (!address) return null;

      // Determine device type
      let type = "other";
      let protocol = "mdns";
      let manufacturer = "Unknown";

      if (hostname.includes("philips-hue") || name.includes("hue")) {
        type = "bridge";
        protocol = "hue";
        manufacturer = "Philips";
      } else if (hostname.includes("sonos") || name.includes("sonos")) {
        type = "speaker";
        manufacturer = "Sonos";
      }

      return {
        id: `mdns-${hostname || address}`,
        name: name || hostname || `Device at ${address}`,
        manufacturer,
        type,
        protocol,
        address,
        port: data.port,
        capabilities: [],
        online: true,
      };
    } catch (error) {
      logger.error("Error processing mDNS device:", error);
      return null;
    }
  }

  // Discover devices using SSDP
  private async discoverWithSsdp(): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        logger.info("Starting SSDP discovery...");

        this.ssdpSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
        const SSDP_ADDR = "239.255.255.250";
        const SSDP_PORT = 1900;

        this.ssdpSocket.on("message", (msg, rinfo) => {
          try {
            const message = msg.toString();

            // Extract location header
            const locationMatch = message.match(/LOCATION: (.*)/i);
            if (locationMatch && locationMatch[1]) {
              const location = locationMatch[1].trim();
              this.fetchSsdpDescription(location, rinfo.address);
            }
          } catch (err) {
            logger.error("Error processing SSDP message:", err);
          }
        });

        this.ssdpSocket.on("error", (err) => {
          logger.error("SSDP socket error:", err);
        });

        this.ssdpSocket.bind(() => {
          try {
            // Send M-SEARCH request
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
            logger.error("Error sending SSDP discovery message:", err);
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
        logger.error("Error in SSDP discovery:", error);
        resolve();
      }
    });
  }

  // Fetch SSDP device description
  private async fetchSsdpDescription(
    location: string,
    address: string,
  ): Promise<void> {
    try {
      const response = await fetch(location, { timeout: 2000 });
      const xml = await response.text();

      // Extract device info from XML
      const friendlyNameMatch = xml.match(
        /<friendlyName>([^<]+)<\/friendlyName>/,
      );
      const manufacturerMatch = xml.match(
        /<manufacturer>([^<]+)<\/manufacturer>/,
      );
      const modelNameMatch = xml.match(/<modelName>([^<]+)<\/modelName>/);
      const deviceTypeMatch = xml.match(/<deviceType>([^<]+)<\/deviceType>/);

      if (!friendlyNameMatch) return;

      const device = {
        id: `ssdp-${address}`,
        name: friendlyNameMatch[1],
        manufacturer: manufacturerMatch ? manufacturerMatch[1] : "Unknown",
        model: modelNameMatch ? modelNameMatch[1] : "Unknown",
        type: this.getSsdpDeviceType(deviceTypeMatch ? deviceTypeMatch[1] : ""),
        protocol: "upnp",
        address,
        capabilities: [],
        online: true,
      };

      this.addDevice(device);
    } catch (error) {
      // Ignore fetch errors
    }
  }

  // Get device type from SSDP device type
  private getSsdpDeviceType(deviceType: string): string {
    if (deviceType.includes("MediaRenderer")) return "speaker";
    if (deviceType.includes("Light")) return "light";
    if (deviceType.includes("Switch")) return "switch";
    return "other";
  }

  // Discover Philips Hue bridges
  private async discoverHueBridges(): Promise<void> {
    try {
      logger.info("Discovering Hue bridges...");

      // Try to use configured bridge IP first
      if (process.env.HUE_BRIDGE_IP) {
        const bridgeIp = process.env.HUE_BRIDGE_IP;
        try {
          const response = await fetch(`http://${bridgeIp}/api/config`, {
            timeout: 2000,
          });
          const data = await response.json();

          if (data.bridgeid) {
            const device = {
              id: `hue-bridge-${data.bridgeid}`,
              name: data.name || "Philips Hue Bridge",
              manufacturer: "Philips",
              model: "Hue Bridge",
              type: "bridge",
              protocol: "hue",
              address: bridgeIp,
              capabilities: ["lights"],
              online: true,
            };

            this.addDevice(device);

            // If we have a username, discover lights
            if (process.env.HUE_USERNAME) {
              await this.discoverHueLights(bridgeIp);
            }

            return;
          }
        } catch (err) {
          logger.warn(
            `Failed to connect to configured Hue bridge at ${bridgeIp}:`,
            err,
          );
        }
      }

      // Fall back to discovery API
      try {
        const response = await fetch("https://discovery.meethue.com/");
        const bridges = await response.json();

        for (const bridge of bridges) {
          if (bridge.internalipaddress) {
            const device = {
              id: `hue-bridge-${bridge.id}`,
              name: "Philips Hue Bridge",
              manufacturer: "Philips",
              model: "Hue Bridge",
              type: "bridge",
              protocol: "hue",
              address: bridge.internalipaddress,
              capabilities: ["lights"],
              online: true,
            };

            this.addDevice(device);

            // If we have a username, discover lights
            if (process.env.HUE_USERNAME) {
              await this.discoverHueLights(bridge.internalipaddress);
            }
          }
        }
      } catch (error) {
        logger.error("Error discovering Hue bridges via discovery API:", error);
      }
    } catch (error) {
      logger.error("Error in Hue bridge discovery:", error);
    }
  }

  // Discover Hue lights
  private async discoverHueLights(bridgeIp: string): Promise<void> {
    try {
      const username = process.env.HUE_USERNAME;
      if (!username) {
        logger.warn("HUE_USERNAME not set, skipping light discovery");
        return;
      }

      logger.info(`Discovering Hue lights from bridge at ${bridgeIp}...`);

      const response = await fetch(`http://${bridgeIp}/api/${username}/lights`);
      const lights = await response.json();

      if (lights.error) {
        logger.error("Error from Hue API:", lights.error);
        return;
      }

      for (const [id, light] of Object.entries(lights)) {
        const device = {
          id: `hue-light-${id}`,
          name: light.name,
          manufacturer: "Philips",
          model: light.modelid || "Hue Light",
          type: "light",
          protocol: "hue",
          address: bridgeIp,
          bridgeId: id,
          capabilities: this.getHueCapabilities(light),
          state: {
            on: light.state?.on || false,
            brightness: light.state?.bri
              ? Math.round((light.state.bri / 254) * 100)
              : 0,
          },
          online: light.state?.reachable || false,
        };

        this.addDevice(device);
      }

      logger.info(`Discovered ${Object.keys(lights).length} Hue lights`);
    } catch (error) {
      logger.error("Error discovering Hue lights:", error);
    }
  }

  // Get Hue light capabilities
  private getHueCapabilities(light: any): string[] {
    const capabilities = ["on"];

    if (light.state?.bri !== undefined) {
      capabilities.push("brightness");
    }

    if (light.state?.hue !== undefined && light.state?.sat !== undefined) {
      capabilities.push("color");
    }

    if (light.state?.ct !== undefined) {
      capabilities.push("temperature");
    }

    return capabilities;
  }

  // Add device to the device map
  private addDevice(device: any): void {
    this.devices.set(device.id, device);
    this.emit("deviceDiscovered", device);
    logger.info(`Discovered device: ${device.name} (${device.protocol})`);
  }
}

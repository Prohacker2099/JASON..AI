import { exec } from "child_process";
import { promisify } from "util";
import { networkInterfaces } from "os";
import fetch from "node-fetch";
import * as mdns from "mdns-js";
import * as dgram from "dgram";

const execAsync = promisify(exec);

// Store discovered devices
const discoveredDevices = new Map<string, any>();

/**
 * Scan local network for WiFi devices
 */
export async function scanNetwork(): Promise<any[]> {
  try {
    console.log("Starting real WiFi network scan...");

    // Clear existing devices
    discoveredDevices.clear();

    // Run network scan methods in parallel
    await Promise.all([scanWithNmap(), scanWithMdns(), scanWithSsdp()]);

    // Return all discovered devices
    return Array.from(discoveredDevices.values());
  } catch (error) {
    console.error("Error scanning WiFi devices:", error);
    return [];
  }
}

/**
 * Scan network using nmap
 */
async function scanWithNmap(): Promise<void> {
  try {
    // Get local network interfaces
    const networkPrefixes = getNetworkPrefixes();

    for (const prefix of networkPrefixes) {
      try {
        console.log(`Scanning network ${prefix}.0/24 with nmap...`);

        // Use nmap to scan network (requires nmap to be installed)
        const { stdout } = await execAsync(`nmap -sn ${prefix}.0/24 --open`);

        // Parse nmap output
        const hosts = parseNmapOutput(stdout);
        console.log(`Found ${hosts.length} hosts on network ${prefix}.0/24`);

        // Try to identify devices
        for (const host of hosts) {
          try {
            await identifyDevice(host.ip);
          } catch (err) {
            console.error(`Error identifying device at ${host.ip}:`, err);
          }
        }
      } catch (err) {
        console.error(`Error scanning network ${prefix}.0/24:`, err);
      }
    }
  } catch (error) {
    console.error("Error in nmap scan:", error);
  }
}

/**
 * Get network prefixes from local interfaces
 */
function getNetworkPrefixes(): string[] {
  const networkPrefixes: string[] = [];
  const interfaces = networkInterfaces();

  Object.values(interfaces).forEach((iface) => {
    if (iface) {
      iface.forEach((addr) => {
        if (addr.family === "IPv4" && !addr.internal) {
          const parts = addr.address.split(".");
          const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
          if (!networkPrefixes.includes(prefix)) {
            networkPrefixes.push(prefix);
          }
        }
      });
    }
  });

  return networkPrefixes;
}

/**
 * Parse nmap output to extract hosts
 */
function parseNmapOutput(
  output: string,
): { ip: string; mac?: string; hostname?: string }[] {
  const hosts: { ip: string; mac?: string; hostname?: string }[] = [];
  const lines = output.split("\n");

  let currentHost: { ip: string; mac?: string; hostname?: string } | null =
    null;

  for (const line of lines) {
    // Check for IP address
    const ipMatch = line.match(
      /Nmap scan report for (?:([^\s]+) )??\\(([0-9.]+)\\)/,
    );
    if (ipMatch) {
      if (currentHost) {
        hosts.push(currentHost);
      }

      currentHost = {
        ip: ipMatch[2],
        hostname: ipMatch[1],
      };
      continue;
    }

    // Check for MAC address
    const macMatch = line.match(/MAC Address: ([0-9A-F:]+) \\(([^)]+)\\)/);
    if (macMatch && currentHost) {
      currentHost.mac = macMatch[1];
      continue;
    }
  }

  if (currentHost) {
    hosts.push(currentHost);
  }

  return hosts;
}

/**
 * Scan network using mDNS/Bonjour
 */
async function scanWithMdns(): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      console.log("Scanning for mDNS/Bonjour devices...");

      // Create browser for all services
      const browser = mdns.createBrowser(mdns.tcp("http"));

      browser.on("ready", () => {
        browser.discover();
      });

      browser.on("update", (data: any) => {
        try {
          // Process discovered service
          if (data.addresses && data.addresses.length > 0) {
            processMdnsDevice(data);
          }
        } catch (err) {
          console.error("Error processing mDNS device:", err);
        }
      });

      // Resolve after a timeout to allow some devices to be discovered
      setTimeout(() => {
        browser.stop();
        resolve();
      }, 5000);
    } catch (error) {
      console.error("Error scanning mDNS:", error);
      resolve();
    }
  });
}

/**
 * Process mDNS device data
 */
function processMdnsDevice(data: any): void {
  try {
    // Extract useful information
    const name = data.name || "";
    const address = data.addresses?.[0] || "";
    const port = data.port || 80;
    const hostname = data.hostname || "";

    // Try to determine device type and protocol
    let type = "other";
    let protocol = "mdns";
    let manufacturer = "Unknown";

    // Check for known device patterns
    if (hostname.includes("philips-hue") || name.includes("hue")) {
      type = "light";
      protocol = "hue";
      manufacturer = "Philips";
    } else if (hostname.includes("lifx")) {
      type = "light";
      protocol = "lifx";
      manufacturer = "LIFX";
    } else if (hostname.includes("wemo") || name.includes("wemo")) {
      type = "switch";
      protocol = "wemo";
      manufacturer = "Belkin";
    } else if (hostname.includes("nest") || name.includes("nest")) {
      type = "thermostat";
      manufacturer = "Nest";
    } else if (hostname.includes("ring") || name.includes("ring")) {
      type = "camera";
      manufacturer = "Ring";
    } else if (hostname.includes("sonos") || name.includes("sonos")) {
      type = "speaker";
      manufacturer = "Sonos";
    } else if (hostname.includes("roku") || name.includes("roku")) {
      type = "display";
      manufacturer = "Roku";
    } else if (hostname.includes("chromecast") || name.includes("chromecast")) {
      type = "display";
      manufacturer = "Google";
    } else if (hostname.includes("apple-tv") || name.includes("apple-tv")) {
      type = "display";
      manufacturer = "Apple";
    }

    // Create device info object
    const deviceInfo = {
      id: `mdns-${hostname}-${address}`,
      name: name || hostname,
      hostname,
      manufacturer,
      type,
      protocol,
      address,
      port,
      capabilities: [],
      online: true,
      discovered: new Date().toISOString(),
    };

    // Add to discovered devices
    discoveredDevices.set(deviceInfo.id, deviceInfo);
    console.log(
      `Discovered mDNS device: ${deviceInfo.name} (${deviceInfo.address})`,
    );
  } catch (error) {
    console.error("Error processing mDNS device:", error);
  }
}

/**
 * Scan network using SSDP/UPnP
 */
async function scanWithSsdp(): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      console.log("Scanning for SSDP/UPnP devices...");

      const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
      const ssdpAddress = "239.255.255.250";
      const ssdpPort = 1900;
      const deviceLocations = new Set<string>();

      socket.on("error", (err) => {
        console.error("SSDP socket error:", err);
        socket.close();
        resolve();
      });

      socket.on("message", (msg, rinfo) => {
        try {
          const message = msg.toString();

          // Extract location header from SSDP response
          const locationMatch = message.match(/LOCATION: (.*)/i);
          if (locationMatch && locationMatch[1]) {
            const location = locationMatch[1].trim();

            // Avoid processing the same location multiple times
            if (!deviceLocations.has(location)) {
              deviceLocations.add(location);
              fetchDeviceDescription(location, rinfo.address);
            }
          }
        } catch (err) {
          console.error("Error processing SSDP message:", err);
        }
      });

      socket.bind(() => {
        socket.setBroadcast(true);

        // Send M-SEARCH request
        const ssdpRequest = Buffer.from(
          "M-SEARCH * HTTP/1.1\r\n" +
            `HOST: ${ssdpAddress}:${ssdpPort}\r\n` +
            'MAN: "ssdp:discover"\r\n' +
            "MX: 3\r\n" +
            "ST: ssdp:all\r\n\r\n",
        );

        socket.send(ssdpRequest, 0, ssdpRequest.length, ssdpPort, ssdpAddress);

        // Close socket after timeout
        setTimeout(() => {
          socket.close();
          resolve();
        }, 5000);
      });
    } catch (error) {
      console.error("Error scanning SSDP:", error);
      resolve();
    }
  });
}

/**
 * Fetch device description from UPnP location URL
 */
async function fetchDeviceDescription(
  location: string,
  address: string,
): Promise<void> {
  try {
    const response = await fetch(location, { timeout: 2000 });
    const xml = await response.text();

    // Process device description
    processUpnpDevice(address, xml, location);
  } catch (error) {
    console.error(`Error fetching device description from ${location}:`, error);
  }
}

/**
 * Process UPnP device data
 */
function processUpnpDevice(
  ip: string,
  description: string,
  location: string,
): void {
  try {
    // Extract device information from XML
    const friendlyNameMatch = description.match(
      /<friendlyName>([^<]+)<\/friendlyName>/,
    );
    const manufacturerMatch = description.match(
      /<manufacturer>([^<]+)<\/manufacturer>/,
    );
    const modelNameMatch = description.match(/<modelName>([^<]+)<\/modelName>/);
    const deviceTypeMatch = description.match(
      /<deviceType>([^<]+)<\/deviceType>/,
    );
    const udnMatch = description.match(/<UDN>([^<]+)<\/UDN>/);

    const friendlyName = friendlyNameMatch
      ? friendlyNameMatch[1]
      : "Unknown Device";
    const manufacturer = manufacturerMatch ? manufacturerMatch[1] : "Unknown";
    const modelName = modelNameMatch ? modelNameMatch[1] : "Unknown";
    const deviceType = deviceTypeMatch ? deviceTypeMatch[1] : "";
    const udn = udnMatch ? udnMatch[1] : "";

    // Determine device type
    let type = "other";
    let capabilities: string[] = [];

    if (deviceType.includes("MediaRenderer")) {
      type = "speaker";
      capabilities = ["audio", "streaming"];
    } else if (deviceType.includes("MediaServer")) {
      type = "media";
      capabilities = ["content"];
    } else if (deviceType.includes("Light")) {
      type = "light";
      capabilities = ["on", "brightness"];
    } else if (deviceType.includes("Switch")) {
      type = "switch";
      capabilities = ["on"];
    } else if (deviceType.includes("Camera")) {
      type = "camera";
      capabilities = ["stream"];
    }

    // Create device info object
    const deviceInfo = {
      id: `upnp-${udn || ip}`,
      name: friendlyName,
      manufacturer,
      model: modelName,
      type,
      protocol: "upnp",
      address: ip,
      capabilities,
      online: true,
      discovered: new Date().toISOString(),
      location,
    };

    // Add to discovered devices
    discoveredDevices.set(deviceInfo.id, deviceInfo);
    console.log(
      `Discovered UPnP device: ${deviceInfo.name} (${deviceInfo.address})`,
    );
  } catch (error) {
    console.error("Error processing UPnP device:", error);
  }
}

/**
 * Try to identify a device by its IP address
 */
async function identifyDevice(ip: string): Promise<void> {
  try {
    // Try common device APIs
    await Promise.all([
      identifyHueDevice(ip),
      identifyWemoDevice(ip),
      identifyLifxDevice(ip),
    ]);
  } catch (error) {
    console.error(`Error identifying device at ${ip}:`, error);
  }
}

/**
 * Try to identify a Philips Hue device
 */
async function identifyHueDevice(ip: string): Promise<void> {
  try {
    const response = await fetch(`http://${ip}/api/v1/config`, {
      timeout: 1000,
    });

    if (!response.ok) return;

    const data = await response.json();

    if (data.name && data.bridgeid) {
      const deviceInfo = {
        id: `hue-${data.bridgeid}`,
        name: data.name,
        manufacturer: "Philips",
        model: "Hue Bridge",
        type: "bridge",
        protocol: "hue",
        address: ip,
        capabilities: ["lights", "scenes"],
        online: true,
        discovered: new Date().toISOString(),
      };

      discoveredDevices.set(deviceInfo.id, deviceInfo);
      console.log(
        `Discovered Hue bridge: ${deviceInfo.name} (${deviceInfo.address})`,
      );

      // If we have a username, try to get lights
      if (process.env.HUE_USERNAME) {
        await scanHueLights(ip);
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Scan for Hue lights from a bridge
 */
async function scanHueLights(bridgeIp: string): Promise<void> {
  try {
    const username = process.env.HUE_USERNAME;
    if (!username) return;

    const response = await fetch(`http://${bridgeIp}/api/${username}/lights`);
    const lights = await response.json();

    for (const [id, light] of Object.entries(lights)) {
      const lightInfo = {
        id: `hue-light-${id}`,
        name: light.name,
        manufacturer: "Philips",
        model: light.modelid || "Hue Light",
        type: "light",
        protocol: "hue",
        address: bridgeIp,
        bridgeId: id,
        capabilities: getHueCapabilities(light),
        state: {
          on: light.state?.on || false,
          brightness: light.state?.bri
            ? Math.round((light.state.bri / 254) * 100)
            : 0,
          reachable: light.state?.reachable || false,
        },
        online: light.state?.reachable || false,
        discovered: new Date().toISOString(),
      };

      discoveredDevices.set(lightInfo.id, lightInfo);
      console.log(`Discovered Hue light: ${lightInfo.name}`);
    }
  } catch (error) {
    console.error("Error scanning Hue lights:", error);
  }
}

/**
 * Get capabilities for a Hue light
 */
function getHueCapabilities(light: any): string[] {
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

/**
 * Try to identify a Belkin WeMo device
 */
async function identifyWemoDevice(ip: string): Promise<void> {
  try {
    // WeMo devices use UPnP for discovery
    const ports = [49153, 49152, 49154, 49151];

    for (const port of ports) {
      try {
        const response = await fetch(`http://${ip}:${port}/setup.xml`, {
          timeout: 1000,
        });

        if (!response.ok) continue;

        const text = await response.text();

        if (text.includes("Belkin") && text.includes("WeMo")) {
          // Extract device info from XML
          const nameMatch = text.match(/<friendlyName>([^<]+)<\/friendlyName>/);
          const name = nameMatch ? nameMatch[1] : "WeMo Device";

          const modelMatch = text.match(/<modelName>([^<]+)<\/modelName>/);
          const model = modelMatch ? modelMatch[1] : "Unknown";

          const serialMatch = text.match(
            /<serialNumber>([^<]+)<\/serialNumber>/,
          );
          const serial = serialMatch ? serialMatch[1] : "";

          const deviceInfo = {
            id: `wemo-${serial || ip.replace(/\./g, "-")}`,
            name,
            manufacturer: "Belkin",
            model,
            type: model.includes("Light") ? "light" : "switch",
            protocol: "wemo",
            address: ip,
            port,
            capabilities: ["on"],
            online: true,
            discovered: new Date().toISOString(),
          };

          discoveredDevices.set(deviceInfo.id, deviceInfo);
          console.log(
            `Discovered WeMo device: ${deviceInfo.name} (${deviceInfo.address})`,
          );
          return;
        }
      } catch (err) {
        // Try next port
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Try to identify a LIFX device
 */
async function identifyLifxDevice(ip: string): Promise<void> {
  try {
    // LIFX devices use a custom protocol, but we can try HTTP
    const response = await fetch(`http://${ip}:56700/info`, {
      timeout: 1000,
    });

    if (!response.ok) return;

    const data = await response.json();

    if (data.product_name && data.vendor_name === "LIFX") {
      const deviceInfo = {
        id: `lifx-${data.device_id || ip.replace(/\./g, "-")}`,
        name: data.product_name,
        manufacturer: "LIFX",
        model: data.product_name,
        type: "light",
        protocol: "lifx",
        address: ip,
        capabilities: ["on", "brightness", "color"],
        online: true,
        discovered: new Date().toISOString(),
      };

      discoveredDevices.set(deviceInfo.id, deviceInfo);
      console.log(
        `Discovered LIFX device: ${deviceInfo.name} (${deviceInfo.address})`,
      );
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get all discovered devices
 */
export function getDiscoveredDevices(): any[] {
  return Array.from(discoveredDevices.values());
}

import fetch from "node-fetch";
import { networkInterfaces } from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Cache for discovered devices
const discoveredDevices = new Map<string, any>();

/**
 * Scan local network for WiFi devices
 */
export async function scanNetwork(): Promise<any[]> {
  try {
    // Get local network interfaces
    const interfaces = networkInterfaces();
    const networkAddresses: string[] = [];

    // Extract IPv4 addresses
    Object.values(interfaces).forEach((iface) => {
      if (iface) {
        iface.forEach((addr) => {
          if (addr.family === "IPv4" && !addr.internal) {
            // Get network prefix
            const parts = addr.address.split(".");
            const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
            networkAddresses.push(prefix);
          }
        });
      }
    });

    // Scan each network
    const devices: any[] = [];

    for (const prefix of networkAddresses) {
      try {
        // Use nmap to scan network (requires nmap to be installed)
        console.log(`Scanning network: ${prefix}.0/24`);

        const { stdout } = await execAsync(`nmap -sn ${prefix}.0/24 --open`);

        // Parse nmap output
        const hosts = parseNmapOutput(stdout);

        // Try to identify devices
        for (const host of hosts) {
          try {
            const device = await identifyDevice(host.ip);
            if (device) {
              devices.push(device);
              discoveredDevices.set(device.id, device);
            }
          } catch (err) {
            console.error(`Error identifying device at ${host.ip}:`, err);
          }
        }
      } catch (err) {
        console.error(`Error scanning network ${prefix}.0/24:`, err);
      }
    }

    return devices;
  } catch (error) {
    console.error("Error scanning WiFi devices:", error);
    return [];
  }
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
      /Nmap scan report for (?:([^\s]+) )??\(([0-9.]+)\)/,
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
    const macMatch = line.match(/MAC Address: ([0-9A-F:]+) \(([^)]+)\)/);
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
 * Try to identify a device by its IP address
 */
async function identifyDevice(ip: string): Promise<any | null> {
  try {
    // Try common device APIs
    const device = await Promise.race([
      identifyHueDevice(ip),
      identifyWemoDevice(ip),
      identifyLifxDevice(ip),
      identifyTuyaDevice(ip),
      identifyGenericDevice(ip),
    ]);

    return device;
  } catch (error) {
    console.error(`Error identifying device at ${ip}:`, error);
    return null;
  }
}

/**
 * Try to identify a Philips Hue device
 */
async function identifyHueDevice(ip: string): Promise<any | null> {
  try {
    const response = await fetch(`http://${ip}/api/v1/config`, {
      timeout: 2000,
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.name && data.bridgeid) {
      return {
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
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Try to identify a Belkin WeMo device
 */
async function identifyWemoDevice(ip: string): Promise<any | null> {
  try {
    // WeMo devices use UPnP for discovery
    const response = await fetch(`http://${ip}:49153/setup.xml`, {
      timeout: 2000,
    });

    if (!response.ok) return null;

    const text = await response.text();

    if (text.includes("Belkin") && text.includes("WeMo")) {
      // Extract device info from XML
      const nameMatch = text.match(/<friendlyName>([^<]+)<\/friendlyName>/);
      const name = nameMatch ? nameMatch[1] : "WeMo Device";

      const modelMatch = text.match(/<modelName>([^<]+)<\/modelName>/);
      const model = modelMatch ? modelMatch[1] : "Unknown";

      const serialMatch = text.match(/<serialNumber>([^<]+)<\/serialNumber>/);
      const serial = serialMatch ? serialMatch[1] : "";

      return {
        id: `wemo-${serial || ip.replace(/\./g, "-")}`,
        name,
        manufacturer: "Belkin",
        model,
        type: model.includes("Light") ? "light" : "switch",
        protocol: "wemo",
        address: ip,
        capabilities: ["on"],
        online: true,
        discovered: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Try to identify a LIFX device
 */
async function identifyLifxDevice(ip: string): Promise<any | null> {
  try {
    // LIFX devices use a custom protocol, but we can try HTTP
    const response = await fetch(`http://${ip}:56700/info`, {
      timeout: 2000,
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.product_name && data.vendor_name === "LIFX") {
      return {
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
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Try to identify a Tuya device
 */
async function identifyTuyaDevice(ip: string): Promise<any | null> {
  try {
    // Tuya devices use a custom protocol, but we can try HTTP
    const response = await fetch(`http://${ip}/device`, {
      timeout: 2000,
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.id && data.type) {
      return {
        id: `tuya-${data.id}`,
        name: data.name || "Tuya Device",
        manufacturer: "Tuya",
        model: data.model || "Unknown",
        type: mapTuyaType(data.type),
        protocol: "tuya",
        address: ip,
        capabilities: getTuyaCapabilities(data.type),
        online: true,
        discovered: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Try to identify a generic device
 */
async function identifyGenericDevice(ip: string): Promise<any | null> {
  try {
    // Try to get device info from common ports
    const ports = [80, 8080, 443, 8443];

    for (const port of ports) {
      try {
        const response = await fetch(`http://${ip}:${port}`, {
          timeout: 1000,
        });

        if (response.ok) {
          const text = await response.text();

          // Try to identify device from response
          if (text.includes("camera") || text.includes("RTSP")) {
            return {
              id: `camera-${ip.replace(/\./g, "-")}`,
              name: `Camera at ${ip}`,
              manufacturer: "Unknown",
              model: "IP Camera",
              type: "camera",
              protocol: "http",
              address: ip,
              port,
              capabilities: ["stream"],
              online: true,
              discovered: new Date().toISOString(),
            };
          }

          if (text.includes("thermostat") || text.includes("temperature")) {
            return {
              id: `thermostat-${ip.replace(/\./g, "-")}`,
              name: `Thermostat at ${ip}`,
              manufacturer: "Unknown",
              model: "Smart Thermostat",
              type: "thermostat",
              protocol: "http",
              address: ip,
              port,
              capabilities: ["temperature"],
              online: true,
              discovered: new Date().toISOString(),
            };
          }

          // Generic device
          return {
            id: `device-${ip.replace(/\./g, "-")}`,
            name: `Device at ${ip}`,
            manufacturer: "Unknown",
            model: "Unknown",
            type: "other",
            protocol: "http",
            address: ip,
            port,
            capabilities: [],
            online: true,
            discovered: new Date().toISOString(),
          };
        }
      } catch (err) {
        // Ignore errors and try next port
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Map Tuya device type to standard type
 */
function mapTuyaType(type: string): string {
  switch (type.toLowerCase()) {
    case "light":
    case "bulb":
      return "light";
    case "switch":
      return "switch";
    case "outlet":
    case "plug":
      return "outlet";
    case "thermostat":
      return "thermostat";
    case "camera":
      return "camera";
    case "lock":
      return "lock";
    case "sensor":
      return "sensor";
    default:
      return "other";
  }
}

/**
 * Get capabilities for Tuya device type
 */
function getTuyaCapabilities(type: string): string[] {
  switch (type.toLowerCase()) {
    case "light":
    case "bulb":
      return ["on", "brightness", "color"];
    case "switch":
      return ["on"];
    case "outlet":
    case "plug":
      return ["on", "energy"];
    case "thermostat":
      return ["temperature", "mode", "target"];
    case "camera":
      return ["stream", "snapshot"];
    case "lock":
      return ["lock", "unlock"];
    case "sensor":
      return ["value"];
    default:
      return [];
  }
}

/**
 * Control a WiFi device
 */
export async function controlDevice(
  deviceId: string,
  command: any,
): Promise<any> {
  try {
    const device = discoveredDevices.get(deviceId);

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    // Determine protocol and call appropriate handler
    switch (device.protocol) {
      case "hue":
        return await controlHueDevice(device, command);
      case "wemo":
        return await controlWemoDevice(device, command);
      case "lifx":
        return await controlLifxDevice(device, command);
      case "tuya":
        return await controlTuyaDevice(device, command);
      case "http":
        return await controlHttpDevice(device, command);
      default:
        throw new Error(`Unsupported protocol: ${device.protocol}`);
    }
  } catch (error) {
    console.error(`Error controlling device ${deviceId}:`, error);
    throw error;
  }
}

/**
 * Control a Philips Hue device
 */
async function controlHueDevice(device: any, command: any): Promise<any> {
  try {
    const username = process.env.HUE_USERNAME;

    if (!username) {
      throw new Error("Hue username not configured");
    }

    // If this is a bridge, we need the light ID
    const lightId = device.bridgeId || command.lightId;

    if (!lightId) {
      throw new Error("Light ID not specified");
    }

    // Prepare command payload
    const payload: any = {};

    if (command.on !== undefined) {
      payload.on = command.on;
    }

    if (command.brightness !== undefined) {
      payload.bri = Math.max(
        1,
        Math.min(254, Math.round(command.brightness * 2.54)),
      );
    }

    if (command.color) {
      // Convert color to Hue format
      // This is simplified - a real implementation would convert RGB/HSV to Hue's color space
      payload.hue = (command.color.h * 65535) / 360;
      payload.sat = (command.color.s * 254) / 100;
    }

    // Send command to Hue bridge
    const response = await fetch(
      `http://${device.address}/api/${username}/lights/${lightId}/state`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      },
    );

    const result = await response.json();

    return {
      success: true,
      deviceId: device.id,
      state: {
        on: command.on !== undefined ? command.on : device.state?.on,
        brightness:
          command.brightness !== undefined
            ? command.brightness
            : device.state?.brightness,
        color: command.color || device.state?.color,
      },
    };
  } catch (error) {
    console.error(`Error controlling Hue device:`, error);
    throw error;
  }
}

/**
 * Control a Belkin WeMo device
 */
async function controlWemoDevice(device: any, command: any): Promise<any> {
  try {
    // WeMo uses SOAP for control
    const soapAction =
      command.on !== undefined
        ? "urn:Belkin:service:basicevent:1#SetBinaryState"
        : "urn:Belkin:service:basicevent:1#GetBinaryState";

    const soapBody =
      command.on !== undefined
        ? `<?xml version="1.0" encoding="utf-8"?>
         <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
           <s:Body>
             <u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">
               <BinaryState>${command.on ? 1 : 0}</BinaryState>
             </u:SetBinaryState>
           </s:Body>
         </s:Envelope>`
        : `<?xml version="1.0" encoding="utf-8"?>
         <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
           <s:Body>
             <u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">
             </u:GetBinaryState>
           </s:Body>
         </s:Envelope>`;

    // Send SOAP request
    const response = await fetch(
      `http://${device.address}:49153/upnp/control/basicevent1`,
      {
        method: "POST",
        headers: {
          "Content-Type": 'text/xml; charset="utf-8"',
          SOAPACTION: `"${soapAction}"`,
          Connection: "keep-alive",
        },
        body: soapBody,
      },
    );

    const result = await response.text();

    // Parse response
    const stateMatch = result.match(/<BinaryState>(\d)<\/BinaryState>/);
    const state = stateMatch ? stateMatch[1] === "1" : command.on;

    return {
      success: true,
      deviceId: device.id,
      state: {
        on: state,
      },
    };
  } catch (error) {
    console.error(`Error controlling WeMo device:`, error);
    throw error;
  }
}

/**
 * Control a LIFX device
 */
async function controlLifxDevice(device: any, command: any): Promise<any> {
  try {
    // LIFX API requires an API token
    const token = process.env.LIFX_TOKEN;

    if (!token) {
      throw new Error("LIFX token not configured");
    }

    // Prepare command payload
    const payload: any = {};

    if (command.on !== undefined) {
      payload.power = command.on ? "on" : "off";
    }

    if (command.brightness !== undefined) {
      payload.brightness = command.brightness / 100;
    }

    if (command.color) {
      payload.color = `hue:${command.color.h} saturation:${command.color.s / 100} brightness:${command.color.v / 100}`;
    }

    // Send command to LIFX API
    const response = await fetch(
      `https://api.lifx.com/v1/lights/id:${device.id.replace("lifx-", "")}/state`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    return {
      success: result.results.some((r: any) => r.status === "ok"),
      deviceId: device.id,
      state: {
        on: command.on !== undefined ? command.on : device.state?.on,
        brightness:
          command.brightness !== undefined
            ? command.brightness
            : device.state?.brightness,
        color: command.color || device.state?.color,
      },
    };
  } catch (error) {
    console.error(`Error controlling LIFX device:`, error);
    throw error;
  }
}

/**
 * Control a Tuya device
 */
async function controlTuyaDevice(device: any, command: any): Promise<any> {
  try {
    // Tuya API requires credentials
    const accessId = process.env.TUYA_ACCESS_ID;
    const accessKey = process.env.TUYA_ACCESS_KEY;

    if (!accessId || !accessKey) {
      throw new Error("Tuya credentials not configured");
    }

    // Prepare command payload based on device type
    const payload: any = {};

    switch (device.type) {
      case "light":
        if (command.on !== undefined)
          payload.switch = command.on ? "on" : "off";
        if (command.brightness !== undefined)
          payload.bright_value = command.brightness;
        if (command.color) {
          payload.colour_data = {
            h: command.color.h,
            s: command.color.s,
            v: command.color.v,
          };
        }
        break;

      case "switch":
      case "outlet":
        if (command.on !== undefined)
          payload.switch = command.on ? "on" : "off";
        break;

      case "thermostat":
        if (command.temperature !== undefined)
          payload.temp_set = command.temperature;
        if (command.mode !== undefined) payload.mode = command.mode;
        break;

      default:
        throw new Error(`Unsupported device type: ${device.type}`);
    }

    // Send command to Tuya API
    // This is a simplified example - real implementation would require proper authentication
    const response = await fetch(
      `https://openapi.tuyaus.com/v1.0/devices/${device.id.replace("tuya-", "")}/commands`,
      {
        method: "POST",
        headers: {
          client_id: accessId,
          sign: "SIGNATURE", // Real implementation would calculate this
          t: Date.now().toString(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commands: [
            {
              code: "control",
              value: payload,
            },
          ],
        }),
      },
    );

    const result = await response.json();

    return {
      success: result.success,
      deviceId: device.id,
      state: {
        ...device.state,
        ...command,
      },
    };
  } catch (error) {
    console.error(`Error controlling Tuya device:`, error);
    throw error;
  }
}

/**
 * Control a generic HTTP device
 */
async function controlHttpDevice(device: any, command: any): Promise<any> {
  try {
    // This is a simplified implementation - real devices would have specific APIs
    const response = await fetch(
      `http://${device.address}:${device.port || 80}/control`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      deviceId: device.id,
      state: {
        ...device.state,
        ...command,
      },
    };
  } catch (error) {
    console.error(`Error controlling HTTP device:`, error);
    throw error;
  }
}

/**
 * Get all discovered devices
 */
export function getDiscoveredDevices(): any[] {
  return Array.from(discoveredDevices.values());
}

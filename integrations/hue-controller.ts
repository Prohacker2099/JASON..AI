import fetch from "node-fetch";

// Store discovered lights
const discoveredLights = new Map<string, any>();
let bridgeIp: string | null = null;
let username: string | null = null;

/**
 * Initialize Hue integration
 */
export async function initialize(): Promise<boolean> {
  try {
    // Get bridge IP from environment variable or discover it
    bridgeIp = process.env.HUE_BRIDGE_IP || (await discoverBridge());
    username = process.env.HUE_USERNAME || null;

    if (!bridgeIp) {
      console.error(
        "No Hue bridge found. Set HUE_BRIDGE_IP in .env or ensure bridge is discoverable.",
      );
      return false;
    }

    if (!username) {
      console.error(
        "No Hue username configured. Set HUE_USERNAME in .env or press the link button and call registerApp().",
      );
      return false;
    }

    console.log(`Hue integration initialized with bridge at ${bridgeIp}`);

    // Get initial lights
    await getLights();

    return true;
  } catch (error) {
    console.error("Error initializing Hue integration:", error);
    return false;
  }
}

/**
 * Discover Hue bridge on the network
 */
async function discoverBridge(): Promise<string | null> {
  try {
    console.log("Discovering Hue bridge...");

    // Try Philips discovery API
    const response = await fetch("https://discovery.meethue.com/");
    const bridges = await response.json();

    if (bridges && bridges.length > 0 && bridges[0].internalipaddress) {
      console.log(`Found Hue bridge at ${bridges[0].internalipaddress}`);
      return bridges[0].internalipaddress;
    }

    console.log("No Hue bridge found via discovery API");
    return null;
  } catch (error) {
    console.error("Error discovering Hue bridge:", error);
    return null;
  }
}

/**
 * Register app with Hue bridge
 * Note: The link button on the bridge must be pressed before calling this
 */
export async function registerApp(): Promise<string | null> {
  try {
    if (!bridgeIp) {
      console.error("No Hue bridge IP configured");
      return null;
    }

    console.log("Registering app with Hue bridge...");
    console.log("Make sure the link button on the Hue bridge is pressed");

    const response = await fetch(`http://${bridgeIp}/api`, {
      method: "POST",
      body: JSON.stringify({
        devicetype: "jason_smart_home",
      }),
    });

    const result = await response.json();

    if (result[0].success) {
      username = result[0].success.username;
      console.log(
        `Successfully registered app with Hue bridge. Username: ${username}`,
      );
      console.log("Add this username to your .env file as HUE_USERNAME");
      return username;
    } else if (result[0].error) {
      console.error(`Error registering app: ${result[0].error.description}`);
    }

    return null;
  } catch (error) {
    console.error("Error registering app with Hue bridge:", error);
    return null;
  }
}

/**
 * Get all lights from Hue bridge
 */
export async function getLights(): Promise<any[]> {
  try {
    if (!bridgeIp || !username) {
      console.error("Hue bridge IP or username not configured");
      return [];
    }

    console.log("Getting lights from Hue bridge...");

    const response = await fetch(`http://${bridgeIp}/api/${username}/lights`);
    const lights = await response.json();

    // Clear existing lights
    discoveredLights.clear();

    // Process lights
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
        capabilities: getCapabilities(light),
        state: {
          on: light.state?.on || false,
          brightness: light.state?.bri
            ? Math.round((light.state.bri / 254) * 100)
            : 0,
          color: light.state?.hue
            ? {
                h: Math.round((light.state.hue / 65535) * 360),
                s: Math.round((light.state.sat / 254) * 100),
                v: Math.round((light.state.bri / 254) * 100),
              }
            : undefined,
          reachable: light.state?.reachable || false,
        },
        online: light.state?.reachable || false,
        discovered: new Date().toISOString(),
      };

      discoveredLights.set(lightInfo.id, lightInfo);
      console.log(`Found Hue light: ${lightInfo.name}`);
    }

    return Array.from(discoveredLights.values());
  } catch (error) {
    console.error("Error getting Hue lights:", error);
    return [];
  }
}

/**
 * Get capabilities for a Hue light
 */
function getCapabilities(light: any): string[] {
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
 * Control a Hue light
 */
export async function controlLight(
  lightId: string,
  command: any,
): Promise<any> {
  try {
    if (!bridgeIp || !username) {
      throw new Error("Hue bridge IP or username not configured");
    }

    // Get the light from discovered lights
    const light = discoveredLights.get(lightId);

    if (!light) {
      throw new Error(`Light not found: ${lightId}`);
    }

    // Extract bridge ID from light ID
    const bridgeId = light.bridgeId;

    if (!bridgeId) {
      throw new Error(`Bridge ID not found for light: ${lightId}`);
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
      if (command.color.h !== undefined && command.color.s !== undefined) {
        payload.hue = Math.round((command.color.h * 65535) / 360);
        payload.sat = Math.round((command.color.s * 254) / 100);
      }

      if (command.color.v !== undefined) {
        payload.bri = Math.round((command.color.v * 254) / 100);
      }
    }

    if (command.temperature !== undefined) {
      // Convert temperature (in Kelvin) to Hue's color temperature format
      const mired = Math.round(1000000 / command.temperature);
      payload.ct = Math.max(153, Math.min(500, mired));
    }

    console.log(`Controlling Hue light ${bridgeId} with:`, payload);

    // Send command to Hue bridge
    const response = await fetch(
      `http://${bridgeIp}/api/${username}/lights/${bridgeId}/state`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    // Check for success
    const success = result.some((item: any) =>
      Object.keys(item).some((key) => key.startsWith("success")),
    );

    if (success) {
      // Update light state
      const updatedLight = { ...light };

      if (command.on !== undefined) {
        updatedLight.state.on = command.on;
      }

      if (command.brightness !== undefined) {
        updatedLight.state.brightness = command.brightness;
      }

      if (command.color) {
        updatedLight.state.color = command.color;
      }

      discoveredLights.set(lightId, updatedLight);
    }

    return {
      success,
      deviceId: lightId,
      state: discoveredLights.get(lightId)?.state,
    };
  } catch (error) {
    console.error(`Error controlling Hue light ${lightId}:`, error);
    throw error;
  }
}

/**
 * Get all discovered lights
 */
export function getDiscoveredLights(): any[] {
  return Array.from(discoveredLights.values());
}

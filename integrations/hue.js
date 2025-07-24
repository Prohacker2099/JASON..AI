const v3 = require("node-hue-api").v3;
const discovery = v3.discovery;
const hueApi = v3.api;

let bridgeApi = null;

// Connect to Hue bridge
async function connectToBridge() {
  if (bridgeApi) return bridgeApi;

  try {
    // Discover bridge
    const discoveryResults = await discovery.nupnpSearch();
    if (!discoveryResults || discoveryResults.length === 0) {
      throw new Error("No Hue Bridges discovered");
    }

    const host = discoveryResults[0].ipaddress;
    console.log(`Hue Bridge found at ${host}`);

    // Get or create username
    let username = process.env.HUE_USERNAME;

    if (!username) {
      console.log("No username provided, attempting to create one...");
      // Create a new user
      const unauthenticatedApi = await hueApi.createLocal(host).connect();
      const createdUser = await unauthenticatedApi.users.createUser(
        "jason-app",
        "jason-device",
      );
      username = createdUser.username;
      console.log(
        `Created new username: ${username}. Save this in your environment as HUE_USERNAME`,
      );
    }

    // Connect to the bridge
    bridgeApi = await hueApi.createLocal(host).connect(username);
    return bridgeApi;
  } catch (error) {
    console.error("Failed to connect to Hue bridge:", error);
    throw error;
  }
}

// Get all lights
async function getLights() {
  try {
    const api = await connectToBridge();
    const lights = await api.lights.getAll();
    return lights.map((light) => ({
      id: light.id,
      name: light.name,
      type: "light",
      manufacturer: "Philips Hue",
      model: light.modelid,
      state: {
        power: light.state.on,
        brightness: Math.round((light.state.bri / 254) * 100),
        color: light.state.xy
          ? xyBriToRgb(light.state.xy[0], light.state.xy[1], light.state.bri)
          : "#FFFFFF",
      },
    }));
  } catch (error) {
    console.error("Failed to get lights:", error);
    return [];
  }
}

// Control a light
async function controlLight(lightId, state) {
  try {
    const api = await connectToBridge();
    const lightState = new v3.lightStates.LightState();

    if (state.power !== undefined) {
      lightState.on(state.power);
    }

    if (state.brightness !== undefined) {
      // Convert 0-100 to 0-254
      const bri = Math.round((state.brightness / 100) * 254);
      lightState.bri(bri);
    }

    if (state.color) {
      // Convert hex color to xy
      const rgb = hexToRgb(state.color);
      if (rgb) {
        const xy = rgbToXy(rgb.r, rgb.g, rgb.b);
        lightState.xy(xy.x, xy.y);
      }
    }

    await api.lights.setLightState(lightId, lightState);
    return true;
  } catch (error) {
    console.error(`Failed to control light ${lightId}:`, error);
    return false;
  }
}

// Helper: Convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper: Convert RGB to XY
function rgbToXy(r, g, b) {
  // Convert RGB to normalized values
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ using Wide RGB D65 conversion formula
  const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
  const Z = r * 0.000088 + g * 0.07231 + b * 0.986039;

  // Calculate xy values
  const x = X / (X + Y + Z) || 0;
  const y = Y / (X + Y + Z) || 0;

  return { x, y };
}

// Helper: Convert XY to RGB
function xyBriToRgb(x, y, bri) {
  // Convert to XYZ
  const Y = bri / 254;
  const X = (Y / y) * x;
  const Z = (Y / y) * (1 - x - y);

  // Convert to RGB using Wide RGB D65 conversion formula
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  // Apply reverse gamma correction
  r =
    r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, 1.0 / 2.4) - 0.055;
  g =
    g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, 1.0 / 2.4) - 0.055;
  b =
    b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, 1.0 / 2.4) - 0.055;

  // Convert to 0-255 range and ensure valid values
  r = Math.max(0, Math.min(1, r)) * 255;
  g = Math.max(0, Math.min(1, g)) * 255;
  b = Math.max(0, Math.min(1, b)) * 255;

  // Convert to hex
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}

module.exports = {
  getLights,
  controlLight,
};

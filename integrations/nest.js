const { GoogleAuth } = require("google-auth-library");
const { SmartDeviceManagementApi } = require("googleapis");

let sdm;
let projectId;

// Initialize the Smart Device Management API
async function initializeSDM() {
  if (sdm) return sdm;

  try {
    // Get project ID from environment
    projectId = process.env.GOOGLE_PROJECT_ID;
    if (!projectId) {
      throw new Error("GOOGLE_PROJECT_ID environment variable not set");
    }

    // Create auth client
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/sdm.service"],
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    // Create SDM client
    sdm = new SmartDeviceManagementApi({
      auth,
      version: "v1",
    });

    return sdm;
  } catch (error) {
    console.error("Failed to initialize Nest API:", error);
    throw error;
  }
}

// Get all thermostats
async function getThermostats() {
  try {
    const api = await initializeSDM();

    // List all devices
    const response = await api.enterprises.devices.list({
      parent: `enterprises/${projectId}`,
    });

    const devices = response.data.devices || [];

    // Filter for thermostats
    return devices
      .filter((device) => device.type === "sdm.devices.types.THERMOSTAT")
      .map((device) => {
        const traits = device.traits || {};
        const temperature =
          traits["sdm.devices.traits.Temperature"]?.ambientTemperatureCelsius;
        const humidity =
          traits["sdm.devices.traits.Humidity"]?.ambientHumidityPercent;
        const thermostatMode =
          traits["sdm.devices.traits.ThermostatMode"]?.mode;
        const thermostatEco = traits["sdm.devices.traits.ThermostatEco"]?.mode;
        const thermostatHvac =
          traits["sdm.devices.traits.ThermostatHvac"]?.status;

        // Convert Celsius to Fahrenheit
        const temperatureF = temperature
          ? Math.round((temperature * 9) / 5 + 32)
          : null;

        return {
          id: device.name.split("/").pop(),
          name: device.parentRelations?.[0]?.displayName || "Nest Thermostat",
          type: "thermostat",
          manufacturer: "Nest",
          model: "Thermostat",
          state: {
            power: thermostatMode !== "OFF",
            temperature: temperatureF,
            humidity: humidity,
            mode: thermostatMode?.toLowerCase() || "off",
            eco: thermostatEco === "ON",
            hvacStatus: thermostatHvac?.toLowerCase() || "off",
          },
        };
      });
  } catch (error) {
    console.error("Failed to get thermostats:", error);
    return [];
  }
}

// Control a thermostat
async function controlThermostat(deviceId, state) {
  try {
    const api = await initializeSDM();
    const deviceName = `enterprises/${projectId}/devices/${deviceId}`;

    // Handle power/mode
    if (state.power !== undefined) {
      const mode = state.power ? state.mode || "HEAT" : "OFF";
      await api.enterprises.devices.executeCommand({
        name: deviceName,
        requestBody: {
          command: "sdm.devices.commands.ThermostatMode.SetMode",
          params: { mode },
        },
      });
    } else if (state.mode) {
      await api.enterprises.devices.executeCommand({
        name: deviceName,
        requestBody: {
          command: "sdm.devices.commands.ThermostatMode.SetMode",
          params: { mode: state.mode.toUpperCase() },
        },
      });
    }

    // Handle temperature
    if (state.temperature) {
      // Convert Fahrenheit to Celsius
      const temperatureC = ((state.temperature - 32) * 5) / 9;

      await api.enterprises.devices.executeCommand({
        name: deviceName,
        requestBody: {
          command: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
          params: { heatCelsius: temperatureC },
        },
      });
    }

    // Handle eco mode
    if (state.eco !== undefined) {
      await api.enterprises.devices.executeCommand({
        name: deviceName,
        requestBody: {
          command: "sdm.devices.commands.ThermostatEco.SetMode",
          params: { mode: state.eco ? "ON" : "OFF" },
        },
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to control thermostat ${deviceId}:`, error);
    return false;
  }
}

module.exports = {
  getThermostats,
  controlThermostat,
};

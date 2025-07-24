const AlexaRemote = require("alexa-remote2");
const alexa = new AlexaRemote();

// Check if required module is available
try {
  require("alexa-remote2");
  console.log("Alexa module loaded successfully");
} catch (error) {
  console.error("Error loading alexa-remote2 module:", error.message);
  console.error(
    "Please install the required module with: npm install alexa-remote2",
  );
}

let isInitialized = false;

// Initialize Alexa
async function initializeAlexa() {
  if (isInitialized) return true;

  return new Promise((resolve, reject) => {
    // Check for OAuth token first
    if (process.env.AMAZON_ACCESS_TOKEN) {
      console.log("Using OAuth token for Alexa authentication");

      const options = {
        amazonPage: process.env.ALEXA_AMAZON_PAGE || "amazon.com",
        cookieFile: "./alexa-cookie.json",
        useWsMqtt: true,
        logger: console.log,
        oauth: {
          accessToken: process.env.AMAZON_ACCESS_TOKEN,
          refreshToken: process.env.AMAZON_REFRESH_TOKEN,
          tokenType: "Bearer",
        },
      };

      alexa.init(options, (err) => {
        if (err) {
          console.error("Failed to initialize Alexa with OAuth:", err);
          // Fall back to email/password if OAuth fails
          tryEmailPasswordAuth(resolve, reject);
          return;
        }

        console.log("Alexa initialized successfully with OAuth");
        isInitialized = true;
        resolve(true);
      });
    } else {
      // Fall back to email/password auth
      tryEmailPasswordAuth(resolve, reject);
    }
  });
}

// Helper function for email/password authentication
function tryEmailPasswordAuth(resolve, reject) {
  // Check if credentials are available
  if (!process.env.ALEXA_EMAIL || !process.env.ALEXA_PASSWORD) {
    console.error(
      "Alexa credentials missing. Please set ALEXA_EMAIL and ALEXA_PASSWORD in .env file or use OAuth",
    );
    reject(new Error("Alexa credentials missing"));
    return;
  }

  const options = {
    email: process.env.ALEXA_EMAIL,
    password: process.env.ALEXA_PASSWORD,
    amazonPage: process.env.ALEXA_AMAZON_PAGE || "amazon.com",
    cookieFile: "./alexa-cookie.json",
    useWsMqtt: true,
    logger: console.log,
  };

  console.log("Initializing Alexa with account:", process.env.ALEXA_EMAIL);

  alexa.init(options, (err) => {
    if (err) {
      console.error("Failed to initialize Alexa:", err);
      reject(err);
      return;
    }

    console.log("Alexa initialized successfully with email/password");
    isInitialized = true;
    resolve(true);
  });
}

// Get all Alexa devices
async function getDevices() {
  try {
    // Try to initialize Alexa
    try {
      await initializeAlexa();
    } catch (initError) {
      console.error("Failed to initialize Alexa:", initError);
      return [];
    }

    return new Promise((resolve, reject) => {
      alexa.getDevices((err, devices) => {
        if (err) {
          console.error("Failed to get Alexa devices:", err);
          reject(err);
          return;
        }

        if (!devices || !Array.isArray(devices)) {
          console.error("Invalid devices response from Alexa:", devices);
          resolve([]);
          return;
        }

        console.log(`Found ${devices.length} Alexa devices`);

        const formattedDevices = devices.map((device) => ({
          id: device.serialNumber,
          name: device.accountName || device.deviceType,
          type: "speaker",
          manufacturer: "Amazon",
          model: device.deviceType,
          state: {
            power: device.online,
            volume: device.volume?.volume || 50,
            playing: device.playerInfo?.state === "PLAYING",
          },
        }));

        resolve(formattedDevices);
      });
    });
  } catch (error) {
    console.error("Error getting Alexa devices:", error);
    return [];
  }
}

// Send command to Alexa
async function sendCommand(deviceId, command) {
  try {
    await initializeAlexa();

    return new Promise((resolve, reject) => {
      alexa.sendSequenceCommand(deviceId, command, (err, result) => {
        if (err) {
          console.error(
            `Failed to send command to Alexa device ${deviceId}:`,
            err,
          );
          reject(err);
          return;
        }

        resolve({ success: true, result });
      });
    });
  } catch (error) {
    console.error(`Error sending command to Alexa device ${deviceId}:`, error);
    return { success: false, error: error.message };
  }
}

// Speak through Alexa
async function speak(deviceId, text) {
  try {
    await initializeAlexa();

    return new Promise((resolve, reject) => {
      alexa.sendTextCommand(deviceId, text, (err, result) => {
        if (err) {
          console.error(
            `Failed to speak through Alexa device ${deviceId}:`,
            err,
          );
          reject(err);
          return;
        }

        resolve({ success: true, result });
      });
    });
  } catch (error) {
    console.error(`Error speaking through Alexa device ${deviceId}:`, error);
    return { success: false, error: error.message };
  }
}

// Control media playback
async function controlMedia(deviceId, action, value) {
  try {
    await initializeAlexa();

    return new Promise((resolve, reject) => {
      switch (action) {
        case "play":
          alexa.playMusic(deviceId, null, (err, result) => {
            if (err) reject(err);
            else resolve({ success: true, result });
          });
          break;

        case "pause":
          alexa.pause(deviceId, (err, result) => {
            if (err) reject(err);
            else resolve({ success: true, result });
          });
          break;

        case "next":
          alexa.next(deviceId, (err, result) => {
            if (err) reject(err);
            else resolve({ success: true, result });
          });
          break;

        case "previous":
          alexa.previous(deviceId, (err, result) => {
            if (err) reject(err);
            else resolve({ success: true, result });
          });
          break;

        case "volume":
          alexa.setVolume(deviceId, value, (err, result) => {
            if (err) reject(err);
            else resolve({ success: true, result });
          });
          break;

        default:
          reject(new Error(`Unknown media action: ${action}`));
      }
    });
  } catch (error) {
    console.error(
      `Error controlling media on Alexa device ${deviceId}:`,
      error,
    );
    return { success: false, error: error.message };
  }
}

// Process voice command
async function processVoiceCommand(command) {
  try {
    await initializeAlexa();

    // Get the first device (usually Echo)
    const devices = await getDevices();
    if (!devices || devices.length === 0) {
      throw new Error("No Alexa devices found");
    }

    const deviceId = devices[0].id;

    // Send command to Alexa
    return await speak(deviceId, command);
  } catch (error) {
    console.error("Error processing Alexa voice command:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getDevices,
  sendCommand,
  speak,
  controlMedia,
  processVoiceCommand,
};

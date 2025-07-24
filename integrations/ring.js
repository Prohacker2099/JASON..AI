const { RingApi } = require("ring-client-api");
const fs = require("fs");
const path = require("path");

let ringClient;
let cameras = [];

// Initialize Ring API
async function initializeRing() {
  if (ringClient) return ringClient;

  try {
    // Get credentials from environment
    const email = process.env.RING_EMAIL;
    const password = process.env.RING_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "RING_EMAIL or RING_PASSWORD environment variables not set",
      );
    }

    // Create token directory if it doesn't exist
    const tokenDir = path.join(__dirname, "../.ring-tokens");
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
    }

    // Create Ring client
    ringClient = new RingApi({
      email,
      password,
      refreshToken: process.env.RING_REFRESH_TOKEN,
      cameraStatusPollingSeconds: 20,
      cameraDingsPollingSeconds: 2,
    });

    // Save refresh token for future use
    ringClient.onRefreshTokenUpdated.subscribe(({ newRefreshToken }) => {
      console.log("Received new refresh token, saving to environment");
      process.env.RING_REFRESH_TOKEN = newRefreshToken;
    });

    return ringClient;
  } catch (error) {
    console.error("Failed to initialize Ring API:", error);
    throw error;
  }
}

// Get all cameras
async function getCameras() {
  try {
    const api = await initializeRing();

    // Get locations
    const locations = await api.getLocations();
    cameras = [];

    // Get cameras from all locations
    for (const location of locations) {
      const devices = await location.getDevices();

      // Add cameras
      for (const camera of devices.cameras) {
        cameras.push({
          id: camera.id,
          name: camera.name,
          type: "camera",
          manufacturer: "Ring",
          model: camera.model,
          location: location.name,
          state: {
            power: camera.data.settings.enabled,
            recording: camera.data.settings.motion_detection_enabled,
            motion: camera.hasMotionDetected,
            battery: camera.batteryLevel,
            online: camera.isOnline,
          },
        });
      }
    }

    return cameras;
  } catch (error) {
    console.error("Failed to get cameras:", error);
    return [];
  }
}

// Control a camera
async function controlCamera(cameraId, state) {
  try {
    // Find camera in cached list
    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    // Get the actual camera device
    const api = await initializeRing();
    const locations = await api.getLocations();
    let ringCamera;

    for (const location of locations) {
      const devices = await location.getDevices();
      ringCamera = devices.cameras.find((c) => c.id === cameraId);
      if (ringCamera) break;
    }

    if (!ringCamera) {
      throw new Error(`Ring camera ${cameraId} not found`);
    }

    // Handle power/enabled
    if (state.power !== undefined) {
      await ringCamera.setSettings({
        enabled: state.power,
      });
    }

    // Handle motion detection/recording
    if (state.recording !== undefined) {
      await ringCamera.setSettings({
        motion_detection_enabled: state.recording,
      });
    }

    // Handle snapshot
    if (state.snapshot) {
      const snapshot = await ringCamera.getSnapshot();
      const snapshotPath = path.join(
        __dirname,
        "../public/snapshots",
        `${cameraId}_${Date.now()}.jpg`,
      );

      // Ensure directory exists
      const dir = path.dirname(snapshotPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save snapshot
      fs.writeFileSync(snapshotPath, snapshot);
      return { success: true, snapshot: path.basename(snapshotPath) };
    }

    return { success: true };
  } catch (error) {
    console.error(`Failed to control camera ${cameraId}:`, error);
    return { success: false, error: error.message };
  }
}

// Set up event listeners for motion detection
async function setupEventListeners() {
  try {
    const api = await initializeRing();
    const locations = await api.getLocations();

    for (const location of locations) {
      const devices = await location.getDevices();

      for (const camera of devices.cameras) {
        // Motion detection
        camera.onMotionDetected.subscribe((motion) => {
          console.log(`Motion detected on ${camera.name}: ${motion}`);
          // Update camera state
          const cameraIndex = cameras.findIndex((c) => c.id === camera.id);
          if (cameraIndex >= 0) {
            cameras[cameraIndex].state.motion = motion;
          }

          // Emit event (this would connect to your event system)
          // eventEmitter.emit('motion', { camera: camera.id, detected: motion });
        });

        // Doorbell press
        if (camera.isDoorbot) {
          camera.onDoorbellPressed.subscribe(() => {
            console.log(`Doorbell pressed: ${camera.name}`);
            // Emit event
            // eventEmitter.emit('doorbell', { camera: camera.id });
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to set up Ring event listeners:", error);
  }
}

// Start live stream
async function startLiveStream(cameraId) {
  try {
    // Find camera in cached list
    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    // Get the actual camera device
    const api = await initializeRing();
    const locations = await api.getLocations();
    let ringCamera;

    for (const location of locations) {
      const devices = await location.getDevices();
      ringCamera = devices.cameras.find((c) => c.id === cameraId);
      if (ringCamera) break;
    }

    if (!ringCamera) {
      throw new Error(`Ring camera ${cameraId} not found`);
    }

    // Create public directory for streams if it doesn't exist
    const streamDir = path.join(__dirname, "../public/streams");
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    // Start live stream
    const rtspUrl = await ringCamera.startLiveStream();

    return {
      success: true,
      streamUrl: rtspUrl,
    };
  } catch (error) {
    console.error(`Failed to start live stream for camera ${cameraId}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getCameras,
  controlCamera,
  setupEventListeners,
  startLiveStream,
};

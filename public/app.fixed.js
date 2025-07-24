/**
 * JASON - The Omnipotent AI Architect
 * Enhanced Frontend Application
 *
 * This is the enhanced version of the JASON frontend application with
 * improved WebSocket handling, device management, and UI interactions.
 */

// Global state
let ws;
let devices = [];
let scenes = [];
let automations = [];
let patterns = [];
let connected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

// DOM Elements - Safely get elements
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element not found: #${id}`);
  }
  return element;
}

// Initialize WebSocket connection with reconnection logic
function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to JASON server");
      connected = true;
      reconnectAttempts = 0;
      showResponse("Connected to JASON server");

      // Request initial data
      sendToServer({
        type: "get_initial_data",
      });

      // Update UI to show connected state
      updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
      handleServerMessage(event.data);
    };

    ws.onclose = () => {
      console.log("Disconnected from JASON server");
      connected = false;
      updateConnectionStatus(false);

      // Try to reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts),
          30000,
        );
        reconnectAttempts++;

        showResponse(
          `Connection lost. Reconnecting in ${Math.round(delay / 1000)} seconds...`,
        );

        setTimeout(() => {
          initWebSocket();
        }, delay);
      } else {
        showResponse("Could not reconnect to server. Please refresh the page.");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      showResponse("Error connecting to server");
    };
  } catch (error) {
    console.error("Error initializing WebSocket:", error);
    showResponse("Failed to initialize connection");
  }
}

// Update connection status in UI
function updateConnectionStatus(isConnected) {
  const statusIndicator = getElement("connection-status");
  if (statusIndicator) {
    statusIndicator.className = isConnected
      ? "status-online"
      : "status-offline";
    statusIndicator.textContent = isConnected ? "Connected" : "Disconnected";
  }
}

// Send data to server
function sendToServer(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    showResponse("Not connected to server. Trying to reconnect...");
    if (!connected) {
      initWebSocket();
    }
  }
}

// Send command to server
function sendCommandToServer(command) {
  sendToServer({
    type: "command",
    command: command,
  });

  // Show command in response area
  showResponse(`Sending command: "${command}"`);
}

// Enhanced device discovery function
async function discoverDevices() {
  try {
    showResponse("🔍 Starting device discovery...");

    // Show loading state in devices container
    const devicesContainer = getElement("all-devices");
    if (devicesContainer) {
      devicesContainer.innerHTML = `
        <div class="col-span-full">
          <div class="glass-card p-8 text-center">
            <div class="animate-spin text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-semibold mb-2">Discovering devices...</h3>
            <p class="text-gray-300 mb-4">Scanning for phones, smart devices, and more...</p>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
            </div>
          </div>
        </div>
      `;
    }

    // Make API call to discover devices
    const response = await fetch("/api/devices/discover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const discoveredDevices = Array.isArray(result)
      ? result
      : result.data || [];

    // Update global devices array
    devices = discoveredDevices;

    showResponse(`✅ Found ${discoveredDevices.length} devices!`);

    // Update the UI
    updateDeviceCounts();
    renderDevices();

    // Also send WebSocket command for real-time updates
    sendToServer({
      type: "get_devices",
    });

    return discoveredDevices;
  } catch (error) {
    console.error("Error discovering devices:", error);
    showResponse(`❌ Device discovery failed: ${error.message}`);

    // Show error state
    const devicesContainer = getElement("all-devices");
    if (devicesContainer) {
      devicesContainer.innerHTML = `
        <div class="col-span-full">
          <div class="glass-card p-8 text-center">
            <div class="text-6xl mb-4">❌</div>
            <h3 class="text-xl font-semibold mb-2">Discovery failed</h3>
            <p class="text-gray-300 mb-4">${error.message}</p>
            <button onclick="discoverDevices()" class="btn btn-primary">
              🔄 Try Again
            </button>
          </div>
        </div>
      `;
    }

    return [];
  }
}

// Enhanced device discovery function
async function discoverDevices() {
  try {
    showResponse("🔍 Starting device discovery...");

    // Show loading state in devices container
    const devicesContainer = getElement("all-devices");
    if (devicesContainer) {
      devicesContainer.innerHTML = `
        <div class="col-span-full">
          <div class="glass-card p-8 text-center">
            <div class="animate-spin text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-semibold mb-2">Discovering devices...</h3>
            <p class="text-gray-300 mb-4">Scanning for phones, smart devices, and more...</p>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
            </div>
          </div>
        </div>
      `;
    }

    // Make API call to discover devices
    const response = await fetch("/api/devices/discover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const discoveredDevices = Array.isArray(result)
      ? result
      : result.data || [];

    // Update global devices array
    devices = discoveredDevices;

    showResponse(`✅ Found ${discoveredDevices.length} devices!`);

    // Update the UI
    updateDeviceCounts();
    renderDevices();

    // Also send WebSocket command for real-time updates
    sendToServer({
      type: "get_devices",
    });

    return discoveredDevices;
  } catch (error) {
    console.error("Error discovering devices:", error);
    showResponse(`❌ Device discovery failed: ${error.message}`);

    // Show error state
    const devicesContainer = getElement("all-devices");
    if (devicesContainer) {
      devicesContainer.innerHTML = `
        <div class="col-span-full">
          <div class="glass-card p-8 text-center">
            <div class="text-6xl mb-4">❌</div>
            <h3 class="text-xl font-semibold mb-2">Discovery failed</h3>
            <p class="text-gray-300 mb-4">${error.message}</p>
            <button onclick="discoverDevices()" class="btn btn-primary">
              🔄 Try Again
            </button>
          </div>
        </div>
      `;
    }

    return [];
  }
}

// Enhanced device discovery function
async function discoverDevices() {
  try {
    showResponse("🔍 Starting device discovery...");

    // Show loading state in devices container
    const devicesContainer = getElement("all-devices");
    if (devicesContainer) {
      devicesContainer.innerHTML = `
        <div class="col-span-full">
          <div class="glass-card p-8 text-center">
            <div class="animate-spin text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-semibold mb-2">Discovering devices...</h3>
            <p class="text-gray-300 mb-4">Scanning for phones, smart devices, and more...</p>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
            </div>
          </div>
        </div>
      `;
    }

    // Make API call to discover devices
    const response = await fetch("/api/devices/discover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const discoveredDevices = Array.isArray(result)
      ? result
      : result.data || [];

    // Update global devices array
    devices = discoveredDevices;

    showResponse(`✅ Found ${discoveredDevices.length} devices!`);

    // Update the UI
    updateDeviceCounts();
    renderDevices();

    // Also send WebSocket command for real-time updates
    sendToServer({
      type: "get_devices",
    });

    return discoveredDevices;
  } catch (error) {
    console.error("Error discovering devices:", error);
    showResponse(`❌ Device discovery failed: ${error.message}`);

    // Show error state
    const devicesContainer = getElement("all-devices");
    if (devicesContainer) {
      devicesContainer.innerHTML = `
        <div class="col-span-full">
          <div class="glass-card p-8 text-center">
            <div class="text-6xl mb-4">❌</div>
            <h3 class="text-xl font-semibold mb-2">Discovery failed</h3>
            <p class="text-gray-300 mb-4">${error.message}</p>
            <button onclick="discoverDevices()" class="btn btn-primary">
              🔄 Try Again
            </button>
          </div>
        </div>
      `;
    }

    return [];
  }
}

// Handle messages from server
function handleServerMessage(data) {
  try {
    const message = JSON.parse(data);
    console.log("Received message:", message);

    switch (message.type) {
      case "init":
        // Initial data
        handleInitialData(message);
        break;

      case "command_response":
        // Command response
        handleCommandResponse(message.result);
        break;

      case "device_update":
        // Device update
        updateDevice(message.device);
        break;

      case "device_discovered":
        // New device discovered
        addDevice(message.device);
        showResponse(`Found new device: ${message.device.name}`);
        break;

      case "device_removed":
        // Device removed
        removeDevice(message.deviceId);
        break;

      case "scene_activated":
        // Scene activated
        updateScene(message.scene);
        showResponse(`"${message.scene.name}" scene activated`);
        break;

      case "automation_executed":
        // Automation executed
        updateAutomation(message.automation);
        showResponse(`"${message.automation.name}" automation executed`);
        break;

      case "pattern_detected":
        // Pattern detected
        addPattern(message.pattern);
        showResponse(`New pattern detected: ${message.pattern.description}`);
        break;

      default:
        console.warn("Unknown message type:", message.type);
    }
  } catch (error) {
    // Handle plain text responses
    console.log("Received text message:", data);
    showResponse(data);
  }
}

// Handle initial data from server
function handleInitialData(data) {
  if (data.devices) {
    devices = data.devices;
    updateDeviceCounts();
    renderDevices();
  }

  if (data.scenes) {
    scenes = data.scenes;
    updateSceneCounts();
    renderScenes();
  }

  if (data.automations) {
    automations = data.automations;
    updateAutomationCounts();
    renderAutomations();
  }

  if (data.patterns) {
    patterns = data.patterns;
    renderPatterns();
  }

  showResponse("Initial data loaded successfully");
}

// Handle command response
function handleCommandResponse(result) {
  if (!result) return;

  if (result.content) {
    showResponse(result.content);
  }

  if (result.type === "device_control") {
    // Refresh UI after device control
    setTimeout(() => {
      renderDevices();
    }, 500);
  } else if (result.type === "scene_activation") {
    // Refresh UI after scene activation
    setTimeout(() => {
      renderScenes();
    }, 500);
  }
}

// Update device counts
function updateDeviceCounts() {
  const totalDevicesEl = getElement("total-devices");
  const onlineDevicesEl = getElement("online-devices");
  const onlineDevicesBarEl = getElement("online-devices-bar");

  if (totalDevicesEl) {
    totalDevicesEl.textContent = devices.length;
  }

  const onlineCount = devices.filter((d) => d.connected).length;

  if (onlineDevicesEl) {
    onlineDevicesEl.textContent = `${onlineCount} / ${devices.length}`;
  }

  if (onlineDevicesBarEl && devices.length > 0) {
    const percentage = Math.round((onlineCount / devices.length) * 100);
    onlineDevicesBarEl.style.width = `${percentage}%`;
  }
}

// Update scene counts
function updateSceneCounts() {
  const totalScenesEl = getElement("total-scenes");
  const lastSceneEl = getElement("last-scene");

  if (totalScenesEl) {
    totalScenesEl.textContent = scenes.length;
  }

  if (lastSceneEl && scenes.length > 0) {
    // Sort scenes by last activated time
    const sortedScenes = [...scenes].sort((a, b) => {
      if (!a.lastActivated) return 1;
      if (!b.lastActivated) return -1;
      return new Date(b.lastActivated) - new Date(a.lastActivated);
    });

    if (sortedScenes[0].lastActivated) {
      const lastActivated = new Date(sortedScenes[0].lastActivated);
      const now = new Date();
      const diffMs = now - lastActivated;

      // Format relative time
      let timeAgo;
      if (diffMs < 60000) {
        timeAgo = "Just now";
      } else if (diffMs < 3600000) {
        const minutes = Math.floor(diffMs / 60000);
        timeAgo = `${minutes}m ago`;
      } else if (diffMs < 86400000) {
        const hours = Math.floor(diffMs / 3600000);
        timeAgo = `${hours}h ago`;
      } else {
        const days = Math.floor(diffMs / 86400000);
        timeAgo = `${days}d ago`;
      }

      lastSceneEl.textContent = `${sortedScenes[0].name} (${timeAgo})`;
    } else {
      lastSceneEl.textContent = "None";
    }
  }
}

// Update automation counts
function updateAutomationCounts() {
  const totalAutomationsEl = getElement("total-automations");
  const enabledAutomationsEl = getElement("enabled-automations");
  const enabledAutomationsBarEl = getElement("enabled-automations-bar");

  if (totalAutomationsEl) {
    totalAutomationsEl.textContent = automations.length;
  }

  const enabledCount = automations.filter((a) => a.enabled).length;

  if (enabledAutomationsEl) {
    enabledAutomationsEl.textContent = `${enabledCount} / ${automations.length}`;
  }

  if (enabledAutomationsBarEl && automations.length > 0) {
    const percentage = Math.round((enabledCount / automations.length) * 100);
    enabledAutomationsBarEl.style.width = `${percentage}%`;
  }
}

// Add a new device
function addDevice(device) {
  if (!device || !device.id) return;

  // Check if device already exists
  const existingIndex = devices.findIndex((d) => d.id === device.id);

  if (existingIndex !== -1) {
    // Update existing device
    devices[existingIndex] = device;
  } else {
    // Add new device
    devices.push(device);
  }

  updateDeviceCounts();
  renderDevices();
}

// Update a device
function updateDevice(device) {
  if (!device || !device.id) return;

  // Find and update the device in our array
  const index = devices.findIndex((d) => d.id === device.id);

  if (index !== -1) {
    devices[index] = device;

    // Update UI for this device
    const deviceElements = document.querySelectorAll(
      `[data-device-id="${device.id}"]`,
    );
    deviceElements.forEach((element) => {
      updateDeviceElement(element, device);
    });

    updateDeviceCounts();
  }
}

// Update a device element in the UI
function updateDeviceElement(element, device) {
  if (!element || !device) return;

  // Update status class
  element.className =
    device.state && device.state.power
      ? "device-card active"
      : "device-card inactive";

  // Update status text
  const statusElement = element.querySelector(".device-status");
  if (statusElement) {
    statusElement.textContent =
      device.state && device.state.power ? "On" : "Off";
  }

  // Update toggle button
  const toggleButton = element.querySelector(".device-toggle");
  if (toggleButton) {
    toggleButton.textContent =
      device.state && device.state.power ? "Turn Off" : "Turn On";
  }

  // Update specific device type controls
  if (
    device.type === "light" &&
    device.state &&
    device.state.brightness !== undefined
  ) {
    const brightnessSlider = element.querySelector(".brightness-slider");
    if (brightnessSlider) {
      brightnessSlider.value = device.state.brightness;
    }
  } else if (
    device.type === "thermostat" &&
    device.state &&
    device.state.temperature !== undefined
  ) {
    const temperatureDisplay = element.querySelector(".temperature-display");
    if (temperatureDisplay) {
      temperatureDisplay.textContent = `${device.state.temperature}°F`;
    }
  }
}

// Remove a device
function removeDevice(deviceId) {
  if (!deviceId) return;

  // Remove device from array
  devices = devices.filter((d) => d.id !== deviceId);

  // Remove device elements from UI
  const deviceElements = document.querySelectorAll(
    `[data-device-id="${deviceId}"]`,
  );
  deviceElements.forEach((element) => {
    element.remove();
  });

  updateDeviceCounts();
}

// Update a scene
function updateScene(scene) {
  if (!scene || !scene.id) return;

  // Find and update the scene in our array
  const index = scenes.findIndex((s) => s.id === scene.id);

  if (index !== -1) {
    scenes[index] = scene;
  } else {
    scenes.push(scene);
  }

  updateSceneCounts();
  renderScenes();
}

// Update an automation
function updateAutomation(automation) {
  if (!automation || !automation.id) return;

  // Find and update the automation in our array
  const index = automations.findIndex((a) => a.id === automation.id);

  if (index !== -1) {
    automations[index] = automation;
  } else {
    automations.push(automation);
  }

  updateAutomationCounts();
  renderAutomations();
}

// Add a pattern
function addPattern(pattern) {
  if (!pattern || !pattern.id) return;

  // Check if pattern already exists
  const existingIndex = patterns.findIndex((p) => p.id === pattern.id);

  if (existingIndex !== -1) {
    // Update existing pattern
    patterns[existingIndex] = pattern;
  } else {
    // Add new pattern
    patterns.push(pattern);
  }

  renderPatterns();
}

// Render devices
function renderDevices() {
  // Render favorite devices
  const favoriteDevicesEl = getElement("favorite-devices");
  if (favoriteDevicesEl) {
    // For demo, just show first 4 devices as favorites
    const favoriteDevices = devices.slice(0, 4);
    renderDeviceGrid(favoriteDevicesEl, favoriteDevices);
  }

  // Render all devices
  const allDevicesEl = getElement("all-devices");
  if (allDevicesEl) {
    renderDeviceGrid(allDevicesEl, devices);
  }
}

// Enhanced device icon function
function getDeviceIcon(type, category) {
  const deviceType = (type || category || "").toLowerCase();

  switch (deviceType) {
    case "smartphone":
    case "mobile":
    case "phone":
      return `<svg class="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    case "tablet":
      return `<svg class="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="3" width="16" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    case "light":
    case "lighting":
      return `<svg class="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H15M12 3C8.13401 3 5 6.13401 5 10C5 12.2091 6.2 14.2091 8 15.3M12 3C15.866 3 19 6.13401 19 10C19 12.2091 17.8 14.2091 16 15.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case "thermostat":
      return `<svg class="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case "camera":
      return `<svg class="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    case "speaker":
    case "smart_speaker":
      return `<svg class="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19.07 4.93C20.9447 6.80528 20.9447 9.89472 19.07 11.77" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case "tv":
    case "television":
      return `<svg class="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    case "computer":
    case "laptop":
      return `<svg class="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="12" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" stroke-width="2"/>
      </svg>`;
    default:
      return `<svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2"/>
      </svg>`;
  }
}

// Render device grid with modern design
function renderDeviceGrid(container, deviceList) {
  if (!container) return;

  container.innerHTML = "";

  if (!deviceList || deviceList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full">
        <div class="glass-card p-8 text-center animate-fade-in">
          <div class="text-6xl mb-4">📱</div>
          <h3 class="text-xl font-semibold mb-2">No devices found</h3>
          <p class="text-gray-300 mb-4">Click "Discover Devices" to find your phones and other smart devices</p>
          <button onclick="discoverDevices()" class="btn btn-primary">
            🔍 Discover Devices
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Create modern device cards
  deviceList.forEach((device, index) => {
    const deviceCard = document.createElement("div");
    const deviceId =
      device.id ||
      device.deviceId ||
      device.name?.replace(/\s+/g, "_") ||
      `device_${index}`;
    const deviceType = device.type || device.category || "unknown";
    const isActive =
      device.status === "online" ||
      device.isActive ||
      (device.state && device.state.power);
    const deviceName = device.name || "Unknown Device";
    const manufacturer = device.manufacturer || "";
    const model = device.model || "";
    const location =
      device.location ||
      device.details?.location ||
      device.metadata?.location ||
      "Unknown";

    deviceCard.className = `glass-card device-card animate-slide-in hover:scale-105 transition-all duration-300 cursor-pointer`;
    deviceCard.dataset.deviceId = deviceId;
    deviceCard.dataset.deviceType = deviceType;
    deviceCard.style.animationDelay = `${index * 100}ms`;

    const deviceIcon = getDeviceIcon(deviceType, device.category);

    deviceCard.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center space-x-3">
          ${deviceIcon}
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-white truncate">${deviceName}</h3>
            <p class="text-xs text-gray-300 truncate">${manufacturer} ${model}</p>
          </div>
        </div>
        <div class="flex flex-col items-end space-y-1">
          <span class="device-status px-2 py-1 text-xs rounded-full font-medium ${isActive ? "online" : "offline"}">
            ${device.status || (isActive ? "online" : "offline")}
          </span>
          ${device.category === "mobile" ? '<span class="text-xs text-blue-400">📱</span>' : ""}
        </div>
      </div>
      
      <div class="mb-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs px-2 py-1 bg-blue-600 bg-opacity-20 rounded text-blue-300">${location}</span>
          <span class="text-xs text-gray-400">${deviceType}</span>
        </div>
        ${device.version ? `<p class="text-xs text-gray-500 mt-1">${device.version}</p>` : ""}
      </div>
      
      ${
        device.capabilities && device.capabilities.length > 0
          ? `
        <div class="mb-3">
          <p class="text-xs text-gray-400 mb-1">Capabilities:</p>
          <div class="flex flex-wrap gap-1">
            ${device.capabilities
              .slice(0, 3)
              .map(
                (cap) =>
                  `<span class="text-xs px-2 py-1 bg-purple-600 bg-opacity-20 rounded text-purple-300">${cap.name || cap}</span>`,
              )
              .join("")}
            ${device.capabilities.length > 3 ? `<span class="text-xs text-gray-400">+${device.capabilities.length - 3}</span>` : ""}
          </div>
        </div>
      `
          : ""
      }
      
      <div class="device-controls space-y-2">
        ${
          deviceType === "light" || deviceType === "lighting"
            ? `
          <div class="brightness-control">
            <label class="text-xs text-gray-300 block mb-1">Brightness</label>
            <input type="range" min="0" max="100" value="${device.details?.brightness || device.brightness || 50}" 
              class="range-slider w-full" data-device-id="${deviceId}">
          </div>
        `
            : ""
        }
        
        ${
          deviceType === "thermostat"
            ? `
          <div class="temperature-control flex justify-between items-center">
            <span class="text-sm">Current: ${device.details?.temperature || device.temperature || 70}°F</span>
            <div class="flex items-center space-x-2">
              <button class="temp-down btn btn-sm btn-secondary" data-device-id="${deviceId}">-</button>
              <span class="px-2">${device.details?.target || device.target || 70}°F</span>
              <button class="temp-up btn btn-sm btn-secondary" data-device-id="${deviceId}">+</button>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          deviceType === "camera"
            ? `
          <button class="view-camera btn btn-sm btn-primary w-full" data-device-id="${deviceId}">
            📹 View Live
          </button>
        `
            : ""
        }
        
        <div class="flex justify-between items-center pt-2">
          <button class="device-toggle btn btn-sm ${isActive ? "btn-danger" : "btn-success"}" data-device-id="${deviceId}">
            ${isActive ? "⏹ Turn Off" : "▶ Turn On"}
          </button>
          <button class="device-info btn btn-sm btn-secondary" data-device-id="${deviceId}" title="Device Info">
            ℹ️
          </button>
        </div>
      </div>
    `;

    // Add event listeners for device controls
    setTimeout(() => {
      // Toggle button
      const toggleBtn = deviceCard.querySelector(".device-toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = isActive ? "turn off" : "turn on";
          sendCommandToServer(`${action} ${deviceName}`);
        });
      }

      // Brightness slider
      const brightnessSlider = deviceCard.querySelector(".range-slider");
      if (brightnessSlider) {
        brightnessSlider.addEventListener("change", (e) => {
          sendCommandToServer(
            `set ${deviceName} brightness to ${e.target.value}%`,
          );
        });
      }

      // Temperature controls
      const tempUp = deviceCard.querySelector(".temp-up");
      const tempDown = deviceCard.querySelector(".temp-down");
      if (tempUp) {
        tempUp.addEventListener("click", (e) => {
          e.stopPropagation();
          sendCommandToServer(`increase ${deviceName} temperature`);
        });
      }
      if (tempDown) {
        tempDown.addEventListener("click", (e) => {
          e.stopPropagation();
          sendCommandToServer(`decrease ${deviceName} temperature`);
        });
      }

      // Camera view
      const cameraBtn = deviceCard.querySelector(".view-camera");
      if (cameraBtn) {
        cameraBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showResponse(`📹 Opening camera view for ${deviceName}...`);
          // TODO: Implement camera view
        });
      }

      // Device info
      const infoBtn = deviceCard.querySelector(".device-info");
      if (infoBtn) {
        infoBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showDeviceInfo(device);
        });
      }
    }, 0);

    container.appendChild(deviceCard);
  });
}

// Show device information modal
function showDeviceInfo(device) {
  const deviceInfo = `
    📱 Device Information
    
    Name: ${device.name || "Unknown"}
    Type: ${device.type || device.category || "Unknown"}
    Status: ${device.status || (device.isActive ? "online" : "offline")}
    Location: ${device.location || device.details?.location || "Unknown"}
    ${device.manufacturer ? `Manufacturer: ${device.manufacturer}` : ""}
    ${device.model ? `Model: ${device.model}` : ""}
    ${device.version ? `Version: ${device.version}` : ""}
    ${device.capabilities ? `Capabilities: ${device.capabilities.map((c) => c.name || c).join(", ")}` : ""}
  `;

  showResponse(deviceInfo);
}

// Enhanced toast notification system
function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type} animate-slide-in`;
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">×</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// Render scenes
function renderScenes() {
  // Render quick scenes
  const quickScenesEl = getElement("quick-scenes");
  if (quickScenesEl) {
    renderSceneGrid(quickScenesEl, scenes.slice(0, 3)); // Just show first 3 scenes
  }

  // Render all scenes
  const allScenesEl = getElement("all-scenes");
  if (allScenesEl) {
    renderSceneGrid(allScenesEl, scenes);
  }
}

// Render scene grid
function renderSceneGrid(container, sceneList) {
  if (!container) return;

  container.innerHTML = "";

  if (!sceneList || sceneList.length === 0) {
    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 col-span-full">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p>No scenes found</p>
          <button id="create-scene-empty" class="mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            Create Scene
          </button>
        </div>
      </div>
    `;

    // Add event listener to create scene button
    const createBtn = container.querySelector("#create-scene-empty");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        // TODO: Show scene creation modal
        showResponse("Scene creation will be implemented in a future update");
      });
    }

    return;
  }

  sceneList.forEach((scene) => {
    const sceneCard = document.createElement("div");
    sceneCard.className = "scene-card";
    sceneCard.dataset.sceneId = scene.id;

    sceneCard.innerHTML = `
      <div class="scene-name">${scene.name}</div>
      <div class="scene-description">${scene.description || ""}</div>
    `;

    // Add click event to activate scene
    sceneCard.addEventListener("click", () => {
      sendCommandToServer(`activate scene ${scene.name}`);
    });

    container.appendChild(sceneCard);
  });
}

// Render automations
function renderAutomations() {
  const allAutomationsEl = getElement("all-automations");
  if (!allAutomationsEl) return;

  allAutomationsEl.innerHTML = "";

  if (!automations || automations.length === 0) {
    allAutomationsEl.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 col-span-full">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No automations found</p>
          <button id="create-automation-empty" class="mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            Create Automation
          </button>
        </div>
      </div>
    `;

    // Add event listener to create automation button
    const createBtn = allAutomationsEl.querySelector(
      "#create-automation-empty",
    );
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        // TODO: Show automation creation modal
        showResponse(
          "Automation creation will be implemented in a future update",
        );
      });
    }

    return;
  }

  automations.forEach((automation) => {
    const automationCard = document.createElement("div");
    automationCard.className =
      "automation-card bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4";
    automationCard.dataset.automationId = automation.id;

    automationCard.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-semibold">${automation.name}</h3>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" ${automation.enabled ? "checked" : ""}>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>
      <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">${automation.description || ""}</p>
      <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Trigger: ${automation.trigger ? automation.trigger.type : "Unknown"}</span>
        </div>
      </div>
    `;

    // Add toggle event listener
    const toggle = automationCard.querySelector('input[type="checkbox"]');
    if (toggle) {
      toggle.addEventListener("change", () => {
        const action = toggle.checked ? "enable" : "disable";
        sendCommandToServer(`${action} automation ${automation.name}`);
      });
    }

    allAutomationsEl.appendChild(automationCard);
  });
}

// Render patterns
function renderPatterns() {
  const patternsEl = getElement("patterns-container");
  if (!patternsEl) return;

  patternsEl.innerHTML = "";

  if (!patterns || patterns.length === 0) {
    patternsEl.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 col-span-full">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No patterns detected yet</p>
          <p class="text-sm mt-2">JASON will learn from your usage patterns over time</p>
        </div>
      </div>
    `;
    return;
  }

  patterns.forEach((pattern) => {
    const patternCard = document.createElement("div");
    patternCard.className =
      "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4";
    patternCard.dataset.patternId = pattern.id;

    // Calculate confidence class
    let confidenceClass =
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    if (pattern.confidence >= 0.8) {
      confidenceClass =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (pattern.confidence < 0.5) {
      confidenceClass =
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }

    patternCard.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-lg font-semibold">${pattern.type} Pattern</h3>
        <span class="px-2 py-1 rounded text-xs font-medium ${confidenceClass}">
          ${Math.round(pattern.confidence * 100)}% confidence
        </span>
      </div>
      <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">${pattern.description}</p>
      <div class="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
        <button class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium create-automation-btn">
          Create Automation
        </button>
        <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm dismiss-btn">
          Dismiss
        </button>
      </div>
    `;

    // Add event listeners
    const createBtn = patternCard.querySelector(".create-automation-btn");
    const dismissBtn = patternCard.querySelector(".dismiss-btn");

    if (createBtn) {
      createBtn.addEventListener("click", () => {
        sendCommandToServer(`create automation from pattern ${pattern.id}`);
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        sendCommandToServer(`dismiss pattern ${pattern.id}`);
        patternCard.remove();
      });
    }

    patternsEl.appendChild(patternCard);
  });
}

// Show response modal
function showResponse(text) {
  const responseText = getElement("responseText");
  const responseModal = getElement("responseModal");

  if (!responseText || !responseModal) {
    console.warn("Response elements not found");
    return;
  }

  responseText.textContent = text;
  responseModal.classList.add("show");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    responseModal.classList.remove("show");
  }, 5000);
}

// Safely add event listener
function safeAddEventListener(element, event, handler) {
  if (element) {
    element.addEventListener(event, handler);
  }
}

// Enhanced device filtering
function filterDevices(filterType) {
  const allDevices = getElement("all-devices");

  if (!allDevices) return;

  const deviceCards = allDevices.querySelectorAll(".device-card");

  deviceCards.forEach((card) => {
    const deviceType = card.dataset.deviceType;
    const deviceName = card.textContent.toLowerCase();

    let shouldShow = false;

    switch (filterType) {
      case "all":
        shouldShow = true;
        break;
      case "mobile":
        shouldShow =
          deviceType === "mobile" ||
          deviceName.includes("phone") ||
          deviceName.includes("iphone") ||
          deviceName.includes("android") ||
          deviceName.includes("ipad");
        break;
      case "lights":
        shouldShow = deviceType === "light" || deviceType === "lighting";
        break;
      case "thermostats":
        shouldShow = deviceType === "thermostat";
        break;
      case "sensors":
        shouldShow = deviceType === "sensor";
        break;
      case "switches":
        shouldShow = deviceType === "switch";
        break;
      case "cameras":
        shouldShow = deviceType === "camera";
        break;
      case "computers":
        shouldShow = deviceType === "computer" || deviceType === "laptop";
        break;
      case "smart_tv":
        shouldShow = deviceType === "tv" || deviceType === "smart_tv";
        break;
      default:
        shouldShow = true;
    }

    card.style.display = shouldShow ? "block" : "none";
  });

  // Update filter button states
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active", "bg-primary-600", "text-white");
    btn.classList.add(
      "bg-white",
      "dark:bg-gray-800",
      "text-gray-700",
      "dark:text-gray-300",
    );
  });

  const activeBtn = document.querySelector(`[data-filter="${filterType}"]`);
  if (activeBtn) {
    activeBtn.classList.remove(
      "bg-white",
      "dark:bg-gray-800",
      "text-gray-700",
      "dark:text-gray-300",
    );
    activeBtn.classList.add("active", "bg-primary-600", "text-white");
  }
}

// Update phone statistics
function updatePhoneStats() {
  const phones = devices.filter(
    (d) =>
      d.type === "mobile" ||
      d.name?.toLowerCase().includes("phone") ||
      d.name?.toLowerCase().includes("iphone") ||
      d.name?.toLowerCase().includes("android") ||
      d.name?.toLowerCase().includes("ipad"),
  );

  const presentPhones = phones.filter(
    (p) => p.status === "online" || p.isActive || p.present,
  );
  const iosPhones = phones.filter(
    (p) =>
      p.details?.platform === "ios" ||
      p.name?.toLowerCase().includes("iphone") ||
      p.name?.toLowerCase().includes("ipad"),
  );
  const androidPhones = phones.filter(
    (p) =>
      p.details?.platform === "android" ||
      p.name?.toLowerCase().includes("android"),
  );

  // Update UI elements
  const totalPhonesEl = getElement("total-phones");
  const presentPhonesEl = getElement("present-phones");
  const iosPhonesEl = getElement("ios-phones");
  const androidPhonesEl = getElement("android-phones");

  if (totalPhonesEl) totalPhonesEl.textContent = phones.length;
  if (presentPhonesEl) presentPhonesEl.textContent = presentPhones.length;
  if (iosPhonesEl) iosPhonesEl.textContent = iosPhones.length;
  if (androidPhonesEl) androidPhonesEl.textContent = androidPhones.length;
}

// Render phone devices in the phone control panel
function renderPhoneDevices() {
  const phoneContainer = getElement("phone-devices");
  if (!phoneContainer) return;

  const phones = devices.filter(
    (d) =>
      d.type === "mobile" ||
      d.name?.toLowerCase().includes("phone") ||
      d.name?.toLowerCase().includes("iphone") ||
      d.name?.toLowerCase().includes("android") ||
      d.name?.toLowerCase().includes("ipad"),
  );

  if (phones.length === 0) {
    phoneContainer.innerHTML = `
      <div class="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p>No phones detected</p>
          <p class="text-xs mt-1">Click "Scan for Phones" to discover devices</p>
        </div>
      </div>
    `;
    return;
  }

  // Use the existing renderDeviceGrid function but for phones only
  renderDeviceGrid(phoneContainer, phones);
}

// Bulk phone actions
async function notifyAllPresentPhones() {
  const title = prompt("Notification title:", "JASON Alert");
  const message = prompt("Notification message:", "Hello from JASON!");

  if (!title || !message) return;

  const presentPhones = devices.filter(
    (d) =>
      (d.type === "mobile" || d.name?.toLowerCase().includes("phone")) &&
      (d.status === "online" || d.isActive || d.present),
  );

  let successCount = 0;
  for (const phone of presentPhones) {
    const result = await sendPhoneNotification(
      phone.deviceId || phone.id,
      title,
      message,
    );
    if (result.success) successCount++;
  }

  showResponse(
    `📱 Sent notifications to ${successCount}/${presentPhones.length} present phones`,
  );
}

async function checkAllPhonePresence() {
  const phones = devices.filter(
    (d) => d.type === "mobile" || d.name?.toLowerCase().includes("phone"),
  );

  showResponse(`📍 Checking presence for ${phones.length} phones...`);

  let presentCount = 0;
  for (const phone of phones) {
    const result = await checkPhonePresence(phone.deviceId || phone.id);
    if (result.success && result.data?.present) {
      presentCount++;
    }
  }

  showResponse(`📍 Found ${presentCount}/${phones.length} phones present`);
  updatePhoneStats();
}

async function findAllPhones() {
  const phones = devices.filter(
    (d) => d.type === "mobile" || d.name?.toLowerCase().includes("phone"),
  );

  showResponse(`🚨 Triggering find phone alarm on ${phones.length} devices...`);

  let successCount = 0;
  for (const phone of phones) {
    const result = await triggerPhoneAlarm(phone.deviceId || phone.id, 30);
    if (result.success) successCount++;
  }

  showResponse(
    `🚨 Find phone alarm sent to ${successCount}/${phones.length} devices`,
  );
}

async function sendEmergencyAlert() {
  const message = prompt(
    "Emergency message:",
    "EMERGENCY: Please respond immediately!",
  );
  if (!message) return;

  const phones = devices.filter(
    (d) => d.type === "mobile" || d.name?.toLowerCase().includes("phone"),
  );

  showResponse(`🚨 Sending emergency alert to ${phones.length} phones...`);

  let successCount = 0;
  for (const phone of phones) {
    const result = await sendPhoneNotification(
      phone.deviceId || phone.id,
      "🚨 EMERGENCY ALERT",
      message,
      { priority: "high", emergency: true },
    );
    if (result.success) successCount++;
  }

  showResponse(
    `🚨 Emergency alert sent to ${successCount}/${phones.length} phones`,
  );
}

// Navigation handling
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll("section").forEach((section) => {
    section.classList.add("hidden");
  });

  // Show the requested section
  const targetSection = getElement(sectionId);
  if (targetSection) {
    targetSection.classList.remove("hidden");
  }

  // Update navigation active states
  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.remove("bg-primary-600", "text-white");
  });

  const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
  if (activeLink && !activeLink.href.includes(".html")) {
    activeLink.classList.add("bg-primary-600", "text-white");
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const commandInput = getElement("commandInput");
  const sendCommand = getElement("sendCommand");
  const closeBtn = document.querySelector(".close-btn");
  const alexaButton = getElement("alexaButton");
  const googleButton = getElement("googleButton");
  const menuLinks = document.querySelectorAll(".sidebar-menu a");
  const contentAreas = document.querySelectorAll(".content-area");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Initialize WebSocket
  initWebSocket();

  // Send command button
  safeAddEventListener(sendCommand, "click", () => {
    if (!commandInput) return;

    const command = commandInput.value.trim();
    if (command) {
      sendCommandToServer(command);
      commandInput.value = "";
    }
  });

  // Command input enter key
  safeAddEventListener(commandInput, "keypress", (e) => {
    if (e.key === "Enter") {
      const command = commandInput.value.trim();
      if (command) {
        sendCommandToServer(command);
        commandInput.value = "";
      }
    }
  });

  // Close response modal
  safeAddEventListener(closeBtn, "click", () => {
    const responseModal = getElement("responseModal");
    if (responseModal) {
      responseModal.classList.remove("show");
    }
  });

  // Voice assistant buttons
  safeAddEventListener(alexaButton, "click", () => {
    const command = prompt("What would you like to ask Alexa?");
    if (command) {
      sendCommandToServer(`alexa ${command}`);
    }
  });

  safeAddEventListener(googleButton, "click", () => {
    const command = prompt("What would you like to ask Google Assistant?");
    if (command) {
      sendCommandToServer(`google ${command}`);
    }
  });

  // Quick action buttons
  const discoverDevicesBtn = getElement("discover-devices");
  const allLightsOnBtn = getElement("all-lights-on");
  const allLightsOffBtn = getElement("all-lights-off");

  safeAddEventListener(discoverDevicesBtn, "click", () => {
    discoverDevices();
  });

  safeAddEventListener(allLightsOnBtn, "click", () => {
    sendCommandToServer("turn on all lights");
  });

  safeAddEventListener(allLightsOffBtn, "click", () => {
    sendCommandToServer("turn off all lights");
  });

  // Phone control event listeners
  const discoverPhonesBtn = getElement("discover-phones");
  if (discoverPhonesBtn) {
    discoverPhonesBtn.addEventListener("click", discoverPhones);
  }

  const scanPhonesBtn = getElement("scan-phones");
  if (scanPhonesBtn) {
    scanPhonesBtn.addEventListener("click", discoverPhones);
  }

  const refreshPhonesBtn = getElement("refresh-phones");
  if (refreshPhonesBtn) {
    refreshPhonesBtn.addEventListener("click", () => {
      updatePhoneStats();
      renderPhoneDevices();
    });
  }

  const notifyAllPhonesBtn = getElement("notify-all-phones");
  if (notifyAllPhonesBtn) {
    notifyAllPhonesBtn.addEventListener("click", notifyAllPresentPhones);
  }

  const notifyAllPresentBtn = getElement("notify-all-present");
  if (notifyAllPresentBtn) {
    notifyAllPresentBtn.addEventListener("click", notifyAllPresentPhones);
  }

  const checkAllPresenceBtn = getElement("check-all-presence");
  if (checkAllPresenceBtn) {
    checkAllPresenceBtn.addEventListener("click", checkAllPhonePresence);
  }

  const findAllPhonesBtn = getElement("find-all-phones");
  if (findAllPhonesBtn) {
    findAllPhonesBtn.addEventListener("click", findAllPhones);
  }

  const emergencyAlertBtn = getElement("emergency-alert");
  if (emergencyAlertBtn) {
    emergencyAlertBtn.addEventListener("click", sendEmergencyAlert);
  }

  // Device filter event listeners
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filterType = e.target.dataset.filter;
      if (filterType) {
        filterDevices(filterType);
      }
    });
  });

  // Navigation event listeners
  document.querySelectorAll('nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute("href").substring(1);
      showSection(sectionId);
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = getElement("mobile-menu-button");
  const mobileMenu = getElement("mobile-menu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Add dark mode toggle functionality
  const darkModeToggle = getElement("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem(
        "darkMode",
        document.documentElement.classList.contains("dark"),
      );
    });

    // Check for saved dark mode preference
    if (
      localStorage.getItem("darkMode") === "true" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches &&
        !localStorage.getItem("darkMode"))
    ) {
      document.documentElement.classList.add("dark");
    }
  }
});

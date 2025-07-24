/**
 * JASON - The Omnipotent AI Architect
 * Main application JavaScript
 */

// Global state
let ws;
let devices = [];
let scenes = [];
let automations = [];
let connected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// DOM Elements - Safely get elements
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element not found: #${id}`);
  }
  return element;
}

// Initialize WebSocket connection
function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to server");
      connected = true;
      reconnectAttempts = 0;
      showToast(
        "success",
        "Connected",
        "Successfully connected to JASON server",
      );

      // Request initial data
      sendToServer({
        type: "get_initial_data",
      });
    };

    ws.onmessage = (event) => {
      handleServerMessage(event.data);
    };

    ws.onclose = () => {
      console.log("Disconnected from server");
      connected = false;

      // Try to reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;

        showToast(
          "error",
          "Disconnected",
          `Connection lost. Reconnecting in ${delay / 1000} seconds...`,
        );

        setTimeout(() => {
          initWebSocket();
        }, delay);
      } else {
        showToast(
          "error",
          "Connection Failed",
          "Could not reconnect to server. Please refresh the page.",
        );
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      showToast("error", "Connection Error", "Error connecting to server");
    };
  } catch (error) {
    console.error("Error initializing WebSocket:", error);
    showToast("error", "Connection Error", "Failed to initialize connection");
  }
}

// Send data to server
function sendToServer(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    showToast(
      "error",
      "Not Connected",
      "Cannot send command: not connected to server",
    );
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
        showToast(
          "success",
          "Device Discovered",
          `Found new device: ${message.device.name}`,
        );
        break;

      case "device_removed":
        // Device removed
        removeDevice(message.deviceId);
        break;

      case "scene_activated":
        // Scene activated
        updateScene(message.scene);
        showToast(
          "success",
          "Scene Activated",
          `"${message.scene.name}" scene activated`,
        );
        break;

      case "automation_executed":
        // Automation executed
        updateAutomation(message.automation);
        showToast(
          "info",
          "Automation Executed",
          `"${message.automation.name}" automation executed`,
        );
        break;

      default:
        console.warn("Unknown message type:", message.type);
    }
  } catch (error) {
    // Handle plain text responses
    console.log("Received text message:", data);
    showResponseModal(data);
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

  showToast("success", "Data Loaded", "Initial data loaded successfully");
}

// Handle command response
function handleCommandResponse(result) {
  if (!result) return;

  if (result.content) {
    showResponseModal(result.content);
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

// Render device grid
function renderDeviceGrid(container, deviceList) {
  if (!container) return;

  container.innerHTML = "";

  if (!deviceList || deviceList.length === 0) {
    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 col-span-full">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No devices found</p>
          <button id="discover-devices-empty" class="mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            Discover Devices
          </button>
        </div>
      </div>
    `;

    // Add event listener to discover button
    const discoverBtn = container.querySelector("#discover-devices-empty");
    if (discoverBtn) {
      discoverBtn.addEventListener("click", () => {
        sendCommandToServer("discover devices");
      });
    }

    return;
  }

  // Create device cards
  deviceList.forEach((device) => {
    const template = document.getElementById("device-template");
    if (!template) return;

    const clone = document.importNode(template.content, true);
    const deviceCard = clone.querySelector(".device-card");

    deviceCard.dataset.deviceId = device.id;
    deviceCard.dataset.deviceType = device.type;

    // Set device name and type
    const nameEl = deviceCard.querySelector(".device-name");
    const typeEl = deviceCard.querySelector(".device-type");

    if (nameEl) nameEl.textContent = device.name;
    if (typeEl)
      typeEl.textContent =
        device.type.charAt(0).toUpperCase() + device.type.slice(1);

    // Set device status
    const statusEl = deviceCard.querySelector(".device-status");
    if (statusEl) {
      if (device.connected) {
        statusEl.textContent = device.state && device.state.on ? "On" : "Off";
        statusEl.classList.add(
          device.state && device.state.on
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        );
      } else {
        statusEl.textContent = "Offline";
        statusEl.classList.add(
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        );
      }
    }

    // Add device controls
    const controlsEl = deviceCard.querySelector(".device-controls");
    if (controlsEl) {
      // Add power button for all devices
      const powerBtn = document.createElement("button");
      powerBtn.className = `w-full ${device.state && device.state.on ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white py-2 px-4 rounded-lg mb-2 transition-colors`;
      powerBtn.textContent =
        device.state && device.state.on ? "Turn Off" : "Turn On";
      powerBtn.addEventListener("click", () => {
        const action = device.state && device.state.on ? "turn off" : "turn on";
        sendCommandToServer(`${action} ${device.name}`);
      });
      controlsEl.appendChild(powerBtn);

      // Add device-specific controls
      if (
        device.type === "light" &&
        device.capabilities &&
        device.capabilities.includes("brightness")
      ) {
        const brightnessControl = document.createElement("div");
        brightnessControl.className = "mt-3";
        brightnessControl.innerHTML = `
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brightness</label>
          <input type="range" min="0" max="100" value="${device.state && device.state.brightness ? device.state.brightness : 100}" 
                 class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
        `;

        const slider = brightnessControl.querySelector('input[type="range"]');
        slider.addEventListener("change", (e) => {
          sendCommandToServer(
            `set ${device.name} brightness to ${e.target.value}`,
          );
        });

        controlsEl.appendChild(brightnessControl);
      }

      if (
        device.type === "light" &&
        device.capabilities &&
        device.capabilities.includes("color")
      ) {
        const colorControl = document.createElement("div");
        colorControl.className = "mt-3";
        colorControl.innerHTML = `
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
          <div class="flex space-x-2">
            <button class="w-6 h-6 rounded-full bg-red-500" data-color="red"></button>
            <button class="w-6 h-6 rounded-full bg-green-500" data-color="green"></button>
            <button class="w-6 h-6 rounded-full bg-blue-500" data-color="blue"></button>
            <button class="w-6 h-6 rounded-full bg-yellow-500" data-color="yellow"></button>
            <button class="w-6 h-6 rounded-full bg-purple-500" data-color="purple"></button>
            <button class="w-6 h-6 rounded-full bg-white border border-gray-300" data-color="white"></button>
          </div>
        `;

        const colorButtons = colorControl.querySelectorAll("button");
        colorButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const color = button.dataset.color;
            sendCommandToServer(`set ${device.name} color to ${color}`);
          });
        });

        controlsEl.appendChild(colorControl);
      }

      if (device.type === "thermostat") {
        const tempControl = document.createElement("div");
        tempControl.className = "mt-3";

        const currentTemp =
          device.state && device.state.temperature
            ? device.state.temperature
            : 70;
        const targetTemp =
          device.state && device.state.targetTemperature
            ? device.state.targetTemperature
            : currentTemp;

        tempControl.innerHTML = `
          <div class="flex justify-between items-center">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Temperature</label>
            <span class="text-2xl font-bold">${targetTemp}°</span>
          </div>
          <div class="flex justify-between mt-2">
            <button class="temp-down bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg w-10 h-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
            <button class="temp-up bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg w-10 h-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        `;

        const downBtn = tempControl.querySelector(".temp-down");
        const upBtn = tempControl.querySelector(".temp-up");

        downBtn.addEventListener("click", () => {
          sendCommandToServer(`decrease ${device.name} temperature`);
        });

        upBtn.addEventListener("click", () => {
          sendCommandToServer(`increase ${device.name} temperature`);
        });

        controlsEl.appendChild(tempControl);
      }
    }

    container.appendChild(deviceCard);
  });
}

// Update a device element in the UI
function updateDeviceElement(element, device) {
  if (!element || !device) return;

  // Update status
  const statusEl = element.querySelector(".device-status");
  if (statusEl) {
    if (device.connected) {
      statusEl.textContent = device.state && device.state.on ? "On" : "Off";
      statusEl.className =
        "device-status px-2 py-1 text-xs rounded-full " +
        (device.state && device.state.on
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300");
    } else {
      statusEl.textContent = "Offline";
      statusEl.className =
        "device-status px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
  }

  // Update power button
  const powerBtn = element.querySelector(".device-controls button:first-child");
  if (powerBtn) {
    powerBtn.textContent =
      device.state && device.state.on ? "Turn Off" : "Turn On";
    powerBtn.className = `w-full ${device.state && device.state.on ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white py-2 px-4 rounded-lg mb-2 transition-colors`;
  }

  // Update brightness slider
  if (
    device.type === "light" &&
    device.capabilities &&
    device.capabilities.includes("brightness")
  ) {
    const slider = element.querySelector('input[type="range"]');
    if (slider && device.state && device.state.brightness !== undefined) {
      slider.value = device.state.brightness;
    }
  }

  // Update thermostat display
  if (device.type === "thermostat") {
    const tempDisplay = element.querySelector(".device-controls span");
    if (
      tempDisplay &&
      device.state &&
      device.state.targetTemperature !== undefined
    ) {
      tempDisplay.textContent = `${device.state.targetTemperature}°`;
    }
  }
}

// Render scenes
function renderScenes() {
  const allScenesEl = getElement("all-scenes");
  if (!allScenesEl) return;

  allScenesEl.innerHTML = "";

  if (!scenes || scenes.length === 0) {
    allScenesEl.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 col-span-full">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No scenes created yet</p>
          <button id="create-scene-empty" class="mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            Create Scene
          </button>
        </div>
      </div>
    `;

    // Add event listener to create button
    const createBtn = allScenesEl.querySelector("#create-scene-empty");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        // Show scene creation modal (to be implemented)
        showToast(
          "info",
          "Coming Soon",
          "Scene creation will be available soon",
        );
      });
    }

    return;
  }

  // Create scene cards
  scenes.forEach((scene) => {
    const template = document.getElementById("scene-template");
    if (!template) return;

    const clone = document.importNode(template.content, true);
    const sceneCard = clone.querySelector(".scene-card");

    sceneCard.dataset.sceneId = scene.id;

    // Set scene name and description
    const nameEl = sceneCard.querySelector(".scene-name");
    const descEl = sceneCard.querySelector(".scene-description");

    if (nameEl) nameEl.textContent = scene.name;
    if (descEl) descEl.textContent = scene.description || "";

    // Set scene devices
    const devicesEl = sceneCard.querySelector(".scene-devices");
    if (devicesEl && scene.devices && scene.devices.length > 0) {
      devicesEl.textContent = `${scene.devices.length} device${scene.devices.length > 1 ? "s" : ""}`;
    }

    // Add activate button event listener
    const activateBtn = sceneCard.querySelector(".activate-scene");
    if (activateBtn) {
      activateBtn.addEventListener("click", () => {
        sendCommandToServer(`activate scene ${scene.name}`);
      });
    }

    allScenesEl.appendChild(sceneCard);
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No automations created yet</p>
          <button id="create-automation-empty" class="mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            Create Automation
          </button>
        </div>
      </div>
    `;

    // Add event listener to create button
    const createBtn = allAutomationsEl.querySelector(
      "#create-automation-empty",
    );
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        // Show automation creation modal (to be implemented)
        showToast(
          "info",
          "Coming Soon",
          "Automation creation will be available soon",
        );
      });
    }

    return;
  }

  // Create automation cards
  automations.forEach((automation) => {
    const template = document.getElementById("automation-template");
    if (!template) return;

    const clone = document.importNode(template.content, true);
    const automationCard = clone.querySelector(".automation-card");

    automationCard.dataset.automationId = automation.id;

    // Set automation name and description
    const nameEl = automationCard.querySelector(".automation-name");
    const descEl = automationCard.querySelector(".automation-description");

    if (nameEl) nameEl.textContent = automation.name;
    if (descEl) descEl.textContent = automation.description || "";

    // Set automation details
    const detailsEl = automationCard.querySelector(".automation-details");
    if (detailsEl) {
      let triggerText = "Unknown trigger";

      if (automation.trigger) {
        if (automation.trigger.type === "time") {
          triggerText = `At ${automation.trigger.time}`;
        } else if (automation.trigger.type === "device") {
          triggerText = `When ${automation.trigger.deviceName} ${automation.trigger.condition}`;
        }
      }

      detailsEl.textContent = triggerText;
    }

    // Set enabled state
    const enabledCheckbox = automationCard.querySelector(".automation-enabled");
    if (enabledCheckbox) {
      enabledCheckbox.checked = automation.enabled;

      enabledCheckbox.addEventListener("change", () => {
        const action = enabledCheckbox.checked ? "enable" : "disable";
        sendCommandToServer(`${action} automation ${automation.name}`);
      });
    }

    allAutomationsEl.appendChild(automationCard);
  });
}

// Show response in modal
function showResponseModal(text) {
  const responseText = getElement("responseText");
  const responseModal = getElement("responseModal");

  if (!responseText || !responseModal) {
    console.warn("Response modal elements not found");
    return;
  }

  responseText.textContent = text;
  responseModal.classList.remove("hidden");

  // Add event listener to close button if not already added
  const closeBtn = responseModal.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      responseModal.classList.add("hidden");
    });
  }

  // Close when clicking outside the modal content
  responseModal.addEventListener("click", (e) => {
    if (e.target === responseModal) {
      responseModal.classList.add("hidden");
    }
  });
}

// Show toast notification
function showToast(type, title, message) {
  const toast = getElement("toast");
  const toastIcon = getElement("toast-icon");
  const toastMessage = getElement("toast-message");
  const toastDescription = getElement("toast-description");
  const toastClose = getElement("toast-close");

  if (!toast || !toastIcon || !toastMessage || !toastDescription) {
    console.warn("Toast elements not found");
    return;
  }

  // Set toast content
  toastMessage.textContent = title;
  toastDescription.textContent = message;

  // Set toast type
  toastIcon.innerHTML = "";

  let iconSvg;
  switch (type) {
    case "success":
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
      break;
    case "error":
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      break;
    case "info":
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
      break;
    default:
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
  }

  toastIcon.innerHTML = iconSvg;

  // Show toast
  toast.classList.remove("translate-y-20", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");

  // Auto-hide after 5 seconds
  const hideTimeout = setTimeout(() => {
    hideToast();
  }, 5000);

  // Add close button event listener
  toastClose.addEventListener("click", () => {
    clearTimeout(hideTimeout);
    hideToast();
  });

  function hideToast() {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("translate-y-20", "opacity-0");
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const commandInput = getElement("commandInput");
  const sendCommand = getElement("sendCommand");
  const discoverDevices = getElement("discover-devices");
  const allLightsOn = getElement("all-lights-on");
  const allLightsOff = getElement("all-lights-off");
  const refreshDevices = getElement("refresh-devices");
  const alexaButton = getElement("alexaButton");
  const googleButton = getElement("googleButton");

  // Initialize WebSocket
  initWebSocket();

  // Send command button
  if (sendCommand && commandInput) {
    sendCommand.addEventListener("click", () => {
      const command = commandInput.value.trim();
      if (command) {
        sendCommandToServer(command);
        commandInput.value = "";
      }
    });
  }

  // Command input enter key
  if (commandInput) {
    commandInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const command = commandInput.value.trim();
        if (command) {
          sendCommandToServer(command);
          commandInput.value = "";
        }
      }
    });
  }

  // Discover devices button
  if (discoverDevices) {
    discoverDevices.addEventListener("click", () => {
      sendCommandToServer("discover devices");
    });
  }

  // All lights on button
  if (allLightsOn) {
    allLightsOn.addEventListener("click", () => {
      sendCommandToServer("turn on all lights");
    });
  }

  // All lights off button
  if (allLightsOff) {
    allLightsOff.addEventListener("click", () => {
      sendCommandToServer("turn off all lights");
    });
  }

  // Refresh devices button
  if (refreshDevices) {
    refreshDevices.addEventListener("click", () => {
      sendCommandToServer("refresh devices");
    });
  }

  // Voice assistant buttons
  if (alexaButton) {
    alexaButton.addEventListener("click", () => {
      showToast("info", "Alexa Integration", "Alexa integration coming soon");
    });
  }

  if (googleButton) {
    googleButton.addEventListener("click", () => {
      showToast(
        "info",
        "Google Assistant",
        "Google Assistant integration coming soon",
      );
    });
  }

  // Close response modal
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const responseModal = getElement("responseModal");
      if (responseModal) {
        responseModal.classList.add("hidden");
      }
    });
  }

  // Initialize with mock data for demo purposes
  if (!connected) {
    // Mock devices
    devices = [
      {
        id: "light-1",
        name: "Living Room Light",
        type: "light",
        manufacturer: "Philips",
        model: "Hue",
        capabilities: ["on", "brightness", "color"],
        state: { on: true, brightness: 80, color: { h: 240, s: 100, v: 100 } },
        connected: true,
      },
      {
        id: "light-2",
        name: "Kitchen Light",
        type: "light",
        manufacturer: "LIFX",
        model: "A19",
        capabilities: ["on", "brightness", "color"],
        state: { on: false, brightness: 100, color: { h: 0, s: 0, v: 100 } },
        connected: true,
      },
      {
        id: "thermostat-1",
        name: "Living Room Thermostat",
        type: "thermostat",
        manufacturer: "Nest",
        model: "Learning Thermostat",
        capabilities: ["temperature", "mode"],
        state: { temperature: 72, targetTemperature: 70, mode: "heat" },
        connected: true,
      },
      {
        id: "switch-1",
        name: "Porch Light Switch",
        type: "switch",
        manufacturer: "WeMo",
        model: "Smart Switch",
        capabilities: ["on"],
        state: { on: true },
        connected: true,
      },
      {
        id: "sensor-1",
        name: "Front Door Sensor",
        type: "sensor",
        manufacturer: "SmartThings",
        model: "Multipurpose Sensor",
        capabilities: ["contact", "temperature", "battery"],
        state: { contact: false, temperature: 68, battery: 92 },
        connected: true,
      },
      {
        id: "camera-1",
        name: "Front Door Camera",
        type: "camera",
        manufacturer: "Ring",
        model: "Video Doorbell",
        capabilities: ["motion", "video", "battery"],
        state: { motion: false, battery: 78 },
        connected: false,
      },
    ];

    // Mock scenes
    scenes = [
      {
        id: "scene-1",
        name: "Movie Night",
        description: "Dim lights and set temperature for movie watching",
        devices: ["light-1", "light-2", "thermostat-1"],
        lastActivated: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: "scene-2",
        name: "Good Morning",
        description: "Gradually turn on lights and adjust temperature",
        devices: ["light-1", "light-2", "thermostat-1"],
        lastActivated: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: "scene-3",
        name: "Away Mode",
        description: "Turn off all devices and enable security",
        devices: ["light-1", "light-2", "thermostat-1", "switch-1"],
        lastActivated: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    // Mock automations
    automations = [
      {
        id: "auto-1",
        name: "Morning Routine",
        description: "Turn on lights at sunrise",
        trigger: { type: "time", time: "7:00 AM" },
        actions: [
          { deviceId: "light-1", action: "turnOn" },
          { deviceId: "light-2", action: "turnOn" },
        ],
        enabled: true,
      },
      {
        id: "auto-2",
        name: "Night Mode",
        description: "Turn off lights at bedtime",
        trigger: { type: "time", time: "11:00 PM" },
        actions: [
          { deviceId: "light-1", action: "turnOff" },
          { deviceId: "light-2", action: "turnOff" },
        ],
        enabled: true,
      },
      {
        id: "auto-3",
        name: "Motion Detection",
        description: "Turn on porch light when motion detected",
        trigger: {
          type: "device",
          deviceId: "camera-1",
          deviceName: "Front Door Camera",
          condition: "detects motion",
        },
        actions: [{ deviceId: "switch-1", action: "turnOn" }],
        enabled: false,
      },
    ];

    // Update UI with mock data
    updateDeviceCounts();
    renderDevices();
    updateSceneCounts();
    renderScenes();
    updateAutomationCounts();
    renderAutomations();
  }
});

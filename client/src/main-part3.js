// Update quick devices container
function updateQuickDevicesContainer(devices) {
  const quickDevicesContainer = document.getElementById("quick-devices");
  if (!quickDevicesContainer) return;

  if (devices.length === 0) {
    quickDevicesContainer.innerHTML =
      '<div class="p-3 bg-gray-800 bg-opacity-50 rounded">No devices found</div>';
    return;
  }

  // Show only the first 4 devices
  const quickDevices = devices.slice(0, 4);

  quickDevicesContainer.innerHTML = quickDevices
    .map((device) => {
      const icon = getDeviceIcon(device.type);

      return `
      <div class="p-3 bg-gray-800 bg-opacity-50 rounded">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center">
            ${icon}
            <h3 class="font-medium">${device.name}</h3>
          </div>
          <span class="px-2 py-1 text-xs rounded ${device.isActive ? "bg-green-600" : "bg-gray-600"}">${device.status}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm">${device.isActive ? "On" : "Off"}</span>
          <label class="toggle-switch">
            <input type="checkbox" class="device-toggle" data-device-id="${device.deviceId}" ${device.isActive ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
    })
    .join("");

  // Add event listeners to device toggles
  document.querySelectorAll(".device-toggle").forEach((toggle) => {
    toggle.addEventListener("change", async () => {
      const deviceId = toggle.getAttribute("data-device-id");
      const state = toggle.checked;

      try {
        await fetch(`/api/devices/${deviceId}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state }),
        });

        showToast(`Device ${state ? "turned on" : "turned off"}`, "success");

        // Reload devices after toggle
        setTimeout(() => {
          loadDevices();
        }, 1000);
      } catch (error) {
        console.error("Error toggling device:", error);
        showToast("Failed to toggle device", "error");
        toggle.checked = !state; // Revert toggle state
      }
    });
  });
}

// Load activities from API
async function loadActivities() {
  try {
    const response = await fetch("/api/activities");
    const activities = await response.json();

    const activitiesContainer = document.getElementById("activities-container");
    if (!activitiesContainer) return;

    if (activities.length === 0) {
      activitiesContainer.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded">No activities found</div>';
      return;
    }

    activitiesContainer.innerHTML = activities
      .map((activity) => {
        let icon = "";

        switch (activity.type) {
          case "device":
            icon = `<svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 3H15M12 3V21M12 21H17M12 21H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
            break;
          case "scene":
            icon = `<svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8H20M4 16H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M9 4L7 8L9 12L7 16L9 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 4L17 8L15 12L17 16L15 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
            break;
          case "system":
            icon = `<svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.4 15C19.1277 15.8031 19.2583 16.6718 19.7601 17.37C20.2619 18.0281 20.9547 18.4342 21.6 18.5C21.6 18.5 22 20.4 20.5 21.9C19 23.4 17.1 23 17.1 23C16.9989 22.3584 16.5581 21.7946 15.9145 21.4322C15.2709 21.0698 14.4864 20.9389 13.7454 21.0655C13.0045 21.1921 12.3462 21.5661 11.9007 22.1177C11.4552 22.6693 11.2537 23.3606 11.3 24.05C11.3 24.05 9.4 24.45 7.9 22.95C6.4 21.45 6.8 19.55 6.8 19.55C7.44152 19.489 8.02622 19.1823 8.42121 18.7019C8.81621 18.2214 8.99271 17.6015 8.91238 16.9868C8.83205 16.372 8.49984 15.8163 8.00121 15.4367C7.50259 15.0572 6.87861 14.8839 6.26 14.95C6.26 14.95 5.86 13.05 7.36 11.55C8.86 10.05 10.76 10.45 10.76 10.45C10.8211 11.0615 11.1054 11.6269 11.5534 12.0444C12.0014 12.4619 12.5831 12.7067 13.2 12.73C13.8169 12.7067 14.3986 12.4619 14.8466 12.0444C15.2946 11.6269 15.5789 11.0615 15.64 10.45C15.64 10.45 17.54 10.05 19.04 11.55C20.54 13.05 20.14 14.95 20.14 14.95C19.5295 15.0112 18.9643 15.2954 18.5468 15.7434C18.1293 16.1914 17.8845 16.7731 17.86 17.39" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
            break;
          default:
            icon = `<svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          </svg>`;
        }

        return `
        <div class="p-3 bg-gray-800 bg-opacity-50 rounded">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              ${icon}
              <h3 class="font-medium">${activity.title}</h3>
            </div>
            <span class="text-xs text-gray-400">${formatDate(activity.timestamp)}</span>
          </div>
          <p class="text-sm text-gray-400 mt-1">${activity.description}</p>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading activities:", error);
    const activitiesContainer = document.getElementById("activities-container");
    if (activitiesContainer) {
      activitiesContainer.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded">Error loading activities</div>';
    }
  }
}

// Load console messages from API
async function loadConsoleMessages() {
  try {
    const response = await fetch("/api/console-messages");
    const messages = await response.json();

    const consoleContainer = document.getElementById("console-container");
    if (!consoleContainer) return;

    if (messages.length === 0) {
      consoleContainer.innerHTML =
        '<div class="text-green-400">JASON v1.0 initialized. Ready for commands.</div>';
      return;
    }

    consoleContainer.innerHTML = messages
      .map(
        (message) => `
      <div class="${message.type === "user" ? "text-blue-300" : "text-green-400"}">
        <span class="text-xs text-gray-400">[${formatTime(message.timestamp)}]</span>
        ${message.type === "user" ? '<span class="text-xs text-blue-400">YOU:</span> ' : ""}
        ${message.text}
      </div>
    `,
      )
      .join("");

    // Scroll to bottom
    consoleContainer.scrollTop = consoleContainer.scrollHeight;
  } catch (error) {
    console.error("Error loading console messages:", error);
  }
}

// Load scenes from API
async function loadScenes() {
  try {
    const response = await fetch("/api/scenes");
    const scenes = await response.json();

    const scenesContainer = document.getElementById("scenes-container");
    if (!scenesContainer) return;

    if (scenes.length === 0) {
      scenesContainer.innerHTML = '<div class="card p-4">No scenes found</div>';
      return;
    }

    scenesContainer.innerHTML = scenes
      .map((scene) => {
        // Generate a random gradient for the scene card
        const gradients = [
          "from-blue-500 to-purple-600",
          "from-green-500 to-teal-600",
          "from-yellow-500 to-orange-600",
          "from-red-500 to-pink-600",
          "from-indigo-500 to-blue-600",
        ];
        const gradient =
          gradients[Math.floor(Math.random() * gradients.length)];

        return `
        <div class="card overflow-hidden">
          <div class="bg-gradient-to-r ${gradient} p-4">
            <h3 class="font-medium text-xl">${scene.name}</h3>
          </div>
          <div class="card-body">
            <p class="text-sm text-gray-400 mb-4">${scene.description}</p>
            <button 
              class="w-full px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 scene-activate"
              data-scene-id="${scene.id}"
            >
              Activate Scene
            </button>
          </div>
        </div>
      `;
      })
      .join("");

    // Add event listeners to scene buttons
    document.querySelectorAll(".scene-activate").forEach((button) => {
      button.addEventListener("click", async () => {
        const sceneId = button.getAttribute("data-scene-id");

        try {
          button.textContent = "Activating...";
          button.disabled = true;

          await fetch(`/api/scenes/${sceneId}/activate`, {
            method: "POST",
          });

          showToast("Scene activated successfully", "success");

          // Reload devices after scene activation
          loadDevices();
          loadActivities();

          button.textContent = "Activate Scene";
          button.disabled = false;
        } catch (error) {
          console.error("Error activating scene:", error);
          showToast("Failed to activate scene", "error");
          button.textContent = "Activate Scene";
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    console.error("Error loading scenes:", error);
    const scenesContainer = document.getElementById("scenes-container");
    if (scenesContainer) {
      scenesContainer.innerHTML =
        '<div class="card p-4">Error loading scenes</div>';
    }
  }
}

// Show camera modal
function showCameraModal(deviceId) {
  // Create modal element
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50";
  modal.id = "camera-modal";

  // Get device name
  const deviceCard = document.querySelector(
    `.device-card[data-device-id="${deviceId}"]`,
  );
  const deviceName = deviceCard
    ? deviceCard.querySelector("h3").textContent
    : "Camera";

  // Modal content
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-lg max-w-3xl w-full mx-4">
      <div class="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 class="text-xl font-medium">${deviceName} - Live View</h3>
        <button id="close-modal" class="text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="p-4">
        <div class="bg-black aspect-video flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading camera feed...</p>
          </div>
        </div>
        <div class="mt-4 flex justify-between">
          <button class="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm">Take Snapshot</button>
          <button class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">Start Recording</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.appendChild(modal);

  // Add event listener to close button
  document.getElementById("close-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Simulate loading camera feed
  setTimeout(() => {
    const cameraFeed = modal.querySelector(".bg-black");
    if (cameraFeed) {
      cameraFeed.innerHTML = `
        <img src="https://picsum.photos/800/450?random=${deviceId}" alt="Camera Feed" class="w-full h-auto">
      `;
    }
  }, 2000);
}

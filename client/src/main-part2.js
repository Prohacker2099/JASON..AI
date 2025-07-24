// Load devices from API
async function loadDevices() {
  try {
    const response = await fetch("/api/devices");
    const devices = await response.json();

    // Update device count
    const deviceCount = document.getElementById("device-count");
    if (deviceCount) {
      deviceCount.textContent = devices.length;
    }

    // Update active device count
    const activeDeviceCount = document.getElementById("active-device-count");
    if (activeDeviceCount) {
      const activeDevices = devices.filter((device) => device.isActive);
      activeDeviceCount.textContent = activeDevices.length;
    }

    // Collect unique rooms
    const rooms = [
      ...new Set(devices.map((device) => device.details.location || "Unknown")),
    ];
    updateRoomFilters(rooms);

    // Update devices container
    updateDevicesContainer(devices);

    // Update quick devices container
    updateQuickDevicesContainer(devices);
  } catch (error) {
    console.error("Error loading devices:", error);
    const devicesContainer = document.getElementById("devices-container");
    if (devicesContainer) {
      devicesContainer.innerHTML =
        '<div class="card p-4">Error loading devices</div>';
    }
    showToast("Failed to load devices", "error");
  }
}

// Update room filters
function updateRoomFilters(rooms) {
  const roomFilters = document.getElementById("room-filters");
  if (!roomFilters) return;

  // Keep the "All Rooms" button
  const allRoomsButton = roomFilters.querySelector('[data-room="all"]');

  // Clear existing room filters except "All Rooms"
  roomFilters.innerHTML = "";

  // Add "All Rooms" button back
  if (allRoomsButton) {
    roomFilters.appendChild(allRoomsButton);
  } else {
    const button = document.createElement("button");
    button.className = "room-badge active";
    button.setAttribute("data-room", "all");
    button.textContent = "All Rooms";
    button.addEventListener("click", () => {
      document.querySelectorAll("#room-filters .room-badge").forEach((b) => {
        b.classList.remove("active");
      });
      button.classList.add("active");
      filterDevicesByRoom("all");
    });
    roomFilters.appendChild(button);
  }

  // Add room filters
  rooms.forEach((room) => {
    if (room === "Unknown") return;

    const button = document.createElement("button");
    button.className = "room-badge";
    button.setAttribute("data-room", room);
    button.textContent = room;
    button.addEventListener("click", () => {
      document.querySelectorAll("#room-filters .room-badge").forEach((b) => {
        b.classList.remove("active");
      });
      button.classList.add("active");
      filterDevicesByRoom(room);
    });
    roomFilters.appendChild(button);
  });
}

// Filter devices by room
function filterDevicesByRoom(room) {
  const deviceCards = document.querySelectorAll(
    "#devices-container .device-card",
  );

  deviceCards.forEach((card) => {
    if (room === "all" || card.getAttribute("data-room") === room) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

// Get device icon based on type
function getDeviceIcon(type) {
  switch (type.toLowerCase()) {
    case "light":
      return `<svg class="device-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H15M12 3C8.13401 3 5 6.13401 5 10C5 12.2091 6.2 14.2091 8 15.3M12 3C15.866 3 19 6.13401 19 10C19 12.2091 17.8 14.2091 16 15.3M8 15.3C8.34316 15.5 8.66949 15.6 9 15.6667M8 15.3V15.3C8 16.7333 8.8 18.2667 10.4 18.8C11.1111 19 11.5556 19 12 19C12.4444 19 12.8889 19 13.6 18.8C15.2 18.2667 16 16.7333 16 15.3V15.3M16 15.3C15.6569 15.5 15.3305 15.6 15 15.6667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case "thermostat":
      return `<svg class="device-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9C11.4477 9 11 9.44771 11 10V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V10C13 9.44771 12.5523 9 12 9Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C8.13401 2 5 5.13401 5 9C5 11.1425 6.27189 13.0444 8.10362 14H8V17C8 19.2091 9.79086 21 12 21C14.2091 21 16 19.2091 16 17V14H15.8964C17.7281 13.0444 19 11.1425 19 9C19 5.13401 15.866 2 12 2ZM14 14V17C14 18.1046 13.1046 19 12 19C10.8954 19 10 18.1046 10 17V14H14ZM12 4C14.7614 4 17 6.23858 17 9C17 11.7614 14.7614 14 12 14C9.23858 14 7 11.7614 7 9C7 6.23858 9.23858 4 12 4Z" fill="currentColor"/>
      </svg>`;
    case "camera":
      return `<svg class="device-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7 2C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2H7ZM11 8C11 6.89543 11.8954 6 13 6C14.1046 6 15 6.89543 15 8C15 9.10457 14.1046 10 13 10C11.8954 10 11 9.10457 11 8ZM13 12C10.2386 12 8 14.2386 8 17H18C18 14.2386 15.7614 12 13 12Z" fill="currentColor"/>
      </svg>`;
    case "lock":
      return `<svg class="device-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 11H7V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 11H19V22H5V11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="currentColor"/>
      </svg>`;
    case "switch":
    case "outlet":
      return `<svg class="device-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 7H18M6 17H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M17 4L7 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    default:
      return `<svg class="device-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.5 9.5C9.5 8.11929 10.6193 7 12 7C13.3807 7 14.5 8.11929 14.5 9.5C14.5 10.8807 13.3807 12 12 12C10.6193 12 9.5 10.8807 9.5 9.5Z" stroke="currentColor" stroke-width="2"/>
        <path d="M5.5 15.5C5.5 14.1193 6.61929 13 8 13C9.38071 13 10.5 14.1193 10.5 15.5C10.5 16.8807 9.38071 18 8 18C6.61929 18 5.5 16.8807 5.5 15.5Z" stroke="currentColor" stroke-width="2"/>
        <path d="M13.5 15.5C13.5 14.1193 14.6193 13 16 13C17.3807 13 18.5 14.1193 18.5 15.5C18.5 16.8807 17.3807 18 16 18C14.6193 18 13.5 16.8807 13.5 15.5Z" stroke="currentColor" stroke-width="2"/>
      </svg>`;
  }
}

// Update devices container
function updateDevicesContainer(devices) {
  const devicesContainer = document.getElementById("devices-container");
  if (!devicesContainer) return;

  if (devices.length === 0) {
    devicesContainer.innerHTML = '<div class="card p-4">No devices found</div>';
    return;
  }

  devicesContainer.innerHTML = devices
    .map((device) => {
      const room = device.details.location || "Unknown";
      const icon = getDeviceIcon(device.type);

      return `
      <div class="card device-card fade-in" data-device-id="${device.deviceId}" data-room="${room}">
        <div class="card-header">
          <div class="flex items-center">
            ${icon}
            <h3 class="font-medium">${device.name}</h3>
          </div>
          <span class="px-2 py-1 text-xs rounded ${device.isActive ? "bg-green-600" : "bg-gray-600"}">${device.status}</span>
        </div>
        <div class="card-body">
          <div class="mb-2">
            <span class="room-badge">${room}</span>
            <span class="text-xs text-gray-400">${device.type}</span>
          </div>
          
          ${
            device.type === "light"
              ? `
            <div class="mb-3">
              <label class="text-sm mb-1 block">Brightness</label>
              <input type="range" min="0" max="100" value="${device.details.brightness || 0}" 
                class="w-full brightness-slider" data-device-id="${device.deviceId}">
            </div>
          `
              : ""
          }
          
          ${
            device.type === "thermostat"
              ? `
            <div class="mb-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Current: ${device.details.temperature || 70}°F</span>
                <div class="flex items-center">
                  <button class="temp-adjust px-2 py-1 bg-gray-800 rounded" data-device-id="${device.deviceId}" data-action="down">-</button>
                  <span class="px-2">${device.details.target || 70}°F</span>
                  <button class="temp-adjust px-2 py-1 bg-gray-800 rounded" data-device-id="${device.deviceId}" data-action="up">+</button>
                </div>
              </div>
            </div>
          `
              : ""
          }
          
          ${
            device.type === "camera"
              ? `
            <div class="mb-3">
              <button class="view-camera w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm" data-device-id="${device.deviceId}">
                View Live
              </button>
            </div>
          `
              : ""
          }
          
          <div class="flex justify-between items-center">
            <span class="text-sm">${device.isActive ? "On" : "Off"}</span>
            <label class="toggle-switch">
              <input type="checkbox" class="device-toggle" data-device-id="${device.deviceId}" ${device.isActive ? "checked" : ""}>
              <span class="toggle-slider"></span>
            </label>
          </div>
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

  // Add event listeners to brightness sliders
  document.querySelectorAll(".brightness-slider").forEach((slider) => {
    slider.addEventListener("change", async () => {
      const deviceId = slider.getAttribute("data-device-id");
      const brightness = parseInt(slider.value);

      try {
        await fetch(`/api/devices/${deviceId}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: true,
            brightness: brightness,
          }),
        });

        showToast(`Brightness set to ${brightness}%`, "success");
      } catch (error) {
        console.error("Error setting brightness:", error);
        showToast("Failed to set brightness", "error");
      }
    });
  });

  // Add event listeners to temperature adjustment buttons
  document.querySelectorAll(".temp-adjust").forEach((button) => {
    button.addEventListener("click", async () => {
      const deviceId = button.getAttribute("data-device-id");
      const action = button.getAttribute("data-action");

      // Find current target temperature
      const deviceCard = button.closest(".device-card");
      const tempDisplay = deviceCard.querySelector(".flex.items-center span");
      let currentTemp = parseInt(tempDisplay.textContent);

      // Adjust temperature
      if (action === "up") {
        currentTemp += 1;
      } else {
        currentTemp -= 1;
      }

      // Update display
      tempDisplay.textContent = `${currentTemp}°F`;

      try {
        await fetch(`/api/devices/${deviceId}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: true,
            target: currentTemp,
          }),
        });

        showToast(`Temperature set to ${currentTemp}°F`, "success");
      } catch (error) {
        console.error("Error setting temperature:", error);
        showToast("Failed to set temperature", "error");
      }
    });
  });

  // Add event listeners to camera view buttons
  document.querySelectorAll(".view-camera").forEach((button) => {
    button.addEventListener("click", () => {
      const deviceId = button.getAttribute("data-device-id");
      showCameraModal(deviceId);
    });
  });
}

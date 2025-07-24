// Load preferences from API
async function loadPreferences() {
  try {
    const response = await fetch("/api/preferences");
    const preferences = await response.json();

    updatePreferencesForm(preferences);
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
}

// Update preferences form
function updatePreferencesForm(preferences) {
  const form = document.getElementById("preferences-form");
  if (!form) return;

  // Update form fields
  const nameInput = form.querySelector("#name");
  if (nameInput) nameInput.value = preferences.name || "";

  const wakeUpTimeInput = form.querySelector("#wakeUpTime");
  if (wakeUpTimeInput) wakeUpTimeInput.value = preferences.wakeUpTime || "";

  const sleepTimeInput = form.querySelector("#sleepTime");
  if (sleepTimeInput) sleepTimeInput.value = preferences.sleepTime || "";

  const favoriteMusicSelect = form.querySelector("#favoriteMusic");
  if (favoriteMusicSelect) {
    const option = Array.from(favoriteMusicSelect.options).find(
      (opt) => opt.value === preferences.favoriteMusic,
    );
    if (option) {
      option.selected = true;
    }
  }

  const weatherAlertsCheckbox = form.querySelector("#weatherAlerts");
  if (weatherAlertsCheckbox)
    weatherAlertsCheckbox.checked = preferences.weatherAlerts || false;

  const trafficAlertsCheckbox = form.querySelector("#trafficAlerts");
  if (trafficAlertsCheckbox)
    trafficAlertsCheckbox.checked = preferences.trafficAlerts || false;
}

// Update current time
function updateCurrentTime() {
  const timeElement = document.getElementById("current-time");
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = now.toLocaleString();
  }
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "";
  switch (type) {
    case "success":
      icon = `<svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>`;
      break;
    case "error":
      icon = `<svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>`;
      break;
    case "warning":
      icon = `<svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>`;
      break;
    default:
      icon = `<svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`;
  }

  toast.innerHTML = `
    <div class="flex items-center">
      ${icon}
      ${message}
    </div>
  `;

  toastContainer.appendChild(toast);

  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

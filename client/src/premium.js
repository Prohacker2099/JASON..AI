// Premium features for JASON
document.addEventListener("DOMContentLoaded", () => {
  // Add premium features to the dashboard
  addPremiumFeatures();

  // Load premium data
  loadWeatherData();
  loadAnalyticsData();
  loadSecurityData();
});

// Add premium features to the dashboard
function addPremiumFeatures() {
  const dashboardSection = document.getElementById("dashboard");
  if (!dashboardSection) return;

  // Add premium sections after the existing content
  const premiumContent = `
    <div class="mt-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-xl font-semibold">Weather & Environment</h3>
        </div>
        <div class="card-body" id="weather-container">
          <div class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-xl font-semibold">Energy Analytics</h3>
        </div>
        <div class="card-body" id="analytics-container">
          <div class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-xl font-semibold">Security Status</h3>
        </div>
        <div class="card-body" id="security-container">
          <div class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append premium content to dashboard
  const premiumDiv = document.createElement("div");
  premiumDiv.innerHTML = premiumContent;
  dashboardSection.appendChild(premiumDiv);
}

// Load weather data
async function loadWeatherData() {
  try {
    const response = await fetch("/api/weather");
    const weather = await response.json();

    const weatherContainer = document.getElementById("weather-container");
    if (!weatherContainer) return;

    const current = weather.current;
    const forecast = weather.forecast;

    // Create weather display
    weatherContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-800 bg-opacity-50 rounded p-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-lg font-medium">Current Weather</h4>
              <div class="text-3xl font-bold mt-2">${current.temperature}°F</div>
              <div class="text-gray-400">${current.condition}</div>
            </div>
            <div class="text-5xl">
              ${getWeatherIcon(current.condition)}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <div>
              <div class="text-xs text-gray-400">Humidity</div>
              <div>${current.humidity}%</div>
            </div>
            <div>
              <div class="text-xs text-gray-400">Wind</div>
              <div>${current.windSpeed} mph ${current.windDirection}</div>
            </div>
            <div>
              <div class="text-xs text-gray-400">Feels Like</div>
              <div>${current.feelsLike}°F</div>
            </div>
            <div>
              <div class="text-xs text-gray-400">UV Index</div>
              <div>${current.uvIndex}</div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 bg-opacity-50 rounded p-4">
          <h4 class="text-lg font-medium mb-2">5-Day Forecast</h4>
          <div class="space-y-2">
            ${forecast
              .map(
                (day) => `
              <div class="flex justify-between items-center">
                <div class="w-20">${day.day}</div>
                <div class="flex-1 text-center">${getWeatherIcon(day.condition, "text-xl")}</div>
                <div class="w-20 text-right">${day.high}° / ${day.low}°</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading weather data:", error);
    const weatherContainer = document.getElementById("weather-container");
    if (weatherContainer) {
      weatherContainer.innerHTML =
        '<div class="p-4 text-red-400">Error loading weather data</div>';
    }
  }
}

// Load analytics data
async function loadAnalyticsData() {
  try {
    const response = await fetch("/api/analytics");
    const analytics = await response.json();

    const analyticsContainer = document.getElementById("analytics-container");
    if (!analyticsContainer) return;

    const energy = analytics.energyUsage;

    // Create analytics display
    analyticsContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-800 bg-opacity-50 rounded p-4">
          <h4 class="text-lg font-medium mb-2">Energy Consumption</h4>
          <div class="flex items-end space-x-2">
            <div class="text-3xl font-bold">${energy.today} kWh</div>
            <div class="text-sm text-green-400 mb-1">-${energy.savings}%</div>
          </div>
          <div class="text-xs text-gray-400 mt-1">vs. yesterday (${energy.yesterday} kWh)</div>
          
          <div class="mt-4">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <div>This Week</div>
              <div>${energy.thisWeek} kWh</div>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full" style="width: ${(energy.thisWeek / energy.lastWeek) * 100}%"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <div>Last Week</div>
              <div>${energy.lastWeek} kWh</div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 bg-opacity-50 rounded p-4">
          <h4 class="text-lg font-medium mb-2">Device Usage</h4>
          <div class="space-y-2">
            ${energy.devices
              .map(
                (device) => `
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <div>${device.name}</div>
                  <div>${device.usage} kWh</div>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: ${(device.usage / energy.today) * 100}%"></div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading analytics data:", error);
    const analyticsContainer = document.getElementById("analytics-container");
    if (analyticsContainer) {
      analyticsContainer.innerHTML =
        '<div class="p-4 text-red-400">Error loading analytics data</div>';
    }
  }
}

// Load security data
async function loadSecurityData() {
  try {
    const response = await fetch("/api/analytics");
    const analytics = await response.json();

    const securityContainer = document.getElementById("security-container");
    if (!securityContainer) return;

    const events = analytics.securityEvents;
    const deviceUsage = analytics.deviceUsage;

    // Create security display
    securityContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-800 bg-opacity-50 rounded p-4">
          <h4 class="text-lg font-medium mb-2">Recent Events</h4>
          <div class="space-y-2">
            ${events
              .map(
                (event) => `
              <div class="flex items-center">
                <div class="w-6 h-6 flex items-center justify-center mr-2">
                  ${getSecurityIcon(event.severity)}
                </div>
                <div class="flex-1">
                  <div class="text-sm">${event.event}</div>
                  <div class="text-xs text-gray-400">${event.time}</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        
        <div class="bg-gray-800 bg-opacity-50 rounded p-4">
          <h4 class="text-lg font-medium mb-2">Device Activity</h4>
          <div class="space-y-3">
            ${deviceUsage
              .map((device) => {
                const metric = device.hoursOn
                  ? `${device.hoursOn} hours on`
                  : device.timesUsed
                    ? `${device.timesUsed} times used`
                    : `${device.adjustments} adjustments`;
                return `
                <div>
                  <div class="flex justify-between">
                    <div>${device.name}</div>
                    <div class="text-sm text-gray-400">${metric}</div>
                  </div>
                  <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min(device.hoursOn * 10 || device.timesUsed * 12 || device.adjustments * 30, 100)}%"></div>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading security data:", error);
    const securityContainer = document.getElementById("security-container");
    if (securityContainer) {
      securityContainer.innerHTML =
        '<div class="p-4 text-red-400">Error loading security data</div>';
    }
  }
}

// Get weather icon based on condition
function getWeatherIcon(condition, className = "") {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
      <path d="M12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 20V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 12L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 12L20 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M19.7782 4.22183L17.5564 6.44365" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6.44365 17.5564L4.22183 19.7782" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M19.7782 19.7782L17.5564 17.5564" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6.44365 6.44365L4.22183 4.22183" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  } else if (lowerCondition.includes("partly cloudy")) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19C3.79086 19 2 17.2091 2 15C2 12.7909 3.79086 11 6 11C6.11333 11 6.22556 11.0047 6.33632 11.014C7.15579 8.67359 9.38235 7 12 7C14.6176 7 16.8442 8.67359 17.6637 11.014C17.7744 11.0047 17.8867 11 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 6L6 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 6L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  } else if (lowerCondition.includes("cloudy")) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19C3.79086 19 2 17.2091 2 15C2 12.7909 3.79086 11 6 11C6.11333 11 6.22556 11.0047 6.33632 11.014C7.15579 8.67359 9.38235 7 12 7C14.6176 7 16.8442 8.67359 17.6637 11.014C17.7744 11.0047 17.8867 11 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else if (
    lowerCondition.includes("rain") ||
    lowerCondition.includes("shower")
  ) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19C3.79086 19 2 17.2091 2 15C2 12.7909 3.79086 11 6 11C6.11333 11 6.22556 11.0047 6.33632 11.014C7.15579 8.67359 9.38235 7 12 7C14.6176 7 16.8442 8.67359 17.6637 11.014C17.7744 11.0047 17.8867 11 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 19L7 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 19L11 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16 19L15 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  } else {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19C3.79086 19 2 17.2091 2 15C2 12.7909 3.79086 11 6 11C6.11333 11 6.22556 11.0047 6.33632 11.014C7.15579 8.67359 9.38235 7 12 7C14.6176 7 16.8442 8.67359 17.6637 11.014C17.7744 11.0047 17.8867 11 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}

// Get security icon based on severity
function getSecurityIcon(severity) {
  if (severity === "warning") {
    return `<svg class="text-yellow-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 16.01L12.01 15.9989" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else if (severity === "error") {
    return `<svg class="text-red-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else {
    return `<svg class="text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 12L11 15L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}

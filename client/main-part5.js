// Load devices from API
async function loadDevices() {
  try {
    const response = await fetch("/api/devices");
    const devices = await response.json();

    // Update quick devices container
    const quickDevicesContainer = document.getElementById("quick-devices");
    if (!quickDevicesContainer) return;

    if (devices.length === 0) {
      quickDevicesContainer.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded">No devices found</div>';
      return;
    }

    quickDevicesContainer.innerHTML = devices
      .slice(0, 4)
      .map((device, index) => {
        // Add animation delay based on index
        const delay = index * 0.1;

        return `
        <div class="p-3 bg-gray-800 bg-opacity-50 rounded animate-in" style="--delay: ${delay}s">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">${device.name}</h3>
            <span class="px-2 py-1 text-xs rounded bg-green-600">${device.status}</span>
          </div>
          <div class="text-sm text-gray-400">${device.type}</div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading devices:", error);
    const quickDevicesContainer = document.getElementById("quick-devices");
    if (quickDevicesContainer) {
      quickDevicesContainer.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded">Error loading devices</div>';
    }
  }
}

// Load schedule from API
async function loadSchedule() {
  try {
    const response = await fetch("/api/schedule");
    const schedule = await response.json();

    updateScheduleUI(schedule.today, schedule.upcoming);
  } catch (error) {
    console.error("Error loading schedule:", error);

    const todayContainer = document.getElementById("today-events");
    if (todayContainer) {
      todayContainer.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded text-center">Error loading schedule</div>';
    }

    const scheduleToday = document.getElementById("schedule-today");
    if (scheduleToday) {
      scheduleToday.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded text-center">Error loading schedule</div>';
    }

    const scheduleUpcoming = document.getElementById("schedule-upcoming");
    if (scheduleUpcoming) {
      scheduleUpcoming.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded text-center">Error loading schedule</div>';
    }
  }
}

// Update schedule UI
function updateScheduleUI(today, upcoming) {
  // Update today's events on dashboard
  const todayContainer = document.getElementById("today-events");
  if (todayContainer) {
    if (!today || today.length === 0) {
      todayContainer.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded text-center">No events scheduled for today</div>';
    } else {
      todayContainer.innerHTML = today
        .map((event, index) => {
          const startTime = new Date(event.start).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return `
          <div class="p-3 bg-gray-800 bg-opacity-50 rounded animate-in" style="--delay: ${index * 0.1}s">
            <div class="flex justify-between items-center mb-1">
              <h4 class="font-medium">${event.title}</h4>
              <span class="text-xs text-blue-400">${startTime}</span>
            </div>
            <div class="text-sm text-gray-400">${event.location || ""}</div>
          </div>
        `;
        })
        .join("");
    }
  }

  // Update today's events on schedule page
  const scheduleToday = document.getElementById("schedule-today");
  if (scheduleToday) {
    if (!today || today.length === 0) {
      scheduleToday.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded text-center">No events scheduled for today</div>';
    } else {
      scheduleToday.innerHTML = today
        .map((event) => {
          const startTime = new Date(event.start).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const endTime = event.end
            ? new Date(event.end).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return `
          <div class="p-3 bg-gray-800 bg-opacity-50 rounded">
            <div class="flex justify-between items-center mb-1">
              <h4 class="font-medium">${event.title}</h4>
              <span class="text-xs text-blue-400">${startTime}${endTime ? ` - ${endTime}` : ""}</span>
            </div>
            <div class="text-sm text-gray-400 mb-1">${event.location || ""}</div>
            <div class="text-sm">${event.description || ""}</div>
          </div>
        `;
        })
        .join("");
    }
  }

  // Update upcoming events
  const scheduleUpcoming = document.getElementById("schedule-upcoming");
  if (scheduleUpcoming) {
    if (!upcoming || upcoming.length === 0) {
      scheduleUpcoming.innerHTML =
        '<div class="p-3 bg-gray-800 bg-opacity-50 rounded text-center">No upcoming events</div>';
    } else {
      scheduleUpcoming.innerHTML = upcoming
        .map((event) => {
          const startDate = new Date(event.start);
          const formattedDate = startDate.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const startTime = startDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return `
          <div class="p-3 bg-gray-800 bg-opacity-50 rounded">
            <div class="flex justify-between items-center mb-1">
              <h4 class="font-medium">${event.title}</h4>
              <span class="text-xs text-blue-400">${formattedDate}, ${startTime}</span>
            </div>
            <div class="text-sm text-gray-400 mb-1">${event.location || ""}</div>
            <div class="text-sm">${event.description || ""}</div>
          </div>
        `;
        })
        .join("");
    }
  }
}

// Main JavaScript file for JASON Personal Assistant
document.addEventListener("DOMContentLoaded", () => {
  // Initialize particles.js
  initParticles();

  // Initialize UI components
  initUI();

  // Connect to WebSocket server
  connectWebSocket();

  // Load initial data
  loadDevices();
  loadSchedule();
  loadPreferences();

  // Set up refresh interval
  setInterval(() => {
    loadDevices();
  }, 30000); // Refresh every 30 seconds

  // Update current time
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // Initialize voice recognition
  initVoiceRecognition();
});

// Initialize particles.js background
function initParticles() {
  if (window.particlesJS) {
    particlesJS("particles-js", {
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: "#3b82f6",
        },
        shape: {
          type: "circle",
          stroke: {
            width: 0,
            color: "#000000",
          },
        },
        opacity: {
          value: 0.3,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 0.1,
            sync: false,
          },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#3b82f6",
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: true,
            mode: "grab",
          },
          onclick: {
            enable: true,
            mode: "push",
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: {
              opacity: 0.5,
            },
          },
          push: {
            particles_nb: 4,
          },
        },
      },
      retina_detect: true,
    });
  }
} // Initialize UI components
function initUI() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Get section ID
      const sectionId = link.getAttribute("data-section");

      // Hide all sections
      document.querySelectorAll(".section").forEach((section) => {
        section.classList.add("hidden");
        section.classList.remove("active");
      });

      // Show selected section
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.remove("hidden");

        // Trigger animation
        setTimeout(() => {
          section.classList.add("active");
        }, 10);
      }

      // Update active link
      document.querySelectorAll(".nav-link").forEach((navLink) => {
        navLink.classList.remove("active");
      });

      link.classList.add("active");
    });
  });

  // Chat input
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-message");

  if (chatInput && sendButton) {
    // Send message on button click
    sendButton.addEventListener("click", () => {
      sendChatMessage(chatInput.value);
      chatInput.value = "";
    });

    // Send message on Enter key
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendChatMessage(chatInput.value);
        chatInput.value = "";
      }
    });
  }

  // Voice chat button
  document.getElementById("voice-chat-btn")?.addEventListener("click", () => {
    startVoiceRecognition();
  });

  // Action buttons
  document.getElementById("import-schedule")?.addEventListener("click", () => {
    document.getElementById("upload-schedule-btn").click();
  });

  document.getElementById("start-listening")?.addEventListener("click", () => {
    startVoiceRecognition();
  });

  document.getElementById("scan-devices")?.addEventListener("click", () => {
    loadDevices();
    showToast("Scanning for devices...", "info");
  });

  document
    .getElementById("update-preferences")
    ?.addEventListener("click", () => {
      // Navigate to settings section
      document.querySelector('.nav-link[data-section="settings"]').click();
    });

  // Schedule upload
  const uploadBtn = document.getElementById("upload-schedule-btn");
  const fileInput = document.getElementById("schedule-file");

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];

        // Create form data
        const formData = new FormData();
        formData.append("file", file);

        showToast(`Uploading ${file.name}...`, "info");

        try {
          const response = await fetch("/api/upload/schedule", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.success) {
            showToast(
              `Successfully processed ${data.events.length} events`,
              "success",
            );
            loadSchedule();
          } else {
            showToast(`Error: ${data.error}`, "error");
          }
        } catch (error) {
          console.error("Error uploading schedule:", error);
          showToast("Failed to upload schedule", "error");
        }
      }
    });
  }

  // Refresh schedule button
  document.getElementById("refresh-schedule")?.addEventListener("click", () => {
    loadSchedule();
    showToast("Refreshing schedule...", "info");
  });

  // Preferences form
  const preferencesForm = document.getElementById("preferences-form");

  if (preferencesForm) {
    preferencesForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(preferencesForm);
      const preferences = {
        name: formData.get("name"),
        wakeUpTime: formData.get("wakeUpTime"),
        sleepTime: formData.get("sleepTime"),
        favoriteMusic: formData.get("favoriteMusic"),
        weatherAlerts: formData.get("weatherAlerts") === "on",
        trafficAlerts: formData.get("trafficAlerts") === "on",
      };

      try {
        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        });

        const data = await response.json();

        showToast("Preferences saved successfully", "success");
      } catch (error) {
        console.error("Error saving preferences:", error);
        showToast("Failed to save preferences", "error");
      }
    });
  }

  // Voice command button
  const voiceBtn = document.getElementById("voice-command-btn");
  const voiceModal = document.getElementById("voice-modal");
  const voiceCancel = document.getElementById("voice-cancel");
  const voiceSubmit = document.getElementById("voice-submit");
  const voiceInput = document.getElementById("voice-input");

  if (voiceBtn && voiceModal) {
    voiceBtn.addEventListener("click", () => {
      voiceModal.classList.remove("hidden");
      voiceModal.classList.add("active");

      // Focus the input
      setTimeout(() => {
        voiceInput.focus();
      }, 300);

      // Start voice recognition
      startVoiceRecognition();
    });

    voiceCancel.addEventListener("click", () => {
      stopVoiceRecognition();
      voiceModal.classList.remove("active");
      setTimeout(() => {
        voiceModal.classList.add("hidden");
      }, 300);
    });

    voiceSubmit.addEventListener("click", () => {
      const command = voiceInput.value;
      if (command.trim()) {
        // Send command
        sendVoiceCommand(command);

        // Clear input and close modal
        voiceInput.value = "";
        voiceModal.classList.remove("active");
        setTimeout(() => {
          voiceModal.classList.add("hidden");
        }, 300);
      }
    });

    voiceInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const command = e.target.value;
        if (command.trim()) {
          // Send command
          sendVoiceCommand(command);

          // Clear input and close modal
          e.target.value = "";
          voiceModal.classList.remove("active");
          setTimeout(() => {
            voiceModal.classList.add("hidden");
          }, 300);
        }
      }
    });
  }
} // Initialize voice recognition
function initVoiceRecognition() {
  if (window.annyang) {
    // Add commands
    annyang.addCommands({
      hello: function () {
        sendVoiceCommand("hello");
      },
      "how are you": function () {
        sendVoiceCommand("how are you");
      },
      "what time is it": function () {
        sendVoiceCommand("what time is it");
      },
      "show my schedule": function () {
        sendVoiceCommand("show my schedule");
        document.querySelector('.nav-link[data-section="schedule"]').click();
      },
      "show my devices": function () {
        sendVoiceCommand("show my devices");
        document.querySelector('.nav-link[data-section="devices"]').click();
      },
      "open chat": function () {
        document.querySelector('.nav-link[data-section="chat"]').click();
      },
      "open settings": function () {
        document.querySelector('.nav-link[data-section="settings"]').click();
      },
    });

    // Set language
    annyang.setLanguage("en-US");

    // Add callbacks
    annyang.addCallback("result", function (phrases) {
      if (phrases.length > 0) {
        const voiceInput = document.getElementById("voice-input");
        if (voiceInput) {
          voiceInput.value = phrases[0];
        }
      }
    });

    annyang.addCallback("start", function () {
      const voiceStatus = document.getElementById("voice-status");
      if (voiceStatus) {
        voiceStatus.textContent = "Listening...";
        voiceStatus.classList.add("text-green-400");
      }

      const voiceModalStatus = document.getElementById("voice-modal-status");
      if (voiceModalStatus) {
        voiceModalStatus.textContent = "Listening...";
        voiceModalStatus.classList.add("text-green-400");
      }

      // Animate the voice wave
      const voiceWave = document.querySelector(".voice-wave");
      if (voiceWave) {
        voiceWave.style.animation = "voice-wave 1.5s infinite";
      }
    });

    annyang.addCallback("end", function () {
      const voiceStatus = document.getElementById("voice-status");
      if (voiceStatus) {
        voiceStatus.textContent = "Voice assistant ready";
        voiceStatus.classList.remove("text-green-400");
      }

      const voiceModalStatus = document.getElementById("voice-modal-status");
      if (voiceModalStatus) {
        voiceModalStatus.textContent = "Voice assistant ready";
        voiceModalStatus.classList.remove("text-green-400");
      }

      // Stop animating the voice wave
      const voiceWave = document.querySelector(".voice-wave");
      if (voiceWave) {
        voiceWave.style.animation = "none";
      }
    });

    annyang.addCallback("error", function (error) {
      console.error("Voice recognition error:", error);

      const voiceStatus = document.getElementById("voice-status");
      if (voiceStatus) {
        voiceStatus.textContent = "Error: " + error.error;
        voiceStatus.classList.add("text-red-400");
      }

      const voiceModalStatus = document.getElementById("voice-modal-status");
      if (voiceModalStatus) {
        voiceModalStatus.textContent = "Error: " + error.error;
        voiceModalStatus.classList.add("text-red-400");
      }
    });
  }
}

// Start voice recognition
function startVoiceRecognition() {
  if (window.annyang) {
    annyang.start({ autoRestart: false, continuous: false });

    // Stop after 10 seconds if no speech detected
    setTimeout(() => {
      if (annyang.isListening()) {
        annyang.abort();
      }
    }, 10000);
  } else {
    showToast("Voice recognition not supported in this browser", "error");
  }
}

// Stop voice recognition
function stopVoiceRecognition() {
  if (window.annyang && annyang.isListening()) {
    annyang.abort();
  }
}

// Send voice command
function sendVoiceCommand(command) {
  if (!command.trim()) return;

  // Add to chat
  addChatMessage(command, "user");

  // Send via WebSocket
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "voice", content: command }));
  } else {
    // Fallback to API
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: command }),
    })
      .then((response) => response.json())
      .then((data) => {
        addChatMessage(data.response, "assistant");

        // Speak response
        speakResponse(data.response);
      })
      .catch((error) => {
        console.error("Error sending voice command:", error);
        addChatMessage("Error processing your command", "assistant");
      });
  }
}

// Speak response using speech synthesis
function speakResponse(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Get voices
    const voices = window.speechSynthesis.getVoices();

    // Try to find a good voice
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Google") ||
        voice.name.includes("Samantha") ||
        voice.name.includes("Alex"),
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
} // WebSocket connection
let ws;

function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "chat":
          addChatMessage(data.content, "assistant");
          break;

        case "voice":
          addChatMessage(data.content, "assistant");
          speakResponse(data.content);
          break;

        case "schedule":
          updateScheduleUI(data.today, data.upcoming);
          break;

        case "preferences":
          updatePreferencesForm(data.preferences);
          break;

        case "error":
          showToast(data.content, "error");
          break;

        default:
          console.log("Unknown message type:", data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      console.log("Raw message:", event.data);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");

    // Try to reconnect after a delay
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

// Send chat message
function sendChatMessage(message) {
  if (!message.trim()) return;

  // Add to chat
  addChatMessage(message, "user");

  // Send via WebSocket
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "chat", content: message }));
  } else {
    // Fallback to API
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })
      .then((response) => response.json())
      .then((data) => {
        addChatMessage(data.response, "assistant");
      })
      .catch((error) => {
        console.error("Error sending chat message:", error);
        addChatMessage("Error processing your message", "assistant");
      });
  }
}

// Add message to chat
function addChatMessage(message, role) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  const messageElement = document.createElement("div");
  messageElement.className = `chat-message ${role}`;

  const bubbleElement = document.createElement("div");
  bubbleElement.className = "chat-bubble";
  bubbleElement.innerHTML = `<p>${message}</p>`;

  messageElement.appendChild(bubbleElement);
  chatMessages.appendChild(messageElement);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
} // Load devices from API
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
} // Load preferences from API
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

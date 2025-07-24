// WebSocket connection
let ws;

function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
    addConsoleMessage("WebSocket connected", "system");
    document.getElementById("ai-status").textContent = "Connected";
    document.getElementById("ai-status").className =
      "text-2xl font-bold text-green-400";
  };

  ws.onmessage = (event) => {
    addConsoleMessage(event.data, "system");
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
    addConsoleMessage("WebSocket disconnected", "system");
    document.getElementById("ai-status").textContent = "Disconnected";
    document.getElementById("ai-status").className =
      "text-2xl font-bold text-red-400";

    // Try to reconnect after a delay
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    document.getElementById("ai-status").textContent = "Error";
    document.getElementById("ai-status").className =
      "text-2xl font-bold text-red-400";
  };
}

// Send command via WebSocket
function sendCommand(command) {
  if (!command.trim()) return;

  addConsoleMessage(command, "user");

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(command);
  } else {
    // Fallback to API if WebSocket is not available
    fetch("/api/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    })
      .then((response) => response.json())
      .then((data) => {
        addConsoleMessage(data.response, "system");
      })
      .catch((error) => {
        console.error("Error sending command:", error);
        addConsoleMessage("Error sending command", "error");
      });
  }

  // Reload data after command
  setTimeout(() => {
    loadDevices();
    loadActivities();
  }, 1000);
}

// Add message to console
function addConsoleMessage(message, type) {
  const consoleContainer = document.getElementById("console-container");
  if (!consoleContainer) return;

  const messageElement = document.createElement("div");
  messageElement.className =
    type === "user"
      ? "text-blue-300"
      : type === "error"
        ? "text-red-400"
        : "text-green-400";

  const timestamp = new Date().toLocaleTimeString();
  messageElement.innerHTML = `
    <span class="text-xs text-gray-400">[${timestamp}]</span>
    ${type === "user" ? '<span class="text-xs text-blue-400">YOU:</span> ' : ""}
    ${message}
  `;

  consoleContainer.appendChild(messageElement);
  consoleContainer.scrollTop = consoleContainer.scrollHeight;

  // Also update console messages in database
  fetch("/api/console-messages", {
    method: "GET",
  }).catch((error) => {
    console.error("Error refreshing console messages:", error);
  });
}

// Show toast notification
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="flex items-center">
      ${
        type === "success"
          ? `
        <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `
          : `
        <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      `
      }
      ${message}
    </div>
  `;

  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleTimeString();
}

// Format time
function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Combine all the JavaScript files
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");

  if (!root) {
    console.error("Root element not found");
    return;
  }

  // Simple app rendering
  renderApp(root);

  // Connect to WebSocket server
  connectWebSocket();

  // Load initial data
  loadDevices();
  loadActivities();
  loadConsoleMessages();

  // Set up refresh interval
  setInterval(() => {
    loadDevices();
    loadActivities();
  }, 10000); // Refresh every 10 seconds
});

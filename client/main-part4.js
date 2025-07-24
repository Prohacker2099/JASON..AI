// WebSocket connection
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
}

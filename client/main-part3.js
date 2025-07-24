// Initialize voice recognition
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
}

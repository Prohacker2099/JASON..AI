// Initialize UI components
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
}

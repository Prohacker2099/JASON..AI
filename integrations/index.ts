/**
 * Voice Assistant Integration Index
 *
 * This module initializes and exports all voice assistant integration methods
 * that allow JASON to work with voice assistants without requiring login credentials.
 */

import * as hueEmulation from "./hue-emulation.js";
import * as matterBridge from "./matter-bridge.js";
import * as voiceAssistantToken from "./voice-assistant-token.js";
import googleAssistantBridge from "./google-assistant-bridge.js";

/**
 * Initialize all enabled voice assistant integrations
 */
async function initializeVoiceAssistants() {
  console.log("Initializing voice assistant integrations...");

  // Initialize Hue emulation if enabled
  if (process.env.ENABLE_HUE_EMULATION === "true") {
    try {
      await hueEmulation.initialize();
      console.log("Hue emulation initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Hue emulation:", error);
    }
  }

  // Initialize Matter bridge if enabled
  if (process.env.ENABLE_MATTER_BRIDGE === "true") {
    try {
      await matterBridge.initialize();
      console.log("Matter bridge initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Matter bridge:", error);
    }
  }

  // Initialize token-based integration
  try {
    voiceAssistantToken.initialize();
    console.log("Token-based integration initialized successfully");
  } catch (error) {
    console.error("Failed to initialize token-based integration:", error);
  }

  // Initialize Google Assistant bridge if enabled
  if (process.env.ENABLE_GOOGLE_BRIDGE === "true") {
    try {
      await googleAssistantBridge.initialize();
      console.log("Google Assistant bridge initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Google Assistant bridge:", error);
    }
  }

  console.log("Voice assistant integrations initialization complete");
}

export {
  initializeVoiceAssistants,
  hueEmulation,
  matterBridge,
  voiceAssistantToken,
  googleAssistantBridge,
};

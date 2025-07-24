/**
 * JASON Google Action - Secure Cloud Proxy
 *
 * This is the minimal, secure cloud component for Google Assistant integration.
 * It acts as a privacy-first proxy between Google's cloud and your local JASON instance.
 *
 * Features:
 * - No device data stored in Google's cloud
 * - Encrypted communication with local JASON
 * - Privacy-first approach
 * - Seamless Google Assistant integration
 */

const { conversation } = require("@assistant/conversation");
const WebSocket = require("ws");
const crypto = require("crypto");

// Environment configuration
const JASON_SECURE_ENDPOINT = process.env.JASON_SECURE_ENDPOINT;
const JASON_ENCRYPTION_KEY = process.env.JASON_ENCRYPTION_KEY;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;

class JasonGoogleAction {
  constructor() {
    this.app = conversation({
      debug: process.env.NODE_ENV === "development",
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // Welcome intent
    this.app.handle("welcome", (conv) => {
      conv.add(
        "Hello! I'm JASON, your smart home assistant. How can I help you today?",
      );
    });

    // Device control intent
    this.app.handle("device_control", async (conv) => {
      const command = this.extractDeviceCommand(conv);
      const userId = this.anonymizeUserId(
        conv.user.params.userId || "anonymous",
      );

      try {
        const response = await this.forwardToJason(command, userId);
        conv.add(response);
      } catch (error) {
        console.error("Error forwarding to JASON:", error);
        conv.add(
          "I'm having trouble connecting to your home system right now. Please try again later.",
        );
      }
    });

    // Home status intent
    this.app.handle("home_status", async (conv) => {
      const userId = this.anonymizeUserId(
        conv.user.params.userId || "anonymous",
      );

      try {
        const response = await this.forwardToJason(
          "what is the status of my home",
          userId,
        );
        conv.add(response);
      } catch (error) {
        console.error("Error getting home status:", error);
        conv.add(
          "I'm unable to check your home status right now. Please try again later.",
        );
      }
    });

    // Security check intent
    this.app.handle("security_check", async (conv) => {
      const userId = this.anonymizeUserId(
        conv.user.params.userId || "anonymous",
      );

      try {
        const response = await this.forwardToJason("check security", userId);
        conv.add(response);
      } catch (error) {
        console.error("Error checking security:", error);
        conv.add(
          "I'm unable to check your security status right now. Please try again later.",
        );
      }
    });

    // General query intent (routes to external AI)
    this.app.handle("general_query", async (conv) => {
      const query = conv.intent.params.query?.resolved || conv.intent.query;
      const userId = this.anonymizeUserId(
        conv.user.params.userId || "anonymous",
      );

      try {
        const response = await this.forwardToJason(query, userId);
        conv.add(response);
      } catch (error) {
        console.error("Error processing query:", error);
        conv.add(
          "I'm sorry, I couldn't process that request right now. Please try again later.",
        );
      }
    });

    // Fallback intent
    this.app.handle("fallback", (conv) => {
      conv.add(
        "I'm not sure how to help with that. You can ask me to control devices, check your home status, or ask general questions.",
      );
    });
  }

  extractDeviceCommand(conv) {
    const params = conv.intent.params;

    let command = "";

    // Extract action
    if (params.action?.resolved) {
      command += params.action.resolved;
    }

    // Extract device
    if (params.device?.resolved) {
      command += ` ${params.device.resolved}`;
    }

    // Extract room
    if (params.room?.resolved) {
      command += ` in the ${params.room.resolved}`;
    }

    // Extract value (for dimming, temperature, etc.)
    if (params.value?.resolved) {
      command += ` to ${params.value.resolved}`;
    }

    // If no structured command, use the raw query
    if (!command.trim()) {
      command = conv.intent.query || "help";
    }

    return command.trim();
  }

  async forwardToJason(command, userId) {
    return new Promise((resolve, reject) => {
      try {
        // Create secure WebSocket connection to local JASON
        const ws = new WebSocket(JASON_SECURE_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${JASON_ENCRYPTION_KEY}`,
          },
          rejectUnauthorized: true,
        });

        // Prepare message
        const message = {
          type: "google_action_command",
          command: command,
          user_id: userId,
          timestamp: new Date().toISOString(),
          source: "google_action",
        };

        // Set up event handlers
        ws.on("open", () => {
          ws.send(JSON.stringify(message));
        });

        ws.on("message", (data) => {
          try {
            const response = JSON.parse(data.toString());
            resolve(response.response || "I processed your request.");
          } catch (error) {
            reject(new Error("Invalid response from JASON"));
          }
          ws.close();
        });

        ws.on("error", (error) => {
          reject(error);
        });

        ws.on("close", (code, reason) => {
          if (code !== 1000) {
            reject(
              new Error(`Connection closed unexpectedly: ${code} ${reason}`),
            );
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
            reject(new Error("Request timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  anonymizeUserId(userId) {
    // Hash the user ID for privacy
    return crypto
      .createHash("sha256")
      .update(userId)
      .digest("hex")
      .substring(0, 16);
  }

  getApp() {
    return this.app;
  }
}

// Create and export the Google Action
const jasonAction = new JasonGoogleAction();
exports.fulfillment = jasonAction.getApp();

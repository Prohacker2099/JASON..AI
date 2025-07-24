/**
 * JASON - The Omnipotent AI Architect
 * Voice Assistant Module
 *
 * This module provides voice recognition and natural language processing
 * capabilities for the JASON smart home system.
 */

class JasonVoiceAssistant {
  constructor(options = {}) {
    // Configuration
    this.options = {
      language: "en-US",
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      ...options,
    };

    // State
    this.isListening = false;
    this.recognition = null;
    this.transcript = "";
    this.confidence = 0;
    this.processingRequest = false;

    // Callbacks
    this.onStart = options.onStart || (() => {});
    this.onResult = options.onResult || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onError = options.onError || (() => {});
    this.onProcessing = options.onProcessing || (() => {});
    this.onResponse = options.onResponse || (() => {});

    // Initialize
    this.initSpeechRecognition();
    this.initTextToSpeech();
  }

  /**
   * Initialize the speech recognition system
   */
  initSpeechRecognition() {
    // Check browser support
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    // Create recognition object
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure
    this.recognition.lang = this.options.language;
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.maxAlternatives = this.options.maxAlternatives;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      this.transcript = event.results[last][0].transcript;
      this.confidence = event.results[last][0].confidence;

      this.onResult({
        transcript: this.transcript,
        confidence: this.confidence,
        isFinal: event.results[last].isFinal,
      });

      if (event.results[last].isFinal) {
        this.processCommand(this.transcript);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.onError(event);
    };
  }

  /**
   * Initialize text-to-speech capabilities
   */
  initTextToSpeech() {
    if (!("speechSynthesis" in window)) {
      console.error("Text-to-speech not supported in this browser");
      return;
    }

    this.synthesis = window.speechSynthesis;
    this.voices = [];

    // Load voices
    this.loadVoices();

    // Some browsers need a delay to load voices
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  /**
   * Load available voices for speech synthesis
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();

    // Try to find a good default voice
    this.defaultVoice = this.voices.find(
      (voice) =>
        voice.name.includes("Google") &&
        voice.name.includes("US") &&
        voice.name.includes("Female"),
    );

    if (!this.defaultVoice) {
      this.defaultVoice = this.voices.find(
        (voice) =>
          voice.lang.includes("en-US") && voice.name.includes("Female"),
      );
    }

    if (!this.defaultVoice && this.voices.length > 0) {
      this.defaultVoice = this.voices[0];
    }
  }

  /**
   * Start listening for voice commands
   */
  startListening() {
    if (this.isListening) return;

    if (!this.recognition) {
      this.initSpeechRecognition();
      if (!this.recognition) {
        this.onError({ error: "Speech recognition not supported" });
        return;
      }
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      this.onError({ error: "Failed to start speech recognition" });
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (!this.isListening || !this.recognition) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  }

  /**
   * Process a voice command
   * @param {string} command - The voice command to process
   */
  processCommand(command) {
    if (this.processingRequest) return;

    this.processingRequest = true;
    this.onProcessing({ command });

    // Analyze the command
    const analysis = this.analyzeCommand(command);

    // Simulate AI processing (would connect to a real NLP service in production)
    setTimeout(() => {
      const response = this.generateResponse(analysis);

      this.onResponse({
        command,
        response,
        analysis,
      });

      // Speak the response if enabled
      if (this.options.speakResponse !== false) {
        this.speak(response);
      }

      this.processingRequest = false;
    }, 1000);
  }

  /**
   * Analyze a command to determine intent and entities
   * @param {string} command - The command to analyze
   * @returns {Object} Analysis results
   */
  analyzeCommand(command) {
    // Normalize command
    const normalizedCommand = command.toLowerCase().trim();

    // Basic intent detection
    let intent = "unknown";
    let confidence = 0.5;
    let entities = {};

    // Device control intents
    if (normalizedCommand.match(/turn (on|off)/i)) {
      intent = "device_control";
      confidence = 0.9;

      // Extract device
      const deviceMatch = normalizedCommand.match(
        /turn (on|off) (the )?([\w\s]+)$/i,
      );
      if (deviceMatch) {
        entities.action = deviceMatch[1].toLowerCase();
        entities.device = deviceMatch[3].trim();
      }
    }
    // Set brightness/temperature
    else if (normalizedCommand.match(/set (the )?([\w\s]+) (to|at) (\d+)/i)) {
      intent = "device_control";
      confidence = 0.85;

      const match = normalizedCommand.match(
        /set (the )?([\w\s]+) (to|at) (\d+)/i,
      );
      if (match) {
        entities.device = match[2].trim();
        entities.value = parseInt(match[4]);

        if (entities.device.includes("brightness")) {
          entities.property = "brightness";
          entities.device = entities.device.replace("brightness", "").trim();
        } else if (entities.device.includes("temperature")) {
          entities.property = "temperature";
          entities.device = entities.device.replace("temperature", "").trim();
        }
      }
    }
    // Scene activation
    else if (
      normalizedCommand.match(/activate (the )?([\w\s]+) scene/i) ||
      normalizedCommand.match(/turn on (the )?([\w\s]+) scene/i)
    ) {
      intent = "scene_activation";
      confidence = 0.9;

      const match = normalizedCommand.match(
        /(?:activate|turn on) (the )?([\w\s]+) scene/i,
      );
      if (match) {
        entities.scene = match[2].trim();
      }
    }
    // Weather queries
    else if (normalizedCommand.includes("weather")) {
      intent = "weather_query";
      confidence = 0.8;

      if (normalizedCommand.match(/weather (in|for) ([\w\s]+)/i)) {
        const match = normalizedCommand.match(/weather (in|for) ([\w\s]+)/i);
        entities.location = match[2].trim();
      } else {
        entities.location = "current location";
      }
    }
    // Time queries
    else if (normalizedCommand.match(/what (time|day|date)/i)) {
      intent = "time_query";
      confidence = 0.9;

      if (normalizedCommand.includes("time")) {
        entities.timeType = "time";
      } else if (normalizedCommand.includes("day")) {
        entities.timeType = "day";
      } else if (normalizedCommand.includes("date")) {
        entities.timeType = "date";
      }
    }
    // General questions
    else if (
      normalizedCommand.match(
        /^(what|who|how|when|where|why|can you|could you)/i,
      )
    ) {
      intent = "general_question";
      confidence = 0.7;
      entities.question = normalizedCommand;
    }

    return {
      intent,
      confidence,
      entities,
      originalCommand: command,
      normalizedCommand,
    };
  }

  /**
   * Generate a response based on command analysis
   * @param {Object} analysis - The command analysis
   * @returns {string} The response
   */
  generateResponse(analysis) {
    const { intent, entities } = analysis;

    switch (intent) {
      case "device_control":
        if (entities.action) {
          return `I'll ${entities.action} the ${entities.device} for you.`;
        } else if (entities.property) {
          return `Setting the ${entities.device} ${entities.property} to ${entities.value}.`;
        }
        return `I'll control the ${entities.device} as requested.`;

      case "scene_activation":
        return `Activating the ${entities.scene} scene.`;

      case "weather_query":
        // In a real implementation, this would fetch actual weather data
        const weatherConditions = [
          "sunny",
          "partly cloudy",
          "cloudy",
          "rainy",
          "stormy",
          "snowy",
        ];
        const randomCondition =
          weatherConditions[
            Math.floor(Math.random() * weatherConditions.length)
          ];
        const randomTemp = Math.floor(Math.random() * 30) + 50; // 50-80°F

        return `The weather in ${entities.location} is currently ${randomCondition} with a temperature of ${randomTemp}°F.`;

      case "time_query":
        const now = new Date();

        if (entities.timeType === "time") {
          return `The current time is ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
        } else if (entities.timeType === "day") {
          return `Today is ${now.toLocaleDateString([], { weekday: "long" })}.`;
        } else if (entities.timeType === "date") {
          return `Today is ${now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`;
        }
        return `The current time is ${now.toLocaleTimeString()}.`;

      case "general_question":
        // In a real implementation, this would use a knowledge base or API
        return `I'm sorry, I don't have enough information to answer that question yet. In a full implementation, I would search the web or use a knowledge base to find an answer about "${entities.question}".`;

      default:
        return `I'm not sure how to help with that. Could you try rephrasing your request?`;
    }
  }

  /**
   * Speak a response using text-to-speech
   * @param {string} text - The text to speak
   * @param {Object} options - Speech options
   */
  speak(text, options = {}) {
    if (!this.synthesis) return;

    // Cancel any current speech
    this.synthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    utterance.voice = options.voice || this.defaultVoice;
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Speak
    this.synthesis.speak(utterance);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = JasonVoiceAssistant;
} else {
  window.JasonVoiceAssistant = JasonVoiceAssistant;
}

"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var JasonVoiceAssistant = function () {
  var _a = (0, react_1.useState)(false),
    isListening = _a[0],
    setIsListening = _a[1];
  var _b = (0, react_1.useState)(false),
    isProcessing = _b[0],
    setIsProcessing = _b[1];
  var _c = (0, react_1.useState)(false),
    isSpeaking = _c[0],
    setIsSpeaking = _c[1];
  var _d = (0, react_1.useState)(true),
    isOnline = _d[0],
    setIsOnline = _d[1];
  var _e = (0, react_1.useState)(""),
    currentCommand = _e[0],
    setCurrentCommand = _e[1];
  var _f = (0, react_1.useState)([]),
    commandHistory = _f[0],
    setCommandHistory = _f[1];
  var _g = (0, react_1.useState)(0),
    voiceLevel = _g[0],
    setVoiceLevel = _g[1];
  var _h = (0, react_1.useState)({
      name: "JASON",
      voice: "friendly",
      responseStyle: "conversational",
      proactivity: "medium",
      learningEnabled: true,
    }),
    aiPersonality = _h[0],
    setAiPersonality = _h[1];
  var _j = (0, react_1.useState)(false),
    showSettings = _j[0],
    setShowSettings = _j[1];
  var _k = (0, react_1.useState)(true),
    localProcessingEnabled = _k[0],
    setLocalProcessingEnabled = _k[1];
  var _l = (0, react_1.useState)(true),
    wakeWordEnabled = _l[0],
    setWakeWordEnabled = _l[1];
  var _m = (0, react_1.useState)(false),
    continuousListening = _m[0],
    setContinuousListening = _m[1];
  var recognitionRef = (0, react_1.useRef)(null);
  var synthRef = (0, react_1.useRef)(null);
  var audioContextRef = (0, react_1.useRef)(null);
  var analyserRef = (0, react_1.useRef)(null);
  var microphoneRef = (0, react_1.useRef)(null);
  // Voice capabilities
  var voiceCapabilities = [
    {
      category: "Smart Home Control",
      commands: ["lights", "temperature", "security", "locks", "blinds"],
      icon: <lucide_react_1.Home className="w-5 h-5" />,
      description: "Control all your smart home devices with natural language",
      examples: [
        "Turn on the living room lights",
        "Set temperature to 72 degrees",
        "Lock all doors",
        "Dim bedroom lights to 30%",
      ],
    },
    {
      category: "Entertainment",
      commands: ["music", "tv", "volume", "play", "pause"],
      icon: <lucide_react_1.Music className="w-5 h-5" />,
      description: "Control your entertainment systems and media",
      examples: [
        "Play relaxing music",
        "Turn on Netflix",
        "Volume up",
        "Pause the movie",
      ],
    },
    {
      category: "Information & AI",
      commands: ["weather", "news", "schedule", "reminders", "questions"],
      icon: <lucide_react_1.Brain className="w-5 h-5" />,
      description: "Get information and AI-powered insights",
      examples: [
        "What's the weather today?",
        "What's on my schedule?",
        "Remind me to call mom",
        "How can I save energy?",
      ],
    },
    {
      category: "Device Integration",
      commands: ["phone", "computer", "camera", "notifications"],
      icon: <lucide_react_1.Phone className="w-5 h-5" />,
      description: "Integrate with your personal devices",
      examples: [
        "Send a text to John",
        "Take a photo",
        "Show my notifications",
        "Start video call",
      ],
    },
    {
      category: "Automation & Scenes",
      commands: ["scenes", "routines", "automation", "schedules"],
      icon: <lucide_react_1.Zap className="w-5 h-5" />,
      description: "Create and manage smart home automations",
      examples: [
        "Activate movie night scene",
        "Create morning routine",
        "Schedule lights for sunset",
        "Run bedtime automation",
      ],
    },
  ];
  // Initialize speech recognition and synthesis
  (0, react_1.useEffect)(
    function () {
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        var SpeechRecognition =
          window.webkitSpeechRecognition || window.SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = continuousListening;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.onstart = function () {
          setIsListening(true);
          console.log("Voice recognition started");
        };
        recognitionRef.current.onresult = function (event) {
          var interimTranscript = "";
          var finalTranscript = "";
          for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          setCurrentCommand(finalTranscript || interimTranscript);
          if (finalTranscript) {
            processVoiceCommand(
              finalTranscript,
              event.results[event.resultIndex][0].confidence,
            );
          }
        };
        recognitionRef.current.onerror = function (event) {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };
        recognitionRef.current.onend = function () {
          setIsListening(false);
          if (continuousListening && !isProcessing) {
            // Restart listening if continuous mode is enabled
            setTimeout(function () {
              return startListening();
            }, 1000);
          }
        };
      }
      // Initialize speech synthesis
      if ("speechSynthesis" in window) {
        synthRef.current = window.speechSynthesis;
      }
      // Initialize audio context for voice level monitoring
      initializeAudioContext();
      return function () {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    },
    [continuousListening, isProcessing],
  );
  var initializeAudioContext = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var stream, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            audioContextRef.current = new (window.AudioContext ||
              window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            return [
              4 /*yield*/,
              navigator.mediaDevices.getUserMedia({ audio: true }),
            ];
          case 1:
            stream = _a.sent();
            microphoneRef.current =
              audioContextRef.current.createMediaStreamSource(stream);
            microphoneRef.current.connect(analyserRef.current);
            // Start monitoring voice level
            monitorVoiceLevel();
            return [3 /*break*/, 3];
          case 2:
            error_1 = _a.sent();
            console.error("Error initializing audio context:", error_1);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  var monitorVoiceLevel = function () {
    if (!analyserRef.current) return;
    var dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    var updateLevel = function () {
      analyserRef.current.getByteFrequencyData(dataArray);
      var average =
        dataArray.reduce(function (sum, value) {
          return sum + value;
        }, 0) / dataArray.length;
      setVoiceLevel(average / 255);
      if (isListening) {
        requestAnimationFrame(updateLevel);
      }
    };
    updateLevel();
  };
  var startListening = (0, react_1.useCallback)(
    function () {
      if (recognitionRef.current && !isListening) {
        setCurrentCommand("");
        recognitionRef.current.start();
        monitorVoiceLevel();
      }
    },
    [isListening],
  );
  var stopListening = (0, react_1.useCallback)(
    function () {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    },
    [isListening],
  );
  var processVoiceCommand = function (command, confidence) {
    return __awaiter(void 0, void 0, void 0, function () {
      var startTime,
        intent,
        entities,
        response,
        executionTime,
        voiceCommand_1,
        error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setIsProcessing(true);
            startTime = Date.now();
            _a.label = 1;
          case 1:
            _a.trys.push([1, 7, 9, 10]);
            return [4 /*yield*/, analyzeIntent(command)];
          case 2:
            intent = _a.sent();
            return [4 /*yield*/, extractEntities(command)];
          case 3:
            entities = _a.sent();
            return [4 /*yield*/, executeCommand(command, intent, entities)];
          case 4:
            response = _a.sent();
            executionTime = Date.now() - startTime;
            voiceCommand_1 = {
              id: Date.now().toString(),
              text: command,
              timestamp: new Date(),
              confidence: confidence,
              intent: intent,
              entities: entities,
              response: response.text,
              responseType: response.type,
              executionTime: executionTime,
              localProcessed: localProcessingEnabled,
            };
            setCommandHistory(function (prev) {
              return __spreadArray([voiceCommand_1], prev.slice(0, 9), true);
            });
            if (!(response.text && !response.silent)) return [3 /*break*/, 6];
            return [4 /*yield*/, speakResponse(response.text)];
          case 5:
            _a.sent();
            _a.label = 6;
          case 6:
            return [3 /*break*/, 10];
          case 7:
            error_2 = _a.sent();
            console.error("Error processing voice command:", error_2);
            return [
              4 /*yield*/,
              speakResponse(
                "Sorry, I encountered an error processing that command.",
              ),
            ];
          case 8:
            _a.sent();
            return [3 /*break*/, 10];
          case 9:
            setIsProcessing(false);
            setCurrentCommand("");
            return [7 /*endfinally*/];
          case 10:
            return [2 /*return*/];
        }
      });
    });
  };
  var analyzeIntent = function (command) {
    return __awaiter(void 0, void 0, void 0, function () {
      var lowerCommand;
      return __generator(this, function (_a) {
        lowerCommand = command.toLowerCase();
        if (lowerCommand.includes("light") || lowerCommand.includes("lamp"))
          return [2 /*return*/, "control_lights"];
        if (
          lowerCommand.includes("temperature") ||
          lowerCommand.includes("thermostat")
        )
          return [2 /*return*/, "control_climate"];
        if (
          lowerCommand.includes("music") ||
          lowerCommand.includes("play") ||
          lowerCommand.includes("song")
        )
          return [2 /*return*/, "control_media"];
        if (lowerCommand.includes("lock") || lowerCommand.includes("unlock"))
          return [2 /*return*/, "control_security"];
        if (lowerCommand.includes("weather"))
          return [2 /*return*/, "get_weather"];
        if (lowerCommand.includes("time") || lowerCommand.includes("schedule"))
          return [2 /*return*/, "get_time_info"];
        if (lowerCommand.includes("scene") || lowerCommand.includes("routine"))
          return [2 /*return*/, "activate_scene"];
        if (lowerCommand.includes("data") || lowerCommand.includes("earning"))
          return [2 /*return*/, "data_dividend"];
        return [2 /*return*/, "general_query"];
      });
    });
  };
  var extractEntities = function (command) {
    return __awaiter(void 0, void 0, void 0, function () {
      var entities,
        lowerCommand,
        rooms,
        _i,
        rooms_1,
        room,
        numberMatch,
        colors,
        _a,
        colors_1,
        color;
      return __generator(this, function (_b) {
        entities = {};
        lowerCommand = command.toLowerCase();
        rooms = [
          "living room",
          "bedroom",
          "kitchen",
          "bathroom",
          "office",
          "dining room",
        ];
        for (_i = 0, rooms_1 = rooms; _i < rooms_1.length; _i++) {
          room = rooms_1[_i];
          if (lowerCommand.includes(room)) {
            entities.room = room;
            break;
          }
        }
        numberMatch = lowerCommand.match(/(\d+)(%|percent|degrees?)/);
        if (numberMatch) {
          entities.value = parseInt(numberMatch[1]);
          entities.unit = numberMatch[2];
        }
        colors = [
          "red",
          "blue",
          "green",
          "yellow",
          "purple",
          "orange",
          "white",
          "warm",
          "cool",
        ];
        for (_a = 0, colors_1 = colors; _a < colors_1.length; _a++) {
          color = colors_1[_a];
          if (lowerCommand.includes(color)) {
            entities.color = color;
            break;
          }
        }
        return [2 /*return*/, entities];
      });
    });
  };
  var executeCommand = function (command, intent, entities) {
    return __awaiter(void 0, void 0, void 0, function () {
      var now;
      return __generator(this, function (_a) {
        // Simulate command execution based on intent
        switch (intent) {
          case "control_lights":
            if (command.toLowerCase().includes("on")) {
              return [
                2 /*return*/,
                {
                  text: "Turning on the ".concat(
                    entities.room || "main",
                    " lights",
                  ),
                  type: "confirmation",
                },
              ];
            } else if (command.toLowerCase().includes("off")) {
              return [
                2 /*return*/,
                {
                  text: "Turning off the ".concat(
                    entities.room || "main",
                    " lights",
                  ),
                  type: "confirmation",
                },
              ];
            } else if (entities.value) {
              return [
                2 /*return*/,
                {
                  text: "Setting "
                    .concat(entities.room || "main", " lights to ")
                    .concat(entities.value, "%"),
                  type: "confirmation",
                },
              ];
            }
            return [
              2 /*return*/,
              {
                text: "What would you like me to do with the lights?",
                type: "text",
              },
            ];
          case "control_climate":
            if (entities.value) {
              return [
                2 /*return*/,
                {
                  text: "Setting temperature to ".concat(
                    entities.value,
                    " degrees",
                  ),
                  type: "confirmation",
                },
              ];
            }
            return [
              2 /*return*/,
              {
                text: "The current temperature is 72 degrees. What would you like to set it to?",
                type: "text",
              },
            ];
          case "control_media":
            if (command.toLowerCase().includes("play")) {
              return [
                2 /*return*/,
                {
                  text: "Playing your favorite playlist",
                  type: "confirmation",
                },
              ];
            } else if (command.toLowerCase().includes("pause")) {
              return [
                2 /*return*/,
                { text: "Pausing music", type: "confirmation" },
              ];
            }
            return [
              2 /*return*/,
              { text: "What would you like me to play?", type: "text" },
            ];
          case "control_security":
            if (command.toLowerCase().includes("lock")) {
              return [
                2 /*return*/,
                {
                  text: "Locking all doors and activating security system",
                  type: "confirmation",
                },
              ];
            } else if (command.toLowerCase().includes("unlock")) {
              return [
                2 /*return*/,
                { text: "Unlocking front door", type: "confirmation" },
              ];
            }
            return [
              2 /*return*/,
              {
                text: "Security system is armed. All doors are locked.",
                type: "text",
              },
            ];
          case "get_weather":
            return [
              2 /*return*/,
              {
                text: "Today is sunny with a high of 75 degrees and a low of 58 degrees. Perfect weather for outdoor activities!",
                type: "text",
              },
            ];
          case "get_time_info":
            now = new Date();
            return [
              2 /*return*/,
              {
                text: "It's currently ".concat(
                  now.toLocaleTimeString(),
                  ". You have a meeting at 3 PM today.",
                ),
                type: "text",
              },
            ];
          case "activate_scene":
            return [
              2 /*return*/,
              {
                text: "Activating movie night scene. Dimming lights, closing blinds, and starting the projector.",
                type: "confirmation",
              },
            ];
          case "data_dividend":
            return [
              2 /*return*/,
              {
                text: "You've earned $12.47 today from ethical data sharing. Would you like to see available opportunities?",
                type: "text",
              },
            ];
          default:
            // For complex queries, simulate routing to external AI
            if (localProcessingEnabled) {
              return [
                2 /*return*/,
                {
                  text: "I'm processing that with my local AI. Let me think about it...",
                  type: "text",
                },
              ];
            } else {
              return [
                2 /*return*/,
                {
                  text: "Let me check that for you using advanced AI processing...",
                  type: "text",
                },
              ];
            }
        }
        return [2 /*return*/];
      });
    });
  };
  var speakResponse = function (text) {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        if (!synthRef.current) return [2 /*return*/];
        return [
          2 /*return*/,
          new Promise(function (resolve) {
            setIsSpeaking(true);
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            // Set voice based on personality
            var voices = synthRef.current.getVoices();
            var preferredVoice = voices.find(function (voice) {
              return (
                voice.name.includes("Google") ||
                voice.name.includes("Microsoft")
              );
            });
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
            utterance.onend = function () {
              setIsSpeaking(false);
              resolve();
            };
            utterance.onerror = function () {
              setIsSpeaking(false);
              resolve();
            };
            synthRef.current.speak(utterance);
          }),
        ];
      });
    });
  };
  var toggleListening = function () {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  var getPersonalityGreeting = function () {
    var greetings = {
      friendly:
        "Hi there! I'm JASON, your friendly AI assistant. How can I help you today?",
      professional:
        "Good day. I am JASON, your AI assistant. How may I assist you?",
      casual: "Hey! JASON here. What's up?",
      enthusiastic:
        "Hello! I'm JASON and I'm excited to help you today! What can we do together?",
    };
    return greetings[aiPersonality.voice];
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Voice Assistant Orb */}
      <framer_motion_1.motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Voice Level Visualization */}
        <framer_motion_1.AnimatePresence>
          {isListening && (
            <framer_motion_1.motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: 1 + voiceLevel * 0.5,
                opacity: 0.3 + voiceLevel * 0.7,
              }}
              exit={{ scale: 1, opacity: 0 }}
              style={{
                background:
                  "radial-gradient(circle, rgba(59, 130, 246, ".concat(
                    0.3 + voiceLevel * 0.7,
                    ") 0%, transparent 70%)",
                  ),
              }}
            />
          )}
        </framer_motion_1.AnimatePresence>

        {/* Processing Animation */}
        <framer_motion_1.AnimatePresence>
          {isProcessing && (
            <framer_motion_1.motion.div
              className="absolute inset-0 rounded-full border-4 border-purple-500"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 1, 0],
                rotate: [0, 360],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </framer_motion_1.AnimatePresence>

        {/* Main Orb Button */}
        <framer_motion_1.motion.button
          onClick={toggleListening}
          className={"w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl transition-all duration-300 ".concat(
            isListening
              ? "bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/50"
              : isProcessing
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/50"
                : isSpeaking
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50"
                  : "bg-gradient-to-r from-blue-500 to-cyan-600 shadow-blue-500/50 hover:shadow-blue-500/70",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isListening
              ? "0 0 ".concat(20 + voiceLevel * 30, "px rgba(239, 68, 68, 0.5)")
              : "0 10px 30px rgba(59, 130, 246, 0.3)",
          }}
        >
          {isProcessing ? (
            <lucide_react_1.Brain className="w-8 h-8 animate-pulse" />
          ) : isSpeaking ? (
            <lucide_react_1.Volume2 className="w-8 h-8 animate-pulse" />
          ) : isListening ? (
            <framer_motion_1.motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <lucide_react_1.Mic className="w-8 h-8" />
            </framer_motion_1.motion.div>
          ) : (
            <span>J</span>
          )}
        </framer_motion_1.motion.button>

        {/* Status Indicators */}
        <div className="absolute -top-2 -right-2 flex space-x-1">
          {localProcessingEnabled && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <lucide_react_1.Shield className="w-2 h-2 text-white" />
            </div>
          )}
          {isOnline ? (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <lucide_react_1.Wifi className="w-2 h-2 text-white" />
            </div>
          ) : (
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <lucide_react_1.WifiOff className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Current Command Display */}
        <framer_motion_1.AnimatePresence>
          {currentCommand && (
            <framer_motion_1.motion.div
              className="absolute bottom-24 right-0 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg max-w-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <p className="text-sm">{currentCommand}</p>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>

        {/* Settings Button */}
        <framer_motion_1.motion.button
          onClick={function () {
            return setShowSettings(!showSettings);
          }}
          className="absolute -bottom-2 -left-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <lucide_react_1.Settings className="w-4 h-4 text-white" />
        </framer_motion_1.motion.button>
      </framer_motion_1.motion.div>

      {/* Settings Panel */}
      <framer_motion_1.AnimatePresence>
        {showSettings && (
          <framer_motion_1.motion.div
            className="absolute bottom-24 right-0 w-80 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <lucide_react_1.Brain className="w-5 h-5 mr-2" />
              JASON Settings
            </h3>

            <div className="space-y-4">
              {/* Local Processing Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Local Processing</p>
                  <p className="text-xs text-white/60">
                    Process commands locally for privacy
                  </p>
                </div>
                <button
                  onClick={function () {
                    return setLocalProcessingEnabled(!localProcessingEnabled);
                  }}
                  className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                    localProcessingEnabled ? "bg-green-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                      localProcessingEnabled
                        ? "translate-x-6"
                        : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Continuous Listening */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Continuous Listening</p>
                  <p className="text-xs text-white/60">
                    Always listen for commands
                  </p>
                </div>
                <button
                  onClick={function () {
                    return setContinuousListening(!continuousListening);
                  }}
                  className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                    continuousListening ? "bg-blue-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                      continuousListening ? "translate-x-6" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Wake Word */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Wake Word</p>
                  <p className="text-xs text-white/60">
                    Activate with "Hey JASON"
                  </p>
                </div>
                <button
                  onClick={function () {
                    return setWakeWordEnabled(!wakeWordEnabled);
                  }}
                  className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                    wakeWordEnabled ? "bg-purple-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                      wakeWordEnabled ? "translate-x-6" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Voice Personality */}
              <div>
                <p className="font-medium mb-2">Voice Personality</p>
                <select
                  value={aiPersonality.voice}
                  onChange={function (e) {
                    return setAiPersonality(function (prev) {
                      return __assign(__assign({}, prev), {
                        voice: e.target.value,
                      });
                    });
                  }}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>

              {/* Response Style */}
              <div>
                <p className="font-medium mb-2">Response Style</p>
                <select
                  value={aiPersonality.responseStyle}
                  onChange={function (e) {
                    return setAiPersonality(function (prev) {
                      return __assign(__assign({}, prev), {
                        responseStyle: e.target.value,
                      });
                    });
                  }}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="font-medium mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={function () {
                    return speakResponse(getPersonalityGreeting());
                  }}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm transition-colors"
                >
                  Test Voice
                </button>
                <button
                  onClick={function () {
                    return setCommandHistory([]);
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Command History */}
      <framer_motion_1.AnimatePresence>
        {commandHistory.length > 0 && !showSettings && (
          <framer_motion_1.motion.div
            className="absolute bottom-24 right-0 w-96 max-h-80 overflow-y-auto bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <lucide_react_1.MessageCircle className="w-5 h-5 mr-2" />
              Recent Commands
            </h3>
            <div className="space-y-3">
              {commandHistory.slice(0, 5).map(function (cmd) {
                return (
                  <div
                    key={cmd.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{cmd.text}</p>
                      <div className="flex items-center space-x-1">
                        {cmd.localProcessed && (
                          <lucide_react_1.Shield className="w-3 h-3 text-green-400" />
                        )}
                        <span className="text-xs text-white/60">
                          {cmd.confidence.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/70 mb-1">{cmd.response}</p>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{cmd.intent}</span>
                      <span>{cmd.executionTime}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Voice Capabilities Help */}
      <framer_motion_1.AnimatePresence>
        {isListening && !currentCommand && (
          <framer_motion_1.motion.div
            className="absolute bottom-24 right-0 w-80 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <lucide_react_1.Zap className="w-5 h-5 mr-2" />
              Try saying...
            </h3>
            <div className="space-y-2">
              {voiceCapabilities.slice(0, 3).map(function (capability) {
                return (
                  <div
                    key={capability.category}
                    className="p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {capability.icon}
                      <span className="text-sm font-medium">
                        {capability.category}
                      </span>
                    </div>
                    <p className="text-xs text-white/70">
                      "{capability.examples[0]}"
                    </p>
                  </div>
                );
              })}
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>
    </div>
  );
};
exports.default = JasonVoiceAssistant;
var JasonVoiceAssistant = function () {
  var _a = (0, react_1.useState)(false),
    isListening = _a[0],
    setIsListening = _a[1];
  var _b = (0, react_1.useState)(false),
    isProcessing = _b[0],
    setIsProcessing = _b[1];
  var _c = (0, react_1.useState)(false),
    isSpeaking = _c[0],
    setIsSpeaking = _c[1];
  var _d = (0, react_1.useState)(true),
    isOnline = _d[0],
    setIsOnline = _d[1];
  var _e = (0, react_1.useState)(""),
    currentCommand = _e[0],
    setCurrentCommand = _e[1];
  var _f = (0, react_1.useState)([]),
    commandHistory = _f[0],
    setCommandHistory = _f[1];
  var _g = (0, react_1.useState)(0),
    voiceLevel = _g[0],
    setVoiceLevel = _g[1];
  var _h = (0, react_1.useState)({
      name: "JASON",
      voice: "friendly",
      responseStyle: "conversational",
      proactivity: "medium",
      learningEnabled: true,
    }),
    aiPersonality = _h[0],
    setAiPersonality = _h[1];
  var _j = (0, react_1.useState)(false),
    showSettings = _j[0],
    setShowSettings = _j[1];
  var _k = (0, react_1.useState)(true),
    localProcessingEnabled = _k[0],
    setLocalProcessingEnabled = _k[1];
  var _l = (0, react_1.useState)(true),
    wakeWordEnabled = _l[0],
    setWakeWordEnabled = _l[1];
  var _m = (0, react_1.useState)(false),
    continuousListening = _m[0],
    setContinuousListening = _m[1];
  var recognitionRef = (0, react_1.useRef)(null);
  var synthRef = (0, react_1.useRef)(null);
  var audioContextRef = (0, react_1.useRef)(null);
  var analyserRef = (0, react_1.useRef)(null);
  var microphoneRef = (0, react_1.useRef)(null);
  // Voice capabilities
  var voiceCapabilities = [
    {
      category: "Smart Home Control",
      commands: ["lights", "temperature", "security", "locks", "blinds"],
      icon: <lucide_react_1.Home className="w-5 h-5" />,
      description: "Control all your smart home devices with natural language",
      examples: [
        "Turn on the living room lights",
        "Set temperature to 72 degrees",
        "Lock all doors",
        "Dim bedroom lights to 30%",
      ],
    },
    {
      category: "Entertainment",
      commands: ["music", "tv", "volume", "play", "pause"],
      icon: <lucide_react_1.Music className="w-5 h-5" />,
      description: "Control your entertainment systems and media",
      examples: [
        "Play relaxing music",
        "Turn on Netflix",
        "Volume up",
        "Pause the movie",
      ],
    },
    {
      category: "Information & AI",
      commands: ["weather", "news", "schedule", "reminders", "questions"],
      icon: <lucide_react_1.Brain className="w-5 h-5" />,
      description: "Get information and AI-powered insights",
      examples: [
        "What's the weather today?",
        "What's on my schedule?",
        "Remind me to call mom",
        "How can I save energy?",
      ],
    },
    {
      category: "Device Integration",
      commands: ["phone", "computer", "camera", "notifications"],
      icon: <lucide_react_1.Phone className="w-5 h-5" />,
      description: "Integrate with your personal devices",
      examples: [
        "Send a text to John",
        "Take a photo",
        "Show my notifications",
        "Start video call",
      ],
    },
    {
      category: "Automation & Scenes",
      commands: ["scenes", "routines", "automation", "schedules"],
      icon: <lucide_react_1.Zap className="w-5 h-5" />,
      description: "Create and manage smart home automations",
      examples: [
        "Activate movie night scene",
        "Create morning routine",
        "Schedule lights for sunset",
        "Run bedtime automation",
      ],
    },
  ];
  // Initialize speech recognition and synthesis
  (0, react_1.useEffect)(
    function () {
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        var SpeechRecognition =
          window.webkitSpeechRecognition || window.SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = continuousListening;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.onstart = function () {
          setIsListening(true);
          console.log("Voice recognition started");
        };
        recognitionRef.current.onresult = function (event) {
          var interimTranscript = "";
          var finalTranscript = "";
          for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          setCurrentCommand(finalTranscript || interimTranscript);
          if (finalTranscript) {
            processVoiceCommand(
              finalTranscript,
              event.results[event.resultIndex][0].confidence,
            );
          }
        };
        recognitionRef.current.onerror = function (event) {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };
        recognitionRef.current.onend = function () {
          setIsListening(false);
          if (continuousListening && !isProcessing) {
            // Restart listening if continuous mode is enabled
            setTimeout(function () {
              return startListening();
            }, 1000);
          }
        };
      }
      // Initialize speech synthesis
      if ("speechSynthesis" in window) {
        synthRef.current = window.speechSynthesis;
      }
      // Initialize audio context for voice level monitoring
      initializeAudioContext();
      return function () {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    },
    [continuousListening, isProcessing],
  );
  var initializeAudioContext = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var stream, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            audioContextRef.current = new (window.AudioContext ||
              window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            return [
              4 /*yield*/,
              navigator.mediaDevices.getUserMedia({ audio: true }),
            ];
          case 1:
            stream = _a.sent();
            microphoneRef.current =
              audioContextRef.current.createMediaStreamSource(stream);
            microphoneRef.current.connect(analyserRef.current);
            // Start monitoring voice level
            monitorVoiceLevel();
            return [3 /*break*/, 3];
          case 2:
            error_3 = _a.sent();
            console.error("Error initializing audio context:", error_3);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  var monitorVoiceLevel = function () {
    if (!analyserRef.current) return;
    var dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    var updateLevel = function () {
      analyserRef.current.getByteFrequencyData(dataArray);
      var average =
        dataArray.reduce(function (sum, value) {
          return sum + value;
        }, 0) / dataArray.length;
      setVoiceLevel(average / 255);
      if (isListening) {
        requestAnimationFrame(updateLevel);
      }
    };
    updateLevel();
  };
  var startListening = (0, react_1.useCallback)(
    function () {
      if (recognitionRef.current && !isListening) {
        setCurrentCommand("");
        recognitionRef.current.start();
        monitorVoiceLevel();
      }
    },
    [isListening],
  );
  var stopListening = (0, react_1.useCallback)(
    function () {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    },
    [isListening],
  );
  var processVoiceCommand = function (command, confidence) {
    return __awaiter(void 0, void 0, void 0, function () {
      var startTime,
        intent,
        entities,
        response,
        executionTime,
        voiceCommand_2,
        error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setIsProcessing(true);
            startTime = Date.now();
            _a.label = 1;
          case 1:
            _a.trys.push([1, 7, 9, 10]);
            return [4 /*yield*/, analyzeIntent(command)];
          case 2:
            intent = _a.sent();
            return [4 /*yield*/, extractEntities(command)];
          case 3:
            entities = _a.sent();
            return [4 /*yield*/, executeCommand(command, intent, entities)];
          case 4:
            response = _a.sent();
            executionTime = Date.now() - startTime;
            voiceCommand_2 = {
              id: Date.now().toString(),
              text: command,
              timestamp: new Date(),
              confidence: confidence,
              intent: intent,
              entities: entities,
              response: response.text,
              responseType: response.type,
              executionTime: executionTime,
              localProcessed: localProcessingEnabled,
            };
            setCommandHistory(function (prev) {
              return __spreadArray([voiceCommand_2], prev.slice(0, 9), true);
            });
            if (!(response.text && !response.silent)) return [3 /*break*/, 6];
            return [4 /*yield*/, speakResponse(response.text)];
          case 5:
            _a.sent();
            _a.label = 6;
          case 6:
            return [3 /*break*/, 10];
          case 7:
            error_4 = _a.sent();
            console.error("Error processing voice command:", error_4);
            return [
              4 /*yield*/,
              speakResponse(
                "Sorry, I encountered an error processing that command.",
              ),
            ];
          case 8:
            _a.sent();
            return [3 /*break*/, 10];
          case 9:
            setIsProcessing(false);
            setCurrentCommand("");
            return [7 /*endfinally*/];
          case 10:
            return [2 /*return*/];
        }
      });
    });
  };
  var analyzeIntent = function (command) {
    return __awaiter(void 0, void 0, void 0, function () {
      var lowerCommand;
      return __generator(this, function (_a) {
        lowerCommand = command.toLowerCase();
        if (lowerCommand.includes("light") || lowerCommand.includes("lamp"))
          return [2 /*return*/, "control_lights"];
        if (
          lowerCommand.includes("temperature") ||
          lowerCommand.includes("thermostat")
        )
          return [2 /*return*/, "control_climate"];
        if (
          lowerCommand.includes("music") ||
          lowerCommand.includes("play") ||
          lowerCommand.includes("song")
        )
          return [2 /*return*/, "control_media"];
        if (lowerCommand.includes("lock") || lowerCommand.includes("unlock"))
          return [2 /*return*/, "control_security"];
        if (lowerCommand.includes("weather"))
          return [2 /*return*/, "get_weather"];
        if (lowerCommand.includes("time") || lowerCommand.includes("schedule"))
          return [2 /*return*/, "get_time_info"];
        if (lowerCommand.includes("scene") || lowerCommand.includes("routine"))
          return [2 /*return*/, "activate_scene"];
        if (lowerCommand.includes("data") || lowerCommand.includes("earning"))
          return [2 /*return*/, "data_dividend"];
        return [2 /*return*/, "general_query"];
      });
    });
  };
  var extractEntities = function (command) {
    return __awaiter(void 0, void 0, void 0, function () {
      var entities,
        lowerCommand,
        rooms,
        _i,
        rooms_2,
        room,
        numberMatch,
        colors,
        _a,
        colors_2,
        color;
      return __generator(this, function (_b) {
        entities = {};
        lowerCommand = command.toLowerCase();
        rooms = [
          "living room",
          "bedroom",
          "kitchen",
          "bathroom",
          "office",
          "dining room",
        ];
        for (_i = 0, rooms_2 = rooms; _i < rooms_2.length; _i++) {
          room = rooms_2[_i];
          if (lowerCommand.includes(room)) {
            entities.room = room;
            break;
          }
        }
        numberMatch = lowerCommand.match(/(\d+)(%|percent|degrees?)/);
        if (numberMatch) {
          entities.value = parseInt(numberMatch[1]);
          entities.unit = numberMatch[2];
        }
        colors = [
          "red",
          "blue",
          "green",
          "yellow",
          "purple",
          "orange",
          "white",
          "warm",
          "cool",
        ];
        for (_a = 0, colors_2 = colors; _a < colors_2.length; _a++) {
          color = colors_2[_a];
          if (lowerCommand.includes(color)) {
            entities.color = color;
            break;
          }
        }
        return [2 /*return*/, entities];
      });
    });
  };
  var executeCommand = function (command, intent, entities) {
    return __awaiter(void 0, void 0, void 0, function () {
      var now;
      return __generator(this, function (_a) {
        // Simulate command execution based on intent
        switch (intent) {
          case "control_lights":
            if (command.toLowerCase().includes("on")) {
              return [
                2 /*return*/,
                {
                  text: "Turning on the ".concat(
                    entities.room || "main",
                    " lights",
                  ),
                  type: "confirmation",
                },
              ];
            } else if (command.toLowerCase().includes("off")) {
              return [
                2 /*return*/,
                {
                  text: "Turning off the ".concat(
                    entities.room || "main",
                    " lights",
                  ),
                  type: "confirmation",
                },
              ];
            } else if (entities.value) {
              return [
                2 /*return*/,
                {
                  text: "Setting "
                    .concat(entities.room || "main", " lights to ")
                    .concat(entities.value, "%"),
                  type: "confirmation",
                },
              ];
            }
            return [
              2 /*return*/,
              {
                text: "What would you like me to do with the lights?",
                type: "text",
              },
            ];
          case "control_climate":
            if (entities.value) {
              return [
                2 /*return*/,
                {
                  text: "Setting temperature to ".concat(
                    entities.value,
                    " degrees",
                  ),
                  type: "confirmation",
                },
              ];
            }
            return [
              2 /*return*/,
              {
                text: "The current temperature is 72 degrees. What would you like to set it to?",
                type: "text",
              },
            ];
          case "control_media":
            if (command.toLowerCase().includes("play")) {
              return [
                2 /*return*/,
                {
                  text: "Playing your favorite playlist",
                  type: "confirmation",
                },
              ];
            } else if (command.toLowerCase().includes("pause")) {
              return [
                2 /*return*/,
                { text: "Pausing music", type: "confirmation" },
              ];
            }
            return [
              2 /*return*/,
              { text: "What would you like me to play?", type: "text" },
            ];
          case "control_security":
            if (command.toLowerCase().includes("lock")) {
              return [
                2 /*return*/,
                {
                  text: "Locking all doors and activating security system",
                  type: "confirmation",
                },
              ];
            } else if (command.toLowerCase().includes("unlock")) {
              return [
                2 /*return*/,
                { text: "Unlocking front door", type: "confirmation" },
              ];
            }
            return [
              2 /*return*/,
              {
                text: "Security system is armed. All doors are locked.",
                type: "text",
              },
            ];
          case "get_weather":
            return [
              2 /*return*/,
              {
                text: "Today is sunny with a high of 75 degrees and a low of 58 degrees. Perfect weather for outdoor activities!",
                type: "text",
              },
            ];
          case "get_time_info":
            now = new Date();
            return [
              2 /*return*/,
              {
                text: "It's currently ".concat(
                  now.toLocaleTimeString(),
                  ". You have a meeting at 3 PM today.",
                ),
                type: "text",
              },
            ];
          case "activate_scene":
            return [
              2 /*return*/,
              {
                text: "Activating movie night scene. Dimming lights, closing blinds, and starting the projector.",
                type: "confirmation",
              },
            ];
          case "data_dividend":
            return [
              2 /*return*/,
              {
                text: "You've earned $12.47 today from ethical data sharing. Would you like to see available opportunities?",
                type: "text",
              },
            ];
          default:
            // For complex queries, simulate routing to external AI
            if (localProcessingEnabled) {
              return [
                2 /*return*/,
                {
                  text: "I'm processing that with my local AI. Let me think about it...",
                  type: "text",
                },
              ];
            } else {
              return [
                2 /*return*/,
                {
                  text: "Let me check that for you using advanced AI processing...",
                  type: "text",
                },
              ];
            }
        }
        return [2 /*return*/];
      });
    });
  };
  var speakResponse = function (text) {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        if (!synthRef.current) return [2 /*return*/];
        return [
          2 /*return*/,
          new Promise(function (resolve) {
            setIsSpeaking(true);
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            // Set voice based on personality
            var voices = synthRef.current.getVoices();
            var preferredVoice = voices.find(function (voice) {
              return (
                voice.name.includes("Google") ||
                voice.name.includes("Microsoft")
              );
            });
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
            utterance.onend = function () {
              setIsSpeaking(false);
              resolve();
            };
            utterance.onerror = function () {
              setIsSpeaking(false);
              resolve();
            };
            synthRef.current.speak(utterance);
          }),
        ];
      });
    });
  };
  var toggleListening = function () {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  var getPersonalityGreeting = function () {
    var greetings = {
      friendly:
        "Hi there! I'm JASON, your friendly AI assistant. How can I help you today?",
      professional:
        "Good day. I am JASON, your AI assistant. How may I assist you?",
      casual: "Hey! JASON here. What's up?",
      enthusiastic:
        "Hello! I'm JASON and I'm excited to help you today! What can we do together?",
    };
    return greetings[aiPersonality.voice];
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Voice Assistant Orb */}
      <framer_motion_1.motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Voice Level Visualization */}
        <framer_motion_1.AnimatePresence>
          {isListening && (
            <framer_motion_1.motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: 1 + voiceLevel * 0.5,
                opacity: 0.3 + voiceLevel * 0.7,
              }}
              exit={{ scale: 1, opacity: 0 }}
              style={{
                background:
                  "radial-gradient(circle, rgba(59, 130, 246, ".concat(
                    0.3 + voiceLevel * 0.7,
                    ") 0%, transparent 70%)",
                  ),
              }}
            />
          )}
        </framer_motion_1.AnimatePresence>

        {/* Processing Animation */}
        <framer_motion_1.AnimatePresence>
          {isProcessing && (
            <framer_motion_1.motion.div
              className="absolute inset-0 rounded-full border-4 border-purple-500"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 1, 0],
                rotate: [0, 360],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </framer_motion_1.AnimatePresence>

        {/* Main Orb Button */}
        <framer_motion_1.motion.button
          onClick={toggleListening}
          className={"w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl transition-all duration-300 ".concat(
            isListening
              ? "bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/50"
              : isProcessing
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/50"
                : isSpeaking
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50"
                  : "bg-gradient-to-r from-blue-500 to-cyan-600 shadow-blue-500/50 hover:shadow-blue-500/70",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isListening
              ? "0 0 ".concat(20 + voiceLevel * 30, "px rgba(239, 68, 68, 0.5)")
              : "0 10px 30px rgba(59, 130, 246, 0.3)",
          }}
        >
          {isProcessing ? (
            <lucide_react_1.Brain className="w-8 h-8 animate-pulse" />
          ) : isSpeaking ? (
            <lucide_react_1.Volume2 className="w-8 h-8 animate-pulse" />
          ) : isListening ? (
            <framer_motion_1.motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <lucide_react_1.Mic className="w-8 h-8" />
            </framer_motion_1.motion.div>
          ) : (
            <span>J</span>
          )}
        </framer_motion_1.motion.button>

        {/* Status Indicators */}
        <div className="absolute -top-2 -right-2 flex space-x-1">
          {localProcessingEnabled && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <lucide_react_1.Shield className="w-2 h-2 text-white" />
            </div>
          )}
          {isOnline ? (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <lucide_react_1.Wifi className="w-2 h-2 text-white" />
            </div>
          ) : (
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <lucide_react_1.WifiOff className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Current Command Display */}
        <framer_motion_1.AnimatePresence>
          {currentCommand && (
            <framer_motion_1.motion.div
              className="absolute bottom-24 right-0 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg max-w-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <p className="text-sm">{currentCommand}</p>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>

        {/* Settings Button */}
        <framer_motion_1.motion.button
          onClick={function () {
            return setShowSettings(!showSettings);
          }}
          className="absolute -bottom-2 -left-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <lucide_react_1.Settings className="w-4 h-4 text-white" />
        </framer_motion_1.motion.button>
      </framer_motion_1.motion.div>

      {/* Settings Panel */}
      <framer_motion_1.AnimatePresence>
        {showSettings && (
          <framer_motion_1.motion.div
            className="absolute bottom-24 right-0 w-80 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <lucide_react_1.Brain className="w-5 h-5 mr-2" />
              JASON Settings
            </h3>

            <div className="space-y-4">
              {/* Local Processing Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Local Processing</p>
                  <p className="text-xs text-white/60">
                    Process commands locally for privacy
                  </p>
                </div>
                <button
                  onClick={function () {
                    return setLocalProcessingEnabled(!localProcessingEnabled);
                  }}
                  className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                    localProcessingEnabled ? "bg-green-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                      localProcessingEnabled
                        ? "translate-x-6"
                        : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Continuous Listening */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Continuous Listening</p>
                  <p className="text-xs text-white/60">
                    Always listen for commands
                  </p>
                </div>
                <button
                  onClick={function () {
                    return setContinuousListening(!continuousListening);
                  }}
                  className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                    continuousListening ? "bg-blue-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                      continuousListening ? "translate-x-6" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Wake Word */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Wake Word</p>
                  <p className="text-xs text-white/60">
                    Activate with "Hey JASON"
                  </p>
                </div>
                <button
                  onClick={function () {
                    return setWakeWordEnabled(!wakeWordEnabled);
                  }}
                  className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                    wakeWordEnabled ? "bg-purple-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                      wakeWordEnabled ? "translate-x-6" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Voice Personality */}
              <div>
                <p className="font-medium mb-2">Voice Personality</p>
                <select
                  value={aiPersonality.voice}
                  onChange={function (e) {
                    return setAiPersonality(function (prev) {
                      return __assign(__assign({}, prev), {
                        voice: e.target.value,
                      });
                    });
                  }}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>

              {/* Response Style */}
              <div>
                <p className="font-medium mb-2">Response Style</p>
                <select
                  value={aiPersonality.responseStyle}
                  onChange={function (e) {
                    return setAiPersonality(function (prev) {
                      return __assign(__assign({}, prev), {
                        responseStyle: e.target.value,
                      });
                    });
                  }}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="font-medium mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={function () {
                    return speakResponse(getPersonalityGreeting());
                  }}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm transition-colors"
                >
                  Test Voice
                </button>
                <button
                  onClick={function () {
                    return setCommandHistory([]);
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Command History */}
      <framer_motion_1.AnimatePresence>
        {commandHistory.length > 0 && !showSettings && (
          <framer_motion_1.motion.div
            className="absolute bottom-24 right-0 w-96 max-h-80 overflow-y-auto bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <lucide_react_1.MessageCircle className="w-5 h-5 mr-2" />
              Recent Commands
            </h3>
            <div className="space-y-3">
              {commandHistory.slice(0, 5).map(function (cmd) {
                return (
                  <div
                    key={cmd.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{cmd.text}</p>
                      <div className="flex items-center space-x-1">
                        {cmd.localProcessed && (
                          <lucide_react_1.Shield className="w-3 h-3 text-green-400" />
                        )}
                        <span className="text-xs text-white/60">
                          {cmd.confidence.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/70 mb-1">{cmd.response}</p>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{cmd.intent}</span>
                      <span>{cmd.executionTime}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>

      {/* Voice Capabilities Help */}
      <framer_motion_1.AnimatePresence>
        {isListening && !currentCommand && (
          <framer_motion_1.motion.div
            className="absolute bottom-24 right-0 w-80 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <lucide_react_1.Zap className="w-5 h-5 mr-2" />
              Try saying...
            </h3>
            <div className="space-y-2">
              {voiceCapabilities.slice(0, 3).map(function (capability) {
                return (
                  <div
                    key={capability.category}
                    className="p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {capability.icon}
                      <span className="text-sm font-medium">
                        {capability.category}
                      </span>
                    </div>
                    <p className="text-xs text-white/70">
                      "{capability.examples[0]}"
                    </p>
                  </div>
                );
              })}
            </div>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>
    </div>
  );
};
exports.default = JasonVoiceAssistant;

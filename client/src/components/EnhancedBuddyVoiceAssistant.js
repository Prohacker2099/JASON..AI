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
var lucide_react_1 = require("lucide-react");
var EnhancedBuddyVoiceAssistant = function () {
  var _a = (0, react_1.useState)(false),
    isListening = _a[0],
    setIsListening = _a[1];
  var _b = (0, react_1.useState)(false),
    isConnected = _b[0],
    setIsConnected = _b[1];
  var _c = (0, react_1.useState)(false),
    isMuted = _c[0],
    setIsMuted = _c[1];
  var _d = (0, react_1.useState)(""),
    currentCommand = _d[0],
    setCurrentCommand = _d[1];
  var _e = (0, react_1.useState)([]),
    recentCommands = _e[0],
    setRecentCommands = _e[1];
  var _f = (0, react_1.useState)(false),
    showHistory = _f[0],
    setShowHistory = _f[1];
  var _g = (0, react_1.useState)(0),
    voiceLevel = _g[0],
    setVoiceLevel = _g[1];
  var _h = (0, react_1.useState)(false),
    isProcessing = _h[0],
    setIsProcessing = _h[1];
  var _j = (0, react_1.useState)({
      mood: "calm",
      energy: 0.7,
      relationship: "familiar",
      personality: "friendly-helpful",
    }),
    buddyState = _j[0],
    setBuddyState = _j[1];
  var _k = (0, react_1.useState)(false),
    showPersonality = _k[0],
    setShowPersonality = _k[1];
  var _l = (0, react_1.useState)(null),
    proactiveSuggestion = _l[0],
    setProactiveSuggestion = _l[1];
  var recognitionRef = (0, react_1.useRef)(null);
  var audioContextRef = (0, react_1.useRef)(null);
  var analyserRef = (0, react_1.useRef)(null);
  var animationRef = (0, react_1.useRef)(null);
  var wsRef = (0, react_1.useRef)(null);
  (0, react_1.useEffect)(function () {
    initializeVoiceRecognition();
    initializeWebSocket();
    startProactiveMode();
    return function () {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  var initializeWebSocket = function () {
    var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    var wsUrl = "".concat(protocol, "//").concat(window.location.host, "/ws");
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = function () {
      console.log("🔗 Connected to JASON WebSocket");
      setIsConnected(true);
    };
    wsRef.current.onmessage = function (event) {
      var data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    wsRef.current.onclose = function () {
      console.log("🔌 Disconnected from JASON WebSocket");
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(initializeWebSocket, 3000);
    };
  };
  var handleWebSocketMessage = function (data) {
    switch (data.type) {
      case "proactiveMessage":
        setProactiveSuggestion(data.data.message);
        setBuddyState(function (prev) {
          return __assign(__assign({}, prev), { mood: "excited", energy: 0.9 });
        });
        break;
      case "voiceResponse":
        if (data.data.emotion) {
          updateBuddyMood(data.data.emotion);
        }
        break;
      case "welcome":
        setBuddyState(function (prev) {
          return __assign(__assign({}, prev), { mood: "happy", energy: 0.8 });
        });
        break;
    }
  };
  var initializeVoiceRecognition = function () {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      var SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onstart = function () {
        setIsConnected(true);
        setIsListening(true);
        setBuddyState(function (prev) {
          return __assign(__assign({}, prev), {
            mood: "listening",
            energy: 1.0,
          });
        });
        startAudioVisualization();
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
        setCurrentCommand(interimTranscript || finalTranscript);
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
        setIsConnected(false);
        setBuddyState(function (prev) {
          return __assign(__assign({}, prev), { mood: "calm", energy: 0.5 });
        });
      };
      recognitionRef.current.onend = function () {
        setIsListening(false);
        setCurrentCommand("");
        setBuddyState(function (prev) {
          return __assign(__assign({}, prev), { mood: "calm", energy: 0.7 });
        });
        stopAudioVisualization();
      };
    } else {
      console.warn("Speech recognition not supported");
    }
  };
  var startAudioVisualization = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var stream,
        source,
        bufferLength_1,
        dataArray_1,
        updateVisualization_1,
        error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              navigator.mediaDevices.getUserMedia({ audio: true }),
            ];
          case 1:
            stream = _a.sent();
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;
            bufferLength_1 = analyserRef.current.frequencyBinCount;
            dataArray_1 = new Uint8Array(bufferLength_1);
            updateVisualization_1 = function () {
              if (analyserRef.current && isListening) {
                analyserRef.current.getByteFrequencyData(dataArray_1);
                var average_1 =
                  dataArray_1.reduce(function (sum, value) {
                    return sum + value;
                  }, 0) / bufferLength_1;
                setVoiceLevel(average_1 / 255);
                // Update buddy energy based on voice level
                setBuddyState(function (prev) {
                  return __assign(__assign({}, prev), {
                    energy: Math.min(
                      1.0,
                      prev.energy + (average_1 / 255) * 0.1,
                    ),
                  });
                });
                animationRef.current = requestAnimationFrame(
                  updateVisualization_1,
                );
              }
            };
            updateVisualization_1();
            return [3 /*break*/, 3];
          case 2:
            error_1 = _a.sent();
            console.error("Error accessing microphone:", error_1);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  var stopAudioVisualization = function () {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setVoiceLevel(0);
  };
  var processVoiceCommand = function (text, confidence) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, result, command_1, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setIsProcessing(true);
            setBuddyState(function (prev) {
              return __assign(__assign({}, prev), {
                mood: "thinking",
                energy: 0.9,
              });
            });
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, 5, 6]);
            return [
              4 /*yield*/,
              fetch("/api/voice/command", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  text: text,
                  userId: "current-user", // In real app, get from auth context
                  localProcessing: true,
                }),
              }),
            ];
          case 2:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 3:
            result = _a.sent();
            command_1 = {
              text: text,
              timestamp: new Date(),
              response: result.response,
              confidence: confidence,
              emotion: result.emotion,
              intent: result.intent,
            };
            setRecentCommands(function (prev) {
              return __spreadArray([command_1], prev.slice(0, 9), true);
            });
            // Update buddy state based on interaction
            updateBuddyMood(result.emotion || "neutral");
            // Speak the response if not muted
            if (!isMuted && result.response) {
              speakResponse(result.response, result.emotion);
            }
            // Send to WebSocket for real-time processing
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: "voice_command",
                  data: { text: text, result: result },
                }),
              );
            }
            return [3 /*break*/, 6];
          case 4:
            error_2 = _a.sent();
            console.error("Error processing voice command:", error_2);
            setBuddyState(function (prev) {
              return __assign(__assign({}, prev), {
                mood: "calm",
                energy: 0.6,
              });
            });
            return [3 /*break*/, 6];
          case 5:
            setIsProcessing(false);
            setCurrentCommand("");
            return [7 /*endfinally*/];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  var updateBuddyMood = function (emotion) {
    var newMood = "calm";
    var energyChange = 0;
    switch (emotion) {
      case "happiness":
      case "excited":
        newMood = "excited";
        energyChange = 0.2;
        break;
      case "gratitude":
        newMood = "happy";
        energyChange = 0.1;
        break;
      case "stress":
      case "sadness":
        newMood = "calm";
        energyChange = -0.1;
        break;
      default:
        newMood = "calm";
        energyChange = 0;
    }
    setBuddyState(function (prev) {
      return __assign(__assign({}, prev), {
        mood: newMood,
        energy: Math.max(0.3, Math.min(1.0, prev.energy + energyChange)),
      });
    });
  };
  var speakResponse = function (text, emotion) {
    if ("speechSynthesis" in window) {
      var utterance = new SpeechSynthesisUtterance(text);
      // Adjust voice parameters based on emotion
      switch (emotion) {
        case "excited":
          utterance.rate = 1.1;
          utterance.pitch = 1.3;
          break;
        case "calm":
          utterance.rate = 0.8;
          utterance.pitch = 0.9;
          break;
        case "empathetic":
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          break;
        default:
          utterance.rate = 0.95;
          utterance.pitch = 1.1;
      }
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };
  var startProactiveMode = function () {
    // Simulate proactive suggestions
    setInterval(function () {
      if (Math.random() < 0.1 && !proactiveSuggestion) {
        // 10% chance every interval
        var suggestions = [
          "I noticed you haven't checked your energy savings today. Want to see how much you've saved?",
          "Your smart lights have been on for a while. Should I optimize them for energy efficiency?",
          "I can help you create a bedtime routine. Would you like me to set that up?",
          "You've earned $2.47 from data sharing today! Want to see your earnings breakdown?",
        ];
        var randomSuggestion =
          suggestions[Math.floor(Math.random() * suggestions.length)];
        setProactiveSuggestion(randomSuggestion);
        setBuddyState(function (prev) {
          return __assign(__assign({}, prev), { mood: "excited", energy: 0.9 });
        });
        // Auto-hide after 10 seconds
        setTimeout(function () {
          return setProactiveSuggestion(null);
        }, 10000);
      }
    }, 30000); // Check every 30 seconds
  };
  var toggleListening = function () {
    var _a, _b;
    if (isListening) {
      (_a = recognitionRef.current) === null || _a === void 0
        ? void 0
        : _a.stop();
    } else {
      (_b = recognitionRef.current) === null || _b === void 0
        ? void 0
        : _b.start();
    }
  };
  var toggleMute = function () {
    setIsMuted(!isMuted);
    if (!isMuted) {
      speechSynthesis.cancel();
    }
  };
  var getBuddyGradient = function () {
    switch (buddyState.mood) {
      case "happy":
        return "from-yellow-400 to-orange-500";
      case "excited":
        return "from-pink-500 to-purple-600";
      case "listening":
        return "from-green-400 to-blue-500";
      case "thinking":
        return "from-indigo-500 to-purple-600";
      default:
        return "from-blue-500 to-purple-600";
    }
  };
  var getBuddyIcon = function () {
    switch (buddyState.mood) {
      case "happy":
        return <lucide_react_1.Heart className="w-6 h-6 text-white" />;
      case "excited":
        return <lucide_react_1.Zap className="w-6 h-6 text-white" />;
      case "thinking":
        return <lucide_react_1.Brain className="w-6 h-6 text-white" />;
      case "listening":
        return isListening ? (
          <lucide_react_1.MicOff className="w-6 h-6 text-white" />
        ) : (
          <lucide_react_1.Mic className="w-6 h-6 text-white" />
        );
      default:
        return isListening ? (
          <lucide_react_1.MicOff className="w-6 h-6 text-white" />
        ) : (
          <lucide_react_1.Mic className="w-6 h-6 text-white" />
        );
    }
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Proactive Suggestion */}
      {proactiveSuggestion && (
        <div
          className="absolute bottom-24 right-0 bg-gradient-to-r from-purple-600 to-pink-600 
                        text-white px-4 py-3 rounded-lg max-w-xs shadow-xl backdrop-blur-sm
                        animate-bounce-in"
        >
          <div className="flex items-start space-x-2">
            <lucide_react_1.Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">JASON suggests:</p>
              <p className="text-sm opacity-90">{proactiveSuggestion}</p>
            </div>
            <button
              onClick={function () {
                return setProactiveSuggestion(null);
              }}
              className="text-white/70 hover:text-white ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Voice Assistant Orb */}
      <div className="relative">
        <button
          onClick={toggleListening}
          className={"\n            w-16 h-16 rounded-full flex items-center justify-center\n            transition-all duration-300 transform hover:scale-110\n            bg-gradient-to-r "
            .concat(getBuddyGradient(), " shadow-lg\n            ")
            .concat(isProcessing ? "animate-pulse" : "", "\n            ")
            .concat(
              buddyState.mood === "excited" ? "animate-bounce" : "",
              "\n          ",
            )}
          style={{
            boxShadow: "0 0 "
              .concat(20 + buddyState.energy * 20, "px rgba(147, 51, 234, ")
              .concat(0.3 + buddyState.energy * 0.3, ")"),
          }}
          disabled={isProcessing}
        >
          {getBuddyIcon()}
        </button>

        {/* Voice Level Visualization */}
        {isListening && (
          <>
            <div
              className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"
              style={{
                transform: "scale(".concat(1 + voiceLevel * 0.5, ")"),
                opacity: voiceLevel,
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse"
              style={{
                transform: "scale(".concat(1.2 + voiceLevel * 0.3, ")"),
                opacity: voiceLevel * 0.7,
              }}
            />
          </>
        )}

        {/* Connection Status & Mood Indicator */}
        <div className="absolute -top-1 -right-1 flex space-x-1">
          <div
            className={"\n            w-3 h-3 rounded-full\n            ".concat(
              isConnected ? "bg-green-400" : "bg-red-400",
              "\n          ",
            )}
          />
          <div
            className={"\n            w-3 h-3 rounded-full\n            ".concat(
              buddyState.mood === "happy"
                ? "bg-yellow-400"
                : buddyState.mood === "excited"
                  ? "bg-pink-400"
                  : buddyState.mood === "thinking"
                    ? "bg-purple-400"
                    : "bg-blue-400",
              "\n          ",
            )}
          />
        </div>

        {/* Energy Level */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-1 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all duration-300"
              style={{ width: "".concat(buddyState.energy * 100, "%") }}
            />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-4 flex flex-col space-y-2">
        <button
          onClick={toggleMute}
          className={"\n            w-12 h-12 rounded-full flex items-center justify-center\n            transition-all duration-200 hover:scale-105\n            ".concat(
            isMuted
              ? "bg-gray-600 text-gray-300"
              : "bg-green-500 text-white shadow-lg shadow-green-500/30",
            "\n          ",
          )}
        >
          {isMuted ? (
            <lucide_react_1.VolumeX className="w-5 h-5" />
          ) : (
            <lucide_react_1.Volume2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={function () {
            return setShowHistory(!showHistory);
          }}
          className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center
                     transition-all duration-200 hover:scale-105 shadow-lg shadow-indigo-500/30"
        >
          <lucide_react_1.MessageCircle className="w-5 h-5" />
        </button>

        <button
          onClick={function () {
            return setShowPersonality(!showPersonality);
          }}
          className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center
                     transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/30"
        >
          <lucide_react_1.Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Current Command Display */}
      {currentCommand && (
        <div
          className="absolute bottom-20 right-0 bg-black/80 text-white px-4 py-2 rounded-lg
                        max-w-xs backdrop-blur-sm"
        >
          <p className="text-sm">{currentCommand}</p>
          {isProcessing && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <span className="text-xs text-blue-300 ml-2">
                JASON is thinking...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Personality Panel */}
      {showPersonality && (
        <div
          className="absolute bottom-20 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl
                        w-80 border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              JASON's Personality
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Mood
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className={"w-3 h-3 rounded-full bg-gradient-to-r ".concat(
                    getBuddyGradient(),
                  )}
                />
                <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                  {buddyState.mood}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Energy Level
              </label>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-gradient-to-r from-green-400 to-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: "".concat(buddyState.energy * 100, "%") }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(buddyState.energy * 100)}%
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Relationship
              </label>
              <span className="block text-sm capitalize text-gray-600 dark:text-gray-400">
                {buddyState.relationship}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Personality Type
              </label>
              <span className="block text-sm text-gray-600 dark:text-gray-400">
                {buddyState.personality}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Command History */}
      {showHistory && (
        <div
          className="absolute bottom-20 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl
                        w-80 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recent Conversations
            </h3>
          </div>
          <div className="p-2">
            {recentCommands.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No conversations yet
              </p>
            ) : (
              recentCommands.map(function (command, index) {
                return (
                  <div
                    key={index}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {command.text}
                        </p>
                        {command.response && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <span className="font-medium text-purple-600">
                              JASON:
                            </span>{" "}
                            {command.response}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {command.timestamp.toLocaleTimeString()}
                          </span>
                          {command.confidence && (
                            <span
                              className={"text-xs px-2 py-1 rounded-full ".concat(
                                command.confidence > 0.8
                                  ? "bg-green-100 text-green-800"
                                  : command.confidence > 0.6
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800",
                              )}
                            >
                              {Math.round(command.confidence * 100)}%
                            </span>
                          )}
                          {command.emotion && (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              {command.emotion}
                            </span>
                          )}
                          {command.intent && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {command.intent}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
exports.default = EnhancedBuddyVoiceAssistant;

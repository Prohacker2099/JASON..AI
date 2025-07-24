"use strict";
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
var axios_1 = require("axios");
// Emotion types
var EmotionType;
(function (EmotionType) {
  EmotionType["NEUTRAL"] = "neutral";
  EmotionType["HAPPY"] = "happy";
  EmotionType["SAD"] = "sad";
  EmotionType["ANGRY"] = "angry";
  EmotionType["FRUSTRATED"] = "frustrated";
  EmotionType["CONFUSED"] = "confused";
  EmotionType["EXCITED"] = "excited";
  EmotionType["TIRED"] = "tired";
  EmotionType["URGENT"] = "urgent";
})(EmotionType || (EmotionType = {}));
var VoiceAssistantPanel = function () {
  var _a = (0, react_1.useState)(""),
    command = _a[0],
    setCommand = _a[1];
  var _b = (0, react_1.useState)(EmotionType.NEUTRAL),
    emotion = _b[0],
    setEmotion = _b[1];
  var _c = (0, react_1.useState)(false),
    isListening = _c[0],
    setIsListening = _c[1];
  var _d = (0, react_1.useState)([]),
    conversation = _d[0],
    setConversation = _d[1];
  var _e = (0, react_1.useState)([]),
    suggestions = _e[0],
    setSuggestions = _e[1];
  var _f = (0, react_1.useState)(false),
    isLoading = _f[0],
    setIsLoading = _f[1];
  var _g = (0, react_1.useState)(null),
    error = _g[0],
    setError = _g[1];
  var conversationEndRef = (0, react_1.useRef)(null);
  var recognitionRef = (0, react_1.useRef)(null);
  // Initialize speech recognition
  (0, react_1.useEffect)(function () {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      var SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        setCommand(transcript);
        handleVoiceCommand(transcript);
      };
      recognitionRef.current.onerror = function (event) {
        console.error("Speech recognition error", event);
        setIsListening(false);
        setError("Error recognizing speech. Please try again.");
      };
      recognitionRef.current.onend = function () {
        setIsListening(false);
      };
    }
    // Add welcome message
    setConversation([
      {
        text: "Hello! I'm JASON, your AI assistant with emotional intelligence. How can I help you today?",
        isUser: false,
        emotion: EmotionType.HAPPY,
        timestamp: new Date(),
      },
    ]);
    // Set initial suggestions
    setSuggestions([
      "Turn on the living room lights",
      "What's the weather like today?",
      "Play some relaxing music",
      "Set a timer for 10 minutes",
      "Tell me a joke",
    ]);
    return function () {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  // Scroll to bottom of conversation
  (0, react_1.useEffect)(
    function () {
      if (conversationEndRef.current) {
        conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    },
    [conversation],
  );
  // Toggle speech recognition
  var toggleListening = function () {
    var _a, _b;
    if (isListening) {
      (_a = recognitionRef.current) === null || _a === void 0
        ? void 0
        : _a.abort();
      setIsListening(false);
    } else {
      try {
        (_b = recognitionRef.current) === null || _b === void 0
          ? void 0
          : _b.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error("Error starting speech recognition", err);
        setError("Could not start speech recognition. Please try again.");
      }
    }
  };
  // Handle voice command
  var handleVoiceCommand = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args_1[_i] = arguments[_i];
    }
    return __awaiter(
      void 0,
      __spreadArray([], args_1, true),
      void 0,
      function (text) {
        var voiceCommand, response_1, utterance, err_1;
        if (text === void 0) {
          text = command;
        }
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (!text.trim()) return [2 /*return*/];
              // Add user message to conversation
              setConversation(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [
                    {
                      text: text,
                      isUser: true,
                      emotion: emotion,
                      timestamp: new Date(),
                    },
                  ],
                  false,
                );
              });
              setIsLoading(true);
              setError(null);
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, 4, 5]);
              voiceCommand = {
                text: text,
                emotion: emotion,
                confidence: 0.9,
                userId: "user-1", // In a real app, this would be the actual user ID
                deviceId: undefined, // In a real app, this might be set based on context
              };
              return [
                4 /*yield*/,
                axios_1.default.post(
                  "/api/voice-assistant/jason",
                  voiceCommand,
                ),
              ];
            case 2:
              response_1 = _a.sent();
              // Add assistant response to conversation
              setConversation(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [
                    {
                      text: response_1.data.response,
                      isUser: false,
                      emotion: response_1.data.emotion,
                      timestamp: new Date(),
                    },
                  ],
                  false,
                );
              });
              // Update suggestions
              if (
                response_1.data.suggestions &&
                response_1.data.suggestions.length > 0
              ) {
                setSuggestions(response_1.data.suggestions);
              }
              // Speak response if speech synthesis is available
              if ("speechSynthesis" in window && response_1.data.ssml) {
                utterance = new SpeechSynthesisUtterance(
                  response_1.data.response,
                );
                window.speechSynthesis.speak(utterance);
              }
              return [3 /*break*/, 5];
            case 3:
              err_1 = _a.sent();
              console.error("Error sending voice command", err_1);
              setError("Error processing your command. Please try again.");
              // Add error message to conversation
              setConversation(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [
                    {
                      text: "Sorry, I encountered an error processing your request. Please try again.",
                      isUser: false,
                      emotion: EmotionType.FRUSTRATED,
                      timestamp: new Date(),
                    },
                  ],
                  false,
                );
              });
              return [3 /*break*/, 5];
            case 4:
              setIsLoading(false);
              setCommand("");
              return [7 /*endfinally*/];
            case 5:
              return [2 /*return*/];
          }
        });
      },
    );
  };
  // Handle suggestion click
  var handleSuggestionClick = function (suggestion) {
    setCommand(suggestion);
    handleVoiceCommand(suggestion);
  };
  // Get emotion icon
  var getEmotionIcon = function (emotion) {
    if (emotion === void 0) {
      emotion = EmotionType.NEUTRAL;
    }
    switch (emotion) {
      case EmotionType.HAPPY:
        return "😊";
      case EmotionType.SAD:
        return "😢";
      case EmotionType.ANGRY:
        return "😠";
      case EmotionType.FRUSTRATED:
        return "😤";
      case EmotionType.CONFUSED:
        return "😕";
      case EmotionType.EXCITED:
        return "😃";
      case EmotionType.TIRED:
        return "😴";
      case EmotionType.URGENT:
        return "⚠️";
      default:
        return "😐";
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          JASON Voice Assistant
        </h2>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-600">Current emotion:</span>
          <select
            value={emotion}
            onChange={function (e) {
              return setEmotion(e.target.value);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {Object.values(EmotionType).map(function (e) {
              return (
                <option key={e} value={e}>
                  {getEmotionIcon(e)} {e}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Conversation area */}
      <div className="bg-gray-100 rounded-lg p-3 h-80 overflow-y-auto mb-4">
        {conversation.map(function (message, index) {
          return (
            <div
              key={index}
              className={"mb-2 ".concat(
                message.isUser ? "text-right" : "text-left",
              )}
            >
              <div
                className={"inline-block rounded-lg px-3 py-2 max-w-xs ".concat(
                  message.isUser
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-800 border",
                )}
              >
                <div className="flex items-center mb-1">
                  <span className="mr-1">
                    {getEmotionIcon(message.emotion)}
                  </span>
                  <span className="text-xs opacity-75">
                    {message.isUser ? "You" : "JASON"} •{" "}
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p>{message.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={conversationEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
      )}

      {/* Input area */}
      <div className="flex mb-4">
        <input
          type="text"
          value={command}
          onChange={function (e) {
            return setCommand(e.target.value);
          }}
          placeholder="Type your command..."
          className="flex-grow border rounded-l px-3 py-2"
          onKeyPress={function (e) {
            if (e.key === "Enter") {
              handleVoiceCommand();
            }
          }}
          disabled={isLoading}
        />
        <button
          onClick={function () {
            return handleVoiceCommand();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 transition"
          disabled={isLoading || !command.trim()}
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
        <button
          onClick={toggleListening}
          className={"ml-2 px-4 py-2 rounded ".concat(
            isListening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600",
            " text-white transition",
          )}
          disabled={isLoading}
        >
          {isListening ? "Stop" : "Listen"}
        </button>
      </div>

      {/* Suggestions */}
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions:</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(function (suggestion, index) {
            return (
              <button
                key={index}
                onClick={function () {
                  return handleSuggestionClick(suggestion);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded-full transition"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>
          This voice assistant uses emotional intelligence to adapt responses
          based on your emotional state. Try changing the emotion and see how
          responses change!
        </p>
      </div>
    </div>
  );
};
exports.default = VoiceAssistantPanel;

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
exports.default = CommandConsole;
var react_1 = require("react");
var wouter_1 = require("wouter");
var HeaderComponent_1 = require("@/components/HeaderComponent");
var FooterComponent_1 = require("@/components/FooterComponent");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var separator_1 = require("@/components/ui/separator");
var card_1 = require("@/components/ui/card");
var socket_1 = require("@/lib/socket");
var queryClient_1 = require("@/lib/queryClient");
var lucide_react_1 = require("lucide-react");
function CommandConsole() {
  var _this = this;
  var _a = (0, react_1.useState)([]),
    messages = _a[0],
    setMessages = _a[1];
  var _b = (0, react_1.useState)(""),
    command = _b[0],
    setCommand = _b[1];
  var _c = (0, react_1.useState)([]),
    suggestions = _c[0],
    setSuggestions = _c[1];
  var _d = (0, react_1.useState)(false),
    isProcessing = _d[0],
    setIsProcessing = _d[1];
  var messagesEndRef = (0, react_1.useRef)(null);
  // Connect to WebSocket for real-time communication
  var _e = (0, socket_1.useWebSocket)("/ws", {}),
    data = _e.data,
    sendMessage = _e.sendMessage,
    isConnected = _e.isConnected;
  // Add welcome message
  (0, react_1.useEffect)(function () {
    var welcomeMessage = {
      id: "welcome",
      text: "Welcome to JASON Command Console. Type 'help' for available commands.",
      type: "system",
      timestamp: new Date(),
    };
    var systemMessage = {
      id: "system-status",
      text: "System online. Network scan complete. Found 2 Alexa devices.",
      type: "system",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage, systemMessage]);
  }, []);
  // Process WebSocket messages
  (0, react_1.useEffect)(
    function () {
      if (data && Object.keys(data).length > 0) {
        if (data.type === "console_message") {
          addMessage(data.text, data.messageType || "system");
        }
      }
    },
    [data],
  );
  // Auto-scroll to bottom when messages change
  (0, react_1.useEffect)(
    function () {
      var _a;
      (_a = messagesEndRef.current) === null || _a === void 0
        ? void 0
        : _a.scrollIntoView({ behavior: "smooth" });
    },
    [messages],
  );
  // Add a message to the console
  var addMessage = function (text, type) {
    var newMessage = {
      id: Date.now().toString(),
      text: text,
      type: type,
      timestamp: new Date(),
    };
    setMessages(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), [newMessage], false);
    });
  };
  // Handle command submission
  var handleSubmit = function (e) {
    return __awaiter(_this, void 0, void 0, function () {
      var response, result, settingsLink, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            e.preventDefault();
            if (!command.trim()) return [2 /*return*/];
            // Add user command to console
            addMessage(command, "user");
            setIsProcessing(true);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, 5, 6]);
            return [
              4 /*yield*/,
              (0, queryClient_1.apiRequest)("POST", "/api/command", {
                command: command,
              }),
            ];
          case 2:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 3:
            result = _a.sent();
            if (!result.success) {
              // Check for Amazon authentication errors
              if (
                result.error &&
                result.error.includes("Amazon credentials not configured")
              ) {
                addMessage(
                  "Error: Amazon Alexa credentials not configured",
                  "error",
                );
                addMessage(
                  "Please go to Settings → Integrations and provide your Amazon credentials",
                  "warning",
                );
                settingsLink = "Click here to configure Amazon credentials";
                addMessage(
                  '<a href="/settings" class="text-[#00FFFF] underline">'.concat(
                    settingsLink,
                    "</a>",
                  ),
                  "system",
                );
              } else {
                // Other errors
                addMessage(
                  result.error || "Command failed to execute",
                  "error",
                );
              }
            } else {
              // Add success response to console
              addMessage(result.result || "Command processed", "success");
            }
            // Update suggestions
            if (result.suggestions && Array.isArray(result.suggestions)) {
              setSuggestions(result.suggestions);
            }
            // If connected to WebSocket, also broadcast command
            if (isConnected) {
              sendMessage({
                type: "command",
                command: command,
              });
            }
            return [3 /*break*/, 6];
          case 4:
            error_1 = _a.sent();
            console.error("Error processing command:", error_1);
            addMessage("Error processing command. Please try again.", "error");
            return [3 /*break*/, 6];
          case 5:
            setIsProcessing(false);
            setCommand(""); // Clear input
            return [7 /*endfinally*/];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  // Apply a suggestion
  var applySuggestion = function (suggestion) {
    var _a;
    setCommand(suggestion);
    // Focus the input
    (_a = document.getElementById("commandInput")) === null || _a === void 0
      ? void 0
      : _a.focus();
  };
  // Get icon for message type
  var getMessageIcon = function (type) {
    switch (type) {
      case "system":
        return <lucide_react_1.Terminal className="h-4 w-4 text-[#00FFFF]" />;
      case "warning":
        return (
          <lucide_react_1.AlertCircle className="h-4 w-4 text-[#FF3300]" />
        );
      case "success":
        return (
          <lucide_react_1.CheckCircle className="h-4 w-4 text-[#00FF00]" />
        );
      case "error":
        return (
          <lucide_react_1.AlertCircle className="h-4 w-4 text-[#FF0066]" />
        );
      case "user":
        return <lucide_react_1.Send className="h-4 w-4 text-white" />;
      default:
        return <lucide_react_1.InfoIcon className="h-4 w-4 text-gray-400" />;
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent_1.default />

      <main className="flex flex-col px-4 py-6 flex-grow">
        <div className="container mx-auto mb-6">
          <div className="flex items-center mb-4">
            <h1 className="text-3xl font-bold text-[#00FFFF]">
              Command Console
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2">
              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30 h-full">
                <card_1.CardContent className="p-0">
                  <div className="bg-[#0D1117] py-2 px-4 border-b border-[#00FFFF]/30 text-xs font-mono text-gray-400">
                    JASON OS v1.0 / Command Line Interface /{" "}
                    {new Date().toLocaleDateString()}
                  </div>

                  <div className="p-4 font-mono text-sm h-[60vh] overflow-y-auto">
                    {messages.map(function (message) {
                      return (
                        <div
                          key={message.id}
                          className={"mb-3 ".concat(
                            message.type === "user" ? "pl-0" : "pl-6",
                          )}
                        >
                          <div className="flex items-start">
                            {message.type === "user" ? (
                              <span className="text-white font-bold">$ </span>
                            ) : (
                              <span className="mr-2 mt-1">
                                {getMessageIcon(message.type)}
                              </span>
                            )}

                            <div className="flex-1">
                              <p
                                className={
                                  message.type === "system"
                                    ? "text-gray-300"
                                    : message.type === "warning"
                                      ? "text-[#FF3300]"
                                      : message.type === "success"
                                        ? "text-[#00FF00]"
                                        : message.type === "error"
                                          ? "text-[#FF0066]"
                                          : "text-white"
                                }
                              >
                                {message.text}
                              </p>

                              <div className="text-xs text-gray-500 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </card_1.CardContent>

                <card_1.CardFooter className="border-t border-[#00FFFF]/30 p-4">
                  <form
                    onSubmit={handleSubmit}
                    className="w-full flex space-x-2"
                  >
                    <input_1.Input
                      id="commandInput"
                      type="text"
                      value={command}
                      onChange={function (e) {
                        return setCommand(e.target.value);
                      }}
                      placeholder="Type a command, e.g. 'help'"
                      className="flex-1 bg-[#0D1117] border-[#00FFFF]/30 text-white font-mono focus:border-[#00FFFF]"
                    />
                    <button_1.Button
                      type="submit"
                      className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black flex items-center"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <lucide_react_1.Send className="mr-2 h-4 w-4" />
                      )}
                      Send
                    </button_1.Button>
                  </form>
                </card_1.CardFooter>
              </card_1.Card>
            </div>

            <div>
              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30">
                <card_1.CardContent className="p-4">
                  <h2 className="text-xl font-bold text-white mb-3">
                    Command Guide
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[#00FFFF] font-medium mb-2">
                        System Commands
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                        <li>
                          <span className="text-white font-mono">help</span> -
                          Show available commands
                        </li>
                        <li>
                          <span className="text-white font-mono">status</span> -
                          Check system status
                        </li>
                        <li>
                          <span className="text-white font-mono">scan</span> -
                          Scan network for devices
                        </li>
                        <li>
                          <span className="text-white font-mono">devices</span>{" "}
                          - List discovered devices
                        </li>
                      </ul>
                    </div>

                    <separator_1.Separator className="bg-[#00FFFF]/10" />

                    <div>
                      <h3 className="text-[#00FFFF] font-medium mb-2">
                        Device Control
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                        <li>
                          <span className="text-white font-mono">
                            turn on [device]
                          </span>{" "}
                          - Turn on a device
                        </li>
                        <li>
                          <span className="text-white font-mono">
                            turn off [device]
                          </span>{" "}
                          - Turn off a device
                        </li>
                        <li>
                          <span className="text-white font-mono">
                            find [type]
                          </span>{" "}
                          - Find devices by type
                        </li>
                      </ul>
                    </div>

                    <separator_1.Separator className="bg-[#00FFFF]/10" />

                    <div>
                      <h3 className="text-[#00FFFF] font-medium mb-2">
                        Alexa Control
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                        <li>
                          <span className="text-white font-mono">
                            alexa [device] [command]
                          </span>{" "}
                          - Send command to Alexa
                        </li>
                        <li>Examples:</li>
                        <li className="ml-4 text-xs">
                          <span className="text-white font-mono">
                            alexa kitchen play music
                          </span>
                        </li>
                        <li className="ml-4 text-xs">
                          <span className="text-white font-mono">
                            alexa living room volume 50
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {suggestions.length > 0 && (
                    <>
                      <separator_1.Separator className="bg-[#00FFFF]/10 my-4" />

                      <div>
                        <h3 className="text-[#00FFFF] font-medium mb-2">
                          Suggestions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map(function (suggestion, index) {
                            return (
                              <button_1.Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="border-[#00FFFF]/30 text-white hover:bg-[#00FFFF]/10 hover:text-white"
                                onClick={function () {
                                  return applySuggestion(suggestion);
                                }}
                              >
                                {suggestion}
                              </button_1.Button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30 mt-4">
                <card_1.CardContent className="p-4">
                  <h2 className="text-xl font-bold text-white mb-3">
                    Quick Links
                  </h2>

                  <div className="space-y-2">
                    <wouter_1.Link href="/devices">
                      <a className="flex items-center text-gray-300 hover:text-[#00FFFF]">
                        <span className="mr-2">→</span>
                        <span>View All Devices</span>
                      </a>
                    </wouter_1.Link>

                    <wouter_1.Link href="/settings">
                      <a className="flex items-center text-gray-300 hover:text-[#00FFFF]">
                        <span className="mr-2">→</span>
                        <span>Configure Settings</span>
                      </a>
                    </wouter_1.Link>

                    <wouter_1.Link href="/">
                      <a className="flex items-center text-gray-300 hover:text-[#00FFFF]">
                        <span className="mr-2">→</span>
                        <span>Return to Dashboard</span>
                      </a>
                    </wouter_1.Link>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </div>
          </div>
        </div>
      </main>

      <FooterComponent_1.default />
    </div>
  );
}

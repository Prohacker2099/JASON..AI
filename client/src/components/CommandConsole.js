"use strict";
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
function CommandConsole(_a) {
  var initialMessages = _a.initialMessages,
    onSendCommand = _a.onSendCommand;
  var _b = (0, react_1.useState)(initialMessages),
    messages = _b[0],
    setMessages = _b[1];
  var _c = (0, react_1.useState)(""),
    command = _c[0],
    setCommand = _c[1];
  var _d = (0, react_1.useState)(false),
    isTyping = _d[0],
    setIsTyping = _d[1];
  var messagesRef = (0, react_1.useRef)(null);
  (0, react_1.useEffect)(
    function () {
      // Scroll to bottom when messages change
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    },
    [messages],
  );
  var handleClear = function () {
    setMessages([]);
  };
  var handleSubmit = function (e) {
    e.preventDefault();
    if (!command.trim()) return;
    var newMessage = {
      id: Date.now().toString(),
      text: "> ".concat(command),
      type: "user",
      timestamp: new Date(),
    };
    setMessages(
      __spreadArray(__spreadArray([], messages, true), [newMessage], false),
    );
    onSendCommand(command);
    setCommand("");
  };
  var getMessageColor = function (type) {
    switch (type) {
      case "user":
        return "text-[#00FFFF]";
      case "warning":
        return "text-[#FF3300]";
      case "success":
        return "text-[#00FF00]";
      case "error":
        return "text-[#FF3300]";
      default:
        return "text-gray-400";
    }
  };
  return (
    <div className="bg-[#0D1117] rounded-lg border border-[#1A1A1A] p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-[#00FFFF]">Command Console</h3>
        <div className="flex space-x-2">
          <button
            className="text-xs text-gray-400 hover:text-white"
            onClick={handleClear}
          >
            Clear
          </button>
          <button className="text-xs text-gray-400 hover:text-white">
            History
          </button>
        </div>
      </div>

      <div
        ref={messagesRef}
        className="font-['JetBrains_Mono'] text-sm h-60 overflow-y-auto mb-3 bg-[#1A1A1A]/20 p-3 rounded"
      >
        {messages.map(function (msg) {
          return (
            <p key={msg.id} className={getMessageColor(msg.type)}>
              {msg.text}
            </p>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-[#1A1A1A]/40 rounded-lg p-2"
      >
        <span className="text-[#00FFFF] mr-2">{">"}</span>
        <input
          type="text"
          value={command}
          onChange={function (e) {
            return setCommand(e.target.value);
          }}
          className="bg-transparent text-white font-['JetBrains_Mono'] text-sm flex-1 outline-none border-none"
          placeholder="Enter command..."
        />
      </form>
    </div>
  );
}

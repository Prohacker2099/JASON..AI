"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = void 0;
var react_1 = require("react");
var useWebSocket = function (token) {
  var _a = (0, react_1.useState)(false),
    connected = _a[0],
    setConnected = _a[1];
  var _b = (0, react_1.useState)(null),
    ws = _b[0],
    setWs = _b[1];
  var connect = (0, react_1.useCallback)(
    function () {
      var socket = new WebSocket("ws://localhost:3001?token=".concat(token));
      socket.onopen = function () {
        setConnected(true);
        console.log("WebSocket connected");
      };
      socket.onclose = function () {
        setConnected(false);
        console.log("WebSocket disconnected");
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
      socket.onerror = function (error) {
        console.error("WebSocket error:", error);
      };
      setWs(socket);
      return function () {
        socket.close();
      };
    },
    [token],
  );
  (0, react_1.useEffect)(
    function () {
      var cleanup = connect();
      return cleanup;
    },
    [connect],
  );
  var subscribe = (0, react_1.useCallback)(
    function (onDeviceUpdate, onAutomationEvent, onError) {
      if (!ws) return;
      ws.onmessage = function (event) {
        try {
          var message = JSON.parse(event.data);
          switch (message.type) {
            case "deviceUpdate":
              onDeviceUpdate(message.payload.device);
              break;
            case "automation":
              onAutomationEvent(message.payload);
              break;
            case "error":
              onError(message.payload);
              break;
            default:
              console.warn("Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
    },
    [ws],
  );
  var sendMessage = (0, react_1.useCallback)(
    function (message) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not connected");
      }
    },
    [ws],
  );
  return {
    connected: connected,
    subscribe: subscribe,
    sendMessage: sendMessage,
  };
};
exports.useWebSocket = useWebSocket;

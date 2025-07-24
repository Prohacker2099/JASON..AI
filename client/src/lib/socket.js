"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = useWebSocket;
var react_1 = require("react");
function useWebSocket(url, initialData) {
  var _a = (0, react_1.useState)(null),
    socket = _a[0],
    setSocket = _a[1];
  var _b = (0, react_1.useState)(initialData),
    data = _b[0],
    setData = _b[1];
  var _c = (0, react_1.useState)(false),
    isConnected = _c[0],
    setIsConnected = _c[1];
  var _d = (0, react_1.useState)(null),
    error = _d[0],
    setError = _d[1];
  (0, react_1.useEffect)(
    function () {
      var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      var wsUrl = "".concat(protocol, "//").concat(window.location.host, "/ws");
      var ws = new WebSocket(wsUrl);
      ws.onopen = function () {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError(null);
      };
      ws.onmessage = function (event) {
        try {
          var parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };
      ws.onerror = function (event) {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error");
      };
      ws.onclose = function () {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      };
      setSocket(ws);
      // Cleanup on unmount
      return function () {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    },
    [url],
  );
  var sendMessage = (0, react_1.useCallback)(
    function (message) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.error("WebSocket is not connected");
      }
    },
    [socket],
  );
  return {
    data: data,
    sendMessage: sendMessage,
    isConnected: isConnected,
    error: error,
  };
}

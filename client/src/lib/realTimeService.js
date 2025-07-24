"use strict";
/**
 * Real-Time Service
 *
 * This service provides real-time updates from the server using WebSockets.
 * It connects to the JASON server's WebSocket endpoint and provides
 * event-based updates for various components.
 */
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null",
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var use_toast_1 = require("../components/ui/use-toast");
var RealTimeService = /** @class */ (function (_super) {
  __extends(RealTimeService, _super);
  function RealTimeService() {
    var _this = _super.call(this) || this;
    _this.socket = null;
    _this.reconnectAttempts = 0;
    _this.maxReconnectAttempts = 5;
    _this.reconnectTimeout = 2000; // Start with 2 seconds
    _this.reconnectTimer = null;
    _this.isConnecting = false;
    _this.connect();
    return _this;
  }
  /**
   * Connect to the WebSocket server
   */
  RealTimeService.prototype.connect = function () {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;
    // Determine the WebSocket URL based on the current environment
    var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    var host = window.location.host;
    var wsUrl = "".concat(protocol, "//").concat(host, "/api/ws");
    try {
      this.socket = new WebSocket(wsUrl);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  };
  /**
   * Handle WebSocket open event
   */
  RealTimeService.prototype.handleOpen = function () {
    console.log("WebSocket connection established");
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 2000; // Reset timeout
    // Send authentication if needed
    if (localStorage.getItem("auth_token")) {
      this.sendMessage({
        type: "authenticate",
        token: localStorage.getItem("auth_token"),
      });
    }
    // Emit connected event
    this.emit("connected");
  };
  /**
   * Handle WebSocket message event
   */
  RealTimeService.prototype.handleMessage = function (event) {
    try {
      var data = JSON.parse(event.data);
      // Handle different message types
      switch (data.type) {
        case "device_discovered":
          this.emit("deviceDiscovered", data.device);
          (0, use_toast_1.toast)({
            title: "Device Discovered",
            description: "Found: ".concat(
              data.device.friendlyName || data.device.id,
            ),
          });
          break;
        case "device_state_changed":
          this.emit("deviceStateChanged", data);
          break;
        case "pattern_detected":
          this.emit("patternDetected", data.pattern);
          (0, use_toast_1.toast)({
            title: "Pattern Detected",
            description: data.pattern.description,
          });
          break;
        case "firmware_update_progress":
          this.emit("firmwareUpdateProgress", data);
          break;
        case "error":
          console.error("WebSocket error:", data.message);
          (0, use_toast_1.toast)({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          break;
        default:
          // Forward all other events
          this.emit(data.type, data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error, event.data);
    }
  };
  /**
   * Handle WebSocket close event
   */
  RealTimeService.prototype.handleClose = function (event) {
    console.log(
      "WebSocket connection closed: "
        .concat(event.code, " ")
        .concat(event.reason),
    );
    this.socket = null;
    this.isConnecting = false;
    // Emit disconnected event
    this.emit("disconnected", { code: event.code, reason: event.reason });
    // Try to reconnect if not closed cleanly
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  };
  /**
   * Handle WebSocket error event
   */
  RealTimeService.prototype.handleError = function (event) {
    console.error("WebSocket error:", event);
    this.isConnecting = false;
    // Emit error event
    this.emit("error", event);
  };
  /**
   * Schedule a reconnection attempt
   */
  RealTimeService.prototype.scheduleReconnect = function () {
    var _this = this;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      var timeout =
        this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(
        "Scheduling reconnect attempt "
          .concat(this.reconnectAttempts, " in ")
          .concat(timeout, "ms"),
      );
      this.reconnectTimer = setTimeout(function () {
        console.log(
          "Attempting to reconnect ("
            .concat(_this.reconnectAttempts, "/")
            .concat(_this.maxReconnectAttempts, ")"),
        );
        _this.connect();
      }, timeout);
    } else {
      console.error(
        "Failed to reconnect after ".concat(
          this.maxReconnectAttempts,
          " attempts",
        ),
      );
      this.emit("reconnectFailed");
      (0, use_toast_1.toast)({
        title: "Connection Lost",
        description:
          "Failed to reconnect to the server. Please refresh the page.",
        variant: "destructive",
      });
    }
  };
  /**
   * Send a message to the WebSocket server
   */
  RealTimeService.prototype.sendMessage = function (message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message, WebSocket is not connected");
      return false;
    }
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
  };
  /**
   * Subscribe to device updates
   */
  RealTimeService.prototype.subscribeToDevice = function (deviceId) {
    return this.sendMessage({
      type: "subscribe",
      target: "device",
      id: deviceId,
    });
  };
  /**
   * Unsubscribe from device updates
   */
  RealTimeService.prototype.unsubscribeFromDevice = function (deviceId) {
    return this.sendMessage({
      type: "unsubscribe",
      target: "device",
      id: deviceId,
    });
  };
  /**
   * Subscribe to AI pattern updates
   */
  RealTimeService.prototype.subscribeToPatterns = function () {
    return this.sendMessage({
      type: "subscribe",
      target: "patterns",
    });
  };
  /**
   * Subscribe to firmware updates for a device
   */
  RealTimeService.prototype.subscribeToFirmwareUpdates = function (deviceId) {
    return this.sendMessage({
      type: "subscribe",
      target: "firmware",
      id: deviceId,
    });
  };
  /**
   * Close the WebSocket connection
   */
  RealTimeService.prototype.disconnect = function () {
    if (this.socket) {
      this.socket.close(1000, "Client disconnected");
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  };
  return RealTimeService;
})(events_1.EventEmitter);
// Create a singleton instance
var realTimeService = new RealTimeService();
exports.default = realTimeService;

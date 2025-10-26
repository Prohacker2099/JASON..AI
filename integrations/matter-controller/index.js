"use strict";
 (function (_super) {
  __extends(MatterController, _super);
  function MatterController() {
    var _this =
      _super.call(this, "matter", "1.0.0", [
        "light",
        "switch",
        "sensor",
        "thermostat",
        "lock",
        "fan",
        "outlet",
        "window_covering",
        "door",
        "air_purifier",
        "dishwasher",
        "refrigerator",
        "washer",
        "dryer",
        "television",
      ]) || this;
    _this.connected = false;
    _this. = config.;
    _this.matterClient = null;
    _this.commissionedDevices = new Map();
    _this.fabricId = "";
    _this.threadNetworkCredentials = null;
    _this.displayName = "Matter";
    _this.description = "Controller for Matter-compatible devices";
    logger.info("Matter Controller initialized");
    return _this;
  }
  , true];
          }
          
      return __generator(this, function (_a) {
        try {
          if (this.) {
            logger.info(
              "[] Commissioning device with setup code: ".concat(setupCode),
            );
             = this.createMockDevice(
              "matter--".concat(Date.now()),
            );
            this.devices.set(.id, );
            return [2 , null];
        } catch (error) {
          logger.error("Error commissioning Matter device:", error);
          return [2 , this.createMockDevices()];
            }
            
            result = this.controlMockDevice(device, command);
            if (!result.success) {
              throw new Error(result.error);
            }
            return [2 
  MatterController.prototype.determineDeviceType = function (matterDevice) {
    
   */
  MatterController.prototype.createMockDevice = function (id) {
    return {
      id: id,
      name: "Matter  Device ".concat(id.split("-").pop()),
      type: "light",
      manufacturer: "Matter ",
      model: "Smart Bulb",
      firmwareVersion: "1.0.0",
      capabilities: ["on", "brightness", "color"],
      state: {
        on: false,
        brightness: 100,
        color: { hue: 0, saturation: 0, value: 100 },
      },
      connected: true,
      address: "00:11:22:33:44:".concat(Math.floor(Math.random() * 100)),
      room: "Living Room",
    };
  };
  
  MatterController.prototype.createMockDevices = function () {
    var _this = this;
    var  = [
      {
        id: "matter-light-1",
        name: "Matter Living Room Light",
        type: "light",
        manufacturer: "Matter ",
        model: "Smart Bulb",
        firmwareVersion: "1.0.0",
        capabilities: ["on", "brightness", "color"],
        state: {
          on: false,
          brightness: 100,
          color: { hue: 0, saturation: 0, value: 100 },
        },
        connected: true,
        address: "00:11:22:33:44:55",
        room: "Living Room",
      },
      {
        id: "matter-switch-1",
        name: "Matter Kitchen Switch",
        type: "switch",
        manufacturer: "Matter ",
        model: "Smart Switch",
        firmwareVersion: "1.0.0",
        capabilities: ["on"],
        state: { on: false },
        connected: true,
        address: "00:11:22:33:44:56",
        room: "Kitchen",
      },
      {
        id: "matter-thermostat-1",
        name: "Matter Bedroom Thermostat",
        type: "thermostat",
        manufacturer: "Matter ",
        model: "Smart Thermostat",
        firmwareVersion: "1.0.0",
        capabilities: ["temperature", "humidity", "heating", "cooling"],
        state: {
          temperature: 22,
          humidity: 45,
          mode: "auto",
          targetTemperature: 21,
        },
        connected: true,
        address: "00:11:22:33:44:57",
        room: "Bedroom",
      },
      {
        id: "matter-lock-1",
        name: "Matter Front Door Lock",
        type: "lock",
        manufacturer: "Matter ",
        model: "Smart Lock",
        firmwareVersion: "1.0.0",
        capabilities: ["lock"],
        state: { locked: true, battery: 85 },
        connected: true,
        address: "00:11:22:33:44:58",
        room: "Entrance",
      },
      {
        id: "matter-sensor-1",
        name: "Matter Motion Sensor",
        type: "sensor",
        manufacturer: "Matter ",
        model: "Motion Sensor",
        firmwareVersion: "1.0.0",
        capabilities: ["motion", "temperature", "battery"],
        state: { motion: false, temperature: 23.5, battery: 90 },
        connected: true,
        address: "00:11:22:33:44:59",
        room: "Hallway",
      },
    ];
    
      _this.devices.set(device.id, device);
    });
    return ;
  };
  
  MatterController.prototype.controlMockDevice = function (device, command) {
    switch (command.type) {
      case "power":
        device.state.on = command.params.value === true;
        break;
      case "brightness":
        if (device.capabilities.includes("brightness")) {
          device.state.brightness = Math.min(
            100,
            Math.max(0, command.params.value),
          );
        } else {
          return {
            success: false,
            error: "Device does not support brightness control",
          };
        }
        break;
      case "color":
        if (device.capabilities.includes("color") && command.params.color) {
          device.state.color = {
            hue: command.params.color.h || 0,
            saturation: command.params.color.s || 0,
            value: command.params.color.v || 100,
          };
        } else {
          return {
            success: false,
            error: "Device does not support color control",
          };
        }
        break;
      case "temperature":
        if (device.capabilities.includes("temperature")) {
          device.state.targetTemperature = command.params.value;
        } else {
          return {
            success: false,
            error: "Device does not support temperature control",
          };
        }
        break;
      case "lock":
        if (device.capabilities.includes("lock")) {
          device.state.locked = command.params.value === true;
        } else {
          return {
            success: false,
            error: "Device does not support lock control",
          };
        }
        break;
      case "mode":
        if (
          device.capabilities.includes("heating") ||
          device.capabilities.includes("cooling")
        ) {
          device.state.mode = command.params.value;
        } else {
          return {
            success: false,
            error: "Device does not support mode control",
          };
        }
        break;
      default:
        return {
          success: false,
          error: "Unsupported command type: ".concat(command.type),
        };
    }
    
          return [
            2 /*return*/,
            {
              channel: 15,
              panId: "0x1234",
              extendedPanId: "0x1122334455667788",
              networkKey: "00112233445566778899AABBCCDDEEFF",
              networkName: "JASON-Thread-Network",
              pskc: "00112233445566778899AABBCCDDEEFF",
              activeTimestamp: Date.now(),
            },
          ];
        }
        return [2 /*return*/, this.threadNetworkCredentials];
      });
    });
  };
  return MatterController;
})(BaseDevicePlugin_js_1.BaseDevicePlugin);
// Create and export singleton instance
var matterController = new MatterController();
exports.default = matterController;

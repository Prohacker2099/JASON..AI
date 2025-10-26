"use strict";

  HomeKitBridge.prototype.initialize = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        try {
          if (this.) {
            logger.info("HomeKit Bridge running in  mode");
            return [2 , true];
          }
          
            logger.info(
              "[] Removed device from HomeKit: ".concat(deviceId),
            );
            return [2 , true];
          }
          // In a real implementation, we would update the accessory's characteristics
          // For example:
          // const accessory = this.accessories.get(deviceId);
          // if (accessory) {
          //   const device = this.devices.get(deviceId);
          //   if (!device) return false;
          //
          //   switch (device.type) {
          //     case 'light':
          //       this.updateLightState(accessory, state);
          //       break;
          //     case 'switch':
          //       this.updateSwitchState(accessory, state);
          //       break;
          //     // Add more device types as needed
          //   }
          // }
          logger.info("Updated device state in HomeKit: ".concat(deviceId));
          return [2 /*return*/, true];
        } catch (error) {
          logger.error(
            "Error updating device state in HomeKit: ".concat(deviceId),
            error,
          );
          return [2 /*return*/, false];
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Configure a light accessory
   */
  HomeKitBridge.prototype.configureLight = function (accessory, device) {
    // In a real implementation, we would configure the light service
    // For example:
    // const service = accessory.addService(Service.Lightbulb, device.name);
    //
    // // Add On/Off characteristic
    // service.getCharacteristic(Characteristic.On)
    //   .on('get', callback => {
    //     callback(null, device.state.on);
    //   })
    //   .on('set', (value, callback) => {
    //     this.emit('command', {
    //       deviceId: device.id,
    //       command: {
    //         type: 'power',
    //         params: { value: value as boolean }
    //       }
    //     });
    //     callback();
    //   });
    //
    // // Add Brightness characteristic if supported
    // if (device.capabilities.includes('brightness')) {
    //   service.addCharacteristic(Characteristic.Brightness)
    //     .on('get', callback => {
    //       callback(null, device.state.brightness);
    //     })
    //     .on('set', (value, callback) => {
    //       this.emit('command', {
    //         deviceId: device.id,
    //         command: {
    //           type: 'brightness',
    //           params: { value: value as number }
    //         }
    //       });
    //       callback();
    //     });
    // }
    //
    // // Add Color Temperature characteristic if supported
    // if (device.capabilities.includes('color_temperature')) {
    //   service.addCharacteristic(Characteristic.ColorTemperature)
    //     .on('get', callback => {
    //       // Convert from Kelvin to HomeKit scale
    //       const homekitValue = this.kelvinToHomeKit(device.state.colorTemperature);
    //       callback(null, homekitValue);
    //     })
    //     .on('set', (value, callback) => {
    //       // Convert from HomeKit scale to Kelvin
    //       const kelvinValue = this.homeKitToKelvin(value as number);
    //       this.emit('command', {
    //         deviceId: device.id,
    //         command: {
    //           type: 'color_temperature',
    //           params: { value: kelvinValue }
    //         }
    //       });
    //       callback();
    //     });
    // }
  };
  /**
   * Configure a switch accessory
   */
  HomeKitBridge.prototype.configureSwitch = function (accessory, device) {
    // In a real implementation, we would configure the switch service
    // For example:
    // const service = accessory.addService(Service.Switch, device.name);
    //
    // // Add On/Off characteristic
    // service.getCharacteristic(Characteristic.On)
    //   .on('get', callback => {
    //     callback(null, device.state.on);
    //   })
    //   .on('set', (value, callback) => {
    //     this.emit('command', {
    //       deviceId: device.id,
    //       command: {
    //         type: 'power',
    //         params: { value: value as boolean }
    //       }
    //     });
    //     callback();
    //   });
  };
  /**
   * Update a light accessory's state
   */
  HomeKitBridge.prototype.updateLightState = function (accessory, state) {
    // In a real implementation, we would update the light service characteristics
    // For example:
    // const service = accessory.getService(Service.Lightbulb);
    //
    // if (state.on !== undefined) {
    //   service.updateCharacteristic(Characteristic.On, state.on);
    // }
    //
    // if (state.brightness !== undefined) {
    //   service.updateCharacteristic(Characteristic.Brightness, state.brightness);
    // }
    //
    // if (state.colorTemperature !== undefined) {
    //   const homekitValue = this.kelvinToHomeKit(state.colorTemperature);
    //   service.updateCharacteristic(Characteristic.ColorTemperature, homekitValue);
    // }
  };
  /**
   * Update a switch accessory's state
   */
  HomeKitBridge.prototype.updateSwitchState = function (accessory, state) {
    // In a real implementation, we would update the switch service characteristics
    // For example:
    // const service = accessory.getService(Service.Switch);
    //
    // if (state.on !== undefined) {
    //   service.updateCharacteristic(Characteristic.On, state.on);
    // }
  };
  /**
   * Convert Kelvin color temperature to HomeKit scale (140-500)
   */
  HomeKitBridge.prototype.kelvinToHomeKit = function (kelvin) {
    // HomeKit uses a scale of 140 (coolest) to 500 (warmest)
    // Typical Kelvin range is 2000K (warm) to 6500K (cool)
    // We need to invert the scale and map it to HomeKit's range
    var minKelvin = 2000;
    var maxKelvin = 6500;
    var minHomeKit = 140;
    var maxHomeKit = 500;
    // Clamp the Kelvin value to our expected range
    var clampedKelvin = Math.max(minKelvin, Math.min(maxKelvin, kelvin));
    // Invert and map to HomeKit scale
    // As Kelvin increases (cooler), HomeKit value decreases
    var normalizedValue = (maxKelvin - clampedKelvin) / (maxKelvin - minKelvin);
    return minHomeKit + normalizedValue * (maxHomeKit - minHomeKit);
  };
  /**
   * Convert HomeKit color temperature scale to Kelvin
   */
  HomeKitBridge.prototype.homeKitToKelvin = function (homekitValue) {
    // Convert from HomeKit scale (140-500) to Kelvin (2000K-6500K)
    var minKelvin = 2000;
    var maxKelvin = 6500;
    var minHomeKit = 140;
    var maxHomeKit = 500;
    // Clamp the HomeKit value to the expected range
    var clampedHomeKit = Math.max(
      minHomeKit,
      Math.min(maxHomeKit, homekitValue),
    );
    // Map to Kelvin scale (inverted)
    // As HomeKit value increases (warmer), Kelvin decreases
    var normalizedValue =
      (clampedHomeKit - minHomeKit) / (maxHomeKit - minHomeKit);
    return maxKelvin - normalizedValue * (maxKelvin - minKelvin);
  };
  /**
   * Discover devices (not applicable for HomeKit bridge)
   */
  HomeKitBridge.prototype.discover = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // HomeKit bridge doesn't discover devices, it exposes them
        return [2 /*return*/, []];
      });
    });
  };
  /**
   * Control a device (not applicable for HomeKit bridge)
   */
  HomeKitBridge.prototype.control = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // HomeKit bridge doesn't control devices directly
        throw new Error(
          "HomeKit bridge does not support direct device control",
        );
      });
    });
  };
  return HomeKitBridge;
})(BaseDevicePlugin_1.BaseDevicePlugin);
exports.HomeKitBridge = HomeKitBridge;

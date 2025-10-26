// server/core/device/protocol/ProtocolBridge.ts

import { EventEmitter } from 'events';
import { Device } from '../../../../shared/types/Device'; // Assuming a shared types definition

export abstract class ProtocolBridge extends EventEmitter {
  public abstract readonly protocolName: string;

  constructor() {
    super();
  }

  /**
   * Connects to the protocol-specific hub or network.
   */
  public abstract connect(): Promise<void>;

  /**
   * Disconnects from the protocol-specific hub or network.
   */
  public abstract disconnect(): Promise<void>;

  /**
   * Discovers devices using this protocol.
   * Emits 'deviceDiscovered' event for each new device.
   */
  public abstract discoverDevices(): Promise<void>;

  /**
   * Sends a command to a specific device.
   * @param device The device to send the command to.
   * @param command The command string (e.g., 'turnOn', 'setBrightness').
   * @param payload The payload for the command (e.g., { brightness: 80 }).
   */
  public abstract sendCommand(device: Device, command: string, payload: any): Promise<void>;

  /**
   * Updates the state of a device from the protocol.
   * Emits 'deviceUpdate' event.
   * @param deviceId The ID of the device to update.
   * @param newState The partial new state of the device.
   */
  protected emitDeviceUpdate(device: Device) {
    this.emit('deviceUpdate', device);
  }

  /**
   * Emits a 'deviceDiscovered' event for a new device.
   * @param device The newly discovered device.
   */
  protected emitDeviceDiscovered(device: Device) {
    this.emit('deviceDiscovered', device);
  }
}
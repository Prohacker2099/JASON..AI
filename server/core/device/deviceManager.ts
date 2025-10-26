// server/core/device/DeviceManager.ts

import { EventEmitter } from 'events'; // Import EventEmitter
import { logger } from '../../utils/logger'; // Import logger
import { Device } from '../../../shared/types/Device';
import { ProtocolBridge } from './protocol/ProtocolBridge';
import { DeviceDiscovery } from './DeviceDiscovery';
import { BluetoothService } from './discovery/bluetoothService';
import { MDNSService } from './discovery/mdnsService';
import { WiFiService } from './discovery/wifiService';

class DeviceManager extends EventEmitter { // Extend EventEmitter
  private devices: Map<string, Device> = new Map();
  private protocolBridges: Map<string, ProtocolBridge> = new Map();
  private deviceDiscovery: DeviceDiscovery;

  constructor() {
    super();
    this.deviceDiscovery = new DeviceDiscovery();
    this.initializeDiscovery();
  }

  private initializeDiscovery() {
    this.deviceDiscovery.on('deviceDiscovered', (device: Device) => {
      console.log(`Discovered new device: ${device.name} (${device.id})`);
      this.addDevice(device);
    });
    // Register protocol bridges
    this.registerProtocolBridge(new BluetoothService());
    this.registerProtocolBridge(new MDNSService());
    this.registerProtocolBridge(new WiFiService());

    // Start discovery processes (e.g., mDNS, UPnP)
    this.deviceDiscovery.startDiscovery();
  }

  public addDevice(device: Device) {
    if (!this.devices.has(device.id)) {
      this.devices.set(device.id, device);
      console.log(`Device added: ${device.name}`);
      // Potentially notify connected clients or other services
    }
  }

  public removeDevice(deviceId: string) {
    if (this.devices.has(deviceId)) {
      const device = this.devices.get(deviceId);
      this.devices.delete(deviceId);
      console.log(`Device removed: ${device?.name}`);
      // Potentially notify connected clients
    }
  }

  public getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  public getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  public updateDeviceState(deviceId: string, newState: Partial<Device>) {
    const device = this.devices.get(deviceId);
    if (device) {
      Object.assign(device, newState);
      console.log(`Device ${device.name} updated:`, newState);
      this.emit('deviceStateChange', device); // Emit device state change event
    }
  }

  public registerProtocolBridge(bridge: ProtocolBridge) {
    if (!this.protocolBridges.has(bridge.protocolName)) {
      this.protocolBridges.set(bridge.protocolName, bridge);
      console.log(`Protocol bridge registered: ${bridge.protocolName}`);
      bridge.on('deviceUpdate', (device: Device) => this.updateDeviceState(device.id, device));
      bridge.on('deviceDiscovered', (device: Device) => this.addDevice(device));
    }
  }

  public async sendDeviceCommand(deviceId: string, command: string, payload: any) {
    const device = this.getDevice(deviceId);
    if (!device) {
      console.warn(`Device ${deviceId} not found.`);
      return;
    }

    if (!device.protocol) {
      logger.warn(`Device ${device.id} has no protocol specified. Cannot send command via bridge.`);
      return; // Or throw an error, depending on desired behavior
    }
    const bridge = this.protocolBridges.get(device.protocol);
    if (bridge) {
      await bridge.sendCommand(device, command, payload);
      console.log(`Command sent to ${device.name}: ${command} with payload`, payload);
    } else {
      console.warn(`No protocol bridge found for device ${device.name} (protocol: ${device.protocol}).`);
    }
  }
}

export const deviceManager = new DeviceManager();

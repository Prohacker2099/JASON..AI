// server/core/device/protocol/pluginManager.ts

import { ProtocolBridge } from './ProtocolBridge';
import { logger } from '../../../utils/logger';

export class PluginManager {
  private bridges: Map<string, ProtocolBridge>;

  constructor() {
    this.bridges = new Map<string, ProtocolBridge>();
    logger.info('PluginManager initialized.');
  }

  /**
   * Registers a new protocol bridge.
   * @param bridge An instance of a class extending ProtocolBridge.
   */
  public registerBridge(bridge: ProtocolBridge): void {
    if (this.bridges.has(bridge.protocolName)) {
      logger.warn(`Protocol bridge for '${bridge.protocolName}' already registered. Overwriting.`);
    }
    this.bridges.set(bridge.protocolName, bridge);
    logger.info(`Protocol bridge for '${bridge.protocolName}' registered.`);
  }

  /**
   * Retrieves a registered protocol bridge by its name.
   * @param protocolName The name of the protocol.
   * @returns The ProtocolBridge instance, or undefined if not found.
   */
  public getBridge(protocolName: string): ProtocolBridge | undefined {
    return this.bridges.get(protocolName);
  }

  /**
   * Connects all registered protocol bridges.
   */
  public async connectAllBridges(): Promise<void> {
    logger.info('Attempting to connect all registered protocol bridges...');
    for (const bridge of this.bridges.values()) {
      try {
        await bridge.connect();
        logger.info(`Successfully connected to protocol: ${bridge.protocolName}`);
      } catch (error) {
        logger.error(`Failed to connect to protocol ${bridge.protocolName}:`, error);
      }
    }
  }

  /**
   * Discovers devices using all registered protocol bridges.
   */
  public async discoverDevicesAllBridges(): Promise<void> {
    logger.info('Initiating device discovery across all registered protocol bridges...');
    for (const bridge of this.bridges.values()) {
      try {
        await bridge.discoverDevices();
        logger.info(`Device discovery initiated for protocol: ${bridge.protocolName}`);
      } catch (error) {
        logger.error(`Failed to initiate device discovery for protocol ${bridge.protocolName}:`, error);
      }
    }
  }
}

export const pluginManager = new PluginManager();

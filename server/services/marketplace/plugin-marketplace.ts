import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface Plugin {
  id: string;
  name: string;
  capabilities: Array<'deviceControl' | 'dataProcessing' | 'automation'>;
}

export class PluginMarketplace extends EventEmitter {
  private installedPlugins: Map<string, Plugin> = new Map();

  constructor() {
    super();
    // Seed with a demo plugin
    const initialPlugins: Plugin[] = [
      {
        id: 'demo-plugin',
        name: 'Demo Plugin',
        capabilities: ['deviceControl', 'dataProcessing', 'automation'],
      },
    ];
    initialPlugins.forEach((plugin) => this.installedPlugins.set(plugin.id, plugin));
    logger.info(`Loaded ${this.installedPlugins.size} installed plugins.`);
  }

  public async installPlugin(plugin: Plugin): Promise<boolean> {
    if (this.installedPlugins.has(plugin.id)) {
      logger.warn(`Plugin ${plugin.name} (${plugin.id}) is already installed.`);
      return false;
    }
    logger.info(`Installing plugin: ${plugin.name} (${plugin.id})...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.installedPlugins.set(plugin.id, plugin);
    this.emit('pluginInstalled', plugin);
    logger.info(`Plugin ${plugin.name} installed successfully.`);
    return true;
  }

  public async uninstallPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Plugin ${pluginId} not found for uninstallation.`);
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.installedPlugins.delete(pluginId);
    this.emit('pluginUninstalled', pluginId);
    logger.info(`Plugin ${plugin.name} uninstalled successfully.`);
    return true;
  }

  public getInstalledPlugins(): Plugin[] {
    return Array.from(this.installedPlugins.values());
  }

  public async pluginControlDevice(pluginId: string, deviceId: string, command: string, payload: any): Promise<any> {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      logger.error(`Plugin ${pluginId} not found. Cannot control device.`);
      return { success: false, error: 'Plugin not found' };
    }
    if (!plugin.capabilities.includes('deviceControl')) {
      logger.warn(`Plugin ${plugin.name} does not have 'deviceControl' capability.`);
      return { success: false, error: 'Plugin lacks device control capability' };
    }
    logger.info(`Plugin ${plugin.name} controlling device ${deviceId}: ${command}`);
    // Removed reference to deviceManager
    return { success: true };
  }

  public async pluginAddAutomationRule(pluginId: string, rule: any): Promise<boolean> {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      logger.error(`Plugin ${pluginId} not found. Cannot add automation rule.`);
      return false;
    }
    if (!plugin.capabilities.includes('automation')) {
      logger.warn(`Plugin ${plugin.name} does not have 'automation' capability.`);
      return false;
    }
    logger.info(`Plugin ${plugin.name} adding automation rule.`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    return true;
  }

  public async pluginContributeData(pluginId: string, userId: string, category: string, value: number, metadata?: Record<string, any>): Promise<void> {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      logger.error(`Plugin ${pluginId} not found. Cannot contribute data.`);
      return;
    }
    if (!plugin.capabilities.includes('dataProcessing')) {
      logger.warn(`Plugin ${plugin.name} does not have 'dataProcessing' capability.`);
      return;
    }
    logger.info(`Plugin ${plugin.name} contributing data for user ${userId}: ${category} - ${value}`);
    // Removed reference to dataDividendService
  }
}

export const pluginMarketplace = new PluginMarketplace();

import { IDevicePlugin } from "./IDevicePlugin.js";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs/promises.js";

export class PluginLoader extends EventEmitter {
  private plugins: Map<string, IDevicePlugin> = new Map();
  private pluginDirectory: string;

  constructor(pluginDirectory: string) {
    super();
    this.pluginDirectory = pluginDirectory;
  }

  /**
   * Load all plugins from the plugin directory
   */
  async loadPlugins(): Promise<void> {
    try {
      const files = await fs.readdir(this.pluginDirectory);

      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          try {
            const pluginPath = path.join(this.pluginDirectory, file);
            const plugin = await this.loadPlugin(pluginPath);

            if (plugin && "name" in plugin) {
              this.registerPlugin(plugin as IDevicePlugin);
            }
          } catch (error) {
            console.error(`Error loading plugin ${file}:`, error);
          }
        }
      }

      this.emit("pluginsLoaded", Array.from(this.plugins.values()));
    } catch (error) {
      console.error("Error loading plugins:", error);
      throw error;
    }
  }

  /**
   * Load a single plugin
   */
  private async loadPlugin(pluginPath: string): Promise<any> {
    try {
      const module = await import(pluginPath);
      return module.default || module;
    } catch (error) {
      console.error(`Error importing plugin ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Register a plugin with the loader
   */
  registerPlugin(plugin: IDevicePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this.plugins.set(plugin.name, plugin);
    this.emit("pluginRegistered", plugin);
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      this.plugins.delete(pluginName);
      this.emit("pluginUnregistered", plugin);
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): IDevicePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): IDevicePlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get plugins that support a specific device type
   */
  getPluginsForDeviceType(deviceType: string): IDevicePlugin[] {
    return Array.from(this.plugins.values()).filter((plugin) =>
      plugin.supportedDeviceTypes.includes(deviceType),
    );
  }

  /**
   * Validate plugin compatibility
   */
  validatePlugin(plugin: IDevicePlugin): boolean {
    return (
      typeof plugin.name === "string" &&
      typeof plugin.version === "string" &&
      Array.isArray(plugin.supportedDeviceTypes) &&
      typeof plugin.discover === "function" &&
      typeof plugin.control === "function"
    );
  }
}

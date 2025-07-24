/**
 * Plugin Loader
 *
 * This module loads and manages device plugins for the JASON platform.
 * It dynamically loads plugins from the plugins directory and registers them with the system.
 */

const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

class PluginLoader extends EventEmitter {
  constructor() {
    super();
    this.plugins = new Map();
    this.pluginDirectory = path.join(process.cwd(), "plugins");
  }

  /**
   * Initialize the plugin loader
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log("Initializing plugin loader...");

      // Create plugins directory if it doesn't exist
      if (!fs.existsSync(this.pluginDirectory)) {
        fs.mkdirSync(this.pluginDirectory, { recursive: true });
      }

      // Load plugins
      await this.loadPlugins();

      console.log("Plugin loader initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize plugin loader:", error);
      return false;
    }
  }

  /**
   * Load plugins from the plugins directory
   * @returns {Promise<Array>} Array of loaded plugins
   */
  async loadPlugins() {
    try {
      console.log(`Loading plugins from ${this.pluginDirectory}...`);

      // Get plugin files
      const files = fs.readdirSync(this.pluginDirectory);
      const pluginFiles = files.filter(
        (file) =>
          (file.endsWith(".js") || file.endsWith(".ts")) &&
          !file.startsWith("."),
      );

      console.log(`Found ${pluginFiles.length} plugin files`);

      // Load each plugin
      for (const file of pluginFiles) {
        try {
          await this.loadPlugin(file);
        } catch (error) {
          console.error(`Error loading plugin ${file}:`, error);
        }
      }

      return Array.from(this.plugins.values());
    } catch (error) {
      console.error("Error loading plugins:", error);
      return [];
    }
  }

  /**
   * Load a specific plugin
   * @param {string} filename Plugin filename
   * @returns {Promise<Object|null>} Loaded plugin or null if failed
   */
  async loadPlugin(filename) {
    try {
      const pluginPath = path.join(this.pluginDirectory, filename);
      console.log(`Loading plugin from ${pluginPath}...`);

      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(pluginPath)];

      // Load plugin module
      const PluginClass = require(pluginPath);

      // Check if it's a class or object
      if (typeof PluginClass === "function") {
        // It's a class, instantiate it
        const plugin = new PluginClass();

        // Validate plugin interface
        if (!this.validatePlugin(plugin)) {
          throw new Error(
            `Plugin ${filename} does not implement the required interface`,
          );
        }

        // Register plugin
        this.registerPlugin(plugin);
        return plugin;
      } else if (typeof PluginClass === "object") {
        // It's an object, use it directly
        if (!this.validatePlugin(PluginClass)) {
          throw new Error(
            `Plugin ${filename} does not implement the required interface`,
          );
        }

        // Register plugin
        this.registerPlugin(PluginClass);
        return PluginClass;
      } else {
        throw new Error(
          `Plugin ${filename} does not export a valid plugin class or object`,
        );
      }
    } catch (error) {
      console.error(`Error loading plugin ${filename}:`, error);
      return null;
    }
  }

  /**
   * Validate that a plugin implements the required interface
   * @param {Object} plugin Plugin object
   * @returns {boolean} Whether the plugin is valid
   */
  validatePlugin(plugin) {
    // Check required properties
    if (!plugin.name || typeof plugin.name !== "string") {
      console.error("Plugin missing required property: name");
      return false;
    }

    if (!plugin.version || typeof plugin.version !== "string") {
      console.error("Plugin missing required property: version");
      return false;
    }

    // Check required methods
    if (!plugin.discover || typeof plugin.discover !== "function") {
      console.error("Plugin missing required method: discover");
      return false;
    }

    // Check if it extends EventEmitter
    if (!(plugin instanceof EventEmitter)) {
      console.warn(`Plugin ${plugin.name} does not extend EventEmitter`);
      // Not a hard requirement, but recommended
    }

    return true;
  }

  /**
   * Register a plugin with the system
   * @param {Object} plugin Plugin object
   */
  registerPlugin(plugin) {
    // Check if plugin with same name already exists
    if (this.plugins.has(plugin.name)) {
      console.warn(
        `Plugin with name ${plugin.name} already registered, replacing`,
      );
    }

    // Register plugin
    this.plugins.set(plugin.name, plugin);
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);

    // Forward plugin events
    plugin.on("deviceDiscovered", (device) => {
      this.emit("deviceDiscovered", {
        plugin: plugin.name,
        device,
      });
    });

    plugin.on("deviceStateChanged", (data) => {
      this.emit("deviceStateChanged", {
        plugin: plugin.name,
        ...data,
      });
    });

    // Emit plugin registered event
    this.emit("pluginRegistered", {
      name: plugin.name,
      version: plugin.version,
    });
  }

  /**
   * Unregister a plugin
   * @param {string} pluginName Name of the plugin to unregister
   * @returns {boolean} Whether the plugin was unregistered
   */
  unregisterPlugin(pluginName) {
    if (!this.plugins.has(pluginName)) {
      console.warn(`Plugin ${pluginName} not registered`);
      return false;
    }

    // Unregister plugin
    this.plugins.delete(pluginName);
    console.log(`Unregistered plugin: ${pluginName}`);

    // Emit plugin unregistered event
    this.emit("pluginUnregistered", {
      name: pluginName,
    });

    return true;
  }

  /**
   * Get all registered plugins
   * @returns {Array} Array of registered plugins
   */
  getPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   * @param {string} pluginName Name of the plugin
   * @returns {Object|null} Plugin object or null if not found
   */
  getPlugin(pluginName) {
    return this.plugins.get(pluginName) || null;
  }

  /**
   * Discover devices using all registered plugins
   * @returns {Promise<Array>} Array of discovered devices
   */
  async discoverDevices() {
    try {
      console.log("Discovering devices using plugins...");

      const allDevices = [];

      // Discover devices with each plugin
      for (const plugin of this.plugins.values()) {
        try {
          console.log(`Discovering devices with plugin: ${plugin.name}`);
          const devices = await plugin.discover();

          // Add plugin name to each device
          const pluginDevices = devices.map((device) => ({
            ...device,
            plugin: plugin.name,
          }));

          allDevices.push(...pluginDevices);
          console.log(
            `Plugin ${plugin.name} discovered ${devices.length} devices`,
          );
        } catch (error) {
          console.error(
            `Error discovering devices with plugin ${plugin.name}:`,
            error,
          );
        }
      }

      console.log(`Discovered ${allDevices.length} devices from all plugins`);
      return allDevices;
    } catch (error) {
      console.error("Error discovering devices with plugins:", error);
      return [];
    }
  }

  /**
   * Control a device using the appropriate plugin
   * @param {string} deviceId ID of the device to control
   * @param {string} pluginName Name of the plugin that manages the device
   * @param {Object} command Command to send to the device
   * @returns {Promise<Object>} Result of the command
   */
  async controlDevice(deviceId, pluginName, command) {
    try {
      const plugin = this.plugins.get(pluginName);

      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginName}`);
      }

      if (!plugin.control || typeof plugin.control !== "function") {
        throw new Error(`Plugin ${pluginName} does not support device control`);
      }

      console.log(
        `Controlling device ${deviceId} with plugin ${pluginName}...`,
      );
      return await plugin.control(deviceId, command);
    } catch (error) {
      console.error(
        `Error controlling device ${deviceId} with plugin ${pluginName}:`,
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create and export singleton instance
const pluginLoader = new PluginLoader();
module.exports = pluginLoader;

/**
 * Plugin Discovery Script
 *
 * This script discovers and lists all available plugins in the JASON platform.
 */

import fs from "fs";
import path from "path";
import { Logger } from "../server/services/logger";

const logger = new Logger("PluginDiscovery");

// Define plugin directories
const PLUGIN_DIRECTORIES = [
  path.join(__dirname, "../integrations"),
  path.join(__dirname, "../plugins"),
];

interface PluginInfo {
  name: string;
  displayName?: string;
  description?: string;
  version?: string;
  path: string;
  type: string;
}

/**
 * Discover plugins in a directory
 */
function discoverPluginsInDirectory(directory: string): PluginInfo[] {
  const plugins: PluginInfo[] = [];

  try {
    if (!fs.existsSync(directory)) {
      logger.warn(`Plugin directory does not exist: ${directory}`);
      return plugins;
    }

    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Skip node_modules and hidden directories
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;

      // Try to load the plugin info
      try {
        const pluginPath = path.join(directory, entry.name);

        // Check for index.js/ts or main file specified in package.json
        let mainFile = path.join(pluginPath, "index.js");

        if (!fs.existsSync(mainFile)) {
          mainFile = path.join(pluginPath, "index.ts");
        }

        if (!fs.existsSync(mainFile)) {
          const packageJsonPath = path.join(pluginPath, "package.json");

          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(
              fs.readFileSync(packageJsonPath, "utf8"),
            );

            if (packageJson.main) {
              mainFile = path.join(pluginPath, packageJson.main);
            }
          }
        }

        if (!fs.existsSync(mainFile)) {
          logger.warn(`Could not find main file for plugin: ${entry.name}`);
          continue;
        }

        // Get plugin type
        let type = "unknown";
        if (directory.includes("integrations")) {
          type = "integration";
        } else if (directory.includes("plugins")) {
          type = "plugin";
        }

        // Add plugin info
        plugins.push({
          name: entry.name,
          path: pluginPath,
          type,
        });

        // Try to get more info from package.json
        const packageJsonPath = path.join(pluginPath, "package.json");

        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(
              fs.readFileSync(packageJsonPath, "utf8"),
            );

            plugins[plugins.length - 1].displayName =
              packageJson.displayName || packageJson.name;
            plugins[plugins.length - 1].description = packageJson.description;
            plugins[plugins.length - 1].version = packageJson.version;
          } catch (error) {
            logger.warn(
              `Error parsing package.json for plugin ${entry.name}:`,
              error,
            );
          }
        }
      } catch (error) {
        logger.error(`Error loading plugin ${entry.name}:`, error);
      }
    }
  } catch (error) {
    logger.error(`Error discovering plugins in directory ${directory}:`, error);
  }

  return plugins;
}

/**
 * Discover all plugins
 */
function discoverPlugins(): PluginInfo[] {
  const plugins: PluginInfo[] = [];

  for (const directory of PLUGIN_DIRECTORIES) {
    const pluginsInDirectory = discoverPluginsInDirectory(directory);
    plugins.push(...pluginsInDirectory);
  }

  return plugins;
}

/**
 * Print plugin information
 */
function printPluginInfo(plugins: PluginInfo[]): void {
  console.log("\n=== JASON Plugins ===\n");

  if (plugins.length === 0) {
    console.log("No plugins found.");
    return;
  }

  // Group plugins by type
  const pluginsByType: Record<string, PluginInfo[]> = {};

  for (const plugin of plugins) {
    if (!pluginsByType[plugin.type]) {
      pluginsByType[plugin.type] = [];
    }

    pluginsByType[plugin.type].push(plugin);
  }

  // Print plugins by type
  for (const [type, pluginsOfType] of Object.entries(pluginsByType)) {
    console.log(`\n== ${type.charAt(0).toUpperCase() + type.slice(1)}s ==\n`);

    for (const plugin of pluginsOfType) {
      console.log(
        `- ${plugin.displayName || plugin.name} ${plugin.version ? `v${plugin.version}` : ""}`,
      );

      if (plugin.description) {
        console.log(`  ${plugin.description}`);
      }

      console.log(`  Path: ${plugin.path}`);
      console.log();
    }
  }

  console.log(`Total plugins: ${plugins.length}`);
}

/**
 * Run plugin discovery
 */
async function run() {
  try {
    logger.info("Discovering plugins...");

    const plugins = discoverPlugins();

    printPluginInfo(plugins);

    logger.info("Plugin discovery complete");
  } catch (error) {
    logger.error("Error discovering plugins:", error);
    process.exit(1);
  }
}

// Run discovery if this file is executed directly
// In ES modules, we can check if the import.meta.url is the same as the current file
if (import.meta.url.endsWith(process.argv[1])) {
  run();
}

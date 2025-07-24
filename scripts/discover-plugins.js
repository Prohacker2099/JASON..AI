"use strict";
/**
 * Plugin Discovery Script
 *
 * This script discovers and lists all available plugins in the JASON platform.
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var logger_1 = require("../server/services/logger");
var logger = new logger_1.Logger("PluginDiscovery");
// Define plugin directories
var PLUGIN_DIRECTORIES = [
  path_1.default.join(__dirname, "../integrations"),
  path_1.default.join(__dirname, "../plugins"),
];
/**
 * Discover plugins in a directory
 */
function discoverPluginsInDirectory(directory) {
  var plugins = [];
  try {
    if (!fs_1.default.existsSync(directory)) {
      logger.warn("Plugin directory does not exist: ".concat(directory));
      return plugins;
    }
    var entries = fs_1.default.readdirSync(directory, { withFileTypes: true });
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
      var entry = entries_1[_i];
      if (!entry.isDirectory()) continue;
      // Skip node_modules and hidden directories
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      // Try to load the plugin info
      try {
        var pluginPath = path_1.default.join(directory, entry.name);
        // Check for index.js/ts or main file specified in package.json
        var mainFile = path_1.default.join(pluginPath, "index.js");
        if (!fs_1.default.existsSync(mainFile)) {
          mainFile = path_1.default.join(pluginPath, "index.ts");
        }
        if (!fs_1.default.existsSync(mainFile)) {
          var packageJsonPath_1 = path_1.default.join(
            pluginPath,
            "package.json",
          );
          if (fs_1.default.existsSync(packageJsonPath_1)) {
            var packageJson = JSON.parse(
              fs_1.default.readFileSync(packageJsonPath_1, "utf8"),
            );
            if (packageJson.main) {
              mainFile = path_1.default.join(pluginPath, packageJson.main);
            }
          }
        }
        if (!fs_1.default.existsSync(mainFile)) {
          logger.warn(
            "Could not find main file for plugin: ".concat(entry.name),
          );
          continue;
        }
        // Get plugin type
        var type = "unknown";
        if (directory.includes("integrations")) {
          type = "integration";
        } else if (directory.includes("plugins")) {
          type = "plugin";
        }
        // Add plugin info
        plugins.push({
          name: entry.name,
          path: pluginPath,
          type: type,
        });
        // Try to get more info from package.json
        var packageJsonPath = path_1.default.join(pluginPath, "package.json");
        if (fs_1.default.existsSync(packageJsonPath)) {
          try {
            var packageJson = JSON.parse(
              fs_1.default.readFileSync(packageJsonPath, "utf8"),
            );
            plugins[plugins.length - 1].displayName =
              packageJson.displayName || packageJson.name;
            plugins[plugins.length - 1].description = packageJson.description;
            plugins[plugins.length - 1].version = packageJson.version;
          } catch (error) {
            logger.warn(
              "Error parsing package.json for plugin ".concat(entry.name, ":"),
              error,
            );
          }
        }
      } catch (error) {
        logger.error("Error loading plugin ".concat(entry.name, ":"), error);
      }
    }
  } catch (error) {
    logger.error(
      "Error discovering plugins in directory ".concat(directory, ":"),
      error,
    );
  }
  return plugins;
}
/**
 * Discover all plugins
 */
function discoverPlugins() {
  var plugins = [];
  for (
    var _i = 0, PLUGIN_DIRECTORIES_1 = PLUGIN_DIRECTORIES;
    _i < PLUGIN_DIRECTORIES_1.length;
    _i++
  ) {
    var directory = PLUGIN_DIRECTORIES_1[_i];
    var pluginsInDirectory = discoverPluginsInDirectory(directory);
    plugins.push.apply(plugins, pluginsInDirectory);
  }
  return plugins;
}
/**
 * Print plugin information
 */
function printPluginInfo(plugins) {
  console.log("\n=== JASON Plugins ===\n");
  if (plugins.length === 0) {
    console.log("No plugins found.");
    return;
  }
  // Group plugins by type
  var pluginsByType = {};
  for (var _i = 0, plugins_1 = plugins; _i < plugins_1.length; _i++) {
    var plugin = plugins_1[_i];
    if (!pluginsByType[plugin.type]) {
      pluginsByType[plugin.type] = [];
    }
    pluginsByType[plugin.type].push(plugin);
  }
  // Print plugins by type
  for (var _a = 0, _b = Object.entries(pluginsByType); _a < _b.length; _a++) {
    var _c = _b[_a],
      type = _c[0],
      pluginsOfType = _c[1];
    console.log(
      "\n== ".concat(type.charAt(0).toUpperCase() + type.slice(1), "s ==\n"),
    );
    for (
      var _d = 0, pluginsOfType_1 = pluginsOfType;
      _d < pluginsOfType_1.length;
      _d++
    ) {
      var plugin = pluginsOfType_1[_d];
      console.log(
        "- "
          .concat(plugin.displayName || plugin.name, " ")
          .concat(plugin.version ? "v".concat(plugin.version) : ""),
      );
      if (plugin.description) {
        console.log("  ".concat(plugin.description));
      }
      console.log("  Path: ".concat(plugin.path));
      console.log();
    }
  }
  console.log("Total plugins: ".concat(plugins.length));
}
/**
 * Run plugin discovery
 */
function run() {
  return __awaiter(this, void 0, void 0, function () {
    var plugins;
    return __generator(this, function (_a) {
      try {
        logger.info("Discovering plugins...");
        plugins = discoverPlugins();
        printPluginInfo(plugins);
        logger.info("Plugin discovery complete");
      } catch (error) {
        logger.error("Error discovering plugins:", error);
        process.exit(1);
      }
      return [2 /*return*/];
    });
  });
}
// Run discovery if this file is executed directly
// In ES modules, we can check if the import.meta.url is the same as the current file
if (import.meta.url.endsWith(process.argv[1])) {
  run();
}

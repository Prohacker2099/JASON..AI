"use strict";
/**
 * Matter Controller Setup
 *
 * This script sets up the Matter controller by creating necessary directories
 * and configuration files.
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
var logger_js_1 = require("../../server/services/logger.js");
var logger = new logger_js_1.Logger("MatterSetup");
// Define paths
var STORAGE_DIR = path_1.default.join(__dirname, "storage");
var CONFIG_FILE = path_1.default.join(__dirname, "config.json");
// Default configuration
var DEFAULT_CONFIG = {
  enabled: true,
  mockMode: true, // Use mock mode for development until Matter SDK is available
  storagePath: STORAGE_DIR,
  commissioningOptions: {
    deviceControllerOptions: {
      storagePath: STORAGE_DIR,
    },
  },
};
/**
 * Create storage directory
 */
function createStorageDirectory() {
  if (!fs_1.default.existsSync(STORAGE_DIR)) {
    fs_1.default.mkdirSync(STORAGE_DIR, { recursive: true });
    logger.info("Created storage directory: ".concat(STORAGE_DIR));
  } else {
    logger.info("Storage directory already exists: ".concat(STORAGE_DIR));
  }
}
/**
 * Create configuration file
 */
function createConfigFile() {
  if (!fs_1.default.existsSync(CONFIG_FILE)) {
    fs_1.default.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
    );
    logger.info("Created configuration file: ".concat(CONFIG_FILE));
  } else {
    logger.info("Configuration file already exists: ".concat(CONFIG_FILE));
  }
}
/**
 * Run setup
 */
function setup() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      try {
        logger.info("Setting up Matter controller...");
        // Create storage directory
        createStorageDirectory();
        // Create configuration file
        createConfigFile();
        logger.info("Matter controller setup complete");
      } catch (error) {
        logger.error("Error setting up Matter controller:", error);
        process.exit(1);
      }
      return [2 /*return*/];
    });
  });
}
// Run setup if this file is executed directly
// In ES modules, we can check if the import.meta.url is the same as the current file
if (import.meta.url.endsWith(process.argv[1])) {
  setup();
}

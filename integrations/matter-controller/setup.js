"use strict";

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

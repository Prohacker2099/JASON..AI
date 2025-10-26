
function createStorageDirectory() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    logger.info(`Created storage directory: ${STORAGE_DIR}`);
  } else {
    logger.info(`Storage directory already exists: ${STORAGE_DIR}`);
  }
}

/**
 * Create configuration file
 */
function createConfigFile() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
    logger.info(`Created configuration file: ${CONFIG_FILE}`);
  } else {
    logger.info(`Configuration file already exists: ${CONFIG_FILE}`);
  }
}

/**
 * Run setup
 */
async function setup() {
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
}

// Run setup if this file is executed directly
// In ES modules, we can check if the import.meta.url is the same as the current file
if (import.meta.url.endsWith(process.argv[1])) {
  setup();
}

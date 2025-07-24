const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Path to the logger.ts file
const loggerTsPath = path.join(__dirname, "server", "services", "logger.ts");
const loggerJsPath = path.join(__dirname, "server", "services", "logger.js");

// Read the logger.ts file
const loggerTsContent = fs.readFileSync(loggerTsPath, "utf8");

// Create a simple logger.js file
const loggerJsContent = `/**
 * Logger Service
 * 
 * This service provides logging functionality for the application.
 */

"use strict";

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));

class Logger {
    constructor(module) {
        this.module = module;
    }
    
    /**
     * Set the global log level
     */
    static setLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'debug':
                Logger.logLevel = LogLevel.DEBUG;
                break;
            case 'info':
                Logger.logLevel = LogLevel.INFO;
                break;
            case 'warn':
                Logger.logLevel = LogLevel.WARN;
                break;
            case 'error':
                Logger.logLevel = LogLevel.ERROR;
                break;
            default:
                console.warn(\`Invalid log level: \${level}. Using default: INFO\`);
                Logger.logLevel = LogLevel.INFO;
        }
    }
    
    /**
     * Log a debug message
     */
    debug(message, ...args) {
        if (Logger.logLevel <= LogLevel.DEBUG) {
            console.debug(\`[\${new Date().toISOString()}] [DEBUG] [\${this.module}] \${message}\`, ...args);
        }
    }
    
    /**
     * Log an info message
     */
    info(message, ...args) {
        if (Logger.logLevel <= LogLevel.INFO) {
            console.info(\`[\${new Date().toISOString()}] [INFO] [\${this.module}] \${message}\`, ...args);
        }
    }
    
    /**
     * Log a warning message
     */
    warn(message, ...args) {
        if (Logger.logLevel <= LogLevel.WARN) {
            console.warn(\`[\${new Date().toISOString()}] [WARN] [\${this.module}] \${message}\`, ...args);
        }
    }
    
    /**
     * Log an error message
     */
    error(message, ...args) {
        if (Logger.logLevel <= LogLevel.ERROR) {
            console.error(\`[\${new Date().toISOString()}] [ERROR] [\${this.module}] \${message}\`, ...args);
        }
    }
}

// Set default log level
Logger.logLevel = LogLevel.INFO;

// Set log level from environment variable
const logLevel = process.env.LOG_LEVEL || 'info';
Logger.setLogLevel(logLevel);

exports.Logger = Logger;
`;

// Write the logger.js file
fs.writeFileSync(loggerJsPath, loggerJsContent);

console.log("Logger.js file created successfully!");

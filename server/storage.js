"use strict";
/**
 * Storage Service
 *
 * This service provides a simple key-value storage interface using SQLite.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
exports.get = get;
exports.getAll = getAll;
exports.set = set;
exports.remove = remove;
exports.removeAll = removeAll;
exports.addVoiceCommand = addVoiceCommand;
exports.getVoiceCommandsByUser = getVoiceCommandsByUser;
exports.getRecentVoiceCommands = getRecentVoiceCommands;
exports.addConsoleMessage = addConsoleMessage;
exports.addActivity = addActivity;
exports.getDeviceById = getDeviceById;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const logger_js_1 = require("./services/logger.js");
const logger = new logger_js_1.Logger("Storage");
// Database path
const DB_PATH = process.env.DB_PATH || "./jason.db";
// Database connection
let db = null;
/**
 * Initialize the database
 */
async function initialize() {
    try {
        // Open database connection
        db = await (0, sqlite_1.open)({
            filename: DB_PATH,
            driver: sqlite3_1.default.Database,
        });
        // Create tables if they don't exist
        await db.exec(`
      CREATE TABLE IF NOT EXISTS storage (
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (namespace, key)
      )
    `);
        // Create voice commands table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS voice_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        emotion TEXT,
        confidence REAL,
        user_id TEXT,
        device_id TEXT,
        platform TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        context TEXT
      )
    `);
        logger.info("Storage initialized successfully");
    }
    catch (error) {
        logger.error("Error initializing storage:", error);
        throw error;
    }
}
/**
 * Get a value from storage
 */
async function get(namespace, key) {
    try {
        await ensureInitialized();
        const row = await db.get("SELECT value FROM storage WHERE namespace = ? AND key = ?", namespace, key);
        if (!row) {
            return null;
        }
        return JSON.parse(row.value);
    }
    catch (error) {
        logger.error(`Error getting ${namespace}/${key} from storage:`, error);
        throw error;
    }
}
/**
 * Get all values in a namespace
 */
async function getAll(namespace) {
    try {
        await ensureInitialized();
        const rows = await db.all("SELECT key, value FROM storage WHERE namespace = ?", namespace);
        return rows.map((row) => JSON.parse(row.value));
    }
    catch (error) {
        logger.error(`Error getting all values from ${namespace}:`, error);
        throw error;
    }
}
/**
 * Set a value in storage
 */
async function set(namespace, key, value) {
    try {
        await ensureInitialized();
        const serializedValue = JSON.stringify(value);
        await db.run(`INSERT INTO storage (namespace, key, value, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (namespace, key)
       DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`, namespace, key, serializedValue, serializedValue);
    }
    catch (error) {
        logger.error(`Error setting ${namespace}/${key} in storage:`, error);
        throw error;
    }
}
/**
 * Remove a value from storage
 */
async function remove(namespace, key) {
    try {
        await ensureInitialized();
        await db.run("DELETE FROM storage WHERE namespace = ? AND key = ?", namespace, key);
    }
    catch (error) {
        logger.error(`Error removing ${namespace}/${key} from storage:`, error);
        throw error;
    }
}
/**
 * Remove all values in a namespace
 */
async function removeAll(namespace) {
    try {
        await ensureInitialized();
        await db.run("DELETE FROM storage WHERE namespace = ?", namespace);
    }
    catch (error) {
        logger.error(`Error removing all values from ${namespace}:`, error);
        throw error;
    }
}
/**
 * Add a voice command to storage
 */
async function addVoiceCommand(command) {
    try {
        await ensureInitialized();
        const result = await db.run(`INSERT INTO voice_commands (
        text, emotion, confidence, user_id, device_id, platform, timestamp, context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, command.text, command.emotion || null, command.confidence || 1.0, command.userId || null, command.deviceId || null, command.platform || "jason", command.timestamp
            ? command.timestamp.toISOString()
            : new Date().toISOString(), command.context ? JSON.stringify(command.context) : null);
        return result.lastID || 0;
    }
    catch (error) {
        logger.error("Error adding voice command:", error);
        throw error;
    }
}
/**
 * Get voice commands by user ID
 */
async function getVoiceCommandsByUser(userId, limit = 100) {
    try {
        await ensureInitialized();
        return await db.all(`SELECT * FROM voice_commands 
       WHERE user_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`, userId, limit);
    }
    catch (error) {
        logger.error(`Error getting voice commands for user ${userId}:`, error);
        throw error;
    }
}
/**
 * Get recent voice commands
 */
async function getRecentVoiceCommands(limit = 100) {
    try {
        await ensureInitialized();
        return await db.all(`SELECT * FROM voice_commands 
       ORDER BY timestamp DESC 
       LIMIT ?`, limit);
    }
    catch (error) {
        logger.error("Error getting recent voice commands:", error);
        throw error;
    }
}
/**
 * Add a console message
 */
async function addConsoleMessage(message) {
    try {
        await ensureInitialized();
        // Store in the storage table under the console namespace
        const key = `message_${Date.now()}`;
        const value = JSON.stringify({
            text: message.text,
            type: message.type,
            timestamp: message.timestamp || new Date(),
        });
        await db.run(`INSERT INTO storage (namespace, key, value) VALUES (?, ?, ?)`, "console", key, value);
        return key;
    }
    catch (error) {
        logger.error("Error adding console message:", error);
        throw error;
    }
}
/**
 * Add an activity
 */
async function addActivity(activity) {
    try {
        await ensureInitialized();
        // Store in the storage table under the activities namespace
        const key = `activity_${Date.now()}`;
        const value = JSON.stringify({
            title: activity.title,
            description: activity.description,
            type: activity.type,
            timestamp: activity.timestamp || new Date(),
        });
        await db.run(`INSERT INTO storage (namespace, key, value) VALUES (?, ?, ?)`, "activities", key, value);
        return key;
    }
    catch (error) {
        logger.error("Error adding activity:", error);
        throw error;
    }
}
/**
 * Get device by ID
 */
async function getDeviceById(deviceId) {
    try {
        await ensureInitialized();
        // Retrieve from the storage table under the devices namespace
        const rows = await db.all(`SELECT value FROM storage WHERE namespace = 'devices' AND key = ?`, deviceId);
        return rows.map((row) => JSON.parse(row.value));
    }
    catch (error) {
        logger.error(`Error getting device ${deviceId}:`, error);
        return [];
    }
}
/**
 * Ensure the database is initialized
 */
async function ensureInitialized() {
    if (!db) {
        await initialize();
    }
}
// Initialize storage on module load
initialize().catch((error) => {
    logger.error("Failed to initialize storage:", error);
});

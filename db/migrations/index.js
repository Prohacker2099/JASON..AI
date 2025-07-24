"use strict";
/**
 * Database Migration Runner
 *
 * This module handles database migrations to ensure the database schema is up-to-date.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.getDb = getDb;
const logger_js_1 = require("../../server/services/logger.js");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
// Database path
const dbPath = path_1.default.join(__dirname, "..", "..", "jason.db");
// Initialize database connection
async function getDb() {
    return await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database,
    });
}
const logger = new logger_js_1.Logger("Migrations");
/**
 * Initialize the database and run migrations
 */
async function runMigrations() {
    try {
        // Get database connection
        const db = await getDb();
        // Create migrations table if it doesn't exist
        await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Get list of applied migrations
        const appliedMigrations = await db.all("SELECT name FROM migrations");
        const appliedMigrationNames = appliedMigrations.map((m) => m.name);
        // Define migrations in order
        // Import migrations dynamically since we're using ES modules
        const migrations = [
            {
                name: "001_create_users_table",
                up: async (db) => {
                    const module = require("./001_create_users_table.js");
                    return module.up(db);
                },
            },
            {
                name: "002_create_scenes_tables",
                up: async (db) => {
                    const module = require("./002_create_scenes_tables.js");
                    return module.up(db);
                },
            },
            {
                name: "003_create_devices_table",
                up: async (db) => {
                    const module = require("./003_create_devices_table.js");
                    return module.up(db);
                },
            },
            {
                name: "004_create_pattern_tables",
                up: async (db) => {
                    const module = require("./004_create_pattern_tables.js");
                    return module.up(db);
                },
            },
        ];
        // Apply migrations that haven't been applied yet
        for (const migration of migrations) {
            if (!appliedMigrationNames.includes(migration.name)) {
                logger.info(`Applying migration: ${migration.name}`);
                await migration.up(db);
                await db.run("INSERT INTO migrations (name) VALUES (?)", [
                    migration.name,
                ]);
                logger.info(`Migration applied: ${migration.name}`);
            }
        }
        logger.info("Database migrations complete");
    }
    catch (error) {
        logger.error("Error running migrations:", error);
        throw error;
    }
}
// Run migrations if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
    runMigrations()
        .then(() => {
        console.log("All migrations applied successfully");
        process.exit(0);
    })
        .catch((error) => {
        console.error("Error applying migrations:", error);
        process.exit(1);
    });
}

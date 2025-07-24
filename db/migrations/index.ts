/**
 * Database Migration Runner
 *
 * This module handles database migrations to ensure the database schema is up-to-date.
 */

import { Logger } from "../../server/services/logger.js";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

// Database path
const dbPath = path.join(__dirname, "..", "..", "jason.db");

// Initialize database connection
async function getDb() {
  return await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

const logger = new Logger("Migrations");

/**
 * Initialize the database and run migrations
 */
export async function runMigrations(): Promise<void> {
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
  } catch (error) {
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

// Export the getDb function for other modules to use
export { getDb };

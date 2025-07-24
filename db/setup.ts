/**
 * Database Setup
 *
 * This module sets up the database schema for all three phases of JASON AI Architect.
 */

import db from "../server/db.js";
import { Logger } from "../server/services/logger.js";
import { v4 as uuidv4 } from "uuid";

const logger = new Logger("DatabaseSetup");

/**
 * Set up database schema
 */
export async function setupDatabase(): Promise<boolean> {
  try {
    logger.info("Setting up database schema...");

    // Create tables for Phase 1
    await createPhase1Tables();

    // Create tables for Phase 2
    await createPhase2Tables();

    // Create tables for Phase 3
    await createPhase3Tables();

    // Insert default user
    await insertDefaultUser();

    logger.info("Database schema setup complete");
    return true;
  } catch (error) {
    logger.error("Error setting up database schema:", error);
    return false;
  }
}

/**
 * Create tables for Phase 1
 */
async function createPhase1Tables(): Promise<void> {
  // Devices table
  await db.createTable("devices", {
    id: { type: "TEXT", primaryKey: true },
    name: { type: "TEXT", notNull: true },
    manufacturer: { type: "TEXT" },
    model: { type: "TEXT" },
    type: { type: "TEXT", notNull: true },
    protocol: { type: "TEXT", notNull: true },
    address: { type: "TEXT" },
    port: { type: "INTEGER" },
    hostname: { type: "TEXT" },
    capabilities: { type: "TEXT" }, // JSON array
    state: { type: "TEXT" }, // JSON object
    online: { type: "INTEGER", notNull: true },
    discoveredAt: { type: "TEXT" },
    lastSeenAt: { type: "TEXT" },
    lastControlSource: { type: "TEXT" },
  });

  // Automations table
  await db.createTable("automations", {
    id: { type: "TEXT", primaryKey: true },
    name: { type: "TEXT", notNull: true },
    enabled: { type: "INTEGER", notNull: true },
    trigger: { type: "TEXT", notNull: true }, // JSON object
    conditions: { type: "TEXT" }, // JSON array
    actions: { type: "TEXT", notNull: true }, // JSON array
    createdAt: { type: "TEXT", notNull: true },
    updatedAt: { type: "TEXT", notNull: true },
    lastTriggeredAt: { type: "TEXT" },
  });

  // Scenes table
  await db.createTable("scenes", {
    id: { type: "TEXT", primaryKey: true },
    name: { type: "TEXT", notNull: true },
    deviceStates: { type: "TEXT", notNull: true }, // JSON array
    icon: { type: "TEXT" },
    color: { type: "TEXT" },
    createdAt: { type: "TEXT", notNull: true },
    updatedAt: { type: "TEXT", notNull: true },
    lastActivatedAt: { type: "TEXT" },
  });

  // Users table
  await db.createTable("users", {
    id: { type: "TEXT", primaryKey: true },
    username: { type: "TEXT", notNull: true, unique: true },
    passwordHash: { type: "TEXT", notNull: true },
    email: { type: "TEXT", unique: true },
    role: { type: "TEXT", notNull: true },
    createdAt: { type: "TEXT", notNull: true },
    lastLoginAt: { type: "TEXT" },
  });

  logger.info("Phase 1 tables created");
}

/**
 * Create tables for Phase 2
 */
async function createPhase2Tables(): Promise<void> {
  // User activities table
  await db.createTable("activities", {
    id: { type: "TEXT", primaryKey: true },
    userId: { type: "TEXT", notNull: true },
    deviceId: { type: "TEXT", notNull: true },
    action: { type: "TEXT", notNull: true },
    timestamp: { type: "TEXT", notNull: true },
    context: { type: "TEXT" }, // JSON object
  });

  // Patterns table
  await db.createTable("patterns", {
    id: { type: "TEXT", primaryKey: true },
    type: { type: "TEXT", notNull: true },
    description: { type: "TEXT", notNull: true },
    confidence: { type: "REAL", notNull: true },
    devices: { type: "TEXT", notNull: true }, // JSON array
    data: { type: "TEXT", notNull: true }, // JSON object
    createdAt: { type: "TEXT", notNull: true },
    updatedAt: { type: "TEXT", notNull: true },
  });

  logger.info("Phase 2 tables created");
}

/**
 * Create tables for Phase 3
 */
async function createPhase3Tables(): Promise<void> {
  // Data records table
  await db.createTable("data_records", {
    id: { type: "TEXT", primaryKey: true },
    userId: { type: "TEXT", notNull: true },
    category: { type: "TEXT", notNull: true },
    source: { type: "TEXT", notNull: true },
    data: { type: "TEXT", notNull: true }, // JSON object
    timestamp: { type: "TEXT", notNull: true },
    encrypted: { type: "INTEGER", notNull: true },
    hash: { type: "TEXT", notNull: true },
  });

  // Data consents table
  await db.createTable("data_consents", {
    id: { type: "TEXT", primaryKey: true },
    userId: { type: "TEXT", notNull: true },
    category: { type: "TEXT", notNull: true },
    permission: { type: "TEXT", notNull: true },
    purpose: { type: "TEXT", notNull: true },
    expiration: { type: "TEXT", notNull: true },
    createdAt: { type: "TEXT", notNull: true },
  });

  // Data dividends table
  await db.createTable("data_dividends", {
    id: { type: "TEXT", primaryKey: true },
    userId: { type: "TEXT", notNull: true },
    amount: { type: "REAL", notNull: true },
    currency: { type: "TEXT", notNull: true },
    source: { type: "TEXT", notNull: true },
    category: { type: "TEXT", notNull: true },
    timestamp: { type: "TEXT", notNull: true },
  });

  logger.info("Phase 3 tables created");
}

/**
 * Insert default user
 */
async function insertDefaultUser(): Promise<void> {
  try {
    // Check if default user exists
    const existingUser = await db.query("users", { username: "admin" });

    if (existingUser && existingUser.length > 0) {
      logger.info("Default user already exists");
      return;
    }

    // Create default user
    const now = new Date().toISOString();

    await db.insert("users", {
      id: "default",
      username: "admin",
      passwordHash:
        "$2a$10$8JEFVNYYhLoBysjAxe2/1uwYX.bP/SZtBDTGYFeQrKLkHn.s7HXlS", // 'password'
      email: "admin@jason.local",
      role: "admin",
      createdAt: now,
      lastLoginAt: now,
    });

    logger.info("Default user created");
  } catch (error) {
    logger.error("Error creating default user:", error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then((success) => {
      if (success) {
        logger.info("Database setup completed successfully");
        process.exit(0);
      } else {
        logger.error("Database setup failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error("Unhandled error during database setup:", error);
      process.exit(1);
    });
}

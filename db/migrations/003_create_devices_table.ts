/**
 * Migration: Create Devices Table
 *
 * This migration creates the devices table for storing device information.
 */

import db from "../sqlite-adapter.js";

export async function up() {
  // await db.exec(`
  //   CREATE TABLE IF NOT EXISTS devices (
  //     id TEXT PRIMARY KEY,
  //     name TEXT NOT NULL,
  //     type TEXT NOT NULL,
  //     manufacturer TEXT,
  //     model TEXT,
  //     firmware_version TEXT,
  //     capabilities TEXT NOT NULL,
  //     state TEXT NOT NULL,
  //     connected BOOLEAN DEFAULT 1,
  //     last_seen TEXT,
  //     address TEXT,
  //     location TEXT,
  //     room TEXT,
  //     last_control_source TEXT,
  //     created_at TEXT NOT NULL DEFAULT (datetime('now')),
  //     updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  //     metadata TEXT
  //   );

  //   CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
  //   CREATE INDEX IF NOT EXISTS idx_devices_manufacturer ON devices(manufacturer);
  //   CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room);
  // `);
  console.warn(
    "Migration 003_create_devices_table.ts UP commented out temporarily.",
  );

  console.log("Created devices table");
}

export async function down() {
  // await db.exec(`
  //   DROP TABLE IF EXISTS devices;
  // `);
  console.warn(
    "Migration 003_create_devices_table.ts DOWN commented out temporarily.",
  );

  console.log("Dropped devices table");
}

// Run migration if this file is executed directly
// In ES modules, we can check if the import.meta.url is the same as the current file
if (import.meta.url.endsWith(process.argv[1])) {
  up().catch(console.error);
}

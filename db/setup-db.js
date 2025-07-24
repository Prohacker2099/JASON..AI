/**
 * Database Setup Script
 *
 * This script creates the necessary database tables for the JASON AI Architect.
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Database path
const dbPath = path.join(__dirname, "..", "jason.db");

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to database
const db = new sqlite3.Database(dbPath);

console.log(`Setting up database at ${dbPath}...`);

// Run all statements in a transaction
db.serialize(() => {
  db.run("BEGIN TRANSACTION");

  // Create devices table
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      type TEXT NOT NULL,
      protocol TEXT NOT NULL,
      address TEXT,
      port INTEGER,
      hostname TEXT,
      capabilities TEXT,
      state TEXT,
      online INTEGER NOT NULL,
      discoveredAt TEXT,
      lastSeenAt TEXT,
      lastControlSource TEXT
    )
  `);

  // Create automations table
  db.run(`
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      trigger TEXT NOT NULL,
      conditions TEXT,
      actions TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastTriggeredAt TEXT
    )
  `);

  // Create scenes table
  db.run(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      deviceStates TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastActivatedAt TEXT
    )
  `);

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastLoginAt TEXT
    )
  `);

  // Create activities table
  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      deviceId TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      context TEXT
    )
  `);

  // Create patterns table
  db.run(`
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      confidence REAL NOT NULL,
      devices TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create data_records table
  db.run(`
    CREATE TABLE IF NOT EXISTS data_records (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      encrypted INTEGER NOT NULL,
      hash TEXT NOT NULL
    )
  `);

  // Create data_consents table
  db.run(`
    CREATE TABLE IF NOT EXISTS data_consents (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      permission TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expiration TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create data_dividends table
  db.run(`
    CREATE TABLE IF NOT EXISTS data_dividends (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      source TEXT NOT NULL,
      category TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Create migrations table
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default user
  db.get("SELECT id FROM users WHERE username = ?", ["admin"], (err, row) => {
    if (err) {
      console.error("Error checking for default user:", err);
      return;
    }

    if (!row) {
      const now = new Date().toISOString();
      db.run(
        "INSERT INTO users (id, username, passwordHash, email, role, createdAt, lastLoginAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          "default",
          "admin",
          "$2a$10$8JEFVNYYhLoBysjAxe2/1uwYX.bP/SZtBDTGYFeQrKLkHn.s7HXlS", // 'password'
          "admin@jason.local",
          "admin",
          now,
          now,
        ],
        (err) => {
          if (err) {
            console.error("Error creating default user:", err);
          } else {
            console.log("Default user created");
          }
        },
      );
    } else {
      console.log("Default user already exists");
    }
  });

  db.run("COMMIT", (err) => {
    if (err) {
      console.error("Error committing transaction:", err);
    } else {
      console.log("Database setup completed successfully");
    }
  });
});

// Close database connection when done
db.close((err) => {
  if (err) {
    console.error("Error closing database:", err);
  } else {
    console.log("Database connection closed");
  }
});

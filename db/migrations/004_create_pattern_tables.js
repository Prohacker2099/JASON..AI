/**
 * Migration: Create Pattern Recognition Tables
 */

async function up(db) {
  await db.exec(`
    -- Patterns table
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      confidence REAL NOT NULL,
      devices TEXT,
      data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- User activities table
    CREATE TABLE IF NOT EXISTS user_activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );

    -- Dismissed suggestions table
    CREATE TABLE IF NOT EXISTS dismissed_suggestions (
      id TEXT PRIMARY KEY,
      dismissed_at TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX idx_patterns_type ON patterns(type);
    CREATE INDEX idx_user_activities_user ON user_activities(user_id);
    CREATE INDEX idx_user_activities_device ON user_activities(device_id);
    CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);
  `);
}

async function down(db) {
  await db.exec(`
    DROP TABLE IF EXISTS dismissed_suggestions;
    DROP TABLE IF EXISTS user_activities;
    DROP TABLE IF EXISTS patterns;
  `);
}

module.exports = { up, down };

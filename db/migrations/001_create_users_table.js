/**
 * Migration: Create Users Table
 */

async function up(db) {
  // Check if users table exists with the old schema
  const tableInfo = await db.all("PRAGMA table_info(users)");
  const hasPasswordHash = tableInfo.some((col) => col.name === "password_hash");

  if (tableInfo.length > 0 && !hasPasswordHash) {
    // The table exists but with old schema, let's rename it
    await db.exec(`
      ALTER TABLE users RENAME TO users_old;
    `);

    // Create new users table with updated schema
    await db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login TEXT
      );
    `);

    // Migrate data from old table to new table
    const oldUsers = await db.all("SELECT * FROM users_old");
    for (const user of oldUsers) {
      const now = new Date().toISOString();
      await db.run(
        "INSERT INTO users (id, username, password_hash, email, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user.id.toString(),
          user.username,
          user.password, // Use the old password as password_hash
          user.email || null,
          user.username, // Use username as name
          "user",
          now,
          now,
        ],
      );
    }

    console.log(
      `Migrated ${oldUsers.length} users from old schema to new schema`,
    );
  } else if (tableInfo.length === 0) {
    // Create users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login TEXT
      );
    `);
  }

  // Create sessions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_active TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create device_credentials table
    CREATE TABLE IF NOT EXISTS device_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      username TEXT,
      password_hash TEXT,
      token TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_device_credentials_user ON device_credentials(user_id);
    CREATE INDEX IF NOT EXISTS idx_device_credentials_device ON device_credentials(device_id);
  `);

  // Create admin user with default password if it doesn't exist
  const adminExists = await db.get("SELECT * FROM users WHERE username = ?", [
    "admin",
  ]);
  if (!adminExists) {
    // In a real app, we would use a proper password hashing library
    // For this example, we're using a simple hash representation
    const passwordHash = "admin_password_hash_placeholder";
    const now = new Date().toISOString();

    await db.run(
      "INSERT INTO users (id, username, password_hash, email, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "admin_user",
        "admin",
        passwordHash,
        "admin@jason.local",
        "Administrator",
        "admin",
        now,
        now,
      ],
    );
    console.log("Created admin user");
  }
}

async function down(db) {
  await db.exec(`
    DROP TABLE IF EXISTS device_credentials;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS users;
  `);
}

module.exports = { up, down };

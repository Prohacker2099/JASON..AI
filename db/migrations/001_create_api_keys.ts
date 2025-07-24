/**
 * Migration: Create API Keys Table
 */

export async function migrate(db: any) {
  await createApiKeysTable(db);
  await createInitialAdminKey(db);
  return true;
}

async function createApiKeysTable(db: any) {
  const sql = `
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used DATETIME
    )
  `;

  try {
    await db.exec(sql);
    console.log("Created api_keys table");
  } catch (error) {
    console.error("Error creating api_keys table:", error);
    throw error;
  }
}

async function createInitialAdminKey(db: any) {
  // Create initial admin API key if none exists
  const adminKey = await db.get("SELECT * FROM api_keys WHERE name = ?", [
    "admin",
  ]);
  if (!adminKey) {
    await db.run(
      "INSERT INTO api_keys (id, key, name, permissions) VALUES (?, ?, ?, ?)",
      [
        "admin",
        `jason_${Math.random().toString(36).substr(2, 32)}`,
        "admin",
        JSON.stringify(["*"]),
      ],
    );
    console.log("Created admin API key");
  }
}

// Export up function for compatibility with other migrations
export const up = migrate;

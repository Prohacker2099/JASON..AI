/**
 * Migration: Create Users Table
 */

async function up(db) {
  
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

import { sql } from "drizzle-orm"; // Importing sql from drizzle-orm for type safety
export async function up(db: any) {
  await db.exec(`
    -- Scenes table
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      owner TEXT NOT NULL,
      is_template BOOLEAN DEFAULT 0,
      template_id TEXT,
      shared BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_activated_at TEXT,
      tags TEXT
    );

    -- Scene device states table
    CREATE TABLE IF NOT EXISTS scene_device_states (
      scene_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      state TEXT NOT NULL,
      PRIMARY KEY (scene_id, device_id),
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    -- Scene schedules table
    CREATE TABLE IF NOT EXISTS scene_schedules (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL,
      type TEXT NOT NULL,
      time TEXT,
      days TEXT,
      date TEXT,
      enabled BOOLEAN DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    -- Scene automations table
    CREATE TABLE IF NOT EXISTS scene_automations (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL,
      type TEXT NOT NULL,
      trigger TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      last_triggered TEXT,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    -- Scene sharing table
    CREATE TABLE IF NOT EXISTS scene_sharing (
      scene_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      shared_at TEXT NOT NULL,
      PRIMARY KEY (scene_id, user_id),
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    -- Scene templates table
    CREATE TABLE IF NOT EXISTS scene_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      category TEXT NOT NULL,
      popularity INTEGER DEFAULT 0,
      preview_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX idx_scenes_owner ON scenes(owner);
    CREATE INDEX idx_scenes_template ON scenes(template_id);
    CREATE INDEX idx_schedules_scene ON scene_schedules(scene_id);
    CREATE INDEX idx_automations_scene ON scene_automations(scene_id);
    CREATE INDEX idx_templates_category ON scene_templates(category);
  `);
}

export async function down(db: any) {
  await db.exec(`
    DROP TABLE IF EXISTS scene_sharing;
    DROP TABLE IF EXISTS scene_automations;
    DROP TABLE IF EXISTS scene_schedules;
    DROP TABLE IF EXISTS scene_device_states;
    DROP TABLE IF EXISTS scene_templates;
    DROP TABLE IF EXISTS scenes;
  `);
}

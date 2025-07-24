"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenes = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// Placeholder for scenes table - adapt columns as needed based on SceneDatabase.ts usage
exports.scenes = (0, pg_core_1.pgTable)("scenes", {
  id: (0, pg_core_1.varchar)("id").primaryKey(), // Assuming id is a string, adjust if it's serial
  name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
  description: (0, pg_core_1.text)("description"),
  userId: (0, pg_core_1.varchar)("user_id", { length: 255 }), // Or integer if user ID is numeric
  icon: (0, pg_core_1.varchar)("icon", { length: 255 }),
  backgroundColor: (0, pg_core_1.varchar)("background_color", { length: 50 }),
  enabled: (0, pg_core_1.boolean)("enabled").default(true),
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
  // Add other fields based on your Scene type and SceneDatabase queries
  // For example, if device_states, schedule, automations are complex objects,
  // you might store them as JSONB or have separate related tables.
  // For simplicity, I'm omitting them for now.
  // tags might be an array of text, or a separate table for many-to-many
  tags: (0, pg_core_1.text)("tags"), // Simplistic representation
});
// You would define other tables here (users, devices, systemMetrics, etc.)
// For example:
// export const users = pgTable('users', { ... });
// export const devices = pgTable('devices', { ... });
// Export all tables to be used by Drizzle
// This is what will be imported as `schema` in db/index.ts

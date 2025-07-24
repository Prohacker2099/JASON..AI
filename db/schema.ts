import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// Placeholder for scenes table - adapt columns as needed based on SceneDatabase.ts usage
export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey(), // Assuming id is a string, adjust if it's serial
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: varchar("user_id", { length: 255 }), // Or integer if user ID is numeric
  icon: varchar("icon", { length: 255 }),
  backgroundColor: varchar("background_color", { length: 50 }),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Add other fields based on your Scene type and SceneDatabase queries
  // For example, if device_states, schedule, automations are complex objects,
  // you might store them as JSONB or have separate related tables.
  // For simplicity, I'm omitting them for now.
  // tags might be an array of text, or a separate table for many-to-many
  tags: text("tags"), // Simplistic representation
});

// You would define other tables here (users, devices, systemMetrics, etc.)
// For example:
// export const users = pgTable('users', { ... });
// export const devices = pgTable('devices', { ... });

// Export all tables to be used by Drizzle
// This is what will be imported as `schema` in db/index.ts

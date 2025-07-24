"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
var serverless_1 = require("@neondatabase/serverless");
var neon_http_1 = require("drizzle-orm/neon-http");
var ws_1 = require("ws");
var schema = require("./schema.js");
// This is the correct way neon config - DO NOT change this
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}
exports.pool = new serverless_1.Pool({
  connectionString: process.env.DATABASE_URL,
});
exports.db = (0, neon_http_1.drizzle)(process.env.DATABASE_URL, {
  schema: schema,
});

"use strict";
/**
 * Database Setup
 *
 * This module sets up the database schema for all three phases of JASON AI Architect.
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = setupDatabase;
var db_js_1 = require("../server/db.js");
var logger_js_1 = require("../server/services/logger.js");
var logger = new logger_js_1.Logger("DatabaseSetup");
/**
 * Set up database schema
 */
function setupDatabase() {
  return __awaiter(this, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 5, , 6]);
          logger.info("Setting up database schema...");
          // Create tables for Phase 1
          return [4 /*yield*/, createPhase1Tables()];
        case 1:
          // Create tables for Phase 1
          _a.sent();
          // Create tables for Phase 2
          return [4 /*yield*/, createPhase2Tables()];
        case 2:
          // Create tables for Phase 2
          _a.sent();
          // Create tables for Phase 3
          return [4 /*yield*/, createPhase3Tables()];
        case 3:
          // Create tables for Phase 3
          _a.sent();
          // Insert default user
          return [4 /*yield*/, insertDefaultUser()];
        case 4:
          // Insert default user
          _a.sent();
          logger.info("Database schema setup complete");
          return [2 /*return*/, true];
        case 5:
          error_1 = _a.sent();
          logger.error("Error setting up database schema:", error_1);
          return [2 /*return*/, false];
        case 6:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Create tables for Phase 1
 */
function createPhase1Tables() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          // Devices table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("devices", {
              id: { type: "TEXT", primaryKey: true },
              name: { type: "TEXT", notNull: true },
              manufacturer: { type: "TEXT" },
              model: { type: "TEXT" },
              type: { type: "TEXT", notNull: true },
              protocol: { type: "TEXT", notNull: true },
              address: { type: "TEXT" },
              port: { type: "INTEGER" },
              hostname: { type: "TEXT" },
              capabilities: { type: "TEXT" }, // JSON array
              state: { type: "TEXT" }, // JSON object
              online: { type: "INTEGER", notNull: true },
              discoveredAt: { type: "TEXT" },
              lastSeenAt: { type: "TEXT" },
              lastControlSource: { type: "TEXT" },
            }),
          ];
        case 1:
          // Devices table
          _a.sent();
          // Automations table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("automations", {
              id: { type: "TEXT", primaryKey: true },
              name: { type: "TEXT", notNull: true },
              enabled: { type: "INTEGER", notNull: true },
              trigger: { type: "TEXT", notNull: true }, // JSON object
              conditions: { type: "TEXT" }, // JSON array
              actions: { type: "TEXT", notNull: true }, // JSON array
              createdAt: { type: "TEXT", notNull: true },
              updatedAt: { type: "TEXT", notNull: true },
              lastTriggeredAt: { type: "TEXT" },
            }),
          ];
        case 2:
          // Automations table
          _a.sent();
          // Scenes table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("scenes", {
              id: { type: "TEXT", primaryKey: true },
              name: { type: "TEXT", notNull: true },
              deviceStates: { type: "TEXT", notNull: true }, // JSON array
              icon: { type: "TEXT" },
              color: { type: "TEXT" },
              createdAt: { type: "TEXT", notNull: true },
              updatedAt: { type: "TEXT", notNull: true },
              lastActivatedAt: { type: "TEXT" },
            }),
          ];
        case 3:
          // Scenes table
          _a.sent();
          // Users table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("users", {
              id: { type: "TEXT", primaryKey: true },
              username: { type: "TEXT", notNull: true, unique: true },
              passwordHash: { type: "TEXT", notNull: true },
              email: { type: "TEXT", unique: true },
              role: { type: "TEXT", notNull: true },
              createdAt: { type: "TEXT", notNull: true },
              lastLoginAt: { type: "TEXT" },
            }),
          ];
        case 4:
          // Users table
          _a.sent();
          logger.info("Phase 1 tables created");
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Create tables for Phase 2
 */
function createPhase2Tables() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          // User activities table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("activities", {
              id: { type: "TEXT", primaryKey: true },
              userId: { type: "TEXT", notNull: true },
              deviceId: { type: "TEXT", notNull: true },
              action: { type: "TEXT", notNull: true },
              timestamp: { type: "TEXT", notNull: true },
              context: { type: "TEXT" }, // JSON object
            }),
          ];
        case 1:
          // User activities table
          _a.sent();
          // Patterns table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("patterns", {
              id: { type: "TEXT", primaryKey: true },
              type: { type: "TEXT", notNull: true },
              description: { type: "TEXT", notNull: true },
              confidence: { type: "REAL", notNull: true },
              devices: { type: "TEXT", notNull: true }, // JSON array
              data: { type: "TEXT", notNull: true }, // JSON object
              createdAt: { type: "TEXT", notNull: true },
              updatedAt: { type: "TEXT", notNull: true },
            }),
          ];
        case 2:
          // Patterns table
          _a.sent();
          logger.info("Phase 2 tables created");
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Create tables for Phase 3
 */
function createPhase3Tables() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          // Data records table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("data_records", {
              id: { type: "TEXT", primaryKey: true },
              userId: { type: "TEXT", notNull: true },
              category: { type: "TEXT", notNull: true },
              source: { type: "TEXT", notNull: true },
              data: { type: "TEXT", notNull: true }, // JSON object
              timestamp: { type: "TEXT", notNull: true },
              encrypted: { type: "INTEGER", notNull: true },
              hash: { type: "TEXT", notNull: true },
            }),
          ];
        case 1:
          // Data records table
          _a.sent();
          // Data consents table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("data_consents", {
              id: { type: "TEXT", primaryKey: true },
              userId: { type: "TEXT", notNull: true },
              category: { type: "TEXT", notNull: true },
              permission: { type: "TEXT", notNull: true },
              purpose: { type: "TEXT", notNull: true },
              expiration: { type: "TEXT", notNull: true },
              createdAt: { type: "TEXT", notNull: true },
            }),
          ];
        case 2:
          // Data consents table
          _a.sent();
          // Data dividends table
          return [
            4 /*yield*/,
            db_js_1.default.createTable("data_dividends", {
              id: { type: "TEXT", primaryKey: true },
              userId: { type: "TEXT", notNull: true },
              amount: { type: "REAL", notNull: true },
              currency: { type: "TEXT", notNull: true },
              source: { type: "TEXT", notNull: true },
              category: { type: "TEXT", notNull: true },
              timestamp: { type: "TEXT", notNull: true },
            }),
          ];
        case 3:
          // Data dividends table
          _a.sent();
          logger.info("Phase 3 tables created");
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Insert default user
 */
function insertDefaultUser() {
  return __awaiter(this, void 0, void 0, function () {
    var existingUser, now, error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [
            4 /*yield*/,
            db_js_1.default.query("users", { username: "admin" }),
          ];
        case 1:
          existingUser = _a.sent();
          if (existingUser && existingUser.length > 0) {
            logger.info("Default user already exists");
            return [2 /*return*/];
          }
          now = new Date().toISOString();
          return [
            4 /*yield*/,
            db_js_1.default.insert("users", {
              id: "default",
              username: "admin",
              passwordHash:
                "$2a$10$8JEFVNYYhLoBysjAxe2/1uwYX.bP/SZtBDTGYFeQrKLkHn.s7HXlS", // 'password'
              email: "admin@jason.local",
              role: "admin",
              createdAt: now,
              lastLoginAt: now,
            }),
          ];
        case 2:
          _a.sent();
          logger.info("Default user created");
          return [3 /*break*/, 4];
        case 3:
          error_2 = _a.sent();
          logger.error("Error creating default user:", error_2);
          throw error_2;
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(function (success) {
      if (success) {
        logger.info("Database setup completed successfully");
        process.exit(0);
      } else {
        logger.error("Database setup failed");
        process.exit(1);
      }
    })
    .catch(function (error) {
      logger.error("Unhandled error during database setup:", error);
      process.exit(1);
    });
}

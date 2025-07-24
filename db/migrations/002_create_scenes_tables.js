"use strict";
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
exports.up = up;
exports.down = down;
function up(db) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            db.exec(
              "\n    -- Scenes table\n    CREATE TABLE IF NOT EXISTS scenes (\n      id TEXT PRIMARY KEY,\n      name TEXT NOT NULL,\n      description TEXT,\n      icon TEXT,\n      color TEXT,\n      owner TEXT NOT NULL,\n      is_template BOOLEAN DEFAULT 0,\n      template_id TEXT,\n      shared BOOLEAN DEFAULT 0,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL,\n      last_activated_at TEXT,\n      tags TEXT\n    );\n\n    -- Scene device states table\n    CREATE TABLE IF NOT EXISTS scene_device_states (\n      scene_id TEXT NOT NULL,\n      device_id TEXT NOT NULL,\n      state TEXT NOT NULL,\n      PRIMARY KEY (scene_id, device_id),\n      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE\n    );\n\n    -- Scene schedules table\n    CREATE TABLE IF NOT EXISTS scene_schedules (\n      id TEXT PRIMARY KEY,\n      scene_id TEXT NOT NULL,\n      type TEXT NOT NULL,\n      time TEXT,\n      days TEXT,\n      date TEXT,\n      enabled BOOLEAN DEFAULT 1,\n      last_run TEXT,\n      next_run TEXT,\n      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE\n    );\n\n    -- Scene automations table\n    CREATE TABLE IF NOT EXISTS scene_automations (\n      id TEXT PRIMARY KEY,\n      scene_id TEXT NOT NULL,\n      type TEXT NOT NULL,\n      trigger TEXT NOT NULL,\n      enabled BOOLEAN DEFAULT 1,\n      last_triggered TEXT,\n      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE\n    );\n\n    -- Scene sharing table\n    CREATE TABLE IF NOT EXISTS scene_sharing (\n      scene_id TEXT NOT NULL,\n      user_id TEXT NOT NULL,\n      shared_at TEXT NOT NULL,\n      PRIMARY KEY (scene_id, user_id),\n      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE\n    );\n\n    -- Scene templates table\n    CREATE TABLE IF NOT EXISTS scene_templates (\n      id TEXT PRIMARY KEY,\n      name TEXT NOT NULL,\n      description TEXT,\n      icon TEXT,\n      color TEXT,\n      category TEXT NOT NULL,\n      popularity INTEGER DEFAULT 0,\n      preview_image TEXT,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL\n    );\n\n    -- Indexes\n    CREATE INDEX idx_scenes_owner ON scenes(owner);\n    CREATE INDEX idx_scenes_template ON scenes(template_id);\n    CREATE INDEX idx_schedules_scene ON scene_schedules(scene_id);\n    CREATE INDEX idx_automations_scene ON scene_automations(scene_id);\n    CREATE INDEX idx_templates_category ON scene_templates(category);\n  ",
            ),
          ];
        case 1:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}
function down(db) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            db.exec(
              "\n    DROP TABLE IF EXISTS scene_sharing;\n    DROP TABLE IF EXISTS scene_automations;\n    DROP TABLE IF EXISTS scene_schedules;\n    DROP TABLE IF EXISTS scene_device_states;\n    DROP TABLE IF EXISTS scene_templates;\n    DROP TABLE IF EXISTS scenes;\n  ",
            ),
          ];
        case 1:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}

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
exports.SceneDatabase = void 0;
var SceneDatabase = /** @class */ (function () {
  function SceneDatabase() {}
  /**
   * Get all scenes
   */
  SceneDatabase.prototype.getAllScenes = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder
        console.warn(
          "getAllScenes in SceneDatabase is not implemented with Drizzle yet.",
        );
        return [2 /*return*/, []];
      });
    });
  };
  /**
   * Get a scene by ID
   */
  SceneDatabase.prototype.getScene = function (id) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder
        console.warn(
          "getScene(".concat(
            id,
            ") in SceneDatabase is not implemented with Drizzle yet.",
          ),
        );
        return [2 /*return*/, null];
      });
    });
  };
  /**
   * Insert a new scene
   */
  SceneDatabase.prototype.insertScene = function (scene) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder and transactions
        console.warn(
          "insertScene for scene ID ".concat(
            scene.id,
            " in SceneDatabase is not implemented with Drizzle yet.",
          ),
        );
        return [2 /*return*/];
      });
    });
  };
  /**
   * Update an existing scene
   */
  SceneDatabase.prototype.updateScene = function (id, scene) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder and transactions
        console.warn(
          "updateScene for scene ID ".concat(
            id,
            " in SceneDatabase is not implemented with Drizzle yet.",
          ),
        );
        return [2 /*return*/];
      });
    });
  };
  /**
   * Delete a scene
   */
  SceneDatabase.prototype.deleteScene = function (id) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder
        console.warn(
          "deleteScene for scene ID ".concat(
            id,
            " in SceneDatabase is not implemented with Drizzle yet.",
          ),
        );
        return [2 /*return*/];
      });
    });
  };
  /**
   * Get all scene templates
   */
  SceneDatabase.prototype.getAllSceneTemplates = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder
        console.warn(
          "getAllSceneTemplates in SceneDatabase is not implemented with Drizzle yet.",
        );
        return [2 /*return*/, []];
      });
    });
  };
  /**
   * Insert a new scene template
   */
  SceneDatabase.prototype.insertSceneTemplate = function (template) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: Refactor to use Drizzle query builder and transactions
        console.warn(
          "insertSceneTemplate for template ID ".concat(
            template.id,
            " in SceneDatabase is not implemented with Drizzle yet.",
          ),
        );
        return [2 /*return*/];
      });
    });
  };
  SceneDatabase.prototype.mapSceneFromDb = function (row) {
    var _a, _b, _c, _d;
    var deviceStates =
      ((_a = row.device_states) === null || _a === void 0
        ? void 0
        : _a.split(",").map(function (ds) {
            var _a = ds.split(":"),
              deviceId = _a[0],
              state = _a[1];
            return {
              deviceId: deviceId,
              state: JSON.parse(state),
            };
          })) || [];
    var schedule = row.schedule_id
      ? {
          id: row.schedule_id,
          type: row.schedule_type,
          time: row.schedule_time,
          days:
            (_b = row.schedule_days) === null || _b === void 0
              ? void 0
              : _b.split(",").map(Number),
          date: row.schedule_date,
          enabled: Boolean(row.schedule_enabled),
          lastRun: row.schedule_last_run,
          nextRun: row.schedule_next_run,
        }
      : undefined;
    var automation = row.automation_id
      ? {
          id: row.automation_id,
          type: row.automation_type,
          trigger: JSON.parse(row.automation_trigger),
          enabled: Boolean(row.automation_enabled),
          lastTriggered: row.automation_last_triggered,
        }
      : undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      deviceStates: deviceStates,
      schedule: schedule,
      automation: automation,
      isTemplate: Boolean(row.is_template),
      templateId: row.template_id,
      shared: Boolean(row.shared),
      sharedWith:
        (_c = row.shared_with) === null || _c === void 0
          ? void 0
          : _c.split(","),
      owner: row.owner,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActivatedAt: row.last_activated_at,
      tags: (_d = row.tags) === null || _d === void 0 ? void 0 : _d.split(","),
    };
  };
  SceneDatabase.prototype.mapTemplateFromDb = function (row) {
    var _a;
    var deviceStates =
      ((_a = row.device_states) === null || _a === void 0
        ? void 0
        : _a.split(",").map(function (ds) {
            var _a = ds.split(":"),
              deviceId = _a[0],
              state = _a[1];
            return {
              deviceId: deviceId,
              state: JSON.parse(state),
            };
          })) || [];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      deviceStates: deviceStates,
      category: row.category,
      popularity: row.popularity,
      previewImage: row.preview_image,
      // owner: row.owner, // SceneTemplate does not have an owner property
      // createdAt: row.created_at, // SceneTemplate does not have createdAt
      // updatedAt: row.updated_at // SceneTemplate does not have updatedAt
    };
  };
  return SceneDatabase;
})();
exports.SceneDatabase = SceneDatabase;

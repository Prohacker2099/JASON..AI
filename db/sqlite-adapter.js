"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.initialize = initialize;
exports.getAllDevices = getAllDevices;
exports.getDeviceById = getDeviceById;
exports.updateDeviceStatus = updateDeviceStatus;
exports.createDevice = createDevice;
exports.getAllSystemMetrics = getAllSystemMetrics;
exports.updateSystemMetric = updateSystemMetric;
exports.getRecentActivities = getRecentActivities;
exports.addActivity = addActivity;
exports.getRecentConsoleMessages = getRecentConsoleMessages;
exports.addConsoleMessage = addConsoleMessage;
atures;
var setup_js_1 = require("./setup.js"); // Corrected import
var uuid_1 = require("uuid");
var db = null;
/**
 * Initialize the database connection
 */
function initialize() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!!db) return [3 /*break*/, 2];
          return [4 /*yield*/, (0, setup_js_1.setupDatabase)()];
        case 1:
          db = _a.sent();
          _a.label = 2;
        case 2:
          return [2 /*return*/, db];
      }
    });
  });
}
/**
 * Get all devices from the database
 */
function getAllDevices() {
  return __awaiter(this, void 0, void 0, function () {
    var devices, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.all("SELECT * FROM devices ORDER BY updated_at DESC"),
          ];
        case 2:
          devices = _a.sent();
          // Parse JSON fields
          return [
            2 /*return*/,
            devices.map(function (device) {
              return __assign(__assign({}, device), {
                details: device.details ? JSON.parse(device.details) : {},
                metrics: device.metrics ? JSON.parse(device.metrics) : [],
              });
            }),
          ];
        case 3:
          error_1 = _a.sent();
          console.error("Error getting devices:", error_1);
          return [2 /*return*/, []];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get a device by ID
 */
function getDeviceById(deviceId) {
  return __awaiter(this, void 0, void 0, function () {
    var device, error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.get("SELECT * FROM devices WHERE device_id = ?", deviceId),
          ];
        case 2:
          device = _a.sent();
          if (!device) return [2 /*return*/, null];
          // Parse JSON fields
          return [
            2 /*return*/,
            __assign(__assign({}, device), {
              details: device.details ? JSON.parse(device.details) : {},
              metrics: device.metrics ? JSON.parse(device.metrics) : [],
            }),
          ];
        case 3:
          error_2 = _a.sent();
          console.error("Error getting device ".concat(deviceId, ":"), error_2);
          return [2 /*return*/, null];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Update device status
 */
function updateDeviceStatus(deviceId, isActive, status) {
  return __awaiter(this, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 7, , 8]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          if (!status) return [3 /*break*/, 3];
          return [
            4 /*yield*/,
            db.run(
              "UPDATE devices SET is_active = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?",
              isActive ? 1 : 0,
              status,
              deviceId,
            ),
          ];
        case 2:
          _a.sent();
          return [3 /*break*/, 5];
        case 3:
          return [
            4 /*yield*/,
            db.run(
              "UPDATE devices SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?",
              isActive ? 1 : 0,
              deviceId,
            ),
          ];
        case 4:
          _a.sent();
          _a.label = 5;
        case 5:
          return [4 /*yield*/, getDeviceById(deviceId)];
        case 6:
          return [2 /*return*/, _a.sent()];
        case 7:
          error_3 = _a.sent();
          console.error(
            "Error updating device ".concat(deviceId, ":"),
            error_3,
          );
          return [2 /*return*/, null];
        case 8:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Create a new device
 */
function createDevice(device) {
  return __awaiter(this, void 0, void 0, function () {
    var details, metrics, error_4;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 4, , 5]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          details = JSON.stringify(device.details || {});
          metrics = JSON.stringify(device.metrics || []);
          return [
            4 /*yield*/,
            db.run(
              "INSERT INTO devices (\n        device_id, name, type, icon, status, is_active, details, metrics\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              device.deviceId || (0, uuid_1.v4)(),
              device.name,
              device.type,
              device.icon || "device",
              device.status || "Unknown",
              device.isActive ? 1 : 0,
              details,
              metrics,
            ),
          ];
        case 2:
          _a.sent();
          return [4 /*yield*/, getDeviceById(device.deviceId)];
        case 3:
          return [2 /*return*/, _a.sent()];
        case 4:
          error_4 = _a.sent();
          console.error("Error creating device:", error_4);
          return [2 /*return*/, null];
        case 5:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get all system metrics
 */
function getAllSystemMetrics() {
  return __awaiter(this, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [4 /*yield*/, db.all("SELECT * FROM system_metrics")];
        case 2:
          return [2 /*return*/, _a.sent()];
        case 3:
          error_5 = _a.sent();
          console.error("Error getting system metrics:", error_5);
          return [2 /*return*/, []];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Update a system metric
 */
function updateSystemMetric(metricId, value, percentage, description) {
  return __awaiter(this, void 0, void 0, function () {
    var metric, error_6;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 12, , 13]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.get(
              "SELECT * FROM system_metrics WHERE metric_id = ?",
              metricId,
            ),
          ];
        case 2:
          metric = _a.sent();
          if (!metric) {
            console.error("Metric ".concat(metricId, " not found"));
            return [2 /*return*/, null];
          }
          if (!(percentage !== undefined && description))
            return [3 /*break*/, 4];
          return [
            4 /*yield*/,
            db.run(
              "UPDATE system_metrics SET value = ?, percentage = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?",
              value,
              percentage,
              description,
              metricId,
            ),
          ];
        case 3:
          _a.sent();
          return [3 /*break*/, 10];
        case 4:
          if (!(percentage !== undefined)) return [3 /*break*/, 6];
          return [
            4 /*yield*/,
            db.run(
              "UPDATE system_metrics SET value = ?, percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?",
              value,
              percentage,
              metricId,
            ),
          ];
        case 5:
          _a.sent();
          return [3 /*break*/, 10];
        case 6:
          if (!description) return [3 /*break*/, 8];
          return [
            4 /*yield*/,
            db.run(
              "UPDATE system_metrics SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?",
              value,
              description,
              metricId,
            ),
          ];
        case 7:
          _a.sent();
          return [3 /*break*/, 10];
        case 8:
          return [
            4 /*yield*/,
            db.run(
              "UPDATE system_metrics SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?",
              value,
              metricId,
            ),
          ];
        case 9:
          _a.sent();
          _a.label = 10;
        case 10:
          return [
            4 /*yield*/,
            db.get(
              "SELECT * FROM system_metrics WHERE metric_id = ?",
              metricId,
            ),
          ];
        case 11:
          return [2 /*return*/, _a.sent()];
        case 12:
          error_6 = _a.sent();
          console.error(
            "Error updating metric ".concat(metricId, ":"),
            error_6,
          );
          return [2 /*return*/, null];
        case 13:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get recent activities
 */
function getRecentActivities() {
  return __awaiter(this, arguments, void 0, function (limit) {
    var error_7;
    if (limit === void 0) {
      limit = 10;
    }
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.all(
              "SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?",
              limit,
            ),
          ];
        case 2:
          return [2 /*return*/, _a.sent()];
        case 3:
          error_7 = _a.sent();
          console.error("Error getting activities:", error_7);
          return [2 /*return*/, []];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Add a new activity
 */
function addActivity(activity) {
  return __awaiter(this, void 0, void 0, function () {
    var error_8;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.run(
              "INSERT INTO activities (activity_id, title, description, type) VALUES (?, ?, ?, ?)",
              activity.activityId || (0, uuid_1.v4)(),
              activity.title,
              activity.description,
              activity.type,
            ),
          ];
        case 2:
          _a.sent();
          return [2 /*return*/, true];
        case 3:
          error_8 = _a.sent();
          console.error("Error adding activity:", error_8);
          return [2 /*return*/, false];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get recent console messages
 */
function getRecentConsoleMessages() {
  return __awaiter(this, arguments, void 0, function (limit) {
    var error_9;
    if (limit === void 0) {
      limit = 20;
    }
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.all(
              "SELECT * FROM console_messages ORDER BY timestamp DESC LIMIT ?",
              limit,
            ),
          ];
        case 2:
          return [2 /*return*/, _a.sent()];
        case 3:
          error_9 = _a.sent();
          console.error("Error getting console messages:", error_9);
          return [2 /*return*/, []];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Add a new console message
 */
function addConsoleMessage(message) {
  return __awaiter(this, void 0, void 0, function () {
    var error_10;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          return [4 /*yield*/, initialize()];
        case 1:
          _a.sent();
          return [
            4 /*yield*/,
            db.run(
              "INSERT INTO console_messages (message_id, text, type) VALUES (?, ?, ?)",
              message.messageId || (0, uuid_1.v4)(),
              message.text,
              message.type,
            ),
          ];
        case 2:
          _a.sent();
          return [2 /*return*/, true];
        case 3:
          error_10 = _a.sent();
          console.error("Error adding console message:", error_10);
          return [2 /*return*/, false];
        case 4:
          return [2 /*return*/];
      }
    });
  });
}
exports.default = {
  initialize: initialize,
  getAllDevices: getAllDevices,
  getDeviceById: getDeviceById,
  updateDeviceStatus: updateDeviceStatus,
  createDevice: createDevice,
  getAllSystemMetrics: getAllSystemMetrics,
  updateSystemMetric: updateSystemMetric,
  getRecentActivities: getRecentActivities,
  addActivity: addActivity,
  getRecentConsoleMessages: getRecentConsoleMessages,
  addConsoleMessage: addConsoleMessage,
};

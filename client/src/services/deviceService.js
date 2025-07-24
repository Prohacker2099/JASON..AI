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
exports.DeviceService = void 0;
var axios_1 = require("axios");
var API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
var DeviceService = /** @class */ (function () {
  function DeviceService(token) {
    this.token = token;
  }
  Object.defineProperty(DeviceService.prototype, "headers", {
    get: function () {
      return {
        Authorization: "Bearer ".concat(this.token),
        "Content-Type": "application/json",
      };
    },
    enumerable: false,
    configurable: true,
  });
  DeviceService.prototype.discoverDevices = function (protocol, timeout) {
    return __awaiter(this, void 0, void 0, function () {
      var params, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            params = new URLSearchParams();
            if (protocol) params.append("protocol", protocol);
            if (timeout) params.append("timeout", timeout.toString());
            return [
              4 /*yield*/,
              axios_1.default.get(
                ""
                  .concat(API_BASE_URL, "/api/devices/discover?")
                  .concat(params),
                {
                  headers: this.headers,
                },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.getAllDevices = function () {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.get("".concat(API_BASE_URL, "/api/devices"), {
                headers: this.headers,
              }),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.getDevice = function (deviceId) {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.get(
                "".concat(API_BASE_URL, "/api/devices/").concat(deviceId),
                {
                  headers: this.headers,
                },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.addDevice = function (device) {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.post(
                "".concat(API_BASE_URL, "/api/devices"),
                device,
                {
                  headers: this.headers,
                },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.updateDevice = function (deviceId, updates) {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.put(
                "".concat(API_BASE_URL, "/api/devices/").concat(deviceId),
                updates,
                { headers: this.headers },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.removeDevice = function (deviceId) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.delete(
                "".concat(API_BASE_URL, "/api/devices/").concat(deviceId),
                {
                  headers: this.headers,
                },
              ),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  DeviceService.prototype.executeCommand = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.post(
                ""
                  .concat(API_BASE_URL, "/api/devices/")
                  .concat(deviceId, "/command"),
                { command: command },
                { headers: this.headers },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.getDeviceState = function (deviceId) {
    return __awaiter(this, void 0, void 0, function () {
      var response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              axios_1.default.get(
                ""
                  .concat(API_BASE_URL, "/api/devices/")
                  .concat(deviceId, "/state"),
                { headers: this.headers },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  DeviceService.prototype.getDeviceHistory = function (
    deviceId,
    startDate,
    endDate,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var params, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate.toISOString());
            if (endDate) params.append("endDate", endDate.toISOString());
            return [
              4 /*yield*/,
              axios_1.default.get(
                ""
                  .concat(API_BASE_URL, "/api/devices/")
                  .concat(deviceId, "/history?")
                  .concat(params),
                { headers: this.headers },
              ),
            ];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response.data];
        }
      });
    });
  };
  // Device type specific methods
  DeviceService.prototype.controlLight = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [2 /*return*/, this.executeCommand(deviceId, command)];
      });
    });
  };
  DeviceService.prototype.controlThermostat = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [2 /*return*/, this.executeCommand(deviceId, command)];
      });
    });
  };
  DeviceService.prototype.controlLock = function (deviceId, command) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [2 /*return*/, this.executeCommand(deviceId, command)];
      });
    });
  };
  return DeviceService;
})();
exports.DeviceService = DeviceService;

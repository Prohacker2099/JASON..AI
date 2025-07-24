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
exports.SceneEditor = void 0;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var SceneScheduler_1 = require("./SceneScheduler");
var SceneAutomator_1 = require("./SceneAutomator");
var DeviceSelector_1 = require("./DeviceSelector");
var input_1 = require("./ui/input");
var button_1 = require("./ui/button");
var tabs_1 = require("./ui/tabs");
var lucide_react_1 = require("lucide-react");
var SceneEditor = function (_a) {
  var scene = _a.scene,
    onSave = _a.onSave,
    onClose = _a.onClose;
  var _b = (0, react_1.useState)(
      (scene === null || scene === void 0 ? void 0 : scene.name) || "",
    ),
    name = _b[0],
    setName = _b[1];
  var _c = (0, react_1.useState)(
      (scene === null || scene === void 0 ? void 0 : scene.deviceStates) || [],
    ),
    deviceStates = _c[0],
    setDeviceStates = _c[1];
  var _d = (0, react_1.useState)("devices"),
    activeTab = _d[0],
    setActiveTab = _d[1];
  var _e = (0, react_1.useState)(false),
    saving = _e[0],
    setSaving = _e[1];
  var _f = (0, react_1.useState)(null),
    error = _f[0],
    setError = _f[1];
  var handleSave = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!name.trim()) {
              setError("Please enter a scene name");
              return [2 /*return*/];
            }
            if (deviceStates.length === 0) {
              setError("Please select at least one device");
              return [2 /*return*/];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            setSaving(true);
            setError(null);
            return [
              4 /*yield*/,
              onSave({
                name: name,
                deviceStates: deviceStates,
                schedule:
                  scene === null || scene === void 0 ? void 0 : scene.schedule,
                automation:
                  scene === null || scene === void 0
                    ? void 0
                    : scene.automation,
              }),
            ];
          case 2:
            _a.sent();
            onClose();
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            setError(
              err_1 instanceof Error ? err_1.message : "Failed to save scene",
            );
            return [3 /*break*/, 5];
          case 4:
            setSaving(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  var handleDeviceStateChange = function (deviceId, state) {
    setDeviceStates(function (prev) {
      return prev.map(function (ds) {
        return ds.deviceId === deviceId
          ? __assign(__assign({}, ds), {
              state: __assign(__assign({}, ds.state), state),
            })
          : ds;
      });
    });
  };
  var handleRemoveDevice = function (deviceId) {
    setDeviceStates(function (prev) {
      return prev.filter(function (ds) {
        return ds.deviceId !== deviceId;
      });
    });
  };
  return (
    <framer_motion_1.motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <GlassmorphicCard_1.GlassmorphicCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">
              {scene ? "Edit Scene" : "Create Scene"}
            </h2>
            <button_1.Button variant="ghost" onClick={onClose}>
              ×
            </button_1.Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Scene Name */}
            <div className="mb-6">
              <input_1.Input
                value={name}
                onChange={function (e) {
                  return setName(e.target.value);
                }}
                placeholder="Enter scene name..."
                className="text-xl font-bold bg-white/5 border-white/10"
              />
            </div>

            {/* Tabs */}
            <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
              <tabs_1.Tab value="devices" icon={<lucide_react_1.Plus />}>
                Devices
              </tabs_1.Tab>
              <tabs_1.Tab value="schedule" icon={<lucide_react_1.Clock />}>
                Schedule
              </tabs_1.Tab>
              <tabs_1.Tab value="automation" icon={<lucide_react_1.Zap />}>
                Automation
              </tabs_1.Tab>
            </tabs_1.Tabs>

            <div className="mt-6">
              {activeTab === "devices" && (
                <DeviceSelector_1.DeviceSelector
                  selectedDevices={deviceStates}
                  onDeviceStateChange={handleDeviceStateChange}
                  onRemoveDevice={handleRemoveDevice}
                />
              )}

              {activeTab === "schedule" && (
                <SceneScheduler_1.SceneScheduler
                  schedule={
                    scene === null || scene === void 0 ? void 0 : scene.schedule
                  }
                  onChange={function (schedule) {
                    return onSave(
                      __assign(__assign({}, scene), { schedule: schedule }),
                    );
                  }}
                />
              )}

              {activeTab === "automation" && (
                <SceneAutomator_1.SceneAutomator
                  automation={
                    scene === null || scene === void 0
                      ? void 0
                      : scene.automation
                  }
                  onChange={function (automation) {
                    return onSave(
                      __assign(__assign({}, scene), { automation: automation }),
                    );
                  }}
                />
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 text-red-400 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-end gap-4">
              <button_1.Button variant="outline" onClick={onClose}>
                Cancel
              </button_1.Button>
              <button_1.Button
                disabled={saving}
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {saving ? (
                  <>
                    <framer_motion_1.motion.div
                      className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <lucide_react_1.Save className="w-4 h-4 mr-2" />
                    Save Scene
                  </>
                )}
              </button_1.Button>
            </div>
          </div>
        </div>
      </GlassmorphicCard_1.GlassmorphicCard>
    </framer_motion_1.motion.div>
  );
};
exports.SceneEditor = SceneEditor;

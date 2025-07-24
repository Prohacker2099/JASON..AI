"use strict";
var __makeTemplateObject =
  (this && this.__makeTemplateObject) ||
  function (cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, "raw", { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
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
exports.default = MainDashboardPanel;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var SystemMetricCard_1 = require("./SystemMetricCard");
var DeviceCard_1 = require("./DeviceCard");
var InsightsPanel_1 = require("./InsightsPanel");
function MainDashboardPanel(_a) {
  var _this = this;
  var systemMetrics = _a.systemMetrics,
    devices = _a.devices,
    consoleMessages = _a.consoleMessages,
    insights = _a.insights,
    onDeviceToggle = _a.onDeviceToggle,
    onAddDevice = _a.onAddDevice,
    onSendCommand = _a.onSendCommand,
    onInsightAction = _a.onInsightAction;
  var _b = (0, react_1.useState)(false),
    isRefreshing = _b[0],
    setIsRefreshing = _b[1];
  var _c = (0, react_1.useState)(null),
    selectedDevice = _c[0],
    setSelectedDevice = _c[1];
  var mouseX = (0, framer_motion_1.useMotionValue)(0);
  var mouseY = (0, framer_motion_1.useMotionValue)(0);
  var handleMouseMove = function (e) {
    var currentTarget = e.currentTarget,
      clientX = e.clientX,
      clientY = e.clientY;
    var _a = currentTarget.getBoundingClientRect(),
      left = _a.left,
      top = _a.top;
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };
  var background = (0, framer_motion_1.useMotionTemplate)(
    templateObject_1 ||
      (templateObject_1 = __makeTemplateObject(
        [
          "\n    radial-gradient(\n      600px circle at ",
          "px ",
          "px,\n      rgba(0, 255, 255, 0.06),\n      transparent 40%\n    )\n  ",
        ],
        [
          "\n    radial-gradient(\n      600px circle at ",
          "px ",
          "px,\n      rgba(0, 255, 255, 0.06),\n      transparent 40%\n    )\n  ",
        ],
      )),
    mouseX,
    mouseY,
  );
  var handleRefresh = function () {
    return __awaiter(_this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        setIsRefreshing(true);
        // Add your refresh logic here
        setTimeout(function () {
          return setIsRefreshing(false);
        }, 1000);
        return [2 /*return*/];
      });
    });
  };
  return (
    <framer_motion_1.motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative lg:col-span-8 rounded-xl p-6 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background */}
      <framer_motion_1.motion.div
        className="pointer-events-none absolute inset-0 h-full w-full backdrop-blur-3xl"
        style={{ background: background }}
      />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <framer_motion_1.motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-[#00FFFF] tracking-tight"
          >
            Command Center
          </framer_motion_1.motion.h2>

          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 rounded-md text-[#00FFFF] bg-white/5 hover:bg-white/10 transition-colors"
            >
              <framer_motion_1.motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={{
                  duration: 1,
                  repeat: isRefreshing ? Infinity : 0,
                }}
                className="mr-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </framer_motion_1.motion.div>
              Refresh
            </button>

            <button
              onClick={onAddDevice}
              className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-[#00FFFF] to-[#0066FF] text-black font-medium hover:opacity-90 transition-opacity"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Device
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <framer_motion_1.AnimatePresence>
            {systemMetrics.map(function (metric, index) {
              return (
                <framer_motion_1.motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SystemMetricCard_1.default metric={metric} />
                </framer_motion_1.motion.div>
              );
            })}
          </framer_motion_1.AnimatePresence>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <framer_motion_1.AnimatePresence>
            {devices.map(function (device, index) {
              return (
                <framer_motion_1.motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    delay: index * 0.05,
                  }}
                >
                  <DeviceCard_1.default
                    device={device}
                    onClick={function () {
                      return setSelectedDevice(device.id);
                    }}
                    onControl={function (command) {
                      return onDeviceToggle(device.id, command.isActive);
                    }}
                    className={
                      selectedDevice === device.id
                        ? "ring-2 ring-[#00FFFF]"
                        : ""
                    }
                  />
                </framer_motion_1.motion.div>
              );
            })}
          </framer_motion_1.AnimatePresence>
        </div>

        {/* Command Console */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-black/30 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-[#00FFFF] mb-3">
              Command Console
            </h3>
            <div className="space-y-2">
              {consoleMessages.map(function (message) {
                return (
                  <div
                    key={message.id}
                    className={"p-2 rounded ".concat(
                      message.type === "system"
                        ? "bg-blue-500/20 text-blue-200"
                        : message.type === "error"
                          ? "bg-red-500/20 text-red-200"
                          : message.type === "success"
                            ? "bg-green-500/20 text-green-200"
                            : "bg-white/10 text-white/90",
                    )}
                  >
                    <span className="text-sm">{message.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter command..."
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                onKeyPress={function (e) {
                  if (e.key === "Enter") {
                    onSendCommand(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
        </framer_motion_1.motion.div>

        {/* Insights Panel */}
        <framer_motion_1.motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <InsightsPanel_1.default
            insights={insights}
            onAction={onInsightAction}
          />
        </framer_motion_1.motion.div>
      </div>
    </framer_motion_1.motion.section>
  );
}
var templateObject_1;

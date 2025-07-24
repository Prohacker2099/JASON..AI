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
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneScheduler = void 0;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var luxon_1 = require("luxon");
var calendar_1 = require("./ui/calendar");
var select_1 = require("./ui/select");
var input_1 = require("./ui/input");
var switch_1 = require("./ui/switch");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var SceneScheduler = function (_a) {
  var _b;
  var schedule = _a.schedule,
    onChange = _a.onChange;
  var _c = (0, react_1.useState)(
      (_b =
        schedule === null || schedule === void 0
          ? void 0
          : schedule.enabled) !== null && _b !== void 0
        ? _b
        : false,
    ),
    enabled = _c[0],
    setEnabled = _c[1];
  var _d = (0, react_1.useState)(
      (schedule === null || schedule === void 0 ? void 0 : schedule.type) ||
        "once",
    ),
    type = _d[0],
    setType = _d[1];
  var _e = (0, react_1.useState)(
      (schedule === null || schedule === void 0 ? void 0 : schedule.time) ||
        "00:00",
    ),
    time = _e[0],
    setTime = _e[1];
  var _f = (0, react_1.useState)(
      schedule === null || schedule === void 0 ? void 0 : schedule.date,
    ),
    date = _f[0],
    setDate = _f[1];
  var _g = (0, react_1.useState)(
      (schedule === null || schedule === void 0 ? void 0 : schedule.days) || [],
    ),
    days = _g[0],
    setDays = _g[1];
  (0, react_1.useEffect)(
    function () {
      if (enabled) {
        var newSchedule = __assign(
          __assign(
            __assign(
              {
                id:
                  (schedule === null || schedule === void 0
                    ? void 0
                    : schedule.id) || crypto.randomUUID(),
                type: type,
                enabled: enabled,
              },
              type === "once" ? { date: date } : {},
            ),
            type !== "once" ? { time: time } : {},
          ),
          type === "weekly" ? { days: days } : {},
        );
        onChange(newSchedule);
      } else {
        onChange(undefined);
      }
    },
    [type, time, date, days, enabled],
  );
  var toggleDay = function (day) {
    if (days.includes(day)) {
      setDays(
        days.filter(function (d) {
          return d !== day;
        }),
      );
    } else {
      setDays(
        __spreadArray(__spreadArray([], days, true), [day], false).sort(),
      );
    }
  };
  var weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var renderScheduleConfig = function () {
    switch (type) {
      case "once":
        return (
          <div className="space-y-4">
            <calendar_1.Calendar
              mode="single"
              selected={date ? new Date(date) : undefined}
              onSelect={function (date) {
                return setDate(
                  date === null || date === void 0
                    ? void 0
                    : date.toISOString(),
                );
              }}
              disabled={{ before: new Date() }}
              className="rounded-md border border-white/10 bg-white/5"
            />
            <input_1.Input
              type="time"
              value={time}
              onChange={function (e) {
                return setTime(e.target.value);
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
        );
      case "daily":
        return (
          <div>
            <label className="text-sm text-white/60 mb-2 block">Time</label>
            <input_1.Input
              type="time"
              value={time}
              onChange={function (e) {
                return setTime(e.target.value);
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
        );
      case "weekly":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Time</label>
              <input_1.Input
                type="time"
                value={time}
                onChange={function (e) {
                  return setTime(e.target.value);
                }}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Days</label>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(function (day, index) {
                  return (
                    <button
                      key={day}
                      onClick={function () {
                        return toggleDay(index);
                      }}
                      className={"p-2 text-sm rounded-md transition-colors ".concat(
                        days.includes(index)
                          ? "bg-[#00FFFF] text-black"
                          : "bg-white/5 hover:bg-white/10",
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <GlassmorphicCard_1.default className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Schedule</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/60">Enable Schedule</span>
          <switch_1.Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {enabled && (
        <framer_motion_1.motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Schedule Type
            </label>
            <select_1.Select
              value={type}
              onValueChange={setType}
              options={[
                { value: "once", label: "One Time" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
              ]}
              className="bg-white/5 border-white/10"
            />
          </div>

          {renderScheduleConfig()}

          {(schedule === null || schedule === void 0
            ? void 0
            : schedule.lastRun) && (
            <div className="text-sm text-white/60">
              Last run:{" "}
              {luxon_1.DateTime.fromISO(schedule.lastRun).toLocaleString(
                luxon_1.DateTime.DATETIME_FULL,
              )}
            </div>
          )}
          {(schedule === null || schedule === void 0
            ? void 0
            : schedule.nextRun) && (
            <div className="text-sm text-white/60">
              Next run:{" "}
              {luxon_1.DateTime.fromISO(schedule.nextRun).toLocaleString(
                luxon_1.DateTime.DATETIME_FULL,
              )}
            </div>
          )}
        </framer_motion_1.motion.div>
      )}
    </GlassmorphicCard_1.default>
  );
};
exports.SceneScheduler = SceneScheduler;

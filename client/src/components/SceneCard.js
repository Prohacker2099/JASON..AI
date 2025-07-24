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
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var SceneCard = function (_a) {
  var scene = _a.scene,
    onActivate = _a.onActivate,
    _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var _c = (0, react_1.useState)(false),
    isActivating = _c[0],
    setIsActivating = _c[1];
  var _d = (0, react_1.useState)(false),
    isHovered = _d[0],
    setIsHovered = _d[1];
  var handleActivate = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, 3, 4]);
            setIsActivating(true);
            return [4 /*yield*/, onActivate(scene.id)];
          case 1:
            _a.sent();
            return [3 /*break*/, 4];
          case 2:
            error_1 = _a.sent();
            console.error("Error activating scene:", error_1);
            return [3 /*break*/, 4];
          case 3:
            setIsActivating(false);
            return [7 /*endfinally*/];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // Generate a random gradient if no color is specified
  var gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-yellow-500 to-orange-600",
    "from-red-500 to-pink-600",
    "from-indigo-500 to-blue-600",
  ];
  var gradient =
    scene.color || gradients[Math.floor(Math.random() * gradients.length)];
  return (
    <framer_motion_1.motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={function () {
        return setIsHovered(true);
      }}
      onHoverEnd={function () {
        return setIsHovered(false);
      }}
    >
      <GlassmorphicCard_1.GlassmorphicCard
        className={"p-4 cursor-pointer ".concat(className)}
        glowColor={"bg-gradient-to-r ".concat(gradient)}
        hoverEffect
      >
        {/* Header */}
        <div className="relative flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mr-3">
            {scene.icon ? (
              <img src={scene.icon} alt={scene.name} className="w-6 h-6" />
            ) : (
              <lucide_react_1.LightbulbIcon className="w-6 h-6 text-white/80" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{scene.name}</h3>
            <p className="text-sm text-white/60">
              {scene.deviceStates.length}{" "}
              {scene.deviceStates.length === 1 ? "device" : "devices"}
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {scene.deviceStates.slice(0, 3).map(function (device, index) {
            return (
              <div
                key={device.deviceId}
                className="bg-white/5 rounded-lg p-2 text-center"
              >
                <div className="text-xs text-white/60 truncate">
                  {device.state.name || "Device ".concat(index + 1)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Activation Button */}
        <framer_motion_1.motion.button
          onClick={handleActivate}
          disabled={isActivating}
          className={"\n            w-full px-4 py-2 rounded-lg\n            bg-gradient-to-r ".concat(
            gradient,
            "\n            text-white font-medium\n            flex items-center justify-center\n            disabled:opacity-50 disabled:cursor-not-allowed\n          ",
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isActivating ? (
            <>
              <lucide_react_1.PauseIcon className="w-4 h-4 mr-2 animate-pulse" />
              Activating...
            </>
          ) : (
            <>
              <lucide_react_1.PlayIcon className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </framer_motion_1.motion.button>

        {/* Last Activated */}
        {scene.lastActivatedAt && (
          <div className="mt-2 text-xs text-white/40 text-center">
            Last activated: {new Date(scene.lastActivatedAt).toLocaleString()}
          </div>
        )}
      </GlassmorphicCard_1.GlassmorphicCard>
    </framer_motion_1.motion.div>
  );
};
exports.default = SceneCard;

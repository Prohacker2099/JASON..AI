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
var SceneCard_1 = require("./SceneCard");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var ScenesPanel = function (_a) {
  var onCreateScene = _a.onCreateScene;
  var _b = (0, react_1.useState)([]),
    scenes = _b[0],
    setScenes = _b[1];
  var _c = (0, react_1.useState)(true),
    loading = _c[0],
    setLoading = _c[1];
  var _d = (0, react_1.useState)(null),
    error = _d[0],
    setError = _d[1];
  var _e = (0, react_1.useState)(""),
    searchQuery = _e[0],
    setSearchQuery = _e[1];
  // Fetch scenes on component mount
  (0, react_1.useEffect)(function () {
    fetchScenes();
  }, []);
  // Fetch scenes from API
  var fetchScenes = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            return [4 /*yield*/, fetch("/api/scenes")];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch scenes");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setScenes(data);
            return [3 /*break*/, 5];
          case 3:
            error_1 = _a.sent();
            console.error("Error fetching scenes:", error_1);
            setError("Failed to load scenes. Please try again.");
            return [3 /*break*/, 5];
          case 4:
            setLoading(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  // Activate a scene
  var activateScene = function (id) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              fetch("/api/scenes/".concat(id, "/activate"), {
                method: "POST",
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to activate scene");
            }
            // Refetch scenes to get updated lastActivatedAt timestamp
            fetchScenes();
            return [3 /*break*/, 3];
          case 2:
            error_2 = _a.sent();
            console.error("Error activating scene:", error_2);
            throw error_2;
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  // Filter scenes based on search query
  var filteredScenes = scenes.filter(function (scene) {
    return scene.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <framer_motion_1.motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-[#00FFFF] tracking-tight"
        >
          Scenes
        </framer_motion_1.motion.h2>

        <framer_motion_1.motion.button
          onClick={onCreateScene}
          className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-[#00FFFF] to-[#0066FF] text-black font-medium hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <lucide_react_1.Plus className="w-4 h-4 mr-2" />
          Create Scene
        </framer_motion_1.motion.button>
      </div>

      {/* Search Bar */}
      <GlassmorphicCard_1.GlassmorphicCard className="p-2">
        <div className="relative">
          <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search scenes..."
            value={searchQuery}
            onChange={function (e) {
              return setSearchQuery(e.target.value);
            }}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/50 rounded-lg"
          />
        </div>
      </GlassmorphicCard_1.GlassmorphicCard>

      {/* Scenes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <lucide_react_1.Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
        </div>
      ) : error ? (
        <GlassmorphicCard_1.GlassmorphicCard className="p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchScenes}
            className="px-4 py-2 bg-[#00FFFF] text-black rounded-lg font-medium"
          >
            Retry
          </button>
        </GlassmorphicCard_1.GlassmorphicCard>
      ) : filteredScenes.length === 0 ? (
        <GlassmorphicCard_1.GlassmorphicCard className="p-6 text-center">
          <p className="text-gray-400">
            {searchQuery
              ? "No scenes match your search."
              : "No scenes created yet."}
          </p>
          {!searchQuery && (
            <button
              onClick={onCreateScene}
              className="mt-4 px-4 py-2 bg-[#00FFFF] text-black rounded-lg font-medium"
            >
              Create Your First Scene
            </button>
          )}
        </GlassmorphicCard_1.GlassmorphicCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <framer_motion_1.AnimatePresence mode="popLayout">
            {filteredScenes.map(function (scene) {
              return (
                <SceneCard_1.default
                  key={scene.id}
                  scene={scene}
                  onActivate={activateScene}
                />
              );
            })}
          </framer_motion_1.AnimatePresence>
        </div>
      )}
    </div>
  );
};
exports.default = ScenesPanel;
exports.default = ScenesPanel;

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
var react_1 = require("react");
var dialog_1 = require("./ui/dialog");
var input_1 = require("./ui/input");
var button_1 = require("./ui/button");
var switch_1 = require("./ui/switch");
var lucide_react_1 = require("lucide-react");
var GlassmorphicCard_1 = require("./GlassmorphicCard");
var CreateSceneModal = function (_a) {
  var isOpen = _a.isOpen,
    onClose = _a.onClose,
    onSceneCreated = _a.onSceneCreated;
  var _b = (0, react_1.useState)(""),
    name = _b[0],
    setName = _b[1];
  var _c = (0, react_1.useState)({}),
    selectedDevices = _c[0],
    setSelectedDevices = _c[1];
  var _d = (0, react_1.useState)([]),
    devices = _d[0],
    setDevices = _d[1];
  var _e = (0, react_1.useState)(false),
    loading = _e[0],
    setLoading = _e[1];
  var _f = (0, react_1.useState)(null),
    error = _f[0],
    setError = _f[1];
  // Fetch devices when modal opens
  (0, react_1.useEffect)(
    function () {
      if (isOpen) {
        fetchDevices();
      }
    },
    [isOpen],
  );
  var fetchDevices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [4 /*yield*/, fetch("/api/devices")];
          case 1:
            response = _a.sent();
            if (!response.ok) throw new Error("Failed to fetch devices");
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setDevices(data);
            return [3 /*break*/, 4];
          case 3:
            error_1 = _a.sent();
            console.error("Error fetching devices:", error_1);
            setError("Failed to load devices");
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  var handleSubmit = function (e) {
    return __awaiter(void 0, void 0, void 0, function () {
      var selectedDeviceIds, selectedDeviceStates, response, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            e.preventDefault();
            if (!name.trim()) {
              setError("Please enter a scene name");
              return [2 /*return*/];
            }
            selectedDeviceIds = Object.entries(selectedDevices)
              .filter(function (_a) {
                var _ = _a[0],
                  isSelected = _a[1];
                return isSelected;
              })
              .map(function (_a) {
                var id = _a[0];
                return id;
              });
            if (selectedDeviceIds.length === 0) {
              setError("Please select at least one device");
              return [2 /*return*/];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            setLoading(true);
            setError(null);
            selectedDeviceStates = devices
              .filter(function (device) {
                return selectedDevices[device.id];
              })
              .map(function (device) {
                return {
                  deviceId: device.id,
                  state: device.state,
                };
              });
            return [
              4 /*yield*/,
              fetch("/api/scenes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: name,
                  deviceStates: selectedDeviceStates,
                }),
              }),
            ];
          case 2:
            response = _a.sent();
            if (!response.ok) throw new Error("Failed to create scene");
            onSceneCreated();
            handleClose();
            return [3 /*break*/, 5];
          case 3:
            error_2 = _a.sent();
            console.error("Error creating scene:", error_2);
            setError("Failed to create scene");
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
  var handleClose = function () {
    setName("");
    setSelectedDevices({});
    setError(null);
    onClose();
  };
  return (
    <dialog_1.Dialog open={isOpen} onOpenChange={handleClose}>
      <dialog_1.DialogContent className="bg-[#1A1A1A] border border-white/10 text-white max-w-2xl">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Create New Scene</dialog_1.DialogTitle>
          <dialog_1.DialogDescription className="text-white/60">
            Capture the current state of your devices in a new scene.
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Scene Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Scene Name
              </label>
              <input_1.Input
                id="name"
                value={name}
                onChange={function (e) {
                  return setName(e.target.value);
                }}
                placeholder="Enter scene name..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Device Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Devices
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                {devices.map(function (device) {
                  return (
                    <GlassmorphicCard_1.GlassmorphicCard
                      key={device.id}
                      className="p-4 cursor-pointer"
                      onClick={function () {
                        return setSelectedDevices(function (prev) {
                          var _a;
                          return __assign(
                            __assign({}, prev),
                            ((_a = {}), (_a[device.id] = !prev[device.id]), _a),
                          );
                        });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{device.name}</h4>
                          <p className="text-sm text-white/60">{device.type}</p>
                        </div>
                        <switch_1.Switch
                          checked={selectedDevices[device.id] || false}
                          onCheckedChange={function (checked) {
                            return setSelectedDevices(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}), (_a[device.id] = checked), _a),
                              );
                            });
                          }}
                        />
                      </div>
                    </GlassmorphicCard_1.GlassmorphicCard>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <dialog_1.DialogFooter className="mt-6">
            <button_1.Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </button_1.Button>
            <button_1.Button
              type="submit"
              className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Scene"
              )}
            </button_1.Button>
          </dialog_1.DialogFooter>
        </form>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>
  );
};
exports.default = CreateSceneModal;

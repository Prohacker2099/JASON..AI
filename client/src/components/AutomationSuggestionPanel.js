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
exports.AutomationSuggestionPanel = void 0;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
var lucide_react_1 = require("lucide-react");
var AutomationSuggestionPanel = function (_a) {
  var onAccept = _a.onAccept,
    onDismiss = _a.onDismiss;
  var _b = (0, react_1.useState)([]),
    suggestions = _b[0],
    setSuggestions = _b[1];
  var _c = (0, react_1.useState)(true),
    loading = _c[0],
    setLoading = _c[1];
  (0, react_1.useEffect)(function () {
    var fetchSuggestions = function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 3, 4, 5]);
              return [4 /*yield*/, fetch("/api/patterns/suggestions")];
            case 1:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 2:
              data = _a.sent();
              if (data.success) {
                setSuggestions(data.suggestions);
              }
              return [3 /*break*/, 5];
            case 3:
              error_1 = _a.sent();
              console.error("Error fetching automation suggestions:", error_1);
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
    fetchSuggestions();
    // Poll for new suggestions every 5 minutes
    var interval = setInterval(fetchSuggestions, 5 * 60 * 1000);
    return function () {
      return clearInterval(interval);
    };
  }, []);
  var handleAccept = function (suggestion) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [
              4 /*yield*/,
              fetch(
                "/api/patterns/suggestions/".concat(suggestion.id, "/apply"),
                {
                  method: "POST",
                },
              ),
            ];
          case 1:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            if (data.success) {
              onAccept(suggestion);
              setSuggestions(
                suggestions.filter(function (s) {
                  return s.id !== suggestion.id;
                }),
              );
            }
            return [3 /*break*/, 4];
          case 3:
            error_2 = _a.sent();
            console.error("Error applying automation suggestion:", error_2);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  var handleDismiss = function (suggestionId) {
    onDismiss(suggestionId);
    setSuggestions(
      suggestions.filter(function (s) {
        return s.id !== suggestionId;
      }),
    );
  };
  if (loading) {
    return (
      <card_1.Card className="p-4 bg-black/20 backdrop-blur border-white/10">
        <div className="text-white/60">Loading suggestions...</div>
      </card_1.Card>
    );
  }
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white flex items-center gap-2">
        <lucide_react_1.AlertCircle className="w-5 h-5" />
        Automation Suggestions
      </h3>
      {suggestions.map(function (suggestion) {
        return (
          <framer_motion_1.motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative"
          >
            <card_1.Card className="p-4 bg-black/20 backdrop-blur border-white/10">
              <div className="mb-3">
                <h4 className="font-medium text-white">{suggestion.title}</h4>
                <p className="text-sm text-white/60">
                  {suggestion.description}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-white/40">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </div>
                <div className="flex gap-2">
                  <button_1.Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-red-500/10"
                    onClick={function () {
                      return handleDismiss(suggestion.id);
                    }}
                  >
                    <lucide_react_1.X className="w-4 h-4" />
                  </button_1.Button>
                  <button_1.Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-green-500/10"
                    onClick={function () {
                      return handleAccept(suggestion);
                    }}
                  >
                    <lucide_react_1.Check className="w-4 h-4" />
                  </button_1.Button>
                </div>
              </div>
            </card_1.Card>
          </framer_motion_1.motion.div>
        );
      })}
    </div>
  );
};
exports.AutomationSuggestionPanel = AutomationSuggestionPanel;

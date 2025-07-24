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
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var badge_1 = require("./ui/badge");
var progress_1 = require("./ui/progress");
var lucide_react_1 = require("lucide-react");
var roadmapService_1 = require("../lib/roadmapService");
var AILearningPanel = function () {
  var _a, _b, _c, _d, _e;
  var _f = (0, react_1.useState)(true),
    loading = _f[0],
    setLoading = _f[1];
  var _g = (0, react_1.useState)(false),
    training = _g[0],
    setTraining = _g[1];
  var _h = (0, react_1.useState)(false),
    predicting = _h[0],
    setPredicting = _h[1];
  var _j = (0, react_1.useState)(null),
    error = _j[0],
    setError = _j[1];
  var _k = (0, react_1.useState)(null),
    aiStatus = _k[0],
    setAiStatus = _k[1];
  var _l = (0, react_1.useState)([]),
    predictions = _l[0],
    setPredictions = _l[1];
  (0, react_1.useEffect)(function () {
    fetchAIStatus();
  }, []);
  var fetchAIStatus = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var status_1, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setLoading(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              roadmapService_1.default.getAILearningStatus(),
            ];
          case 2:
            status_1 = _a.sent();
            setAiStatus(status_1);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            console.error("Error fetching AI status:", err_1);
            setError("Failed to load AI learning status");
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
  var startTraining = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setTraining(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, roadmapService_1.default.trainAIModels()];
          case 2:
            _a.sent();
            // In a real implementation, we would listen for training progress events
            // For now, just wait a bit and refresh the status
            setTimeout(function () {
              fetchAIStatus();
              setTraining(false);
            }, 5000);
            return [3 /*break*/, 4];
          case 3:
            err_2 = _a.sent();
            console.error("Error starting AI training:", err_2);
            setError("Failed to start AI training");
            setTraining(false);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  var getPredictions = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var now, context, result, err_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setPredicting(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            now = new Date();
            context = {
              timeOfDay: now.getHours(),
              dayOfWeek: now.getDay(),
              isWeekend: [0, 6].includes(now.getDay()),
            };
            return [
              4 /*yield*/,
              roadmapService_1.default.getPredictions(context),
            ];
          case 2:
            result = _a.sent();
            setPredictions(result.predictions || []);
            return [3 /*break*/, 5];
          case 3:
            err_3 = _a.sent();
            console.error("Error getting predictions:", err_3);
            setError("Failed to get predictions");
            return [3 /*break*/, 5];
          case 4:
            setPredicting(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  if (loading) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>AI Learning Engine</card_1.CardTitle>
          <card_1.CardDescription>Loading AI status...</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="flex justify-center py-8">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  if (error) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>AI Learning Engine</card_1.CardTitle>
          <card_1.CardDescription>
            Error loading AI status
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="text-red-400">{error}</div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button onClick={fetchAIStatus}>Retry</button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    );
  }
  return (
    <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
      <card_1.CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <card_1.CardTitle>AI Learning Engine</card_1.CardTitle>
            <card_1.CardDescription>
              Developing sophisticated pattern recognition and predictive
              capabilities
            </card_1.CardDescription>
          </div>
          <div className="flex space-x-2">
            <button_1.Button
              onClick={getPredictions}
              disabled={predicting}
              variant="outline"
              className="flex items-center"
            >
              {predicting ? (
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <lucide_react_1.Zap className="mr-2 h-4 w-4" />
              )}
              Predict
            </button_1.Button>
            <button_1.Button
              onClick={startTraining}
              disabled={training}
              className="bg-purple-600 hover:bg-purple-700 flex items-center"
            >
              {training ? (
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <lucide_react_1.Brain className="mr-2 h-4 w-4" />
              )}
              {training ? "Training..." : "Train Model"}
            </button_1.Button>
          </div>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center">
              <lucide_react_1.Brain className="mr-2 h-4 w-4" />
              Model Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Version</span>
                <badge_1.Badge variant="outline">
                  {((_a =
                    aiStatus === null || aiStatus === void 0
                      ? void 0
                      : aiStatus.modelInfo) === null || _a === void 0
                    ? void 0
                    : _a.version) || "N/A"}
                </badge_1.Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Data Points</span>
                <badge_1.Badge variant="outline">
                  {((_c =
                    (_b =
                      aiStatus === null || aiStatus === void 0
                        ? void 0
                        : aiStatus.modelInfo) === null || _b === void 0
                      ? void 0
                      : _b.dataPoints) === null || _c === void 0
                    ? void 0
                    : _c.toLocaleString()) || "0"}
                </badge_1.Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Last Trained</span>
                <badge_1.Badge variant="outline">
                  {(
                    (_d =
                      aiStatus === null || aiStatus === void 0
                        ? void 0
                        : aiStatus.modelInfo) === null || _d === void 0
                      ? void 0
                      : _d.lastTrained
                  )
                    ? new Date(aiStatus.modelInfo.lastTrained).toLocaleString()
                    : "Never"}
                </badge_1.Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Training Progress</span>
                <span className="text-sm">
                  {training ? "In Progress" : "Idle"}
                </span>
              </div>
              {training && <progress_1.Progress value={45} className="h-2" />}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center">
              <lucide_react_1.BarChart3 className="mr-2 h-4 w-4" />
              Recognized Patterns
            </h3>
            {((_e =
              aiStatus === null || aiStatus === void 0
                ? void 0
                : aiStatus.patterns) === null || _e === void 0
              ? void 0
              : _e.length) > 0 ? (
              <div className="space-y-2">
                {aiStatus.patterns.slice(0, 3).map(function (pattern, index) {
                  return (
                    <div
                      key={index}
                      className="border border-gray-700 rounded-md p-3"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          {pattern.patternId.split("_")[0]}
                        </span>
                        <badge_1.Badge>
                          {Math.round(pattern.confidence * 100)}%
                        </badge_1.Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        {pattern.description}
                      </p>
                      {pattern.suggestedActions &&
                        pattern.suggestedActions.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-400">
                              Suggested Action:
                            </span>
                            <p className="text-xs">
                              {pattern.suggestedActions[0].type}
                            </p>
                          </div>
                        )}
                    </div>
                  );
                })}
                {aiStatus.patterns.length > 3 && (
                  <div className="text-center text-xs text-gray-400">
                    +{aiStatus.patterns.length - 3} more patterns
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No patterns recognized yet
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center">
            <lucide_react_1.Zap className="mr-2 h-4 w-4" />
            Predictions
          </h3>
          {predictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predictions.map(function (prediction, index) {
                return (
                  <div
                    key={index}
                    className="border border-gray-700 rounded-md p-3"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {prediction.eventType}
                      </span>
                      <badge_1.Badge className="bg-blue-600">
                        {Math.round(prediction.probability * 100)}%
                      </badge_1.Badge>
                    </div>
                    {prediction.estimatedTime && (
                      <p className="text-xs text-gray-400">
                        Expected:{" "}
                        {new Date(
                          prediction.estimatedTime,
                        ).toLocaleTimeString()}
                      </p>
                    )}
                    {prediction.relatedDevices.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prediction.relatedDevices.map(function (device, i) {
                          return (
                            <badge_1.Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {device}
                            </badge_1.Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
              {predicting
                ? "Generating predictions..."
                : 'No predictions available. Click "Predict" to generate.'}
            </div>
          )}
        </div>
      </card_1.CardContent>
      <card_1.CardFooter className="flex justify-between border-t border-gray-700 pt-4">
        <span className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
        <button_1.Button variant="outline" size="sm" onClick={fetchAIStatus}>
          Refresh
        </button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = AILearningPanel;

"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalAutonomyLoop = void 0;
var MistralClient_1 = require("../ai/mistral/MistralClient");
var events_1 = require("events");
var UniversalAutonomyLoop = /** @class */ (function (_super) {
    __extends(UniversalAutonomyLoop, _super);
    function UniversalAutonomyLoop(appController) {
        var _this = _super.call(this) || this;
        _this.maxSteps = 20;
        _this.running = false;
        _this.appController = appController;
        return _this;
    }
    UniversalAutonomyLoop.prototype.executeGoal = function (goal) {
        return __awaiter(this, void 0, void 0, function () {
            var stepCount, plan, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.running)
                            throw new Error("Autonomy loop already running");
                        this.running = true;
                        console.log("[AutonomyLoop] Starting goal: \"".concat(goal, "\""));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, 9, 10]);
                        stepCount = 0;
                        _a.label = 2;
                    case 2:
                        if (!(stepCount < this.maxSteps)) return [3 /*break*/, 7];
                        // 1. Capture & Analyze State (See)
                        console.log("[AutonomyLoop] Step ".concat(stepCount + 1, ": Analyzing screen..."));
                        return [4 /*yield*/, this.askLLM(goal, stepCount)];
                    case 3:
                        plan = _a.sent();
                        console.log("[AutonomyLoop] reasoning: ".concat(plan.currentReasoning));
                        console.log("[AutonomyLoop] verification: Action=".concat(plan.nextAction.type, " Target=").concat(plan.nextAction.target));
                        if (plan.nextAction.type === 'done') {
                            console.log("[AutonomyLoop] Goal completed!");
                            return [2 /*return*/, true];
                        }
                        if (plan.nextAction.type === 'fail') {
                            console.error("[AutonomyLoop] Goal failed: ".concat(plan.nextAction.reason));
                            return [2 /*return*/, false];
                        }
                        // 3. Execute (Act)
                        return [4 /*yield*/, this.executeAction(plan.nextAction)
                            // Wait for UI to settle
                        ];
                    case 4:
                        // 3. Execute (Act)
                        _a.sent();
                        // Wait for UI to settle
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 2000); })];
                    case 5:
                        // Wait for UI to settle
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        stepCount++;
                        return [3 /*break*/, 2];
                    case 7: throw new Error("Max steps reached without completion");
                    case 8:
                        e_1 = _a.sent();
                        console.error("[AutonomyLoop] Error: ".concat(e_1));
                        return [2 /*return*/, false];
                    case 9:
                        this.running = false;
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    UniversalAutonomyLoop.prototype.askLLM = function (goal, stepIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, responseText, jsonStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemPrompt = "You are an autonomous GUI agent.\n        Goal: \"".concat(goal, "\"\n        Step: ").concat(stepIndex + 1, "\n        \n        Reflect on the goal. What is the immediate next physical UI action required?\n        If the goal implies opening an app, search for it or click its icon.\n        If the goal implies typing, click the field then type.\n        \n        Respond ONLY in JSON format:\n        {\n            \"currentReasoning\": \"Why this action is needed\",\n            \"nextAction\": {\n                \"type\": \"click\" | \"type\" | \"done\" | \"fail\",\n                \"target\": \"text description of element to interact with\",\n                \"text\": \"text to type if type action\",\n                \"reason\": \"short rationale\"\n            }\n        }");
                        return [4 /*yield*/, MistralClient_1.mistralClient.generate(systemPrompt, "Goal: ".concat(goal))
                            // Clean markdown if present
                        ];
                    case 1:
                        responseText = _a.sent();
                        jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                        try {
                            return [2 /*return*/, JSON.parse(jsonStr)];
                        }
                        catch (e) {
                            // Fallback for malformed JSON - rudimentary repair or fail
                            console.warn("LLM returned invalid JSON, retrying or failing gracefully.");
                            throw new Error("Invalid LLM JSON response");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UniversalAutonomyLoop.prototype.executeAction = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cmd = {
                            id: "auto_".concat(Date.now()),
                            intent: 'autonomy_step',
                            app: 'system', // Generic context
                            action: action.type,
                            parameters: {
                                target: action.target,
                                text: action.text
                            },
                            priority: 'high',
                            permissions: ['ui_control'],
                            execution: {
                                type: 'vlm', // Force VLM usage to find elements visually
                                confidence: 0.8
                            }
                        };
                        if (!(action.type === 'click' || action.type === 'type')) return [3 /*break*/, 2];
                        // UniversalAppController handles the "VLM find -> Click" logic via executeUniversalCommand
                        return [4 /*yield*/, this.appController.executeUniversalCommand(cmd)];
                    case 1:
                        // UniversalAppController handles the "VLM find -> Click" logic via executeUniversalCommand
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return UniversalAutonomyLoop;
}(events_1.EventEmitter));
exports.UniversalAutonomyLoop = UniversalAutonomyLoop;

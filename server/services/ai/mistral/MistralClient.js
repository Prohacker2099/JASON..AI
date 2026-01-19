"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.mistralClient = exports.MistralClient = void 0;
exports.generateWithMistral = generateWithMistral;
var axios_1 = require("axios");
var fs = require("fs/promises");
var path = require("path");
var MistralClient = /** @class */ (function () {
    function MistralClient(config) {
        this.config = {
            apiKey: (config === null || config === void 0 ? void 0 : config.apiKey) || process.env.MISTRAL_API_KEY,
            baseUrl: (config === null || config === void 0 ? void 0 : config.baseUrl) || process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
            model: (config === null || config === void 0 ? void 0 : config.model) || process.env.MISTRAL_MODEL || 'mistral-7b-instruct',
            temperature: (config === null || config === void 0 ? void 0 : config.temperature) || 0.7,
            maxTokens: (config === null || config === void 0 ? void 0 : config.maxTokens) || 4000
        };
        // Local model path for offline usage
        this.localModelPath = process.env.LOCAL_MISTRAL_PATH || path.join(process.cwd(), 'data', 'models', 'mistral-7b-instruct');
    }
    MistralClient.prototype.generate = function (systemPrompt, userPrompt, options) {
        return __awaiter(this, void 0, void 0, function () {
            var config, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = __assign(__assign({}, this.config), options);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.isLocalModelAvailable()];
                    case 2:
                        if (!_a.sent()) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.generateLocal(systemPrompt, userPrompt, config)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [4 /*yield*/, this.generateAPI(systemPrompt, userPrompt, config)];
                    case 5: 
                    // Fall back to API
                    return [2 /*return*/, _a.sent()];
                    case 6:
                        error_1 = _a.sent();
                        console.error('Mistral generation failed:', error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MistralClient.prototype.isLocalModelAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.access(this.localModelPath)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MistralClient.prototype.generateLocal = function (systemPrompt, userPrompt, config) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt;
            return __generator(this, function (_a) {
                prompt = "".concat(systemPrompt, "\n\nUser: ").concat(userPrompt, "\n\nAssistant:");
                // In a real implementation, this would call a local model server
                // For now, return a structured response
                return [2 /*return*/, JSON.stringify({
                        title: this.extractTitle(userPrompt),
                        sections: this.generateSections(userPrompt),
                        summary: this.generateSummary(userPrompt),
                        estimatedTime: this.estimateTime(userPrompt),
                        visualElements: this.suggestVisualElements(userPrompt)
                    })];
            });
        });
    };
    MistralClient.prototype.generateAPI = function (systemPrompt, userPrompt, config) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!config.apiKey) {
                            throw new Error('Mistral API key not configured');
                        }
                        return [4 /*yield*/, axios_1.default.post("".concat(config.baseUrl, "/chat/completions"), {
                                model: config.model,
                                messages: [
                                    { role: 'system', content: systemPrompt },
                                    { role: 'user', content: userPrompt }
                                ],
                                temperature: config.temperature,
                                max_tokens: config.maxTokens
                            }, {
                                headers: {
                                    'Authorization': "Bearer ".concat(config.apiKey),
                                    'Content-Type': 'application/json'
                                }
                            })];
                    case 1:
                        response = _c.sent();
                        data = response.data;
                        return [2 /*return*/, ((_b = (_a = data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || ''];
                }
            });
        });
    };
    MistralClient.prototype.extractTitle = function (prompt) {
        // Extract or generate a title from the prompt
        var words = prompt.split(' ').slice(0, 5);
        return words.join(' ').replace(/[?.!]/g, '').trim();
    };
    MistralClient.prototype.generateSections = function (prompt) {
        // Generate sections based on prompt analysis
        var sections = [];
        // Introduction section
        sections.push({
            title: 'Introduction',
            content: "Based on your request about \"".concat(prompt, "\", this section provides an overview and context."),
            speakerNotes: 'Set the stage and capture audience attention',
            visualHints: ['Opening slide with title', 'Brief agenda']
        });
        // Main content sections
        if (prompt.toLowerCase().includes('presentation') || prompt.toLowerCase().includes('slides')) {
            sections.push({
                title: 'Key Points',
                content: 'This section covers the main points and critical information.',
                speakerNotes: 'Emphasize the most important aspects',
                visualHints: ['Bullet points', 'Supporting graphics']
            });
            sections.push({
                title: 'Analysis & Insights',
                content: 'Deep dive into the topic with detailed analysis and insights.',
                speakerNotes: 'Provide expert perspective',
                visualHints: ['Charts', 'Diagrams', 'Data visualization']
            });
        }
        // Conclusion
        sections.push({
            title: 'Conclusion',
            content: 'Summary of key takeaways and next steps.',
            speakerNotes: 'End with a strong call to action',
            visualHints: ['Summary slide', 'Contact information']
        });
        return sections;
    };
    MistralClient.prototype.generateSummary = function (prompt) {
        return "This content addresses \"".concat(prompt, "\" with comprehensive coverage of the topic, including key insights, analysis, and actionable recommendations.");
    };
    MistralClient.prototype.estimateTime = function (prompt) {
        // Estimate presentation time in minutes
        var baseTime = 5;
        var complexity = prompt.length > 100 ? 2 : 1;
        return baseTime + complexity * 3;
    };
    MistralClient.prototype.suggestVisualElements = function (prompt) {
        var elements = [];
        if (prompt.toLowerCase().includes('data') || prompt.toLowerCase().includes('analysis')) {
            elements.push('Charts and graphs');
        }
        if (prompt.toLowerCase().includes('process') || prompt.toLowerCase().includes('workflow')) {
            elements.push('Process diagrams');
        }
        if (prompt.toLowerCase().includes('comparison')) {
            elements.push('Comparison tables');
        }
        elements.push('Professional template design');
        elements.push('Consistent color scheme');
        return elements;
    };
    MistralClient.prototype.expandPrompt = function (prompt, context) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, userPrompt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemPrompt = "You are an expert content strategist. Expand the user's brief prompt into a detailed, comprehensive request that includes:\n1. Clear objectives and goals\n2. Target audience considerations\n3. Key topics and sections to cover\n4. Desired tone and style\n5. Visual and formatting preferences\n6. Any constraints or requirements\n\nReturn the expanded prompt as a detailed specification.";
                        userPrompt = "Original prompt: \"".concat(prompt, "\"\n").concat(context ? "Additional context: ".concat(context) : '', "\n\nPlease expand this into a comprehensive content specification.");
                        return [4 /*yield*/, this.generate(systemPrompt, userPrompt, { temperature: 0.8 })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MistralClient.prototype.generateOutline = function (topic_1) {
        return __awaiter(this, arguments, void 0, function (topic, style) {
            var systemPrompt;
            if (style === void 0) { style = 'professional'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemPrompt = "You are an expert content creator. Generate a detailed outline for ".concat(topic, ".\nThe outline should include:\n1. Clear title\n2. Introduction/overview\n3. Main sections with bullet points\n4. Conclusion\n5. Visual elements suggestions\n6. Estimated time/length\n\nStyle: ").concat(style, "\nFormat: JSON structure with title, sections, and visualElements fields.");
                        return [4 /*yield*/, this.generate(systemPrompt, "Create an outline for: ".concat(topic))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MistralClient.prototype.improveContent = function (content, feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemPrompt = "You are an expert editor. Improve the given content based on the feedback.\nFocus on:\n1. Clarity and readability\n2. Structure and flow\n3. Tone and style consistency\n4. Completeness and accuracy\n5. Engagement and impact\n\nReturn the improved content maintaining the original format and structure.";
                        return [4 /*yield*/, this.generate(systemPrompt, "Content: ".concat(content, "\n\nFeedback: ").concat(feedback))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return MistralClient;
}());
exports.MistralClient = MistralClient;
exports.mistralClient = new MistralClient();
// Helper function for backward compatibility
function generateWithMistral(systemPrompt, userPrompt, options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.mistralClient.generate(systemPrompt, userPrompt, options)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}

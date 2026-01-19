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
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionManager = void 0;
var events_1 = require("events");
var websocket_service_1 = require("../websocket-service");
var Percepts_1 = require("../bus/Percepts");
var PermissionManager = /** @class */ (function (_super) {
    __extends(PermissionManager, _super);
    function PermissionManager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.prompts = new Map();
        _this.paused = false;
        _this.waiters = new Map();
        return _this;
    }
    PermissionManager.prototype.isPaused = function () { return this.paused; };
    PermissionManager.prototype.setPaused = function (p) {
        this.paused = !!p;
        websocket_service_1.sseBroker.broadcast('trust:kill', { paused: this.paused });
        this.emit('kill', { paused: this.paused });
    };
    PermissionManager.prototype.createPrompt = function (data) {
        var _a, _b, _c;
        var id = "tp_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 7));
        var prompt = { id: id, level: data.level, title: data.title, rationale: data.rationale, options: ((_a = data.options) === null || _a === void 0 ? void 0 : _a.length) ? data.options : ['approve', 'reject', 'delay'], createdAt: Date.now(), meta: data.meta };
        this.prompts.set(id, prompt);
        websocket_service_1.sseBroker.broadcast('trust:prompt', prompt);
        this.emit('prompt', prompt);
        try {
            (0, Percepts_1.publishPolicyEval)({
                subject: { kind: 'action', ref: String(((_c = (_b = data === null || data === void 0 ? void 0 : data.meta) === null || _b === void 0 ? void 0 : _b.action) === null || _c === void 0 ? void 0 : _c.name) || data.title) },
                decision: 'require_approval',
                reasons: [String(data.rationale || 'approval_required')],
                level: data.level,
                approvalId: id,
            });
        }
        catch (_d) { }
        return prompt;
    };
    PermissionManager.prototype.listPending = function () {
        return Array.from(this.prompts.values());
    };
    PermissionManager.prototype.decide = function (id, decision, meta) {
        var _a, _b;
        var p = this.prompts.get(id);
        if (!p)
            return { ok: false };
        this.prompts.delete(id);
        websocket_service_1.sseBroker.broadcast('trust:decision', { id: id, decision: decision, meta: meta });
        this.emit('decision', { id: id, decision: decision, meta: meta });
        try {
            (0, Percepts_1.publishPolicyEval)({
                subject: { kind: 'action', ref: String(((_b = (_a = p === null || p === void 0 ? void 0 : p.meta) === null || _a === void 0 ? void 0 : _a.action) === null || _b === void 0 ? void 0 : _b.name) || p.title) },
                decision: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'delayed',
                reasons: ['user_decision'],
                level: p.level,
                approvalId: id,
            });
        }
        catch (_c) { }
        var ws = this.waiters.get(id);
        if (ws && ws.length) {
            for (var _i = 0, ws_1 = ws; _i < ws_1.length; _i++) {
                var w = ws_1[_i];
                try {
                    w(decision);
                }
                catch (_d) { }
            }
            this.waiters.delete(id);
        }
        return { ok: true, prompt: p };
    };
    PermissionManager.prototype.waitForDecision = function (id, timeoutMs) {
        var _this = this;
        if (timeoutMs === void 0) { timeoutMs = 120000; }
        return new Promise(function (resolve) {
            var list = _this.waiters.get(id) || [];
            list.push(function (d) { return resolve(d); });
            _this.waiters.set(id, list);
            if (timeoutMs > 0) {
                setTimeout(function () {
                    if (_this.waiters.has(id)) {
                        _this.waiters.delete(id);
                        resolve('timeout');
                    }
                }, timeoutMs);
            }
        });
    };
    return PermissionManager;
}(events_1.EventEmitter));
exports.permissionManager = new PermissionManager();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputPriorityGuard = void 0;
var MessageBus_1 = require("../bus/MessageBus");
var InputPriorityGuard = /** @class */ (function () {
    function InputPriorityGuard() {
        this.lastAt = 0;
        this.unsub = null;
    }
    InputPriorityGuard.prototype.start = function () {
        var _this = this;
        if (this.unsub)
            return;
        var off = MessageBus_1.messageBus.subscribe('PERCEPT:user_input', function () { _this.lastAt = Date.now(); });
        this.unsub = off;
    };
    InputPriorityGuard.prototype.stop = function () {
        if (this.unsub) {
            try {
                this.unsub();
            }
            catch (_a) { }
            ;
            this.unsub = null;
        }
    };
    InputPriorityGuard.prototype.isActive = function (windowMs) {
        if (windowMs === void 0) { windowMs = 800; }
        return (Date.now() - (this.lastAt || 0)) < Math.max(100, windowMs);
    };
    InputPriorityGuard.prototype.status = function () {
        return { lastInputAt: this.lastAt || null, activeRecent: this.isActive(800) };
    };
    return InputPriorityGuard;
}());
exports.inputPriorityGuard = new InputPriorityGuard();

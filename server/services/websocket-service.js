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
exports.sseBroker = void 0;
exports.hookDeviceManager = hookDeviceManager;
exports.hookAiEngine = hookAiEngine;
var events_1 = require("events");
var SSEBroker = /** @class */ (function (_super) {
    __extends(SSEBroker, _super);
    function SSEBroker() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.clients = new Map();
        return _this;
    }
    SSEBroker.prototype.addClient = function (res) {
        var id = "sse_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 7));
        this.clients.set(id, { id: id, res: res });
        return id;
    };
    SSEBroker.prototype.removeClient = function (id) {
        this.clients.delete(id);
    };
    SSEBroker.prototype.broadcast = function (event, data) {
        var payload = "event: ".concat(event, "\n") + "data: ".concat(JSON.stringify(data), "\n\n");
        for (var _i = 0, _a = this.clients.values(); _i < _a.length; _i++) {
            var res = _a[_i].res;
            try {
                res.write(payload);
            }
            catch ( /* ignore */_b) { /* ignore */ }
        }
    };
    return SSEBroker;
}(events_1.EventEmitter));
exports.sseBroker = new SSEBroker();
// Hooks
function hookDeviceManager(dm) {
    try {
        dm.on('deviceStateChange', function (device) { return exports.sseBroker.broadcast('deviceStateChange', device); });
    }
    catch ( /* optional */_a) { /* optional */ }
}
function hookAiEngine(ai) {
    try {
        ai.on('insight', function (ins) { return exports.sseBroker.broadcast('aiInsight', ins); });
        ai.on('event', function (ev) { return exports.sseBroker.broadcast('aiEvent', ev); });
    }
    catch ( /* optional */_a) { /* optional */ }
}

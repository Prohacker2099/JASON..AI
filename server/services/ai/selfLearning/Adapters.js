"use strict";
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
exports.AdapterRegistry = exports.DeviceAdapter = exports.AppAdapter = exports.FileAdapter = exports.PowerShellAdapter = exports.ProcessAdapter = exports.HttpAdapter = void 0;
var axios_1 = require("axios");
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var HttpAdapter = /** @class */ (function () {
    function HttpAdapter() {
    }
    HttpAdapter.prototype.canHandle = function (a) {
        return a.type === 'http' && a.payload && typeof a.payload.url === 'string';
    };
    HttpAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var p, method, url, headers, data, res, ok, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        p = a.payload || {};
                        method = String(p.method || 'GET').toUpperCase();
                        url = String(p.url);
                        headers = p.headers || {};
                        data = p.body || undefined;
                        return [4 /*yield*/, (0, axios_1.default)({ method: method, url: url, headers: headers, data: data, validateStatus: function () { return true; } })];
                    case 1:
                        res = _a.sent();
                        ok = res.status >= 200 && res.status < 300;
                        return [2 /*return*/, { ok: ok, result: res.data, status: res.status }];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, { ok: false, error: (e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || 'http_failed' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return HttpAdapter;
}());
exports.HttpAdapter = HttpAdapter;
var ProcessAdapter = /** @class */ (function () {
    function ProcessAdapter() {
    }
    ProcessAdapter.prototype.canHandle = function (a) {
        return a.type === 'process' && a.payload && typeof a.payload.command === 'string';
    };
    ProcessAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, args;
            return __generator(this, function (_a) {
                cmd = String(a.payload.command);
                args = Array.isArray(a.payload.args) ? a.payload.args.map(function (x) { return String(x); }) : [];
                return [2 /*return*/, new Promise(function (resolve) {
                        try {
                            var child = (0, child_process_1.spawn)(cmd, args, { shell: true });
                            var stdout_1 = '';
                            var stderr_1 = '';
                            child.stdout.on('data', function (d) { stdout_1 += d.toString(); });
                            child.stderr.on('data', function (d) { stderr_1 += d.toString(); });
                            child.on('close', function (code) {
                                resolve({ ok: code === 0, result: { code: code, stdout: stdout_1, stderr: stderr_1 } });
                            });
                        }
                        catch (e) {
                            resolve({ ok: false, error: (e === null || e === void 0 ? void 0 : e.message) || 'process_failed' });
                        }
                    })];
            });
        });
    };
    return ProcessAdapter;
}());
exports.ProcessAdapter = ProcessAdapter;
var PowerShellAdapter = /** @class */ (function () {
    function PowerShellAdapter() {
    }
    PowerShellAdapter.prototype.canHandle = function (a) {
        return a.type === 'powershell' && a.payload && (typeof a.payload.command === 'string' || typeof a.payload.script === 'string');
    };
    PowerShellAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var script, command, psCmd;
            return __generator(this, function (_a) {
                script = a.payload.script ? String(a.payload.script) : undefined;
                command = a.payload.command ? String(a.payload.command) : undefined;
                psCmd = script ? "-NoProfile -Command ".concat(script) : "-NoProfile -Command ".concat(command);
                return [2 /*return*/, new Promise(function (resolve) {
                        try {
                            var child = (0, child_process_1.spawn)('powershell', psCmd ? psCmd.split(' ') : ['-NoProfile', '-Command', 'Write-Output', 'OK'], { shell: true });
                            var stdout_2 = '';
                            var stderr_2 = '';
                            child.stdout.on('data', function (d) { stdout_2 += d.toString(); });
                            child.stderr.on('data', function (d) { stderr_2 += d.toString(); });
                            child.on('close', function (code) {
                                resolve({ ok: code === 0, result: { code: code, stdout: stdout_2, stderr: stderr_2 } });
                            });
                        }
                        catch (e) {
                            resolve({ ok: false, error: (e === null || e === void 0 ? void 0 : e.message) || 'powershell_failed' });
                        }
                    })];
            });
        });
    };
    return PowerShellAdapter;
}());
exports.PowerShellAdapter = PowerShellAdapter;
var FileAdapter = /** @class */ (function () {
    function FileAdapter() {
    }
    FileAdapter.prototype.canHandle = function (a) {
        return a.type === 'file' && a.payload && typeof a.payload.path === 'string' && typeof a.payload.op === 'string';
    };
    FileAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var p, op, enc, data, _a, _b, e_2;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 15, , 16]);
                        p = String(a.payload.path);
                        op = String(a.payload.op);
                        enc = a.payload.encoding ? String(a.payload.encoding) : 'utf8';
                        if (!(op === 'read')) return [3 /*break*/, 2];
                        return [4 /*yield*/, fs_1.promises.readFile(p, enc)];
                    case 1:
                        data = _e.sent();
                        return [2 /*return*/, { ok: true, result: data }];
                    case 2:
                        if (!(op === 'write')) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs_1.promises.writeFile(p, String((_c = a.payload.content) !== null && _c !== void 0 ? _c : ''), enc)];
                    case 3:
                        _e.sent();
                        return [2 /*return*/, { ok: true, result: true }];
                    case 4:
                        if (!(op === 'append')) return [3 /*break*/, 6];
                        return [4 /*yield*/, fs_1.promises.appendFile(p, String((_d = a.payload.content) !== null && _d !== void 0 ? _d : ''), enc)];
                    case 5:
                        _e.sent();
                        return [2 /*return*/, { ok: true, result: true }];
                    case 6:
                        if (!(op === 'delete')) return [3 /*break*/, 10];
                        _e.label = 7;
                    case 7:
                        _e.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, fs_1.promises.unlink(p)];
                    case 8:
                        _e.sent();
                        return [2 /*return*/, { ok: true, result: true }];
                    case 9:
                        _a = _e.sent();
                        return [2 /*return*/, { ok: false, error: 'delete_failed' }];
                    case 10:
                        if (!(op === 'exists')) return [3 /*break*/, 14];
                        _e.label = 11;
                    case 11:
                        _e.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, fs_1.promises.access(p)];
                    case 12:
                        _e.sent();
                        return [2 /*return*/, { ok: true, result: true }];
                    case 13:
                        _b = _e.sent();
                        return [2 /*return*/, { ok: true, result: false }];
                    case 14: return [2 /*return*/, { ok: false, error: 'unsupported_file_op' }];
                    case 15:
                        e_2 = _e.sent();
                        return [2 /*return*/, { ok: false, error: (e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || 'file_failed' }];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    return FileAdapter;
}());
exports.FileAdapter = FileAdapter;
var AppAdapter = /** @class */ (function () {
    function AppAdapter() {
    }
    AppAdapter.prototype.canHandle = function (a) {
        return a.type === 'app' && a.payload && typeof a.payload.path === 'string';
    };
    AppAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var appPath, args;
            return __generator(this, function (_a) {
                appPath = String(a.payload.path);
                args = Array.isArray(a.payload.args) ? a.payload.args.map(function (x) { return String(x); }) : [];
                return [2 /*return*/, new Promise(function (resolve) {
                        try {
                            var child = (0, child_process_1.spawn)(appPath, args, { shell: true, detached: true });
                            resolve({ ok: true, result: { pid: child.pid } });
                        }
                        catch (e) {
                            resolve({ ok: false, error: (e === null || e === void 0 ? void 0 : e.message) || 'app_failed' });
                        }
                    })];
            });
        });
    };
    return AppAdapter;
}());
exports.AppAdapter = AppAdapter;
var DeviceAdapter = /** @class */ (function () {
    function DeviceAdapter() {
        this.uc = null;
        this.initialized = false;
    }
    DeviceAdapter.prototype.ensure = function () {
        if (this.initialized)
            return;
        this.initialized = true;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            var mod = require('../../unifiedDeviceControl');
            this.uc = mod.unifiedDeviceControl || mod.default || mod;
        }
        catch (_a) {
            this.uc = null;
        }
    };
    DeviceAdapter.prototype.canHandle = function (a) {
        this.ensure();
        return a.type === 'device' && !!this.uc;
    };
    DeviceAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, deviceId, command, payload, state, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.ensure();
                        if (!this.uc)
                            return [2 /*return*/, { ok: false, error: 'unifiedDeviceControl_unavailable' }];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = a.payload || {}, deviceId = _a.deviceId, command = _a.command, payload = _a.payload;
                        if (!deviceId || !command)
                            return [2 /*return*/, { ok: false, error: 'deviceId_and_command_required' }];
                        return [4 /*yield*/, Promise.resolve(this.uc.sendCommand(String(deviceId), String(command), payload))];
                    case 2:
                        _b.sent();
                        state = this.uc.getDeviceState(String(deviceId));
                        return [2 /*return*/, { ok: true, result: { deviceId: deviceId, state: state } }];
                    case 3:
                        e_3 = _b.sent();
                        return [2 /*return*/, { ok: false, error: (e_3 === null || e_3 === void 0 ? void 0 : e_3.message) || 'device_command_failed' }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return DeviceAdapter;
}());
exports.DeviceAdapter = DeviceAdapter;
var AdapterRegistry = /** @class */ (function () {
    function AdapterRegistry() {
        this.adapters = [];
        this.adapters = [
            new DeviceAdapter(),
            new PowerShellAdapter(),
            new AppAdapter(),
            new FileAdapter(),
            new ProcessAdapter(),
            new HttpAdapter()
        ];
    }
    AdapterRegistry.prototype.register = function (adapter) { this.adapters.unshift(adapter); };
    AdapterRegistry.prototype.find = function (a) {
        for (var _i = 0, _a = this.adapters; _i < _a.length; _i++) {
            var ad = _a[_i];
            if (ad.canHandle(a))
                return ad;
        }
        return null;
    };
    AdapterRegistry.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var ad;
            return __generator(this, function (_a) {
                ad = this.find(a);
                if (!ad)
                    return [2 /*return*/, { ok: false, error: 'no_adapter' }];
                return [2 /*return*/, ad.execute(a)];
            });
        });
    };
    return AdapterRegistry;
}());
exports.AdapterRegistry = AdapterRegistry;

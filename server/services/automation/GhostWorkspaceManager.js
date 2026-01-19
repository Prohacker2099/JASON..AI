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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ghostWorkspaceManager = exports.GhostWorkspaceManager = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var os = require("os");
var path = require("path");
function isWindows() {
    return process.platform === 'win32';
}
function runPowerShell(script, timeoutMs) {
    if (timeoutMs === void 0) { timeoutMs = 30000; }
    return new Promise(function (resolve) {
        var stdout = '';
        var stderr = '';
        var killed = false;
        // IMPORTANT: do NOT use `shell: true` here.
        // Our PowerShell snippets use pipes (e.g. `| ConvertTo-Json`). If spawned through cmd.exe,
        // cmd will reinterpret pipes and PowerShell may receive `-Command` without the script.
        var child = (0, child_process_1.spawn)('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true });
        var t = setTimeout(function () {
            killed = true;
            try {
                child.kill();
            }
            catch (_a) { }
        }, Math.max(500, timeoutMs));
        child.stdout.on('data', function (d) { stdout += d.toString(); });
        child.stderr.on('data', function (d) { stderr += d.toString(); });
        child.on('close', function (code) {
            clearTimeout(t);
            resolve({ code: killed ? null : code, stdout: stdout, stderr: stderr });
        });
    });
}
var GhostWorkspaceManager = /** @class */ (function () {
    function GhostWorkspaceManager(prefix) {
        if (prefix === void 0) { prefix = 'JASON_GHOST'; }
        this.prefix = prefix;
    }
    GhostWorkspaceManager.prototype.createDesktopName = function () {
        var rand = Math.random().toString(36).slice(2, 10);
        return "".concat(this.prefix, "_").concat(Date.now(), "_").concat(rand);
    };
    GhostWorkspaceManager.prototype.launchOnHiddenDesktop = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var path, args, desktopName, timeoutMs, quoteForCreateProcess, appPath, cmdLine, psSingleQuote, ps, out, msg, raw, parsed, pid, dn, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isWindows())
                            return [2 /*return*/, { ok: false, error: 'ghost_desktop_not_supported_on_platform' }];
                        path = String(req.path || '').trim();
                        if (!path)
                            return [2 /*return*/, { ok: false, error: 'path_required' }];
                        args = Array.isArray(req.args) ? req.args.map(function (a) { return String(a); }) : [];
                        desktopName = String(req.desktopName || this.createDesktopName());
                        timeoutMs = Number.isFinite(req.timeoutMs) ? Number(req.timeoutMs) : 30000;
                        quoteForCreateProcess = function (arg) {
                            var s = String(arg !== null && arg !== void 0 ? arg : '');
                            if (s.length === 0)
                                return '""';
                            if (!/[\s"]/g.test(s))
                                return s;
                            // Windows CreateProcess quoting: wrap in quotes and escape internal quotes/backslashes.
                            return '"' + s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1') + '"';
                        };
                        appPath = path;
                        cmdLine = __spreadArray([quoteForCreateProcess(appPath)], args.map(quoteForCreateProcess), true).join(' ');
                        psSingleQuote = function (s) { return "'".concat(String(s !== null && s !== void 0 ? s : '').replace(/'/g, "''"), "'"); };
                        ps = "\n$ErrorActionPreference = 'Stop'\n\nAdd-Type @\"\nusing System;\nusing System.Runtime.InteropServices;\nusing System.Text;\n\npublic static class GhostDesktop {\n  [DllImport(\"user32.dll\", SetLastError=true, CharSet=CharSet.Unicode)]\n  public static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, int dwFlags, uint dwDesiredAccess, IntPtr lpsa);\n\n  [DllImport(\"user32.dll\", SetLastError=true, CharSet=CharSet.Unicode)]\n  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);\n\n  [DllImport(\"user32.dll\", SetLastError=true)]\n  public static extern bool CloseDesktop(IntPtr hDesktop);\n\n  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]\n  public struct STARTUPINFO {\n    public int cb;\n    public string lpReserved;\n    public string lpDesktop;\n    public string lpTitle;\n    public int dwX;\n    public int dwY;\n    public int dwXSize;\n    public int dwYSize;\n    public int dwXCountChars;\n    public int dwYCountChars;\n    public int dwFillAttribute;\n    public int dwFlags;\n    public short wShowWindow;\n    public short cbReserved2;\n    public IntPtr lpReserved2;\n    public IntPtr hStdInput;\n    public IntPtr hStdOutput;\n    public IntPtr hStdError;\n  }\n\n  [StructLayout(LayoutKind.Sequential)]\n  public struct PROCESS_INFORMATION {\n    public IntPtr hProcess;\n    public IntPtr hThread;\n    public int dwProcessId;\n    public int dwThreadId;\n  }\n\n  [DllImport(\"kernel32.dll\", SetLastError=true, CharSet=CharSet.Unicode)]\n  public static extern bool CreateProcess(\n    string lpApplicationName,\n    StringBuilder lpCommandLine,\n    IntPtr lpProcessAttributes,\n    IntPtr lpThreadAttributes,\n    bool bInheritHandles,\n    uint dwCreationFlags,\n    IntPtr lpEnvironment,\n    string lpCurrentDirectory,\n    ref STARTUPINFO lpStartupInfo,\n    out PROCESS_INFORMATION lpProcessInformation\n  );\n\n  [DllImport(\"kernel32.dll\", SetLastError=true)]\n  public static extern bool CloseHandle(IntPtr hObject);\n}\n\"@\n\n$DESKTOP_ALL_ACCESS = 0x000F01FF\n$name = ".concat(JSON.stringify(desktopName), "\n$cmd = ").concat(psSingleQuote(cmdLine), "\n$deskPath = \"winsta0\\$name\"\n\n$h = [GhostDesktop]::CreateDesktop($name, [IntPtr]::Zero, [IntPtr]::Zero, 0, $DESKTOP_ALL_ACCESS, [IntPtr]::Zero)\nif ($h -eq [IntPtr]::Zero) {\n  $h = [GhostDesktop]::OpenDesktop($name, 0, $false, $DESKTOP_ALL_ACCESS)\n}\nif ($h -eq [IntPtr]::Zero) { throw 'desktop_create_or_open_failed' }\n\n$si = New-Object GhostDesktop+STARTUPINFO\n$si.cb = [Runtime.InteropServices.Marshal]::SizeOf([type]([GhostDesktop+STARTUPINFO]))\n$si.lpDesktop = $deskPath\n$si.dwFlags = 0x00000001\n$si.wShowWindow = 0\n\n$pi = New-Object GhostDesktop+PROCESS_INFORMATION\n$sb = New-Object System.Text.StringBuilder ($cmd)\n$ok = [GhostDesktop]::CreateProcess($null, $sb, [IntPtr]::Zero, [IntPtr]::Zero, $false, 0, [IntPtr]::Zero, $null, [ref]$si, [ref]$pi)\nif (-not $ok) {\n  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()\n  throw (\"create_process_failed:\" + $err + \"; desktop=\" + $deskPath + \"; cmd=\" + $cmd)\n}\n\ntry { [GhostDesktop]::CloseHandle($pi.hThread) | Out-Null } catch {}\ntry { [GhostDesktop]::CloseHandle($pi.hProcess) | Out-Null } catch {}\ntry { [GhostDesktop]::CloseDesktop($h) | Out-Null } catch {}\n\n@{ ok = $true; pid = $pi.dwProcessId; desktopName = $name } | ConvertTo-Json -Compress\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, runPowerShell(ps, timeoutMs)];
                    case 2:
                        out = _a.sent();
                        if (out.code !== 0) {
                            msg = (out.stderr || out.stdout || '').toString().trim();
                            return [2 /*return*/, { ok: false, error: msg || 'ghost_launch_failed' }];
                        }
                        raw = (out.stdout || '').toString().trim();
                        parsed = JSON.parse(raw);
                        pid = Number(parsed === null || parsed === void 0 ? void 0 : parsed.pid);
                        dn = String((parsed === null || parsed === void 0 ? void 0 : parsed.desktopName) || desktopName);
                        if (!Number.isFinite(pid) || pid <= 0)
                            return [2 /*return*/, { ok: false, error: 'ghost_launch_no_pid' }];
                        return [2 /*return*/, { ok: true, result: { pid: pid, desktopName: dn } }];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, { ok: false, error: (e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || 'ghost_launch_failed' }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GhostWorkspaceManager.prototype.runPowerShellOnDesktop = function (desktopName_1, script_1) {
        return __awaiter(this, arguments, void 0, function (desktopName, script, timeoutMs) {
            var dn, tmpDir, outPath, errPath, psExe, encoded, cmdLine, psSingleQuote, outerPs, outer, code, parsed, c, stdout, stderr, _a, _b, outerErr, _c;
            if (timeoutMs === void 0) { timeoutMs = 30000; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        dn = String(desktopName || '').trim();
                        if (!dn)
                            return [2 /*return*/, runPowerShell(script, timeoutMs)];
                        if (!isWindows())
                            return [2 /*return*/, { code: 1, stdout: '', stderr: 'ghost_desktop_not_supported_on_platform' }];
                        return [4 /*yield*/, fs_1.promises.mkdtemp(path.join(os.tmpdir(), 'jason-ghost-'))];
                    case 1:
                        tmpDir = _d.sent();
                        outPath = path.join(tmpDir, 'stdout.txt');
                        errPath = path.join(tmpDir, 'stderr.txt');
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, , 11, 15]);
                        psExe = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
                        encoded = Buffer.from(String(script || ''), 'utf16le').toString('base64');
                        cmdLine = "cmd.exe /c \"\"".concat(psExe, "\" -NoProfile -ExecutionPolicy Bypass -EncodedCommand ").concat(encoded, " 1> \"").concat(outPath, "\" 2> \"").concat(errPath, "\"\"");
                        psSingleQuote = function (s) { return "'".concat(String(s !== null && s !== void 0 ? s : '').replace(/'/g, "''"), "'"); };
                        outerPs = "\n$ErrorActionPreference = 'Stop'\n\nAdd-Type @\"\nusing System;\nusing System.Runtime.InteropServices;\nusing System.Text;\n\npublic static class GhostDesktop {\n  [DllImport(\"user32.dll\", SetLastError=true, CharSet=CharSet.Unicode)]\n  public static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, int dwFlags, uint dwDesiredAccess, IntPtr lpsa);\n\n  [DllImport(\"user32.dll\", SetLastError=true, CharSet=CharSet.Unicode)]\n  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);\n\n  [DllImport(\"user32.dll\", SetLastError=true)]\n  public static extern bool CloseDesktop(IntPtr hDesktop);\n\n  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]\n  public struct STARTUPINFO {\n    public int cb;\n    public string lpReserved;\n    public string lpDesktop;\n    public string lpTitle;\n    public int dwX;\n    public int dwY;\n    public int dwXSize;\n    public int dwYSize;\n    public int dwXCountChars;\n    public int dwYCountChars;\n    public int dwFillAttribute;\n    public int dwFlags;\n    public short wShowWindow;\n    public short cbReserved2;\n    public IntPtr lpReserved2;\n    public IntPtr hStdInput;\n    public IntPtr hStdOutput;\n    public IntPtr hStdError;\n  }\n\n  [StructLayout(LayoutKind.Sequential)]\n  public struct PROCESS_INFORMATION {\n    public IntPtr hProcess;\n    public IntPtr hThread;\n    public int dwProcessId;\n    public int dwThreadId;\n  }\n\n  [DllImport(\"kernel32.dll\", SetLastError=true, CharSet=CharSet.Unicode)]\n  public static extern bool CreateProcess(\n    string lpApplicationName,\n    StringBuilder lpCommandLine,\n    IntPtr lpProcessAttributes,\n    IntPtr lpThreadAttributes,\n    bool bInheritHandles,\n    uint dwCreationFlags,\n    IntPtr lpEnvironment,\n    string lpCurrentDirectory,\n    ref STARTUPINFO lpStartupInfo,\n    out PROCESS_INFORMATION lpProcessInformation\n  );\n\n  [DllImport(\"kernel32.dll\", SetLastError=true)]\n  public static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);\n\n  [DllImport(\"kernel32.dll\", SetLastError=true)]\n  public static extern bool GetExitCodeProcess(IntPtr hProcess, out uint lpExitCode);\n\n  [DllImport(\"kernel32.dll\", SetLastError=true)]\n  public static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);\n\n  [DllImport(\"kernel32.dll\", SetLastError=true)]\n  public static extern bool CloseHandle(IntPtr hObject);\n}\n\"@\n\n$DESKTOP_ALL_ACCESS = 0x000F01FF\n$name = ".concat(JSON.stringify(dn), "\n$cmd = ").concat(psSingleQuote(cmdLine), "\n$deskPath = \"winsta0\\$name\"\n\n$h = [GhostDesktop]::OpenDesktop($name, 0, $false, $DESKTOP_ALL_ACCESS)\nif ($h -eq [IntPtr]::Zero) {\n  $h = [GhostDesktop]::CreateDesktop($name, [IntPtr]::Zero, [IntPtr]::Zero, 0, $DESKTOP_ALL_ACCESS, [IntPtr]::Zero)\n}\nif ($h -eq [IntPtr]::Zero) { throw 'desktop_create_or_open_failed' }\n\n$si = New-Object GhostDesktop+STARTUPINFO\n$si.cb = [Runtime.InteropServices.Marshal]::SizeOf([type]([GhostDesktop+STARTUPINFO]))\n$si.lpDesktop = $deskPath\n$si.dwFlags = 0x00000001\n$si.wShowWindow = 0\n\n$pi = New-Object GhostDesktop+PROCESS_INFORMATION\n$sb = New-Object System.Text.StringBuilder ($cmd)\n$ok = [GhostDesktop]::CreateProcess($null, $sb, [IntPtr]::Zero, [IntPtr]::Zero, $false, 0, [IntPtr]::Zero, $null, [ref]$si, [ref]$pi)\nif (-not $ok) {\n  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()\n  throw (\"create_process_failed:\" + $err)\n}\n\n$WAIT_OBJECT_0 = 0\n$WAIT_TIMEOUT = 258\n$wait = [GhostDesktop]::WaitForSingleObject($pi.hProcess, ").concat(timeoutMs, ")\n\n$exitCode = 0\nif ($wait -eq $WAIT_TIMEOUT) {\n  try { [GhostDesktop]::TerminateProcess($pi.hProcess, 1) | Out-Null } catch {}\n  $exitCode = 408\n} else {\n  [uint32]$code = 0\n  $got = [GhostDesktop]::GetExitCodeProcess($pi.hProcess, [ref]$code)\n  if ($got) { $exitCode = [int]$code } else { $exitCode = 1 }\n}\n\ntry { [GhostDesktop]::CloseHandle($pi.hThread) | Out-Null } catch {}\ntry { [GhostDesktop]::CloseHandle($pi.hProcess) | Out-Null } catch {}\ntry { [GhostDesktop]::CloseDesktop($h) | Out-Null } catch {}\n\n@{ ok = $true; exitCode = $exitCode } | ConvertTo-Json -Compress\n");
                        return [4 /*yield*/, runPowerShell(outerPs, timeoutMs + 5000)];
                    case 3:
                        outer = _d.sent();
                        code = null;
                        try {
                            parsed = JSON.parse((outer.stdout || '').toString().trim());
                            c = Number(parsed === null || parsed === void 0 ? void 0 : parsed.exitCode);
                            code = Number.isFinite(c) ? c : null;
                        }
                        catch (_e) {
                            code = outer.code;
                        }
                        stdout = '';
                        stderr = '';
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, fs_1.promises.readFile(outPath, 'utf8')];
                    case 5:
                        stdout = _d.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _a = _d.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        _d.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, fs_1.promises.readFile(errPath, 'utf8')];
                    case 8:
                        stderr = _d.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        _b = _d.sent();
                        return [3 /*break*/, 10];
                    case 10:
                        outerErr = (outer.stderr || '').toString().trim();
                        if (!stderr && outerErr)
                            stderr = outerErr;
                        return [2 /*return*/, { code: code, stdout: stdout, stderr: stderr }];
                    case 11:
                        _d.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, fs_1.promises.rm(tmpDir, { recursive: true, force: true })];
                    case 12:
                        _d.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        _c = _d.sent();
                        return [3 /*break*/, 14];
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    return GhostWorkspaceManager;
}());
exports.GhostWorkspaceManager = GhostWorkspaceManager;
exports.ghostWorkspaceManager = new GhostWorkspaceManager();

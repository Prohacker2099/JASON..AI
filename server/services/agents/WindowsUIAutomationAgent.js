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
exports.WindowsUIAutomationAdapter = void 0;
var child_process_1 = require("child_process");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var os_1 = require("os");
var GhostWorkspaceManager_1 = require("../automation/GhostWorkspaceManager");
var _fetchFn = null;
function getFetch() {
    return __awaiter(this, void 0, void 0, function () {
        var mod;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (_fetchFn)
                        return [2 /*return*/, _fetchFn];
                    if (typeof globalThis.fetch === 'function') {
                        _fetchFn = globalThis.fetch.bind(globalThis);
                        return [2 /*return*/, _fetchFn];
                    }
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('node-fetch'); })];
                case 1:
                    mod = _a.sent();
                    _fetchFn = (mod.default || mod);
                    return [2 /*return*/, _fetchFn];
            }
        });
    });
}
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
        // Many of our PowerShell scripts contain `|` pipes; if we run through cmd.exe it will reinterpret
        // the pipes and PowerShell will receive `-Command` with no script, causing "missing parameter" errors.
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
var WindowsUIAutomationAdapter = /** @class */ (function () {
    function WindowsUIAutomationAdapter() {
        this.vlmServerBooted = false;
    }
    WindowsUIAutomationAdapter.prototype.canHandle = function (a) {
        return a.type === 'ui';
    };
    WindowsUIAutomationAdapter.prototype.runPowerShell = function (script_1) {
        return __awaiter(this, arguments, void 0, function (script, timeoutMs) {
            var out, msg;
            if (timeoutMs === void 0) { timeoutMs = 30000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runPowerShell(script, timeoutMs)];
                    case 1:
                        out = _a.sent();
                        if (out.code !== 0) {
                            msg = (out.stderr || out.stdout || '').toString().trim();
                            throw new Error(msg || 'powershell_failed');
                        }
                        return [2 /*return*/, (out.stdout || '').toString()];
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.execute = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var p, op, desktopName, maxItems, maxResults, includeOffscreen, query, windowTitle, controlName, controlType, value, timeoutMs, normalizedOp, psBool, ps, out, _a, msg, parsed, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!isWindows())
                            return [2 /*return*/, { ok: false, error: 'ui_not_supported_on_platform' }];
                        p = (a.payload && typeof a.payload === 'object') ? a.payload : {};
                        op = String(p.op || '').toLowerCase();
                        // Non-UIA ops that are implemented in TypeScript helpers (OCR via screenshot + tesseract, VLM clicks).
                        if (op === 'ocr.read_text' || op === 'vlm.visual_click' || op === 'vlm.semantic_click') {
                            return [2 /*return*/, this.executeAction(__assign(__assign({}, a), { payload: __assign(__assign({}, p), { op: op }) }))];
                        }
                        desktopName = typeof p.desktopName === 'string' ? String(p.desktopName) : '';
                        maxItems = Number.isFinite(p.maxItems) ? Number(p.maxItems) : 200;
                        maxResults = Number.isFinite(p.maxResults) ? Number(p.maxResults) : 10;
                        includeOffscreen = p.includeOffscreen === true;
                        query = typeof p.query === 'string' ? String(p.query) : '';
                        windowTitle = typeof p.windowTitle === 'string' ? p.windowTitle : '';
                        controlName = typeof p.name === 'string' ? p.name : '';
                        controlType = typeof p.controlType === 'string' ? p.controlType : '';
                        value = typeof p.value === 'string' ? p.value : '';
                        timeoutMs = Number.isFinite(p.timeoutMs) ? Number(p.timeoutMs) : 30000;
                        if (!op)
                            return [2 /*return*/, { ok: false, error: 'ui_op_required' }
                                // Normalize aliases
                            ];
                        normalizedOp = op === 'type' ? 'control.set_value' : op === 'click' ? 'control.invoke' : op;
                        psBool = function (v) { return (v ? '$true' : '$false'); };
                        ps = "\n$ErrorActionPreference = 'Stop'\nAdd-Type -AssemblyName UIAutomationClient\nAdd-Type -AssemblyName UIAutomationTypes\n\nfunction Ocr-ReadText([string]$imgPath){\n  $t = Get-Command tesseract -ErrorAction SilentlyContinue\n  if (-not $t) { throw 'tesseract_not_available' }\n  $out = & tesseract $imgPath stdout 2>$null\n  return ($out | Out-String)\n}\n\nfunction Score-Name([string]$cand, [string]$q){\n  if ($q -eq '') { return 0 }\n  $c = ($cand + '').ToLower()\n  $q2 = ($q + '').ToLower()\n  if ($c -eq $q2) { return 1.0 }\n  if ($c.StartsWith($q2)) { return 0.9 }\n  if ($c.Contains($q2)) { return 0.8 }\n  return 0\n}\n\nfunction Search-Controls($root, [string]$q, [string]$type, [int]$maxResults, [bool]$includeOffscreen){\n  $hits = @()\n  if ($root -eq $null) { return $hits }\n  $cond = [System.Windows.Automation.Condition]::TrueCondition\n  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)\n  foreach ($c in $all) {\n    try {\n      $cn = $c.Current.Name\n      $ct = $c.Current.ControlType.ProgrammaticName\n      $okType = ($type -eq '') -or ($ct -and $ct.ToLower().Contains($type.ToLower()))\n      if (-not $okType) { continue }\n\n      $isOff = $false\n      try { $isOff = [bool]$c.Current.IsOffscreen } catch { $isOff = $false }\n      if (-not $includeOffscreen -and $isOff) { continue }\n\n      $score = Score-Name $cn $q\n      if ($score -le 0) { continue }\n\n      $hits += @{ score = $score; name = $cn; type = $ct; automationId = $c.Current.AutomationId; class = $c.Current.ClassName; offscreen = $isOff }\n    } catch {}\n  }\n  $sorted = $hits | Sort-Object -Property score -Descending | Select-Object -First $maxResults\n  return ,$sorted\n}\n\nfunction Find-Window([string]$title){\n  $root = [System.Windows.Automation.AutomationElement]::RootElement\n  $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $title)\n  $win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)\n  if ($win -eq $null -and $title -ne '') {\n    # fallback: substring search\n    $children = $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)\n    foreach ($c in $children) {\n      try {\n        $n = $c.Current.Name\n        if ($n -and $n.ToLower().Contains($title.ToLower())) { return $c }\n      } catch {}\n    }\n  }\n  return $win\n}\n\nfunction Find-Control($root, [string]$name, [string]$type){\n  if ($root -eq $null) { return $null }\n  $cond = [System.Windows.Automation.Condition]::TrueCondition\n  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)\n  foreach ($c in $all) {\n    try {\n      $cn = $c.Current.Name\n      $ct = $c.Current.ControlType.ProgrammaticName\n      $okName = ($name -eq '') -or ($cn -and ($cn.ToLower() -eq $name.ToLower() -or $cn.ToLower().Contains($name.ToLower())))\n      $okType = ($type -eq '') -or ($ct -and $ct.ToLower().Contains($type.ToLower()))\n      if ($okName -and $okType) { return $c }\n    } catch {}\n  }\n  return $null\n}\n\nfunction Dump-Controls($root, [int]$maxItems, [bool]$includeOffscreen){\n  $out = @()\n  if ($root -eq $null) { return $out }\n  $cond = [System.Windows.Automation.Condition]::TrueCondition\n  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)\n  $count = 0\n  foreach ($c in $all) {\n    if ($count -ge $maxItems) { break }\n    try {\n      $isOff = $false\n      try { $isOff = [bool]$c.Current.IsOffscreen } catch { $isOff = $false }\n      if (-not $includeOffscreen -and $isOff) { continue }\n      $rect = $null\n      try { $rect = $c.Current.BoundingRectangle } catch { $rect = $null }\n      $r = $null\n      if ($rect -ne $null) {\n        $r = @{ x = $rect.X; y = $rect.Y; width = $rect.Width; height = $rect.Height }\n      }\n      $out += @{ name = $c.Current.Name; type = $c.Current.ControlType.ProgrammaticName; automationId = $c.Current.AutomationId; class = $c.Current.ClassName; offscreen = $isOff; rect = $r }\n      $count++\n    } catch {}\n  }\n  return $out\n}\n\n$winTitle = ".concat(JSON.stringify(windowTitle), "\n$targetName = ").concat(JSON.stringify(controlName), "\n$targetType = ").concat(JSON.stringify(controlType), "\n$val = ").concat(JSON.stringify(value), "\n$op = ").concat(JSON.stringify(normalizedOp), "\n$maxItems = ").concat(JSON.stringify(maxItems), "\n$maxResults = ").concat(JSON.stringify(maxResults), "\n$includeOffscreen = ").concat(psBool(includeOffscreen), "\n$query = ").concat(JSON.stringify(query), "\n\n$win = Find-Window $winTitle\nif ($win -eq $null -and $winTitle -ne '') { throw 'window_not_found' }\n\nif ($op -eq 'window.find') {\n  if ($win -eq $null) { throw 'window_not_found' }\n  $out = @{ ok = $true; windowTitle = $win.Current.Name; class = $win.Current.ClassName; framework = $win.Current.FrameworkId }\n  $out | ConvertTo-Json -Compress -Depth 8\n  exit 0\n}\n\n$root = $win\nif ($root -eq $null) { $root = [System.Windows.Automation.AutomationElement]::RootElement }\n\nif ($op -eq 'ocr.read_text' -or $op -eq 'ui.ocr.read_text') {\n  Add-Type -AssemblyName System.Drawing\n  Add-Type -AssemblyName System.Windows.Forms\n\n  $rect = $null\n  if ($win -ne $null) {\n    try { $rect = $win.Current.BoundingRectangle } catch { $rect = $null }\n  }\n\n  $x = 0; $y = 0; $w = 0; $h = 0\n  if ($rect -ne $null -and $rect.Width -gt 0 -and $rect.Height -gt 0) {\n    $x = [int][Math]::Max(0, $rect.X)\n    $y = [int][Math]::Max(0, $rect.Y)\n    $w = [int][Math]::Max(1, $rect.Width)\n    $h = [int][Math]::Max(1, $rect.Height)\n  } else {\n    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds\n    $x = $b.X; $y = $b.Y; $w = $b.Width; $h = $b.Height\n  }\n\n  $bmp = New-Object System.Drawing.Bitmap $w, $h\n  $g = [System.Drawing.Graphics]::FromImage($bmp)\n  $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)\n\n  $img = Join-Path $env:TEMP (\"jason_ocr_\" + [Guid]::NewGuid().ToString() + \".png\")\n  $bmp.Save($img, [System.Drawing.Imaging.ImageFormat]::Png)\n  try { $g.Dispose() } catch {}\n  try { $bmp.Dispose() } catch {}\n\n  $text = Ocr-ReadText $img\n  try { Remove-Item -Force $img -ErrorAction SilentlyContinue } catch {}\n  @{ ok = $true; text = ($text + '').Trim() } | ConvertTo-Json -Compress -Depth 8\n  exit 0\n}\n\nif ($op -eq 'ui.tree.dump' -or $op -eq 'tree.dump') {\n  $items = Dump-Controls $root $maxItems $includeOffscreen\n  @{ ok = $true; count = $items.Count; items = $items } | ConvertTo-Json -Compress -Depth 8\n  exit 0\n}\n\nif ($op -eq 'control.search' -or $op -eq 'search') {\n  $items = Search-Controls $root $query $targetType $maxResults $includeOffscreen\n  @{ ok = $true; count = $items.Count; items = $items } | ConvertTo-Json -Compress -Depth 8\n  exit 0\n}\n\n$ctrl = Find-Control $root $targetName $targetType\nif ($ctrl -eq $null) { throw 'control_not_found' }\n\nif ($op -eq 'control.invoke' -or $op -eq 'click') {\n  $pat = $ctrl.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)\n  if ($pat -eq $null) { throw 'invoke_pattern_not_supported' }\n  $pat.Invoke()\n  @{ ok = $true; op = $op; name = $ctrl.Current.Name; type = $ctrl.Current.ControlType.ProgrammaticName } | ConvertTo-Json -Compress -Depth 8\n  exit 0\n}\n\nif ($op -eq 'control.set_value' -or $op -eq 'set_value') {\n  $pat = $ctrl.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)\n  if ($pat -eq $null) { throw 'value_pattern_not_supported' }\n  $pat.SetValue($val)\n  @{ ok = $true; op = $op; name = $ctrl.Current.Name; type = $ctrl.Current.ControlType.ProgrammaticName } | ConvertTo-Json -Compress -Depth 8\n  exit 0\n}\n\nthrow 'unsupported_ui_op'\n");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!desktopName) return [3 /*break*/, 3];
                        return [4 /*yield*/, GhostWorkspaceManager_1.ghostWorkspaceManager.runPowerShellOnDesktop(desktopName, ps, timeoutMs)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, runPowerShell(ps, timeoutMs)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        out = _a;
                        if (out.code !== 0) {
                            msg = (out.stderr || out.stdout || '').toString().trim();
                            return [2 /*return*/, { ok: false, error: msg || 'ui_failed' }];
                        }
                        parsed = null;
                        try {
                            parsed = JSON.parse((out.stdout || '').toString().trim());
                        }
                        catch (_c) {
                            parsed = { raw: out.stdout };
                        }
                        return [2 /*return*/, { ok: true, result: parsed }];
                    case 6:
                        e_1 = _b.sent();
                        return [2 /*return*/, { ok: false, error: (e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || 'ui_failed' }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Capture screenshot and save to temp file
     */
    WindowsUIAutomationAdapter.prototype.captureScreenshot = function (desktopName, region) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, screenshotPath, psScript, out, _a, msg, capturedPath, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        timestamp = Date.now();
                        screenshotPath = path_1.default.join(os_1.default.tmpdir(), "vlm_capture_".concat(timestamp, ".png"));
                        psScript = "\n      Add-Type -AssemblyName System.Drawing\n      Add-Type -AssemblyName System.Windows.Forms\n      ";
                        if (region) {
                            psScript += "\n        $bitmap = New-Object System.Drawing.Bitmap(".concat(region.width, ", ").concat(region.height, ")\n        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)\n        $graphics.CopyFromScreen(").concat(region.x, ", ").concat(region.y, ", 0, 0, $bitmap.Size)\n        $bitmap.Save(\"").concat(screenshotPath, "\", [System.Drawing.Imaging.ImageFormat]::Png)\n        $graphics.Dispose()\n        $bitmap.Dispose()\n        Write-Output \"").concat(screenshotPath, "\"\n      ");
                        }
                        else {
                            psScript += "\n        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds\n        $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)\n        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)\n        $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)\n        $bitmap.Save(\"".concat(screenshotPath, "\", [System.Drawing.Imaging.ImageFormat]::Png)\n        $graphics.Dispose()\n        $bitmap.Dispose()\n        Write-Output \"").concat(screenshotPath, "\"\n      ");
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        if (!desktopName) return [3 /*break*/, 3];
                        return [4 /*yield*/, GhostWorkspaceManager_1.ghostWorkspaceManager.runPowerShellOnDesktop(desktopName, psScript, 15000)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, runPowerShell(psScript, 15000)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        out = _a;
                        if (out.code !== 0) {
                            msg = (out.stderr || out.stdout || '').toString().trim();
                            throw new Error(msg || 'screenshot_capture_failed');
                        }
                        capturedPath = (out.stdout || '').toString().trim();
                        // Verify file exists
                        return [4 /*yield*/, promises_1.default.access(capturedPath)];
                    case 6:
                        // Verify file exists
                        _b.sent();
                        return [2 /*return*/, capturedPath];
                    case 7:
                        error_1 = _b.sent();
                        throw new Error("Screenshot capture failed: ".concat(error_1));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Perform template matching using pixel comparison
     */
    WindowsUIAutomationAdapter.prototype.performTemplateMatching = function (screenshotPath_1, templatePath_1) {
        return __awaiter(this, arguments, void 0, function (screenshotPath, templatePath, threshold) {
            var psScript, result, matchResult, error_2;
            if (threshold === void 0) { threshold = 0.8; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        psScript = "\n      Add-Type -AssemblyName System.Drawing\n      \n      function Compare-Images {\n        param(\n          [string]$ScreenshotPath,\n          [string]$TemplatePath,\n          [double]$Threshold = 0.8\n        )\n        \n        try {\n          $screenshot = [System.Drawing.Image]::FromFile($ScreenshotPath)\n          $template = [System.Drawing.Image]::FromFile($TemplatePath)\n          \n          $screenshotBmp = New-Object System.Drawing.Bitmap($screenshot)\n          $templateBmp = New-Object System.Drawing.Bitmap($template)\n          \n          $sW = $screenshotBmp.Width\n          $sH = $screenshotBmp.Height\n          $tW = $templateBmp.Width\n          $tH = $templateBmp.Height\n          \n          $bestMatch = @{ X = 0; Y = 0; Confidence = 0.0 }\n          \n          # Simple template matching using pixel comparison\n          for ($y = 0; $y -le ($sH - $tH); $y += 2) {\n            for ($x = 0; $x -le ($sW - $tW); $x += 2) {\n              $matches = 0\n              $total = $tW * $tH\n              \n              for ($ty = 0; $ty -lt $tH; $ty++) {\n                for ($tx = 0; $tx -lt $tW; $tx++) {\n                  $sPixel = $screenshotBmp.GetPixel($x + $tx, $y + $ty)\n                  $tPixel = $templateBmp.GetPixel($tx, $ty)\n                  \n                  # Compare RGB values with tolerance\n                  $rDiff = [Math]::Abs($sPixel.R - $tPixel.R)\n                  $gDiff = [Math]::Abs($sPixel.G - $tPixel.G)\n                  $bDiff = [Math]::Abs($sPixel.B - $tPixel.B)\n                  \n                  if ($rDiff -lt 30 -and $gDiff -lt 30 -and $bDiff -lt 30) {\n                    $matches++\n                  }\n                }\n              }\n              \n              $confidence = [double]$matches / $total\n              if ($confidence -gt $bestMatch.Confidence) {\n                $bestMatch.X = $x + [Math]::Floor($tW / 2)\n                $bestMatch.Y = $y + [Math]::Floor($tH / 2)\n                $bestMatch.Confidence = $confidence\n              }\n            }\n          }\n          \n          $screenshotBmp.Dispose()\n          $templateBmp.Dispose()\n          $screenshot.Dispose()\n          $template.Dispose()\n          \n          if ($bestMatch.Confidence -ge $Threshold) {\n            $result = @{\n              x = $bestMatch.X\n              y = $bestMatch.Y\n              confidence = $bestMatch.Confidence\n              found = $true\n            }\n          } else {\n            $result = @{\n              found = $false\n              confidence = $bestMatch.Confidence\n            }\n          }\n          \n          return $result | ConvertTo-Json -Compress\n        } catch {\n          return @{ found = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress\n        }\n      }\n      \n      Compare-Images -ScreenshotPath \"".concat(screenshotPath, "\" -TemplatePath \"").concat(templatePath, "\" -Threshold ").concat(threshold, "\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.runPowerShell(psScript, 30000)];
                    case 2:
                        result = _a.sent();
                        matchResult = JSON.parse(result);
                        if (matchResult.found) {
                            return [2 /*return*/, {
                                    x: matchResult.x,
                                    y: matchResult.y,
                                    confidence: matchResult.confidence
                                }];
                        }
                        else {
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw new Error("Template matching failed: ".concat(error_2));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Click at specific screen coordinates
     */
    WindowsUIAutomationAdapter.prototype.clickAtPosition = function (desktopName, x, y) {
        return __awaiter(this, void 0, void 0, function () {
            var psScript, out, _a, msg, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        psScript = "\n      Add-Type -TypeDefinition '\n        using System;\n        using System.Runtime.InteropServices;\n        public class Mouse {\n          [DllImport(\"user32.dll\")]\n          public static extern void SetCursorPos(int x, int y);\n          \n          [DllImport(\"user32.dll\")]\n          public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);\n          \n          private const uint MOUSEEVENTF_LEFTDOWN = 0x02;\n          private const uint MOUSEEVENTF_LEFTUP = 0x04;\n          \n          public static void Click(int x, int y) {\n            SetCursorPos(x, y);\n            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);\n            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);\n          }\n        }\n      '\n      \n      [Mouse]::Click(".concat(x, ", ").concat(y, ")\n    ");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!desktopName) return [3 /*break*/, 3];
                        return [4 /*yield*/, GhostWorkspaceManager_1.ghostWorkspaceManager.runPowerShellOnDesktop(desktopName, psScript, 5000)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, runPowerShell(psScript, 5000)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        out = _a;
                        if (out.code !== 0) {
                            msg = (out.stderr || out.stdout || '').toString().trim();
                            throw new Error(msg || 'click_failed');
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _b.sent();
                        throw new Error("Click at position failed: ".concat(error_3));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.resolveVlmCliPath = function () {
        return __awaiter(this, void 0, void 0, function () {
            var candidates, _i, candidates_1, p, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        candidates = [
                            path_1.default.resolve(process.cwd(), 'jason_service', 'ai_engine', 'vlm_cli.py'),
                            path_1.default.resolve(process.cwd(), '..', 'jason_service', 'ai_engine', 'vlm_cli.py'),
                            path_1.default.resolve(process.cwd(), '..', '..', 'jason_service', 'ai_engine', 'vlm_cli.py'),
                        ];
                        _i = 0, candidates_1 = candidates;
                        _b.label = 1;
                    case 1:
                        if (!(_i < candidates_1.length)) return [3 /*break*/, 6];
                        p = candidates_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.access(p)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, p];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: throw new Error('vlm_cli_not_found');
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.runVlmCli = function (imagePath_1, prompt_1) {
        return __awaiter(this, arguments, void 0, function (imagePath, prompt, opts) {
            var python, cliPath, args, timeoutMs;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        python = String(process.env.VLM_PYTHON_BIN || 'python').trim() || 'python';
                        return [4 /*yield*/, this.resolveVlmCliPath()];
                    case 1:
                        cliPath = _a.sent();
                        args = [
                            cliPath,
                            '--image', imagePath,
                            '--prompt', prompt,
                        ];
                        if (opts.modelName)
                            args.push('--model_name', String(opts.modelName));
                        if (opts.revision)
                            args.push('--revision', String(opts.revision));
                        timeoutMs = Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : 180000;
                        return [2 /*return*/, new Promise(function (resolve) {
                                var _a, _b;
                                var stdout = '';
                                var stderr = '';
                                var killed = false;
                                var child = (0, child_process_1.spawn)(python, args, { windowsHide: true });
                                var t = setTimeout(function () {
                                    killed = true;
                                    try {
                                        child.kill();
                                    }
                                    catch (_a) { }
                                }, Math.max(1000, timeoutMs));
                                (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (d) { stdout += d.toString(); });
                                (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (d) { stderr += d.toString(); });
                                child.on('close', function (code) {
                                    clearTimeout(t);
                                    var txt = (stdout || '').toString().trim();
                                    if (!txt) {
                                        var msg = (stderr || '').toString().trim();
                                        return resolve({ ok: false, error: killed ? 'vlm_timeout' : (msg || "vlm_cli_failed:".concat(code)) });
                                    }
                                    try {
                                        var parsed = JSON.parse(txt);
                                        if (parsed && parsed.ok && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
                                            return resolve({ ok: true, x: Number(parsed.x), y: Number(parsed.y), raw: String(parsed.raw || '') });
                                        }
                                        return resolve({ ok: false, error: String((parsed === null || parsed === void 0 ? void 0 : parsed.error) || 'vlm_cli_invalid_response'), raw: String((parsed === null || parsed === void 0 ? void 0 : parsed.raw) || txt) });
                                    }
                                    catch (_a) {
                                        var msg = (stderr || '').toString().trim();
                                        return resolve({ ok: false, error: msg || 'vlm_cli_non_json', raw: txt });
                                    }
                                });
                            })];
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.vlmServerUrl = function () {
        var explicit = String(process.env.VLM_SERVER_URL || '').trim();
        if (explicit)
            return explicit.replace(/\/$/, '');
        var host = String(process.env.VLM_SERVER_HOST || '127.0.0.1').trim() || '127.0.0.1';
        var port = Number(process.env.VLM_SERVER_PORT || 7777);
        return "http://".concat(host, ":").concat(Number.isFinite(port) ? port : 7777);
    };
    WindowsUIAutomationAdapter.prototype.resolveVlmServerPath = function () {
        return __awaiter(this, void 0, void 0, function () {
            var candidates, _i, candidates_2, p, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        candidates = [
                            path_1.default.resolve(process.cwd(), 'jason_service', 'ai_engine', 'vlm_server.py'),
                            path_1.default.resolve(process.cwd(), '..', 'jason_service', 'ai_engine', 'vlm_server.py'),
                            path_1.default.resolve(process.cwd(), '..', '..', 'jason_service', 'ai_engine', 'vlm_server.py'),
                        ];
                        _i = 0, candidates_2 = candidates;
                        _b.label = 1;
                    case 1:
                        if (!(_i < candidates_2.length)) return [3 /*break*/, 6];
                        p = candidates_2[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.access(p)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, p];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: throw new Error('vlm_server_not_found');
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.tryAutostartVlmServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var auto, python, serverPath, host, port, child, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.vlmServerBooted)
                            return [2 /*return*/];
                        auto = String(process.env.VLM_SERVER_AUTOSTART || '').trim().toLowerCase() === 'true';
                        if (!auto)
                            return [2 /*return*/];
                        this.vlmServerBooted = true;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        python = String(process.env.VLM_PYTHON_BIN || 'python').trim() || 'python';
                        return [4 /*yield*/, this.resolveVlmServerPath()];
                    case 2:
                        serverPath = _b.sent();
                        host = String(process.env.VLM_SERVER_HOST || '127.0.0.1').trim() || '127.0.0.1';
                        port = String(process.env.VLM_SERVER_PORT || 7777);
                        child = (0, child_process_1.spawn)(python, [serverPath, '--host', host, '--port', port], {
                            windowsHide: true,
                            detached: true,
                            stdio: 'ignore',
                        });
                        try {
                            child.unref();
                        }
                        catch (_c) { }
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        this.vlmServerBooted = false;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.runVlmServer = function (imagePath_1, prompt_1) {
        return __awaiter(this, arguments, void 0, function (imagePath, prompt, opts) {
            var fetch, timeoutMs, urlBase, controller, t, call, e_2, msg, _a;
            var _this = this;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, getFetch()];
                    case 1:
                        fetch = _b.sent();
                        timeoutMs = Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : 180000;
                        urlBase = this.vlmServerUrl();
                        controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                        t = setTimeout(function () {
                            try {
                                controller === null || controller === void 0 ? void 0 : controller.abort();
                            }
                            catch (_a) { }
                        }, Math.max(1000, timeoutMs));
                        call = function () { return __awaiter(_this, void 0, void 0, function () {
                            var resp, txt, data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch("".concat(urlBase, "/analyze"), {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                image: imagePath,
                                                prompt: prompt,
                                                modelName: opts.modelName,
                                                revision: opts.revision,
                                            }),
                                            signal: controller ? controller.signal : undefined,
                                        })];
                                    case 1:
                                        resp = _a.sent();
                                        return [4 /*yield*/, resp.text()];
                                    case 2:
                                        txt = _a.sent();
                                        try {
                                            data = JSON.parse(txt);
                                        }
                                        catch (_b) {
                                            data = { ok: false, error: 'vlm_server_non_json', raw: txt };
                                        }
                                        if (data && data.ok && Number.isFinite(data.x) && Number.isFinite(data.y)) {
                                            return [2 /*return*/, { ok: true, x: Number(data.x), y: Number(data.y), raw: String(data.raw || '') }];
                                        }
                                        return [2 /*return*/, { ok: false, error: String((data === null || data === void 0 ? void 0 : data.error) || "vlm_server_failed:".concat(resp.status)), raw: String((data === null || data === void 0 ? void 0 : data.raw) || txt) }];
                                }
                            });
                        }); };
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, 11, 12]);
                        return [4 /*yield*/, call()];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        e_2 = _b.sent();
                        msg = String((e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || '');
                        if (!!this.vlmServerBooted) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.tryAutostartVlmServer()];
                    case 5:
                        _b.sent();
                        if (!this.vlmServerBooted) return [3 /*break*/, 10];
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 9, , 10]);
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 800); })];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, call()];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9:
                        _a = _b.sent();
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/, { ok: false, error: msg.includes('aborted') ? 'vlm_timeout' : (msg || 'vlm_server_unavailable') }];
                    case 11:
                        clearTimeout(t);
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.vlmSemanticClick = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var desktopName, target, screenshotPath, prompt_1, out, out2, _a, finalOut, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        desktopName = (options.desktopName || '').trim();
                        if (!desktopName)
                            throw new Error('vlm_semantic_click_requires_desktopName');
                        target = String(options.targetText || '').trim();
                        if (!target)
                            throw new Error('targetText_required');
                        return [4 /*yield*/, this.captureScreenshot(desktopName, options.region)];
                    case 1:
                        screenshotPath = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, , 8, 12]);
                        prompt_1 = "Find the center coordinates of the UI element that best matches: \"".concat(target, "\". Respond ONLY in JSON like {\"x\":123,\"y\":456}.");
                        return [4 /*yield*/, this.runVlmServer(screenshotPath, prompt_1, { modelName: options.modelName, revision: options.revision, timeoutMs: options.timeoutMs })];
                    case 3:
                        out = _c.sent();
                        if (!(!out.ok || out.x === undefined || out.y === undefined)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.runVlmCli(screenshotPath, prompt_1, { modelName: options.modelName, revision: options.revision, timeoutMs: options.timeoutMs })];
                    case 4:
                        _a = _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _a = out;
                        _c.label = 6;
                    case 6:
                        out2 = _a;
                        finalOut = (out2 && out2.ok) ? out2 : out;
                        if (!finalOut.ok || finalOut.x === undefined || finalOut.y === undefined) {
                            return [2 /*return*/, { found: false, error: finalOut.error || 'vlm_no_match', raw: finalOut.raw }];
                        }
                        return [4 /*yield*/, this.clickAtPosition(desktopName, finalOut.x, finalOut.y)];
                    case 7:
                        _c.sent();
                        return [2 /*return*/, { found: true, position: { x: finalOut.x, y: finalOut.y }, raw: finalOut.raw }];
                    case 8:
                        _c.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, promises_1.default.unlink(screenshotPath)];
                    case 9:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        _b = _c.sent();
                        return [3 /*break*/, 11];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * VLM visual click - find template in screen and click it
     */
    WindowsUIAutomationAdapter.prototype.vlmVisualClick = function (templatePath_1) {
        return __awaiter(this, arguments, void 0, function (templatePath, options) {
            var screenshotPath, match, _a, error_4;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 13, , 14]);
                        // Validate template file exists
                        return [4 /*yield*/, promises_1.default.access(templatePath)
                            // Capture screenshot
                        ];
                    case 1:
                        // Validate template file exists
                        _b.sent();
                        return [4 /*yield*/, this.captureScreenshot(options.desktopName, options.region)];
                    case 2:
                        screenshotPath = _b.sent();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, , 8, 12]);
                        return [4 /*yield*/, this.performTemplateMatching(screenshotPath, templatePath, options.threshold || 0.8)];
                    case 4:
                        match = _b.sent();
                        if (!match) return [3 /*break*/, 6];
                        // Click at found position
                        return [4 /*yield*/, this.clickAtPosition(options.desktopName, match.x, match.y)];
                    case 5:
                        // Click at found position
                        _b.sent();
                        return [2 /*return*/, {
                                found: true,
                                position: { x: match.x, y: match.y },
                                confidence: match.confidence
                            }];
                    case 6: return [2 /*return*/, {
                            found: false,
                            confidence: 0
                        }];
                    case 7: return [3 /*break*/, 12];
                    case 8:
                        _b.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, promises_1.default.unlink(screenshotPath)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        _a = _b.sent();
                        return [3 /*break*/, 11];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_4 = _b.sent();
                        throw new Error("VLM visual click failed: ".concat(error_4));
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save base64 image to temp file
     */
    WindowsUIAutomationAdapter.prototype.saveBase64Image = function (base64Data) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, imagePath, base64Content, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = Date.now();
                        imagePath = path_1.default.join(os_1.default.tmpdir(), "vlm_template_".concat(timestamp, ".png"));
                        base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
                        buffer = Buffer.from(base64Content, 'base64');
                        return [4 /*yield*/, promises_1.default.writeFile(imagePath, buffer)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, imagePath];
                }
            });
        });
    };
    /**
     * OCR fallback using Tesseract CLI
     */
    WindowsUIAutomationAdapter.prototype.ocrReadText = function (windowTitle) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, screenshotPath, psScript, psScript, tesseractCmd_1, error_5, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        timestamp = Date.now();
                        screenshotPath = path_1.default.join(os_1.default.tmpdir(), "ocr_capture_".concat(timestamp, ".png"));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 11]);
                        if (!windowTitle) return [3 /*break*/, 3];
                        psScript = "\n          Add-Type -AssemblyName System.Drawing\n          Add-Type -AssemblyName System.Windows.Forms\n          \n          $process = Get-Process | Where-Object { $_.MainWindowTitle -like \"*".concat(windowTitle, "*\" } | Select-Object -First 1\n          if (-not $process) {\n            Write-Error \"Window not found: ").concat(windowTitle, "\"\n            exit 1\n          }\n          \n          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds\n          $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)\n          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)\n          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)\n          $bitmap.Save(\"").concat(screenshotPath, "\", [System.Drawing.Imaging.ImageFormat]::Png)\n          $graphics.Dispose()\n          $bitmap.Dispose()\n        ");
                        return [4 /*yield*/, this.runPowerShell(psScript, 10000)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        psScript = "\n          Add-Type -AssemblyName System.Drawing\n          Add-Type -AssemblyName System.Windows.Forms\n          \n          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds\n          $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)\n          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)\n          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)\n          $bitmap.Save(\"".concat(screenshotPath, "\", [System.Drawing.Imaging.ImageFormat]::Png)\n          $graphics.Dispose()\n          $bitmap.Dispose()\n        ");
                        return [4 /*yield*/, this.runPowerShell(psScript, 10000)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        tesseractCmd_1 = "tesseract \"".concat(screenshotPath, "\" stdout -l eng");
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var _a, _b;
                                var child = (0, child_process_1.spawn)(tesseractCmd_1, [], { shell: true });
                                var stdout = '';
                                var stderr = '';
                                (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                                    stdout += data.toString();
                                });
                                (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                                    stderr += data.toString();
                                });
                                child.on('close', function (code) {
                                    // Cleanup screenshot
                                    promises_1.default.unlink(screenshotPath).catch(function () { });
                                    if (code === 0 && stdout.trim()) {
                                        resolve(stdout.trim());
                                    }
                                    else {
                                        reject(new Error("OCR failed (tesseract not installed or error): ".concat(stderr)));
                                    }
                                });
                                child.on('error', function (error) {
                                    // Cleanup screenshot
                                    promises_1.default.unlink(screenshotPath).catch(function () { });
                                    reject(new Error("Tesseract not available: ".concat(error.message)));
                                });
                            })];
                    case 6:
                        error_5 = _b.sent();
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, promises_1.default.unlink(screenshotPath)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        _a = _b.sent();
                        return [3 /*break*/, 10];
                    case 10: throw error_5;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    WindowsUIAutomationAdapter.prototype.executeAction = function (a) {
        return __awaiter(this, void 0, void 0, function () {
            var op, payload, _a, desktopName, template, templatePath, result, _b, desktopName, targetText, result, e_3;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 17, , 18]);
                        op = String(a.payload.op || '').toLowerCase();
                        payload = a.payload;
                        _a = op;
                        switch (_a) {
                            case 'ocr.read_text': return [3 /*break*/, 1];
                            case 'vlm.visual_click': return [3 /*break*/, 3];
                            case 'vlm.semantic_click': return [3 /*break*/, 13];
                        }
                        return [3 /*break*/, 15];
                    case 1:
                        _c = { ok: true };
                        _d = {};
                        return [4 /*yield*/, this.ocrReadText(payload.windowTitle)];
                    case 2: return [2 /*return*/, (_c.result = (_d.text = _e.sent(), _d), _c)];
                    case 3:
                        desktopName = typeof payload.desktopName === 'string' ? payload.desktopName.trim() : '';
                        if (!desktopName) {
                            // This operation moves the cursor; require hidden desktop to avoid stealing user focus.
                            return [2 /*return*/, { ok: false, error: 'vlm_visual_click_requires_desktopName' }];
                        }
                        template = payload.templateImage || payload.templatePath;
                        if (!template) {
                            return [2 /*return*/, { ok: false, error: 'templateImage_or_templatePath_required' }];
                        }
                        templatePath = void 0;
                        if (!(typeof template === 'string' && template.startsWith('data:image'))) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.saveBase64Image(template)];
                    case 4:
                        // Save base64 image to temp file
                        templatePath = _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        // Use provided file path
                        templatePath = template;
                        _e.label = 6;
                    case 6:
                        _e.trys.push([6, , 8, 13]);
                        return [4 /*yield*/, this.vlmVisualClick(templatePath, {
                                desktopName: desktopName,
                                region: payload.region,
                                threshold: payload.threshold || 0.8,
                                searchWindow: payload.searchWindow,
                            })];
                    case 7:
                        result = _e.sent();
                        return [2 /*return*/, { ok: true, result: result }];
                    case 8:
                        if (!(typeof template === 'string' && template.startsWith('data:image'))) return [3 /*break*/, 12];
                        _e.label = 9;
                    case 9:
                        _e.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, promises_1.default.unlink(templatePath)];
                    case 10:
                        _e.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        _b = _e.sent();
                        return [3 /*break*/, 12];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        desktopName = typeof payload.desktopName === 'string' ? payload.desktopName.trim() : '';
                        if (!desktopName) {
                            // This operation moves the cursor; require hidden desktop to avoid stealing user focus.
                            return [2 /*return*/, { ok: false, error: 'vlm_semantic_click_requires_desktopName' }];
                        }
                        targetText = typeof payload.targetText === 'string'
                            ? payload.targetText
                            : (typeof payload.query === 'string' ? payload.query : '');
                        if (!String(targetText || '').trim()) {
                            return [2 /*return*/, { ok: false, error: 'targetText_required' }];
                        }
                        return [4 /*yield*/, this.vlmSemanticClick({
                                desktopName: desktopName,
                                targetText: String(targetText),
                                region: payload.region,
                                modelName: typeof payload.modelName === 'string' ? payload.modelName : undefined,
                                revision: typeof payload.revision === 'string' ? payload.revision : undefined,
                                timeoutMs: Number.isFinite(payload.timeoutMs) ? Number(payload.timeoutMs) : undefined,
                            })];
                    case 14:
                        result = _e.sent();
                        return [2 /*return*/, { ok: true, result: result }];
                    case 15: return [2 /*return*/, { ok: false, error: "unknown_ui_operation:".concat(op) }];
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        e_3 = _e.sent();
                        return [2 /*return*/, { ok: false, error: (e_3 === null || e_3 === void 0 ? void 0 : e_3.message) || 'ui_failed' }];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    return WindowsUIAutomationAdapter;
}());
exports.WindowsUIAutomationAdapter = WindowsUIAutomationAdapter;

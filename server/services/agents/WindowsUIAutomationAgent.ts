import type { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { ghostWorkspaceManager } from '../automation/GhostWorkspaceManager'

type FetchFn = (url: string, init?: any) => Promise<any>
let _fetchFn: FetchFn | null = null
async function getFetch(): Promise<FetchFn> {
  if (_fetchFn) return _fetchFn
  if (typeof (globalThis as any).fetch === 'function') {
    _fetchFn = (globalThis as any).fetch.bind(globalThis)
    return _fetchFn
  }
  const mod: any = await import('node-fetch')
  _fetchFn = (mod.default || mod) as FetchFn
  return _fetchFn
}

function isWindows(): boolean {
  return process.platform === 'win32'
}

function runPowerShell(script: string, timeoutMs = 30000): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let killed = false

    // IMPORTANT: do NOT use `shell: true` here.
    // Many of our PowerShell scripts contain `|` pipes; if we run through cmd.exe it will reinterpret
    // the pipes and PowerShell will receive `-Command` with no script, causing "missing parameter" errors.
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true })

    const t = setTimeout(() => {
      killed = true
      try { child.kill() } catch { }
    }, Math.max(500, timeoutMs))

    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => {
      clearTimeout(t)
      resolve({ code: killed ? null : code, stdout, stderr })
    })
  })
}

export class WindowsUIAutomationAdapter implements ActionAdapter {
  private vlmServerBooted = false

  canHandle(a: ActionDefinition): boolean {
    return a.type === 'ui'
  }

  private async runPowerShell(script: string, timeoutMs = 30000): Promise<string> {
    const out = await runPowerShell(script, timeoutMs)
    if (out.code !== 0) {
      const msg = (out.stderr || out.stdout || '').toString().trim()
      throw new Error(msg || 'powershell_failed')
    }
    return (out.stdout || '').toString()
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    if (!isWindows()) return { ok: false, error: 'ui_not_supported_on_platform' }

    const p = (a.payload && typeof a.payload === 'object') ? a.payload : {}
    const op = String(p.op || '').toLowerCase()

    // Non-UIA ops that are implemented in TypeScript helpers (OCR via screenshot + tesseract, VLM clicks).
    if (op === 'ocr.read_text' || op === 'vlm.visual_click' || op === 'vlm.semantic_click' || op === 'vlm.describe_screen') {
      return this.executeAction({ ...a, payload: { ...p, op } })
    }

    const desktopName = typeof (p as any).desktopName === 'string' ? String((p as any).desktopName) : ''

    const maxItems = Number.isFinite((p as any).maxItems) ? Number((p as any).maxItems) : 200
    const maxResults = Number.isFinite((p as any).maxResults) ? Number((p as any).maxResults) : 10
    const includeOffscreen = (p as any).includeOffscreen === true

    const query = typeof (p as any).query === 'string' ? String((p as any).query) : ''

    const windowTitle = typeof p.windowTitle === 'string' ? p.windowTitle : ''
    const controlName = typeof p.name === 'string' ? p.name : ''
    const controlType = typeof p.controlType === 'string' ? p.controlType : ''
    const value = typeof p.value === 'string' ? p.value : ''
    const timeoutMs = Number.isFinite(p.timeoutMs) ? Number(p.timeoutMs) : 30000

    if (!op) return { ok: false, error: 'ui_op_required' }

    // Normalize aliases
    const normalizedOp = op === 'type' ? 'control.set_value' : op === 'click' ? 'control.invoke' : op

    // UIAutomation can invoke and set values without moving the mouse.
    // We intentionally avoid SendKeys-style typing because it can steal focus.
    const psBool = (v: boolean) => (v ? '$true' : '$false')

    const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

function Ocr-ReadText([string]$imgPath){
  $t = Get-Command tesseract -ErrorAction SilentlyContinue
  if (-not $t) { throw 'tesseract_not_available' }
  $out = & tesseract $imgPath stdout 2>$null
  return ($out | Out-String)
}

function Score-Name([string]$cand, [string]$q){
  if ($q -eq '') { return 0 }
  $c = ($cand + '').ToLower()
  $q2 = ($q + '').ToLower()
  if ($c -eq $q2) { return 1.0 }
  if ($c.StartsWith($q2)) { return 0.9 }
  if ($c.Contains($q2)) { return 0.8 }
  return 0
}

function Search-Controls($root, [string]$q, [string]$type, [int]$maxResults, [bool]$includeOffscreen){
  $hits = @()
  if ($root -eq $null) { return $hits }
  $cond = [System.Windows.Automation.Condition]::TrueCondition
  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  foreach ($c in $all) {
    try {
      $cn = $c.Current.Name
      $ct = $c.Current.ControlType.ProgrammaticName
      $okType = ($type -eq '') -or ($ct -and $ct.ToLower().Contains($type.ToLower()))
      if (-not $okType) { continue }

      $isOff = $false
      try { $isOff = [bool]$c.Current.IsOffscreen } catch { $isOff = $false }
      if (-not $includeOffscreen -and $isOff) { continue }

      $score = Score-Name $cn $q
      if ($score -le 0) { continue }

      $hits += @{ score = $score; name = $cn; type = $ct; automationId = $c.Current.AutomationId; class = $c.Current.ClassName; offscreen = $isOff }
    } catch {}
  }
  $sorted = $hits | Sort-Object -Property score -Descending | Select-Object -First $maxResults
  return ,$sorted
}

function Find-Window([string]$title){
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $title)
  $win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
  if ($win -eq $null -and $title -ne '') {
    # fallback: substring search
    $children = $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($c in $children) {
      try {
        $n = $c.Current.Name
        if ($n -and $n.ToLower().Contains($title.ToLower())) { return $c }
      } catch {}
    }
  }
  return $win
}

function Find-Control($root, [string]$name, [string]$type){
  if ($root -eq $null) { return $null }
  $cond = [System.Windows.Automation.Condition]::TrueCondition
  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  foreach ($c in $all) {
    try {
      $cn = $c.Current.Name
      $ct = $c.Current.ControlType.ProgrammaticName
      $okName = ($name -eq '') -or ($cn -and ($cn.ToLower() -eq $name.ToLower() -or $cn.ToLower().Contains($name.ToLower())))
      $okType = ($type -eq '') -or ($ct -and $ct.ToLower().Contains($type.ToLower()))
      if ($okName -and $okType) { return $c }
    } catch {}
  }
  return $null
}

function Dump-Controls($root, [int]$maxItems, [bool]$includeOffscreen){
  $out = @()
  if ($root -eq $null) { return $out }
  $cond = [System.Windows.Automation.Condition]::TrueCondition
  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  $count = 0
  foreach ($c in $all) {
    if ($count -ge $maxItems) { break }
    try {
      $isOff = $false
      try { $isOff = [bool]$c.Current.IsOffscreen } catch { $isOff = $false }
      if (-not $includeOffscreen -and $isOff) { continue }
      $rect = $null
      try { $rect = $c.Current.BoundingRectangle } catch { $rect = $null }
      $r = $null
      if ($rect -ne $null) {
        $r = @{ x = $rect.X; y = $rect.Y; width = $rect.Width; height = $rect.Height }
      }
      $out += @{ name = $c.Current.Name; type = $c.Current.ControlType.ProgrammaticName; automationId = $c.Current.AutomationId; class = $c.Current.ClassName; offscreen = $isOff; rect = $r }
      $count++
    } catch {}
  }
  return $out
}

$winTitle = ${JSON.stringify(windowTitle)}
$targetName = ${JSON.stringify(controlName)}
$targetType = ${JSON.stringify(controlType)}
$val = ${JSON.stringify(value)}
$op = ${JSON.stringify(normalizedOp)}
$maxItems = ${JSON.stringify(maxItems)}
$maxResults = ${JSON.stringify(maxResults)}
$includeOffscreen = ${psBool(includeOffscreen)}
$query = ${JSON.stringify(query)}

$win = Find-Window $winTitle
if ($win -eq $null -and $winTitle -ne '') { throw 'window_not_found' }

if ($op -eq 'window.find') {
  if ($win -eq $null) { throw 'window_not_found' }
  $out = @{ ok = $true; windowTitle = $win.Current.Name; class = $win.Current.ClassName; framework = $win.Current.FrameworkId }
  $out | ConvertTo-Json -Compress -Depth 8
  exit 0
}

$root = $win
if ($root -eq $null) { $root = [System.Windows.Automation.AutomationElement]::RootElement }

if ($op -eq 'ocr.read_text' -or $op -eq 'ui.ocr.read_text') {
  Add-Type -AssemblyName System.Drawing
  Add-Type -AssemblyName System.Windows.Forms

  $rect = $null
  if ($win -ne $null) {
    try { $rect = $win.Current.BoundingRectangle } catch { $rect = $null }
  }

  $x = 0; $y = 0; $w = 0; $h = 0
  if ($rect -ne $null -and $rect.Width -gt 0 -and $rect.Height -gt 0) {
    $x = [int][Math]::Max(0, $rect.X)
    $y = [int][Math]::Max(0, $rect.Y)
    $w = [int][Math]::Max(1, $rect.Width)
    $h = [int][Math]::Max(1, $rect.Height)
  } else {
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $x = $b.X; $y = $b.Y; $w = $b.Width; $h = $b.Height
  }

  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)

  $img = Join-Path $env:TEMP ("jason_ocr_" + [Guid]::NewGuid().ToString() + ".png")
  $bmp.Save($img, [System.Drawing.Imaging.ImageFormat]::Png)
  try { $g.Dispose() } catch {}
  try { $bmp.Dispose() } catch {}

  $text = Ocr-ReadText $img
  try { Remove-Item -Force $img -ErrorAction SilentlyContinue } catch {}
  @{ ok = $true; text = ($text + '').Trim() } | ConvertTo-Json -Compress -Depth 8
  exit 0
}

if ($op -eq 'ui.tree.dump' -or $op -eq 'tree.dump') {
  $items = Dump-Controls $root $maxItems $includeOffscreen
  @{ ok = $true; count = $items.Count; items = $items } | ConvertTo-Json -Compress -Depth 8
  exit 0
}

if ($op -eq 'control.search' -or $op -eq 'search') {
  $items = Search-Controls $root $query $targetType $maxResults $includeOffscreen
  @{ ok = $true; count = $items.Count; items = $items } | ConvertTo-Json -Compress -Depth 8
  exit 0
}

$ctrl = Find-Control $root $targetName $targetType
if ($ctrl -eq $null) { throw 'control_not_found' }

if ($op -eq 'control.invoke' -or $op -eq 'click') {
  $pat = $ctrl.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  if ($pat -eq $null) { throw 'invoke_pattern_not_supported' }
  $pat.Invoke()
  @{ ok = $true; op = $op; name = $ctrl.Current.Name; type = $ctrl.Current.ControlType.ProgrammaticName } | ConvertTo-Json -Compress -Depth 8
  exit 0
}

if ($op -eq 'control.set_value' -or $op -eq 'set_value') {
  $pat = $ctrl.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  if ($pat -eq $null) { throw 'value_pattern_not_supported' }
  $pat.SetValue($val)
  @{ ok = $true; op = $op; name = $ctrl.Current.Name; type = $ctrl.Current.ControlType.ProgrammaticName } | ConvertTo-Json -Compress -Depth 8
  exit 0
}

throw 'unsupported_ui_op'
`
    try {
      const out = desktopName
        ? await ghostWorkspaceManager.runPowerShellOnDesktop(desktopName, ps, timeoutMs)
        : await runPowerShell(ps, timeoutMs)
      if (out.code !== 0) {
        const msg = (out.stderr || out.stdout || '').toString().trim()
        return { ok: false, error: msg || 'ui_failed' }
      }
      let parsed: any = null
      try { parsed = JSON.parse((out.stdout || '').toString().trim()) } catch { parsed = { raw: out.stdout } }
      return { ok: true, result: parsed }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'ui_failed' }
    }
  }

  /**
   * Capture screenshot and save to temp file
   */
  private async captureScreenshot(desktopName?: string, region?: { x: number; y: number; width: number; height: number }): Promise<string> {
    const timestamp = Date.now()
    const screenshotPath = path.join(os.tmpdir(), `vlm_capture_${timestamp}.png`)

    let psScript = `
      Add-Type -AssemblyName System.Drawing
      Add-Type -AssemblyName System.Windows.Forms
      `

    if (region) {
      psScript += `
        $bitmap = New-Object System.Drawing.Bitmap(${region.width}, ${region.height})
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen(${region.x}, ${region.y}, 0, 0, $bitmap.Size)
        $bitmap.Save("${screenshotPath}", [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
        Write-Output "${screenshotPath}"
      `
    } else {
      psScript += `
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
        $bitmap.Save("${screenshotPath}", [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
        Write-Output "${screenshotPath}"
      `
    }

    try {
      const out = desktopName
        ? await ghostWorkspaceManager.runPowerShellOnDesktop(desktopName, psScript, 15000)
        : await runPowerShell(psScript, 15000)

      if (out.code !== 0) {
        const msg = (out.stderr || out.stdout || '').toString().trim()
        throw new Error(msg || 'screenshot_capture_failed')
      }

      const capturedPath = (out.stdout || '').toString().trim()

      // Verify file exists
      await fs.access(capturedPath)
      return capturedPath
    } catch (error) {
      throw new Error(`Screenshot capture failed: ${error}`)
    }
  }

  /**
   * Perform template matching using pixel comparison
   */
  private async performTemplateMatching(
    screenshotPath: string,
    templatePath: string,
    threshold: number = 0.8
  ): Promise<{ x: number; y: number; confidence: number } | null> {
    const psScript = `
      Add-Type -AssemblyName System.Drawing
      
      function Compare-Images {
        param(
          [string]$ScreenshotPath,
          [string]$TemplatePath,
          [double]$Threshold = 0.8
        )
        
        try {
          $screenshot = [System.Drawing.Image]::FromFile($ScreenshotPath)
          $template = [System.Drawing.Image]::FromFile($TemplatePath)
          
          $screenshotBmp = New-Object System.Drawing.Bitmap($screenshot)
          $templateBmp = New-Object System.Drawing.Bitmap($template)
          
          $sW = $screenshotBmp.Width
          $sH = $screenshotBmp.Height
          $tW = $templateBmp.Width
          $tH = $templateBmp.Height
          
          $bestMatch = @{ X = 0; Y = 0; Confidence = 0.0 }
          
          # Simple template matching using pixel comparison
          for ($y = 0; $y -le ($sH - $tH); $y += 2) {
            for ($x = 0; $x -le ($sW - $tW); $x += 2) {
              $matches = 0
              $total = $tW * $tH
              
              for ($ty = 0; $ty -lt $tH; $ty++) {
                for ($tx = 0; $tx -lt $tW; $tx++) {
                  $sPixel = $screenshotBmp.GetPixel($x + $tx, $y + $ty)
                  $tPixel = $templateBmp.GetPixel($tx, $ty)
                  
                  # Compare RGB values with tolerance
                  $rDiff = [Math]::Abs($sPixel.R - $tPixel.R)
                  $gDiff = [Math]::Abs($sPixel.G - $tPixel.G)
                  $bDiff = [Math]::Abs($sPixel.B - $tPixel.B)
                  
                  if ($rDiff -lt 30 -and $gDiff -lt 30 -and $bDiff -lt 30) {
                    $matches++
                  }
                }
              }
              
              $confidence = [double]$matches / $total
              if ($confidence -gt $bestMatch.Confidence) {
                $bestMatch.X = $x + [Math]::Floor($tW / 2)
                $bestMatch.Y = $y + [Math]::Floor($tH / 2)
                $bestMatch.Confidence = $confidence
              }
            }
          }
          
          $screenshotBmp.Dispose()
          $templateBmp.Dispose()
          $screenshot.Dispose()
          $template.Dispose()
          
          if ($bestMatch.Confidence -ge $Threshold) {
            $result = @{
              x = $bestMatch.X
              y = $bestMatch.Y
              confidence = $bestMatch.Confidence
              found = $true
            }
          } else {
            $result = @{
              found = $false
              confidence = $bestMatch.Confidence
            }
          }
          
          return $result | ConvertTo-Json -Compress
        } catch {
          return @{ found = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
      }
      
      Compare-Images -ScreenshotPath "${screenshotPath}" -TemplatePath "${templatePath}" -Threshold ${threshold}
    `

    try {
      const result = await this.runPowerShell(psScript, 30000)
      const matchResult = JSON.parse(result)

      if (matchResult.found) {
        return {
          x: matchResult.x,
          y: matchResult.y,
          confidence: matchResult.confidence
        }
      } else {
        return null
      }
    } catch (error) {
      throw new Error(`Template matching failed: ${error}`)
    }
  }

  /**
   * Click at specific screen coordinates
   */
  private async clickAtPosition(desktopName: string | undefined, x: number, y: number): Promise<void> {
    const psScript = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern void SetCursorPos(int x, int y);
          
          [DllImport("user32.dll")]
          public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
          
          private const uint MOUSEEVENTF_LEFTDOWN = 0x02;
          private const uint MOUSEEVENTF_LEFTUP = 0x04;
          
          public static void Click(int x, int y) {
            SetCursorPos(x, y);
            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
          }
        }
      '
      
      [Mouse]::Click(${x}, ${y})
    `

    try {
      const out = desktopName
        ? await ghostWorkspaceManager.runPowerShellOnDesktop(desktopName, psScript, 5000)
        : await runPowerShell(psScript, 5000)

      if (out.code !== 0) {
        const msg = (out.stderr || out.stdout || '').toString().trim()
        throw new Error(msg || 'click_failed')
      }
    } catch (error) {
      throw new Error(`Click at position failed: ${error}`)
    }
  }

  private async resolveVlmCliPath(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), 'jason_service', 'ai_engine', 'vlm_cli.py'),
      path.resolve(process.cwd(), '..', 'jason_service', 'ai_engine', 'vlm_cli.py'),
      path.resolve(process.cwd(), '..', '..', 'jason_service', 'ai_engine', 'vlm_cli.py'),
    ]
    for (const p of candidates) {
      try {
        await fs.access(p)
        return p
      } catch { }
    }
    throw new Error('vlm_cli_not_found')
  }

  private async runVlmCli(imagePath: string, prompt: string, opts: { modelName?: string; revision?: string; timeoutMs?: number } = {}): Promise<{ ok: boolean; x?: number; y?: number; raw?: string; error?: string }> {
    const python = String(process.env.VLM_PYTHON_BIN || 'python').trim() || 'python'
    const cliPath = await this.resolveVlmCliPath()
    const args = [
      cliPath,
      '--image', imagePath,
      '--prompt', prompt,
    ]
    if (opts.modelName) args.push('--model_name', String(opts.modelName))
    if (opts.revision) args.push('--revision', String(opts.revision))

    const timeoutMs = Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : 180000

    return new Promise((resolve) => {
      let stdout = ''
      let stderr = ''
      let killed = false
      const child = spawn(python, args, { windowsHide: true })
      const t = setTimeout(() => {
        killed = true
        try { child.kill() } catch { }
      }, Math.max(1000, timeoutMs))
      child.stdout?.on('data', (d) => { stdout += d.toString() })
      child.stderr?.on('data', (d) => { stderr += d.toString() })
      child.on('close', (code) => {
        clearTimeout(t)
        const txt = (stdout || '').toString().trim()
        if (!txt) {
          const msg = (stderr || '').toString().trim()
          return resolve({ ok: false, error: killed ? 'vlm_timeout' : (msg || `vlm_cli_failed:${code}`) })
        }
        try {
          const parsed: any = JSON.parse(txt)
          if (parsed && parsed.ok && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
            return resolve({ ok: true, x: Number(parsed.x), y: Number(parsed.y), raw: String(parsed.raw || '') })
          }
          return resolve({ ok: false, error: String(parsed?.error || 'vlm_cli_invalid_response'), raw: String(parsed?.raw || txt) })
        } catch {
          const msg = (stderr || '').toString().trim()
          return resolve({ ok: false, error: msg || 'vlm_cli_non_json', raw: txt })
        }
      })
    })
  }

  private vlmServerUrl(): string {
    const explicit = String(process.env.VLM_SERVER_URL || '').trim()
    if (explicit) return explicit.replace(/\/$/, '')
    const host = String(process.env.VLM_SERVER_HOST || '127.0.0.1').trim() || '127.0.0.1'
    const port = Number(process.env.VLM_SERVER_PORT || 7777)
    return `http://${host}:${Number.isFinite(port) ? port : 7777}`
  }

  private async resolveVlmServerPath(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), 'jason_service', 'ai_engine', 'vlm_server.py'),
      path.resolve(process.cwd(), '..', 'jason_service', 'ai_engine', 'vlm_server.py'),
      path.resolve(process.cwd(), '..', '..', 'jason_service', 'ai_engine', 'vlm_server.py'),
    ]
    for (const p of candidates) {
      try {
        await fs.access(p)
        return p
      } catch { }
    }
    throw new Error('vlm_server_not_found')
  }

  private async tryAutostartVlmServer(): Promise<void> {
    if (this.vlmServerBooted) return
    const auto = String(process.env.VLM_SERVER_AUTOSTART || '').trim().toLowerCase() === 'true'
    if (!auto) return
    this.vlmServerBooted = true
    try {
      const python = String(process.env.VLM_PYTHON_BIN || 'python').trim() || 'python'
      const serverPath = await this.resolveVlmServerPath()
      const host = String(process.env.VLM_SERVER_HOST || '127.0.0.1').trim() || '127.0.0.1'
      const port = String(process.env.VLM_SERVER_PORT || 7777)
      const child = spawn(python, [serverPath, '--host', host, '--port', port], {
        windowsHide: true,
        detached: true,
        stdio: 'ignore',
      })
      try { child.unref() } catch { }
    } catch {
      this.vlmServerBooted = false
    }
  }

  private async runVlmServer(imagePath: string, prompt: string, opts: { modelName?: string; revision?: string; timeoutMs?: number } = {}): Promise<{ ok: boolean; x?: number; y?: number; raw?: string; error?: string }> {
    const fetch = await getFetch()
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : 180000
    const urlBase = this.vlmServerUrl()
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const t = setTimeout(() => {
      try { controller?.abort() } catch { }
    }, Math.max(1000, timeoutMs))

    const call = async () => {
      const resp = await fetch(`${urlBase}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePath,
          prompt,
          modelName: opts.modelName,
          revision: opts.revision,
        }),
        signal: controller ? controller.signal : undefined,
      })
      const txt = await resp.text()
      let data: any
      try { data = JSON.parse(txt) } catch { data = { ok: false, error: 'vlm_server_non_json', raw: txt } }
      if (data && data.ok && Number.isFinite(data.x) && Number.isFinite(data.y)) {
        return { ok: true, x: Number(data.x), y: Number(data.y), raw: String(data.raw || '') }
      }
      return { ok: false, error: String(data?.error || `vlm_server_failed:${resp.status}`), raw: String(data?.raw || txt) }
    }

    try {
      return await call()
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (!this.vlmServerBooted) {
        await this.tryAutostartVlmServer()
        if (this.vlmServerBooted) {
          try {
            await new Promise(r => setTimeout(r, 800))
            return await call()
          } catch { }
        }
      }
      return { ok: false, error: msg.includes('aborted') ? 'vlm_timeout' : (msg || 'vlm_server_unavailable') }
    } finally {
      clearTimeout(t)
    }
  }

  private async vlmSemanticClick(options: {
    desktopName?: string
    targetText: string
    region?: { x: number; y: number; width: number; height: number }
    modelName?: string
    revision?: string
    timeoutMs?: number
  }): Promise<{ found: boolean; position?: { x: number; y: number }; raw?: string; error?: string }> {
    const desktopName = (options.desktopName || '').trim()
    if (!desktopName) throw new Error('vlm_semantic_click_requires_desktopName')
    const target = String(options.targetText || '').trim()
    if (!target) throw new Error('targetText_required')

    const screenshotPath = await this.captureScreenshot(desktopName, options.region)
    try {
      const prompt = `Find the center coordinates of the UI element that best matches: "${target}". Respond ONLY in JSON like {"x":123,"y":456}.`
      const out = await this.runVlmServer(screenshotPath, prompt, { modelName: options.modelName, revision: options.revision, timeoutMs: options.timeoutMs })
      const out2 = (!out.ok || out.x === undefined || out.y === undefined)
        ? await this.runVlmCli(screenshotPath, prompt, { modelName: options.modelName, revision: options.revision, timeoutMs: options.timeoutMs })
        : out
      const finalOut = (out2 && out2.ok) ? out2 : out
      if (!finalOut.ok || finalOut.x === undefined || finalOut.y === undefined) {
        return { found: false, error: finalOut.error || 'vlm_no_match', raw: finalOut.raw }
      }
      await this.clickAtPosition(desktopName, finalOut.x, finalOut.y)
      return { found: true, position: { x: finalOut.x, y: finalOut.y }, raw: finalOut.raw }
    } finally {
      try { await fs.unlink(screenshotPath) } catch { }
    }
  }

  /**
   * VLM visual click - find template in screen and click it
   */
  private async vlmVisualClick(
    templatePath: string,
    options: {
      desktopName?: string
      region?: { x: number; y: number; width: number; height: number }
      threshold?: number
      searchWindow?: string
    } = {}
  ): Promise<{ found: boolean; position?: { x: number; y: number }; confidence?: number }> {
    try {
      // Validate template file exists
      await fs.access(templatePath)

      // Capture screenshot
      const screenshotPath = await this.captureScreenshot(options.desktopName, options.region)

      try {
        // Perform template matching
        const match = await this.performTemplateMatching(
          screenshotPath,
          templatePath,
          options.threshold || 0.8
        )

        if (match) {
          // Click at found position
          await this.clickAtPosition(options.desktopName, match.x, match.y)

          return {
            found: true,
            position: { x: match.x, y: match.y },
            confidence: match.confidence
          }
        } else {
          return {
            found: false,
            confidence: 0
          }
        }
      } finally {
        // Cleanup temporary screenshot
        try {
          await fs.unlink(screenshotPath)
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      throw new Error(`VLM visual click failed: ${error}`)
    }
  }

  /**
   * Save base64 image to temp file
   */
  private async saveBase64Image(base64Data: string): Promise<string> {
    const timestamp = Date.now()
    const imagePath = path.join(os.tmpdir(), `vlm_template_${timestamp}.png`)

    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '')
    const buffer = Buffer.from(base64Content, 'base64')

    await fs.writeFile(imagePath, buffer)
    return imagePath
  }

  /**
   * OCR fallback using Tesseract CLI
   */
  private async ocrReadText(windowTitle?: string): Promise<string> {
    const timestamp = Date.now()
    const screenshotPath = path.join(os.tmpdir(), `ocr_capture_${timestamp}.png`)

    try {
      // Capture screenshot
      if (windowTitle) {
        const psScript = `
          Add-Type -AssemblyName System.Drawing
          Add-Type -AssemblyName System.Windows.Forms
          
          $process = Get-Process | Where-Object { $_.MainWindowTitle -like "*${windowTitle}*" } | Select-Object -First 1
          if (-not $process) {
            Write-Error "Window not found: ${windowTitle}"
            exit 1
          }
          
          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
          $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
          $bitmap.Save("${screenshotPath}", [System.Drawing.Imaging.ImageFormat]::Png)
          $graphics.Dispose()
          $bitmap.Dispose()
        `

        await this.runPowerShell(psScript, 10000)
      } else {
        // Full screen capture
        const psScript = `
          Add-Type -AssemblyName System.Drawing
          Add-Type -AssemblyName System.Windows.Forms
          
          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
          $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
          $bitmap.Save("${screenshotPath}", [System.Drawing.Imaging.ImageFormat]::Png)
          $graphics.Dispose()
          $bitmap.Dispose()
        `

        await this.runPowerShell(psScript, 10000)
      }

      // Try to run Tesseract OCR
      const tesseractCmd = `tesseract "${screenshotPath}" stdout -l eng`

      return new Promise((resolve, reject) => {
        const child = spawn(tesseractCmd, [], { shell: true })
        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (data) => {
          stdout += data.toString()
        })

        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })

        child.on('close', (code) => {
          // Cleanup screenshot
          fs.unlink(screenshotPath).catch(() => { })

          if (code === 0 && stdout.trim()) {
            resolve(stdout.trim())
          } else {
            reject(new Error(`OCR failed (tesseract not installed or error): ${stderr}`))
          }
        })

        child.on('error', (error) => {
          // Cleanup screenshot
          fs.unlink(screenshotPath).catch(() => { })
          reject(new Error(`Tesseract not available: ${error.message}`))
        })
      })
    } catch (error) {
      // Ensure cleanup on error
      try {
        await fs.unlink(screenshotPath)
      } catch {
        // Ignore cleanup errors
      }
      throw error
    }
  }

  async executeAction(a: ActionDefinition): Promise<ExecutionResult> {
    try {
      const op = String(a.payload.op || '').toLowerCase()
      const payload = a.payload

      switch (op) {
        case 'ocr.read_text':
          return { ok: true, result: { text: await this.ocrReadText(payload.windowTitle) } }

        case 'vlm.visual_click': {
          const desktopName = typeof payload.desktopName === 'string' ? payload.desktopName.trim() : undefined

          const template = payload.templateImage || payload.templatePath
          if (!template) {
            return { ok: false, error: 'templateImage_or_templatePath_required' }
          }

          let templatePath: string
          if (typeof template === 'string' && template.startsWith('data:image')) {
            // Save base64 image to temp file
            templatePath = await this.saveBase64Image(template)
          } else {
            // Use provided file path
            templatePath = template
          }

          try {
            const result = await this.vlmVisualClick(templatePath, {
              desktopName,
              region: payload.region,
              threshold: payload.threshold || 0.8,
              searchWindow: payload.searchWindow,
            })
            return { ok: true, result }
          } finally {
            // Cleanup temp template file if we created it
            if (typeof template === 'string' && template.startsWith('data:image')) {
              try {
                await fs.unlink(templatePath)
              } catch {
                // Ignore cleanup errors
              }
            }
          }
        }

        case 'vlm.semantic_click': {
          const desktopName = typeof payload.desktopName === 'string' ? payload.desktopName.trim() : undefined

          const targetText = typeof payload.targetText === 'string'
            ? payload.targetText
            : (typeof payload.query === 'string' ? payload.query : '')
          if (!String(targetText || '').trim()) {
            return { ok: false, error: 'targetText_required' }
          }

          const result = await this.vlmSemanticClick({
            desktopName,
            targetText: String(targetText),
            region: payload.region,
            modelName: typeof payload.modelName === 'string' ? payload.modelName : undefined,
            revision: typeof payload.revision === 'string' ? payload.revision : undefined,
            timeoutMs: Number.isFinite(payload.timeoutMs) ? Number(payload.timeoutMs) : undefined,
          })
          return { ok: true, result }
        }

        case 'vlm.describe_screen': {
          const desktopName = typeof payload.desktopName === 'string' ? payload.desktopName.trim() : undefined
          const screenshotPath = await this.captureScreenshot(desktopName, payload.region)
          try {
            const prompt = payload.prompt || "Describe this screen in detail, listing visible windows, text, and interactive elements."
            const out = await this.runVlmServer(screenshotPath, prompt, { modelName: payload.modelName, timeoutMs: payload.timeoutMs })
            return { ok: out.ok || !!out.raw, result: { description: out.raw || out.error } }
          } finally {
            try { await fs.unlink(screenshotPath) } catch { }
          }
        }

        default:
          return { ok: false, error: `unknown_ui_operation:${op}` }
      }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'ui_failed' }
    }
  }
}

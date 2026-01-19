import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { runPowerShell } from './PowerShellRunner'

function isWindows(): boolean {
  return process.platform === 'win32'
}


export type GhostLaunchRequest = {
  path: string
  args?: string[]
  desktopName?: string
  timeoutMs?: number
}

export type GhostLaunchResult = {
  pid: number
  desktopName: string
}

export class GhostWorkspaceManager {
  private prefix: string

  constructor(prefix = 'JASON_GHOST') {
    this.prefix = prefix
  }

  createDesktopName(): string {
    const rand = Math.random().toString(36).slice(2, 10)
    return `${this.prefix}_${Date.now()}_${rand}`
  }

  async launchOnHiddenDesktop(req: GhostLaunchRequest): Promise<{ ok: true; result: GhostLaunchResult } | { ok: false; error: string }> {
    if (!isWindows()) return { ok: false, error: 'ghost_desktop_not_supported_on_platform' }

    const path = String(req.path || '').trim()
    if (!path) return { ok: false, error: 'path_required' }

    const args = Array.isArray(req.args) ? req.args.map((a) => String(a)) : []
    const desktopName = String(req.desktopName || this.createDesktopName())
    const timeoutMs = Number.isFinite(req.timeoutMs) ? Number(req.timeoutMs) : 30000

    const quoteForCreateProcess = (arg: string) => {
      const s = String(arg ?? '')
      if (s.length === 0) return '""'
      if (!/[\s"]/g.test(s)) return s
      // Windows CreateProcess quoting: wrap in quotes and escape internal quotes/backslashes.
      return '"' + s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1') + '"'
    }

    const appPath = path
    // When passing lpApplicationName = $null to CreateProcess, command line must start with the executable.
    // Use standard CreateProcess quoting rules (only quote when needed).
    const cmdLine = [quoteForCreateProcess(appPath), ...args.map(quoteForCreateProcess)].join(' ')

    const psSingleQuote = (s: string) => `'${String(s ?? '').replace(/'/g, "''")}'`

    const ps = `
$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class GhostDesktop {
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, int dwFlags, uint dwDesiredAccess, IntPtr lpsa);

  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

  [DllImport("user32.dll", SetLastError=true)]
  public static extern bool CloseDesktop(IntPtr hDesktop);

  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct STARTUPINFO {
    public int cb;
    public string lpReserved;
    public string lpDesktop;
    public string lpTitle;
    public int dwX;
    public int dwY;
    public int dwXSize;
    public int dwYSize;
    public int dwXCountChars;
    public int dwYCountChars;
    public int dwFillAttribute;
    public int dwFlags;
    public short wShowWindow;
    public short cbReserved2;
    public IntPtr lpReserved2;
    public IntPtr hStdInput;
    public IntPtr hStdOutput;
    public IntPtr hStdError;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct PROCESS_INFORMATION {
    public IntPtr hProcess;
    public IntPtr hThread;
    public int dwProcessId;
    public int dwThreadId;
  }

  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CreateProcess(
    string lpApplicationName,
    StringBuilder lpCommandLine,
    IntPtr lpProcessAttributes,
    IntPtr lpThreadAttributes,
    bool bInheritHandles,
    uint dwCreationFlags,
    IntPtr lpEnvironment,
    string lpCurrentDirectory,
    ref STARTUPINFO lpStartupInfo,
    out PROCESS_INFORMATION lpProcessInformation
  );

  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool CloseHandle(IntPtr hObject);
}
"@

$DESKTOP_ALL_ACCESS = 0x000F01FF
$name = ${JSON.stringify(desktopName)}
$cmd = ${psSingleQuote(cmdLine)}
$deskPath = "winsta0\\$name"

$h = [GhostDesktop]::CreateDesktop($name, [IntPtr]::Zero, [IntPtr]::Zero, 0, $DESKTOP_ALL_ACCESS, [IntPtr]::Zero)
if ($h -eq [IntPtr]::Zero) {
  $h = [GhostDesktop]::OpenDesktop($name, 0, $false, $DESKTOP_ALL_ACCESS)
}
if ($h -eq [IntPtr]::Zero) { throw 'desktop_create_or_open_failed' }

$si = New-Object GhostDesktop+STARTUPINFO
$si.cb = [Runtime.InteropServices.Marshal]::SizeOf([type]([GhostDesktop+STARTUPINFO]))
$si.lpDesktop = $deskPath
$si.dwFlags = 0x00000001
$si.wShowWindow = 0

$pi = New-Object GhostDesktop+PROCESS_INFORMATION
$sb = New-Object System.Text.StringBuilder ($cmd)
$ok = [GhostDesktop]::CreateProcess($null, $sb, [IntPtr]::Zero, [IntPtr]::Zero, $false, 0, [IntPtr]::Zero, $null, [ref]$si, [ref]$pi)
if (-not $ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw ("create_process_failed:" + $err + "; desktop=" + $deskPath + "; cmd=" + $cmd)
}

try { [GhostDesktop]::CloseHandle($pi.hThread) | Out-Null } catch {}
try { [GhostDesktop]::CloseHandle($pi.hProcess) | Out-Null } catch {}
try { [GhostDesktop]::CloseDesktop($h) | Out-Null } catch {}

@{ ok = $true; pid = $pi.dwProcessId; desktopName = $name } | ConvertTo-Json -Compress
`

    try {
      const out = await runPowerShell(ps, timeoutMs)
      if (out.code !== 0) {
        const msg = (out.stderr || out.stdout || '').toString().trim()
        return { ok: false, error: msg || 'ghost_launch_failed' }
      }
      const raw = (out.stdout || '').toString().trim()
      const parsed = JSON.parse(raw)
      const pid = Number(parsed?.pid)
      const dn = String(parsed?.desktopName || desktopName)
      if (!Number.isFinite(pid) || pid <= 0) return { ok: false, error: 'ghost_launch_no_pid' }
      return { ok: true, result: { pid, desktopName: dn } }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'ghost_launch_failed' }
    }
  }

  async runPowerShellOnDesktop(desktopName: string, script: string, timeoutMs = 30000): Promise<{ code: number | null; stdout: string; stderr: string }> {
    const dn = String(desktopName || '').trim()
    if (!dn) return runPowerShell(script, timeoutMs)
    if (!isWindows()) return { code: 1, stdout: '', stderr: 'ghost_desktop_not_supported_on_platform' }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jason-ghost-'))
    const outPath = path.join(tmpDir, 'stdout.txt')
    const errPath = path.join(tmpDir, 'stderr.txt')

    try {
      const psExe = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
      const encoded = Buffer.from(String(script || ''), 'utf16le').toString('base64')
      const cmdLine = `cmd.exe /c "\"${psExe}\" -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded} 1> \"${outPath}\" 2> \"${errPath}\""`

      const psSingleQuote = (s: string) => `'${String(s ?? '').replace(/'/g, "''")}'`

      const outerPs = `
$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class GhostDesktop {
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, int dwFlags, uint dwDesiredAccess, IntPtr lpsa);

  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

  [DllImport("user32.dll", SetLastError=true)]
  public static extern bool CloseDesktop(IntPtr hDesktop);

  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct STARTUPINFO {
    public int cb;
    public string lpReserved;
    public string lpDesktop;
    public string lpTitle;
    public int dwX;
    public int dwY;
    public int dwXSize;
    public int dwYSize;
    public int dwXCountChars;
    public int dwYCountChars;
    public int dwFillAttribute;
    public int dwFlags;
    public short wShowWindow;
    public short cbReserved2;
    public IntPtr lpReserved2;
    public IntPtr hStdInput;
    public IntPtr hStdOutput;
    public IntPtr hStdError;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct PROCESS_INFORMATION {
    public IntPtr hProcess;
    public IntPtr hThread;
    public int dwProcessId;
    public int dwThreadId;
  }

  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CreateProcess(
    string lpApplicationName,
    StringBuilder lpCommandLine,
    IntPtr lpProcessAttributes,
    IntPtr lpThreadAttributes,
    bool bInheritHandles,
    uint dwCreationFlags,
    IntPtr lpEnvironment,
    string lpCurrentDirectory,
    ref STARTUPINFO lpStartupInfo,
    out PROCESS_INFORMATION lpProcessInformation
  );

  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);

  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool GetExitCodeProcess(IntPtr hProcess, out uint lpExitCode);

  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);

  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool CloseHandle(IntPtr hObject);
}
"@

$DESKTOP_ALL_ACCESS = 0x000F01FF
$name = ${JSON.stringify(dn)}
$cmd = ${psSingleQuote(cmdLine)}
$deskPath = "winsta0\\$name"

$h = [GhostDesktop]::OpenDesktop($name, 0, $false, $DESKTOP_ALL_ACCESS)
if ($h -eq [IntPtr]::Zero) {
  $h = [GhostDesktop]::CreateDesktop($name, [IntPtr]::Zero, [IntPtr]::Zero, 0, $DESKTOP_ALL_ACCESS, [IntPtr]::Zero)
}
if ($h -eq [IntPtr]::Zero) { throw 'desktop_create_or_open_failed' }

$si = New-Object GhostDesktop+STARTUPINFO
$si.cb = [Runtime.InteropServices.Marshal]::SizeOf([type]([GhostDesktop+STARTUPINFO]))
$si.lpDesktop = $deskPath
$si.dwFlags = 0x00000001
$si.wShowWindow = 0

$pi = New-Object GhostDesktop+PROCESS_INFORMATION
$sb = New-Object System.Text.StringBuilder ($cmd)
$ok = [GhostDesktop]::CreateProcess($null, $sb, [IntPtr]::Zero, [IntPtr]::Zero, $false, 0, [IntPtr]::Zero, $null, [ref]$si, [ref]$pi)
if (-not $ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw ("create_process_failed:" + $err)
}

$WAIT_OBJECT_0 = 0
$WAIT_TIMEOUT = 258
$wait = [GhostDesktop]::WaitForSingleObject($pi.hProcess, ${timeoutMs})

$exitCode = 0
if ($wait -eq $WAIT_TIMEOUT) {
  try { [GhostDesktop]::TerminateProcess($pi.hProcess, 1) | Out-Null } catch {}
  $exitCode = 408
} else {
  [uint32]$code = 0
  $got = [GhostDesktop]::GetExitCodeProcess($pi.hProcess, [ref]$code)
  if ($got) { $exitCode = [int]$code } else { $exitCode = 1 }
}

try { [GhostDesktop]::CloseHandle($pi.hThread) | Out-Null } catch {}
try { [GhostDesktop]::CloseHandle($pi.hProcess) | Out-Null } catch {}
try { [GhostDesktop]::CloseDesktop($h) | Out-Null } catch {}

@{ ok = $true; exitCode = $exitCode } | ConvertTo-Json -Compress
`

      const outer = await runPowerShell(outerPs, timeoutMs + 5000)
      let code: number | null = null
      try {
        const parsed = JSON.parse((outer.stdout || '').toString().trim())
        const c = Number(parsed?.exitCode)
        code = Number.isFinite(c) ? c : null
      } catch {
        code = outer.code
      }

      let stdout = ''
      let stderr = ''
      try { stdout = await fs.readFile(outPath, 'utf8') } catch { }
      try { stderr = await fs.readFile(errPath, 'utf8') } catch { }
      const outerErr = (outer.stderr || '').toString().trim()
      if (!stderr && outerErr) stderr = outerErr

      return { code, stdout, stderr }
    } finally {
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch { }
    }
  }
}

export const ghostWorkspaceManager = new GhostWorkspaceManager()

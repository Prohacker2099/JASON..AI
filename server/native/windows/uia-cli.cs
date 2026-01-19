using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Diagnostics;
using System.Threading;
using System.Linq;
using System.Windows.Automation;

class UIA
{
    const uint WM_MOUSEMOVE = 0x0200;
    const uint WM_LBUTTONDOWN = 0x0201;
    const uint WM_LBUTTONUP = 0x0202;
    const uint WM_RBUTTONDOWN = 0x0204;
    const uint WM_RBUTTONUP = 0x0205;
    const uint WM_MBUTTONDOWN = 0x0207;
    const uint WM_MBUTTONUP = 0x0208;
    const uint WM_KEYDOWN = 0x0100;
    const uint WM_KEYUP = 0x0101;
    const uint WM_CHAR = 0x0102;
    const uint WM_MOUSEWHEEL = 0x020A;
    const uint WM_SYSKEYDOWN = 0x0104;
    const uint WM_SYSKEYUP = 0x0105;

    // Desktop management constants
    const uint DESKTOP_READOBJECTS = 0x0001;
    const uint DESKTOP_CREATEWINDOW = 0x0002;
    const uint DESKTOP_CREATEMENU = 0x0004;
    const uint DESKTOP_HOOKCONTROL = 0x0008;
    const uint DESKTOP_JOURNALRECORD = 0x0010;
    const uint DESKTOP_JOURNALPLAYBACK = 0x0020;
    const uint DESKTOP_ENUMERATE = 0x0040;
    const uint DESKTOP_WRITEOBJECTS = 0x0080;
    const uint DESKTOP_SWITCHDESKTOP = 0x0100;
    const uint DESKTOP_CREATEDESKTOP = 0x0200;
    const uint DF_ALLOWOTHERACCOUNTHOOK = 0x0001;

    // Jitter constants
    private static readonly Random random = new Random();
    private const int MIN_JITTER = -5;
    private const int MAX_JITTER = 5;
    private const int MIN_DELAY = 8;
    private const int MAX_DELAY = 25;

    [DllImport("user32.dll")]
    static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    const uint SMTO_ABORTIFHUNG = 0x0002;

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CloseHandle(IntPtr hObject);

    // Desktop management APIs
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevMode, int dwFlags, uint dwDesiredAccess, IntPtr lpsa);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr OpenDesktop(string lpszDesktop, int dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SwitchDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool CloseDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr GetThreadDesktop(int dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr OpenInputDesktop(int dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("kernel32.dll")]
    static extern uint GetCurrentThreadId();

    // Process and window APIs
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    struct POINT
    {
        public int X;
        public int Y;
    }

    static bool EnsureHiddenThreadDesktop()
    {
        if (!CreateHiddenDesktop()) return false;
        return SwitchToHiddenDesktop();
    }

    [DllImport("user32.dll")]
    static extern bool ScreenToClient(IntPtr hWnd, ref POINT lpPoint);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    static int MAKE_LPARAM(int low, int high) { return (high << 16) | (low & 0xFFFF); }

    // Hidden desktop management
    private static IntPtr hiddenDesktop = IntPtr.Zero;
    private static IntPtr originalDesktop = IntPtr.Zero;
    private static bool hiddenDesktopActive = false;
    private static string hiddenDesktopName = "";
    private static string DEFAULT_DESKTOP = "JASON_Workspace";
    private static bool allowInteractive = (Environment.GetEnvironmentVariable("JASON_ALLOW_INTERACTIVE_UI") == "1");
    private static bool coordsAreClient = (Environment.GetEnvironmentVariable("JASON_WIN_COORD_MODE") ?? "").ToLower() == "client";
    private static bool allowLegacyInput = (Environment.GetEnvironmentVariable("JASON_ALLOW_LEGACY_INPUT") == "1");
    private static bool allowLegacyHotkeys = (Environment.GetEnvironmentVariable("JASON_ALLOW_LEGACY_HOTKEYS") == "1");
    private static bool allowLegacyPointer = (Environment.GetEnvironmentVariable("JASON_ALLOW_LEGACY_POINTER") == "1");

    // CreateProcess interop for launching into specific desktop
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct STARTUPINFO
    {
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
    struct PROCESS_INFORMATION
    {
        public IntPtr hProcess;
        public IntPtr hThread;
        public int dwProcessId;
        public int dwThreadId;
    }

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool CreateProcess(
        string lpApplicationName,
        string lpCommandLine,
        IntPtr lpProcessAttributes,
        IntPtr lpThreadAttributes,
        bool bInheritHandles,
        uint dwCreationFlags,
        IntPtr lpEnvironment,
        string lpCurrentDirectory,
        ref STARTUPINFO lpStartupInfo,
        out PROCESS_INFORMATION lpProcessInformation);

    class WinInfo
    {
        public long windowNumber { get; set; }
        public string ownerName { get; set; } = "";
        public int ownerPID { get; set; }
        public string name { get; set; } = "";
        public int layer { get; set; } = 0;
        public Dictionary<string, int> bounds { get; set; } = new Dictionary<string, int>{{"x",0},{"y",0},{"w",0},{"h",0}};
    }

    // Jitter generation methods
    static int GetJitterOffset()
    {
        return random.Next(MIN_JITTER, MAX_JITTER + 1);
    }

    static int GetJitterDelay()
    {
        return random.Next(MIN_DELAY, MAX_DELAY + 1);
    }

    static Point ApplyJitter(int x, int y)
    {
        return new Point
        {
            X = x + GetJitterOffset(),
            Y = y + GetJitterOffset()
        };
    }

    struct Point
    {
        public int X;
        public int Y;
    }

    static List<(IntPtr hWnd, uint pid, string title)> EnumTopWindows()
    {
        var list = new List<(IntPtr, uint, string)>();
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            uint pid; GetWindowThreadProcessId(hWnd, out pid);
            int len = GetWindowTextLength(hWnd);
            var sb = new StringBuilder(len + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            list.Add((hWnd, pid, sb.ToString()));
            return true;
        }, IntPtr.Zero);
        return list;
    }

    static IntPtr FindWindowByPid(uint pid)
    {
        IntPtr found = IntPtr.Zero;
        IntPtr hDesk = OpenDesktop(DEFAULT_DESKTOP, 0, false, DESKTOP_ENUMERATE | DESKTOP_READOBJECTS | DESKTOP_WRITEOBJECTS | DESKTOP_CREATEWINDOW);
        if (hDesk != IntPtr.Zero)
        {
            try
            {
                EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                    uint pid2; GetWindowThreadProcessId(hWnd, out pid2);
                    if (pid2 == pid) { found = hWnd; return false; }
                    return true;
                }, IntPtr.Zero);
                if (found != IntPtr.Zero) return found;
            }
            finally { CloseDesktop(hDesk); }
        }

        if (!allowInteractive) return IntPtr.Zero;

        var list = EnumTopWindows();
        foreach (var w in list)
            if (w.pid == pid) return w.hWnd;
        return IntPtr.Zero;
    }

    static IntPtr WaitForWindowByPid(uint pid, int timeoutMs)
    {
        int max = Math.Max(100, timeoutMs);
        int start = Environment.TickCount;
        while ((Environment.TickCount - start) < max)
        {
            IntPtr h = FindWindowByPid(pid);
            if (h != IntPtr.Zero) return h;
            Thread.Sleep(100);
        }
        return FindWindowByPid(pid);
    }

    static bool SafeSend(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam)
    {
        try
        {
            IntPtr res;
            IntPtr ok = SendMessageTimeout(hWnd, msg, wParam, lParam, SMTO_ABORTIFHUNG, 1000, out res);
            return ok != IntPtr.Zero;
        }
        catch
        {
            try { PostMessage(hWnd, msg, wParam, lParam); return true; } catch { return false; }
        }
    }

    static Point ClientToScreenPoint(IntPtr hWnd, int clientX, int clientY, bool useJitter)
    {
        int sx = clientX;
        int sy = clientY;
        if (GetWindowRect(hWnd, out RECT rect))
        {
            sx = rect.Left + clientX;
            sy = rect.Top + clientY;
        }
        if (useJitter)
        {
            sx += GetJitterOffset();
            sy += GetJitterOffset();
        }
        return new Point { X = sx, Y = sy };
    }

    static AutomationElement GetRootForPid(int pid)
    {
        if (!EnsureHiddenThreadDesktop()) return null;
        IntPtr hWnd = WaitForWindowByPid((uint)pid, 15000);
        if (hWnd == IntPtr.Zero) return null;
        try { return AutomationElement.FromHandle(hWnd); } catch { return null; }
    }

    static bool BelongsToPid(AutomationElement el, int pid)
    {
        if (el == null) return false;
        try { return el.Current.ProcessId == pid; } catch { return false; }
    }

    static bool TryInvokeElement(AutomationElement el)
    {
        if (el == null) return false;
        try { el.SetFocus(); } catch { }
        try
        {
            object p;
            if (el.TryGetCurrentPattern(InvokePattern.Pattern, out p)) { ((InvokePattern)p).Invoke(); return true; }
            if (el.TryGetCurrentPattern(SelectionItemPattern.Pattern, out p)) { ((SelectionItemPattern)p).Select(); return true; }
            if (el.TryGetCurrentPattern(TogglePattern.Pattern, out p)) { ((TogglePattern)p).Toggle(); return true; }
            if (el.TryGetCurrentPattern(LegacyIAccessiblePattern.Pattern, out p)) { ((LegacyIAccessiblePattern)p).DoDefaultAction(); return true; }
        }
        catch { }
        return false;
    }

    static bool TrySetValueElement(AutomationElement el, string text, bool append)
    {
        if (el == null) return false;
        try { el.SetFocus(); } catch { }
        try
        {
            object p;
            if (el.TryGetCurrentPattern(ValuePattern.Pattern, out p))
            {
                var vp = (ValuePattern)p;
                if (vp.Current.IsReadOnly) return false;
                string v = text ?? "";
                if (append)
                {
                    try { v = (vp.Current.Value ?? "") + (text ?? ""); } catch { }
                }
                vp.SetValue(v);
                return true;
            }
            if (el.TryGetCurrentPattern(LegacyIAccessiblePattern.Pattern, out p))
            {
                ((LegacyIAccessiblePattern)p).SetValue(text ?? "");
                return true;
            }
        }
        catch { }
        return false;
    }

    static AutomationElement FindElementByScreenPoint(AutomationElement root, int screenX, int screenY)
    {
        if (root == null) return null;
        try
        {
            var all = root.FindAll(TreeScope.Descendants, Condition.TrueCondition);
            int n = Math.Min(all.Count, 8000);
            AutomationElement best = null;
            double bestArea = double.MaxValue;
            for (int i = 0; i < n; i++)
            {
                var el = all[i];
                try
                {
                    var r = el.Current.BoundingRectangle;
                    if (r.IsEmpty) continue;
                    if (screenX < r.Left || screenX > r.Right || screenY < r.Top || screenY > r.Bottom) continue;
                    double area = Math.Abs((r.Right - r.Left) * (r.Bottom - r.Top));
                    if (area <= 0) area = double.MaxValue - 1;
                    if (area < bestArea)
                    {
                        bestArea = area;
                        best = el;
                    }
                }
                catch { }
            }
            return best;
        }
        catch { return null; }
    }

    static AutomationElement FindScrollableAncestor(AutomationElement el)
    {
        if (el == null) return null;
        var walker = TreeWalker.ControlViewWalker;
        AutomationElement cur = el;
        for (int i = 0; i < 20 && cur != null; i++)
        {
            try
            {
                object p;
                if (cur.TryGetCurrentPattern(ScrollPattern.Pattern, out p)) return cur;
            }
            catch { }
            try { cur = walker.GetParent(cur); } catch { cur = null; }
        }
        return null;
    }

    static ControlType ControlTypeFromString(string s)
    {
        string t = (s ?? "").Trim().ToLower();
        if (t == "edit" || t == "textbox" || t == "input") return ControlType.Edit;
        if (t == "button") return ControlType.Button;
        if (t == "checkbox") return ControlType.CheckBox;
        if (t == "radiobutton") return ControlType.RadioButton;
        if (t == "combobox") return ControlType.ComboBox;
        if (t == "list") return ControlType.List;
        if (t == "listitem") return ControlType.ListItem;
        if (t == "menuitem") return ControlType.MenuItem;
        if (t == "tab") return ControlType.Tab;
        if (t == "tabitem") return ControlType.TabItem;
        if (t == "document") return ControlType.Document;
        if (t == "pane") return ControlType.Pane;
        if (t == "hyperlink" || t == "link") return ControlType.Hyperlink;
        return null;
    }

    // query format: "name:Exact;aid:Exact;class:Exact;type:button;contains:substring"
    // if no key prefixes are used, it is treated as contains:
    static AutomationElement FindElementByQuery(AutomationElement root, string query)
    {
        if (root == null) return null;
        string q = (query ?? "").Trim();
        if (string.IsNullOrEmpty(q) || q == "*") return root;

        string contains = null;
        string nameEq = null;
        string aidEq = null;
        string clsEq = null;
        string typeEq = null;

        var parts = q.Split(new char[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            var p = part.Trim();
            if (p.StartsWith("name:", StringComparison.OrdinalIgnoreCase)) nameEq = p.Substring(5);
            else if (p.StartsWith("automationid:", StringComparison.OrdinalIgnoreCase)) aidEq = p.Substring(13);
            else if (p.StartsWith("aid:", StringComparison.OrdinalIgnoreCase)) aidEq = p.Substring(4);
            else if (p.StartsWith("class:", StringComparison.OrdinalIgnoreCase)) clsEq = p.Substring(6);
            else if (p.StartsWith("type:", StringComparison.OrdinalIgnoreCase)) typeEq = p.Substring(5);
            else if (p.StartsWith("contains:", StringComparison.OrdinalIgnoreCase)) contains = p.Substring(9);
            else contains = p;
        }

        var conds = new List<Condition>();
        if (!string.IsNullOrEmpty(nameEq)) conds.Add(new PropertyCondition(AutomationElement.NameProperty, nameEq));
        if (!string.IsNullOrEmpty(aidEq)) conds.Add(new PropertyCondition(AutomationElement.AutomationIdProperty, aidEq));
        if (!string.IsNullOrEmpty(clsEq)) conds.Add(new PropertyCondition(AutomationElement.ClassNameProperty, clsEq));
        if (!string.IsNullOrEmpty(typeEq))
        {
            var ct = ControlTypeFromString(typeEq);
            if (ct != null) conds.Add(new PropertyCondition(AutomationElement.ControlTypeProperty, ct));
        }

        Condition cond = conds.Count == 0 ? Condition.TrueCondition : (conds.Count == 1 ? conds[0] : new AndCondition(conds.ToArray()));
        string containsLc = string.IsNullOrEmpty(contains) ? null : contains.ToLower();

        try
        {
            var all = root.FindAll(TreeScope.Descendants, cond);
            int n = Math.Min(all.Count, 6000);
            for (int i = 0; i < n; i++)
            {
                var el = all[i];
                if (containsLc == null) return el;
                try
                {
                    string nm = (el.Current.Name ?? "").ToLower();
                    if (nm.Contains(containsLc)) return el;
                    string aid = (el.Current.AutomationId ?? "").ToLower();
                    if (aid.Contains(containsLc)) return el;
                    string cl = (el.Current.ClassName ?? "").ToLower();
                    if (cl.Contains(containsLc)) return el;
                }
                catch { }
            }
        }
        catch { }
        return null;
    }

    static Point ScreenToClientPoint(IntPtr hWnd, int screenX, int screenY, bool useJitter)
    {
        if (coordsAreClient)
        {
            int cx = screenX;
            int cy = screenY;
            if (useJitter)
            {
                cx += GetJitterOffset();
                cy += GetJitterOffset();
            }
            return new Point { X = cx, Y = cy };
        }

        int sx = screenX;
        int sy = screenY;
        if (useJitter)
        {
            sx += GetJitterOffset();
            sy += GetJitterOffset();
        }
        var p = new POINT { X = sx, Y = sy };
        try { ScreenToClient(hWnd, ref p); } catch { }
        return new Point { X = p.X, Y = p.Y };
    }

    static string QuoteArg(string arg)
    {
        if (arg == null) return "\"\"";
        bool needsQuotes = arg.Length == 0 || arg.IndexOfAny(new char[] { ' ', '\t', '\n', '\v', '"' }) >= 0;
        if (!needsQuotes) return arg;

        var sb = new StringBuilder();
        sb.Append('"');

        int backslashes = 0;
        foreach (char c in arg)
        {
            if (c == '\\')
            {
                backslashes++;
                continue;
            }

            if (c == '"')
            {
                sb.Append('\\', backslashes * 2 + 1);
                sb.Append('"');
                backslashes = 0;
                continue;
            }

            if (backslashes > 0)
            {
                sb.Append('\\', backslashes);
                backslashes = 0;
            }
            sb.Append(c);
        }

        if (backslashes > 0) sb.Append('\\', backslashes * 2);
        sb.Append('"');
        return sb.ToString();
    }

    // Hidden desktop management methods
    static bool CreateHiddenDesktop()
    {
        if (hiddenDesktopActive) return true;
        
        try
        {
            // Store original desktop
            originalDesktop = GetThreadDesktop((int)GetCurrentThreadId());
            
            // Create hidden desktop with full access
            hiddenDesktopName = DEFAULT_DESKTOP;
            hiddenDesktop = OpenDesktop(
                hiddenDesktopName,
                0,
                false,
                DESKTOP_CREATEWINDOW | DESKTOP_READOBJECTS | DESKTOP_WRITEOBJECTS | DESKTOP_ENUMERATE | DESKTOP_HOOKCONTROL
            );
            if (hiddenDesktop == IntPtr.Zero)
            {
                hiddenDesktop = CreateDesktop(
                    hiddenDesktopName,
                    IntPtr.Zero,
                    IntPtr.Zero,
                    0,
                    DESKTOP_CREATEWINDOW | DESKTOP_READOBJECTS | DESKTOP_WRITEOBJECTS | DESKTOP_ENUMERATE | DESKTOP_HOOKCONTROL,
                    IntPtr.Zero
                );
            }
            
            if (hiddenDesktop == IntPtr.Zero)
            {
                int error = Marshal.GetLastWin32Error();
                Console.WriteLine($"{{\"error\":\"CreateDesktop failed\", \"code\":{error}}}");
                return false;
            }
            
            hiddenDesktopActive = true;
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{{\"error\":\"CreateDesktop exception\", \"message\":\"{ex.Message}\"}}");
            return false;
        }
    }

    static bool SwitchToHiddenDesktop()
    {
        if (!hiddenDesktopActive || hiddenDesktop == IntPtr.Zero)
        {
            if (!CreateHiddenDesktop()) return false;
        }
        
        try
        {
            if (!SetThreadDesktop(hiddenDesktop))
            {
                int error = Marshal.GetLastWin32Error();
                Console.WriteLine($"{{\"error\":\"SetThreadDesktop failed\", \"code\":{error}}}");
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{{\"error\":\"SwitchToHiddenDesktop exception\", \"message\":\"{ex.Message}\"}}");
            return false;
        }
    }

    static bool SwitchToOriginalDesktop()
    {
        if (originalDesktop == IntPtr.Zero) return false;
        
        try
        {
            if (!SetThreadDesktop(originalDesktop))
            {
                int error = Marshal.GetLastWin32Error();
                Console.WriteLine($"{{\"error\":\"SetThreadDesktop to original failed\", \"code\":{error}}}");
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{{\"error\":\"SwitchToOriginalDesktop exception\", \"message\":\"{ex.Message}\"}}");
            return false;
        }
    }

    static bool CleanupHiddenDesktop()
    {
        if (hiddenDesktop != IntPtr.Zero)
        {
            CloseDesktop(hiddenDesktop);
            hiddenDesktop = IntPtr.Zero;
            hiddenDesktopActive = false;
            hiddenDesktopName = "";
        }
        return true;
    }

    static bool CmdHotkeyPid(string seq, int pid)
    {
        var root = GetRootForPid(pid);
        if (root != null)
        {
            var parts = (seq ?? "").Split('+');
            var mods = new List<string>();
            string main = null;
            foreach (var p in parts)
            {
                var t = (p ?? "").Trim().ToLower();
                if (t == "ctrl" || t == "control" || t == "alt" || t == "shift" || t == "win" || t == "cmd") mods.Add(t);
                else if (!string.IsNullOrEmpty(t)) main = t;
            }

            if (mods.Count == 0 && (main == "enter" || main == "return"))
            {
                AutomationElement focus = null;
                try { focus = AutomationElement.FocusedElement; } catch { focus = null; }
                if (focus != null && BelongsToPid(focus, pid))
                {
                    if (TryInvokeElement(focus)) return true;
                }
                try
                {
                    var cond = new AndCondition(
                        new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button),
                        new PropertyCondition(AutomationElement.IsDefaultProperty, true)
                    );
                    var defBtn = root.FindFirst(TreeScope.Descendants, cond);
                    if (defBtn != null) return TryInvokeElement(defBtn);
                }
                catch { }
            }
        }

        if (allowLegacyHotkeys) return CmdHotkeyPidLegacy(seq, pid);
        return false;
    }

    static int CmdCreateDesktop()
    {
        if (!CreateHiddenDesktop()) return 1;
        Console.WriteLine(string.IsNullOrEmpty(hiddenDesktopName) ? "" : hiddenDesktopName);
        return 0;
    }

    static int CmdLaunchOnDesk(string exePath, string[] argList)
    {
        if (string.IsNullOrWhiteSpace(exePath)) return 2;
        if (!CreateHiddenDesktop()) return 3;
        var si = new STARTUPINFO();
        si.cb = Marshal.SizeOf(typeof(STARTUPINFO));
        si.lpDesktop = string.IsNullOrEmpty(hiddenDesktopName) ? DEFAULT_DESKTOP : hiddenDesktopName;
        var pi = new PROCESS_INFORMATION();
        string cmdLine = QuoteArg(exePath);
        if (argList != null && argList.Length > 0)
        {
            cmdLine = cmdLine + " " + string.Join(" ", argList.Select(a => QuoteArg(a)));
        }
        bool ok = CreateProcess(
            exePath,
            cmdLine,
            IntPtr.Zero,
            IntPtr.Zero,
            false,
            0,
            IntPtr.Zero,
            null,
            ref si,
            out pi
        );
        if (!ok)
        {
            int err = Marshal.GetLastWin32Error();
            Console.WriteLine($"{{\"error\":\"CreateProcess failed\",\"code\":{err}}}");
            return 10;
        }
        try { Console.WriteLine(pi.dwProcessId.ToString()); } catch {}
        try { if (pi.hThread != IntPtr.Zero) CloseHandle(pi.hThread); } catch {}
        try { if (pi.hProcess != IntPtr.Zero) CloseHandle(pi.hProcess); } catch {}
        return 0;
    }

    static void CmdWinlist(string filter)
    {
        var list = EnumTopWindows();
        var outItems = new List<string>();
        foreach (var w in list)
        {
            if (!string.IsNullOrEmpty(filter))
            {
                if (!(w.title ?? "").ToLower().Contains(filter.ToLower())) continue;
            }
            var item = new WinInfo
            {
                windowNumber = w.hWnd.ToInt64(),
                ownerPID = (int)w.pid,
                name = w.title ?? "",
                ownerName = "",
                layer = 0,
            };
            
            // Get window bounds
            if (GetWindowRect(w.hWnd, out RECT rect))
            {
                item.bounds["x"] = rect.Left;
                item.bounds["y"] = rect.Top;
                item.bounds["w"] = rect.Right - rect.Left;
                item.bounds["h"] = rect.Bottom - rect.Top;
            }
            
            outItems.Add($"{{\"windowNumber\":{item.windowNumber},\"ownerName\":\"\",\"ownerPID\":{item.ownerPID},\"name\":{JsonEscape(item.name)},\"layer\":0,\"bounds\":{{\"x\":{item.bounds[\"x\"]},\"y\":{item.bounds[\"y\"]},\"w\":{item.bounds[\"w\"]},\"h\":{item.bounds[\"h\"]}}}}}");
        }
        Console.WriteLine("[" + string.Join(",", outItems) + "]");
    }

    static void CmdWinlistDesk(string filter)
    {
        try { CreateHiddenDesktop(); } catch { }
        IntPtr hDesk = OpenDesktop(DEFAULT_DESKTOP, 0, false, DESKTOP_ENUMERATE | DESKTOP_READOBJECTS);
        if (hDesk == IntPtr.Zero)
        {
            Console.WriteLine("[]");
            return;
        }
        var outItems = new List<string>();
        try
        {
            EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                if (!IsWindowVisible(hWnd)) return true;
                uint pid; GetWindowThreadProcessId(hWnd, out pid);
                int len = GetWindowTextLength(hWnd);
                var sb = new StringBuilder(len + 1);
                GetWindowText(hWnd, sb, sb.Capacity);
                string title = sb.ToString();
                if (!string.IsNullOrEmpty(filter))
                {
                    if (!(title ?? "").ToLower().Contains(filter.ToLower())) return true;
                }
                int left = 0; int top = 0; int w = 0; int h = 0;
                if (GetWindowRect(hWnd, out RECT rect))
                {
                    left = rect.Left; top = rect.Top; w = rect.Right - rect.Left; h = rect.Bottom - rect.Top;
                }
                long hwndN = hWnd.ToInt64();
                outItems.Add($"{{\"windowNumber\":{hwndN},\"ownerName\":\"\",\"ownerPID\":{(int)pid},\"name\":{JsonEscape(title)},\"layer\":0,\"bounds\":{{\"x\":{left},\"y\":{top},\"w\":{w},\"h\":{h}}}}}");
                return true;
            }, IntPtr.Zero);
        }
        finally { CloseDesktop(hDesk); }
        Console.WriteLine("[" + string.Join(",", outItems) + "]");
    }

    static string JsonEscape(string s)
    {
        if (s == null) return "\"\"";
        return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r") + "\"";
    }

    static bool CmdClickPidLegacy(int x, int y, int pid, bool useJitter = true)
    {
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;

        Point clickPoint = ScreenToClientPoint(h, x, y, useJitter);
        int l = MAKE_LPARAM(clickPoint.X, clickPoint.Y);
        bool ok1 = SafeSend(h, WM_LBUTTONDOWN, IntPtr.Zero, new IntPtr(l));
        Thread.Sleep(GetJitterDelay());
        bool ok2 = SafeSend(h, WM_LBUTTONUP, IntPtr.Zero, new IntPtr(l));
        return ok1 && ok2;
    }

    static bool CmdClickPid(int x, int y, int pid, bool useJitter = true)
    {
        var root = GetRootForPid(pid);
        if (root != null)
        {
            IntPtr hWnd = WaitForWindowByPid((uint)pid, 15000);
            if (hWnd != IntPtr.Zero)
            {
                Point screenPoint = coordsAreClient ? ClientToScreenPoint(hWnd, x, y, useJitter) : (useJitter ? ApplyJitter(x, y) : new Point { X = x, Y = y });
                var hit = FindElementByScreenPoint(root, screenPoint.X, screenPoint.Y);
                if (hit != null)
                {
                    if (TryInvokeElement(hit)) return true;
                    try { hit.SetFocus(); return true; } catch { }
                }
            }
        }
        if (allowLegacyPointer) return CmdClickPidLegacy(x, y, pid, useJitter);
        return false;
    }

    static bool CmdRightClickPid(int x, int y, int pid, bool useJitter = true)
    {
        if (!allowLegacyPointer) return false;
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;

        Point clickPoint = ScreenToClientPoint(h, x, y, useJitter);
        int l = MAKE_LPARAM(clickPoint.X, clickPoint.Y);
        bool ok1 = SafeSend(h, WM_RBUTTONDOWN, IntPtr.Zero, new IntPtr(l));
        Thread.Sleep(GetJitterDelay());
        bool ok2 = SafeSend(h, WM_RBUTTONUP, IntPtr.Zero, new IntPtr(l));
        return ok1 && ok2;
    }

    static bool CmdMiddleClickPid(int x, int y, int pid, bool useJitter = true)
    {
        if (!allowLegacyPointer) return false;
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;

        Point clickPoint = ScreenToClientPoint(h, x, y, useJitter);
        int l = MAKE_LPARAM(clickPoint.X, clickPoint.Y);
        bool ok1 = SafeSend(h, WM_MBUTTONDOWN, IntPtr.Zero, new IntPtr(l));
        Thread.Sleep(GetJitterDelay());
        bool ok2 = SafeSend(h, WM_MBUTTONUP, IntPtr.Zero, new IntPtr(l));
        return ok1 && ok2;
    }

    static bool CmdDoubleClickPid(int x, int y, int pid, bool useJitter = true)
    {
        if (!allowLegacyPointer) return false;
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;

        Point clickPoint = ScreenToClientPoint(h, x, y, useJitter);
        int l = MAKE_LPARAM(clickPoint.X, clickPoint.Y);
        // First click
        SafeSend(h, WM_LBUTTONDOWN, IntPtr.Zero, new IntPtr(l));
        Thread.Sleep(GetJitterDelay());
        SafeSend(h, WM_LBUTTONUP, IntPtr.Zero, new IntPtr(l));
        Thread.Sleep(GetJitterDelay() * 2); // Brief pause between clicks
        // Second click
        SafeSend(h, WM_LBUTTONDOWN, IntPtr.Zero, new IntPtr(l));
        Thread.Sleep(GetJitterDelay());
        SafeSend(h, WM_LBUTTONUP, IntPtr.Zero, new IntPtr(l));
        return true;
    }

    static bool CmdDragPid(int x1, int y1, int x2, int y2, int pid, bool useJitter = true)
    {
        if (!allowLegacyPointer) return false;
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;

        Point startPoint = ScreenToClientPoint(h, x1, y1, useJitter);
        Point endPoint = ScreenToClientPoint(h, x2, y2, useJitter);
        
        // Mouse down at start point
        int l1 = MAKE_LPARAM(startPoint.X, startPoint.Y);
        SafeSend(h, WM_LBUTTONDOWN, IntPtr.Zero, new IntPtr(l1));
        Thread.Sleep(GetJitterDelay() * 2);
        
        // Mouse move along path with jitter
        int steps = Math.Max(Math.Abs(endPoint.X - startPoint.X), Math.Abs(endPoint.Y - startPoint.Y));
        for (int i = 1; i <= steps; i++)
        {
            int currentX = startPoint.X + (endPoint.X - startPoint.X) * i / steps;
            int currentY = startPoint.Y + (endPoint.Y - startPoint.Y) * i / steps;
            
            if (useJitter)
            {
                currentX += GetJitterOffset();
                currentY += GetJitterOffset();
            }
            
            int l = MAKE_LPARAM(currentX, currentY);
            SafeSend(h, WM_MOUSEMOVE, IntPtr.Zero, new IntPtr(l));
            Thread.Sleep(GetJitterDelay());
        }
        
        // Mouse up at end point
        int l2 = MAKE_LPARAM(endPoint.X, endPoint.Y);
        SafeSend(h, WM_LBUTTONUP, IntPtr.Zero, new IntPtr(l2));
        return true;
    }

    static bool CmdScrollPid(int delta, int x, int y, int pid, bool useJitter = true)
    {
        var root = GetRootForPid(pid);
        if (root != null)
        {
            IntPtr hWnd = WaitForWindowByPid((uint)pid, 15000);
            if (hWnd != IntPtr.Zero)
            {
                Point screenPoint = coordsAreClient ? ClientToScreenPoint(hWnd, x, y, useJitter) : (useJitter ? ApplyJitter(x, y) : new Point { X = x, Y = y });
                var hit = FindElementByScreenPoint(root, screenPoint.X, screenPoint.Y);
                var scEl = FindScrollableAncestor(hit);
                if (scEl != null)
                {
                    object p;
                    if (scEl.TryGetCurrentPattern(ScrollPattern.Pattern, out p))
                    {
                        var sp = (ScrollPattern)p;
                        try
                        {
                            if (delta > 0) sp.Scroll(ScrollAmount.NoAmount, ScrollAmount.SmallDecrement);
                            else if (delta < 0) sp.Scroll(ScrollAmount.NoAmount, ScrollAmount.SmallIncrement);
                            else return true;
                            return true;
                        }
                        catch { }
                    }
                }
            }
        }

        if (!allowLegacyPointer) return false;
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;
        Point scrollPointLegacy = useJitter ? ApplyJitter(x, y) : new Point { X = x, Y = y };
        int l = MAKE_LPARAM(scrollPointLegacy.X, scrollPointLegacy.Y);
        int wheelDelta = delta * 120;
        return SafeSend(h, WM_MOUSEWHEEL, new IntPtr(wheelDelta), new IntPtr(l));
    }

    static bool CmdTypePidLegacy(string text, int delayMs, int pid)
    {
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;
        foreach (var ch in text)
        {
            SafeSend(h, WM_CHAR, new IntPtr((int)ch), IntPtr.Zero);
            System.Threading.Thread.Sleep(delayMs > 0 ? delayMs : 50);
        }
        return true;
    }

    static bool CmdTypePid(string text, int delayMs, int pid)
    {
        var root = GetRootForPid(pid);
        if (root != null)
        {
            AutomationElement focus = null;
            try { focus = AutomationElement.FocusedElement; } catch { focus = null; }
            if (focus != null && BelongsToPid(focus, pid))
            {
                if (TrySetValueElement(focus, text, false)) return true;
            }

            try
            {
                var edit = root.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit));
                if (edit != null)
                {
                    if (TrySetValueElement(edit, text, false)) return true;
                }
            }
            catch { }
        }
        if (allowLegacyInput) return CmdTypePidLegacy(text, delayMs, pid);
        return false;
    }

    static int VkFromString(string s)
    {
        string k = s.ToLower();
        if (k.Length == 1)
        {
            char c = k[0];
            if (c >= 'a' && c <= 'z') return 0x41 + (c - 'a');
            if (c >= '0' && c <= '9') return 0x30 + (c - '0');
        }
        switch (k)
        {
            case "enter": case "return": return 0x0D;
            case "space": return 0x20;
            case "tab": return 0x09;
            case "escape": case "esc": return 0x1B;
            case "left": return 0x25;
            case "up": return 0x26;
            case "right": return 0x27;
            case "down": return 0x28;
            case "l": return 0x4C;
        }
        return 0;
    }

    static bool CmdHotkeyPidLegacy(string seq, int pid)
    {
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;
        var parts = seq.Split('+');
        var mods = new List<string>();
        string main = null;
        foreach (var p in parts)
        {
            var t = p.Trim().ToLower();
            if (t == "ctrl" || t == "control" || t == "alt" || t == "shift" || t == "win" || t == "cmd") mods.Add(t);
            else main = t;
        }
        int vk = VkFromString(main ?? "");
        if (vk == 0) return false;
        // Simple: post modifiers as keydown then main then keyup then release mods
        foreach (var m in mods)
        {
            int mvk = m.StartsWith("ctrl") ? 0x11 : m.StartsWith("alt") ? 0x12 : m.StartsWith("shift") ? 0x10 : 0x5B; // win
            SafeSend(h, WM_KEYDOWN, new IntPtr(mvk), IntPtr.Zero);
        }
        bool hasAlt = mods.Contains("alt");
        SafeSend(h, hasAlt ? WM_SYSKEYDOWN : WM_KEYDOWN, new IntPtr(vk), IntPtr.Zero);
        SafeSend(h, hasAlt ? WM_SYSKEYUP : WM_KEYUP, new IntPtr(vk), IntPtr.Zero);
        for (int i = mods.Count - 1; i >= 0; i--)
        {
            int mvk = mods[i].StartsWith("ctrl") ? 0x11 : mods[i].StartsWith("alt") ? 0x12 : mods[i].StartsWith("shift") ? 0x10 : 0x5B;
            SafeSend(h, WM_KEYUP, new IntPtr(mvk), IntPtr.Zero);
        }
        return true;
    }

    static bool CmdMousePathPid(string segments, int pid)
    {
        if (!allowLegacyPointer) return false;
        var h = WaitForWindowByPid((uint)pid, 15000);
        if (h == IntPtr.Zero) return false;
        var segs = segments.Split(';');
        foreach (var s in segs)
        {
            if (string.IsNullOrWhiteSpace(s)) continue;
            var parts = s.Split(',');
            int x = parts.Length > 0 ? int.Parse(parts[0]) : 0;
            int y = parts.Length > 1 ? int.Parse(parts[1]) : 0;
            int d = parts.Length > 2 ? int.Parse(parts[2]) : 8;
            Point p = ScreenToClientPoint(h, x, y, false);
            int l = MAKE_LPARAM(p.X, p.Y);
            SafeSend(h, WM_MOUSEMOVE, IntPtr.Zero, new IntPtr(l));
            System.Threading.Thread.Sleep(d);
        }
        return true;
    }

    static bool CmdFocusPid(int pid)
    {
        var root = GetRootForPid(pid);
        if (root == null) return false;
        try { root.SetFocus(); return true; } catch { return false; }
    }

    static bool CmdInvokePid(int pid, string query)
    {
        var root = GetRootForPid(pid);
        if (root == null) return false;
        var el = FindElementByQuery(root, query) ?? root;
        return TryInvokeElement(el);
    }

    static bool CmdSetValuePid(int pid, string query, string text)
    {
        var root = GetRootForPid(pid);
        if (root == null) return false;
        var el = FindElementByQuery(root, query) ?? root;
        return TrySetValueElement(el, text, false);
    }

    [STAThread]
    static int Main(string[] args)
    {
        if (args.Length < 1) return 1;
        string cmd = args[0].ToLower();
        try
        {
            if (cmd == "createdesktop")
            {
                return CmdCreateDesktop();
            }
            if (cmd == "winlist")
            {
                string filter = args.Length >= 2 ? args[1] : "";
                CmdWinlist(filter);
                return 0;
            }
            if (cmd == "winlistdesk")
            {
                string filter = args.Length >= 2 ? args[1] : "";
                CmdWinlistDesk(filter);
                return 0;
            }
            if (cmd == "launchondesk")
            {
                if (args.Length < 2) return 2;
                string exe = args[1];
                string[] restArgs = args.Length > 2 ? args.Skip(2).ToArray() : new string[0];
                return CmdLaunchOnDesk(exe, restArgs);
            }
            if (cmd == "waitforpid")
            {
                if (args.Length < 2) return 2;
                int pid = int.Parse(args[1]);
                int timeoutMs = args.Length >= 3 ? int.Parse(args[2]) : 15000;
                IntPtr h = WaitForWindowByPid((uint)pid, timeoutMs);
                Console.WriteLine(h == IntPtr.Zero ? "" : h.ToInt64().ToString());
                return h == IntPtr.Zero ? 10 : 0;
            }
            if (cmd == "focuspid")
            {
                if (args.Length < 2) return 2;
                int pid = int.Parse(args[1]);
                return CmdFocusPid(pid) ? 0 : 10;
            }
            if (cmd == "invokepid")
            {
                if (args.Length < 2) return 2;
                int pid = int.Parse(args[1]);
                string q = args.Length >= 3 ? args[2] : "";
                return CmdInvokePid(pid, q) ? 0 : 10;
            }
            if (cmd == "setvaluepid")
            {
                if (args.Length < 4) return 2;
                int pid = int.Parse(args[1]);
                string q = args[2];
                string text = args[3];
                return CmdSetValuePid(pid, q, text) ? 0 : 10;
            }
            if (cmd == "clickpid")
            {
                if (args.Length < 4) return 2;
                int x = int.Parse(args[1]);
                int y = int.Parse(args[2]);
                int pid = int.Parse(args[3]);
                return CmdClickPid(x, y, pid) ? 0 : 10;
            }
            if (cmd == "typepid")
            {
                if (args.Length < 4) return 2;
                string text = args[1];
                int delay = int.Parse(args[2]);
                int pid = int.Parse(args[3]);
                return CmdTypePid(text, delay, pid) ? 0 : 11;
            }
            if (cmd == "hotkeypid")
            {
                if (args.Length < 3) return 2;
                string seq = args[1];
                int pid = int.Parse(args[2]);
                return CmdHotkeyPid(seq, pid) ? 0 : 12;
            }
            if (cmd == "mousepathpid")
            {
                if (args.Length < 3) return 2;
                string segments = args[1];
                int pid = int.Parse(args[2]);
                return CmdMousePathPid(segments, pid) ? 0 : 13;
            }
            if (cmd == "dragpid")
            {
                if (args.Length < 6) return 2;
                int x1 = int.Parse(args[1]);
                int y1 = int.Parse(args[2]);
                int x2 = int.Parse(args[3]);
                int y2 = int.Parse(args[4]);
                int pid = int.Parse(args[5]);
                return CmdDragPid(x1, y1, x2, y2, pid) ? 0 : 14;
            }
            if (cmd == "scrollpid")
            {
                if (args.Length < 5) return 2;
                int delta = int.Parse(args[1]);
                int x = int.Parse(args[2]);
                int y = int.Parse(args[3]);
                int pid = int.Parse(args[4]);
                return CmdScrollPid(delta, x, y, pid) ? 0 : 15;
            }
            if (cmd == "cleanupdesktop")
            {
                return CleanupHiddenDesktop() ? 0 : 1;
            }
            return 99;
        }
        catch { return 98; }
    }
}

import ctypes
import time
import logging
import platform
import threading
import subprocess
from ctypes import wintypes
import numpy as np
from jason_service.ghost_hand.jitter import JitterModule

# Ctypes definitions for Windows API calls
user32 = ctypes.WinDLL('user32', use_last_error=True)
kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)

# Constants
DESKTOP_CREATEWINDOW = 0x0002
DESKTOP_SWITCHDESKTOP = 0x0100
GENERIC_ALL = 0x10000000
INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_ABSOLUTE = 0x8000
MOUSEEVENTF_WHEEL = 0x0800
KEYEVENTF_KEYDOWN = 0x0000
KEYEVENTF_KEYUP = 0x0002

class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

class INPUT(ctypes.Structure):
    class _INPUT(ctypes.Union):
        _fields_ = [
            ("ki", wintypes.KEYBDINPUT),
            ("mi", wintypes.MOUSEINPUT),
        ]
    _anonymous_ = ("_input",)
    _fields_ = [
        ("type", wintypes.DWORD),
        ("_input", _INPUT),
   ]

class STARTUPINFO(ctypes.Structure):
    _fields_ = [
        ('cb', wintypes.DWORD),
        ('lpReserved', wintypes.LPWSTR),
        ('lpDesktop', wintypes.LPWSTR),
        ('lpTitle', wintypes.LPWSTR),
        ('dwX', wintypes.DWORD),
        ('dwY', wintypes.DWORD),
        ('dwXSize', wintypes.DWORD),
        ('dwYSize', wintypes.DWORD),
        ('dwXCountChars', wintypes.DWORD),
        ('dwYCountChars', wintypes.DWORD),
        ('dwFillAttribute', wintypes.DWORD),
        ('dwFlags', wintypes.DWORD),
        ('wShowWindow', wintypes.WORD),
        ('cbReserved2', wintypes.WORD),
        ('lpReserved2', ctypes.POINTER(wintypes.BYTE)),
        ('hStdInput', wintypes.HANDLE),
        ('hStdOutput', wintypes.HANDLE),
        ('hStdError', wintypes.HANDLE),
    ]

class PROCESS_INFORMATION(ctypes.Structure):
    _fields_ = [
        ('hProcess', wintypes.HANDLE),
        ('hThread', wintypes.HANDLE),
        ('dwProcessId', wintypes.DWORD),
        ('dwThreadId', wintypes.DWORD),
    ]

class WindowsGhostHand:
    """Production-ready non-interruptive control on Windows with hidden desktop and human-like jitter."""
    
    def __init__(self, desktop_name="Jason_Workspace"):
        self.desktop_name = desktop_name
        self.h_desktop = None
        self.original_desktop = None
        self.jitter = JitterModule()
        self.isolated_apps = {}
        
        logging.info("Windows Ghost Hand initialized")

    def create_hidden_desktop(self):
        """Creates a new, hidden desktop."""
        try:
            self.original_desktop = user32.GetThreadDesktop(kernel32.GetCurrentThreadId())
            if not self.original_desktop:
                raise ctypes.WinError(ctypes.get_last_error())

            self.h_desktop = user32.CreateDesktopW(self.desktop_name, None, None, 0, GENERIC_ALL, None)
            if not self.h_desktop:
                raise ctypes.WinError(ctypes.get_last_error())
            
            logging.info(f"Hidden desktop '{self.desktop_name}' created successfully.")
            return True
        except Exception as e:
            logging.error(f"Failed to create hidden desktop: {e}")
            return False

    def switch_to_hidden_desktop(self):
        """Switches the current thread's context to the hidden desktop."""
        try:
            if not self.h_desktop:
                raise Exception("Hidden desktop not created.")
            
            if not user32.SetThreadDesktop(self.h_desktop):
                raise ctypes.WinError(ctypes.get_last_error())
            
            logging.info(f"Switched to hidden desktop '{self.desktop_name}'.")
            return True
        except Exception as e:
            logging.error(f"Failed to switch to hidden desktop: {e}")
            return False

    def isolate_application(self, app_path):
        """Isolate an application to the hidden desktop."""
        try:
            # Switch to hidden desktop first
            if not self.switch_to_hidden_desktop():
                return False
            
            # Launch application on hidden desktop
            pid = self.launch_application(app_path)
            
            if pid:
                self.isolated_apps[app_path] = {
                    'pid': pid,
                    'desktop': self.h_desktop
                }
                logging.info(f"Isolated {app_path} (PID: {pid}) to hidden desktop")
                return True
            else:
                logging.error(f"Failed to launch {app_path}")
                return False
                
        except Exception as e:
            logging.error(f"Error isolating application {app_path}: {e}")
            return False

    def launch_application(self, app_path):
        """Launches an application on the hidden desktop."""
        try:
            si = STARTUPINFO()
            si.cb = ctypes.sizeof(si)
            si.lpDesktop = self.desktop_name
            pi = PROCESS_INFORMATION()

            if not kernel32.CreateProcessW(app_path, None, None, None, False, 0, None, None, ctypes.byref(si), ctypes.byref(pi)):
                raise ctypes.WinError(ctypes.get_last_error())

            logging.info(f"Launched '{app_path}' on hidden desktop. Process ID: {pi.dwProcessId}")
            return pi.dwProcessId
        except Exception as e:
            logging.error(f"Failed to launch application {app_path}: {e}")
            return None

    def get_window_handle(self, window_title: str = None, pid: int = None) -> int:
        """Get window handle by title or process ID."""
        try:
            if window_title:
                return user32.FindWindowW(None, window_title)
            elif pid:
                # Enumerate windows to find one belonging to the PID
                def callback(hwnd, lParam):
                    _, found_pid = user32.GetWindowThreadProcessId(hwnd)
                    if found_pid == pid:
                        windows.append(hwnd)
                    return True
                
                windows = []
                user32.EnumWindows(ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)(callback), 0)
                return windows[0] if windows else None
            return None
        except Exception as e:
            logging.error(f"Error finding window handle: {e}")
            return None

    def move_mouse_to(self, start_pos, end_pos, window_handle=None):
        """Moves the mouse with enhanced Bezier curve simulation."""
        try:
            # Generate dynamic control points for natural movement
            control_points = self._generate_bezier_control_points(start_pos, end_pos)
            curve = self.jitter.bezier_mouse_movement(start_pos, end_pos, control_points, steps=150)
            
            # Move mouse along curve with micro-jitter
            for i, point in enumerate(curve):
                # Add micro-jitter to each point
                jitter_x = np.random.normal(0, 0.5)
                jitter_y = np.random.normal(0, 0.5)
                jittered_point = (point[0] + jitter_x, point[1] + jitter_y)
                
                # Send mouse move event
                self._send_mouse_input(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, 
                                     jittered_point[0], jittered_point[1])
                
                # Variable speed for natural movement
                delay = 0.008 + np.random.exponential(0.002)
                time.sleep(min(delay, 0.02))  # Cap max delay
            
            logging.info(f"Mouse moved from {start_pos} to {end_pos} with natural movement")
            
        except Exception as e:
            logging.error(f"Error in mouse movement: {e}")

    def _generate_bezier_control_points(self, start, end):
        """Generate dynamic Bezier control points for natural mouse movement."""
        # Calculate midpoint with offset for curve
        mid_x = (start[0] + end[0]) / 2
        mid_y = (start[1] + end[1]) / 2
        
        # Add random offset for natural curve
        offset_x = np.random.normal(0, 50)
        offset_y = np.random.normal(0, 50)
        
        control1 = (mid_x + offset_x, mid_y + offset_y)
        control2 = (mid_x - offset_x/2, mid_y - offset_y/2)
        
        return [control1, control2]

    def send_mouse_click(self, x, y, window_handle=None, click_type='left'):
        """Sends a mouse click event with enhanced jitter and timing."""
        try:
            # Add pre-click jitter
            pre_click_delay = self.jitter.keyboard_latency() * 2
            time.sleep(pre_click_delay)
            
            # Determine event flags
            if click_type == 'left':
                down_flag = MOUSEEVENTF_LEFTDOWN
                up_flag = MOUSEEVENTF_LEFTUP
            elif click_type == 'right':
                down_flag = MOUSEEVENTF_RIGHTDOWN
                up_flag = MOUSEEVENTF_RIGHTUP
            else:
                down_flag = MOUSEEVENTF_LEFTDOWN
                up_flag = MOUSEEVENTF_LEFTUP
            
            # Send click with human-like timing
            self._send_mouse_input(down_flag | MOUSEEVENTF_ABSOLUTE, x, y)
            
            # Variable hold time for natural click
            hold_time = np.random.normal(0.1, 0.02)
            time.sleep(max(0.05, hold_time))
            
            self._send_mouse_input(up_flag | MOUSEEVENTF_ABSOLUTE, x, y)
            
            logging.info(f"Sent {click_type} click at ({x}, {y})")
            
        except Exception as e:
            logging.error(f"Error sending mouse click: {e}")

    def _send_mouse_input(self, flags, x, y, mouse_data=0):
        """Send mouse input using SendInput API."""
        try:
            # Normalize coordinates (0-65535 range)
            screen_width = user32.GetSystemMetrics(0)  # SM_CXSCREEN
            screen_height = user32.GetSystemMetrics(1)  # SM_CYSCREEN
            
            normalized_x = int(x * 65535 / screen_width)
            normalized_y = int(y * 65535 / screen_height)
            
            # Create input structure
            mouse_input = wintypes.MOUSEINPUT()
            mouse_input.dx = normalized_x
            mouse_input.dy = normalized_y
            mouse_input.mouseData = mouse_data
            mouse_input.dwFlags = flags
            mouse_input.time = 0
            mouse_input.dwExtraInfo = 0
            
            # Create input event
            input_event = INPUT()
            input_event.type = INPUT_MOUSE
            input_event.mi = mouse_input
            
            # Send input
            user32.SendInput(1, ctypes.byref(input_event), ctypes.sizeof(INPUT))
        except Exception as e:
            logging.error(f"Error sending mouse input: {e}")

    def send_keystroke(self, vk_code, window_handle=None, modifiers=None):
        """Sends a keystroke event with enhanced jitter and modifier support."""
        try:
            # Apply modifier keys if specified
            if modifiers:
                if 'ctrl' in modifiers:
                    self._send_key_input(wintypes.VK_CONTROL, KEYEVENTF_KEYDOWN)
                if 'shift' in modifiers:
                    self._send_key_input(wintypes.VK_SHIFT, KEYEVENTF_KEYDOWN)
                if 'alt' in modifiers:
                    self._send_key_input(wintypes.VK_MENU, KEYEVENTF_KEYDOWN)
                time.sleep(0.05)  # Brief pause between modifier and key
            
            # Send key down
            self._send_key_input(vk_code, KEYEVENTF_KEYDOWN)
            
            # Apply keystroke jitter
            self.jitter.apply_keystroke_jitter()
            
            # Send key up
            self._send_key_input(vk_code, KEYEVENTF_KEYUP)
            
            # Release modifiers
            if modifiers:
                time.sleep(0.05)
                if 'ctrl' in modifiers:
                    self._send_key_input(wintypes.VK_CONTROL, KEYEVENTF_KEYUP)
                if 'shift' in modifiers:
                    self._send_key_input(wintypes.VK_SHIFT, KEYEVENTF_KEYUP)
                if 'alt' in modifiers:
                    self._send_key_input(wintypes.VK_MENU, KEYEVENTF_KEYUP)
            
            logging.info(f"Sent keystroke VK code {vk_code} with modifiers {modifiers}")
            
        except Exception as e:
            logging.error(f"Error sending keystroke: {e}")

    def _send_key_input(self, vk_code, flags):
        """Send keyboard input using SendInput API."""
        try:
            key_input = wintypes.KEYBDINPUT()
            key_input.wVk = vk_code
            key_input.wScan = user32.MapVirtualKeyA(vk_code, 0)
            key_input.dwFlags = flags
            key_input.time = 0
            key_input.dwExtraInfo = 0
            
            input_event = INPUT()
            input_event.type = INPUT_KEYBOARD
            input_event.ki = key_input
            
            user32.SendInput(1, ctypes.byref(input_event), ctypes.sizeof(INPUT))
        except Exception as e:
            logging.error(f"Error sending key input: {e}")

    def send_text(self, text, window_handle=None):
        """Send text input with human-like typing speed."""
        try:
            for char in text:
                # Get virtual key code for character
                vk_code = self._get_vk_code_for_char(char)
                if vk_code:
                    self.send_keystroke(vk_code, window_handle)
                    
                    # Variable typing speed
                    if char in ' ,.!?':
                        time.sleep(np.random.normal(0.15, 0.03))  # Longer pause for punctuation
                    else:
                        time.sleep(np.random.normal(0.08, 0.02))  # Normal typing
            
            logging.info(f"Sent text '{text[:50]}...'")
            
        except Exception as e:
            logging.error(f"Error sending text: {e}")

    def _get_vk_code_for_char(self, char):
        """Get virtual key code for character."""
        # Map common characters to virtual key codes
        char_map = {
            'a': 0x41, 'b': 0x42, 'c': 0x43, 'd': 0x44, 'e': 0x45, 'f': 0x46,
            'g': 0x47, 'h': 0x48, 'i': 0x49, 'j': 0x4A, 'k': 0x4B, 'l': 0x4C,
            'm': 0x4D, 'n': 0x4E, 'o': 0x4F, 'p': 0x50, 'q': 0x51, 'r': 0x52,
            's': 0x53, 't': 0x54, 'u': 0x55, 'v': 0x56, 'w': 0x57, 'x': 0x58,
            'y': 0x59, 'z': 0x5A,
            '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34, '5': 0x35,
            '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39, '0': 0x30,
            ' ': 0x20, ',': 0xBC, '.': 0xBE, ';': 0xBA, "'": 0xDE,
            '-': 0xBD, '=': 0xBB, '[': 0xDB, ']': 0xDD, '\\':_asm:  MARKDOWN_MESSAGE
            '/': 0xBF, '`': 0xC0
        }
        
        return char_map.get(char.lower())

    def drag_and_drop(self, start_pos, end_pos, window_handle=None):
        """Perform drag and drop operation with natural movement."""
        try:
            # Move to start position
            self.move_mouse_to(start_pos, start_pos, window_handle)
            
            # Press mouse button
            self._send_mouse_input(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE, 
                                 start_pos[0], start_pos[1])
            time.sleep(0.1)  # Brief pause
            
            # Drag to end position
            self.move_mouse_to(start_pos, end_pos, window_handle)
            
            # Release mouse button
            self._send_mouse_input(MOUSEEVENTF_LEFTUP | MOUSEEVENTF_ABSOLUTE, 
                                 end_pos[0], end_pos[1])
            
            logging.info(f"Drag and drop from {start_pos} to {end_pos}")
            
        except Exception as e:
            logging.error(f"Error in drag and drop: {e}")

    def scroll_wheel(self, x, y, delta_x, delta_y, window_handle=None):
        """Perform scroll wheel operation."""
        try:
            # Move to position
            self._send_mouse_input(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, x, y)
            time.sleep(0.01)
            
            # Send scroll events
            mouse_data = delta_y * 120  # Windows uses 120 units per scroll click
            self._send_mouse_input(MOUSEEVENTF_WHEEL | MOUSEEVENTF_ABSOLUTE, x, y, mouse_data)
            
            logging.info(f"Scrolled at ({x}, {y}) by ({delta_x}, {delta_y})")
            
        except Exception as e:
            logging.error(f"Error in scroll wheel: {e}")

    def close_desktop(self):
        """Switches back to the original desktop and closes the hidden one."""
        try:
            if self.original_desktop:
                user32.SetThreadDesktop(self.original_desktop)
            if self.h_desktop:
                user32.CloseDesktop(self.h_desktop)
                logging.info(f"Hidden desktop '{self.desktop_name}' closed.")
            
            # Clear isolated apps
            self.isolated_apps.clear()
            
        except Exception as e:
            logging.error(f"Error closing desktop: {e}")

    def get_system_info(self) -> dict:
        """Get system information for debugging."""
        return {
            'platform': platform.system(),
            'platform_version': platform.version(),
            'hidden_desktop': bool(self.h_desktop),
            'isolated_apps': list(self.isolated_apps.keys()),
            'screen_width': user32.GetSystemMetrics(0),
            'screen_height': user32.GetSystemMetrics(1),
            'python_version': platform.python_version()
        }

# Note: This code is intended for a Windows environment and will not run on macOS or Linux.
# It provides the structural implementation for the Windows-specific Ghost Hand.

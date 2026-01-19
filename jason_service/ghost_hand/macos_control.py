import Quartz
import time
import logging
import platform
import subprocess
from AppKit import NSRunningApplication, NSWorkspace
from Foundation import NSMutableDictionary, NSNumber
from jason_service.ghost_hand.jitter import JitterModule

class MacOSGhostHand:
    """Production-ready non-interruptive control on macOS with human-like jitter and virtual workspace."""
    
    def __init__(self):
        self.jitter = JitterModule()
        self.current_workspace = None
        self.hidden_workspace = None
        self.isolated_apps = {}
        
        logging.info("macOS Ghost Hand initialized")
    
    def create_hidden_workspace(self) -> int:
        """Create a hidden virtual workspace for non-interruptive execution."""
        try:
            # Get current workspace
            workspace = NSWorkspace.sharedWorkspace()
            
            # Create a new space using Mission Control
            script = '''
            tell application "System Events"
                key code 118 using control down -- Control+F1 to create new space
            end tell
            '''
            
            process = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            
            if process.returncode == 0:
                self.hidden_workspace = self._get_current_space_id()
                logging.info(f"Created hidden workspace: {self.hidden_workspace}")
                return self.hidden_workspace
            else:
                logging.error("Failed to create hidden workspace")
                return -1
                
        except Exception as e:
            logging.error(f"Error creating hidden workspace: {e}")
            return -1
    
    def _get_current_space_id(self) -> int:
        """Get the current space ID."""
        try:
            script = '''
            tell application "System Events"
                tell process "SystemUIServer"
                    set currentSpace to value of UI element 1 of menu bar item "Spaces" of menu bar 1
                end tell
            end tell
            return currentSpace
            '''
            
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if result.returncode == 0:
                return int(result.stdout.strip())
            return -1
        except:
            return -1
    
    def move_to_hidden_workspace(self) -> bool:
        """Move execution to hidden workspace."""
        if self.hidden_workspace is None:
            self.create_hidden_workspace()
        
        try:
            script = f'''
            tell application "System Events"
                key code {118 + self.hidden_workspace - 1} using control down
            end tell
            '''
            
            process = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            return process.returncode == 0
        except Exception as e:
            logging.error(f"Failed to move to hidden workspace: {e}")
            return False
    
    def isolate_application(self, app_name: str) -> bool:
        """Isolate an application to the hidden workspace."""
        try:
            # Move to hidden workspace first
            if not self.move_to_hidden_workspace():
                return False
            
            # Launch the application
            workspace = NSWorkspace.sharedWorkspace()
            success = workspace.launchApplication_(app_name)
            
            if success:
                self.isolated_apps[app_name] = self.hidden_workspace
                logging.info(f"Isolated {app_name} to workspace {self.hidden_workspace}")
                return True
            else:
                logging.error(f"Failed to launch {app_name}")
                return False
                
        except Exception as e:
            logging.error(f"Error isolating application {app_name}: {e}")
            return False
    
    def get_window_id_by_pid(self, pid):
        """Gets the window ID for a given process ID with enhanced error handling."""
        try:
            window_list = Quartz.CGWindowListCopyWindowInfo(
                Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements, 
                Quartz.kCGNullWindowID
            )
            
            for window in window_list:
                if window.get('kCGWindowOwnerPID') == pid:
                    window_id = window.get('kCGWindowNumber')
                    logging.info(f"Found window {window_id} for PID {pid}")
                    return window_id
            
            logging.warning(f"No window found for PID {pid}")
            return None
            
        except Exception as e:
            logging.error(f"Error getting window ID for PID {pid}: {e}")
            return None
    
    def move_mouse_to(self, start_pos, end_pos, window_id):
        """Moves the mouse with enhanced Bezier curve simulation and jitter."""
        try:
            # Generate dynamic control points for natural movement
            control_points = self._generate_bezier_control_points(start_pos, end_pos)
            curve = self.jitter.bezier_mouse_movement(start_pos, end_pos, control_points, steps=150)
            
            psn = self._get_psn_for_window(window_id)
            
            # Move mouse along curve with micro-jitter
            for i, point in enumerate(curve):
                # Add micro-jitter to each point
                jitter_x = np.random.normal(0, 0.5)
                jitter_y = np.random.normal(0, 0.5)
                jittered_point = (point[0] + jitter_x, point[1] + jitter_y)
                
                self.send_mouse_event(Quartz.kCGEventMouseMoved, jittered_point[0], jittered_point[1], psn, post_event=False)
                
                # Variable speed for natural movement
                delay = 0.008 + np.random.exponential(0.002)
                time.sleep(min(delay, 0.02))  # Cap max delay
            
            logging.info(f"Mouse moved from {start_pos} to {end_pos} with natural movement")
            
        except Exception as e:
            logging.error(f"Error in mouse movement: {e}")
    
    def _generate_bezier_control_points(self, start, end):
        """Generate dynamic Bezier control points for natural mouse movement."""
        import numpy as np
        
        # Calculate midpoint with offset for curve
        mid_x = (start[0] + end[0]) / 2
        mid_y = (start[1] + end[1]) / 2
        
        # Add random offset for natural curve
        offset_x = np.random.normal(0, 50)
        offset_y = np.random.normal(0, 50)
        
        control1 = (mid_x + offset_x, mid_y + offset_y)
        control2 = (mid_x - offset_x/2, mid_y - offset_y/2)
        
        return [control1, control2]
    
    def send_mouse_click(self, x, y, window_id, click_type='left'):
        """Sends a mouse click event with enhanced jitter and timing."""
        try:
            psn = self._get_psn_for_window(window_id)
            
            # Add pre-click jitter
            pre_click_delay = self.jitter.keyboard_latency() * 2
            time.sleep(pre_click_delay)
            
            # Determine event type
            if click_type == 'left':
                down_event = Quartz.kCGEventLeftMouseDown
                up_event = Quartz.kCGEventLeftMouseUp
            elif click_type == 'right':
                down_event = Quartz.kCGEventRightMouseDown
                up_event = Quartz.kCGEventRightMouseUp
            else:
                down_event = Quartz.kCGEventOtherMouseDown
                up_event = Quartz.kCGEventOtherMouseUp
            
            # Send click with human-like timing
            self.send_mouse_event(down_event, x, y, psn)
            
            # Variable hold time for natural click
            hold_time = np.random.normal(0.1, 0.02)
            time.sleep(max(0.05, hold_time))
            
            self.send_mouse_event(up_event, x, y, psn)
            
            logging.info(f"Sent {click_type} click to window {window_id} at ({x}, {y})")
            
        except Exception as e:
            logging.error(f"Error sending mouse click: {e}")
    
    def send_mouse_event(self, event_type, x, y, psn, post_event=True):
        """Helper to create and optionally post a mouse event."""
        try:
            event = Quartz.CGEventCreateMouseEvent(None, event_type, (x, y), Quartz.kCGMouseButtonLeft)
            if post_event:
                Quartz.CGEventPostToPSN(psn, event)
            return event
        except Exception as e:
            logging.error(f"Error creating mouse event: {e}")
            return None
    
    def send_keystroke(self, keycode, window_id, modifiers=None):
        """Sends a keystroke event with enhanced jitter and modifier support."""
        try:
            psn = self._get_psn_for_window(window_id)
            
            # Apply modifier keys if specified
            modifier_flags = 0
            if modifiers:
                if 'cmd' in modifiers:
                    modifier_flags |= Quartz.kCGEventFlagMaskCommand
                if 'shift' in modifiers:
                    modifier_flags |= Quartz.kCGEventFlagMaskShift
                if 'alt' in modifiers:
                    modifier_flags |= Quartz.kCGEventFlagMaskAlternate
                if 'ctrl' in modifiers:
                    modifier_flags |= Quartz.kCGEventFlagMaskControl
            
            # Create key events with modifiers
            event_down = Quartz.CGEventCreateKeyboardEvent(None, keycode, True)
            event_up = Quartz.CGEventCreateKeyboardEvent(None, keycode, False)
            
            if modifier_flags:
                Quartz.CGEventSetFlags(event_down, modifier_flags)
                Quartz.CGEventSetFlags(event_up, modifier_flags)
            
            # Send with human-like timing
            Quartz.CGEventPostToPSN(psn, event_down)
            
            # Apply keystroke jitter
            self.jitter.apply_keystroke_jitter()
            
            Quartz.CGEventPostToPSN(psn, event_up)
            
            logging.info(f"Sent keycode {keycode} with modifiers {modifiers} to window {window_id}")
            
        except Exception as e:
            logging.error(f"Error sending keystroke: {e}")
    
    def send_text(self, text, window_id):
        """Send text input with human-like typing speed."""
        try:
            psn = self._get_psn_for_window(window_id)
            
            for char in text:
                # Get keycode for character
                keycode = self._get_keycode_for_char(char)
                if keycode:
                    self.send_keystroke(keycode, window_id)
                    
                    # Variable typing speed
                    if char in ' ,.!?':
                        time.sleep(np.random.normal(0.15, 0.03))  # Longer pause for punctuation
                    else:
                        time.sleep(np.random.normal(0.08, 0.02))  # Normal typing
            
            logging.info(f"Sent text '{text[:50]}...' to window {window_id}")
            
        except Exception as e:
            logging.error(f"Error sending text: {e}")
    
    def _get_keycode_for_char(self, char):
        """Get macOS keycode for character."""
        # Simplified keycode mapping
        keymap = {
            'a': 0, 's': 1, 'd': 2, 'f': 3, 'h': 4, 'g': 5, 'z': 6, 'x': 7,
            'c': 8, 'v': 9, 'b': 11, 'q': 12, 'w': 13, 'e': 14, 'r': 15,
            'y': 16, 't': 17, '1': 18, '2': 19, '3': 20, '4': 21, '6': 22,
            '5': 23, '': 24, '9': 25, '7': 26, '8': 27, '0': 29, 'o': 31,
            'u': 32, 'i': 34, 'p': 35, 'l': 37, 'j': 38, '': 39, 'k': 40,
            ';': 41, '\\': 42, ',': 43, '/': 44, 'n': 45, 'm': 46, '.': 47,
            ' ': 49, '`': 50, '-': 51, '=': 52, '[': 33, ']': 30, "'": 39,
            '\\': 42, ';': 41, '/': 44, ',': 43, '.': 47
        }
        
        return keymap.get(char.lower())
    
    def _get_psn_for_window(self, window_id):
        """Helper to get the Process Serial Number for a window ID."""
        try:
            window_list = Quartz.CGWindowListCopyWindowInfo(Quartz.kCGWindowListOptionAll, window_id)
            if not window_list:
                raise ValueError(f"No window found with ID: {window_id}")
            
            pid = window_list[0]['kCGWindowOwnerPID']
            app = NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
            
            if app:
                return app.processSerialNumber()
            else:
                raise ValueError(f"Could not find application for PID: {pid}")
                
        except Exception as e:
            logging.error(f"Error getting PSN for window {window_id}: {e}")
            raise
    
    def drag_and_drop(self, start_pos, end_pos, window_id):
        """Perform drag and drop operation with natural movement."""
        try:
            psn = self._get_psn_for_window(window_id)
            
            # Move to start position
            self.move_mouse_to(start_pos, start_pos, window_id)
            
            # Press mouse button
            self.send_mouse_event(Quartz.kCGEventLeftMouseDown, start_pos[0], start_pos[1], psn)
            time.sleep(0.1)  # Brief pause
            
            # Drag to end position
            self.move_mouse_to(start_pos, end_pos, window_id)
            
            # Release mouse button
            self.send_mouse_event(Quartz.kCGEventLeftMouseUp, end_pos[0], end_pos[1], psn)
            
            logging.info(f"Drag and drop from {start_pos} to {end_pos}")
            
        except Exception as e:
            logging.error(f"Error in drag and drop: {e}")
    
    def scroll_wheel(self, x, y, delta_x, delta_y, window_id):
        """Perform scroll wheel operation."""
        try:
            psn = self._get_psn_for_window(window_id)
            
            # Create scroll event
            scroll_event = Quartz.CGEventCreateScrollWheelEvent(
                None,  # No source
                Quartz.kCGScrollEventUnitLine,  # Line units
                2,  # Axis count
                delta_y,  # Vertical scroll
                delta_x   # Horizontal scroll
            )
            
            # Set position and post
            Quartz.CGEventSetLocation(scroll_event, (x, y))
            Quartz.CGEventPostToPSN(psn, scroll_event)
            
            logging.info(f"Scrolled at ({x}, {y}) by ({delta_x}, {delta_y})")
            
        except Exception as e:
            logging.error(f"Error in scroll wheel: {e}")
    
    def cleanup_hidden_workspace(self):
        """Clean up hidden workspace and return to main workspace."""
        try:
            # Return to main workspace (space 1)
            script = '''
            tell application "System Events"
                key code 118 using control down
            end tell
            '''
            
            subprocess.run(['osascript', '-e', script], capture_output=True)
            
            # Clear isolated apps
            self.isolated_apps.clear()
            self.hidden_workspace = None
            
            logging.info("Cleaned up hidden workspace")
            
        except Exception as e:
            logging.error(f"Error cleaning up hidden workspace: {e}")
    
    def get_system_info(self) -> dict:
        """Get system information for debugging."""
        return {
            'platform': platform.system(),
            'platform_version': platform.mac_ver()[0],
            'hidden_workspace': self.hidden_workspace,
            'isolated_apps': list(self.isolated_apps.keys()),
            'python_version': platform.python_version()
        }

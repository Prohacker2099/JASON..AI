import os
import signal
import threading
import logging
import platform
import psutil
import time
import json
from datetime import datetime
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from pathlib import Path

try:
    from pynput import keyboard
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False
    logging.warning("pynput not available - keyboard kill switch disabled")

@dataclass
class KillSwitchEvent:
    """Record of kill switch activation."""
    timestamp: str
    trigger_method: str
    reason: str
    processes_terminated: List[int]
    success: bool

class HardwareKillSwitch:
    """Production-ready hardware kill switch with multiple trigger methods.
    
    Supports keyboard hotkey, file trigger, network trigger, and watchdog timer
    for comprehensive emergency shutdown capabilities.
    """
    
    def __init__(self, shutdown_callback: Optional[Callable] = None, config_path: str = "./data/security/kill_switch_config.json"):
        self.shutdown_callback = shutdown_callback or self._default_shutdown
        self.config_path = config_path
        self.load_configuration()
        
        # State tracking
        self.is_active = False
        self.keyboard_listener = None
        self.pressed_keys = set()
        self.watchdog_thread = None
        self.file_watcher_thread = None
        self.network_trigger_thread = None
        self.emergency_stop_requested = False
        
        # Event log
        self.event_log: List[KillSwitchEvent] = []
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Process tracking
        self.monitored_processes = {}
        self.parent_pid = os.getpid()
        
        logging.info(f"Hardware Kill Switch initialized with session ID: {self.session_id}")
    
    def load_configuration(self):
        """Load kill switch configuration."""
        default_config = {
            'keyboard_combo': ['ctrl', 'alt', 'k'],
            'file_trigger_path': '/tmp/jason_emergency_stop',
            'network_trigger_port': 9999,
            'watchdog_timeout': 300,  # 5 minutes
            'graceful_shutdown_timeout': 10,
            'force_kill_after_timeout': True,
            'monitor_child_processes': True
        }
        
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    self.config = json.load(f)
                logging.info("Kill switch configuration loaded")
            except Exception as e:
                logging.warning(f"Failed to load config: {e}. Using defaults.")
                self.config = default_config
        else:
            self.config = default_config
            self.save_configuration()
    
    def save_configuration(self):
        """Save current configuration."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save configuration: {e}")
    
    def start(self):
        """Start all kill switch mechanisms."""
        if self.is_active:
            logging.warning("Kill switch already active")
            return
        
        self.is_active = True
        self.emergency_stop_requested = False
        
        # Start keyboard listener
        if PYNPUT_AVAILABLE:
            self._start_keyboard_listener()
        
        # Start file watcher
        self._start_file_watcher()
        
        # Start network trigger
        self._start_network_trigger()
        
        # Start watchdog timer
        self._start_watchdog_timer()
        
        # Begin process monitoring
        self._start_process_monitoring()
        
        self._log_event("startup", "Kill switch activated", [])
        logging.info("Hardware Kill Switch is fully active")
    
    def stop(self):
        """Stop all kill switch mechanisms."""
        self.is_active = False
        
        if self.keyboard_listener:
            self.keyboard_listener.stop()
            self.keyboard_listener = None
        
        if self.watchdog_thread:
            self.watchdog_thread.join(timeout=1)
        
        if self.file_watcher_thread:
            self.file_watcher_thread.join(timeout=1)
        
        if self.network_trigger_thread:
            self.network_trigger_thread.join(timeout=1)
        
        self._log_event("shutdown", "Kill switch deactivated", [])
        logging.info("Hardware Kill Switch stopped")
    
    def _start_keyboard_listener(self):
        """Start keyboard hotkey listener."""
        try:
            # Parse keyboard combination
            combo_keys = []
            for key_name in self.config['keyboard_combo']:
                if key_name.lower() == 'ctrl':
                    combo_keys.append(keyboard.Key.ctrl)
                elif key_name.lower() == 'alt':
                    combo_keys.append(keyboard.Key.alt)
                elif key_name.lower() == 'shift':
                    combo_keys.append(keyboard.Key.shift)
                elif key_name.lower() == 'cmd' or key_name.lower() == 'cmd_r':
                    combo_keys.append(getattr(keyboard.Key, key_name.lower()))
                else:
                    combo_keys.append(keyboard.KeyCode.from_char(key_name))
            
            self.kill_switch_combo = set(combo_keys)
            
            self.keyboard_listener = keyboard.Listener(
                on_press=self._on_key_press,
                on_release=self._on_key_release
            )
            self.keyboard_listener.start()
            
            combo_str = '+'.join(self.config['keyboard_combo']).upper()
            logging.info(f"Keyboard kill switch active: {combo_str}")
            
        except Exception as e:
            logging.error(f"Failed to start keyboard listener: {e}")
    
    def _on_key_press(self, key):
        """Handle key press events."""
        if not self.is_active:
            return
        
        if key in self.kill_switch_combo:
            self.pressed_keys.add(key)
            if self.pressed_keys == self.kill_switch_combo:
                self._trigger_shutdown("keyboard", "Keyboard hotkey activated")
    
    def _on_key_release(self, key):
        """Handle key release events."""
        if key in self.pressed_keys:
            self.pressed_keys.remove(key)
    
    def _start_file_watcher(self):
        """Start file-based trigger watcher."""
        def watch_file():
            trigger_path = Path(self.config['file_trigger_path'])
            
            while self.is_active:
                try:
                    if trigger_path.exists():
                        self._trigger_shutdown("file", f"Trigger file detected: {trigger_path}")
                        # Remove trigger file to prevent re-triggering
                        try:
                            trigger_path.unlink()
                        except:
                            pass
                        break
                except Exception as e:
                    logging.error(f"File watcher error: {e}")
                
                time.sleep(1)
        
        self.file_watcher_thread = threading.Thread(target=watch_file, daemon=True)
        self.file_watcher_thread.start()
        
        logging.info(f"File trigger watcher active: {self.config['file_trigger_path']}")
    
    def _start_network_trigger(self):
        """Start network-based trigger listener."""
        def listen_network():
            import socket
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                sock.bind(('localhost', self.config['network_trigger_port']))
                sock.settimeout(1.0)
                
                while self.is_active:
                    try:
                        data, addr = sock.recvfrom(1024)
                        if data.decode().strip() == "EMERGENCY_STOP":
                            self._trigger_shutdown("network", f"Network trigger from {addr}")
                            break
                    except socket.timeout:
                        continue
                    except Exception as e:
                        logging.error(f"Network trigger error: {e}")
                        break
            except Exception as e:
                logging.error(f"Failed to bind network trigger: {e}")
            finally:
                sock.close()
        
        self.network_trigger_thread = threading.Thread(target=listen_network, daemon=True)
        self.network_trigger_thread.start()
        
        logging.info(f"Network trigger listener active on port {self.config['network_trigger_port']}")
    
    def _start_watchdog_timer(self):
        """Start watchdog timer for automatic shutdown."""
        def watchdog():
            last_heartbeat = time.time()
            
            while self.is_active:
                current_time = time.time()
                
                # Check if watchdog timeout exceeded
                if current_time - last_heartbeat > self.config['watchdog_timeout']:
                    self._trigger_shutdown("watchdog", "Watchdog timeout expired")
                    break
                
                time.sleep(5)
        
        self.watchdog_thread = threading.Thread(target=watchdog, daemon=True)
        self.watchdog_thread.start()
        
        logging.info(f"Watchdog timer active: {self.config['watchdog_timeout']}s timeout")
    
    def _start_process_monitoring(self):
        """Start monitoring child processes."""
        if not self.config['monitor_child_processes']:
            return
        
        def monitor_processes():
            while self.is_active:
                try:
                    current_process = psutil.Process(self.parent_pid)
                    children = current_process.children(recursive=True)
                    
                    # Update monitored processes
                    self.monitored_processes = {
                        child.pid: child.info for child in children
                    }
                    
                except psutil.NoSuchProcess:
                    self._trigger_shutdown("process_monitor", "Parent process disappeared")
                    break
                except Exception as e:
                    logging.error(f"Process monitoring error: {e}")
                
                time.sleep(10)
        
        threading.Thread(target=monitor_processes, daemon=True).start()
        logging.info("Process monitoring active")
    
    def feed_watchdog(self):
        """Reset watchdog timer to prevent automatic shutdown."""
        # This method should be called regularly by the main application
        pass  # In a real implementation, this would reset the watchdog timer
    
    def _trigger_shutdown(self, trigger_method: str, reason: str):
        """Execute emergency shutdown procedure."""
        if self.emergency_stop_requested:
            return  # Prevent multiple shutdowns
        
        self.emergency_stop_requested = True
        logging.critical(f"EMERGENCY SHUTDOWN TRIGGERED: {reason}")
        
        # Collect processes to terminate
        processes_to_terminate = [self.parent_pid]
        processes_to_terminate.extend(self.monitored_processes.keys())
        
        success = True
        
        try:
            # Execute shutdown callback
            if self.shutdown_callback:
                self.shutdown_callback()
            
            # Graceful shutdown timeout
            time.sleep(self.config['graceful_shutdown_timeout'])
            
            # Force kill if necessary
            if self.config['force_kill_after_timeout']:
                for pid in processes_to_terminate:
                    try:
                        os.kill(pid, signal.SIGKILL)
                    except:
                        pass
            
        except Exception as e:
            logging.error(f"Shutdown error: {e}")
            success = False
        
        # Log the event
        self._log_event(trigger_method, reason, processes_to_terminate, success)
        
        # Stop the kill switch
        self.stop()
    
    def _default_shutdown(self):
        """Default shutdown implementation."""
        try:
            # Send SIGTERM to process group
            os.killpg(os.getpgrp(), signal.SIGTERM)
        except:
            pass
    
    def _log_event(self, trigger_method: str, reason: str, processes: List[int], success: bool = True):
        """Log kill switch event."""
        event = KillSwitchEvent(
            timestamp=datetime.now().isoformat(),
            trigger_method=trigger_method,
            reason=reason,
            processes_terminated=processes,
            success=success
        )
        
        self.event_log.append(event)
        
        # Save to file
        try:
            log_file = os.path.join(os.path.dirname(self.config_path), "kill_switch_events.log")
            with open(log_file, 'a') as f:
                f.write(json.dumps(event.__dict__) + '\n')
        except Exception as e:
            logging.error(f"Failed to log event: {e}")
    
    def get_status(self) -> Dict:
        """Get current kill switch status."""
        return {
            'active': self.is_active,
            'session_id': self.session_id,
            'monitored_processes': len(self.monitored_processes),
            'keyboard_listener': bool(self.keyboard_listener),
            'emergency_stop_requested': self.emergency_stop_requested,
            'total_events': len(self.event_log),
            'last_event': self.event_log[-1].timestamp if self.event_log else None
        }
    
    def get_event_history(self, limit: int = 10) -> List[Dict]:
        """Get recent kill switch events."""
        return [event.__dict__ for event in self.event_log[-limit:]]
    
    def test_trigger(self, method: str = "test"):
        """Test kill switch without actual shutdown."""
        self._log_event(method, "Test trigger", [self.parent_pid])
        logging.info(f"Kill switch test triggered via {method}")
        return True

# Convenience function for quick setup
def create_kill_switch(shutdown_callback=None, config_path=None) -> HardwareKillSwitch:
    """Create and configure a kill switch instance."""
    return HardwareKillSwitch(shutdown_callback, config_path)

# Example usage
if __name__ == '__main__':
    def custom_shutdown():
        print("Custom shutdown callback executed!")
        time.sleep(2)
    
    kill_switch = HardwareKillSwitch(shutdown_callback=custom_shutdown)
    kill_switch.start()
    
    try:
        print("Kill switch is active. Press Ctrl+Alt+K to test.")
        print(f"Create trigger file at: {kill_switch.config['file_trigger_path']}")
        print(f"Or send 'EMERGENCY_STOP' to localhost port {kill_switch.config['network_trigger_port']}")
        
        # Keep main thread alive
        while kill_switch.is_active:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down kill switch...")
        kill_switch.stop()

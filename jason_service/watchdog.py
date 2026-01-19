import time
import psutil
import subprocess
import sys

class Watchdog:
    """A watchdog to monitor and restart a process if it crashes."""

    def __init__(self, process_name, command_to_run):
        self.process_name = process_name
        self.command_to_run = command_to_run
        self.process = None

    def find_process(self):
        """Finds the process by name."""
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if self.process_name in proc.info['name'] or \
               (proc.info['cmdline'] and self.command_to_run[1] in " ".join(proc.info['cmdline'])):
                self.process = proc
                return True
        return False

    def start_process(self):
        """Starts the target process."""
        print(f"Watchdog: Starting process '{' '.join(self.command_to_run)}'")
        subprocess.Popen(self.command_to_run)
        time.sleep(2) # Give it time to start
        if not self.find_process():
            print("Watchdog: Failed to start the process.")

    def monitor(self):
        """Monitors the process and restarts it if it's not running."""
        if not self.find_process():
            print(f"Watchdog: Monitored process '{self.process_name}' not found. Starting it...")
            self.start_process()
        else:
            print(f"Watchdog: Found monitored process with PID {self.process.pid}")

        while True:
            if self.process is None or not self.process.is_running():
                print(f"Watchdog: Process '{self.process_name}' has stopped. Restarting...")
                self.start_process()
            time.sleep(5)

if __name__ == '__main__':
    # Example: python watchdog.py daemon.py
    if len(sys.argv) < 2:
        print("Usage: python watchdog.py <script_to_monitor>")
        sys.exit(1)

    script_name = sys.argv[1]
    command = [sys.executable, script_name]
    
    watchdog = Watchdog(process_name=script_name, command_to_run=command)
    watchdog.monitor()

import time
import threading
import logging
import platform
import subprocess
from jason_service.message_bus import PriorityMessageBus
from jason_service.shared_memory import SharedMemoryManager
from jason_service.ai_engine.scrl import QLearningAgent
from jason_service.security.morality_engine import MoralityEngine
from jason_service.security.kill_switch import HardwareKillSwitch
from jason_service.content_generation.presentation_generator import PresentationGenerator
from jason_service.ai_engine.uspt import USPT
from jason_service.ai_engine.vlm import VLM
from jason_service.ai_engine.local_llm import LocalLLM
from jason_service.task_automation.lms_handler import LMSHandler
import requests # For downloading images
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(threadName)s - %(message)s')

class JasonDaemon:
    def __init__(self):
        self._stop_event = threading.Event()
        self.threads = []
        self.message_bus = PriorityMessageBus()
        # Allocate 10MB for shared memory
        self.shared_memory = SharedMemoryManager(name="jason_context", size=10 * 1024 * 1024)
        plan_library_path = "jason_service/ai_engine/plan_library.json"
        
        # 1. Initialize Core Engines
        self.q_learning_agent = QLearningAgent(plan_library_path=plan_library_path)
        self.morality_engine = MoralityEngine()
        self.kill_switch = HardwareKillSwitch(shutdown_callback=self.stop)
        self.uspt_model = USPT()
        self.local_llm = LocalLLM(model="mistral") # Connect to local brain
        self.vlm = VLM()

        # 2. OS-Specific "Ghost Hand" Initialization
        system = platform.system()
        logging.info(f"Detected OS: {system}")
        
        if system == "Windows":
            from jason_service.ghost_hand.windows_control import WindowsGhostHand
            self.ghost_hand = WindowsGhostHand()
            # Attempt to create hidden desktop immediately or on demand
            # self.ghost_hand.create_hidden_desktop() 
        elif system == "Darwin":
            from jason_service.ghost_hand.macos_control import MacOSGhostHand
            self.ghost_hand = MacOSGhostHand()
        else:
            logging.warning("Unsupported OS for Ghost Hand. Execution capabilities disabled.")
            self.ghost_hand = None

        # 3. High-Level Modules
        self.presentation_generator = PresentationGenerator(
            uspt_model=self.uspt_model,
            local_llm=self.local_llm,  # Inject LLM
            image_search_func=self.search_for_image
        )
        self.lms_handler = LMSHandler(vlm=self.vlm, ghost_hand=self.ghost_hand)

    def start(self):
        """Starts the JASON daemon and its worker threads."""
        logging.info("Initializing JASON Daemon...")

        # Initialize modules
        modules = {
            "ai_engine": self.ai_engine_worker,
            "ghost_hand": self.ghost_hand_worker,
            "security_monitor": self.security_monitor_worker,
            "task_automation": self.task_automation_worker
        }

        for name, target in modules.items():
            thread = threading.Thread(target=target, name=name)
            self.threads.append(thread)
            thread.start()

        # Start the kill switch listener
        self.kill_switch.start()

        logging.info("JASON Daemon and all modules are running.")

    def stop(self):
        """Stops the JASON daemon and all worker threads gracefully."""
        logging.info("Shutting down JASON Daemon...")
        self._stop_event.set()
        for thread in self.threads:
            thread.join()
        
        # Cleanup Ghost Hand
        if self.ghost_hand and hasattr(self.ghost_hand, 'close_desktop'):
            self.ghost_hand.close_desktop()
            
        self.shared_memory.unlink() # Clean up shared memory
        logging.info("JASON Daemon has stopped.")

    def ai_engine_worker(self):
        """Worker for the Self-Learning AI Engine."""
        logging.info("AI Engine worker started.")
        # Example state and actions
        available_actions = ['open_powerpoint', 'type_slide_title', 'insert_image', 'save_presentation']

        while not self._stop_event.is_set():
            # In a real scenario, the state would be derived from the VLM and task context
            current_state = "initial_state"
            
            # Get a task from the message bus (or simulate one)
            task_message = self.message_bus.subscribe(block=False)
            if task_message:
                current_state = task_message.payload.get("state", current_state)
                logging.info(f"AI Engine processing task: {task_message.payload}")

                # 1. Choose an action
                action = self.q_learning_agent.get_action(current_state, available_actions)
                logging.info(f"AI Engine selected action: {action}")

                # 2. The Ghost Hand would execute the action and return a result
                # (Simulating execution and reward here)
                time.sleep(2) # Simulate action execution time
                reward = 10 # Simulate a positive reward
                next_state = "slide_title_typed" # Simulate next state

                # 3. Update the Q-table
                self.q_learning_agent.update(current_state, action, reward, next_state, available_actions)
                logging.info(f"AI Engine updated Q-table for state: {current_state}")
            else:
                # No tasks, sleep for a bit
                time.sleep(1)

    def ghost_hand_worker(self):
        """Worker for the Ghost Hand execution agent."""
        logging.info("Ghost Hand worker started.")
        if not self.ghost_hand:
             logging.warning("Ghost Hand not active (unsupported OS).")
             return

        while not self._stop_event.is_set():
            message = self.message_bus.subscribe(timeout=1)
            # Only process validated actions
            if message and message.payload.get('type') == 'validated_action':
                payload = message.payload
                action = payload.get('action')
                logging.info(f"Ghost Hand executing validated action: {action}")
                try:
                    pid = payload.get('pid', 12345) # Placeholder
                    window_id = self.ghost_hand.get_window_handle(pid=pid) # Updated method name
                    
                    # If window_id is None, we might not have a window yet
                    
                    if action == 'click':
                        self.ghost_hand.send_mouse_click(payload['x'], payload['y'], window_id)
                    elif action == 'type':
                         # Support 'text' or 'keycode'
                        if 'text' in payload:
                            self.ghost_hand.send_text(payload['text'], window_id)
                        elif 'keycode' in payload:
                            self.ghost_hand.send_keystroke(payload['keycode'], window_id)
                            
                    logging.info(f"Ghost Hand executed '{action}' successfully.")
             
                except Exception as e:
                    logging.error(f"Ghost Hand execution failed: {e}")
            time.sleep(0.1)

    def security_monitor_worker(self):
        """Worker for the Security & Ethics module."""
        logging.info("Security Monitor worker started.")
        while not self._stop_event.is_set():
            message = self.message_bus.subscribe(timeout=1)
            if message and message.priority == 1 and message.payload.get('type') == 'action_request':
                 # This would intercept action requests before they go to ghost hand
                 # For now, we simulate interception if the ghost hand logic was separate
                 pass
            
            # Simple simulation: all actions from AI engine need validation
            # Logic normally: AI Engine -> Message Bus -> Security Monitor -> Message Bus (Validated) -> Ghost Hand
            pass
            time.sleep(0.1)

    def search_for_image(self, query):
        """Searches for an image online and saves it locally."""
        # This is a placeholder for a proper image search API.
        logging.info(f"Searching for image with query: {query}")
        placeholder_image_path = "placeholder.jpg"
        if not os.path.exists(placeholder_image_path):
            try:
                # Let's try to download a placeholder image
                response = requests.get(f"https://source.unsplash.com/800x600/?{query.replace(' ', '+')}", timeout=10)
                response.raise_for_status()
                with open(placeholder_image_path, 'wb') as f:
                    f.write(response.content)
                return placeholder_image_path
            except requests.RequestException as e:
                logging.error(f"Could not download placeholder image: {e}")
                return None
        return placeholder_image_path

    def task_automation_worker(self):
        """Worker for task automation and content generation."""
        logging.info("Task Automation worker started.")
        while not self._stop_event.is_set():
            msg = self.message_bus.subscribe(timeout=1)
            if msg:
                payload = msg.payload
                task_type = payload.get('task')

                if task_type == 'create_presentation':
                    topic = payload.get('topic', 'Untitled')
                    output_path = f"{topic.replace(' ', '_')}.pptx"
                    
                    # Use LLM-enhanced generator
                    logging.info(f"Starting MISTRAL-powered presentation for: {topic}")
                    try:
                        self.presentation_generator.create_presentation(topic, output_path)
                    except Exception as e:
                        logging.error(f"Failed to create presentation: {e}")
                
                elif task_type == 'submit_assignment':
                    logging.info(f"Starting assignment submission: {payload}")
                    try:
                        pid = self.lms_handler.start_session()
                        if self.ghost_hand:
                            window_id = self.ghost_hand.get_window_handle(pid=pid)
                            if window_id:
                                self.lms_handler.navigate_to(payload['url'])
                                time.sleep(5) # Wait for page to load
                                self.lms_handler.find_and_click_button(payload['button_text'], window_id)
                            else:
                                logging.error("Could not find window for the browser session.")
                        self.lms_handler.close_session()
                    except Exception as e:
                        logging.error(f"Failed to submit assignment: {e}")
            time.sleep(1)

if __name__ == "__main__":
    daemon = JasonDaemon()
    try:
        daemon.start()
        # Keep main thread alive
        while not daemon._stop_event.is_set():
            time.sleep(1)
    except KeyboardInterrupt:
        daemon.stop()

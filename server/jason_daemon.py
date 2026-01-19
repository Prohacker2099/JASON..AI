"""
JASON Main Daemon Service - Production-Ready Autonomous Agent
Integrates all JASON components into a unified, production-ready system
"""

import os
import sys
import time
import logging
import json
import threading
import signal
import argparse
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import daemon
from daemon import pidfile

# Import JASON components
from jason.core.microkernel import MessageBus, SharedMemoryManager, EncryptedPersistence
from jason.ai.scrl import QLearningAgent
from jason.ai.uspt import UserStyleAdapter
from jason.ai.vlm import SemanticBridge, GUILearner
from jason.automation.ghost_hand import GhostHandAgent
from jason.automation.anti_bot_jitter import AntiBotJitter
from jason.ethics.morality_engine import MoralityEngine
from jason.safety.kill_switch import HardwareKillSwitch, kill_switch_manager
from jason.safety.watchdog import WatchdogProtocol, watchdog_protocol
from jason.content.powerpoint_generator import PowerPointGenerator
from jason.content.document_generator import WordGenerator, ExcelGenerator
from jason.automation.homework_submitter import UniversalHomeworkSubmitter
from jason.orchestration.workflow_orchestrator import WorkflowOrchestrator

logger = logging.getLogger('JASON_DAEMON')

@dataclass
class JASONConfig:
    """JASON daemon configuration"""
    log_level: str = "INFO"
    log_file: str = "/var/log/jason/jason.log"
    pid_file: str = "/var/run/jason/jason.pid"
    config_file: str = "/etc/jason/jason.conf"
    data_dir: str = "/var/lib/jason"
    temp_dir: str = "/tmp/jason"
    
    # Component settings
    enable_ai: bool = True
    enable_automation: bool = True
    enable_content_generation: bool = True
    enable_homework: bool = True
    
    # Security settings
    enable_kill_switch: bool = True
    enable_watchdog: bool = True
    enable_morality_engine: bool = True
    
    # Performance settings
    max_concurrent_workflows: int = 5
    workflow_timeout: int = 3600  # 1 hour
    
    # AI model settings
    ai_model_path: str = "/opt/jason/models"
    local_ai_only: bool = True

class JASondaemon:
    """Main JASON daemon service"""
    
    def __init__(self, config: JASONConfig):
        self.config = config
        self.running = False
        self.shutdown_requested = False
        
        # Core components
        self.message_bus = None
        self.shared_memory = None
        self.persistence = None
        
        # AI components
        self.q_learning_agent = None
        self.user_style_adapter = None
        self.semantic_bridge = None
        self.gui_learner = None
        
        # Automation components
        self.ghost_hand = None
        self.anti_bot_jitter = None
        
        # Safety components
        self.kill_switch = None
        self.watchdog = None
        self.morality_engine = None
        
        # Content generation
        self.powerpoint_generator = None
        self.word_generator = None
        self.excel_generator = None
        
        # Task automation
        self.homework_submitter = None
        self.workflow_orchestrator = None
        
        # Threads
        self.component_threads = {}
        
        # Setup logging
        self._setup_logging()
        
        logger.info("JASON daemon initialized")
        
    def _setup_logging(self):
        """Setup logging configuration"""
        # Create log directory
        log_dir = os.path.dirname(self.config.log_file)
        os.makedirs(log_dir, exist_ok=True)
        
        # Configure logging
        logging.basicConfig(
            level=getattr(logging, self.config.log_level.upper()),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.config.log_file),
                logging.StreamHandler()
            ]
        )
        
    def start(self):
        """Start the JASON daemon"""
        try:
            logger.info("Starting JASON daemon...")
            
            # Create necessary directories
            self._create_directories()
            
            # Initialize core components
            self._initialize_core_components()
            
            # Initialize AI components
            if self.config.enable_ai:
                self._initialize_ai_components()
                
            # Initialize automation components
            if self.config.enable_automation:
                self._initialize_automation_components()
                
            # Initialize safety components
            self._initialize_safety_components()
            
            # Initialize content generation
            if self.config.enable_content_generation:
                self._initialize_content_generation()
                
            # Initialize task automation
            if self.config.enable_homework:
                self._initialize_task_automation()
                
            # Start component threads
            self._start_component_threads()
            
            # Setup signal handlers
            self._setup_signal_handlers()
            
            self.running = True
            logger.info("JASON daemon started successfully")
            
            # Main daemon loop
            self._daemon_loop()
            
        except Exception as e:
            logger.error(f"Failed to start JASON daemon: {e}")
            self.stop()
            sys.exit(1)
            
    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            self.config.data_dir,
            self.config.temp_dir,
            os.path.dirname(self.config.pid_file),
            os.path.dirname(self.config.config_file)
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            
    def _initialize_core_components(self):
        """Initialize core JASON components"""
        logger.info("Initializing core components...")
        
        # Message bus for inter-component communication
        self.message_bus = MessageBus()
        
        # Shared memory manager
        self.shared_memory = SharedMemoryManager()
        
        # Encrypted persistence
        self.persistence = EncryptedPersistence(
            db_path=os.path.join(self.config.data_dir, "jason.db"),
            encryption_key="user_derived_key"  # In production, derive from user password
        )
        
        logger.info("Core components initialized")
        
    def _initialize_ai_components(self):
        """Initialize AI components"""
        logger.info("Initializing AI components...")
        
        # Q-Learning agent
        self.q_learning_agent = QLearningAgent()
        
        # User Style & Preference Trainer
        self.user_style_adapter = UserStyleAdapter(
            model_path=os.path.join(self.config.ai_model_path, "uspt_model")
        )
        
        # Semantic Bridge for VLM
        self.semantic_bridge = SemanticBridge()
        
        # GUI Learner
        self.gui_learner = GUILearner(
            vlm_model_path=os.path.join(self.config.ai_model_path, "vlm_model")
        )
        
        logger.info("AI components initialized")
        
    def _initialize_automation_components(self):
        """Initialize automation components"""
        logger.info("Initializing automation components...")
        
        # Ghost Hand DAI Execution Agent
        self.ghost_hand = GhostHandAgent()
        
        # Anti-Bot Jitter Module
        self.anti_bot_jitter = AntiBotJitter()
        
        logger.info("Automation components initialized")
        
    def _initialize_safety_components(self):
        """Initialize safety components"""
        logger.info("Initializing safety components...")
        
        # Morality Engine
        if self.config.enable_morality_engine:
            self.morality_engine = MoralityEngine()
            
        # Hardware Kill Switch
        if self.config.enable_kill_switch:
            self.kill_switch = kill_switch_manager.get_kill_switch("main")
            
        # Watchdog Protocol
        if self.config.enable_watchdog:
            self.watchdog = watchdog_protocol
            
        logger.info("Safety components initialized")
        
    def _initialize_content_generation(self):
        """Initialize content generation components"""
        logger.info("Initializing content generation...")
        
        # PowerPoint Generator
        self.powerpoint_generator = PowerPointGenerator()
        
        # Word Generator
        self.word_generator = WordGenerator()
        
        # Excel Generator
        self.excel_generator = ExcelGenerator()
        
        logger.info("Content generation initialized")
        
    def _initialize_task_automation(self):
        """Initialize task automation components"""
        logger.info("Initializing task automation...")
        
        # Universal Homework Submitter
        self.homework_submitter = UniversalHomeworkSubmitter()
        
        # Workflow Orchestrator
        self.workflow_orchestrator = WorkflowOrchestrator()
        
        logger.info("Task automation initialized")
        
    def _start_component_threads(self):
        """Start component monitoring threads"""
        logger.info("Starting component threads...")
        
        # Start message bus processing
        self._start_thread("message_bus", self._message_bus_loop)
        
        # Start workflow orchestrator
        self._start_thread("workflow_orchestrator", self.workflow_orchestrator.start)
        
        # Start watchdog if enabled
        if self.config.enable_watchdog and self.watchdog:
            self._start_thread("watchdog", self.watchdog.start)
            
        # Start kill switch if enabled
        if self.config.enable_kill_switch and self.kill_switch:
            self._start_thread("kill_switch", self.kill_switch.start)
            
        logger.info("Component threads started")
        
    def _start_thread(self, name: str, target_func):
        """Start a component thread"""
        thread = threading.Thread(target=target_func, daemon=True, name=name)
        thread.start()
        self.component_threads[name] = thread
        
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.shutdown_requested = True
        
    def _daemon_loop(self):
        """Main daemon loop"""
        logger.info("Entering main daemon loop")
        
        while self.running and not self.shutdown_requested:
            try:
                # Process system health checks
                self._health_check()
                
                # Process pending tasks
                self._process_tasks()
                
                # Update AI learning
                if self.config.enable_ai:
                    self._update_learning()
                    
                # Sleep briefly
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in daemon loop: {e}")
                time.sleep(5)
                
        logger.info("Exiting main daemon loop")
        
    def _health_check(self):
        """Perform system health checks"""
        try:
            # Check component health
            unhealthy_components = []
            
            # Check message bus
            if not self.message_bus:
                unhealthy_components.append("message_bus")
                
            # Check shared memory
            if not self.shared_memory:
                unhealthy_components.append("shared_memory")
                
            # Report unhealthy components
            if unhealthy_components:
                logger.warning(f"Unhealthy components detected: {unhealthy_components}")
                
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            
    def _process_tasks(self):
        """Process pending tasks and workflows"""
        try:
            if self.workflow_orchestrator:
                # Check for completed workflows
                pass  # Workflow orchestrator handles this internally
                
        except Exception as e:
            logger.error(f"Task processing failed: {e}")
            
    def _update_learning(self):
        """Update AI learning components"""
        try:
            if self.q_learning_agent:
                # Update Q-learning based on recent executions
                pass  # Q-learning agent handles this internally
                
        except Exception as e:
            logger.error(f"Learning update failed: {e}")
            
    def _message_bus_loop(self):
        """Message bus processing loop"""
        try:
            while self.running:
                # Process messages from queue
                message = self.message_bus.get_message(timeout=1.0)
                if message:
                    self._handle_message(message)
                    
        except Exception as e:
            logger.error(f"Message bus loop error: {e}")
            
    def _handle_message(self, message: Dict[str, Any]):
        """Handle incoming messages"""
        try:
            message_type = message.get("type")
            
            if message_type == "workflow_request":
                self._handle_workflow_request(message)
            elif message_type == "content_generation":
                self._handle_content_request(message)
            elif message_type == "automation_request":
                self._handle_automation_request(message)
            elif message_type == "system_command":
                self._handle_system_command(message)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Message handling failed: {e}")
            
    def _handle_workflow_request(self, message: Dict[str, Any]):
        """Handle workflow execution requests"""
        try:
            workflow_data = message.get("workflow")
            if workflow_data and self.workflow_orchestrator:
                # Submit workflow for execution
                workflow_id = self.workflow_orchestrator.create_workflow(
                    workflow_data["name"],
                    workflow_data["description"],
                    workflow_data["tasks"]
                )
                self.workflow_orchestrator.submit_workflow(workflow_id)
                
        except Exception as e:
            logger.error(f"Workflow request handling failed: {e}")
            
    def _handle_content_request(self, message: Dict[str, Any]):
        """Handle content generation requests"""
        try:
            content_type = message.get("content_type")
            prompt = message.get("prompt", "")
            
            if content_type == "powerpoint" and self.powerpoint_generator:
                # Generate PowerPoint
                spec = message.get("spec", {})
                self.powerpoint_generator.generate_presentation(prompt, spec)
            elif content_type == "word" and self.word_generator:
                # Generate Word document
                spec = message.get("spec", {})
                self.word_generator.generate_document(spec)
            elif content_type == "excel" and self.excel_generator:
                # Generate Excel spreadsheet
                spec = message.get("spec", {})
                self.excel_generator.generate_spreadsheet(spec)
                
        except Exception as e:
            logger.error(f"Content request handling failed: {e}")
            
    def _handle_automation_request(self, message: Dict[str, Any]):
        """Handle automation requests"""
        try:
            automation_type = message.get("automation_type")
            
            if automation_type == "homework" and self.homework_submitter:
                # Handle homework submission
                platform = message.get("platform")
                assignment_data = message.get("assignment")
                # Process homework submission
                pass
                
        except Exception as e:
            logger.error(f"Automation request handling failed: {e}")
            
    def _handle_system_command(self, message: Dict[str, Any]):
        """Handle system commands"""
        try:
            command = message.get("command")
            
            if command == "shutdown":
                self.shutdown_requested = True
            elif command == "restart":
                self.shutdown_requested = True
                # Restart logic would go here
            elif command == "status":
                self._report_status()
                
        except Exception as e:
            logger.error(f"System command handling failed: {e}")
            
    def _report_status(self):
        """Report system status"""
        try:
            status = {
                "daemon_running": self.running,
                "components": {
                    "message_bus": self.message_bus is not None,
                    "shared_memory": self.shared_memory is not None,
                    "q_learning": self.q_learning_agent is not None,
                    "ghost_hand": self.ghost_hand is not None,
                    "workflow_orchestrator": self.workflow_orchestrator is not None,
                    "morality_engine": self.morality_engine is not None,
                    "kill_switch": self.kill_switch is not None,
                    "watchdog": self.watchdog is not None
                },
                "active_threads": list(self.component_threads.keys())
            }
            
            logger.info(f"JASON Status: {json.dumps(status, indent=2)}")
            
        except Exception as e:
            logger.error(f"Status reporting failed: {e}")
            
    def stop(self):
        """Stop the JASON daemon"""
        try:
            logger.info("Stopping JASON daemon...")
            
            self.running = False
            self.shutdown_requested = True
            
            # Stop component threads
            for name, thread in self.component_threads.items():
                logger.info(f"Stopping thread: {name}")
                if thread.is_alive():
                    thread.join(timeout=5.0)
                    
            # Stop components
            if self.workflow_orchestrator:
                self.workflow_orchestrator.stop()
                
            if self.watchdog:
                self.watchdog.stop()
                
            if self.kill_switch:
                self.kill_switch.stop()
                
            # Cleanup
            if self.shared_memory:
                self.shared_memory.cleanup()
                
            logger.info("JASON daemon stopped")
            
        except Exception as e:
            logger.error(f"Error stopping JASON daemon: {e}")

def load_config(config_file: str) -> JASONConfig:
    """Load configuration from file"""
    config = JASONConfig()
    
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                data = json.load(f)
                
            # Update config with file values
            for key, value in data.items():
                if hasattr(config, key):
                    setattr(config, key, value)
                    
        except Exception as e:
            logger.warning(f"Failed to load config file: {e}")
            
    return config

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='JASON Autonomous Agent Daemon')
    parser.add_argument('--config', default='/etc/jason/jason.conf', help='Configuration file path')
    parser.add_argument('--foreground', action='store_true', help='Run in foreground')
    parser.add_argument('--start', action='store_true', help='Start daemon')
    parser.add_argument('--stop', action='store_true', help='Stop daemon')
    parser.add_argument('--restart', action='store_true', help='Restart daemon')
    parser.add_argument('--status', action='store_true', help='Show daemon status')
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Handle daemon commands
    if args.stop:
        if os.path.exists(config.pid_file):
            with open(config.pid_file, 'r') as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGTERM)
        return
        
    if args.status:
        if os.path.exists(config.pid_file):
            print("JASON daemon is running")
        else:
            print("JASON daemon is not running")
        return
        
    if args.restart:
        if os.path.exists(config.pid_file):
            with open(config.pid_file, 'r') as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGTERM)
            time.sleep(2)
            
    if not args.start and not args.restart:
        parser.print_help()
        return
        
    # Create and start daemon
    jason_daemon = JASondaemon(config)
    
    if args.foreground:
        # Run in foreground
        jason_daemon.start()
    else:
        # Run as daemon
        with daemon.DaemonContext(
            pidfile=pidfile.TimeoutPIDLockFile(config.pid_file),
            working_directory='/',
            umask=0o002
        ):
            jason_daemon.start()

if __name__ == "__main__":
    main()

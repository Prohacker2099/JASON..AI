import os
import json
import time
import random
import asyncio
import autogen
from typing import List, Dict, Any, Optional

from .config import AgentConfig
from server.services.deviceDiscovery import DeviceDiscovery
from ..storage import Storage

# Get agent configuration
config = {
    "seed": 42,
    "temperature": 0.7,
    "config_list": [{"model": "gpt-4", "api_key": os.getenv("OPENAI_API_KEY")}],
    "functions": [
        {
            "name": "discover_devices",
            "description": "Scan the local network for compatible smart home devices",
            "parameters": {"type": "object", "properties": {}}
        },
        {
            "name": "control_device",
            "description": "Control a smart home device",
            "parameters": {
                "type": "object",
                "properties": {
                    "device_id": {"type": "string"},
                    "command": {"type": "string"},
                    "parameters": {"type": "object"}
                },
                "required": ["device_id", "command"]
            }
        },
        {
            "name": "create_automation",
            "description": "Create a new automation rule",
            "parameters": {
                "type": "object",
                "properties": {
                    "trigger": {"type": "object"},
                    "conditions": {"type": "array"},
                    "actions": {"type": "array"}
                },
                "required": ["trigger", "actions"]
            }
        }
    ]
}

class AgentOrchestrator:
    def __init__(self, device_manager=None, storage=None):
        self.device_manager = device_manager
        self.storage = storage
        
        # Create the agent system
        self.assistant = autogen.AssistantAgent(
            name="JASON_Assistant",
            system_message="""You are JASON, an advanced AI home automation assistant. Your capabilities include:
            1. Natural language understanding of home automation requests
            2. Device discovery and control
            3. Automation creation and management
            4. Pattern recognition for user behaviors
            5. Energy optimization suggestions""",
            llm_config=config,
            function_map={
                "discover_devices": self._discover_devices,
                "control_device": self._control_device,
                "create_automation": self._create_automation
            }
        )

        self.planner = autogen.AssistantAgent(
            name="JASON_Planner",
            system_message="You are an automation planning specialist. You help design efficient automations and schedules for smart home devices.",
            llm_config=config,
        )

        self.executor = autogen.AssistantAgent(
            name="JASON_Executor",
            system_message="You are responsible for executing device control commands and managing integrations with various smart home platforms.",
            llm_config=config,
        )

        self.user_proxy = autogen.UserProxyAgent(
            name="User_Proxy",
            system_message="You are a proxy for the user, helping to coordinate between the user's requests and JASON's agent team.",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
            llm_config=config,
        )

        # Create a group chat
        self.group_chat = autogen.GroupChat(
            agents=[self.user_proxy, self.assistant, self.planner, self.executor],
            messages=[],
            max_round=10
        )

        self.manager = autogen.GroupChatManager(
            groupchat=self.group_chat,
            llm_config=config,
        )

    def process_request(self, request: str, context: Dict[str, Any] = None) -> str:
        """Process a user request through the multi-agent system"""
        try:
            # Initialize chat
            self.group_chat.messages = []
            
            # Add context if provided
            if context:
                context_msg = f"Context: {json.dumps(context)}\n\nRequest: {request}"
            else:
                context_msg = request

            # Start the conversation
            self.user_proxy.initiate_chat(
                self.manager,
                message=context_msg
            )

            # Extract the final response from the chat history
            response = self._get_final_response()
            return response

        except Exception as e:
            print(f"Error processing request: {str(e)}")
            return f"Error: {str(e)}"

    def _get_final_response(self) -> str:
        """Extract the final response from the chat history"""
        if not self.group_chat.messages:
            return "No response generated"

        # Get the last message from an assistant (not user proxy)
        for message in reversed(self.group_chat.messages):
            if message.get("sender") in ["JASON_Assistant", "JASON_Executor"]:
                return message.get("content", "No content found")

        return "No assistant response found"

    async def _discover_devices(self) -> List[Dict[str, Any]]:
        """Discover available smart home devices."""
        try:
            if not self.device_manager:
                raise ValueError("Device manager not initialized")
            return await self.device_manager.discover_devices()
        except Exception as e:
            return {"error": str(e)}

    async def _control_device(self, device_id: str, command: str, parameters: Optional[Dict] = None) -> Dict[str, Any]:
        """Control a specific device with the given command and parameters."""
        try:
            if not self.device_manager:
                raise ValueError("Device manager not initialized")
            return await self.device_manager.control_device(device_id, command, parameters or {})
        except Exception as e:
            return {"error": str(e)}

    async def _create_automation(self, trigger: Dict, conditions: List[Dict], actions: List[Dict]) -> Dict[str, Any]:
        """Create a new automation rule."""
        try:
            if not self.storage:
                raise ValueError("Storage not initialized")
            
            automation = {
                "id": f"auto_{int(time.time())}_{random.randint(1000, 9999)}",
                "trigger": trigger,
                "conditions": conditions,
                "actions": actions,
                "enabled": True,
                "created_at": time.time()
            }
            
            await self.storage.save_automation(automation)
            return {"success": True, "automation": automation}
        except Exception as e:
            return {"error": str(e)}

    async def process_command(self, command: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a command through the agent network"""
        try:
            # Initialize chat with context
            if context:
                command = f"Context: {json.dumps(context)}\n\nCommand: {command}"
                
            # Get response from the agent network
            response = await self.process_request(command)
            
            return {
                "success": True,
                "response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_automations(self) -> List[Dict[str, Any]]:
        """Retrieve all saved automations."""
        try:
            if not self.storage:
                raise ValueError("Storage not initialized")
            return await self.storage.get_automations()
        except Exception as e:
            return {"error": str(e)}

    async def delete_automation(self, automation_id: str) -> Dict[str, Any]:
        """Delete an automation by ID."""
        try:
            if not self.storage:
                raise ValueError("Storage not initialized")
            await self.storage.delete_automation(automation_id)
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}

    async def initialize_autonomous_mode(self):
        """Initialize autonomous operation mode"""
        from .autonomousAgent import AutonomousAgent
        
        # Create autonomous agent
        self.autonomous_agent = AutonomousAgent(
            device_manager=self.device_manager,
            storage=self.storage,
            config=self.config
        )
        
        # Start autonomous monitoring in background
        asyncio.create_task(self.autonomous_agent.start_autonomous_monitoring())
        
        return {"success": True, "message": "Autonomous mode initialized"}

    async def get_autonomous_insights(self) -> Dict[str, Any]:
        """Get insights from autonomous operation"""
        if not hasattr(self, 'autonomous_agent'):
            return {"error": "Autonomous mode not initialized"}
            
        try:
            current_state = await self.autonomous_agent._collect_system_state()
            patterns = await self.autonomous_agent._analyze_patterns(current_state)
            
            return {
                "success": True,
                "insights": {
                    "patterns": patterns,
                    "state": current_state
                }
            }
        except Exception as e:
            return {"error": str(e)}

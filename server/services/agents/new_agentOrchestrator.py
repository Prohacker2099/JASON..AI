import os
import json
import time
import random
import asyncio
import autogen
from typing import List, Dict, Any, Optional

from .config import AgentConfig

class AgentOrchestrator:
    def __init__(self, device_manager=None, storage=None):
        self.device_manager = device_manager
        self.storage = storage
        
        # Get base configuration
        self.config = AgentConfig.get_config()
        
        # Add function definitions
        self.config["functions"] = list(AgentConfig.get_function_map().values())
        
        # Create the main assistant
        self.assistant = autogen.AssistantAgent(
            name="JASON_Assistant",
            system_message="""You are JASON, an advanced AI home automation assistant. Your capabilities include:
            1. Natural language understanding of home automation requests
            2. Device discovery and control
            3. Automation creation and management
            4. Pattern recognition for user behaviors
            5. Energy optimization suggestions""",
            llm_config=self.config,
            function_map={
                "discover_devices": self._discover_devices,
                "control_device": self._control_device,
                "create_automation": self._create_automation
            }
        )

        # Create specialized agents
        self.planner = autogen.AssistantAgent(
            name="JASON_Planner",
            system_message="""You are an automation planning specialist. Your responsibilities include:
            1. Designing efficient home automation workflows
            2. Optimizing device schedules for energy efficiency
            3. Creating complex conditional automations
            4. Ensuring automation rules don't conflict""",
            llm_config=self.config
        )

        self.executor = autogen.AssistantAgent(
            name="JASON_Executor",
            system_message="""You are the device control specialist. Your responsibilities include:
            1. Executing device commands safely and efficiently
            2. Managing device state transitions
            3. Handling errors and providing feedback
            4. Ensuring commands are executed in the correct order""",
            llm_config=self.config
        )

        # Create user proxy for coordination
        self.user_proxy = autogen.UserProxyAgent(
            name="User_Proxy",
            system_message="You are a proxy for the user, helping to coordinate between the user's requests and JASON's agent team.",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
            llm_config=self.config
        )

        # Set up the group chat
        self.group_chat = autogen.GroupChat(
            agents=[self.user_proxy, self.assistant, self.planner, self.executor],
            messages=[],
            max_round=10
        )

        # Create the manager
        self.manager = autogen.GroupChatManager(
            groupchat=self.group_chat,
            llm_config=self.config
        )

    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a user request through the multi-agent system"""
        try:
            # Reset chat history
            self.group_chat.messages = []
            
            # Add context if provided
            if context:
                message = f"Context: {json.dumps(context)}\n\nRequest: {request}"
            else:
                message = request

            # Start the conversation
            await self.user_proxy.a_initiate_chat(
                self.manager,
                message=message
            )

            # Get final response
            response = await self._get_final_response()
            
            return {
                "success": True,
                "response": response
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def _get_final_response(self) -> str:
        """Get the final response from the conversation"""
        if not self.group_chat.messages:
            return "No response generated"

        # Get last assistant message
        for message in reversed(self.group_chat.messages):
            if message.get("sender") in ["JASON_Assistant", "JASON_Executor"]:
                return message.get("content", "No content found")

        return "No assistant response found"

    async def _discover_devices(self) -> Dict[str, Any]:
        """Discover devices on the local network"""
        try:
            if not self.device_manager:
                raise ValueError("Device manager not initialized")
                
            devices = await self.device_manager.startDiscovery()
            return {
                "success": True,
                "devices": devices
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def _control_device(self, device_id: str, command: str, parameters: Dict = None) -> Dict[str, Any]:
        """Control a device through the device manager"""
        try:
            if not self.device_manager:
                raise ValueError("Device manager not initialized")
                
            result = await self.device_manager.controlDevice(
                device_id,
                {"command": command, "params": parameters or {}}
            )
            return {
                "success": True,
                "result": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def _create_automation(self, trigger: Dict, conditions: List = None, actions: List[Dict] = None) -> Dict[str, Any]:
        """Create a new automation rule"""
        try:
            if not self.storage:
                raise ValueError("Storage not initialized")
                
            # Validate automation components
            if not trigger or not actions:
                raise ValueError("Automation must have both trigger and actions")
                
            automation = {
                "id": await self._generate_automation_id(),
                "trigger": trigger,
                "conditions": conditions or [],
                "actions": actions,
                "enabled": True,
                "created": int(time.time())
            }
            
            # Store the automation
            await self.storage.addAutomation(automation)
            
            return {
                "success": True,
                "automation": automation
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
                
    async def _generate_automation_id(self) -> str:
        """Generate a unique automation ID"""
        timestamp = int(time.time())
        random_suffix = ''.join(random.choices('0123456789abcdef', k=6))
        return f"auto_{timestamp}_{random_suffix}"

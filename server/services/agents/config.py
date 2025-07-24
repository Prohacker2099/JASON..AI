import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AgentConfig:
    @staticmethod
    def get_config() -> Dict[str, Any]:
        """Get the base configuration for AutoGen agents"""
        return {
            "seed": 42,
            "temperature": 0.7,
            "config_list": [{
                "model": "gpt-4",
                "api_key": os.getenv("OPENAI_API_KEY")
            }]
        }
        
    @staticmethod
    def get_function_map() -> Dict[str, Dict[str, Any]]:
        """Get the function definitions for agents"""
        return {
            "discover_devices": {
                "name": "discover_devices",
                "description": "Scan the local network for compatible smart home devices",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            "control_device": {
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
            "create_automation": {
                "name": "create_automation",
                "description": "Create a new automation rule",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "trigger": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string", "enum": ["time", "event", "device_state", "location"]},
                                "value": {"type": "object"}
                            },
                            "required": ["type", "value"]
                        },
                        "conditions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string"},
                                    "value": {"type": "object"}
                                }
                            }
                        },
                        "actions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string"},
                                    "target": {"type": "string"},
                                    "command": {"type": "string"},
                                    "parameters": {"type": "object"}
                                },
                                "required": ["type", "target", "command"]
                            }
                        }
                    },
                    "required": ["trigger", "actions"]
                }
            }
        }

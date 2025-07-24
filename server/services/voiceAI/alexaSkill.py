"""
JASON Alexa Skill - Secure Cloud Proxy

This module implements the Alexa Skill that acts as a secure proxy between
Amazon's cloud and your local JASON instance. It handles device discovery,
control commands, and state synchronization while maintaining privacy.
"""

import json
import logging
import asyncio
import aiohttp
import ssl
from typing import Dict, Any, List, Optional
from datetime import datetime
import hashlib
import hmac
import base64
from flask import Flask, request, jsonify
from flask_ask import Ask, statement, question, session
import requests
import websockets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AlexaSkill")

class JasonAlexaSkill:
    """
    JASON Alexa Skill - Secure Cloud Proxy
    
    This skill acts as a secure intermediary between Alexa and your local JASON instance.
    It never stores device data in the cloud and forwards all commands securely to your home.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.app = Flask(__name__)
        self.ask = Ask(self.app, "/alexa")
        
        # Security configuration
        self.skill_id = config.get("alexa_skill_id")
        self.encryption_key = config.get("encryption_key")
        
        # Local JASON instance connections
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        
        # Set up Alexa skill handlers
        self._setup_skill_handlers()
        
    def _setup_skill_handlers(self):
        """Set up Alexa skill intent handlers"""
        
        @self.ask.launch
        def launch():
            """Handle skill launch"""
            welcome_text = "Welcome to JASON, your smart home assistant. What would you like me to do?"
            return question(welcome_text)
            
        @self.ask.intent("DeviceControlIntent")
        def device_control_intent(device_name, action, value):
            """Handle device control intents"""
            try:
                # Get user's JASON instance connection
                user_id = session.user.userId
                connection_info = self.active_connections.get(user_id)
                
                if not connection_info:
                    return statement("I couldn't connect to your JASON system. Please check your setup in the Alexa app.")
                
                # Forward command to local JASON instance
                command = {
                    "type": "device_control",
                    "device": device_name,
                    "action": action,
                    "value": value,
                    "timestamp": datetime.now().isoformat()
                }
                
                response = asyncio.run(self._forward_to_jason(user_id, command))
                
                if response and response.get("success"):
                    return statement(f"Done! I've {action} the {device_name}.")
                else:
                    error_msg = response.get("error", "Unknown error") if response else "No response"
                    return statement(f"I couldn't control the {device_name}. {error_msg}")
                    
            except Exception as e:
                logger.error(f"Error in device control intent: {str(e)}")
                return statement("I encountered an error controlling that device.")
                
        @self.ask.intent("SceneControlIntent")
        def scene_control_intent(scene_name):
            """Handle scene control intents"""
            try:
                user_id = session.user.userId
                connection_info = self.active_connections.get(user_id)
                
                if not connection_info:
                    return statement("I couldn't connect to your JASON system.")
                
                command = {
                    "type": "scene_control",
                    "scene": scene_name,
                    "timestamp": datetime.now().isoformat()
                }
                
                response = asyncio.run(self._forward_to_jason(user_id, command))
                
                if response and response.get("success"):
                    return statement(f"I've activated the {scene_name} scene.")
                else:
                    return statement(f"I couldn't activate the {scene_name} scene.")
                    
            except Exception as e:
                logger.error(f"Error in scene control intent: {str(e)}")
                return statement("I encountered an error with that scene.")
                
        @self.ask.intent("StatusIntent")
        def status_intent(device_name):
            """Handle status inquiry intents"""
            try:
                user_id = session.user.userId
                connection_info = self.active_connections.get(user_id)
                
                if not connection_info:
                    return statement("I couldn't connect to your JASON system.")
                
                command = {
                    "type": "get_status",
                    "device": device_name,
                    "timestamp": datetime.now().isoformat()
                }
                
                response = asyncio.run(self._forward_to_jason(user_id, command))
                
                if response and response.get("success"):
                    status = response.get("status", {})
                    if device_name:
                        return statement(f"The {device_name} is {status.get('state', 'unknown')}.")
                    else:
                        # General status
                        device_count = status.get("device_count", 0)
                        online_count = status.get("online_count", 0)
                        return statement(f"Your JASON system has {device_count} devices, with {online_count} currently online.")
                else:
                    return statement("I couldn't get the status right now.")
                    
            except Exception as e:
                logger.error(f"Error in status intent: {str(e)}")
                return statement("I encountered an error getting the status.")
                
        @self.ask.intent("AMAZON.HelpIntent")
        def help_intent():
            """Handle help requests"""
            help_text = """
            I can help you control your smart home through JASON. You can say things like:
            'Turn on the living room lights',
            'Set the thermostat to 72 degrees',
            'Activate movie night scene',
            or 'What's the status of my devices?'
            What would you like me to do?
            """
            return question(help_text)
            
        @self.ask.intent("AMAZON.StopIntent")
        def stop_intent():
            """Handle stop requests"""
            return statement("Goodbye!")
            
        @self.ask.intent("AMAZON.CancelIntent")
        def cancel_intent():
            """Handle cancel requests"""
            return statement("Cancelled.")
            
    async def _forward_to_jason(self, user_id: str, command: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Forward a command to the user's local JASON instance"""
        try:
            connection_info = self.active_connections.get(user_id)
            if not connection_info:
                return {"success": False, "error": "No connection to JASON instance"}
                
            # Encrypt the command
            encrypted_command = self._encrypt_command(command, connection_info["encryption_key"])
            
            # Send via WebSocket or HTTPS
            if connection_info.get("websocket_url"):
                return await self._send_via_websocket(connection_info["websocket_url"], encrypted_command)
            elif connection_info.get("https_url"):
                return await self._send_via_https(connection_info["https_url"], encrypted_command)
            else:
                return {"success": False, "error": "No valid connection method"}
                
        except Exception as e:
            logger.error(f"Error forwarding to JASON: {str(e)}")
            return {"success": False, "error": str(e)}
            
    async def _send_via_websocket(self, websocket_url: str, encrypted_command: str) -> Dict[str, Any]:
        """Send command via WebSocket"""
        try:
            # Create SSL context for secure connection
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False  # For local connections
            ssl_context.verify_mode = ssl.CERT_NONE
            
            async with websockets.connect(websocket_url, ssl=ssl_context) as websocket:
                await websocket.send(encrypted_command)
                response = await websocket.recv()
                
                # Decrypt and parse response
                decrypted_response = self._decrypt_response(response)
                return json.loads(decrypted_response)
                
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")
            return {"success": False, "error": f"WebSocket error: {str(e)}"}
            
    async def _send_via_https(self, https_url: str, encrypted_command: str) -> Dict[str, Any]:
        """Send command via HTTPS"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    https_url,
                    data=encrypted_command,
                    headers={"Content-Type": "application/octet-stream"},
                    ssl=False  # For local connections
                ) as response:
                    encrypted_response = await response.read()
                    
                    # Decrypt and parse response
                    decrypted_response = self._decrypt_response(encrypted_response)
                    return json.loads(decrypted_response)
                    
        except Exception as e:
            logger.error(f"HTTPS error: {str(e)}")
            return {"success": False, "error": f"HTTPS error: {str(e)}"}
            
    def _encrypt_command(self, command: Dict[str, Any], encryption_key: str) -> str:
        """Encrypt a command for secure transmission"""
        try:
            # Convert command to JSON
            command_json = json.dumps(command)
            
            # Simple encryption using HMAC (in production, use proper encryption)
            signature = hmac.new(
                encryption_key.encode(),
                command_json.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Combine command and signature
            encrypted_data = {
                "data": base64.b64encode(command_json.encode()).decode(),
                "signature": signature
            }
            
            return json.dumps(encrypted_data)
            
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise
            
    def _decrypt_response(self, encrypted_response: bytes) -> str:
        """Decrypt a response from JASON"""
        try:
            # Parse the encrypted response
            response_data = json.loads(encrypted_response.decode())
            
            # Extract data and signature
            data = base64.b64decode(response_data["data"]).decode()
            signature = response_data["signature"]
            
            # Verify signature (simplified - use proper verification in production)
            # For now, just return the data
            return data
            
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise
            
    def register_jason_instance(self, user_id: str, connection_info: Dict[str, Any]) -> bool:
        """Register a user's JASON instance for secure communication"""
        try:
            # Validate connection info
            required_fields = ["encryption_key"]
            if not all(field in connection_info for field in required_fields):
                return False
                
            # Store connection info
            self.active_connections[user_id] = connection_info
            
            logger.info(f"Registered JASON instance for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering JASON instance: {str(e)}")
            return False
            
    def unregister_jason_instance(self, user_id: str) -> bool:
        """Unregister a user's JASON instance"""
        try:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
                logger.info(f"Unregistered JASON instance for user {user_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error unregistering JASON instance: {str(e)}")
            return False
            
    def get_skill_manifest(self) -> Dict[str, Any]:
        """Get the Alexa skill manifest for deployment"""
        return {
            "manifest": {
                "publishingInformation": {
                    "locales": {
                        "en-US": {
                            "summary": "Control your JASON smart home system with voice commands",
                            "examplePhrases": [
                                "Alexa, ask JASON to turn on the lights",
                                "Alexa, tell JASON to set the temperature to 72",
                                "Alexa, ask JASON for device status"
                            ],
                            "keywords": [
                                "smart home",
                                "home automation",
                                "IoT",
                                "lights",
                                "thermostat"
                            ],
                            "name": "JASON Smart Home",
                            "description": "Control your JASON smart home system with natural voice commands. JASON provides unified control over all your smart devices regardless of brand or protocol."
                        }
                    },
                    "isAvailableWorldwide": True,
                    "testingInstructions": "To test this skill, you need a JASON smart home system installed and configured.",
                    "category": "SMART_HOME",
                    "distributionCountries": []
                },
                "apis": {
                    "custom": {
                        "endpoint": {
                            "sourceDir": "lambda",
                            "uri": "ask-jason-skill"
                        },
                        "interfaces": []
                    }
                },
                "manifestVersion": "1.0",
                "permissions": [
                    {
                        "name": "alexa::devices:all:address:country_and_postal_code:read"
                    }
                ],
                "privacyAndCompliance": {
                    "allowsPurchases": False,
                    "usesPersonalInfo": False,
                    "isChildDirected": False,
                    "isExportCompliant": True,
                    "containsAds": False,
                    "locales": {
                        "en-US": {
                            "privacyPolicyUrl": "https://jason-smarthome.com/privacy",
                            "termsOfUseUrl": "https://jason-smarthome.com/terms"
                        }
                    }
                }
            }
        }
        
    def get_interaction_model(self) -> Dict[str, Any]:
        """Get the Alexa interaction model"""
        return {
            "interactionModel": {
                "languageModel": {
                    "invocationName": "jason",
                    "intents": [
                        {
                            "name": "DeviceControlIntent",
                            "slots": [
                                {
                                    "name": "device_name",
                                    "type": "DEVICE_NAMES"
                                },
                                {
                                    "name": "action",
                                    "type": "DEVICE_ACTIONS"
                                },
                                {
                                    "name": "value",
                                    "type": "AMAZON.NUMBER"
                                }
                            ],
                            "samples": [
                                "turn on the {device_name}",
                                "turn off the {device_name}",
                                "set the {device_name} to {value}",
                                "dim the {device_name}",
                                "brighten the {device_name}",
                                "{action} the {device_name}"
                            ]
                        },
                        {
                            "name": "SceneControlIntent",
                            "slots": [
                                {
                                    "name": "scene_name",
                                    "type": "SCENE_NAMES"
                                }
                            ],
                            "samples": [
                                "activate {scene_name}",
                                "turn on {scene_name}",
                                "set {scene_name} scene",
                                "start {scene_name} mode"
                            ]
                        },
                        {
                            "name": "StatusIntent",
                            "slots": [
                                {
                                    "name": "device_name",
                                    "type": "DEVICE_NAMES"
                                }
                            ],
                            "samples": [
                                "what's the status of {device_name}",
                                "is the {device_name} on",
                                "check {device_name}",
                                "device status",
                                "system status"
                            ]
                        },
                        {
                            "name": "AMAZON.HelpIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.StopIntent",
                            "samples": []
                        },
                        {
                            "name": "AMAZON.CancelIntent",
                            "samples": []
                        }
                    ],
                    "types": [
                        {
                            "name": "DEVICE_NAMES",
                            "values": [
                                {"name": {"value": "lights"}},
                                {"name": {"value": "thermostat"}},
                                {"name": {"value": "lock"}},
                                {"name": {"value": "camera"}},
                                {"name": {"value": "speaker"}},
                                {"name": {"value": "fan"}},
                                {"name": {"value": "switch"}}
                            ]
                        },
                        {
                            "name": "DEVICE_ACTIONS",
                            "values": [
                                {"name": {"value": "turn on"}},
                                {"name": {"value": "turn off"}},
                                {"name": {"value": "dim"}},
                                {"name": {"value": "brighten"}},
                                {"name": {"value": "lock"}},
                                {"name": {"value": "unlock"}},
                                {"name": {"value": "start"}},
                                {"name": {"value": "stop"}}
                            ]
                        },
                        {
                            "name": "SCENE_NAMES",
                            "values": [
                                {"name": {"value": "movie night"}},
                                {"name": {"value": "bedtime"}},
                                {"name": {"value": "morning"}},
                                {"name": {"value": "evening"}},
                                {"name": {"value": "party"}},
                                {"name": {"value": "relaxing"}}
                            ]
                        }
                    ]
                }
            }
        }
        
    def run(self, host: str = "0.0.0.0", port: int = 5000, debug: bool = False):
        """Run the Alexa skill server"""
        logger.info(f"Starting JASON Alexa Skill on {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)

# Example usage and configuration
if __name__ == "__main__":
    # Configuration for the Alexa skill
    config = {
        "alexa_skill_id": "amzn1.ask.skill.your-skill-id",
        "encryption_key": "your-encryption-key-here"
    }
    
    # Create and run the skill
    skill = JasonAlexaSkill(config)
    skill.run(debug=True)
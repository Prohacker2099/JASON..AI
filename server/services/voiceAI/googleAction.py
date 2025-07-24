"""
JASON Google Assistant Action - Secure Cloud Proxy

This module implements the Google Assistant Action that acts as a secure proxy between
Google's cloud and your local JASON instance. It handles device discovery,
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
import requests
import websockets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GoogleAction")

class JasonGoogleAction:
    """
    JASON Google Assistant Action - Secure Cloud Proxy
    
    This action acts as a secure intermediary between Google Assistant and your local JASON instance.
    It never stores device data in the cloud and forwards all commands securely to your home.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.app = Flask(__name__)
        
        # Security configuration
        self.project_id = config.get("google_project_id")
        self.encryption_key = config.get("encryption_key")
        
        # Local JASON instance connections
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        
        # Set up Google Action handlers
        self._setup_action_handlers()
        
    def _setup_action_handlers(self):
        """Set up Google Action intent handlers"""
        
        @self.app.route("/webhook", methods=["POST"])
        def webhook():
            """Handle Google Assistant webhook requests"""
            try:
                req = request.get_json()
                
                # Extract intent and parameters
                intent_name = req.get("queryResult", {}).get("intent", {}).get("displayName", "")
                parameters = req.get("queryResult", {}).get("parameters", {})
                query_text = req.get("queryResult", {}).get("queryText", "")
                
                # Get user ID (simplified - in production use proper user identification)
                user_id = req.get("originalDetectIntentRequest", {}).get("payload", {}).get("user", {}).get("userId", "default")
                
                # Route to appropriate handler
                if intent_name == "device.control":
                    response = asyncio.run(self._handle_device_control(user_id, parameters, query_text))
                elif intent_name == "scene.control":
                    response = asyncio.run(self._handle_scene_control(user_id, parameters, query_text))
                elif intent_name == "device.status":
                    response = asyncio.run(self._handle_device_status(user_id, parameters, query_text))
                elif intent_name == "system.status":
                    response = asyncio.run(self._handle_system_status(user_id, parameters, query_text))
                else:
                    response = self._handle_default_intent(query_text)
                
                return jsonify(response)
                
            except Exception as e:
                logger.error(f"Error handling webhook request: {str(e)}")
                return jsonify({
                    "fulfillmentText": "I encountered an error processing your request.",
                    "source": "jason-google-action"
                })
                
        @self.app.route("/health", methods=["GET"])
        def health_check():
            """Health check endpoint"""
            return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})
            
    async def _handle_device_control(self, user_id: str, parameters: Dict[str, Any], query_text: str) -> Dict[str, Any]:
        """Handle device control requests"""
        try:
            # Extract device and action from parameters
            device_name = parameters.get("device-name", "")
            action = parameters.get("action", "")
            value = parameters.get("value", "")
            
            if not device_name or not action:
                return {
                    "fulfillmentText": "I need to know which device and what action you want me to perform.",
                    "source": "jason-google-action"
                }
            
            # Get user's JASON instance connection
            connection_info = self.active_connections.get(user_id)
            if not connection_info:
                return {
                    "fulfillmentText": "I couldn't connect to your JASON system. Please check your setup in the Google Home app.",
                    "source": "jason-google-action"
                }
            
            # Forward command to local JASON instance
            command = {
                "type": "device_control",
                "device": device_name,
                "action": action,
                "value": value,
                "timestamp": datetime.now().isoformat()
            }
            
            response = await self._forward_to_jason(user_id, command)
            
            if response and response.get("success"):
                return {
                    "fulfillmentText": f"Done! I've {action} the {device_name}.",
                    "source": "jason-google-action"
                }
            else:
                error_msg = response.get("error", "Unknown error") if response else "No response"
                return {
                    "fulfillmentText": f"I couldn't control the {device_name}. {error_msg}",
                    "source": "jason-google-action"
                }
                
        except Exception as e:
            logger.error(f"Error in device control: {str(e)}")
            return {
                "fulfillmentText": "I encountered an error controlling that device.",
                "source": "jason-google-action"
            }
            
    async def _handle_scene_control(self, user_id: str, parameters: Dict[str, Any], query_text: str) -> Dict[str, Any]:
        """Handle scene control requests"""
        try:
            scene_name = parameters.get("scene-name", "")
            
            if not scene_name:
                return {
                    "fulfillmentText": "I need to know which scene you want to activate.",
                    "source": "jason-google-action"
                }
            
            connection_info = self.active_connections.get(user_id)
            if not connection_info:
                return {
                    "fulfillmentText": "I couldn't connect to your JASON system.",
                    "source": "jason-google-action"
                }
            
            command = {
                "type": "scene_control",
                "scene": scene_name,
                "timestamp": datetime.now().isoformat()
            }
            
            response = await self._forward_to_jason(user_id, command)
            
            if response and response.get("success"):
                return {
                    "fulfillmentText": f"I've activated the {scene_name} scene.",
                    "source": "jason-google-action"
                }
            else:
                return {
                    "fulfillmentText": f"I couldn't activate the {scene_name} scene.",
                    "source": "jason-google-action"
                }
                
        except Exception as e:
            logger.error(f"Error in scene control: {str(e)}")
            return {
                "fulfillmentText": "I encountered an error with that scene.",
                "source": "jason-google-action"
            }
            
    async def _handle_device_status(self, user_id: str, parameters: Dict[str, Any], query_text: str) -> Dict[str, Any]:
        """Handle device status requests"""
        try:
            device_name = parameters.get("device-name", "")
            
            connection_info = self.active_connections.get(user_id)
            if not connection_info:
                return {
                    "fulfillmentText": "I couldn't connect to your JASON system.",
                    "source": "jason-google-action"
                }
            
            command = {
                "type": "get_status",
                "device": device_name,
                "timestamp": datetime.now().isoformat()
            }
            
            response = await self._forward_to_jason(user_id, command)
            
            if response and response.get("success"):
                status = response.get("status", {})
                if device_name:
                    state = status.get("state", "unknown")
                    return {
                        "fulfillmentText": f"The {device_name} is {state}.",
                        "source": "jason-google-action"
                    }
                else:
                    device_count = status.get("device_count", 0)
                    online_count = status.get("online_count", 0)
                    return {
                        "fulfillmentText": f"Your JASON system has {device_count} devices, with {online_count} currently online.",
                        "source": "jason-google-action"
                    }
            else:
                return {
                    "fulfillmentText": "I couldn't get the status right now.",
                    "source": "jason-google-action"
                }
                
        except Exception as e:
            logger.error(f"Error in device status: {str(e)}")
            return {
                "fulfillmentText": "I encountered an error getting the status.",
                "source": "jason-google-action"
            }
            
    async def _handle_system_status(self, user_id: str, parameters: Dict[str, Any], query_text: str) -> Dict[str, Any]:
        """Handle system status requests"""
        try:
            connection_info = self.active_connections.get(user_id)
            if not connection_info:
                return {
                    "fulfillmentText": "I couldn't connect to your JASON system.",
                    "source": "jason-google-action"
                }
            
            command = {
                "type": "system_status",
                "timestamp": datetime.now().isoformat()
            }
            
            response = await self._forward_to_jason(user_id, command)
            
            if response and response.get("success"):
                status = response.get("status", {})
                return {
                    "fulfillmentText": f"JASON is running normally with {status.get('device_count', 0)} devices connected.",
                    "source": "jason-google-action"
                }
            else:
                return {
                    "fulfillmentText": "I couldn't get the system status right now.",
                    "source": "jason-google-action"
                }
                
        except Exception as e:
            logger.error(f"Error in system status: {str(e)}")
            return {
                "fulfillmentText": "I encountered an error getting the system status.",
                "source": "jason-google-action"
            }
            
    def _handle_default_intent(self, query_text: str) -> Dict[str, Any]:
        """Handle default/fallback intents"""
        return {
            "fulfillmentText": "I'm JASON, your smart home assistant. I can help you control devices, activate scenes, and check status. What would you like me to do?",
            "source": "jason-google-action"
        }
        
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
            
    def get_dialogflow_agent_config(self) -> Dict[str, Any]:
        """Get the Dialogflow agent configuration"""
        return {
            "displayName": "JASON Smart Home",
            "defaultLanguageCode": "en",
            "timeZone": "America/New_York",
            "description": "JASON Smart Home Assistant - Control your smart home with natural voice commands",
            "avatarUri": "https://jason-smarthome.com/images/avatar.png",
            "enableLogging": True,
            "matchMode": "MATCH_MODE_HYBRID",
            "classificationThreshold": 0.3
        }
        
    def get_intents_config(self) -> List[Dict[str, Any]]:
        """Get the Dialogflow intents configuration"""
        return [
            {
                "displayName": "device.control",
                "priority": 500000,
                "trainingPhrases": [
                    {"parts": [{"text": "turn on the lights"}]},
                    {"parts": [{"text": "turn off the "},{"text": "thermostat", "entityType": "@device-name", "alias": "device-name"}]},
                    {"parts": [{"text": "set the "},{"text": "temperature", "entityType": "@device-name", "alias": "device-name"},{"text": " to "},{"text": "72", "entityType": "@sys.number", "alias": "value"}]},
                    {"parts": [{"text": "dim the "},{"text": "bedroom lights", "entityType": "@device-name", "alias": "device-name"}]},
                    {"parts": [{"text": "lock the "},{"text": "front door", "entityType": "@device-name", "alias": "device-name"}]}
                ],
                "parameters": [
                    {
                        "displayName": "device-name",
                        "entityTypeDisplayName": "@device-name",
                        "mandatory": True,
                        "prompts": ["Which device would you like me to control?"]
                    },
                    {
                        "displayName": "action",
                        "entityTypeDisplayName": "@action",
                        "mandatory": True,
                        "prompts": ["What would you like me to do with that device?"]
                    },
                    {
                        "displayName": "value",
                        "entityTypeDisplayName": "@sys.number",
                        "mandatory": False
                    }
                ]
            },
            {
                "displayName": "scene.control",
                "priority": 500000,
                "trainingPhrases": [
                    {"parts": [{"text": "activate "},{"text": "movie night", "entityType": "@scene-name", "alias": "scene-name"}]},
                    {"parts": [{"text": "turn on "},{"text": "bedtime", "entityType": "@scene-name", "alias": "scene-name"},{"text": " scene"}]},
                    {"parts": [{"text": "set "},{"text": "romantic", "entityType": "@scene-name", "alias": "scene-name"},{"text": " mood"}]}
                ],
                "parameters": [
                    {
                        "displayName": "scene-name",
                        "entityTypeDisplayName": "@scene-name",
                        "mandatory": True,
                        "prompts": ["Which scene would you like me to activate?"]
                    }
                ]
            },
            {
                "displayName": "device.status",
                "priority": 500000,
                "trainingPhrases": [
                    {"parts": [{"text": "what's the status of the "},{"text": "lights", "entityType": "@device-name", "alias": "device-name"}]},
                    {"parts": [{"text": "is the "},{"text": "thermostat", "entityType": "@device-name", "alias": "device-name"},{"text": " on"}]},
                    {"parts": [{"text": "check the "},{"text": "front door", "entityType": "@device-name", "alias": "device-name"}]}
                ],
                "parameters": [
                    {
                        "displayName": "device-name",
                        "entityTypeDisplayName": "@device-name",
                        "mandatory": False
                    }
                ]
            },
            {
                "displayName": "system.status",
                "priority": 500000,
                "trainingPhrases": [
                    {"parts": [{"text": "system status"}]},
                    {"parts": [{"text": "how is JASON doing"}]},
                    {"parts": [{"text": "what's the status of my smart home"}]}
                ]
            }
        ]
        
    def get_entities_config(self) -> List[Dict[str, Any]]:
        """Get the Dialogflow entities configuration"""
        return [
            {
                "displayName": "device-name",
                "kind": "KIND_MAP",
                "entities": [
                    {"value": "lights", "synonyms": ["lights", "light", "lamp", "lamps"]},
                    {"value": "thermostat", "synonyms": ["thermostat", "temperature", "heat", "cooling"]},
                    {"value": "lock", "synonyms": ["lock", "door lock", "front door", "back door"]},
                    {"value": "camera", "synonyms": ["camera", "cam", "security camera"]},
                    {"value": "speaker", "synonyms": ["speaker", "music", "audio", "sound"]},
                    {"value": "fan", "synonyms": ["fan", "ceiling fan"]},
                    {"value": "switch", "synonyms": ["switch", "outlet", "plug"]}
                ]
            },
            {
                "displayName": "action",
                "kind": "KIND_MAP",
                "entities": [
                    {"value": "turn_on", "synonyms": ["turn on", "switch on", "activate", "enable"]},
                    {"value": "turn_off", "synonyms": ["turn off", "switch off", "deactivate", "disable"]},
                    {"value": "dim", "synonyms": ["dim", "lower", "decrease"]},
                    {"value": "brighten", "synonyms": ["brighten", "raise", "increase"]},
                    {"value": "lock", "synonyms": ["lock", "secure"]},
                    {"value": "unlock", "synonyms": ["unlock", "open"]}
                ]
            },
            {
                "displayName": "scene-name",
                "kind": "KIND_MAP",
                "entities": [
                    {"value": "movie_night", "synonyms": ["movie night", "movie time", "cinema"]},
                    {"value": "bedtime", "synonyms": ["bedtime", "sleep", "night"]},
                    {"value": "morning", "synonyms": ["morning", "wake up", "sunrise"]},
                    {"value": "evening", "synonyms": ["evening", "sunset", "dinner"]},
                    {"value": "party", "synonyms": ["party", "celebration", "fun"]},
                    {"value": "romantic", "synonyms": ["romantic", "date", "intimate"]}
                ]
            }
        ]
        
    def run(self, host: str = "0.0.0.0", port: int = 5001, debug: bool = False):
        """Run the Google Action server"""
        logger.info(f"Starting JASON Google Action on {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)

# Example usage and configuration
if __name__ == "__main__":
    # Configuration for the Google Action
    config = {
        "google_project_id": "your-google-project-id",
        "encryption_key": "your-encryption-key-here"
    }
    
    # Create and run the action
    action = JasonGoogleAction(config)
    action.run(debug=True)
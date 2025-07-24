#!/usr/bin/env python3
"""
JASON Alexa Skill - Secure Cloud Proxy

This is the minimal, secure cloud component that acts as a proxy between
Amazon's Alexa cloud and your local JASON instance. It ensures:

1. No device data stored in Amazon's cloud
2. Encrypted communication with local JASON
3. Privacy-first approach
4. Seamless Alexa integration

This Lambda function handles Alexa requests and forwards them securely
to your local JASON instance via encrypted WebSocket/MQTT.
"""

import json
import logging
import os
import asyncio
import websockets
import ssl
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class JasonAlexaSkill:
    """
    JASON Alexa Skill Handler
    
    This class handles all Alexa skill interactions and securely
    forwards them to the local JASON instance.
    """
    
    def __init__(self):
        self.skill_id = os.environ.get('ALEXA_SKILL_ID')
        self.jason_endpoint = os.environ.get('JASON_SECURE_ENDPOINT')
        self.encryption_key = os.environ.get('JASON_ENCRYPTION_KEY')
        
    def lambda_handler(self, event: Dict[str, Any], context) -> Dict[str, Any]:
        """
        Main Lambda handler for Alexa skill requests
        """
        try:
            # Verify this is a valid Alexa request
            if not self._verify_alexa_request(event):
                return self._build_error_response("Invalid request")
            
            # Extract request details
            request_type = event['request']['type']
            
            if request_type == "LaunchRequest":
                return self._handle_launch_request(event)
            elif request_type == "IntentRequest":
                return self._handle_intent_request(event)
            elif request_type == "SessionEndedRequest":
                return self._handle_session_ended_request(event)
            else:
                return self._build_error_response("Unknown request type")
                
        except Exception as e:
            logger.error(f"Error handling Alexa request: {str(e)}")
            return self._build_error_response("Internal error")
    
    def _verify_alexa_request(self, event: Dict[str, Any]) -> bool:
        """Verify this is a legitimate Alexa request"""
        try:
            # Check application ID
            if event.get('session', {}).get('application', {}).get('applicationId') != self.skill_id:
                return False
            
            # Additional security checks would go here
            # (timestamp validation, signature verification, etc.)
            
            return True
        except:
            return False
    
    def _handle_launch_request(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Alexa skill launch"""
        return self._build_response(
            "Hello! I'm JASON, your smart home assistant. How can I help you today?",
            "JASON Smart Home",
            should_end_session=False
        )
    
    def _handle_intent_request(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Alexa intent requests"""
        intent_name = event['request']['intent']['name']
        slots = event['request']['intent'].get('slots', {})
        
        # Extract user command
        user_command = self._extract_user_command(intent_name, slots)
        user_id = event['session']['user']['userId']
        
        # Forward to local JASON instance
        response_text = asyncio.run(self._forward_to_jason(user_command, user_id))
        
        return self._build_response(
            response_text,
            "JASON Response",
            should_end_session=True
        )
    
    def _handle_session_ended_request(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle session end"""
        return self._build_response("", "", should_end_session=True)
    
    def _extract_user_command(self, intent_name: str, slots: Dict[str, Any]) -> str:
        """Extract user command from Alexa intent and slots"""
        
        if intent_name == "DeviceControlIntent":
            action = slots.get('Action', {}).get('value', '')
            device = slots.get('Device', {}).get('value', '')
            room = slots.get('Room', {}).get('value', '')
            
            command = f"{action} {device}"
            if room:
                command += f" in the {room}"
            return command
            
        elif intent_name == "HomeStatusIntent":
            return "what's the status of my home"
            
        elif intent_name == "SecurityCheckIntent":
            return "check security"
            
        elif intent_name == "AMAZON.HelpIntent":
            return "help"
            
        elif intent_name == "AMAZON.StopIntent" or intent_name == "AMAZON.CancelIntent":
            return "stop"
            
        else:
            # For custom intents, try to reconstruct the original utterance
            return self._reconstruct_utterance(intent_name, slots)
    
    def _reconstruct_utterance(self, intent_name: str, slots: Dict[str, Any]) -> str:
        """Reconstruct user utterance from intent and slots"""
        # This is a simplified reconstruction
        # In practice, you'd have more sophisticated logic
        
        slot_values = []
        for slot_name, slot_data in slots.items():
            if 'value' in slot_data:
                slot_values.append(slot_data['value'])
        
        return " ".join(slot_values) if slot_values else intent_name
    
    async def _forward_to_jason(self, command: str, user_id: str) -> str:
        """
        Securely forward command to local JASON instance
        """
        try:
            # Create secure WebSocket connection to local JASON
            ssl_context = ssl.create_default_context()
            
            # Prepare encrypted message
            message = {
                'type': 'alexa_command',
                'command': command,
                'user_id': self._anonymize_user_id(user_id),
                'timestamp': datetime.now().isoformat(),
                'source': 'alexa_skill'
            }
            
            # Connect to local JASON instance
            async with websockets.connect(
                self.jason_endpoint,
                ssl=ssl_context,
                extra_headers={'Authorization': f'Bearer {self.encryption_key}'}
            ) as websocket:
                
                # Send command
                await websocket.send(json.dumps(message))
                
                # Wait for response
                response = await websocket.recv()
                response_data = json.loads(response)
                
                return response_data.get('response', 'I processed your request.')
                
        except Exception as e:
            logger.error(f"Error forwarding to JASON: {str(e)}")
            return "I'm having trouble connecting to your home system right now. Please try again later."
    
    def _anonymize_user_id(self, user_id: str) -> str:
        """Anonymize Alexa user ID for privacy"""
        # Hash the user ID to create an anonymous identifier
        import hashlib
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    def _build_response(self, speech_text: str, card_title: str, should_end_session: bool = True) -> Dict[str, Any]:
        """Build Alexa skill response"""
        return {
            'version': '1.0',
            'sessionAttributes': {},
            'response': {
                'outputSpeech': {
                    'type': 'PlainText',
                    'text': speech_text
                },
                'card': {
                    'type': 'Simple',
                    'title': card_title,
                    'content': speech_text
                },
                'shouldEndSession': should_end_session
            }
        }
    
    def _build_error_response(self, error_message: str) -> Dict[str, Any]:
        """Build error response"""
        return self._build_response(
            "I'm sorry, I encountered an error. Please try again.",
            "Error",
            should_end_session=True
        )

# Lambda function entry point
jason_skill = JasonAlexaSkill()

def lambda_handler(event, context):
    """AWS Lambda entry point"""
    return jason_skill.lambda_handler(event, context)
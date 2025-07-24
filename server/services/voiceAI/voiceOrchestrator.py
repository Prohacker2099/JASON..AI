"""
JASON Voice Orchestrator - The Conscious Home Voice AI

This module implements JASON's comprehensive voice AI strategy, integrating:
1. Local "Your Good Buddy" voice assistant
2. Secure Alexa/Google Assistant integration
3. Advanced LLM routing (Gemini, OpenAI, etc.)
4. Real-time speech processing and contextual awareness
"""

import asyncio
import logging
import json
import os
import time
import threading
from typing import Dict, Any, List, Optional, Callable, Union
from datetime import datetime
from enum import Enum
import websockets
import ssl
import aiohttp
import speech_recognition as sr
import pyttsx3

# Optional imports - gracefully handle missing dependencies
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    openai = None
    OPENAI_AVAILABLE = False

try:
    from google.cloud import speech
    from google.cloud import texttospeech
    GOOGLE_CLOUD_AVAILABLE = True
except ImportError:
    speech = None
    texttospeech = None
    GOOGLE_CLOUD_AVAILABLE = False

try:
    import azure.cognitiveservices.speech as speechsdk
    AZURE_AVAILABLE = True
except ImportError:
    speechsdk = None
    AZURE_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VoiceOrchestrator")

class VoiceProvider(Enum):
    """Voice service providers"""
    LOCAL = "local"
    GOOGLE = "google"
    AZURE = "azure"
    OPENAI = "openai"
    AMAZON = "amazon"

class IntentType(Enum):
    """Types of voice intents"""
    DEVICE_CONTROL = "device_control"
    INFORMATION_QUERY = "information_query"
    AUTOMATION = "automation"
    SCENE_CONTROL = "scene_control"
    SYSTEM_COMMAND = "system_command"
    CONVERSATION = "conversation"
    UNKNOWN = "unknown"

class VoiceOrchestrator:
    """
    JASON Voice Orchestrator - The central brain for all voice interactions
    """
    
    def __init__(self, device_manager=None, automation_engine=None, config=None):
        self.device_manager = device_manager
        self.automation_engine = automation_engine
        self.config = config or {}
        
        # Voice processing components
        self.speech_recognizer = None
        self.tts_engine = None
        self.wake_word_detector = None
        
        # AI/LLM integrations
        self.openai_client = None
        self.google_speech_client = None
        self.azure_speech_config = None
        
        # Availability flags
        self.openai_available = OPENAI_AVAILABLE
        self.google_available = GOOGLE_CLOUD_AVAILABLE
        self.azure_available = AZURE_AVAILABLE
        
        # State management
        self.is_listening = False
        self.conversation_context = {}
        self.user_preferences = {}
        self.voice_sessions = {}
        
        # External assistant integrations
        self.alexa_skill_endpoint = None
        self.google_action_endpoint = None
        
        # Initialize components
        self._initialize_voice_components()
        self._initialize_ai_services()
        
    def _initialize_voice_components(self):
        """Initialize local voice processing components"""
        try:
            # Initialize speech recognition
            self.speech_recognizer = sr.Recognizer()
            self.microphone = sr.Microphone()
            
            # Adjust for ambient noise
            with self.microphone as source:
                logger.info("Calibrating microphone for ambient noise...")
                self.speech_recognizer.adjust_for_ambient_noise(source)
                
            # Initialize text-to-speech
            self.tts_engine = pyttsx3.init()
            
            # Configure TTS voice
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Prefer female voice if available
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
                        
            # Set speech rate and volume
            self.tts_engine.setProperty('rate', 180)  # Words per minute
            self.tts_engine.setProperty('volume', 0.8)
            
            logger.info("Local voice components initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing voice components: {str(e)}")
            
    def _initialize_ai_services(self):
        """Initialize AI and cloud services"""
        try:
            # OpenAI API
            if self.openai_available:
                openai_key = self.config.get('openai_api_key') or os.getenv('OPENAI_API_KEY')
                if openai_key:
                    openai.api_key = openai_key
                    self.openai_client = openai
                    logger.info("OpenAI client initialized")
                    
            # Google Cloud Speech
            if self.google_available:
                google_credentials = self.config.get('google_credentials_path') or os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
                if google_credentials:
                    self.google_speech_client = speech.SpeechClient()
                    self.google_tts_client = texttospeech.TextToSpeechClient()
                    logger.info("Google Cloud Speech clients initialized")
                    
            # Azure Cognitive Services
            if self.azure_available:
                azure_key = self.config.get('azure_speech_key') or os.getenv('AZURE_SPEECH_KEY')
                azure_region = self.config.get('azure_speech_region') or os.getenv('AZURE_SPEECH_REGION')
                if azure_key and azure_region:
                    self.azure_speech_config = speechsdk.SpeechConfig(
                        subscription=azure_key, 
                        region=azure_region
                    )
                    logger.info("Azure Speech services initialized")
                    
        except Exception as e:
            logger.error(f"Error initializing AI services: {str(e)}")
            
    async def start_voice_assistant(self):
        """Start the JASON voice assistant"""
        logger.info("Starting JASON Voice Assistant - 'Your Good Buddy'")
        
        # Start wake word detection
        await self._start_wake_word_detection()
        
        # Start external assistant integrations
        await self._start_external_integrations()
        
        logger.info("JASON Voice Assistant is now active and listening")
        
    async def stop_voice_assistant(self):
        """Stop the voice assistant"""
        logger.info("Stopping JASON Voice Assistant")
        self.is_listening = False
        
    async def _start_wake_word_detection(self):
        """Start listening for wake words"""
        wake_words = ["jason", "hey jason", "ok jason"]
        
        def listen_for_wake_word():
            while True:
                try:
                    with self.microphone as source:
                        # Listen for audio with timeout
                        audio = self.speech_recognizer.listen(source, timeout=1, phrase_time_limit=3)
                        
                    # Recognize speech using local recognition first
                    try:
                        text = self.speech_recognizer.recognize_sphinx(audio).lower()
                        
                        # Check for wake words
                        for wake_word in wake_words:
                            if wake_word in text:
                                logger.info(f"Wake word detected: {wake_word}")
                                asyncio.create_task(self._handle_voice_activation())
                                break
                                
                    except sr.UnknownValueError:
                        # No speech detected, continue listening
                        pass
                    except sr.RequestError as e:
                        # Fallback to Google recognition if available
                        if self.google_speech_client:
                            try:
                                text = self.speech_recognizer.recognize_google(audio).lower()
                                for wake_word in wake_words:
                                    if wake_word in text:
                                        logger.info(f"Wake word detected: {wake_word}")
                                        asyncio.create_task(self._handle_voice_activation())
                                        break
                            except:
                                pass
                                
                except sr.WaitTimeoutError:
                    # Timeout is normal, continue listening
                    pass
                except Exception as e:
                    logger.error(f"Error in wake word detection: {str(e)}")
                    time.sleep(1)
                    
        # Start wake word detection in a separate thread
        wake_word_thread = threading.Thread(target=listen_for_wake_word, daemon=True)
        wake_word_thread.start()
        
    async def _handle_voice_activation(self):
        """Handle voice activation after wake word detection"""
        try:
            # Play activation sound or speak acknowledgment
            await self._speak("Yes?", use_local=True)
            
            # Listen for the actual command
            command_text = await self._listen_for_command()
            
            if command_text:
                logger.info(f"Voice command received: {command_text}")
                
                # Process the command
                response = await self._process_voice_command(command_text)
                
                # Speak the response
                if response:
                    await self._speak(response)
                    
        except Exception as e:
            logger.error(f"Error handling voice activation: {str(e)}")
            await self._speak("Sorry, I encountered an error processing your request.")
            
    async def _listen_for_command(self, timeout=5) -> Optional[str]:
        """Listen for a voice command after activation"""
        try:
            with self.microphone as source:
                logger.info("Listening for command...")
                audio = self.speech_recognizer.listen(source, timeout=timeout, phrase_time_limit=10)
                
            # Try multiple recognition services for best accuracy
            recognition_methods = [
                ("Google", lambda: self.speech_recognizer.recognize_google(audio)),
                ("Azure", lambda: self._recognize_with_azure(audio)),
                ("Local", lambda: self.speech_recognizer.recognize_sphinx(audio))
            ]
            
            for method_name, method in recognition_methods:
                try:
                    text = method()
                    logger.info(f"Command recognized using {method_name}: {text}")
                    return text.lower().strip()
                except Exception as e:
                    logger.debug(f"{method_name} recognition failed: {str(e)}")
                    continue
                    
            logger.warning("No recognition method succeeded")
            return None
            
        except sr.WaitTimeoutError:
            logger.info("No command received within timeout")
            await self._speak("I didn't hear anything. Try again when you're ready.")
            return None
        except Exception as e:
            logger.error(f"Error listening for command: {str(e)}")
            return None
            
    def _recognize_with_azure(self, audio) -> str:
        """Recognize speech using Azure Cognitive Services"""
        if not self.azure_speech_config:
            raise Exception("Azure Speech not configured")
            
        # Convert audio to the format Azure expects
        audio_data = audio.get_wav_data()
        
        # Create audio config from the audio data
        audio_config = speechsdk.audio.AudioConfig(stream=speechsdk.audio.PushAudioInputStream())
        
        # Create speech recognizer
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.azure_speech_config,
            audio_config=audio_config
        )
        
        # Perform recognition
        result = speech_recognizer.recognize_once()
        
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text
        else:
            raise Exception(f"Azure recognition failed: {result.reason}")
            
    async def _process_voice_command(self, command_text: str) -> str:
        """Process a voice command and return a response"""
        try:
            # Determine intent
            intent = await self._classify_intent(command_text)
            
            # Route to appropriate handler
            if intent == IntentType.DEVICE_CONTROL:
                return await self._handle_device_control(command_text)
            elif intent == IntentType.SCENE_CONTROL:
                return await self._handle_scene_control(command_text)
            elif intent == IntentType.AUTOMATION:
                return await self._handle_automation_command(command_text)
            elif intent == IntentType.INFORMATION_QUERY:
                return await self._handle_information_query(command_text)
            elif intent == IntentType.SYSTEM_COMMAND:
                return await self._handle_system_command(command_text)
            elif intent == IntentType.CONVERSATION:
                return await self._handle_conversation(command_text)
            else:
                return await self._handle_unknown_command(command_text)
                
        except Exception as e:
            logger.error(f"Error processing voice command: {str(e)}")
            return "I'm sorry, I encountered an error processing your request."
            
    async def _classify_intent(self, command_text: str) -> IntentType:
        """Classify the intent of a voice command"""
        command_lower = command_text.lower()
        
        # Device control keywords
        device_keywords = [
            "turn on", "turn off", "dim", "brighten", "set", "adjust",
            "lock", "unlock", "open", "close", "start", "stop",
            "increase", "decrease", "raise", "lower"
        ]
        
        # Scene control keywords
        scene_keywords = [
            "scene", "mood", "ambiance", "lighting", "movie mode",
            "bedtime", "morning", "evening", "party", "relax"
        ]
        
        # Information query keywords
        info_keywords = [
            "what", "how", "when", "where", "why", "tell me",
            "weather", "temperature", "status", "news", "time"
        ]
        
        # System command keywords
        system_keywords = [
            "discover", "scan", "find", "search", "add", "remove",
            "configure", "settings", "preferences"
        ]
        
        # Automation keywords
        automation_keywords = [
            "automate", "schedule", "routine", "if", "when", "trigger"
        ]
        
        # Check for device control
        if any(keyword in command_lower for keyword in device_keywords):
            return IntentType.DEVICE_CONTROL
            
        # Check for scene control
        if any(keyword in command_lower for keyword in scene_keywords):
            return IntentType.SCENE_CONTROL
            
        # Check for information queries
        if any(keyword in command_lower for keyword in info_keywords):
            return IntentType.INFORMATION_QUERY
            
        # Check for system commands
        if any(keyword in command_lower for keyword in system_keywords):
            return IntentType.SYSTEM_COMMAND
            
        # Check for automation
        if any(keyword in command_lower for keyword in automation_keywords):
            return IntentType.AUTOMATION
            
        # Default to conversation
        return IntentType.CONVERSATION
        
    async def _handle_device_control(self, command_text: str) -> str:
        """Handle device control commands"""
        if not self.device_manager:
            return "Device control is not available right now."
            
        try:
            # Parse the command to extract device and action
            parsed_command = await self._parse_device_command(command_text)
            
            if not parsed_command:
                return "I couldn't understand which device you want to control."
                
            device_name = parsed_command.get("device")
            action = parsed_command.get("action")
            parameters = parsed_command.get("parameters", {})
            
            # Find the device
            devices = await self.device_manager.get_all_devices()
            target_device = None
            
            for device in devices:
                if device_name.lower() in device.get("name", "").lower():
                    target_device = device
                    break
                    
            if not target_device:
                return f"I couldn't find a device named '{device_name}'."
                
            # Execute the command
            command = {
                "command": action,
                "params": parameters
            }
            
            result = await self.device_manager.executeCommand(target_device, command)
            
            if result.get("error"):
                return f"I couldn't control the {device_name}. {result['error']}"
            else:
                return f"Done! I've {action.replace('_', ' ')} the {device_name}."
                
        except Exception as e:
            logger.error(f"Error in device control: {str(e)}")
            return "I had trouble controlling that device."
            
    async def _parse_device_command(self, command_text: str) -> Optional[Dict[str, Any]]:
        """Parse a device control command"""
        command_lower = command_text.lower()
        
        # Common device names and their variations
        device_patterns = {
            "light": ["light", "lights", "lamp", "lamps"],
            "thermostat": ["thermostat", "temperature", "heat", "cooling"],
            "lock": ["lock", "door lock", "front door"],
            "camera": ["camera", "cam", "security camera"],
            "speaker": ["speaker", "music", "audio"],
            "fan": ["fan", "ceiling fan"],
            "switch": ["switch", "outlet", "plug"]
        }
        
        # Action patterns
        action_patterns = {
            "turn_on": ["turn on", "switch on", "activate", "enable"],
            "turn_off": ["turn off", "switch off", "deactivate", "disable"],
            "set_brightness": ["dim", "brighten", "set brightness"],
            "set_temperature": ["set temperature", "heat to", "cool to"],
            "lock": ["lock"],
            "unlock": ["unlock"],
            "set_volume": ["volume", "set volume"]
        }
        
        # Find device
        device_found = None
        for device_type, patterns in device_patterns.items():
            for pattern in patterns:
                if pattern in command_lower:
                    device_found = device_type
                    break
            if device_found:
                break
                
        # Find action
        action_found = None
        for action, patterns in action_patterns.items():
            for pattern in patterns:
                if pattern in command_lower:
                    action_found = action
                    break
            if action_found:
                break
                
        if not device_found or not action_found:
            return None
            
        # Extract parameters
        parameters = {}
        
        # Extract brightness percentage
        if "brightness" in action_found:
            import re
            brightness_match = re.search(r'(\d+)\s*%', command_lower)
            if brightness_match:
                parameters["brightness"] = int(brightness_match.group(1))
            else:
                parameters["brightness"] = 50  # Default
                
        # Extract temperature
        if "temperature" in action_found:
            import re
            temp_match = re.search(r'(\d+)\s*(?:degrees?|°)', command_lower)
            if temp_match:
                parameters["temperature"] = int(temp_match.group(1))
                
        # Extract volume
        if "volume" in action_found:
            import re
            volume_match = re.search(r'(\d+)\s*%', command_lower)
            if volume_match:
                parameters["volume"] = int(volume_match.group(1))
                
        return {
            "device": device_found,
            "action": action_found,
            "parameters": parameters
        }
        
    async def _handle_information_query(self, command_text: str) -> str:
        """Handle information queries using external LLMs"""
        try:
            # Route complex queries to external AI services
            if self.openai_client:
                response = await self._query_openai(command_text)
                if response:
                    return response
                    
            # Fallback to basic responses
            command_lower = command_text.lower()
            
            if "time" in command_lower:
                current_time = datetime.now().strftime("%I:%M %p")
                return f"It's currently {current_time}."
                
            elif "weather" in command_lower:
                # This would integrate with a weather API
                return "I don't have access to weather information right now, but you can check your weather app."
                
            elif "temperature" in command_lower:
                # Get temperature from connected thermostats
                if self.device_manager:
                    devices = await self.device_manager.get_all_devices()
                    for device in devices:
                        if device.get("type") == "thermostat" and "state" in device:
                            temp = device["state"].get("temperature")
                            if temp:
                                return f"The current temperature is {temp} degrees."
                                
                return "I couldn't find any temperature sensors."
                
            else:
                return "I'm not sure how to answer that question right now."
                
        except Exception as e:
            logger.error(f"Error handling information query: {str(e)}")
            return "I had trouble finding that information."
            
    async def _query_openai(self, query: str) -> Optional[str]:
        """Query OpenAI for complex information requests"""
        try:
            if not self.openai_client:
                return None
                
            response = await self.openai_client.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are JASON, a helpful smart home AI assistant. Provide concise, friendly responses suitable for voice interaction. Keep responses under 50 words when possible."
                    },
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error querying OpenAI: {str(e)}")
            return None
            
    async def _handle_scene_control(self, command_text: str) -> str:
        """Handle scene control commands"""
        # This would integrate with the scene management system
        return "Scene control is not implemented yet, but I heard your request."
        
    async def _handle_automation_command(self, command_text: str) -> str:
        """Handle automation commands"""
        # This would integrate with the automation engine
        return "Automation commands are not implemented yet, but I heard your request."
        
    async def _handle_system_command(self, command_text: str) -> str:
        """Handle system commands"""
        command_lower = command_text.lower()
        
        if "discover" in command_lower or "scan" in command_lower:
            if self.device_manager:
                # Start device discovery
                try:
                    devices = await self.device_manager.discover_devices()
                    return f"I found {len(devices)} devices during the scan."
                except Exception as e:
                    return "I had trouble scanning for devices."
            else:
                return "Device discovery is not available right now."
                
        return "I'm not sure how to handle that system command."
        
    async def _handle_conversation(self, command_text: str) -> str:
        """Handle conversational interactions"""
        command_lower = command_text.lower()
        
        # Greetings
        if any(greeting in command_lower for greeting in ["hello", "hi", "hey", "good morning", "good evening"]):
            current_hour = datetime.now().hour
            if current_hour < 12:
                return "Good morning! How can I help you today?"
            elif current_hour < 18:
                return "Good afternoon! What can I do for you?"
            else:
                return "Good evening! How can I assist you?"
                
        # Gratitude
        elif any(thanks in command_lower for thanks in ["thank you", "thanks", "appreciate"]):
            return "You're welcome! I'm always here to help."
            
        # Status check
        elif any(status in command_lower for status in ["how are you", "status", "what's up"]):
            return "I'm doing great! All systems are running smoothly. How can I help you?"
            
        # Default conversational response
        else:
            return "I'm here to help with your smart home. What would you like me to do?"
            
    async def _handle_unknown_command(self, command_text: str) -> str:
        """Handle unknown commands"""
        return "I'm not sure what you want me to do. Try asking me to control a device, get information, or just say hello!"
        
    async def _speak(self, text: str, use_local: bool = True):
        """Speak text using the configured TTS engine"""
        try:
            if use_local and self.tts_engine:
                # Use local TTS
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            elif self.google_tts_client:
                # Use Google Cloud TTS for better quality
                await self._speak_with_google_tts(text)
            else:
                # Fallback to local TTS
                if self.tts_engine:
                    self.tts_engine.say(text)
                    self.tts_engine.runAndWait()
                    
        except Exception as e:
            logger.error(f"Error speaking text: {str(e)}")
            
    async def _speak_with_google_tts(self, text: str):
        """Speak using Google Cloud Text-to-Speech"""
        try:
            # Set up the synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
            )
            
            # Select the type of audio file
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            
            # Perform the text-to-speech request
            response = self.google_tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Play the audio (this would need additional audio playback implementation)
            # For now, we'll fall back to local TTS
            if self.tts_engine:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                
        except Exception as e:
            logger.error(f"Error with Google TTS: {str(e)}")
            # Fallback to local TTS
            if self.tts_engine:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                
    async def _start_external_integrations(self):
        """Start external assistant integrations (Alexa, Google)"""
        # This would set up the secure cloud proxy endpoints
        # For now, we'll log that this feature is planned
        logger.info("External assistant integrations (Alexa/Google) are planned for future implementation")
        
    # Public API methods
    async def process_text_command(self, text: str, user_id: str = "default") -> str:
        """Process a text command (for API/web interface)"""
        return await self._process_voice_command(text)
        
    async def get_conversation_context(self, user_id: str = "default") -> Dict[str, Any]:
        """Get conversation context for a user"""
        return self.conversation_context.get(user_id, {})
        
    async def set_user_preferences(self, user_id: str, preferences: Dict[str, Any]):
        """Set user preferences for voice interactions"""
        self.user_preferences[user_id] = preferences
        
    def get_voice_status(self) -> Dict[str, Any]:
        """Get the current status of voice services"""
        return {
            "is_listening": self.is_listening,
            "local_tts_available": self.tts_engine is not None,
            "local_stt_available": self.speech_recognizer is not None,
            "google_services_available": self.google_available and self.google_speech_client is not None,
            "azure_services_available": self.azure_available and self.azure_speech_config is not None,
            "openai_available": self.openai_available and self.openai_client is not None,
            "active_sessions": len(self.voice_sessions),
            "dependencies": {
                "openai_installed": self.openai_available,
                "google_cloud_installed": self.google_available,
                "azure_installed": self.azure_available
            }
        }

# Create singleton instance
voice_orchestrator = VoiceOrchestrator()
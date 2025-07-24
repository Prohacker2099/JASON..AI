import autogen
from typing import Dict, Any, List, Optional

class NLPAgent:
    def __init__(self, config: Dict[str, Any]):
        self.agent = autogen.AssistantAgent(
            name="NLP_Agent",
            system_message="""You are a natural language processing specialist for smart home automation. You:
            1. Parse and understand user commands and intents
            2. Extract key information from natural language
            3. Identify devices, actions, and parameters
            4. Handle context and ambiguity resolution""",
            llm_config=config
        )
        
    def parse_command(self, text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Parse natural language command into structured format"""
        try:
            # Extract intent and entities
            intent = self._identify_intent(text)
            entities = self._extract_entities(text)
            
            # Build command structure
            command = {
                "intent": intent,
                "entities": entities,
                "original_text": text,
                "confidence": self._calculate_confidence(text, intent, entities),
                "requires_confirmation": self._needs_confirmation(intent, entities),
                "context": context
            }
            
            # Add device targeting if present
            if "device" in entities:
                command["target_device"] = entities["device"]
                
            # Add action parameters if present
            if "parameters" in entities:
                command["parameters"] = entities["parameters"]
                
            return {
                "success": True,
                "command": command
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _identify_intent(self, text: str) -> str:
        """Identify the primary intent of the command"""
        # Basic intent mapping
        intents = {
            "turn on": "device_control",
            "turn off": "device_control",
            "set": "device_control",
            "adjust": "device_control",
            "create": "automation",
            "schedule": "automation",
            "show": "query",
            "what is": "query",
            "activate": "scene",
            "run": "scene"
        }
        
        text_lower = text.lower()
        for keyword, intent in intents.items():
            if keyword in text_lower:
                return intent
                
        return "unknown"
    
    def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract relevant entities from the command"""
        entities = {}
        
        # Extract device information
        devices = self._find_devices(text)
        if devices:
            entities["device"] = devices
            
        # Extract parameters
        parameters = self._find_parameters(text)
        if parameters:
            entities["parameters"] = parameters
            
        # Extract location/room information
        location = self._find_location(text)
        if location:
            entities["location"] = location
            
        # Extract time information
        time_info = self._find_time(text)
        if time_info:
            entities["time"] = time_info
            
        return entities
    
    def _find_devices(self, text: str) -> List[Dict[str, Any]]:
        """Find device references in text"""
        devices = []
        # Common device keywords
        device_types = ["light", "thermostat", "switch", "lock", "camera", "sensor"]
        
        text_lower = text.lower()
        for device_type in device_types:
            if device_type in text_lower:
                devices.append({
                    "type": device_type,
                    "name": self._extract_device_name(text, device_type)
                })
                
        return devices
    
    def _find_parameters(self, text: str) -> Dict[str, Any]:
        """Extract command parameters"""
        params = {}
        
        # Extract numeric values
        import re
        numbers = re.findall(r'\d+(?:\.\d+)?', text)
        if numbers:
            params["value"] = float(numbers[0])
            
        # Extract states
        states = ["on", "off", "open", "closed", "locked", "unlocked"]
        text_lower = text.lower()
        for state in states:
            if state in text_lower:
                params["state"] = state
                break
                
        # Extract colors
        colors = ["red", "green", "blue", "white", "warm", "cool"]
        for color in colors:
            if color in text_lower:
                params["color"] = color
                break
                
        return params
    
    def _find_location(self, text: str) -> Optional[str]:
        """Extract location/room information"""
        # Common room names
        rooms = ["living room", "bedroom", "kitchen", "bathroom", "office"]
        
        text_lower = text.lower()
        for room in rooms:
            if room in text_lower:
                return room
                
        return None
    
    def _find_time(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract time-related information"""
        import re
        time_info = {}
        
        # Time patterns
        time_pattern = r'(\d{1,2}):?(\d{2})?\s*(am|pm)?'
        matches = re.findall(time_pattern, text, re.IGNORECASE)
        
        if matches:
            hour, minute, meridian = matches[0]
            time_info["hour"] = int(hour)
            time_info["minute"] = int(minute) if minute else 0
            time_info["meridian"] = meridian.lower() if meridian else None
            
        return time_info if time_info else None
    
    def _extract_device_name(self, text: str, device_type: str) -> Optional[str]:
        """Extract specific device name"""
        # Look for possessive or descriptive phrases
        import re
        pattern = f"(?:the|my)?\s*([a-z]+\s+)?{device_type}"
        matches = re.findall(pattern, text.lower())
        
        if matches and matches[0]:
            return matches[0].strip()
            
        return None
    
    def _calculate_confidence(self, text: str, intent: str, entities: Dict[str, Any]) -> float:
        """Calculate confidence score for the parsing"""
        confidence = 0.0
        
        # Base confidence from intent recognition
        if intent != "unknown":
            confidence += 0.4
            
        # Additional confidence from entity extraction
        if entities:
            confidence += 0.3 * (len(entities) / 4)  # Normalize by expected entity types
            
        # Confidence from command completeness
        if "device" in entities and "parameters" in entities:
            confidence += 0.3
            
        return min(confidence, 1.0)
    
    def _needs_confirmation(self, intent: str, entities: Dict[str, Any]) -> bool:
        """Determine if command needs user confirmation"""
        # Always confirm critical actions
        critical_intents = ["device_control", "scene"]
        critical_devices = ["lock", "security", "alarm"]
        
        if intent in critical_intents:
            return True
            
        if "device" in entities:
            for device in entities["device"]:
                if device["type"] in critical_devices:
                    return True
                    
        return False

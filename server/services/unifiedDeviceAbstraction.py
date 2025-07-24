"""
Unified Device Abstraction Layer

This module provides a consistent interface for all devices regardless of their underlying protocol.
It normalizes device capabilities, states, and commands into a unified model.
"""

from typing import Dict, Any, List, Optional, Set, Callable, Tuple
import logging
import json
from enum import Enum
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("UnifiedDeviceAbstraction")

class DeviceCategory(Enum):
    """High-level device categories"""
    LIGHTING = "lighting"
    CLIMATE = "climate"
    SECURITY = "security"
    ENTERTAINMENT = "entertainment"
    APPLIANCE = "appliance"
    SENSOR = "sensor"
    ENERGY = "energy"
    CONTROL = "control"
    OTHER = "other"

class StandardCapability(Enum):
    """Standardized device capabilities"""
    POWER = "power"                      # On/off control
    BRIGHTNESS = "brightness"            # Brightness control (0-100%)
    COLOR = "color"                      # Color control (HSV)
    COLOR_TEMPERATURE = "color_temp"     # Color temperature (Kelvin)
    TEMPERATURE = "temperature"          # Temperature sensing
    HUMIDITY = "humidity"                # Humidity sensing
    MOTION = "motion"                    # Motion detection
    PRESENCE = "presence"                # Presence detection
    CONTACT = "contact"                  # Contact sensing (open/closed)
    LOCK = "lock"                        # Lock control
    THERMOSTAT = "thermostat"            # Temperature control
    MEDIA_PLAYBACK = "media_playback"    # Media playback control
    VOLUME = "volume"                    # Volume control
    BATTERY = "battery"                  # Battery level
    ENERGY_MONITORING = "energy"         # Energy usage monitoring
    POSITION = "position"                # Position control (e.g., blinds)
    SPEED = "speed"                      # Speed control (e.g., fans)
    WATER = "water"                      # Water sensing
    SMOKE = "smoke"                      # Smoke detection
    AIR_QUALITY = "air_quality"          # Air quality sensing
    CAMERA = "camera"                    # Camera functions

class DeviceType:
    """Mapping between device types and their standard capabilities"""
    
    # Standard device types and their expected capabilities
    DEVICE_TYPES = {
        "light": {
            "category": DeviceCategory.LIGHTING,
            "capabilities": [StandardCapability.POWER],
            "optional_capabilities": [
                StandardCapability.BRIGHTNESS,
                StandardCapability.COLOR,
                StandardCapability.COLOR_TEMPERATURE
            ]
        },
        "switch": {
            "category": DeviceCategory.CONTROL,
            "capabilities": [StandardCapability.POWER],
            "optional_capabilities": [StandardCapability.ENERGY_MONITORING]
        },
        "outlet": {
            "category": DeviceCategory.ENERGY,
            "capabilities": [StandardCapability.POWER],
            "optional_capabilities": [StandardCapability.ENERGY_MONITORING]
        },
        "thermostat": {
            "category": DeviceCategory.CLIMATE,
            "capabilities": [StandardCapability.THERMOSTAT, StandardCapability.TEMPERATURE],
            "optional_capabilities": [StandardCapability.HUMIDITY]
        },
        "sensor": {
            "category": DeviceCategory.SENSOR,
            "capabilities": [],
            "optional_capabilities": [
                StandardCapability.TEMPERATURE,
                StandardCapability.HUMIDITY,
                StandardCapability.MOTION,
                StandardCapability.PRESENCE,
                StandardCapability.CONTACT,
                StandardCapability.WATER,
                StandardCapability.SMOKE,
                StandardCapability.AIR_QUALITY,
                StandardCapability.BATTERY
            ]
        },
        "lock": {
            "category": DeviceCategory.SECURITY,
            "capabilities": [StandardCapability.LOCK],
            "optional_capabilities": [StandardCapability.BATTERY]
        },
        "camera": {
            "category": DeviceCategory.SECURITY,
            "capabilities": [StandardCapability.CAMERA],
            "optional_capabilities": [
                StandardCapability.MOTION,
                StandardCapability.POWER,
                StandardCapability.BATTERY
            ]
        },
        "speaker": {
            "category": DeviceCategory.ENTERTAINMENT,
            "capabilities": [StandardCapability.VOLUME, StandardCapability.MEDIA_PLAYBACK],
            "optional_capabilities": [StandardCapability.POWER]
        },
        "media_player": {
            "category": DeviceCategory.ENTERTAINMENT,
            "capabilities": [StandardCapability.MEDIA_PLAYBACK],
            "optional_capabilities": [
                StandardCapability.POWER,
                StandardCapability.VOLUME
            ]
        },
        "fan": {
            "category": DeviceCategory.CLIMATE,
            "capabilities": [StandardCapability.POWER],
            "optional_capabilities": [StandardCapability.SPEED]
        },
        "blind": {
            "category": DeviceCategory.CONTROL,
            "capabilities": [StandardCapability.POSITION],
            "optional_capabilities": [StandardCapability.POWER]
        },
        "vacuum": {
            "category": DeviceCategory.APPLIANCE,
            "capabilities": [StandardCapability.POWER],
            "optional_capabilities": [StandardCapability.BATTERY]
        }
    }
    
    @staticmethod
    def get_capabilities(device_type: str) -> Tuple[List[StandardCapability], List[StandardCapability]]:
        """Get required and optional capabilities for a device type"""
        if device_type in DeviceType.DEVICE_TYPES:
            device_info = DeviceType.DEVICE_TYPES[device_type]
            return device_info["capabilities"], device_info["optional_capabilities"]
        return [], []
    
    @staticmethod
    def get_category(device_type: str) -> DeviceCategory:
        """Get the category for a device type"""
        if device_type in DeviceType.DEVICE_TYPES:
            return DeviceType.DEVICE_TYPES[device_type]["category"]
        return DeviceCategory.OTHER

class UnifiedDevice:
    """Unified device representation with normalized capabilities and state"""
    
    def __init__(self, device_data: Dict[str, Any]):
        self.id = device_data["id"]
        self.name = device_data["name"]
        self.type = device_data["type"]
        self.manufacturer = device_data.get("manufacturer", "Unknown")
        self.model = device_data.get("model", "Unknown")
        self.protocol = device_data.get("protocol", "generic")
        self.firmware_version = device_data.get("firmware_version", "")
        self.raw_capabilities = device_data.get("capabilities", [])
        self.raw_state = device_data.get("state", {})
        self.location = device_data.get("location", "")
        self.room = device_data.get("room", "")
        self.online = device_data.get("status", "unknown") == "online"
        self.last_seen = device_data.get("last_seen", "")
        self.discovered_at = device_data.get("discovered_at", "")
        self.metadata = device_data.get("metadata", {})
        
        # Normalize capabilities and state
        self.capabilities = self._normalize_capabilities()
        self.state = self._normalize_state()
        self.category = DeviceType.get_category(self.type)
        
    def _normalize_capabilities(self) -> List[StandardCapability]:
        """Convert device-specific capabilities to standard capabilities"""
        normalized = []
        
        # Map raw capabilities to standard capabilities
        capability_mapping = {
            "on_off": StandardCapability.POWER,
            "on": StandardCapability.POWER,
            "power": StandardCapability.POWER,
            "brightness": StandardCapability.BRIGHTNESS,
            "color": StandardCapability.COLOR,
            "color_temperature": StandardCapability.COLOR_TEMPERATURE,
            "temperature": StandardCapability.TEMPERATURE,
            "humidity": StandardCapability.HUMIDITY,
            "motion": StandardCapability.MOTION,
            "presence": StandardCapability.PRESENCE,
            "contact": StandardCapability.CONTACT,
            "lock": StandardCapability.LOCK,
            "thermostat": StandardCapability.THERMOSTAT,
            "media_playback": StandardCapability.MEDIA_PLAYBACK,
            "media-control": StandardCapability.MEDIA_PLAYBACK,
            "volume": StandardCapability.VOLUME,
            "volume_control": StandardCapability.VOLUME,
            "battery": StandardCapability.BATTERY,
            "energy_monitoring": StandardCapability.ENERGY_MONITORING,
            "energy": StandardCapability.ENERGY_MONITORING,
            "position": StandardCapability.POSITION,
            "speed": StandardCapability.SPEED,
            "water": StandardCapability.WATER,
            "smoke": StandardCapability.SMOKE,
            "air_quality": StandardCapability.AIR_QUALITY,
            "camera": StandardCapability.CAMERA
        }
        
        # Add capabilities based on device type
        required_caps, optional_caps = DeviceType.get_capabilities(self.type)
        for cap in required_caps:
            if cap not in normalized:
                normalized.append(cap)
        
        # Add capabilities from raw capabilities
        for raw_cap in self.raw_capabilities:
            if raw_cap in capability_mapping:
                std_cap = capability_mapping[raw_cap]
                if std_cap not in normalized:
                    normalized.append(std_cap)
        
        # Add capabilities based on state
        if self.raw_state:
            if "brightness" in self.raw_state and StandardCapability.BRIGHTNESS not in normalized:
                normalized.append(StandardCapability.BRIGHTNESS)
            if "color" in self.raw_state and StandardCapability.COLOR not in normalized:
                normalized.append(StandardCapability.COLOR)
            if "temperature" in self.raw_state and StandardCapability.TEMPERATURE not in normalized:
                normalized.append(StandardCapability.TEMPERATURE)
            if "humidity" in self.raw_state and StandardCapability.HUMIDITY not in normalized:
                normalized.append(StandardCapability.HUMIDITY)
            if "motion" in self.raw_state and StandardCapability.MOTION not in normalized:
                normalized.append(StandardCapability.MOTION)
            if "contact" in self.raw_state and StandardCapability.CONTACT not in normalized:
                normalized.append(StandardCapability.CONTACT)
            if "locked" in self.raw_state and StandardCapability.LOCK not in normalized:
                normalized.append(StandardCapability.LOCK)
            if "volume" in self.raw_state and StandardCapability.VOLUME not in normalized:
                normalized.append(StandardCapability.VOLUME)
            if "battery" in self.raw_state and StandardCapability.BATTERY not in normalized:
                normalized.append(StandardCapability.BATTERY)
        
        return normalized
    
    def _normalize_state(self) -> Dict[str, Any]:
        """Normalize device state to standard format"""
        normalized = {}
        
        # Handle power state
        if StandardCapability.POWER in self.capabilities:
            if "on" in self.raw_state:
                normalized["power"] = self.raw_state["on"]
            elif "power" in self.raw_state:
                if isinstance(self.raw_state["power"], bool):
                    normalized["power"] = self.raw_state["power"]
                else:
                    normalized["power"] = self.raw_state["power"] == "on"
        
        # Handle brightness
        if StandardCapability.BRIGHTNESS in self.capabilities and "brightness" in self.raw_state:
            normalized["brightness"] = self.raw_state["brightness"]
        
        # Handle color
        if StandardCapability.COLOR in self.capabilities and "color" in self.raw_state:
            color = self.raw_state["color"]
            if isinstance(color, dict):
                normalized["color"] = {
                    "hue": color.get("h", color.get("hue", 0)),
                    "saturation": color.get("s", color.get("saturation", 0)),
                    "value": color.get("v", color.get("value", 100))
                }
        
        # Handle temperature
        if StandardCapability.TEMPERATURE in self.capabilities:
            if "temperature" in self.raw_state:
                normalized["temperature"] = self.raw_state["temperature"]
            elif "current_temperature" in self.raw_state:
                normalized["temperature"] = self.raw_state["current_temperature"]
        
        # Handle target temperature
        if StandardCapability.THERMOSTAT in self.capabilities:
            if "target_temperature" in self.raw_state:
                normalized["target_temperature"] = self.raw_state["target_temperature"]
            elif "target_temp" in self.raw_state:
                normalized["target_temperature"] = self.raw_state["target_temp"]
            
            if "mode" in self.raw_state:
                normalized["mode"] = self.raw_state["mode"]
        
        # Handle humidity
        if StandardCapability.HUMIDITY in self.capabilities and "humidity" in self.raw_state:
            normalized["humidity"] = self.raw_state["humidity"]
        
        # Handle motion
        if StandardCapability.MOTION in self.capabilities and "motion" in self.raw_state:
            normalized["motion"] = self.raw_state["motion"]
        
        # Handle contact
        if StandardCapability.CONTACT in self.capabilities and "contact" in self.raw_state:
            normalized["contact"] = self.raw_state["contact"]
        
        # Handle lock
        if StandardCapability.LOCK in self.capabilities and "locked" in self.raw_state:
            normalized["locked"] = self.raw_state["locked"]
        
        # Handle volume
        if StandardCapability.VOLUME in self.capabilities and "volume" in self.raw_state:
            normalized["volume"] = self.raw_state["volume"]
        
        # Handle battery
        if StandardCapability.BATTERY in self.capabilities and "battery" in self.raw_state:
            normalized["battery"] = self.raw_state["battery"]
        
        # Handle position
        if StandardCapability.POSITION in self.capabilities and "position" in self.raw_state:
            normalized["position"] = self.raw_state["position"]
        
        # Handle speed
        if StandardCapability.SPEED in self.capabilities and "speed" in self.raw_state:
            normalized["speed"] = self.raw_state["speed"]
        
        return normalized
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert unified device to dictionary representation"""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "protocol": self.protocol,
            "firmware_version": self.firmware_version,
            "capabilities": [cap.value for cap in self.capabilities],
            "state": self.state,
            "category": self.category.value,
            "location": self.location,
            "room": self.room,
            "online": self.online,
            "last_seen": self.last_seen,
            "discovered_at": self.discovered_at
        }
    
    def supports_capability(self, capability: StandardCapability) -> bool:
        """Check if device supports a specific capability"""
        return capability in self.capabilities
    
    def get_state_value(self, key: str, default: Any = None) -> Any:
        """Get a specific state value"""
        return self.state.get(key, default)

class UnifiedDeviceAbstraction:
    """
    Unified Device Abstraction Layer
    
    This class provides a consistent interface for all devices regardless of their
    underlying protocol or manufacturer. It normalizes device capabilities, states,
    and commands into a unified model.
    """
    
    def __init__(self):
        self.devices: Dict[str, UnifiedDevice] = {}
    
    def add_device(self, device_data: Dict[str, Any]) -> UnifiedDevice:
        """Add a device to the abstraction layer"""
        unified_device = UnifiedDevice(device_data)
        self.devices[unified_device.id] = unified_device
        return unified_device
    
    def update_device(self, device_data: Dict[str, Any]) -> Optional[UnifiedDevice]:
        """Update a device in the abstraction layer"""
        device_id = device_data["id"]
        if device_id in self.devices:
            unified_device = UnifiedDevice(device_data)
            self.devices[device_id] = unified_device
            return unified_device
        return None
    
    def remove_device(self, device_id: str) -> bool:
        """Remove a device from the abstraction layer"""
        if device_id in self.devices:
            del self.devices[device_id]
            return True
        return False
    
    def get_device(self, device_id: str) -> Optional[UnifiedDevice]:
        """Get a device by ID"""
        return self.devices.get(device_id)
    
    def get_all_devices(self) -> List[UnifiedDevice]:
        """Get all devices"""
        return list(self.devices.values())
    
    def get_devices_by_type(self, device_type: str) -> List[UnifiedDevice]:
        """Get all devices of a specific type"""
        return [device for device in self.devices.values() if device.type == device_type]
    
    def get_devices_by_capability(self, capability: StandardCapability) -> List[UnifiedDevice]:
        """Get all devices with a specific capability"""
        return [device for device in self.devices.values() if device.supports_capability(capability)]
    
    def get_devices_by_category(self, category: DeviceCategory) -> List[UnifiedDevice]:
        """Get all devices in a specific category"""
        return [device for device in self.devices.values() if device.category == category]
    
    def get_devices_by_room(self, room: str) -> List[UnifiedDevice]:
        """Get all devices in a specific room"""
        return [device for device in self.devices.values() if device.room == room]
    
    def normalize_command(self, device_id: str, command: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a command for a specific device"""
        device = self.get_device(device_id)
        if not device:
            return command
        
        normalized = {"command": command.get("command", ""), "params": {}}
        
        # Normalize command name
        cmd = normalized["command"].lower()
        if cmd == "on" or cmd == "turn_on":
            normalized["command"] = "turn_on"
        elif cmd == "off" or cmd == "turn_off":
            normalized["command"] = "turn_off"
        
        # Normalize parameters
        params = command.get("params", {})
        if "brightness" in params and device.supports_capability(StandardCapability.BRIGHTNESS):
            normalized["params"]["brightness"] = params["brightness"]
        
        if "color" in params and device.supports_capability(StandardCapability.COLOR):
            color = params["color"]
            if isinstance(color, dict):
                normalized["params"]["color"] = {
                    "h": color.get("h", color.get("hue", 0)),
                    "s": color.get("s", color.get("saturation", 0)),
                    "v": color.get("v", color.get("value", 100))
                }
        
        if "temperature" in params and device.supports_capability(StandardCapability.THERMOSTAT):
            normalized["params"]["temperature"] = params["temperature"]
        
        if "mode" in params and device.supports_capability(StandardCapability.THERMOSTAT):
            normalized["params"]["mode"] = params["mode"]
        
        if "volume" in params and device.supports_capability(StandardCapability.VOLUME):
            normalized["params"]["volume"] = params["volume"]
        
        if "position" in params and device.supports_capability(StandardCapability.POSITION):
            normalized["params"]["position"] = params["position"]
        
        if "speed" in params and device.supports_capability(StandardCapability.SPEED):
            normalized["params"]["speed"] = params["speed"]
        
        return normalized

# Create singleton instance
unified_device_abstraction = UnifiedDeviceAbstraction()
from typing import Dict, Any, List, Optional, Set, Callable, Tuple
import asyncio
import logging
import json
import time
from datetime import datetime
from enum import Enum
from typing import Protocol

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DeviceManager")

class EventEmitter:
    def __init__(self):
        self.event_listeners: Dict[str, Set[Callable]] = {}
        
    def on(self, event: str, callback: Callable) -> None:
        """Register an event listener"""
        if event not in self.event_listeners:
            self.event_listeners[event] = set()
        self.event_listeners[event].add(callback)
        
    def off(self, event: str, callback: Callable) -> None:
        """Remove an event listener"""
        if event in self.event_listeners and callback in self.event_listeners[event]:
            self.event_listeners[event].remove(callback)
            
    def emit(self, event: str, data: Any) -> None:
        """Emit an event to all listeners"""
        if event in self.event_listeners:
            for callback in self.event_listeners[event]:
                try:
                    callback(data)
                except Exception as e:
                    logger.error(f"Error in event listener for {event}: {str(e)}")

class DeviceProtocol(Enum):
    HUE = "hue"
    WEMO = "wemo"
    LIFX = "lifx"
    ZIGBEE = "zigbee"
    ZWAVE = "zwave"
    MATTER = "matter"
    HOMEKIT = "homekit"
    MDNS = "mdns"
    SSDP = "ssdp"
    GENERIC = "generic"

class DeviceManager(EventEmitter):
    def __init__(self, storage=None):
        super().__init__()
        self.devices: Dict[str, Dict[str, Any]] = {}
        self.device_handlers: Dict[str, Callable] = {
            'light': self._handle_light,
            'thermostat': self._handle_thermostat,
            'switch': self._handle_switch,
            'outlet': self._handle_switch,  # Outlets use the same handler as switches
            'camera': self._handle_camera,
            'speaker': self._handle_speaker,
            'media_player': self._handle_media_player,
            'lock': self._handle_lock,
            'sensor': self._handle_sensor,
            'fan': self._handle_fan,
            'blind': self._handle_blind,
            'vacuum': self._handle_vacuum,
            'bridge': self._handle_bridge,
            'hub': self._handle_bridge,  # Hubs use the same handler as bridges
            'remote': self._handle_remote
        }
        self.protocol_handlers: Dict[str, Dict[str, Callable]] = {}
        self.storage = storage
        self.device_state_cache: Dict[str, Dict[str, Any]] = {}
        self.last_command_time: Dict[str, float] = {}
        self.command_history: Dict[str, List[Dict[str, Any]]] = {}
        
        # Initialize protocol handlers
        self._initialize_protocol_handlers()
        
    def _initialize_protocol_handlers(self) -> None:
        """Initialize protocol-specific device handlers"""
        # Philips Hue protocol handlers
        self.protocol_handlers[DeviceProtocol.HUE.value] = {
            'light': self._handle_hue_light,
            'bridge': self._handle_hue_bridge
        }
        
        # WeMo protocol handlers
        self.protocol_handlers[DeviceProtocol.WEMO.value] = {
            'switch': self._handle_wemo_switch,
            'outlet': self._handle_wemo_outlet
        }
        
        # LIFX protocol handlers
        self.protocol_handlers[DeviceProtocol.LIFX.value] = {
            'light': self._handle_lifx_light
        }
        
        # Zigbee protocol handlers
        self.protocol_handlers[DeviceProtocol.ZIGBEE.value] = {
            'light': self._handle_zigbee_light,
            'switch': self._handle_zigbee_switch,
            'sensor': self._handle_zigbee_sensor,
            'lock': self._handle_zigbee_lock
        }
        
        # Z-Wave protocol handlers
        self.protocol_handlers[DeviceProtocol.ZWAVE.value] = {
            'switch': self._handle_zwave_switch,
            'lock': self._handle_zwave_lock,
            'sensor': self._handle_zwave_sensor
        }
        
        # Matter protocol handlers (placeholder for future implementation)
        self.protocol_handlers[DeviceProtocol.MATTER.value] = {}
        
        # HomeKit protocol handlers
        self.protocol_handlers[DeviceProtocol.HOMEKIT.value] = {
            'thermostat': self._handle_homekit_thermostat,
            'light': self._handle_homekit_light
        }

    async def discover_devices(self) -> List[Dict[str, Any]]:
        """Discover available devices (legacy method, use DeviceDiscovery instead)"""
        try:
            # Simulated device discovery for testing
            await asyncio.sleep(1)  # Simulate network scan
            
            discovered = [
                {
                    "id": "light1",
                    "name": "Living Room Light",
                    "type": "light",
                    "manufacturer": "Philips Hue",
                    "model": "White and Color",
                    "protocol": "hue",
                    "state": {"on": False, "brightness": 0},
                    "capabilities": ["on_off", "brightness", "color"]
                },
                {
                    "id": "thermostat1", 
                    "name": "Living Room Thermostat",
                    "type": "thermostat",
                    "manufacturer": "Nest",
                    "model": "Learning Thermostat",
                    "protocol": "generic",
                    "state": {"temperature": 72, "target_temperature": 70, "mode": "auto"},
                    "capabilities": ["thermostat", "temperature_sensor"]
                }
            ]
            
            # Add discovered devices to internal state
            for device in discovered:
                self.addDevice(device)
                
            return discovered
            
        except Exception as e:
            logger.error(f"Error discovering devices: {str(e)}")
            return []

    def addDevice(self, device: Dict[str, Any]) -> None:
        """Add a device to the device manager"""
        device_id = device["id"]
        
        if device_id in self.devices:
            # Update existing device
            self.devices[device_id].update(device)
            logger.debug(f"Updated device: {device['name']} ({device_id})")
        else:
            # Add new device
            self.devices[device_id] = device
            logger.info(f"Added device: {device['name']} ({device_id})")
            
        # Initialize state cache if needed
        if "state" in device and device_id not in self.device_state_cache:
            self.device_state_cache[device_id] = device["state"].copy()
            
        # Emit device added/updated event
        self.emit('device_updated', device)
        
        # Save to storage if available
        if self.storage:
            self._save_devices()

    def removeDevice(self, device_id: str) -> bool:
        """Remove a device from the device manager"""
        if device_id in self.devices:
            device = self.devices.pop(device_id)
            
            # Remove from state cache
            if device_id in self.device_state_cache:
                del self.device_state_cache[device_id]
                
            # Emit device removed event
            self.emit('device_removed', {"id": device_id, "name": device.get("name", "Unknown")})
            
            # Save to storage if available
            if self.storage:
                self._save_devices()
                
            logger.info(f"Removed device: {device.get('name', 'Unknown')} ({device_id})")
            return True
        
        return False

    async def executeCommand(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command on a device"""
        device_id = device["id"]
        device_type = device["type"]
        protocol = device.get("protocol", "generic")
        
        # Record command in history
        self._record_command(device_id, command)
        
        try:
            # Check if we have a protocol-specific handler
            if protocol in self.protocol_handlers and device_type in self.protocol_handlers[protocol]:
                handler = self.protocol_handlers[protocol][device_type]
                result = await handler(device, command)
            elif device_type in self.device_handlers:
                # Fall back to generic handler
                handler = self.device_handlers[device_type]
                result = await handler(device, command)
            else:
                raise ValueError(f"Unsupported device type: {device_type}")
            
            # Update device state in cache
            if "state" in result:
                if device_id not in self.device_state_cache:
                    self.device_state_cache[device_id] = {}
                
                self.device_state_cache[device_id].update(result["state"])
                
                # Update device state
                if "state" not in device:
                    device["state"] = {}
                device["state"].update(result["state"])
                
                # Emit state changed event
                self.emit('device_state_changed', {
                    "device_id": device_id,
                    "state": device["state"],
                    "previous_state": self.device_state_cache.get(device_id, {})
                })
            
            return result
        except Exception as e:
            logger.error(f"Error executing command on device {device_id}: {str(e)}")
            return {"error": str(e)}

    async def getDeviceState(self, device: Dict[str, Any]) -> Dict[str, Any]:
        """Get the current state of a device"""
        device_id = device["id"]
        device_type = device["type"]
        protocol = device.get("protocol", "generic")
        
        try:
            # Use protocol-specific state getter if available
            if protocol in self.protocol_handlers and device_type in self.protocol_handlers[protocol]:
                # This would be implemented for real devices
                pass
            
            # For now, return the cached state
            if device_id in self.device_state_cache:
                return self.device_state_cache[device_id]
            elif "state" in device:
                return device["state"]
            else:
                return {}
        except Exception as e:
            logger.error(f"Error getting device state for {device_id}: {str(e)}")
            return {}

    async def get_device(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get a device by ID"""
        return self.devices.get(device_id)

    async def get_all_devices(self) -> List[Dict[str, Any]]:
        """Get all known devices"""
        return list(self.devices.values())

    def _record_command(self, device_id: str, command: Dict[str, Any]) -> None:
        """Record a command in the device's command history"""
        if device_id not in self.command_history:
            self.command_history[device_id] = []
            
        # Add command with timestamp
        self.command_history[device_id].append({
            "timestamp": datetime.now().isoformat(),
            "command": command
        })
        
        # Update last command time
        self.last_command_time[device_id] = time.time()
        
        # Limit history to last 50 commands
        if len(self.command_history[device_id]) > 50:
            self.command_history[device_id] = self.command_history[device_id][-50:]

    def _save_devices(self) -> None:
        """Save devices to storage"""
        if not self.storage:
            return
            
        try:
            # Convert devices to serializable format
            devices_data = {}
            for device_id, device in self.devices.items():
                devices_data[device_id] = {
                    k: v for k, v in device.items()
                    if k not in ["_handlers", "_callbacks"]
                }
                
            # Save to storage
            self.storage.set("devices", json.dumps(devices_data))
        except Exception as e:
            logger.error(f"Error saving devices to storage: {str(e)}")

    def _load_devices(self) -> None:
        """Load devices from storage"""
        if not self.storage:
            return
            
        try:
            devices_data = self.storage.get("devices")
            if devices_data:
                devices = json.loads(devices_data)
                for device_id, device in devices.items():
                    self.devices[device_id] = device
                    if "state" in device:
                        self.device_state_cache[device_id] = device["state"].copy()
        except Exception as e:
            logger.error(f"Error loading devices from storage: {str(e)}")

    # Generic device handlers
    async def _handle_light(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle light device commands"""
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "turn_on":
            return {"state": {"on": True, "brightness": params.get("brightness", 100)}}
        elif cmd == "turn_off":
            return {"state": {"on": False, "brightness": 0}}
        elif cmd == "set_brightness":
            brightness = params.get("brightness", 100)
            return {"state": {"on": True, "brightness": brightness}}
        elif cmd == "set_color":
            color = params.get("color", {"h": 0, "s": 0, "v": 100})
            return {"state": {"on": True, "color": color}}
        elif cmd == "set_color_temperature":
            temp = params.get("temperature", 4000)
            return {"state": {"on": True, "color_temperature": temp}}
        else:
            raise ValueError(f"Unsupported command for light: {cmd}")

    async def _handle_thermostat(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle thermostat device commands"""
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "set_temperature":
            temp = params.get("temperature")
            if temp is None:
                raise ValueError("Temperature parameter required")
            return {"state": {"target_temperature": temp}}
        elif cmd == "set_mode":
            mode = params.get("mode", "auto")
            if mode not in ["auto", "heat", "cool", "off"]:
                raise ValueError(f"Invalid thermostat mode: {mode}")
            return {"state": {"mode": mode}}
        elif cmd == "set_fan_mode":
            fan_mode = params.get("fan_mode", "auto")
            if fan_mode not in ["auto", "on", "circulate"]:
                raise ValueError(f"Invalid fan mode: {fan_mode}")
            return {"state": {"fan_mode": fan_mode}}
        else:
            raise ValueError(f"Unsupported command for thermostat: {cmd}")

    async def _handle_switch(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle switch device commands"""
        cmd = command.get("command", "").lower()
        
        if cmd == "turn_on":
            return {"state": {"on": True}}
        elif cmd == "turn_off":
            return {"state": {"on": False}}
        elif cmd == "toggle":
            current_state = device.get("state", {}).get("on", False)
            return {"state": {"on": not current_state}}
        else:
            raise ValueError(f"Unsupported command for switch: {cmd}")

    async def _handle_camera(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle camera device commands"""
        cmd = command.get("command", "").lower()
        
        if cmd == "start_stream":
            return {"state": {"streaming": True}, "stream_url": f"rtsp://{device['id']}/live"}
        elif cmd == "stop_stream":
            return {"state": {"streaming": False}}
        elif cmd == "take_snapshot":
            return {"snapshot_url": f"/snapshots/{device['id']}.jpg"}
        elif cmd == "pan_tilt":
            params = command.get("params", {})
            pan = params.get("pan", 0)
            tilt = params.get("tilt", 0)
            return {"state": {"pan": pan, "tilt": tilt}}
        else:
            raise ValueError(f"Unsupported command for camera: {cmd}")

    async def _handle_speaker(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle speaker device commands"""
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "set_volume":
            volume = params.get("volume")
            if volume is None:
                raise ValueError("Volume parameter required")
            return {"state": {"volume": volume}}
        elif cmd == "mute":
            return {"state": {"muted": True}}
        elif cmd == "unmute":
            return {"state": {"muted": False}}
        elif cmd == "play":
            return {"state": {"playing": True}}
        elif cmd == "pause":
            return {"state": {"playing": False}}
        elif cmd == "next_track":
            return {"state": {"track_changed": True}}
        elif cmd == "previous_track":
            return {"state": {"track_changed": True}}
        else:
            raise ValueError(f"Unsupported command for speaker: {cmd}")

    async def _handle_media_player(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle media player device commands"""
        # Media players use the same commands as speakers
        return await self._handle_speaker(device, command)

    async def _handle_lock(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle lock device commands"""
        cmd = command.get("command", "").lower()
        
        if cmd == "lock":
            return {"state": {"locked": True}}
        elif cmd == "unlock":
            return {"state": {"locked": False}}
        else:
            raise ValueError(f"Unsupported command for lock: {cmd}")

    async def _handle_sensor(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle sensor device commands"""
        # Most sensors are read-only, but some may have configuration options
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "configure":
            # This would configure sensor settings in a real implementation
            return {"state": {"configured": True}}
        else:
            raise ValueError(f"Unsupported command for sensor: {cmd}")

    async def _handle_fan(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle fan device commands"""
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "turn_on":
            return {"state": {"on": True}}
        elif cmd == "turn_off":
            return {"state": {"on": False}}
        elif cmd == "set_speed":
            speed = params.get("speed")
            if speed is None:
                raise ValueError("Speed parameter required")
            return {"state": {"on": True, "speed": speed}}
        elif cmd == "oscillate":
            oscillate = params.get("oscillate", True)
            return {"state": {"oscillating": oscillate}}
        else:
            raise ValueError(f"Unsupported command for fan: {cmd}")

    async def _handle_blind(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle blind/shade device commands"""
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "open":
            return {"state": {"position": 100}}
        elif cmd == "close":
            return {"state": {"position": 0}}
        elif cmd == "set_position":
            position = params.get("position")
            if position is None:
                raise ValueError("Position parameter required")
            return {"state": {"position": position}}
        else:
            raise ValueError(f"Unsupported command for blind: {cmd}")

    async def _handle_vacuum(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle vacuum device commands"""
        cmd = command.get("command", "").lower()
        
        if cmd == "start":
            return {"state": {"status": "cleaning"}}
        elif cmd == "stop":
            return {"state": {"status": "stopped"}}
        elif cmd == "pause":
            return {"state": {"status": "paused"}}
        elif cmd == "return_to_base":
            return {"state": {"status": "returning"}}
        else:
            raise ValueError(f"Unsupported command for vacuum: {cmd}")

    async def _handle_bridge(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle bridge/hub device commands"""
        cmd = command.get("command", "").lower()
        
        if cmd == "reboot":
            return {"state": {"status": "rebooting"}}
        elif cmd == "identify":
            return {"state": {"identifying": True}}
        else:
            raise ValueError(f"Unsupported command for bridge: {cmd}")

    async def _handle_remote(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle remote control device commands"""
        cmd = command.get("command", "").lower()
        params = command.get("params", {})
        
        if cmd == "send_button":
            button = params.get("button")
            if button is None:
                raise ValueError("Button parameter required")
            return {"state": {"last_button": button}}
        else:
            raise ValueError(f"Unsupported command for remote: {cmd}")

    # Protocol-specific handlers
    async def _handle_hue_light(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Philips Hue light commands"""
        # In a real implementation, this would use the Hue API
        # For now, use the generic light handler
        return await self._handle_light(device, command)

    async def _handle_hue_bridge(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Philips Hue bridge commands"""
        # In a real implementation, this would use the Hue API
        # For now, use the generic bridge handler
        return await self._handle_bridge(device, command)

    async def _handle_wemo_switch(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle WeMo switch commands"""
        # In a real implementation, this would use the WeMo API
        # For now, use the generic switch handler
        return await self._handle_switch(device, command)

    async def _handle_wemo_outlet(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle WeMo outlet commands"""
        # In a real implementation, this would use the WeMo API
        # For now, use the generic switch handler
        return await self._handle_switch(device, command)

    async def _handle_lifx_light(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle LIFX light commands"""
        # In a real implementation, this would use the LIFX API
        # For now, use the generic light handler
        return await self._handle_light(device, command)

    async def _handle_zigbee_light(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Zigbee light commands"""
        # In a real implementation, this would use a Zigbee library
        # For now, use the generic light handler
        return await self._handle_light(device, command)

    async def _handle_zigbee_switch(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Zigbee switch commands"""
        # In a real implementation, this would use a Zigbee library
        # For now, use the generic switch handler
        return await self._handle_switch(device, command)

    async def _handle_zigbee_sensor(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Zigbee sensor commands"""
        # In a real implementation, this would use a Zigbee library
        # For now, use the generic sensor handler
        return await self._handle_sensor(device, command)

    async def _handle_zigbee_lock(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Zigbee lock commands"""
        # In a real implementation, this would use a Zigbee library
        # For now, use the generic lock handler
        return await self._handle_lock(device, command)

    async def _handle_zwave_switch(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Z-Wave switch commands"""
        # In a real implementation, this would use a Z-Wave library
        # For now, use the generic switch handler
        return await self._handle_switch(device, command)

    async def _handle_zwave_lock(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Z-Wave lock commands"""
        # In a real implementation, this would use a Z-Wave library
        # For now, use the generic lock handler
        return await self._handle_lock(device, command)

    async def _handle_zwave_sensor(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Z-Wave sensor commands"""
        # In a real implementation, this would use a Z-Wave library
        # For now, use the generic sensor handler
        return await self._handle_sensor(device, command)

    async def _handle_homekit_thermostat(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle HomeKit thermostat commands"""
        # In a real implementation, this would use a HomeKit library
        # For now, use the generic thermostat handler
        return await self._handle_thermostat(device, command)

    async def _handle_homekit_light(self, device: Dict[str, Any], command: Dict[str, Any]) -> Dict[str, Any]:
        """Handle HomeKit light commands"""
        # In a real implementation, this would use a HomeKit library
        # For now, use the generic light handler
        return await self._handle_light(device, command)

import autogen
from typing import Dict, Any

class DeviceControlAgent:
    def __init__(self, config: Dict[str, Any]):
        self.agent = autogen.AssistantAgent(
            name="Device_Controller",
            system_message="""You are a smart home device control specialist. You understand how to:
            1. Control various types of smart devices (lights, thermostats, switches, etc.)
            2. Handle different device protocols and integrations
            3. Execute device commands safely and efficiently
            4. Handle error cases and provide appropriate feedback""",
            llm_config=config
        )
        
        self.device_manager = None  # Will be set by the main system
        
    def set_device_manager(self, device_manager):
        """Set the device manager instance for actual device control"""
        self.device_manager = device_manager
        
    async def execute_command(self, device_id: str, command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a device command"""
        try:
            if not self.device_manager:
                raise Exception("Device manager not initialized")
                
            # Convert command to device-specific format
            device_command = self._format_command(command)
            
            # Execute command through device manager
            result = await self.device_manager.controlDevice(device_id, device_command)
            
            return {
                "success": True,
                "result": result
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
    def _format_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Format a command for device execution"""
        formatted = {
            "command": command.get("action", ""),
            "params": {}
        }
        
        # Handle different command types
        if command.get("type") == "switch":
            formatted["command"] = "power"
            formatted["params"]["state"] = command.get("value")
            
        elif command.get("type") == "dimmer":
            formatted["command"] = "setBrightness"
            formatted["params"]["level"] = command.get("value")
            
        elif command.get("type") == "thermostat":
            formatted["command"] = "setTemperature"
            formatted["params"]["temperature"] = command.get("value")
            
        # Add additional command types as needed
        
        return formatted

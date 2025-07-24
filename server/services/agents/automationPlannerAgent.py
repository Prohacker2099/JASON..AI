import autogen
from typing import Dict, Any, List

class AutomationPlannerAgent:
    def __init__(self, config: Dict[str, Any]):
        self.agent = autogen.AssistantAgent(
            name="Automation_Planner",
            system_message="""You are an automation planning specialist for smart homes. You:
            1. Design efficient automation workflows
            2. Create schedules based on user patterns
            3. Optimize device interactions
            4. Consider energy efficiency and user convenience
            5. Handle complex conditional logic""",
            llm_config=config
        )
        
    def create_automation_plan(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create an automation plan based on user request"""
        try:
            # Extract key information from request
            triggers = self._identify_triggers(request)
            conditions = self._identify_conditions(request)
            actions = self._identify_actions(request)
            
            # Create automation plan
            plan = {
                "name": request.get("name", "New Automation"),
                "description": request.get("description", ""),
                "triggers": triggers,
                "conditions": conditions,
                "actions": actions,
                "enabled": True,
                "created_at": request.get("timestamp", ""),
                "schedule": self._create_schedule(request)
            }
            
            return {
                "success": True,
                "plan": plan
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _identify_triggers(self, request: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify automation triggers from request"""
        triggers = []
        
        # Time-based triggers
        if "time" in request:
            triggers.append({
                "type": "time",
                "value": request["time"]
            })
            
        # Device state triggers
        if "device_state" in request:
            triggers.append({
                "type": "device_state",
                "device_id": request["device_state"]["device_id"],
                "state": request["device_state"]["state"]
            })
            
        # Sensor triggers
        if "sensor" in request:
            triggers.append({
                "type": "sensor",
                "sensor_id": request["sensor"]["sensor_id"],
                "condition": request["sensor"]["condition"],
                "value": request["sensor"]["value"]
            })
            
        return triggers
    
    def _identify_conditions(self, request: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify automation conditions"""
        conditions = []
        
        # Time conditions
        if "time_condition" in request:
            conditions.append({
                "type": "time_range",
                "start": request["time_condition"]["start"],
                "end": request["time_condition"]["end"]
            })
            
        # Device state conditions
        if "device_condition" in request:
            conditions.append({
                "type": "device_state",
                "device_id": request["device_condition"]["device_id"],
                "state": request["device_condition"]["state"]
            })
            
        return conditions
    
    def _identify_actions(self, request: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify automation actions"""
        actions = []
        
        # Device control actions
        if "device_actions" in request:
            for action in request["device_actions"]:
                actions.append({
                    "type": "device_control",
                    "device_id": action["device_id"],
                    "command": action["command"],
                    "params": action.get("params", {})
                })
                
        # Scene activation
        if "scene" in request:
            actions.append({
                "type": "activate_scene",
                "scene_id": request["scene"]["scene_id"]
            })
            
        # Notification actions
        if "notification" in request:
            actions.append({
                "type": "notification",
                "message": request["notification"]["message"],
                "priority": request["notification"].get("priority", "normal")
            })
            
        return actions
    
    def _create_schedule(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create automation schedule"""
        if "schedule" not in request:
            return None
            
        schedule = request["schedule"]
        return {
            "type": schedule.get("type", "once"),
            "time": schedule.get("time"),
            "days": schedule.get("days", []),
            "start_date": schedule.get("start_date"),
            "end_date": schedule.get("end_date"),
            "repeat": schedule.get("repeat", False)
        }

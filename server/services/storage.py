from typing import Dict, Any, List, Optional
import json
import time
from pathlib import Path

class Storage:
    def __init__(self, data_dir: str = None):
        self.data_dir = Path(data_dir) if data_dir else Path(__file__).parent.parent.parent / 'data'
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize data files
        self.devices_file = self.data_dir / 'devices.json'
        self.automations_file = self.data_dir / 'automations.json'
        self.activities_file = self.data_dir / 'activities.json'
        
        # Create files if they don't exist
        for file in [self.devices_file, self.automations_file, self.activities_file]:
            if not file.exists():
                file.write_text('[]')

    async def addAutomation(self, automation: Dict[str, Any]) -> bool:
        """Add a new automation rule"""
        try:
            automations = self._read_json(self.automations_file)
            automations.append(automation)
            self._write_json(self.automations_file, automations)
            
            # Log activity
            await self.addActivity({
                'type': 'automation_created',
                'timestamp': time.time(),
                'data': automation
            })
            
            return True
        except Exception as e:
            print(f"Error adding automation: {e}")
            return False

    async def removeAutomation(self, automation_id: str) -> bool:
        """Remove an automation rule"""
        try:
            automations = self._read_json(self.automations_file)
            automations = [a for a in automations if a.get('id') != automation_id]
            self._write_json(self.automations_file, automations)
            
            await self.addActivity({
                'type': 'automation_removed',
                'timestamp': time.time(),
                'data': {'automation_id': automation_id}
            })
            
            return True
        except Exception as e:
            print(f"Error removing automation: {e}")
            return False

    async def getAutomation(self, automation_id: str) -> Optional[Dict[str, Any]]:
        """Get an automation rule by ID"""
        try:
            automations = self._read_json(self.automations_file)
            return next((a for a in automations if a.get('id') == automation_id), None)
        except Exception as e:
            print(f"Error getting automation: {e}")
            return None

    async def getAllAutomations(self) -> List[Dict[str, Any]]:
        """Get all automation rules"""
        try:
            return self._read_json(self.automations_file)
        except Exception as e:
            print(f"Error getting all automations: {e}")
            return []

    async def addActivity(self, activity: Dict[str, Any]) -> bool:
        """Add a new activity log"""
        try:
            activities = self._read_json(self.activities_file)
            activities.append(activity)
            self._write_json(self.activities_file, activities)
            return True
        except Exception as e:
            print(f"Error adding activity: {e}")
            return False

    def _read_json(self, file_path: Path) -> Any:
        """Read JSON from file"""
        try:
            return json.loads(file_path.read_text())
        except Exception:
            return []

    def _write_json(self, file_path: Path, data: Any):
        """Write JSON to file"""
        file_path.write_text(json.dumps(data, indent=2))

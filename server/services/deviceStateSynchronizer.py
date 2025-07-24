"""
Device State Synchronizer

This module provides real-time state synchronization between physical devices and JASON's internal state.
It ensures that the app always reflects the true state of devices and handles two-way communication.
"""

from typing import Dict, Any, List, Optional, Set, Callable, Tuple
import asyncio
import logging
import time
import json
from datetime import datetime
from enum import Enum
import websockets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DeviceStateSynchronizer")

class StateChangeSource(Enum):
    """Source of a device state change"""
    DEVICE = "device"          # Change originated from the physical device
    USER = "user"              # Change originated from user interaction
    AUTOMATION = "automation"  # Change originated from an automation
    SCENE = "scene"            # Change originated from a scene activation
    SYSTEM = "system"          # Change originated from the system
    EXTERNAL = "external"      # Change originated from an external integration

class DeviceStateSynchronizer:
    """
    Device State Synchronizer
    
    This class provides real-time state synchronization between physical devices and JASON's internal state.
    It ensures that the app always reflects the true state of devices and handles two-way communication.
    """
    
    def __init__(self, device_manager=None, storage=None):
        self.device_manager = device_manager
        self.storage = storage
        self.connected_clients: Set[websockets.WebSocketServerProtocol] = set()
        self.device_state_cache: Dict[str, Dict[str, Any]] = {}
        self.device_poll_intervals: Dict[str, int] = {}
        self.device_last_poll: Dict[str, float] = {}
        self.device_poll_tasks: Dict[str, asyncio.Task] = {}
        self.running = False
        self.state_change_listeners: Dict[str, Set[Callable]] = {}
        self.default_poll_interval = 60  # Default poll interval in seconds
        
    async def start(self):
        """Start the state synchronizer"""
        if self.running:
            return
            
        self.running = True
        logger.info("Starting device state synchronizer")
        
        # Load cached states from storage
        self._load_state_cache()
        
        # Set up device manager event listeners
        if self.device_manager:
            self.device_manager.on('device_state_changed', self._handle_device_state_change)
            self.device_manager.on('device_updated', self._handle_device_updated)
            self.device_manager.on('device_removed', self._handle_device_removed)
            
        # Start polling tasks for devices that need polling
        await self._start_polling_tasks()
    
    async def stop(self):
        """Stop the state synchronizer"""
        if not self.running:
            return
            
        self.running = False
        logger.info("Stopping device state synchronizer")
        
        # Cancel all polling tasks
        for device_id, task in self.device_poll_tasks.items():
            if not task.done():
                task.cancel()
                
        self.device_poll_tasks = {}
        
        # Save state cache to storage
        self._save_state_cache()
    
    async def add_client(self, websocket: websockets.WebSocketServerProtocol):
        """Add a client websocket connection"""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected, total clients: {len(self.connected_clients)}")
        
        # Send initial state to the client
        await self._send_full_state(websocket)
    
    async def remove_client(self, websocket: websockets.WebSocketServerProtocol):
        """Remove a client websocket connection"""
        if websocket in self.connected_clients:
            self.connected_clients.remove(websocket)
            logger.info(f"Client disconnected, remaining clients: {len(self.connected_clients)}")
    
    async def handle_client_message(self, websocket: websockets.WebSocketServerProtocol, message: str):
        """Handle a message from a client"""
        try:
            data = json.loads(message)
            
            if data.get("type") == "device_command":
                device_id = data.get("device_id")
                command = data.get("command")
                
                if device_id and command and self.device_manager:
                    # Get the device
                    device = await self.device_manager.get_device(device_id)
                    if device:
                        # Execute the command
                        result = await self.device_manager.executeCommand(device, command)
                        
                        # Send response back to client
                        response = {
                            "type": "command_response",
                            "device_id": device_id,
                            "command": command,
                            "result": result,
                            "timestamp": datetime.now().isoformat()
                        }
                        await websocket.send(json.dumps(response))
                    else:
                        # Device not found
                        error_response = {
                            "type": "error",
                            "error": f"Device not found: {device_id}",
                            "timestamp": datetime.now().isoformat()
                        }
                        await websocket.send(json.dumps(error_response))
            
            elif data.get("type") == "get_device_state":
                device_id = data.get("device_id")
                
                if device_id:
                    # Get the device state
                    state = self.device_state_cache.get(device_id, {})
                    
                    # Send state back to client
                    response = {
                        "type": "device_state",
                        "device_id": device_id,
                        "state": state,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send(json.dumps(response))
            
            elif data.get("type") == "get_all_devices":
                # Get all devices
                if self.device_manager:
                    devices = await self.device_manager.get_all_devices()
                    
                    # Send devices back to client
                    response = {
                        "type": "all_devices",
                        "devices": devices,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send(json.dumps(response))
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from client: {message}")
        except Exception as e:
            logger.error(f"Error handling client message: {str(e)}")
    
    def add_state_change_listener(self, device_id: str, listener: Callable[[str, Dict[str, Any], StateChangeSource], None]):
        """Add a listener for device state changes"""
        if device_id not in self.state_change_listeners:
            self.state_change_listeners[device_id] = set()
        self.state_change_listeners[device_id].add(listener)
    
    def remove_state_change_listener(self, device_id: str, listener: Callable):
        """Remove a listener for device state changes"""
        if device_id in self.state_change_listeners and listener in self.state_change_listeners[device_id]:
            self.state_change_listeners[device_id].remove(listener)
            if not self.state_change_listeners[device_id]:
                del self.state_change_listeners[device_id]
    
    def set_device_poll_interval(self, device_id: str, interval: int):
        """Set the polling interval for a device (in seconds)"""
        self.device_poll_intervals[device_id] = interval
        
        # Restart polling task if it exists
        if device_id in self.device_poll_tasks:
            task = self.device_poll_tasks[device_id]
            if not task.done():
                task.cancel()
            self.device_poll_tasks[device_id] = asyncio.create_task(self._poll_device_state(device_id))
    
    async def force_refresh_device_state(self, device_id: str) -> bool:
        """Force a refresh of a device's state"""
        if not self.device_manager:
            return False
            
        device = await self.device_manager.get_device(device_id)
        if not device:
            return False
            
        try:
            # Get the current state from the device
            state = await self.device_manager.getDeviceState(device)
            
            # Update the state cache
            self.device_state_cache[device_id] = state
            
            # Notify listeners
            self._notify_state_change(device_id, state, StateChangeSource.SYSTEM)
            
            # Update last poll time
            self.device_last_poll[device_id] = time.time()
            
            return True
        except Exception as e:
            logger.error(f"Error refreshing device state for {device_id}: {str(e)}")
            return False
    
    async def _start_polling_tasks(self):
        """Start polling tasks for devices that need polling"""
        if not self.device_manager:
            return
            
        try:
            # Get all devices
            devices = await self.device_manager.get_all_devices()
            
            # Start polling tasks for each device
            for device in devices:
                device_id = device["id"]
                
                # Skip devices that don't need polling
                if self._should_poll_device(device):
                    # Get polling interval
                    interval = self.device_poll_intervals.get(device_id, self.default_poll_interval)
                    
                    # Start polling task
                    self.device_poll_tasks[device_id] = asyncio.create_task(self._poll_device_state(device_id))
                    logger.debug(f"Started polling task for device {device_id} with interval {interval}s")
        except Exception as e:
            logger.error(f"Error starting polling tasks: {str(e)}")
    
    async def _poll_device_state(self, device_id: str):
        """Poll a device's state at regular intervals"""
        if not self.device_manager:
            return
            
        interval = self.device_poll_intervals.get(device_id, self.default_poll_interval)
        
        try:
            while self.running:
                # Get the device
                device = await self.device_manager.get_device(device_id)
                if not device:
                    logger.warning(f"Device {device_id} not found, stopping polling")
                    break
                
                # Get the current state from the device
                state = await self.device_manager.getDeviceState(device)
                
                # Check if state has changed
                current_state = self.device_state_cache.get(device_id, {})
                if self._state_has_changed(current_state, state):
                    # Update the state cache
                    self.device_state_cache[device_id] = state
                    
                    # Notify listeners
                    self._notify_state_change(device_id, state, StateChangeSource.DEVICE)
                
                # Update last poll time
                self.device_last_poll[device_id] = time.time()
                
                # Wait for the next poll
                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            logger.debug(f"Polling task for device {device_id} cancelled")
        except Exception as e:
            logger.error(f"Error polling device {device_id}: {str(e)}")
    
    def _should_poll_device(self, device: Dict[str, Any]) -> bool:
        """Determine if a device should be polled"""
        # Skip devices that are offline
        if device.get("status") == "offline":
            return False
            
        # Skip devices that don't have state
        if "state" not in device:
            return False
            
        # Skip devices that are bridges or hubs
        if device.get("type") in ["bridge", "hub"]:
            return False
            
        # Skip devices that are sensors with battery (to save battery)
        if device.get("type") == "sensor" and "battery" in device.get("capabilities", []):
            return False
            
        return True
    
    def _state_has_changed(self, old_state: Dict[str, Any], new_state: Dict[str, Any]) -> bool:
        """Check if a device's state has changed"""
        if not old_state and new_state:
            return True
            
        if not new_state:
            return False
            
        # Check if any values have changed
        for key, value in new_state.items():
            if key not in old_state or old_state[key] != value:
                return True
                
        return False
    
    def _handle_device_state_change(self, data: Dict[str, Any]):
        """Handle a device state change event from the device manager"""
        device_id = data.get("device_id")
        state = data.get("state", {})
        
        if device_id:
            # Update the state cache
            self.device_state_cache[device_id] = state
            
            # Notify listeners
            self._notify_state_change(device_id, state, StateChangeSource.DEVICE)
    
    def _handle_device_updated(self, device: Dict[str, Any]):
        """Handle a device updated event from the device manager"""
        device_id = device.get("id")
        
        if device_id:
            # Update the state cache if the device has state
            if "state" in device:
                self.device_state_cache[device_id] = device["state"]
            
            # Start polling task if needed
            if self._should_poll_device(device) and device_id not in self.device_poll_tasks:
                interval = self.device_poll_intervals.get(device_id, self.default_poll_interval)
                self.device_poll_tasks[device_id] = asyncio.create_task(self._poll_device_state(device_id))
                logger.debug(f"Started polling task for device {device_id} with interval {interval}s")
    
    def _handle_device_removed(self, data: Dict[str, Any]):
        """Handle a device removed event from the device manager"""
        device_id = data.get("id")
        
        if device_id:
            # Remove from state cache
            if device_id in self.device_state_cache:
                del self.device_state_cache[device_id]
            
            # Cancel polling task
            if device_id in self.device_poll_tasks:
                task = self.device_poll_tasks[device_id]
                if not task.done():
                    task.cancel()
                del self.device_poll_tasks[device_id]
            
            # Remove from other tracking dictionaries
            if device_id in self.device_poll_intervals:
                del self.device_poll_intervals[device_id]
            if device_id in self.device_last_poll:
                del self.device_last_poll[device_id]
            if device_id in self.state_change_listeners:
                del self.state_change_listeners[device_id]
    
    async def _send_full_state(self, websocket: websockets.WebSocketServerProtocol):
        """Send the full state to a client"""
        try:
            # Get all devices
            if self.device_manager:
                devices = await self.device_manager.get_all_devices()
                
                # Send devices to client
                message = {
                    "type": "initial_state",
                    "devices": devices,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending full state to client: {str(e)}")
    
    async def _broadcast_state_change(self, device_id: str, state: Dict[str, Any]):
        """Broadcast a state change to all connected clients"""
        if not self.connected_clients:
            return
            
        message = {
            "type": "device_state_change",
            "device_id": device_id,
            "state": state,
            "timestamp": datetime.now().isoformat()
        }
        
        json_message = json.dumps(message)
        
        # Send to all connected clients
        for client in self.connected_clients:
            try:
                await client.send(json_message)
            except websockets.exceptions.ConnectionClosed:
                # Client disconnected, will be removed on next message
                pass
            except Exception as e:
                logger.error(f"Error sending state change to client: {str(e)}")
    
    def _notify_state_change(self, device_id: str, state: Dict[str, Any], source: StateChangeSource):
        """Notify all listeners of a state change"""
        # Broadcast to websocket clients
        asyncio.create_task(self._broadcast_state_change(device_id, state))
        
        # Notify registered listeners
        if device_id in self.state_change_listeners:
            for listener in self.state_change_listeners[device_id]:
                try:
                    listener(device_id, state, source)
                except Exception as e:
                    logger.error(f"Error in state change listener: {str(e)}")
    
    def _load_state_cache(self):
        """Load state cache from storage"""
        if not self.storage:
            return
            
        try:
            cache_data = self.storage.get("device_state_cache")
            if cache_data:
                self.device_state_cache = json.loads(cache_data)
                logger.info(f"Loaded state cache for {len(self.device_state_cache)} devices")
        except Exception as e:
            logger.error(f"Error loading state cache: {str(e)}")
    
    def _save_state_cache(self):
        """Save state cache to storage"""
        if not self.storage:
            return
            
        try:
            self.storage.set("device_state_cache", json.dumps(self.device_state_cache))
            logger.info(f"Saved state cache for {len(self.device_state_cache)} devices")
        except Exception as e:
            logger.error(f"Error saving state cache: {str(e)}")

# Create singleton instance
device_state_synchronizer = DeviceStateSynchronizer()
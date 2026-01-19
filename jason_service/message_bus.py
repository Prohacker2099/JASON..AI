import queue
import time
import json
from dataclasses import dataclass, field

@dataclass(order=True)
class Message:
    """Represents a message in the priority queue."""
    priority: int
    timestamp: float = field(default_factory=time.time)
    payload: dict = field(default_factory=dict)

    def to_json(self):
        """Serializes the message to a JSON string."""
        return json.dumps({
            'priority': self.priority,
            'timestamp': self.timestamp,
            'payload': self.payload
        })

    @staticmethod
    def from_json(json_str):
        """Deserializes a JSON string to a Message object."""
        data = json.loads(json_str)
        return Message(
            priority=data['priority'],
            timestamp=data['timestamp'],
            payload=data['payload']
        )

class PriorityMessageBus:
    """A thread-safe, priority-weighted message bus."""
    def __init__(self):
        self.message_queue = queue.PriorityQueue()

    def publish(self, priority: int, payload: dict):
        """Publishes a message to the bus.

        Args:
            priority: The message priority (lower number is higher priority).
            payload: The message content as a dictionary.
        """
        message = Message(priority=priority, payload=payload)
        self.message_queue.put(message)

    def subscribe(self, block=True, timeout=None):
        """Retrieves a message from the bus.

        Args:
            block: Whether to block until a message is available.
            timeout: The maximum time to wait for a message.

        Returns:
            A Message object or None if the queue is empty and not blocking.
        """
        try:
            return self.message_queue.get(block=block, timeout=timeout)
        except queue.Empty:
            return None

    def qsize(self):
        """Returns the approximate size of the queue."""
        return self.message_queue.qsize()

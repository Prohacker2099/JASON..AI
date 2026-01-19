import pickle
import threading
from multiprocessing import shared_memory

class SharedMemoryManager:
    """A thread-safe manager for shared memory access."""
    def __init__(self, name: str, size: int):
        self.name = name
        self.size = size
        self._lock = threading.Lock()
        try:
            self.shm = shared_memory.SharedMemory(name=self.name)
        except FileNotFoundError:
            self.shm = shared_memory.SharedMemory(create=True, name=self.name, size=self.size)

    def write(self, data):
        """Writes data to the shared memory block.

        Args:
            data: The Python object to write.
        """
        serialized_data = pickle.dumps(data)
        if len(serialized_data) > self.size:
            raise ValueError("Data is larger than the allocated shared memory size.")
        with self._lock:
            self.shm.buf[:len(serialized_data)] = serialized_data
            # Add a terminator to mark the end of the data
            self.shm.buf[len(serialized_data)] = 0

    def read(self):
        """Reads data from the shared memory block.

        Returns:
            The deserialized Python object.
        """
        with self._lock:
            try:
                end_index = self.shm.buf.tobytes().index(0)
                serialized_data = self.shm.buf[:end_index].tobytes()
                if not serialized_data:
                    return None
                return pickle.loads(serialized_data)
            except (ValueError, pickle.UnpicklingError):
                return None

    def close(self):
        """Closes the shared memory block."""
        self.shm.close()

    def unlink(self):
        """Unlinks and destroys the shared memory block."""
        self.shm.unlink()

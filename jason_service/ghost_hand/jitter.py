import numpy as np
import time

class JitterModule:
    """Applies human-like jitter to mouse movements and keyboard inputs."""

    def __init__(self, mean_latency=0.12, std_dev_latency=0.03):
        self.mean_latency = mean_latency
        self.std_dev_latency = std_dev_latency

    def keyboard_latency(self):
        """Generates a random latency for keyboard inputs based on a Gaussian distribution."""
        return max(0, np.random.normal(self.mean_latency, self.std_dev_latency))

    def bezier_mouse_movement(self, start_point, end_point, control_points, steps=100):
        """Generates a series of points along a Bezier curve for mouse movement."""
        t = np.linspace(0, 1, steps)
        n = len(control_points) + 1
        points = np.array([start_point] + control_points + [end_point])
        
        curve_points = []
        for i in range(steps):
            t_val = t[i]
            b_points = np.copy(points)
            for r in range(1, n + 1):
                for j in range(n - r + 1):
                    b_points[j] = (1 - t_val) * b_points[j] + t_val * b_points[j+1]
            curve_points.append(b_points[0])
            
        return curve_points

    def apply_keystroke_jitter(self):
        """Pauses execution to simulate human typing speed."""
        time.sleep(self.keyboard_latency())

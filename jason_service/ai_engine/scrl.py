import numpy as np
import collections
import json
import os
import logging
import time
from typing import Dict, List, Tuple, Any, Optional

class QLearningAgent:
    """Production-ready Q-Learning agent for the Self-Correction Loop with proper reward system."""
    
    # Reward constants as specified in requirements
    REWARD_TASK_GOAL = 10
    REWARD_CRITICAL_ERROR = -50
    REWARD_LATENCY = -1
    
    def __init__(self, plan_library_path, learning_rate=0.1, discount_factor=0.9, 
                 exploration_rate=1.0, exploration_decay_rate=0.995, min_exploration_rate=0.01):
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = exploration_rate
        self.epsilon_decay = exploration_decay_rate
        self.epsilon_min = min_exploration_rate
        self.plan_library_path = plan_library_path
        self.q_table = collections.defaultdict(lambda: np.zeros(0))
        
        # Enhanced tracking for production use
        self.action_history = []
        self.reward_history = []
        self.state_transitions = collections.defaultdict(list)
        self.performance_metrics = {
            'total_actions': 0,
            'successful_tasks': 0,
            'critical_errors': 0,
            'average_latency': 0.0,
            'convergence_rate': 0.0
        }
        
        self.load_q_table()

    def load_q_table(self):
        """Loads the Q-table and metadata from the plan library file."""
        if not os.path.exists(self.plan_library_path):
            logging.info("Plan library not found. A new one will be created.")
            return
        try:
            with open(self.plan_library_path, 'r') as f:
                save_data = json.load(f)
            
            # Handle legacy format (just q_table) vs new format (with metadata)
            if isinstance(save_data, dict) and 'q_table' in save_data:
                q_table_serializable = save_data['q_table']
                self.performance_metrics = save_data.get('performance_metrics', self.performance_metrics)
                self.epsilon = save_data.get('epsilon', self.epsilon)
            else:
                # Legacy format
                q_table_serializable = save_data
            
            self.q_table = collections.defaultdict(lambda: np.zeros(0))
            for state, values in q_table_serializable.items():
                self.q_table[state] = np.array(values)
            logging.info(f"Q-table loaded successfully from {self.plan_library_path}")
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logging.warning(f"Could not load Q-table from {self.plan_library_path}: {e}. Starting fresh.")
            self.q_table = collections.defaultdict(lambda: np.zeros(0))

    def save_q_table(self):
        """Saves the Q-table to the plan library file."""
        q_table_serializable = {state: values.tolist() for state, values in self.q_table.items()}
        with open(self.plan_library_path, 'w') as f:
            json.dump(q_table_serializable, f, indent=4)

    def get_action(self, state, available_actions):
        """Chooses an action based on the current state using an epsilon-greedy policy."""
        if np.random.random() < self.epsilon or len(self.q_table[state]) != len(available_actions):
            return np.random.choice(available_actions)
        else:
            return self.get_best_action(state, available_actions)

    def get_best_action(self, state, available_actions):
        """Returns the best action for a given state based on the Q-table."""
        state_q_values = self.q_table[state]
        if len(state_q_values) == 0:
            return np.random.choice(available_actions)
        best_action_index = np.argmax(state_q_values)
        return available_actions[best_action_index]

    def calculate_reward(self, outcome: Dict[str, Any], action_time: float) -> float:
        """Calculate reward based on task outcome and performance metrics."""
        reward = 0
        
        # Task goal achievement
        if outcome.get('task_completed', False):
            reward += self.REWARD_TASK_GOAL
            self.performance_metrics['successful_tasks'] += 1
            logging.info(f"Task goal achieved: +{self.REWARD_TASK_GOAL} reward")
        
        # Critical error penalty
        if outcome.get('critical_error', False):
            reward += self.REWARD_CRITICAL_ERROR
            self.performance_metrics['critical_errors'] += 1
            logging.warning(f"Critical error occurred: {self.REWARD_CRITICAL_ERROR} reward")
        
        # Latency penalty (per second over threshold)
        latency_threshold = 5.0  # 5 seconds threshold
        if action_time > latency_threshold:
            latency_penalty = int((action_time - latency_threshold) * self.REWARD_LATENCY)
            reward += latency_penalty
            logging.info(f"Latency penalty: {latency_penalty} reward for {action_time:.2f}s execution")
        
        # Update performance metrics
        self.performance_metrics['total_actions'] += 1
        if self.performance_metrics['total_actions'] > 0:
            self.performance_metrics['average_latency'] = (
                (self.performance_metrics['average_latency'] * (self.performance_metrics['total_actions'] - 1) + action_time) 
                / self.performance_metrics['total_actions']
            )
        
        return reward
    
    def update(self, state: str, action: str, reward: float, next_state: str, available_actions: List[str], 
               execution_time: float) -> None:
        """Enhanced update method with comprehensive tracking."""
        # Calculate performance-based reward
        outcome = {'task_completed': reward > 0, 'critical_error': reward < -40}
        final_reward = self.calculate_reward(outcome, execution_time)
        
        # Store history
        self.action_history.append({
            'state': state,
            'action': action,
            'reward': final_reward,
            'next_state': next_state,
            'timestamp': time.time(),
            'execution_time': execution_time
        })
        self.reward_history.append(final_reward)
        
        # Track state transitions
        self.state_transitions[state].append({
            'action': action,
            'next_state': next_state,
            'reward': final_reward
        })
        
        # Update Q-table with proper dimensions
        num_actions = len(available_actions)
        if len(self.q_table[state]) != num_actions:
            self.q_table[state] = np.zeros(num_actions)
        if len(self.q_table[next_state]) != num_actions:
            self.q_table[next_state] = np.zeros(num_actions)

        action_index = available_actions.index(action)
        old_value = self.q_table[state][action_index]
        next_max = np.max(self.q_table[next_state])
        new_value = old_value + self.lr * (final_reward + self.gamma * next_max - old_value)
        self.q_table[state][action_index] = new_value
        
        # Decay exploration rate
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
        
        # Calculate convergence rate
        if len(self.reward_history) > 100:
            recent_rewards = self.reward_history[-100:]
            self.performance_metrics['convergence_rate'] = np.mean(recent_rewards)
        
        logging.info(f"Q-learning update: state={state[:50]}..., action={action}, reward={final_reward:.2f}")
        
        # Save updated Q-table
        self.save_q_table()
    
    def get_optimal_policy(self, state: str, available_actions: List[str]) -> Optional[str]:
        """Get the optimal action for a given state based on learned policy."""
        if len(self.q_table[state]) == 0:
            return None
        return self.get_best_action(state, available_actions)
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Return current performance metrics."""
        return {
            **self.performance_metrics,
            'exploration_rate': self.epsilon,
            'q_table_size': len(self.q_table),
            'recent_performance': np.mean(self.reward_history[-50:]) if len(self.reward_history) >= 50 else 0
        }
    
    def save_q_table(self):
        """Saves the Q-table and metadata to the plan library file."""
        q_table_serializable = {state: values.tolist() for state, values in self.q_table.items()}
        save_data = {
            'q_table': q_table_serializable,
            'performance_metrics': self.performance_metrics,
            'epsilon': self.epsilon,
            'last_updated': time.time()
        }
        
        with open(self.plan_library_path, 'w') as f:
            json.dump(save_data, f, indent=4)
        
        logging.info(f"Q-table and metrics saved to {self.plan_library_path}")

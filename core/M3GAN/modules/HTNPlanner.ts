// core/M3GAN/modules/HTNPlanner.ts
// Hierarchical Task Network Planner for M3GAN

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'primitive' | 'compound';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  preconditions: string[];
  effects: string[];
  duration: number; // estimated duration in milliseconds
  resources: string[];
  dependencies: string[];
  subtasks?: Task[];
  parentTask?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Task[];
  estimatedDuration: number;
  confidence: number;
  createdAt: Date;
  status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed';
}

export interface HTNPlannerConfig {
  userId: string;
  maxPlanningTime: number; // milliseconds
  maxTaskDepth: number;
  enableContingencyPlanning: boolean;
  enableLearning: boolean;
  confidenceThreshold: number;
}

export class HTNPlanner extends EventEmitter {
  private config: HTNPlannerConfig;
  private isActive: boolean = false;
  private taskLibrary: Map<string, Task> = new Map();
  private activePlans: Map<string, Plan> = new Map();
  private taskHistory: Task[] = [];
  private learningData: Map<string, any> = new Map();

  constructor(config: HTNPlannerConfig) {
    super();
    this.config = config;
    logger.info('HTN Planner initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize task library with common tasks
      await this.initializeTaskLibrary();
      
      // Load learning data if available
      await this.loadLearningData();
      
      this.isActive = true;
      logger.info('HTN Planner initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('HTN Planner initialization failed:', error);
      throw error;
    }
  }

  private async initializeTaskLibrary(): Promise<void> {
    // Define primitive tasks (leaf nodes in HTN)
    const primitiveTasks: Task[] = [
      {
        id: 'turn_on_light',
        name: 'Turn On Light',
        description: 'Turn on a specific light',
        type: 'primitive',
        priority: 'medium',
        status: 'pending',
        preconditions: ['light_exists', 'light_off'],
        effects: ['light_on'],
        duration: 1000,
        resources: ['light_controller'],
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: 'turn_off_light',
        name: 'Turn Off Light',
        description: 'Turn off a specific light',
        type: 'primitive',
        priority: 'medium',
        status: 'pending',
        preconditions: ['light_exists', 'light_on'],
        effects: ['light_off'],
        duration: 1000,
        resources: ['light_controller'],
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: 'adjust_thermostat',
        name: 'Adjust Thermostat',
        description: 'Set thermostat to specific temperature',
        type: 'primitive',
        priority: 'medium',
        status: 'pending',
        preconditions: ['thermostat_exists'],
        effects: ['temperature_set'],
        duration: 2000,
        resources: ['thermostat_controller'],
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: 'play_music',
        name: 'Play Music',
        description: 'Start playing music on audio system',
        type: 'primitive',
        priority: 'low',
        status: 'pending',
        preconditions: ['audio_system_exists'],
        effects: ['music_playing'],
        duration: 3000,
        resources: ['audio_controller'],
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: 'send_notification',
        name: 'Send Notification',
        description: 'Send a notification to user',
        type: 'primitive',
        priority: 'medium',
        status: 'pending',
        preconditions: ['notification_system_exists'],
        effects: ['notification_sent'],
        duration: 500,
        resources: ['notification_service'],
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: 'analyze_emotion',
        name: 'Analyze Emotion',
        description: 'Analyze user emotional state',
        type: 'primitive',
        priority: 'high',
        status: 'pending',
        preconditions: ['emotion_detection_available'],
        effects: ['emotion_analyzed'],
        duration: 2000,
        resources: ['emotion_analyzer'],
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: 'check_weather',
        name: 'Check Weather',
        description: 'Get current weather information',
        type: 'primitive',
        priority: 'medium',
        status: 'pending',
        preconditions: ['weather_service_available'],
        effects: ['weather_checked'],
        duration: 5000,
        resources: ['weather_api'],
        dependencies: [],
        createdAt: new Date()
      }
    ];

    // Define compound tasks (tasks that decompose into subtasks)
    const compoundTasks: Task[] = [
      {
        id: 'create_mood_lighting',
        name: 'Create Mood Lighting',
        description: 'Set up lighting for a specific mood',
        type: 'compound',
        priority: 'medium',
        status: 'pending',
        preconditions: ['lights_available'],
        effects: ['mood_lighting_set'],
        duration: 5000,
        resources: ['light_controller'],
        dependencies: [],
        subtasks: [],
        createdAt: new Date()
      },
      {
        id: 'prepare_room_for_sleep',
        name: 'Prepare Room for Sleep',
        description: 'Set up room environment for optimal sleep',
        type: 'compound',
        priority: 'high',
        status: 'pending',
        preconditions: ['room_environment_controllable'],
        effects: ['room_ready_for_sleep'],
        duration: 10000,
        resources: ['light_controller', 'thermostat_controller', 'audio_controller'],
        dependencies: [],
        subtasks: [],
        createdAt: new Date()
      },
      {
        id: 'provide_emotional_support',
        name: 'Provide Emotional Support',
        description: 'Provide emotional support based on user state',
        type: 'compound',
        priority: 'high',
        status: 'pending',
        preconditions: ['emotion_detection_available'],
        effects: ['emotional_support_provided'],
        duration: 8000,
        resources: ['emotion_analyzer', 'notification_service', 'audio_controller'],
        dependencies: [],
        subtasks: [],
        createdAt: new Date()
      }
    ];

    // Add all tasks to library
    [...primitiveTasks, ...compoundTasks].forEach(task => {
      this.taskLibrary.set(task.id, task);
    });

    logger.info(`Task library initialized with ${this.taskLibrary.size} tasks`);
  }

  private async loadLearningData(): Promise<void> {
    // In a real implementation, this would load learning data from persistent storage
    logger.info('Loading learning data...');
    
    // Simulate loading some learning data
    this.learningData.set('task_success_rates', {
      'turn_on_light': 0.95,
      'turn_off_light': 0.95,
      'adjust_thermostat': 0.90,
      'play_music': 0.85,
      'send_notification': 0.98,
      'analyze_emotion': 0.80,
      'check_weather': 0.88
    });

    this.learningData.set('task_durations', {
      'turn_on_light': 1200,
      'turn_off_light': 1100,
      'adjust_thermostat': 2500,
      'play_music': 3500,
      'send_notification': 600,
      'analyze_emotion': 2200,
      'check_weather': 6000
    });

    logger.info('Learning data loaded successfully');
  }

  // Public API Methods
  public async planTask(goal: string, context?: any): Promise<Task> {
    if (!this.isActive) {
      throw new Error('HTN Planner is not active');
    }

    try {
      logger.info('Planning task for goal:', goal);
      
      // Create a new plan
      const plan = await this.createPlan(goal, context);
      
      // Find the best task to achieve the goal
      const task = await this.findBestTask(goal, context);
      
      // Decompose compound tasks if needed
      if (task.type === 'compound') {
        await this.decomposeTask(task, context);
      }
      
      // Emit task planned event
      this.emit('taskPlanned', task);
      
      logger.info('Task planned successfully:', { taskId: task.id, goal });
      return task;
    } catch (error) {
      logger.error('Task planning failed:', error);
      throw error;
    }
  }

  private async createPlan(goal: string, context?: any): Promise<Plan> {
    const plan: Plan = {
      id: `plan_${Date.now()}`,
      goal,
      tasks: [],
      estimatedDuration: 0,
      confidence: 0.8,
      createdAt: new Date(),
      status: 'planning'
    };

    this.activePlans.set(plan.id, plan);
    return plan;
  }

  private async findBestTask(goal: string, context?: any): Promise<Task> {
    // Simple goal-to-task mapping
    const goalMappings: Record<string, string> = {
      'turn on lights': 'turn_on_light',
      'turn off lights': 'turn_off_light',
      'adjust temperature': 'adjust_thermostat',
      'play music': 'play_music',
      'send notification': 'send_notification',
      'analyze emotion': 'analyze_emotion',
      'check weather': 'check_weather',
      'create mood lighting': 'create_mood_lighting',
      'prepare for sleep': 'prepare_room_for_sleep',
      'provide emotional support': 'provide_emotional_support'
    };

    const lowerGoal = goal.toLowerCase();
    let taskId = 'send_notification'; // default fallback

    // Find matching task
    for (const [key, value] of Object.entries(goalMappings)) {
      if (lowerGoal.includes(key)) {
        taskId = value;
        break;
      }
    }

    const baseTask = this.taskLibrary.get(taskId);
    if (!baseTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Create a new instance of the task
    const task: Task = {
      ...baseTask,
      id: `${baseTask.id}_${Date.now()}`,
      createdAt: new Date()
    };

    return task;
  }

  private async decomposeTask(task: Task, context?: any): Promise<void> {
    logger.info('Decomposing compound task:', task.id);

    switch (task.id) {
      case 'create_mood_lighting':
        task.subtasks = [
          { ...this.taskLibrary.get('turn_on_light')!, id: `turn_on_light_${Date.now()}`, createdAt: new Date() },
          { ...this.taskLibrary.get('adjust_thermostat')!, id: `adjust_thermostat_${Date.now()}`, createdAt: new Date() }
        ];
        break;

      case 'prepare_room_for_sleep':
        task.subtasks = [
          { ...this.taskLibrary.get('turn_off_light')!, id: `turn_off_light_${Date.now()}`, createdAt: new Date() },
          { ...this.taskLibrary.get('adjust_thermostat')!, id: `adjust_thermostat_${Date.now()}`, createdAt: new Date() },
          { ...this.taskLibrary.get('play_music')!, id: `play_music_${Date.now()}`, createdAt: new Date() }
        ];
        break;

      case 'provide_emotional_support':
        task.subtasks = [
          { ...this.taskLibrary.get('analyze_emotion')!, id: `analyze_emotion_${Date.now()}`, createdAt: new Date() },
          { ...this.taskLibrary.get('send_notification')!, id: `send_notification_${Date.now()}`, createdAt: new Date() },
          { ...this.taskLibrary.get('play_music')!, id: `play_music_${Date.now()}`, createdAt: new Date() }
        ];
        break;

      default:
        logger.warn('Unknown compound task:', task.id);
    }

    // Set up dependencies between subtasks
    if (task.subtasks) {
      for (let i = 1; i < task.subtasks.length; i++) {
        task.subtasks[i].dependencies.push(task.subtasks[i - 1].id);
      }
    }
  }

  public async executeTask(task: Task): Promise<boolean> {
    try {
      logger.info('Executing task:', task.id);
      
      task.status = 'in_progress';
      task.startedAt = new Date();
      
      // Execute subtasks first if this is a compound task
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          const success = await this.executeTask(subtask);
          if (!success) {
            task.status = 'failed';
            task.error = `Subtask ${subtask.id} failed`;
            this.emit('taskFailed', task);
            return false;
          }
        }
      }

      // Simulate task execution
      await this.simulateTaskExecution(task);

      task.status = 'completed';
      task.completedAt = new Date();
      
      // Update learning data
      await this.updateLearningData(task);
      
      // Add to history
      this.taskHistory.push(task);
      
      this.emit('taskCompleted', task);
      logger.info('Task completed successfully:', task.id);
      return true;
    } catch (error) {
      logger.error('Task execution failed:', error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('taskFailed', task);
      return false;
    }
  }

  private async simulateTaskExecution(task: Task): Promise<void> {
    // Simulate execution time based on task duration
    await new Promise(resolve => setTimeout(resolve, Math.min(task.duration, 1000)));
    
    // Simulate occasional failures for learning
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated task execution failure');
    }
  }

  private async updateLearningData(task: Task): Promise<void> {
    if (!this.config.enableLearning) return;

    const successRates = this.learningData.get('task_success_rates') || {};
    const durations = this.learningData.get('task_durations') || {};

    // Update success rate
    const baseTaskId = task.id.split('_')[0] + '_' + task.id.split('_')[1];
    const currentRate = successRates[baseTaskId] || 0.8;
    const newRate = task.status === 'completed' ? 
      Math.min(1.0, currentRate + 0.01) : 
      Math.max(0.0, currentRate - 0.05);
    successRates[baseTaskId] = newRate;

    // Update duration estimate
    if (task.startedAt && task.completedAt) {
      const actualDuration = task.completedAt.getTime() - task.startedAt.getTime();
      const currentDuration = durations[baseTaskId] || task.duration;
      durations[baseTaskId] = (currentDuration + actualDuration) / 2;
    }

    this.learningData.set('task_success_rates', successRates);
    this.learningData.set('task_durations', durations);
  }

  public async getTaskHistory(): Promise<Task[]> {
    return [...this.taskHistory];
  }

  public async getActivePlans(): Promise<Plan[]> {
    return Array.from(this.activePlans.values());
  }

  public async getTaskLibrary(): Promise<Task[]> {
    return Array.from(this.taskLibrary.values());
  }

  public async updateConfig(newConfig: Partial<HTNPlannerConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('HTN Planner config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && this.taskLibrary.size > 0;
    } catch (error) {
      logger.error('HTN Planner health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('HTN Planner shutting down...');
    
    this.isActive = false;
    
    // Save learning data
    await this.saveLearningData();
    
    // Clear active plans
    this.activePlans.clear();
    
    logger.info('HTN Planner shutdown complete');
    this.emit('shutdown');
  }

  private async saveLearningData(): Promise<void> {
    // In a real implementation, this would save learning data to persistent storage
    logger.info('Saving learning data...');
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info('Learning data saved successfully');
  }
}

export default HTNPlanner;

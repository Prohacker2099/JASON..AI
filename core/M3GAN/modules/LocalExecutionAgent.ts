// core/M3GAN/modules/LocalExecutionAgent.ts
// Local Execution Agent (LEA) for M3GAN

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';
import { Task } from '../HTNPlanner';

export interface DeviceCommand {
  deviceId: string;
  action: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  deviceResponses: DeviceResponse[];
}

export interface DeviceResponse {
  deviceId: string;
  success: boolean;
  response?: any;
  error?: string;
  timestamp: Date;
}

export interface LEAConfig {
  userId: string;
  enableDeviceControl: boolean;
  enableLocalProcessing: boolean;
  enableOfflineMode: boolean;
  maxConcurrentTasks: number;
  defaultTimeout: number;
  retryAttempts: number;
}

export class LocalExecutionAgent extends EventEmitter {
  private config: LEAConfig;
  private isActive: boolean = false;
  private activeTasks: Map<string, Task> = new Map();
  private deviceRegistry: Map<string, any> = new Map();
  private executionQueue: Task[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: LEAConfig) {
    super();
    this.config = config;
    logger.info('Local Execution Agent initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize device registry
      await this.initializeDeviceRegistry();
      
      // Start execution processing loop
      this.startProcessingLoop();
      
      this.isActive = true;
      logger.info('Local Execution Agent initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Local Execution Agent initialization failed:', error);
      throw error;
    }
  }

  private async initializeDeviceRegistry(): Promise<void> {
    // In a real implementation, this would scan for available devices
    logger.info('Initializing device registry...');
    
    // Simulate device discovery
    const simulatedDevices = [
      {
        id: 'living_room_light',
        name: 'Living Room Light',
        type: 'light',
        capabilities: ['on', 'off', 'brightness', 'color'],
        status: 'online',
        lastSeen: new Date()
      },
      {
        id: 'kitchen_light',
        name: 'Kitchen Light',
        type: 'light',
        capabilities: ['on', 'off', 'brightness'],
        status: 'online',
        lastSeen: new Date()
      },
      {
        id: 'thermostat_main',
        name: 'Main Thermostat',
        type: 'thermostat',
        capabilities: ['temperature', 'mode', 'fan'],
        status: 'online',
        lastSeen: new Date()
      },
      {
        id: 'speaker_living_room',
        name: 'Living Room Speaker',
        type: 'audio',
        capabilities: ['play', 'pause', 'volume', 'source'],
        status: 'online',
        lastSeen: new Date()
      },
      {
        id: 'security_camera_front',
        name: 'Front Security Camera',
        type: 'camera',
        capabilities: ['stream', 'record', 'motion_detection'],
        status: 'online',
        lastSeen: new Date()
      }
    ];

    simulatedDevices.forEach(device => {
      this.deviceRegistry.set(device.id, device);
    });

    logger.info(`Device registry initialized with ${simulatedDevices.length} devices`);
  }

  private startProcessingLoop(): void {
    // Process execution queue every 100ms
    this.processingInterval = setInterval(async () => {
      if (this.isActive && this.executionQueue.length > 0) {
        await this.processExecutionQueue();
      }
    }, 100);
  }

  private async processExecutionQueue(): Promise<void> {
    const availableSlots = this.config.maxConcurrentTasks - this.activeTasks.size;
    
    if (availableSlots > 0) {
      const tasksToProcess = this.executionQueue.splice(0, availableSlots);
      
      for (const task of tasksToProcess) {
        this.executeTask(task);
      }
    }
  }

  // Public API Methods
  public async canExecute(task: Task): Promise<boolean> {
    if (!this.isActive) return false;
    
    // Check if task requires devices that are available
    if (task.resources && task.resources.length > 0) {
      for (const resource of task.resources) {
        if (!this.deviceRegistry.has(resource)) {
          logger.warn(`Required resource not available: ${resource}`);
          return false;
        }
      }
    }

    // Check if task can be executed locally
    return this.isLocalTask(task);
  }

  private isLocalTask(task: Task): boolean {
    const localTaskTypes = [
      'turn_on_light',
      'turn_off_light',
      'adjust_thermostat',
      'play_music',
      'send_notification',
      'analyze_emotion'
    ];

    return localTaskTypes.includes(task.id.split('_')[0] + '_' + task.id.split('_')[1]);
  }

  public async execute(task: Task): Promise<string> {
    if (!this.isActive) {
      throw new Error('Local Execution Agent is not active');
    }

    try {
      logger.info('Executing task locally:', task.id);
      
      // Add to active tasks
      this.activeTasks.set(task.id, task);
      
      // Execute the task
      const result = await this.executeTaskInternal(task);
      
      // Remove from active tasks
      this.activeTasks.delete(task.id);
      
      logger.info('Task executed successfully:', { taskId: task.id, success: result.success });
      return result.success ? 'Task completed successfully' : `Task failed: ${result.error}`;
    } catch (error) {
      logger.error('Task execution failed:', error);
      this.activeTasks.delete(task.id);
      throw error;
    }
  }

  private async executeTask(task: Task): Promise<void> {
    try {
      await this.executeTaskInternal(task);
    } catch (error) {
      logger.error('Task execution error:', error);
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  private async executeTaskInternal(task: Task): Promise<ExecutionResult> {
    const startTime = Date.now();
    const deviceResponses: DeviceResponse[] = [];

    try {
      // Execute based on task type
      let result: any;
      
      switch (task.id.split('_')[0] + '_' + task.id.split('_')[1]) {
        case 'turn_on_light':
          result = await this.executeLightControl(task, 'on');
          break;
        case 'turn_off_light':
          result = await this.executeLightControl(task, 'off');
          break;
        case 'adjust_thermostat':
          result = await this.executeThermostatControl(task);
          break;
        case 'play_music':
          result = await this.executeMusicControl(task);
          break;
        case 'send_notification':
          result = await this.executeNotification(task);
          break;
        case 'analyze_emotion':
          result = await this.executeEmotionAnalysis(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.id}`);
      }

      const executionTime = Date.now() - startTime;
      
      const executionResult: ExecutionResult = {
        success: true,
        result,
        executionTime,
        deviceResponses
      };

      this.emit('taskCompleted', { task, result: executionResult });
      return executionResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const executionResult: ExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        deviceResponses
      };

      this.emit('taskFailed', { task, result: executionResult });
      return executionResult;
    }
  }

  private async executeLightControl(task: Task, action: 'on' | 'off'): Promise<any> {
    const lightDevices = Array.from(this.deviceRegistry.values())
      .filter(device => device.type === 'light');
    
    if (lightDevices.length === 0) {
      throw new Error('No light devices available');
    }

    const commands: DeviceCommand[] = lightDevices.map(device => ({
      deviceId: device.id,
      action,
      parameters: action === 'on' ? { brightness: 80 } : {},
      priority: 'medium',
      timeout: 5000
    }));

    const responses = await this.executeDeviceCommands(commands);
    
    return {
      action,
      devicesControlled: responses.length,
      responses
    };
  }

  private async executeThermostatControl(task: Task): Promise<any> {
    const thermostat = this.deviceRegistry.get('thermostat_main');
    if (!thermostat) {
      throw new Error('Thermostat not available');
    }

    const command: DeviceCommand = {
      deviceId: thermostat.id,
      action: 'set_temperature',
      parameters: { temperature: 72 }, // Default temperature
      priority: 'medium',
      timeout: 10000
    };

    const responses = await this.executeDeviceCommands([command]);
    
    return {
      action: 'temperature_adjusted',
      targetTemperature: 72,
      responses
    };
  }

  private async executeMusicControl(task: Task): Promise<any> {
    const speaker = this.deviceRegistry.get('speaker_living_room');
    if (!speaker) {
      throw new Error('Speaker not available');
    }

    const command: DeviceCommand = {
      deviceId: speaker.id,
      action: 'play',
      parameters: { 
        source: 'relaxing_music',
        volume: 50 
      },
      priority: 'low',
      timeout: 5000
    };

    const responses = await this.executeDeviceCommands([command]);
    
    return {
      action: 'music_started',
      source: 'relaxing_music',
      responses
    };
  }

  private async executeNotification(task: Task): Promise<any> {
    // Simulate sending notification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      action: 'notification_sent',
      message: 'M3GAN notification sent successfully',
      timestamp: new Date()
    };
  }

  private async executeEmotionAnalysis(task: Task): Promise<any> {
    // Simulate emotion analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const emotions = ['happy', 'sad', 'neutral', 'stressed', 'calm'];
    const detectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    return {
      action: 'emotion_analyzed',
      detectedEmotion,
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: new Date()
    };
  }

  private async executeDeviceCommands(commands: DeviceCommand[]): Promise<DeviceResponse[]> {
    const responses: DeviceResponse[] = [];
    
    for (const command of commands) {
      try {
        const response = await this.executeDeviceCommand(command);
        responses.push(response);
      } catch (error) {
        const errorResponse: DeviceResponse = {
          deviceId: command.deviceId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        };
        responses.push(errorResponse);
      }
    }
    
    return responses;
  }

  private async executeDeviceCommand(command: DeviceCommand): Promise<DeviceResponse> {
    const device = this.deviceRegistry.get(command.deviceId);
    if (!device) {
      throw new Error(`Device not found: ${command.deviceId}`);
    }

    if (device.status !== 'online') {
      throw new Error(`Device offline: ${command.deviceId}`);
    }

    // Simulate device command execution
    const executionTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));

    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Device command failed');
    }

    const response: DeviceResponse = {
      deviceId: command.deviceId,
      success: true,
      response: {
        action: command.action,
        parameters: command.parameters,
        executedAt: new Date()
      },
      timestamp: new Date()
    };

    logger.info('Device command executed:', { 
      deviceId: command.deviceId, 
      action: command.action 
    });

    return response;
  }

  public async getDeviceStatus(): Promise<Array<{ id: string; name: string; type: string; status: string }>> {
    return Array.from(this.deviceRegistry.values()).map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status
    }));
  }

  public async getActiveTasks(): Promise<Task[]> {
    return Array.from(this.activeTasks.values());
  }

  public async getExecutionQueue(): Promise<Task[]> {
    return [...this.executionQueue];
  }

  public async updateConfig(newConfig: Partial<LEAConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Local Execution Agent config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const onlineDevices = Array.from(this.deviceRegistry.values())
        .filter(device => device.status === 'online');
      
      return this.isActive && onlineDevices.length > 0;
    } catch (error) {
      logger.error('Local Execution Agent health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Local Execution Agent shutting down...');
    
    this.isActive = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Clear active tasks
    this.activeTasks.clear();
    
    // Clear execution queue
    this.executionQueue = [];
    
    logger.info('Local Execution Agent shutdown complete');
    this.emit('shutdown');
  }
}

export default LocalExecutionAgent;

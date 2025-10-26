// core/M3GAN/modules/M3GANEyeInterface.ts
// M3GAN Eye Interface - Floating Widget and Status Display

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface M3GANEyeStatus {
  color: 'blue' | 'green' | 'yellow' | 'red';
  state: 'idle' | 'executing' | 'awaiting_confirmation' | 'ethical_conflict' | 'blocked';
  message: string;
  progress?: number;
  timestamp: Date;
}

export interface TaskFeed {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  estimatedDuration: number;
  actualDuration?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface ControlPanel {
  pauseEnabled: boolean;
  overrideEnabled: boolean;
  reviewEnabled: boolean;
  emergencyStopEnabled: boolean;
  currentAction?: string;
  availableActions: string[];
}

export interface M3GANEyeConfig {
  userId: string;
  enableFloatingWidget: boolean;
  enableStatusRing: boolean;
  enableControlPanel: boolean;
  enableTaskFeed: boolean;
  updateInterval: number; // milliseconds
  maxTaskHistory: number;
  enableNotifications: boolean;
}

export class M3GANEyeInterface extends EventEmitter {
  private config: M3GANEyeConfig;
  private isActive: boolean = false;
  private currentStatus: M3GANEyeStatus;
  private taskFeed: TaskFeed[] = [];
  private controlPanel: ControlPanel;
  private updateInterval: NodeJS.Timeout | null = null;
  private notificationQueue: Array<{ id: string; message: string; type: 'info' | 'warning' | 'error'; timestamp: Date }> = [];

  constructor(config: M3GANEyeConfig) {
    super();
    this.config = config;
    this.currentStatus = {
      color: 'blue',
      state: 'idle',
      message: 'M3GAN is ready',
      timestamp: new Date()
    };
    this.controlPanel = {
      pauseEnabled: false,
      overrideEnabled: false,
      reviewEnabled: true,
      emergencyStopEnabled: true,
      availableActions: ['pause', 'override', 'review', 'emergency_stop']
    };
    logger.info('M3GAN Eye Interface initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize interface components
      await this.initializeInterface();
      
      // Start update loop
      this.startUpdateLoop();
      
      this.isActive = true;
      logger.info('M3GAN Eye Interface initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('M3GAN Eye Interface initialization failed:', error);
      throw error;
    }
  }

  private async initializeInterface(): Promise<void> {
    logger.info('Initializing M3GAN Eye Interface components...');
    
    // Initialize with default status
    this.updateStatus('idle', 'M3GAN is ready and waiting for your command');
    
    // Add initial task
    this.addTask({
      id: 'system_init',
      title: 'System Initialization',
      description: 'M3GAN Eye Interface starting up',
      status: 'completed',
      priority: 'medium',
      progress: 100,
      estimatedDuration: 2000,
      actualDuration: 2000,
      createdAt: new Date(Date.now() - 2000),
      startedAt: new Date(Date.now() - 2000),
      completedAt: new Date()
    });

    logger.info('M3GAN Eye Interface components initialized');
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.updateInterface();
    }, this.config.updateInterval);
  }

  private updateInterface(): void {
    // Update status based on current tasks
    this.updateStatusBasedOnTasks();
    
    // Update control panel state
    this.updateControlPanel();
    
    // Emit interface update
    this.emit('interfaceUpdate', {
      status: this.currentStatus,
      taskFeed: this.taskFeed.slice(-10), // Last 10 tasks
      controlPanel: this.controlPanel,
      notifications: this.notificationQueue.slice(-5) // Last 5 notifications
    });
  }

  private updateStatusBasedOnTasks(): void {
    const activeTasks = this.taskFeed.filter(task => task.status === 'in_progress');
    const blockedTasks = this.taskFeed.filter(task => task.status === 'blocked');
    const pendingTasks = this.taskFeed.filter(task => task.status === 'pending');

    if (blockedTasks.length > 0) {
      this.updateStatus('ethical_conflict', `Blocked: ${blockedTasks[0].title}`);
    } else if (activeTasks.length > 0) {
      const task = activeTasks[0];
      this.updateStatus('executing', `Executing: ${task.title}`, task.progress);
    } else if (pendingTasks.length > 0) {
      this.updateStatus('awaiting_confirmation', `Awaiting confirmation: ${pendingTasks[0].title}`);
    } else {
      this.updateStatus('idle', 'M3GAN is ready');
    }
  }

  private updateControlPanel(): void {
    const activeTasks = this.taskFeed.filter(task => task.status === 'in_progress');
    const blockedTasks = this.taskFeed.filter(task => task.status === 'blocked');

    this.controlPanel.pauseEnabled = activeTasks.length > 0;
    this.controlPanel.overrideEnabled = blockedTasks.length > 0;
    this.controlPanel.reviewEnabled = this.taskFeed.length > 0;
    this.controlPanel.emergencyStopEnabled = true;

    if (activeTasks.length > 0) {
      this.controlPanel.currentAction = activeTasks[0].title;
    } else if (blockedTasks.length > 0) {
      this.controlPanel.currentAction = `Blocked: ${blockedTasks[0].title}`;
    } else {
      this.controlPanel.currentAction = undefined;
    }
  }

  // Public API Methods
  public updateStatus(state: M3GANEyeStatus['state'], message: string, progress?: number): void {
    const colorMap: Record<M3GANEyeStatus['state'], M3GANEyeStatus['color']> = {
      'idle': 'blue',
      'executing': 'green',
      'awaiting_confirmation': 'yellow',
      'ethical_conflict': 'red',
      'blocked': 'red'
    };

    this.currentStatus = {
      color: colorMap[state],
      state,
      message,
      progress,
      timestamp: new Date()
    };

    this.emit('statusUpdate', this.currentStatus);
    logger.info('M3GAN Eye status updated:', { state, message, progress });
  }

  public addTask(task: Omit<TaskFeed, 'id' | 'createdAt'>): void {
    const newTask: TaskFeed = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.taskFeed.push(newTask);

    // Limit task history
    if (this.taskFeed.length > this.config.maxTaskHistory) {
      this.taskFeed = this.taskFeed.slice(-this.config.maxTaskHistory);
    }

    this.emit('taskAdded', newTask);
    logger.info('Task added to M3GAN Eye:', { taskId: newTask.id, title: newTask.title });
  }

  public updateTask(taskId: string, updates: Partial<TaskFeed>): void {
    const taskIndex = this.taskFeed.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const updatedTask = { ...this.taskFeed[taskIndex], ...updates };
    this.taskFeed[taskIndex] = updatedTask;

    this.emit('taskUpdated', updatedTask);
    logger.info('Task updated in M3GAN Eye:', { taskId, updates });
  }

  public pauseCurrentAction(): boolean {
    const activeTasks = this.taskFeed.filter(task => task.status === 'in_progress');
    if (activeTasks.length === 0) return false;

    for (const task of activeTasks) {
      this.updateTask(task.id, { status: 'pending' });
    }

    this.updateStatus('awaiting_confirmation', 'Action paused - awaiting confirmation');
    this.emit('actionPaused', { taskIds: activeTasks.map(t => t.id) });
    
    logger.info('Current action paused');
    return true;
  }

  public overrideBlockedAction(): boolean {
    const blockedTasks = this.taskFeed.filter(task => task.status === 'blocked');
    if (blockedTasks.length === 0) return false;

    for (const task of blockedTasks) {
      this.updateTask(task.id, { status: 'in_progress' });
    }

    this.updateStatus('executing', 'Blocked action overridden');
    this.emit('actionOverridden', { taskIds: blockedTasks.map(t => t.id) });
    
    logger.info('Blocked action overridden');
    return true;
  }

  public reviewAction(taskId: string): TaskFeed | null {
    const task = this.taskFeed.find(t => t.id === taskId);
    if (!task) return null;

    this.emit('actionReview', task);
    logger.info('Action review requested:', { taskId, title: task.title });
    
    return task;
  }

  public emergencyStop(): void {
    // Cancel all active tasks
    const activeTasks = this.taskFeed.filter(task => task.status === 'in_progress');
    for (const task of activeTasks) {
      this.updateTask(task.id, { 
        status: 'failed', 
        error: 'Emergency stop activated',
        completedAt: new Date()
      });
    }

    this.updateStatus('blocked', 'EMERGENCY STOP ACTIVATED');
    this.controlPanel.emergencyStopEnabled = false;
    
    this.emit('emergencyStop');
    logger.critical('Emergency stop activated via M3GAN Eye Interface');
  }

  public addNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const notification = {
      id: `notification_${Date.now()}`,
      message,
      type,
      timestamp: new Date()
    };

    this.notificationQueue.push(notification);

    // Limit notification queue
    if (this.notificationQueue.length > 20) {
      this.notificationQueue = this.notificationQueue.slice(-20);
    }

    this.emit('notification', notification);
    logger.info('Notification added to M3GAN Eye:', { message, type });
  }

  public getCurrentStatus(): M3GANEyeStatus {
    return { ...this.currentStatus };
  }

  public getTaskFeed(): TaskFeed[] {
    return [...this.taskFeed];
  }

  public getControlPanel(): ControlPanel {
    return { ...this.controlPanel };
  }

  public getNotifications(): Array<{ id: string; message: string; type: 'info' | 'warning' | 'error'; timestamp: Date }> {
    return [...this.notificationQueue];
  }

  public updateConfig(newConfig: Partial<M3GANEyeConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('M3GAN Eye Interface config updated:', newConfig);
    this.emit('configUpdated', newConfig);
    return Promise.resolve();
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && this.currentStatus !== null;
    } catch (error) {
      logger.error('M3GAN Eye Interface health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('M3GAN Eye Interface shutting down...');
    
    this.isActive = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Clear data
    this.taskFeed = [];
    this.notificationQueue = [];
    
    logger.info('M3GAN Eye Interface shutdown complete');
    this.emit('shutdown');
  }
}

export default M3GANEyeInterface;

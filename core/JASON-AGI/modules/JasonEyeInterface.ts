// core/JASON-AGI/modules/JasonEyeInterface.ts
// Jason Eye Interface - The Unobtrusive Corner Widget

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface JasonEyeStatus {
  color: 'blue' | 'green' | 'yellow' | 'red';
  state: 'monitoring' | 'working' | 'waiting' | 'error' | 'blocked';
  message: string;
  progress?: number;
  timestamp: Date;
}

export interface ActivityFeedEntry {
  id: string;
  timestamp: Date;
  activity: string;
  domain: string;
  status: 'in_progress' | 'completed' | 'failed' | 'paused';
  details?: string;
}

export interface JasonEyeConfig {
  userId: string;
  enableFloatingWidget: boolean;
  enableActivityFeed: boolean;
  enableStatusIndicator: boolean;
  enableMinimization: boolean;
  enableGlobalHotkey: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size: 'small' | 'medium' | 'large';
  opacity: number; // 0-1 scale
  updateInterval: number; // milliseconds
  maxActivityEntries: number;
  enableNotifications: boolean;
}

export class JasonEyeInterface extends EventEmitter {
  private config: JasonEyeConfig;
  private isActive: boolean = false;
  private currentStatus: JasonEyeStatus;
  private activityFeed: ActivityFeedEntry[] = [];
  private isMinimized: boolean = false;
  private isHidden: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private activeTasks: Set<string> = new Set();

  constructor(config: JasonEyeConfig) {
    super();
    this.config = config;
    this.currentStatus = {
      color: 'blue',
      state: 'monitoring',
      message: 'JASON is monitoring and ready',
      timestamp: new Date()
    };
    logger.info('Jason Eye Interface initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize interface components
      await this.initializeInterface();
      
      // Start update loop
      this.startUpdateLoop();
      
      // Setup global hotkey if enabled
      if (this.config.enableGlobalHotkey) {
        this.setupGlobalHotkey();
      }
      
      this.isActive = true;
      logger.info('Jason Eye Interface initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Jason Eye Interface initialization failed:', error);
      throw error;
    }
  }

  private async initializeInterface(): Promise<void> {
    logger.info('Initializing Jason Eye Interface components...');
    
    // Initialize with default status
    this.updateStatus('monitoring', 'JASON is monitoring and ready');
    
    // Add initial activity
    this.addActivity('JASON Eye Interface initialized', 'system', 'completed');
    
    logger.info('Jason Eye Interface components initialized');
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.updateInterface();
    }, this.config.updateInterval);
  }

  private updateInterface(): void {
    // Update status based on current activities
    this.updateStatusBasedOnActivities();
    
    // Emit interface update
    this.emit('interfaceUpdate', {
      status: this.currentStatus,
      activityFeed: this.activityFeed.slice(-this.config.maxActivityEntries),
      isMinimized: this.isMinimized,
      isHidden: this.isHidden,
      activeTaskCount: this.activeTasks.size
    });
  }

  private updateStatusBasedOnActivities(): void {
    const activeActivities = this.activityFeed.filter(entry => entry.status === 'in_progress');
    const failedActivities = this.activityFeed.filter(entry => entry.status === 'failed');
    const waitingActivities = this.activityFeed.filter(entry => entry.status === 'paused');

    if (failedActivities.length > 0) {
      this.updateStatus('error', `Error: ${failedActivities[0].activity}`);
    } else if (waitingActivities.length > 0) {
      this.updateStatus('waiting', `Waiting: ${waitingActivities[0].activity}`);
    } else if (activeActivities.length > 0) {
      const activity = activeActivities[0];
      this.updateStatus('working', `Working: ${activity.activity}`);
    } else {
      this.updateStatus('monitoring', 'JASON is monitoring and ready');
    }
  }

  private setupGlobalHotkey(): void {
    // In a real implementation, this would setup global hotkeys
    logger.info('Global hotkey setup (simulated)');
    // Simulate hotkey setup
  }

  // Public API Methods
  public updateStatus(state: JasonEyeStatus['state'], message: string, progress?: number): void {
    const colorMap: Record<JasonEyeStatus['state'], JasonEyeStatus['color']> = {
      'monitoring': 'blue',
      'working': 'green',
      'waiting': 'yellow',
      'error': 'red',
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
    logger.info('Jason Eye status updated:', { state, message, progress });
  }

  public addActivity(activity: string, domain: string, status: ActivityFeedEntry['status'], details?: string): void {
    const entry: ActivityFeedEntry = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      activity,
      domain,
      status,
      details
    };

    this.activityFeed.push(entry);

    // Track active tasks
    if (status === 'in_progress') {
      this.activeTasks.add(entry.id);
    } else if (status === 'completed' || status === 'failed') {
      this.activeTasks.delete(entry.id);
    }

    // Limit activity feed size
    if (this.activityFeed.length > this.config.maxActivityEntries) {
      this.activityFeed = this.activityFeed.slice(-this.config.maxActivityEntries);
    }

    this.emit('activityAdded', entry);
    logger.info('Activity added to Jason Eye:', { activity, domain, status });
  }

  public updateActivity(activityId: string, updates: Partial<ActivityFeedEntry>): void {
    const activityIndex = this.activityFeed.findIndex(entry => entry.id === activityId);
    if (activityIndex === -1) return;

    const updatedActivity = { ...this.activityFeed[activityIndex], ...updates };
    this.activityFeed[activityIndex] = updatedActivity;

    // Update active tasks tracking
    if (updates.status === 'in_progress') {
      this.activeTasks.add(activityId);
    } else if (updates.status === 'completed' || updates.status === 'failed') {
      this.activeTasks.delete(activityId);
    }

    this.emit('activityUpdated', updatedActivity);
    logger.info('Activity updated in Jason Eye:', { activityId, updates });
  }

  public minimize(): void {
    this.isMinimized = true;
    this.emit('minimized');
    logger.info('Jason Eye minimized');
  }

  public maximize(): void {
    this.isMinimized = false;
    this.emit('maximized');
    logger.info('Jason Eye maximized');
  }

  public hide(): void {
    this.isHidden = true;
    this.emit('hidden');
    logger.info('Jason Eye hidden');
  }

  public show(): void {
    this.isHidden = false;
    this.emit('shown');
    logger.info('Jason Eye shown');
  }

  public toggleVisibility(): void {
    if (this.isHidden) {
      this.show();
    } else {
      this.hide();
    }
  }

  public toggleMinimization(): void {
    if (this.isMinimized) {
      this.maximize();
    } else {
      this.minimize();
    }
  }

  public getCurrentStatus(): JasonEyeStatus {
    return { ...this.currentStatus };
  }

  public getActivityFeed(): ActivityFeedEntry[] {
    return [...this.activityFeed];
  }

  public getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  public getActiveTasks(): string[] {
    return Array.from(this.activeTasks);
  }

  public isInterfaceMinimized(): boolean {
    return this.isMinimized;
  }

  public isInterfaceHidden(): boolean {
    return this.isHidden;
  }

  public getInterfaceState(): {
    status: JasonEyeStatus;
    activityFeed: ActivityFeedEntry[];
    isMinimized: boolean;
    isHidden: boolean;
    activeTaskCount: number;
  } {
    return {
      status: this.getCurrentStatus(),
      activityFeed: this.getActivityFeed(),
      isMinimized: this.isMinimized,
      isHidden: this.isHidden,
      activeTaskCount: this.getActiveTaskCount()
    };
  }

  public updateConfig(newConfig: Partial<JasonEyeConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Jason Eye Interface config updated:', newConfig);
    this.emit('configUpdated', newConfig);
    return Promise.resolve();
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && this.currentStatus !== null;
    } catch (error) {
      logger.error('Jason Eye Interface health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Jason Eye Interface shutting down...');
    
    this.isActive = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Clear data
    this.activityFeed = [];
    this.activeTasks.clear();
    
    logger.info('Jason Eye Interface shutdown complete');
    this.emit('shutdown');
  }
}

export default JasonEyeInterface;

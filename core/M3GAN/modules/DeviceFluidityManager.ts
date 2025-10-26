// core/M3GAN/modules/DeviceFluidityManager.ts
// Device Fluidity Manager for M3GAN - Seamless Device Transfer

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface Device {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'smart_speaker' | 'ar_glasses' | 'smartwatch' | 'tv';
  platform: 'ios' | 'android' | 'windows' | 'linux' | 'macos' | 'web';
  capabilities: string[];
  location: {
    room: string;
    coordinates?: { x: number; y: number; z: number };
    proximity: number; // meters from user
  };
  status: 'online' | 'offline' | 'busy' | 'sleeping';
  batteryLevel?: number;
  lastSeen: Date;
  sessionActive: boolean;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  currentDevice: string;
  previousDevice?: string;
  context: {
    task: string;
    progress: number;
    emotionalState: string;
    userMood: string;
    preferences: any;
  };
  history: Array<{
    deviceId: string;
    timestamp: Date;
    action: string;
  }>;
  createdAt: Date;
  lastActivity: Date;
}

export interface DeviceFluidityConfig {
  userId: string;
  enableAutoHandoff: boolean;
  enableProximityDetection: boolean;
  enableCrossPlatformSync: boolean;
  maxHandoffDistance: number; // meters
  handoffDelay: number; // milliseconds
  sessionTimeout: number; // milliseconds
}

export class DeviceFluidityManager extends EventEmitter {
  private config: DeviceFluidityConfig;
  private isActive: boolean = false;
  private devices: Map<string, Device> = new Map();
  private activeSession: SessionContext | null = null;
  private userLocation: { x: number; y: number; z: number } | null = null;
  private handoffQueue: Array<{ fromDevice: string; toDevice: string; timestamp: Date }> = [];
  private proximityMonitor: NodeJS.Timeout | null = null;

  constructor(config: DeviceFluidityConfig) {
    super();
    this.config = config;
    logger.info('Device Fluidity Manager initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize device discovery
      await this.initializeDeviceDiscovery();
      
      // Start proximity monitoring
      if (this.config.enableProximityDetection) {
        this.startProximityMonitoring();
      }
      
      // Initialize session management
      await this.initializeSessionManagement();
      
      this.isActive = true;
      logger.info('Device Fluidity Manager initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Device Fluidity Manager initialization failed:', error);
      throw error;
    }
  }

  private async initializeDeviceDiscovery(): Promise<void> {
    logger.info('Initializing device discovery...');
    
    // Simulate device discovery
    const simulatedDevices: Device[] = [
      {
        id: 'iphone_13',
        name: 'iPhone 13',
        type: 'phone',
        platform: 'ios',
        capabilities: ['voice', 'touch', 'camera', 'location', 'notifications'],
        location: { room: 'living_room', proximity: 0.5 },
        status: 'online',
        batteryLevel: 85,
        lastSeen: new Date(),
        sessionActive: false
      },
      {
        id: 'macbook_pro',
        name: 'MacBook Pro',
        type: 'laptop',
        platform: 'macos',
        capabilities: ['voice', 'keyboard', 'touchpad', 'camera', 'screen'],
        location: { room: 'office', proximity: 2.1 },
        status: 'online',
        batteryLevel: 78,
        lastSeen: new Date(),
        sessionActive: false
      },
      {
        id: 'alexa_echo',
        name: 'Alexa Echo',
        type: 'smart_speaker',
        platform: 'web',
        capabilities: ['voice', 'music', 'smart_home'],
        location: { room: 'kitchen', proximity: 3.2 },
        status: 'online',
        lastSeen: new Date(),
        sessionActive: false
      },
      {
        id: 'ipad_pro',
        name: 'iPad Pro',
        type: 'tablet',
        platform: 'ios',
        capabilities: ['voice', 'touch', 'camera', 'pencil'],
        location: { room: 'bedroom', proximity: 4.5 },
        status: 'online',
        batteryLevel: 92,
        lastSeen: new Date(),
        sessionActive: false
      },
      {
        id: 'meta_quest',
        name: 'Meta Quest Pro',
        type: 'ar_glasses',
        platform: 'web',
        capabilities: ['voice', 'gesture', 'eye_tracking', 'spatial_mapping'],
        location: { room: 'living_room', proximity: 1.8 },
        status: 'online',
        batteryLevel: 65,
        lastSeen: new Date(),
        sessionActive: false
      }
    ];

    simulatedDevices.forEach(device => {
      this.devices.set(device.id, device);
    });

    logger.info(`Discovered ${simulatedDevices.length} devices`);
  }

  private startProximityMonitoring(): void {
    this.proximityMonitor = setInterval(() => {
      this.updateUserLocation();
      this.checkForHandoffOpportunities();
    }, 1000); // Check every second
  }

  private updateUserLocation(): void {
    // Simulate user movement
    if (!this.userLocation) {
      this.userLocation = { x: 0, y: 0, z: 0 };
    }

    // Random walk simulation
    this.userLocation.x += (Math.random() - 0.5) * 0.1;
    this.userLocation.y += (Math.random() - 0.5) * 0.1;
    this.userLocation.z += (Math.random() - 0.5) * 0.05;

    // Update device proximities
    for (const [deviceId, device] of this.devices) {
      const distance = Math.sqrt(
        Math.pow(device.location.coordinates?.x || 0 - this.userLocation.x, 2) +
        Math.pow(device.location.coordinates?.y || 0 - this.userLocation.y, 2) +
        Math.pow(device.location.coordinates?.z || 0 - this.userLocation.z, 2)
      );
      
      device.location.proximity = distance;
      device.lastSeen = new Date();
    }
  }

  private checkForHandoffOpportunities(): void {
    if (!this.config.enableAutoHandoff || !this.activeSession) return;

    const currentDevice = this.devices.get(this.activeSession.currentDevice);
    if (!currentDevice) return;

    // Find closest available device
    const availableDevices = Array.from(this.devices.values())
      .filter(device => 
        device.status === 'online' && 
        device.id !== this.activeSession!.currentDevice &&
        device.location.proximity < this.config.maxHandoffDistance
      )
      .sort((a, b) => a.location.proximity - b.location.proximity);

    if (availableDevices.length > 0) {
      const closestDevice = availableDevices[0];
      
      // Check if handoff is beneficial
      if (closestDevice.location.proximity < currentDevice.location.proximity * 0.7) {
        this.initiateHandoff(this.activeSession.currentDevice, closestDevice.id);
      }
    }
  }

  private async initializeSessionManagement(): Promise<void> {
    logger.info('Initializing session management...');
    
    // Create initial session
    this.activeSession = {
      sessionId: `session_${Date.now()}`,
      userId: this.config.userId,
      currentDevice: 'iphone_13', // Default device
      context: {
        task: 'idle',
        progress: 0,
        emotionalState: 'neutral',
        userMood: 'neutral',
        preferences: {}
      },
      history: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Set initial device as active
    const initialDevice = this.devices.get(this.activeSession.currentDevice);
    if (initialDevice) {
      initialDevice.sessionActive = true;
    }

    logger.info('Session management initialized');
  }

  // Public API Methods
  public async initiateHandoff(fromDeviceId: string, toDeviceId: string): Promise<boolean> {
    try {
      const fromDevice = this.devices.get(fromDeviceId);
      const toDevice = this.devices.get(toDeviceId);

      if (!fromDevice || !toDevice) {
        throw new Error('Invalid device IDs');
      }

      if (toDevice.status !== 'online') {
        throw new Error('Target device is offline');
      }

      logger.info('Initiating device handoff:', { fromDeviceId, toDeviceId });

      // Add to handoff queue
      this.handoffQueue.push({
        fromDevice: fromDeviceId,
        toDevice: toDeviceId,
        timestamp: new Date()
      });

      // Update session context
      if (this.activeSession) {
        this.activeSession.previousDevice = fromDeviceId;
        this.activeSession.currentDevice = toDeviceId;
        this.activeSession.lastActivity = new Date();
        
        this.activeSession.history.push({
          deviceId: toDeviceId,
          timestamp: new Date(),
          action: 'handoff'
        });
      }

      // Update device states
      fromDevice.sessionActive = false;
      toDevice.sessionActive = true;

      // Emit handoff event
      this.emit('deviceHandoff', {
        fromDevice: fromDeviceId,
        toDevice: toDeviceId,
        sessionId: this.activeSession?.sessionId,
        timestamp: new Date()
      });

      logger.info('Device handoff completed successfully');
      return true;
    } catch (error) {
      logger.error('Device handoff failed:', error);
      return false;
    }
  }

  public async getAvailableDevices(): Promise<Device[]> {
    return Array.from(this.devices.values())
      .filter(device => device.status === 'online')
      .sort((a, b) => a.location.proximity - b.location.proximity);
  }

  public async getCurrentSession(): Promise<SessionContext | null> {
    return this.activeSession;
  }

  public async updateSessionContext(context: Partial<SessionContext['context']>): Promise<void> {
    if (!this.activeSession) return;

    this.activeSession.context = { ...this.activeSession.context, ...context };
    this.activeSession.lastActivity = new Date();

    this.emit('sessionContextUpdated', this.activeSession.context);
  }

  public async getDeviceCapabilities(deviceId: string): Promise<string[]> {
    const device = this.devices.get(deviceId);
    return device?.capabilities || [];
  }

  public async isDeviceCompatible(deviceId: string, capability: string): Promise<boolean> {
    const capabilities = await this.getDeviceCapabilities(deviceId);
    return capabilities.includes(capability);
  }

  public async getHandoffHistory(): Promise<Array<{ fromDevice: string; toDevice: string; timestamp: Date }>> {
    return [...this.handoffQueue];
  }

  public async updateConfig(newConfig: Partial<DeviceFluidityConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Device Fluidity Manager config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const onlineDevices = Array.from(this.devices.values())
        .filter(device => device.status === 'online');
      
      return this.isActive && onlineDevices.length > 0 && this.activeSession !== null;
    } catch (error) {
      logger.error('Device Fluidity Manager health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Device Fluidity Manager shutting down...');
    
    this.isActive = false;
    
    if (this.proximityMonitor) {
      clearInterval(this.proximityMonitor);
      this.proximityMonitor = null;
    }
    
    // Clear devices
    this.devices.clear();
    
    // Clear session
    this.activeSession = null;
    
    logger.info('Device Fluidity Manager shutdown complete');
    this.emit('shutdown');
  }
}

export default DeviceFluidityManager;

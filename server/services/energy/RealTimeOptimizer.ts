import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface OptimizationRule {
  id: string;
  name: string;
  type: 'load_balancing' | 'peak_shaving' | 'cost_optimization' | 'efficiency' | 'demand_response';
  priority: number;
  conditions: {
    timeRange?: { start: string; end: string };
    powerThreshold?: number;
    costThreshold?: number;
    deviceTypes?: string[];
    weatherConditions?: string[];
  };
  actions: {
    type: 'reduce_power' | 'shift_load' | 'turn_off' | 'adjust_setpoint' | 'schedule_delay';
    parameters: any;
    maxReduction: number;
  }[];
  enabled: boolean;
  learningEnabled: boolean;
}

export interface OptimizationResult {
  ruleId: string;
  deviceId: string;
  action: string;
  originalValue: number;
  optimizedValue: number;
  estimatedSavings: number;
  confidence: number;
  timestamp: Date;
  success: boolean;
  reason: string;
}

export interface LoadBalancingStrategy {
  strategy: 'round_robin' | 'least_loaded' | 'priority_based' | 'ai_optimized';
  devices: string[];
  targetLoad: number;
  tolerance: number;
  rebalanceInterval: number;
}

/**
 * Real-Time Energy Optimization Engine
 * Continuously optimizes energy usage across all devices
 */
export class RealTimeOptimizer extends EventEmitter {
  private isInitialized = false;
  private optimizationInterval: NodeJS.Timeout | null = null;
  private rules = new Map<string, OptimizationRule>();
  private optimizationHistory: OptimizationResult[] = [];
  private loadBalancingStrategy: LoadBalancingStrategy;
  
  // AI learning components
  private reinforcementModel: any = null;
  private performanceMetrics = {
    totalOptimizations: 0,
    successfulOptimizations: 0,
    totalSavings: 0,
    averageConfidence: 0,
    lastOptimization: null as Date | null
  };

  constructor() {
    super();
    
    this.loadBalancingStrategy = {
      strategy: 'ai_optimized',
      devices: [],
      targetLoad: 0,
      tolerance: 0.1,
      rebalanceInterval: 300000 // 5 minutes
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('⚡ Initializing Real-Time Energy Optimizer...');
    
    // Load optimization rules
    await this.loadOptimizationRules();
    
    // Initialize AI models
    await this.initializeAIModels();
    
    // Start real-time optimization
    this.startRealTimeOptimization();
    
    // Start load balancing
    this.startLoadBalancing();
    
    this.isInitialized = true;
    logger.info('✅ Real-Time Energy Optimizer initialized');
  }

  private async loadOptimizationRules(): Promise<void> {
    try {
      // Load rules from database or create defaults
      const defaultRules = this.createDefaultOptimizationRules();
      defaultRules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });

      logger.info(`📋 Loaded ${this.rules.size} optimization rules`);
    } catch (error) {
      logger.error('Failed to load optimization rules:', error);
    }
  }

  private createDefaultOptimizationRules(): OptimizationRule[] {
    return [
      {
        id: 'peak_shaving_evening',
        name: 'Peak Shaving - Evening Hours',
        type: 'peak_shaving',
        priority: 1,
        conditions: {
          timeRange: { start: '18:00', end: '22:00' },
          powerThreshold: 5000 // 5kW
        },
        actions: [
          {
            type: 'reduce_power',
            parameters: { reduction: 0.2 },
            maxReduction: 1000 // 1kW max
          }
        ],
        enabled: true,
        learningEnabled: true
      },
      {
        id: 'cost_optimization_peak_hours',
        name: 'Cost Optimization - Peak Rate Hours',
        type: 'cost_optimization',
        priority: 2,
        conditions: {
          timeRange: { start: '16:00', end: '20:00' },
          costThreshold: 0.25 // $0.25/kWh
        },
        actions: [
          {
            type: 'shift_load',
            parameters: { delayHours: 2 },
            maxReduction: 2000
          }
        ],
        enabled: true,
        learningEnabled: true
      },
      {
        id: 'hvac_efficiency',
        name: 'HVAC Efficiency Optimization',
        type: 'efficiency',
        priority: 3,
        conditions: {
          deviceTypes: ['hvac', 'thermostat']
        },
        actions: [
          {
            type: 'adjust_setpoint',
            parameters: { adjustment: 1 }, // 1 degree
            maxReduction: 500
          }
        ],
        enabled: true,
        learningEnabled: true
      },
      {
        id: 'demand_response',
        name: 'Utility Demand Response',
        type: 'demand_response',
        priority: 1,
        conditions: {
          powerThreshold: 10000 // 10kW
        },
        actions: [
          {
            type: 'turn_off',
            parameters: { nonEssentialOnly: true },
            maxReduction: 3000
          }
        ],
        enabled: false, // Disabled by default
        learningEnabled: true
      }
    ];
  }

  private async initializeAIModels(): Promise<void> {
    // Initialize reinforcement learning model for optimization
    this.reinforcementModel = this.createReinforcementModel();
    
    logger.info('🧠 AI optimization models initialized');
  }

  private createReinforcementModel(): any {
    return {
      // Q-learning based optimization
      qTable: new Map<string, Map<string, number>>(),
      
      getAction: (state: string, availableActions: string[]) => {
        const stateActions = this.reinforcementModel.qTable.get(state) || new Map();
        
        // Epsilon-greedy action selection
        const epsilon = 0.1;
        if (Math.random() < epsilon) {
          // Explore: random action
          return availableActions[Math.floor(Math.random() * availableActions.length)];
        } else {
          // Exploit: best known action
          let bestAction = availableActions[0];
          let bestValue = stateActions.get(bestAction) || 0;
          
          availableActions.forEach(action => {
            const value = stateActions.get(action) || 0;
            if (value > bestValue) {
              bestValue = value;
              bestAction = action;
            }
          });
          
          return bestAction;
        }
      },
      
      updateQValue: (state: string, action: string, reward: number, nextState: string) => {
        const alpha = 0.1; // Learning rate
        const gamma = 0.9; // Discount factor
        
        if (!this.reinforcementModel.qTable.has(state)) {
          this.reinforcementModel.qTable.set(state, new Map());
        }
        
        const stateActions = this.reinforcementModel.qTable.get(state)!;
        const currentQ = stateActions.get(action) || 0;
        
        // Get max Q value for next state
        const nextStateActions = this.reinforcementModel.qTable.get(nextState) || new Map();
        const nextQValues = Array.from(nextStateActions.values()) as number[];
        const maxNextQ = nextQValues.length > 0 ? Math.max(...nextQValues) : 0;
        
        // Q-learning update
        const newQ = currentQ + alpha * (reward + gamma * maxNextQ - currentQ);
        stateActions.set(action, newQ);
      }
    };
  }

  private startRealTimeOptimization(): void {
    // Run optimization every 30 seconds
    this.optimizationInterval = setInterval(async () => {
      await this.runOptimizationCycle();
    }, 30000);

    logger.info('🔄 Started real-time energy optimization');
  }

  private async runOptimizationCycle(): Promise<void> {
    try {
      const currentState = await this.getCurrentSystemState();
      const applicableRules = this.getApplicableRules(currentState);
      
      for (const rule of applicableRules) {
        await this.executeOptimizationRule(rule, currentState);
      }
      
      // Update performance metrics
      this.performanceMetrics.lastOptimization = new Date();
      
    } catch (error) {
      logger.error('Optimization cycle failed:', error);
    }
  }

  private async getCurrentSystemState(): Promise<any> {
    try {
      // Get current energy readings
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentReadings = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: fiveMinutesAgo }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Calculate current system metrics
      const totalPower = recentReadings.reduce((sum, reading) => sum + reading.powerWatts, 0);
      const deviceCount = new Set(recentReadings.map(r => r.deviceId)).size;
      const averagePower = deviceCount > 0 ? totalPower / deviceCount : 0;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      return {
        totalPower,
        averagePower,
        deviceCount,
        currentTime: timeString,
        recentReadings,
        timestamp: now
      };
    } catch (error) {
      logger.error('Failed to get current system state:', error);
      return {
        totalPower: 0,
        averagePower: 0,
        deviceCount: 0,
        currentTime: '00:00',
        recentReadings: [],
        timestamp: new Date()
      };
    }
  }

  private getApplicableRules(state: any): OptimizationRule[] {
    const applicableRules: OptimizationRule[] = [];

    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      let applicable = true;

      // Check time range
      if (rule.conditions.timeRange) {
        const currentTime = state.currentTime;
        const { start, end } = rule.conditions.timeRange;
        
        if (currentTime < start || currentTime > end) {
          applicable = false;
        }
      }

      // Check power threshold
      if (rule.conditions.powerThreshold) {
        if (state.totalPower < rule.conditions.powerThreshold) {
          applicable = false;
        }
      }

      if (applicable) {
        applicableRules.push(rule);
      }
    });

    // Sort by priority
    return applicableRules.sort((a, b) => a.priority - b.priority);
  }

  private async executeOptimizationRule(rule: OptimizationRule, state: any): Promise<void> {
    try {
      const devices = await this.getOptimizableDevices(rule, state);
      
      for (const device of devices) {
        for (const action of rule.actions) {
          const result = await this.executeOptimizationAction(rule, device, action, state);
          
          if (result) {
            this.optimizationHistory.push(result);
            this.emit('optimizationApplied', result);
            
            // Update performance metrics
            this.performanceMetrics.totalOptimizations++;
            if (result.success) {
              this.performanceMetrics.successfulOptimizations++;
              this.performanceMetrics.totalSavings += result.estimatedSavings;
            }
            
            // Update AI model if learning is enabled
            if (rule.learningEnabled) {
              await this.updateAIModel(rule, device, action, result, state);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to execute optimization rule ${rule.id}:`, error);
    }
  }

  private async getOptimizableDevices(rule: OptimizationRule, state: any): Promise<any[]> {
    try {
      let deviceFilter: any = {};

      // Filter by device types if specified
      if (rule.conditions.deviceTypes && rule.conditions.deviceTypes.length > 0) {
        // This would need to be implemented based on your device schema
        // For now, return devices from recent readings
        const deviceIds = Array.from(new Set(state.recentReadings.map((r: any) => r.deviceId)));
        return deviceIds.map((id: string) => ({ id, type: 'generic' }));
      }

      // Get all active devices
      const deviceIds = Array.from(new Set(state.recentReadings.map((r: any) => r.deviceId)));
      return deviceIds.map((id: string) => ({ id, type: 'generic' }));
      
    } catch (error) {
      logger.error('Failed to get optimizable devices:', error);
      return [];
    }
  }

  private async executeOptimizationAction(
    rule: OptimizationRule,
    device: any,
    action: any,
    state: any
  ): Promise<OptimizationResult | null> {
    try {
      const deviceReading = state.recentReadings.find((r: any) => r.deviceId === device.id);
      if (!deviceReading) return null;

      const originalValue = deviceReading.powerWatts;
      let optimizedValue = originalValue;
      let success = false;
      let reason = '';

      switch (action.type) {
        case 'reduce_power':
          const reduction = Math.min(
            originalValue * action.parameters.reduction,
            action.maxReduction
          );
          optimizedValue = Math.max(0, originalValue - reduction);
          success = await this.applyPowerReduction(device.id, reduction);
          reason = success ? `Reduced power by ${reduction}W` : 'Failed to reduce power';
          break;

        case 'adjust_setpoint':
          success = await this.adjustDeviceSetpoint(device.id, action.parameters.adjustment);
          optimizedValue = originalValue * 0.9; // Estimated 10% reduction
          reason = success ? `Adjusted setpoint by ${action.parameters.adjustment}°` : 'Failed to adjust setpoint';
          break;

        case 'turn_off':
          if (action.parameters.nonEssentialOnly && this.isEssentialDevice(device)) {
            reason = 'Device marked as essential, skipping';
            break;
          }
          success = await this.turnOffDevice(device.id);
          optimizedValue = 0;
          reason = success ? 'Device turned off' : 'Failed to turn off device';
          break;

        case 'shift_load':
          success = await this.scheduleLoadShift(device.id, action.parameters.delayHours);
          optimizedValue = 0; // Temporarily reduced
          reason = success ? `Load shifted by ${action.parameters.delayHours} hours` : 'Failed to shift load';
          break;

        default:
          reason = `Unknown action type: ${action.type}`;
      }

      const estimatedSavings = (originalValue - optimizedValue) * 0.001 * 0.15; // kWh * rate
      const confidence = this.calculateActionConfidence(rule, action, device, state);

      return {
        ruleId: rule.id,
        deviceId: device.id,
        action: action.type,
        originalValue,
        optimizedValue,
        estimatedSavings,
        confidence,
        timestamp: new Date(),
        success,
        reason
      };

    } catch (error) {
      logger.error('Failed to execute optimization action:', error);
      return null;
    }
  }

  private async applyPowerReduction(deviceId: string, reduction: number): Promise<boolean> {
    try {
      // This would integrate with your device control system
      // For now, simulate the action
      logger.info(`Applying ${reduction}W power reduction to device ${deviceId}`);
      return Math.random() > 0.2; // 80% success rate simulation
    } catch (error) {
      logger.error('Failed to apply power reduction:', error);
      return false;
    }
  }

  private async adjustDeviceSetpoint(deviceId: string, adjustment: number): Promise<boolean> {
    try {
      // This would integrate with your device control system
      logger.info(`Adjusting setpoint by ${adjustment}° for device ${deviceId}`);
      return Math.random() > 0.15; // 85% success rate simulation
    } catch (error) {
      logger.error('Failed to adjust device setpoint:', error);
      return false;
    }
  }

  private async turnOffDevice(deviceId: string): Promise<boolean> {
    try {
      // This would integrate with your device control system
      logger.info(`Turning off device ${deviceId}`);
      return Math.random() > 0.1; // 90% success rate simulation
    } catch (error) {
      logger.error('Failed to turn off device:', error);
      return false;
    }
  }

  private async scheduleLoadShift(deviceId: string, delayHours: number): Promise<boolean> {
    try {
      // This would integrate with your scheduling system
      logger.info(`Scheduling ${delayHours}h load shift for device ${deviceId}`);
      return Math.random() > 0.25; // 75% success rate simulation
    } catch (error) {
      logger.error('Failed to schedule load shift:', error);
      return false;
    }
  }

  private isEssentialDevice(device: any): boolean {
    // Define logic to identify essential devices
    const essentialTypes = ['security', 'medical', 'refrigeration'];
    return essentialTypes.includes(device.type);
  }

  private calculateActionConfidence(rule: OptimizationRule, action: any, device: any, state: any): number {
    let confidence = 0.5; // Base confidence

    // Historical success rate
    const historicalResults = this.optimizationHistory.filter(
      r => r.ruleId === rule.id && r.action === action.type
    );
    
    if (historicalResults.length > 0) {
      const successRate = historicalResults.filter(r => r.success).length / historicalResults.length;
      confidence += successRate * 0.3;
    }

    // Device stability
    if (device.type === 'stable') confidence += 0.1;

    // System load factor
    if (state.totalPower > 8000) confidence += 0.1; // High load = more confident in optimization

    return Math.min(1.0, confidence);
  }

  private async updateAIModel(
    rule: OptimizationRule,
    device: any,
    action: any,
    result: OptimizationResult,
    state: any
  ): Promise<void> {
    try {
      // Create state representation
      const stateKey = `${rule.id}_${device.type}_${Math.floor(state.totalPower / 1000)}kW`;
      const actionKey = `${action.type}_${JSON.stringify(action.parameters)}`;
      
      // Calculate reward based on result
      let reward = 0;
      if (result.success) {
        reward += result.estimatedSavings * 10; // Reward based on savings
        reward += result.confidence * 5; // Bonus for high confidence
      } else {
        reward -= 5; // Penalty for failure
      }

      // Update Q-learning model
      const nextStateKey = `${stateKey}_optimized`;
      this.reinforcementModel.updateQValue(stateKey, actionKey, reward, nextStateKey);
      
    } catch (error) {
      logger.error('Failed to update AI model:', error);
    }
  }

  private startLoadBalancing(): void {
    // Run load balancing every 5 minutes
    setInterval(async () => {
      await this.performLoadBalancing();
    }, this.loadBalancingStrategy.rebalanceInterval);

    logger.info('⚖️ Started load balancing optimization');
  }

  private async performLoadBalancing(): Promise<void> {
    try {
      const currentLoads = await this.getCurrentDeviceLoads();
      const rebalancingNeeded = this.assessLoadBalancingNeed(currentLoads);
      
      if (rebalancingNeeded) {
        await this.executeLoadBalancing(currentLoads);
      }
      
    } catch (error) {
      logger.error('Load balancing failed:', error);
    }
  }

  private async getCurrentDeviceLoads(): Promise<Map<string, number>> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const readings = await prisma.energyReading.findMany({
        where: {
          timestamp: { gte: fiveMinutesAgo }
        }
      });

      const deviceLoads = new Map<string, number>();
      readings.forEach(reading => {
        const currentLoad = deviceLoads.get(reading.deviceId) || 0;
        deviceLoads.set(reading.deviceId, Math.max(currentLoad, reading.powerWatts));
      });

      return deviceLoads;
    } catch (error) {
      logger.error('Failed to get current device loads:', error);
      return new Map();
    }
  }

  private assessLoadBalancingNeed(loads: Map<string, number>): boolean {
    if (loads.size < 2) return false;

    const loadValues = Array.from(loads.values());
    const avgLoad = loadValues.reduce((sum, load) => sum + load, 0) / loadValues.length;
    
    // Check if any device is significantly over/under the average
    return loadValues.some(load => 
      Math.abs(load - avgLoad) / avgLoad > this.loadBalancingStrategy.tolerance
    );
  }

  private async executeLoadBalancing(loads: Map<string, number>): Promise<void> {
    const loadArray = Array.from(loads.entries()).sort((a, b) => b[1] - a[1]);
    const highLoadDevices = loadArray.slice(0, Math.ceil(loadArray.length / 2));
    const lowLoadDevices = loadArray.slice(Math.ceil(loadArray.length / 2));

    logger.info(`🔄 Rebalancing load across ${loads.size} devices`);

    // Implement load balancing strategy
    switch (this.loadBalancingStrategy.strategy) {
      case 'ai_optimized':
        await this.aiOptimizedLoadBalancing(highLoadDevices, lowLoadDevices);
        break;
      case 'round_robin':
        await this.roundRobinLoadBalancing(highLoadDevices, lowLoadDevices);
        break;
      default:
        await this.basicLoadBalancing(highLoadDevices, lowLoadDevices);
    }
  }

  private async aiOptimizedLoadBalancing(
    highLoad: [string, number][],
    lowLoad: [string, number][]
  ): Promise<void> {
    // Use AI model to determine optimal load distribution
    for (const [deviceId, load] of highLoad) {
      const state = `load_balancing_${Math.floor(load / 100)}`;
      const actions = ['reduce_25', 'reduce_50', 'shift_partial'];
      
      const recommendedAction = this.reinforcementModel.getAction(state, actions);
      
      switch (recommendedAction) {
        case 'reduce_25':
          await this.applyPowerReduction(deviceId, load * 0.25);
          break;
        case 'reduce_50':
          await this.applyPowerReduction(deviceId, load * 0.5);
          break;
        case 'shift_partial':
          await this.scheduleLoadShift(deviceId, 1);
          break;
      }
    }
  }

  private async roundRobinLoadBalancing(
    highLoad: [string, number][],
    lowLoad: [string, number][]
  ): Promise<void> {
    // Simple round-robin redistribution
    let targetIndex = 0;
    
    for (const [deviceId, load] of highLoad) {
      if (targetIndex < lowLoad.length) {
        const reductionAmount = Math.min(load * 0.3, 500); // Max 500W reduction
        await this.applyPowerReduction(deviceId, reductionAmount);
        targetIndex = (targetIndex + 1) % lowLoad.length;
      }
    }
  }

  private async basicLoadBalancing(
    highLoad: [string, number][],
    lowLoad: [string, number][]
  ): Promise<void> {
    // Basic load balancing - reduce highest loads
    const avgLoad = (highLoad.concat(lowLoad).reduce((sum, [, load]) => sum + load, 0)) / 
                   (highLoad.length + lowLoad.length);

    for (const [deviceId, load] of highLoad) {
      if (load > avgLoad * 1.2) {
        const reduction = (load - avgLoad) * 0.5;
        await this.applyPowerReduction(deviceId, reduction);
      }
    }
  }

  // Public API
  public getOptimizationRules(): OptimizationRule[] {
    return Array.from(this.rules.values());
  }

  public async addOptimizationRule(rule: OptimizationRule): Promise<void> {
    this.rules.set(rule.id, rule);
    logger.info(`➕ Added optimization rule: ${rule.name}`);
  }

  public async updateOptimizationRule(ruleId: string, updates: Partial<OptimizationRule>): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    this.rules.set(ruleId, rule);
    logger.info(`✏️ Updated optimization rule: ${rule.name}`);
    return true;
  }

  public async removeOptimizationRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      logger.info(`🗑️ Removed optimization rule: ${ruleId}`);
    }
    return deleted;
  }

  public getOptimizationHistory(limit: number = 100): OptimizationResult[] {
    return this.optimizationHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getPerformanceMetrics(): any {
    const successRate = this.performanceMetrics.totalOptimizations > 0 ?
      this.performanceMetrics.successfulOptimizations / this.performanceMetrics.totalOptimizations : 0;

    return {
      ...this.performanceMetrics,
      successRate,
      averageSavingsPerOptimization: this.performanceMetrics.successfulOptimizations > 0 ?
        this.performanceMetrics.totalSavings / this.performanceMetrics.successfulOptimizations : 0
    };
  }

  public async setLoadBalancingStrategy(strategy: LoadBalancingStrategy): Promise<void> {
    this.loadBalancingStrategy = strategy;
    logger.info(`🎯 Updated load balancing strategy to: ${strategy.strategy}`);
  }

  destroy(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    
    this.rules.clear();
    this.optimizationHistory = [];
    
    logger.info('⚡ Real-Time Energy Optimizer destroyed');
  }
}

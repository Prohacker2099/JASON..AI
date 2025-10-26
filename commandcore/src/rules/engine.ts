import { Logger } from '../utils/logger.js';
import { DeviceManager } from '../services/deviceManager.js';

type Condition = {
  deviceId: string;
  property: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
};

type Action = {
  type: 'device' | 'notification' | 'webhook' | 'delay' | 'log';
  target: string; // deviceId, URL, or log message
  command?: string; // For device actions
  payload?: any;
  delayMs?: number; // For delay action
};

type Rule = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: Condition[];
  actions: Action[];
  lastTriggered?: Date;
  triggerCount: number;
};

export class RuleEngine {
  private rules: Map<string, Rule>;
  private deviceManager: DeviceManager;
  private logger: Logger;
  private isProcessing: boolean;

  constructor(deviceManager: DeviceManager) {
    this.rules = new Map();
    this.deviceManager = deviceManager;
    this.logger = (global as any).logger || console;
    this.isProcessing = false;
  }

  async init(): Promise<void> {
    this.logger.info('Initializing Rule Engine');
    // Load rules from persistence layer if needed
  }

  async addRule(rule: Omit<Rule, 'id' | 'lastTriggered' | 'triggerCount'>): Promise<Rule> {
    const id = this.generateId();
    const newRule: Rule = {
      ...rule,
      id,
      lastTriggered: undefined,
      triggerCount: 0,
    };

    this.rules.set(id, newRule);
    this.logger.info(`Rule added: ${rule.name} (${id})`);
    return newRule;
  }

  async updateRule(id: string, updates: Partial<Omit<Rule, 'id'>>): Promise<Rule | null> {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates };
    this.rules.set(id, updatedRule);
    this.logger.info(`Rule updated: ${updatedRule.name} (${id})`);
    return updatedRule;
  }

  async removeRule(id: string): Promise<boolean> {
    const rule = this.rules.get(id);
    if (!rule) return false;

    this.rules.delete(id);
    this.logger.info(`Rule removed: ${rule.name} (${id})`);
    return true;
  }

  async getRule(id: string): Promise<Rule | null> {
    return this.rules.get(id) || null;
  }

  async getAllRules(): Promise<Rule[]> {
    return Array.from(this.rules.values());
  }

  async processEvent(deviceId: string, event: string, data: any): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Rule engine is already processing an event, skipping concurrent execution');
      return;
    }

    this.isProcessing = true;
    try {
      const rules = await this.getAllRules();
      const matchingRules = rules.filter(rule => 
        rule.enabled && 
        rule.conditions.some(cond => cond.deviceId === deviceId)
      );

      for (const rule of matchingRules) {
        try {
          const shouldTrigger = await this.evaluateConditions(rule.conditions, deviceId, event, data);
          if (shouldTrigger) {
            await this.executeActions(rule.actions, { deviceId, event, data });
            
            // Update rule stats
            rule.lastTriggered = new Date();
            rule.triggerCount += 1;
            this.rules.set(rule.id, rule);
            
            this.logger.info(`Rule triggered: ${rule.name} (${rule.id})`);
          }
        } catch (error) {
          this.logger.error(`Error processing rule ${rule.name} (${rule.id}):`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async evaluateConditions(
    conditions: Condition[],
    deviceId: string,
    event: string,
    eventData: any
  ): Promise<boolean> {
    for (const condition of conditions) {
      if (condition.deviceId !== deviceId) continue;

      const device = await this.deviceManager.getDeviceState(deviceId);
      if (!device) {
        this.logger.warn(`Device not found for condition: ${deviceId}`);
        return false;
      }

      const value = this.getNestedProperty(device.state, condition.property);
      if (value === undefined) {
        this.logger.warn(`Property ${condition.property} not found on device ${deviceId}`);
        return false;
      }

      const conditionMet = this.compareValues(
        value,
        condition.operator,
        condition.value
      );

      if (!conditionMet) {
        return false;
      }
    }

    return conditions.length > 0; // Only return true if there were conditions to evaluate
  }

  private async executeActions(actions: Action[], context: { deviceId: string; event: string; data: any }) {
    for (const action of actions) {
      try {
        if (action.delayMs) {
          await new Promise(resolve => setTimeout(resolve, action.delayMs));
        }

        switch (action.type) {
          case 'device':
            await this.deviceManager.executeCommand(
              action.target,
              action.command || 'set',
              action.payload
            );
            break;
          
          case 'notification':
            // In a real implementation, this would send a notification
            this.logger.info(`[Notification] ${action.target}`, action.payload);
            break;
          
          case 'webhook':
            // In a real implementation, this would make an HTTP request
            this.logger.info(`[Webhook] ${action.target}`, action.payload);
            break;
          
          case 'log':
            this.logger.info(`[Rule Log] ${action.target}`, action.payload);
            break;
          
          default:
            this.logger.warn(`Unknown action type: ${(action as any).type}`);
        }
      } catch (error) {
        this.logger.error(`Error executing action:`, error);
      }
    }
  }

  private compareValues(a: any, operator: string, b: any): boolean {
    switch (operator) {
      case 'eq': return a === b;
      case 'neq': return a !== b;
      case 'gt': return a > b;
      case 'lt': return a < b;
      case 'gte': return a >= b;
      case 'lte': return a <= b;
      case 'contains': return String(a).includes(String(b));
      case 'startsWith': return String(a).startsWith(String(b));
      case 'endsWith': return String(a).endsWith(String(b));
      default: return false;
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

// Singleton instance
let ruleEngineInstance: RuleEngine | null = null;

export async function initRuleEngine(deviceManager: DeviceManager): Promise<RuleEngine> {
  if (!ruleEngineInstance) {
    ruleEngineInstance = new RuleEngine(deviceManager);
    await ruleEngineInstance.init();
  }
  return ruleEngineInstance;
}

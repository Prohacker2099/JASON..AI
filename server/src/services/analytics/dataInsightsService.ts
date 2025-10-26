import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface InsightEvent {
  type: string;
  summary: string;
  data?: Record<string, any>;
  timestamp: Date;
}

class DataInsightsService extends EventEmitter {
  constructor() {
    super();
    logger.info('DataInsightsService initialized.');
  }

  public publishInsight(insight: Omit<InsightEvent, 'timestamp'>) {
    const event: InsightEvent = { ...insight, timestamp: new Date() };
    this.emit('insight', event);
    logger.info(`Insight published: [${event.type}] ${event.summary}`);
  }

  public onInsight(handler: (event: InsightEvent) => void) {
    this.on('insight', handler);
  }
}

export const dataInsightsService = new DataInsightsService();
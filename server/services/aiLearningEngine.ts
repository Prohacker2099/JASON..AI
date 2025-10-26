import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

export interface LearningEvent {
  id: string;
  timestamp: string;
  event: string;
  data?: Record<string, any>;
}

export interface Insight {
  id: string;
  summary: string;
  timestamp: string;
}

class AILearningEngine extends EventEmitter {
  public async record(event: string, data?: Record<string, any>): Promise<LearningEvent> {
    // Persist event
    const created = await prisma.learningEvent.create({
      data: {
        event,
        data: data as any,
      },
    });
    const ev: LearningEvent = {
      id: created.id,
      timestamp: created.timestamp.toISOString(),
      event: created.event,
      data: (created as any).data ?? undefined,
    };

    // Generate a naive insight every 3 events
    const count = await prisma.learningEvent.count();
    if (count % 3 === 0) {
      const insRow = await prisma.learningInsight.create({
        data: {
          summary: `Noticed ${count} learning events. Latest: ${event}`,
        },
      });
      const ins: Insight = {
        id: insRow.id,
        summary: insRow.summary,
        timestamp: insRow.timestamp.toISOString(),
      };
      this.emit('insight', ins);
    }

    this.emit('event', ev);
    logger.info(`[AI Learning] Recorded event: ${event}`);
    return ev;
  }

  public async getInsights(limit = 20): Promise<Insight[]> {
    const rows = await prisma.learningInsight.findMany({ orderBy: { timestamp: 'desc' }, take: limit });
    return rows.map((r: any) => ({ id: r.id, summary: r.summary, timestamp: r.timestamp.toISOString() }));
  }
}

export const aiLearningEngine = new AILearningEngine();

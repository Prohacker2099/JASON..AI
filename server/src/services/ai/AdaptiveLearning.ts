// server/src/services/ai/AdaptiveLearning.ts

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger'; // Corrected path

interface UserBehaviorData {
  userId: string;
  timestamp: Date;
  eventType: string; // e.g., 'deviceInteraction', 'appUsage', 'locationChange'
  details: Record<string, any>;
}

interface LearnedInsight {
  id: string;
  userId: string;
  type: 'routineDetected' | 'presencePattern' | 'energySavingOpportunity' | 'sleepPatternDetected' | 'stressIndicator';
  summary: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class AdaptiveLearningService extends EventEmitter {
  private userBehaviorHistory: Map<string, UserBehaviorData[]> = new Map(); // userId -> behavior history
  private learnedInsights: Map<string, LearnedInsight[]> = new Map(); // userId -> learned insights

  constructor() {
    super();
    logger.info('AdaptiveLearningService initialized.');
  }

  /**
   * Records user behavior data.
   * @param data The user behavior data to record.
   */
  public recordUserBehavior(data: UserBehaviorData): void {
    const history = this.userBehaviorHistory.get(data.userId) || [];
    history.push(data);
    this.userBehaviorHistory.set(data.userId, history);
    this.analyzeBehavior(data.userId);
    logger.debug(`Recorded user behavior for ${data.userId}: ${data.eventType}`);
  }

  /**
   * Analyzes user behavior history to detect patterns and generate insights.
   * This is a simplified example; real adaptive learning would use ML models.
   * @param userId The ID of the user.
   */
  private analyzeBehavior(userId: string): void {
    const history = this.userBehaviorHistory.get(userId);
    if (!history || history.length < 10) return; // Need enough data to analyze

    // Example: Detect a routine (e.g., lights turning on at a specific time daily)
    const recentLightOnEvents = history.filter(
      (event) =>
        event.eventType === 'deviceInteraction' &&
        event.details.deviceType === 'light' &&
        event.details.action === 'turnOn' &&
        (new Date().getTime() - event.timestamp.getTime()) < 24 * 3600 * 1000 // Last 24 hours
    );

    if (recentLightOnEvents.length >= 3) { // If lights turned on 3+ times in last 24h
      const insight: LearnedInsight = {
        id: `insight-${Date.now()}`,
        userId,
        type: 'routineDetected',
        summary: 'Detected a routine: Living room lights often turn on in the evening.',
        details: { device: 'livingRoomLight', frequency: 'daily' },
        timestamp: new Date(),
      };
      this.addLearnedInsight(userId, insight);
    }

    // Example: Detect presence pattern (e.g., home during specific hours)
    const homePresenceEvents = history.filter(
      (event) =>
        event.eventType === 'locationChange' &&
        event.details.location === 'home' &&
        (new Date().getTime() - event.timestamp.getTime()) < 7 * 24 * 3600 * 1000 // Last 7 days
    );

    if (homePresenceEvents.length > 10) {
      const insight: LearnedInsight = {
        id: `insight-${Date.now()}-presence`,
        userId,
        type: 'presencePattern',
        summary: 'Identified a consistent home presence pattern.',
        details: { pattern: 'weekdayEvenings' },
        timestamp: new Date(),
      };
      this.addLearnedInsight(userId, insight);
    }
  }

  /**
   * Adds a new learned insight for a user.
   * @param userId The ID of the user.
   * @param insight The learned insight to add.
   */
  private addLearnedInsight(userId: string, insight: LearnedInsight): void {
    const insights = this.learnedInsights.get(userId) || [];
    // Prevent duplicate insights of the same type within a short period
    if (!insights.some(i => i.type === insight.type && (new Date().getTime() - i.timestamp.getTime()) < 60 * 60 * 1000)) { // 1 hour
      insights.push(insight);
      this.learnedInsights.set(userId, insights);
      logger.info(`Learned new insight for user ${userId}: [${insight.type}] ${insight.summary}`);
      this.emit('newInsight', insight);
    }
  }

  /**
   * Retrieves all learned insights for a user.
   * @param userId The ID of the user.
   * @returns An array of learned insights.
   */
  public getLearnedInsights(userId: string): LearnedInsight[] {
    return this.learnedInsights.get(userId) || [];
  }
}

export const behavioralLearningService = new AdaptiveLearningService();

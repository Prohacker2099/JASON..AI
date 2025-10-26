// core/M3GAN/modules/StylePreferenceEngine.ts
// Style & Preference Modeling Engine for M3GAN

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface UserStyleProfile {
  userId: string;
  voicePreferences: {
    tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'warm';
    pace: 'slow' | 'normal' | 'fast';
    volume: 'quiet' | 'normal' | 'loud';
    vocabulary: 'simple' | 'moderate' | 'complex' | 'technical';
    slang: boolean;
    emojis: boolean;
  };
  languagePreferences: {
    primaryLanguage: string;
    secondaryLanguages: string[];
    formality: 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
    culturalContext: string;
    regionalDialect?: string;
  };
  behavioralPatterns: {
    routines: Array<{
      name: string;
      time: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      actions: string[];
    }>;
    habits: Array<{
      trigger: string;
      action: string;
      frequency: number;
    }>;
    preferences: Record<string, any>;
  };
  communicationStyle: {
    greetingStyle: 'formal' | 'casual' | 'warm' | 'brief';
    responseLength: 'short' | 'medium' | 'long' | 'detailed';
    questionStyle: 'direct' | 'indirect' | 'conversational';
    feedbackStyle: 'encouraging' | 'neutral' | 'critical' | 'supportive';
  };
  lastUpdated: Date;
  confidence: number; // 0-1 scale
}

export interface InteractionPattern {
  id: string;
  userId: string;
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    location: string;
    activity: string;
    emotionalState: string;
  };
  input: {
    type: 'voice' | 'text' | 'gesture';
    content: string;
    tone?: string;
  };
  response: {
    content: string;
    style: string;
    effectiveness: number; // 0-1 scale
  };
  timestamp: Date;
}

export interface StylePreferenceConfig {
  userId: string;
  enableVoiceMimicry: boolean;
  enableBehavioralLearning: boolean;
  enableCulturalAdaptation: boolean;
  enableRoutineDetection: boolean;
  learningRate: number; // 0-1 scale
  maxPatterns: number;
  updateInterval: number; // milliseconds
}

export class StylePreferenceEngine extends EventEmitter {
  private config: StylePreferenceConfig;
  private isActive: boolean = false;
  private userProfile: UserStyleProfile | null = null;
  private interactionHistory: InteractionPattern[] = [];
  private patternDatabase: Map<string, any> = new Map();
  private learningInterval: NodeJS.Timeout | null = null;

  constructor(config: StylePreferenceConfig) {
    super();
    this.config = config;
    logger.info('Style Preference Engine initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize user profile
      await this.initializeUserProfile();
      
      // Load existing patterns
      await this.loadPatternDatabase();
      
      // Start learning loop
      this.startLearningLoop();
      
      this.isActive = true;
      logger.info('Style Preference Engine initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Style Preference Engine initialization failed:', error);
      throw error;
    }
  }

  private async initializeUserProfile(): Promise<void> {
    logger.info('Initializing user style profile...');
    
    // Create default profile
    this.userProfile = {
      userId: this.config.userId,
      voicePreferences: {
        tone: 'friendly',
        pace: 'normal',
        volume: 'normal',
        vocabulary: 'moderate',
        slang: false,
        emojis: true
      },
      languagePreferences: {
        primaryLanguage: 'en',
        secondaryLanguages: [],
        formality: 'neutral',
        culturalContext: 'western'
      },
      behavioralPatterns: {
        routines: [],
        habits: [],
        preferences: {}
      },
      communicationStyle: {
        greetingStyle: 'warm',
        responseLength: 'medium',
        questionStyle: 'conversational',
        feedbackStyle: 'supportive'
      },
      lastUpdated: new Date(),
      confidence: 0.5
    };

    logger.info('User style profile initialized');
  }

  private async loadPatternDatabase(): Promise<void> {
    logger.info('Loading pattern database...');
    
    // Initialize common patterns
    const commonPatterns = [
      'morning_greeting',
      'evening_greeting',
      'work_mode',
      'relaxation_mode',
      'stress_response',
      'celebration_response',
      'problem_solving',
      'casual_chat',
      'formal_request',
      'emotional_support'
    ];

    commonPatterns.forEach(pattern => {
      this.patternDatabase.set(pattern, {
        occurrences: 0,
        effectiveness: 0.5,
        lastUsed: null,
        adaptations: []
      });
    });

    logger.info(`Loaded ${commonPatterns.length} common patterns`);
  }

  private startLearningLoop(): void {
    this.learningInterval = setInterval(() => {
      this.performLearningCycle();
    }, this.config.updateInterval);
  }

  private performLearningCycle(): void {
    if (!this.userProfile) return;

    try {
      // Analyze recent interactions
      this.analyzeInteractionPatterns();
      
      // Update style preferences
      this.updateStylePreferences();
      
      // Detect new routines
      if (this.config.enableRoutineDetection) {
        this.detectRoutines();
      }
      
      // Update confidence score
      this.updateConfidenceScore();
      
      this.emit('learningCycleComplete', {
        patternsAnalyzed: this.interactionHistory.length,
        confidence: this.userProfile.confidence,
        timestamp: new Date()
      });
      
    } catch (error) {
      logger.error('Learning cycle failed:', error);
    }
  }

  private analyzeInteractionPatterns(): void {
    const recentInteractions = this.interactionHistory.slice(-50); // Last 50 interactions
    
    for (const interaction of recentInteractions) {
      const patternKey = this.extractPatternKey(interaction);
      const pattern = this.patternDatabase.get(patternKey);
      
      if (pattern) {
        pattern.occurrences++;
        pattern.effectiveness = (pattern.effectiveness + interaction.response.effectiveness) / 2;
        pattern.lastUsed = interaction.timestamp;
      } else {
        // Create new pattern
        this.patternDatabase.set(patternKey, {
          occurrences: 1,
          effectiveness: interaction.response.effectiveness,
          lastUsed: interaction.timestamp,
          adaptations: []
        });
      }
    }
  }

  private extractPatternKey(interaction: InteractionPattern): string {
    const context = interaction.context;
    const input = interaction.input;
    
    // Create pattern key based on context and input type
    return `${context.timeOfDay}_${context.activity}_${input.type}_${context.emotionalState}`;
  }

  private updateStylePreferences(): void {
    if (!this.userProfile) return;

    // Analyze voice preferences from recent interactions
    const voiceInteractions = this.interactionHistory
      .filter(i => i.input.type === 'voice')
      .slice(-20);

    if (voiceInteractions.length > 0) {
      // Update tone preferences based on effective responses
      const effectiveResponses = voiceInteractions
        .filter(i => i.response.effectiveness > 0.7)
        .map(i => i.response.style);

      if (effectiveResponses.length > 0) {
        const mostEffectiveStyle = this.getMostCommonStyle(effectiveResponses);
        this.userProfile.voicePreferences.tone = mostEffectiveStyle as any;
      }
    }

    // Update communication style
    const recentInteractions = this.interactionHistory.slice(-30);
    this.updateCommunicationStyle(recentInteractions);

    this.userProfile.lastUpdated = new Date();
  }

  private getMostCommonStyle(styles: string[]): string {
    const styleCounts: Record<string, number> = {};
    
    styles.forEach(style => {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });

    return Object.keys(styleCounts).reduce((a, b) => 
      styleCounts[a] > styleCounts[b] ? a : b
    );
  }

  private updateCommunicationStyle(interactions: InteractionPattern[]): void {
    if (!this.userProfile) return;

    // Analyze response lengths
    const responseLengths = interactions.map(i => i.response.content.length);
    const avgLength = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;

    if (avgLength < 50) {
      this.userProfile.communicationStyle.responseLength = 'short';
    } else if (avgLength < 200) {
      this.userProfile.communicationStyle.responseLength = 'medium';
    } else if (avgLength < 500) {
      this.userProfile.communicationStyle.responseLength = 'long';
    } else {
      this.userProfile.communicationStyle.responseLength = 'detailed';
    }

    // Analyze question styles
    const questions = interactions
      .filter(i => i.input.content.includes('?'))
      .map(i => i.input.content);

    if (questions.length > 0) {
      const directQuestions = questions.filter(q => 
        q.toLowerCase().startsWith('what') || 
        q.toLowerCase().startsWith('how') || 
        q.toLowerCase().startsWith('when')
      );

      if (directQuestions.length / questions.length > 0.7) {
        this.userProfile.communicationStyle.questionStyle = 'direct';
      } else {
        this.userProfile.communicationStyle.questionStyle = 'conversational';
      }
    }
  }

  private detectRoutines(): void {
    if (!this.userProfile) return;

    // Analyze time-based patterns
    const timePatterns: Record<string, number> = {};
    
    this.interactionHistory.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      const timeSlot = this.getTimeSlot(hour);
      timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1;
    });

    // Detect routine patterns
    Object.entries(timePatterns).forEach(([timeSlot, count]) => {
      if (count > 10) { // Threshold for routine detection
        const existingRoutine = this.userProfile.behavioralPatterns.routines.find(
          r => r.time === timeSlot
        );

        if (!existingRoutine) {
          this.userProfile.behavioralPatterns.routines.push({
            name: `${timeSlot} routine`,
            time: timeSlot,
            frequency: 'daily',
            actions: ['interaction']
          });
        }
      }
    });
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private updateConfidenceScore(): void {
    if (!this.userProfile) return;

    const recentInteractions = this.interactionHistory.slice(-20);
    if (recentInteractions.length === 0) return;

    const avgEffectiveness = recentInteractions.reduce(
      (sum, i) => sum + i.response.effectiveness, 0
    ) / recentInteractions.length;

    const patternCount = this.patternDatabase.size;
    const interactionCount = this.interactionHistory.length;

    // Calculate confidence based on effectiveness, pattern diversity, and interaction volume
    const effectivenessScore = avgEffectiveness;
    const diversityScore = Math.min(patternCount / 20, 1); // Max 20 patterns
    const volumeScore = Math.min(interactionCount / 100, 1); // Max 100 interactions

    this.userProfile.confidence = (effectivenessScore + diversityScore + volumeScore) / 3;
  }

  // Public API Methods
  public recordInteraction(interaction: Omit<InteractionPattern, 'id' | 'timestamp'>): void {
    const newInteraction: InteractionPattern = {
      ...interaction,
      id: `interaction_${Date.now()}`,
      timestamp: new Date()
    };

    this.interactionHistory.push(newInteraction);

    // Limit interaction history
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-1000);
    }

    this.emit('interactionRecorded', newInteraction);
    logger.info('Interaction recorded:', { 
      userId: newInteraction.userId, 
      context: newInteraction.context.activity 
    });
  }

  public generatePersonalizedResponse(input: string, context: any): string {
    if (!this.userProfile) return input;

    // Apply voice preferences
    let response = this.applyVoicePreferences(input);
    
    // Apply communication style
    response = this.applyCommunicationStyle(response, context);
    
    // Apply cultural context
    response = this.applyCulturalContext(response);

    return response;
  }

  private applyVoicePreferences(input: string): string {
    if (!this.userProfile) return input;

    const prefs = this.userProfile.voicePreferences;
    let response = input;

    // Apply tone
    switch (prefs.tone) {
      case 'formal':
        response = response.replace(/hey/gi, 'hello');
        response = response.replace(/yeah/gi, 'yes');
        break;
      case 'casual':
        response = response.replace(/hello/gi, 'hey');
        response = response.replace(/yes/gi, 'yeah');
        break;
      case 'warm':
        response = `I'm here to help! ${response}`;
        break;
    }

    // Apply vocabulary level
    if (prefs.vocabulary === 'simple') {
      response = this.simplifyVocabulary(response);
    } else if (prefs.vocabulary === 'complex') {
      response = this.enhanceVocabulary(response);
    }

    // Apply emojis
    if (prefs.emojis) {
      response = this.addAppropriateEmojis(response);
    }

    return response;
  }

  private applyCommunicationStyle(response: string, context: any): string {
    if (!this.userProfile) return response;

    const style = this.userProfile.communicationStyle;

    // Apply response length
    switch (style.responseLength) {
      case 'short':
        response = this.shortenResponse(response);
        break;
      case 'detailed':
        response = this.expandResponse(response, context);
        break;
    }

    // Apply greeting style
    if (context.isGreeting) {
      switch (style.greetingStyle) {
        case 'formal':
          response = `Good ${this.getTimeOfDay()}, ${response}`;
          break;
        case 'warm':
          response = `Hello there! ${response}`;
          break;
        case 'brief':
          response = `Hi! ${response}`;
          break;
      }
    }

    return response;
  }

  private applyCulturalContext(response: string): string {
    if (!this.userProfile) return response;

    const culturalContext = this.userProfile.languagePreferences.culturalContext;

    switch (culturalContext) {
      case 'western':
        // Add Western cultural references if appropriate
        break;
      case 'eastern':
        // Add Eastern cultural references if appropriate
        break;
      default:
        // Keep neutral
        break;
    }

    return response;
  }

  private simplifyVocabulary(text: string): string {
    const replacements: Record<string, string> = {
      'utilize': 'use',
      'facilitate': 'help',
      'implement': 'do',
      'optimize': 'improve',
      'comprehensive': 'complete'
    };

    let simplified = text;
    Object.entries(replacements).forEach(([complex, simple]) => {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    });

    return simplified;
  }

  private enhanceVocabulary(text: string): string {
    const replacements: Record<string, string> = {
      'use': 'utilize',
      'help': 'facilitate',
      'do': 'implement',
      'improve': 'optimize',
      'complete': 'comprehensive'
    };

    let enhanced = text;
    Object.entries(replacements).forEach(([simple, complex]) => {
      enhanced = enhanced.replace(new RegExp(`\\b${simple}\\b`, 'gi'), complex);
    });

    return enhanced;
  }

  private addAppropriateEmojis(text: string): string {
    if (text.includes('happy') || text.includes('great')) return `${text} 😊`;
    if (text.includes('sad') || text.includes('sorry')) return `${text} 😢`;
    if (text.includes('excited') || text.includes('amazing')) return `${text} 🎉`;
    if (text.includes('thinking') || text.includes('consider')) return `${text} 🤔`;
    return text;
  }

  private shortenResponse(text: string): string {
    const sentences = text.split('.');
    return sentences[0] + '.';
  }

  private expandResponse(text: string, context: any): string {
    return `${text} Let me provide more details about this.`;
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  public getUserProfile(): UserStyleProfile | null {
    return this.userProfile ? { ...this.userProfile } : null;
  }

  public getPatternDatabase(): Map<string, any> {
    return new Map(this.patternDatabase);
  }

  public getInteractionHistory(): InteractionPattern[] {
    return [...this.interactionHistory];
  }

  public updateConfig(newConfig: Partial<StylePreferenceConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Style Preference Engine config updated:', newConfig);
    this.emit('configUpdated', newConfig);
    return Promise.resolve();
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && this.userProfile !== null;
    } catch (error) {
      logger.error('Style Preference Engine health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Style Preference Engine shutting down...');
    
    this.isActive = false;
    
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
    
    // Save patterns
    await this.savePatternDatabase();
    
    logger.info('Style Preference Engine shutdown complete');
    this.emit('shutdown');
  }

  private async savePatternDatabase(): Promise<void> {
    // In a real implementation, this would save to persistent storage
    logger.info('Saving pattern database...');
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info('Pattern database saved');
  }
}

export default StylePreferenceEngine;

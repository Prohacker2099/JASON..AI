// core/JASON-AGI/modules/EverythingContextManager.ts
// Everything Context Manager (ECM) - The "Understanding Everything" Engine

import { EventEmitter } from 'events';
import { logger } from '../../../server/src/utils/logger';

export interface ContextNode {
  id: string;
  type: 'temporal' | 'spatial' | 'social' | 'financial' | 'academic' | 'health' | 'preference' | 'behavioral';
  data: any;
  weight: number; // 0-1 scale based on relevance and criticality
  temporalRelevance: number; // 0-1 scale based on recency
  criticality: number; // 0-1 scale based on importance
  connections: string[]; // IDs of connected nodes
  lastAccessed: Date;
  createdAt: Date;
  domain: string;
}

export interface TemporalContextGraph {
  nodes: Map<string, ContextNode>;
  edges: Map<string, Array<{ target: string; weight: number; type: string }>>;
  lastUpdated: Date;
  totalNodes: number;
  activeConnections: number;
}

export interface CrossDomainLink {
  id: string;
  sourceDomain: string;
  targetDomain: string;
  sourceNode: string;
  targetNode: string;
  linkType: 'causal' | 'temporal' | 'semantic' | 'behavioral' | 'preference';
  strength: number; // 0-1 scale
  confidence: number; // 0-1 scale
  discoveredAt: Date;
  lastValidated: Date;
}

export interface ContextAnalysis {
  goal: string;
  relevantDomains: string[];
  keyContextNodes: ContextNode[];
  crossDomainLinks: CrossDomainLink[];
  temporalContext: {
    recent: ContextNode[];
    relevant: ContextNode[];
    critical: ContextNode[];
  };
  confidence: number;
  completeness: number;
  analysisTimestamp: Date;
}

export interface ECMConfig {
  userId: string;
  enableTemporalWeighting: boolean;
  enableCrossDomainLinking: boolean;
  enableBehavioralAnalysis: boolean;
  enablePreferenceLearning: boolean;
  maxNodes: number;
  updateInterval: number; // milliseconds
  contextRetentionDays: number;
}

export class EverythingContextManager extends EventEmitter {
  private config: ECMConfig;
  private isActive: boolean = false;
  private temporalContextGraph: TemporalContextGraph;
  private crossDomainLinks: Map<string, CrossDomainLink> = new Map();
  private contextHistory: ContextAnalysis[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(config: ECMConfig) {
    super();
    this.config = config;
    this.temporalContextGraph = {
      nodes: new Map(),
      edges: new Map(),
      lastUpdated: new Date(),
      totalNodes: 0,
      activeConnections: 0
    };
    logger.info('Everything Context Manager initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing context data
      await this.loadExistingContext();
      
      // Initialize cross-domain linking
      if (this.config.enableCrossDomainLinking) {
        await this.initializeCrossDomainLinking();
      }
      
      // Start context update loop
      this.startContextUpdateLoop();
      
      this.isActive = true;
      logger.info('Everything Context Manager initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Everything Context Manager initialization failed:', error);
      throw error;
    }
  }

  private async loadExistingContext(): Promise<void> {
    logger.info('Loading existing context data...');
    
    // Simulate loading context nodes
    const initialNodes: ContextNode[] = [
      {
        id: 'user_profile',
        type: 'preference',
        data: {
          name: 'User',
          preferences: {
            communicationStyle: 'formal',
            responseLength: 'detailed',
            timeZone: 'PST',
            languages: ['en']
          }
        },
        weight: 1.0,
        temporalRelevance: 1.0,
        criticality: 1.0,
        connections: [],
        lastAccessed: new Date(),
        createdAt: new Date(Date.now() - 86400000),
        domain: 'personal'
      },
      {
        id: 'calendar_pattern',
        type: 'temporal',
        data: {
          workHours: '9:00-17:00',
          meetingPattern: 'morning_heavy',
          freeTime: 'evenings_weekends',
          timezone: 'PST'
        },
        weight: 0.9,
        temporalRelevance: 0.8,
        criticality: 0.9,
        connections: ['user_profile'],
        lastAccessed: new Date(),
        createdAt: new Date(Date.now() - 172800000),
        domain: 'calendar'
      },
      {
        id: 'financial_profile',
        type: 'financial',
        data: {
          budget: 5000,
          spendingPattern: 'conservative',
          preferredPayment: 'credit_card',
          monthlyExpenses: 3000
        },
        weight: 0.8,
        temporalRelevance: 0.7,
        criticality: 0.8,
        connections: ['user_profile'],
        lastAccessed: new Date(),
        createdAt: new Date(Date.now() - 259200000),
        domain: 'financial'
      },
      {
        id: 'academic_preferences',
        type: 'academic',
        data: {
          writingStyle: 'academic',
          citationFormat: 'APA',
          preferredSources: ['peer_reviewed', 'academic'],
          researchDepth: 'comprehensive'
        },
        weight: 0.7,
        temporalRelevance: 0.6,
        criticality: 0.7,
        connections: ['user_profile'],
        lastAccessed: new Date(),
        createdAt: new Date(Date.now() - 345600000),
        domain: 'academic'
      }
    ];

    initialNodes.forEach(node => {
      this.temporalContextGraph.nodes.set(node.id, node);
    });

    this.temporalContextGraph.totalNodes = initialNodes.length;
    logger.info(`Loaded ${initialNodes.length} context nodes`);
  }

  private async initializeCrossDomainLinking(): Promise<void> {
    logger.info('Initializing cross-domain linking...');
    
    // Create initial cross-domain links
    const initialLinks: CrossDomainLink[] = [
      {
        id: 'profile_calendar_link',
        sourceDomain: 'personal',
        targetDomain: 'calendar',
        sourceNode: 'user_profile',
        targetNode: 'calendar_pattern',
        linkType: 'behavioral',
        strength: 0.9,
        confidence: 0.8,
        discoveredAt: new Date(),
        lastValidated: new Date()
      },
      {
        id: 'profile_financial_link',
        sourceDomain: 'personal',
        targetDomain: 'financial',
        sourceNode: 'user_profile',
        targetNode: 'financial_profile',
        linkType: 'preference',
        strength: 0.8,
        confidence: 0.7,
        discoveredAt: new Date(),
        lastValidated: new Date()
      },
      {
        id: 'profile_academic_link',
        sourceDomain: 'personal',
        targetDomain: 'academic',
        sourceNode: 'user_profile',
        targetNode: 'academic_preferences',
        linkType: 'preference',
        strength: 0.7,
        confidence: 0.6,
        discoveredAt: new Date(),
        lastValidated: new Date()
      }
    ];

    initialLinks.forEach(link => {
      this.crossDomainLinks.set(link.id, link);
    });

    logger.info(`Initialized ${initialLinks.length} cross-domain links`);
  }

  private startContextUpdateLoop(): void {
    const interval = typeof (this as any).config?.updateInterval === 'number' ? (this as any).config.updateInterval : 1000;
    this.updateInterval = setInterval(() => {
      this.performContextUpdate();
    }, interval);
  }

  public async isHealthy(): Promise<boolean> {
    return this.isActive;
  }

  public async shutdown(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isActive = false;
  }

  public async analyzeContext(goal: string, context?: any): Promise<ContextAnalysis> {
    const relevantDomains = ['personal','calendar','financial','academic']
    const keyContextNodes = Array.from(this.temporalContextGraph.nodes.values()).slice(0, 3)
    const temporalContext = {
      recent: keyContextNodes,
      relevant: keyContextNodes,
      critical: keyContextNodes.filter(n => n.criticality > 0.8)
    }
    const analysis: ContextAnalysis = {
      goal,
      relevantDomains,
      keyContextNodes,
      crossDomainLinks: Array.from(this.crossDomainLinks.values()),
      temporalContext,
      confidence: 0.7,
      completeness: 0.6,
      analysisTimestamp: new Date()
    }
    this.emit('contextAnalyzed', analysis)
    return analysis
  }

  private performContextUpdate(): void {
    this.temporalContextGraph.lastUpdated = new Date()
    this.emit('contextUpdate', { lastUpdated: this.temporalContextGraph.lastUpdated })
  }

  private async performContextUpdate(): Promise<void> {
    try {
      // Update temporal relevance weights
      await this.updateTemporalRelevance();
      
      // Discover new cross-domain links
      if (this.config.enableCrossDomainLinking) {
        await this.discoverNewLinks();
      }
      
      // Clean up old context data
      await this.cleanupOldContext();
      
      this.temporalContextGraph.lastUpdated = new Date();
      
    } catch (error) {
      logger.error('Context update failed:', error);
    }
  }

  private async updateTemporalRelevance(): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const oneWeekAgo = new Date(now.getTime() - 604800000);
    
    for (const [nodeId, node] of this.temporalContextGraph.nodes) {
      const timeSinceAccess = now.getTime() - node.lastAccessed.getTime();
      
      if (node.lastAccessed > oneDayAgo) {
        node.temporalRelevance = 1.0;
      } else if (node.lastAccessed > oneWeekAgo) {
        node.temporalRelevance = 0.7;
      } else {
        node.temporalRelevance = Math.max(0.1, 1.0 - (timeSinceAccess / (30 * 86400000)));
      }
      
      // Update overall weight
      node.weight = (node.temporalRelevance + node.criticality) / 2;
    }
  }

  private async discoverNewLinks(): Promise<void> {
    const nodes = Array.from(this.temporalContextGraph.nodes.values());
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        if (node1.domain !== node2.domain) {
          const linkStrength = this.calculateLinkStrength(node1, node2);
          
          if (linkStrength > 0.5) {
            const linkId = `${node1.id}_${node2.id}`;
            
            if (!this.crossDomainLinks.has(linkId)) {
              const link: CrossDomainLink = {
                id: linkId,
                sourceDomain: node1.domain,
                targetDomain: node2.domain,
                sourceNode: node1.id,
                targetNode: node2.id,
                linkType: this.determineLinkType(node1, node2),
                strength: linkStrength,
                confidence: 0.6,
                discoveredAt: new Date(),
                lastValidated: new Date()
              };
              
              this.crossDomainLinks.set(linkId, link);
              this.emit('crossDomainLink', link);
            }
          }
        }
      }
    }
  }

  private calculateLinkStrength(node1: ContextNode, node2: ContextNode): number {
    // Simple heuristic for link strength calculation
    let strength = 0;
    
    // Temporal proximity
    const timeDiff = Math.abs(node1.lastAccessed.getTime() - node2.lastAccessed.getTime());
    const temporalProximity = Math.max(0, 1 - (timeDiff / (7 * 86400000))); // 1 week window
    strength += temporalProximity * 0.3;
    
    // Data similarity
    const dataSimilarity = this.calculateDataSimilarity(node1.data, node2.data);
    strength += dataSimilarity * 0.4;
    
    // Weight correlation
    const weightCorrelation = Math.abs(node1.weight - node2.weight);
    strength += (1 - weightCorrelation) * 0.3;
    
    return Math.min(1, strength);
  }

  private calculateDataSimilarity(data1: any, data2: any): number {
    // Simple similarity calculation
    const keys1 = Object.keys(data1);
    const keys2 = Object.keys(data2);
    const commonKeys = keys1.filter(key => keys2.includes(key));
    
    if (commonKeys.length === 0) return 0;
    
    let similarity = 0;
    for (const key of commonKeys) {
      if (data1[key] === data2[key]) {
        similarity += 1;
      }
    }
    
    return similarity / commonKeys.length;
  }

  private determineLinkType(node1: ContextNode, node2: ContextNode): CrossDomainLink['linkType'] {
    // Determine link type based on node types and data
    if (node1.type === 'temporal' || node2.type === 'temporal') {
      return 'temporal';
    } else if (node1.type === 'preference' || node2.type === 'preference') {
      return 'preference';
    } else if (node1.type === 'behavioral' || node2.type === 'behavioral') {
      return 'behavioral';
    } else {
      return 'semantic';
    }
  }

  private async cleanupOldContext(): Promise<void> {
    const cutoffDate = new Date(Date.now() - (this.config.contextRetentionDays * 86400000));
    const nodesToRemove: string[] = [];
    
    for (const [nodeId, node] of this.temporalContextGraph.nodes) {
      if (node.createdAt < cutoffDate && node.criticality < 0.5) {
        nodesToRemove.push(nodeId);
      }
    }
    
    nodesToRemove.forEach(nodeId => {
      this.temporalContextGraph.nodes.delete(nodeId);
    });
    
    if (nodesToRemove.length > 0) {
      logger.info(`Cleaned up ${nodesToRemove.length} old context nodes`);
    }
  }

  // Public API Methods
  public async analyzeContext(goal: string, context?: any): Promise<ContextAnalysis> {
    logger.info('Analyzing context for goal:', { goal: goal.substring(0, 100) });
    
    // Extract relevant domains from goal
    const relevantDomains = this.extractRelevantDomains(goal);
    
    // Find key context nodes
    const keyContextNodes = this.findKeyContextNodes(goal, relevantDomains);
    
    // Find cross-domain links
    const crossDomainLinks = this.findRelevantCrossDomainLinks(keyContextNodes);
    
    // Organize temporal context
    const temporalContext = this.organizeTemporalContext(keyContextNodes);
    
    // Calculate confidence and completeness
    const confidence = this.calculateAnalysisConfidence(keyContextNodes, crossDomainLinks);
    const completeness = this.calculateAnalysisCompleteness(relevantDomains, keyContextNodes);
    
    const analysis: ContextAnalysis = {
      goal,
      relevantDomains,
      keyContextNodes,
      crossDomainLinks,
      temporalContext,
      confidence,
      completeness,
      analysisTimestamp: new Date()
    };
    
    // Store analysis in history
    this.contextHistory.push(analysis);
    
    // Limit history size
    if (this.contextHistory.length > 100) {
      this.contextHistory = this.contextHistory.slice(-100);
    }
    
    this.emit('contextAnalyzed', analysis);
    logger.info('Context analysis completed:', { 
      domains: relevantDomains.length, 
      nodes: keyContextNodes.length, 
      links: crossDomainLinks.length,
      confidence,
      completeness
    });
    
    return analysis;
  }

  private extractRelevantDomains(goal: string): string[] {
    const domainKeywords: Record<string, string[]> = {
      'calendar': ['meeting', 'schedule', 'appointment', 'event', 'time', 'date'],
      'financial': ['budget', 'money', 'cost', 'price', 'payment', 'expense', 'purchase'],
      'academic': ['homework', 'assignment', 'research', 'study', 'paper', 'essay', 'thesis'],
      'travel': ['trip', 'vacation', 'flight', 'hotel', 'booking', 'travel', 'destination'],
      'health': ['exercise', 'workout', 'diet', 'health', 'medical', 'appointment'],
      'social': ['friend', 'family', 'party', 'event', 'social', 'meeting'],
      'work': ['project', 'work', 'business', 'meeting', 'presentation', 'deadline']
    };
    
    const lowerGoal = goal.toLowerCase();
    const relevantDomains: string[] = [];
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => lowerGoal.includes(keyword))) {
        relevantDomains.push(domain);
      }
    }
    
    // Always include personal domain
    if (!relevantDomains.includes('personal')) {
      relevantDomains.push('personal');
    }
    
    return relevantDomains;
  }

  private findKeyContextNodes(goal: string, domains: string[]): ContextNode[] {
    const nodes = Array.from(this.temporalContextGraph.nodes.values());
    
    return nodes
      .filter(node => domains.includes(node.domain))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10); // Top 10 most relevant nodes
  }

  private findRelevantCrossDomainLinks(keyNodes: ContextNode[]): CrossDomainLink[] {
    const nodeIds = keyNodes.map(node => node.id);
    const links = Array.from(this.crossDomainLinks.values());
    
    return links.filter(link => 
      nodeIds.includes(link.sourceNode) || nodeIds.includes(link.targetNode)
    );
  }

  private organizeTemporalContext(keyNodes: ContextNode[]): ContextAnalysis['temporalContext'] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const oneWeekAgo = new Date(now.getTime() - 604800000);
    
    const recent = keyNodes.filter(node => node.lastAccessed > oneDayAgo);
    const relevant = keyNodes.filter(node => 
      node.lastAccessed > oneWeekAgo && node.lastAccessed <= oneDayAgo
    );
    const critical = keyNodes.filter(node => node.criticality > 0.8);
    
    return { recent, relevant, critical };
  }

  private calculateAnalysisConfidence(keyNodes: ContextNode[], crossDomainLinks: CrossDomainLink[]): number {
    const nodeConfidence = keyNodes.reduce((sum, node) => sum + node.weight, 0) / keyNodes.length;
    const linkConfidence = crossDomainLinks.length > 0 ? 
      crossDomainLinks.reduce((sum, link) => sum + link.confidence, 0) / crossDomainLinks.length : 0;
    
    return (nodeConfidence + linkConfidence) / 2;
  }

  private calculateAnalysisCompleteness(domains: string[], keyNodes: ContextNode[]): number {
    const coveredDomains = new Set(keyNodes.map(node => node.domain));
    return coveredDomains.size / domains.length;
  }

  public async addContextNode(node: Omit<ContextNode, 'id' | 'createdAt' | 'lastAccessed'>): Promise<string> {
    const newNode: ContextNode = {
      ...node,
      id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastAccessed: new Date()
    };
    
    this.temporalContextGraph.nodes.set(newNode.id, newNode);
    this.temporalContextGraph.totalNodes++;
    
    this.emit('contextNodeAdded', newNode);
    logger.info('Context node added:', { nodeId: newNode.id, type: newNode.type });
    
    return newNode.id;
  }

  public async updateContextNode(nodeId: string, updates: Partial<ContextNode>): Promise<void> {
    const node = this.temporalContextGraph.nodes.get(nodeId);
    if (!node) return;
    
    const updatedNode = { ...node, ...updates, lastAccessed: new Date() };
    this.temporalContextGraph.nodes.set(nodeId, updatedNode);
    
    this.emit('contextNodeUpdated', updatedNode);
    logger.info('Context node updated:', { nodeId, updates });
  }

  public async getContextNode(nodeId: string): Promise<ContextNode | null> {
    return this.temporalContextGraph.nodes.get(nodeId) || null;
  }

  public async getAllContextNodes(): Promise<ContextNode[]> {
    return Array.from(this.temporalContextGraph.nodes.values());
  }

  public async getCrossDomainLinks(): Promise<CrossDomainLink[]> {
    return Array.from(this.crossDomainLinks.values());
  }

  public async getContextHistory(): Promise<ContextAnalysis[]> {
    return [...this.contextHistory];
  }

  public async testContextAwareness(): Promise<boolean> {
    try {
      const testGoal = 'Plan a weekend trip';
      const analysis = await this.analyzeContext(testGoal);
      
      return analysis.confidence > 0.5 && analysis.completeness > 0.3;
    } catch (error) {
      logger.error('Context awareness test failed:', error);
      return false;
    }
  }

  public async updateConfig(newConfig: Partial<ECMConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info('Everything Context Manager config updated:', newConfig);
    this.emit('configUpdated', newConfig);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && this.temporalContextGraph.totalNodes > 0;
    } catch (error) {
      logger.error('Everything Context Manager health check failed:', error);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Everything Context Manager shutting down...');
    
    this.isActive = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Save context data
    await this.saveContextData();
    
    logger.info('Everything Context Manager shutdown complete');
    this.emit('shutdown');
  }

  private async saveContextData(): Promise<void> {
    // In a real implementation, this would save to persistent storage
    logger.info('Saving context data...');
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info('Context data saved');
  }
}

export default EverythingContextManager;

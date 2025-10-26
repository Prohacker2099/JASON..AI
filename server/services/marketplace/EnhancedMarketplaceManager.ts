import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

// Enhanced marketplace item with AI recommendations
export interface EnhancedMarketplaceItem {
  id: string;
  name: string;
  type: 'plugin' | 'theme' | 'integration' | 'automation' | 'ai_model';
  developerId: string;
  price: number;
  downloads: number;
  rating: number;
  description: string;
  tags: string[];
  compatibility: string[];
  aiScore: number; // AI-calculated relevance score
  personalizedScore?: number; // User-specific score
  trendingScore: number;
  qualityScore: number;
  securityScore: number;
  performanceMetrics: {
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
    reliability: number;
  };
  aiRecommendations: {
    reason: string;
    confidence: number;
    category: 'trending' | 'personalized' | 'similar' | 'complementary';
  }[];
  metadata: {
    version: string;
    lastUpdated: Date;
    fileSize: number;
    screenshots: string[];
    documentation: string;
    supportLevel: 'community' | 'developer' | 'enterprise';
  };
}

export interface UserPreferences {
  userId: string;
  categories: string[];
  priceRange: { min: number; max: number };
  preferredDevelopers: string[];
  excludedTags: string[];
  usagePatterns: {
    deviceTypes: string[];
    automationComplexity: 'simple' | 'moderate' | 'advanced';
    updateFrequency: 'stable' | 'frequent' | 'bleeding_edge';
  };
}

export interface RecommendationContext {
  userId: string;
  currentDevices: string[];
  installedItems: string[];
  recentActivity: string[];
  energyProfile: {
    averageUsage: number;
    peakHours: number[];
    deviceCount: number;
  };
}

/**
 * Enhanced Marketplace Manager with AI-Powered Recommendations
 */
export class EnhancedMarketplaceManager extends EventEmitter {
  private aiModel: any = null;
  private userPreferences = new Map<string, UserPreferences>();
  private itemAnalytics = new Map<string, any>();
  private trendingItems = new Set<string>();
  private qualityMetrics = new Map<string, number>();

  constructor() {
    super();
    this.initializeAIRecommendationEngine();
  }

  private async initializeAIRecommendationEngine(): Promise<void> {
    logger.info('🤖 Initializing AI-powered marketplace recommendation engine...');
    
    // Initialize recommendation algorithms
    await this.loadUserPreferences();
    await this.analyzeMarketplaceTrends();
    await this.calculateQualityScores();
    
    // Start continuous learning
    this.startContinuousLearning();
    
    logger.info('✅ AI marketplace recommendation engine initialized');
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        include: {
          marketplacePurchases: true,
          devices: true
        }
      });

      for (const user of users) {
        const preferences = await this.generateUserPreferences(user);
        this.userPreferences.set(user.id, preferences);
      }

      logger.info(`📊 Loaded preferences for ${users.length} users`);
    } catch (error) {
      logger.error('Failed to load user preferences:', error);
    }
  }

  private async generateUserPreferences(user: any): Promise<UserPreferences> {
    const purchases = user.marketplacePurchases || [];
    const devices = user.devices || [];

    // Analyze purchase history
    const categoryFrequency = new Map<string, number>();
    const developerFrequency = new Map<string, number>();
    const priceHistory: number[] = [];

    purchases.forEach((purchase: any) => {
      if (purchase.item) {
        const category = purchase.item.type;
        categoryFrequency.set(category, (categoryFrequency.get(category) || 0) + 1);
        
        const developer = purchase.item.developerId;
        developerFrequency.set(developer, (developerFrequency.get(developer) || 0) + 1);
        
        priceHistory.push(purchase.pricePaid);
      }
    });

    // Extract preferred categories
    const categories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // Extract preferred developers
    const preferredDevelopers = Array.from(developerFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([developer]) => developer);

    // Calculate price range
    const avgPrice = priceHistory.length > 0 ? 
      priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length : 50;
    const priceRange = {
      min: Math.max(0, avgPrice * 0.5),
      max: avgPrice * 2
    };

    // Analyze device usage patterns
    const deviceTypes = devices.map((device: any) => device.type);
    const automationComplexity = this.inferAutomationComplexity(purchases, devices);

    return {
      userId: user.id,
      categories,
      priceRange,
      preferredDevelopers,
      excludedTags: [], // Can be set by user
      usagePatterns: {
        deviceTypes,
        automationComplexity,
        updateFrequency: 'stable' // Default preference
      }
    };
  }

  private inferAutomationComplexity(purchases: any[], devices: any[]): 'simple' | 'moderate' | 'advanced' {
    const complexityScore = purchases.length * 0.3 + devices.length * 0.2;
    
    if (complexityScore > 10) return 'advanced';
    if (complexityScore > 5) return 'moderate';
    return 'simple';
  }

  private async analyzeMarketplaceTrends(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentPurchases = await prisma.marketplacePurchase.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          item: true
        }
      });

      // Calculate trending scores
      const itemDownloads = new Map<string, number>();
      recentPurchases.forEach(purchase => {
        if (purchase.item) {
          const count = itemDownloads.get(purchase.itemId) || 0;
          itemDownloads.set(purchase.itemId, count + 1);
        }
      });

      // Mark top 20% as trending
      const sortedItems = Array.from(itemDownloads.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const trendingThreshold = Math.ceil(sortedItems.length * 0.2);
      sortedItems.slice(0, trendingThreshold).forEach(([itemId]) => {
        this.trendingItems.add(itemId);
      });

      logger.info(`📈 Identified ${this.trendingItems.size} trending items`);
    } catch (error) {
      logger.error('Failed to analyze marketplace trends:', error);
    }
  }

  private async calculateQualityScores(): Promise<void> {
    try {
      const items = await prisma.marketplaceItem.findMany({
        include: {
          purchases: true,
          reviews: true
        }
      });

      for (const item of items) {
        const qualityScore = this.calculateItemQualityScore(item);
        this.qualityMetrics.set(item.id, qualityScore);
      }

      logger.info(`🏆 Calculated quality scores for ${items.length} items`);
    } catch (error) {
      logger.error('Failed to calculate quality scores:', error);
    }
  }

  private calculateItemQualityScore(item: any): number {
    let score = 0;

    // Rating component (0-40 points)
    if (item.rating && item.rating > 0) {
      score += (item.rating / 5) * 40;
    }

    // Download popularity (0-20 points)
    const downloadScore = Math.min(20, (item.downloads / 1000) * 20);
    score += downloadScore;

    // Developer reputation (0-20 points)
    const developerScore = this.getDeveloperReputationScore(item.developerId);
    score += developerScore;

    // Recency bonus (0-10 points)
    const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 10 - (daysSinceUpdate / 30));
    score += recencyScore;

    // Security score (0-10 points)
    const securityScore = this.calculateSecurityScore(item);
    score += securityScore;

    return Math.min(100, score);
  }

  private getDeveloperReputationScore(developerId: string): number {
    // Simplified developer reputation calculation
    // In a real implementation, this would consider:
    // - Number of published items
    // - Average ratings across all items
    // - Support responsiveness
    // - Update frequency
    return 15; // Default score
  }

  private calculateSecurityScore(item: any): number {
    // Simplified security scoring
    // In a real implementation, this would include:
    // - Code analysis results
    // - Permission requirements
    // - Third-party dependencies
    // - Developer verification status
    return 8; // Default score
  }

  private startContinuousLearning(): void {
    // Update recommendations every hour
    setInterval(async () => {
      await this.updateRecommendations();
    }, 60 * 60 * 1000);

    logger.info('🔄 Started continuous learning for marketplace recommendations');
  }

  private async updateRecommendations(): Promise<void> {
    try {
      await this.analyzeMarketplaceTrends();
      await this.calculateQualityScores();
      
      // Emit updated recommendations
      this.emit('recommendationsUpdated');
      
      logger.debug('📊 Updated marketplace recommendations');
    } catch (error) {
      logger.error('Failed to update recommendations:', error);
    }
  }

  // Enhanced public API
  public async getPersonalizedRecommendations(
    userId: string, 
    context?: RecommendationContext,
    limit: number = 10
  ): Promise<EnhancedMarketplaceItem[]> {
    try {
      const userPrefs = this.userPreferences.get(userId);
      if (!userPrefs) {
        return this.getTrendingItems(limit);
      }

      const allItems = await this.getAllEnhancedItems();
      const scoredItems = allItems.map(item => ({
        ...item,
        personalizedScore: this.calculatePersonalizedScore(item, userPrefs, context)
      }));

      return scoredItems
        .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0))
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }

  private calculatePersonalizedScore(
    item: EnhancedMarketplaceItem, 
    preferences: UserPreferences,
    context?: RecommendationContext
  ): number {
    let score = item.aiScore;

    // Category preference bonus
    if (preferences.categories.includes(item.type)) {
      score += 20;
    }

    // Price preference
    if (item.price >= preferences.priceRange.min && item.price <= preferences.priceRange.max) {
      score += 15;
    }

    // Developer preference
    if (preferences.preferredDevelopers.includes(item.developerId)) {
      score += 25;
    }

    // Tag penalties
    const hasExcludedTag = item.tags.some(tag => preferences.excludedTags.includes(tag));
    if (hasExcludedTag) {
      score -= 30;
    }

    // Context-based adjustments
    if (context) {
      // Device compatibility bonus
      const compatibleDevices = item.compatibility.filter(compat => 
        context.currentDevices.some(device => device.includes(compat))
      );
      score += compatibleDevices.length * 5;

      // Avoid already installed items
      if (context.installedItems.includes(item.id)) {
        score -= 50;
      }
    }

    // Quality and trending bonuses
    score += item.qualityScore * 0.3;
    score += item.trendingScore * 0.2;

    return Math.max(0, score);
  }

  public async getTrendingItems(limit: number = 10): Promise<EnhancedMarketplaceItem[]> {
    const allItems = await this.getAllEnhancedItems();
    
    return allItems
      .filter(item => this.trendingItems.has(item.id))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  public async getSimilarItems(itemId: string, limit: number = 5): Promise<EnhancedMarketplaceItem[]> {
    try {
      const targetItem = await this.getEnhancedItem(itemId);
      if (!targetItem) return [];

      const allItems = await this.getAllEnhancedItems();
      const similarItems = allItems
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          similarityScore: this.calculateSimilarityScore(targetItem, item)
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      return similarItems;
    } catch (error) {
      logger.error('Failed to get similar items:', error);
      return [];
    }
  }

  private calculateSimilarityScore(item1: EnhancedMarketplaceItem, item2: EnhancedMarketplaceItem): number {
    let score = 0;

    // Type similarity
    if (item1.type === item2.type) score += 30;

    // Tag similarity
    const commonTags = item1.tags.filter(tag => item2.tags.includes(tag));
    score += commonTags.length * 10;

    // Price similarity
    const priceDiff = Math.abs(item1.price - item2.price);
    const maxPrice = Math.max(item1.price, item2.price);
    if (maxPrice > 0) {
      score += (1 - priceDiff / maxPrice) * 20;
    }

    // Developer similarity
    if (item1.developerId === item2.developerId) score += 15;

    return score;
  }

  public async getComplementaryItems(
    installedItems: string[], 
    limit: number = 5
  ): Promise<EnhancedMarketplaceItem[]> {
    try {
      const installed = await Promise.all(
        installedItems.map(id => this.getEnhancedItem(id))
      );
      const validInstalled = installed.filter(item => item !== null) as EnhancedMarketplaceItem[];

      if (validInstalled.length === 0) return [];

      const allItems = await this.getAllEnhancedItems();
      const complementaryItems = allItems
        .filter(item => !installedItems.includes(item.id))
        .map(item => ({
          ...item,
          complementaryScore: this.calculateComplementaryScore(validInstalled, item)
        }))
        .sort((a, b) => b.complementaryScore - a.complementaryScore)
        .slice(0, limit);

      return complementaryItems;
    } catch (error) {
      logger.error('Failed to get complementary items:', error);
      return [];
    }
  }

  private calculateComplementaryScore(installedItems: EnhancedMarketplaceItem[], candidate: EnhancedMarketplaceItem): number {
    let score = 0;

    installedItems.forEach(installed => {
      // Different type but compatible
      if (installed.type !== candidate.type) {
        const hasCompatibleTags = installed.tags.some(tag => candidate.tags.includes(tag));
        if (hasCompatibleTags) score += 20;
      }

      // Same developer ecosystem
      if (installed.developerId === candidate.developerId) {
        score += 15;
      }

      // Compatibility check
      const isCompatible = candidate.compatibility.some(compat => 
        installed.compatibility.includes(compat)
      );
      if (isCompatible) score += 25;
    });

    return score;
  }

  private async getAllEnhancedItems(): Promise<EnhancedMarketplaceItem[]> {
    try {
      const items = await prisma.marketplaceItem.findMany({
        include: {
          purchases: true,
          reviews: true
        }
      });

      return items.map(item => this.enhanceMarketplaceItem(item));
    } catch (error) {
      logger.error('Failed to get enhanced items:', error);
      return [];
    }
  }

  private async getEnhancedItem(itemId: string): Promise<EnhancedMarketplaceItem | null> {
    try {
      const item = await prisma.marketplaceItem.findUnique({
        where: { id: itemId },
        include: {
          purchases: true,
          reviews: true
        }
      });

      return item ? this.enhanceMarketplaceItem(item) : null;
    } catch (error) {
      logger.error('Failed to get enhanced item:', error);
      return null;
    }
  }

  private enhanceMarketplaceItem(item: any): EnhancedMarketplaceItem {
    const qualityScore = this.qualityMetrics.get(item.id) || 0;
    const trendingScore = this.trendingItems.has(item.id) ? 80 : 20;
    const aiScore = (qualityScore + trendingScore) / 2;

    return {
      id: item.id,
      name: item.name,
      type: item.type as any,
      developerId: item.developerId,
      price: item.price,
      downloads: item.downloads,
      rating: item.rating || 0,
      description: item.description || '',
      tags: item.tags || [],
      compatibility: item.compatibility || [],
      aiScore,
      trendingScore,
      qualityScore,
      securityScore: this.calculateSecurityScore(item),
      performanceMetrics: {
        loadTime: Math.random() * 1000 + 100, // Simulated
        memoryUsage: Math.random() * 50 + 10,
        cpuUsage: Math.random() * 20 + 5,
        reliability: Math.random() * 20 + 80
      },
      aiRecommendations: this.generateAIRecommendations(item, aiScore),
      metadata: {
        version: item.version || '1.0.0',
        lastUpdated: item.updatedAt,
        fileSize: item.fileSize || Math.random() * 10000000,
        screenshots: item.screenshots || [],
        documentation: item.documentation || '',
        supportLevel: item.supportLevel || 'community'
      }
    };
  }

  private generateAIRecommendations(item: any, aiScore: number): any[] {
    const recommendations = [];

    if (this.trendingItems.has(item.id)) {
      recommendations.push({
        reason: 'Currently trending with high user adoption',
        confidence: 0.85,
        category: 'trending'
      });
    }

    if (aiScore > 70) {
      recommendations.push({
        reason: 'High quality score based on user reviews and performance',
        confidence: 0.9,
        category: 'personalized'
      });
    }

    if (item.downloads > 1000) {
      recommendations.push({
        reason: 'Popular choice with proven reliability',
        confidence: 0.8,
        category: 'similar'
      });
    }

    return recommendations;
  }

  // Legacy API compatibility
  public async listAll(): Promise<any[]> {
    const enhancedItems = await this.getAllEnhancedItems();
    return enhancedItems.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      developerId: item.developerId,
      price: item.price,
      downloads: item.downloads,
      rating: item.rating
    }));
  }

  public async purchaseItem(userId: string, itemId: string): Promise<boolean> {
    try {
      const item = await prisma.marketplaceItem.findUnique({ where: { id: itemId } });
      if (!item) {
        logger.warn(`Attempt to purchase missing item ${itemId}`);
        return false;
      }

      await prisma.$transaction([
        prisma.marketplacePurchase.create({
          data: {
            userId,
            itemId,
            pricePaid: item.price,
          },
        }),
        prisma.marketplaceItem.update({
          where: { id: itemId },
          data: { downloads: { increment: 1 } },
        }),
      ]);

      // Update user preferences based on purchase
      await this.updateUserPreferencesFromPurchase(userId, item);

      logger.info(`Purchase of "${item.name}" by user ${userId} successful.`);
      this.emit('itemPurchased', { userId, item });
      
      return true;
    } catch (error) {
      logger.error('Purchase failed:', error);
      return false;
    }
  }

  private async updateUserPreferencesFromPurchase(userId: string, item: any): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          marketplacePurchases: { include: { item: true } },
          devices: true
        }
      });

      if (user) {
        const updatedPreferences = await this.generateUserPreferences(user);
        this.userPreferences.set(userId, updatedPreferences);
      }
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
    }
  }

  public async submitItem(item: any): Promise<any> {
    try {
      // Enhanced validation
      if (!item.name) throw new Error('name is required');
      if (!item.type) throw new Error('type is required');
      if (!item.developerId) throw new Error('developerId is required');
      if (!item.description) throw new Error('description is required');

      const price = Math.max(0, Number(item.price ?? 0));

      const created = await prisma.marketplaceItem.create({
        data: {
          name: item.name,
          type: item.type,
          developerId: item.developerId,
          price,
          downloads: 0,
          rating: 0,
          description: item.description,
          tags: item.tags || [],
          compatibility: item.compatibility || [],
          version: item.version || '1.0.0',
          fileSize: item.fileSize || 0,
          screenshots: item.screenshots || [],
          documentation: item.documentation || '',
          supportLevel: item.supportLevel || 'community'
        },
      });

      // Calculate initial quality score
      const qualityScore = this.calculateItemQualityScore(created);
      this.qualityMetrics.set(created.id, qualityScore);

      logger.info(`New enhanced marketplace item submitted: ${created.name} (${created.type})`);
      this.emit('newItemSubmitted', created);
      
      return this.enhanceMarketplaceItem(created);
    } catch (error) {
      logger.error('Failed to submit item:', error);
      throw error;
    }
  }

  public async getItemsByDeveloper(developerId: string): Promise<any[]> {
    try {
      const items = await prisma.marketplaceItem.findMany({ 
        where: { developerId },
        include: {
          purchases: true,
          reviews: true
        }
      });
      
      return items.map(item => this.enhanceMarketplaceItem(item));
    } catch (error) {
      logger.error('Failed to get items by developer:', error);
      return [];
    }
  }
}

export const enhancedMarketplaceManager = new EnhancedMarketplaceManager();

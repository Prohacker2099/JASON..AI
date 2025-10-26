import { logger } from './logger';
import { cacheTracker } from '../middleware/performance';

// Enhanced caching system with multiple storage backends
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  onEvict?: (key: string, value: any) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// In-memory cache with LRU eviction
export class MemoryCache {
  private cache = new Map<string, { value: any; expires: number; lastAccessed: number }>();
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly onEvict?: (key: string, value: any) => void;
  private stats = { hits: 0, misses: 0 };

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.onEvict = options.onEvict;
  }

  set(key: string, value: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTtl);
    
    // Evict expired items and enforce size limit
    this.cleanup();
    
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      expires,
      lastAccessed: Date.now()
    });
    
    logger.debug(`Cache SET: ${key}`, { ttl: ttl || this.defaultTtl });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      cacheTracker.miss('memory');
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      cacheTracker.miss('memory');
      return null;
    }
    
    item.lastAccessed = Date.now();
    this.stats.hits++;
    cacheTracker.hit('memory');
    
    logger.debug(`Cache HIT: ${key}`);
    return item.value;
  }

  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (item && this.onEvict) {
      this.onEvict(key, item.value);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, item] of this.cache.entries()) {
        this.onEvict(key, item.value);
      }
    }
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? Date.now() <= item.expires : false;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        if (this.onEvict) {
          this.onEvict(key, item.value);
        }
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const item = this.cache.get(oldestKey);
      if (item && this.onEvict) {
        this.onEvict(oldestKey, item.value);
      }
      this.cache.delete(oldestKey);
      logger.debug(`Cache LRU eviction: ${oldestKey}`);
    }
  }
}

// Multi-level cache with memory and persistent storage
export class MultiLevelCache {
  private l1Cache: MemoryCache; // Fast memory cache
  private l2Cache: Map<string, any> = new Map(); // Slower persistent cache simulation
  private readonly name: string;

  constructor(name: string, options: CacheOptions = {}) {
    this.name = name;
    this.l1Cache = new MemoryCache({
      ...options,
      maxSize: options.maxSize || 500, // Smaller L1 cache
      onEvict: (key, value) => {
        // Move evicted items to L2 cache
        this.l2Cache.set(key, {
          value,
          expires: Date.now() + (options.ttl || 60 * 60 * 1000) // 1 hour in L2
        });
      }
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.l1Cache.set(key, value, ttl);
  }

  async get(key: string): Promise<any | null> {
    // Try L1 cache first
    let value = this.l1Cache.get(key);
    if (value !== null) {
      cacheTracker.hit(this.name);
      return value;
    }

    // Try L2 cache
    const l2Item = this.l2Cache.get(key);
    if (l2Item && Date.now() <= l2Item.expires) {
      value = l2Item.value;
      // Promote to L1 cache
      this.l1Cache.set(key, value);
      cacheTracker.hit(this.name);
      logger.debug(`Cache L2 HIT promoted to L1: ${key}`);
      return value;
    }

    // Clean up expired L2 items
    if (l2Item) {
      this.l2Cache.delete(key);
    }

    cacheTracker.miss(this.name);
    return null;
  }

  async delete(key: string): Promise<boolean> {
    const l1Deleted = this.l1Cache.delete(key);
    const l2Deleted = this.l2Cache.delete(key);
    return l1Deleted || l2Deleted;
  }

  async clear(): Promise<void> {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  getStats(): { l1: CacheStats; l2: { size: number } } {
    return {
      l1: this.l1Cache.getStats(),
      l2: { size: this.l2Cache.size }
    };
  }
}

// Specialized caches for different data types
export class DeviceCache extends MultiLevelCache {
  constructor() {
    super('device', {
      ttl: 30 * 1000, // 30 seconds for device state
      maxSize: 200
    });
  }

  async getDeviceState(deviceId: string): Promise<any | null> {
    return this.get(`device:${deviceId}:state`);
  }

  async setDeviceState(deviceId: string, state: any): Promise<void> {
    await this.set(`device:${deviceId}:state`, state);
  }

  async getDeviceCapabilities(deviceId: string): Promise<any | null> {
    return this.get(`device:${deviceId}:capabilities`);
  }

  async setDeviceCapabilities(deviceId: string, capabilities: any): Promise<void> {
    // Capabilities change rarely, cache longer
    await this.set(`device:${deviceId}:capabilities`, capabilities, 10 * 60 * 1000);
  }
}

export class EnergyCache extends MultiLevelCache {
  constructor() {
    super('energy', {
      ttl: 60 * 1000, // 1 minute for energy readings
      maxSize: 500
    });
  }

  async getEnergyReading(deviceId: string): Promise<any | null> {
    return this.get(`energy:${deviceId}:reading`);
  }

  async setEnergyReading(deviceId: string, reading: any): Promise<void> {
    await this.set(`energy:${deviceId}:reading`, reading);
  }

  async getUsageHistory(deviceId: string, period: string): Promise<any | null> {
    return this.get(`energy:${deviceId}:history:${period}`);
  }

  async setUsageHistory(deviceId: string, period: string, history: any): Promise<void> {
    // Historical data can be cached longer
    await this.set(`energy:${deviceId}:history:${period}`, history, 5 * 60 * 1000);
  }
}

export class APICache extends MultiLevelCache {
  constructor() {
    super('api', {
      ttl: 2 * 60 * 1000, // 2 minutes for API responses
      maxSize: 1000
    });
  }

  async cacheResponse(endpoint: string, params: any, response: any): Promise<void> {
    const key = this.generateKey(endpoint, params);
    await this.set(key, response);
  }

  async getCachedResponse(endpoint: string, params: any): Promise<any | null> {
    const key = this.generateKey(endpoint, params);
    return this.get(key);
  }

  private generateKey(endpoint: string, params: any): string {
    const paramStr = JSON.stringify(params, Object.keys(params).sort());
    return `api:${endpoint}:${Buffer.from(paramStr).toString('base64')}`;
  }
}

// Cache manager to coordinate all caches
export class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, MultiLevelCache> = new Map();
  
  // Specialized cache instances
  public readonly device: DeviceCache;
  public readonly energy: EnergyCache;
  public readonly api: APICache;

  private constructor() {
    this.device = new DeviceCache();
    this.energy = new EnergyCache();
    this.api = new APICache();
    
    this.caches.set('device', this.device);
    this.caches.set('energy', this.energy);
    this.caches.set('api', this.api);
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  createCache(name: string, options: CacheOptions = {}): MultiLevelCache {
    const cache = new MultiLevelCache(name, options);
    this.caches.set(name, cache);
    return cache;
  }

  getCache(name: string): MultiLevelCache | undefined {
    return this.caches.get(name);
  }

  async clearAll(): Promise<void> {
    for (const cache of this.caches.values()) {
      await cache.clear();
    }
    logger.info('All caches cleared');
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  // Cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    logger.info('Starting cache warming...');
    
    try {
      // Warm device cache with known devices
      // This would typically load from database
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed', error);
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Utility functions for common caching patterns
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: MultiLevelCache,
  ttl?: number
): Promise<T> => {
  // Try to get from cache first
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await cache.set(key, data, ttl);
  
  return data;
};

export const invalidatePattern = async (
  pattern: string,
  cache: MultiLevelCache
): Promise<void> => {
  // This is a simplified implementation
  // In production, you might want a more sophisticated pattern matching
  logger.info(`Invalidating cache pattern: ${pattern}`);
};

export default cacheManager;

import { EventEmitter } from 'events'
import { Logger } from '../utils/Logger'

/**
 * Shared Memory Manager for high-speed thread-safe data access
 * Manages context data, plans, and learning state
 */
export class SharedMemoryManager extends EventEmitter {
  private sharedData = new Map<string, any>()
  private locks = new Map<string, boolean>()
  private logger: Logger
  private accessStats = {
    reads: 0,
    writes: 0,
    locks: 0,
    contentions: 0
  }

  constructor() {
    super()
    this.logger = new Logger('SharedMemory')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Shared Memory Manager...')
    
    // Initialize core data structures
    this.sharedData.set('system:state', {
      plans: new Map(),
      context: new Map(),
      learning: new Map(),
      cache: new Map()
    })
    
    this.logger.info('Shared Memory Manager initialized')
  }

  /**
   * Thread-safe read operation
   */
  async read<T>(key: string): Promise<T | undefined> {
    await this.acquireReadLock(key)
    try {
      this.accessStats.reads++
      return this.sharedData.get(key)
    } finally {
      this.releaseReadLock(key)
    }
  }

  /**
   * Thread-safe write operation
   */
  async write<T>(key: string, value: T): Promise<void> {
    await this.acquireWriteLock(key)
    try {
      this.sharedData.set(key, value)
      this.accessStats.writes++
      this.emit('data:changed', { key, value })
    } finally {
      this.releaseWriteLock(key)
    }
  }

  /**
   * Atomic compare-and-swap operation
   */
  async compareAndSwap<T>(key: string, expected: T, newValue: T): Promise<boolean> {
    await this.acquireWriteLock(key)
    try {
      const current = this.sharedData.get(key)
      if (current === expected) {
        this.sharedData.set(key, newValue)
        this.emit('data:changed', { key, value: newValue })
        return true
      }
      return false
    } finally {
      this.releaseWriteLock(key)
    }
  }

  /**
   * Get or create value atomically
   */
  async getOrCreate<T>(key: string, factory: () => T): Promise<T> {
    await this.acquireWriteLock(key)
    try {
      if (!this.sharedData.has(key)) {
        const value = factory()
        this.sharedData.set(key, value)
        this.emit('data:created', { key, value })
        return value
      }
      return this.sharedData.get(key)
    } finally {
      this.releaseWriteLock(key)
    }
  }

  /**
   * Delete key atomically
   */
  async delete(key: string): Promise<boolean> {
    await this.acquireWriteLock(key)
    try {
      const existed = this.sharedData.has(key)
      if (existed) {
        this.sharedData.delete(key)
        this.emit('data:deleted', { key })
      }
      return existed
    } finally {
      this.releaseWriteLock(key)
    }
  }

  /**
   * Clear all data (for shutdown)
   */
  async clear(): Promise<void> {
    // Acquire all locks
    const lockKeys = Array.from(this.locks.keys())
    await Promise.all(lockKeys.map(key => this.acquireWriteLock(key)))
    
    try {
      this.sharedData.clear()
      this.emit('data:cleared')
    } finally {
      lockKeys.forEach(key => this.releaseWriteLock(key))
    }
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    return {
      ...this.accessStats,
      dataSize: this.sharedData.size,
      lockCount: this.locks.size
    }
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up Shared Memory Manager...')
    await this.clear()
    this.locks.clear()
    this.logger.info('Shared Memory Manager cleanup complete')
  }

  private async acquireReadLock(key: string): Promise<void> {
    while (this.locks.get(`${key}:write`)) {
      this.accessStats.contentions++
      await this.sleep(1)
    }
    this.locks.set(`${key}:read`, true)
    this.accessStats.locks++
  }

  private async acquireWriteLock(key: string): Promise<void> {
    // Wait for all readers and other writers
    while (this.locks.get(`${key}:read`) || this.locks.get(`${key}:write`)) {
      this.accessStats.contentions++
      await this.sleep(1)
    }
    this.locks.set(`${key}:write`, true)
    this.accessStats.locks++
  }

  private releaseReadLock(key: string): void {
    this.locks.delete(`${key}:read`)
  }

  private releaseWriteLock(key: string): void {
    this.locks.delete(`${key}:write`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

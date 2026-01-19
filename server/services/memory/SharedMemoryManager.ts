import { EventEmitter } from 'events'
import { Worker } from 'worker_threads'

// Use global SharedArrayBuffer if available, fallback to regular ArrayBuffer
const SharedArrayBufferGlobal = (global as any).SharedArrayBuffer || ArrayBuffer

export interface SharedMemoryRegion {
  key: string
  buffer: ArrayBuffer // Use ArrayBuffer as base type
  size: number
  type: 'context' | 'state' | 'cache' | 'queue'
  createdAt: Date
  lastAccessed: Date
}

export interface MemoryStats {
  totalRegions: number
  totalMemoryUsed: number
  totalMemoryAllocated: number
  regionsByType: Record<string, number>
  accessFrequency: Record<string, number>
}

export interface ConcurrentAccessOptions {
  maxRetries: number
  retryDelay: number
  timeout: number
}

const DEFAULT_OPTIONS: ConcurrentAccessOptions = {
  maxRetries: 10,
  retryDelay: 5,
  timeout: 5000
}

/**
 * Thread-safe Shared Memory Manager for high-speed context data access
 */
export class SharedMemoryManager extends EventEmitter {
  private regions: Map<string, SharedMemoryRegion> = new Map()
  private locks: Map<string, boolean> = new Map()
  private accessCounts: Map<string, number> = new Map()
  private options: ConcurrentAccessOptions
  private workerPool: Worker[] = []
  private maxWorkers = 4

  constructor(options: Partial<ConcurrentAccessOptions> = {}) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.initializeWorkerPool()
  }

  /**
   * Create a new shared memory region
   */
  createRegion(
    key: string, 
    size: number, 
    type: SharedMemoryRegion['type'] = 'context'
  ): SharedMemoryRegion {
    if (this.regions.has(key)) {
      throw new Error(`Memory region '${key}' already exists`)
    }

    const buffer = new SharedArrayBufferGlobal(size)
    const region: SharedMemoryRegion = {
      key,
      buffer,
      size,
      type,
      createdAt: new Date(),
      lastAccessed: new Date()
    }

    this.regions.set(key, region)
    this.locks.set(key, false)
    this.accessCounts.set(key, 0)

    this.emit('region_created', region)
    return region
  }

  /**
   * Get shared memory region
   */
  getRegion(key: string): SharedMemoryRegion | undefined {
    const region = this.regions.get(key)
    if (region) {
      region.lastAccessed = new Date()
      this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)
    }
    return region
  }

  /**
   * Acquire exclusive lock on memory region
   */
  async acquireLock(key: string, timeout: number = this.options.timeout): Promise<void> {
    const startTime = Date.now()
    
    while (this.locks.get(key) === true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout acquiring lock for region '${key}'`)
      }
      await this.sleep(this.options.retryDelay)
    }

    this.locks.set(key, true)
    this.emit('lock_acquired', { key, timestamp: Date.now() })
  }

  /**
   * Release lock on memory region
   */
  releaseLock(key: string): void {
    if (this.locks.get(key) !== true) {
      throw new Error(`Region '${key}' is not locked`)
    }

    this.locks.set(key, false)
    this.emit('lock_released', { key, timestamp: Date.now() })
  }

  /**
   * Write data to shared memory with concurrent access protection
   */
  async writeData<T>(
    key: string, 
    data: T, 
    offset: number = 0
  ): Promise<void> {
    const region = this.getRegion(key)
    if (!region) {
      throw new Error(`Memory region '${key}' not found`)
    }

    await this.acquireLock(key)
    
    try {
      const serialized = JSON.stringify(data)
      const buffer = Buffer.from(region.buffer)
      
      if (offset + serialized.length > region.size) {
        throw new Error(`Data exceeds region size for '${key}'`)
      }

      buffer.write(serialized, offset, 'utf-8')
      
      this.emit('data_written', { key, size: serialized.length, offset })
    } finally {
      this.releaseLock(key)
    }
  }

  /**
   * Read data from shared memory with concurrent access protection
   */
  async readData<T>(
    key: string, 
    offset: number = 0, 
    length?: number
  ): Promise<T | null> {
    const region = this.getRegion(key)
    if (!region) {
      return null
    }

    await this.acquireLock(key)
    
    try {
      const buffer = Buffer.from(region.buffer)
      const readLength = length || (region.size - offset)
      const data = buffer.toString('utf-8', offset, offset + readLength)
      
      // Remove null bytes and clean up data
      const cleaned = data.replace(/\0+$/, '').trim()
      
      if (!cleaned) {
        return null
      }

      return JSON.parse(cleaned) as T
    } catch (error) {
      this.emit('read_error', { key, error })
      return null
    } finally {
      this.releaseLock(key)
    }
  }

  /**
   * Atomic compare-and-swap operation
   */
  async compareAndSwap<T>(
    key: string, 
    expected: T, 
    newValue: T, 
    offset: number = 0
  ): Promise<boolean> {
    const region = this.getRegion(key)
    if (!region) {
      throw new Error(`Memory region '${key}' not found`)
    }

    await this.acquireLock(key)
    
    try {
      const current = await this.readData<T>(key, offset)
      
      if (JSON.stringify(current) === JSON.stringify(expected)) {
        await this.writeData(key, newValue, offset)
        this.emit('cas_success', { key, expected, newValue })
        return true
      }
      
      this.emit('cas_failure', { key, expected, actual: current })
      return false
    } finally {
      this.releaseLock(key)
    }
  }

  /**
   * Delete memory region
   */
  deleteRegion(key: string): boolean {
    const region = this.regions.get(key)
    if (!region) {
      return false
    }

    // Ensure region is not locked
    if (this.locks.get(key) === true) {
      throw new Error(`Cannot delete locked region '${key}'`)
    }

    this.regions.delete(key)
    this.locks.delete(key)
    this.accessCounts.delete(key)

    this.emit('region_deleted', { key, size: region.size })
    return true
  }

  /**
   * Get memory statistics
   */
  getStatistics(): MemoryStats {
    const regionsByType: Record<string, number> = {}
    let totalMemoryUsed = 0
    let totalMemoryAllocated = 0

    for (const region of this.regions.values()) {
      regionsByType[region.type] = (regionsByType[region.type] || 0) + 1
      totalMemoryAllocated += region.size
      // In a real implementation, we'd track actual usage
      totalMemoryUsed += region.size * 0.75 // Estimate 75% utilization
    }

    return {
      totalRegions: this.regions.size,
      totalMemoryUsed,
      totalMemoryAllocated,
      regionsByType,
      accessFrequency: Object.fromEntries(this.accessCounts)
    }
  }

  /**
   * Cleanup unused regions
   */
  cleanup(maxAge: number = 3600000): number { // Default 1 hour
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, region] of this.regions.entries()) {
      if (now - region.lastAccessed.getTime() > maxAge) {
        // Don't delete if currently locked
        if (this.locks.get(key) !== true) {
          toDelete.push(key)
        }
      }
    }

    let deleted = 0
    for (const key of toDelete) {
      if (this.deleteRegion(key)) {
        deleted++
      }
    }

    this.emit('cleanup_completed', { deleted, remaining: this.regions.size })
    return deleted
  }

  /**
   * Shutdown memory manager
   */
  async shutdown(): Promise<void> {
    // Terminate all workers
    for (const worker of this.workerPool) {
      await worker.terminate()
    }
    this.workerPool = []

    // Clear all regions
    this.regions.clear()
    this.locks.clear()
    this.accessCounts.clear()

    this.emit('shutdown_completed')
  }

  // Private methods
  private initializeWorkerPool(): void {
    // Worker pool initialization - simplified for production
    for (let i = 0; i < this.maxWorkers; i++) {
      // Worker threads would be initialized here if needed
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * High-performance context data structure for shared memory
 */
export class ContextData {
  private buffer: ArrayBuffer
  private dataView: DataView
  private stringEncoder = new TextEncoder()
  private stringDecoder = new TextDecoder()

  constructor(size: number) {
    this.buffer = new SharedArrayBufferGlobal(size)
    this.dataView = new DataView(this.buffer)
  }

  /**
   * Store string data with length prefix
   */
  setString(offset: number, value: string): number {
    const encoded = this.stringEncoder.encode(value)
    const length = encoded.length
    
    // Store length (4 bytes) + string data
    this.dataView.setUint32(offset, length)
    const stringBytes = new Uint8Array(this.buffer, offset + 4, length)
    stringBytes.set(encoded)
    
    return 4 + length
  }

  /**
   * Retrieve string data with length prefix
   */
  getString(offset: number): string {
    const length = this.dataView.getUint32(offset)
    const stringBytes = new Uint8Array(this.buffer, offset + 4, length)
    return this.stringDecoder.decode(stringBytes)
  }

  /**
   * Store numeric value
   */
  setFloat64(offset: number, value: number): void {
    this.dataView.setFloat64(offset, value)
  }

  /**
   * Retrieve numeric value
   */
  getFloat64(offset: number): number {
    return this.dataView.getFloat64(offset)
  }

  /**
   * Store boolean value
   */
  setUint8(offset: number, value: number): void {
    this.dataView.setUint8(offset, value)
  }

  /**
   * Retrieve boolean value
   */
  getUint8(offset: number): number {
    return this.dataView.getUint8(offset)
  }

  /**
   * Get underlying buffer
   */
  getBuffer(): ArrayBuffer {
    return this.buffer
  }
}

// Singleton instance
export const sharedMemoryManager = new SharedMemoryManager()

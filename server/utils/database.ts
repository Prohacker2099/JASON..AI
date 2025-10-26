import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { dbQueryTracker } from '../middleware/performance';
import { resilienceManager } from './resilience';

// Enhanced database connection with pooling and monitoring
export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private connectionPool: ConnectionPool;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ],
      errorFormat: 'pretty'
    });

    this.connectionPool = new ConnectionPool({
      maxConnections: 10,
      idleTimeout: 30000,
      connectionTimeout: 5000
    });

    this.setupEventListeners();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventListeners(): void {
    this.prisma.$on('query', (e) => {
      logger.debug('Database query executed', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        target: e.target
      });

      // Log slow queries
      if (e.duration > 1000) {
        logger.warn('Slow query detected', {
          query: e.query,
          duration: `${e.duration}ms`
        });
      }
    });

    this.prisma.$on('error', (e) => {
      logger.error('Database error', e);
    });

    this.prisma.$on('info', (e) => {
      logger.info('Database info', { message: e.message, target: e.target });
    });

    this.prisma.$on('warn', (e) => {
      logger.warn('Database warning', { message: e.message, target: e.target });
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      logger.error('Database connection failed', error);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
        logger.info(`Retrying database connection in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => this.connect(), delay);
      } else {
        throw new Error('Max database reconnection attempts reached');
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database', error);
    }
  }

  // Enhanced query execution with monitoring and resilience
  async executeQuery<T>(
    queryName: string,
    operation: (prisma: PrismaClient) => Promise<T>,
    options: {
      useCircuitBreaker?: boolean;
      retryOnFailure?: boolean;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const trackerId = dbQueryTracker.start(queryName);

    try {
      const result = await resilienceManager.executeWithResilience(
        `db_${queryName}`,
        () => operation(this.prisma),
        {
          useCircuitBreaker: options.useCircuitBreaker ?? true,
          useBulkhead: true,
          bulkheadLimit: 5,
          timeout: options.timeout ?? 10000,
          retryOptions: options.retryOnFailure ? {
            maxAttempts: 3,
            baseDelay: 1000,
            retryCondition: (error) => {
              // Retry on connection errors but not on constraint violations
              return !error.message.includes('Unique constraint') &&
                     !error.message.includes('Foreign key constraint');
            }
          } : undefined
        }
      );

      dbQueryTracker.end(trackerId, queryName);
      return result;
    } catch (error) {
      dbQueryTracker.end(trackerId, queryName);
      throw error;
    }
  }

  // Optimized batch operations
  async batchInsert<T>(
    tableName: string,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    if (data.length === 0) return;

    const batches = this.chunkArray(data, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      await this.executeQuery(
        `batch_insert_${tableName}`,
        async (prisma) => {
          // @ts-ignore - Dynamic table access
          return prisma[tableName].createMany({
            data: batch,
            skipDuplicates: true
          });
        },
        { retryOnFailure: true }
      );
      
      logger.debug(`Batch ${i + 1}/${batches.length} inserted for ${tableName}`, {
        batchSize: batch.length,
        totalRecords: data.length
      });
    }
  }

  // Transaction wrapper with automatic rollback
  async transaction<T>(
    operations: (prisma: PrismaClient) => Promise<T>,
    options: { timeout?: number } = {}
  ): Promise<T> {
    return this.executeQuery(
      'transaction',
      async (prisma) => {
        return prisma.$transaction(operations, {
          timeout: options.timeout ?? 30000,
          maxWait: 5000
        });
      },
      { retryOnFailure: false, timeout: options.timeout }
    );
  }

  // Health check for database connectivity
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const result = await this.executeQuery(
        'health_check',
        async (prisma) => {
          return prisma.$queryRaw`SELECT 1 as health_check`;
        },
        { timeout: 5000, retryOnFailure: false }
      );

      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          result,
          connectionPool: this.connectionPool.getStats()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  // Database statistics and monitoring
  async getStats(): Promise<any> {
    try {
      const stats = await this.executeQuery(
        'get_stats',
        async (prisma) => {
          const [
            deviceCount,
            energyReadingCount,
            sceneCount,
            automationCount
          ] = await Promise.all([
            prisma.device.count(),
            prisma.energyReading.count(),
            prisma.scene.count(),
            prisma.automation.count()
          ]);

          return {
            devices: deviceCount,
            energyReadings: energyReadingCount,
            scenes: sceneCount,
            automations: automationCount
          };
        }
      );

      return {
        tables: stats,
        connectionPool: this.connectionPool.getStats(),
        isConnected: this.isConnected
      };
    } catch (error) {
      logger.error('Failed to get database stats', error);
      return { error: 'Failed to retrieve stats' };
    }
  }

  // Cleanup old records
  async cleanup(options: {
    energyReadingsOlderThanDays?: number;
    logsOlderThanDays?: number;
  } = {}): Promise<void> {
    const {
      energyReadingsOlderThanDays = 30,
      logsOlderThanDays = 7
    } = options;

    await this.transaction(async (prisma) => {
      const energyCutoff = new Date();
      energyCutoff.setDate(energyCutoff.getDate() - energyReadingsOlderThanDays);

      const logsCutoff = new Date();
      logsCutoff.setDate(logsCutoff.getDate() - logsOlderThanDays);

      const [energyDeleted, logsDeleted] = await Promise.all([
        prisma.energyReading.deleteMany({
          where: {
            timestamp: {
              lt: energyCutoff
            }
          }
        }),
        // Assuming we have a logs table
        prisma.$executeRaw`DELETE FROM logs WHERE created_at < ${logsCutoff}`
      ]);

      logger.info('Database cleanup completed', {
        energyReadingsDeleted: energyDeleted.count,
        logsDeleted
      });
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }
}

// Connection pool management
class ConnectionPool {
  private connections: Connection[] = [];
  private readonly maxConnections: number;
  private readonly idleTimeout: number;
  private readonly connectionTimeout: number;
  private activeConnections = 0;

  constructor(options: {
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
  }) {
    this.maxConnections = options.maxConnections;
    this.idleTimeout = options.idleTimeout;
    this.connectionTimeout = options.connectionTimeout;
  }

  async acquire(): Promise<Connection> {
    // Find available connection
    const available = this.connections.find(conn => !conn.inUse && !conn.isExpired());
    
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available;
    }

    // Create new connection if under limit
    if (this.activeConnections < this.maxConnections) {
      const connection = new Connection(this.idleTimeout);
      this.connections.push(connection);
      this.activeConnections++;
      connection.inUse = true;
      return connection;
    }

    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection pool timeout'));
      }, this.connectionTimeout);

      const checkForConnection = () => {
        const available = this.connections.find(conn => !conn.inUse && !conn.isExpired());
        if (available) {
          clearTimeout(timeout);
          available.inUse = true;
          available.lastUsed = Date.now();
          resolve(available);
        } else {
          setTimeout(checkForConnection, 10);
        }
      };

      checkForConnection();
    });
  }

  release(connection: Connection): void {
    connection.inUse = false;
    connection.lastUsed = Date.now();
  }

  cleanup(): void {
    const now = Date.now();
    this.connections = this.connections.filter(conn => {
      if (conn.isExpired() && !conn.inUse) {
        this.activeConnections--;
        return false;
      }
      return true;
    });
  }

  getStats(): {
    total: number;
    active: number;
    idle: number;
    maxConnections: number;
  } {
    const active = this.connections.filter(conn => conn.inUse).length;
    const idle = this.connections.filter(conn => !conn.inUse).length;

    return {
      total: this.connections.length,
      active,
      idle,
      maxConnections: this.maxConnections
    };
  }
}

class Connection {
  public inUse = false;
  public lastUsed = Date.now();
  public createdAt = Date.now();

  constructor(private readonly idleTimeout: number) {}

  isExpired(): boolean {
    return Date.now() - this.lastUsed > this.idleTimeout;
  }
}

// Repository pattern for common database operations
export abstract class BaseRepository<T> {
  protected db: DatabaseManager;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = DatabaseManager.getInstance();
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    return this.db.executeQuery(
      `${this.tableName}_findById`,
      async (prisma) => {
        // @ts-ignore - Dynamic table access
        return prisma[this.tableName].findUnique({
          where: { id }
        });
      }
    );
  }

  async findMany(where: any = {}, options: {
    skip?: number;
    take?: number;
    orderBy?: any;
  } = {}): Promise<T[]> {
    return this.db.executeQuery(
      `${this.tableName}_findMany`,
      async (prisma) => {
        // @ts-ignore - Dynamic table access
        return prisma[this.tableName].findMany({
          where,
          ...options
        });
      }
    );
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.db.executeQuery(
      `${this.tableName}_create`,
      async (prisma) => {
        // @ts-ignore - Dynamic table access
        return prisma[this.tableName].create({
          data
        });
      }
    );
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.db.executeQuery(
      `${this.tableName}_update`,
      async (prisma) => {
        // @ts-ignore - Dynamic table access
        return prisma[this.tableName].update({
          where: { id },
          data
        });
      }
    );
  }

  async delete(id: string): Promise<T> {
    return this.db.executeQuery(
      `${this.tableName}_delete`,
      async (prisma) => {
        // @ts-ignore - Dynamic table access
        return prisma[this.tableName].delete({
          where: { id }
        });
      }
    );
  }

  async count(where: any = {}): Promise<number> {
    return this.db.executeQuery(
      `${this.tableName}_count`,
      async (prisma) => {
        // @ts-ignore - Dynamic table access
        return prisma[this.tableName].count({ where });
      }
    );
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Setup database health check
resilienceManager.healthChecker.addCheck('database', {
  execute: async () => {
    const health = await databaseManager.healthCheck();
    if (health.status === 'unhealthy') {
      throw new Error(`Database unhealthy: ${JSON.stringify(health.details)}`);
    }
    return { message: 'Database connection healthy', details: health.details };
  },
  timeout: 10000
});

// Setup graceful shutdown
resilienceManager.gracefulShutdown.addHandler(async () => {
  logger.info('Closing database connections...');
  await databaseManager.disconnect();
});

export default databaseManager;

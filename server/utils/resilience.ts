import { EventEmitter } from 'events';
import { logger } from './logger';

// Circuit breaker pattern for external service calls
export class CircuitBreaker extends EventEmitter {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly resetTimeout: number = 30000 // 30 seconds
  ) {
    super();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker reset to CLOSED');
      this.emit('reset');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker opened', { failures: this.failures });
      this.emit('open');
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = () => true
    } = options;

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error;
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        
        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          attempt,
          maxAttempts,
          error: error instanceof Error ? error.message : String(error)
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Bulkhead pattern for resource isolation
export class Bulkhead {
  private readonly semaphores = new Map<string, Semaphore>();
  
  constructor(private readonly defaultLimit: number = 10) {}
  
  async execute<T>(
    resourceName: string,
    operation: () => Promise<T>,
    limit?: number
  ): Promise<T> {
    const actualLimit = limit || this.defaultLimit;
    
    if (!this.semaphores.has(resourceName)) {
      this.semaphores.set(resourceName, new Semaphore(actualLimit));
    }
    
    const semaphore = this.semaphores.get(resourceName)!;
    
    await semaphore.acquire();
    try {
      return await operation();
    } finally {
      semaphore.release();
    }
  }
  
  getResourceUsage(resourceName: string): { used: number; limit: number } {
    const semaphore = this.semaphores.get(resourceName);
    if (!semaphore) {
      return { used: 0, limit: this.defaultLimit };
    }
    
    return {
      used: semaphore.getUsed(),
      limit: semaphore.getLimit()
    };
  }
}

// Semaphore for controlling concurrent access
class Semaphore {
  private permits: number;
  private readonly maxPermits: number;
  private readonly waitQueue: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
    this.maxPermits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
  
  getUsed(): number {
    return this.maxPermits - this.permits;
  }
  
  getLimit(): number {
    return this.maxPermits;
  }
}

// Timeout wrapper for operations
export class TimeoutManager {
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      })
    ]);
  }
}

// Health check system
export class HealthChecker extends EventEmitter {
  private readonly checks = new Map<string, HealthCheck>();
  private readonly results = new Map<string, HealthCheckResult>();
  private intervalId?: NodeJS.Timeout;
  
  constructor(private readonly checkInterval: number = 30000) {
    super();
  }
  
  addCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }
  
  removeCheck(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
  }
  
  start(): void {
    if (this.intervalId) {
      return;
    }
    
    this.intervalId = setInterval(() => {
      this.runAllChecks();
    }, this.checkInterval);
    
    // Run initial check
    this.runAllChecks();
    logger.info('Health checker started');
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('Health checker stopped');
    }
  }
  
  private async runAllChecks(): Promise<void> {
    const promises = Array.from(this.checks.entries()).map(async ([name, check]) => {
      try {
        const startTime = Date.now();
        const result = await TimeoutManager.withTimeout(
          () => check.execute(),
          check.timeout || 5000
        );
        
        const checkResult: HealthCheckResult = {
          name,
          status: 'healthy',
          message: result.message || 'OK',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          details: result.details
        };
        
        this.results.set(name, checkResult);
        this.emit('checkComplete', checkResult);
        
      } catch (error) {
        const checkResult: HealthCheckResult = {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          duration: Date.now(),
          timestamp: new Date(),
          error: error instanceof Error ? error : new Error(String(error))
        };
        
        this.results.set(name, checkResult);
        this.emit('checkFailed', checkResult);
        logger.warn(`Health check failed: ${name}`, { error: checkResult.message });
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  getResults(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }
  
  getOverallHealth(): { status: 'healthy' | 'degraded' | 'unhealthy'; checks: HealthCheckResult[] } {
    const results = this.getResults();
    const unhealthy = results.filter(r => r.status === 'unhealthy');
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthy.length > 0) {
      status = unhealthy.length === results.length ? 'unhealthy' : 'degraded';
    }
    
    return { status, checks: results };
  }
}

export interface HealthCheck {
  execute(): Promise<{ message?: string; details?: any }>;
  timeout?: number;
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy';
  message: string;
  duration: number;
  timestamp: Date;
  details?: any;
  error?: Error;
}

// Graceful shutdown manager
export class GracefulShutdown {
  private readonly shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown = false;
  
  constructor(private readonly timeout: number = 30000) {
    this.setupSignalHandlers();
  }
  
  addHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }
  
  private setupSignalHandlers(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        if (!this.isShuttingDown) {
          this.shutdown(signal);
        }
      });
    });
  }
  
  private async shutdown(signal: string): Promise<void> {
    this.isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    const shutdownPromise = this.executeShutdownHandlers();
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Shutdown timeout')), this.timeout);
    });
    
    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Shutdown failed or timed out', error);
      process.exit(1);
    }
  }
  
  private async executeShutdownHandlers(): Promise<void> {
    const promises = this.shutdownHandlers.map(async (handler, index) => {
      try {
        await handler();
        logger.debug(`Shutdown handler ${index} completed`);
      } catch (error) {
        logger.error(`Shutdown handler ${index} failed`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }
}

// Resilience manager combining all patterns
export class ResilienceManager {
  private static instance: ResilienceManager;
  
  public readonly circuitBreakers = new Map<string, CircuitBreaker>();
  public readonly bulkhead = new Bulkhead();
  public readonly healthChecker = new HealthChecker();
  public readonly gracefulShutdown = new GracefulShutdown();
  
  private constructor() {
    this.setupDefaultHealthChecks();
  }
  
  static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }
  
  getCircuitBreaker(name: string, options?: { threshold?: number; timeout?: number }): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const breaker = new CircuitBreaker(options?.threshold, options?.timeout);
      this.circuitBreakers.set(name, breaker);
    }
    return this.circuitBreakers.get(name)!;
  }
  
  async executeWithResilience<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      useCircuitBreaker?: boolean;
      useBulkhead?: boolean;
      bulkheadLimit?: number;
      retryOptions?: Parameters<typeof RetryManager.withRetry>[1];
      timeout?: number;
    } = {}
  ): Promise<T> {
    let wrappedOperation = operation;
    
    // Apply timeout
    if (options.timeout) {
      const originalOperation = wrappedOperation;
      wrappedOperation = () => TimeoutManager.withTimeout(
        originalOperation,
        options.timeout!,
        `${operationName} timed out`
      );
    }
    
    // Apply bulkhead
    if (options.useBulkhead) {
      const originalOperation = wrappedOperation;
      wrappedOperation = () => this.bulkhead.execute(
        operationName,
        originalOperation,
        options.bulkheadLimit
      );
    }
    
    // Apply circuit breaker
    if (options.useCircuitBreaker) {
      const breaker = this.getCircuitBreaker(operationName);
      const originalOperation = wrappedOperation;
      wrappedOperation = () => breaker.execute(originalOperation);
    }
    
    // Apply retry logic
    if (options.retryOptions) {
      return RetryManager.withRetry(wrappedOperation, options.retryOptions);
    }
    
    return wrappedOperation();
  }
  
  private setupDefaultHealthChecks(): void {
    // Database health check
    this.healthChecker.addCheck('database', {
      execute: async () => {
        // This would check database connectivity
        return { message: 'Database connection OK' };
      },
      timeout: 5000
    });
    
    // Memory health check
    this.healthChecker.addCheck('memory', {
      execute: async () => {
        const usage = process.memoryUsage();
        const heapUsedMB = usage.heapUsed / 1024 / 1024;
        const heapTotalMB = usage.heapTotal / 1024 / 1024;
        const usagePercent = (heapUsedMB / heapTotalMB) * 100;
        
        if (usagePercent > 90) {
          throw new Error(`High memory usage: ${usagePercent.toFixed(1)}%`);
        }
        
        return {
          message: `Memory usage: ${usagePercent.toFixed(1)}%`,
          details: { heapUsedMB, heapTotalMB, usagePercent }
        };
      }
    });
  }
  
  start(): void {
    this.healthChecker.start();
    logger.info('Resilience manager started');
  }
  
  stop(): void {
    this.healthChecker.stop();
    logger.info('Resilience manager stopped');
  }
}

export const resilienceManager = ResilienceManager.getInstance();

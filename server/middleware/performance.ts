import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import os from 'os';
import { performance } from 'perf_hooks';

type NextFunction = (err?: any) => void;

// Performance monitoring middleware
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private systemMetrics: any = {};
  private monitoringInterval?: NodeJS.Timeout;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    // Monitor system metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    logger.info('Performance monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    logger.info('Performance monitoring stopped');
  }

  private collectSystemMetrics(): void {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    
    this.systemMetrics = {
      cpu: {
        user: cpuUsage.user / 1000000, // Convert to seconds
        system: cpuUsage.system / 1000000
      },
      memory: {
        rss: memUsage.rss / 1024 / 1024, // Convert to MB
        heapUsed: memUsage.heapUsed / 1024 / 1024,
        heapTotal: memUsage.heapTotal / 1024 / 1024,
        external: memUsage.external / 1024 / 1024
      },
      system: {
        loadAvg: os.loadavg(),
        freeMem: os.freemem() / 1024 / 1024 / 1024, // Convert to GB
        totalMem: os.totalmem() / 1024 / 1024 / 1024,
        uptime: os.uptime()
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid
      }
    };

    logger.health.systemMetrics(
      this.systemMetrics.cpu.user + this.systemMetrics.cpu.system,
      this.systemMetrics.memory.heapUsed,
      (this.systemMetrics.system.totalMem - this.systemMetrics.system.freeMem) / this.systemMetrics.system.totalMem * 100
    );
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetricStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  getSystemMetrics(): any {
    return this.systemMetrics;
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = this.getMetricStats(name);
    }
    
    return {
      performance: result,
      system: this.systemMetrics
    };
  }
}

// Request timing middleware
export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const monitor = PerformanceMonitor.getInstance();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const route = `${req.method} ${req.route?.path || req.path}`;
    
    monitor.recordMetric(`request_duration_${route}`, duration);
    monitor.recordMetric('request_duration_total', duration);
    
    // Log slow requests
    if (duration > 1000) { // > 1 second
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};

// Memory usage tracking
export const memoryTracker = (req: Request, res: Response, next: NextFunction) => {
  const monitor = PerformanceMonitor.getInstance();
  const memBefore = process.memoryUsage();
  
  res.on('finish', () => {
    const memAfter = process.memoryUsage();
    const heapDiff = memAfter.heapUsed - memBefore.heapUsed;
    
    monitor.recordMetric('memory_heap_diff', heapDiff / 1024 / 1024); // MB
    
    // Log memory leaks
    if (heapDiff > 50 * 1024 * 1024) { // > 50MB increase
      logger.warn('Potential memory leak detected', {
        method: req.method,
        path: req.path,
        heapIncrease: `${(heapDiff / 1024 / 1024).toFixed(2)}MB`
      });
    }
  });
  
  next();
};

// Database query performance tracking
export const dbQueryTracker = {
  start: (queryName: string): string => {
    const id = `${queryName}_${Date.now()}_${Math.random()}`;
    logger.performance.startTimer(id);
    return id;
  },
  
  end: (id: string, queryName: string): void => {
    const duration = logger.performance.endTimer(id);
    const monitor = PerformanceMonitor.getInstance();
    
    monitor.recordMetric(`db_query_${queryName}`, duration);
    monitor.recordMetric('db_query_total', duration);
    
    // Log slow queries
    if (duration > 500) { // > 500ms
      logger.warn('Slow database query', {
        query: queryName,
        duration: `${duration}ms`
      });
    }
  }
};

// Cache performance tracking
export const cacheTracker = {
  hit: (cacheName: string): void => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.recordMetric(`cache_hit_${cacheName}`, 1);
    monitor.recordMetric('cache_hit_total', 1);
  },
  
  miss: (cacheName: string): void => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.recordMetric(`cache_miss_${cacheName}`, 1);
    monitor.recordMetric('cache_miss_total', 1);
  },
  
  getHitRate: (cacheName: string): number => {
    const monitor = PerformanceMonitor.getInstance();
    const hits = monitor.getMetricStats(`cache_hit_${cacheName}`)?.count || 0;
    const misses = monitor.getMetricStats(`cache_miss_${cacheName}`)?.count || 0;
    const total = hits + misses;
    
    return total > 0 ? hits / total : 0;
  }
};

// API endpoint performance analyzer
export const endpointAnalyzer = {
  getSlowEndpoints: (threshold: number = 1000): Array<{ endpoint: string; avgDuration: number }> => {
    const monitor = PerformanceMonitor.getInstance();
    const metrics = monitor.getAllMetrics().performance;
    const slowEndpoints: Array<{ endpoint: string; avgDuration: number }> = [];
    
    for (const [metricName, stats] of Object.entries(metrics)) {
      if (metricName.startsWith('request_duration_') && metricName !== 'request_duration_total') {
        const endpoint = metricName.replace('request_duration_', '');
        if (stats && (stats as any).avg > threshold) {
          slowEndpoints.push({
            endpoint,
            avgDuration: (stats as any).avg
          });
        }
      }
    }
    
    return slowEndpoints.sort((a, b) => b.avgDuration - a.avgDuration);
  },
  
  getEndpointStats: (): Record<string, any> => {
    const monitor = PerformanceMonitor.getInstance();
    const metrics = monitor.getAllMetrics().performance;
    const endpointStats: Record<string, any> = {};
    
    for (const [metricName, stats] of Object.entries(metrics)) {
      if (metricName.startsWith('request_duration_') && metricName !== 'request_duration_total') {
        const endpoint = metricName.replace('request_duration_', '');
        endpointStats[endpoint] = stats;
      }
    }
    
    return endpointStats;
  }
};

// Health check with performance metrics
export const healthCheck = (req: Request, res: Response) => {
  const monitor = PerformanceMonitor.getInstance();
  const systemMetrics = monitor.getSystemMetrics();
  const performanceMetrics = monitor.getAllMetrics();
  
  // Determine health status
  const memoryUsagePercent = systemMetrics.memory?.heapUsed / systemMetrics.memory?.heapTotal * 100 || 0;
  const cpuUsage = (systemMetrics.cpu?.user + systemMetrics.cpu?.system) || 0;
  
  let status = 'healthy';
  const issues: string[] = [];
  
  if (memoryUsagePercent > 90) {
    status = 'degraded';
    issues.push('High memory usage');
  }
  
  if (cpuUsage > 80) {
    status = 'degraded';
    issues.push('High CPU usage');
  }
  
  const slowEndpoints = endpointAnalyzer.getSlowEndpoints(2000);
  if (slowEndpoints.length > 0) {
    status = 'degraded';
    issues.push('Slow API endpoints detected');
  }
  
  res.json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    issues,
    metrics: {
      system: systemMetrics,
      performance: {
        slowEndpoints: slowEndpoints.slice(0, 5), // Top 5 slowest
        totalRequests: performanceMetrics.performance?.request_duration_total?.count || 0,
        avgResponseTime: performanceMetrics.performance?.request_duration_total?.avg || 0
      }
    }
  });
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): void => {
  const monitor = PerformanceMonitor.getInstance();
  monitor.startMonitoring();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });
};

export default PerformanceMonitor;

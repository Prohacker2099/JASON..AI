import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Enhanced logging configuration with multiple transports and levels
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('Could not create logs directory:', error);
}

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'jason-ai' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ]
});

// Performance monitoring
class PerformanceLogger {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      winstonLogger.warn(`Timer '${label}' was not started`);
      return 0;
    }
    const duration = Date.now() - start;
    this.timers.delete(label);
    winstonLogger.debug(`Performance: ${label} took ${duration}ms`);
    return duration;
  }
}

// Enhanced logger with additional functionality
export const logger = {
  // Standard logging methods
  debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
  info: (message: string, meta?: any) => winstonLogger.info(message, meta),
  warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
  error: (message: string, error?: Error | any, meta?: any) => {
    if (error instanceof Error) {
      winstonLogger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      winstonLogger.error(message, { error, ...meta });
    }
  },

  // Performance logging
  performance: PerformanceLogger,

  // Structured logging for specific domains
  device: {
    discovered: (deviceId: string, type: string, protocol: string) => 
      winstonLogger.info('Device discovered', { deviceId, type, protocol, domain: 'device' }),
    connected: (deviceId: string) => 
      winstonLogger.info('Device connected', { deviceId, domain: 'device' }),
    disconnected: (deviceId: string, reason?: string) => 
      winstonLogger.warn('Device disconnected', { deviceId, reason, domain: 'device' }),
    commandSent: (deviceId: string, command: string, success: boolean) => 
      winstonLogger.info('Device command', { deviceId, command, success, domain: 'device' })
  },

  energy: {
    reading: (deviceId: string, power: number, voltage: number, current: number) => 
      winstonLogger.debug('Energy reading', { deviceId, power, voltage, current, domain: 'energy' }),
    optimization: (action: string, deviceId: string, savings: number) => 
      winstonLogger.info('Energy optimization', { action, deviceId, savings, domain: 'energy' }),
    gridEvent: (event: string, severity: 'info' | 'warn' | 'error', data: any) => 
      winstonLogger[severity]('Grid event', { event, data, domain: 'grid' })
  },

  security: {
    authAttempt: (userId: string, success: boolean, ip: string) => 
      winstonLogger.info('Authentication attempt', { userId, success, ip, domain: 'security' }),
    accessDenied: (resource: string, userId: string, reason: string) => 
      winstonLogger.warn('Access denied', { resource, userId, reason, domain: 'security' }),
    suspiciousActivity: (activity: string, details: any) => 
      winstonLogger.error('Suspicious activity', { activity, details, domain: 'security' })
  },

  api: {
    request: (method: string, path: string, statusCode: number, duration: number, userId?: string) => 
      winstonLogger.info('API request', { method, path, statusCode, duration, userId, domain: 'api' }),
    error: (method: string, path: string, error: Error, userId?: string) => 
      winstonLogger.error('API error', { method, path, error: error.message, stack: error.stack, userId, domain: 'api' })
  },

  // Health monitoring
  health: {
    systemMetrics: (cpu: number, memory: number, disk: number) => 
      winstonLogger.debug('System metrics', { cpu, memory, disk, domain: 'health' }),
    serviceStatus: (service: string, status: 'up' | 'down' | 'degraded', details?: any) => 
      winstonLogger.info('Service status', { service, status, details, domain: 'health' })
  },

  // Create child logger with additional context
  child: (context: Record<string, any>) => {
    return winstonLogger.child(context);
  }
};

export default logger;

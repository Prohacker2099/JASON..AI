import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult, param, query } from 'express-validator';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.security.suspiciousActivity('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      res.status(429).json({ error: message });
    }
  });
};

// General API rate limiting
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limiting for authentication endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later'
);

// Device control rate limiting
export const deviceControlRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  30, // limit each IP to 30 device commands per minute
  'Too many device control requests, please slow down'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation schemas
export const deviceValidation = {
  deviceId: param('deviceId')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid device ID format'),
  
  command: body('action')
    .isIn(['toggle', 'setBrightness', 'setColor', 'setTemperature', 'setSetpoint'])
    .withMessage('Invalid command action'),
  
  brightness: body('params.brightness')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Brightness must be between 0 and 100'),
  
  temperature: body('params.temperature')
    .optional()
    .isFloat({ min: -50, max: 100 })
    .withMessage('Temperature must be between -50 and 100 degrees'),
  
  color: body('params.color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code')
};

export const energyValidation = {
  hours: query('hours')
    .optional()
    .isInt({ min: 1, max: 8760 }) // max 1 year
    .withMessage('Hours must be between 1 and 8760'),
  
  days: query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  
  startDate: body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  endDate: body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.security.accessDenied('Validation failed', req.ip || 'unknown', 
      `Invalid input: ${errors.array().map(e => e.msg).join(', ')}`);
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// API key authentication middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey as string;
  
  if (!apiKey) {
    logger.security.accessDenied('Missing API key', req.ip || 'unknown', req.path);
    return res.status(401).json({ error: 'API key required' });
  }
  
  // In production, validate against database
  const validApiKey = process.env.JASON_API_KEY || 'jason-dev-key-12345';
  
  if (apiKey !== validApiKey) {
    logger.security.accessDenied('Invalid API key', req.ip || 'unknown', req.path);
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str: string): string => {
    return str.replace(/[<>\"'%;()&+]/g, '');
  };
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.security.accessDenied('CORS policy violation', 'unknown', `Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.api.request(
      req.method,
      req.path,
      res.statusCode,
      duration,
      req.header('X-User-ID')
    );
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.api.error(req.method, req.path, error, req.header('X-User-ID'));
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { details: error.message, stack: error.stack })
  });
};

// Security audit logging
export const auditLog = (action: string, resource: string, userId?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.security.authAttempt(
      userId || req.header('X-User-ID') || 'anonymous',
      res.statusCode < 400,
      req.ip || 'unknown'
    );
    next();
  };
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive data
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Verify data integrity
export const verifyIntegrity = (data: string, hash: string): boolean => {
  return hashData(data) === hash;
};

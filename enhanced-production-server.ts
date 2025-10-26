import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Enhanced middleware and utilities
import { logger } from './server/utils/logger';
import { databaseManager } from './server/utils/database';
import { cacheManager } from './server/utils/cache';
import { resilienceManager } from './server/utils/resilience';

// Security and performance middleware
import {
  securityHeaders,
  apiRateLimit,
  authRateLimit,
  deviceControlRateLimit,
  corsOptions,
  requestLogger,
  errorHandler,
  apiKeyAuth,
  sanitizeInput,
  handleValidationErrors
} from './server/middleware/security';

import {
  requestTiming,
  memoryTracker,
  healthCheck,
  initializePerformanceMonitoring
} from './server/middleware/performance';

// Enhanced services
import { RealEnergyMonitor } from './server/services/energy/RealEnergyMonitor';
import { RealDeviceController } from './server/services/energy/RealDeviceController';
import { PowerGridIntegration } from './server/services/energy/PowerGridIntegration';
import { EnergyCostCalculator } from './server/services/energy/EnergyCostCalculator';

// Routes
import energyRoutes from './server/routes/energy';

class EnhancedJasonServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number;
  
  // Enhanced services
  private realEnergyMonitor: RealEnergyMonitor;
  private realDeviceController: RealDeviceController;
  private powerGridIntegration: PowerGridIntegration;
  private energyCostCalculator: EnergyCostCalculator;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    // Initialize services
    this.realEnergyMonitor = new RealEnergyMonitor();
    this.realDeviceController = new RealDeviceController();
    this.powerGridIntegration = new PowerGridIntegration();
    this.energyCostCalculator = new EnergyCostCalculator();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(securityHeaders);
    
    // CORS
    this.app.use(cors(corsOptions));
    
    // Compression
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging and monitoring
    this.app.use(requestLogger);
    this.app.use(requestTiming);
    this.app.use(memoryTracker);
    
    // Input sanitization
    this.app.use(sanitizeInput);
    
    // Static files with caching
    this.app.use(express.static(path.join(__dirname, 'public'), {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', healthCheck);
    
    // API status endpoint
    this.app.get('/api/status', (req: Request, res: Response) => {
      res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: databaseManager.getPrisma() ? 'connected' : 'disconnected',
          cache: 'operational',
          energy: this.realEnergyMonitor ? 'operational' : 'unavailable',
          grid: this.powerGridIntegration ? 'operational' : 'unavailable'
        }
      });
    });

    // Performance metrics endpoint
    this.app.get('/api/metrics', apiKeyAuth, (req: Request, res: Response) => {
      const cacheStats = cacheManager.getAllStats();
      const dbStats = databaseManager.getStats();
      const healthStatus = resilienceManager.healthChecker.getOverallHealth();
      
      res.json({
        cache: cacheStats,
        database: dbStats,
        health: healthStatus,
        timestamp: new Date().toISOString()
      });
    });

    // Enhanced energy routes with rate limiting
    this.app.use('/api/energy', deviceControlRateLimit, energyRoutes);
    
    // Authentication routes with strict rate limiting
    this.app.use('/api/auth', authRateLimit);
    
    // General API rate limiting
    this.app.use('/api', apiRateLimit);

    // Real-time energy streaming endpoint
    this.app.get('/api/energy/stream', (req: Request, res: Response) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial connection confirmation
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Subscribe to energy updates
      const handleEnergyUpdate = (data: any) => {
        sendEvent({ type: 'energy_update', data });
      };

      const handleGridUpdate = (data: any) => {
        sendEvent({ type: 'grid_update', data });
      };

      this.realEnergyMonitor.on('reading', handleEnergyUpdate);
      this.powerGridIntegration.on('gridReading', handleGridUpdate);

      // Cleanup on client disconnect
      req.on('close', () => {
        this.realEnergyMonitor.off('reading', handleEnergyUpdate);
        this.powerGridIntegration.off('gridReading', handleGridUpdate);
      });
    });

    // Serve React app for all other routes
    this.app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  private setupWebSocket(): void {
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: corsOptions,
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      logger.info('WebSocket client connected', { socketId: socket.id });

      // Subscribe to real-time updates
      const handleEnergyUpdate = (data: any) => {
        socket.emit('energy_update', data);
      };

      const handleDeviceUpdate = (data: any) => {
        socket.emit('device_update', data);
      };

      const handleGridUpdate = (data: any) => {
        socket.emit('grid_update', data);
      };

      this.realEnergyMonitor.on('reading', handleEnergyUpdate);
      this.realEnergyMonitor.on('deviceUpdate', handleDeviceUpdate);
      this.powerGridIntegration.on('gridReading', handleGridUpdate);

      // Handle device control commands
      socket.on('device_command', async (data) => {
        try {
          const result = await this.realDeviceController.sendCommand(
            data.deviceId,
            data.action,
            data.params
          );
          socket.emit('command_result', { success: true, result });
        } catch (error) {
          socket.emit('command_result', { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      });

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        this.realEnergyMonitor.off('reading', handleEnergyUpdate);
        this.realEnergyMonitor.off('deviceUpdate', handleDeviceUpdate);
        this.powerGridIntegration.off('gridReading', handleGridUpdate);
        logger.info('WebSocket client disconnected', { socketId: socket.id });
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize performance monitoring
      initializePerformanceMonitoring();
      
      // Start resilience manager
      resilienceManager.start();
      
      // Connect to database
      await databaseManager.connect();
      
      // Warm up caches
      await cacheManager.warmCache();
      
      // Start energy monitoring services
      await this.realEnergyMonitor.startMonitoring();
      await this.powerGridIntegration.startMonitoring();
      
      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Enhanced JASON AI Server running on http://localhost:${this.port}`);
        logger.info('📊 Real-time energy monitoring active');
        logger.info('🔌 Physical device integration enabled');
        logger.info('⚡ Power grid monitoring operational');
        logger.info('🛡️  Security, caching, and resilience systems active');
        logger.info('📈 Performance monitoring and analytics enabled');
      });

    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    logger.info('Shutting down Enhanced JASON AI Server...');
    
    try {
      // Stop monitoring services
      await this.realEnergyMonitor.stopMonitoring();
      await this.powerGridIntegration.stopMonitoring();
      
      // Stop resilience manager
      resilienceManager.stop();
      
      // Close WebSocket connections
      this.io.close();
      
      // Close HTTP server
      if (this.server) {
        this.server.close();
      }
      
      // Disconnect from database
      await databaseManager.disconnect();
      
      logger.info('Server shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }
}

// Create and start server
const server = new EnhancedJasonServer();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

// Start the server
server.start().catch((error) => {
  logger.error('Failed to start Enhanced JASON AI Server', error);
  process.exit(1);
});

export default server;

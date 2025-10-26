import { Express, Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.js';
import { DeviceManager } from '../services/deviceManager.js';
import { RuleEngine } from '../rules/engine.js';

// Extended error interface for our API
interface ApiError extends Error {
  status?: number;
  details?: any;
}

export function initHTTP(
  app: Express,
  deviceManager: DeviceManager,
  ruleEngine: RuleEngine
): void {
  // Provide a safe logger that includes an http() method even when falling back to console
  const globalLogger = (global as any).logger as Partial<Logger> | undefined;
  const logger: Logger = {
    info: (globalLogger?.info ?? console.log).bind(globalLogger ?? console),
    error: (globalLogger?.error ?? console.error).bind(globalLogger ?? console),
    warn: (globalLogger?.warn ?? console.warn).bind(globalLogger ?? console),
    debug: (globalLogger?.debug ?? console.debug).bind(globalLogger ?? console),
    http: (globalLogger as any)?.http
      ? (globalLogger as any).http.bind(globalLogger)
      : console.log.bind(console),
  } as Logger;

  // Enhanced middleware for logging requests and errors
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(2, 9);
    
    // Log request start
    logger.http(`[${requestId}] ${req.method} ${req.path}`);
    
    // Log request body if present
    if (req.body && Object.keys(req.body).length > 0) {
      logger.http(`[${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
    }
    
    // Log response
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - start;
      logger.http(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      return originalSend.call(this, body);
    };
    
    // Error handling
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        logger.error(`[${requestId}] Error response: ${res.statusCode}`, {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          url: req.originalUrl,
          method: req.method,
          body: req.body
        });
      }
    });
    
    next();
  });
  
  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error in HTTP adapter:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
      success: false,
      error: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      requestId: req.headers['x-request-id']
    });
  });

  // API Routes
  const router = app;

  // Device endpoints with improved error handling
  router.get('/api/devices', async (req, res, next) => {
    try {
      console.log('[HTTP] GET /api/devices - Fetching all devices');
      
      // Ensure deviceManager is properly initialized
      if (!deviceManager) {
        throw new Error('DeviceManager is not initialized');
      }
      
      const devices = await deviceManager.getAllDevices();
      console.log(`[HTTP] Retrieved ${devices.length} devices`);
      
      // Validate the response data
      if (!Array.isArray(devices)) {
        console.error('[HTTP] Invalid devices data:', devices);
        throw new Error('Invalid devices data format');
      }
      
      // Ensure all devices have required fields
      const validatedDevices = devices.map(device => ({
        id: device.id,
        type: device.type,
        name: device.name,
        status: device.status,
        lastSeen: device.lastSeen,
        metadata: device.metadata || {},
        capabilities: Array.isArray(device.capabilities) ? device.capabilities : [],
        state: device.state || {}
      }));
      
      res.json({ 
        success: true, 
        data: validatedDevices 
      });
      
    } catch (error) {
      console.error('[HTTP] Error in GET /api/devices:', error);
      
      // Create a proper error object
      const apiError: ApiError = new Error('Failed to fetch devices');
      apiError.status = 500;
      apiError.details = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : String(error);
      
      // Pass to error handling middleware
      next(apiError);
    }
  });

  router.get('/api/devices/:id', async (req, res) => {
    try {
      const device = await deviceManager.getDeviceState(req.params.id);
      if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found' });
      }
      res.json({ success: true, data: device });
    } catch (error) {
      logger.error(`Error fetching device ${req.params.id}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch device' });
    }
  });

  router.post('/api/devices/:id/command', async (req, res) => {
    try {
      const { command, params = {} } = req.body;
      if (!command) {
        return res.status(400).json({ success: false, error: 'Command is required' });
      }

      const result = await deviceManager.executeCommand(
        req.params.id,
        command,
        params
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error(`Error executing command on device ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to execute command' 
      });
    }
  });

  // Rules endpoints
  router.get('/api/rules', async (req, res) => {
    try {
      const rules = await ruleEngine.getAllRules();
      res.json({ success: true, data: rules });
    } catch (error) {
      logger.error('Error fetching rules:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch rules' });
    }
  });

  router.post('/api/rules', async (req, res) => {
    try {
      const rule = await ruleEngine.addRule(req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
      logger.error('Error creating rule:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message || 'Failed to create rule' 
      });
    }
  });

  router.put('/api/rules/:id', async (req, res) => {
    try {
      const rule = await ruleEngine.updateRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ success: false, error: 'Rule not found' });
      }
      res.json({ success: true, data: rule });
    } catch (error: any) {
      logger.error(`Error updating rule ${req.params.id}:`, error);
      res.status(400).json({ 
        success: false, 
        error: error.message || 'Failed to update rule' 
      });
    }
  });

  router.delete('/api/rules/:id', async (req, res) => {
    try {
      const success = await ruleEngine.removeRule(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Rule not found' });
      }
      res.json({ success: true });
    } catch (error) {
      logger.error(`Error deleting rule ${req.params.id}:`, error);
      res.status(500).json({ success: false, error: 'Failed to delete rule' });
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`
    });
  });

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error('API error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  logger.info('HTTP adapter initialized');
}

export interface HTTPAdapter {
  // Add any HTTP adapter specific methods here
}

import { Server } from 'socket.io';
import { Logger } from '../utils/logger';

export interface DeviceManager {
  getDeviceState(deviceId: string): Promise<any>;
  getAllDevices(): Promise<Array<{ id: string; [key: string]: any }>>;
}

export interface RuleEngine {
  // Add rule engine methods as needed
}

export function initWebSocket(
  io: Server,
  deviceManager: DeviceManager,
  ruleEngine: RuleEngine
): void {
  const logger: Logger = (global as any).logger || console;
  
  // Store connected clients
  const clients = new Map<string, any>();

  io.on('connection', (socket) => {
    const clientId = socket.id;
    logger.info(`Client connected: ${clientId}`);
    
    // Add client to the map
    clients.set(clientId, {
      id: clientId,
      socket,
      authenticated: false
    });

    // Handle authentication
    socket.on('authenticate', async (token: string, callback) => {
      try {
        // TODO: Implement proper authentication
        const authenticated = await authenticateClient(token);
        clients.set(clientId, {
          ...clients.get(clientId),
          authenticated
        });
        
        if (authenticated) {
          logger.info(`Client authenticated: ${clientId}`);
          callback({ success: true });
          
          // Send initial device states
          const devices = await deviceManager.getAllDevices();
          socket.emit('devices:update', { devices });
        } else {
          callback({ success: false, error: 'Authentication failed' });
        }
      } catch (error) {
        logger.error('Authentication error:', error);
        callback({ success: false, error: 'Authentication error' });
      }
    });

    // Handle device control
    socket.on('device:control', async (data: { deviceId: string; command: string; payload: any }, callback) => {
      const client = clients.get(clientId);
      if (!client?.authenticated) {
        return callback({ success: false, error: 'Unauthorized' });
      }

      try {
        logger.info(`Device control request: ${data.deviceId} - ${data.command}`, data.payload);
        
        // TODO: Implement device control logic
        // For now, just broadcast the command
        io.emit('device:status', {
          deviceId: data.deviceId,
          status: 'pending',
          command: data.command
        });

        // Simulate device response
        setTimeout(() => {
          io.emit('device:status', {
            deviceId: data.deviceId,
            status: 'completed',
            command: data.command,
            result: { success: true }
          });
        }, 500);

        callback({ success: true });
      } catch (error) {
        logger.error('Device control error:', error);
        callback({ success: false, error: 'Device control error' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });
  });

  // Broadcast device updates to all connected clients
  async function broadcastDeviceUpdate(deviceId: string, data: any) {
    try {
      const deviceState = await deviceManager.getDeviceState(deviceId);
      io.emit('device:update', { deviceId, ...deviceState, ...data });
    } catch (error) {
      logger.error('Error broadcasting device update:', error);
    }
  }

  // Broadcast system events
  function broadcastSystemEvent(event: string, data: any) {
    io.emit('system:event', { event, data, timestamp: new Date().toISOString() });
  }

  // Return public API
  return {
    broadcastDeviceUpdate,
    broadcastSystemEvent
  };
}

// Mock authentication function
async function authenticateClient(token: string): Promise<boolean> {
  // TODO: Implement proper authentication
  return new Promise((resolve) => {
    // For development, accept any non-empty token
    setTimeout(() => resolve(!!token), 100);
  });
}

export type WebSocketAdapter = ReturnType<typeof initWebSocket>;

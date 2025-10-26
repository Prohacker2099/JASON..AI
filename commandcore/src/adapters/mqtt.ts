import mqtt, { MqttClient } from 'mqtt';
import { Logger } from '../utils/logger';

interface MQTTAdapterOptions {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId?: string;
}

export interface DeviceManager {
  handleDeviceUpdate(deviceId: string, data: any): Promise<void>;
  getDeviceState(deviceId: string): Promise<any>;
}

export interface RuleEngine {
  processEvent(deviceId: string, event: string, data: any): Promise<void>;
}

export async function initMQTT(
  deviceManager: DeviceManager,
  ruleEngine: RuleEngine,
  options?: Partial<MQTTAdapterOptions>
): Promise<MqttClient> {
  const logger: Logger = (global as any).logger || console;
  
  const config: MQTTAdapterOptions = {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `jason-commandcore-${Math.random().toString(16).substring(2, 10)}`,
    ...options
  };

  logger.info(`Connecting to MQTT broker at ${config.brokerUrl}`);

  const client = mqtt.connect(config.brokerUrl, {
    username: config.username,
    password: config.password,
    clientId: config.clientId,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10 * 1000,
    rejectUnauthorized: false // Only for development with self-signed certs
  });

  client.on('connect', () => {
    logger.info('Successfully connected to MQTT broker');
    
    // Subscribe to device topics
    client.subscribe('devices/+/status', (err) => {
      if (err) {
        logger.error('Failed to subscribe to device status updates:', err);
        return;
      }
      logger.info('Subscribed to device status updates');
    });

    client.subscribe('devices/+/events', (err) => {
      if (err) {
        logger.error('Failed to subscribe to device events:', err);
        return;
      }
      logger.info('Subscribed to device events');
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const messageType = topicParts[2];
      
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch (e) {
        logger.warn(`Failed to parse MQTT message on topic ${topic}:`, message.toString());
        return;
      }

      logger.debug(`Received MQTT message on ${topic}`, { deviceId, data });

      switch (messageType) {
        case 'status':
          await deviceManager.handleDeviceUpdate(deviceId, data);
          break;
        case 'events':
          await ruleEngine.processEvent(deviceId, data.event, data);
          break;
        default:
          logger.warn(`Unknown MQTT message type: ${messageType}`);
      }
    } catch (error) {
      logger.error('Error processing MQTT message:', error);
    }
  });

  client.on('error', (error) => {
    logger.error('MQTT error:', error);
  });

  client.on('offline', () => {
    logger.warn('MQTT client is offline');
  });

  client.on('reconnect', () => {
    logger.info('Attempting to reconnect to MQTT broker...');
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    client.end(true, () => {
      logger.info('MQTT client disconnected');
      process.exit(0);
    });
  });

  return client;
}

// Utility function to publish MQTT messages
export async function publishMessage(
  client: MqttClient,
  topic: string,
  message: any,
  options?: mqtt.IClientPublishOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    client.publish(topic, payload, options || {}, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

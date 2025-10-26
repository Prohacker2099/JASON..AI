import aedes from 'aedes';
import net from 'net';
import { createLogger, transports, format } from 'winston';

// Configure Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.simple()
    }),
    new transports.File({ filename: 'mqtt-broker.log' })
  ]
});

// Create Aedes broker
const broker = aedes();

// Create TCP server
const server = net.createServer(broker.handle);

const PORT = process.env.MQTT_PORT || 1883;
const HOST = process.env.MQTT_HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logger.info(`🚀 MQTT Broker running on ${HOST}:${PORT}`);
});

// Handle broker events
broker.on('client', (client) => {
  logger.info(`Client connected: ${client.id}`);
});

broker.on('publish', (packet, client) => {
  if (client) {
    logger.info(`Message published by ${client.id}: ${packet.topic}`);
  }
});

broker.on('subscribe', (subscriptions, client) => {
  logger.info(`Client ${client.id} subscribed to: ${subscriptions.map(s => s.topic).join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down MQTT broker...');
  server.close(() => {
    broker.close(() => {
      process.exit(0);
    });
  });
});

export default broker;

# JASON - Production Deployment Guide

This guide provides instructions for deploying JASON (The Omnipotent AI Architect) in a production environment.

## Prerequisites

- Node.js 16 or higher
- npm 7 or higher
- Git
- Docker and Docker Compose (optional, for containerized deployment)

## Deployment Options

### Option 1: Standard Deployment

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd JASON_TheOmnipotentAIArchitect
   ```

2. Run the production deployment script:

   ```bash
   ./deploy-production.sh
   ```

3. Copy the `dist` directory to your production server.

4. On the production server, install production dependencies:

   ```bash
   cd dist
   npm install --production
   ```

5. Start the application:

   ```bash
   npm start
   ```

   For production environments, it's recommended to use a process manager like PM2:

   ```bash
   npm install -g pm2
   pm2 start index.js --name "jason-app"
   ```

### Option 2: Docker Deployment

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd JASON_TheOmnipotentAIArchitect
   ```

2. Build and run using Docker Compose:

   ```bash
   docker-compose up -d
   ```

   This will start the following services:
   - JASON application (port 3000)
   - Redis (for caching and session management)
   - Prometheus (for metrics collection, port 9090)
   - Grafana (for monitoring dashboards, port 3001)

## Environment Configuration

The application uses environment variables for configuration. In production, these are loaded from the `.env` file in the `dist` directory.

Key environment variables:

- `PORT`: The port on which the server will listen (default: 3000)
- `NODE_ENV`: Should be set to "production"
- `DB_PATH`: Path to the SQLite database file
- `JWT_SECRET`: Secret for JWT token generation
- `SESSION_SECRET`: Secret for session management

See `.env.production` for a complete list of configuration options.

## Monitoring

The application includes built-in monitoring with Prometheus and Grafana when deployed using Docker Compose.

- Prometheus: http://your-server:9090
- Grafana: http://your-server:3001 (default credentials: admin / jason_grafana_secure_password_2024)

## Backup and Maintenance

### Database Backup

The SQLite database is stored in the `data` directory. Regular backups are recommended:

```bash
# Create a backup of the production database
cp /path/to/data/jason-production.db /path/to/backups/jason-production-$(date +%Y%m%d).db
```

### Log Management

Application logs are output to the console. In production, it's recommended to use a log management solution or configure your process manager to handle log rotation.

## Troubleshooting

### Common Issues

1. **Application fails to start**
   - Check the logs for error messages
   - Verify that all required environment variables are set
   - Ensure the database file exists and is writable

2. **Client cannot connect to server**
   - Verify that the server is running and listening on the expected port
   - Check firewall settings to ensure the port is accessible

3. **Authentication issues**
   - Verify that JWT_SECRET and SESSION_SECRET are properly set
   - Check that the database contains valid user records

For additional support, please refer to the project documentation or contact the development team.

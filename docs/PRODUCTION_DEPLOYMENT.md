# JASON Production Deployment Guide

This guide provides detailed instructions for deploying JASON in a production environment.

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Git
- PM2 (optional, for process management)
- NGINX (optional, for reverse proxy)

## Building for Production

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/JASON_TheOmnipotentAIArchitect.git
cd JASON_TheOmnipotentAIArchitect
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file to set your production configuration:

```
NODE_ENV=production
PORT=3000
# Add other environment variables as needed
```

### 4. Build the Application

Build both the server and client:

```bash
npm run build:all
```

This will:

- Compile TypeScript files for the server
- Create an optimized production build of the React client

## Deployment Options

### Option 1: Simple Deployment

Start the server directly:

```bash
npm start
```

### Option 2: Using the Deployment Script

```bash
./deploy-production.sh
```

### Option 3: Using PM2 (Recommended)

PM2 is a process manager for Node.js applications that helps keep your application running.

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start JASON with PM2:

```bash
pm2 start production-deploy.js
```

3. Set up PM2 to start on system boot:

```bash
pm2 startup
pm2 save
```

4. Monitor the application:

```bash
pm2 monit
```

5. View logs:

```bash
pm2 logs jason-server
```

## Using NGINX as a Reverse Proxy

For production environments, it's recommended to use NGINX as a reverse proxy.

1. Install NGINX:

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# macOS
brew install nginx
```

2. Create an NGINX configuration file:

```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the configuration and restart NGINX:

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/jason.conf /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# macOS
brew services restart nginx
```

## Setting Up SSL with Let's Encrypt

For secure HTTPS connections:

1. Install Certbot:

```bash
# Ubuntu/Debian
sudo apt-get install certbot python3-certbot-nginx

# macOS
brew install certbot
```

2. Obtain and install certificates:

```bash
sudo certbot --nginx -d your-domain.com
```

3. Set up auto-renewal:

```bash
sudo certbot renew --dry-run
```

## Monitoring and Maintenance

### Logs

- Application logs: `logs/output.log` and `logs/error.log`
- NGINX logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

### Backups

Regularly back up your database and configuration files:

```bash
# Example backup script
mkdir -p backups
cp .env backups/.env.$(date +%Y%m%d)
# Add database backup commands as needed
```

### Updates

To update JASON:

1. Pull the latest changes:

```bash
git pull
```

2. Install dependencies:

```bash
npm run install:all
```

3. Rebuild the application:

```bash
npm run build:all
```

4. Restart the server:

```bash
pm2 restart jason-server
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check logs: `pm2 logs jason-server`
   - Verify environment variables in `.env`
   - Ensure the port is not in use: `lsof -i :3000`

2. **Client not loading**
   - Verify the client build exists: `ls -la client/build`
   - Check for JavaScript errors in the browser console
   - Ensure NGINX configuration is correct

3. **Database connection issues**
   - Verify database credentials
   - Check database service is running
   - Ensure firewall allows database connections

For more help, refer to the project's issue tracker or contact support.

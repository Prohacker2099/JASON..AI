/**
 * JASON Production Deployment Configuration
 *
 * This file can be used with PM2 to manage the JASON application in production.
 * Usage: pm2 start production-deploy.js
 */

module.exports = {
  apps: [
    {
      name: "jason-server",
      script: "server/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/error.log",
      out_file: "logs/output.log",
      merge_logs: true,
      autorestart: true,
    },
  ],
};

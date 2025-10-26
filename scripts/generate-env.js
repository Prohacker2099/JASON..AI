const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureEnv() {
  const envConfig = {
    DATABASE_URL: 'postgresql://jason_admin:your_secure_password@localhost:5432/jason_ai_architect?schema=public',
    PORT: 3001,
    HOST: 'localhost',
    JWT_SECRET: crypto.randomBytes(64).toString('hex'),
    JWT_EXPIRATION: '24h',
    AI_MODEL_PATH: './models',
    PERFORMANCE_MONITORING: true,
    MQTT_BROKER_URL: 'mqtt://localhost:1883',
    LOG_LEVEL: 'info',
    LOG_FILE: './logs/jason-ai.log'
  };

  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? `'${value}'` : value}`)
    .join('\n');

  const envPath = path.resolve(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('✅ Secure .env file generated successfully!');
  console.log('🔐 Please review and update sensitive values manually.');
}

generateSecureEnv();

/**
 * 🚀 JASON Production Deployment Configuration
 *
 * Complete deployment configuration for production-ready JASON system
 */

export const deploymentConfig = {
  // Environment Configuration
  environment: {
    NODE_ENV: "production",
    PORT: process.env.PORT || 3000,
    HTTPS_PORT: process.env.HTTPS_PORT || 3443,
    DOMAIN: process.env.DOMAIN || "localhost",
    API_BASE_URL: process.env.API_BASE_URL || "https://api.jason-ai.com",
    CDN_URL: process.env.CDN_URL || "https://cdn.jason-ai.com",
  },

  // Database Configuration
  database: {
    type: process.env.DB_TYPE || "postgresql",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "jason_production",
    username: process.env.DB_USER || "jason",
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true",
    pool: {
      min: 2,
      max: 20,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env.DB_LOGGING === "true",
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },

  // AI Services Configuration
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      maxTokens: 4000,
      temperature: 0.7,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-3-opus-20240229",
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
      model: "eleven_multilingual_v2",
    },
    whisper: {
      model: process.env.WHISPER_MODEL || "whisper-1",
      language: "en",
    },
    localModels: {
      enabled: process.env.LOCAL_AI_ENABLED !== "false",
      modelsPath: process.env.LOCAL_MODELS_PATH || "./models",
      voiceModel: "whisper-large-v3",
      nlpModel: "bert-base-uncased",
    },
  },

  // Blockchain Configuration
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || "polygon",
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || "https://polygon-rpc.com",
    contractAddress: process.env.DATA_DIVIDEND_CONTRACT,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    gasLimit: process.env.GAS_LIMIT || 500000,
    gasPrice: process.env.GAS_PRICE || "20000000000", // 20 gwei
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    sessionSecret:
      process.env.SESSION_SECRET || "your-super-secret-session-key",
    encryptionKey:
      process.env.ENCRYPTION_KEY || "your-32-character-encryption-key",
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
      "https://jason-ai.com",
    ],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: "Too many requests from this IP",
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    },
  },

  // SSL/TLS Configuration
  ssl: {
    enabled: process.env.SSL_ENABLED === "true",
    keyPath: process.env.SSL_KEY_PATH || "./ssl/server.key",
    certPath: process.env.SSL_CERT_PATH || "./ssl/server.crt",
    caPath: process.env.SSL_CA_PATH,
    autoRedirect: process.env.SSL_AUTO_REDIRECT !== "false",
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== "false",
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED !== "false",
      port: process.env.PROMETHEUS_PORT || 9090,
      path: "/metrics",
    },
    grafana: {
      enabled: process.env.GRAFANA_ENABLED !== "false",
      port: process.env.GRAFANA_PORT || 3001,
      adminUser: process.env.GRAFANA_ADMIN_USER || "admin",
      adminPassword: process.env.GRAFANA_ADMIN_PASSWORD || "admin",
    },
    logging: {
      level: process.env.LOG_LEVEL || "info",
      format: process.env.LOG_FORMAT || "json",
      file: process.env.LOG_FILE || "./logs/jason.log",
      maxSize: process.env.LOG_MAX_SIZE || "10m",
      maxFiles: process.env.LOG_MAX_FILES || "5",
    },
    healthCheck: {
      enabled: true,
      path: "/health",
      interval: 30000, // 30 seconds
    },
  },

  // Clustering Configuration
  clustering: {
    enabled: process.env.CLUSTERING_ENABLED !== "false",
    workers: process.env.WORKERS || require("os").cpus().length,
    restartDelay: 1000,
    maxRestarts: 10,
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED !== "false",
    ttl: process.env.CACHE_TTL || 3600, // 1 hour
    maxSize: process.env.CACHE_MAX_SIZE || 1000,
    checkPeriod: process.env.CACHE_CHECK_PERIOD || 600, // 10 minutes
  },

  // File Upload Configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || "50mb",
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/gif",
      "audio/wav",
      "audio/mp3",
      "audio/ogg",
    ],
    uploadPath: process.env.UPLOAD_PATH || "./uploads",
    cleanupInterval: process.env.UPLOAD_CLEANUP_INTERVAL || 24 * 60 * 60 * 1000, // 24 hours
  },

  // WebSocket Configuration
  websocket: {
    enabled: process.env.WEBSOCKET_ENABLED !== "false",
    path: "/ws",
    pingTimeout: process.env.WS_PING_TIMEOUT || 60000,
    pingInterval: process.env.WS_PING_INTERVAL || 25000,
    maxConnections: process.env.WS_MAX_CONNECTIONS || 1000,
  },

  // Email Configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: process.env.EMAIL_FROM || "noreply@jason-ai.com",
  },

  // Analytics Configuration
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED !== "false",
    googleAnalytics: {
      trackingId: process.env.GA_TRACKING_ID,
    },
    mixpanel: {
      token: process.env.MIXPANEL_TOKEN,
    },
    customEvents: {
      enabled: process.env.CUSTOM_EVENTS_ENABLED !== "false",
      endpoint: process.env.ANALYTICS_ENDPOINT,
    },
  },

  // CDN Configuration
  cdn: {
    enabled: process.env.CDN_ENABLED === "true",
    provider: process.env.CDN_PROVIDER || "cloudflare",
    baseUrl: process.env.CDN_BASE_URL,
    apiKey: process.env.CDN_API_KEY,
    zone: process.env.CDN_ZONE,
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED !== "false",
    schedule: process.env.BACKUP_SCHEDULE || "0 2 * * *", // Daily at 2 AM
    retention: process.env.BACKUP_RETENTION || 30, // 30 days
    storage: {
      type: process.env.BACKUP_STORAGE || "s3",
      bucket: process.env.BACKUP_BUCKET,
      region: process.env.BACKUP_REGION || "us-east-1",
      accessKey: process.env.BACKUP_ACCESS_KEY,
      secretKey: process.env.BACKUP_SECRET_KEY,
    },
  },

  // Feature Flags
  features: {
    voiceAssistant: process.env.FEATURE_VOICE_ASSISTANT !== "false",
    dataDividend: process.env.FEATURE_DATA_DIVIDEND !== "false",
    universalControl: process.env.FEATURE_UNIVERSAL_CONTROL !== "false",
    proactiveAI: process.env.FEATURE_PROACTIVE_AI !== "false",
    realTimeAnalytics: process.env.FEATURE_REAL_TIME_ANALYTICS !== "false",
    blockchainIntegration: process.env.FEATURE_BLOCKCHAIN !== "false",
    mobileApp: process.env.FEATURE_MOBILE_APP !== "false",
    enterpriseFeatures: process.env.FEATURE_ENTERPRISE === "true",
  },

  // Performance Configuration
  performance: {
    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== "false",
      level: process.env.COMPRESSION_LEVEL || 6,
      threshold: process.env.COMPRESSION_THRESHOLD || 1024,
    },
    staticFiles: {
      maxAge: process.env.STATIC_MAX_AGE || "1y",
      etag: process.env.STATIC_ETAG !== "false",
      lastModified: process.env.STATIC_LAST_MODIFIED !== "false",
    },
    apiCache: {
      enabled: process.env.API_CACHE_ENABLED !== "false",
      ttl: process.env.API_CACHE_TTL || 300, // 5 minutes
    },
  },

  // Third-party Integrations
  integrations: {
    stripe: {
      enabled: process.env.STRIPE_ENABLED === "true",
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    twilio: {
      enabled: process.env.TWILIO_ENABLED === "true",
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    aws: {
      enabled: process.env.AWS_ENABLED === "true",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "us-east-1",
      s3Bucket: process.env.AWS_S3_BUCKET,
    },
    google: {
      enabled: process.env.GOOGLE_ENABLED === "true",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      apiKey: process.env.GOOGLE_API_KEY,
    },
  },
};

// Validation function
export function validateConfig() {
  const errors = [];

  // Required environment variables
  const required = ["JWT_SECRET", "SESSION_SECRET", "ENCRYPTION_KEY"];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate database configuration
  if (
    deploymentConfig.database.type === "postgresql" &&
    !deploymentConfig.database.password
  ) {
    errors.push("Database password is required for PostgreSQL");
  }

  // Validate SSL configuration
  if (deploymentConfig.ssl.enabled) {
    if (!deploymentConfig.ssl.keyPath || !deploymentConfig.ssl.certPath) {
      errors.push(
        "SSL key and certificate paths are required when SSL is enabled",
      );
    }
  }

  // Validate blockchain configuration
  if (deploymentConfig.features.blockchainIntegration) {
    if (
      !deploymentConfig.blockchain.contractAddress ||
      !deploymentConfig.blockchain.privateKey
    ) {
      errors.push("Blockchain contract address and private key are required");
    }
  }

  if (errors.length > 0) {
    console.error("Configuration validation errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log("✅ Configuration validation passed");
}

export default deploymentConfig;

import fs from 'fs';
import path from 'path';
import os from 'os';
import { createLogger, transports, format } from 'winston';
import crypto from 'crypto';

// Configure logger
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
    new transports.File({ filename: 'configuration.log' })
  ]
});

interface ApplicationConfig {
  // Application Settings
  environment: string;
  port: number;

  // Database Configuration
  database: {
    url: string;
    type: string;
  };

  // Authentication Configuration
  authentication: {
    jwtSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    passwordSaltRounds: number;
    maxLoginAttempts: number;
    accountLockoutDuration: number;
  };

  // External Services
  services: {
    email: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
    sms: {
      sid: string;
      token: string;
      fromNumber: string;
    };
  };

  // AI and Machine Learning
  aiInsights: {
    modelDirectory: string;
    confidenceThreshold: number;
  };

  // Logging
  logging: {
    level: string;
    directory: string;
  };
}

class ConfigurationService {
  private configPath: string;
  private config: ApplicationConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.jason', 'app_config.json');
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): ApplicationConfig {
    try {
      // Ensure config directory exists
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });

      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
      
      // Default configuration
      const defaultConfig: ApplicationConfig = {
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3001'),
        
        database: {
          url: process.env.DATABASE_URL || 'postgresql://localhost/jason_db',
          type: 'postgresql'
        },
        
        authentication: {
          jwtSecret: this.generateSecureSecret(),
          accessTokenExpiry: '15m',
          refreshTokenExpiry: '7d',
          passwordSaltRounds: 12,
          maxLoginAttempts: 5,
          accountLockoutDuration: 15 * 60 * 1000 // 15 minutes
        },
        
        services: {
          email: {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
          },
          sms: {
            sid: process.env.TWILIO_SID || '',
            token: process.env.TWILIO_TOKEN || '',
            fromNumber: process.env.TWILIO_FROM_NUMBER || ''
          }
        },
        
        aiInsights: {
          modelDirectory: process.env.TF_MODEL_DIR || './models',
          confidenceThreshold: parseFloat(process.env.AI_INSIGHTS_CONFIDENCE_THRESHOLD || '0.7')
        },
        
        logging: {
          level: process.env.LOG_LEVEL || 'info',
          directory: process.env.LOG_DIR || './logs'
        }
      };

      // Save configuration
      this.saveConfiguration(defaultConfig);

      return defaultConfig;
    } catch (error) {
      logger.error('Failed to load configuration:', error);
      throw error;
    }
  }

  private generateSecureSecret(length: number = 64): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    return Array.from(crypto.getRandomValues(new Uint32Array(length)))
      .map((x) => chars[x % chars.length])
      .join('');
  }

  private saveConfiguration(config: ApplicationConfig) {
    try {
      fs.writeFileSync(
        this.configPath, 
        JSON.stringify(config, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save configuration:', error);
    }
  }

  public get(key?: keyof ApplicationConfig): ApplicationConfig | any {
    if (!key) return this.config;
    return this.config[key];
  }

  public update(updates: Partial<ApplicationConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration(this.config);
  }

  public validateConfiguration() {
    const validationErrors: string[] = [];

    // Database validation
    if (!this.config.database.url) {
      validationErrors.push('Database URL is required');
    }

    // Authentication validation
    if (!this.config.authentication.jwtSecret) {
      validationErrors.push('JWT Secret is required');
    }

    if (validationErrors.length > 0) {
      logger.error('Configuration validation failed:', validationErrors);
      throw new Error(`Configuration validation failed: ${validationErrors.join(', ')}`);
    }

    logger.info('Configuration validation successful');
  }
}

export default new ConfigurationService();

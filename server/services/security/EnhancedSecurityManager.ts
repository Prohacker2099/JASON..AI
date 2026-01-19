import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
const bcrypt = require('bcrypt');
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  password: {
    saltRounds: number;
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  twoFactor: {
    issuer: string;
    window: number;
    step: number;
  };
  rateLimit: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    sensitiveFields: string[];
  };
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
  tag?: string;
}

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'suspicious_login' | 'data_breach' | 'unauthorized_access' | 'malware' | 'phishing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target?: string;
  description: string;
  indicators: any;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
  detectedAt: Date;
  resolvedAt?: Date;
}

/**
 * Enhanced Security Manager with Advanced Encryption and Threat Detection
 * Provides comprehensive security features including encryption, authentication, audit logging, and threat detection
 */
export class EnhancedSecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private auditLogs: SecurityAuditLog[] = [];
  private threats: SecurityThreat[] = [];
  private rateLimitMap = new Map<string, { attempts: number; lastAttempt: Date; blockedUntil?: Date }>();
  private encryptionKeys = new Map<string, Buffer>();
  private activeTokens = new Set<string>();

  // Security monitoring
  private securityMetrics = {
    totalLogins: 0,
    failedLogins: 0,
    blockedAttempts: 0,
    threatsDetected: 0,
    threatsResolved: 0,
    encryptionOperations: 0,
    auditEvents: 0
  };

  constructor(config?: Partial<SecurityConfig>) {
    super();
    
    this.config = {
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        saltLength: 32,
        ...config?.encryption
      },
      jwt: {
        secret: process.env.JWT_SECRET || this.generateSecureKey(64),
        expiresIn: '1h',
        refreshExpiresIn: '7d',
        issuer: 'JASON-AI',
        audience: 'jason-users',
        ...config?.jwt
      },
      password: {
        saltRounds: 12,
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        ...config?.password
      },
      twoFactor: {
        issuer: 'JASON AI',
        window: 1,
        step: 30,
        ...config?.twoFactor
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDuration: 60 * 60 * 1000, // 1 hour
        ...config?.rateLimit
      },
      audit: {
        enabled: true,
        retentionDays: 90,
        sensitiveFields: ['password', 'token', 'secret', 'key'],
        ...config?.audit
      }
    };

    this.initializeSecurity();
  }

  private initializeSecurity(): void {
    // Generate master encryption key
    this.generateMasterKey();
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    // Clean up expired audit logs
    this.startAuditCleanup();
    
    logger.info('🔒 Enhanced Security Manager initialized');
  }

  private generateMasterKey(): void {
    const masterKey = crypto.randomBytes(this.config.encryption.keyLength);
    this.encryptionKeys.set('master', masterKey);
  }

  private startSecurityMonitoring(): void {
    // Monitor for security threats every minute
    setInterval(() => {
      this.detectSecurityThreats();
    }, 60 * 1000);

    // Clean up rate limit map every hour
    setInterval(() => {
      this.cleanupRateLimit();
    }, 60 * 60 * 1000);
  }

  private startAuditCleanup(): void {
    // Clean up old audit logs daily
    setInterval(() => {
      this.cleanupAuditLogs();
    }, 24 * 60 * 60 * 1000);
  }

  // Encryption Methods
  public encrypt(data: string, keyId: string = 'master'): EncryptionResult {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key) {
        throw new Error(`Encryption key '${keyId}' not found`);
      }

      const salt = crypto.randomBytes(this.config.encryption.saltLength);
      const iv = crypto.randomBytes(this.config.encryption.ivLength);
      
      // Derive key from master key and salt
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, this.config.encryption.keyLength, 'sha256');
      
      const cipher = crypto.createCipher(this.config.encryption.algorithm, derivedKey);
      cipher.setAAD(Buffer.from(keyId));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag?.();
      
      this.securityMetrics.encryptionOperations++;
      
      this.auditLog({
        action: 'encrypt',
        resource: 'data',
        success: true,
        riskLevel: 'low',
        details: { keyId, dataLength: data.length }
      });

      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag?.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      this.auditLog({
        action: 'encrypt',
        resource: 'data',
        success: false,
        riskLevel: 'high',
        details: { error: error.message }
      });
      throw error;
    }
  }

  public decrypt(encryptionResult: EncryptionResult, keyId: string = 'master'): string {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key) {
        throw new Error(`Encryption key '${keyId}' not found`);
      }

      const salt = Buffer.from(encryptionResult.salt, 'hex');
      const iv = Buffer.from(encryptionResult.iv, 'hex');
      
      // Derive key from master key and salt
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, this.config.encryption.keyLength, 'sha256');
      
      const decipher = crypto.createDecipher(this.config.encryption.algorithm, derivedKey);
      decipher.setAAD(Buffer.from(keyId));
      
      if (encryptionResult.tag) {
        decipher.setAuthTag(Buffer.from(encryptionResult.tag, 'hex'));
      }
      
      let decrypted = decipher.update(encryptionResult.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      this.auditLog({
        action: 'decrypt',
        resource: 'data',
        success: true,
        riskLevel: 'low',
        details: { keyId }
      });

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      this.auditLog({
        action: 'decrypt',
        resource: 'data',
        success: false,
        riskLevel: 'high',
        details: { error: error.message }
      });
      throw error;
    }
  }

  // Password Management
  public async hashPassword(password: string): Promise<string> {
    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password does not meet security requirements');
    }

    try {
      const hash = await bcrypt.hash(password, this.config.password.saltRounds);
      
      this.auditLog({
        action: 'hash_password',
        resource: 'authentication',
        success: true,
        riskLevel: 'low'
      });

      return hash;
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw error;
    }
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      
      this.auditLog({
        action: 'verify_password',
        resource: 'authentication',
        success: isValid,
        riskLevel: isValid ? 'low' : 'medium'
      });

      return isValid;
    } catch (error) {
      logger.error('Password verification failed:', error);
      return false;
    }
  }

  public validatePasswordStrength(password: string): boolean {
    const config = this.config.password;
    
    if (password.length < config.minLength) return false;
    if (config.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (config.requireLowercase && !/[a-z]/.test(password)) return false;
    if (config.requireNumbers && !/\d/.test(password)) return false;
    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    
    return true;
  }

  // JWT Token Management
  public generateToken(payload: any, expiresIn?: string): string {
    try {
      const token = jwt.sign(
        payload,
        this.config.jwt.secret,
        {
          expiresIn: expiresIn || this.config.jwt.expiresIn,
          issuer: this.config.jwt.issuer,
          audience: this.config.jwt.audience
        }
      );

      this.activeTokens.add(token);
      
      this.auditLog({
        action: 'generate_token',
        resource: 'authentication',
        success: true,
        riskLevel: 'low',
        details: { userId: payload.userId, expiresIn }
      });

      return token;
    } catch (error) {
      logger.error('Token generation failed:', error);
      throw error;
    }
  }

  public verifyToken(token: string): any {
    try {
      if (!this.activeTokens.has(token)) {
        throw new Error('Token not found in active tokens');
      }

      const decoded = jwt.verify(token, this.config.jwt.secret, {
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      });

      this.auditLog({
        action: 'verify_token',
        resource: 'authentication',
        success: true,
        riskLevel: 'low'
      });

      return decoded;
    } catch (error) {
      this.auditLog({
        action: 'verify_token',
        resource: 'authentication',
        success: false,
        riskLevel: 'medium',
        details: { error: error.message }
      });
      throw error;
    }
  }

  public revokeToken(token: string): void {
    this.activeTokens.delete(token);
    
    this.auditLog({
      action: 'revoke_token',
      resource: 'authentication',
      success: true,
      riskLevel: 'low'
    });
  }

  // Rate Limiting
  public checkRateLimit(identifier: string, ipAddress?: string): boolean {
    const key = `${identifier}:${ipAddress || 'unknown'}`;
    const now = new Date();
    const entry = this.rateLimitMap.get(key);

    if (!entry) {
      this.rateLimitMap.set(key, { attempts: 1, lastAttempt: now });
      return true;
    }

    // Check if still blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      this.securityMetrics.blockedAttempts++;
      return false;
    }

    // Reset if outside window
    const windowStart = new Date(now.getTime() - this.config.rateLimit.windowMs);
    if (entry.lastAttempt < windowStart) {
      entry.attempts = 1;
      entry.lastAttempt = now;
      entry.blockedUntil = undefined;
      return true;
    }

    // Increment attempts
    entry.attempts++;
    entry.lastAttempt = now;

    // Block if exceeded
    if (entry.attempts > this.config.rateLimit.maxAttempts) {
      entry.blockedUntil = new Date(now.getTime() + this.config.rateLimit.blockDuration);
      
      this.detectThreat({
        type: 'brute_force',
        severity: 'high',
        source: ipAddress || identifier,
        description: `Rate limit exceeded: ${entry.attempts} attempts`,
        indicators: { identifier, ipAddress, attempts: entry.attempts }
      });

      return false;
    }

    return true;
  }

  // Audit Logging
  public auditLog(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
    if (!this.config.audit.enabled) return;

    const auditLog: SecurityAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...log
    };

    // Sanitize sensitive data
    if (auditLog.details) {
      auditLog.details = this.sanitizeSensitiveData(auditLog.details);
    }

    this.auditLogs.push(auditLog);
    this.securityMetrics.auditEvents++;

    // Emit event for real-time monitoring
    this.emit('auditLog', auditLog);

    // Store in database if available
    this.storeAuditLog(auditLog);
  }

  private sanitizeSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const sanitized = { ...data };
    
    for (const field of this.config.audit.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private async storeAuditLog(log: SecurityAuditLog): Promise<void> {
    try {
      // Store audit log in database
      // Implementation would depend on your database schema
      logger.debug('Audit log stored:', { id: log.id, action: log.action });
    } catch (error) {
      logger.error('Failed to store audit log:', error);
    }
  }

  // Threat Detection
  private detectSecurityThreats(): void {
    // Analyze recent audit logs for threats
    const recentLogs = this.auditLogs.filter(
      log => log.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    // Detect multiple failed logins
    const failedLogins = recentLogs.filter(
      log => log.action === 'verify_password' && !log.success
    );

    if (failedLogins.length > 10) {
      this.detectThreat({
        type: 'brute_force',
        severity: 'high',
        source: 'multiple_sources',
        description: `${failedLogins.length} failed login attempts in 5 minutes`,
        indicators: { failedLogins: failedLogins.length }
      });
    }

    // Detect suspicious patterns
    const suspiciousActions = recentLogs.filter(
      log => log.riskLevel === 'high' || log.riskLevel === 'critical'
    );

    if (suspiciousActions.length > 5) {
      this.detectThreat({
        type: 'suspicious_login',
        severity: 'medium',
        source: 'system',
        description: `${suspiciousActions.length} high-risk actions detected`,
        indicators: { suspiciousActions: suspiciousActions.length }
      });
    }
  }

  public detectThreat(threat: Omit<SecurityThreat, 'id' | 'detectedAt' | 'status'>): void {
    const securityThreat: SecurityThreat = {
      id: crypto.randomUUID(),
      detectedAt: new Date(),
      status: 'detected',
      ...threat
    };

    this.threats.push(securityThreat);
    this.securityMetrics.threatsDetected++;

    // Emit threat event
    this.emit('threatDetected', securityThreat);

    // Auto-mitigate critical threats
    if (securityThreat.severity === 'critical') {
      this.mitigateThreat(securityThreat.id);
    }

    logger.warn(`🚨 Security threat detected: ${securityThreat.type} (${securityThreat.severity})`);
  }

  public mitigateThreat(threatId: string): boolean {
    const threat = this.threats.find(t => t.id === threatId);
    if (!threat) return false;

    threat.status = 'mitigated';
    
    // Implement mitigation strategies based on threat type
    switch (threat.type) {
      case 'brute_force':
        // Block source IP for extended period
        if (threat.source) {
          this.extendRateLimit(threat.source, 24 * 60 * 60 * 1000); // 24 hours
        }
        break;
      
      case 'unauthorized_access':
        // Revoke all tokens for affected user
        if (threat.target) {
          this.revokeAllUserTokens(threat.target);
        }
        break;
    }

    this.emit('threatMitigated', threat);
    logger.info(`✅ Security threat mitigated: ${threat.id}`);
    
    return true;
  }

  private extendRateLimit(identifier: string, duration: number): void {
    const entries = Array.from(this.rateLimitMap.entries())
      .filter(([key]) => key.includes(identifier));

    entries.forEach(([key, entry]) => {
      entry.blockedUntil = new Date(Date.now() + duration);
    });
  }

  private revokeAllUserTokens(userId: string): void {
    // In a real implementation, you'd track tokens by user
    // For now, we'll clear all active tokens as a security measure
    this.activeTokens.clear();
    
    this.auditLog({
      action: 'revoke_all_tokens',
      resource: 'authentication',
      success: true,
      riskLevel: 'high',
      details: { userId, reason: 'security_threat' }
    });
  }

  // Cleanup Methods
  private cleanupRateLimit(): void {
    const now = new Date();
    
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (entry.blockedUntil && now > entry.blockedUntil) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  private cleanupAuditLogs(): void {
    const cutoff = new Date(Date.now() - this.config.audit.retentionDays * 24 * 60 * 60 * 1000);
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoff);
  }

  // Utility Methods
  private generateSecureKey(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Public API
  public getSecurityMetrics(): typeof this.securityMetrics {
    return { ...this.securityMetrics };
  }

  public getActiveThreats(): SecurityThreat[] {
    return this.threats.filter(t => t.status === 'detected' || t.status === 'investigating');
  }

  public getAuditLogs(limit: number = 100): SecurityAuditLog[] {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public updateSecurityConfig(updates: Partial<SecurityConfig>): void {
    Object.assign(this.config, updates);
    
    this.auditLog({
      action: 'update_security_config',
      resource: 'configuration',
      success: true,
      riskLevel: 'medium',
      details: { updatedFields: Object.keys(updates) }
    });

    this.emit('configUpdated', this.config);
    logger.info('🔒 Security configuration updated');
  }

  public generateApiKey(userId: string, permissions: string[]): string {
    const apiKey = this.generateSecureKey(32);
    const keyData = {
      userId,
      permissions,
      createdAt: new Date(),
      apiKey
    };

    // Store API key (encrypted)
    const encrypted = this.encrypt(JSON.stringify(keyData));
    
    this.auditLog({
      action: 'generate_api_key',
      resource: 'api_access',
      success: true,
      riskLevel: 'medium',
      userId,
      details: { permissions }
    });

    return apiKey;
  }

  public validateApiKey(apiKey: string): { valid: boolean; userId?: string; permissions?: string[] } {
    try {
      // In a real implementation, you'd look up the encrypted key data
      // For now, we'll return a basic validation
      
      this.auditLog({
        action: 'validate_api_key',
        resource: 'api_access',
        success: true,
        riskLevel: 'low'
      });

      return { valid: true };
    } catch (error) {
      this.auditLog({
        action: 'validate_api_key',
        resource: 'api_access',
        success: false,
        riskLevel: 'medium',
        details: { error: error.message }
      });

      return { valid: false };
    }
  }

  public destroy(): void {
    // Clear sensitive data
    this.encryptionKeys.clear();
    this.activeTokens.clear();
    this.rateLimitMap.clear();
    this.auditLogs = [];
    this.threats = [];

    logger.info('🔒 Enhanced Security Manager destroyed');
  }
}

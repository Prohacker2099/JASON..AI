import { EventEmitter } from 'events'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import jwt from 'jsonwebtoken'

export interface SecurityPolicy {
  id: string
  name: string
  level: 1 | 2 | 3
  rules: SecurityRule[]
  createdAt: Date
  updatedAt: Date
}

export interface SecurityRule {
  id: string
  type: 'firewall' | 'access' | 'encryption' | 'audit' | 'rate_limit'
  action: 'allow' | 'deny' | 'log' | 'encrypt'
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}

export interface SecurityEvent {
  id: string
  type: 'intrusion' | 'violation' | 'breach' | 'suspicious' | 'blocked'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  message: string
  timestamp: Date
  metadata?: Record<string, any>
  resolved: boolean
}

export interface SecurityConfig {
  encryptionKey: string
  jwtSecret: string
  maxLoginAttempts: number
  lockoutDuration: number
  sessionTimeout: number
  auditRetention: number
}

const DEFAULT_CONFIG: SecurityConfig = {
  encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 60 * 60 * 1000, // 1 hour
  auditRetention: 90 * 24 * 60 * 60 * 1000 // 90 days
}

export class SecurityHardening extends EventEmitter {
  private config: SecurityConfig
  private policies: Map<string, SecurityPolicy> = new Map()
  private events: SecurityEvent[] = []
  private blockedIPs: Set<string> = new Set()
  private loginAttempts: Map<string, number> = new Map()
  private activeSessions: Map<string, { userId: string; expires: Date }> = new Map()

  constructor(config: Partial<SecurityConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeDefaultPolicies()
    this.startCleanupInterval()
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'basic_firewall',
        name: 'Basic Firewall Rules',
        level: 1,
        rules: [
          {
            id: 'block_suspicious_ips',
            type: 'firewall',
            action: 'deny',
            condition: 'ip_in_blacklist',
            severity: 'high',
            enabled: true
          },
          {
            id: 'rate_limit_requests',
            type: 'rate_limit',
            action: 'deny',
            condition: 'requests_per_minute > 100',
            severity: 'medium',
            enabled: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'access_control',
        name: 'Access Control',
        level: 2,
        rules: [
          {
            id: 'require_authentication',
            type: 'access',
            action: 'allow',
            condition: 'user_authenticated',
            severity: 'high',
            enabled: true
          },
          {
            id: 'role_based_access',
            type: 'access',
            action: 'allow',
            condition: 'user_has_required_role',
            severity: 'medium',
            enabled: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'advanced_protection',
        name: 'Advanced Protection',
        level: 3,
        rules: [
          {
            id: 'encrypt_all_data',
            type: 'encryption',
            action: 'encrypt',
            condition: 'data_transmission',
            severity: 'critical',
            enabled: true
          },
          {
            id: 'audit_all_actions',
            type: 'audit',
            action: 'log',
            condition: 'user_action',
            severity: 'low',
            enabled: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy)
    })
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredSessions()
      this.cleanupOldEvents()
    }, 60 * 1000) // Every minute
  }

  async enforceSecurity(request: {
    ip: string
    userId?: string
    action: string
    resource: string
    data?: any
  }): Promise<{ allowed: boolean; reason?: string; sessionId?: string }> {
    // Check if IP is blocked
    if (this.blockedIPs.has(request.ip)) {
      await this.logEvent({
        type: 'blocked',
        severity: 'high',
        source: request.ip,
        message: 'Blocked IP attempted access',
        metadata: { action: request.action, resource: request.resource }
      })
      return { allowed: false, reason: 'IP blocked' }
    }

    // Check rate limiting
    const requestCount = await this.getRequestCount(request.ip)
    if (requestCount > 100) {
      await this.blockIP(request.ip, 'Rate limit exceeded')
      return { allowed: false, reason: 'Rate limit exceeded' }
    }

    // Apply security policies
    const applicablePolicies = Array.from(this.policies.values())
      .filter(policy => policy.rules.some(rule => rule.enabled))

    for (const policy of applicablePolicies) {
      for (const rule of policy.rules) {
        if (!rule.enabled) continue

        const result = await this.evaluateRule(rule, request)
        if (result.action === 'deny') {
          await this.logEvent({
            type: 'violation',
            severity: rule.severity,
            source: request.ip,
            message: `Security rule violated: ${rule.id}`,
            metadata: { ruleId: rule.id, action: request.action, resource: request.resource }
          })
          return { allowed: false, reason: result.reason }
        }
      }
    }

    // Create session if authenticated
    let sessionId: string | undefined
    if (request.userId) {
      sessionId = await this.createSession(request.userId)
    }

    return { allowed: true, sessionId }
  }

  private async evaluateRule(rule: SecurityRule, request: any): Promise<{ action: string; reason?: string }> {
    switch (rule.type) {
      case 'firewall':
        if (rule.condition === 'ip_in_blacklist' && this.blockedIPs.has(request.ip)) {
          return { action: 'deny', reason: 'IP in blacklist' }
        }
        break

      case 'rate_limit':
        if (rule.condition.includes('requests_per_minute')) {
          const count = await this.getRequestCount(request.ip)
          const threshold = parseInt(rule.condition.split('>')[1].trim())
          if (count > threshold) {
            return { action: 'deny', reason: 'Rate limit exceeded' }
          }
        }
        break

      case 'access':
        if (rule.condition === 'user_authenticated' && !request.userId) {
          return { action: 'deny', reason: 'Authentication required' }
        }
        break

      case 'encryption':
        if (rule.condition === 'data_transmission' && request.data) {
          // Encrypt data
          request.data = await this.encryptData(JSON.stringify(request.data))
        }
        break

      case 'audit':
        if (rule.condition === 'user_action') {
          await this.logEvent({
            type: 'suspicious',
            severity: rule.severity,
            source: request.ip,
            message: `User action: ${request.action}`,
            metadata: { userId: request.userId, resource: request.resource }
          })
        }
        break
    }

    return { action: rule.action }
  }

  async encryptData(data: string): Promise<string> {
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  }

  async decryptData(encryptedData: string): Promise<string> {
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32)
    const parts = encryptedData.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + this.config.sessionTimeout)
    
    this.activeSessions.set(sessionId, { userId, expires })
    
    return sessionId
  }

  validateSession(sessionId: string): { valid: boolean; userId?: string } {
    const session = this.activeSessions.get(sessionId)
    
    if (!session || session.expires < new Date()) {
      this.activeSessions.delete(sessionId)
      return { valid: false }
    }
    
    return { valid: true, userId: session.userId }
  }

  async blockIP(ip: string, reason: string): Promise<void> {
    this.blockedIPs.add(ip)
    
    await this.logEvent({
      type: 'blocked',
      severity: 'high',
      source: ip,
      message: `IP blocked: ${reason}`,
      metadata: { reason }
    })
  }

  async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip)
    
    await this.logEvent({
      type: 'suspicious',
      severity: 'low',
      source: ip,
      message: 'IP unblocked'
    })
  }

  private async getRequestCount(ip: string): Promise<number> {
    // Simplified rate limiting - in production, use Redis or similar
    return Math.floor(Math.random() * 150) // Mock implementation
  }

  private async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      ...event,
      timestamp: new Date(),
      resolved: false
    }

    this.events.push(securityEvent)
    this.emit('security_event', securityEvent)
  }

  private cleanupExpiredSessions(): void {
    const now = new Date()
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expires < now) {
        this.activeSessions.delete(sessionId)
      }
    }
  }

  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - this.config.auditRetention)
    this.events = this.events.filter(event => event.timestamp > cutoff)
  }

  getSecurityStatistics(): {
    totalEvents: number
    blockedIPs: number
    activeSessions: number
    activePolicies: number
    eventsBySeverity: Record<string, number>
  } {
    const eventsBySeverity = this.events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEvents: this.events.length,
      blockedIPs: this.blockedIPs.size,
      activeSessions: this.activeSessions.size,
      activePolicies: this.policies.size,
      eventsBySeverity
    }
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  async createPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newPolicy: SecurityPolicy = {
      id: crypto.randomUUID(),
      ...policy,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.policies.set(newPolicy.id, newPolicy)
    this.emit('policy_created', newPolicy)
    
    return newPolicy.id
  }

  async updatePolicy(id: string, updates: Partial<SecurityPolicy>): Promise<boolean> {
    const policy = this.policies.get(id)
    if (!policy) return false

    const updatedPolicy = { ...policy, ...updates, updatedAt: new Date() }
    this.policies.set(id, updatedPolicy)
    this.emit('policy_updated', updatedPolicy)
    
    return true
  }

  async deletePolicy(id: string): Promise<boolean> {
    const deleted = this.policies.delete(id)
    if (deleted) {
      this.emit('policy_deleted', { id })
    }
    return deleted
  }

  getAllPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values())
  }

  async generateSecurityReport(): Promise<{
    summary: any
    events: SecurityEvent[]
    policies: SecurityPolicy[]
    recommendations: string[]
  }> {
    const stats = this.getSecurityStatistics()
    const recentEvents = this.getRecentEvents(100)
    const policies = this.getAllPolicies()

    const recommendations = [
      'Enable multi-factor authentication for all users',
      'Implement regular security audits',
      'Update firewall rules regularly',
      'Monitor unusual login patterns',
      'Keep encryption keys secure'
    ]

    return {
      summary: stats,
      events: recentEvents,
      policies,
      recommendations
    }
  }
}

export default SecurityHardening

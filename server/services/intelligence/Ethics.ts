import { EventEmitter } from 'events'
import { prisma } from '../../utils/prisma'
import { permissionManager } from '../trust/PermissionManager'
import { messageBus, makeEnvelope } from '../bus/MessageBus'

export type EthicsConfig = {
  ethicalMode: boolean
  blockHateSpeech: boolean
  blockHarassment: boolean
  blockManipulation: boolean
  requireConsentForSensitive: boolean
  riskPromptThreshold: number // 0..1 => prompt if >= threshold
}

export interface MoralityGate {
  name: string
  enabled: boolean
  level: 1 | 2 | 3
  description: string
}

export interface MoralityResult {
  gate: string
  passed: boolean
  level: number
  reason: string
  requiresApproval: boolean
  blocked: boolean
}

export interface MoralityPipelineResult {
  overallDecision: 'allow' | 'prompt' | 'block'
  requiredLevel: 1 | 2 | 3
  gates: MoralityResult[]
  finalScore: number
  auditTrail: {
    timestamp: Date
    action: string
    result: {
      overallDecision: 'allow' | 'prompt' | 'block'
      requiredLevel: 1 | 2 | 3
      gates: MoralityResult[]
      finalScore: number
    }
  }
}

export type EthicsScan = {
  score: number // 0..1 higher = riskier
  categories: Array<'hate'|'harassment'|'manipulation'|'sensitive'>
  blocked: boolean
  reasons: string[]
  moralityGates?: MoralityResult[]
}

const DEFAULT_CFG: EthicsConfig = {
  ethicalMode: true,
  blockHateSpeech: true,
  blockHarassment: true,
  blockManipulation: true,
  requireConsentForSensitive: true,
  riskPromptThreshold: 0.5,
}

// Heuristic keyword groups (high level; no explicit slur lists)
const HATE_KEYS = ['hate','inferior group','eliminate group','violence against group']
const HARASS_KEYS = ['targeted harassment','threaten','stalk','dox']
const MANIP_KEYS = ['coerce','manipulate','deceive','social engineering']
const SENSITIVE_KEYS = ['medical record','password','private key','ssn','bank account']

// Financial transaction keywords for Cost Gate
const FINANCIAL_KEYS = ['buy','pay','purchase','transfer','send money','checkout','order','subscribe','donate']

// High-risk domains for Scope Gate
const BLOCKED_DOMAINS = ['captcha-solver.com', 'bot-automation.net', 'illegal-services.org']
const RESTRICTED_DOMAINS = ['bank.com', 'paypal.com', 'crypto.com', 'trading.com']
const ALLOWED_DOMAINS = ['localhost', '127.0.0.1', 'api.weather.gov', 'github.com', 'stackoverflow.com']

function containsAny(text: string, keys: string[]): boolean {
  const t = text.toLowerCase()
  return keys.some(k => t.includes(k))
}

class MoralityEngine extends EventEmitter {
  private cfg: EthicsConfig = { ...DEFAULT_CFG }
  private gates: Map<string, MoralityGate> = new Map([
    ['scope', {
      name: 'Scope Gate',
      enabled: true,
      level: 1,
      description: 'Validates target URL/Process against allowlist/denylist'
    }],
    ['cost', {
      name: 'Cost Gate', 
      enabled: true,
      level: 2,
      description: 'Detects and blocks financial transactions'
    }],
    ['integrity', {
      name: 'Integrity Gate',
      enabled: true,
      level: 3,
      description: 'Ensures sensitive data from Secure Enclave only'
    }]
  ])

  constructor() {
    super()
    this.initializeGates()
  }

  private initializeGates(): void {
    // Set up gate-specific configurations
    this.gates.get('scope')!.level = 1
    this.gates.get('cost')!.level = 2
    this.gates.get('integrity')!.level = 3
  }

  /**
   * Run the complete three-gate morality pipeline
   */
  async runMoralityPipeline(action: {
    name?: string
    tags?: string[]
    payload?: any
    target?: string
    processId?: number
  }): Promise<MoralityPipelineResult> {
    const gates: MoralityResult[] = []
    let maxLevel = 1
    let finalScore = 0

    // Run each gate in sequence
    for (const [gateName, gate] of this.gates.entries()) {
      if (!gate.enabled) continue

      const result = await this.runGate(gateName, action)
      gates.push(result)
      
      if (!result.passed) {
        maxLevel = Math.max(maxLevel, result.level)
      }
      
      finalScore += result.passed ? 0 : (result.level * 0.3)
    }

    // Determine overall decision
    const hasBlocking = gates.some(g => g.blocked)
    const requiresApproval = gates.some(g => g.requiresApproval)
    
    let overallDecision: 'allow' | 'prompt' | 'block'
    let requiredLevel: 1 | 2 | 3 = 1

    if (hasBlocking) {
      overallDecision = 'block'
      requiredLevel = 3
    } else if (requiresApproval) {
      overallDecision = 'prompt'
      requiredLevel = maxLevel as 1 | 2 | 3
    } else {
      overallDecision = 'allow'
      requiredLevel = 1
    }

    const result: MoralityPipelineResult = {
      overallDecision,
      requiredLevel,
      gates,
      finalScore: Math.min(1, finalScore),
      auditTrail: {
        timestamp: new Date(),
        action: action.name || 'unknown',
        result: {
          overallDecision,
          requiredLevel,
          gates,
          finalScore: Math.min(1, finalScore)
        }
      }
    }

    // Log audit trail
    await this.logAudit(result.auditTrail)

    // Broadcast morality decision
    messageBus.publish(makeEnvelope(
      'CONTROL',
      'MORALITY_ENGINE',
      'PERMISSION_MANAGER',
      {
        type: 'morality_decision',
        action: action.name,
        decision: overallDecision,
        requiredLevel,
        gates: gates
      },
      100 // Highest priority for morality decisions
    ))

    this.emit('pipeline_completed', result)
    return result
  }

  /**
   * Run individual morality gate
   */
  private async runGate(gateName: string, action: any): Promise<MoralityResult> {
    const gate = this.gates.get(gateName)!
    
    switch (gateName) {
      case 'scope':
        return this.runScopeGate(action)
      case 'cost':
        return this.runCostGate(action)
      case 'integrity':
        return this.runIntegrityGate(action)
      default:
        return {
          gate: gateName,
          passed: true,
          level: gate.level,
          reason: 'Unknown gate - defaulting to pass',
          requiresApproval: false,
          blocked: false
        }
    }
  }

  /**
   * Scope Gate: URL/Process allowlist/denylist validation
   */
  private runScopeGate(action: any): MoralityResult {
    const target = action.target || action.payload?.url || ''
    const domain = this.extractDomain(target)
    
    // Check blocked domains
    if (BLOCKED_DOMAINS.some(blocked => domain.includes(blocked))) {
      return {
        gate: 'scope',
        passed: false,
        level: 3,
        reason: `Target domain '${domain}' is on blocked list`,
        requiresApproval: false,
        blocked: true
      }
    }

    // Check restricted domains
    if (RESTRICTED_DOMAINS.some(restricted => domain.includes(restricted))) {
      return {
        gate: 'scope',
        passed: false,
        level: 2,
        reason: `Target domain '${domain}' requires L2 approval`,
        requiresApproval: true,
        blocked: false
      }
    }

    // Check if domain is allowed
    if (ALLOWED_DOMAINS.some(allowed => domain.includes(allowed))) {
      return {
        gate: 'scope',
        passed: true,
        level: 1,
        reason: `Target domain '${domain}' is on allowlist`,
        requiresApproval: false,
        blocked: false
      }
    }

    // Unknown domain - require L1 approval
    return {
      gate: 'scope',
      passed: false,
      level: 1,
      reason: `Target domain '${domain}' not recognized - requires L1 approval`,
      requiresApproval: true,
      blocked: false
    }
  }

  /**
   * Cost Gate: Financial transaction detection
   */
  private runCostGate(action: any): MoralityResult {
    const actionText = `${action.name || ''} ${JSON.stringify(action.payload || {})}`.toLowerCase()
    
    // Detect financial keywords
    const hasFinancialKeywords = FINANCIAL_KEYS.some(keyword => actionText.includes(keyword))
    
    if (hasFinancialKeywords) {
      return {
        gate: 'cost',
        passed: false,
        level: 3,
        reason: 'Action contains financial transaction keywords - requires L3 approval',
        requiresApproval: true,
        blocked: false
      }
    }

    return {
      gate: 'cost',
      passed: true,
      level: 2,
      reason: 'No financial transaction detected',
      requiresApproval: false,
      blocked: false
    }
  }

  /**
   * Integrity Gate: Secure Enclave validation for sensitive data
   */
  private runIntegrityGate(action: any): MoralityResult {
    const payload = action.payload || {}
    const payloadStr = JSON.stringify(payload).toLowerCase()
    
    // Check for sensitive data patterns
    const hasPassword = /password|pass|pwd/.test(payloadStr)
    const hasPrivateKey = /private.*key|pem|rsa/.test(payloadStr)
    const hasSSN = /\b\d{3}-?\d{2}-?\d{4}\b/.test(payloadStr)
    const hasBankAccount = /account.*number|routing.*number|iban/.test(payloadStr)
    
    if (hasPassword || hasPrivateKey || hasSSN || hasBankAccount) {
      // Check if data is from secure enclave (simplified check)
      const fromSecureEnclave = payload.source === 'secure_enclave' || 
                               payload.secure === true ||
                               action.tags?.includes('secure_enclave')
      
      if (!fromSecureEnclave) {
        return {
          gate: 'integrity',
          passed: false,
          level: 3,
          reason: 'Sensitive data detected without Secure Enclave source',
          requiresApproval: true,
          blocked: false
        }
      }
    }

    return {
      gate: 'integrity',
      passed: true,
      level: 3,
      reason: 'No sensitive data or properly sourced',
      requiresApproval: false,
      blocked: false
    }
  }

  /**
   * Get all morality gates
   */
  getGates(): MoralityGate[] {
    return Array.from(this.gates.values())
  }

  /**
   * Configure morality gate
   */
  configureGate(gateName: string, config: Partial<MoralityGate>): void {
    const gate = this.gates.get(gateName)
    if (gate) {
      Object.assign(gate, config)
      this.emit('gate_configured', { gate: gateName, config })
    }
  }

  /**
   * Get morality statistics
   */
  getStatistics(): {
    totalAudits: number
    gatePassRates: Record<string, number>
    averageDecisionTime: number
    recentDecisions: Array<{ timestamp: Date; decision: string; action: string }>
  } {
    // This would typically query the database for audit history
    // For now, return placeholder statistics
    return {
      totalAudits: 0,
      gatePassRates: {
        scope: 0.85,
        cost: 0.92,
        integrity: 0.98
      },
      averageDecisionTime: 15, // milliseconds
      recentDecisions: []
    }
  }

  // Helper methods
  private extractDomain(url: string): string {
    try {
      if (!url || typeof url !== 'string') return ''
      if (url.startsWith('http')) {
        return new URL(url).hostname.toLowerCase()
      }
      return url.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }

  private async logAudit(auditTrail: MoralityPipelineResult['auditTrail']): Promise<void> {
    try {
      await prisma.learningEvent.create({ 
        data: { 
          event: 'morality_audit', 
          data: auditTrail as any 
        } 
      })
    } catch (error) {
      this.emit('audit_log_failed', error)
    }
  }
}

// Legacy EthicsService for backward compatibility
class EthicsService extends EventEmitter {
  private moralityEngine = new MoralityEngine()
  private cfg: EthicsConfig = { ...DEFAULT_CFG }

  getConfig(): EthicsConfig { return { ...this.cfg } }
  setConfig(next: Partial<EthicsConfig>): EthicsConfig {
    this.cfg = { ...this.cfg, ...(next as EthicsConfig) }
    this.emit('config', this.cfg)
    return this.getConfig()
  }

  scanText(text: string): EthicsScan {
    const reasons: string[] = []
    const cats: EthicsScan['categories'] = []
    let score = 0
    const t = (text || '').toLowerCase()

    if (containsAny(t, HATE_KEYS)) { cats.push('hate'); reasons.push('Detected potential hate indicators'); score += 0.6 }
    if (containsAny(t, HARASS_KEYS)) { cats.push('harassment'); reasons.push('Detected potential harassment indicators'); score += 0.4 }
    if (containsAny(t, MANIP_KEYS)) { cats.push('manipulation'); reasons.push('Detected potential manipulation indicators'); score += 0.5 }
    if (containsAny(t, SENSITIVE_KEYS)) { cats.push('sensitive'); reasons.push('Detected potential sensitive data'); score += 0.5 }

    score = Math.max(0, Math.min(1, score))

    const blocked = (
      (this.cfg.blockHateSpeech && cats.includes('hate')) ||
      (this.cfg.blockHarassment && cats.includes('harassment')) ||
      (this.cfg.blockManipulation && cats.includes('manipulation'))
    ) && this.cfg.ethicalMode

    return { score, categories: cats, blocked, reasons }
  }

  async logAudit(payload: any) {
    try {
      await prisma.learningEvent.create({ data: { event: 'ethics_audit', data: payload as any } })
    } catch {}
  }

  // Evaluate action semantics (name/tags/payload strings) for ethical risk.
  checkAction(action: { name?: string; tags?: string[]; payload?: any }): EthicsScan {
    const text = `${action.name || ''} ${(action.tags || []).join(' ')} ${JSON.stringify(action.payload || {})}`
    return this.scanText(text)
  }

  // Decide enforcement: allow/prompt/block (legacy method)
  enforceAction(action: { name?: string; tags?: string[]; payload?: any }): { decision: 'allow'|'prompt'|'block'; scan: EthicsScan } {
    const scan = this.checkAction(action)
    if (!this.cfg.ethicalMode) return { decision: 'allow', scan }
    if (scan.blocked) return { decision: 'block', scan }
    if (scan.score >= this.cfg.riskPromptThreshold || scan.categories.includes('sensitive')) return { decision: 'prompt', scan }
    return { decision: 'allow', scan }
  }

  // New method: Run full morality pipeline
  async runMoralityPipeline(action: any): Promise<MoralityPipelineResult> {
    return this.moralityEngine.runMoralityPipeline(action)
  }

  // Get morality engine instance
  getMoralityEngine(): MoralityEngine {
    return this.moralityEngine
  }
}

export const ethics = new EthicsService()
export const moralityEngine = ethics.getMoralityEngine()

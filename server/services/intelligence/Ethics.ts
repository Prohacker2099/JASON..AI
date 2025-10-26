import { EventEmitter } from 'events'
import { prisma } from '../../utils/prisma'

export type EthicsConfig = {
  ethicalMode: boolean
  blockHateSpeech: boolean
  blockHarassment: boolean
  blockManipulation: boolean
  requireConsentForSensitive: boolean
  riskPromptThreshold: number // 0..1 => prompt if >= threshold
}

export type EthicsScan = {
  score: number // 0..1 higher = riskier
  categories: Array<'hate'|'harassment'|'manipulation'|'sensitive'>'
  blocked: boolean
  reasons: string[]
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

function containsAny(text: string, keys: string[]): boolean {
  const t = text.toLowerCase()
  return keys.some(k => t.includes(k))
}

class EthicsService extends EventEmitter {
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

  // Decide enforcement: allow/prompt/block
  enforceAction(action: { name?: string; tags?: string[]; payload?: any }): { decision: 'allow'|'prompt'|'block'; scan: EthicsScan } {
    const scan = this.checkAction(action)
    if (!this.cfg.ethicalMode) return { decision: 'allow', scan }
    if (scan.blocked) return { decision: 'block', scan }
    if (scan.score >= this.cfg.riskPromptThreshold || scan.categories.includes('sensitive')) return { decision: 'prompt', scan }
    return { decision: 'allow', scan }
  }
}

export const ethics = new EthicsService()

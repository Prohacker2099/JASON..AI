import { AdapterRegistry, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { permissionManager } from '../trust/PermissionManager'
import { ethics } from '../intelligence/Ethics'

export type DAIOptions = {
  simulate?: boolean
  allowedHosts?: string[]
  allowProcess?: boolean
  allowPowershell?: boolean
}

const DEFAULT: Required<DAIOptions> = {
  simulate: false,
  allowedHosts: ['localhost','127.0.0.1','api.weather.gov'],
  allowProcess: false,
  allowPowershell: false,
}

// Runtime config override
let SPENDING_CAP_OVERRIDE_USD: number | null = null
export function getDAIConfig() {
  const envCap = Number(process.env.DAI_SPENDING_CAP_USD)
  return { overrideCapUSD: SPENDING_CAP_OVERRIDE_USD, envCapUSD: Number.isFinite(envCap) && envCap > 0 ? envCap : 100 }
}
export function setDAIConfig(next: { overrideCapUSD?: number | null }) {
  if (typeof next.overrideCapUSD === 'number') {
    SPENDING_CAP_OVERRIDE_USD = Math.max(0, next.overrideCapUSD)
  } else if (next.overrideCapUSD === null) {
    SPENDING_CAP_OVERRIDE_USD = null
  }
  return getDAIConfig()
}

function isHighImpact(a: ActionDefinition): boolean {
  const risk = Math.max(0, Math.min(1, a.riskLevel ?? 0))
  const tags = (a.tags || []).join(' ')
  return risk >= 0.8 || /(pay|purchase|book|financial|transfer|delete|shutdown|install|uninstall)/i.test(tags)
}

function allowedByPolicy(a: ActionDefinition, opt: Required<DAIOptions>): boolean {
  if (a.type === 'http') {
    try {
      const url = new URL(String((a.payload||{}).url||''))
      return opt.allowedHosts.includes(url.hostname)
    } catch { return false }
  }
  if (a.type === 'process') return opt.allowProcess
  if (a.type === 'powershell') return opt.allowPowershell
  return true
}

function isFinancial(a: ActionDefinition): boolean {
  const s = `${a.name || ''} ${(a.tags || []).join(' ')} ${JSON.stringify(a.payload || {})}`
  return /(pay|purchase|book|order|buy|charge|bill|invoice|financial|transfer|subscription|renew)/i.test(s)
}

function extractAmountUSD(a: ActionDefinition): number | null {
  const p = a.payload
  // Direct numeric fields
  if (p && typeof p === 'object') {
    const fields = ['amount','price','total','cost','usd','value']
    for (const k of fields) {
      const v = (p as any)[k]
      if (typeof v === 'number' && isFinite(v)) return Math.abs(v)
      if (typeof v === 'string') {
        const n = Number(v.replace(/[^0-9.]/g, ''))
        if (isFinite(n) && n > 0) return n
      }
    }
  }
  // Parse from strings
  const s = `${a.name || ''} ${(a.tags || []).join(' ')} ${typeof p === 'string' ? p : JSON.stringify(p || {})}`
  const m = s.match(/\$\s*(\d+(?:\.\d{1,2})?)/) || s.match(/\b(\d+(?:\.\d{1,2})?)\s*(usd|dollars?)\b/i)
  if (m) {
    const n = Number(m[1])
    if (isFinite(n)) return n
  }
  return null
}

function spendingCapUSD(): number {
  if (typeof SPENDING_CAP_OVERRIDE_USD === 'number' && isFinite(SPENDING_CAP_OVERRIDE_USD) && SPENDING_CAP_OVERRIDE_USD >= 0) {
    return SPENDING_CAP_OVERRIDE_USD
  }
  const v = Number(process.env.DAI_SPENDING_CAP_USD)
  if (Number.isFinite(v) && v > 0) return v
  return 100 // sensible default
}

export class DAISandbox {
  private adapters = new AdapterRegistry()

  async execute(action: ActionDefinition, options?: DAIOptions): Promise<ExecutionResult> {
    const opt = { ...DEFAULT, ...(options || {}) }

    if (!allowedByPolicy(action, opt)) return { ok: false, error: 'blocked_by_sandbox_policy' }

    if (opt.simulate) return { ok: true, result: { simulated: true, action } }

    // Ethics enforcement: allow | prompt | block
    try {
      const enforcement = ethics.enforceAction({ name: action.name, tags: action.tags, payload: action.payload })
      if (enforcement.decision === 'block') {
        void ethics.logAudit({ type: 'ethics_block', action, scan: enforcement.scan })
        return { ok: false, error: 'blocked_by_ethics' }
      }
      if (enforcement.decision === 'prompt') {
        const prompt = permissionManager.createPrompt({
          level: 3,
          title: `Ethics review: ${action.name || action.type}`,
          rationale: `Ethical risk ${(enforcement.scan.score).toFixed(2)}. Categories: ${enforcement.scan.categories.join(', ')}`,
          options: ['approve','reject','delay'],
          meta: { action, ethics: enforcement.scan }
        })
        const d = await permissionManager.waitForDecision(prompt.id, 120000)
        void ethics.logAudit({ type: 'ethics_prompt_decision', decision: d, action, scan: enforcement.scan })
        if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
      }
    } catch {}

    // Spending cap guardrail for financial actions
    if (isFinancial(action)) {
      const cap = spendingCapUSD()
      const amt = extractAmountUSD(action)
      const needsPrompt = amt == null || amt > cap
      if (needsPrompt) {
        const title = amt == null
          ? `Confirm: Financial action (cap $${cap.toFixed(2)})`
          : `Confirm: Spend $${amt.toFixed(2)} (cap $${cap.toFixed(2)})`
        const prompt = permissionManager.createPrompt({ level: 3, title, rationale: 'Financial guardrail: spending cap or unknown amount.', options: ['approve','reject','delay'], meta: { action, cap, amount: amt } })
        const d = await permissionManager.waitForDecision(prompt.id, 120000)
        if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
      }
    }

    // Gate high-impact actions
    if (isHighImpact(action)) {
      const prompt = permissionManager.createPrompt({ level: 3, title: `Confirm: ${action.name || action.type}`, rationale: `High-impact action. Risk ${(action.riskLevel ?? 0).toFixed(2)}.`, options: ['approve','reject','delay'], meta: { action } })
      const d = await permissionManager.waitForDecision(prompt.id, 120000)
      if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
    }

    const execResult = await this.adapters.execute(action)
    try { void ethics.logAudit({ type: 'dai_execute', action, result: execResult }) } catch {}
    return execResult
  }
}

export const daiSandbox = new DAISandbox()


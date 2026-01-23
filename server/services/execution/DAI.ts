import { AdapterRegistry, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { permissionManager } from '../trust/PermissionManager'
import { ethics } from '../intelligence/Ethics'
import { WebAutomationAdapter } from '../agents/WebAutomationAgent'
import { FlightArbitrageAdapter } from '../agents/FlightArbitrageAgent'
import { FastFlightSearchAdapter } from '../agents/FastFlightSearchAgent'
import { ConnectorActionAdapter } from '../agents/ConnectorAgent'
import { WindowsUIAutomationAdapter } from '../agents/WindowsUIAutomationAgent'
import { WindowsAppLaunchAdapter } from '../agents/WindowsAppLaunchAgent'
import { messageBus, makeEnvelope } from '../bus/MessageBus'
import { publishSafety } from '../bus/Percepts'
import { inputPriorityGuard } from '../input/InputPriorityGuard'
import { stealthPolicy } from '../automation/StealthPolicy'
import { retryPolicy } from '../automation/RetryPolicy'
import { UniversalGhostHand } from '../automation/UniversalGhostHand'

export type DAIOptions = {
  simulate?: boolean
  allowedHosts?: string[]
  allowProcess?: boolean
  allowPowershell?: boolean
  allowApp?: boolean
  allowUI?: boolean
}

let ALLOWED_HOSTS: string[] = ['localhost', '127.0.0.1', 'api.weather.gov']
export function getAllowedHosts(): string[] { return ALLOWED_HOSTS.slice() }
export function setAllowedHosts(list: string[]): string[] {
  const norm = Array.isArray(list) ? list.map(s => String(s || '').toLowerCase()).filter(Boolean) : []
  ALLOWED_HOSTS = Array.from(new Set(norm))
  return getAllowedHosts()
}

const DEFAULT: Required<DAIOptions> = {
  simulate: false,
  allowedHosts: [],
  allowProcess: false,
  allowPowershell: false,
  allowApp: false,
  allowUI: false,
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
  const s = `${a.name || ''} ${(a.tags || []).join(' ')} ${JSON.stringify(a.payload || {})}`
  return risk >= 0.8 || /(pay|purchase|book|financial|transfer|delete|shutdown|install|uninstall|send|email|message|dm|post|publish)/i.test(s)
}

function allowedByPolicy(a: ActionDefinition, opt: Required<DAIOptions>): boolean {
  if (a.type === 'http') {
    try {
      const url = new URL(String((a.payload || {}).url || ''))
      return opt.allowedHosts.includes(url.hostname)
    } catch { return false }
  }
  if (a.type === 'web') {
    const payload = a.payload || {}
    if (payload.mode === 'flight_arbitrage' || payload.mode === 'flight_search') {
      return true
    }
    try {
      const url = new URL(String(payload.url || ''))
      return opt.allowedHosts.includes(url.hostname)
    } catch { return false }
  }
  if (a.type === 'process') return opt.allowProcess
  if (a.type === 'powershell') return opt.allowPowershell
  if (a.type === 'app') return opt.allowApp
  if (a.type === 'ui') return opt.allowUI
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
    const fields = ['amount', 'price', 'total', 'cost', 'usd', 'value']
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

async function waitForUserIdle(maxWaitMs = 10000, quietWindowMs = 800): Promise<boolean> {
  const start = Date.now()
  while ((Date.now() - start) < Math.max(100, maxWaitMs)) {
    try { if (!inputPriorityGuard.isActive(quietWindowMs)) return true } catch { }
    await new Promise(r => setTimeout(r, 100))
  }
  try { return !inputPriorityGuard.isActive(quietWindowMs) } catch { return true }
}

export class DAISandbox {
  private adapters: AdapterRegistry

  constructor() {
    this.adapters = new AdapterRegistry()
    try { this.adapters.register(new FastFlightSearchAdapter()) } catch { }
    try { this.adapters.register(new FlightArbitrageAdapter()) } catch { }
    try { this.adapters.register(new WebAutomationAdapter()) } catch { }
    try { this.adapters.register(new ConnectorActionAdapter()) } catch { }
    try { this.adapters.register(new WindowsAppLaunchAdapter()) } catch { }
    try { this.adapters.register(new WindowsUIAutomationAdapter()) } catch { }
    try { this.adapters.register(new UniversalGhostHand()) } catch { }
  }

  async execute(action: ActionDefinition, options?: DAIOptions): Promise<ExecutionResult> {
    console.log(`[DAI] Executing action: ${action.type}:${action.name}`, action.payload)
    const base = { ...DEFAULT, ...(options || {}) }
    const opt = { ...base, allowedHosts: (base.allowedHosts && base.allowedHosts.length ? base.allowedHosts : getAllowedHosts()) }

    const isBackgroundWeb = (() => {
      if (action.type !== 'web') return false
      const mode = String((action.payload || {}).mode || '').toLowerCase()
      // These web modes run headless and do not touch the user's foreground input.
      return (
        mode === 'flight_search' ||
        mode === 'flight_arbitrage' ||
        mode === 'text' ||
        mode === 'html' ||
        mode === 'title'
      )
    })()

    // Global kill switch: if paused, do not execute
    try {
      if (typeof (permissionManager as any).isPaused === 'function' && (permissionManager as any).isPaused()) {
        return { ok: false, error: 'paused_by_kill_switch' }
      }
    } catch { }

    // Dynamic blacklist: avoid hosts recently flagged by stealth policy
    try {
      if (action.type === 'http' || action.type === 'web') {
        const raw = String((action.payload || {}).url || '')
        try {
          const host = new URL(raw).hostname.toLowerCase()
          if (host && stealthPolicy.isBlacklisted(host)) {
            return { ok: false, error: 'host_blacklisted' }
          }
        } catch { }
      }
    } catch { }

    if (!allowedByPolicy(action, opt)) return { ok: false, error: 'blocked_by_sandbox_policy' }

    if (opt.simulate) return { ok: true, result: { simulated: true, action } }

    // User Priority Guardrail: avoid interfering with foreground input
    try {
      const needsIdle =
        action.type === 'process' ||
        action.type === 'powershell' ||
        action.type === 'app' ||
        action.type === 'ui' ||
        (action.type === 'web' && !isBackgroundWeb)

      if (needsIdle) {
        const idle = await waitForUserIdle(10000, 800)
        if (!idle) {
          return { ok: false, error: 'deferred_due_to_user_activity' }
        }
      }
    } catch { }

    // Ethics enforcement: allow | prompt | block
    try {
      const enforcement = ethics.enforceAction({ name: action.name, tags: action.tags, payload: action.payload })
      if (enforcement.decision === 'block') {
        try {
          messageBus.publish(makeEnvelope('PERCEPT', 'risk_detected', 'dai_executor', {
            category: enforcement.scan.categories,
            riskScore: enforcement.scan.score,
            severity: enforcement.scan.score >= 0.8 ? 'critical' : enforcement.scan.score >= 0.5 ? 'high' : 'medium',
            reason: 'ethics_block',
            detector: 'ethics.enforceAction',
            matchedRules: enforcement.scan.reasons,
            requiredLevel: 3,
          }, 5))
          publishSafety({
            riskScore: enforcement.scan.score,
            riskKinds: enforcement.scan.categories,
            severity: enforcement.scan.score >= 0.8 ? 'critical' : enforcement.scan.score >= 0.5 ? 'high' : 'medium',
            gatingRequired: true,
            recommended: 'block',
            explanation: 'ethics_block',
            detector: 'ethics.enforceAction',
            matchedRules: enforcement.scan.reasons,
            requiredLevel: 3,
            evidence: { from: 'input' }
          })
        } catch { }
        void ethics.logAudit({ type: 'ethics_block', action, scan: enforcement.scan })
        return { ok: false, error: 'blocked_by_ethics' }
      }
      if (enforcement.decision === 'prompt') {
        const prompt = permissionManager.createPrompt({
          level: 3,
          title: `Ethics review: ${action.name || action.type}`,
          rationale: `Ethical risk ${(enforcement.scan.score).toFixed(2)}. Categories: ${enforcement.scan.categories.join(', ')}`,
          options: ['approve', 'reject', 'delay'],
          meta: { action, ethics: enforcement.scan }
        })
        try {
          messageBus.publish(makeEnvelope('PERCEPT', 'risk_detected', 'dai_executor', {
            category: enforcement.scan.categories,
            riskScore: enforcement.scan.score,
            severity: enforcement.scan.score >= 0.8 ? 'critical' : enforcement.scan.score >= 0.5 ? 'high' : 'medium',
            reason: 'ethics_prompt',
            detector: 'ethics.enforceAction',
            matchedRules: enforcement.scan.reasons,
            requiredLevel: 3,
          }))
          publishSafety({
            riskScore: enforcement.scan.score,
            riskKinds: enforcement.scan.categories,
            severity: enforcement.scan.score >= 0.8 ? 'critical' : enforcement.scan.score >= 0.5 ? 'high' : 'medium',
            gatingRequired: true,
            recommended: 'challenge',
            explanation: 'ethics_prompt',
            detector: 'ethics.enforceAction',
            matchedRules: enforcement.scan.reasons,
            requiredLevel: 3,
            evidence: { from: 'input' }
          })
        } catch { }
        const d = await permissionManager.waitForDecision(prompt.id, 120000)
        void ethics.logAudit({ type: 'ethics_prompt_decision', decision: d, action, scan: enforcement.scan })
        if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
      }
    } catch { }

    // Spending cap guardrail for financial actions
    if (isFinancial(action) && !((action.payload || {}) as any).__approved) {
      const cap = spendingCapUSD()
      const amt = extractAmountUSD(action)
      const needsPrompt = amt == null || amt > cap
      if (needsPrompt) {
        const title = amt == null
          ? `Confirm: Financial action (cap $${cap.toFixed(2)})`
          : `Confirm: Spend $${amt.toFixed(2)} (cap $${cap.toFixed(2)})`
        const prompt = permissionManager.createPrompt({ level: 3, title, rationale: 'Financial guardrail: spending cap or unknown amount.', options: ['approve', 'reject', 'delay'], meta: { action, cap, amount: amt } })
        const d = await permissionManager.waitForDecision(prompt.id, 120000)
        if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
      }
    }

    // Gate high-impact actions
    if (isHighImpact(action) && !((action.payload || {}) as any).__approved) {
      try {
        messageBus.publish(makeEnvelope('PERCEPT', 'risk_detected', 'dai_executor', {
          category: ['manipulation'],
          riskScore: Math.max(0.8, action.riskLevel ?? 0.8),
          severity: 'high',
          reason: 'high_impact_gate',
          detector: 'dai.highImpact',
          requiredLevel: 3,
        }))
        publishSafety({
          riskScore: Math.max(0.8, action.riskLevel ?? 0.8),
          riskKinds: ['manipulation'],
          severity: 'high',
          gatingRequired: true,
          recommended: 'challenge',
          explanation: 'high_impact_gate',
          detector: 'dai.highImpact',
          requiredLevel: 3
        })
      } catch { }
      const prompt = permissionManager.createPrompt({ level: 3, title: `Confirm: ${action.name || action.type}`, rationale: `High-impact action. Risk ${(action.riskLevel ?? 0).toFixed(2)}.`, options: ['approve', 'reject', 'delay'], meta: { action } })
      const d = await permissionManager.waitForDecision(prompt.id, 120000)
      if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
    }

    // Apply SCRL-injected retry/delay policy for http/web
    const rule = retryPolicy.findForAction(action)
    const hostOf = () => {
      try {
        if ((action.type === 'http' || action.type === 'web') && action.payload?.url) return new URL(String(action.payload.url)).hostname.toLowerCase()
      } catch { }
      return null
    }
    const sleep = (ms: number) => new Promise(r => setTimeout(r, Math.max(0, Math.floor(ms))))
    const randBetween = (min: number, max: number) => {
      const a = Math.max(0, Math.min(min, max)); const b = Math.max(min, max); return a + Math.random() * (b - a)
    }
    const attempts = Math.max(1, Number(rule?.retry?.max ?? 1))
    if (rule?.randomizedDelayMs && action.type !== 'file' && action.type !== 'process' && action.type !== 'powershell' && action.type !== 'app') {
      try { await sleep(randBetween(rule.randomizedDelayMs[0], rule.randomizedDelayMs[1])) } catch { }
    }

    let execResult: ExecutionResult = { ok: false, error: 'not_executed' }
    for (let i = 0; i < attempts; i++) {
      if (i > 0) {
        const base = Number(rule?.retry?.backoffMs ?? 0)
        const j = Math.max(0, Math.min(1, Number(rule?.retry?.jitter ?? 0)))
        const factor = 1 + ((Math.random() * 2 - 1) * j)
        const delay = Math.max(0, Math.round(base * factor))
        if (delay > 0) { try { await sleep(delay) } catch { } }
        // Re-check user idle before the retry to avoid interrupting user
        try {
          if (action.type === 'web') {
            const idle = await waitForUserIdle(10000, 800)
            if (!idle) { execResult = { ok: false, error: 'deferred_due_to_user_activity' }; break }
          }
        } catch { }
      }

      execResult = await this.adapters.execute(action)
      // Record stealth signals for 429/captcha
      try {
        const host = hostOf()
        const status: any = (execResult as any)?.status
        if (host && Number(status) === 429) { stealthPolicy.record429(host) }
        if (host && execResult.error === 'captcha_detected') { stealthPolicy.recordCaptcha(host) }
      } catch { }

      if (execResult.ok) break
    }
    try { void ethics.logAudit({ type: 'dai_execute', action, result: execResult }) } catch { }
    return execResult
  }
}

export const daiSandbox = new DAISandbox()


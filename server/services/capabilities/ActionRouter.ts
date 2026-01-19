import { z } from 'zod'
import type { CapabilityContext, CapabilityRegistry, CapabilityRunOptions } from './CapabilityRegistry'
import { executeCapabilityByName } from './execute'

export type AgentCommandRequest = {
  text: string
  priority?: number
  simulate?: boolean
  sandbox?: {
    allowedHosts?: string[]
    allowProcess?: boolean
    allowPowershell?: boolean
    allowApp?: boolean
    allowUI?: boolean
  }
}

export class ActionRouter {
  private registry: CapabilityRegistry

  constructor(registry: CapabilityRegistry) {
    this.registry = registry
  }

  private parseFlightIntent(t: string): any | null {
    const text = String(t || '').toLowerCase()
    const base = text.match(/from\s+([a-z]{3})\s+to\s+([a-z]{3})/i)
    if (!base) return null
    const origin = base[1].toUpperCase()
    const destination = base[2].toUpperCase()

    const paxMatch = text.match(/\bfor\s+(\d{1,2})\b/i)
    const passengers = paxMatch ? Math.max(1, Math.min(9, parseInt(paxMatch[1], 10) || 1)) : 1

    const now = new Date()
    const months: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    }

    const toIso = (year: number, month: number, day: number) => {
      const y = String(year)
      const m = String(month).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const pickYear = (month: number, day: number, explicitYear?: number) => {
      if (explicitYear && Number.isFinite(explicitYear)) return explicitYear
      const y = now.getUTCFullYear()
      const candidate = new Date(Date.UTC(y, month - 1, day))
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      return candidate.getTime() < today.getTime() ? y + 1 : y
    }

    const parseMonthDate = (m: RegExpMatchArray | null) => {
      if (!m) return null
      const day = parseInt(m[2], 10)
      const monthName = String(m[3] || '').toLowerCase()
      const month = months[monthName]
      const explicitYear = m[4] ? parseInt(m[4], 10) : undefined
      if (!month || !Number.isFinite(day)) return null
      const year = pickYear(month, day, explicitYear)
      return toIso(year, month, day)
    }

    const depIso = text.match(/\b(on|from)\s+(\d{4}-\d{2}-\d{2})\b/i)
    const depText = text.match(/\b(on|from)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i)
    const departureDate = depIso ? depIso[2] : parseMonthDate(depText)
    if (!departureDate) return null

    const betweenIso = text.match(/\bbetween\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})\b/i)
    if (betweenIso) {
      return { origin, destination, departureDate, returnDateFrom: betweenIso[1], returnDateTo: betweenIso[2], passengers }
    }

    const betweenText = text.match(/\bbetween\s+(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i)
    if (betweenText) {
      const d1 = parseInt(betweenText[1], 10)
      const d2 = parseInt(betweenText[2], 10)
      const month = months[String(betweenText[3] || '').toLowerCase()]
      const explicitYear = betweenText[4] ? parseInt(betweenText[4], 10) : undefined
      if (month && Number.isFinite(d1) && Number.isFinite(d2)) {
        const y = pickYear(month, Math.min(d1, d2), explicitYear)
        const from = toIso(y, month, Math.min(d1, d2))
        const to = toIso(y, month, Math.max(d1, d2))
        return { origin, destination, departureDate, returnDateFrom: from, returnDateTo: to, passengers }
      }
    }

    const retIso = text.match(/\breturn\s+(\d{4}-\d{2}-\d{2})\b/i)
    if (retIso) {
      return { origin, destination, departureDate, returnDate: retIso[1], passengers }
    }

    return { origin, destination, departureDate, passengers }
  }

  private parseOpenApp(t: string): { path: string } | null {
    const m = String(t || '').match(/^\s*(open|launch)\s+(.+)$/i)
    if (!m) return null
    const app = String(m[2] || '').trim()
    if (!app) return null

    const known: Record<string, string> = {
      chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      notepad: 'C:\\Windows\\System32\\notepad.exe',
      explorer: 'C:\\Windows\\explorer.exe',
      cmd: 'C:\\Windows\\System32\\cmd.exe',
    }

    const key = app.toLowerCase()
    if (known[key]) return { path: known[key] }
    if (/\.exe\s*$/i.test(app)) return { path: app }
    return null
  }

  private parseWebRead(t: string): { mode: 'text' | 'html'; url: string; selector?: string } | null {
    const m = String(t || '').trim().match(/^\s*(read|text|html)\s+(https?:\/\/\S+)(?:\s+selector\s+(.+))?\s*$/i)
    if (!m) return null
    const kind = String(m[1] || '').toLowerCase()
    const url = String(m[2] || '').trim()
    const selector = m[3] ? String(m[3]).trim() : undefined
    const mode: 'text' | 'html' = kind === 'html' ? 'html' : 'text'
    return { mode, url, selector }
  }

  private parseHttp(t: string): { method: string; url: string } | null {
    const m = String(t || '').trim().match(/^\s*http\s+(get|post|put|delete|patch)\s+(https?:\/\/\S+)\s*$/i)
    if (!m) return null
    return { method: String(m[1]).toUpperCase(), url: String(m[2]).trim() }
  }

  private parsePowerShell(t: string): { script: string } | null {
    const m = String(t || '').trim().match(/^\s*(powershell|ps)\s+(.+)$/i)
    if (!m) return null
    return { script: String(m[2] || '').trim() }
  }

  private parseCmd(t: string): { command: string } | null {
    const m = String(t || '').trim().match(/^\s*(cmd|run)\s+(.+)$/i)
    if (!m) return null
    return { command: String(m[2] || '').trim() }
  }

  async handle(ctx: CapabilityContext, req: AgentCommandRequest) {
    const text = String(req.text || '').trim()
    if (!text) return { ok: false, error: 'empty_command' }

    const opt: CapabilityRunOptions = {
      simulate: !!req.simulate,
      sandbox: req.sandbox || {},
    }

    const flightIntent = this.parseFlightIntent(text)
    if (flightIntent) {
      const out = await executeCapabilityByName(ctx, {
        name: 'flights.search',
        input: { ...flightIntent, currency: 'GBP', limit: 50 },
        simulate: !!req.simulate,
        sandbox: req.sandbox,
      })
      return out.ok ? { ok: true, mode: 'capability', ...out } : out
    }

    const web = this.parseWebRead(text)
    if (web) {
      const capName = web.mode === 'html' ? 'web.read_html' : 'web.read_text'
      const out = await executeCapabilityByName(ctx, {
        name: capName,
        input: { url: web.url, selector: web.selector },
        simulate: !!req.simulate,
        sandbox: req.sandbox,
      })
      return out.ok ? { ok: true, mode: 'capability', ...out } : out
    }

    const http = this.parseHttp(text)
    if (http) {
      const out = await executeCapabilityByName(ctx, {
        name: 'http.request',
        input: { url: http.url, method: http.method },
        simulate: !!req.simulate,
        sandbox: req.sandbox,
      })
      return out.ok ? { ok: true, mode: 'capability', ...out } : out
    }

    const ps = this.parsePowerShell(text)
    if (ps) {
      const out = await executeCapabilityByName(ctx, {
        name: 'powershell.run',
        input: { script: ps.script },
        simulate: !!req.simulate,
        sandbox: req.sandbox,
      })
      return out.ok ? { ok: true, mode: 'capability', ...out } : out
    }

    const cmd = this.parseCmd(text)
    if (cmd) {
      const out = await executeCapabilityByName(ctx, {
        name: 'process.run',
        input: { command: cmd.command },
        simulate: !!req.simulate,
        sandbox: req.sandbox,
      })
      return out.ok ? { ok: true, mode: 'capability', ...out } : out
    }

    const open = this.parseOpenApp(text)
    if (open) {
      const out = await executeCapabilityByName(ctx, {
        name: 'app.launch',
        input: { path: open.path },
        simulate: !!req.simulate,
        sandbox: req.sandbox,
      })
      return out.ok ? { ok: true, mode: 'capability', ...out } : out
    }

    const out = await ctx.bdiCore.submitDesire({
      userText: text,
      priority: req.priority,
      simulate: !!req.simulate,
      sandbox: req.sandbox,
    })

    return { ok: true, mode: 'planner', ...out }
  }
}

export const AgentCommandSchema = z.object({
  text: z.string().optional(),
  transcript: z.string().optional(),
  priority: z.number().min(1).max(10).optional(),
  simulate: z.boolean().optional(),
  sandbox: z
    .object({
      allowedHosts: z.array(z.string()).optional(),
      allowProcess: z.boolean().optional(),
      allowPowershell: z.boolean().optional(),
      allowApp: z.boolean().optional(),
      allowUI: z.boolean().optional(),
    })
    .optional(),
}).transform((v) => {
  const text = (v.text || v.transcript || '').toString()
  return { ...v, text }
}).refine((v) => typeof (v as any).text === 'string' && String((v as any).text).trim().length > 0, {
  message: 'text_required',
})

import { EventEmitter } from 'events'

export type StealthHostState = {
  host: string
  captchaCount: number
  last429At: number | null
  blockedUntil: number | null
}

function now() { return Date.now() }

class StealthPolicy extends EventEmitter {
  private hosts = new Map<string, StealthHostState>()

  private getOrCreate(host: string): StealthHostState {
    const h = host.toLowerCase()
    let st = this.hosts.get(h)
    if (!st) { st = { host: h, captchaCount: 0, last429At: null, blockedUntil: null }; this.hosts.set(h, st) }
    return st
  }

  isBlacklisted(host: string): boolean {
    const st = this.hosts.get(String(host || '').toLowerCase())
    if (!st) return false
    const bu = typeof st.blockedUntil === 'number' ? st.blockedUntil : 0
    return bu > now()
  }

  blacklist(host: string, ms = 24 * 60 * 60 * 1000): StealthHostState {
    const st = this.getOrCreate(host)
    st.blockedUntil = now() + Math.max(60000, Math.min(ms, 30 * 24 * 60 * 60 * 1000))
    this.emit('update', { host: st.host, blockedUntil: st.blockedUntil })
    return st
  }

  remove(host: string): StealthHostState | null {
    const st = this.hosts.get(String(host || '').toLowerCase())
    if (!st) return null
    st.blockedUntil = null
    this.emit('update', { host: st.host, blockedUntil: st.blockedUntil })
    return st
  }

  recordCaptcha(host: string): StealthHostState {
    const st = this.getOrCreate(host)
    st.captchaCount = Math.max(0, (st.captchaCount || 0)) + 1
    const base = 6 * 60 * 60 * 1000
    const mult = Math.min(8, st.captchaCount)
    st.blockedUntil = now() + base * mult
    this.emit('captcha', { host: st.host, count: st.captchaCount, blockedUntil: st.blockedUntil })
    return st
  }

  record429(host: string): StealthHostState {
    const st = this.getOrCreate(host)
    st.last429At = now()
    const cool = 10 * 60 * 1000
    st.blockedUntil = Math.max(now() + cool, st.blockedUntil || 0)
    this.emit('rate_limit', { host: st.host, last429At: st.last429At, blockedUntil: st.blockedUntil })
    return st
  }

  status(): { entries: StealthHostState[]; now: number } {
    return { entries: Array.from(this.hosts.values()).sort((a, b) => (b.blockedUntil || 0) - (a.blockedUntil || 0)), now: now() }
  }
}

export const stealthPolicy = new StealthPolicy()

import { StoredToken } from '../ConnectorVault'

function now() { return Date.now() }

function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(dateIso)
  if (isNaN(d.getTime())) return dateIso
  const out = new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
  return out.toISOString()
}

function ymdAddDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`)
  if (isNaN(d.getTime())) return ymd
  const out = new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
  const y = out.getUTCFullYear()
  const m = String(out.getUTCMonth() + 1).padStart(2, '0')
  const da = String(out.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

function ensureEnv(name: string): string {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`missing_env_${name}`)
  return v
}

function buildRedirectUri(): string {
  const explicit = String(process.env.GOOGLE_REDIRECT_URI || '').trim()
  if (explicit) return explicit
  const port = Number(process.env.SERVER_PORT || 3001)
  const base = String(process.env.CONNECTOR_BASE_URL || `http://localhost:${port}`)
  return `${base.replace(/\/$/, '')}/api/connectors/callback/google`
}

function qs(params: Record<string, any>): string {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    out.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

async function postForm(url: string, form: Record<string, any>): Promise<any> {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) body.set(k, String(v))
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const err = (data && (data.error_description || data.error)) ? String(data.error_description || data.error) : `http_${resp.status}`
    throw new Error(`google_token_exchange_failed:${err}`)
  }
  return data
}

type Interval = { startMs: number; endMs: number }

function toMs(v: any): number | null {
  if (!v) return null
  const s = String(v)
  const d = new Date(s)
  const ms = d.getTime()
  return Number.isFinite(ms) ? ms : null
}

function normalizeIntervals(items: any[], windowStart: number, windowEnd: number): Interval[] {
  const out: Interval[] = []
  for (const ev of items || []) {
    const start = ev?.start?.dateTime || ev?.start?.date
    const end = ev?.end?.dateTime || ev?.end?.date
    const sMs = toMs(start)
    const eMs = toMs(end)
    if (sMs == null || eMs == null) continue
    const a = Math.max(windowStart, sMs)
    const b = Math.min(windowEnd, eMs)
    if (b > a) out.push({ startMs: a, endMs: b })
  }
  out.sort((a, b) => a.startMs - b.startMs)

  const merged: Interval[] = []
  for (const it of out) {
    const last = merged[merged.length - 1]
    if (!last || it.startMs > last.endMs) {
      merged.push({ ...it })
    } else {
      last.endMs = Math.max(last.endMs, it.endMs)
    }
  }
  return merged
}

function findFreeSlots(busy: Interval[], windowStart: number, windowEnd: number, durationMs: number, limit = 5): Array<{ start: string; end: string }>{
  const slots: Array<{ start: string; end: string }> = []
  let cursor = windowStart
  for (const it of busy) {
    if (cursor + durationMs <= it.startMs) {
      slots.push({ start: new Date(cursor).toISOString(), end: new Date(cursor + durationMs).toISOString() })
      if (slots.length >= limit) return slots
    }
    cursor = Math.max(cursor, it.endMs)
  }
  if (cursor + durationMs <= windowEnd) {
    slots.push({ start: new Date(cursor).toISOString(), end: new Date(cursor + durationMs).toISOString() })
  }
  return slots
}

async function apiJson(method: string, url: string, accessToken: string, body?: any): Promise<any> {
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const msg = (data && (data.error?.message || data.error_description || data.error))
      ? String(data.error?.message || data.error_description || data.error)
      : `http_${resp.status}`
    throw new Error(`google_api_failed:${msg}`)
  }
  return data
}

export class GoogleProvider {
  readonly id = 'google'
  readonly name = 'Google'

  getDefaultScopes(): string[] {
    return [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
    ]
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const clientId = ensureEnv('GOOGLE_CLIENT_ID')
    const redirectUri = buildRedirectUri()
    const scope = (opts.scopes && opts.scopes.length ? opts.scopes : this.getDefaultScopes()).join(' ')

    const base = 'https://accounts.google.com/o/oauth2/v2/auth'
    const query = qs({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: opts.state,
    })
    return `${base}?${query}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const clientId = ensureEnv('GOOGLE_CLIENT_ID')
    const clientSecret = ensureEnv('GOOGLE_CLIENT_SECRET')
    const redirectUri = buildRedirectUri()

    const data = await postForm('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const expiresIn = Number(data.expires_in || 0)
    const expiresAt = expiresIn > 0 ? (now() + expiresIn * 1000 - 60_000) : undefined

    return {
      accessToken: String(data.access_token || ''),
      refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
      scope: data.scope ? String(data.scope) : undefined,
      tokenType: data.token_type ? String(data.token_type) : undefined,
      idToken: data.id_token ? String(data.id_token) : undefined,
      expiresAt,
      raw: data,
    }
  }

  async refresh(refreshToken: string): Promise<StoredToken> {
    const clientId = ensureEnv('GOOGLE_CLIENT_ID')
    const clientSecret = ensureEnv('GOOGLE_CLIENT_SECRET')

    const data = await postForm('https://oauth2.googleapis.com/token', {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    })

    const expiresIn = Number(data.expires_in || 0)
    const expiresAt = expiresIn > 0 ? (now() + expiresIn * 1000 - 60_000) : undefined

    return {
      accessToken: String(data.access_token || ''),
      refreshToken,
      scope: data.scope ? String(data.scope) : undefined,
      tokenType: data.token_type ? String(data.token_type) : undefined,
      expiresAt,
      raw: data,
    }
  }

  async executeOperation(token: StoredToken, operation: string, params: any): Promise<any> {
    const op = String(operation || '').trim()
    if (!token?.accessToken) throw new Error('not_connected')

    if (op === 'calendar.findFreeSlots') {
      const timeMin = params?.timeMin ? String(params.timeMin) : new Date().toISOString()
      const timeMax = params?.timeMax ? String(params.timeMax) : addDaysIso(timeMin, 7)
      const durationMinutes = params?.durationMinutes ? Number(params.durationMinutes) : 120
      const maxSlots = params?.maxSlots ? Number(params.maxSlots) : 5

      const windowStart = toMs(timeMin)
      const windowEnd = toMs(timeMax)
      if (windowStart == null || windowEnd == null || windowEnd <= windowStart) throw new Error('invalid_time_window')

      const list = await this.executeOperation(token, 'calendar.listEvents', { timeMin, timeMax, maxResults: 250 })
      const items = Array.isArray(list?.items) ? list.items : []
      const busy = normalizeIntervals(items, windowStart, windowEnd)
      const durationMs = Math.max(15, durationMinutes) * 60 * 1000
      const slots = findFreeSlots(busy, windowStart, windowEnd, durationMs, Math.max(1, maxSlots))
      return { timeMin, timeMax, durationMinutes, busyCount: busy.length, slots }
    }

    if (op === 'calendar.createFocusBlockFirstFreeSlot') {
      const timeMin = params?.timeMin ? String(params.timeMin) : new Date().toISOString()
      const timeMax = params?.timeMax ? String(params.timeMax) : addDaysIso(timeMin, 7)
      const title = params?.title ? String(params.title) : 'Focus Time'
      const durationMinutes = params?.durationMinutes ? Number(params.durationMinutes) : 120
      const idempotencyKey = params?.idempotencyKey ? String(params.idempotencyKey) : ''

      const free = await this.executeOperation(token, 'calendar.findFreeSlots', { timeMin, timeMax, durationMinutes, maxSlots: 10 })
      const slots: Array<{ start: string; end: string }> = Array.isArray(free?.slots) ? free.slots : []
      if (!slots.length) return { ok: false, error: 'no_free_slot_found', free }

      const list = await this.executeOperation(token, 'calendar.listEvents', { timeMin, timeMax, maxResults: 250 })
      const items = Array.isArray(list?.items) ? list.items : []
      const already = items.find((ev: any) => {
        const summary = String(ev?.summary || '')
        if (summary !== title) return false
        const k = String(ev?.extendedProperties?.private?.jasonKey || '')
        return idempotencyKey ? k === idempotencyKey : true
      })
      if (already) return { ok: true, created: false, existingEventId: String(already.id || ''), free }

      const slot = slots[0]
      const event = {
        summary: title,
        start: { dateTime: slot.start },
        end: { dateTime: slot.end },
        extendedProperties: idempotencyKey ? { private: { jasonKey: idempotencyKey } } : undefined,
      }
      const created = await this.executeOperation(token, 'calendar.createEvent', { event })
      return { ok: true, created: true, slot, eventId: created?.id, createdEvent: created }
    }

    if (op === 'calendar.blockTravelRange') {
      const departureDate = params?.departureDate ? String(params.departureDate) : ''
      const returnDate = params?.returnDate ? String(params.returnDate) : ''
      const title = params?.title ? String(params.title) : 'Travel'
      if (!departureDate) throw new Error('departureDate_required')
      const endExclusive = returnDate ? ymdAddDays(returnDate, 1) : ymdAddDays(departureDate, 1)
      const event = {
        summary: title,
        start: { date: departureDate },
        end: { date: endExclusive },
      }
      const created = await this.executeOperation(token, 'calendar.createEvent', { event })
      return { ok: true, eventId: created?.id, createdEvent: created }
    }

    if (op === 'calendar.listEvents') {
      const timeMin = params?.timeMin ? String(params.timeMin) : new Date().toISOString()
      const timeMax = params?.timeMax ? String(params.timeMax) : undefined
      const maxResults = params?.maxResults ? Number(params.maxResults) : 50
      const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
      const url = `${base}?${qs({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults,
      })}`
      return apiJson('GET', url, token.accessToken)
    }

    if (op === 'calendar.createEvent') {
      const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
      const body = params?.event || params
      if (!body || typeof body !== 'object') throw new Error('invalid_event')
      return apiJson('POST', base, token.accessToken, body)
    }

    if (op === 'calendar.patchEvent') {
      const eventId = params?.eventId ? String(params.eventId) : ''
      const patch = params?.patch
      if (!eventId) throw new Error('eventId_required')
      if (!patch || typeof patch !== 'object') throw new Error('invalid_patch')
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`
      return apiJson('PATCH', url, token.accessToken, patch)
    }

    if (op === 'gmail.listMessages') {
      const q = params?.q ? String(params.q) : undefined
      const maxResults = params?.maxResults ? Number(params.maxResults) : 25
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${qs({ q, maxResults })}`
      return apiJson('GET', url, token.accessToken)
    }

    if (op === 'gmail.getMessage') {
      const id = params?.id ? String(params.id) : ''
      if (!id) throw new Error('id_required')
      const format = params?.format ? String(params.format) : 'metadata'
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?${qs({ format })}`
      return apiJson('GET', url, token.accessToken)
    }

    if (op === 'gmail.send') {
      const raw = params?.raw ? String(params.raw) : ''
      if (!raw) throw new Error('raw_required')
      const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
      return apiJson('POST', url, token.accessToken, { raw })
    }

    throw new Error(`unsupported_operation:${op}`)
  }
}

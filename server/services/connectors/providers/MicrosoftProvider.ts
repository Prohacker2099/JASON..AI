import { StoredToken } from '../ConnectorVault'

function ensureEnv(name: string): string {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`missing_env_${name}`)
  return v
}

function buildRedirectUri(): string {
  const explicit = String(process.env.MS_REDIRECT_URI || '').trim()
  if (explicit) return explicit
  const port = Number(process.env.SERVER_PORT || 3001)
  const base = String(process.env.CONNECTOR_BASE_URL || `http://localhost:${port}`)
  return `${base.replace(/\/$/, '')}/api/connectors/callback/microsoft`
}

function tenant(): string {
  return String(process.env.MS_TENANT || 'common').trim() || 'common'
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
    throw new Error(`ms_token_exchange_failed:${err}`)
  }
  return data
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
    throw new Error(`ms_api_failed:${msg}`)
  }
  return data
}

function now() { return Date.now() }

export class MicrosoftProvider {
  readonly id = 'microsoft'
  readonly name = 'Microsoft (Outlook/Calendar)'

  getDefaultScopes(): string[] {
    return [
      'offline_access',
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/Calendars.ReadWrite',
    ]
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const clientId = ensureEnv('MS_CLIENT_ID')
    const redirectUri = buildRedirectUri()
    const scope = (opts.scopes && opts.scopes.length ? opts.scopes : this.getDefaultScopes()).join(' ')

    const base = `https://login.microsoftonline.com/${encodeURIComponent(tenant())}/oauth2/v2.0/authorize`
    const query = qs({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope,
      state: opts.state,
      prompt: 'select_account',
    })

    return `${base}?${query}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const clientId = ensureEnv('MS_CLIENT_ID')
    const clientSecret = ensureEnv('MS_CLIENT_SECRET')
    const redirectUri = buildRedirectUri()

    const url = `https://login.microsoftonline.com/${encodeURIComponent(tenant())}/oauth2/v2.0/token`
    const data = await postForm(url, {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    })

    const expiresIn = Number(data.expires_in || 0)
    const expiresAt = expiresIn > 0 ? (now() + expiresIn * 1000 - 60_000) : undefined

    return {
      accessToken: String(data.access_token || ''),
      refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
      scope: data.scope ? String(data.scope) : undefined,
      tokenType: data.token_type ? String(data.token_type) : undefined,
      expiresAt,
      raw: data,
    }
  }

  async refresh(refreshToken: string): Promise<StoredToken> {
    const clientId = ensureEnv('MS_CLIENT_ID')
    const clientSecret = ensureEnv('MS_CLIENT_SECRET')

    const url = `https://login.microsoftonline.com/${encodeURIComponent(tenant())}/oauth2/v2.0/token`
    const data = await postForm(url, {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
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

    if (op === 'me') {
      return apiJson('GET', 'https://graph.microsoft.com/v1.0/me', token.accessToken)
    }

    if (op === 'calendar.listEvents') {
      const startDateTime = params?.startDateTime ? String(params.startDateTime) : new Date().toISOString()
      const endDateTime = params?.endDateTime ? String(params.endDateTime) : new Date(Date.now() + 7 * 86400000).toISOString()
      const url = `https://graph.microsoft.com/v1.0/me/calendarview?${qs({ startDateTime, endDateTime, '$top': 50, '$orderby': 'start/dateTime' })}`
      return apiJson('GET', url, token.accessToken)
    }

    if (op === 'calendar.createEvent') {
      const body = params?.event || params
      if (!body || typeof body !== 'object') throw new Error('invalid_event')
      return apiJson('POST', 'https://graph.microsoft.com/v1.0/me/events', token.accessToken, body)
    }

    if (op === 'mail.listMessages') {
      const top = params?.top ? Number(params.top) : 25
      const url = `https://graph.microsoft.com/v1.0/me/messages?${qs({ '$top': top, '$orderby': 'receivedDateTime DESC' })}`
      return apiJson('GET', url, token.accessToken)
    }

    if (op === 'mail.send') {
      const message = params?.message
      if (!message || typeof message !== 'object') throw new Error('message_required')
      const saveToSentItems = params?.saveToSentItems === false ? false : true
      return apiJson('POST', 'https://graph.microsoft.com/v1.0/me/sendMail', token.accessToken, { message, saveToSentItems })
    }

    throw new Error(`unsupported_operation:${op}`)
  }
}

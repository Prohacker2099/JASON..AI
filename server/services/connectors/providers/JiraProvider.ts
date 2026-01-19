import { StoredToken } from '../ConnectorVault'

function ensureEnv(name: string): string {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`missing_env_${name}`)
  return v
}

function buildRedirectUri(): string {
  const explicit = String(process.env.JIRA_REDIRECT_URI || '').trim()
  if (explicit) return explicit
  const port = Number(process.env.SERVER_PORT || 3001)
  const base = String(process.env.CONNECTOR_BASE_URL || `http://localhost:${port}`)
  return `${base.replace(/\/$/, '')}/api/connectors/callback/jira`
}

function qs(params: Record<string, any>): string {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    out.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

async function postJson(url: string, body: any): Promise<any> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body || {}),
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const msg = (data && (data.error_description || data.error || data.message))
      ? String(data.error_description || data.error || data.message)
      : `http_${resp.status}`
    throw new Error(`jira_request_failed:${msg}`)
  }
  return data
}

async function apiJson(method: string, url: string, accessToken: string, body?: any): Promise<any> {
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const msg = (data && (data.errorMessages?.[0] || data.message || data.error))
      ? String(data.errorMessages?.[0] || data.message || data.error)
      : `http_${resp.status}`
    throw new Error(`jira_api_failed:${msg}`)
  }
  return data
}

export class JiraProvider {
  readonly id = 'jira'
  readonly name = 'Jira (Atlassian)'

  getDefaultScopes(): string[] {
    return ['read:jira-user', 'read:jira-work', 'write:jira-work', 'offline_access']
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const clientId = ensureEnv('JIRA_CLIENT_ID')
    const redirectUri = buildRedirectUri()
    const scope = (opts.scopes && opts.scopes.length ? opts.scopes : this.getDefaultScopes()).join(' ')

    const base = 'https://auth.atlassian.com/authorize'
    const query = qs({
      audience: 'api.atlassian.com',
      client_id: clientId,
      scope,
      redirect_uri: redirectUri,
      state: opts.state,
      response_type: 'code',
      prompt: 'consent',
    })

    return `${base}?${query}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const clientId = ensureEnv('JIRA_CLIENT_ID')
    const clientSecret = ensureEnv('JIRA_CLIENT_SECRET')
    const redirectUri = buildRedirectUri()

    const data = await postJson('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    })

    return {
      accessToken: String(data.access_token || ''),
      refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
      scope: data.scope ? String(data.scope) : undefined,
      tokenType: data.token_type ? String(data.token_type) : undefined,
      expiresAt: typeof data.expires_in === 'number' ? (Date.now() + Number(data.expires_in) * 1000 - 60_000) : undefined,
      raw: data,
    }
  }

  async refresh(refreshToken: string): Promise<StoredToken> {
    const clientId = ensureEnv('JIRA_CLIENT_ID')
    const clientSecret = ensureEnv('JIRA_CLIENT_SECRET')

    const data = await postJson('https://auth.atlassian.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    })

    return {
      accessToken: String(data.access_token || ''),
      refreshToken,
      scope: data.scope ? String(data.scope) : undefined,
      tokenType: data.token_type ? String(data.token_type) : undefined,
      expiresAt: typeof data.expires_in === 'number' ? (Date.now() + Number(data.expires_in) * 1000 - 60_000) : undefined,
      raw: data,
    }
  }

  private async cloudId(token: StoredToken): Promise<string> {
    const cached = (token as any)?.raw?.cloudId
    if (cached) return String(cached)
    const data = await apiJson('GET', 'https://api.atlassian.com/oauth/token/accessible-resources', token.accessToken)
    const first = Array.isArray(data) ? data[0] : null
    if (!first?.id) throw new Error('jira_no_accessible_resources')
    return String(first.id)
  }

  async executeOperation(token: StoredToken, operation: string, params: any): Promise<any> {
    const op = String(operation || '').trim()
    if (!token?.accessToken) throw new Error('not_connected')

    if (op === 'resources.list') {
      return apiJson('GET', 'https://api.atlassian.com/oauth/token/accessible-resources', token.accessToken)
    }

    const cloudId = params?.cloudId ? String(params.cloudId) : await this.cloudId(token)

    if (op === 'issues.search') {
      const jql = params?.jql ? String(params.jql) : 'order by created DESC'
      const url = `https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/search`
      return apiJson('POST', url, token.accessToken, { jql, maxResults: 50 })
    }

    if (op === 'issues.create') {
      const url = `https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue`
      const fields = params?.fields
      if (!fields || typeof fields !== 'object') throw new Error('fields_required')
      return apiJson('POST', url, token.accessToken, { fields })
    }

    throw new Error(`unsupported_operation:${op}`)
  }
}

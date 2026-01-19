import { StoredToken } from '../ConnectorVault'

function ensureEnv(name: string): string {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`missing_env_${name}`)
  return v
}

function buildRedirectUri(): string {
  const explicit = String(process.env.NOTION_REDIRECT_URI || '').trim()
  if (explicit) return explicit
  const port = Number(process.env.SERVER_PORT || 3001)
  const base = String(process.env.CONNECTOR_BASE_URL || `http://localhost:${port}`)
  return `${base.replace(/\/$/, '')}/api/connectors/callback/notion`
}

function qs(params: Record<string, any>): string {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    out.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

function basicAuth(id: string, secret: string): string {
  return Buffer.from(`${id}:${secret}`).toString('base64')
}

async function postJson(url: string, body: any, headers?: Record<string, string>): Promise<any> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(body || {}),
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const msg = (data && (data.message || data.error_description || data.error))
      ? String(data.message || data.error_description || data.error)
      : `http_${resp.status}`
    throw new Error(`notion_request_failed:${msg}`)
  }
  return data
}

async function apiJson(method: string, url: string, accessToken: string, body?: any): Promise<any> {
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': String(process.env.NOTION_VERSION || '2022-06-28'),
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const msg = (data && (data.message || data.error_description || data.error))
      ? String(data.message || data.error_description || data.error)
      : `http_${resp.status}`
    throw new Error(`notion_api_failed:${msg}`)
  }
  return data
}

export class NotionProvider {
  readonly id = 'notion'
  readonly name = 'Notion'

  getDefaultScopes(): string[] {
    return []
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const clientId = ensureEnv('NOTION_CLIENT_ID')
    const redirectUri = buildRedirectUri()
    const base = 'https://api.notion.com/v1/oauth/authorize'
    const query = qs({
      client_id: clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: redirectUri,
      state: opts.state,
    })
    return `${base}?${query}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const clientId = ensureEnv('NOTION_CLIENT_ID')
    const clientSecret = ensureEnv('NOTION_CLIENT_SECRET')
    const redirectUri = buildRedirectUri()

    const data = await postJson('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }, {
      Authorization: `Basic ${basicAuth(clientId, clientSecret)}`,
    })

    return {
      accessToken: String(data.access_token || ''),
      tokenType: data.token_type ? String(data.token_type) : undefined,
      raw: data,
    }
  }

  async refresh(_refreshToken: string): Promise<StoredToken> {
    throw new Error('refresh_not_supported')
  }

  async executeOperation(token: StoredToken, operation: string, params: any): Promise<any> {
    const op = String(operation || '').trim()
    if (!token?.accessToken) throw new Error('not_connected')

    if (op === 'search') {
      const query = params?.query ? String(params.query) : undefined
      return apiJson('POST', 'https://api.notion.com/v1/search', token.accessToken, { query })
    }

    if (op === 'pages.create') {
      const body = params?.page || params
      if (!body || typeof body !== 'object') throw new Error('invalid_page')
      return apiJson('POST', 'https://api.notion.com/v1/pages', token.accessToken, body)
    }

    if (op === 'databases.query') {
      const databaseId = params?.databaseId ? String(params.databaseId) : ''
      const filter = params?.filter
      if (!databaseId) throw new Error('databaseId_required')
      return apiJson('POST', `https://api.notion.com/v1/databases/${encodeURIComponent(databaseId)}/query`, token.accessToken, filter ? { filter } : {})
    }

    throw new Error(`unsupported_operation:${op}`)
  }
}

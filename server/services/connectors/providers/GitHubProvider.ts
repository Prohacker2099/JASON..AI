import { StoredToken } from '../ConnectorVault'

function ensureEnv(name: string): string {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`missing_env_${name}`)
  return v
}

function buildRedirectUri(): string {
  const explicit = String(process.env.GITHUB_REDIRECT_URI || '').trim()
  if (explicit) return explicit
  const port = Number(process.env.SERVER_PORT || 3001)
  const base = String(process.env.CONNECTOR_BASE_URL || `http://localhost:${port}`)
  return `${base.replace(/\/$/, '')}/api/connectors/callback/github`
}

function qs(params: Record<string, any>): string {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    out.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

async function postJson(url: string, body: any, headers?: Record<string,string>): Promise<any> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(body || {}),
  })
  const txt = await resp.text()
  let data: any
  try { data = JSON.parse(txt) } catch { data = { raw: txt } }
  if (!resp.ok) {
    const err = (data && (data.error_description || data.error)) ? String(data.error_description || data.error) : `http_${resp.status}`
    throw new Error(`github_token_exchange_failed:${err}`)
  }
  return data
}

async function apiJson(method: string, url: string, accessToken: string, body?: any): Promise<any> {
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
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
    throw new Error(`github_api_failed:${msg}`)
  }
  return data
}

export class GitHubProvider {
  readonly id = 'github'
  readonly name = 'GitHub'

  getDefaultScopes(): string[] {
    return ['read:user', 'repo']
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const clientId = ensureEnv('GITHUB_CLIENT_ID')
    const redirectUri = buildRedirectUri()
    const scope = (opts.scopes && opts.scopes.length ? opts.scopes : this.getDefaultScopes()).join(' ')

    const base = 'https://github.com/login/oauth/authorize'
    const query = qs({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state: opts.state,
      allow_signup: 'true',
    })
    return `${base}?${query}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const clientId = ensureEnv('GITHUB_CLIENT_ID')
    const clientSecret = ensureEnv('GITHUB_CLIENT_SECRET')
    const redirectUri = buildRedirectUri()

    const data = await postJson('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    })

    return {
      accessToken: String(data.access_token || ''),
      scope: data.scope ? String(data.scope) : undefined,
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

    if (op === 'user.me') {
      return apiJson('GET', 'https://api.github.com/user', token.accessToken)
    }

    if (op === 'repos.list') {
      const perPage = params?.perPage ? Number(params.perPage) : 50
      const page = params?.page ? Number(params.page) : 1
      const url = `https://api.github.com/user/repos?${qs({ per_page: perPage, page, sort: 'updated' })}`
      return apiJson('GET', url, token.accessToken)
    }

    if (op === 'issues.create') {
      const owner = params?.owner ? String(params.owner) : ''
      const repo = params?.repo ? String(params.repo) : ''
      const title = params?.title ? String(params.title) : ''
      const body = params?.body ? String(params.body) : undefined
      if (!owner || !repo || !title) throw new Error('owner_repo_title_required')
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`
      return apiJson('POST', url, token.accessToken, { title, body })
    }

    throw new Error(`unsupported_operation:${op}`)
  }
}

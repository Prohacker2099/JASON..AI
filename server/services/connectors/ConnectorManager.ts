import jwt from 'jsonwebtoken'
import { connectorVault, type StoredToken } from './ConnectorVault'
import { GoogleProvider } from './providers/GoogleProvider'
import { GitHubProvider } from './providers/GitHubProvider'
import { MicrosoftProvider } from './providers/MicrosoftProvider'
import { NotionProvider } from './providers/NotionProvider'
import { JiraProvider } from './providers/JiraProvider'
import { SlackProvider } from './providers/SlackProvider'
import { WhatsAppProvider } from './providers/WhatsAppProvider'
import { OutlookProvider } from './providers/OutlookProvider'

export type ConnectorProvider = {
  id: string
  name: string
  getDefaultScopes(): string[]
  getAuthUrl(opts: { state: string; scopes?: string[] }): string
  exchangeCode(code: string): Promise<StoredToken>
  refresh(refreshToken: string): Promise<StoredToken>
  executeOperation(token: StoredToken, operation: string, params: any): Promise<any>
}

export type ConnectorState = {
  v: 1
  uid: string
  pid: string
  nonce: string
}

function now() { return Date.now() }

export class ConnectorManager {
  private providers = new Map<string, ConnectorProvider>()

  constructor() {
    this.register(new GoogleProvider())
    this.register(new MicrosoftProvider())
    this.register(new GitHubProvider())
    this.register(new NotionProvider())
    this.register(new JiraProvider())
    this.register(new SlackProvider())
    this.register(new WhatsAppProvider())
    this.register(new OutlookProvider())
  }

  register(p: ConnectorProvider) {
    this.providers.set(p.id, p)
  }

  listProviders(): Array<{ id: string; name: string }> {
    return Array.from(this.providers.values()).map(p => ({ id: p.id, name: p.name }))
  }

  getProvider(id: string): ConnectorProvider {
    const pid = String(id || '').trim()
    const p = this.providers.get(pid)
    if (!p) throw new Error('provider_not_found')
    return p
  }

  private jwtSecret(): string {
    return String(process.env.JWT_SECRET || 'change_me')
  }

  async createAuthUrl(input: { userId: string; providerId: string; scopes?: string[] }): Promise<{ url: string; state: string }>{
    const uid = String(input.userId || '').trim()
    const pid = String(input.providerId || '').trim()
    if (!uid) throw new Error('user_required')
    if (!pid) throw new Error('provider_required')

    const provider = this.getProvider(pid)
    const nonce = await connectorVault.issueNonce()

    const payload: ConnectorState = { v: 1, uid, pid, nonce }
    const state = jwt.sign(payload, this.jwtSecret(), { expiresIn: '10m' })

    const url = provider.getAuthUrl({ state, scopes: input.scopes })
    return { url, state }
  }

  verifyState(state: string): ConnectorState {
    const raw = String(state || '').trim()
    if (!raw) throw new Error('state_required')
    const decoded = jwt.verify(raw, this.jwtSecret()) as any
    if (!decoded || decoded.v !== 1) throw new Error('invalid_state')
    if (!decoded.uid || !decoded.pid || !decoded.nonce) throw new Error('invalid_state')
    return { v: 1, uid: String(decoded.uid), pid: String(decoded.pid), nonce: String(decoded.nonce) }
  }

  async handleOAuthCallback(input: { providerId: string; code: string; state: string }): Promise<{ ok: boolean; userId: string; providerId: string }> {
    const pid = String(input.providerId || '').trim()
    const code = String(input.code || '').trim()
    const state = String(input.state || '').trim()
    if (!pid) throw new Error('provider_required')
    if (!code) throw new Error('code_required')
    if (!state) throw new Error('state_required')

    const st = this.verifyState(state)
    if (st.pid !== pid) throw new Error('provider_state_mismatch')

    const provider = this.getProvider(pid)
    const token = await provider.exchangeCode(code)
    if (!token.accessToken) throw new Error('token_missing_access_token')

    await connectorVault.setToken(st.uid, pid, token)
    return { ok: true, userId: st.uid, providerId: pid }
  }

  private async ensureFreshToken(userId: string, providerId: string): Promise<StoredToken> {
    const token = await connectorVault.getToken(userId, providerId)
    if (!token) throw new Error('not_connected')

    const exp = token.expiresAt
    if (typeof exp === 'number' && exp > 0 && now() > exp) {
      if (!token.refreshToken) throw new Error('token_expired_no_refresh')
      const provider = this.getProvider(providerId)
      const refreshed = await provider.refresh(token.refreshToken)
      const merged: StoredToken = { ...token, ...refreshed, refreshToken: token.refreshToken }
      await connectorVault.setToken(userId, providerId, merged)
      return merged
    }

    return token
  }

  async isConnected(userId: string, providerId: string): Promise<boolean> {
    const t = await connectorVault.getToken(userId, providerId)
    return !!(t && t.accessToken)
  }

  async disconnect(userId: string, providerId: string): Promise<void> {
    await connectorVault.deleteToken(userId, providerId)
  }

  async execute(input: { userId: string; providerId: string; operation: string; params?: any }): Promise<any> {
    const uid = String(input.userId || '').trim()
    const pid = String(input.providerId || '').trim()
    const op = String(input.operation || '').trim()
    if (!uid) throw new Error('user_required')
    if (!pid) throw new Error('provider_required')
    if (!op) throw new Error('operation_required')

    const provider = this.getProvider(pid)
    const token = await this.ensureFreshToken(uid, pid)
    return provider.executeOperation(token, op, input.params)
  }
}

export const connectorManager = new ConnectorManager()

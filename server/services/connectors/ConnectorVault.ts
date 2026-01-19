import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { generateKey, loadEncrypted, saveEncrypted, type KeyMaterial } from '../sync/E2EE'

export type StoredToken = {
  accessToken: string
  refreshToken?: string
  scope?: string
  tokenType?: string
  expiresAt?: number
  idToken?: string
  raw?: any
}

export type VaultData = {
  version: 1
  updatedAt: number
  users: Record<string, Record<string, StoredToken>>
}

function now() { return Date.now() }

function parseKeyMaterial(raw: string): KeyMaterial | null {
  const s = String(raw || '').trim()
  if (!s) return null
  try {
    if (/^[0-9a-f]{64}$/i.test(s)) return { key: Buffer.from(s, 'hex') }
    const b = Buffer.from(s, 'base64')
    if (b.length === 32) return { key: b }
  } catch {}
  return null
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true } catch { return false }
}

export class ConnectorVault {
  private vaultPath: string
  private keyPath: string
  private key: KeyMaterial | null = null
  private data: VaultData = { version: 1, updatedAt: now(), users: {} }
  private loaded = false

  constructor(opts?: { vaultPath?: string; keyPath?: string }) {
    const root = process.cwd()
    this.vaultPath = opts?.vaultPath || path.join(root, 'uploads', 'connectors.vault')
    this.keyPath = opts?.keyPath || path.join(root, 'uploads', 'connectors.key')
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    this.loaded = true
    await this.ensureKey()
    await this.load().catch(() => {})
  }

  private async ensureKey(): Promise<void> {
    if (this.key) return

    const envKey = parseKeyMaterial(process.env.CONNECTOR_VAULT_KEY || '')
    if (envKey) {
      this.key = envKey
      return
    }

    try {
      await fs.mkdir(path.dirname(this.keyPath), { recursive: true })
    } catch {}

    if (await fileExists(this.keyPath)) {
      try {
        const raw = (await fs.readFile(this.keyPath, 'utf8')).trim()
        const km = parseKeyMaterial(raw)
        if (km) { this.key = km; return }
      } catch {}
    }

    const km = await generateKey()
    this.key = km
    try {
      const raw = km.key.toString('base64')
      await fs.writeFile(this.keyPath, raw, 'utf8')
    } catch {}
  }

  private async load(): Promise<void> {
    if (!this.key) return
    if (!(await fileExists(this.vaultPath))) return
    const parsed = await loadEncrypted(this.vaultPath, this.key)
    if (parsed && typeof parsed === 'object' && parsed.version === 1 && parsed.users && typeof parsed.users === 'object') {
      this.data = parsed as VaultData
    }
  }

  private async persist(): Promise<void> {
    if (!this.key) return
    try {
      await fs.mkdir(path.dirname(this.vaultPath), { recursive: true })
    } catch {}
    this.data.updatedAt = now()
    await saveEncrypted(this.vaultPath, this.key, this.data)
  }

  async getToken(userId: string, providerId: string): Promise<StoredToken | null> {
    await this.ensureLoaded()
    const uid = String(userId || '').trim()
    const pid = String(providerId || '').trim()
    if (!uid || !pid) return null
    return (this.data.users?.[uid]?.[pid] as StoredToken) || null
  }

  async setToken(userId: string, providerId: string, token: StoredToken): Promise<void> {
    await this.ensureLoaded()
    const uid = String(userId || '').trim()
    const pid = String(providerId || '').trim()
    if (!uid || !pid) return
    if (!this.data.users[uid]) this.data.users[uid] = {}
    this.data.users[uid][pid] = { ...token, raw: token.raw }
    await this.persist().catch(() => {})
  }

  async deleteToken(userId: string, providerId: string): Promise<void> {
    await this.ensureLoaded()
    const uid = String(userId || '').trim()
    const pid = String(providerId || '').trim()
    if (!uid || !pid) return
    if (this.data.users[uid] && this.data.users[uid][pid]) {
      delete this.data.users[uid][pid]
      await this.persist().catch(() => {})
    }
  }

  async listConnectedProviders(userId: string): Promise<string[]> {
    await this.ensureLoaded()
    const uid = String(userId || '').trim()
    if (!uid) return []
    return Object.keys(this.data.users?.[uid] || {})
  }

  async issueNonce(): Promise<string> {
    return randomBytes(12).toString('hex')
  }
}

export const connectorVault = new ConnectorVault()

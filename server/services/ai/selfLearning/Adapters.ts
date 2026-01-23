import axios from 'axios'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'

export type ActionDefinition = {
  type: 'http' | 'process' | 'device' | 'file' | 'powershell' | 'app' | 'web' | 'connector' | 'ui' | 'system' | 'interact'
  name?: string
  payload?: any
  riskLevel?: number
  tags?: string[]
}

export type ExecutionResult = { ok: boolean; result?: any; error?: string; status?: number }

export interface ActionAdapter {
  canHandle(a: ActionDefinition): boolean
  execute(a: ActionDefinition): Promise<ExecutionResult>
}

export class HttpAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'http' && a.payload && typeof a.payload.url === 'string'
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    try {
      const p = a.payload || {}
      const method = String(p.method || 'GET').toUpperCase()
      const url = String(p.url)
      const headers = p.headers || {}
      const data = p.body || undefined
      const res = await axios({ method, url, headers, data, validateStatus: () => true })
      const ok = res.status >= 200 && res.status < 300
      return { ok, result: res.data, status: res.status }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'http_failed' }
    }
  }
}

export class ProcessAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'process' && a.payload && typeof a.payload.command === 'string'
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    const cmd = String(a.payload.command)
    const args: string[] = Array.isArray(a.payload.args) ? a.payload.args.map((x: any) => String(x)) : []
    return new Promise((resolve) => {
      try {
        const child = spawn(cmd, args, { shell: true })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', d => { stdout += d.toString() })
        child.stderr.on('data', d => { stderr += d.toString() })
        child.on('close', code => {
          resolve({ ok: code === 0, result: { code, stdout, stderr } })
        })
      } catch (e: any) {
        resolve({ ok: false, error: e?.message || 'process_failed' })
      }
    })
  }
}

export class PowerShellAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'powershell' && a.payload && (typeof a.payload.command === 'string' || typeof a.payload.script === 'string')
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    const script = a.payload.script ? String(a.payload.script) : undefined
    const command = a.payload.command ? String(a.payload.command) : undefined
    const psCmd = script ? `-NoProfile -Command ${script}` : `-NoProfile -Command ${command}`
    return new Promise((resolve) => {
      try {
        const child = spawn('powershell', psCmd ? psCmd.split(' ') : ['-NoProfile','-Command','Write-Output','OK'], { shell: true })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', d => { stdout += d.toString() })
        child.stderr.on('data', d => { stderr += d.toString() })
        child.on('close', code => {
          resolve({ ok: code === 0, result: { code, stdout, stderr } })
        })
      } catch (e: any) {
        resolve({ ok: false, error: e?.message || 'powershell_failed' })
      }
    })
  }
}

export class FileAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'file' && a.payload && typeof a.payload.path === 'string' && typeof a.payload.op === 'string'
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    try {
      const p = String(a.payload.path)
      const op = String(a.payload.op)
      const enc = a.payload.encoding ? String(a.payload.encoding) : 'utf8'
      if (op === 'read') {
        const data = await fs.readFile(p, enc as any)
        return { ok: true, result: data }
      }
      if (op === 'write') {
        await fs.writeFile(p, String(a.payload.content ?? ''), enc as any)
        return { ok: true, result: true }
      }
      if (op === 'append') {
        await fs.appendFile(p, String(a.payload.content ?? ''), enc as any)
        return { ok: true, result: true }
      }
      if (op === 'delete') {
        try {
          await fs.unlink(p)
          return { ok: true, result: true }
        } catch {
          return { ok: false, error: 'delete_failed' }
        }
      }
      if (op === 'exists') {
        try { await fs.access(p); return { ok: true, result: true } } catch { return { ok: true, result: false } }
      }
      return { ok: false, error: 'unsupported_file_op' }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'file_failed' }
    }
  }
}

export class AppAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'app' && a.payload && typeof a.payload.path === 'string'
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    const appPath = String(a.payload.path)
    const args: string[] = Array.isArray(a.payload.args) ? a.payload.args.map((x: any) => String(x)) : []
    return new Promise((resolve) => {
      try {
        const child = spawn(appPath, args, { shell: true, detached: true })
        resolve({ ok: true, result: { pid: child.pid } })
      } catch (e: any) {
        resolve({ ok: false, error: e?.message || 'app_failed' })
      }
    })
  }
}

export class DeviceAdapter implements ActionAdapter {
  private uc: any | null = null
  private initialized = false
  private ensure() {
    if (this.initialized) return
    this.initialized = true
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('../../unifiedDeviceControl')
      this.uc = mod.unifiedDeviceControl || mod.default || mod
    } catch {
      this.uc = null
    }
  }
  canHandle(a: ActionDefinition): boolean {
    this.ensure()
    return a.type === 'device' && !!this.uc
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    this.ensure()
    if (!this.uc) return { ok: false, error: 'unifiedDeviceControl_unavailable' }
    try {
      const { deviceId, command, payload } = a.payload || {}
      if (!deviceId || !command) return { ok: false, error: 'deviceId_and_command_required' }
      await Promise.resolve(this.uc.sendCommand(String(deviceId), String(command), payload))
      const state = this.uc.getDeviceState(String(deviceId))
      return { ok: true, result: { deviceId, state } }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'device_command_failed' }
    }
  }
}

export class AdapterRegistry {
  private adapters: ActionAdapter[] = []
  constructor() {
    this.adapters = [
      new DeviceAdapter(),
      new PowerShellAdapter(),
      new AppAdapter(),
      new FileAdapter(),
      new ProcessAdapter(),
      new HttpAdapter()
    ]
  }
  register(adapter: ActionAdapter) { this.adapters.unshift(adapter) }
  find(a: ActionDefinition): ActionAdapter | null {
    for (const ad of this.adapters) if (ad.canHandle(a)) return ad
    return null
  }
  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    const ad = this.find(a)
    if (!ad) return { ok: false, error: 'no_adapter' }
    return ad.execute(a)
  }
}

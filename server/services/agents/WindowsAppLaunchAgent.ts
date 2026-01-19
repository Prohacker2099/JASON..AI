import type { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { ghostWorkspaceManager } from '../automation/GhostWorkspaceManager'

function isWindows(): boolean {
  return process.platform === 'win32'
}

export class WindowsAppLaunchAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    if (a.type !== 'app') return false
    const p = (a.payload && typeof a.payload === 'object') ? a.payload : null
    if (!p) return false
    return p.ghost === true || (typeof p.desktopName === 'string' && p.desktopName.length > 0)
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    if (!isWindows()) return { ok: false, error: 'app_not_supported_on_platform' }

    const p = (a.payload && typeof a.payload === 'object') ? a.payload : {}
    const path = String(p.path || '').trim()
    const args = Array.isArray(p.args) ? p.args.map((x: any) => String(x)) : []
    const desktopName = typeof p.desktopName === 'string' ? p.desktopName : undefined
    const timeoutMs = Number.isFinite(p.timeoutMs) ? Number(p.timeoutMs) : undefined

    if (!path) return { ok: false, error: 'path_required' }

    const out = await ghostWorkspaceManager.launchOnHiddenDesktop({ path, args, desktopName, timeoutMs })
    if (out.ok === false) return { ok: false, error: out.error }

    return { ok: true, result: out.result }
  }
}

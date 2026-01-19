import { messageBus, makeEnvelope } from '../bus/MessageBus'
import { permissionManager } from '../trust/PermissionManager'

class SandboxGuardian {
  private unsub: Array<() => void> = []
  private currentCategory: 'work' | 'distraction' | 'system' | 'unknown' = 'unknown'
  start() {
    if (this.unsub.length) return
    const u1 = messageBus.subscribe('PERCEPT:app_context', (env) => {
      try {
        const cat = env?.payload?.category
        if (cat === 'work' || cat === 'distraction' || cat === 'system' || cat === 'unknown') this.currentCategory = cat
      } catch {}
    })
    const u2 = messageBus.subscribe('PERCEPT:safety', async (env) => {
      try {
        const p = env.payload || {}
        const gating = !!p.gatingRequired || (p.severity === 'high' || p.severity === 'critical')
        if (!gating) return
        const prompt = permissionManager.createPrompt({ level: 3, title: 'Override risky input?', rationale: String(p.explanation || 'High risk'), options: ['approve','reject','delay'], meta: { safety: p } })
        const d = await permissionManager.waitForDecision(prompt.id, 60000)
        if (d !== 'approve') {
          const enable = String(process.env.SANDBOX_GHOST_ENABLE || 'false').toLowerCase() === 'true'
          const simulate = !enable
          const script = "$code='using System;using System.Runtime.InteropServices;public static class W{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();[DllImport(\"user32.dll\")]public static extern bool ShowWindow(IntPtr h,int n);}'; Add-Type -TypeDefinition $code; $h=[W]::GetForegroundWindow(); [W]::ShowWindow($h,6)"
          const envl = makeEnvelope('ACTION','act:ghost_minimize','sandbox_guardian',{ intent: 'ghost_minimize', action: { type: 'process', name: 'minimize_active_window', payload: { command: 'powershell', args: ['-NoProfile','-Command', script] }, riskLevel: 0.6, tags: ['window','non_interruptive','safe'] }, sandbox: { simulate, allowProcess: true } }, 5)
          messageBus.publish(envl)
        }
      } catch {}
    })
    this.unsub.push(u1, u2)
  }
  stop() { for (const u of this.unsub.splice(0)) try { u() } catch {} }
}

export const sandboxGuardian = new SandboxGuardian()

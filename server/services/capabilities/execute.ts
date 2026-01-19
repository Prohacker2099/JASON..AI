import { z } from 'zod'
import type { CapabilityContext, CapabilityLevel } from './CapabilityRegistry'
import { capabilityRegistry } from './CapabilityRegistry'

export const CapabilityRunSchema = z.object({
  name: z.string().min(1),
  input: z.any().optional(),
  simulate: z.boolean().optional(),
  sandbox: z
    .object({
      allowedHosts: z.array(z.string()).optional(),
      allowProcess: z.boolean().optional(),
      allowPowershell: z.boolean().optional(),
      allowApp: z.boolean().optional(),
      allowUI: z.boolean().optional(),
    })
    .optional(),
})

export async function executeCapabilityByName(ctx: CapabilityContext, body: unknown) {
  const parsed = CapabilityRunSchema.parse(body || {})
  const cap = capabilityRegistry.get(parsed.name)
  if (!cap) return { ok: false, error: 'capability_not_found' }

  const input = cap.input.parse(parsed.input || {})

  let level: CapabilityLevel = cap.level
  try {
    if (typeof cap.getLevel === 'function') {
      level = cap.getLevel(input)
    }
  } catch {
    level = cap.level
  }

  // Global kill switch: if paused, do not execute
  try {
    const isPaused = (ctx.permissionManager as any).isPaused
    if (typeof isPaused === 'function' && isPaused.call(ctx.permissionManager)) {
      return { ok: false, error: 'paused_by_kill_switch' }
    }
  } catch {}

  // L2/L3 gating via PermissionManager + J-Eye overlay
  if (level >= 2 && !parsed.simulate) {
    const title = `Confirm (L${level}): ${cap.title}`
    const rationale = cap.description
    const prompt = ctx.permissionManager.createPrompt({
      level,
      title,
      rationale,
      options: ['approve', 'reject', 'delay'],
      meta: { capability: cap.name, input },
    })

    const d = await ctx.permissionManager.waitForDecision(prompt.id, 120000)
    if (d !== 'approve') return { ok: false, error: `blocked_by_user_${d}` }
  }

  const result = await cap.run(
    ctx,
    input,
    {
      simulate: !!parsed.simulate,
      sandbox: parsed.sandbox || {},
    }
  )

  return { ok: true, capability: cap.name, level, result }
}

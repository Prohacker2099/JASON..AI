import { describe, expect, it, vi } from 'vitest'
import { permissionManager } from '../services/trust/PermissionManager'

describe('PermissionManager', () => {
  it('creates and resolves a prompt', async () => {
    const p = permissionManager.createPrompt({
      level: 2,
      title: 'Test approval',
      rationale: 'Because testing',
      options: ['approve', 'reject', 'delay'],
      meta: { action: { name: 'test_action' } },
    })

    const pending = permissionManager.listPending()
    expect(pending.some((x) => x.id === p.id)).toBe(true)

    const wait = permissionManager.waitForDecision(p.id, 1000)
    const decided = permissionManager.decide(p.id, 'approve')

    expect(decided.ok).toBe(true)
    await expect(wait).resolves.toBe('approve')
  })

  it('times out when no decision is provided', async () => {
    vi.useFakeTimers()
    try {
      const id = `tp_test_${Date.now()}`
      const wait = permissionManager.waitForDecision(id, 10)
      vi.advanceTimersByTime(11)
      await expect(wait).resolves.toBe('timeout')
    } finally {
      vi.useRealTimers()
    }
  })
})

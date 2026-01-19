import { Router } from 'express'
import { z } from 'zod'
import { capabilityRegistry } from '../services/capabilities/CapabilityRegistry'
import { executeCapabilityByName } from '../services/capabilities/execute'

const router = Router()

router.get('/', (_req, res) => {
  try {
    res.json({ ok: true, capabilities: capabilityRegistry.list() })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'capabilities_unavailable' })
  }
})

const RunSchema = z.any()

router.post('/run', async (req, res) => {
  try {
    const out = await executeCapabilityByName((req as any).capCtx, RunSchema.parse(req.body || {}))
    if (!out.ok) return res.status(400).json(out)
    res.json(out)
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'invalid_request' })
  }
})

export default router

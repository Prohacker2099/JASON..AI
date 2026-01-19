import { Router } from 'express'
import { ActionRouter, AgentCommandSchema } from '../services/capabilities/ActionRouter'

const router = Router()

router.post('/command', async (req, res) => {
  try {
    const body = AgentCommandSchema.parse(req.body || {})
    const routerSvc = new ActionRouter((req as any).capRegistry)
    const out = await routerSvc.handle((req as any).capCtx, body)
    res.json(out)
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'invalid_request' })
  }
})

export default router

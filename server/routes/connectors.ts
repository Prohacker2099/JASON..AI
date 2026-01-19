import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { connectorManager } from '../services/connectors/ConnectorManager'
import { connectorVault } from '../services/connectors/ConnectorVault'

type Request = import('express').Request
type Response = import('express').Response
type Next = (err?: any) => void

const router = Router()

const jwtSecret = String(process.env.JWT_SECRET || 'change_me')

function requireAuth(req: Request, res: Response, next: Next) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return res.status(401).json({ error: 'unauthorized' })
    const payload = jwt.verify(token, jwtSecret) as any
    ;(req as any).user = { id: payload.sub, roles: payload.roles }
    next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

router.get('/providers', (_req, res) => {
  try {
    res.json({ ok: true, providers: connectorManager.listProviders() })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'providers_unavailable' })
  }
})

router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = String((req as any).user?.id || '').trim()
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    const connected = await connectorVault.listConnectedProviders(userId)
    res.json({ ok: true, connected })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'status_unavailable' })
  }
})

const StartSchema = z.object({
  providerId: z.string().min(1),
  scopes: z.array(z.string()).optional(),
})

router.post('/start', requireAuth, async (req, res) => {
  try {
    const body = StartSchema.parse(req.body || {})
    const userId = String((req as any).user?.id || '').trim()
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    const out = await connectorManager.createAuthUrl({ userId, providerId: body.providerId, scopes: body.scopes })
    res.json({ ok: true, providerId: body.providerId, url: out.url })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'invalid_request' })
  }
})

const DisconnectSchema = z.object({ providerId: z.string().min(1) })

router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const body = DisconnectSchema.parse(req.body || {})
    const userId = String((req as any).user?.id || '').trim()
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    await connectorManager.disconnect(userId, body.providerId)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'invalid_request' })
  }
})

router.get('/callback/:providerId', async (req, res) => {
  const providerId = String(req.params.providerId || '').trim()
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const state = typeof req.query.state === 'string' ? req.query.state : ''
  const err = typeof req.query.error === 'string' ? req.query.error : ''

  try {
    if (err) {
      return res.status(400).send(`<html><body><h3>Connector error</h3><pre>${String(err)}</pre></body></html>`)
    }
    if (!providerId) return res.status(400).send('provider_required')
    if (!code) return res.status(400).send('code_required')
    if (!state) return res.status(400).send('state_required')

    const result = await connectorManager.handleOAuthCallback({ providerId, code, state })

    const redirect = String(process.env.CONNECTOR_SUCCESS_REDIRECT || '').trim()
    if (redirect) {
      return res.redirect(302, redirect)
    }

    return res.send(`<html><body><h3>Connected successfully!</h3><p>${providerId} has been connected to your account.</p><p>You can close this tab.</p></body></html>`)
  } catch (e: any) {
    return res.status(400).send(`<html><body><h3>Connector callback failed</h3><pre>${String(e?.message || e)}</pre></body></html>`)
  }
})

const ExecuteSchema = z.object({
  providerId: z.string().min(1),
  operation: z.string().min(1),
  params: z.any().optional()
})

router.post('/execute', requireAuth, async (req, res) => {
  try {
    const body = ExecuteSchema.parse(req.body || {})
    const userId = String((req as any).user?.id || '').trim()
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    const result = await connectorManager.execute({
      userId,
      providerId: body.providerId,
      operation: body.operation,
      params: body.params
    })

    res.json({ ok: true, result })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'execution_failed' })
  }
})

router.get('/test/:providerId', requireAuth, async (req, res) => {
  try {
    const providerId = String(req.params.providerId || '').trim()
    const userId = String((req as any).user?.id || '').trim()
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    const isConnected = await connectorManager.isConnected(userId, providerId)
    
    if (!isConnected) {
      return res.json({ ok: false, error: 'not_connected', providerId })
    }

    // Test with a simple operation based on provider
    let testResult
    switch (providerId) {
      case 'google':
        testResult = await connectorManager.execute({
          userId,
          providerId,
          operation: 'getMessages',
          params: { limit: 1 }
        })
        break
      case 'slack':
        testResult = await connectorManager.execute({
          userId,
          providerId,
          operation: 'getChannels',
          params: {}
        })
        break
      default:
        testResult = { status: 'connected' }
    }

    res.json({ ok: true, providerId, test: testResult })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'test_failed' })
  }
})

export default router

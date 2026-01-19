console.log("DEBUG: SERVER INDEX.TS LOADED");
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import { createServer } from 'http'
import * as WebSocketModule from 'ws'
const { WebSocketServer } = WebSocketModule
import { z } from 'zod'
import { logger } from './src/utils/logger'
import { prisma } from './src/db'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import ghostRoutes from './routes/ghost'
import travelRoutes from './routes/travel'
import flightsRoutes from './routes/flights'
import voiceRoutes from './routes/voice'
import aiRoutes from './src/routes/api/aiRoutes'
import orchestratorRoutes from './routes/orchestrator'
import { sseBroker } from './services/websocket-service'
import { taskOrchestrator } from './services/orchestrator/TaskOrchestrator'
import { permissionManager } from './services/trust/PermissionManager'
import { getTopContext } from './services/context/TCG'
import { selfLearningEngine } from './services/ai/selfLearning/Engine'
import { leaMicrokernel } from './core/LEA'
import { bdiCore } from './services/intelligence/BDICore'
import { getAllowedHosts, setAllowedHosts } from './services/execution/DAI'
import { busRouter } from './services/bus/BusRouter'
import { messageBus } from './services/bus/MessageBus'
import { GhostHandAgent } from './services/automation/GhostHandAgent'
import { SCRLEngine } from './services/ai/selfLearning/SCRL'
import { usptEngine } from './services/ai/personalization/USPT'
import { moralityEngine } from './services/intelligence/Ethics'
import securityHardening from './services/security/SecurityHardening'
import { sharedMemoryManager } from './services/memory/SharedMemoryManager'
import capabilitiesRoutes from './routes/capabilities'
import agentRoutes from './routes/agent'
import connectorsRoutes from './routes/connectors'
import { DAISandbox } from './services/execution/DAI'
import { capabilityRegistry } from './services/capabilities/CapabilityRegistry'
import { registerBuiltinCapabilities } from './services/capabilities/builtins'
import { flightSearchService } from './services/flights/FlightSearchService'

dotenv.config()

// Add global error handlers to catch all errors
process.on('uncaughtException', (error) => {
  console.error('[index.ts] UNCAUGHT EXCEPTION:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[index.ts] UNHANDLED REJECTION at:', promise, 'reason:', reason)
  process.exit(1)
})

type Request = import('express').Request
type Response = import('express').Response
type Next = (err?: any) => void

const app = (express as any)()
const server = createServer(app)
let currentMood = 'neutral'

// Logging middleware for debugging
app.use((req: any, res: any, next: any) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - IP: ${req.ip} - Host: ${req.hostname}`);
  next();
});

// Lightweight startup diagnostics to track where the server exits during boot
console.log('[index.ts] module loaded, app/server created')

app.use((express as any).json({ limit: '1mb' }))
app.use(compression())
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))

// Capability system: register builtins and attach a request-scoped execution context
try {
  registerBuiltinCapabilities(capabilityRegistry)
} catch { }
const daiSandbox = new DAISandbox()
app.use((req: any, _res: any, next: any) => {
  req.capRegistry = capabilityRegistry
  req.capCtx = {
    dai: daiSandbox,
    flightSearchService,
    bdiCore,
    permissionManager,
    sse: sseBroker,
  }
  next()
})

const jwtSecret = process.env.JWT_SECRET || 'change_me'

function requireAuth(req: Request, res: Response, next: Next) {
  try {
    const auth = req.headers.authorization || ''
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || req.ip?.includes('127.0.0.1') || req.ip === '::1' || !req.hostname

    if (isLocal && (jwtSecret === 'dev_only_secret' || jwtSecret === 'change_me')) {
      console.log(`[AUTH] Local bypass granted for ${req.url}`);
      (req as any).user = { id: 'admin-id', roles: ['admin'] }
      return next()
    }

    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) {
      console.log(`[AUTH] Missing token for ${req.url}`);
      return res.status(401).json({ error: 'unauthorized' })
    }
    const payload = jwt.verify(token, jwtSecret) as any
      ; (req as any).user = { id: payload.sub, roles: payload.roles }
    next()
  } catch (e) {
    console.log(`[AUTH] Invalid token/error for ${req.url}:`, e);
    return res.status(401).json({ error: 'unauthorized' })
  }
}

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/', async (_req, res) => {
  res.json({ ok: true, name: 'jason-ai-architect', server: 'up' })
})

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // @ts-ignore
  if (typeof (res as any).flushHeaders === 'function') { (res as any).flushHeaders() }
  const id = sseBroker.addClient(res)
  req.on('close', () => {
    try { sseBroker.removeClient(id) } catch { }
    try { res.end() } catch { }
  })
})

app.get('/api/context/status', async (_req, res) => {
  try {
    const items = await getTopContext(20)
    res.json({ state: { mood: currentMood, items } })
  } catch {
    res.status(500).json({ error: 'context_unavailable' })
  }
})

app.get('/context/current', async (_req, res) => {
  try {
    const items = await getTopContext(20)
    const lea = leaMicrokernel.getStatus()
    res.json({ state: { mood: currentMood, items }, lea })
  } catch {
    res.status(500).json({ error: 'context_unavailable' })
  }
})

app.post('/api/context/mood', async (req, res) => {
  try {
    const mood = typeof req.body?.mood === 'string' ? req.body.mood.trim() : ''
    if (mood) currentMood = mood
    res.json({ state: { mood: currentMood } })
  } catch {
    res.status(400).json({ error: 'invalid_mood' })
  }
})

app.get('/api/trust/status', (_req, res) => {
  try {
    res.json({ paused: permissionManager.isPaused() })
  } catch {
    res.status(500).json({ error: 'trust_unavailable' })
  }
})

app.get('/api/trust/pending', (_req, res) => {
  try {
    res.json({ prompts: permissionManager.listPending(), paused: permissionManager.isPaused() })
  } catch {
    res.status(500).json({ error: 'trust_unavailable' })
  }
})

app.post('/api/trust/kill', (req, res) => {
  try {
    const paused = !!req.body?.paused
    permissionManager.setPaused(paused)
    res.json({ paused: permissionManager.isPaused() })
  } catch {
    res.status(500).json({ error: 'trust_unavailable' })
  }
})

app.post('/api/trust/decide', (req, res) => {
  try {
    const body = req.body || {}
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const decision = typeof body.decision === 'string' ? body.decision : ''
    if (!id) return res.status(400).json({ error: 'invalid_request_id' })
    if (decision !== 'approve' && decision !== 'reject' && decision !== 'delay') {
      return res.status(400).json({ error: 'invalid_decision' })
    }
    const out = permissionManager.decide(id, decision as any, body.meta)
    if (!out.ok) return res.status(404).json({ error: 'not_found' })
    res.json({ ok: true, prompt: out.prompt })
  } catch {
    res.status(500).json({ error: 'trust_unavailable' })
  }
})

app.post('/permissions/update', requireAuth, (req, res) => {
  try {
    const body = req.body || {}
    const domainRaw = typeof body.domain === 'string' ? body.domain.trim() : ''
    if (!domainRaw) return res.status(400).json({ error: 'invalid_domain' })
    const domain = domainRaw.toLowerCase()
    const hosts = getAllowedHosts()
    if (!hosts.includes(domain)) {
      setAllowedHosts([...hosts, domain])
    }
    res.json({ domain, allowedHosts: getAllowedHosts() })
  } catch {
    res.status(500).json({ error: 'permissions_update_failed' })
  }
})

app.post('/action/confirm', requireAuth, (req, res) => {
  try {
    const body = req.body || {}
    const id = typeof body.l3_request_id === 'string' && body.l3_request_id.trim()
      ? body.l3_request_id.trim()
      : (typeof body.id === 'string' ? body.id.trim() : '')
    if (!id) return res.status(400).json({ error: 'invalid_request_id' })
    const explicit = typeof body.decision === 'string' ? body.decision : undefined
    let decision: 'approve' | 'reject' | 'delay'
    if (explicit === 'approve' || explicit === 'reject' || explicit === 'delay') {
      decision = explicit
    } else {
      const approved = !!body.approved
      decision = approved ? 'approve' : 'reject'
    }
    const result = permissionManager.decide(id, decision)
    if (!result.ok) return res.status(404).json({ error: 'not_found' })
    res.json({ ok: true, prompt: result.prompt })
  } catch {
    res.status(500).json({ error: 'confirm_failed' })
  }
})

app.post('/action/kill_switch', requireAuth, (req, res) => {
  try {
    const body = req.body || {}
    const activate = typeof body.activate === 'boolean' ? body.activate : !!body.active
    leaMicrokernel.setKillSwitch(activate)
    res.json({ active: leaMicrokernel.getKillSwitch() })
  } catch {
    res.status(500).json({ error: 'kill_switch_failed' })
  }
})

app.post('/action/submit_goal', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {}
    const textRaw = typeof body.natural_language_goal === 'string' ? body.natural_language_goal : ''
    const text = textRaw.trim()
    if (!text) return res.status(400).json({ error: 'invalid_goal' })
    const userId = (req as any).user?.id as string
    const priority = typeof body.priority === 'number' ? body.priority : undefined
    const simulate = body.simulate === true
    const sandbox = body.sandbox && typeof body.sandbox === 'object'
      ? {
        allowedHosts: Array.isArray(body.sandbox.allowedHosts) ? body.sandbox.allowedHosts.map((s: any) => String(s)) : undefined,
        allowProcess: !!body.sandbox.allowProcess,
        allowPowershell: !!body.sandbox.allowPowershell,
        allowApp: !!body.sandbox.allowApp,
        allowUI: !!body.sandbox.allowUI,
      }
      : undefined

    const out = await bdiCore.submitDesire({
      userText: text,
      userId,
      priority,
      simulate,
      sandbox,
    })
    res.status(202).json(out)
  } catch (e) { next(e) }
})

app.get('/api/orch/jobs', (_req, res) => {
  try {
    const { active, queue } = taskOrchestrator.listJobs()
    const jobs: Array<{ id: string; goal?: string; status?: string; flightSummary?: any; travelPlan?: any }> = []
    if (active) jobs.push({ id: active.id, goal: active.goal, status: active.status, flightSummary: (active as any).flightSummary, travelPlan: (active as any).travelPlan })
    for (const j of queue) jobs.push({ id: j.id, goal: j.goal, status: j.status, flightSummary: (j as any).flightSummary, travelPlan: (j as any).travelPlan })
    res.json(jobs)
  } catch {
    res.status(500).json({ error: 'orch_unavailable' })
  }
})

app.get('/api/bdi/status', requireAuth, (_req, res) => {
  try {
    const status = bdiCore.getStatus()
    res.json(status)
  } catch {
    res.status(500).json({ error: 'bdi_unavailable' })
  }
})

app.get('/api/activity/logs', requireAuth, async (req, res, next) => {
  try {
    const rawLimit = typeof req.query.limit === 'string' ? req.query.limit : ''
    const n = parseInt(rawLimit || '', 10)
    const take = Number.isFinite(n) && n > 0 && n <= 500 ? n : 50
    const events = [
      'activity_log',
      'orch_job',
      'scrl_review',
      'scrl_adjustment',
      'ethics_audit',
      'uspt_profile',
      'uspt_example',
      'consciousness_log',
    ]
    const rows = await prisma.learningEvent.findMany({
      where: { event: { in: events } },
      orderBy: { timestamp: 'desc' },
      take,
    })
    const logs = rows.map((r: any) => ({
      id: r.id,
      event: r.event,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : new Date(r.timestamp).toISOString(),
      data: r.data,
    }))
    res.json({ logs })
  } catch (e) { next(e) }
})

app.use('/api/travel', travelRoutes)
app.use('/api/flights', flightsRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/capabilities', capabilitiesRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/connectors', connectorsRoutes)
app.use('/api/orchestrator', orchestratorRoutes)

app.use('/api/ghost', requireAuth, ghostRoutes)

app.use('/api/ai', requireAuth, aiRoutes)

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8)
})

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body)
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(body.password, salt)
    const user = await prisma.user.create({ data: { username: body.username, email: body.email, passwordHash, salt } })
    res.status(201).json({ id: user.id })
  } catch (e) { next(e) }
})

const loginSchema = z.object({ identifier: z.string(), password: z.string() })

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body)
    const user = await prisma.user.findFirst({ where: { OR: [{ email: body.identifier }, { username: body.identifier }] } })
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })
    const ok = await bcrypt.compare(body.password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })
    const token = jwt.sign({ sub: user.id, roles: user.roles }, jwtSecret, { expiresIn: '12h' })
    res.json({ token })
  } catch (e) { next(e) }
})

const deviceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['LIGHT', 'THERMOSTAT', 'SECURITY', 'MEDIA', 'APPLIANCE', 'SENSOR', 'CUSTOM']),
  status: z.enum(['ON', 'OFF', 'STANDBY', 'ERROR', 'CHARGING']).default('OFF'),
  protocol: z.string().default('tcp'),
  ipAddress: z.string().optional()
})

app.get('/api/devices', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string
    const devices = await prisma.device.findMany({ where: { ownerId: userId }, orderBy: { updatedAt: 'desc' } })
    res.json({ devices })
  } catch (e) { next(e) }
})

app.post('/api/devices', requireAuth, async (req, res, next) => {
  try {
    const body = deviceSchema.parse(req.body)
    const userId = (req as any).user.id as string
    const created = await prisma.device.create({ data: { ...body, ownerId: userId } })
    res.status(201).json({ id: created.id })
  } catch (e) { next(e) }
})

app.put('/api/devices/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string
    const id = req.params.id
    const body = deviceSchema.partial().parse(req.body)
    const updated = await prisma.device.update({ where: { id }, data: body })
    if (updated.ownerId !== userId) return res.status(403).json({ error: 'forbidden' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.delete('/api/devices/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string
    const id = req.params.id
    const dev = await prisma.device.findUnique({ where: { id } })
    if (!dev || dev.ownerId !== userId) return res.status(404).json({ error: 'not_found' })
    await prisma.device.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// USPT (User Style & Preference Trainer) endpoints
app.get('/api/uspt/status', async (_req, res) => {
  try {
    const stats = usptEngine.getStatistics()
    res.json({ ok: true, data: stats })
  } catch (e) {
    res.status(500).json({ error: 'failed', message: String(e) })
  }
})

app.post('/api/uspt/ingest', async (req, res) => {
  try {
    const { text, source, metadata } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'invalid_text' })
    }
    const sample = await usptEngine.ingestTextSample(text, source || 'document', metadata)
    res.json({ ok: true, data: sample })
  } catch (e) {
    res.status(500).json({ error: 'failed', message: String(e) })
  }
})

app.post('/api/uspt/train', async (req, res) => {
  try {
    const { epochs = 10, batchSize = 32 } = req.body
    await usptEngine.trainModel()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'failed', message: String(e) })
  }
})

app.get('/api/uspt/profiles', async (_req, res) => {
  try {
    const profiles = Array.from(usptEngine['profiles'].values())
    res.json({ ok: true, data: profiles })
  } catch (e) {
    res.status(500).json({ error: 'failed', message: String(e) })
  }
})

app.post('/api/uspt/score', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'invalid_text' })
    }
    const score = usptEngine.predictStyle(text)
    res.json({ ok: true, data: score })
  } catch (e) {
    res.status(500).json({ error: 'failed', message: String(e) })
  }
})

app.use((err: any, _req: Request, res: Response, _next: Next) => {
  const status = err.status || 500
  const message = err.message || 'internal_error'
  logger.error('HTTP error', { status, message })
  res.status(status).json({ error: message })
})

const wss = new WebSocketServer({ server, path: '/ws/jason/stream' })

function broadcastToJason(msg: any) {
  let encoded: string
  try { encoded = JSON.stringify(msg) } catch { return }
  wss.clients.forEach((client: any) => {
    try { client.send(encoded) } catch { }
  })
}

taskOrchestrator.on('job', (event: any) => {
  try {
    const job = event?.job
    if (!job) return
    broadcastToJason({
      topic: 'REPORT',
      data: {
        status: job.status,
        timestamp: new Date().toISOString(),
        log_id: job.id,
        goal: job.goal,
        flightSummary: (job as any).flightSummary,
      },
    })
  } catch { }
})

permissionManager.on('prompt', (prompt: any) => {
  try {
    broadcastToJason({
      topic: 'L3_REQUEST',
      data: {
        l3_request_id: prompt.id,
        action_summary: prompt.title,
        cost_estimate: '',
        log_id: prompt.id,
      },
    })
  } catch { }
})

permissionManager.on('kill', () => {
  try {
    broadcastToJason({
      topic: 'STATUS',
      data: { kill_switch: permissionManager.isPaused() },
    })
  } catch { }
})

setInterval(() => {
  try {
    const status = leaMicrokernel.getStatus()
    broadcastToJason({ topic: 'STATUS', data: { ...status } })
  } catch { }
}, 5000)

wss.on('connection', (socket) => {
  try {
    const status = leaMicrokernel.getStatus()
    socket.send(JSON.stringify({ topic: 'STATUS', data: { ...status } }))
  } catch { }
  socket.on('message', async (data) => {
    try {
      const raw = data.toString()
      let msg: any
      try { msg = JSON.parse(raw) } catch { msg = null }
      if (!msg || typeof msg !== 'object') return
      if (msg.topic === 'DESIRE' && msg.data && typeof msg.data.user_text === 'string') {
        const res = await bdiCore.submitDesire({
          userText: msg.data.user_text,
          priority: msg.data.priority_level,
        })
        try {
          socket.send(JSON.stringify({ topic: 'DESIRE_ACCEPTED', data: res }))
        } catch { }
      }
    } catch { }
  })
})

const port = Number(process.env.SERVER_PORT || 3001)
console.log('[index.ts] about to call server.listen on port', port)

// Add error handling for server.listen
server.on('error', (error: any) => {
  console.error('[index.ts] SERVER ERROR:', error)
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
  }
  process.exit(1)
})

server.listen(port, '127.0.0.1', async () => {
  console.log('[index.ts] server.listen callback invoked')
  logger.info('Server listening', { port, host: '127.0.0.1' })
  void busRouter

  // Initialize production-ready components
  try {
    console.log('[index.ts] initializing production components...')

    // Initialize security hardening
    try {
      console.log('[index.ts] initializing security hardening...')
      const security = new securityHardening()
      logger.info('Security hardening initialized')
    } catch (error) {
      console.error('[index.ts] Security hardening failed:', error)
      logger.warn('Security hardening initialization failed', { error })
    }

    // Initialize shared memory regions
    try {
      console.log('[index.ts] creating shared memory regions...')
      sharedMemoryManager.createRegion('context_data', 1024 * 1024, 'context') // 1MB
      sharedMemoryManager.createRegion('state_cache', 512 * 1024, 'state') // 512KB
      logger.info('Shared memory regions created')
    } catch (error) {
      console.error('[index.ts] Shared memory failed:', error)
      throw error
    }

    // Initialize SCRL with self-learning engine
    try {
      console.log('[index.ts] initializing SCRL engine...')
      const scrl = new SCRLEngine(selfLearningEngine)
      logger.info('SCRL engine initialized')
    } catch (error) {
      console.error('[index.ts] SCRL engine failed:', error)
      throw error
    }

    // Initialize USPT
    try {
      console.log('[index.ts] initializing USPT engine...')
      const usptStats = usptEngine.getStatistics()
      logger.info('USPT engine ready', { samples: usptStats.totalSamples })

      // Initialize IMAP ingestion if configured
      const { imapIngestion } = await import('./services/ai/personalization/ImapIngestion')
      if (imapIngestion) {
        console.log('[index.ts] starting IMAP ingestion...')
        imapIngestion.connect().catch(err => {
          logger.warn('IMAP ingestion connection failed', { error: err })
        })
      }
    } catch (error) {
      console.error('[index.ts] USPT engine failed:', error)
      throw error
    }

    // Test morality engine
    try {
      console.log('[index.ts] testing morality engine...')
      const moralityGates = moralityEngine.getGates()
      logger.info('Morality engine ready', { gates: moralityGates.length })
    } catch (error) {
      console.error('[index.ts] Morality engine failed:', error)
      throw error
    }

    // Test ghost hand agent
    try {
      console.log('[index.ts] initializing ghost hand agent...')
      const ghostHandAgent = new GhostHandAgent()
      await ghostHandAgent.initialize().catch(err => {
        logger.warn('Ghost Hand agent initialization failed (falling back):', { error: err.message })
      })
      logger.info('Ghost Hand agent initialized')
    } catch (error) {
      console.error('[index.ts] Ghost Hand agent failed:', error)
      logger.warn('Ghost Hand initialization failed', { error })
    }

    // Initialize Universal Ghost Hand (if available)
    try {
      console.log('[index.ts] initializing Universal Ghost Hand...')
      const { UniversalGhostHand } = await import('./services/automation/UniversalGhostHand')
      const ghostHand = new UniversalGhostHand({
        maxConcurrentTasks: 5,
        enableRecording: false,
        enableScreenshots: false,
        enableStealth: false,
        security: {
          allowExternalCommands: true,
          allowFileAccess: true,
          allowNetworkAccess: true,
          sandboxMode: false,
          allowedDomains: ['*'],
          blockedDomains: []
        }
      })
      await ghostHand.initialize()
      console.log('[index.ts] Universal Ghost Hand initialized')
    } catch (error) {
      console.error('[index.ts] Universal Ghost Hand failed (non-critical):', error)
      // This is non-critical, continue without it
    }

    console.log('[index.ts] All production components initialized successfully')

  } catch (error) {
    console.error('[index.ts] CRITICAL ERROR during production component initialization:', error)
    logger.error('Failed to initialize production components', { error })
    // Don't exit, just log the error and continue
  }

  // Start self-learning trainer + daily ingestion in background (safe defaults)
  try {
    selfLearningEngine.setResourcePolicy({ maxHeapMB: 512, maxRps: 1, maxConcurrent: 1 })
    selfLearningEngine.startTrainer(1500)
  } catch { }

  // Start Consciousness loop in non-simulated, low-impact mode
  try {
    leaMicrokernel.start()
  } catch { }
})

process.on('SIGINT', async () => {
  try {
    logger.info('Shutting down JASON components...')

    // Cleanup production components
    await sharedMemoryManager.shutdown()

    await prisma.$disconnect()
    logger.info('JASON shutdown complete')
  } catch (error) {
    logger.error('Error during shutdown', { error })
  }
  process.exit(0)
})

// Handle emergency shutdown
process.on('jason:emergency_shutdown', async () => {
  try {
    logger.error('EMERGENCY SHUTDOWN INITIATED')

    // Force cleanup
    await sharedMemoryManager.shutdown()

    // Exit immediately
    process.exit(1)
  } catch (error) {
    process.exit(1)
  }
})

import express from 'express'
import path from 'path'
import fs from 'fs'

type TrustLevel = 1 | 2 | 3

type TrustPrompt = {
  id: string
  level: TrustLevel
  title: string
  rationale?: string
  options: Array<'approve' | 'reject' | 'delay'>
  createdAt: number
  meta?: any
}

type JobStatus = 'queued' | 'running' | 'waiting_for_user' | 'completed' | 'failed' | 'cancelled'

type OrchestratorJob = {
  id: string
  goal: string
  createdAt: number
  status: JobStatus
  waitingForPromptId?: string
  result?: any
  error?: string
}

type ActivityItem = { id: string; type: string; time: number; payload: any }

type SseClient = {
  id: string
  res: express.Response
}

function rid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function riskLevelForGoal(goal: string): TrustLevel {
  const g = goal.toLowerCase()
  const l3 = ['buy', 'purchase', 'pay', 'checkout', 'order', 'send', 'email', 'message', 'delete', 'remove', 'install', 'transfer', 'wire']
  const l2 = ['login', 'sign in', 'upload', 'download', 'edit', 'update', 'post', 'comment']
  if (l3.some((k) => g.includes(k))) return 3
  if (l2.some((k) => g.includes(k))) return 2
  return 1
}

const app = express()
app.use(express.json({ limit: '2mb' }))

const projectRoot = process.cwd()
const staticRoot = projectRoot

const state = {
  trustPaused: false,
  prompts: new Map<string, TrustPrompt>(),
  jobs: new Map<string, OrchestratorJob>(),
  activity: [] as ActivityItem[],
  sseClients: new Map<string, SseClient>(),
}

function pushActivity(type: string, payload: any) {
  const item: ActivityItem = { id: rid('act'), type, time: Date.now(), payload }
  state.activity.unshift(item)
  state.activity = state.activity.slice(0, 200)
  broadcast(type, payload)
}

function broadcast(type: string, payload: any) {
  const data = JSON.stringify(payload ?? {})
  for (const c of state.sseClients.values()) {
    try {
      c.res.write(`event: ${type}\n`)
      c.res.write(`data: ${data}\n\n`)
    } catch {
    }
  }
}

function serveDefaultPage(res: express.Response) {
  const candidates = ['jason-real.html', 'index-real.html', 'index.html']
  for (const c of candidates) {
    const p = path.join(staticRoot, c)
    if (fs.existsSync(p)) return res.sendFile(p)
  }
  return res.status(404).send('No entry HTML found')
}

app.get('/', (_req, res) => serveDefaultPage(res))
app.use(express.static(staticRoot))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, now: Date.now() })
})

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const id = rid('sse')
  state.sseClients.set(id, { id, res })

  res.write('event: system\n')
  res.write(`data: ${JSON.stringify({ ok: true, id })}\n\n`)

  const t = setInterval(() => {
    try {
      res.write('event: ping\n')
      res.write(`data: ${JSON.stringify({ t: Date.now() })}\n\n`)
    } catch {
    }
  }, 15000)

  req.on('close', () => {
    clearInterval(t)
    state.sseClients.delete(id)
  })
})

app.get('/api/activity/logs', (_req, res) => {
  res.json(state.activity)
})

app.get('/api/trust/status', (_req, res) => {
  res.json({ paused: state.trustPaused })
})

app.post('/api/trust/kill', (req, res) => {
  const paused = !!req.body?.paused
  state.trustPaused = paused
  pushActivity('trust:kill', { paused })
  res.json({ ok: true, paused })
})

app.get('/api/trust/pending', (_req, res) => {
  res.json({ paused: state.trustPaused, prompts: Array.from(state.prompts.values()).sort((a, b) => b.createdAt - a.createdAt) })
})

app.post('/api/trust/decide', (req, res) => {
  const id = String(req.body?.id || '')
  const decision = String(req.body?.decision || '') as 'approve' | 'reject' | 'delay'
  const p = state.prompts.get(id)
  if (!p) return res.status(404).json({ ok: false, error: 'prompt_not_found' })

  state.prompts.delete(id)
  pushActivity('trust:decision', { id, decision })

  for (const j of state.jobs.values()) {
    if (j.waitingForPromptId === id) {
      if (decision === 'approve') {
        j.waitingForPromptId = undefined
        j.status = 'queued'
        pushActivity('orch:job', j)
        void runJob(j.id)
      } else if (decision === 'reject') {
        j.status = 'cancelled'
        j.waitingForPromptId = undefined
        j.error = 'rejected_by_user'
        pushActivity('orch:job', j)
      } else {
        j.status = 'waiting_for_user'
        pushActivity('orch:job', j)
      }
    }
  }

  res.json({ ok: true })
})

app.get('/api/orch/jobs', (_req, res) => {
  res.json(Array.from(state.jobs.values()).sort((a, b) => b.createdAt - a.createdAt))
})

app.get('/api/orchestrator/jobs/:id', (req, res) => {
  const id = String(req.params.id)
  const j = state.jobs.get(id)
  if (!j) return res.status(404).json({ ok: false, error: 'job_not_found' })
  res.json({ ok: true, job: j })
})

app.post('/api/orch/enqueue', (req, res) => {
  const goal = String(req.body?.goal || '').trim()
  if (!goal) return res.status(400).json({ ok: false, error: 'missing_goal' })

  const id = rid('job')
  const job: OrchestratorJob = { id, goal, createdAt: Date.now(), status: 'queued' }
  state.jobs.set(id, job)
  pushActivity('orch:job', job)

  void runJob(id)

  res.json({ ok: true, jobId: id })
})

app.post('/api/orch/cancel', (req, res) => {
  const id = String(req.body?.id || '').trim()
  const j = state.jobs.get(id)
  if (!j) return res.status(404).json({ ok: false, error: 'job_not_found' })
  j.status = 'cancelled'
  pushActivity('orch:job', j)
  res.json({ ok: true })
})

app.post('/action/submit_goal', (req, res) => {
  const goal = String(req.body?.natural_language_goal || req.body?.goal || '').trim()
  if (!goal) return res.status(400).json({ ok: false, error: 'missing_goal' })

  const id = rid('job')
  const job: OrchestratorJob = { id, goal, createdAt: Date.now(), status: 'queued' }
  state.jobs.set(id, job)
  pushActivity('orch:job', job)
  void runJob(id)

  res.json({ ok: true, jobId: id })
})

async function runJob(id: string) {
  const j = state.jobs.get(id)
  if (!j) return
  if (j.status === 'cancelled' || j.status === 'completed' || j.status === 'failed') return

  if (state.trustPaused) {
    j.status = 'waiting_for_user'
    pushActivity('orch:job', j)
    return
  }

  const level = riskLevelForGoal(j.goal)
  if (level >= 3 && !j.waitingForPromptId) {
    const pid = rid('prompt')
    const prompt: TrustPrompt = {
      id: pid,
      level,
      title: 'Level 3 approval required',
      rationale: `Goal appears high-impact: ${j.goal}`,
      options: ['approve', 'reject', 'delay'],
      createdAt: Date.now(),
      meta: { goal: j.goal },
    }
    state.prompts.set(pid, prompt)
    j.status = 'waiting_for_user'
    j.waitingForPromptId = pid
    pushActivity('trust:prompt', prompt)
    pushActivity('orch:job', j)
    return
  }

  j.status = 'running'
  pushActivity('orch:job', j)

  await new Promise((r) => setTimeout(r, 1200))

  const j2 = state.jobs.get(id)
  if (!j2) return
  if (j2.status === 'cancelled') return

  j2.status = 'completed'
  j2.result = {
    ok: true,
    summary: 'Simulated execution completed. Wire real adapters (Playwright/Puppeteer/PyAutoGUI) for live control.',
  }
  pushActivity('orch:job', j2)
}

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  pushActivity('system', { ok: true, port })
})

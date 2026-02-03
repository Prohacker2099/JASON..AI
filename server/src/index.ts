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

function ensurePrompt(job: OrchestratorJob, level: TrustLevel, title: string, rationale: string, meta?: any) {
  if (job.waitingForPromptId) return
  const pid = rid('prompt')
  const prompt: TrustPrompt = {
    id: pid,
    level,
    title,
    rationale,
    options: ['approve', 'reject', 'delay'],
    createdAt: Date.now(),
    meta,
  }
  state.prompts.set(pid, prompt)
  job.status = 'waiting_for_user'
  job.waitingForPromptId = pid
  pushActivity('trust:prompt', prompt)
  pushActivity('orch:job', job)
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

type CommerceScrapeRequest = {
  url: string
  query?: string
}

type CommerceScrapeResult = {
  ok: boolean
  url: string
  fetchedBytes: number
  title?: string
  matches: Array<{ text: string; href?: string }>
}

type WebSession = {
  id: string
  createdAt: number
  lastUsedAt: number
  browserType: 'chromium'
  page: any
  context: any
}

const DEFAULT_ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1'])
const EXTRA_ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const ALLOWED_HOSTS = new Set<string>([...DEFAULT_ALLOWED_HOSTS, ...EXTRA_ALLOWED_HOSTS])

const DEFAULT_ALLOWED_WEB_HOSTS = new Set(['localhost', '127.0.0.1'])
const EXTRA_ALLOWED_WEB_HOSTS = (process.env.WEB_ALLOWED_HOSTS || process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const ALLOWED_WEB_HOSTS = new Set<string>([...DEFAULT_ALLOWED_WEB_HOSTS, ...EXTRA_ALLOWED_WEB_HOSTS])

function parseHttpUrl(input: string): URL {
  let u: URL
  try {
    u = new URL(input)
  } catch {
    throw new Error('invalid_url')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  if (!u.hostname) throw new Error('invalid_host')
  return u
}

function assertAllowedHost(u: URL) {
  if (!ALLOWED_HOSTS.has(u.hostname)) {
    throw new Error(`host_not_allowed:${u.hostname}`)
  }
}

function assertAllowedWebHost(u: URL) {
  if (!ALLOWED_WEB_HOSTS.has(u.hostname)) {
    throw new Error(`web_host_not_allowed:${u.hostname}`)
  }
}

async function getPlaywright() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return await import('playwright')
  } catch {
    throw new Error('playwright_not_installed')
  }
}

const webState = {
  browser: null as any,
  sessions: new Map<string, WebSession>(),
}

async function ensureBrowser() {
  if (webState.browser) return webState.browser
  const pw = await getPlaywright()
  webState.browser = await pw.chromium.launch({ headless: true })
  pushActivity('web:browser', { ok: true, type: 'chromium', headless: true })
  return webState.browser
}

function parseNumberOrThrow(v: any, name: string) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) throw new Error(`invalid_${name}`)
  return n
}

function getDesktopAgentBaseUrl() {
  const base = String(process.env.DESKTOP_AGENT_URL || 'http://127.0.0.1:5137').trim()
  const u = parseHttpUrl(base)
  assertAllowedHost(u)
  return u
}

function getDesktopAgentTokenOrThrow() {
  const tok = String(process.env.DESKTOP_AGENT_TOKEN || '').trim()
  if (!tok) throw new Error('desktop_agent_token_missing')
  return tok
}

async function desktopAgentCall(pathname: string, body?: any) {
  const base = getDesktopAgentBaseUrl()
  const token = getDesktopAgentTokenOrThrow()
  const u = new URL(pathname.replace(/^\//, ''), `${base.toString().replace(/\/$/, '')}/`)

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  try {
    const r = await fetch(u.toString(), {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-token': token,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
    const txt = await r.text()
    let data: any = undefined
    try {
      data = txt ? JSON.parse(txt) : undefined
    } catch {
      data = { ok: false, error: 'invalid_agent_json', raw: txt.slice(0, 500) }
    }
    if (!r.ok) {
      throw new Error(data?.error || `agent_http_${r.status}`)
    }
    return data
  } finally {
    clearTimeout(t)
  }
}

async function createWebSession(): Promise<WebSession> {
  const browser = await ensureBrowser()
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const id = rid('web')
  const s: WebSession = { id, createdAt: Date.now(), lastUsedAt: Date.now(), browserType: 'chromium', page, context }
  webState.sessions.set(id, s)
  pushActivity('web:session', { id, createdAt: s.createdAt })
  return s
}

function getSessionOrThrow(id: string): WebSession {
  const s = webState.sessions.get(id)
  if (!s) throw new Error('session_not_found')
  s.lastUsedAt = Date.now()
  return s
}

async function closeSession(id: string) {
  const s = webState.sessions.get(id)
  if (!s) return
  try {
    await s.page?.close()
  } catch {
  }
  try {
    await s.context?.close()
  } catch {
  }
  webState.sessions.delete(id)
  pushActivity('web:session_closed', { id })
}

function riskLevelForWebAction(action: string, meta: { selector?: string; text?: string; url?: string }): TrustLevel {
  const a = action.toLowerCase()
  const sel = (meta.selector || '').toLowerCase()
  const txt = (meta.text || '').toLowerCase()
  const url = (meta.url || '').toLowerCase()

  // Always elevate if it looks like auth/payment.
  if (sel.includes('password') || txt.includes('password')) return 3
  if (url.includes('checkout') || url.includes('payment') || url.includes('billing')) return 3
  if (a === 'type' || a === 'click') return 2
  if (a === 'navigate') return 1
  if (a === 'screenshot') return 2
  return 2
}

async function fetchTextWithLimit(url: string, opts?: { timeoutMs?: number; maxBytes?: number }) {
  const timeoutMs = opts?.timeoutMs ?? 10_000
  const maxBytes = opts?.maxBytes ?? 1_000_000

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'JASON..AI (local backend; safe fetch)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!r.ok) throw new Error(`http_${r.status}`)

    const ct = (r.headers.get('content-type') || '').toLowerCase()
    if (ct && !ct.includes('text/html') && !ct.includes('text/plain') && !ct.includes('application/xhtml+xml')) {
      throw new Error('unsupported_content_type')
    }

    const ab = await r.arrayBuffer()
    if (ab.byteLength > maxBytes) throw new Error('response_too_large')
    const txt = new TextDecoder('utf-8').decode(ab)
    return { text: txt, bytes: ab.byteLength }
  } finally {
    clearTimeout(t)
  }
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!m) return undefined
  return m[1].replace(/\s+/g, ' ').trim().slice(0, 200)
}

function extractAnchors(html: string): Array<{ text: string; href?: string }> {
  const out: Array<{ text: string; href?: string }> = []
  const re = /<a\s+[^>]*href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const href = m[1]
    const text = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200)
    if (!text) continue
    out.push({ text, href })
    if (out.length >= 200) break
  }
  return out
}

function filterMatches(items: Array<{ text: string; href?: string }>, query?: string) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return items.slice(0, 50)
  const terms = q.split(/\s+/g).filter(Boolean)
  const scored = items
    .map((it) => {
      const hay = `${it.text} ${it.href || ''}`.toLowerCase()
      const score = terms.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0)
      return { it, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, 50).map((x) => x.it)
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

app.post('/api/web/session/create', async (_req, res) => {
  try {
    const s = await createWebSession()
    res.json({ ok: true, sessionId: s.id })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || String(e) })
  }
})

app.get('/api/web/sessions', (_req, res) => {
  res.json(
    Array.from(webState.sessions.values()).map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      browserType: s.browserType,
    })),
  )
})

app.post('/api/web/session/close', async (req, res) => {
  const id = String(req.body?.id || '').trim()
  if (!id) return res.status(400).json({ ok: false, error: 'missing_id' })
  await closeSession(id)
  res.json({ ok: true })
})

app.get('/api/desktop/status', (_req, res) => {
  try {
    const u = getDesktopAgentBaseUrl()
    const tokenSet = !!String(process.env.DESKTOP_AGENT_TOKEN || '').trim()
    res.json({ ok: true, configured: tokenSet, baseUrl: u.toString(), hostAllowed: true })
  } catch (e: any) {
    res.status(200).json({ ok: true, configured: false, error: e?.message || String(e) })
  }
})

app.get('/api/desktop/health', async (_req, res) => {
  try {
    const r = await desktopAgentCall('/health')
    res.json({ ok: true, agent: r })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || String(e) })
  }
})

app.post('/api/desktop/execute', (req, res) => {
  const action = String(req.body?.action || '').trim().toLowerCase()
  if (!action) return res.status(400).json({ ok: false, error: 'missing_action' })

  let goal = ''
  if (action === 'click') {
    const x = parseNumberOrThrow(req.body?.x, 'x')
    const y = parseNumberOrThrow(req.body?.y, 'y')
    const button = String(req.body?.button || 'left').trim().toLowerCase()
    const clicks = Math.max(1, Math.min(5, parseNumberOrThrow(req.body?.clicks ?? 1, 'clicks')))
    goal = `desktop:click ${x} ${y} ${button} ${clicks}`
  } else if (action === 'move') {
    const x = parseNumberOrThrow(req.body?.x, 'x')
    const y = parseNumberOrThrow(req.body?.y, 'y')
    goal = `desktop:move ${x} ${y}`
  } else if (action === 'type') {
    const text = String(req.body?.text ?? '')
    const interval = req.body?.interval != null ? parseNumberOrThrow(req.body?.interval, 'interval') : undefined
    goal = `desktop:type ${interval != null ? interval : ''} | ${text}`.trim()
  } else if (action === 'press') {
    const key = String(req.body?.key || '').trim()
    if (!key) return res.status(400).json({ ok: false, error: 'missing_key' })
    const presses = Math.max(1, Math.min(10, parseNumberOrThrow(req.body?.presses ?? 1, 'presses')))
    goal = `desktop:press ${key} ${presses}`
  } else if (action === 'hotkey') {
    const keys: string[] = Array.isArray(req.body?.keys) ? req.body.keys.map((k: any) => String(k).trim()).filter(Boolean) : []
    if (keys.length === 0) return res.status(400).json({ ok: false, error: 'missing_keys' })
    goal = `desktop:hotkey ${keys.join('+')}`
  } else if (action === 'screenshot') {
    const fmt = String(req.body?.format || 'jpeg').trim().toLowerCase()
    const quality = req.body?.quality != null ? parseNumberOrThrow(req.body?.quality, 'quality') : undefined
    const region = req.body?.region
    if (region && typeof region === 'object') {
      const rx = parseNumberOrThrow(region.x, 'region_x')
      const ry = parseNumberOrThrow(region.y, 'region_y')
      const rw = parseNumberOrThrow(region.width, 'region_width')
      const rh = parseNumberOrThrow(region.height, 'region_height')
      goal = `desktop:screenshot ${fmt} ${quality != null ? quality : ''} ${rx} ${ry} ${rw} ${rh}`.trim()
    } else {
      goal = `desktop:screenshot ${fmt} ${quality != null ? quality : ''}`.trim()
    }
  } else {
    return res.status(400).json({ ok: false, error: 'unsupported_action' })
  }

  const id = rid('job')
  const job: OrchestratorJob = { id, goal, createdAt: Date.now(), status: 'queued' }
  state.jobs.set(id, job)
  pushActivity('orch:job', job)
  void runJob(id)
  res.json({ ok: true, jobId: id })
})

app.post('/api/commerce/scrape', async (req, res) => {
  try {
    const body = (req.body || {}) as CommerceScrapeRequest
    const urlRaw = String(body.url || '').trim()
    const query = typeof body.query === 'string' ? body.query : undefined
    if (!urlRaw) return res.status(400).json({ ok: false, error: 'missing_url' })

    const u = parseHttpUrl(urlRaw)
    assertAllowedHost(u)

    pushActivity('commerce:scrape', { url: u.toString(), query })

    const { text, bytes } = await fetchTextWithLimit(u.toString())
    const title = extractTitle(text)
    const anchors = extractAnchors(text)
    const matches = filterMatches(anchors, query)

    const out: CommerceScrapeResult = { ok: true, url: u.toString(), fetchedBytes: bytes, title, matches }
    return res.json(out)
  } catch (e: any) {
    const msg = e?.message || String(e)
    return res.status(400).json({ ok: false, error: msg })
  }
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

  try {
    // Real execution primitive (safe + verifiable): web fetch + parse.
    // Goal formats:
    // - "scrape <url>" or "scrape <url> | <query>"
    const g = j.goal.trim()
    const lower = g.toLowerCase()

    // Web automation goals:
    // - web:navigate <sessionId> <url>
    // - web:click <sessionId> <cssSelector>
    // - web:type <sessionId> <cssSelector> | <text>
    // - web:press <sessionId> <key>
    // - web:screenshot <sessionId>
    if (lower.startsWith('web:')) {
      const parts = g.split(' ')
      const cmd = (parts[0] || '').trim().toLowerCase()
      const sessionId = (parts[1] || '').trim()
      const rest = parts.slice(2).join(' ').trim()
      if (!sessionId) throw new Error('missing_session_id')

      if (state.trustPaused) throw new Error('trust_paused')

      if (cmd === 'web:navigate') {
        const u = parseHttpUrl(rest)
        assertAllowedWebHost(u)
        const actionLevel = riskLevelForWebAction('navigate', { url: u.toString() })
        if (actionLevel >= 3 && !j.waitingForPromptId) {
          ensurePrompt(j, 3, 'Approve web navigation', `Navigate to: ${u.toString()}`, { kind: 'web:navigate', sessionId, url: u.toString() })
          return
        }

        const s = getSessionOrThrow(sessionId)
        await s.page.goto(u.toString(), { waitUntil: 'domcontentloaded', timeout: 15000 })
        const title = await s.page.title().catch(() => undefined)
        const urlNow = await s.page.url().catch(() => u.toString())

        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'web:navigate', sessionId, url: urlNow, title }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'web:click') {
        const selector = rest
        if (!selector) throw new Error('missing_selector')
        const actionLevel = riskLevelForWebAction('click', { selector })
        if (actionLevel >= 3 && !j.waitingForPromptId) {
          ensurePrompt(j, 3, 'Approve web click', `Click selector: ${selector}`, { kind: 'web:click', sessionId, selector })
          return
        }

        const s = getSessionOrThrow(sessionId)
        await s.page.locator(selector).first().click({ timeout: 15000 })
        const urlNow = await s.page.url().catch(() => undefined)

        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'web:click', sessionId, selector, url: urlNow }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'web:type') {
        const [selectorPart, textPart] = rest.split('|').map((s) => s.trim())
        const selector = selectorPart
        const text = textPart ?? ''
        if (!selector) throw new Error('missing_selector')
        const actionLevel = riskLevelForWebAction('type', { selector, text })
        if (actionLevel >= 3 && !j.waitingForPromptId) {
          ensurePrompt(j, 3, 'Approve web typing', `Type into: ${selector}`, { kind: 'web:type', sessionId, selector })
          return
        }

        const s = getSessionOrThrow(sessionId)
        const loc = s.page.locator(selector).first()
        await loc.click({ timeout: 15000 })
        await loc.fill(text, { timeout: 15000 })
        const urlNow = await s.page.url().catch(() => undefined)

        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'web:type', sessionId, selector, url: urlNow }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'web:press') {
        const key = rest
        if (!key) throw new Error('missing_key')
        const actionLevel = riskLevelForWebAction('press', { text: key })
        if (actionLevel >= 3 && !j.waitingForPromptId) {
          ensurePrompt(j, 3, 'Approve key press', `Press key: ${key}`, { kind: 'web:press', sessionId, key })
          return
        }

        const s = getSessionOrThrow(sessionId)
        await s.page.keyboard.press(key)
        const urlNow = await s.page.url().catch(() => undefined)

        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'web:press', sessionId, key, url: urlNow }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'web:screenshot') {
        const actionLevel = riskLevelForWebAction('screenshot', {})
        if (actionLevel >= 3 && !j.waitingForPromptId) {
          ensurePrompt(j, 3, 'Approve screenshot', 'Capture a screenshot of the current page', { kind: 'web:screenshot', sessionId })
          return
        }

        const s = getSessionOrThrow(sessionId)
        const buf = await s.page.screenshot({ type: 'jpeg', quality: 70, fullPage: true })
        const b64 = Buffer.from(buf).toString('base64')
        const urlNow = await s.page.url().catch(() => undefined)

        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'web:screenshot', sessionId, url: urlNow, mime: 'image/jpeg', base64: b64 }
        pushActivity('orch:job', j2)
        return
      }

      throw new Error('unsupported_web_command')
    }

    if (lower.startsWith('desktop:')) {
      const parts = g.split(' ')
      const cmd = (parts[0] || '').trim().toLowerCase()
      const rest = parts.slice(1).join(' ').trim()

      if (state.trustPaused) throw new Error('trust_paused')

      if (!j.waitingForPromptId) {
        if (cmd === 'desktop:screenshot') {
          ensurePrompt(j, 3, 'Approve desktop screenshot', 'Capture a screenshot of the desktop', { kind: cmd })
          return
        }
        if (cmd === 'desktop:click') {
          ensurePrompt(j, 3, 'Approve desktop click', `Click at: ${rest}`, { kind: cmd })
          return
        }
        if (cmd === 'desktop:move') {
          ensurePrompt(j, 3, 'Approve mouse move', `Move mouse to: ${rest}`, { kind: cmd })
          return
        }
        if (cmd === 'desktop:type') {
          ensurePrompt(j, 3, 'Approve desktop typing', 'Type text into the active window', { kind: cmd })
          return
        }
        if (cmd === 'desktop:press') {
          ensurePrompt(j, 3, 'Approve key press', `Press key(s): ${rest}`, { kind: cmd })
          return
        }
        if (cmd === 'desktop:hotkey') {
          ensurePrompt(j, 3, 'Approve hotkey', `Hotkey: ${rest}`, { kind: cmd })
          return
        }
      }

      pushActivity('desktop:command', { cmd, rest })

      if (cmd === 'desktop:click') {
        const [xRaw, yRaw, buttonRaw, clicksRaw] = rest.split(' ').filter(Boolean)
        const x = parseNumberOrThrow(xRaw, 'x')
        const y = parseNumberOrThrow(yRaw, 'y')
        const button = String(buttonRaw || 'left').toLowerCase()
        const clicks = clicksRaw != null ? parseNumberOrThrow(clicksRaw, 'clicks') : 1
        const r = await desktopAgentCall('/execute', { action: 'click', x, y, button, clicks })
        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'desktop:click', agent: r }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'desktop:move') {
        const [xRaw, yRaw] = rest.split(' ').filter(Boolean)
        const x = parseNumberOrThrow(xRaw, 'x')
        const y = parseNumberOrThrow(yRaw, 'y')
        const r = await desktopAgentCall('/execute', { action: 'move', x, y })
        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'desktop:move', agent: r }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'desktop:type') {
        const [intervalPart, textPart] = rest.split('|').map((s) => s.trim())
        const interval = intervalPart ? parseNumberOrThrow(intervalPart, 'interval') : undefined
        const text = textPart ?? ''
        const r = await desktopAgentCall('/execute', { action: 'type', text, interval })
        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'desktop:type', agent: r }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'desktop:press') {
        const [keyRaw, pressesRaw] = rest.split(' ').filter(Boolean)
        const key = String(keyRaw || '').trim()
        if (!key) throw new Error('missing_key')
        const presses = pressesRaw ? parseNumberOrThrow(pressesRaw, 'presses') : 1
        const r = await desktopAgentCall('/execute', { action: 'press', key, presses })
        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'desktop:press', agent: r }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'desktop:hotkey') {
        const keys = rest.split('+').map((s) => s.trim()).filter(Boolean)
        if (keys.length === 0) throw new Error('missing_keys')
        const r = await desktopAgentCall('/execute', { action: 'hotkey', keys })
        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'desktop:hotkey', agent: r }
        pushActivity('orch:job', j2)
        return
      }

      if (cmd === 'desktop:screenshot') {
        const parts2 = rest.split(' ').filter(Boolean)
        const format = String(parts2[0] || 'jpeg').trim().toLowerCase()
        const quality = parts2[1] ? parseNumberOrThrow(parts2[1], 'quality') : undefined
        if (parts2.length >= 6) {
          const x = parseNumberOrThrow(parts2[2], 'region_x')
          const y = parseNumberOrThrow(parts2[3], 'region_y')
          const width = parseNumberOrThrow(parts2[4], 'region_width')
          const height = parseNumberOrThrow(parts2[5], 'region_height')
          const r = await desktopAgentCall('/execute', { action: 'screenshot', format, quality, region: { x, y, width, height } })
          const j2 = state.jobs.get(id)
          if (!j2) return
          if (j2.status === 'cancelled') return
          j2.status = 'completed'
          j2.result = { ok: true, kind: 'desktop:screenshot', agent: r }
          pushActivity('orch:job', j2)
          return
        }

        const r = await desktopAgentCall('/execute', { action: 'screenshot', format, quality })
        const j2 = state.jobs.get(id)
        if (!j2) return
        if (j2.status === 'cancelled') return
        j2.status = 'completed'
        j2.result = { ok: true, kind: 'desktop:screenshot', agent: r }
        pushActivity('orch:job', j2)
        return
      }

      throw new Error('unsupported_desktop_command')
    }

    if (lower.startsWith('scrape ')) {
      const rest = g.slice('scrape '.length).trim()
      const [urlPart, queryPart] = rest.split('|').map((s) => s.trim())
      const u = parseHttpUrl(urlPart)
      assertAllowedHost(u)

      const { text, bytes } = await fetchTextWithLimit(u.toString())
      const title = extractTitle(text)
      const anchors = extractAnchors(text)
      const matches = filterMatches(anchors, queryPart)

      const j2 = state.jobs.get(id)
      if (!j2) return
      if (j2.status === 'cancelled') return

      j2.status = 'completed'
      j2.result = {
        ok: true,
        kind: 'commerce:scrape',
        url: u.toString(),
        fetchedBytes: bytes,
        title,
        matches,
      }
      pushActivity('orch:job', j2)
      return
    }

    const j2 = state.jobs.get(id)
    if (!j2) return
    if (j2.status === 'cancelled') return

    j2.status = 'failed'
    j2.error = 'unsupported_goal'
    j2.result = { ok: false, error: 'unsupported_goal', hint: "Use: scrape <url> | <query> OR web:navigate/web:click/web:type/web:press/web:screenshot" }
    pushActivity('orch:job', j2)
  } catch (e: any) {
    const j2 = state.jobs.get(id)
    if (!j2) return
    if (j2.status === 'cancelled') return

    j2.status = 'failed'
    j2.error = e?.message || String(e)
    j2.result = { ok: false, error: j2.error }
    pushActivity('orch:job', j2)
  }
}

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  pushActivity('system', { ok: true, port })
})

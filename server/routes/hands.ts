import { Router } from 'express'
import { z } from 'zod'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { runPowerShell } from '../services/automation/PowerShellRunner'
import { WindowsUIAutomationAdapter } from '../services/agents/WindowsUIAutomationAgent'
import { ghostWorkspaceManager } from '../services/automation/GhostWorkspaceManager'
import { inputPriorityGuard } from '../services/input/InputPriorityGuard'
import { sseBroker } from '../services/websocket-service'
import { permissionManager } from '../services/trust/PermissionManager'
import type { ActionDefinition } from '../services/ai/selfLearning/Adapters'

const router = Router()

const uiAdapter = new WindowsUIAutomationAdapter()
try { inputPriorityGuard.start() } catch { }

type BrowserState = {
  browser: Browser | null
  context: BrowserContext | null
  page: Page | null
  headless: boolean
  startedAt: number | null
}

const browserState: BrowserState = {
  browser: null,
  context: null,
  page: null,
  headless: true,
  startedAt: null,
}

type LoopTarget = 'browser' | 'system'
type LoopEvent = {
  id: string
  timestamp: number
  target: LoopTarget
  url?: string
  title?: string
  dataUrl?: string
  error?: string
}

type LoopState = {
  running: boolean
  intervalMs: number
  includeImage: boolean
  fullPage: boolean
  target: LoopTarget
  maxBuffer: number
  buffer: LoopEvent[]
  timer: ReturnType<typeof setInterval> | null
  lastTickAt: number | null
  error: string | null
  emitSse: boolean
  inFlight: boolean
}

const loopState: LoopState = {
  running: false,
  intervalMs: 2000,
  includeImage: false,
  fullPage: true,
  target: 'browser',
  maxBuffer: 30,
  buffer: [],
  timer: null,
  lastTickAt: null,
  error: null,
  emitSse: true,
  inFlight: false,
}

function emitHandsEvent(event: string, payload: any) {
  try { sseBroker.broadcast(`hands:${event}`, payload) } catch { }
}

async function waitForUserIdle(maxWaitMs = 10000, quietWindowMs = 800): Promise<boolean> {
  const start = Date.now()
  while ((Date.now() - start) < Math.max(100, maxWaitMs)) {
    try { if (!inputPriorityGuard.isActive(quietWindowMs)) return true } catch { }
    await new Promise(r => setTimeout(r, 100))
  }
  try { return !inputPriorityGuard.isActive(quietWindowMs) } catch { return true }
}

async function requestApproval(opts: {
  requireApproval?: boolean
  level?: 1 | 2 | 3
  title: string
  rationale?: string
  meta?: any
  timeoutMs?: number
}): Promise<{ ok: boolean; promptId?: string; decision?: string; error?: string }> {
  if (!opts.requireApproval) return { ok: true }
  if (permissionManager.isPaused()) return { ok: false, error: 'paused_by_kill_switch' }
  const prompt = permissionManager.createPrompt({
    level: opts.level ?? 3,
    title: opts.title,
    rationale: opts.rationale,
    options: ['approve', 'reject', 'delay'],
    meta: opts.meta,
  })
  const decision = await permissionManager.waitForDecision(prompt.id, opts.timeoutMs ?? 120000)
  if (decision !== 'approve') {
    return { ok: false, decision, promptId: prompt.id, error: `blocked_by_user_${decision}` }
  }
  return { ok: true, promptId: prompt.id }
}

type GuardOptions = {
  waitForIdle?: boolean
  idleTimeoutMs?: number
  quietWindowMs?: number
  requireApproval?: boolean
  approvalLevel?: 1 | 2 | 3
  approvalTitle?: string
  approvalRationale?: string
}

async function applyGuards(guard: GuardOptions, title: string, meta?: any): Promise<{ ok: boolean; promptId?: string; decision?: string; error?: string }> {
  if (permissionManager.isPaused()) return { ok: false, error: 'paused_by_kill_switch' }
  const waitForIdleEnabled = guard.waitForIdle !== false
  if (waitForIdleEnabled) {
    const ok = await waitForUserIdle(
      Number.isFinite(guard.idleTimeoutMs) ? Number(guard.idleTimeoutMs) : 10000,
      Number.isFinite(guard.quietWindowMs) ? Number(guard.quietWindowMs) : 800
    )
    if (!ok) return { ok: false, error: 'deferred_due_to_user_activity' }
  }
  return requestApproval({
    requireApproval: guard.requireApproval,
    level: guard.approvalLevel,
    title: guard.approvalTitle || title,
    rationale: guard.approvalRationale,
    meta,
  })
}

function defaultApproval(guard: GuardOptions | undefined, title: string, rationale: string): GuardOptions {
  return {
    ...guard,
    requireApproval: guard?.requireApproval ?? true,
    approvalLevel: guard?.approvalLevel ?? 3,
    approvalTitle: guard?.approvalTitle || title,
    approvalRationale: guard?.approvalRationale || rationale,
  }
}

async function runUiOperation(op: string, payload: any, guard: GuardOptions, title: string): Promise<{ ok: boolean; result?: any; error?: string; promptId?: string; decision?: string }> {
  const guardRes = await applyGuards(guard, title, { op, payload })
  if (!guardRes.ok) return { ok: false, error: guardRes.error || 'guard_failed', promptId: guardRes.promptId, decision: guardRes.decision }
  const out = await executeUi(op, payload)
  if (!out.ok) return { ok: false, error: out.error || 'ui_failed', promptId: guardRes.promptId }
  return { ok: true, result: out.result, promptId: guardRes.promptId }
}

async function executeUi(op: string, payload: any): Promise<{ ok: boolean; result?: any; error?: string }> {
  const action: ActionDefinition = {
    type: 'ui',
    name: op,
    payload: { ...payload, op },
  }
  return uiAdapter.execute(action)
}

async function takeSystemScreenshot(): Promise<{ dataUrl: string }> {
  if (process.platform !== 'win32') throw new Error('system_screenshot_only_supported_on_windows')
  let screenshotPath: string | null = null
  try {
    screenshotPath = path.join(os.tmpdir(), `hands_sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`)
    const escaped = screenshotPath.replace(/\\/g, '\\\\')

    const psScript = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
$bitmap.Save("${escaped}", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output "${escaped}"
`.trim()

    const out = await runPowerShell(psScript, 20000)
    if (out.code !== 0) {
      throw new Error((out.stderr || out.stdout || '').toString().trim() || 'system_screenshot_failed')
    }

    const buf = await fs.readFile(screenshotPath)
    const b64 = buf.toString('base64')
    return { dataUrl: `data:image/png;base64,${b64}` }
  } finally {
    try { if (screenshotPath) await fs.unlink(screenshotPath) } catch { }
  }
}

async function takeGhostScreenshot(desktopName: string): Promise<{ dataUrl: string }> {
  if (process.platform !== 'win32') throw new Error('ghost_desktop_not_supported_on_platform')
  const dn = String(desktopName || '').trim()
  if (!dn) throw new Error('desktopName_required')
  let screenshotPath: string | null = null
  try {
    screenshotPath = path.join(os.tmpdir(), `hands_ghost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`)
    const escaped = screenshotPath.replace(/\\/g, '\\\\')

    const psScript = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
$bitmap.Save("${escaped}", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output "${escaped}"
`.trim()

    const out = await ghostWorkspaceManager.runPowerShellOnDesktop(dn, psScript, 20000)
    if (out.code !== 0) {
      throw new Error((out.stderr || out.stdout || '').toString().trim() || 'ghost_screenshot_failed')
    }

    const buf = await fs.readFile(screenshotPath)
    const b64 = buf.toString('base64')
    return { dataUrl: `data:image/png;base64,${b64}` }
  } finally {
    try { if (screenshotPath) await fs.unlink(screenshotPath) } catch { }
  }
}

async function takeBrowserSnapshot(opts?: { includeImage?: boolean; fullPage?: boolean }): Promise<{ url: string; title: string; dataUrl?: string }> {
  if (!browserState.page) throw new Error('browser_not_started')
  const url = browserState.page.url()
  const title = await browserState.page.title().catch(() => '')
  if (!opts?.includeImage) return { url, title }
  const buf = await browserState.page.screenshot({ type: 'png', fullPage: opts.fullPage !== false })
  const b64 = Buffer.from(buf).toString('base64')
  return { url, title, dataUrl: `data:image/png;base64,${b64}` }
}

function pushLoopEvent(evt: LoopEvent) {
  loopState.buffer.push(evt)
  if (loopState.buffer.length > loopState.maxBuffer) {
    loopState.buffer.splice(0, loopState.buffer.length - loopState.maxBuffer)
  }
}

async function runLoopTick() {
  if (!loopState.running || loopState.inFlight) return
  loopState.inFlight = true
  const timestamp = Date.now()
  let event: LoopEvent

  try {
    if (permissionManager.isPaused()) throw new Error('paused_by_kill_switch')
    if (loopState.target === 'browser') {
      const shot = await takeBrowserSnapshot({ includeImage: loopState.includeImage, fullPage: loopState.fullPage })
      event = {
        id: `hands_loop_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp,
        target: 'browser',
        url: shot.url,
        title: shot.title,
        dataUrl: shot.dataUrl,
      }
    } else {
      const shot = loopState.includeImage ? await takeSystemScreenshot() : { dataUrl: undefined }
      event = {
        id: `hands_loop_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp,
        target: 'system',
        dataUrl: shot.dataUrl,
      }
    }
  } catch (e: any) {
    const error = e?.message || 'loop_failed'
    loopState.error = error
    event = {
      id: `hands_loop_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      target: loopState.target,
      error,
    }
  } finally {
    loopState.lastTickAt = Date.now()
    loopState.inFlight = false
    pushLoopEvent(event)
    if (loopState.emitSse) emitHandsEvent('loop', event)
  }
}

function startLoop(opts: Partial<Pick<LoopState, 'intervalMs' | 'includeImage' | 'fullPage' | 'target' | 'maxBuffer' | 'emitSse'>> = {}) {
  if (loopState.timer) {
    clearInterval(loopState.timer)
    loopState.timer = null
  }
  loopState.running = true
  loopState.intervalMs = Number.isFinite(opts.intervalMs) ? Math.max(250, Number(opts.intervalMs)) : loopState.intervalMs
  loopState.includeImage = typeof opts.includeImage === 'boolean' ? opts.includeImage : loopState.includeImage
  loopState.fullPage = typeof opts.fullPage === 'boolean' ? opts.fullPage : loopState.fullPage
  loopState.target = opts.target || loopState.target
  loopState.maxBuffer = Number.isFinite(opts.maxBuffer) ? Math.max(5, Math.min(200, Number(opts.maxBuffer))) : loopState.maxBuffer
  loopState.emitSse = typeof opts.emitSse === 'boolean' ? opts.emitSse : loopState.emitSse
  loopState.error = null

  loopState.timer = setInterval(() => { void runLoopTick() }, loopState.intervalMs)
  void runLoopTick()
}

function stopLoop() {
  loopState.running = false
  if (loopState.timer) {
    clearInterval(loopState.timer)
    loopState.timer = null
  }
}

async function ensureBrowser(opts?: { headless?: boolean }): Promise<void> {
  const desiredHeadless = typeof opts?.headless === 'boolean'
    ? opts.headless
    : (browserState.browser ? browserState.headless : (process.env.HANDS_HEADLESS !== 'false'))

  if (browserState.browser && browserState.page && browserState.headless === desiredHeadless) return

  try {
    await browserState.page?.close()
  } catch { }
  try {
    await browserState.context?.close()
  } catch { }
  try {
    await browserState.browser?.close()
  } catch { }

  browserState.browser = await chromium.launch({
    headless: desiredHeadless,
  })
  browserState.context = await browserState.browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  browserState.page = await browserState.context.newPage()
  browserState.headless = desiredHeadless
  browserState.startedAt = Date.now()
}

async function currentBrowserStatus(): Promise<{ ok: true; status: any } | { ok: false; error: string }> {
  try {
    if (!browserState.page) return { ok: false, error: 'browser_not_started' }
    const url = browserState.page.url()
    const title = await browserState.page.title().catch(() => '')
    return {
      ok: true,
      status: {
        started: true,
        headless: browserState.headless,
        startedAt: browserState.startedAt,
        url,
        title,
      },
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'status_failed' }
  }
}

router.get('/browser/status', async (_req, res) => {
  const out = await currentBrowserStatus()
  if (!out.ok) return res.status(400).json(out)
  res.json(out)
})

const EnsureSchema = z.object({
  headless: z.boolean().optional(),
})

const ApprovalLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

const GuardSchema = z.object({
  waitForIdle: z.boolean().optional(),
  idleTimeoutMs: z.number().optional(),
  quietWindowMs: z.number().optional(),
  requireApproval: z.boolean().optional(),
  approvalLevel: ApprovalLevelSchema.optional(),
  approvalTitle: z.string().optional(),
  approvalRationale: z.string().optional(),
}).optional()

const RegionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

router.post('/browser/ensure', async (req, res) => {
  try {
    const body = EnsureSchema.parse(req.body || {})
    await ensureBrowser({ headless: body.headless })
    const out = await currentBrowserStatus()
    res.json(out)
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ensure_failed' })
  }
})

const NavigateSchema = z.object({
  url: z.string().url(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional(),
  timeoutMs: z.number().optional(),
  headless: z.boolean().optional(),
  guard: GuardSchema,
})

router.post('/browser/navigate', async (req, res) => {
  try {
    const body = NavigateSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const guardRes = await applyGuards(guard, 'Navigate browser', { url: body.url })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    await ensureBrowser({ headless: body.headless })
    if (!browserState.page) return res.status(400).json({ ok: false, error: 'browser_not_started' })

    const prevUrl = browserState.page.url()
    await browserState.page.goto(body.url, {
      waitUntil: body.waitUntil || 'domcontentloaded',
      timeout: Number.isFinite(body.timeoutMs) ? Number(body.timeoutMs) : 30000,
    })

    const out = await currentBrowserStatus()
    if (!out.ok) return res.status(500).json(out)
    res.json({ ok: true, prevUrl, ...out.status, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'navigate_failed' })
  }
})

const ClickSchema = z.object({
  x: z.number(),
  y: z.number(),
  button: z.enum(['left', 'right', 'middle']).optional(),
  clickCount: z.number().optional(),
  guard: GuardSchema,
})

router.post('/browser/click', async (req, res) => {
  try {
    const body = ClickSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: browser click', 'Browser click may trigger high-impact actions.')
    const guardRes = await applyGuards(guard, guard.approvalTitle || 'Confirm: browser click', { x: body.x, y: body.y })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    await ensureBrowser()
    if (!browserState.page) return res.status(400).json({ ok: false, error: 'browser_not_started' })

    await browserState.page.mouse.click(body.x, body.y, {
      button: body.button || 'left',
      clickCount: Number.isFinite(body.clickCount) ? Number(body.clickCount) : 1,
    })

    const out = await currentBrowserStatus()
    if (!out.ok) return res.status(500).json(out)
    res.json({ ok: true, ...out.status, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'click_failed' })
  }
})

const TypeSchema = z.object({
  text: z.string().min(1),
  delayMs: z.number().optional(),
  guard: GuardSchema,
})

router.post('/browser/type', async (req, res) => {
  try {
    const body = TypeSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: browser typing', 'Browser typing can submit data or trigger actions.')
    const guardRes = await applyGuards(guard, guard.approvalTitle || 'Confirm: browser typing', { textLength: body.text.length })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    await ensureBrowser()
    if (!browserState.page) return res.status(400).json({ ok: false, error: 'browser_not_started' })

    await browserState.page.keyboard.type(body.text, {
      delay: Number.isFinite(body.delayMs) ? Number(body.delayMs) : 20,
    })

    const out = await currentBrowserStatus()
    if (!out.ok) return res.status(500).json(out)
    res.json({ ok: true, ...out.status, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'type_failed' })
  }
})

const PressSchema = z.object({
  key: z.string().min(1),
  delayMs: z.number().optional(),
  guard: GuardSchema,
})

router.post('/browser/press', async (req, res) => {
  try {
    const body = PressSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: browser key press', 'Keyboard shortcuts can trigger high-impact actions.')
    const guardRes = await applyGuards(guard, guard.approvalTitle || 'Confirm: browser key press', { key: body.key })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    await ensureBrowser()
    if (!browserState.page) return res.status(400).json({ ok: false, error: 'browser_not_started' })

    await browserState.page.keyboard.press(body.key, {
      delay: Number.isFinite(body.delayMs) ? Number(body.delayMs) : 20,
    })

    const out = await currentBrowserStatus()
    if (!out.ok) return res.status(500).json(out)
    res.json({ ok: true, ...out.status, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'press_failed' })
  }
})

const ScrollSchema = z.object({
  deltaX: z.number().optional(),
  deltaY: z.number().optional(),
  guard: GuardSchema,
})

router.post('/browser/scroll', async (req, res) => {
  try {
    const body = ScrollSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: browser scroll', 'Scrolling can trigger lazy-load actions or navigation.')
    const guardRes = await applyGuards(guard, guard.approvalTitle || 'Confirm: browser scroll', { deltaX: body.deltaX, deltaY: body.deltaY })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    await ensureBrowser()
    if (!browserState.page) return res.status(400).json({ ok: false, error: 'browser_not_started' })

    const dx = Number.isFinite(body.deltaX) ? Number(body.deltaX) : 0
    const dy = Number.isFinite(body.deltaY) ? Number(body.deltaY) : 300
    await browserState.page.mouse.wheel(dx, dy)

    const out = await currentBrowserStatus()
    if (!out.ok) return res.status(500).json(out)
    res.json({ ok: true, ...out.status, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'scroll_failed' })
  }
})

const ScreenshotSchema = z.object({
  fullPage: z.boolean().optional(),
  guard: GuardSchema,
})

router.post('/browser/screenshot', async (req, res) => {
  try {
    const body = ScreenshotSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const guardRes = await applyGuards(guard, 'Browser screenshot', { fullPage: body.fullPage })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    await ensureBrowser()
    if (!browserState.page) return res.status(400).json({ ok: false, error: 'browser_not_started' })

    const shot = await takeBrowserSnapshot({ includeImage: true, fullPage: body.fullPage !== false })
    res.json({ ok: true, url: shot.url, title: shot.title, dataUrl: shot.dataUrl, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'screenshot_failed' })
  }
})

router.post('/browser/close', async (_req, res) => {
  try {
    try { await browserState.page?.close() } catch { }
    try { await browserState.context?.close() } catch { }
    try { await browserState.browser?.close() } catch { }
    browserState.browser = null
    browserState.context = null
    browserState.page = null
    browserState.startedAt = null
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'close_failed' })
  }
})

router.get('/system/status', (_req, res) => {
  res.json({
    ok: true,
    platform: process.platform,
    inputGuard: inputPriorityGuard.status(),
    paused: permissionManager.isPaused(),
  })
})

const SystemScreenshotSchema = z.object({
  guard: GuardSchema,
})

router.post('/system/screenshot', async (req, res) => {
  try {
    const body = SystemScreenshotSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const guardRes = await applyGuards(guard, 'System screenshot', { target: 'system' })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    const shot = await takeSystemScreenshot()
    res.json({ ok: true, dataUrl: shot.dataUrl, promptId: guardRes.promptId })
  } catch (e: any) {
    const msg = e?.message || 'system_screenshot_failed'
    const status = msg.includes('supported_on_windows') ? 400 : 500
    res.status(status).json({ ok: false, error: msg })
  }
})

const UiTreeSchema = z.object({
  windowTitle: z.string().optional(),
  maxItems: z.number().optional(),
  includeOffscreen: z.boolean().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiSearchSchema = z.object({
  query: z.string().min(1),
  controlType: z.string().optional(),
  maxResults: z.number().optional(),
  includeOffscreen: z.boolean().optional(),
  windowTitle: z.string().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiInvokeSchema = z.object({
  name: z.string().min(1),
  controlType: z.string().optional(),
  windowTitle: z.string().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiSetValueSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  controlType: z.string().optional(),
  windowTitle: z.string().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiFindWindowSchema = z.object({
  windowTitle: z.string().min(1),
  guard: GuardSchema,
})

const UiOcrSchema = z.object({
  windowTitle: z.string().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiDescribeSchema = z.object({
  prompt: z.string().optional(),
  region: RegionSchema.optional(),
  modelName: z.string().optional(),
  revision: z.string().optional(),
  timeoutMs: z.number().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiSemanticClickSchema = z.object({
  targetText: z.string().min(1),
  region: RegionSchema.optional(),
  modelName: z.string().optional(),
  revision: z.string().optional(),
  timeoutMs: z.number().optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiVisualClickSchema = z.object({
  templateImage: z.string().optional(),
  templatePath: z.string().optional(),
  threshold: z.number().optional(),
  region: RegionSchema.optional(),
  desktopName: z.string().optional(),
  guard: GuardSchema,
})

const UiExecuteSchema = z.object({
  op: z.string().min(1),
  payload: z.record(z.any()).optional(),
  guard: GuardSchema,
})

router.get('/ui/status', (_req, res) => {
  res.json({
    ok: true,
    platform: process.platform,
    inputGuard: inputPriorityGuard.status(),
    paused: permissionManager.isPaused(),
  })
})

router.post('/ui/tree', async (req, res) => {
  try {
    const body = UiTreeSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const out = await runUiOperation('ui.tree.dump', {
      windowTitle: body.windowTitle,
      maxItems: body.maxItems,
      includeOffscreen: body.includeOffscreen,
      desktopName: body.desktopName,
    }, guard, 'UI tree dump')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_tree_failed' })
  }
})

router.post('/ui/search', async (req, res) => {
  try {
    const body = UiSearchSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const out = await runUiOperation('control.search', {
      query: body.query,
      controlType: body.controlType,
      maxResults: body.maxResults,
      includeOffscreen: body.includeOffscreen,
      windowTitle: body.windowTitle,
      desktopName: body.desktopName,
    }, guard, 'UI control search')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_search_failed' })
  }
})

router.post('/ui/window', async (req, res) => {
  try {
    const body = UiFindWindowSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const out = await runUiOperation('window.find', {
      windowTitle: body.windowTitle,
    }, guard, 'UI window find')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_window_failed' })
  }
})

router.post('/ui/invoke', async (req, res) => {
  try {
    const body = UiInvokeSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: UI invoke', 'UI control invocation can trigger high-impact actions.')
    const out = await runUiOperation('control.invoke', {
      name: body.name,
      controlType: body.controlType,
      windowTitle: body.windowTitle,
      desktopName: body.desktopName,
    }, guard, guard.approvalTitle || 'Confirm: UI invoke')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_invoke_failed' })
  }
})

router.post('/ui/set-value', async (req, res) => {
  try {
    const body = UiSetValueSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: UI set value', 'Setting UI values can modify system state.')
    const out = await runUiOperation('control.set_value', {
      name: body.name,
      value: body.value,
      controlType: body.controlType,
      windowTitle: body.windowTitle,
      desktopName: body.desktopName,
    }, guard, guard.approvalTitle || 'Confirm: UI set value')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_set_value_failed' })
  }
})

router.post('/ui/ocr', async (req, res) => {
  try {
    const body = UiOcrSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const out = await runUiOperation('ocr.read_text', {
      windowTitle: body.windowTitle,
      desktopName: body.desktopName,
    }, guard, 'UI OCR read text')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_ocr_failed' })
  }
})

router.post('/ui/describe', async (req, res) => {
  try {
    const body = UiDescribeSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const out = await runUiOperation('vlm.describe_screen', {
      prompt: body.prompt,
      region: body.region,
      modelName: body.modelName,
      revision: body.revision,
      timeoutMs: body.timeoutMs,
      desktopName: body.desktopName,
    }, guard, 'VLM describe screen')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_describe_failed' })
  }
})

router.post('/ui/semantic-click', async (req, res) => {
  try {
    const body = UiSemanticClickSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: semantic click', 'Vision-guided click can trigger high-impact actions.')
    const out = await runUiOperation('vlm.semantic_click', {
      targetText: body.targetText,
      region: body.region,
      modelName: body.modelName,
      revision: body.revision,
      timeoutMs: body.timeoutMs,
      desktopName: body.desktopName,
    }, guard, guard.approvalTitle || 'Confirm: semantic click')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_semantic_click_failed' })
  }
})

router.post('/ui/visual-click', async (req, res) => {
  try {
    const body = UiVisualClickSchema.parse(req.body || {})
    if (!body.templateImage && !body.templatePath) {
      return res.status(400).json({ ok: false, error: 'templateImage_or_templatePath_required' })
    }
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: visual click', 'Template-based click can trigger high-impact actions.')
    const out = await runUiOperation('vlm.visual_click', {
      templateImage: body.templateImage,
      templatePath: body.templatePath,
      threshold: body.threshold,
      region: body.region,
      desktopName: body.desktopName,
    }, guard, guard.approvalTitle || 'Confirm: visual click')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_visual_click_failed' })
  }
})

router.post('/ui/execute', async (req, res) => {
  try {
    const body = UiExecuteSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: UI execute', 'Executing a UI operation can change system state.')
    const out = await runUiOperation(body.op, body.payload || {}, guard, guard.approvalTitle || 'Confirm: UI execute')
    if (!out.ok) return res.status(400).json(out)
    res.json({ ok: true, result: out.result, promptId: out.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ui_execute_failed' })
  }
})

const GhostLaunchSchema = z.object({
  path: z.string().min(1),
  args: z.array(z.string()).optional(),
  desktopName: z.string().optional(),
  timeoutMs: z.number().optional(),
  guard: GuardSchema,
})

const GhostScreenshotSchema = z.object({
  desktopName: z.string().min(1),
  guard: GuardSchema,
})

router.post('/ghost/launch', async (req, res) => {
  try {
    const body = GhostLaunchSchema.parse(req.body || {})
    const guard = defaultApproval({
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? true,
    }, 'Confirm: launch hidden desktop app', 'Launching hidden apps can be high-impact.')
    const guardRes = await applyGuards(guard, guard.approvalTitle || 'Confirm: launch hidden desktop app', { path: body.path })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    const out = await ghostWorkspaceManager.launchOnHiddenDesktop({
      path: body.path,
      args: body.args,
      desktopName: body.desktopName,
      timeoutMs: body.timeoutMs,
    })
    if (out.ok === false) return res.status(500).json({ ok: false, error: out.error, promptId: guardRes.promptId })
    res.json({ ok: true, result: out.result, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'ghost_launch_failed' })
  }
})

router.post('/ghost/screenshot', async (req, res) => {
  try {
    const body = GhostScreenshotSchema.parse(req.body || {})
    const guard = {
      ...(body.guard || {}),
      waitForIdle: body.guard?.waitForIdle ?? false,
      requireApproval: body.guard?.requireApproval ?? false,
    }
    const guardRes = await applyGuards(guard, 'Ghost desktop screenshot', { desktopName: body.desktopName })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    const shot = await takeGhostScreenshot(body.desktopName)
    res.json({ ok: true, dataUrl: shot.dataUrl, promptId: guardRes.promptId })
  } catch (e: any) {
    const msg = e?.message || 'ghost_screenshot_failed'
    res.status(500).json({ ok: false, error: msg })
  }
})

const LoopStartSchema = z.object({
  intervalMs: z.number().optional(),
  includeImage: z.boolean().optional(),
  fullPage: z.boolean().optional(),
  target: z.enum(['browser', 'system']).optional(),
  maxBuffer: z.number().optional(),
  emitSse: z.boolean().optional(),
  guard: GuardSchema,
})

router.get('/loop/status', (_req, res) => {
  const lastEvent = loopState.buffer.length ? loopState.buffer[loopState.buffer.length - 1] : null
  res.json({
    ok: true,
    running: loopState.running,
    intervalMs: loopState.intervalMs,
    includeImage: loopState.includeImage,
    fullPage: loopState.fullPage,
    target: loopState.target,
    maxBuffer: loopState.maxBuffer,
    bufferCount: loopState.buffer.length,
    lastTickAt: loopState.lastTickAt,
    error: loopState.error,
    emitSse: loopState.emitSse,
    lastEvent,
  })
})

router.get('/loop/events', (req, res) => {
  const rawLimit = typeof req.query.limit === 'string' ? req.query.limit : ''
  const n = parseInt(rawLimit || '', 10)
  const take = Number.isFinite(n) && n > 0 ? Math.min(200, n) : loopState.buffer.length
  const events = loopState.buffer.slice(Math.max(0, loopState.buffer.length - take))
  res.json({ ok: true, events })
})

router.post('/loop/start', async (req, res) => {
  try {
    const body = LoopStartSchema.parse(req.body || {})
    const needsApproval = body.guard?.requireApproval ?? body.includeImage === true
    const guard = needsApproval
      ? defaultApproval({ ...(body.guard || {}), waitForIdle: false }, 'Confirm: start capture loop', 'Continuous screen capture can be sensitive.')
      : { ...(body.guard || {}), waitForIdle: false, requireApproval: false }
    const guardRes = await applyGuards(guard, guard.approvalTitle || 'Confirm: start capture loop', { target: body.target, includeImage: body.includeImage })
    if (!guardRes.ok) {
      return res.status(403).json({ ok: false, error: guardRes.error, decision: guardRes.decision, promptId: guardRes.promptId })
    }
    startLoop({
      intervalMs: body.intervalMs,
      includeImage: body.includeImage,
      fullPage: body.fullPage,
      target: body.target,
      maxBuffer: body.maxBuffer,
      emitSse: body.emitSse,
    })
    res.json({ ok: true, running: loopState.running, promptId: guardRes.promptId })
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'loop_start_failed' })
  }
})

router.post('/loop/tick', async (_req, res) => {
  await runLoopTick()
  res.json({ ok: true, lastTickAt: loopState.lastTickAt })
})

router.post('/loop/stop', (_req, res) => {
  stopLoop()
  res.json({ ok: true, running: loopState.running })
})

router.post('/loop/clear', (_req, res) => {
  loopState.buffer = []
  res.json({ ok: true, bufferCount: 0 })
})

export default router

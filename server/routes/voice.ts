import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { bdiCore } from '../services/intelligence/BDICore'
import { flightSearchService } from '../services/flights/FlightSearchService'
import { sseBroker } from '../services/websocket-service'
import { permissionManager } from '../services/trust/PermissionManager'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
})

const CommandSchema = z.object({
  transcript: z.string().min(1),
  priority: z.number().min(1).max(10).optional(),
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

function parseFlightIntent(
  t: string
):
  | { origin: string; destination: string; departureDate: string; returnDate?: string; returnDateFrom?: string; returnDateTo?: string; passengers?: number }
  | null {
  const text = String(t || '').toLowerCase()

  const base = text.match(/from\s+([a-z]{3})\s+to\s+([a-z]{3})/i)
  if (!base) return null
  const origin = base[1].toUpperCase()
  const destination = base[2].toUpperCase()

  const paxMatch = text.match(/\bfor\s+(\d{1,2})\b/i)
  const passengers = paxMatch ? Math.max(1, Math.min(9, parseInt(paxMatch[1], 10) || 1)) : undefined

  const now = new Date()
  const months: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  }

  const toIso = (year: number, month: number, day: number) => {
    const y = String(year)
    const m = String(month).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const pickYear = (month: number, day: number, explicitYear?: number) => {
    if (explicitYear && Number.isFinite(explicitYear)) return explicitYear
    const y = now.getUTCFullYear()
    const candidate = new Date(Date.UTC(y, month - 1, day))
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return candidate.getTime() < today.getTime() ? y + 1 : y
  }

  const parseMonthDate = (m: RegExpMatchArray | null) => {
    if (!m) return null
    const day = parseInt(m[2], 10)
    const monthName = String(m[3] || '').toLowerCase()
    const month = months[monthName]
    const explicitYear = m[4] ? parseInt(m[4], 10) : undefined
    if (!month || !Number.isFinite(day)) return null
    const year = pickYear(month, day, explicitYear)
    return toIso(year, month, day)
  }

  const depIso = text.match(/\b(on|from)\s+(\d{4}-\d{2}-\d{2})\b/i)
  const depText = text.match(/\b(on|from)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i)
  const departureDate = depIso ? depIso[2] : parseMonthDate(depText)
  if (!departureDate) return null

  const retIso = text.match(/\breturn\s+(\d{4}-\d{2}-\d{2})\b/i)
  if (retIso) {
    return { origin, destination, departureDate, returnDate: retIso[1], passengers }
  }

  const betweenIso = text.match(/\bbetween\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})\b/i)
  if (betweenIso) {
    return { origin, destination, departureDate, returnDateFrom: betweenIso[1], returnDateTo: betweenIso[2], passengers }
  }

  const betweenText = text.match(
    /\bbetween\s+(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i
  )
  if (betweenText) {
    const d1 = parseInt(betweenText[1], 10)
    const d2 = parseInt(betweenText[2], 10)
    const month = months[String(betweenText[3] || '').toLowerCase()]
    const explicitYear = betweenText[4] ? parseInt(betweenText[4], 10) : undefined
    if (month && Number.isFinite(d1) && Number.isFinite(d2)) {
      const y = pickYear(month, Math.min(d1, d2), explicitYear)
      const from = toIso(y, month, Math.min(d1, d2))
      const to = toIso(y, month, Math.max(d1, d2))
      return { origin, destination, departureDate, returnDateFrom: from, returnDateTo: to, passengers }
    }
  }

  return { origin, destination, departureDate, passengers }
}

async function runCmd(bin: string, args: string[], timeoutMs = 120000): Promise<{ code: number | null; stdout: string; stderr: string }>{
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let killed = false
    const child = spawn(bin, args, { windowsHide: true })
    const t = setTimeout(() => {
      killed = true
      try { child.kill() } catch {}
    }, Math.max(1000, timeoutMs))
    child.stdout?.on('data', (d) => { stdout += d.toString() })
    child.stderr?.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => {
      clearTimeout(t)
      resolve({ code: killed ? null : code, stdout, stderr })
    })
  })
}

async function transcribeWithLocalWhisper(audioPath: string, opts: { model?: string; language?: string; prompt?: string; timeoutMs?: number } = {}): Promise<string> {
  const backend = String(process.env.WHISPER_BACKEND || 'openai').trim().toLowerCase()
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : 180000
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jason-whisper-'))
  const base = path.parse(audioPath).name

  try {
    if (backend === 'cpp' || backend === 'whisper_cpp' || backend === 'whisper.cpp') {
      const bin = String(process.env.WHISPER_CPP_BIN || process.env.WHISPER_BIN || '').trim()
      const modelPath = String(process.env.WHISPER_CPP_MODEL || process.env.WHISPER_MODEL || '').trim()
      if (!bin) throw new Error('missing_env_WHISPER_CPP_BIN')
      if (!modelPath) throw new Error('missing_env_WHISPER_CPP_MODEL')
      const outBase = path.join(outDir, 'out')
      const args = [
        '-m', modelPath,
        '-f', audioPath,
        '-otxt',
        '-of', outBase,
      ]
      if (opts.language) args.push('-l', String(opts.language))
      const out = await runCmd(bin, args, timeoutMs)
      if (out.code !== 0) {
        const msg = (out.stderr || out.stdout || '').toString().trim()
        throw new Error(msg || 'whisper_cpp_failed')
      }
      const txtPath = `${outBase}.txt`
      const transcript = await fs.readFile(txtPath, 'utf8')
      return String(transcript || '').trim()
    }

    // Default: OpenAI Whisper CLI (python package: openai-whisper)
    const bin = String(process.env.WHISPER_BIN || 'whisper').trim()
    const model = String(opts.model || process.env.WHISPER_MODEL || 'base').trim()
    const args = [
      audioPath,
      '--model', model,
      '--output_dir', outDir,
      '--output_format', 'txt',
    ]
    if (opts.language) args.push('--language', String(opts.language))
    if (opts.prompt) args.push('--initial_prompt', String(opts.prompt))
    const out = await runCmd(bin, args, timeoutMs)
    if (out.code !== 0) {
      const msg = (out.stderr || out.stdout || '').toString().trim()
      throw new Error(msg || 'whisper_failed')
    }
    const txtPath = path.join(outDir, `${base}.txt`)
    const transcript = await fs.readFile(txtPath, 'utf8')
    return String(transcript || '').trim()
  } finally {
    try { await fs.rm(outDir, { recursive: true, force: true }) } catch {}
  }
}

async function processTranscript(transcript: string, body: any, started: number) {
  const text = String(transcript || '').trim()

  try {
    sseBroker.broadcast('voice:heard', { transcript: text })
  } catch {}

  const norm = text.toLowerCase().trim()
  const pauseCmd = /^(hey\s+jason,?\s+)?(pause(\s+all)?|pause\s+tasks|pause\s+everything|stop\s+everything|stop\s+all\s+tasks|kill\s+switch)\b/.test(norm)
  const resumeCmd = /^(hey\s+jason,?\s+)?(resume(\s+all)?|resume\s+tasks|resume\s+everything|unpause|continue(\s+all)?)\b/.test(norm)
  if (pauseCmd) {
    try { permissionManager.setPaused(true) } catch {}
    const reply = 'Okay. Paused.'
    try { sseBroker.broadcast('voice:reply', { reply, mode: 'control', paused: true }) } catch {}
    return { ok: true, mode: 'control', reply, paused: true }
  }
  if (resumeCmd) {
    try { permissionManager.setPaused(false) } catch {}
    const reply = 'Okay. Resumed.'
    try { sseBroker.broadcast('voice:reply', { reply, mode: 'control', paused: false }) } catch {}
    return { ok: true, mode: 'control', reply, paused: false }
  }

  const flightIntent = parseFlightIntent(text)
  if (flightIntent) {
    const result = await flightSearchService.search({
      ...flightIntent,
      passengers: flightIntent.passengers || 1,
      currency: 'GBP',
      limit: 50,
    })

    const best = result.best
    const reply = best && typeof best.price === 'number'
      ? `Cheapest I found: ${best.currency || ''} ${best.price} via ${best.providerName}.`
      : `I opened fast links for ${flightIntent.origin} to ${flightIntent.destination} on ${flightIntent.departureDate}. Browser scraping is enabled for real-time prices.`

    try {
      sseBroker.broadcast('voice:reply', { reply, mode: 'flights', best })
    } catch {}

    return { ok: true, mode: 'flights', reply, result }
  }

  const out = await bdiCore.submitDesire({
    userText: text,
    priority: body?.priority,
    simulate: body?.simulate,
    sandbox: body?.sandbox,
  })

  const reply = `Okay. I’m starting: ${out.goal}`

  try {
    sseBroker.broadcast('voice:accepted', { transcript: text, jobId: out.jobId, goal: out.goal, durationMs: Date.now() - started })
  } catch {}

  return { ok: true, mode: 'task', reply, ...out }
}

router.post('/command', async (req, res) => {
  const started = Date.now()
  try {
    const body = CommandSchema.parse(req.body || {})
    const transcript = String(body.transcript || '').trim()

    const result = await processTranscript(transcript, body, started)
    res.json(result)
  } catch (e: any) {
    const msg = e?.message || 'invalid_request'
    try { sseBroker.broadcast('voice:error', { error: msg, durationMs: Date.now() - started }) } catch {}
    res.status(400).json({ ok: false, error: msg })
  }
})

router.post('/stt', upload.single('audio'), async (req, res) => {
  const started = Date.now()
  try {
    const file = (req as any).file as undefined | { originalname: string; buffer: Buffer }
    if (!file || !file.buffer || !file.buffer.length) return res.status(400).json({ ok: false, error: 'audio_required' })

    const model = typeof (req as any).body?.model === 'string' ? String((req as any).body.model) : undefined
    const language = typeof (req as any).body?.language === 'string' ? String((req as any).body.language) : undefined
    const prompt = typeof (req as any).body?.prompt === 'string' ? String((req as any).body.prompt) : undefined
    const timeoutMs = (req as any).body?.timeoutMs ? Number((req as any).body.timeoutMs) : undefined

    const ext = path.extname(String(file.originalname || '')).slice(0, 12)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jason-stt-'))
    const audioPath = path.join(tmpDir, `audio${ext || '.bin'}`)

    try {
      await fs.writeFile(audioPath, file.buffer)
      const transcript = await transcribeWithLocalWhisper(audioPath, { model, language, prompt, timeoutMs })
      res.json({ ok: true, transcript, durationMs: Date.now() - started })
    } finally {
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch {}
    }
  } catch (e: any) {
    const msg = e?.message || 'stt_failed'
    try { sseBroker.broadcast('voice:error', { error: msg, durationMs: Date.now() - started }) } catch {}
    res.status(500).json({ ok: false, error: msg })
  }
})

router.post('/command-from-audio', upload.single('audio'), async (req, res) => {
  const started = Date.now()
  try {
    const file = (req as any).file as undefined | { originalname: string; buffer: Buffer }
    if (!file || !file.buffer || !file.buffer.length) return res.status(400).json({ ok: false, error: 'audio_required' })

    let meta: any = {}
    const metaRaw = (req as any).body?.meta
    if (typeof metaRaw === 'string' && metaRaw.trim()) {
      try { meta = JSON.parse(metaRaw) } catch { meta = {} }
    }

    if (typeof (req as any).body?.priority === 'string') {
      const n = parseInt(String((req as any).body.priority), 10)
      if (Number.isFinite(n)) meta.priority = n
    }
    if (typeof (req as any).body?.simulate === 'string') {
      meta.simulate = String((req as any).body.simulate).toLowerCase() === 'true'
    }

    const model = typeof (req as any).body?.model === 'string' ? String((req as any).body.model) : undefined
    const language = typeof (req as any).body?.language === 'string' ? String((req as any).body.language) : undefined
    const prompt = typeof (req as any).body?.prompt === 'string' ? String((req as any).body.prompt) : undefined
    const timeoutMs = (req as any).body?.timeoutMs ? Number((req as any).body.timeoutMs) : undefined

    const ext = path.extname(String(file.originalname || '')).slice(0, 12)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jason-stt-'))
    const audioPath = path.join(tmpDir, `audio${ext || '.bin'}`)

    try {
      await fs.writeFile(audioPath, file.buffer)
      const transcript = await transcribeWithLocalWhisper(audioPath, { model, language, prompt, timeoutMs })
      const result = await processTranscript(transcript, meta, started)
      res.json({ ...result, transcript, durationMs: Date.now() - started })
    } finally {
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch {}
    }
  } catch (e: any) {
    const msg = e?.message || 'invalid_request'
    try { sseBroker.broadcast('voice:error', { error: msg, durationMs: Date.now() - started }) } catch {}
    res.status(400).json({ ok: false, error: msg })
  }
})

export default router

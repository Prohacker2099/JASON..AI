import type { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { stealthPolicy } from '../automation/StealthPolicy'

// Lazy import puppeteer to avoid heavy startup cost
async function getPuppeteer() {
  try {
    const mod = await import('puppeteer')
    return mod.default || (mod as any)
  } catch (e) {
    throw new Error('puppeteer_not_available')
  }
}

function hostnameOf(urlStr: string): string | null {
  try { return new URL(urlStr).hostname } catch { return null }
}

// Minimal headless web automation adapter
// Supports actions:
// - type: 'web', payload: { url: string, mode?: 'title'|'text'|'html', selector?: string }
export class WebAutomationAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'web' && !!a.payload && typeof a.payload.url === 'string'
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    const url = String(a.payload.url)
    const mode = (a.payload.mode || 'title') as 'title'|'text'|'html'
    const selector = typeof a.payload.selector === 'string' ? a.payload.selector : 'body'

    const host = hostnameOf(url)
    if (!host) return { ok: false, error: 'invalid_url' }

    let browser: any
    try {
      const puppeteer = await getPuppeteer()
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      const page = await browser.newPage()

      try {
        await page.setViewport({ width: 1280, height: 720 })
      } catch {}

      // Initial latency jitter to avoid ultra-mechanical timing
      try {
        const baseDelay = 150 + Math.random() * 450 // 150-600ms
        await page.waitForTimeout(baseDelay)
      } catch {}

      // Throttle heavy assets for non-interruptive background work
      await page.setRequestInterception(true)
      page.on('request', (req: any) => {
        const rtype = req.resourceType()
        if (rtype === 'image' || rtype === 'media' || rtype === 'font' || rtype === 'stylesheet') {
          return req.abort()
        }
        req.continue()
      })

      // Observe 429s to feed dynamic blacklist
      page.on('response', (resp: any) => {
        try {
          if (resp && typeof resp.status === 'function' && resp.status() === 429) {
            stealthPolicy.record429(host)
          }
        } catch {}
      })

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Simple human-like mouse jitter within the viewport to simulate movement
      try {
        const width = 1280
        const height = 720
        let x = 40 + Math.random() * (width - 80)
        let y = 40 + Math.random() * (height - 80)
        await page.mouse.move(x, y)
        const steps = 3 + Math.floor(Math.random() * 4)
        for (let i = 0; i < steps; i++) {
          x = Math.min(width - 10, Math.max(10, x + (Math.random() - 0.5) * 120))
          y = Math.min(height - 10, Math.max(10, y + (Math.random() - 0.5) * 120))
          await page.mouse.move(x, y)
          await page.waitForTimeout(40 + Math.random() * 90)
        }
      } catch {}

      // Heuristic CAPTCHA detection to enforce Ethical Persistence strategy
      try {
        const content = await page.content()
        const t = (content || '').toString().toLowerCase()
        const hasCaptcha = /captcha|recaptcha|hcaptcha|verify you are human|are you a robot/.test(t)
        if (hasCaptcha) {
          stealthPolicy.recordCaptcha(host)
          return { ok: false, error: 'captcha_detected' }
        }

        // Reading pause based on approximate text length to mimic human reading
        try {
          const words = t.split(/\s+/).filter(Boolean).length
          const base = 250 + Math.random() * 350
          const perWord = 6
          const delay = Math.min(2500, base + Math.min(words, 150) * perWord)
          await page.waitForTimeout(delay)
        } catch {}
      } catch {}

      if (mode === 'title') {
        const title = await page.title()
        return { ok: true, result: { url, title } }
      }

      if (mode === 'text') {
        const text = await page.$eval(selector, (el: any) => (el.innerText || '').toString().trim())
        return { ok: true, result: { url, selector, text } }
      }

      // html
      const html = await page.$eval(selector, (el: any) => (el.outerHTML || '').toString())
      return { ok: true, result: { url, selector, html } }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'web_automation_failed' }
    } finally {
      try { await browser?.close() } catch {}
    }
  }
}

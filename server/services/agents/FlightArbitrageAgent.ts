import type { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { scraperManager } from '../scrapers/ScraperManager'
import { selfLearningEngine } from '../ai/selfLearning/Engine'
import { alignmentModel } from '../ai/selfLearning/Alignment'
import { stealthPolicy } from '../automation/StealthPolicy'

type FlightSearchParams = {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers?: number
  cabin?: string
  currencies?: string[]
  resultCurrency?: string
}

type FlightOption = {
  siteId: string
  siteName: string
  url: string
  price: number
  currency: string
  rawPriceText?: string
}

type FlightArbitrageResult = {
  best: FlightOption | null
  options: FlightOption[]
  meta: { searchedSites: string[]; errors: Record<string, string> }
  reachedPaymentPage: boolean
}

type FlightSite = {
  id: string
  name: string
  buildSearchUrl: (p: FlightSearchParams) => string
}

const FLIGHT_SITES: FlightSite[] = [
  {
    id: 'google_flights',
    name: 'Google Flights',
    buildSearchUrl: (p) => {
      const d = encodeURIComponent(p.departureDate)
      const r = p.returnDate ? encodeURIComponent(p.returnDate) : ''
      const pax = p.passengers && p.passengers > 0 ? p.passengers : 1
      const base = `https://www.google.com/travel/flights`;
      const seg = r
        ? `?q=Flights%20from%20${encodeURIComponent(p.origin)}%20to%20${encodeURIComponent(p.destination)}%20on%20${d}%20return%20${r}`
        : `?q=Flights%20from%20${encodeURIComponent(p.origin)}%20to%20${encodeURIComponent(p.destination)}%20on%20${d}`
      return `${base}${seg}&tp=${pax}`
    }
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    buildSearchUrl: (p) => {
      const d = p.departureDate.replace(/-/g, '')
      const r = p.returnDate ? p.returnDate.replace(/-/g, '') : 'null'
      const pax = p.passengers && p.passengers > 0 ? p.passengers : 1
      const cabin = (p.cabin || 'economy').toLowerCase()
      const cabinCode = cabin.includes('business') ? 'business' : cabin.includes('first') ? 'first' : 'economy'
      return `https://www.skyscanner.net/transport/flights/${encodeURIComponent(p.origin.toLowerCase())}/${encodeURIComponent(p.destination.toLowerCase())}/${d}/${r}/?adults=${pax}&cabinclass=${cabinCode}`
    }
  },
  {
    id: 'kayak',
    name: 'KAYAK',
    buildSearchUrl: (p) => {
      const d = p.departureDate
      const r = p.returnDate || ''
      const base = `https://www.kayak.com/flights/${encodeURIComponent(p.origin)}-${encodeURIComponent(p.destination)}/${encodeURIComponent(d)}`
      return r ? `${base}/${encodeURIComponent(r)}` : base
    }
  },
  {
    id: 'expedia',
    name: 'Expedia',
    buildSearchUrl: (p) => {
      const d = p.departureDate
      const r = p.returnDate || ''
      const pax = p.passengers && p.passengers > 0 ? p.passengers : 1
      const cabin = (p.cabin || 'economy').toLowerCase()
      const cabinCode = cabin.includes('business') ? 'business' : cabin.includes('first') ? 'first' : 'economy'
      const base = 'https://www.expedia.co.uk/Flights-Search'
      const parts: string[] = []
      parts.push(`trip=${r ? 'roundtrip' : 'oneway'}`)
      parts.push(`leg1=${encodeURIComponent(`from:${p.origin},to:${p.destination},departure:${d}TANYT`)}`)
      if (r) {
        parts.push(`leg2=${encodeURIComponent(`from:${p.destination},to:${p.origin},departure:${r}TANYT`)}`)
      }
      parts.push(`passengers=${encodeURIComponent(`adults:${pax}`)}`)
      parts.push(`options=${encodeURIComponent(`cabinclass:${cabinCode}`)}`)
      parts.push('mode=search')
      return `${base}?${parts.join('&')}`
    }
  },
  {
    id: 'momondo',
    name: 'Momondo',
    buildSearchUrl: (p) => {
      const d = p.departureDate
      const r = p.returnDate || ''
      const origin = encodeURIComponent(p.origin.toUpperCase())
      const dest = encodeURIComponent(p.destination.toUpperCase())
      const base = `https://www.momondo.co.uk/flight-search/${origin}-${dest}/${encodeURIComponent(d)}`
      const tail = r ? `/${encodeURIComponent(r)}?sort=price_a` : '?sort=price_a'
      return `${base}${tail}`
    }
  }
]

async function getPuppeteer() {
  const mod = await import('puppeteer')
  return (mod as any).default || (mod as any)
}

function parsePrice(text: string): { amount: number | null; currency: string | null } {
  const t = text.replace(/[,\s]/g, '')
  const m = t.match(/([£€$])?(\d+(?:\.\d{1,2})?)/)
  if (!m) return { amount: null, currency: null }
  const symbol = m[1] || ''
  const num = Number(m[2])
  if (!Number.isFinite(num)) return { amount: null, currency: null }
  let cur: string | null = null
  if (symbol === '£') cur = 'GBP'
  else if (symbol === '€') cur = 'EUR'
  else if (symbol === '$') cur = 'USD'
  return { amount: num, currency: cur }
}

function normalizePrice(opt: FlightOption, rates: Record<string, number> | null, target: string | undefined): FlightOption {
  if (!target || !rates) return opt
  const base = target.toUpperCase()
  if (!opt.currency || opt.currency.toUpperCase() === base) return opt
  const from = opt.currency.toUpperCase()
  const baseRate = rates[from]
  const targetRate = rates[base]
  if (!baseRate || !targetRate) return opt
  const usdVal = opt.price / baseRate
  const converted = usdVal * targetRate
  return { ...opt, price: converted, currency: base }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.floor(ms))))
}

function jitter(baseMs: number, spreadMs: number): number {
  const min = Math.max(0, baseMs - spreadMs)
  const max = baseMs + spreadMs
  return min + Math.random() * (max - min)
}

async function detectCaptcha(page: any): Promise<boolean> {
  try {
    const hasCaptcha = await page.evaluate(() => {
      try {
        const body = document.body
        if (!body) return false
        const text = (body.innerText || '').toLowerCase()
        if (text.includes('captcha') || text.includes('not a robot') || text.includes('are you a robot')) return true
        const selectors = [
          'iframe[src*="recaptcha"]',
          'div.g-recaptcha',
          'input[name="captcha"]',
          'div[id*="captcha"]',
        ]
        for (const sel of selectors) {
          if (document.querySelector(sel)) return true
        }
        return false
      } catch {
        return false
      }
    })
    return !!hasCaptcha
  } catch {
    return false
  }
}

async function tryClickToPayment(page: any): Promise<boolean> {
  try {
    try { await sleep(jitter(800, 400)) } catch {}
    const handles = await page.$$('button, a')
    for (const h of handles) {
      const txt = ((await page.evaluate((el: any) => (el.innerText || '').toString(), h)) as string).toLowerCase()
      if (/book|continue|checkout|select|payment/.test(txt)) {
        try { await sleep(jitter(400, 250)) } catch {}
        await h.click()
        try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }) } catch {}
        const url = String(page.url() || '').toLowerCase()
        if (/payment|checkout|purchase|book/.test(url)) return true
        break
      }
    }
  } catch {}
  return false
}

export class FlightArbitrageAgent {
  async search(params: FlightSearchParams): Promise<FlightArbitrageResult> {
    const origin = params.origin || 'LHR'
    const destination = params.destination || 'BGI'
    if (!params.departureDate) {
      const now = new Date()
      const plus7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const y = plus7.getFullYear()
      const m = String(plus7.getMonth() + 1).padStart(2, '0')
      const d = String(plus7.getDate()).padStart(2, '0')
      params.departureDate = `${y}-${m}-${d}`
    }

    const puppeteer = await getPuppeteer()
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const options: FlightOption[] = []
    const errors: Record<string, string> = {}
    let reachedPaymentPage = false
    let rates: Record<string, number> | null = null
    const targetCurrency = params.resultCurrency || (params.currencies && params.currencies[0]) || 'GBP'

    try {
      try {
        rates = await scraperManager.getCurrencyRates('USD')
      } catch {
        rates = null
      }

      for (const site of FLIGHT_SITES) {
        let url: string
        let host: string | null = null
        try {
          url = site.buildSearchUrl({ ...params, origin, destination })
        } catch (e: any) {
          errors[site.id] = e?.message || 'url_build_failed'
          continue
        }
        try {
          host = new URL(url).hostname.toLowerCase()
        } catch {
          host = null
        }

        if (host && stealthPolicy.isBlacklisted(host)) {
          errors[site.id] = 'host_blacklisted'
          continue
        }

        const page = await browser.newPage()
        try {
          await page.setRequestInterception(true)
          page.on('request', (req: any) => {
            const rtype = req.resourceType()
            if (rtype === 'image' || rtype === 'media' || rtype === 'font' || rtype === 'stylesheet') {
              return req.abort()
            }
            req.continue()
          })
          if (host) {
            page.on('response', (res: any) => {
              try {
                const status = typeof res.status === 'function' ? res.status() : 0
                if (status === 429) {
                  stealthPolicy.record429(host as string)
                }
              } catch {}
            })
          }

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })

          try { await sleep(jitter(1500, 900)) } catch {}

          const hasCaptcha = await detectCaptcha(page)
          if (hasCaptcha) {
            if (host) {
              try { stealthPolicy.recordCaptcha(host) } catch {}
            }
            errors[site.id] = 'captcha_detected'
            continue
          }

          let priceText: string | null = null
          try {
            priceText = await page.$eval(
              'div[aria-label*="Cheapest"] [class*="price"], [data-test-id*="offer"] [class*="price"], [class*="price"]',
              (el: any) => (el.innerText || '').toString()
            )
          } catch {
            try {
              const texts = await page.$$eval('span, div', (els: any[]) => els.map((el) => (el.innerText || '').toString()).filter(Boolean))
              const cand = texts.find((t: string) => /£\s*\d|€\s*\d|\$\s*\d/.test(t))
              priceText = cand || null
            } catch {
              priceText = null
            }
          }

          if (priceText) {
            const parsed = parsePrice(priceText)
            if (parsed.amount != null) {
              let opt: FlightOption = {
                siteId: site.id,
                siteName: site.name,
                url,
                price: parsed.amount,
                currency: parsed.currency || targetCurrency,
                rawPriceText: priceText
              }
              opt = normalizePrice(opt, rates, targetCurrency)
              options.push(opt)
            }
          }

          if (!reachedPaymentPage) {
            try { await sleep(jitter(1000, 600)) } catch {}
            const ok = await tryClickToPayment(page)
            if (ok) reachedPaymentPage = true
          }
        } catch (e: any) {
          errors[site.id] = e?.message || 'search_failed'
        } finally {
          try { await page.close() } catch {}
        }
      }
    } finally {
      try { await browser.close() } catch {}
    }

    const best = options.reduce<FlightOption | null>((acc, cur) => {
      if (!acc) return cur
      return cur.price < acc.price ? cur : acc
    }, null)

    const state: number[] = new Array(16).fill(0)
    state[0] = Math.min(1, options.length / 10)
    state[1] = best ? Math.min(1, best.price / 5000) : 0
    state[2] = reachedPaymentPage ? 1 : 0

    const reward = best ? (reachedPaymentPage ? 0.2 : 0.1) - Math.min(0.2, best.price / 10000) : -0.05

    try {
      selfLearningEngine.ingestExperience({
        state,
        actionIndex: 0,
        reward,
        nextState: state,
        done: true
      })
      if (best) {
        const action: ActionDefinition = {
          type: 'web',
          name: 'flight_arbitrage',
          riskLevel: reachedPaymentPage ? 0.8 : 0.6,
          tags: ['help', 'safe', 'travel', 'flight', 'book'],
          payload: { meta: { origin, destination, price: best.price, currency: best.currency } }
        }
        alignmentModel.ingestFromAction(action, reward > 0 ? 1 : 0)
      }
    } catch {}

    return {
      best,
      options,
      meta: { searchedSites: FLIGHT_SITES.map((s) => s.id), errors },
      reachedPaymentPage
    }
  }
}

export class FlightArbitrageAdapter implements ActionAdapter {
  private agent = new FlightArbitrageAgent()

  canHandle(a: ActionDefinition): boolean {
    return a.type === 'web' && !!a.payload && a.payload.mode === 'flight_arbitrage'
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    const payload = a.payload || {}
    const params: FlightSearchParams = {
      origin: String(payload.origin || 'LHR'),
      destination: String(payload.destination || 'BGI'),
      departureDate: String(payload.departureDate || ''),
      returnDate: payload.returnDate ? String(payload.returnDate) : undefined,
      passengers: typeof payload.passengers === 'number' ? payload.passengers : 1,
      cabin: payload.cabin ? String(payload.cabin) : undefined,
      currencies: Array.isArray(payload.currencies) ? payload.currencies.map((c: any) => String(c)) : undefined,
      resultCurrency: payload.resultCurrency ? String(payload.resultCurrency) : undefined
    }

    const result = await this.agent.search(params)
    const hasBest = !!result.best
    const errorValues = Object.values(result.meta?.errors || {})
    const captchaSeen = !hasBest && errorValues.includes('captcha_detected')
    if (captchaSeen) {
      return { ok: false, error: 'captcha_detected', result }
    }
    return { ok: hasBest, result }
  }
}


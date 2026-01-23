import { chromium, Page, BrowserContext } from 'playwright'
import path from 'path'
import { mkdir } from 'fs/promises'

export interface FlightScrapeResult {
  provider: string
  price?: string
  currency?: string
  airline?: string
  departure?: string
  arrival?: string
  duration?: string
  stops?: string
  url?: string
  raw?: any
}

export class FlightScraper {
  private context: BrowserContext | null = null
  private page: Page | null = null
  private headless: boolean | null = null

  async init(headlessOverride?: boolean): Promise<void> {
    const headlessEnv = process.env.FLIGHT_SCRAPE_HEADLESS
    const envHeadless = headlessEnv ? headlessEnv === '1' || headlessEnv.toLowerCase() === 'true' : false
    const headless = typeof headlessOverride === 'boolean' ? headlessOverride : envHeadless

    if (this.context && this.page && this.headless === headless) {
      return
    }

    if (this.context && this.headless !== headless) {
      await this.cleanup()
    }

    const userDataDir = path.join(process.cwd(), 'data', 'playwright', 'flight_scraper')
    await mkdir(userDataDir, { recursive: true })

    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1365, height: 768 },
      locale: 'en-GB',
      timezoneId: 'Europe/London',
    })

    const pages = this.context.pages()
    this.page = pages.length ? pages[0] : await this.context.newPage()
    this.headless = headless

    await this.page.waitForTimeout(Math.random() * 800 + 400)
  }

  private async isBotBlocked(): Promise<boolean> {
    if (!this.page) return false
    const url = (this.page.url() || '').toLowerCase()
    if (url.includes('/sorry/') || url.includes('consent.google.com')) return true
    const title = ((await this.page.title().catch(() => '')) || '').toLowerCase()
    if (title.includes('unusual traffic') || title.includes('sorry') || title.includes('captcha')) return true
    const html = await this.page.content().catch(() => '')
    const h = html.toLowerCase()
    return h.includes('unusual traffic') || h.includes('captcha') || h.includes('verify you are a human')
  }

  private extractFirstPrice(text: string): { raw: string; value: string } | null {
    const t = String(text || '')
    const sym = t.match(/(?:\b|\s)([£$€¥])\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/)
    if (sym) return { raw: `${sym[1]}${sym[2]}`, value: sym[2].replace(/,/g, '') }

    const code = t.match(/\b([A-Z]{3})\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\b/)
    if (code) return { raw: `${code[1]} ${code[2]}`, value: code[2].replace(/,/g, '') }

    return null
  }

  async scrapeGoogleFlights(origin: string, destination: string, departureDate: string, returnDate: string | undefined, currency: string): Promise<FlightScrapeResult[]> {
    if (!this.page) throw new Error('Scraper not initialized')
    
    const results: FlightScrapeResult[] = []
    
    try {
      // Build Google Flights URL
      const baseUrl = `https://www.google.com/travel/flights`
      const params = new URLSearchParams({
        q: `Flights from ${origin} to ${destination} on ${departureDate}${returnDate ? ` return ${returnDate}` : ''}`,
        tp: '1',
        curr: currency,
        hl: 'en',
      })
      
      await this.page.goto(`${baseUrl}?${params}`, { waitUntil: 'domcontentloaded' })
      await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await this.page.waitForTimeout(1500)

      if (await this.isBotBlocked()) {
        throw new Error(`captcha_detected|google_flights|${this.page.url()}`)
      }
      
      // Wait for results to load
      await this.page.waitForSelector('[data-test-id="result-card"]', { timeout: 20000 })
      
      // Scrape flight results
      const flightCards = await this.page.$$('[data-test-id="result-card"]')
      
      for (let i = 0; i < Math.min(flightCards.length, 10); i++) {
        try {
          const card = flightCards[i]

          const cardText = await card.innerText().catch(() => '')
          const p = this.extractFirstPrice(cardText)
          if (!p) continue
          
          results.push({
            provider: 'Google Flights',
            price: p.value,
            currency,
            url: this.page.url(),
            raw: { text: cardText.slice(0, 2000) },
          })
        } catch (e) {
          // Skip cards that don't have all elements
          continue
        }
      }
    } catch (error) {
      console.error('Google Flights scraping error:', error)
      throw error
    }
    
    return results
  }

  async scrapeKayak(origin: string, destination: string, departureDate: string, returnDate: string | undefined, currency: string): Promise<FlightScrapeResult[]> {
    if (!this.page) throw new Error('Scraper not initialized')
    
    const results: FlightScrapeResult[] = []
    
    try {
      // Build Kayak URL
      const baseUrl = `https://www.kayak.com/flights/${origin}-${destination}/${departureDate}`
      const url = returnDate ? `${baseUrl}/${returnDate}` : baseUrl
      
      await this.page.goto(url, { waitUntil: 'domcontentloaded' })
      await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await this.page.waitForTimeout(1500)

      if (await this.isBotBlocked()) {
        throw new Error(`captcha_detected|kayak|${this.page.url()}`)
      }
      
      // Wait for results
      await this.page.waitForSelector('body', { timeout: 15000 })
      
      // Scrape flight results (best-effort; Kayak markup changes often)
      const flightCards = await this.page.$$('.result-wrapper')
      
      for (let i = 0; i < Math.min(flightCards.length, 10); i++) {
        try {
          const card = flightCards[i]

          const cardText = await card.innerText().catch(() => '')
          const p = this.extractFirstPrice(cardText)
          if (!p) continue
          
          results.push({
            provider: 'Kayak',
            price: p.value,
            currency,
            url: this.page.url(),
            raw: { text: cardText.slice(0, 2000) },
          })
        } catch (e) {
          continue
        }
      }
    } catch (error) {
      console.error('Kayak scraping error:', error)
      throw error
    }
    
    return results
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close()
    if (this.context) await this.context.close()
    this.page = null
    this.context = null
    this.headless = null
  }
}

export const flightScraper = new FlightScraper()

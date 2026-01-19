import { chromium, Browser, Page, BrowserContext } from 'playwright'

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
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null

  async init(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    })

    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    })

    this.page = await this.context.newPage()
    
    // Add random delay to seem more human
    await this.page.waitForTimeout(Math.random() * 2000 + 1000)
  }

  async scrapeGoogleFlights(origin: string, destination: string, departureDate: string, returnDate?: string): Promise<FlightScrapeResult[]> {
    if (!this.page) throw new Error('Scraper not initialized')
    
    const results: FlightScrapeResult[] = []
    
    try {
      // Build Google Flights URL
      const baseUrl = `https://www.google.com/travel/flights`
      const params = new URLSearchParams({
        q: `Flights from ${origin} to ${destination} on ${departureDate}${returnDate ? ` return ${returnDate}` : ''}`,
        tp: '1'
      })
      
      await this.page.goto(`${baseUrl}?${params}`)
      await this.page.waitForTimeout(3000)
      
      // Wait for results to load
      await this.page.waitForSelector('[data-test-id="result-card"]', { timeout: 15000 })
      
      // Scrape flight results
      const flightCards = await this.page.$$('[data-test-id="result-card"]')
      
      for (let i = 0; i < Math.min(flightCards.length, 10); i++) {
        try {
          const card = flightCards[i]
          
          const price = await card.$eval('.g2w0 .U3gS', el => el.textContent?.trim())
          const airline = await card.$eval('.g2w0 .sSHqwe', el => el.textContent?.trim())
          const departure = await card.$eval('.g2w0 .mv3Wb', el => el.textContent?.trim())
          const arrival = await card.$eval('.g2w0 .VYmJf', el => el.textContent?.trim())
          const duration = await card.$eval('.g2w0 .JW5gB', el => el.textContent?.trim())
          const stops = await card.$eval('.g2w0 .B8t3c', el => el.textContent?.trim())
          
          results.push({
            provider: 'Google Flights',
            price: price?.replace(/[^0-9.]/g, ''),
            currency: 'GBP', // Default, could be scraped
            airline,
            departure,
            arrival,
            duration,
            stops,
            url: `https://www.google.com/travel/flights?q=Flights from ${origin} to ${destination} on ${departureDate}`
          })
        } catch (e) {
          // Skip cards that don't have all elements
          continue
        }
      }
    } catch (error) {
      console.error('Google Flights scraping error:', error)
    }
    
    return results
  }

  async scrapeKayak(origin: string, destination: string, departureDate: string, returnDate?: string): Promise<FlightScrapeResult[]> {
    if (!this.page) throw new Error('Scraper not initialized')
    
    const results: FlightScrapeResult[] = []
    
    try {
      // Build Kayak URL
      const baseUrl = `https://www.kayak.com/flights/${origin}-${destination}/${departureDate}`
      const url = returnDate ? `${baseUrl}/${returnDate}` : baseUrl
      
      await this.page.goto(url)
      await this.page.waitForTimeout(3000)
      
      // Wait for results
      await this.page.waitForSelector('.result-wrapper', { timeout: 15000 })
      
      // Scrape flight results
      const flightCards = await this.page.$$('.result-wrapper')
      
      for (let i = 0; i < Math.min(flightCards.length, 10); i++) {
        try {
          const card = flightCards[i]
          
          const price = await card.$eval('.price-text', el => el.textContent?.trim())
          const airline = await card.$eval('.airline-name', el => el.textContent?.trim())
          const departure = await card.$eval('.depart-time', el => el.textContent?.trim())
          const arrival = await card.$eval('.arrive-time', el => el.textContent?.trim())
          const duration = await card.$eval('.duration', el => el.textContent?.trim())
          const stops = await card.$eval('.stops', el => el.textContent?.trim())
          
          results.push({
            provider: 'Kayak',
            price: price?.replace(/[^0-9.]/g, ''),
            currency: 'GBP',
            airline,
            departure,
            arrival,
            duration,
            stops,
            url: `https://www.kayak.com/flights/${origin}-${destination}/${departureDate}${returnDate ? `/${returnDate}` : ''}`
          })
        } catch (e) {
          continue
        }
      }
    } catch (error) {
      console.error('Kayak scraping error:', error)
    }
    
    return results
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close()
    if (this.context) await this.context.close()
    if (this.browser) await this.browser.close()
    this.page = null
    this.context = null
    this.browser = null
  }
}

export const flightScraper = new FlightScraper()

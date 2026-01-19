import { EventEmitter } from 'events'
import puppeteer, { Browser, Page } from 'puppeteer'
import { chromium } from 'playwright'
import { createTransport } from 'nodemailer'

export interface HolidayDeal {
  id: string
  provider: string
  destination: string
  departure: string
  price: number
  currency: string
  dates: {
    outbound: string
    return: string
  }
  accommodation?: {
    name: string
    rating: number
    boardBasis: string
  }
  flights?: {
    airline: string
    stops: number
    duration: number
  }
  features: string[]
  availability: boolean
  scrapedAt: Date
  url: string
}

export interface ArbitrageOpportunity {
  id: string
  deals: HolidayDeal[]
  savings: number
  percentage: number
  bestProvider: string
  worstProvider: string
  createdAt: Date
  confidence: number
}

export interface SearchRequest {
  destination: string
  departure: string
  departureDate: string
  returnDate: string
  passengers: number
  budget: number
  preferences: {
    accommodation: 'budget' | 'mid-range' | 'luxury'
    boardBasis?: string
    directFlights?: boolean
    baggage?: boolean
  }
}

export interface WebArbitrageConfig {
  providers: ProviderConfig[]
  maxConcurrentSearches: number
  searchTimeout: number
  arbitrageThreshold: number
  notificationEmail?: string
}

interface ProviderConfig {
  name: string
  url: string
  selectors: {
    price: string
    title: string
    availability: string
    features: string[]
  }
  headers?: Record<string, string>
  enabled: boolean
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    name: 'Expedia',
    url: 'https://www.expedia.com',
    selectors: {
      price: '[data-testid="price-display"]',
      title: '[data-testid="title"]',
      availability: '[data-testid="availability"]',
      features: ['[data-testid="amenity"]']
    },
    enabled: true
  },
  {
    name: 'Skyscanner',
    url: 'https://www.skyscanner.net',
    selectors: {
      price: '[data-testid="price"]',
      title: '[data-testid="title"]',
      availability: '[data-testid="availability"]',
      features: ['[data-testid="feature"]']
    },
    enabled: true
  },
  {
    name: 'Booking.com',
    url: 'https://www.booking.com',
    selectors: {
      price: '[data-testid="price"]',
      title: '[data-testid="title"]',
      availability: '[data-testid="availability"]',
      features: ['[data-testid="facility"]']
    },
    enabled: true
  },
  {
    name: 'Kayak',
    url: 'https://www.kayak.com',
    selectors: {
      price: '[data-testid="price"]',
      title: '[data-testid="title"]',
      availability: '[data-testid="availability"]',
      features: ['[data-testid="feature"]']
    },
    enabled: true
  }
]

export class HolidayArbitrageEngine extends EventEmitter {
  private config: WebArbitrageConfig
  private browser: Browser | null = null
  private playwrightBrowser: any = null
  private activeSearches: Map<string, Promise<HolidayDeal[]>> = new Map()
  private opportunities: ArbitrageOpportunity[] = []

  constructor(config: Partial<WebArbitrageConfig> = {}) {
    super()
    this.config = {
      providers: DEFAULT_PROVIDERS,
      maxConcurrentSearches: 5,
      searchTimeout: 30000,
      arbitrageThreshold: 50,
      ...config
    }
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Puppeteer for complex sites
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })

      // Initialize Playwright for faster scraping
      this.playwrightBrowser = await chromium.launch({
        headless: true
      })

      this.emit('initialized')
    } catch (error) {
      this.emit('error', 'Failed to initialize browsers')
      throw error
    }
  }

  async searchHolidays(request: SearchRequest): Promise<HolidayDeal[]> {
    const searchId = `search_${Date.now()}`
    this.emit('search_started', { searchId, request })

    const enabledProviders = this.config.providers.filter(p => p.enabled)
    const searchPromises = enabledProviders.map(provider => 
      this.searchProvider(provider, request, searchId)
    )

    try {
      const results = await Promise.allSettled(searchPromises)
      const deals: HolidayDeal[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          deals.push(...result.value)
        } else {
          this.emit('provider_error', {
            provider: enabledProviders[index].name,
            error: result.reason
          })
        }
      })

      // Find arbitrage opportunities
      await this.findArbitrageOpportunities(deals, searchId)

      this.emit('search_completed', { searchId, dealsCount: deals.length })
      return deals

    } catch (error) {
      this.emit('search_error', { searchId, error })
      throw error
    }
  }

  private async searchProvider(
    provider: ProviderConfig, 
    request: SearchRequest, 
    searchId: string
  ): Promise<HolidayDeal[]> {
    const page = await this.browser!.newPage()
    
    try {
      // Set user agent and headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      if (provider.headers) {
        await page.setExtraHTTPHeaders(provider.headers)
      }

      // Navigate to provider
      await page.goto(provider.url, { waitUntil: 'networkidle2', timeout: this.config.searchTimeout })

      // Fill search form (this would be customized per provider)
      await this.fillSearchForm(page, request, provider)

      // Wait for results and scrape
      await page.waitForSelector(provider.selectors.price, { timeout: 15000 })
      
      const deals = await this.scrapeDeals(page, provider, request)

      this.emit('provider_completed', {
        provider: provider.name,
        searchId,
        dealsCount: deals.length
      })

      return deals

    } catch (error) {
      this.emit('provider_error', {
        provider: provider.name,
        searchId,
        error
      })
      return []
    } finally {
      await page.close()
    }
  }

  private async fillSearchForm(
    page: Page, 
    request: SearchRequest, 
    provider: ProviderConfig
  ): Promise<void> {
    // This would be customized for each provider's form structure
    // For now, we'll simulate the search process

    try {
      // Example for Expedia-like interface
      await page.click('[data-testid="destination-field"]')
      await page.type('[data-testid="destination-field"]', request.destination)
      await page.keyboard.press('Enter')

      await page.click('[data-testid="departure-date-field"]')
      await page.type('[data-testid="departure-date-field"]', request.departureDate)
      await page.keyboard.press('Enter')

      await page.click('[data-testid="return-date-field"]')
      await page.type('[data-testid="return-date-field"]', request.returnDate)
      await page.keyboard.press('Enter')

      await page.click('[data-testid="passengers-field"]')
      await page.select('[data-testid="adults-select"]', request.passengers.toString())

      await page.click('[data-testid="search-button"]')
      
      // Wait for results to load
      await new Promise(resolve => setTimeout(resolve, 3000))

    } catch (error) {
      // If form filling fails, try direct navigation with search parameters
      const searchUrl = this.buildSearchUrl(provider, request)
      await page.goto(searchUrl, { waitUntil: 'networkidle2' })
    }
  }

  private buildSearchUrl(provider: ProviderConfig, request: SearchRequest): string {
    const params = new URLSearchParams({
      destination: request.destination,
      departure: request.departure,
      returnDate: request.returnDate,
      passengers: request.passengers.toString(),
      budget: request.budget.toString()
    })

    return `${provider.url}/search?${params.toString()}`
  }

  private async scrapeDeals(
    page: Page, 
    provider: ProviderConfig, 
    request: SearchRequest
  ): Promise<HolidayDeal[]> {
    const deals: HolidayDeal[] = []

    try {
      // Get all deal elements
      const dealElements = await page.$$(provider.selectors.price)

      for (let i = 0; i < Math.min(dealElements.length, 20); i++) {
        try {
          const deal = await this.extractDealInfo(page, provider, i, request)
          if (deal) {
            deals.push(deal)
          }
        } catch (error) {
          // Continue with other deals if one fails
          continue
        }
      }

    } catch (error) {
      this.emit('scraping_error', { provider: provider.name, error })
    }

    return deals
  }

  private async extractDealInfo(
    page: Page,
    provider: ProviderConfig,
    index: number,
    request: SearchRequest
  ): Promise<HolidayDeal | null> {
    try {
      // Extract price
      const priceElement = await page.$$(provider.selectors.price)
      const priceText = priceElement[index] ? await priceElement[index].evaluate(el => el.textContent) : null
      const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0

      // Extract title
      const titleElement = await page.$$(provider.selectors.title)
      const title = titleElement[index] ? await titleElement[index].evaluate(el => el.textContent) : 'Unknown Package'

      // Check availability
      const availabilityElement = await page.$$(provider.selectors.availability)
      const availabilityText = availabilityElement[index] ? await availabilityElement[index].evaluate(el => el.textContent) : 'Available'
      const isAvailable = !availabilityText.toLowerCase().includes('sold out')

      // Extract features
      const features: string[] = []
      for (const featureSelector of provider.selectors.features) {
        const featureElements = await page.$$(featureSelector)
        if (featureElements[index]) {
          const featureText = await featureElements[index].evaluate(el => el.textContent)
          if (featureText) features.push(featureText.trim())
        }
      }

      const deal: HolidayDeal = {
        id: `${provider.name}_${index}_${Date.now()}`,
        provider: provider.name,
        destination: request.destination,
        departure: request.departure,
        price,
        currency: 'GBP',
        dates: {
          outbound: request.departureDate,
          return: request.returnDate
        },
        features,
        availability: isAvailable,
        scrapedAt: new Date(),
        url: page.url()
      }

      return deal

    } catch (error) {
      return null
    }
  }

  private async findArbitrageOpportunities(deals: HolidayDeal[], searchId: string): Promise<void> {
    // Group deals by similar packages
    const groupedDeals = this.groupSimilarDeals(deals)
    
    for (const group of groupedDeals) {
      if (group.length < 2) continue // Need at least 2 deals for arbitrage

      const sortedDeals = group.sort((a, b) => a.price - b.price)
      const cheapest = sortedDeals[0]
      const mostExpensive = sortedDeals[sortedDeals.length - 1]
      
      const savings = mostExpensive.price - cheapest.price
      const percentage = (savings / mostExpensive.price) * 100

      if (savings >= this.config.arbitrageThreshold) {
        const opportunity: ArbitrageOpportunity = {
          id: `arbitrage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deals: sortedDeals,
          savings,
          percentage,
          bestProvider: cheapest.provider,
          worstProvider: mostExpensive.provider,
          createdAt: new Date(),
          confidence: this.calculateConfidence(sortedDeals)
        }

        this.opportunities.push(opportunity)
        this.emit('arbitrage_found', { searchId, opportunity })

        // Send notification if configured
        if (this.config.notificationEmail) {
          await this.sendArbitrageNotification(opportunity)
        }
      }
    }
  }

  private groupSimilarDeals(deals: HolidayDeal[]): HolidayDeal[][] {
    // Simple grouping by destination and price range
    const groups: Map<string, HolidayDeal[]> = new Map()

    deals.forEach(deal => {
      const key = `${deal.destination}_${Math.floor(deal.price / 100) * 100}` // Group by £100 price ranges
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(deal)
    })

    return Array.from(groups.values())
  }

  private calculateConfidence(deals: HolidayDeal[]): number {
    // Calculate confidence based on price variance and provider reliability
    const prices = deals.map(d => d.price)
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    const standardDeviation = Math.sqrt(variance)

    // Lower variance = higher confidence
    const confidence = Math.max(0.5, Math.min(1, 1 - (standardDeviation / mean)))
    return confidence
  }

  private async sendArbitrageNotification(opportunity: ArbitrageOpportunity): Promise<void> {
    if (!this.config.notificationEmail) return

    const transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const html = `
      <h2>🎉 Holiday Arbitrage Opportunity Found!</h2>
      <p><strong>Destination:</strong> ${opportunity.deals[0].destination}</p>
      <p><strong>Savings:</strong> £${opportunity.savings.toFixed(2)} (${opportunity.percentage.toFixed(1)}%)</p>
      <p><strong>Best Deal:</strong> ${opportunity.bestProvider} - £${opportunity.deals[0].price}</p>
      <p><strong>Confidence:</strong> ${(opportunity.confidence * 100).toFixed(1)}%</p>
      
      <h3>All Deals:</h3>
      <ul>
        ${opportunity.deals.map(deal => `
          <li>
            <strong>${deal.provider}</strong>: £${deal.price} 
            ${deal.availability ? '✅ Available' : '❌ Sold Out'}
          </li>
        `).join('')}
      </ul>
      
      <p>Check the JASON dashboard for more details!</p>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: this.config.notificationEmail,
      subject: `Holiday Arbitrage: Save £${opportunity.savings.toFixed(2)} on ${opportunity.deals[0].destination}`,
      html
    })
  }

  getOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities.sort((a, b) => b.savings - a.savings)
  }

  async getBestDeal(destination: string, budget: number): Promise<HolidayDeal | null> {
    const allDeals = this.opportunities.flatMap(op => op.deals)
    const matchingDeals = allDeals.filter(deal => 
      deal.destination.toLowerCase().includes(destination.toLowerCase()) &&
      deal.price <= budget
    )

    return matchingDeals.length > 0 
      ? matchingDeals.reduce((best, current) => current.price < best.price ? current : best)
      : null
  }

  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }

    if (this.playwrightBrowser) {
      await this.playwrightBrowser.close()
      this.playwrightBrowser = null
    }

    this.emit('shutdown')
  }

  getStatistics(): {
    totalOpportunities: number
    totalSavings: number
    activeSearches: number
    providersCount: number
  } {
    const totalSavings = this.opportunities.reduce((sum, op) => sum + op.savings, 0)
    
    return {
      totalOpportunities: this.opportunities.length,
      totalSavings,
      activeSearches: this.activeSearches.size,
      providersCount: this.config.providers.filter(p => p.enabled).length
    }
  }
}

export default HolidayArbitrageEngine

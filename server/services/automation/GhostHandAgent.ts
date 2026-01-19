import { EventEmitter } from 'events'
import puppeteer, { Browser, Page } from 'puppeteer'
import { chromium } from 'playwright'
import fs from 'fs/promises'
import path from 'path'

export interface GhostAction {
  id: string
  type: 'click' | 'type' | 'navigate' | 'scroll' | 'wait' | 'extract'
  selector?: string
  value?: string
  url?: string
  timeout?: number
  stealth?: boolean
}

export interface GhostSession {
  id: string
  url: string
  actions: GhostAction[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface GhostConfig {
  headless: boolean
  stealthMode: boolean
  userAgent?: string
  viewport?: { width: number; height: number }
  timeout: number
  retries: number
}

const DEFAULT_CONFIG: GhostConfig = {
  headless: true,
  stealthMode: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  retries: 3
}

export class GhostHandAgent extends EventEmitter {
  private config: GhostConfig
  private browser: Browser | null = null
  private playwrightBrowser: any = null
  private sessions: Map<string, GhostSession> = new Map()
  private isRunning = false

  constructor(config: Partial<GhostConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Puppeteer with stealth
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })

      // Initialize Playwright for advanced automation
      this.playwrightBrowser = await chromium.launch({
        headless: this.config.headless
      })

      this.isRunning = true
      this.emit('initialized')
    } catch (error) {
      this.emit('error', 'Failed to initialize Ghost Hand Agent')
      throw error
    }
  }

  async createSession(url: string, actions: GhostAction[]): Promise<string> {
    const sessionId = `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const session: GhostSession = {
      id: sessionId,
      url,
      actions,
      status: 'pending',
      createdAt: new Date()
    }

    this.sessions.set(sessionId, session)
    this.emit('session_created', { sessionId, url, actionCount: actions.length })
    
    return sessionId
  }

  async executeSession(sessionId: string): Promise<GhostSession> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.status = 'running'
    this.emit('session_started', { sessionId })

    const page = await this.browser!.newPage()
    
    try {
      // Setup stealth mode
      if (this.config.stealthMode) {
        await this.setupStealth(page)
      }

      // Execute actions
      for (const action of session.actions) {
        await this.executeAction(page, action)
        this.emit('action_completed', { sessionId, action: action.id })
      }

      session.status = 'completed'
      session.completedAt = new Date()
      this.emit('session_completed', { sessionId })

    } catch (error) {
      session.status = 'failed'
      session.error = error instanceof Error ? error.message : 'Unknown error'
      this.emit('session_failed', { sessionId, error: session.error })
    } finally {
      await page.close()
    }

    return session
  }

  private async setupStealth(page: Page): Promise<void> {
    // Override navigator properties
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
    })

    // Set user agent
    if (this.config.userAgent) {
      await page.setUserAgent(this.config.userAgent)
    }

    // Set viewport
    if (this.config.viewport) {
      await page.setViewport(this.config.viewport)
    }
  }

  private async executeAction(page: Page, action: GhostAction): Promise<void> {
    const timeout = action.timeout || this.config.timeout

    switch (action.type) {
      case 'navigate':
        if (!action.url) throw new Error('URL required for navigate action')
        await page.goto(action.url, { 
          waitUntil: 'networkidle2', 
          timeout 
        })
        break

      case 'click':
        if (!action.selector) throw new Error('Selector required for click action')
        await page.waitForSelector(action.selector, { timeout })
        await page.click(action.selector)
        break

      case 'type':
        if (!action.selector) throw new Error('Selector required for type action')
        if (!action.value) throw new Error('Value required for type action')
        await page.waitForSelector(action.selector, { timeout })
        await page.type(action.selector, action.value)
        break

      case 'scroll':
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight)
        })
        break

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, timeout))
        break

      case 'extract':
        if (!action.selector) throw new Error('Selector required for extract action')
        await page.waitForSelector(action.selector, { timeout })
        const extracted = await page.$$(action.selector)
        const results = await Promise.all(
          extracted.map(el => el.evaluate(el => el.textContent))
        )
        // Store results somewhere
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  async headlessSearch(url: string, searchSelectors: {
    searchBox: string
    searchButton: string
    results: string
  }, query: string): Promise<any[]> {
    const sessionId = await this.createSession(url, [
      { id: '1', type: 'navigate', url },
      { id: '2', type: 'wait', timeout: 2000 },
      { id: '3', type: 'click', selector: searchSelectors.searchBox },
      { id: '4', type: 'type', selector: searchSelectors.searchBox, value: query },
      { id: '5', type: 'click', selector: searchSelectors.searchButton },
      { id: '6', type: 'wait', timeout: 3000 },
      { id: '7', type: 'extract', selector: searchSelectors.results }
    ])

    const session = await this.executeSession(sessionId)
    
    if (session.status === 'completed') {
      return session.result || []
    } else {
      throw new Error(session.error || 'Search failed')
    }
  }

  async stealthScrape(url: string, dataSelectors: Record<string, string>): Promise<Record<string, any>> {
    const actions: GhostAction[] = [
      { id: '1', type: 'navigate', url },
      { id: '2', type: 'wait', timeout: 2000 }
    ]

    // Add extraction actions for each selector
    Object.entries(dataSelectors).forEach(([key, selector], index) => {
      actions.push({
        id: `extract_${index}`,
        type: 'extract',
        selector
      })
    })

    const sessionId = await this.createSession(url, actions)
    const session = await this.executeSession(sessionId)
    
    if (session.status === 'completed') {
      return session.result || {}
    } else {
      throw new Error(session.error || 'Scraping failed')
    }
  }

  getSession(sessionId: string): GhostSession | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): GhostSession[] {
    return Array.from(this.sessions.values())
  }

  getActiveSessions(): GhostSession[] {
    return this.getAllSessions().filter(s => s.status === 'running')
  }

  async cancelSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session && session.status === 'running') {
      session.status = 'failed'
      session.error = 'Cancelled by user'
      session.completedAt = new Date()
      this.emit('session_cancelled', { sessionId })
    }
  }

  async clearSessions(): Promise<void> {
    this.sessions.clear()
    this.emit('sessions_cleared')
  }

  getStatistics(): {
    totalSessions: number
    completedSessions: number
    failedSessions: number
    activeSessions: number
    isRunning: boolean
  } {
    const sessions = this.getAllSessions()
    
    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      failedSessions: sessions.filter(s => s.status === 'failed').length,
      activeSessions: sessions.filter(s => s.status === 'running').length,
      isRunning: this.isRunning
    }
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

    this.isRunning = false
    this.emit('shutdown')
  }
}

export default GhostHandAgent

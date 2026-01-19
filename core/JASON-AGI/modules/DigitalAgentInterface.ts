import { EventEmitter } from 'events'
import { setTimeout as delay } from 'timers/promises'
import { logger } from '../../../server/src/utils/logger'
import type { TaskExecutionPlan } from './AutonomousTaskPlanner'
import puppeteer from 'puppeteer'
import path from 'path'

export class DigitalAgentInterface extends EventEmitter {
  private config: any
  private currentUrl: string | null = null
  constructor(config: any) {
    super()
    this.config = config
  }

  public async executeAction(subTask: TaskExecutionPlan['subTasks'][number]): Promise<string> {
    await delay(50)
    const desc = subTask.description.toLowerCase()
    if (desc.includes('flight') || desc.includes('book') || desc.includes('purchase')) {
      this.currentUrl = 'https://www.google.com/travel/flights'
    } else if (desc.includes('schedule') || desc.includes('calendar')) {
      this.currentUrl = 'https://calendar.google.com/'
    } else {
      this.currentUrl = null
    }
    logger.info('Executing action', { description: subTask.description, domain: subTask.domain, url: this.currentUrl })
    return `ok:${subTask.id}`
  }

  public async executeContingency(contingency: { subTaskId: string; instructions: string }): Promise<string> {
    await delay(50)
    logger.info('Executing contingency', { subTaskId: contingency.subTaskId, instructions: contingency.instructions })
    return `contingency:${contingency.subTaskId}`
  }

  public async executeSimpleAction(goal: string, context?: any): Promise<string> {
    await delay(30)
    logger.info('Executing simple action', { goal, context })
    return `done:${goal}`
  }

  public getCurrentResourceUrl(): string | null {
    return this.currentUrl
  }

  public async exposeForReview(): Promise<void> {
    try {
      if (!this.currentUrl) return
      const opened = await this.openInVisibleBrowser(this.currentUrl)
      if (!opened) {
        const { spawn } = await import('node:child_process')
        const isWin = process.platform === 'win32'
        if (isWin) {
          try {
            spawn('cmd.exe', ['/c', 'start', '', this.currentUrl], { detached: true, stdio: 'ignore', shell: true }).unref()
          } catch {
            spawn('powershell', ['-NoProfile','-Command', `Start-Process "${this.currentUrl}"`], { detached: true, stdio: 'ignore' }).unref()
          }
        } else {
          spawn('xdg-open', [this.currentUrl], { detached: true, stdio: 'ignore' }).unref()
        }
      }
      logger.info('Exposed resource for review', { url: this.currentUrl })
    } catch (e: any) {
      logger.error('Failed to expose resource for review', e)
    }
  }

  private async openInVisibleBrowser(url: string): Promise<boolean> {
    try {
      const userDataDir = path.resolve('.browser-profile')
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--start-maximized'
        ],
        defaultViewport: { width: 1280, height: 800 }
      })
      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36')
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await this.performHumanMimicry(page)
      return true
    } catch (e) {
      logger.error('Puppeteer open failed', e)
      return false
    }
  }

  private async performHumanMimicry(page: any): Promise<void> {
    try {
      const jitter = async () => {
        const x = Math.floor(Math.random()*800)+100
        const y = Math.floor(Math.random()*500)+200
        await page.mouse.move(x, y, { steps: Math.floor(Math.random()*10)+5 })
      }
      await page.waitForTimeout(600 + Math.floor(Math.random()*600))
      await jitter()
      await page.waitForTimeout(400 + Math.floor(Math.random()*600))
      await page.mouse.wheel({ deltaY: Math.floor(Math.random()*400) })
      await page.waitForTimeout(500 + Math.floor(Math.random()*700))
    } catch {}
  }

  public async isHealthy(): Promise<boolean> { return true }
  public async shutdown(): Promise<void> {}
}

export default DigitalAgentInterface
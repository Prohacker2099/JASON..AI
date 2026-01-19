import { EventEmitter } from 'events'
// Force refresh
import puppeteer, { Browser, Page } from 'puppeteer'
import { chromium } from 'playwright'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'
import z from 'zod'
import { permissionManager } from '../trust/PermissionManager'
import { inputPriorityGuard } from '../input/InputPriorityGuard'
import { daiSandbox } from '../execution/DAI'
import { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { sseBroker } from '../websocket-service'

export interface UniversalAction {
  id: string
  type: 'web' | 'system' | 'file' | 'network' | 'api' | 'ui' | 'automation' | 'ai' | 'interact' | 'app' | 'powershell'
  category: 'browse' | 'scrape' | 'fill' | 'click' | 'type' | 'extract' | 'download' | 'upload' | 'script' | 'command' | 'monitor' | 'schedule' | 'read' | 'write' | 'remove' | 'list' | 'screenshot' | 'ask'
  target?: string
  selector?: string
  value?: any
  url?: string
  filepath?: string
  command?: string
  script?: string
  apiEndpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  data?: any
  timeout?: number
  retries?: number
  stealth?: boolean
  headless?: boolean
  waitCondition?: string
  screenshot?: boolean
  record?: boolean
  schedule?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  permissions?: string[]
  metadata?: Record<string, any>
}

export interface AutomationTask {
  id: string
  name: string
  description: string
  actions: UniversalAction[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled' | 'waiting_for_user'
  startTime?: Date
  endTime?: Date
  results?: any[]
  errors?: string[]
  progress: number
  logs: string[]
  environment?: 'web' | 'system' | 'hybrid'
  retryCount: number
  maxRetries: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  waitingForPromptId?: string
  interactionStepIndex?: number // Track where we paused
}

// ...




export interface GhostConfig {
  maxConcurrentTasks: number
  defaultTimeout: number
  defaultRetries: number
  enableRecording: boolean
  enableScreenshots: boolean
  enableStealth: boolean
  enableMonitoring: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  workspace: string
  permissions: {
    web: boolean
    system: boolean
    file: boolean
    network: boolean
    api: boolean
    ui: boolean
  }
  security: {
    allowExternalCommands: boolean
    allowFileAccess: boolean
    allowNetworkAccess: boolean
    sandboxMode: boolean
    allowedDomains: string[]
    blockedDomains: string[]
  }
}

const DEFAULT_CONFIG: GhostConfig = {
  maxConcurrentTasks: 5,
  defaultTimeout: 30000,
  defaultRetries: 3,
  enableRecording: true,
  enableScreenshots: true,
  enableStealth: true,
  enableMonitoring: true,
  logLevel: 'info',
  workspace: path.join(os.tmpdir(), 'ghost-workspace'),
  permissions: {
    web: true,
    system: true,
    file: true,
    network: true,
    api: true,
    ui: true
  },
  security: {
    allowExternalCommands: true,
    allowFileAccess: true,
    allowNetworkAccess: true,
    sandboxMode: false,
    allowedDomains: ['*'],
    blockedDomains: []
  }
}

export class UniversalGhostHand extends EventEmitter implements ActionAdapter {
  private config: GhostConfig
  private browser: Browser | null = null
  private playwrightBrowser: any = null
  private activeTasks: Map<string, AutomationTask> = new Map()
  private taskQueue: AutomationTask[] = []
  private isRunning = false
  private workspace: string
  private startedAt: number | null = null

  constructor(config: Partial<GhostConfig> = {}) {
    super()
    this.on('error', () => { })
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.workspace = this.config.workspace

    // Auto-detect headless mode from environment
    if (process.env.GHOST_HEADLESS === 'false') {
      this.config.security.sandboxMode = false // Ensure visibility
    }

    this.initializeWorkspace()
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await fs.mkdir(this.workspace, { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'screenshots'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'recordings'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'logs'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'data'), { recursive: true })
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize workspace'))
    }
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return

    try {
      const isHeadless = process.env.GHOST_HEADLESS !== 'false'
      console.log(`[GhostHand] Launching browser (headless: ${isHeadless})...`)
      this.browser = await puppeteer.launch({
        headless: isHeadless,
        defaultViewport: { width: 1280, height: 800 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      })
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize browser'))
      return
    }

    this.isRunning = true
    this.startedAt = Date.now()
    this.emit('initialized')
    this.startTaskProcessor()
  }

  // UNIVERSAL TASK CREATION METHODS

  async createWebAutomationTask(name: string, description: string, actions: UniversalAction[]): Promise<string> {
    const task: AutomationTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      actions,
      status: 'pending',
      progress: 0,
      logs: [],
      errors: [],
      retryCount: 0,
      maxRetries: this.config.defaultRetries,
      createdBy: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: 'web'
    }

    this.activeTasks.set(task.id, task)
    this.taskQueue.push(task)
    this.emit('task_created', task)

    return task.id
  }

  async createSystemAutomationTask(name: string, description: string, commands: string[]): Promise<string> {
    const actions: UniversalAction[] = commands.map((cmd, index) => ({
      id: `cmd_${index}`,
      type: 'system',
      category: 'command',
      command: cmd,
      timeout: this.config.defaultTimeout,
      priority: 'medium'
    }))

    return this.createWebAutomationTask(name, description, actions)
  }

  async createFileAutomationTask(name: string, description: string, operations: any[]): Promise<string> {
    const actions: UniversalAction[] = operations.map((op, index) => ({
      id: `file_${index}`,
      type: 'file',
      category: op.category,
      filepath: op.filepath,
      value: op.value,
      timeout: this.config.defaultTimeout,
      priority: 'medium'
    }))

    return this.createWebAutomationTask(name, description, actions)
  }

  async createApiAutomationTask(name: string, description: string, apiCalls: any[]): Promise<string> {
    const actions: UniversalAction[] = apiCalls.map((call, index) => ({
      id: `api_${index}`,
      type: 'api',
      category: 'monitor',
      apiEndpoint: call.endpoint,
      method: call.method || 'GET',
      headers: call.headers,
      data: call.data,
      timeout: this.config.defaultTimeout,
      priority: 'medium'
    }))

    return this.createWebAutomationTask(name, description, actions)
  }

  // PRESET TEMPLATES FOR COMMON AUTOMATION

  async createWebScrapingTask(url: string, selectors: Record<string, string>): Promise<string> {
    const actions: UniversalAction[] = [
      { id: 'nav', type: 'web', category: 'browse', url, timeout: 10000 },
      { id: 'wait', type: 'web', category: 'browse', waitCondition: 'networkidle', timeout: 5000 }
    ]

    Object.entries(selectors).forEach(([key, selector], index) => {
      actions.push({
        id: `extract_${key}`,
        type: 'web',
        category: 'extract',
        selector,
        timeout: 3000,
        priority: 'medium'
      })
    })

    return this.createWebAutomationTask(
      `Scrape ${url}`,
      `Extract data from ${url}`,
      actions
    )
  }

  async createFormFillTask(url: string, formData: Record<string, any>, submitSelector?: string): Promise<string> {
    const actions: UniversalAction[] = [
      { id: 'nav', type: 'web', category: 'browse', url, timeout: 10000 }
    ]

    Object.entries(formData).forEach(([selector, value], index) => {
      actions.push({
        id: `fill_${index}`,
        type: 'web',
        category: 'fill',
        selector,
        value,
        timeout: 3000
      })
    })

    if (submitSelector) {
      actions.push({
        id: 'submit',
        type: 'web',
        category: 'click',
        selector: submitSelector,
        timeout: 5000
      })
    }

    return this.createWebAutomationTask(
      `Fill form on ${url}`,
      `Automatically fill and submit form`,
      actions
    )
  }

  async createMonitoringTask(urls: string[], checks: any[]): Promise<string> {
    const actions: UniversalAction[] = []

    urls.forEach((url, urlIndex) => {
      actions.push({
        id: `monitor_${urlIndex}`,
        type: 'web',
        category: 'monitor',
        url,
        timeout: 15000,
        priority: 'medium'
      })

      checks.forEach((check, checkIndex) => {
        actions.push({
          id: `check_${urlIndex}_${checkIndex}`,
          type: 'web',
          category: 'extract',
          selector: check.selector,
          timeout: 3000,
          metadata: { expected: check.expected, type: check.type }
        })
      })
    })

    return this.createWebAutomationTask(
      'Multi-site Monitoring',
      `Monitor ${urls.length} websites`,
      actions
    )
  }

  async createDataExtractionTask(url: string, extractionPlan: any): Promise<string> {
    const actions: UniversalAction[] = [
      { id: 'nav', type: 'web', category: 'browse', url, timeout: 10000 },
      { id: 'wait', type: 'web', category: 'browse', waitCondition: 'networkidle', timeout: 5000 }
    ]

    extractionPlan.steps.forEach((step: any, index: number) => {
      actions.push({
        id: `extract_${index}`,
        type: 'web',
        category: step.category || 'extract',
        selector: step.selector,
        value: step.value,
        timeout: step.timeout || 3000,
        metadata: step.metadata || {}
      })
    })

    return this.createWebAutomationTask(
      `Data extraction from ${url}`,
      extractionPlan.description,
      actions
    )
  }

  async createScreenshotTask(url: string, options: any = {}): Promise<string> {
    const actions: UniversalAction[] = [
      {
        id: 'nav',
        type: 'web',
        category: 'browse',
        url,
        timeout: 10000,
        screenshot: true
      },
      {
        id: 'screenshot',
        type: 'web',
        category: 'browse',
        screenshot: true,
        metadata: {
          fullPage: options.fullPage || false,
          quality: options.quality || 80,
          format: options.format || 'png'
        }
      }
    ]

    return this.createWebAutomationTask(
      `Screenshot of ${url}`,
      `Capture screenshot of ${url}`,
      actions
    )
  }

  async createDownloadTask(url: string, downloadPath?: string): Promise<string> {
    const actions: UniversalAction[] = [
      {
        id: 'nav',
        type: 'web',
        category: 'download',
        url,
        timeout: 30000,
        metadata: { downloadPath }
      }
    ]

    return this.createWebAutomationTask(
      `Download from ${url}`,
      `Download file from ${url}`,
      actions
    )
  }

  async createMultiStepWorkflow(workflow: any): Promise<string> {
    const actions: UniversalAction[] = []

    workflow.steps.forEach((step: any, index: number) => {
      actions.push({
        id: `step_${index}`,
        type: step.type,
        category: step.category,
        target: step.target,
        selector: step.selector,
        value: step.value,
        url: step.url,
        command: step.command,
        script: step.script,
        apiEndpoint: step.apiEndpoint,
        method: step.method,
        headers: step.headers,
        data: step.data,
        timeout: step.timeout || this.config.defaultTimeout,
        retries: step.retries || this.config.defaultRetries,
        priority: step.priority || 'medium',
        metadata: step.metadata || {}
      })
    })

    return this.createWebAutomationTask(
      workflow.name,
      workflow.description,
      actions
    )
  }

  // UNIVERSAL REASONING & EXECUTION
  async executeGenericTask(prompt: string): Promise<string> {
    try {
      // 1. Try HTN Planner first (High-fidelity presets + Local reasoning)
      const { compilePlanUniversal } = await import('../planner/HTNPlanner')
      const htnPlan = await compilePlanUniversal(prompt)

      if (htnPlan && htnPlan.tasks && htnPlan.tasks.length > 0 && htnPlan.tasks[0].id !== 'fallback_task') {
        const actions: UniversalAction[] = htnPlan.tasks.map((t, index) => {
          if (t.action) return { ...t.action, id: t.id }
          return {
            id: t.id,
            type: 'ai' as any,
            category: 'analyze' as any,
            value: t.name,
            timeout: 30000
          }
        })

        return this.createWebAutomationTask(
          `HTN: ${prompt.substring(0, 30)}...`,
          `Compiled via HTNPlanner: ${prompt}`,
          actions
        )
      }

      // 2. Fallback: Call Python Reasoning Brain to plan the task
      const response = await fetch('http://localhost:8000/plan_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error(`Brain planning failed: ${response.statusText}`)
      }

      const plan = await response.json()
      // plan should be { plan: [ { type, ... } ] }
      const actions: UniversalAction[] = (plan.plan || []).map((step: any, index: number) => ({
        id: `gen_${Date.now()}_${index}`,
        type: step.type,
        category: step.category,
        url: step.url,
        command: step.command,
        selector: step.selector,
        value: step.value,
        timeout: 30000
      }))

      if (actions.length === 0) {
        throw new Error('Brain returned no actions')
      }

      return this.createWebAutomationTask(
        `Auto: ${prompt.substring(0, 30)}...`,
        `Generated from prompt: ${prompt}`,
        actions
      )

    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  // TASK EXECUTION ENGINE

  private startTaskProcessor(): void {
    setInterval(() => {
      this.processNextTask()
    }, 1000)
  }

  private async processNextTask(): Promise<void> {
    if (this.activeTasks.size >= this.config.maxConcurrentTasks) return
    if (this.taskQueue.length === 0) return

    const task = this.taskQueue.shift()
    if (!task) return

    this.executeTask(task)
  }

  private async executeTask(task: AutomationTask): Promise<void> {
    task.status = 'running'
    task.startTime = new Date()
    task.progress = 0
    task.logs = []

    this.emit('task_started', task)

    try {
      // Resume logic: if interactionStepIndex is set, start from there
      let startIdx = 0
      if (typeof task.interactionStepIndex === 'number') {
        startIdx = task.interactionStepIndex
        // Reset it so we don't skip again if we restart? 
        // Actually we should only reset if we complete it.
        // Let's assume we clear it after we pass it.
      }

      for (let i = startIdx; i < task.actions.length; i++) {
        const action = task.actions[i]
        task.progress = (i / task.actions.length) * 100

        this.log(task, `Executing action ${i + 1}/${task.actions.length}: ${action.type}.${action.category}`)

        // Global kill switch
        try {
          if (typeof (permissionManager as any).isPaused === 'function' && (permissionManager as any).isPaused()) {
            throw new Error('paused_by_kill_switch')
          }
        } catch { }

        const result = await this.executeAction(task, action)

        // Check for interaction pause
        if (result && result.status === 'paused_for_interaction') {
          this.log(task, `Task paused for user interaction: ${action.value || 'Input required'}`)
          task.status = 'waiting_for_user'
          task.waitingForPromptId = result.promptId
          task.interactionStepIndex = i + 1 // Next time resume from NEXT step? No, interact execution is "done" when we create prompt, but we need to supply value on resume.
          // Actually, 'interact' action is "done" when the user PROVIDES input.
          // So we should effectively RE-RUN this step or handle it? 
          // If we say index i+1, we skip the current interact step. 
          // Does the prompt result get used?
          // If the interaction step is just "Ask user X", then the result is "User said Y".
          // If we skip it, we lose "User said Y".
          // Ideally, we mark this step as completed with the result provided by resumeTask.
          // But executeAction just returned 'paused'.
          // So, let's store index = i. On resume, we treat it special?
          task.interactionStepIndex = i // Resume AT this step, but handle injection of value?
          // Simpler: Mark it 'waiting'. 
          // On resumeInteractionTask(taskId, response), we set result of step i = response, then increment i, then call processNextTask or just re-queue.
          // Let's set index = i + 1 assuming we will inject the result in resume method OR we make the interact action returning the value.
          // If we return 'paused', we haven't got the value.
          // So we must resume AT 'i'.
          task.interactionStepIndex = i
          return // EXIT LOOP
        }

        if (this.config.enableScreenshots && action.type === 'web') {
          await this.takeScreenshot(task, `action_${i}`)
        }
      }

      task.status = 'completed'
      task.endTime = new Date()
      task.progress = 100

      this.emit('task_completed', task)
      this.log(task, 'Task completed successfully')

    } catch (error) {
      task.errors.push(error instanceof Error ? error.message : 'Unknown error')

      if (task.retryCount < task.maxRetries) {
        task.retryCount++
        task.status = 'pending'
        this.taskQueue.push(task)
        this.log(task, `Task failed, retrying (${task.retryCount}/${task.maxRetries})`)
      } else {
        task.status = 'failed'
        task.endTime = new Date()
        this.emit('task_failed', task)
        this.log(task, `Task failed after ${task.maxRetries} retries`)
      }
    } finally {
      this.activeTasks.delete(task.id)
    }
  }

  private isDomainAllowed(urlStr: string): boolean {
    try {
      const u = new URL(String(urlStr))
      const host = u.hostname.toLowerCase()
      const allowed = (this.config.security.allowedDomains || []).map(d => String(d || '').toLowerCase()).filter(Boolean)
      const blocked = (this.config.security.blockedDomains || []).map(d => String(d || '').toLowerCase()).filter(Boolean)
      if (blocked.includes(host)) return false
      if (allowed.includes('*')) return true
      return allowed.includes(host)
    } catch {
      return false
    }
  }

  private async waitForUserIdle(maxWaitMs = 10000, quietWindowMs = 800): Promise<boolean> {
    const start = Date.now()
    while ((Date.now() - start) < Math.max(100, maxWaitMs)) {
      try { if (!inputPriorityGuard.isActive(quietWindowMs)) return true } catch { }
      await new Promise(r => setTimeout(r, 100))
    }
    try { return !inputPriorityGuard.isActive(quietWindowMs) } catch { return true }
  }

  private isHighImpact(task: AutomationTask, action: UniversalAction): boolean {
    const s = `${task.name} ${task.description} ${action.type}.${action.category} ${action.url || ''} ${action.target || ''} ${action.selector || ''} ${action.command || ''} ${JSON.stringify(action.value ?? '')} ${JSON.stringify(action.data ?? '')}`
    return /\b(pay|purchase|book|order|buy|charge|checkout|billing|transfer|wire|bank|crypto|delete|remove|wipe|shutdown|install|uninstall|send|email|message|dm|post|publish|submit|turn\s*in)\b/i.test(s)
  }

  private async requireApproval(task: AutomationTask, action: UniversalAction, rationale: string): Promise<void> {
    const prompt = permissionManager.createPrompt({
      level: 3,
      title: `Confirm: ${task.name}`,
      rationale,
      options: ['approve', 'reject', 'delay'],
      meta: { taskId: task.id, taskName: task.name, action }
    })

    // UI needs to know we are waiting
    const previousStatus = task.status
    task.status = 'waiting_for_user'
    task.waitingForPromptId = prompt.id
    this.emit('task_updated', task)

    try {
      const d = await permissionManager.waitForDecision(prompt.id, 120000)
      if (d !== 'approve') {
        throw new Error(`blocked_by_user_${d}`)
      }
    } finally {
      task.status = previousStatus
      task.waitingForPromptId = undefined
      this.emit('task_updated', task)
    }
  }

  private async executeAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    const timeout = action.timeout || this.config.defaultTimeout

    // Non-interference guard for operations that may touch OS/UI
    try {
      if (['system', 'file', 'ui', 'app', 'powershell'].includes(action.type)) {
        const idle = await this.waitForUserIdle(10000, 800)
        if (!idle) throw new Error('deferred_due_to_user_activity')
      }
    } catch { }

    switch (action.type) {
      case 'web':
        return this.executeWebAction(task, action)
      case 'system':
        return this.executeSystemAction(task, action)
      case 'file':
        return this.executeFileAction(task, action)
      case 'api':
        return this.executeApiAction(task, action)
      case 'ui':
        return this.executeUIAction(task, action)
      case 'automation':
        return this.executeAutomationAction(task, action)
      case 'ai':
        return this.executeAIAction(task, action)
      case 'interact':
        return this.executeInteractAction(task, action)
      case 'app':
      case 'powershell':
        this.log(task, `Delegating ${action.type} action to DAISandbox...`)
        const res = await daiSandbox.execute({
          type: action.type as any,
          name: action.category || action.type,
          payload: {
            path: (action as any).path || (action as any).filepath || action.value,
            command: action.command,
            args: (action as any).args,
            desktopName: (action.metadata as any)?.desktopName || 'JASON_Workspace',
            ghost: (action.metadata as any)?.ghost !== false
          },
          riskLevel: action.priority === 'high' ? 0.7 : 0.3
        }, {
          allowApp: true,
          allowPowershell: true,
          allowProcess: true,
          allowUI: true
        })
        if (!res.ok) throw new Error(res.error || 'Execution failed')
        return res.result
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async executeInteractAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    // Check if we have a resume value
    if (action.metadata && action.metadata._interactionResult) {
      const res = action.metadata._interactionResult
      delete action.metadata._interactionResult // Cleanup
      return res
    }

    // Otherwise, create prompt and pause
    const prompt = permissionManager.createPrompt({
      level: 2,
      title: action.value || task.name,
      rationale: 'User input required to proceed.',
      options: (action.metadata?.options as string[]) || ['Continue'],
      meta: { taskId: task.id, actionId: action.id }
    })

    return { status: 'paused_for_interaction', promptId: prompt.id }
  }


  private async executeWebAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    const page = await this.browser!.newPage()

    try {
      if (this.config.enableStealth) {
        await this.setupStealth(page)
      }

      switch (action.category) {
        case 'browse':
          if (action.url) {
            if (!this.isDomainAllowed(action.url)) {
              throw new Error('blocked_by_sandbox_policy')
            }
            await page.goto(action.url, { waitUntil: 'networkidle2', timeout: action.timeout })
            this.log(task, `Navigated to ${action.url}. Current URL seen: ${page.url()}`)
            sseBroker.broadcast('vision:url', { url: page.url(), taskId: task.id })
          }
          if (action.waitCondition) {
            await this.waitForCondition(page, action.waitCondition)
          }
          break

        case 'click':
          if (this.isHighImpact(task, action)) {
            await this.requireApproval(task, action, 'High-impact web automation action (click).')
          }
          if (action.selector) {
            await page.waitForSelector(action.selector, { timeout: 30000 })
            await page.click(action.selector)
          }
          break

        case 'fill':
          if (this.isHighImpact(task, action)) {
            await this.requireApproval(task, action, 'High-impact web automation action (fill).')
          }
          if (action.selector && action.value !== undefined) {
            await page.waitForSelector(action.selector, { timeout: 30000 })
            await page.type(action.selector, String(action.value))
          }
          break

        case 'extract':
          if (action.selector) {
            await page.waitForSelector(action.selector, { timeout: 30000 })
            const elements = await page.$$(action.selector)
            const results = await Promise.all(
              elements.map(el => el.evaluate(el => el.textContent))
            )
            return results
          }
          break

        case 'scrape':
          return this.scrapePage(page, action)

        case 'download':
          if (action.url) {
            if (!this.isDomainAllowed(action.url)) {
              throw new Error('blocked_by_sandbox_policy')
            }
            await this.requireApproval(task, action, 'Download requested via automation.')
            const client = await page.target().createCDPSession()
            await client.send('Page.setDownloadBehavior', {
              behavior: 'allow',
              downloadPath: action.metadata?.downloadPath || this.workspace
            })
            await page.goto(action.url, { waitUntil: 'networkidle2', timeout: 30000 })
          }
          break

        case 'screenshot':
          const screenshotPath = path.join(this.workspace, 'screenshots', `${task.id}_${Date.now()}.png`)
          await page.screenshot({
            path: screenshotPath,
            fullPage: action.metadata?.fullPage || false,
            quality: action.metadata?.quality || 80
          })
          return screenshotPath

        default:
          throw new Error(`Unknown web action category: ${action.category}`)
      }
    } finally {
      await page.close()
    }
  }

  private async executeSystemAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    if (!this.config.security.allowExternalCommands) {
      throw new Error('System commands are disabled')
    }

    if (this.config.security.sandboxMode) {
      throw new Error('blocked_by_sandbox_policy')
    }

    if (!action.command) {
      throw new Error('Command is required for system actions')
    }

    await this.requireApproval(task, action, 'System command execution requested.')

    return new Promise((resolve, reject) => {
      const child = spawn(action.command!, [], { shell: true })
      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
        this.log(task, `STDOUT: ${data.toString().trim()}`)
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
        this.log(task, `STDERR: ${data.toString().trim()}`)
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code })
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`))
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  private async executeFileAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    if (!this.config.security.allowFileAccess) {
      throw new Error('File access is disabled')
    }

    switch (action.category) {
      case 'read':
        if (action.filepath) {
          return await fs.readFile(action.filepath, 'utf-8')
        }
        break

      case 'write':
        await this.requireApproval(task, action, 'File write requested.')
        if (action.filepath && action.value !== undefined) {
          await fs.writeFile(action.filepath, action.value)
          return true
        }
        break

      case 'remove':
        if (action.filepath) {
          await this.requireApproval(task, action, 'File removal requested.')
          await fs.unlink(action.filepath)
          return true
        }
        break

      case 'list':
        if (action.filepath) {
          return await fs.readdir(action.filepath)
        }
        break

      default:
        throw new Error(`Unknown file action category: ${action.category}`)
    }
  }

  private async executeApiAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    if (!this.config.security.allowNetworkAccess) {
      throw new Error('Network access is disabled')
    }

    const url = action.apiEndpoint
    if (!url) {
      throw new Error('API endpoint is required')
    }

    if (!this.isDomainAllowed(url)) {
      throw new Error('blocked_by_sandbox_policy')
    }

    if ((action.method && action.method !== 'GET') || this.isHighImpact(task, action)) {
      await this.requireApproval(task, action, 'Non-GET or high-impact API request requested.')
    }

    const options: RequestInit = {
      method: action.method || 'GET',
      headers: action.headers || {}
    }

    if (action.data && (action.method === 'POST' || action.method === 'PUT')) {
      options.body = JSON.stringify(action.data)
      options.headers!['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, options)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return data
  }

  private async executeAIAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    if (action.category === 'analyze_screen' || action.category === 'vision') {
      this.log(task, 'Performing AI Vision Analysis...')

      let screenshotPath: string = '';

      // 1. Try Browser Screenshot if available
      if (this.browser) {
        try {
          const pages = await this.browser.pages();
          const page = pages[pages.length - 1];
          if (page) {
            screenshotPath = path.join(this.workspace, 'screenshots', `vision_web_${task.id}_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
          }
        } catch (e) {
          this.log(task, `Browser screenshot failed, attempting system fallback: ${e}`);
        }
      }

      // 2. Fallback to System Screenshot (Hidden Desktop or Primary)
      if (!screenshotPath) {
        screenshotPath = path.join(this.workspace, 'screenshots', `vision_sys_${task.id}_${Date.now()}.png`);

        try {
          // Import PowerShellRunner dynamically to avoid circular dependencies if any
          const { runPowerShell } = await import('./PowerShellRunner');

          const psScript = `
            Add-Type -AssemblyName System.Drawing
            Add-Type -AssemblyName System.Windows.Forms
            $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
            $bitmap.Save("${screenshotPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $bitmap.Dispose()
          `;

          const result = await runPowerShell(psScript);
          if (result.code !== 0) {
            throw new Error(`System screenshot failed: ${result.stderr}`);
          }
        } catch (e) {
          throw new Error(`Failed to capture system screenshot for vision: ${e}`);
        }
      }

      try {
        const fileBuffer = await fs.readFile(screenshotPath);

        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        formData.append('file', blob, 'screenshot.png');

        const response = await fetch('http://localhost:8000/analyze_screen', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Vision analysis failed: ${response.statusText}`);
        }

        const analysis = await response.json();
        this.log(task, `Vision Analysis complete: ${analysis.description || 'Success'}`);
        return { status: 'completed', analysis };
      } catch (error) {
        throw new Error(`AI Vision processing failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (screenshotPath) {
          try { await fs.unlink(screenshotPath); } catch { }
        }
      }
    }

    this.log(task, `AI action: ${action.category}`)
    return { status: 'completed', ai: action.category }
  }

  private async executeUIAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    // 1. Try DAISandbox for registered capabilities (vlm, ui.set_value, etc.)
    try {
      if (action.name && (action.name.startsWith('vlm.') || action.name.startsWith('ui.'))) {
        this.log(task, `Delegating advanced UI action ${action.name} to DAISandbox...`)
        const res = await daiSandbox.execute({
          type: 'ui',
          name: action.name,
          payload: {
            ...action.payload,
            ...action.metadata,
            value: action.value,
            targetText: action.value, // for semantic_click
            desktopName: (action.metadata as any)?.desktopName || 'JASON_Workspace'
          },
          riskLevel: action.priority === 'high' ? 0.7 : 0.2
        }, {
          allowUI: true
        })
        if (res.ok) return res.result
        this.log(task, `DAISandbox UI delegation returned error: ${res.error}. Falling back to Python Brain.`)
      }
    } catch (e) {
      this.log(task, `UI delegation attempt failed: ${e}`)
    }

    // 2. Legacy/Fallback: Delegate UI automation to JASON Python Engine
    try {
      const response = await fetch('http://localhost:8000/execute_ui_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: action.category || action.name,
          parameters: {
            x: action.metadata?.x,
            y: action.metadata?.y,
            text: action.value,
            keys: action.value,
            selector: action.selector
          }
        })
      })

      if (!response.ok) {
        throw new Error(`UI Action failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`UI Automation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }


  private async executeAutomationAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    if (action.script) {
      // Execute custom automation script
      this.log(task, `Executing automation script: ${action.script}`)
      return { status: 'completed', script: action.script }
    }
    return { status: 'completed' }
  }



  private async executeInteractAction(task: AutomationTask, action: UniversalAction): Promise<any> {
    // If we are resuming (checked via some flag?), returns the value. 
    // But executeAction is stateless here. 
    // The resume logic happens in resumeInteractionTask which modifies state before calling executeTask again.
    // So if (action.value) is present (injected by resume), we return it.
    // But wait, the original action definition might have a default value?
    // We need a way to know if this is a "fresh" call or a "resume" call with data.
    // We can check if `task.interactionStepIndex` matches current step index AND we have some "interactionResult" stored in task?
    // Or easier:
    // If the action has a `_result` metadata injected?
    if (action.metadata && action.metadata._interactionResult) {
      const res = action.metadata._interactionResult
      delete action.metadata._interactionResult // Cleanup
      return res
    }

    // Otherwise, create prompt and pause
    const prompt = permissionManager.createPrompt({
      level: 2,
      title: action.value || task.name,
      rationale: 'User input required to proceed.',
      options: (action.metadata?.options as string[]) || ['Continue'],
      meta: { taskId: task.id, actionId: action.id }
    })

    return { status: 'paused_for_interaction', promptId: prompt.id }
  }

  // UTILITY METHODS

  private async setupStealth(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
    })
  }

  private async waitForCondition(page: Page, condition: string): Promise<void> {
    switch (condition) {
      case 'networkidle':
        await new Promise(resolve => setTimeout(resolve, 3000))
        break
      case 'load':
        await new Promise(resolve => setTimeout(resolve, 2000))
        break
      default:
        await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  private async scrapePage(page: Page, action: UniversalAction): Promise<any> {
    const data = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        text: document.body.innerText,
        links: Array.from(document.querySelectorAll('a')).map(a => a.href),
        images: Array.from(document.querySelectorAll('img')).map(img => img.src),
        forms: Array.from(document.querySelectorAll('form')).map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            name: input.name,
            type: input.type,
            value: input.value
          }))
        }))
      }
    })
    return data
  }

  private async takeScreenshot(task: AutomationTask, name: string): Promise<string> {
    if (!this.config.enableScreenshots) return ''

    const screenshotPath = path.join(this.workspace, 'screenshots', `${task.id}_${name}_${Date.now()}.png`)
    // Implementation would depend on current page context
    return screenshotPath
  }

  private log(task: AutomationTask, message: string): void {
    const logEntry = `[${new Date().toISOString()}] ${message}`
    task.logs.push(logEntry)
    this.emit('task_log', { taskId: task.id, message: logEntry })
  }

  // PUBLIC API METHODS

  async getTask(taskId: string): Promise<AutomationTask | undefined> {
    return this.activeTasks.get(taskId)
  }

  async getAllTasks(): Promise<AutomationTask[]> {
    return Array.from(this.activeTasks.values()).concat(this.taskQueue)
  }

  async getActiveTasks(): Promise<AutomationTask[]> {
    return Array.from(this.activeTasks.values()).filter(task => task.status === 'running')
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (task && task.status === 'running') {
      task.status = 'cancelled'
      task.endTime = new Date()
      this.emit('task_cancelled', task)
      this.activeTasks.delete(taskId)
      return true
    }
    return false
  }

  async pauseTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (task && task.status === 'running') {
      task.status = 'paused'
      this.emit('task_paused', task)
      return true
    }
    return false
  }

  async resumeTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (task && (task.status === 'paused' || task.status === 'waiting_for_user')) {
      task.status = 'pending' // Re-queue
      task.updatedAt = Date.now()
      this.taskQueue.push(task)
      this.emit('task_resumed', task)
      return true
    }
    return false
  }

  async resumeInteractionTask(taskId: string, response: any): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (task && task.status === 'waiting_for_user') {
      // Inject the response into the current action's metadata so executeInteractAction picks it up
      const idx = task.interactionStepIndex || 0
      if (task.actions[idx]) {
        if (!task.actions[idx].metadata) task.actions[idx].metadata = {}
          ; (task.actions[idx].metadata as any)._interactionResult = response
      }

      task.status = 'pending'
      task.waitingForPromptId = undefined
      task.updatedAt = Date.now()
      this.taskQueue.push(task)
      this.emit('task_resumed', task)
      return true
    }
    return false
  }

  getStatistics(): {
    totalTasks: number
    activeTasks: number
    completedTasks: number
    failedTasks: number
    queuedTasks: number
    isRunning: boolean
    uptime: number
  } {
    const allTasks = Array.from(this.activeTasks.values()).concat(this.taskQueue)

    return {
      totalTasks: allTasks.length,
      activeTasks: allTasks.filter(t => t.status === 'running').length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      queuedTasks: this.taskQueue.length,
      isRunning: this.isRunning,
      uptime: this.startedAt ? (Date.now() - this.startedAt) : 0
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
  // ActionAdapter implementation
  canHandle(a: ActionDefinition): boolean {
    // UniversalGhostHand can handle almost anything, but we'll prioritize 'web' and 'ai'
    return ['web', 'system', 'ui', 'app', 'powershell'].includes(a.type)
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    if (!this.isRunning) {
      await this.initialize()
    }
    const taskName = `Atomic: ${a.type}.${a.name || 'action'}`
    const taskDesc = `Unified execution of ${a.type} action via GhostHand`

    // Map ActionDefinition to UniversalAction
    const universalAction: UniversalAction = {
      id: `atomic_${Date.now()}`,
      type: a.type as any,
      category: (a.payload?.op || a.name || 'command') as any,
      url: a.payload?.url,
      selector: a.payload?.selector,
      value: a.payload?.value || a.payload?.text,
      command: a.payload?.command || a.payload?.script,
      metadata: a.payload
    }

    try {
      // For atomic execution, we want immediate result
      // Instead of queuing, we'll run it directly if possible to avoid lag,
      // but to keep it safe we use the internal executeAction

      // Temporary "task" context for logging
      const tempTask: AutomationTask = {
        id: 'atomic_context',
        name: taskName,
        description: taskDesc,
        actions: [universalAction],
        status: 'running',
        progress: 0,
        logs: [],
        errors: [],
        retryCount: 0,
        maxRetries: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await this.executeAction(tempTask, universalAction)
      return { ok: true, result }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Execution failed' }
    }
  }
}

export default UniversalGhostHand

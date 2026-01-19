import { EventEmitter } from 'events'
import { UniversalAppController } from '../universal/UniversalAppController'
import { GhostHandManager } from '../automation/GhostHandManager'
import { LocalAlexaPipeline } from '../voice/LocalAlexaPipeline'
import { AppConnectorPack } from '../connectors/AppConnectorPack'
import { SuperCreatorEngine } from '../content/SuperCreatorEngine'
import { DigitalConcierge } from '../concierge/DigitalConcierge'
import { compilePlan, executePlan, Plan, PlanTask } from '../planner/HTNPlanner'
import { permissionManager } from '../trust/PermissionManager'
import { alignmentModel } from '../ai/selfLearning/Alignment'
import { scrl } from '../intelligence/SCRL'

export interface JASONConfig {
  voice: {
    enabled: boolean
    whisperModel: string
    wakeWord: string
    continuousListening: boolean
  }
  automation: {
    enabled: boolean
    humanization: {
      jitter: boolean
      randomDelays: boolean
      mouseSpeed: 'instant' | 'fast' | 'normal' | 'slow' | 'human'
      typingPattern: 'instant' | 'fast' | 'normal' | 'human'
    }
    antiBot: {
      enabled: boolean
      stealthMode: boolean
      captchaStrategy: 'api' | 'emulation' | 'human'
    }
  }
  content: {
    enabled: boolean
    defaultModel: string
    fallbackModels: string[]
    cacheEnabled: boolean
  }
  concierge: {
    enabled: boolean
    searchSources: string[]
    autoTriage: boolean
    comparisonEnabled: boolean
  }
  security: {
    level: 1 | 2 | 3
    requireConfirmation: boolean
    auditEnabled: boolean
    encryptionEnabled: boolean
  }
  learning: {
    enabled: boolean
    alignmentTraining: boolean
    selfCorrection: boolean
    userStyleLearning: boolean
  }
}

export interface JASONState {
  status: 'initializing' | 'ready' | 'busy' | 'error' | 'shutdown'
  currentTask?: string
  activeCapabilities: string[]
  lastActivity: Date
  performance: {
    cpuUsage: number
    memoryUsage: number
    tasksCompleted: number
    averageResponseTime: number
  }
  security: {
    currentLevel: number
    pendingApprovals: number
    blockedActions: number
  }
}

export interface JASONCapability {
  id: string
  name: string
  description: string
  category: 'voice' | 'automation' | 'content' | 'search' | 'planning' | 'integration'
  enabled: boolean
  dependencies: string[]
  permissions: number[]
  health: 'healthy' | 'degraded' | 'offline'
  lastUsed?: Date
  usage: number
}

export interface JASONTask {
  id: string
  type: 'voice' | 'automation' | 'content' | 'search' | 'planning' | 'integration'
  intent: string
  parameters: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  result?: any
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  securityLevel: number
  requiresApproval: boolean
  approved?: boolean
}

export interface JASONEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'capability_changed' | 'security_alert' | 'performance_warning' | 'system_ready' | 'system_error'
  timestamp: Date
  source: string
  details: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'critical'
}

export class JASONCore extends EventEmitter {
  private config: JASONConfig
  private state: JASONState
  private capabilities: Map<string, JASONCapability> = new Map()
  private tasks: Map<string, JASONTask> = new Map()
  private components: Record<string, any> = {}
  private eventLog: JASONEvent[] = []
  private isInitialized: boolean = false

  // Core Components
  private appController: UniversalAppController
  private ghostHand: GhostHandManager
  private voicePipeline: LocalAlexaPipeline
  private connectors: AppConnectorPack
  private contentEngine: SuperCreatorEngine
  private concierge: DigitalConcierge

  constructor(config: Partial<JASONConfig> = {}) {
    super()

    this.config = this.mergeConfig(config)
    this.state = this.initializeState()

    // Initialize core components
    this.appController = new UniversalAppController()
    this.ghostHand = new GhostHandManager()
    this.voicePipeline = new LocalAlexaPipeline()
    this.connectors = new AppConnectorPack()
    this.contentEngine = new SuperCreatorEngine()
    this.concierge = new DigitalConcierge(this.connectors, this.contentEngine)

    this.setupEventHandlers()
    this.initializeCapabilities()
  }

  private mergeConfig(userConfig: Partial<JASONConfig>): JASONConfig {
    const defaultConfig: JASONConfig = {
      voice: {
        enabled: true,
        whisperModel: 'base',
        wakeWord: 'jason',
        continuousListening: false
      },
      automation: {
        enabled: true,
        humanization: {
          jitter: true,
          randomDelays: true,
          mouseSpeed: 'human',
          typingPattern: 'human'
        },
        antiBot: {
          enabled: true,
          stealthMode: true,
          captchaStrategy: 'human'
        }
      },
      content: {
        enabled: true,
        defaultModel: 'mistral-7b',
        fallbackModels: ['gpt-4', 'claude-3'],
        cacheEnabled: true
      },
      concierge: {
        enabled: true,
        searchSources: ['email', 'calendar', 'files', 'web'],
        autoTriage: true,
        comparisonEnabled: true
      },
      security: {
        level: 2,
        requireConfirmation: true,
        auditEnabled: true,
        encryptionEnabled: true
      },
      learning: {
        enabled: true,
        alignmentTraining: true,
        selfCorrection: true,
        userStyleLearning: true
      }
    }

    return this.deepMerge(defaultConfig, userConfig)
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target }
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

  private initializeState(): JASONState {
    return {
      status: 'initializing',
      activeCapabilities: [],
      lastActivity: new Date(),
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        tasksCompleted: 0,
        averageResponseTime: 0
      },
      security: {
        currentLevel: this.config.security.level,
        pendingApprovals: 0,
        blockedActions: 0
      }
    }
  }

  private setupEventHandlers(): void {
    // Component event handlers
    this.appController.on('command_executed', (event) => {
      this.logEvent('task_completed', 'UniversalAppController', event, 'info')
    })

    this.ghostHand.on('action_completed', (event) => {
      this.logEvent('task_completed', 'GhostHandManager', event, 'info')
    })

    this.voicePipeline.on('intent_parsed', (event) => {
      this.logEvent('task_started', 'LocalAlexaPipeline', event, 'info')
    })

    this.connectors.on('connector_executed', (event) => {
      this.logEvent('task_completed', 'AppConnectorPack', event, 'info')
    })

    this.contentEngine.on('content_generated', (event) => {
      this.logEvent('task_completed', 'SuperCreatorEngine', event, 'info')
    })

    this.concierge.on('search_completed', (event) => {
      this.logEvent('task_completed', 'DigitalConcierge', event, 'info')
    })

    // Security and permission handlers
    permissionManager.on('permission_required', (event) => {
      this.logEvent('security_alert', 'PermissionManager', event, 'warning')
    })

    permissionManager.on('permission_denied', (event) => {
      this.logEvent('security_alert', 'PermissionManager', event, 'error')
    })

    // Learning and alignment handlers
    alignmentModel.on('alignment_scored', (event) => {
      this.logEvent('task_completed', 'AlignmentModel', event, 'info')
    })

    scrl.on('execution_reviewed', (event) => {
      this.logEvent('task_completed', 'SCRL', event, 'info')
    })
  }

  private initializeCapabilities(): void {
    // Voice capabilities
    this.addCapability({
      id: 'voice-input',
      name: 'Voice Input Processing',
      description: 'Process voice commands using Whisper STT',
      category: 'voice',
      enabled: this.config.voice.enabled,
      dependencies: ['whisper'],
      permissions: [1],
      health: 'healthy',
      usage: 0
    })

    this.addCapability({
      id: 'intent-parsing',
      name: 'Intent Parsing',
      description: 'Parse user intent from voice or text input',
      category: 'voice',
      enabled: true,
      dependencies: [],
      permissions: [1],
      health: 'healthy',
      usage: 0
    })

    // Automation capabilities
    this.addCapability({
      id: 'universal-app-control',
      name: 'Universal App Control',
      description: 'Control any desktop or web application',
      category: 'automation',
      enabled: true,
      dependencies: ['vlm', 'ui-automation'],
      permissions: [2],
      health: 'healthy',
      usage: 0
    })

    this.addCapability({
      id: 'ghost-hand',
      name: 'Ghost Hand Automation',
      description: 'Human-like mouse and keyboard automation',
      category: 'automation',
      enabled: this.config.automation.enabled,
      dependencies: ['ui-automation'],
      permissions: [2],
      health: 'healthy',
      usage: 0
    })

    // Content capabilities
    this.addCapability({
      id: 'content-generation',
      name: 'Content Generation',
      description: 'Generate documents, emails, and creative content',
      category: 'content',
      enabled: this.config.content.enabled,
      dependencies: ['mistral-7b'],
      permissions: [1],
      health: 'healthy',
      usage: 0
    })

    // Search and concierge capabilities
    this.addCapability({
      id: 'global-search',
      name: 'Global Search',
      description: 'Search across emails, files, calendar, and web',
      category: 'search',
      enabled: this.config.concierge.enabled,
      dependencies: ['connectors'],
      permissions: [1],
      health: 'healthy',
      usage: 0
    })

    this.addCapability({
      id: 'comparison-engine',
      name: 'Comparison Engine',
      description: 'Compare products, services, and options',
      category: 'search',
      enabled: this.config.concierge.comparisonEnabled,
      dependencies: [],
      permissions: [1],
      health: 'healthy',
      usage: 0
    })

    // Planning capabilities
    this.addCapability({
      id: 'htn-planning',
      name: 'HTN Task Planning',
      description: 'Decompose complex tasks into executable steps',
      category: 'planning',
      enabled: true,
      dependencies: [],
      permissions: [1],
      health: 'healthy',
      usage: 0
    })

    // Integration capabilities
    this.addCapability({
      id: 'app-connectors',
      name: 'App Connectors',
      description: 'Connect to Gmail, Calendar, Notion, and other apps',
      category: 'integration',
      enabled: true,
      dependencies: ['oauth'],
      permissions: [2],
      health: 'healthy',
      usage: 0
    })
  }

  // CORE METHODS

  async initialize(): Promise<void> {
    try {
      this.state.status = 'initializing'
      this.logEvent('system_ready', 'JASONCore', { status: 'initializing' }, 'info')

      // Initialize components in dependency order
      await this.initializeComponents()

      // Setup security and permissions
      await this.setupSecurity()

      // Start background services
      await this.startBackgroundServices()

      this.state.status = 'ready'
      this.state.activeCapabilities = Array.from(this.capabilities.values())
        .filter(cap => cap.enabled)
        .map(cap => cap.id)

      this.logEvent('system_ready', 'JASONCore', {
        status: 'ready',
        capabilities: this.state.activeCapabilities.length
      }, 'info')

      this.isInitialized = true
      this.emit('initialized')

    } catch (error) {
      this.state.status = 'error'
      this.logEvent('system_error', 'JASONCore', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'critical')
      throw error
    }
  }

  private async initializeComponents(): Promise<void> {
    const initPromises = []

    // Initialize voice pipeline
    if (this.config.voice.enabled) {
      initPromises.push(
        this.voicePipeline.initialize()
          .then(() => this.updateCapabilityHealth('voice-input', 'healthy'))
          .catch(() => this.updateCapabilityHealth('voice-input', 'offline'))
      )
    }

    // Initialize connectors
    initPromises.push(
      this.connectors.initialize()
        .then(() => this.updateCapabilityHealth('app-connectors', 'healthy'))
        .catch(() => this.updateCapabilityHealth('app-connectors', 'degraded'))
    )

    // Initialize content engine
    if (this.config.content.enabled) {
      initPromises.push(
        Promise.resolve()
          .then(() => this.updateCapabilityHealth('content-generation', 'healthy'))
          .catch(() => this.updateCapabilityHealth('content-generation', 'offline'))
      )
    }

    // Initialize concierge
    if (this.config.concierge.enabled) {
      initPromises.push(
        Promise.resolve()
          .then(() => this.updateCapabilityHealth('global-search', 'healthy'))
          .catch(() => this.updateCapabilityHealth('global-search', 'degraded'))
      )
    }

    await Promise.allSettled(initPromises)
  }

  private async setupSecurity(): Promise<void> {
    // Configure permission levels
    permissionManager.setDefaultLevel(this.config.security.level)

    // Setup audit logging if enabled
    if (this.config.security.auditEnabled) {
      // Enable audit logging
    }

    // Setup encryption if enabled
    if (this.config.security.encryptionEnabled) {
      // Enable encryption
    }
  }

  private async startBackgroundServices(): Promise<void> {
    // Start learning services if enabled
    if (this.config.learning.enabled) {
      // Start alignment training
      if (this.config.learning.alignmentTraining) {
        // Start alignment training service
      }

      // Start self-correction
      if (this.config.learning.selfCorrection) {
        // Start SCRL service
      }
    }

    // Start monitoring services
    this.startPerformanceMonitoring()
    this.startHealthChecks()
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage()
      this.state.performance.memoryUsage = memUsage.heapUsed / 1024 / 1024 // MB

      // Update CPU usage would require additional monitoring
      this.state.performance.cpuUsage = 0 // Placeholder

      this.state.lastActivity = new Date()
    }, 5000) // Update every 5 seconds
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.checkCapabilityHealth()
    }, 30000) // Check every 30 seconds
  }

  private checkCapabilityHealth(): void {
    // Check voice pipeline
    if (this.config.voice.enabled && this.voicePipeline.isReady()) {
      this.updateCapabilityHealth('voice-input', 'healthy')
    } else if (this.config.voice.enabled) {
      this.updateCapabilityHealth('voice-input', 'degraded')
    }

    // Check other components
    this.updateCapabilityHealth('universal-app-control', 'healthy')
    this.updateCapabilityHealth('ghost-hand', 'healthy')
    this.updateCapabilityHealth('content-generation', 'healthy')
    this.updateCapabilityHealth('global-search', 'healthy')
    this.updateCapabilityHealth('htn-planning', 'healthy')
  }

  // TASK EXECUTION

  async executeTask(task: Omit<JASONTask, 'id' | 'createdAt' | 'progress'>): Promise<JASONTask> {
    const taskId = this.generateTaskId()
    const fullTask: JASONTask = {
      ...task,
      id: taskId,
      createdAt: new Date(),
      progress: 0
    }

    this.tasks.set(taskId, fullTask)
    this.logEvent('task_started', 'JASONCore', {
      taskId,
      type: task.type,
      intent: task.intent
    }, 'info')

    try {
      fullTask.status = 'running'
      fullTask.startedAt = new Date()

      // Check security permissions
      if (task.requiresApproval) {
        const approved = await this.requestApproval(fullTask)
        if (!approved) {
          fullTask.status = 'cancelled'
          fullTask.error = 'Task approval denied'
          return fullTask
        }
        fullTask.approved = true
      }

      // Execute task based on type
      const result = await this.executeTaskByType(fullTask)

      fullTask.result = result
      fullTask.status = 'completed'
      fullTask.completedAt = new Date()
      fullTask.progress = 100

      this.state.performance.tasksCompleted++
      this.logEvent('task_completed', 'JASONCore', {
        taskId,
        success: true,
        duration: fullTask.completedAt.getTime() - (fullTask.startedAt?.getTime() || 0)
      }, 'info')

    } catch (error) {
      fullTask.status = 'failed'
      fullTask.error = error instanceof Error ? error.message : 'Unknown error'
      fullTask.completedAt = new Date()

      this.logEvent('task_failed', 'JASONCore', {
        taskId,
        error: fullTask.error
      }, 'error')
    }

    return fullTask
  }

  private async executeTaskByType(task: JASONTask): Promise<any> {
    switch (task.type) {
      case 'voice':
        return await this.executeVoiceTask(task)
      case 'automation':
        return await this.executeAutomationTask(task)
      case 'content':
        return await this.executeContentTask(task)
      case 'search':
        return await this.executeSearchTask(task)
      case 'planning':
        return await this.executePlanningTask(task)
      case 'integration':
        return await this.executeIntegrationTask(task)
      default:
        throw new Error(`Unknown task type: ${task.type}`)
    }
  }

  private async executeVoiceTask(task: JASONTask): Promise<any> {
    const intent = await this.voicePipeline.parseIntent(task.intent)

    // Convert intent to plan and execute
    const plan = await compilePlan(intent.action || task.intent, intent.entities)
    const result = await executePlan(plan)

    return {
      intent,
      plan,
      result
    }
  }

  private async executeAutomationTask(task: JASONTask): Promise<any> {
    const command = {
      id: task.id,
      intent: task.intent,
      app: task.parameters.app || 'system',
      action: task.parameters.action || 'execute',
      parameters: task.parameters,
      priority: task.priority,
      permissions: [task.securityLevel],
      execution: { type: 'ui', confidence: 0.8 }
    }

    return await this.appController.executeUniversalCommand(command)
  }

  private async executeContentTask(task: JASONTask): Promise<any> {
    const templateId = task.parameters.templateId || 'professional-email'
    const variables = task.parameters.variables || {}

    const request = {
      templateId,
      variables,
      style: task.parameters.style,
      constraints: task.parameters.constraints,
      priority: task.priority
    }

    return await this.contentEngine.generateContent(request)
  }

  private async executeSearchTask(task: JASONTask): Promise<any> {
    const query = {
      query: task.parameters.query || task.intent,
      type: task.parameters.type || 'all',
      filters: task.parameters.filters,
      priority: task.priority,
      maxResults: task.parameters.maxResults || 50,
      timeframe: task.parameters.timeframe
    }

    return await this.concierge.globalSearch(query)
  }

  private async executePlanningTask(task: JASONTask): Promise<any> {
    const goal = task.parameters.goal || task.intent
    const context = task.parameters.context || {}

    const plan = await compilePlan(goal, context)
    const result = task.parameters.execute ? await executePlan(plan) : { plan }

    return result
  }

  private async executeIntegrationTask(task: JASONTask): Promise<any> {
    const connector = task.parameters.connector
    const operation = task.parameters.operation
    const params = task.parameters.params || {}

    switch (connector) {
      case 'gmail':
        if (operation === 'send') {
          return await this.connectors.gmailSendEmail(params)
        } else if (operation === 'inbox') {
          return await this.connectors.gmailGetInbox(params.maxResults)
        } else if (operation === 'search') {
          return await this.connectors.gmailSearch(params.query, params.maxResults)
        }
        break
      case 'calendar':
        if (operation === 'create') {
          return await this.connectors.calendarCreateEvent(params)
        } else if (operation === 'list') {
          return await this.connectors.calendarGetEvents(params.start, params.end)
        }
        break
      case 'notion':
        if (operation === 'create') {
          return await this.connectors.notionCreatePage(params)
        } else if (operation === 'query') {
          return await this.connectors.notionQueryDatabase(params.databaseId, params.filter)
        }
        break
      default:
        throw new Error(`Unknown connector: ${connector}`)
    }

    throw new Error(`Unknown operation: ${operation} for connector: ${connector}`)
  }

  // UTILITY METHODS

  private addCapability(capability: JASONCapability): void {
    this.capabilities.set(capability.id, capability)
  }

  private updateCapabilityHealth(id: string, health: 'healthy' | 'degraded' | 'offline'): void {
    const capability = this.capabilities.get(id)
    if (capability) {
      capability.health = health
      capability.lastUsed = new Date()
    }
  }

  private async requestApproval(task: JASONTask): Promise<boolean> {
    const prompt = permissionManager.createPrompt({
      level: task.securityLevel as 1 | 2 | 3,
      title: `Task Approval Required`,
      rationale: `Task "${task.intent}" requires approval at level ${task.securityLevel}`,
      options: ['approve', 'reject'],
      meta: { taskId: task.id, task }
    })

    // In a real implementation, this would wait for user response
    // For now, auto-approve low-risk tasks
    return task.securityLevel <= 2
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  private logEvent(type: JASONEvent['type'], source: string, details: Record<string, any>, severity: JASONEvent['severity']): void {
    const event: JASONEvent = {
      type,
      timestamp: new Date(),
      source,
      details,
      severity
    }

    this.eventLog.push(event)
    this.emit('event', event)

    // Keep event log manageable
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-500)
    }
  }

  // PUBLIC API

  getState(): JASONState {
    return { ...this.state }
  }

  getConfig(): JASONConfig {
    return { ...this.config }
  }

  getCapabilities(): JASONCapability[] {
    return Array.from(this.capabilities.values())
  }

  getCapability(id: string): JASONCapability | undefined {
    return this.capabilities.get(id)
  }

  getTasks(): JASONTask[] {
    return Array.from(this.tasks.values())
  }

  getTask(id: string): JASONTask | undefined {
    return this.tasks.get(id)
  }

  getEventLog(limit?: number): JASONEvent[] {
    return limit ? this.eventLog.slice(-limit) : [...this.eventLog]
  }

  isReady(): boolean {
    return this.isInitialized && this.state.status === 'ready'
  }

  async shutdown(): Promise<void> {
    this.state.status = 'shutdown'

    // Cleanup components
    // Stop background services
    // Save state

    this.logEvent('system_ready', 'JASONCore', { status: 'shutdown' }, 'info')
    this.emit('shutdown')
  }

  // Configuration updates
  updateConfig(config: Partial<JASONConfig>): void {
    this.config = this.deepMerge(this.config, config)
    this.emit('config_updated', this.config)
  }

  // Capability management
  enableCapability(id: string): boolean {
    const capability = this.capabilities.get(id)
    if (capability) {
      capability.enabled = true
      this.emit('capability_changed', { id, enabled: true })
      return true
    }
    return false
  }

  disableCapability(id: string): boolean {
    const capability = this.capabilities.get(id)
    if (capability) {
      capability.enabled = false
      this.emit('capability_changed', { id, enabled: false })
      return true
    }
    return false
  }

  // Task management
  cancelTask(id: string): boolean {
    const task = this.tasks.get(id)
    if (task && (task.status === 'pending' || task.status === 'running')) {
      task.status = 'cancelled'
      task.completedAt = new Date()
      this.emit('task_cancelled', { taskId: id })
      return true
    }
    return false
  }

  // Quick access methods for common operations
  async processVoiceCommand(audioData: Buffer): Promise<any> {
    return await this.executeTask({
      type: 'voice',
      intent: 'process_voice_input',
      parameters: { audioData },
      priority: 'high',
      status: 'pending',
      progress: 0,
      securityLevel: 1,
      requiresApproval: false
    })
  }

  async generateContent(templateId: string, variables: Record<string, any>): Promise<any> {
    return await this.executeTask({
      type: 'content',
      intent: 'generate_content',
      parameters: { templateId, variables },
      priority: 'medium',
      status: 'pending',
      progress: 0,
      securityLevel: 1,
      requiresApproval: false
    })
  }

  async searchGlobal(query: string, type?: string): Promise<any> {
    return await this.executeTask({
      type: 'search',
      intent: 'global_search',
      parameters: { query, type },
      priority: 'medium',
      status: 'pending',
      progress: 0,
      securityLevel: 1,
      requiresApproval: false
    })
  }

  async planAndExecute(goal: string, context?: Record<string, any>): Promise<any> {
    return await this.executeTask({
      type: 'planning',
      intent: 'plan_and_execute',
      parameters: { goal, context, execute: true },
      priority: 'high',
      status: 'pending',
      progress: 0,
      securityLevel: 2,
      requiresApproval: true
    })
  }
}

export default JASONCore

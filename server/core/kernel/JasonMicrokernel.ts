import { EventEmitter } from 'events'
import { PriorityMessage, MessageHandler, SystemState } from '../../types/kernel'
import { SharedMemoryManager } from './SharedMemoryManager'
import { SecurityGuardian } from './SecurityGuardian'
import { Logger } from '../utils/Logger'

/**
 * JASON Microkernel - Core system orchestrator
 * Manages thread-based concurrency via Priority-Weighted Message Bus
 * Ensures zero interference with foreground applications
 */
export class JasonMicrokernel extends EventEmitter {
  private messageQueue: PriorityMessage[] = []
  private handlers = new Map<string, MessageHandler[]>()
  private memoryManager: SharedMemoryManager
  private securityGuardian: SecurityGuardian
  private logger: Logger
  private isRunning = false
  private systemState: SystemState
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.memoryManager = new SharedMemoryManager()
    this.securityGuardian = new SecurityGuardian()
    this.logger = new Logger('Microkernel')
    this.systemState = {
      status: 'initializing',
      uptime: 0,
      activeThreads: 0,
      memoryUsage: process.memoryUsage(),
      lastActivity: new Date()
    }
  }

  /**
   * Initialize the microkernel and start message processing
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing JASON Microkernel...')
      
      // Initialize shared memory
      await this.memoryManager.initialize()
      
      // Initialize security systems
      await this.securityGuardian.initialize()
      
      // Register core handlers
      this.registerCoreHandlers()
      
      // Start message processing loop
      this.startMessageProcessing()
      
      this.systemState.status = 'running'
      this.isRunning = true
      
      this.logger.info('JASON Microkernel initialized successfully')
      this.emit('system:ready')
      
    } catch (error) {
      this.logger.error('Failed to initialize microkernel:', error)
      this.systemState.status = 'error'
      throw error
    }
  }

  /**
   * Submit a message to the priority-weighted message bus
   */
  submitMessage(message: PriorityMessage): void {
    // Validate message through security guardian
    if (!this.securityGuardian.validateMessage(message)) {
      this.logger.warn('Message rejected by security guardian:', message.type)
      return
    }

    // Insert message in priority order
    const insertIndex = this.messageQueue.findIndex(
      m => m.priority < message.priority
    )
    
    if (insertIndex === -1) {
      this.messageQueue.push(message)
    } else {
      this.messageQueue.splice(insertIndex, 0, message)
    }

    this.systemState.lastActivity = new Date()
    this.logger.debug(`Message queued: ${message.type} (priority: ${message.priority})`)
  }

  /**
   * Register a handler for specific message types
   */
  registerHandler(messageType: string, handler: MessageHandler): void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, [])
    }
    this.handlers.get(messageType)!.push(handler)
    this.logger.debug(`Handler registered for: ${messageType}`)
  }

  /**
   * Get current system state
   */
  getSystemState(): SystemState {
    this.systemState.memoryUsage = process.memoryUsage()
    this.systemState.activeThreads = this.messageQueue.length
    return { ...this.systemState }
  }

  /**
   * Gracefully shutdown the microkernel
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down JASON Microkernel...')
    
    this.isRunning = false
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }
    
    // Process remaining high-priority messages
    await this.processRemainingMessages()
    
    // Cleanup resources
    await this.memoryManager.cleanup()
    await this.securityGuardian.cleanup()
    
    this.systemState.status = 'shutdown'
    this.logger.info('JASON Microkernel shutdown complete')
    this.emit('system:shutdown')
  }

  private startMessageProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processMessageQueue()
    }, 10) // Process every 10ms for low latency
  }

  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return

    const message = this.messageQueue.shift()!
    const handlers = this.handlers.get(message.type) || []

    if (handlers.length === 0) {
      this.logger.warn(`No handlers for message type: ${message.type}`)
      return
    }

    try {
      this.systemState.activeThreads++
      
      // Execute all handlers in parallel for this message type
      await Promise.all(
        handlers.map(handler => 
          this.executeHandler(handler, message)
        )
      )
      
      this.emit('message:processed', message)
      
    } catch (error) {
      this.logger.error(`Error processing message ${message.type}:`, error)
      this.emit('message:error', { message, error })
    } finally {
      this.systemState.activeThreads--
    }
  }

  private async executeHandler(handler: MessageHandler, message: PriorityMessage): Promise<void> {
    try {
      const startTime = Date.now()
      await handler(message)
      const duration = Date.now() - startTime
      
      this.logger.debug(`Handler executed for ${message.type} in ${duration}ms`)
      
    } catch (error) {
      this.logger.error(`Handler execution failed for ${message.type}:`, error)
      throw error
    }
  }

  private registerCoreHandlers(): void {
    // System control handlers
    this.registerHandler('system:killswitch', this.handleKillSwitch.bind(this))
    this.registerHandler('system:restart', this.handleRestart.bind(this))
    this.registerHandler('system:status', this.handleStatusRequest.bind(this))
    
    // Task execution handlers
    this.registerHandler('task:execute', this.handleTaskExecution.bind(this))
    this.registerHandler('task:cancel', this.handleTaskCancellation.bind(this))
    
    // AI learning handlers
    this.registerHandler('ai:learn', this.handleLearning.bind(this))
    this.registerHandler('ai:correct', this.handleSelfCorrection.bind(this))
  }

  private async handleKillSwitch(message: PriorityMessage): Promise<void> {
    this.logger.warn('KILL SWITCH ACTIVATED - Immediate shutdown initiated')
    await this.shutdown()
    process.exit(0)
  }

  private async handleRestart(message: PriorityMessage): Promise<void> {
    this.logger.info('System restart requested')
    await this.shutdown()
    // In production, this would trigger a supervised restart
    process.exit(1)
  }

  private async handleStatusRequest(message: PriorityMessage): Promise<void> {
    const status = this.getSystemState()
    this.emit('system:status', status)
  }

  private async handleTaskExecution(message: PriorityMessage): Promise<void> {
    this.logger.info(`Executing task: ${message.data.taskId}`)
    // Task execution will be handled by specialized services
  }

  private async handleTaskCancellation(message: PriorityMessage): Promise<void> {
    this.logger.info(`Cancelling task: ${message.data.taskId}`)
    // Task cancellation logic
  }

  private async handleLearning(message: PriorityMessage): Promise<void> {
    this.logger.debug('Learning event triggered')
    // Learning system integration
  }

  private async handleSelfCorrection(message: PriorityMessage): Promise<void> {
    this.logger.debug('Self-correction triggered')
    // SCRL integration
  }

  private async processRemainingMessages(): Promise<void> {
    // Process only high priority messages during shutdown
    const highPriorityMessages = this.messageQueue.filter(m => m.priority >= 8)
    this.messageQueue = this.messageQueue.filter(m => m.priority < 8)
    
    for (const message of highPriorityMessages) {
      await this.processMessageQueue()
    }
  }
}

import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import { UniversalAppController } from '../services/universal/UniversalAppController'
import { GhostHandManager } from '../services/automation/GhostHandManager'
import { LocalAlexaPipeline } from '../services/voice/LocalAlexaPipeline'
import { AppConnectorPack } from '../services/connectors/AppConnectorPack'
import { SuperCreatorEngine } from '../services/content/SuperCreatorEngine'
import { DigitalConcierge } from '../services/concierge/DigitalConcierge'
import { compilePlan, executePlan, Plan } from '../services/planner/HTNPlanner'

export interface TestResult {
  suite: string
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  details?: any
}

export interface TestSuite {
  name: string
  description: string
  tests: TestCase[]
}

export interface TestCase {
  name: string
  description: string
  timeout: number
  setup?: () => Promise<void>
  run: () => Promise<TestResult>
  teardown?: () => Promise<void>
  dependencies?: string[]
  category: 'unit' | 'integration' | 'e2e' | 'performance'
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface TestReport {
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
    successRate: number
  }
  suites: TestSuite[]
  environment: TestEnvironment
  recommendations: string[]
}

export interface TestEnvironment {
  os: string
  nodeVersion: string
  platform: string
  arch: string
  memory: number
  cores: number
  timestamp: Date
}

export class JASONTestSuite extends EventEmitter {
  private suites: TestSuite[] = []
  private results: TestResult[] = []
  private workspace: string
  private environment: TestEnvironment
  private startTime: Date

  constructor() {
    super()
    this.workspace = path.join(os.tmpdir(), 'jason-tests')
    this.environment = this.captureEnvironment()
    this.startTime = new Date()
    this.initializeTestSuites()
  }

  private captureEnvironment(): TestEnvironment {
    return {
      os: os.type(),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memory: os.totalmem(),
      cores: os.cpus().length,
      timestamp: new Date()
    }
  }

  private initializeTestSuites(): void {
    // Universal App Controller Tests
    this.suites.push({
      name: 'UniversalAppController',
      description: 'Test universal app control with VLM integration',
      tests: [
        {
          name: 'Controller Initialization',
          description: 'Test that UniversalAppController initializes correctly',
          timeout: 5000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              const controller = new UniversalAppController()
              const isReady = controller.isReady()
              
              return {
                suite: 'UniversalAppController',
                name: 'Controller Initialization',
                status: isReady ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { isReady }
              }
            } catch (error) {
              return {
                suite: 'UniversalAppController',
                name: 'Controller Initialization',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'App Capabilities Loading',
          description: 'Test that app capabilities are loaded correctly',
          timeout: 10000,
          category: 'unit',
          priority: 'high',
          run: async () => {
            const startTime = Date.now()
            try {
              const controller = new UniversalAppController()
              const capabilities = controller.getAppCapabilities()
              
              const hasRequiredApps = ['gmail', 'chrome', 'vscode', 'notion'].some(app => 
                Object.keys(capabilities).includes(app)
              )
              
              return {
                suite: 'UniversalAppController',
                name: 'App Capabilities Loading',
                status: hasRequiredApps ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { 
                  appCount: Object.keys(capabilities).length,
                  apps: Object.keys(capabilities)
                }
              }
            } catch (error) {
              return {
                suite: 'UniversalAppController',
                name: 'App Capabilities Loading',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Command Execution',
          description: 'Test universal command execution',
          timeout: 15000,
          category: 'integration',
          priority: 'high',
          run: async () => {
            const startTime = Date.now()
            try {
              const controller = new UniversalAppController()
              
              // Test a safe system command
              const result = await controller.executeUniversalCommand({
                id: 'test_system_info',
                intent: 'Get system information',
                app: 'system',
                action: 'get_info',
                parameters: {},
                priority: 'low',
                permissions: ['system'],
                execution: { type: 'system', confidence: 0.9 }
              })
              
              const success = result.success && result.result
              
              return {
                suite: 'UniversalAppController',
                name: 'Command Execution',
                status: success ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { success, result: result.result }
              }
            } catch (error) {
              return {
                suite: 'UniversalAppController',
                name: 'Command Execution',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // Ghost Hand Manager Tests
    this.suites.push({
      name: 'GhostHandManager',
      description: 'Test Ghost Hand execution system',
      tests: [
        {
          name: 'Workspace Initialization',
          description: 'Test that Ghost Hand workspace is initialized',
          timeout: 5000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              const ghostHand = new GhostHandManager()
              await ghostHand.initializeWorkspace()
              
              const workspaceExists = await fs.access(ghostHand.getWorkspace()).then(() => true).catch(() => false)
              
              return {
                suite: 'GhostHandManager',
                name: 'Workspace Initialization',
                status: workspaceExists ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { workspace: ghostHand.getWorkspace() }
              }
            } catch (error) {
              return {
                suite: 'GhostHandManager',
                name: 'Workspace Initialization',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Humanization Settings',
          description: 'Test jitter and humanization settings',
          timeout: 3000,
          category: 'unit',
          priority: 'medium',
          run: async () => {
            const startTime = Date.now()
            try {
              const ghostHand = new GhostHandManager()
              
              // Test humanization configuration
              ghostHand.setHumanization({
                jitter: true,
                randomDelays: true,
                mouseSpeed: 'human',
                typingPattern: 'human'
              })
              
              const settings = ghostHand.getHumanizationSettings()
              
              return {
                suite: 'GhostHandManager',
                name: 'Humanization Settings',
                status: settings.jitter ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { settings }
              }
            } catch (error) {
              return {
                suite: 'GhostHandManager',
                name: 'Humanization Settings',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // Local Alexa Pipeline Tests
    this.suites.push({
      name: 'LocalAlexaPipeline',
      description: 'Test local voice processing pipeline',
      tests: [
        {
          name: 'Pipeline Initialization',
          description: 'Test that LocalAlexaPipeline initializes correctly',
          timeout: 10000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              const pipeline = new LocalAlexaPipeline()
              await pipeline.initialize()
              
              const isReady = pipeline.isReady()
              
              return {
                suite: 'LocalAlexaPipeline',
                name: 'Pipeline Initialization',
                status: isReady ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { isReady }
              }
            } catch (error) {
              return {
                suite: 'LocalAlexaPipeline',
                name: 'Pipeline Initialization',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Intent Recognition',
          description: 'Test intent recognition from text',
          timeout: 5000,
          category: 'integration',
          priority: 'high',
          run: async () => {
            const startTime = Date.now()
            try {
              const pipeline = new LocalAlexaPipeline()
              await pipeline.initialize()
              
              const testInput = "Book a flight to New York for tomorrow"
              const intent = await pipeline.parseIntent(testInput)
              
              const hasIntent = intent && intent.action
              
              return {
                suite: 'LocalAlexaPipeline',
                name: 'Intent Recognition',
                status: hasIntent ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { input: testInput, intent }
              }
            } catch (error) {
              return {
                suite: 'LocalAlexaPipeline',
                name: 'Intent Recognition',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // App Connector Pack Tests
    this.suites.push({
      name: 'AppConnectorPack',
      description: 'Test app connector pack functionality',
      tests: [
        {
          name: 'Connector Initialization',
          description: 'Test that all connectors initialize',
          timeout: 5000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              const connectors = new AppConnectorPack()
              await connectors.initialize()
              
              const connectorList = connectors.getAvailableConnectors()
              const hasConnectors = connectorList.length > 0
              
              return {
                suite: 'AppConnectorPack',
                name: 'Connector Initialization',
                status: hasConnectors ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { connectorCount: connectorList.length, connectors: connectorList }
              }
            } catch (error) {
              return {
                suite: 'AppConnectorPack',
                name: 'Connector Initialization',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Rate Limiting',
          description: 'Test rate limiting functionality',
          timeout: 3000,
          category: 'unit',
          priority: 'medium',
          run: async () => {
            const startTime = Date.now()
            try {
              const connectors = new AppConnectorPack()
              await connectors.initialize()
              
              // Test rate limiting
              const canExecute = await connectors.checkRateLimit('gmail')
              
              return {
                suite: 'AppConnectorPack',
                name: 'Rate Limiting',
                status: canExecute ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { canExecute }
              }
            } catch (error) {
              return {
                suite: 'AppConnectorPack',
                name: 'Rate Limiting',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // Super Creator Engine Tests
    this.suites.push({
      name: 'SuperCreatorEngine',
      description: 'Test content generation engine',
      tests: [
        {
          name: 'Engine Initialization',
          description: 'Test that SuperCreatorEngine initializes',
          timeout: 10000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              const engine = new SuperCreatorEngine()
              const isReady = engine.isReady()
              
              return {
                suite: 'SuperCreatorEngine',
                name: 'Engine Initialization',
                status: isReady ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { isReady }
              }
            } catch (error) {
              return {
                suite: 'SuperCreatorEngine',
                name: 'Engine Initialization',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Template Loading',
          description: 'Test that content templates are loaded',
          timeout: 5000,
          category: 'unit',
          priority: 'high',
          run: async () => {
            const startTime = Date.now()
            try {
              const engine = new SuperCreatorEngine()
              const templates = engine.getTemplates()
              
              const hasTemplates = templates.length > 0
              const hasBusinessTemplate = templates.some(t => t.id === 'business-report')
              
              return {
                suite: 'SuperCreatorEngine',
                name: 'Template Loading',
                status: hasTemplates && hasBusinessTemplate ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { 
                  templateCount: templates.length,
                  templates: templates.map(t => t.id)
                }
              }
            } catch (error) {
              return {
                suite: 'SuperCreatorEngine',
                name: 'Template Loading',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // Digital Concierge Tests
    this.suites.push({
      name: 'DigitalConcierge',
      description: 'Test digital concierge functionality',
      tests: [
        {
          name: 'Concierge Initialization',
          description: 'Test that DigitalConcierge initializes',
          timeout: 5000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              // Mock dependencies for testing
              const mockConnectors = {} as AppConnectorPack
              const mockEngine = {} as SuperCreatorEngine
              
              const concierge = new DigitalConcierge(mockConnectors, mockEngine)
              const isReady = concierge.isReady()
              
              return {
                suite: 'DigitalConcierge',
                name: 'Concierge Initialization',
                status: isReady ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { isReady }
              }
            } catch (error) {
              return {
                suite: 'DigitalConcierge',
                name: 'Concierge Initialization',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // HTN Planner Tests
    this.suites.push({
      name: 'HTNPlanner',
      description: 'Test hierarchical task network planner',
      tests: [
        {
          name: 'Plan Compilation',
          description: 'Test that plans compile correctly',
          timeout: 5000,
          category: 'unit',
          priority: 'critical',
          run: async () => {
            const startTime = Date.now()
            try {
              const goal = "Plan a business trip to New York"
              const context = { 
                destination: 'NYC', 
                duration: 3, 
                passengers: 1 
              }
              
              const plan = compilePlan(goal, context)
              
              const hasTasks = plan.tasks.length > 0
              const hasGoal = plan.goal === goal
              
              return {
                suite: 'HTNPlanner',
                name: 'Plan Compilation',
                status: hasTasks && hasGoal ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { 
                  taskCount: plan.tasks.length,
                  goal: plan.goal,
                  tasks: plan.tasks.map(t => t.name)
                }
              }
            } catch (error) {
              return {
                suite: 'HTNPlanner',
                name: 'Plan Compilation',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // Integration Tests
    this.suites.push({
      name: 'Integration',
      description: 'End-to-end integration tests',
      tests: [
        {
          name: 'Voice to Plan Flow',
          description: 'Test complete flow from voice input to plan execution',
          timeout: 30000,
          category: 'e2e',
          priority: 'high',
          dependencies: ['LocalAlexaPipeline', 'HTNPlanner'],
          run: async () => {
            const startTime = Date.now()
            try {
              // Initialize components
              const pipeline = new LocalAlexaPipeline()
              await pipeline.initialize()
              
              // Test voice input to plan
              const voiceInput = "I need to book a flight to San Francisco for next week"
              const intent = await pipeline.parseIntent(voiceInput)
              
              const goal = `Book travel to ${intent.entities?.destination || 'San Francisco'}`
              const plan = compilePlan(goal, intent.entities)
              
              const success = intent.action && plan.tasks.length > 0
              
              return {
                suite: 'Integration',
                name: 'Voice to Plan Flow',
                status: success ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { 
                  input: voiceInput,
                  intent,
                  taskCount: plan.tasks.length
                }
              }
            } catch (error) {
              return {
                suite: 'Integration',
                name: 'Voice to Plan Flow',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Content Generation Flow',
          description: 'Test content generation from request to output',
          timeout: 20000,
          category: 'e2e',
          priority: 'medium',
          dependencies: ['SuperCreatorEngine'],
          run: async () => {
            const startTime = Date.now()
            try {
              const engine = new SuperCreatorEngine()
              
              // Test content generation (without actual model execution)
              const templates = engine.getTemplates()
              const hasTemplates = templates.length > 0
              
              // Test template structure
              const businessTemplate = templates.find(t => t.id === 'business-report')
              const templateValid = businessTemplate && 
                businessTemplate.sections.length > 0 && 
                businessTemplate.variables.length > 0
              
              return {
                suite: 'Integration',
                name: 'Content Generation Flow',
                status: hasTemplates && templateValid ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { 
                  templateCount: templates.length,
                  hasBusinessTemplate: !!businessTemplate,
                  templateValid
                }
              }
            } catch (error) {
              return {
                suite: 'Integration',
                name: 'Content Generation Flow',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })

    // Performance Tests
    this.suites.push({
      name: 'Performance',
      description: 'Performance and load tests',
      tests: [
        {
          name: 'Component Initialization Time',
          description: 'Test that components initialize within acceptable time limits',
          timeout: 15000,
          category: 'performance',
          priority: 'medium',
          run: async () => {
            const startTime = Date.now()
            try {
              const initTimes: Record<string, number> = {}
              
              // Test UniversalAppController initialization
              const controllerStart = Date.now()
              const controller = new UniversalAppController()
              initTimes.UniversalAppController = Date.now() - controllerStart
              
              // Test GhostHandManager initialization
              const ghostStart = Date.now()
              const ghostHand = new GhostHandManager()
              initTimes.GhostHandManager = Date.now() - ghostStart
              
              // Test SuperCreatorEngine initialization
              const engineStart = Date.now()
              const engine = new SuperCreatorEngine()
              initTimes.SuperCreatorEngine = Date.now() - engineStart
              
              // Check if all components initialize within 5 seconds
              const allFast = Object.values(initTimes).every(time => time < 5000)
              
              return {
                suite: 'Performance',
                name: 'Component Initialization Time',
                status: allFast ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { initTimes, allFast }
              }
            } catch (error) {
              return {
                suite: 'Performance',
                name: 'Component Initialization Time',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        },
        {
          name: 'Memory Usage',
          description: 'Test memory usage during operations',
          timeout: 10000,
          category: 'performance',
          priority: 'low',
          run: async () => {
            const startTime = Date.now()
            try {
              const initialMemory = process.memoryUsage()
              
              // Create multiple instances to test memory usage
              const components = []
              for (let i = 0; i < 5; i++) {
                components.push(new UniversalAppController())
                components.push(new SuperCreatorEngine())
              }
              
              const finalMemory = process.memoryUsage()
              const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
              const memoryIncreaseMB = memoryIncrease / 1024 / 1024
              
              // Check if memory increase is reasonable (< 100MB)
              const memoryOk = memoryIncreaseMB < 100
              
              return {
                suite: 'Performance',
                name: 'Memory Usage',
                status: memoryOk ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                details: { 
                  memoryIncreaseMB: memoryIncreaseMB.toFixed(2),
                  initialMemory: initialMemory.heapUsed / 1024 / 1024,
                  finalMemory: finalMemory.heapUsed / 1024 / 1024
                }
              }
            } catch (error) {
              return {
                suite: 'Performance',
                name: 'Memory Usage',
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }
        }
      ]
    })
  }

  async runAllTests(options: {
    parallel?: boolean
    categories?: string[]
    priorities?: string[]
    timeout?: number
  } = {}): Promise<TestReport> {
    this.emit('test_run_started', { suites: this.suites.length })
    
    const results: TestResult[] = []
    let totalDuration = 0

    for (const suite of this.suites) {
      this.emit('suite_started', { suite: suite.name })
      
      const suiteResults = await this.runTestSuite(suite, options)
      results.push(...suiteResults)
      
      this.emit('suite_completed', { 
        suite: suite.name, 
        results: suiteResults.length,
        passed: suiteResults.filter(r => r.status === 'passed').length,
        failed: suiteResults.filter(r => r.status === 'failed').length
      })
    }

    const report = this.generateReport(results)
    this.emit('test_run_completed', report)
    
    return report
  }

  private async runTestSuite(suite: TestSuite, options: any): Promise<TestResult[]> {
    const results: TestResult[] = []
    
    for (const test of suite.tests) {
      // Skip tests based on filters
      if (options.categories && !options.categories.includes(test.category)) {
        results.push({
          suite: suite.name,
          name: test.name,
          status: 'skipped',
          duration: 0
        })
        continue
      }
      
      if (options.priorities && !options.priorities.includes(test.priority)) {
        results.push({
          suite: suite.name,
          name: test.name,
          status: 'skipped',
          duration: 0
        })
        continue
      }

      try {
        // Run setup if provided
        if (test.setup) {
          await test.setup()
        }

        // Run the test with timeout
        const result = await this.runTestWithTimeout(test, options.timeout || test.timeout)
        results.push(result)

        // Run teardown if provided
        if (test.teardown) {
          await test.teardown()
        }
      } catch (error) {
        results.push({
          suite: suite.name,
          name: test.name,
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  private async runTestWithTimeout(test: TestCase, timeout: number): Promise<TestResult> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          suite: 'unknown',
          name: test.name,
          status: 'failed',
          duration: timeout,
          error: `Test timed out after ${timeout}ms`
        })
      }, timeout)

      test.run()
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          resolve({
            suite: 'unknown',
            name: test.name,
            status: 'failed',
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        })
    })
  }

  private generateReport(results: TestResult[]): TestReport {
    const total = results.length
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const duration = Date.now() - this.startTime.getTime()
    const successRate = total > 0 ? (passed / total) * 100 : 0

    const recommendations = this.generateRecommendations(results)

    return {
      summary: {
        total,
        passed,
        failed,
        skipped,
        duration,
        successRate
      },
      suites: this.groupResultsBySuite(results),
      environment: this.environment,
      recommendations
    }
  }

  private groupResultsBySuite(results: TestResult[]): TestSuite[] {
    const suiteMap = new Map<string, TestResult[]>()
    
    results.forEach(result => {
      if (!suiteMap.has(result.suite)) {
        suiteMap.set(result.suite, [])
      }
      suiteMap.get(result.suite)!.push(result)
    })

    return Array.from(suiteMap.entries()).map(([suiteName, suiteResults]) => ({
      name: suiteName,
      description: this.suites.find(s => s.name === suiteName)?.description || '',
      tests: suiteResults.map(r => ({
        name: r.name,
        description: '',
        timeout: 0,
        run: async () => r,
        category: 'unit' as const,
        priority: 'medium' as const
      }))
    }))
  }

  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = []
    
    const failedTests = results.filter(r => r.status === 'failed')
    const slowTests = results.filter(r => r.duration > 5000)
    
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} tests failed. Review error messages and fix critical issues.`)
    }
    
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests were slow (>5s). Consider optimizing performance.`)
    }
    
    const successRate = (results.filter(r => r.status === 'passed').length / results.length) * 100
    if (successRate < 80) {
      recommendations.push(`Success rate is ${successRate.toFixed(1)}%. Aim for >90% before production deployment.`)
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests passed! System is ready for production deployment.')
    }
    
    return recommendations
  }

  async saveReport(report: TestReport, filename?: string): Promise<string> {
    const reportName = filename || `jason-test-report-${Date.now()}.json`
    const reportPath = path.join(this.workspace, reportName)
    
    await fs.mkdir(this.workspace, { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    return reportPath
  }

  getSuites(): TestSuite[] {
    return this.suites
  }

  getEnvironment(): TestEnvironment {
    return this.environment
  }
}

export default JASONTestSuite

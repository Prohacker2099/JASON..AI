import { Router } from 'express'
import { UniversalGhostHand, UniversalAction } from '../services/automation/UniversalGhostHand'
import { z } from 'zod'
import { permissionManager } from '../services/trust/PermissionManager'

const router = Router()
// ...
// GET /api/ghost/task/:taskId - Get task status
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    const task = await ghostHand.getTask(taskId)

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    // Hydrate prompt if waiting
    let interactionPrompt = null
    if (task.status === 'waiting_for_user' && task.waitingForPromptId) {
      const pending = permissionManager.listPending()
      interactionPrompt = pending.find(p => p.id === task.waitingForPromptId)
    }

    res.json({
      success: true,
      task,
      interactionPrompt
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get task'
    })
  }
})

// POST /api/ghost/generic-task
router.post('/generic-task', async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt) throw new Error("Prompt is required")
    const taskId = await ghostHand.executeGenericTask(prompt)
    res.json({ success: true, taskId })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Initialize Universal Ghost Hand
const ghostHand = new UniversalGhostHand({
  maxConcurrentTasks: 10,
  enableRecording: true,
  enableScreenshots: true,
  enableStealth: true,
  permissions: {
    web: true,
    system: true,
    file: true,
    network: true,
    api: true,
    ui: true
  },
  security: {
    allowExternalCommands: process.env.GHOST_ALLOW_EXTERNAL_COMMANDS === 'true',
    allowFileAccess: process.env.GHOST_ALLOW_FILE_ACCESS === 'true',
    allowNetworkAccess: process.env.GHOST_ALLOW_NETWORK_ACCESS !== 'false',
    sandboxMode: process.env.GHOST_SANDBOX_MODE !== 'false',
    allowedDomains: (process.env.GHOST_ALLOWED_DOMAINS || 'localhost,127.0.0.1')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    blockedDomains: []
  }
})

// Initialize on startup
ghostHand.initialize()

// Request validation schemas
const WebAutomationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  actions: z.array(z.object({
    id: z.string(),
    type: z.enum(['web', 'system', 'file', 'network', 'api', 'ui', 'automation', 'ai', 'interact']),
    category: z.enum(['browse', 'scrape', 'fill', 'click', 'type', 'extract', 'download', 'upload', 'script', 'command', 'monitor', 'schedule', 'read', 'write', 'remove', 'list', 'ask', 'analyze_screen', 'vision']),
    url: z.string().optional(),
    selector: z.string().optional(),
    value: z.any().optional(),
    command: z.string().optional(),
    script: z.string().optional(),
    apiEndpoint: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    headers: z.record(z.string(), z.any()).optional(),
    data: z.any().optional(),
    timeout: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }))
})

const WebScrapingSchema = z.object({
  url: z.string().url(),
  selectors: z.record(z.string(), z.string()),
  selectorCount: z.any().optional()
})

const FormFillSchema = z.object({
  url: z.string().url(),
  formData: z.record(z.string(), z.any()),
  submitSelector: z.string().optional(),
  fieldCount: z.any().optional()
})

const SystemCommandSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  commands: z.array(z.string())
})

const FileOperationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  operations: z.array(z.object({
    category: z.enum(['read', 'write', 'remove', 'delete', 'list']),
    filepath: z.string(),
    value: z.any().optional()
  }))
})

const MonitoringSchema = z.object({
  urls: z.array(z.string().url()),
  checks: z.array(z.object({
    selector: z.string(),
    expected: z.any(),
    type: z.string()
  }))
})

// POST /api/ghost/web-automation - Custom web automation
router.post('/web-automation', async (req, res) => {
  try {
    const { name, description, actions } = WebAutomationSchema.parse(req.body)

    const taskId = await ghostHand.createWebAutomationTask(name, description, actions)

    res.json({
      success: true,
      taskId,
      message: 'Web automation task created',
      name,
      description
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid web automation request'
    })
  }
})

// POST /api/ghost/web-scraping - Web scraping
router.post('/web-scraping', async (req, res) => {
  try {
    const { url, selectors } = WebScrapingSchema.parse(req.body)

    const taskId = await ghostHand.createWebScrapingTask(url, selectors)

    res.json({
      success: true,
      taskId,
      message: 'Web scraping task created',
      url,
      selectorCount: Object.keys(selectors).length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid web scraping request'
    })
  }
})

// POST /api/ghost/form-fill - Form filling
router.post('/form-fill', async (req, res) => {
  try {
    const { url, formData, submitSelector } = FormFillSchema.parse(req.body)

    const taskId = await ghostHand.createFormFillTask(url, formData, submitSelector)

    res.json({
      success: true,
      taskId,
      message: 'Form fill task created',
      url,
      fieldCount: Object.keys(formData).length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid form fill request'
    })
  }
})

// POST /api/ghost/system-commands - System automation
router.post('/system-commands', async (req, res) => {
  try {
    const { name, description, commands } = SystemCommandSchema.parse(req.body)

    const taskId = await ghostHand.createSystemAutomationTask(name, description, commands)

    res.json({
      success: true,
      taskId,
      message: 'System automation task created',
      name,
      commandCount: commands.length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid system command request'
    })
  }
})

// POST /api/ghost/file-operations - File automation
router.post('/file-operations', async (req, res) => {
  try {
    const { name, description, operations } = FileOperationSchema.parse(req.body)

    const normalized = operations.map((op: any) => ({
      ...op,
      category: op.category === 'delete' ? 'remove' : op.category,
    }))

    const taskId = await ghostHand.createFileAutomationTask(name, description, normalized)

    res.json({
      success: true,
      taskId,
      message: 'File operation task created',
      name,
      operationCount: operations.length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid file operation request'
    })
  }
})

// POST /api/ghost/monitoring - Website monitoring
router.post('/monitoring', async (req, res) => {
  try {
    const { urls, checks } = MonitoringSchema.parse(req.body)

    const taskId = await ghostHand.createMonitoringTask(urls, checks)

    res.json({
      success: true,
      taskId,
      message: 'Monitoring task created',
      urlCount: urls.length,
      checkCount: checks.length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid monitoring request'
    })
  }
})

// POST /api/ghost/screenshot - Take screenshot
router.post('/screenshot', async (req, res) => {
  try {
    const { url, options } = z.object({
      url: z.string().url(),
      options: z.object({
        fullPage: z.boolean().optional(),
        quality: z.number().optional(),
        format: z.enum(['png', 'jpeg']).optional()
      }).optional()
    }).parse(req.body)

    const taskId = await ghostHand.createScreenshotTask(url, options)

    res.json({
      success: true,
      taskId,
      message: 'Screenshot task created',
      url
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid screenshot request'
    })
  }
})

// POST /api/ghost/download - File download
router.post('/download', async (req, res) => {
  try {
    const { url, downloadPath } = z.object({
      url: z.string().url(),
      downloadPath: z.string().optional()
    }).parse(req.body)

    const taskId = await ghostHand.createDownloadTask(url, downloadPath)

    res.json({
      success: true,
      taskId,
      message: 'Download task created',
      url
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid download request'
    })
  }
})

// POST /api/ghost/data-extraction - Advanced data extraction
router.post('/data-extraction', async (req, res) => {
  try {
    const { url, extractionPlan } = z.object({
      url: z.string().url(),
      extractionPlan: z.object({
        description: z.string(),
        steps: z.array(z.object({
          category: z.string().optional(),
          selector: z.string(),
          value: z.any().optional(),
          timeout: z.number().optional(),
          metadata: z.record(z.string(), z.any()).optional()
        }))
      })
    }).parse(req.body)

    const taskId = await ghostHand.createDataExtractionTask(url, extractionPlan)

    res.json({
      success: true,
      taskId,
      message: 'Data extraction task created',
      url,
      stepCount: extractionPlan.steps.length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid data extraction request'
    })
  }
})

// POST /api/ghost/workflow - Multi-step workflow
router.post('/workflow', async (req, res) => {
  try {
    const workflow = z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      steps: z.array(z.object({
        type: z.enum(['web', 'system', 'file', 'network', 'api', 'ui', 'automation', 'ai', 'interact']),
        category: z.string(),
        target: z.string().optional(),
        selector: z.string().optional(),
        value: z.any().optional(),
        url: z.string().optional(),
        command: z.string().optional(),
        script: z.string().optional(),
        apiEndpoint: z.string().optional(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
        headers: z.record(z.string(), z.any()).optional(),
        data: z.any().optional(),
        timeout: z.number().optional(),
        retries: z.number().optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        metadata: z.record(z.string(), z.any()).optional()
      }))
    }).parse(req.body)

    const taskId = await ghostHand.createMultiStepWorkflow(workflow)

    res.json({
      success: true,
      taskId,
      message: 'Workflow task created',
      name: workflow.name,
      stepCount: workflow.steps.length
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid workflow request'
    })
  }
})

// GET /api/ghost/task/:taskId - Get task status
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    const task = await ghostHand.getTask(taskId)

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    res.json({
      success: true,
      task
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get task'
    })
  }
})

// GET /api/ghost/tasks - Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await ghostHand.getAllTasks()

    res.json({
      success: true,
      tasks,
      total: tasks.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tasks'
    })
  }
})

// GET /api/ghost/tasks/active - Get active tasks
router.get('/tasks/active', async (req, res) => {
  try {
    const tasks = await ghostHand.getActiveTasks()

    res.json({
      success: true,
      tasks,
      active: tasks.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get active tasks'
    })
  }
})

// POST /api/ghost/task/:taskId/cancel - Cancel task
router.post('/task/:taskId/cancel', async (req, res) => {
  try {
    const { taskId } = req.params
    const success = await ghostHand.cancelTask(taskId)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or cannot be cancelled'
      })
    }

    res.json({
      success: true,
      message: 'Task cancelled successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel task'
    })
  }
})

// POST /api/ghost/task/:taskId/pause - Pause task
router.post('/task/:taskId/pause', async (req, res) => {
  try {
    const { taskId } = req.params
    const success = await ghostHand.pauseTask(taskId)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or cannot be paused'
      })
    }

    res.json({
      success: true,
      message: 'Task paused successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause task'
    })
  }
})

// POST /api/ghost/task/:taskId/resume - Resume task
router.post('/task/:taskId/resume', async (req, res) => {
  try {
    const { taskId } = req.params
    const success = await ghostHand.resumeTask(taskId)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or cannot be resumed'
      })
    }

    res.json({
      success: true,
      message: 'Task resumed successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume task'
    })
  }
})

// POST /api/ghost/task/:taskId/interact - Submit interaction response
router.post('/task/:taskId/interact', async (req, res) => {
  try {
    const { taskId } = req.params
    const { response } = req.body

    // Check if task is waiting
    const task = await ghostHand.getTask(taskId)
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' })

    if (task.status !== 'waiting_for_user') {
      return res.status(400).json({ success: false, error: 'Task is not waiting for user input' })
    }

    const success = await ghostHand.resumeInteractionTask(taskId, response)

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to resume interaction task'
      })
    }

    res.json({
      success: true,
      message: 'Interaction submitted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit interaction'
    })
  }
})

// GET /api/ghost/statistics - Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = ghostHand.getStatistics()

    res.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    })
  }
})

// POST /api/ghost/shutdown - Shutdown Ghost Hand
router.post('/shutdown', async (req, res) => {
  try {
    await ghostHand.shutdown()

    res.json({
      success: true,
      message: 'Ghost Hand shutdown successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to shutdown Ghost Hand'
    })
  }
})

export default router

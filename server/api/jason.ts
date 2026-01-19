import express from 'express'
import { JASONCore } from '../services/integration/JASONCore'
import { JASONTask, JASONCapability } from '../services/integration/JASONCore'

const router = express.Router()

// Global JASON instance
let jasonCore: JASONCore | null = null

// Initialize JASON core
async function initializeJASON(): Promise<JASONCore> {
  if (!jasonCore) {
    jasonCore = new JASONCore()
    await jasonCore.initialize()
  }
  return jasonCore
}

// Middleware to ensure JASON is initialized
router.use(async (req, res, next) => {
  try {
    if (!jasonCore) {
      await initializeJASON()
    }
    next()
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize JASON core' })
  }
})

// GET /api/jason/state - Get current JASON state
router.get('/state', async (req, res) => {
  try {
    const state = jasonCore!.getState()
    res.json(state)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get JASON state' })
  }
})

// GET /api/jason/capabilities - Get all capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = jasonCore!.getCapabilities()
    res.json(capabilities)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get capabilities' })
  }
})

// PATCH /api/jason/capabilities/:id - Toggle capability
router.patch('/capabilities/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' })
    }
    
    const success = enabled 
      ? jasonCore!.enableCapability(id)
      : jasonCore!.disableCapability(id)
    
    if (!success) {
      return res.status(404).json({ error: 'Capability not found' })
    }
    
    res.json({ success: true, enabled })
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle capability' })
  }
})

// GET /api/jason/tasks - Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = jasonCore!.getTasks()
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' })
  }
})

// GET /api/jason/tasks/:id - Get specific task
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const task = jasonCore!.getTask(id)
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    res.json(task)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get task' })
  }
})

// POST /api/jason/execute - Execute a task
router.post('/execute', async (req, res) => {
  try {
    const task = req.body as Omit<JASONTask, 'id' | 'createdAt' | 'progress'>
    
    // Validate task
    if (!task.type || !task.intent) {
      return res.status(400).json({ error: 'Task must have type and intent' })
    }
    
    if (!['voice', 'automation', 'content', 'search', 'planning', 'integration'].includes(task.type)) {
      return res.status(400).json({ error: 'Invalid task type' })
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(task.priority)) {
      return res.status(400).json({ error: 'Invalid priority' })
    }
    
    const result = await jasonCore!.executeTask(task)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute task' })
  }
})

// POST /api/jason/tasks/:id/cancel - Cancel a task
router.post('/tasks/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params
    const success = jasonCore!.cancelTask(id)
    
    if (!success) {
      return res.status(404).json({ error: 'Task not found or cannot be cancelled' })
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel task' })
  }
})

// GET /api/jason/events - Get event log
router.get('/events', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const events = jasonCore!.getEventLog(limit)
    res.json(events)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get events' })
  }
})

// GET /api/jason/config - Get current configuration
router.get('/config', async (req, res) => {
  try {
    const config = jasonCore!.getConfig()
    res.json(config)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get config' })
  }
})

// PATCH /api/jason/config - Update configuration
router.patch('/config', async (req, res) => {
  try {
    const configUpdates = req.body
    jasonCore!.updateConfig(configUpdates)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' })
  }
})

// POST /api/jason/voice/process - Process voice input
router.post('/voice/process', async (req, res) => {
  try {
    const { audioData } = req.body
    
    if (!audioData) {
      return res.status(400).json({ error: 'audioData is required' })
    }
    
    // In a real implementation, this would process actual audio data
    // For now, we'll simulate voice processing
    const result = await jasonCore!.processVoiceCommand(Buffer.from(audioData))
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to process voice command' })
  }
})

// POST /api/jason/content/generate - Generate content
router.post('/content/generate', async (req, res) => {
  try {
    const { templateId, variables } = req.body
    
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' })
    }
    
    const result = await jasonCore!.generateContent(templateId, variables || {})
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

// POST /api/jason/search - Perform global search
router.post('/search', async (req, res) => {
  try {
    const { query, type } = req.body
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' })
    }
    
    const result = await jasonCore!.searchGlobal(query, type)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform search' })
  }
})

// POST /api/jason/plan - Create and execute plan
router.post('/plan', async (req, res) => {
  try {
    const { goal, context } = req.body
    
    if (!goal) {
      return res.status(400).json({ error: 'goal is required' })
    }
    
    const result = await jasonCore!.planAndExecute(goal, context)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create/execute plan' })
  }
})

// GET /api/jason/health - Health check
router.get('/health', async (req, res) => {
  try {
    const state = jasonCore!.getState()
    const capabilities = jasonCore!.getCapabilities()
    
    const healthyCapabilities = capabilities.filter(c => c.health === 'healthy').length
    const totalCapabilities = capabilities.length
    
    const health = {
      status: state.status,
      isReady: jasonCore!.isReady(),
      capabilities: {
        total: totalCapabilities,
        healthy: healthyCapabilities,
        degraded: capabilities.filter(c => c.health === 'degraded').length,
        offline: capabilities.filter(c => c.health === 'offline').length
      },
      performance: state.performance,
      security: state.security,
      uptime: process.uptime()
    }
    
    res.json(health)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get health status' })
  }
})

// POST /api/jason/shutdown - Shutdown JASON
router.post('/shutdown', async (req, res) => {
  try {
    await jasonCore!.shutdown()
    jasonCore = null
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to shutdown JASON' })
  }
})

// WebSocket endpoint for real-time updates
export function setupJASONWebSocket(io: any) {
  io.on('connection', (socket: any) => {
    console.log('JASON control panel connected')
    
    // Send initial state
    if (jasonCore) {
      socket.emit('state_update', jasonCore.getState())
      socket.emit('capabilities_update', jasonCore.getCapabilities())
      socket.emit('tasks_update', jasonCore.getTasks())
      socket.emit('events_update', jasonCore.getEventLog(50))
    }
    
    // Handle state requests
    socket.on('get_state', () => {
      if (jasonCore) {
        socket.emit('state_update', jasonCore.getState())
      }
    })
    
    // Handle capability requests
    socket.on('get_capabilities', () => {
      if (jasonCore) {
        socket.emit('capabilities_update', jasonCore.getCapabilities())
      }
    })
    
    // Handle task requests
    socket.on('get_tasks', () => {
      if (jasonCore) {
        socket.emit('tasks_update', jasonCore.getTasks())
      }
    })
    
    // Handle event requests
    socket.on('get_events', () => {
      if (jasonCore) {
        socket.emit('events_update', jasonCore.getEventLog(50))
      }
    })
    
    // Handle task execution
    socket.on('execute_task', async (task: Omit<JASONTask, 'id' | 'createdAt' | 'progress'>) => {
      try {
        if (jasonCore) {
          const result = await jasonCore.executeTask(task)
          socket.emit('task_result', result)
        }
      } catch (error) {
        socket.emit('task_error', { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })
    
    socket.on('disconnect', () => {
      console.log('JASON control panel disconnected')
    })
  })
  
  // Listen for JASON events and broadcast to clients
  if (jasonCore) {
    jasonCore.on('event', (event) => {
      io.emit('jason_event', event)
    })
    
    jasonCore.on('task_completed', (task) => {
      io.emit('task_update', task)
    })
    
    jasonCore.on('capability_changed', (change) => {
      io.emit('capability_update', change)
    })
    
    jasonCore.on('config_updated', (config) => {
      io.emit('config_update', config)
    })
  }
}

export default router

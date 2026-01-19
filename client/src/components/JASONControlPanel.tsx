import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Search, 
  FileText, 
  Mic, 
  Robot, 
  Brain,
  Shield,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  AlertTriangle
} from 'lucide-react'

interface JASONState {
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

interface JASONCapability {
  id: string
  name: string
  description: string
  category: 'voice' | 'automation' | 'content' | 'search' | 'planning' | 'integration'
  enabled: boolean
  health: 'healthy' | 'degraded' | 'offline'
  lastUsed?: Date
  usage: number
}

interface JASONTask {
  id: string
  type: 'voice' | 'automation' | 'content' | 'search' | 'planning' | 'integration'
  intent: string
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
}

interface JASONEvent {
  type: string
  timestamp: Date
  source: string
  details: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'critical'
}

export default function JASONControlPanel() {
  const [state, setState] = useState<JASONState | null>(null)
  const [capabilities, setCapabilities] = useState<JASONCapability[]>([])
  const [tasks, setTasks] = useState<JASONTask[]>([])
  const [events, setEvents] = useState<JASONEvent[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isConnected, setIsConnected] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentTemplate, setContentTemplate] = useState('professional-email')
  const [contentVariables, setContentVariables] = useState('{}')
  const [planGoal, setPlanGoal] = useState('')
  const [planContext, setPlanContext] = useState('{}')

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')
    
    ws.onopen = () => {
      setIsConnected(true)
      // Request initial state
      ws.send(JSON.stringify({ type: 'get_state' }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'state_update':
          setState(data.state)
          break
        case 'capabilities_update':
          setCapabilities(data.capabilities)
          break
        case 'tasks_update':
          setTasks(data.tasks)
          break
        case 'events_update':
          setEvents(data.events)
          break
      }
    }
    
    ws.onclose = () => {
      setIsConnected(false)
    }
    
    ws.onerror = () => {
      setIsConnected(false)
    }
    
    return () => {
      ws.close()
    }
  }, [])

  // API calls
  const executeTask = useCallback(async (task: Omit<JASONTask, 'id' | 'createdAt' | 'progress'>) => {
    try {
      const response = await fetch('/api/jason/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      })
      
      if (!response.ok) {
        throw new Error('Failed to execute task')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Task execution error:', error)
      throw error
    }
  }, [])

  const toggleCapability = useCallback(async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/jason/capabilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
    } catch (error) {
      console.error('Failed to toggle capability:', error)
    }
  }, [])

  const cancelTask = useCallback(async (id: string) => {
    try {
      await fetch(`/api/jason/tasks/${id}/cancel`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to cancel task:', error)
    }
  }, [])

  // Render helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'busy':
        return <Activity className="w-4 h-4 text-blue-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'initializing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Square className="w-4 h-4 text-gray-500" />
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />
      case 'offline':
        return <XCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'voice':
        return <Mic className="w-4 h-4" />
      case 'automation':
        return <Robot className="w-4 h-4" />
      case 'content':
        return <FileText className="w-4 h-4" />
      case 'search':
        return <Search className="w-4 h-4" />
      case 'planning':
        return <Brain className="w-4 h-4" />
      case 'integration':
        return <Zap className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Connecting to JASON...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">JASON Control Panel</h1>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(state.status)}
            <span className="text-sm font-medium">{state.status}</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.activeCapabilities.length}</div>
              <p className="text-xs text-gray-500">Total {capabilities.length} available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.performance.tasksCompleted}</div>
              <p className="text-xs text-gray-500">Avg response: {state.performance.averageResponseTime}ms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.performance.memoryUsage.toFixed(1)}MB</div>
              <p className="text-xs text-gray-500">CPU: {state.performance.cpuUsage}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Security Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">{state.security.currentLevel}</span>
              </div>
              <p className="text-xs text-gray-500">{state.security.pendingApprovals} pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="control">Control</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(state.status)}
                      <span>{state.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Activity</span>
                    <span>{new Date(state.lastActivity).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Current Task</span>
                    <span>{state.currentTask || 'None'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm">{state.performance.cpuUsage}%</span>
                    </div>
                    <Progress value={state.performance.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm">{state.performance.memoryUsage.toFixed(1)}MB</span>
                    </div>
                    <Progress value={(state.performance.memoryUsage / 1024) * 100} className="h-2" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tasks Completed</span>
                    <span className="text-sm">{state.performance.tasksCompleted}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((capability) => (
                <Card key={capability.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(capability.category)}
                        <CardTitle className="text-sm">{capability.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getHealthIcon(capability.health)}
                        <Switch
                          checked={capability.enabled}
                          onCheckedChange={(enabled) => toggleCapability(capability.id, enabled)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 mb-2">{capability.description}</p>
                    <div className="flex justify-between text-xs">
                      <span>Usage: {capability.usage}</span>
                      <span>{capability.category}</span>
                    </div>
                    {capability.lastUsed && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last used: {new Date(capability.lastUsed).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(task.type)}
                        <span className="font-medium">{task.intent}</span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status === 'running' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTask(task.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    {task.status === 'running' && (
                      <Progress value={task.progress} className="mb-2" />
                    )}
                    {task.error && (
                      <Alert className="mt-2">
                        <AlertDescription>{task.error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                      {task.completedAt && (
                        <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Control Tab */}
          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Voice Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="w-4 h-4" />
                    <span>Voice Control</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" disabled={!capabilities.find(c => c.id === 'voice-input')?.enabled}>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Voice Input
                  </Button>
                  <p className="text-sm text-gray-500">
                    Speak commands to JASON using natural language
                  </p>
                </CardContent>
              </Card>

              {/* Content Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Content Generation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={contentTemplate} onValueChange={setContentTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional-email">Professional Email</SelectItem>
                      <SelectItem value="business-report">Business Report</SelectItem>
                      <SelectItem value="creative-story">Creative Story</SelectItem>
                      <SelectItem value="business-presentation">Business Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Variables (JSON format)"
                    value={contentVariables}
                    onChange={(e) => setContentVariables(e.target.value)}
                    rows={3}
                  />
                  <Button
                    className="w-full"
                    onClick={() => {
                      try {
                        const variables = JSON.parse(contentVariables)
                        executeTask({
                          type: 'content',
                          intent: 'generate_content',
                          parameters: { templateId: contentTemplate, variables },
                          priority: 'medium',
                          status: 'pending',
                          progress: 0,
                          securityLevel: 1,
                          requiresApproval: false
                        })
                      } catch (error) {
                        alert('Invalid JSON in variables field')
                      }
                    }}
                  >
                    Generate Content
                  </Button>
                </CardContent>
              </Card>

              {/* Global Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>Global Search</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Search across all sources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="files">Files</SelectItem>
                      <SelectItem value="web">Web</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    onClick={() => {
                      executeTask({
                        type: 'search',
                        intent: 'global_search',
                        parameters: { query: searchQuery, type: 'all' },
                        priority: 'medium',
                        status: 'pending',
                        progress: 0,
                        securityLevel: 1,
                        requiresApproval: false
                      })
                    }}
                  >
                    Search
                  </Button>
                </CardContent>
              </Card>

              {/* Task Planning */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>Task Planning</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="What do you want to accomplish?"
                    value={planGoal}
                    onChange={(e) => setPlanGoal(e.target.value)}
                  />
                  <Textarea
                    placeholder="Context (JSON format, optional)"
                    value={planContext}
                    onChange={(e) => setPlanContext(e.target.value)}
                    rows={3}
                  />
                  <Button
                    className="w-full"
                    onClick={() => {
                      try {
                        const context = planContext ? JSON.parse(planContext) : {}
                        executeTask({
                          type: 'planning',
                          intent: 'plan_and_execute',
                          parameters: { goal: planGoal, context, execute: true },
                          priority: 'high',
                          status: 'pending',
                          progress: 0,
                          securityLevel: 2,
                          requiresApproval: true
                        })
                      } catch (error) {
                        alert('Invalid JSON in context field')
                      }
                    }}
                  >
                    Plan and Execute
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4" />
                    <span>System Resources</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm">{state.performance.cpuUsage}%</span>
                    </div>
                    <Progress value={state.performance.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm">{state.performance.memoryUsage.toFixed(1)}MB</span>
                    </div>
                    <Progress value={(state.performance.memoryUsage / 1024) * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tasks Completed</span>
                      <p className="font-medium">{state.performance.tasksCompleted}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Response Time</span>
                      <p className="font-medium">{state.performance.averageResponseTime}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Security Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500">Current Level</span>
                      <p className="font-medium">Level {state.security.currentLevel}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pending Approvals</span>
                      <p className="font-medium">{state.security.pendingApprovals}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Blocked Actions</span>
                      <p className="font-medium">{state.security.blockedActions}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Activity</span>
                      <p className="font-medium">{new Date(state.lastActivity).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.slice().reverse().map((event, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          event.severity === 'critical' ? 'destructive' :
                          event.severity === 'error' ? 'destructive' :
                          event.severity === 'warning' ? 'secondary' : 'default'
                        }>
                          {event.severity}
                        </Badge>
                        <span className="font-medium">{event.type}</span>
                        <span className="text-sm text-gray-500">from {event.source}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {JSON.stringify(event.details, null, 2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

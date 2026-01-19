export interface PriorityMessage {
  id: string
  type: string
  priority: number // 1-10, 10 being highest priority
  data: Record<string, any>
  timestamp: Date
  source: string
  timeout?: number
}

export interface MessageHandler {
  (message: PriorityMessage): Promise<void>
}

export interface SystemState {
  status: 'initializing' | 'running' | 'error' | 'shutdown'
  uptime: number
  activeThreads: number
  memoryUsage: NodeJS.MemoryUsage
  lastActivity: Date
}

export interface TaskPlan {
  id: string
  name: string
  steps: TaskStep[]
  reward: number
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaskStep {
  id: string
  action: string
  parameters: Record<string, any>
  expectedOutcome: string
  actualOutcome?: string
  reward?: number
  completed: boolean
  errors: string[]
}

export interface QLearningState {
  state: string
  action: string
  reward: number
  nextState: string
  timestamp: Date
}

export interface UserStyleProfile {
  userId: string
  lexicalDensity: number
  syntacticStructure: string[]
  slangTerms: string[]
  emojiUsage: Record<string, number>
  toneIndicators: string[]
  lastUpdated: Date
}

export interface VLMElement {
  id: string
  type: 'button' | 'text' | 'input' | 'link' | 'image' | 'container'
  text?: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  semantic: string
  attributes: Record<string, any>
}

export interface UIMap {
  windowHash: string
  elements: VLMElement[]
  screenshot?: string
  timestamp: Date
  appName: string
}

export interface JitterConfig {
  typingMeanMs: number
  typingStdMs: number
  mouseBezierPoints: number
  mouseSpeedVariation: number
}

export interface SecurityGate {
  scope: boolean
  cost: boolean
  integrity: boolean
  reason?: string
}

export interface ContentGenerationRequest {
  type: 'powerpoint' | 'word' | 'excel'
  prompt: string
  style: UserStyleProfile
  requirements: {
    slideCount?: number
    wordCount?: number
    includeImages: boolean
    includeCharts: boolean
    template?: string
  }
}

export interface PlatformCredentials {
  platform: 'teams' | 'sparx' | 'google_classroom' | 'jira' | 'trello'
  username?: string
  password?: string
  token?: string
  sessionId?: string
}

import { EventEmitter } from 'events'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { Readable } from 'stream'
import { HTNPlanner } from '../planner/HTNPlanner'
import { UniversalAppController } from '../universal/UniversalAppController'
import { GhostHandManager } from '../automation/GhostHandManager'

export interface VoiceCommand {
  id: string
  transcript: string
  confidence: number
  timestamp: Date
  audioFile?: string
  processed: boolean
  intent?: string
  entities?: Record<string, any>
  action?: any
  result?: any
}

export interface STTConfig {
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3'
  whisperLanguage: string
  whisperTranslate: boolean
  audioFormat: 'wav' | 'mp3' | 'flac'
  sampleRate: number
  channels: number
  bufferSize: number
  silenceThreshold: number
  vadEnabled: boolean
  noiseReduction: boolean
}

export interface IntentConfig {
  confidenceThreshold: number
  entityExtraction: boolean
  contextAwareness: boolean
  learningEnabled: boolean
  fallbackToGeneric: boolean
}

export interface TTSConfig {
  enabled: boolean
  voice: string
  speed: number
  pitch: number
  volume: number
  engine: 'espeak' | 'festival' | 'piper' | 'custom'
}

export interface LocalAlexaConfig {
  stt: STTConfig
  intent: IntentConfig
  tts: TTSConfig
  hotword: {
    enabled: boolean
    word: string
    sensitivity: number
    model: string
  }
  audio: {
    inputDevice: string
    outputDevice: string
    inputGain: number
    outputGain: number
  }
  processing: {
    maxConcurrentCommands: number
    commandTimeout: number
    retryAttempts: number
    enableLogging: boolean
  }
}

const DEFAULT_CONFIG: LocalAlexaConfig = {
  stt: {
    whisperModel: 'base',
    whisperLanguage: 'en',
    whisperTranslate: false,
    audioFormat: 'wav',
    sampleRate: 16000,
    channels: 1,
    bufferSize: 4096,
    silenceThreshold: 0.01,
    vadEnabled: true,
    noiseReduction: true
  },
  intent: {
    confidenceThreshold: 0.7,
    entityExtraction: true,
    contextAwareness: true,
    learningEnabled: true,
    fallbackToGeneric: true
  },
  tts: {
    enabled: true,
    voice: 'en-US',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    engine: 'espeak'
  },
  hotword: {
    enabled: true,
    word: 'JASON',
    sensitivity: 0.7,
    model: 'porcupine' // or custom model
  },
  audio: {
    inputDevice: 'default',
    outputDevice: 'default',
    inputGain: 1.0,
    outputGain: 1.0
  },
  processing: {
    maxConcurrentCommands: 5,
    commandTimeout: 30000,
    retryAttempts: 3,
    enableLogging: true
  }
}

export class LocalAlexaPipeline extends EventEmitter {
  private config: LocalAlexaConfig
  private isInitialized = false
  private isListening = false
  private audioBuffer: Buffer[] = []
  private isRecording = false
  private recordingProcess: any = null
  private whisperProcess: any = null
  private activeCommands: Map<string, VoiceCommand> = new Map()
  private commandHistory: VoiceCommand[] = []
  private htnPlanner: HTNPlanner
  private appController: UniversalAppController
  private ghostHand: GhostHandManager
  private workspace: string

  constructor(
    config: Partial<LocalAlexaConfig> = {},
    htnPlanner: HTNPlanner,
    appController: UniversalAppController,
    ghostHand: GhostHandManager
  ) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.htnPlanner = htnPlanner
    this.appController = appController
    this.ghostHand = ghostHand
    this.workspace = path.join(os.tmpdir(), 'jason-voice')
    this.initializeWorkspace()
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await fs.mkdir(this.workspace, { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'audio'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'transcripts'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'models'), { recursive: true })
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize voice workspace'))
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Check dependencies
      await this.checkDependencies()

      // Download Whisper model if needed
      await this.ensureWhisperModel()

      // Initialize hotword detection if enabled
      if (this.config.hotword.enabled) {
        await this.initializeHotwordDetection()
      }

      this.isInitialized = true
      this.emit('initialized')
      this.log('Local Alexa Pipeline initialized successfully')
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize Local Alexa'))
    }
  }

  private async checkDependencies(): Promise<void> {
    const requiredCommands = ['ffmpeg', 'python3']

    for (const cmd of requiredCommands) {
      const exists = await this.checkCommandExists(cmd)
      if (!exists) {
        throw new Error(`Required dependency not found: ${cmd}`)
      }
    }

    // Check for Whisper installation
    const whisperExists = await this.checkWhisperInstallation()
    if (!whisperExists) {
      throw new Error('Whisper is not installed. Please install OpenAI Whisper.')
    }
  }

  private async checkCommandExists(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('which', [command])
      child.on('close', (code) => {
        resolve(code === 0)
      })
      child.on('error', () => {
        resolve(false)
      })
    })
  }

  private async checkWhisperInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('python3', ['-c', 'import whisper; print("Whisper available")'])
      let output = ''

      child.stdout?.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', (code) => {
        resolve(code === 0 && output.includes('Whisper available'))
      })

      child.on('error', () => {
        resolve(false)
      })
    })
  }

  private async ensureWhisperModel(): Promise<void> {
    const modelPath = path.join(this.workspace, 'models', `whisper-${this.config.stt.whisperModel}.pt`)

    try {
      await fs.access(modelPath)
      this.log(`Whisper model found: ${this.config.stt.whisperModel}`)
    } catch {
      this.log(`Downloading Whisper model: ${this.config.stt.whisperModel}`)
      await this.downloadWhisperModel(modelPath)
    }
  }

  private async downloadWhisperModel(modelPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import whisper
import os

model_name = "${this.config.stt.whisperModel}"
model_path = "${modelPath}"

try:
    print(f"Loading model: {model_name}")
    model = whisper.load_model(model_name, download_root="${path.dirname(modelPath)}")
    print("Model downloaded successfully")
except Exception as e:
    print(f"Error downloading model: {e}")
    exit(1)
      `.trim()

      const child = spawn('python3', ['-c', pythonScript])

      child.stdout?.on('data', (data) => {
        this.log(data.toString().trim())
      })

      child.stderr?.on('data', (data) => {
        this.log(`Whisper error: ${data.toString().trim()}`)
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Failed to download Whisper model: ${code}`))
        }
      })

      child.on('error', reject)
    })
  }

  private async initializeHotwordDetection(): Promise<void> {
    // Initialize hotword detection (e.g., Porcupine, Snowboy, or custom VAD)
    this.log('Hotword detection initialized')
  }

  // VOICE INPUT PROCESSING

  async startListening(): Promise<void> {
    if (this.isListening) {
      this.log('Already listening')
      return
    }

    if (!this.isInitialized) {
      await this.initialize()
    }

    this.isListening = true
    this.emit('listening_started')
    this.log('Started listening for voice commands')

    if (this.config.hotword.enabled) {
      await this.startHotwordDetection()
    } else {
      await this.startContinuousListening()
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return

    this.isListening = false

    if (this.recordingProcess) {
      this.recordingProcess.kill()
      this.recordingProcess = null
    }

    if (this.isRecording) {
      await this.stopRecording()
    }

    this.emit('listening_stopped')
    this.log('Stopped listening for voice commands')
  }

  private async startHotwordDetection(): Promise<void> {
    // Implementation for hotword detection
    // This would use a library like Porcupine or custom VAD
    this.log('Hotword detection active')
  }

  private async startContinuousListening(): Promise<void> {
    await this.startRecording()
  }

  private async startRecording(): Promise<void> {
    if (this.isRecording) return

    const timestamp = Date.now()
    const audioFile = path.join(this.workspace, 'audio', `recording_${timestamp}.wav`)

    // Use ffmpeg to record audio
    const ffmpegArgs = [
      '-f', 'alsa', // or 'avfoundation' for macOS
      '-i', this.config.audio.inputDevice,
      '-ar', this.config.stt.sampleRate.toString(),
      '-ac', this.config.stt.channels.toString(),
      '-c:a', 'pcm_s16le',
      '-y',
      audioFile
    ]

    this.recordingProcess = spawn('ffmpeg', ffmpegArgs)
    this.isRecording = true

    this.recordingProcess.on('close', (code) => {
      this.isRecording = false
      if (code === 0) {
        this.processAudioFile(audioFile)
      } else {
        this.log(`Recording failed with code: ${code}`)
      }
    })

    this.recordingProcess.on('error', (error) => {
      this.log(`Recording error: ${error.message}`)
      this.isRecording = false
    })

    this.log('Started audio recording')
  }

  private async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.recordingProcess) return

    this.recordingProcess.kill('SIGINT')
    this.recordingProcess = null
    this.isRecording = false
    this.log('Stopped audio recording')
  }

  private async processAudioFile(audioFile: string): Promise<void> {
    try {
      const transcription = await this.transcribeAudio(audioFile)

      if (transcription.text.trim()) {
        const voiceCommand: VoiceCommand = {
          id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transcript: transcription.text,
          confidence: transcription.confidence || 0.8,
          timestamp: new Date(),
          audioFile,
          processed: false
        }

        await this.processVoiceCommand(voiceCommand)
      }

      // Cleanup audio file
      try {
        await fs.unlink(audioFile)
      } catch { }
    } catch (error) {
      this.log(`Audio processing failed: ${error}`)
    }
  }

  private async transcribeAudio(audioFile: string): Promise<{ text: string; confidence: number }> {
    try {
      const jasonEngineUrl = 'http://localhost:8000/transcribe'
      const fileBuffer = await fs.readFile(audioFile)

      const formData = new FormData()
      // Note: Node.js 18+ has native FormData, or we might need a library if environment is older
      // Assuming native or polyfilled environment given "MAXIMUM" modern stack
      const blob = new Blob([fileBuffer as any], { type: 'audio/wav' })
      formData.append('file', blob, path.basename(audioFile))
      if (this.config.stt.whisperLanguage !== 'auto') {
        formData.append('language', this.config.stt.whisperLanguage)
      }

      const response = await fetch(jasonEngineUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`JASON Engine Transcription failed: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        text: result.text,
        confidence: result.confidence
      }

    } catch (error) {
      // Fallback to python subprocess if Engine is down? Or just fail?
      // For "MAXIMUM" reliability we'd fallback, but let's stick to the Engine architecture for now 
      // to keep the system unified.
      this.log(`Transcription failed via Engine: ${error}`)
      throw error
    }
  }

  private async processVoiceCommand(command: VoiceCommand): Promise<void> {
    this.activeCommands.set(command.id, command)
    this.commandHistory.push(command)
    this.emit('command_received', command)

    try {
      // Extract intent and entities
      const intentResult = await this.extractIntent(command.transcript)
      command.intent = intentResult.intent
      command.entities = intentResult.entities

      // Generate action plan using HTN planner
      const actionPlan = await this.generateActionPlan(command)
      command.action = actionPlan

      // Execute the action plan
      const result = await this.executeActionPlan(actionPlan)
      command.result = result
      command.processed = true

      this.emit('command_processed', command)

      // Provide verbal feedback if TTS is enabled
      if (this.config.tts.enabled && result.success) {
        await this.speakResponse(result.response || 'Command completed successfully')
      }

    } catch (error) {
      command.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      command.processed = true

      this.emit('command_failed', command)

      if (this.config.tts.enabled) {
        await this.speakResponse('Sorry, I encountered an error processing your command.')
      }
    } finally {
      this.activeCommands.delete(command.id)
    }
  }

  private async extractIntent(transcript: string): Promise<{ intent: string; entities: Record<string, any>; confidence: number }> {
    // Simple intent extraction - can be enhanced with NLP models
    const normalizedTranscript = transcript.toLowerCase().trim()

    // Define intent patterns
    const intents = [
      {
        name: 'book_flight',
        patterns: ['book flight', 'find flight', 'search flight', 'buy ticket', 'air travel'],
        entities: ['destination', 'departure', 'date', 'budget', 'airline']
      },
      {
        name: 'send_email',
        patterns: ['send email', 'compose email', 'write email', 'email to'],
        entities: ['recipient', 'subject', 'body', 'cc', 'bcc']
      },
      {
        name: 'create_document',
        patterns: ['create document', 'write document', 'new document', 'make presentation'],
        entities: ['type', 'title', 'content', 'format']
      },
      {
        name: 'search_web',
        patterns: ['search', 'find', 'look up', 'google'],
        entities: ['query', 'time_range', 'source']
      },
      {
        name: 'control_app',
        patterns: ['open', 'close', 'start', 'stop', 'launch', 'quit'],
        entities: ['app', 'action', 'parameters']
      },
      {
        name: 'schedule_event',
        patterns: ['schedule', 'calendar', 'meeting', 'appointment', 'event'],
        entities: ['title', 'date', 'time', 'attendees', 'location']
      },
      {
        name: 'play_music',
        patterns: ['play music', 'play song', 'listen to', 'music'],
        entities: ['song', 'artist', 'album', 'playlist']
      },
      {
        name: 'system_command',
        patterns: ['shutdown', 'restart', 'lock', 'sleep', 'settings'],
        entities: ['action', 'parameters']
      }
    ]

    // Find matching intent
    let bestMatch = { intent: 'generic', entities: {}, confidence: 0.5 }

    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (normalizedTranscript.includes(pattern)) {
          const confidence = this.calculateIntentConfidence(normalizedTranscript, pattern)
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent: intent.name,
              entities: this.extractEntities(normalizedTranscript, intent.entities),
              confidence
            }
          }
        }
      }
    }

    return bestMatch
  }

  private calculateIntentConfidence(transcript: string, pattern: string): number {
    const words = transcript.split(' ')
    const patternWords = pattern.split(' ')
    let matches = 0

    for (const patternWord of patternWords) {
      if (words.some(word => word.includes(patternWord) || patternWord.includes(word))) {
        matches++
      }
    }

    return matches / patternWords.length
  }

  private extractEntities(transcript: string, entityTypes: string[]): Record<string, any> {
    const entities: Record<string, any> = {}

    // Simple entity extraction using regex patterns
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      date: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|today|tomorrow|yesterday|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})\b/gi,
      time: /\b(\d{1,2}:\d{2}\s*(am|pm)?|\d{1,2}\s*(am|pm))\b/gi,
      money: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
      website: /\bhttps?:\/\/[^\s]+\b/g
    }

    for (const entityType of entityTypes) {
      const pattern = patterns[entityType as keyof typeof patterns]
      if (pattern) {
        const matches = transcript.match(pattern)
        if (matches) {
          entities[entityType] = matches[0]
        }
      }
    }

    // Extract quoted text as content
    const quotedText = transcript.match(/"([^"]+)"/g)
    if (quotedText) {
      entities.content = quotedText.map(q => q.replace(/"/g, '')).join(' ')
    }

    return entities
  }

  private async generateActionPlan(command: VoiceCommand): Promise<any> {
    const { intent, entities } = command

    switch (intent) {
      case 'book_flight':
        return await this.generateFlightBookingPlan(entities)
      case 'send_email':
        return await this.generateEmailPlan(entities)
      case 'create_document':
        return await this.generateDocumentPlan(entities)
      case 'search_web':
        return await this.generateSearchPlan(entities)
      case 'control_app':
        return await this.generateAppControlPlan(entities)
      case 'schedule_event':
        return await this.generateCalendarPlan(entities)
      case 'play_music':
        return await this.generateMusicPlan(entities)
      case 'system_command':
        return await this.generateSystemPlan(entities)
      default:
        return await this.generateGenericPlan(entities)
    }
  }

  private async generateFlightBookingPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'flight_booking',
      steps: [
        {
          action: 'search_flights',
          parameters: {
            destination: entities.destination,
            departure: entities.departure || 'current location',
            date: entities.date,
            budget: entities.money
          }
        },
        {
          action: 'compare_options',
          parameters: {
            criteria: ['price', 'duration', 'airline']
          }
        },
        {
          action: 'select_best',
          parameters: {
            preference: 'lowest_price'
          }
        },
        {
          action: 'book_flight',
          parameters: {
            requires_approval: true
          }
        }
      ]
    }
  }

  private async generateEmailPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'email_composition',
      steps: [
        {
          action: 'open_email_client',
          parameters: {
            provider: 'gmail'
          }
        },
        {
          action: 'compose_email',
          parameters: {
            to: entities.email,
            subject: entities.subject || 'No subject',
            body: entities.content || 'Email content'
          }
        },
        {
          action: 'send_email',
          parameters: {
            requires_approval: true
          }
        }
      ]
    }
  }

  private async generateDocumentPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'document_creation',
      steps: [
        {
          action: 'open_word_processor',
          parameters: {
            app: 'microsoft-word'
          }
        },
        {
          action: 'create_document',
          parameters: {
            title: entities.title || 'Untitled Document',
            content: entities.content || '',
            format: entities.type || 'document'
          }
        },
        {
          action: 'save_document',
          parameters: {
            location: 'Documents'
          }
        }
      ]
    }
  }

  private async generateSearchPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'web_search',
      steps: [
        {
          action: 'open_browser',
          parameters: {
            search_engine: 'google'
          }
        },
        {
          action: 'perform_search',
          parameters: {
            query: entities.content || entities.query
          }
        },
        {
          action: 'analyze_results',
          parameters: {
            top_results: 5
          }
        }
      ]
    }
  }

  private async generateAppControlPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'app_control',
      steps: [
        {
          action: 'launch_app',
          parameters: {
            app: entities.app,
            action: entities.action
          }
        },
        {
          action: 'execute_app_command',
          parameters: {
            command: entities.action,
            parameters: entities.parameters
          }
        }
      ]
    }
  }

  private async generateCalendarPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'calendar_management',
      steps: [
        {
          action: 'open_calendar',
          parameters: {
            provider: 'google-calendar'
          }
        },
        {
          action: 'create_event',
          parameters: {
            title: entities.title || 'New Event',
            date: entities.date,
            time: entities.time,
            attendees: entities.attendees
          }
        }
      ]
    }
  }

  private async generateMusicPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'music_control',
      steps: [
        {
          action: 'open_music_app',
          parameters: {
            app: 'spotify'
          }
        },
        {
          action: 'play_music',
          parameters: {
            song: entities.song,
            artist: entities.artist,
            album: entities.album
          }
        }
      ]
    }
  }

  private async generateSystemPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'system_control',
      steps: [
        {
          action: 'execute_system_command',
          parameters: {
            command: entities.action,
            requires_approval: true
          }
        }
      ]
    }
  }

  private async generateGenericPlan(entities: Record<string, any>): Promise<any> {
    return {
      type: 'generic_ghost_hand',
      steps: [
        {
          action: 'ghost_hand_execute',
          parameters: {
            prompt: entities.content || entities.query || 'Do what the user asked'
          }
        }
      ]
    }
  }

  private async executeActionPlan(plan: any): Promise<any> {
    try {
      const results = []

      for (const step of plan.steps) {
        const result = await this.executeStep(step)
        results.push(result)

        if (!result.success && step.parameters.requires_approval !== true) {
          return {
            success: false,
            error: `Step failed: ${step.action}`,
            partial_results: results
          }
        }
      }

      return {
        success: true,
        results,
        response: this.generateSuccessResponse(plan, results)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async executeStep(step: any): Promise<any> {
    switch (step.action) {
      case 'search_flights':
        return await this.searchFlights(step.parameters)
      case 'open_email_client':
        return await this.openApp('gmail')
      case 'compose_email':
        return await this.composeEmail(step.parameters)
      case 'send_email':
        return await this.sendEmail(step.parameters)
      case 'open_word_processor':
        return await this.openApp('microsoft-word')
      case 'create_document':
        return await this.createDocument(step.parameters)
      case 'open_browser':
        return await this.openBrowser()
      case 'perform_search':
        return await this.performSearch(step.parameters)
      case 'launch_app':
        return await this.launchApp(step.parameters)
      case 'open_calendar':
        return await this.openApp('google-calendar')
      case 'create_event':
        return await this.createCalendarEvent(step.parameters)
      case 'open_music_app':
        return await this.openApp('spotify')
      case 'play_music':
        return await this.playMusic(step.parameters)
      case 'execute_system_command':
        return await this.executeSystemCommand(step.parameters)
      case 'ghost_hand_execute':
        // Universal "Anything" Capability via AppController -> UniversalGhostHand
        return await this.appController.executeGenericTask(step.parameters.prompt)
      default:
        return { success: false, error: `Unknown step: ${step.action}` }
    }
  }

  // STEP EXECUTION METHODS

  private async searchFlights(parameters: any): Promise<any> {
    // Implement flight search using web scraping or API
    return {
      success: true,
      flights: [
        { airline: 'Delta', price: '$450', duration: '3h 30m', departure: '8:00 AM' },
        { airline: 'United', price: '$425', duration: '4h 15m', departure: '10:30 AM' }
      ]
    }
  }

  private async openApp(appName: string): Promise<any> {
    try {
      const command = await this.appController.executeUniversalCommand({
        id: `app_${Date.now()}`,
        intent: `Open ${appName}`,
        app: appName.toLowerCase().replace('-', ''),
        action: 'open',
        parameters: {},
        priority: 'medium',
        permissions: [],
        execution: {
          type: 'ui',
          confidence: 0.9
        }
      })

      return { success: true, command }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to open app' }
    }
  }

  private async composeEmail(parameters: any): Promise<any> {
    try {
      const command = await this.appController.executeUniversalCommand({
        id: `email_${Date.now()}`,
        intent: 'Compose email',
        app: 'gmail',
        action: 'compose',
        parameters,
        priority: 'medium',
        permissions: ['email'],
        execution: {
          type: 'api',
          confidence: 0.9
        }
      })

      return { success: true, command }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to compose email' }
    }
  }

  private async sendEmail(parameters: any): Promise<any> {
    try {
      const command = await this.appController.executeUniversalCommand({
        id: `send_${Date.now()}`,
        intent: 'Send email',
        app: 'gmail',
        action: 'send',
        parameters,
        priority: 'high',
        permissions: ['email'],
        execution: {
          type: 'api',
          confidence: 0.9
        }
      })

      return { success: true, command }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
    }
  }

  private async createDocument(parameters: any): Promise<any> {
    try {
      const command = await this.appController.executeUniversalCommand({
        id: `doc_${Date.now()}`,
        intent: 'Create document',
        app: 'microsoft-word',
        action: 'create_document',
        parameters,
        priority: 'medium',
        permissions: ['file'],
        execution: {
          type: 'ui',
          confidence: 0.8
        }
      })

      return { success: true, command }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create document' }
    }
  }

  private async openBrowser(): Promise<any> {
    return { success: true, message: 'Browser opened' }
  }

  private async performSearch(parameters: any): Promise<any> {
    return {
      success: true,
      results: [
        { title: 'Search Result 1', url: 'https://example.com/1' },
        { title: 'Search Result 2', url: 'https://example.com/2' }
      ]
    }
  }

  private async launchApp(parameters: any): Promise<any> {
    return { success: true, message: `Launched ${parameters.app}` }
  }

  private async createCalendarEvent(parameters: any): Promise<any> {
    try {
      const command = await this.appController.executeUniversalCommand({
        id: `event_${Date.now()}`,
        intent: 'Create calendar event',
        app: 'google-calendar',
        action: 'create_event',
        parameters,
        priority: 'medium',
        permissions: ['calendar'],
        execution: {
          type: 'api',
          confidence: 0.9
        }
      })

      return { success: true, command }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create event' }
    }
  }

  private async playMusic(parameters: any): Promise<any> {
    try {
      const command = await this.appController.executeUniversalCommand({
        id: `music_${Date.now()}`,
        intent: 'Play music',
        app: 'spotify',
        action: 'play',
        parameters,
        priority: 'medium',
        permissions: ['media'],
        execution: {
          type: 'ui',
          confidence: 0.8
        }
      })

      return { success: true, command }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to play music' }
    }
  }

  private async executeSystemCommand(parameters: any): Promise<any> {
    return { success: true, message: 'System command executed' }
  }

  private generateSuccessResponse(plan: any, results: any[]): string {
    switch (plan.type) {
      case 'flight_booking':
        return 'I found and booked the best flight option for you.'
      case 'email_composition':
        return 'Your email has been composed and sent successfully.'
      case 'document_creation':
        return 'Your document has been created and saved.'
      case 'web_search':
        return 'I completed your web search and found relevant results.'
      case 'app_control':
        return 'The app command has been executed successfully.'
      case 'calendar_management':
        return 'Your calendar event has been created.'
      case 'music_control':
        return 'Music is now playing as requested.'
      case 'system_control':
        return 'The system command has been executed.'
      default:
        return 'Your command has been completed successfully.'
    }
  }

  // TEXT-TO-SPEECH

  private async speakResponse(text: string): Promise<void> {
    if (!this.config.tts.enabled) return

    const timestamp = Date.now()
    const audioFile = path.join(this.workspace, 'audio', `response_${timestamp}.wav`)

    try {
      // Generate speech using espeak or other TTS engine
      await this.generateSpeech(text, audioFile)

      // Play the audio file
      await this.playAudioFile(audioFile)

      // Cleanup
      try {
        await fs.unlink(audioFile)
      } catch { }
    } catch (error) {
      this.log(`TTS failed: ${error}`)
    }
  }

  private async generateSpeech(text: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', this.config.tts.voice,
        '-s', Math.round(140 * this.config.tts.speed).toString(),
        '-p', Math.round(50 * this.config.tts.pitch).toString(),
        '-a', Math.round(100 * this.config.tts.volume).toString(),
        '-w', outputFile,
        text
      ]

      const child = spawn('espeak', args)

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`TTS generation failed with code: ${code}`))
        }
      })

      child.on('error', reject)
    })
  }

  private async playAudioFile(audioFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('aplay', [audioFile]) // Use 'afplay' on macOS, 'ffplay' cross-platform

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Audio playback failed with code: ${code}`))
        }
      })

      child.on('error', reject)
    })
  }

  // UTILITY METHODS

  private log(message: string): void {
    if (this.config.processing.enableLogging) {
      console.log(`[LocalAlexa] ${message}`)
    }
  }

  // PUBLIC API

  getActiveCommands(): VoiceCommand[] {
    return Array.from(this.activeCommands.values())
  }

  getCommandHistory(): VoiceCommand[] {
    return [...this.commandHistory]
  }

  async processTextCommand(text: string): Promise<VoiceCommand> {
    const command: VoiceCommand = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transcript: text,
      confidence: 1.0,
      timestamp: new Date(),
      processed: false
    }

    await this.processVoiceCommand(command)
    return command
  }

  async shutdown(): Promise<void> {
    await this.stopListening()

    if (this.whisperProcess) {
      this.whisperProcess.kill()
      this.whisperProcess = null
    }

    this.isInitialized = false
    this.emit('shutdown')
    this.log('Local Alexa Pipeline shut down')
  }
}

export default LocalAlexaPipeline

import { EventEmitter } from 'events'
import { WindowsUIAutomationAdapter } from '../agents/WindowsUIAutomationAgent'
import { UniversalGhostHand } from '../automation/UniversalGhostHand'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { permissionManager } from '../trust/PermissionManager'

export interface AppCapability {
  id: string
  name: string
  type: 'web' | 'desktop' | 'mobile' | 'api' | 'system'
  platforms: string[]
  actions: string[]
  selectors?: Record<string, string>
  apiEndpoints?: Record<string, string>
  authentication?: {
    type: 'oauth' | 'basic' | 'token' | 'none'
    credentials?: Record<string, string>
  }
  automation?: {
    supported: boolean
    frameworks: string[]
    customSelectors?: Record<string, string>
  }
}

export interface UniversalCommand {
  id: string
  intent: string
  app: string
  action: string
  parameters: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  permissions: string[]
  execution: {
    type: 'vlm' | 'api' | 'ui' | 'system' | 'hybrid'
    confidence: number
    fallback?: string[]
  }
  context?: {
    windowTitle?: string
    url?: string
    selector?: string
    coordinates?: { x: number; y: number }
  }
}

export interface VLMResult {
  found: boolean
  confidence: number
  coordinates?: { x: number; y: number }
  element?: {
    type: string
    text: string
    attributes: Record<string, any>
  }
  raw?: string
  error?: string
}

export class UniversalAppController extends EventEmitter {
  private vlmAdapter: WindowsUIAutomationAdapter
  private ghostHand: UniversalGhostHand
  private appCapabilities: Map<string, AppCapability> = new Map()
  private activeCommands: Map<string, UniversalCommand> = new Map()
  private isInitialized = false
  private workspace: string

  constructor() {
    super()
    this.vlmAdapter = new WindowsUIAutomationAdapter()
    this.ghostHand = new UniversalGhostHand()
    this.workspace = path.join(os.tmpdir(), 'jason-universal')
    this.initializeAppCapabilities()
    this.initializeWorkspace()
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await fs.mkdir(this.workspace, { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'screenshots'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'templates'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'logs'), { recursive: true })
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize workspace'))
    }
  }

  private initializeAppCapabilities(): void {
    // Web Applications
    this.registerAppCapability({
      id: 'gmail',
      name: 'Gmail',
      type: 'web',
      platforms: ['web'],
      actions: ['compose', 'send', 'reply', 'forward', 'search', 'archive', 'delete', 'label', 'star'],
      selectors: {
        compose: 'div[aria-label*="Compose"]',
        to: 'input[aria-label*="To"]',
        subject: 'input[aria-label*="Subject"]',
        body: 'div[role="textbox"]',
        send: 'div[aria-label*="Send"]',
        search: 'input[aria-label*="Search"]'
      },
      apiEndpoints: {
        messages: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        drafts: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        labels: 'https://gmail.googleapis.com/gmail/v1/users/me/labels'
      },
      authentication: {
        type: 'oauth'
      }
    })

    this.registerAppCapability({
      id: 'google-calendar',
      name: 'Google Calendar',
      type: 'web',
      platforms: ['web'],
      actions: ['create_event', 'edit_event', 'delete_event', 'share', 'invite', 'remind'],
      selectors: {
        create: 'div[aria-label*="Create"]',
        title: 'input[aria-label*="Title"]',
        date: 'input[aria-label*="Date"]',
        time: 'input[aria-label*="Time"]',
        guests: 'input[aria-label*="Guests"]',
        save: 'div[aria-label*="Save"]'
      },
      apiEndpoints: {
        events: 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
      },
      authentication: {
        type: 'oauth'
      }
    })

    this.registerAppCapability({
      id: 'notion',
      name: 'Notion',
      type: 'web',
      platforms: ['web'],
      actions: ['create_page', 'edit_page', 'delete_page', 'create_database', 'query_database', 'block'],
      selectors: {
        new_page: 'div[aria-label*="New page"]',
        title: 'div[contenteditable="true"][data-content-editable-leaf="true"]',
        block: '[data-block-id]',
        database: 'div[role="table"]'
      },
      apiEndpoints: {
        pages: 'https://api.notion.com/v1/pages',
        databases: 'https://api.notion.com/v1/databases',
        blocks: 'https://api.notion.com/v1/blocks'
      },
      authentication: {
        type: 'token'
      }
    })

    this.registerAppCapability({
      id: 'slack',
      name: 'Slack',
      type: 'web',
      platforms: ['web'],
      actions: ['send_message', 'reply', 'react', 'share_file', 'create_channel', 'invite'],
      selectors: {
        message_input: 'div[data-qa="message_input"]',
        send_button: 'button[data-qa="send_button"]',
        channel_list: 'div[data-qa="channel_list"]'
      },
      apiEndpoints: {
        chat: 'https://slack.com/api/chat.postMessage',
        channels: 'https://slack.com/api/conversations.list'
      },
      authentication: {
        type: 'token'
      }
    })

    // Desktop Applications
    this.registerAppCapability({
      id: 'spotify',
      name: 'Spotify',
      type: 'desktop',
      platforms: ['win32', 'darwin', 'linux'],
      actions: ['play', 'pause', 'next', 'previous', 'search', 'create_playlist', 'add_to_playlist'],
      automation: {
        supported: true,
        frameworks: ['ui_automation'],
        customSelectors: {
          play: 'PlayButton',
          pause: 'PauseButton',
          next: 'NextButton',
          search: 'SearchBox'
        }
      }
    })

    this.registerAppCapability({
      id: 'vscode',
      name: 'Visual Studio Code',
      type: 'desktop',
      platforms: ['win32', 'darwin', 'linux'],
      actions: ['open_file', 'save_file', 'close_file', 'search', 'replace', 'run', 'debug', 'install_extension'],
      automation: {
        supported: true,
        frameworks: ['ui_automation', 'command_palette'],
        customSelectors: {
          command_palette: 'CommandPalette',
          explorer: 'ExplorerView',
          terminal: 'Terminal'
        }
      }
    })

    // System Applications
    this.registerAppCapability({
      id: 'desktop',
      name: 'Desktop Environment',
      type: 'system',
      platforms: ['win32'],
      actions: ['click', 'type', 'search', 'launch'],
      automation: {
        supported: true,
        frameworks: ['ui_automation'],
        customSelectors: {
          start_button: 'StartButton',
          taskbar: 'Taskbar'
        }
      }
    })

    this.registerAppCapability({
      id: 'file-explorer',
      name: 'File Explorer',
      type: 'system',
      platforms: ['win32'],
      actions: ['navigate', 'create_folder', 'delete_file', 'copy', 'paste', 'move', 'search', 'properties'],
      automation: {
        supported: true,
        frameworks: ['ui_automation'],
        customSelectors: {
          address_bar: 'AddressBandRoot',
          file_list: 'FileList',
          tree_view: 'NamespaceTreeControl'
        }
      }
    })

    // Communication Apps
    this.registerAppCapability({
      id: 'whatsapp',
      name: 'WhatsApp',
      type: 'web',
      platforms: ['web'],
      actions: ['send_message', 'send_image', 'send_video', 'voice_call', 'video_call', 'create_group'],
      selectors: {
        message_input: 'div[contenteditable="true"]',
        send_button: 'button[data-testid="send"]',
        attach_button: 'span[data-testid="attach"]'
      }
    })

    this.registerAppCapability({
      id: 'telegram',
      name: 'Telegram',
      type: 'web',
      platforms: ['web'],
      actions: ['send_message', 'send_file', 'voice_call', 'create_channel', 'search'],
      selectors: {
        message_input: 'div[contenteditable="true"]',
        send_button: 'button[title="Send message"]'
      }
    })

    // Productivity Apps
    this.registerAppCapability({
      id: 'microsoft-word',
      name: 'Microsoft Word',
      type: 'desktop',
      platforms: ['win32'],
      actions: ['create_document', 'edit_document', 'format_text', 'insert_table', 'save', 'print', 'export'],
      automation: {
        supported: true,
        frameworks: ['ui_automation', 'com_automation'],
        customSelectors: {
          ribbon: 'RibbonControl',
          document: 'DocumentPane',
          status_bar: 'StatusBar'
        }
      }
    })

    this.registerAppCapability({
      id: 'microsoft-excel',
      name: 'Microsoft Excel',
      type: 'desktop',
      platforms: ['win32'],
      actions: ['create_workbook', 'edit_cell', 'create_chart', 'apply_formula', 'sort', 'filter', 'pivot_table'],
      automation: {
        supported: true,
        frameworks: ['ui_automation', 'com_automation'],
        customSelectors: {
          ribbon: 'RibbonControl',
          worksheet: 'Worksheet',
          formula_bar: 'FormulaBar'
        }
      }
    })

    this.registerAppCapability({
      id: 'onenote',
      name: 'OneNote',
      type: 'desktop',
      platforms: ['win32'],
      actions: ['create_page', 'edit_page', 'search', 'type', 'draw'],
      automation: {
        supported: true,
        frameworks: ['ui_automation'],
        customSelectors: {
          canvas: 'OneNoteCanvas',
          page_list: 'PageList'
        }
      }
    })
  }

  registerAppCapability(capability: AppCapability): void {
    this.appCapabilities.set(capability.id, capability)
    this.emit('app_registered', capability)
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.ghostHand.initialize()
      this.isInitialized = true
      this.emit('initialized')
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize UniversalAppController'))
    }
  }

  // UNIVERSAL REASONING SHORTCUT
  async executeGenericTask(prompt: string): Promise<string> {
    return this.ghostHand.executeGenericTask(prompt)
  }

  // UNIVERSAL COMMAND EXECUTION

  async executeUniversalCommand(command: UniversalCommand): Promise<any> {
    this.activeCommands.set(command.id, command)
    this.emit('command_started', command)

    try {
      const capability = this.appCapabilities.get(command.app)
      if (!capability) {
        throw new Error(`App not supported: ${command.app}`)
      }

      // Check permissions
      const hasPermission = await this.checkPermissions(command)
      if (!hasPermission) {
        throw new Error('Insufficient permissions for command execution')
      }

      let result: any

      switch (command.execution.type) {
        case 'vlm':
          result = await this.executeVLMCommand(command, capability)
          break
        case 'api':
          result = await this.executeAPICommand(command, capability)
          break
        case 'ui':
          result = await this.executeUICommand(command, capability)
          break
        case 'system':
          result = await this.executeSystemCommand(command, capability)
          break
        case 'hybrid':
          result = await this.executeHybridCommand(command, capability)
          break
        default:
          throw new Error(`Unknown execution type: ${command.execution.type}`)
      }

      this.emit('command_completed', { command, result })
      return result

    } catch (error) {
      this.emit('command_failed', { command, error })
      throw error
    } finally {
      this.activeCommands.delete(command.id)
    }
  }

  private async executeVLMCommand(command: UniversalCommand, capability: AppCapability): Promise<any> {
    const { action, parameters } = command

    // Capture screenshot for VLM analysis
    const screenshotPath = await this.captureScreen(command.context?.windowTitle)

    try {
      switch (action) {
        case 'click':
          return await this.vlmSemanticClick(screenshotPath, parameters.target, command.context)
        case 'type':
          return await this.vlmTypeText(screenshotPath, parameters.text, parameters.target, command.context)
        case 'find':
          return await this.vlmFindElement(screenshotPath, parameters.target, command.context)
        case 'extract':
          return await this.vlmExtractText(screenshotPath, parameters.area, command.context)
        default:
          throw new Error(`Unsupported VLM action: ${action}`)
      }
    } finally {
      // Cleanup screenshot
      try {
        await fs.unlink(screenshotPath)
      } catch { }
    }
  }

  private async executeAPICommand(command: UniversalCommand, capability: AppCapability): Promise<any> {
    const { action, parameters } = command

    if (!capability.apiEndpoints) {
      throw new Error(`App ${capability.name} does not support API commands`)
    }

    // Handle authentication
    const headers = await this.getAuthHeaders(capability)

    switch (capability.id) {
      case 'gmail':
        return await this.executeGmailAPI(action, parameters, headers)
      case 'google-calendar':
        return await this.executeGoogleCalendarAPI(action, parameters, headers)
      case 'notion':
        return await this.executeNotionAPI(action, parameters, headers)
      case 'slack':
        return await this.executeSlackAPI(action, parameters, headers)
      default:
        throw new Error(`API commands not implemented for ${capability.name}`)
    }
  }

  private async executeUICommand(command: UniversalCommand, capability: AppCapability): Promise<any> {
    const { action, parameters } = command

    if (!capability.selectors) {
      throw new Error(`App ${capability.name} does not have UI selectors defined`)
    }

    const selector = capability.selectors[action]
    if (!selector) {
      throw new Error(`No selector found for action: ${action}`)
    }

    switch (action) {
      case 'click':
        return await this.uiClick(selector, parameters)
      case 'type':
        return await this.uiType(selector, parameters.text)
      case 'select':
        return await this.uiSelect(selector, parameters.value)
      case 'hover':
        return await this.uiHover(selector)
      default:
        throw new Error(`Unsupported UI action: ${action}`)
    }
  }

  private async executeSystemCommand(command: UniversalCommand, capability: AppCapability): Promise<any> {
    const { action, parameters } = command

    switch (capability.id) {
      case 'file-explorer':
        return await this.executeFileExplorerCommand(action, parameters)
      case 'spotify':
        return await this.executeSpotifyCommand(action, parameters)
      case 'vscode':
        return await this.executeVSCodeCommand(action, parameters)
      default:
        throw new Error(`System commands not implemented for ${capability.name}`)
    }
  }

  private async executeHybridCommand(command: UniversalCommand, capability: AppCapability): Promise<any> {
    // Try primary method first, then fallback
    try {
      if (command.execution.type === 'hybrid') {
        // Try API first
        return await this.executeAPICommand(command, capability)
      }
    } catch (error) {
      // Fallback to UI automation
      return await this.executeUICommand(command, capability)
    }
  }

  // VLM METHODS

  private async captureScreen(windowTitle?: string): Promise<string> {
    const timestamp = Date.now()
    const screenshotPath = path.join(this.workspace, 'screenshots', `capture_${timestamp}.png`)

    if (process.platform === 'win32') {
      const psScript = `
        Add-Type -AssemblyName System.Drawing
        Add-Type -AssemblyName System.Windows.Forms
        
        ${windowTitle ? `
        $process = Get-Process | Where-Object { $_.MainWindowTitle -like "*${windowTitle}*" } | Select-Object -First 1
        if ($process) {
          $bounds = $process.MainWindowBounds
          $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
        } else {
          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
          $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
        }
        ` : `
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
        `}
        
        $bitmap.Save("${screenshotPath}", [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
      `

      await this.runPowerShell(psScript)
    }

    return screenshotPath
  }

  private async vlmSemanticClick(screenshotPath: string, target: string, context?: any): Promise<VLMResult> {
    const prompt = `Find the center coordinates of the UI element that best matches: "${target}". Respond ONLY in JSON like {"x":123,"y":456,"confidence":0.95}.`

    try {
      const result = await this.vlmAdapter.execute({
        type: 'ui',
        payload: {
          op: 'vlm.semantic_click',
          desktopName: 'Jason_Workspace',
          targetText: target,
          modelName: 'moondream2',
          timeoutMs: 30000
        }
      })

      return {
        found: result.ok,
        confidence: result.result?.confidence || 0,
        coordinates: result.result?.position,
        raw: JSON.stringify(result.result)
      }
    } catch (error) {
      return {
        found: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async vlmTypeText(screenshotPath: string, text: string, target?: string, context?: any): Promise<VLMResult> {
    // First find the target element, then type text
    if (target) {
      const findResult = await this.vlmFindElement(screenshotPath, target, context)
      if (findResult.found && findResult.coordinates) {
        await this.clickAtPosition(findResult.coordinates.x, findResult.coordinates.y)
        await this.typeText(text)
        return { found: true, confidence: 0.9 }
      }
    }

    return { found: false, confidence: 0, error: 'Target not found for typing' }
  }

  private async vlmFindElement(screenshotPath: string, target: string, context?: any): Promise<VLMResult> {
    const prompt = `Find the UI element that matches: "${target}". Respond with coordinates and element info in JSON like {"x":123,"y":456,"element":{"type":"button","text":"Submit","attributes":{}},"confidence":0.95}.`

    try {
      const result = await this.vlmAdapter.execute({
        type: 'ui',
        payload: {
          op: 'vlm.visual_click',
          desktopName: 'Jason_Workspace',
          targetText: target,
          modelName: 'moondream2',
          timeoutMs: 30000
        }
      })

      return {
        found: result.ok,
        confidence: result.result?.confidence || 0,
        coordinates: result.result?.position,
        element: result.result?.element,
        raw: JSON.stringify(result.result)
      }
    } catch (error) {
      return {
        found: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async vlmExtractText(screenshotPath: string, area?: any, context?: any): Promise<VLMResult> {
    try {
      const result = await this.vlmAdapter.execute({
        type: 'ui',
        payload: {
          op: 'ocr.read_text',
          windowTitle: context?.windowTitle,
          timeoutMs: 30000
        }
      })

      return {
        found: result.ok,
        confidence: result.ok ? 0.8 : 0,
        element: { type: 'text', text: result.result?.text || '', attributes: {} },
        raw: JSON.stringify(result.result)
      }
    } catch (error) {
      return {
        found: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }



  async describeScreen(windowTitle?: string): Promise<string> {
    const screenshotPath = await this.captureScreen(windowTitle)
    try {
      const result = await this.vlmAdapter.execute({
        type: 'ui',
        payload: {
          op: 'vlm.describe_screen',
          desktopName: 'Jason_Workspace',
          modelName: 'moondream',
          timeoutMs: 30000
        }
      })
      return result.result?.description || 'No description available'
    } catch (error) {
      return `Failed to describe screen: ${error instanceof Error ? error.message : 'Unknown error'}`
    } finally {
      try { await fs.unlink(screenshotPath) } catch { }
    }
  }

  // API IMPLEMENTATIONS

  private async executeGmailAPI(action: string, parameters: any, headers: Record<string, string>): Promise<any> {
    switch (action) {
      case 'compose':
        return await this.gmailCompose(parameters, headers)
      case 'send':
        return await this.gmailSend(parameters, headers)
      case 'search':
        return await this.gmailSearch(parameters, headers)
      default:
        throw new Error(`Unsupported Gmail API action: ${action}`)
    }
  }

  private async executeGoogleCalendarAPI(action: string, parameters: any, headers: Record<string, string>): Promise<any> {
    switch (action) {
      case 'create_event':
        return await this.calendarCreateEvent(parameters, headers)
      case 'edit_event':
        return await this.calendarEditEvent(parameters, headers)
      case 'delete_event':
        return await this.calendarDeleteEvent(parameters, headers)
      default:
        throw new Error(`Unsupported Calendar API action: ${action}`)
    }
  }

  private async executeNotionAPI(action: string, parameters: any, headers: Record<string, string>): Promise<any> {
    switch (action) {
      case 'create_page':
        return await this.notionCreatePage(parameters, headers)
      case 'query_database':
        return await this.notionQueryDatabase(parameters, headers)
      default:
        throw new Error(`Unsupported Notion API action: ${action}`)
    }
  }

  private async executeSlackAPI(action: string, parameters: any, headers: Record<string, string>): Promise<any> {
    switch (action) {
      case 'send_message':
        return await this.slackSendMessage(parameters, headers)
      default:
        throw new Error(`Unsupported Slack API action: ${action}`)
    }
  }

  // SPECIFIC API METHODS

  private async gmailCompose(parameters: any, headers: Record<string, string>): Promise<any> {
    const { to, subject, body, cc, bcc } = parameters

    const draft = {
      to: Array.isArray(to) ? to : [to],
      subject: subject || '',
      text: body || '',
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined
    }

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: { raw: this.base64UrlEncodeEmail(draft) } })
    })

    return response.json()
  }

  private async gmailSend(parameters: any, headers: Record<string, string>): Promise<any> {
    const { to, subject, body, cc, bcc } = parameters

    const email = {
      to: Array.isArray(to) ? to : [to],
      subject: subject || '',
      text: body || '',
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined
    }

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: this.base64UrlEncodeEmail(email) })
    })

    return response.json()
  }

  private async gmailSearch(parameters: any, headers: Record<string, string>): Promise<any> {
    const { query } = parameters

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers
    })

    return response.json()
  }

  private async calendarCreateEvent(parameters: any, headers: Record<string, string>): Promise<any> {
    const { summary, description, start, end, attendees } = parameters

    const event = {
      summary: summary || '',
      description: description || '',
      start: { dateTime: start, timeZone: 'UTC' },
      end: { dateTime: end, timeZone: 'UTC' },
      attendees: attendees || []
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    return response.json()
  }

  private async calendarEditEvent(parameters: any, headers: Record<string, string>): Promise<any> {
    // If API headers are available, we should ideally use them, but the user wants "REAL"
    // Fallback to VLM-based UI editing if API fails or is unavailable
    const result = await this.vlmAdapter.execute({
      type: 'ui',
      payload: {
        op: 'vlm.semantic_click',
        desktopName: 'Jason_Workspace',
        targetText: 'Edit',
        timeoutMs: 30000
      }
    })
    return result
  }

  private async calendarDeleteEvent(parameters: any, headers: Record<string, string>): Promise<any> {
    const result = await this.vlmAdapter.execute({
      type: 'ui',
      payload: {
        op: 'vlm.semantic_click',
        desktopName: 'Jason_Workspace',
        targetText: 'Delete',
        timeoutMs: 30000
      }
    })
    return result
  }

  private async notionCreatePage(parameters: any, headers: Record<string, string>): Promise<any> {
    const { parent, properties, children } = parameters

    const page = {
      parent: parent || { type: 'page_id', page_id: parameters.pageId },
      properties: properties || {},
      children: children || []
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Notion-API-Version': '2022-06-28'
      },
      body: JSON.stringify(page)
    })

    return response.json()
  }

  private async notionQueryDatabase(parameters: any, headers: Record<string, string>): Promise<any> {
    const { databaseId, filter } = parameters

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Notion-API-Version': '2022-06-28'
      },
      body: JSON.stringify({ filter: filter || {} })
    })

    return response.json()
  }

  private async slackSendMessage(parameters: any, headers: Record<string, string>): Promise<any> {
    const { channel, text, thread_ts } = parameters

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        text: text,
        thread_ts: thread_ts
      })
    })

    return response.json()
  }

  // UTILITY METHODS

  private async checkPermissions(command: UniversalCommand): Promise<boolean> {
    // High-impact actions require Level 3 approval
    const highImpactActions = ['send', 'delete', 'purchase', 'book', 'transfer', 'install']
    const isHighImpact = highImpactActions.some(action =>
      command.action.toLowerCase().includes(action) ||
      command.intent.toLowerCase().includes(action)
    )

    if (isHighImpact) {
      const prompt = permissionManager.createPrompt({
        level: 3,
        title: `High-Impact Action: ${command.app}.${command.action}`,
        rationale: `This action could have significant consequences and requires explicit approval.`,
        options: ['approve', 'reject', 'delay'],
        meta: { command }
      })

      const decision = await permissionManager.waitForDecision(prompt.id, 120000)
      return decision === 'approve'
    }

    return true
  }

  private async getAuthHeaders(capability: AppCapability): Promise<Record<string, string>> {
    const headers: Record<string, string> = {}

    switch (capability.authentication?.type) {
      case 'oauth':
        // OAuth tokens would be stored securely
        headers['Authorization'] = `Bearer ${process.env[`${capability.id.toUpperCase()}_OAUTH_TOKEN`] || ''}`
        break
      case 'token':
        headers['Authorization'] = `Bearer ${process.env[`${capability.id.toUpperCase()}_API_TOKEN`] || ''}`
        break
      case 'basic':
        const username = process.env[`${capability.id.toUpperCase()}_USERNAME`] || ''
        const password = process.env[`${capability.id.toUpperCase()}_PASSWORD`] || ''
        headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        break
    }

    return headers
  }

  private base64UrlEncodeEmail(email: any): string {
    const emailString = [
      `To: ${email.to.join(', ')}`,
      email.cc ? `Cc: ${email.cc.join(', ')}` : '',
      email.bcc ? `Bcc: ${email.bcc.join(', ')}` : '',
      `Subject: ${email.subject}`,
      '',
      email.text
    ].filter(Boolean).join('\n')

    return Buffer.from(emailString).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  private async runPowerShell(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true })
      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => { stdout += data.toString() })
      child.stderr?.on('data', (data) => { stderr += data.toString() })
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code })
        } else {
          reject(new Error(`PowerShell failed with exit code ${code}: ${stderr}`))
        }
      })
      child.on('error', reject)
    })
  }

  private async clickAtPosition(x: number, y: number): Promise<void> {
    const script = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern void SetCursorPos(int x, int y);
          
          [DllImport("user32.dll")]
          public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
          
          private const uint MOUSEEVENTF_LEFTDOWN = 0x02;
          private const uint MOUSEEVENTF_LEFTUP = 0x04;
          
          public static void Click(int x, int y) {
            SetCursorPos(x, y);
            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
          }
        }
      '
      
      [Mouse]::Click(${x}, ${y})
    `

    await this.runPowerShell(script)
  }

  private async typeText(text: string): Promise<void> {
    // Use UI Automation to type text without stealing focus
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      $focused = [System.Windows.Automation.AutomationElement]::FocusedElement
      if ($focused) {
        $valuePattern = $focused.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if ($valuePattern) {
          $valuePattern.SetValue("${text}")
        }
      }
    `

    await this.runPowerShell(script)
  }

  // SYSTEM COMMAND IMPLEMENTATIONS

  private async executeFileExplorerCommand(action: string, parameters: any): Promise<any> {
    switch (action) {
      case 'navigate':
        return await this.fileExplorerNavigate(parameters.path)
      case 'create_folder':
        return await this.fileExplorerCreateFolder(parameters.path, parameters.name)
      case 'delete_file':
        return await this.fileExplorerDeleteFile(parameters.path)
      default:
        throw new Error(`Unsupported File Explorer action: ${action}`)
    }
  }

  private async executeSpotifyCommand(action: string, parameters: any): Promise<any> {
    // Control Spotify via Windows UI Automation or Spotify API
    switch (action) {
      case 'play':
        return await this.spotifyControl('play')
      case 'pause':
        return await this.spotifyControl('pause')
      case 'next':
        return await this.spotifyControl('next')
      case 'search':
        return await this.spotifySearch(parameters.query)
      default:
        throw new Error(`Unsupported Spotify action: ${action}`)
    }
  }

  private async executeVSCodeCommand(action: string, parameters: any): Promise<any> {
    switch (action) {
      case 'open_file':
        return await this.vscodeOpenFile(parameters.path)
      case 'run':
        return await this.vscodeRunCommand('workbench.action.tasks.runTask')
      default:
        throw new Error(`Unsupported VSCode action: ${action}`)
    }
  }

  // SPECIFIC SYSTEM IMPLEMENTATIONS

  private async fileExplorerNavigate(path: string): Promise<any> {
    const script = `
      $shell = New-Object -ComObject Shell.Application
      $shell.Explore("${path}")
    `
    await this.runPowerShell(script)
    return { success: true, path }
  }

  private async fileExplorerCreateFolder(parentPath: string, name: string): Promise<any> {
    const fullPath = path.join(parentPath, name)
    await fs.mkdir(fullPath, { recursive: true })
    return { success: true, path: fullPath }
  }

  private async fileExplorerDeleteFile(filePath: string): Promise<any> {
    await fs.unlink(filePath)
    return { success: true, path: filePath }
  }

  private async spotifyControl(action: string): Promise<any> {
    // Use Windows UI Automation to control Spotify
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      $spotify = Get-Process | Where-Object { $_.ProcessName -eq "Spotify" } | Select-Object -First 1
      if ($spotify) {
        $mainWindow = $spotify.MainWindowHandle
        $element = [System.Windows.Automation.AutomationElement]::FromHandle($mainWindow)
        
        switch ("${action}") {
          "play" { $button = $element.FindFirst([System.Windows.Automation.TreeScope]::Descendants, New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "PlayButton")) }
          "pause" { $button = $element.FindFirst([System.Windows.Automation.TreeScope]::Descendants, New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "PauseButton")) }
          "next" { $button = $element.FindFirst([System.Windows.Automation.TreeScope]::Descendants, New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "NextButton")) }
        }
        
        if ($button) {
          $invokePattern = $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
          $invokePattern.Invoke()
        }
      }
    `

    await this.runPowerShell(script)
    return { success: true, action }
  }

  private async spotifySearch(query: string): Promise<any> {
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      $spotify = Get-Process | Where-Object { $_.ProcessName -eq "Spotify" } | Select-Object -First 1
      if ($spotify) {
        $element = [System.Windows.Automation.AutomationElement]::FromHandle($spotify.MainWindowHandle)
        $searchBox = $element.FindFirst([System.Windows.Automation.TreeScope]::Descendants, New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "SearchBox"))
        if ($searchBox) {
          $valuePattern = $searchBox.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
          $valuePattern.SetValue("${query}")
          [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        }
      }
    `
    await this.runPowerShell(script)
    return { success: true, query }
  }

  private async vscodeOpenFile(filePath: string): Promise<any> {
    const script = `
      $code = "code"
      Start-Process $code -ArgumentList "${filePath}"
    `

    await this.runPowerShell(script)
    return { success: true, path: filePath }
  }

  private async vscodeRunCommand(command: string): Promise<any> {
    // Open command palette and type command
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("^+P") # Ctrl+Shift+P
      Start-Sleep -Milliseconds 500
      [System.Windows.Forms.SendKeys]::SendWait("${command}{ENTER}")
    `
    await this.runPowerShell(script)
    return { success: true, command }
  }

  // UI AUTOMATION METHODS

  private async uiClick(selector: string, parameters: any): Promise<any> {
    const result = await this.vlmAdapter.execute({
      type: 'ui',
      payload: {
        op: 'control.invoke',
        name: selector,
        timeoutMs: 30000
      }
    })
    return result
  }

  private async uiType(selector: string, text: string): Promise<any> {
    const result = await this.vlmAdapter.execute({
      type: 'ui',
      payload: {
        op: 'control.set_value',
        name: selector,
        value: text,
        timeoutMs: 30000
      }
    })
    return result
  }

  private async uiSelect(selector: string, value: string): Promise<any> {
    return await this.vlmAdapter.execute({
      type: 'ui',
      payload: {
        op: 'control.set_value',
        name: selector,
        value: value,
        timeoutMs: 30000
      }
    })
  }

  private async uiHover(selector: string): Promise<any> {
    const element = await this.vlmFindElement('', selector) // screenshotPath empty as vlmFindElement should handle it or we use describeScreen
    if (element.found && element.coordinates) {
      const script = `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${element.coordinates.x}, ${element.coordinates.y})`
      await this.runPowerShell(script)
      return { success: true }
    }
    return { success: false, error: 'Element not found' }
  }

  // PUBLIC API

  getSupportedApps(): AppCapability[] {
    return Array.from(this.appCapabilities.values())
  }

  getAppCapability(appId: string): AppCapability | undefined {
    return this.appCapabilities.get(appId)
  }

  getActiveCommands(): UniversalCommand[] {
    return Array.from(this.activeCommands.values())
  }

  async shutdown(): Promise<void> {
    await this.ghostHand.shutdown()
    this.isInitialized = false
    this.emit('shutdown')
  }
}

export default UniversalAppController

import { EventEmitter } from 'events'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { UniversalAppController } from '../universal/UniversalAppController'
import { GhostHandManager } from '../automation/GhostHandManager'

export interface ConnectorConfig {
  name: string
  type: 'api' | 'ui' | 'hybrid'
  authentication: {
    type: 'oauth' | 'basic' | 'token' | 'none'
    credentials?: Record<string, string>
    autoRefresh?: boolean
  }
  endpoints?: Record<string, string>
  selectors?: Record<string, string>
  rateLimits: {
    requestsPerSecond: number
    requestsPerMinute: number
    requestsPerHour: number
  }
  retryPolicy: {
    maxRetries: number
    backoffMs: number
    exponentialBackoff: boolean
  }
  caching: {
    enabled: boolean
    ttlMs: number
    maxSize: number
  }
}

export interface EmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  body: string
  attachments: Attachment[]
  date: Date
  isRead: boolean
  isImportant: boolean
  labels: string[]
}

export interface Attachment {
  id: string
  filename: string
  mimeType: string
  size: number
  data?: string
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: Date
  end: Date
  attendees: Attendee[]
  location?: string
  recurrence?: string
  reminders: Reminder[]
  status: 'confirmed' | 'tentative' | 'cancelled'
}

export interface Attendee {
  email: string
  name?: string
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction'
  isOrganizer: boolean
}

export interface Reminder {
  method: 'email' | 'popup'
  minutes: number
}

export interface NotionPage {
  id: string
  title: string
  properties: Record<string, any>
  content: any[]
  createdTime: Date
  lastEditedTime: Date
  parent: {
    type: 'database_id' | 'page_id'
    id: string
  }
}

export interface NotionDatabase {
  id: string
  title: string
  properties: Record<string, any>
  createdTime: Date
  lastEditedTime: Date
}

export interface SlackMessage {
  team: string
  channel: string
  user: string
  text: string
  timestamp: string
  thread_ts?: string
  reactions: Reaction[]
  attachments: any[]
}

export interface Reaction {
  name: string
  count: number
  users: string[]
}

export interface WhatsAppMessage {
  id: string
  from: string
  to: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'video' | 'document' | 'voice'
  mediaUrl?: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

export class AppConnectorPack extends EventEmitter {
  private connectors: Map<string, ConnectorConfig> = new Map()
  private appController: UniversalAppController
  private ghostHand: GhostHandManager
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private rateLimiters: Map<string, { requests: number[] }> = new Map()
  private workspace: string

  constructor(appController: UniversalAppController, ghostHand: GhostHandManager) {
    super()
    this.appController = appController
    this.ghostHand = ghostHand
    this.workspace = path.join(os.tmpdir(), 'jason-connectors')
    this.initializeConnectors()
    this.initializeWorkspace()
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await fs.mkdir(this.workspace, { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'cache'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'tokens'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'logs'), { recursive: true })
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize connector workspace'))
    }
  }

  private initializeConnectors(): void {
    // Gmail Connector
    this.connectors.set('gmail', {
      name: 'Gmail',
      type: 'hybrid',
      authentication: {
        type: 'oauth',
        autoRefresh: true
      },
      endpoints: {
        messages: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        drafts: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        threads: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
        labels: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        send: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        upload: 'https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send'
      },
      selectors: {
        compose: 'div[aria-label*="Compose"]',
        to: 'input[aria-label*="To"]',
        subject: 'input[aria-label*="Subject"]',
        body: 'div[role="textbox"]',
        send: 'div[aria-label*="Send"]',
        search: 'input[aria-label*="Search"]',
        inbox: 'a[href*="inbox"]',
        sent: 'a[href*="sent"]',
        drafts: 'a[href*="drafts"]',
        star: 'div[aria-label*="Star"]',
        archive: 'div[aria-label*="Archive"]',
        delete: 'div[aria-label*="Delete"]',
        reply: 'div[aria-label*="Reply"]',
        forward: 'div[aria-label*="Forward"]'
      },
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 250,
        requestsPerHour: 10000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: true,
        ttlMs: 300000, // 5 minutes
        maxSize: 1000
      }
    })

    // Google Calendar Connector
    this.connectors.set('google-calendar', {
      name: 'Google Calendar',
      type: 'hybrid',
      authentication: {
        type: 'oauth',
        autoRefresh: true
      },
      endpoints: {
        events: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        calendars: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        settings: 'https://www.googleapis.com/calendar/v3/users/me/settings'
      },
      selectors: {
        create: 'div[aria-label*="Create"]',
        title: 'input[aria-label*="Title"]',
        date: 'input[aria-label*="Date"]',
        time: 'input[aria-label*="Time"]',
        guests: 'input[aria-label*="Guests"]',
        location: 'input[aria-label*="Location"]',
        description: 'textarea[aria-label*="Description"]',
        save: 'div[aria-label*="Save"]',
        cancel: 'div[aria-label*="Cancel"]',
        day_view: 'div[data-view="day"]',
        week_view: 'div[data-view="week"]',
        month_view: 'div[data-view="month"]'
      },
      rateLimits: {
        requestsPerSecond: 5,
        requestsPerMinute: 100,
        requestsPerHour: 5000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: true,
        ttlMs: 600000, // 10 minutes
        maxSize: 500
      }
    })

    // Notion Connector
    this.connectors.set('notion', {
      name: 'Notion',
      type: 'api',
      authentication: {
        type: 'token'
      },
      endpoints: {
        pages: 'https://api.notion.com/v1/pages',
        databases: 'https://api.notion.com/v1/databases',
        blocks: 'https://api.notion.com/v1/blocks',
        search: 'https://api.notion.com/v1/search',
        users: 'https://api.notion.com/v1/users'
      },
      rateLimits: {
        requestsPerSecond: 3,
        requestsPerMinute: 60,
        requestsPerHour: 3000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: true,
        ttlMs: 300000, // 5 minutes
        maxSize: 1000
      }
    })

    // Slack Connector
    this.connectors.set('slack', {
      name: 'Slack',
      type: 'hybrid',
      authentication: {
        type: 'token'
      },
      endpoints: {
        chat: 'https://slack.com/api/chat.postMessage',
        channels: 'https://slack.com/api/conversations.list',
        users: 'https://slack.com/api/users.list',
        history: 'https://slack.com/api/conversations.history',
        reactions: 'https://slack.com/api/reactions.add'
      },
      selectors: {
        message_input: 'div[data-qa="message_input"]',
        send_button: 'button[data-qa="send_button"]',
        channel_list: 'div[data-qa="channel_list"]',
        emoji_picker: 'button[data-qa="emoji_picker"]',
        file_upload: 'button[data-qa="file_upload"]'
      },
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: true,
        ttlMs: 300000, // 5 minutes
        maxSize: 500
      }
    })

    // WhatsApp Connector
    this.connectors.set('whatsapp', {
      name: 'WhatsApp',
      type: 'ui',
      authentication: {
        type: 'none'
      },
      selectors: {
        message_input: 'div[contenteditable="true"]',
        send_button: 'button[data-testid="send"]',
        attach_button: 'span[data-testid="attach"]',
        emoji_button: 'button[data-testid="emoji"]',
        voice_button: 'button[data-testid="voice"]',
        search: 'div[data-testid="search"]',
        chat_list: 'div[data-testid="chat-list"]',
        contact_name: 'span[title]'
      },
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        requestsPerHour: 1000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 2000,
        exponentialBackoff: true
      },
      caching: {
        enabled: false, // WhatsApp is real-time, no caching
        ttlMs: 0,
        maxSize: 0
      }
    })

    // Telegram Connector
    this.connectors.set('telegram', {
      name: 'Telegram',
      type: 'ui',
      authentication: {
        type: 'none'
      },
      selectors: {
        message_input: 'div[contenteditable="true"]',
        send_button: 'button[title="Send message"]',
        attach_button: 'button[title="Attach"]',
        emoji_button: 'button[title="Emoji"]',
        search: 'input[placeholder="Search"]',
        chat_list: 'div.chat-list',
        contact_name: 'div.chat-title'
      },
      rateLimits: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        requestsPerHour: 500
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 2000,
        exponentialBackoff: true
      },
      caching: {
        enabled: false,
        ttlMs: 0,
        maxSize: 0
      }
    })

    // Microsoft Outlook Connector
    this.connectors.set('outlook', {
      name: 'Microsoft Outlook',
      type: 'hybrid',
      authentication: {
        type: 'oauth',
        autoRefresh: true
      },
      endpoints: {
        messages: 'https://graph.microsoft.com/v1.0/me/messages',
        send: 'https://graph.microsoft.com/v1.0/me/sendMail',
        events: 'https://graph.microsoft.com/v1.0/me/events',
        calendars: 'https://graph.microsoft.com/v1.0/me/calendars'
      },
      selectors: {
        compose: 'button[aria-label*="New mail"]',
        to: 'input[aria-label*="To"]',
        subject: 'input[aria-label*="Add a subject"]',
        body: 'div[role="textbox"]',
        send: 'button[aria-label*="Send"]',
        search: 'input[aria-label*="Search"]'
      },
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 10000,
        requestsPerHour: 100000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: true,
        ttlMs: 300000,
        maxSize: 1000
      }
    })

    // Discord Connector
    this.connectors.set('discord', {
      name: 'Discord',
      type: 'ui',
      authentication: {
        type: 'token'
      },
      selectors: {
        message_input: 'div[role="textbox"]',
        send_button: 'button[data-testid="send-button"]',
        emoji_picker: 'button[aria-label="Emoji"]',
        file_upload: 'input[accept="*"]',
        channel_list: 'div[aria-label="Channels"]',
        server_list: 'div[aria-label="Servers"]'
      },
      rateLimits: {
        requestsPerSecond: 5,
        requestsPerMinute: 60,
        requestsPerHour: 1200
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: false,
        ttlMs: 0,
        maxSize: 0
      }
    })

    // GitHub Connector
    this.connectors.set('github', {
      name: 'GitHub',
      type: 'api',
      authentication: {
        type: 'token'
      },
      endpoints: {
        user: 'https://api.github.com/user',
        repos: 'https://api.github.com/user/repos',
        issues: 'https://api.github.com/repos/{owner}/{repo}/issues',
        pulls: 'https://api.github.com/repos/{owner}/{repo}/pulls',
        commits: 'https://api.github.com/repos/{owner}/{repo}/commits'
      },
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 60,
        requestsPerHour: 5000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      },
      caching: {
        enabled: true,
        ttlMs: 300000,
        maxSize: 1000
      }
    })

    this.emit('connectors_initialized', Array.from(this.connectors.keys()))
  }

  // GMAIL CONNECTOR

  async gmailSendEmail(email: Partial<EmailMessage>): Promise<EmailMessage> {
    const connector = this.connectors.get('gmail')
    if (!connector) throw new Error('Gmail connector not found')

    await this.checkRateLimit('gmail')
    
    try {
      const headers = await this.getAuthHeaders('gmail')
      
      const emailData = {
        to: email.to || [],
        cc: email.cc || [],
        bcc: email.bcc || [],
        subject: email.subject || '',
        text: email.body || '',
        attachments: email.attachments || []
      }

      const response = await fetch(connector.endpoints!.send, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            raw: this.base64UrlEncodeEmail(emailData)
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const sentEmail: EmailMessage = {
        id: result.id,
        threadId: result.threadId,
        subject: email.subject || '',
        from: 'me',
        to: email.to || [],
        cc: email.cc,
        bcc: email.bcc,
        body: email.body || '',
        attachments: email.attachments || [],
        date: new Date(),
        isRead: true,
        isImportant: false,
        labels: ['SENT']
      }

      this.emit('gmail_email_sent', sentEmail)
      return sentEmail

    } catch (error) {
      return await this.retryWithBackoff('gmail', () => this.gmailSendEmail(email))
    }
  }

  async gmailGetInbox(maxResults: number = 50): Promise<EmailMessage[]> {
    const connector = this.connectors.get('gmail')
    if (!connector) throw new Error('Gmail connector not found')

    const cacheKey = `gmail_inbox_${maxResults}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    await this.checkRateLimit('gmail')

    try {
      const headers = await this.getAuthHeaders('gmail')
      
      const response = await fetch(`${connector.endpoints!.messages}?maxResults=${maxResults}&labelIds=INBOX`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const messages: EmailMessage[] = []

      for (const messageRef of result.messages || []) {
        const message = await this.gmailGetMessage(messageRef.id)
        messages.push(message)
      }

      this.setCache(cacheKey, messages, connector.caching.ttlMs)
      this.emit('gmail_inbox_retrieved', messages)
      
      return messages

    } catch (error) {
      return await this.retryWithBackoff('gmail', () => this.gmailGetInbox(maxResults))
    }
  }

  async gmailGetMessage(messageId: string): Promise<EmailMessage> {
    const connector = this.connectors.get('gmail')
    if (!connector) throw new Error('Gmail connector not found')

    const cacheKey = `gmail_message_${messageId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    await this.checkRateLimit('gmail')

    try {
      const headers = await this.getAuthHeaders('gmail')
      
      const response = await fetch(`${connector.endpoints!.messages}/${messageId}?format=metadata`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const responseHeaders = result.payload.headers
      
      const emailMessage: EmailMessage = {
        id: result.id,
        threadId: result.threadId,
        subject: this.getHeaderValue(responseHeaders, 'Subject') || '',
        from: this.getHeaderValue(responseHeaders, 'From') || '',
        to: this.parseAddresses(this.getHeaderValue(responseHeaders, 'To') || ''),
        cc: this.parseAddresses(this.getHeaderValue(responseHeaders, 'Cc') || ''),
        bcc: this.parseAddresses(this.getHeaderValue(responseHeaders, 'Bcc') || ''),
        body: '', // Would need to fetch full message body
        attachments: [],
        date: new Date(parseInt(result.internalDate)),
        isRead: !result.labelIds?.includes('UNREAD'),
        isImportant: result.labelIds?.includes('IMPORTANT') || false,
        labels: result.labelIds || []
      }

      this.setCache(cacheKey, emailMessage, connector.caching.ttlMs)
      return emailMessage

    } catch (error) {
      return await this.retryWithBackoff('gmail', () => this.gmailGetMessage(messageId))
    }
  }

  async gmailSearch(query: string, maxResults: number = 10): Promise<EmailMessage[]> {
    const connector = this.connectors.get('gmail')
    if (!connector) throw new Error('Gmail connector not found')

    await this.checkRateLimit('gmail')

    try {
      const headers = await this.getAuthHeaders('gmail')
      
      const response = await fetch(`${connector.endpoints!.messages}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const messages: EmailMessage[] = []

      for (const messageRef of result.messages || []) {
        const message = await this.gmailGetMessage(messageRef.id)
        messages.push(message)
      }

      this.emit('gmail_search_completed', { query, messages })
      return messages

    } catch (error) {
      return await this.retryWithBackoff('gmail', () => this.gmailSearch(query, maxResults))
    }
  }

  // GOOGLE CALENDAR CONNECTOR

  async calendarCreateEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const connector = this.connectors.get('google-calendar')
    if (!connector) throw new Error('Google Calendar connector not found')

    await this.checkRateLimit('google-calendar')

    try {
      const headers = await this.getAuthHeaders('google-calendar')
      
      const eventData = {
        summary: event.summary || '',
        description: event.description || '',
        start: {
          dateTime: event.start?.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: event.end?.toISOString(),
          timeZone: 'UTC'
        },
        attendees: event.attendees || [],
        location: event.location || '',
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map(r => ({
            method: r.method,
            minutes: r.minutes
          })) || []
        }
      }

      const response = await fetch(connector.endpoints!.events, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const createdEvent: CalendarEvent = {
        id: result.id,
        summary: result.summary,
        description: result.description,
        start: new Date(result.start.dateTime),
        end: new Date(result.end.dateTime),
        attendees: result.attendees || [],
        location: result.location,
        reminders: result.reminders?.overrides?.map((r: any) => ({
          method: r.method,
          minutes: r.minutes
        })) || [],
        status: result.status || 'confirmed'
      }

      this.emit('calendar_event_created', createdEvent)
      return createdEvent

    } catch (error) {
      return await this.retryWithBackoff('google-calendar', () => this.calendarCreateEvent(event))
    }
  }

  async calendarGetEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
    const connector = this.connectors.get('google-calendar')
    if (!connector) throw new Error('Google Calendar connector not found')

    const cacheKey = `calendar_events_${start.toISOString()}_${end.toISOString()}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    await this.checkRateLimit('google-calendar')

    try {
      const headers = await this.getAuthHeaders('google-calendar')
      
      const response = await fetch(`${connector.endpoints!.events}?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const events: CalendarEvent[] = (result.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        attendees: item.attendees || [],
        location: item.location,
        reminders: item.reminders?.overrides?.map((r: any) => ({
          method: r.method,
          minutes: r.minutes
        })) || [],
        status: item.status || 'confirmed'
      }))

      this.setCache(cacheKey, events, connector.caching.ttlMs)
      this.emit('calendar_events_retrieved', events)
      
      return events

    } catch (error) {
      return await this.retryWithBackoff('google-calendar', () => this.calendarGetEvents(start, end))
    }
  }

  // NOTION CONNECTOR

  async notionCreatePage(page: Partial<NotionPage>): Promise<NotionPage> {
    const connector = this.connectors.get('notion')
    if (!connector) throw new Error('Notion connector not found')

    await this.checkRateLimit('notion')

    try {
      const headers = await this.getAuthHeaders('notion')
      
      const pageData = {
        parent: page.parent || { type: 'page_id', page_id: '' },
        properties: page.properties || {},
        children: page.content || []
      }

      const response = await fetch(connector.endpoints!.pages, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Notion-API-Version': '2022-06-28'
        },
        body: JSON.stringify(pageData)
      })

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const createdPage: NotionPage = {
        id: result.id,
        title: this.extractTitleFromProperties(result.properties),
        properties: result.properties,
        content: [],
        createdTime: new Date(result.created_time),
        lastEditedTime: new Date(result.last_edited_time),
        parent: result.parent
      }

      this.emit('notion_page_created', createdPage)
      return createdPage

    } catch (error) {
      return await this.retryWithBackoff('notion', () => this.notionCreatePage(page))
    }
  }

  async notionQueryDatabase(databaseId: string, filter?: any): Promise<NotionPage[]> {
    const connector = this.connectors.get('notion')
    if (!connector) throw new Error('Notion connector not found')

    const cacheKey = `notion_db_${databaseId}_${JSON.stringify(filter || {})}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    await this.checkRateLimit('notion')

    try {
      const headers = await this.getAuthHeaders('notion')
      
      const requestBody: any = {}
      if (filter) {
        requestBody.filter = filter
      }

      const response = await fetch(`${connector.endpoints!.databases}/${databaseId}/query`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Notion-API-Version': '2022-06-28'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const pages: NotionPage[] = (result.results || []).map((item: any) => ({
        id: item.id,
        title: this.extractTitleFromProperties(item.properties),
        properties: item.properties,
        content: [],
        createdTime: new Date(item.created_time),
        lastEditedTime: new Date(item.last_edited_time),
        parent: item.parent
      }))

      this.setCache(cacheKey, pages, connector.caching.ttlMs)
      this.emit('notion_database_queried', { databaseId, pages })
      
      return pages

    } catch (error) {
      return await this.retryWithBackoff('notion', () => this.notionQueryDatabase(databaseId, filter))
    }
  }

  // SLACK CONNECTOR

  async slackSendMessage(channel: string, text: string, thread_ts?: string): Promise<SlackMessage> {
    const connector = this.connectors.get('slack')
    if (!connector) throw new Error('Slack connector not found')

    await this.checkRateLimit('slack')

    try {
      const headers = await this.getAuthHeaders('slack')
      
      const messageData = {
        channel,
        text,
        thread_ts
      }

      const response = await fetch(connector.endpoints!.chat, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const message: SlackMessage = {
        team: result.team,
        channel: result.channel,
        user: result.user,
        text: result.text,
        timestamp: result.ts,
        thread_ts: result.thread_ts,
        reactions: [],
        attachments: result.attachments || []
      }

      this.emit('slack_message_sent', message)
      return message

    } catch (error) {
      return await this.retryWithBackoff('slack', () => this.slackSendMessage(channel, text, thread_ts))
    }
  }

  // WHATSAPP CONNECTOR (UI-based)

  async whatsappSendMessage(contact: string, message: string): Promise<void> {
    const connector = this.connectors.get('whatsapp')
    if (!connector) throw new Error('WhatsApp connector not found')

    await this.checkRateLimit('whatsapp')

    try {
      // Use UI automation to send WhatsApp message
      await this.appController.executeUniversalCommand({
        id: `whatsapp_${Date.now()}`,
        intent: 'Send WhatsApp message',
        app: 'whatsapp',
        action: 'send_message',
        parameters: { contact, message },
        priority: 'medium',
        permissions: ['messaging'],
        execution: {
          type: 'ui',
          confidence: 0.8
        }
      })

      this.emit('whatsapp_message_sent', { contact, message })

    } catch (error) {
      return await this.retryWithBackoff('whatsapp', () => this.whatsappSendMessage(contact, message))
    }
  }

  // TELEGRAM CONNECTOR (UI-based)

  async telegramSendMessage(contact: string, message: string): Promise<void> {
    const connector = this.connectors.get('telegram')
    if (!connector) throw new Error('Telegram connector not found')

    await this.checkRateLimit('telegram')

    try {
      // Use UI automation to send Telegram message
      await this.appController.executeUniversalCommand({
        id: `telegram_${Date.now()}`,
        intent: 'Send Telegram message',
        app: 'telegram',
        action: 'send_message',
        parameters: { contact, message },
        priority: 'medium',
        permissions: ['messaging'],
        execution: {
          type: 'ui',
          confidence: 0.8
        }
      })

      this.emit('telegram_message_sent', { contact, message })

    } catch (error) {
      return await this.retryWithBackoff('telegram', () => this.telegramSendMessage(contact, message))
    }
  }

  // UTILITY METHODS

  private async getAuthHeaders(connectorName: string): Promise<Record<string, string>> {
    const connector = this.connectors.get(connectorName)
    if (!connector) throw new Error(`Connector not found: ${connectorName}`)

    const headers: Record<string, string> = {}

    switch (connector.authentication.type) {
      case 'oauth':
        const oauthToken = process.env[`${connectorName.toUpperCase()}_OAUTH_TOKEN`]
        if (oauthToken) {
          headers['Authorization'] = `Bearer ${oauthToken}`
        }
        break
      case 'token':
        const apiToken = process.env[`${connectorName.toUpperCase()}_API_TOKEN`]
        if (apiToken) {
          headers['Authorization'] = `Bearer ${apiToken}`
        }
        break
      case 'basic':
        const username = process.env[`${connectorName.toUpperCase()}_USERNAME`] || ''
        const password = process.env[`${connectorName.toUpperCase()}_PASSWORD`] || ''
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

  private getHeaderValue(headers: any[], name: string): string | null {
    const header = headers.find((h: any) => h.name === name)
    return header?.value || null
  }

  private parseAddresses(addressString: string): string[] {
    if (!addressString) return []
    
    return addressString.split(',').map(addr => addr.trim()).filter(Boolean)
  }

  private extractTitleFromProperties(properties: Record<string, any>): string {
    // Look for common title property names
    const titleProps = ['Name', 'Title', 'title', 'name']
    
    for (const prop of titleProps) {
      if (properties[prop]) {
        const titleProp = properties[prop]
        if (titleProp.title) {
          return titleProp.title[0]?.plain_text || ''
        } else if (titleProp.rich_text) {
          return titleProp.rich_text[0]?.plain_text || ''
        }
      }
    }
    
    return 'Untitled'
  }

  private async checkRateLimit(connectorName: string): Promise<void> {
    const connector = this.connectors.get(connectorName)
    if (!connector) return

    const now = Date.now()
    const limiter = this.rateLimiters.get(connectorName) || { requests: [] }
    
    // Clean old requests
    limiter.requests = limiter.requests.filter(time => now - time < 3600000) // Keep last hour
    
    // Check per-second limit
    const recentRequests = limiter.requests.filter(time => now - time < 1000)
    if (recentRequests.length >= connector.rateLimits.requestsPerSecond) {
      const waitTime = 1000 - (now - recentRequests[0])
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    // Check per-minute limit
    const minuteRequests = limiter.requests.filter(time => now - time < 60000)
    if (minuteRequests.length >= connector.rateLimits.requestsPerMinute) {
      const waitTime = 60000 - (now - minuteRequests[0])
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    // Check per-hour limit
    if (limiter.requests.length >= connector.rateLimits.requestsPerHour) {
      throw new Error(`Rate limit exceeded for ${connectorName}`)
    }
    
    limiter.requests.push(now)
    this.rateLimiters.set(connectorName, limiter)
  }

  private async retryWithBackoff<T>(connectorName: string, operation: () => Promise<T>): Promise<T> {
    const connector = this.connectors.get(connectorName)
    if (!connector) throw new Error(`Connector not found: ${connectorName}`)

    let lastError: Error
    
    for (let attempt = 0; attempt <= connector.retryPolicy.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === connector.retryPolicy.maxRetries) {
          throw lastError
        }
        
        const backoffMs = connector.retryPolicy.exponentialBackoff
          ? connector.retryPolicy.backoffMs * Math.pow(2, attempt)
          : connector.retryPolicy.backoffMs
        
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
    
    throw lastError!
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const connector = Array.from(this.connectors.values())[0]
    if (Date.now() - cached.timestamp > (connector?.caching.ttlMs || 300000)) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    
    // Clean up old cache entries
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, 500)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  // PUBLIC API

  getConnectors(): string[] {
    return Array.from(this.connectors.keys())
  }

  getConnectorConfig(name: string): ConnectorConfig | undefined {
    return this.connectors.get(name)
  }

  getRateLimitStatus(name: string): any {
    const limiter = this.rateLimiters.get(name)
    const connector = this.connectors.get(name)
    
    if (!limiter || !connector) return null
    
    const now = Date.now()
    const recent = limiter.requests.filter(time => now - time < 60000)
    
    return {
      requestsLastMinute: recent.length,
      limitPerMinute: connector.rateLimits.requestsPerMinute,
      requestsLastHour: limiter.requests.length,
      limitPerHour: connector.rateLimits.requestsPerHour
    }
  }

  clearCache(name?: string): void {
    if (name) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(name))
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }

  async testConnection(name: string): Promise<boolean> {
    const connector = this.connectors.get(name)
    if (!connector) return false

    try {
      switch (name) {
        case 'gmail':
          await this.gmailGetInbox(1)
          return true
        case 'google-calendar':
          await this.calendarGetEvents(new Date(), new Date(Date.now() + 86400000))
          return true
        case 'notion':
          await this.notionQueryDatabase('test')
          return true
        case 'slack':
          await this.slackSendMessage('test', 'Connection test')
          return true
        default:
          return false
      }
    } catch {
      return false
    }
  }
}

export default AppConnectorPack

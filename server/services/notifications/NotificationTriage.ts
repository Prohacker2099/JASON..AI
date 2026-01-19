import { connectorManager } from '../connectors/ConnectorManager'
import { generateWithMistral } from '../ai/mistral/MistralClient'
// import { usptEngine } from '../ai/uspt/USPTEngine' // Module not found - commented out
import * as fs from 'fs/promises'
import * as path from 'path'

export interface NotificationItem {
  id: string
  type: 'email' | 'calendar' | 'slack' | 'whatsapp' | 'system'
  source: string
  subject: string
  content: string
  sender: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  actionRequired?: boolean
  deadline?: Date
  metadata?: any
}

export interface TriageResult {
  notifications: NotificationItem[]
  summary: string
  urgentItems: NotificationItem[]
  actionItems: NotificationItem[]
  autoReplies: Array<{
    notificationId: string
    reply: string
    confidence: number
    shouldSend: boolean
  }>
  recommendations: string[]
  estimatedProcessingTime: number
}

export interface NotificationRule {
  id: string
  name: string
  conditions: {
    type?: string[]
    source?: string[]
    sender?: string[]
    keywords?: string[]
    priority?: string[]
  }
  actions: {
    priority?: string
    category?: string
    autoReply?: boolean
    forwardTo?: string
    archive?: boolean
    flag?: boolean
    actionRequired?: boolean
  }
  enabled: boolean
}

export class NotificationTriage {
  private rules: NotificationRule[] = []
  private userId: string

  constructor(userId: string = 'default') {
    this.userId = userId
    this.loadDefaultRules()
  }

  private loadDefaultRules(): void {
    this.rules = [
      {
        id: 'urgent_emails',
        name: 'Urgent Email Detection',
        conditions: {
          type: ['email'],
          keywords: ['urgent', 'asap', 'immediately', 'emergency', 'critical'],
          priority: ['high']
        },
        actions: {
          priority: 'urgent',
          flag: true,
          autoReply: false
        },
        enabled: true
      },
      {
        id: 'meeting_invitations',
        name: 'Meeting Invitations',
        conditions: {
          type: ['calendar'],
          keywords: ['meeting', 'invite', 'schedule', 'appointment']
        },
        actions: {
          category: 'calendar',
          autoReply: true
        },
        enabled: true
      },
      {
        id: 'work_notifications',
        name: 'Work Notifications',
        conditions: {
          source: ['slack', 'teams', 'work-email'],
          type: ['slack', 'email']
        },
        actions: {
          category: 'work',
          autoReply: false
        },
        enabled: true
      },
      {
        id: 'personal_messages',
        name: 'Personal Messages',
        conditions: {
          type: ['whatsapp', 'personal-email'],
          keywords: ['family', 'personal', 'friend']
        },
        actions: {
          category: 'personal',
          priority: 'medium'
        },
        enabled: true
      },
      {
        id: 'promotions',
        name: 'Promotional Content',
        conditions: {
          keywords: ['sale', 'discount', 'offer', 'promotion', 'deal'],
          sender: ['noreply', 'marketing', 'promo']
        },
        actions: {
          priority: 'low',
          category: 'promotions',
          archive: true
        },
        enabled: true
      }
    ]
  }

  async triageNotifications(): Promise<TriageResult> {
    try {
      // 1. Fetch notifications from all connected sources
      const notifications = await this.fetchAllNotifications()

      // 2. Apply rules and classify
      const classifiedNotifications = await this.applyRules(notifications)

      // 3. Prioritize and categorize
      const triagedNotifications = await this.prioritizeNotifications(classifiedNotifications)

      // 4. Generate auto-replies using USPT
      const autoReplies = await this.generateAutoReplies(triagedNotifications)

      // 5. Generate summary and recommendations
      const summary = await this.generateSummary(triagedNotifications, autoReplies)

      // 6. Execute actions (send replies, archive, etc.)
      await this.executeTriageActions(triagedNotifications, autoReplies)

      return {
        notifications: triagedNotifications,
        summary: summary.summary,
        urgentItems: triagedNotifications.filter(n => n.priority === 'urgent'),
        actionItems: triagedNotifications.filter(n => n.actionRequired),
        autoReplies: autoReplies.filter(reply => reply.shouldSend),
        recommendations: summary.recommendations,
        estimatedProcessingTime: summary.estimatedTime
      }
    } catch (error) {
      console.error('Notification triage failed:', error)
      throw new Error('Unable to complete notification triage')
    }
  }

  private async fetchAllNotifications(): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = []

    // Fetch from Gmail/Outlook
    try {
      if (await connectorManager.isConnected(this.userId, 'google')) {
        const gmailNotifications = await this.fetchGmailNotifications()
        notifications.push(...gmailNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch Gmail notifications:', error)
    }

    try {
      if (await connectorManager.isConnected(this.userId, 'outlook')) {
        const outlookNotifications = await this.fetchOutlookNotifications()
        notifications.push(...outlookNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch Outlook notifications:', error)
    }

    // Fetch from Slack
    try {
      if (await connectorManager.isConnected(this.userId, 'slack')) {
        const slackNotifications = await this.fetchSlackNotifications()
        notifications.push(...slackNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch Slack notifications:', error)
    }

    // Fetch from Calendar
    try {
      if (await connectorManager.isConnected(this.userId, 'google')) {
        const calendarNotifications = await this.fetchCalendarNotifications()
        notifications.push(...calendarNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch calendar notifications:', error)
    }

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private async fetchGmailNotifications(): Promise<NotificationItem[]> {
    const messages = await connectorManager.execute({
      userId: this.userId,
      providerId: 'google',
      operation: 'getMessages',
      params: { limit: 50 }
    })

    return messages.map((msg: any) => ({
      id: msg.id,
      type: 'email' as const,
      source: 'gmail',
      subject: msg.subject || '(No Subject)',
      content: msg.snippet || '',
      sender: msg.from?.emailAddress || 'Unknown',
      timestamp: new Date(msg.receivedDateTime),
      priority: this.extractPriorityFromSubject(msg.subject),
      actionRequired: this.needsAction(msg.subject, msg.snippet),
      metadata: msg
    }))
  }

  private async fetchOutlookNotifications(): Promise<NotificationItem[]> {
    const messages = await connectorManager.execute({
      userId: this.userId,
      providerId: 'outlook',
      operation: 'getMessages',
      params: { limit: 50 }
    })

    return messages.map((msg: any) => ({
      id: msg.id,
      type: 'email' as const,
      source: 'outlook',
      subject: msg.subject || '(No Subject)',
      content: msg.body?.content || '',
      sender: msg.from?.emailAddress?.address || 'Unknown',
      timestamp: new Date(msg.receivedDateTime),
      priority: this.extractPriorityFromSubject(msg.subject),
      actionRequired: this.needsAction(msg.subject, msg.body?.content),
      metadata: msg
    }))
  }

  private async fetchSlackNotifications(): Promise<NotificationItem[]> {
    const channels = await connectorManager.execute({
      userId: this.userId,
      providerId: 'slack',
      operation: 'getChannels',
      params: {}
    })

    const notifications: NotificationItem[] = []

    for (const channel of channels.slice(0, 5)) {
      try {
        const messages = await connectorManager.execute({
          userId: this.userId,
          providerId: 'slack',
          operation: 'getMessages',
          params: { channel: channel.id, limit: 20 }
        })

        messages.forEach((msg: any) => {
          if (msg.user !== this.userId && !msg.bot_id) {
            notifications.push({
              id: msg.ts,
              type: 'slack' as const,
              source: 'slack',
              subject: `#${channel.name}`,
              content: msg.text || '',
              sender: msg.user || 'Unknown',
              timestamp: new Date(parseFloat(msg.ts) * 1000),
              priority: this.extractPriorityFromText(msg.text),
              actionRequired: this.needsAction('', msg.text),
              metadata: { channel: channel.name, message: msg }
            })
          }
        })
      } catch (error) {
        console.error(`Failed to fetch messages from channel ${channel.name}:`, error)
      }
    }

    return notifications
  }

  private async fetchCalendarNotifications(): Promise<NotificationItem[]> {
    const events = await connectorManager.execute({
      userId: this.userId,
      providerId: 'google',
      operation: 'getEvents',
      params: { limit: 20 }
    })

    return events.map((event: any) => ({
      id: event.id,
      type: 'calendar' as const,
      source: 'google-calendar',
      subject: event.summary || 'Untitled Event',
      content: event.description || '',
      sender: event.creator?.email || 'Unknown',
      timestamp: new Date(event.created),
      priority: this.extractPriorityFromEvent(event),
      actionRequired: true,
      deadline: new Date(event.start?.dateTime || event.start?.date),
      metadata: event
    }))
  }

  private async applyRules(notifications: NotificationItem[]): Promise<NotificationItem[]> {
    return notifications.map(notification => {
      let updatedNotification = { ...notification }

      for (const rule of this.rules.filter(r => r.enabled)) {
        if (this.matchesRule(notification, rule)) {
          updatedNotification = this.applyRuleActions(updatedNotification, rule)
        }
      }

      return updatedNotification
    })
  }

  private matchesRule(notification: NotificationItem, rule: NotificationRule): boolean {
    const conditions = rule.conditions

    if (conditions.type && !conditions.type.includes(notification.type)) return false
    if (conditions.source && !conditions.source.includes(notification.source)) return false
    if (conditions.sender && !conditions.sender.some(s => notification.sender.toLowerCase().includes(s.toLowerCase()))) return false
    if (conditions.priority && !conditions.priority.includes(notification.priority)) return false

    if (conditions.keywords) {
      const text = `${notification.subject} ${notification.content}`.toLowerCase()
      if (!conditions.keywords.some(keyword => text.includes(keyword.toLowerCase()))) return false
    }

    return true
  }

  private applyRuleActions(notification: NotificationItem, rule: NotificationRule): NotificationItem {
    const updated = { ...notification }

    if (rule.actions.priority) updated.priority = rule.actions.priority as any
    if (rule.actions.category) updated.category = rule.actions.category
    if (rule.actions.actionRequired !== undefined) updated.actionRequired = rule.actions.actionRequired

    return updated
  }

  private async prioritizeNotifications(notifications: NotificationItem[]): Promise<NotificationItem[]> {
    // Use AI to prioritize and categorize notifications
    const prioritizationPrompt = `
Analyze and prioritize these notifications. For each notification, assign:
1. Priority level (urgent, high, medium, low)
2. Category (work, personal, promotions, calendar, etc.)
3. Action required (true/false)
4. Brief reason for priority

Notifications:
${JSON.stringify(notifications.slice(0, 20), null, 2)}

Return as JSON array with updated priorities and categories.`

    try {
      const aiResponse = await generateWithMistral(
        'You are an intelligent notification assistant. Prioritize notifications based on urgency and importance.',
        prioritizationPrompt
      )

      const prioritizedNotifications = JSON.parse(aiResponse)
      return prioritizedNotifications.map((updated: any, index: number) => ({
        ...notifications[index],
        ...updated
      }))
    } catch (error) {
      console.error('AI prioritization failed, using rule-based:', error)
      return notifications
    }
  }

  private async generateAutoReplies(notifications: NotificationItem[]): Promise<Array<{
    notificationId: string
    reply: string
    confidence: number
    shouldSend: boolean
  }>> {
    const autoReplies = []

    for (const notification of notifications) {
      if (notification.type === 'email' && notification.priority !== 'urgent') {
        try {
          // Use USPT to generate user-style response - commented out since module not found
          // const userStyle = await usptEngine.getUserStyle(this.userId)
          const userStyle = { tone: 'professional', formality: 'medium' } // Default style
          
          const replyPrompt = `
Generate a professional, brief auto-reply for this email:
Subject: ${notification.subject}
From: ${notification.sender}
Content: ${notification.content.substring(0, 200)}...

User style: ${JSON.stringify(userStyle)}

Reply should be:
- Professional and friendly
- Acknowledge receipt
- Indicate when to expect a detailed response
- Keep under 100 words
- Match user's communication style`

          const reply = await generateWithMistral(
            'You are writing email auto-replies in the user\'s style.',
            replyPrompt
          )

          autoReplies.push({
            notificationId: notification.id,
            reply,
            confidence: 0.8,
            shouldSend: notification.priority === 'low' || notification.priority === 'medium'
          })
        } catch (error) {
          console.error(`Failed to generate auto-reply for ${notification.id}:`, error)
        }
      }
    }

    return autoReplies
  }

  private async generateSummary(notifications: NotificationItem[], autoReplies: any[]): Promise<{
    summary: string
    recommendations: string[]
    estimatedTime: number
  }> {
    const urgentCount = notifications.filter(n => n.priority === 'urgent').length
    const actionCount = notifications.filter(n => n.actionRequired).length
    const autoReplyCount = autoReplies.filter(r => r.shouldSend).length

    const summaryPrompt = `
Generate a concise summary of today's notifications:
- Total notifications: ${notifications.length}
- Urgent items: ${urgentCount}
- Action required: ${actionCount}
- Auto-replies prepared: ${autoReplyCount}

Top urgent items:
${notifications.filter(n => n.priority === 'urgent').slice(0, 3).map(n => `- ${n.subject} from ${n.sender}`).join('\n')}

Create a 2-3 sentence summary and 3-4 actionable recommendations.`

    try {
      const response = await generateWithMistral(
        'You are a personal assistant summarizing daily notifications.',
        summaryPrompt
      )

      return {
        summary: response,
        recommendations: [
          'Review urgent emails first',
          'Approve suggested auto-replies',
          'Check calendar for upcoming meetings',
          'Archive promotional emails'
        ],
        estimatedTime: Math.max(5, notifications.length * 0.5)
      }
    } catch (error) {
      return {
        summary: `You have ${notifications.length} notifications, including ${urgentCount} urgent items requiring immediate attention.`,
        recommendations: ['Review urgent items', 'Process action items', 'Clear low-priority messages'],
        estimatedTime: 10
      }
    }
  }

  private async executeTriageActions(notifications: NotificationItem[], autoReplies: any[]): Promise<void> {
    // Send auto-replies
    for (const autoReply of autoReplies.filter(r => r.shouldSend)) {
      try {
        const notification = notifications.find(n => n.id === autoReply.notificationId)
        if (notification && notification.type === 'email') {
          await this.sendAutoReply(notification, autoReply.reply)
        }
      } catch (error) {
        console.error(`Failed to send auto-reply for ${autoReply.notificationId}:`, error)
      }
    }

    // Archive low-priority items
    const toArchive = notifications.filter(n => n.priority === 'low' && n.category === 'promotions')
    for (const notification of toArchive) {
      try {
        await this.archiveNotification(notification)
      } catch (error) {
        console.error(`Failed to archive ${notification.id}:`, error)
      }
    }
  }

  private async sendAutoReply(notification: NotificationItem, reply: string): Promise<void> {
    if (notification.source === 'gmail') {
      await connectorManager.execute({
        userId: this.userId,
        providerId: 'google',
        operation: 'sendEmail',
        params: {
          to: [notification.sender],
          subject: `Re: ${notification.subject}`,
          body: reply
        }
      })
    } else if (notification.source === 'outlook') {
      await connectorManager.execute({
        userId: this.userId,
        providerId: 'outlook',
        operation: 'sendEmail',
        params: {
          toRecipients: [notification.sender],
          subject: `Re: ${notification.subject}`,
          body: reply
        }
      })
    }
  }

  private async archiveNotification(notification: NotificationItem): Promise<void> {
    // Implementation depends on provider
    console.log(`Archiving notification ${notification.id}`)
  }

  private extractPriorityFromSubject(subject: string): 'low' | 'medium' | 'high' | 'urgent' {
    const text = subject.toLowerCase()
    if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) return 'urgent'
    if (text.includes('important') || text.includes('priority')) return 'high'
    if (text.includes('fyi') || text.includes('info')) return 'low'
    return 'medium'
  }

  private extractPriorityFromText(text: string): 'low' | 'medium' | 'high' | 'urgent' {
    return this.extractPriorityFromSubject(text)
  }

  private extractPriorityFromEvent(event: any): 'low' | 'medium' | 'high' | 'urgent' {
    const text = `${event.summary || ''} ${event.description || ''}`.toLowerCase()
    if (text.includes('urgent') || text.includes('deadline')) return 'urgent'
    if (text.includes('meeting') || text.includes('appointment')) return 'high'
    if (text.includes('reminder') || text.includes('note')) return 'low'
    return 'medium'
  }

  private needsAction(subject: string, content: string): boolean {
    const text = `${subject} ${content}`.toLowerCase()
    const actionKeywords = ['please', 'request', 'need', 'required', 'action', 'respond', 'reply', 'review', 'approve']
    return actionKeywords.some(keyword => text.includes(keyword))
  }

  addRule(rule: NotificationRule): void {
    this.rules.push(rule)
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId)
  }

  getRules(): NotificationRule[] {
    return this.rules
  }

  updateRule(ruleId: string, updates: Partial<NotificationRule>): void {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
    }
  }
}

export const notificationTriage = new NotificationTriage()

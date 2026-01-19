import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { AppConnectorPack } from '../connectors/AppConnectorPack'
import { SuperCreatorEngine } from '../content/SuperCreatorEngine'

export interface SearchQuery {
  query: string
  type: 'email' | 'calendar' | 'files' | 'web' | 'contacts' | 'all'
  filters?: SearchFilters
  priority: 'low' | 'medium' | 'high'
  maxResults?: number
  timeframe?: SearchTimeframe
}

export interface SearchFilters {
  sender?: string[]
  subject?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  hasAttachments?: boolean
  isUnread?: boolean
  isImportant?: boolean
  labels?: string[]
  keywords?: string[]
  excludeKeywords?: string[]
  fileTypes?: string[]
  sizeRange?: {
    min: number
    max: number
  }
}

export interface SearchTimeframe {
  type: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  start?: Date
  end?: Date
}

export interface SearchResult {
  id: string
  type: 'email' | 'calendar' | 'file' | 'contact' | 'web'
  title: string
  content: string
  summary: string
  relevanceScore: number
  metadata: Record<string, any>
  timestamp: Date
  source: string
  highlights: string[]
  actions: SearchResultAction[]
}

export interface SearchResultAction {
  type: 'open' | 'reply' | 'forward' | 'delete' | 'archive' | 'star' | 'download' | 'share'
  label: string
  icon?: string
  requiresConfirmation: boolean
}

export interface ComparisonRequest {
  items: ComparisonItem[]
  criteria: ComparisonCriteria[]
  type: 'products' | 'services' | 'prices' | 'features' | 'reviews' | 'custom'
  priority: 'low' | 'medium' | 'high'
}

export interface ComparisonItem {
  id: string
  name: string
  description?: string
  price?: number
  currency?: string
  features?: string[]
  rating?: number
  reviews?: number
  imageUrl?: string
  url?: string
  metadata?: Record<string, any>
}

export interface ComparisonCriteria {
  name: string
  weight: number
  type: 'numeric' | 'categorical' | 'boolean' | 'rating'
  description?: string
}

export interface ComparisonResult {
  id: string
  type: string
  items: RankedComparisonItem[]
  summary: string
  recommendation: ComparisonRecommendation
  createdAt: Date
  confidence: number
}

export interface RankedComparisonItem extends ComparisonItem {
  rank: number
  score: number
  breakdown: Record<string, number>
  pros: string[]
  cons: string[]
}

export interface ComparisonRecommendation {
  best: ComparisonItem
  reason: string
  alternatives: ComparisonItem[]
  confidence: number
}

export interface TriageRequest {
  source: 'email' | 'calendar' | 'notifications' | 'all'
  criteria: TriageCriteria
  actions: TriageAction[]
  priority: 'low' | 'medium' | 'high'
  dryRun?: boolean
}

export interface TriageCriteria {
  importance: 'high' | 'medium' | 'low' | 'auto'
  urgency: 'urgent' | 'normal' | 'low'
  senderPriority: Record<string, 'high' | 'medium' | 'low'>
  keywords: {
    important: string[]
    spam: string[]
    promotional: string[]
  }
  timeBased: {
    businessHours: boolean
    weekends: boolean
    responseTime: number // hours
  }
}

export interface TriageAction {
  type: 'archive' | 'delete' | 'star' | 'mark_read' | 'move_to_folder' | 'forward' | 'respond'
  conditions: TriageCondition[]
  parameters?: Record<string, any>
}

export interface TriageCondition {
  field: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex'
  value: string | number | boolean
}

export interface TriageResult {
  id: string
  source: string
  totalItems: number
  processedItems: number
  actions: TriageActionResult[]
  summary: string
  errors: string[]
  duration: number
  dryRun: boolean
}

export interface TriageActionResult {
  itemId: string
  action: string
  success: boolean
  reason?: string
}

export interface GlobalSearchIndex {
  documents: Map<string, SearchDocument>
  invertedIndex: Map<string, Set<string>>
  metadata: SearchMetadata
}

export interface SearchDocument {
  id: string
  content: string
  title: string
  type: string
  source: string
  timestamp: Date
  metadata: Record<string, any>
  embeddings?: number[]
}

export interface SearchMetadata {
  totalDocuments: number
  lastUpdated: Date
  indexSize: number
  averageDocumentLength: number
}

export class DigitalConcierge extends EventEmitter {
  private connectorPack: AppConnectorPack
  private contentEngine: SuperCreatorEngine
  private searchIndex: GlobalSearchIndex
  private workspace: string
  private isInitialized: boolean = false
  private userPreferences: UserPreferences
  private cache: Map<string, any> = new Map()

  constructor(connectorPack: AppConnectorPack, contentEngine: SuperCreatorEngine) {
    super()
    this.connectorPack = connectorPack
    this.contentEngine = contentEngine
    this.workspace = path.join(os.tmpdir(), 'jason-concierge')
    this.searchIndex = {
      documents: new Map(),
      invertedIndex: new Map(),
      metadata: {
        totalDocuments: 0,
        lastUpdated: new Date(),
        indexSize: 0,
        averageDocumentLength: 0
      }
    }
    this.userPreferences = this.loadUserPreferences()
    this.initializeWorkspace()
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await fs.mkdir(this.workspace, { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'index'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'cache'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'comparisons'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'triage'), { recursive: true })
      
      await this.loadSearchIndex()
      this.isInitialized = true
      this.emit('concierge_initialized')
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize Digital Concierge'))
    }
  }

  private loadUserPreferences(): UserPreferences {
    return {
      search: {
        defaultSources: ['email', 'calendar', 'files'],
        maxResults: 50,
        sortBy: 'relevance',
        includeHighlights: true
      },
      triage: {
        autoArchive: true,
        spamFilter: true,
        businessHoursOnly: false,
        responseTime: 24
      },
      comparison: {
        defaultCriteria: ['price', 'quality', 'features'],
        includeAlternatives: true,
        confidenceThreshold: 0.7
      }
    }
  }

  // GLOBAL SEARCH

  async globalSearch(query: SearchQuery): Promise<SearchResult[]> {
    this.emit('search_started', { query })
    
    try {
      const results: SearchResult[] = []
      const searchPromises: Promise<SearchResult[]>[] = []

      // Determine which sources to search
      const sources = query.type === 'all' 
        ? ['email', 'calendar', 'files', 'contacts']
        : [query.type]

      // Search each source
      for (const source of sources) {
        searchPromises.push(this.searchSource(source, query))
      }

      // Wait for all searches to complete
      const sourceResults = await Promise.all(searchPromises)
      
      // Combine and rank results
      for (const sourceResult of sourceResults) {
        results.push(...sourceResult)
      }

      // Apply filters and ranking
      const filteredResults = this.applyFilters(results, query.filters)
      const rankedResults = this.rankResults(filteredResults, query.query)

      // Limit results
      const finalResults = rankedResults.slice(0, query.maxResults || 50)

      this.emit('search_completed', { query, results: finalResults })
      return finalResults

    } catch (error) {
      this.emit('search_error', { query, error })
      throw error
    }
  }

  private async searchSource(source: string, query: SearchQuery): Promise<SearchResult[]> {
    switch (source) {
      case 'email':
        return await this.searchEmails(query)
      case 'calendar':
        return await this.searchCalendar(query)
      case 'files':
        return await this.searchFiles(query)
      case 'contacts':
        return await this.searchContacts(query)
      default:
        return []
    }
  }

  private async searchEmails(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const emails = await this.connectorPack.gmailSearch(query.query, query.maxResults || 50)
      
      return emails.map(email => ({
        id: email.id,
        type: 'email' as const,
        title: email.subject,
        content: email.body,
        summary: this.generateSummary(email.body),
        relevanceScore: this.calculateRelevance(email.subject + ' ' + email.body, query.query),
        metadata: {
          from: email.from,
          to: email.to,
          date: email.date,
          isRead: email.isRead,
          isImportant: email.isImportant,
          labels: email.labels,
          attachments: email.attachments.length
        },
        timestamp: email.date,
        source: 'gmail',
        highlights: this.extractHighlights(email.subject + ' ' + email.body, query.query),
        actions: this.generateEmailActions(email)
      }))
    } catch (error) {
      console.error('Email search error:', error)
      return []
    }
  }

  private async searchCalendar(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const now = new Date()
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      const events = await this.connectorPack.calendarGetEvents(now, end)
      
      const filteredEvents = events.filter(event => 
        event.summary.toLowerCase().includes(query.query.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(query.query.toLowerCase()))
      )
      
      return filteredEvents.map(event => ({
        id: event.id,
        type: 'calendar' as const,
        title: event.summary,
        content: event.description || '',
        summary: this.generateSummary(event.description || ''),
        relevanceScore: this.calculateRelevance(event.summary + ' ' + (event.description || ''), query.query),
        metadata: {
          start: event.start,
          end: event.end,
          attendees: event.attendees.length,
          location: event.location,
          status: event.status
        },
        timestamp: event.start,
        source: 'google-calendar',
        highlights: this.extractHighlights(event.summary + ' ' + (event.description || ''), query.query),
        actions: this.generateCalendarActions(event)
      }))
    } catch (error) {
      console.error('Calendar search error:', error)
      return []
    }
  }

  private async searchFiles(query: SearchQuery): Promise<SearchResult[]> {
    // Search local files and cloud storage
    const results: SearchResult[] = []
    
    try {
      // Search local files
      const localFiles = await this.searchLocalFiles(query)
      results.push(...localFiles)
      
      // Search cloud storage if connected
      // This would integrate with Google Drive, OneDrive, Dropbox, etc.
      
    } catch (error) {
      console.error('File search error:', error)
    }
    
    return results
  }

  private async searchLocalFiles(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const searchPaths = [
      path.join(os.homedir(), 'Documents'),
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Downloads')
    ]

    for (const searchPath of searchPaths) {
      try {
        const files = await this.recursiveFileSearch(searchPath, query.query)
        results.push(...files)
      } catch (error) {
        console.error(`Error searching ${searchPath}:`, error)
      }
    }

    return results
  }

  private async recursiveFileSearch(dirPath: string, query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subResults = await this.recursiveFileSearch(fullPath, query)
          results.push(...subResults)
        } else if (entry.isFile()) {
          // Check if file matches search criteria
          if (this.fileMatchesQuery(fullPath, query)) {
            const result = await this.createFileSearchResult(fullPath, query)
            if (result) {
              results.push(result)
            }
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    
    return results
  }

  private fileMatchesQuery(filePath: string, query: string): boolean {
    const fileName = path.basename(filePath).toLowerCase()
    const queryLower = query.toLowerCase()
    
    // Check filename
    if (fileName.includes(queryLower)) {
      return true
    }
    
    // Check file extension if specified
    const extensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.html', '.json', '.xml']
    if (extensions.some(ext => fileName.endsWith(ext))) {
      return true
    }
    
    return false
  }

  private async createFileSearchResult(filePath: string, query: string): Promise<SearchResult | null> {
    try {
      const stats = await fs.stat(filePath)
      const fileName = path.basename(filePath)
      const extension = path.extname(filePath)
      
      let content = ''
      let summary = ''
      
      // Try to read file content for text files
      if (['.txt', '.md', '.json', '.xml', '.html'].includes(extension)) {
        try {
          content = await fs.readFile(filePath, 'utf-8')
          summary = this.generateSummary(content)
        } catch {
          // File might be binary or unreadable
        }
      }
      
      return {
        id: filePath,
        type: 'file',
        title: fileName,
        content,
        summary,
        relevanceScore: this.calculateRelevance(fileName + ' ' + content, query),
        metadata: {
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
          extension,
          path: filePath
        },
        timestamp: stats.mtime,
        source: 'local',
        highlights: this.extractHighlights(fileName + ' ' + content, query),
        actions: this.generateFileActions(filePath)
      }
    } catch {
      return null
    }
  }

  private async searchContacts(query: SearchQuery): Promise<SearchResult[]> {
    // Search contacts from various sources
    const results: SearchResult[] = []
    
    // This would integrate with:
    // - Google Contacts
    // - Outlook contacts
    // - Local address book
    // - Social media contacts
    
    return results
  }

  // COMPARISON ENGINE

  async compareItems(request: ComparisonRequest): Promise<ComparisonResult> {
    this.emit('comparison_started', { request })
    
    try {
      // Score each item against criteria
      const scoredItems = await this.scoreComparisonItems(request.items, request.criteria)
      
      // Rank items
      const rankedItems = this.rankComparisonItems(scoredItems)
      
      // Generate pros and cons
      const itemsWithProsCons = await this.generateProsCons(rankedItems, request.criteria)
      
      // Generate recommendation
      const recommendation = this.generateRecommendation(itemsWithProsCons, request.criteria)
      
      // Create summary
      const summary = await this.generateComparisonSummary(itemsWithProsCons, request)
      
      const result: ComparisonResult = {
        id: `comparison_${Date.now()}`,
        type: request.type,
        items: itemsWithProsCons,
        summary,
        recommendation,
        createdAt: new Date(),
        confidence: this.calculateComparisonConfidence(itemsWithProsCons)
      }
      
      await this.saveComparisonResult(result)
      this.emit('comparison_completed', result)
      
      return result
      
    } catch (error) {
      this.emit('comparison_error', { request, error })
      throw error
    }
  }

  private async scoreComparisonItems(items: ComparisonItem[], criteria: ComparisonCriteria[]): Promise<RankedComparisonItem[]> {
    const scoredItems: RankedComparisonItem[] = []
    
    for (const item of items) {
      const breakdown: Record<string, number> = {}
      let totalScore = 0
      
      for (const criterion of criteria) {
        const score = await this.scoreItemAgainstCriterion(item, criterion)
        breakdown[criterion.name] = score
        totalScore += score * criterion.weight
      }
      
      scoredItems.push({
        ...item,
        rank: 0,
        score: totalScore,
        breakdown,
        pros: [],
        cons: []
      })
    }
    
    return scoredItems
  }

  private async scoreItemAgainstCriterion(item: ComparisonItem, criterion: ComparisonCriteria): Promise<number> {
    switch (criterion.type) {
      case 'numeric':
        return this.scoreNumericCriterion(item, criterion)
      case 'categorical':
        return this.scoreCategoricalCriterion(item, criterion)
      case 'boolean':
        return this.scoreBooleanCriterion(item, criterion)
      case 'rating':
        return this.scoreRatingCriterion(item, criterion)
      default:
        return 0.5
    }
  }

  private scoreNumericCriterion(item: ComparisonItem, criterion: ComparisonCriteria): number {
    // For price, lower is better (normalize to 0-1)
    if (criterion.name.toLowerCase().includes('price') && item.price) {
      const maxPrice = 10000 // Assumed max price for normalization
      return 1 - (item.price / maxPrice)
    }
    
    // For other numeric values, higher is better
    return 0.5 // Default score
  }

  private scoreCategoricalCriterion(item: ComparisonItem, criterion: ComparisonCriteria): number {
    // Score based on features matching
    if (criterion.name.toLowerCase().includes('features') && item.features) {
      return Math.min(1, item.features.length / 10) // Normalize by expected feature count
    }
    
    return 0.5
  }

  private scoreBooleanCriterion(item: ComparisonItem, criterion: ComparisonCriteria): number {
    // Score boolean features
    return 0.5
  }

  private scoreRatingCriterion(item: ComparisonItem, criterion: ComparisonCriteria): number {
    // Score rating out of 5
    if (item.rating) {
      return item.rating / 5
    }
    
    return 0.5
  }

  private rankComparisonItems(items: RankedComparisonItem[]): RankedComparisonItem[] {
    return items
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }

  private async generateProsCons(items: RankedComparisonItem[], criteria: ComparisonCriteria[]): Promise<RankedComparisonItem[]> {
    return items.map(item => {
      const pros: string[] = []
      const cons: string[] = []
      
      criteria.forEach(criterion => {
        const score = item.breakdown[criterion.name]
        
        if (score > 0.7) {
          pros.push(`Strong ${criterion.name.toLowerCase()}`)
        } else if (score < 0.3) {
          cons.push(`Weak ${criterion.name.toLowerCase()}`)
        }
      })
      
      // Add specific pros/cons based on item properties
      if (item.price && item.price < 100) {
        pros.push('Affordable')
      } else if (item.price && item.price > 1000) {
        cons.push('Expensive')
      }
      
      if (item.rating && item.rating > 4) {
        pros.push('Highly rated')
      } else if (item.rating && item.rating < 3) {
        cons.push('Low rated')
      }
      
      return { ...item, pros, cons }
    })
  }

  private generateRecommendation(items: RankedComparisonItem[], criteria: ComparisonCriteria[]): ComparisonRecommendation {
    const best = items[0]
    const alternatives = items.slice(1, 3) // Top 3 alternatives
    
    let reason = `Best overall choice with highest score (${best.score.toFixed(2)})`
    
    // Add specific reasons based on criteria
    const highScoringCriteria = criteria.filter(c => best.breakdown[c.name] > 0.7)
    if (highScoringCriteria.length > 0) {
      reason += `. Particularly strong in ${highScoringCriteria.map(c => c.name).join(', ')}`
    }
    
    return {
      best,
      reason,
      alternatives,
      confidence: best.score
    }
  }

  private async generateComparisonSummary(items: RankedComparisonItem[], request: ComparisonRequest): Promise<string> {
    const best = items[0]
    const worst = items[items.length - 1]
    
    let summary = `Compared ${items.length} ${request.type} across ${request.criteria.length} criteria. `
    summary += `${best.name} ranked #1 with a score of ${best.score.toFixed(2)}, `
    summary += `while ${worst.name} ranked last with ${worst.score.toFixed(2)}. `
    
    if (best.pros.length > 0) {
      summary += `Key strengths: ${best.pros.slice(0, 2).join(', ')}. `
    }
    
    return summary
  }

  private calculateComparisonConfidence(items: RankedComparisonItem[]): number {
    if (items.length < 2) return 0.5
    
    const scores = items.map(item => item.score)
    const mean = scores.reduce((a, b) => a + b) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const standardDeviation = Math.sqrt(variance)
    
    // Higher confidence when there's clear separation between items
    return Math.min(1, standardDeviation * 2)
  }

  // INBOX TRIAGE

  async performTriage(request: TriageRequest): Promise<TriageResult> {
    this.emit('triage_started', { request })
    
    const startTime = Date.now()
    const result: TriageResult = {
      id: `triage_${Date.now()}`,
      source: request.source,
      totalItems: 0,
      processedItems: 0,
      actions: [],
      summary: '',
      errors: [],
      duration: 0,
      dryRun: request.dryRun || false
    }
    
    try {
      let items: any[] = []
      
      // Get items to process
      switch (request.source) {
        case 'email':
          items = await this.connectorPack.gmailGetInbox(100)
          break
        case 'calendar':
          const now = new Date()
          const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          items = await this.connectorPack.calendarGetEvents(now, future)
          break
        case 'all':
          // Combine multiple sources
          const emails = await this.connectorPack.gmailGetInbox(50)
          const events = await this.connectorPack.calendarGetEvents(
            new Date(),
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          )
          items = [...emails, ...events]
          break
      }
      
      result.totalItems = items.length
      
      // Process each item
      for (const item of items) {
        try {
          const actionResult = await this.processTriageItem(item, request, result.dryRun)
          result.actions.push(actionResult)
          result.processedItems++
        } catch (error) {
          result.errors.push(`Error processing ${item.id}: ${error}`)
        }
      }
      
      // Generate summary
      result.summary = this.generateTriageSummary(result)
      result.duration = Date.now() - startTime
      
      await this.saveTriageResult(result)
      this.emit('triage_completed', result)
      
      return result
      
    } catch (error) {
      result.errors.push(`Triage failed: ${error}`)
      result.duration = Date.now() - startTime
      this.emit('triage_error', { request, error })
      throw error
    }
  }

  private async processTriageItem(item: any, request: TriageRequest, dryRun: boolean): Promise<TriageActionResult> {
    // Determine which action to take based on criteria
    const action = this.determineTriageAction(item, request)
    
    if (dryRun) {
      return {
        itemId: item.id,
        action: action.type,
        success: true,
        reason: 'Dry run - no action taken'
      }
    }
    
    // Execute the action
    try {
      await this.executeTriageAction(item, action)
      return {
        itemId: item.id,
        action: action.type,
        success: true
      }
    } catch (error) {
      return {
        itemId: item.id,
        action: action.type,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private determineTriageAction(item: any, request: TriageRequest): TriageAction {
    const criteria = request.criteria
    
    // Check for spam/promotional content
    if (this.isSpamOrPromotional(item, criteria)) {
      return { type: 'archive', conditions: [], parameters: {} }
    }
    
    // Check for importance
    if (this.isImportant(item, criteria)) {
      return { type: 'star', conditions: [], parameters: {} }
    }
    
    // Check for urgency
    if (this.isUrgent(item, criteria)) {
      return { type: 'mark_read', conditions: [], parameters: {} }
    }
    
    // Default action
    return { type: 'mark_read', conditions: [], parameters: {} }
  }

  private isSpamOrPromotional(item: any, criteria: TriageCriteria): boolean {
    const content = (item.subject + ' ' + (item.body || '')).toLowerCase()
    
    // Check spam keywords
    const hasSpamKeywords = criteria.keywords.spam.some(keyword => 
      content.includes(keyword.toLowerCase())
    )
    
    // Check promotional keywords
    const hasPromotionalKeywords = criteria.keywords.promotional.some(keyword => 
      content.includes(keyword.toLowerCase())
    )
    
    // Check sender priority
    const senderLowPriority = item.from && criteria.senderPriority[item.from] === 'low'
    
    return hasSpamKeywords || hasPromotionalKeywords || senderLowPriority
  }

  private isImportant(item: any, criteria: TriageCriteria): boolean {
    const content = (item.subject + ' ' + (item.body || '')).toLowerCase()
    
    // Check important keywords
    const hasImportantKeywords = criteria.keywords.important.some(keyword => 
      content.includes(keyword.toLowerCase())
    )
    
    // Check sender priority
    const senderHighPriority = item.from && criteria.senderPriority[item.from] === 'high'
    
    // Check existing importance flag
    const isMarkedImportant = item.isImportant || item.labels?.includes('IMPORTANT')
    
    return hasImportantKeywords || senderHighPriority || isMarkedImportant
  }

  private isUrgent(item: any, criteria: TriageCriteria): boolean {
    const content = (item.subject + ' ' + (item.body || '')).toLowerCase()
    
    // Check urgency indicators
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical']
    const hasUrgencyKeywords = urgencyKeywords.some(keyword => 
      content.includes(keyword)
    )
    
    // Check time-based urgency
    if (item.start) {
      const eventTime = new Date(item.start)
      const now = new Date()
      const hoursUntil = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      return hoursUntil < criteria.timeBased.responseTime
    }
    
    return hasUrgencyKeywords
  }

  private async executeTriageAction(item: any, action: TriageAction): Promise<void> {
    // This would integrate with the connector pack to execute actions
    switch (action.type) {
      case 'archive':
        // Archive email
        break
      case 'star':
        // Star item
        break
      case 'mark_read':
        // Mark as read
        break
      case 'delete':
        // Delete item
        break
      default:
        console.warn(`Unknown triage action: ${action.type}`)
    }
  }

  private generateTriageSummary(result: TriageResult): string {
    const successCount = result.actions.filter(a => a.success).length
    const errorCount = result.errors.length
    
    let summary = `Processed ${result.processedItems}/${result.totalItems} items in ${result.duration}ms. `
    summary += `${successCount} actions completed successfully.`
    
    if (errorCount > 0) {
      summary += ` ${errorCount} errors encountered.`
    }
    
    return summary
  }

  // UTILITY METHODS

  private generateSummary(content: string, maxLength: number = 200): string {
    if (!content || content.length <= maxLength) {
      return content || ''
    }
    
    return content.substring(0, maxLength) + '...'
  }

  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase()
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/)
    
    let score = 0
    let totalWords = contentLower.split(/\s+/).length
    
    for (const word of queryWords) {
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length
      score += occurrences * (word.length / queryLower.length)
    }
    
    return Math.min(1, score / totalWords)
  }

  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = []
    const queryWords = query.toLowerCase().split(/\s+/)
    
    for (const word of queryWords) {
      const regex = new RegExp(`(.{0,50})${word}(.{0,50})`, 'gi')
      const matches = content.match(regex)
      
      if (matches) {
        highlights.push(...matches.slice(0, 3)) // Limit highlights
      }
    }
    
    return [...new Set(highlights)] // Remove duplicates
  }

  private generateEmailActions(email: any): SearchResultAction[] {
    return [
      {
        type: 'open',
        label: 'Open',
        requiresConfirmation: false
      },
      {
        type: 'reply',
        label: 'Reply',
        requiresConfirmation: false
      },
      {
        type: 'archive',
        label: 'Archive',
        requiresConfirmation: false
      },
      {
        type: 'delete',
        label: 'Delete',
        requiresConfirmation: true
      }
    ]
  }

  private generateCalendarActions(event: any): SearchResultAction[] {
    return [
      {
        type: 'open',
        label: 'Open',
        requiresConfirmation: false
      }
    ]
  }

  private generateFileActions(filePath: string): SearchResultAction[] {
    return [
      {
        type: 'open',
        label: 'Open',
        requiresConfirmation: false
      },
      {
        type: 'download',
        label: 'Download',
        requiresConfirmation: false
      }
    ]
  }

  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results
    
    return results.filter(result => {
      // Date range filter
      if (filters.dateRange) {
        const resultDate = new Date(result.timestamp)
        if (resultDate < filters.dateRange.start || resultDate > filters.dateRange.end) {
          return false
        }
      }
      
      // Keyword filters
      if (filters.keywords?.length) {
        const content = (result.title + ' ' + result.content).toLowerCase()
        const hasKeyword = filters.keywords.some(keyword => 
          content.includes(keyword.toLowerCase())
        )
        if (!hasKeyword) return false
      }
      
      // Exclude keywords
      if (filters.excludeKeywords?.length) {
        const content = (result.title + ' ' + result.content).toLowerCase()
        const hasExcludedKeyword = filters.excludeKeywords.some(keyword => 
          content.includes(keyword.toLowerCase())
        )
        if (hasExcludedKeyword) return false
      }
      
      return true
    })
  }

  private rankResults(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => {
      // Primary sort by relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      
      // Secondary sort by timestamp (more recent first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }

  private async loadSearchIndex(): Promise<void> {
    try {
      const indexPath = path.join(this.workspace, 'index', 'search-index.json')
      const data = await fs.readFile(indexPath, 'utf-8')
      const indexData = JSON.parse(data)
      
      this.searchIndex = {
        documents: new Map(indexData.documents),
        invertedIndex: new Map(indexData.invertedIndex),
        metadata: indexData.metadata
      }
    } catch {
      // Index doesn't exist yet, start fresh
      this.searchIndex = {
        documents: new Map(),
        invertedIndex: new Map(),
        metadata: {
          totalDocuments: 0,
          lastUpdated: new Date(),
          indexSize: 0,
          averageDocumentLength: 0
        }
      }
    }
  }

  private async saveSearchIndex(): Promise<void> {
    try {
      const indexPath = path.join(this.workspace, 'index', 'search-index.json')
      const indexData = {
        documents: Array.from(this.searchIndex.documents.entries()),
        invertedIndex: Array.from(this.searchIndex.invertedIndex.entries()),
        metadata: this.searchIndex.metadata
      }
      
      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
    } catch (error) {
      console.error('Failed to save search index:', error)
    }
  }

  private async saveComparisonResult(result: ComparisonResult): Promise<void> {
    try {
      const resultPath = path.join(this.workspace, 'comparisons', `${result.id}.json`)
      await fs.writeFile(resultPath, JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Failed to save comparison result:', error)
    }
  }

  private async saveTriageResult(result: TriageResult): Promise<void> {
    try {
      const resultPath = path.join(this.workspace, 'triage', `${result.id}.json`)
      await fs.writeFile(resultPath, JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Failed to save triage result:', error)
    }
  }

  // PUBLIC API

  isReady(): boolean {
    return this.isInitialized
  }

  getUserPreferences(): UserPreferences {
    return this.userPreferences
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences }
  }

  getSearchStats(): SearchMetadata {
    return this.searchIndex.metadata
  }

  async clearCache(): Promise<void> {
    this.cache.clear()
    const cachePath = path.join(this.workspace, 'cache')
    try {
      const files = await fs.readdir(cachePath)
      await Promise.all(files.map(file => fs.unlink(path.join(cachePath, file))))
    } catch {
      // Cache directory might not exist
    }
  }
}

interface UserPreferences {
  search: {
    defaultSources: string[]
    maxResults: number
    sortBy: 'relevance' | 'date' | 'title'
    includeHighlights: boolean
  }
  triage: {
    autoArchive: boolean
    spamFilter: boolean
    businessHoursOnly: boolean
    responseTime: number
  }
  comparison: {
    defaultCriteria: string[]
    includeAlternatives: boolean
    confidenceThreshold: number
  }
}

export default DigitalConcierge

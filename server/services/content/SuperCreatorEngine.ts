import { EventEmitter } from 'events'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'

export interface ContentTemplate {
  id: string
  name: string
  type: 'document' | 'presentation' | 'email' | 'report' | 'creative' | 'technical'
  description: string
  sections: TemplateSection[]
  variables: TemplateVariable[]
  style: ContentStyle
}

export interface TemplateSection {
  id: string
  name: string
  type: 'header' | 'body' | 'footer' | 'sidebar' | 'content'
  prompt: string
  required: boolean
  order: number
  maxLength?: number
  tone?: string
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  default?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ContentStyle {
  tone: 'professional' | 'casual' | 'formal' | 'friendly' | 'technical' | 'creative'
  format: 'markdown' | 'html' | 'plain' | 'latex'
  language: string
  complexity: 'simple' | 'intermediate' | 'advanced'
  length: 'short' | 'medium' | 'long'
}

export interface GeneratedContent {
  id: string
  templateId: string
  title: string
  content: string
  metadata: ContentMetadata
  sections: GeneratedSection[]
  variables: Record<string, any>
  createdAt: Date
  quality: ContentQuality
}

export interface ContentMetadata {
  wordCount: number
  readingTime: number
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
  keywords: string[]
  language: string
  format: string
}

export interface GeneratedSection {
  id: string
  name: string
  content: string
  wordCount: number
  confidence: number
  sources?: string[]
}

export interface ContentQuality {
  score: number
  grammar: number
  coherence: number
  relevance: number
  completeness: number
  readability: number
}

export interface GenerationRequest {
  templateId: string
  variables: Record<string, any>
  style?: Partial<ContentStyle>
  constraints?: {
    maxWords?: number
    minWords?: number
    includeSources?: boolean
    avoidTopics?: string[]
    focusTopics?: string[]
  }
  priority: 'low' | 'medium' | 'high'
}

export interface ModelConfig {
  name: string
  type: 'local' | 'api'
  modelPath?: string
  apiUrl?: string
  apiKey?: string
  maxTokens: number
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

export class SuperCreatorEngine extends EventEmitter {
  private templates: Map<string, ContentTemplate> = new Map()
  private content: Map<string, GeneratedContent> = new Map()
  private models: Map<string, ModelConfig> = new Map()
  private workspace: string
  private modelProcess: any = null
  private isInitialized: boolean = false

  constructor() {
    super()
    this.workspace = path.join(os.tmpdir(), 'jason-super-creator')
    this.initializeModels()
    this.initializeTemplates()
    this.initializeWorkspace()
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await fs.mkdir(this.workspace, { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'templates'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'content'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'models'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'cache'), { recursive: true })
      await fs.mkdir(path.join(this.workspace, 'exports'), { recursive: true })
      
      this.isInitialized = true
      this.emit('workspace_initialized')
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize SuperCreator workspace'))
    }
  }

  private initializeModels(): void {
    // Mistral-7B Local Model
    this.models.set('mistral-7b', {
      name: 'Mistral-7B-Instruct',
      type: 'local',
      modelPath: path.join(this.workspace, 'models', 'mistral-7b-instruct.gguf'),
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    })

    // GPT-4 API Backup
    this.models.set('gpt-4', {
      name: 'GPT-4',
      type: 'api',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    })

    // Claude API Backup
    this.models.set('claude-3', {
      name: 'Claude-3-Sonnet',
      type: 'api',
      apiUrl: 'https://api.anthropic.com/v1/messages',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    })

    this.emit('models_initialized', Array.from(this.models.keys()))
  }

  private initializeTemplates(): void {
    // Business Report Template
    this.templates.set('business-report', {
      id: 'business-report',
      name: 'Business Report',
      type: 'report',
      description: 'Comprehensive business report with executive summary and recommendations',
      sections: [
        {
          id: 'executive-summary',
          name: 'Executive Summary',
          type: 'header',
          prompt: 'Write a compelling executive summary that highlights key findings, recommendations, and business impact. Focus on clarity and conciseness.',
          required: true,
          order: 1,
          maxLength: 300,
          tone: 'professional'
        },
        {
          id: 'introduction',
          name: 'Introduction',
          type: 'body',
          prompt: 'Provide context and background for the report. Explain the purpose, scope, and methodology.',
          required: true,
          order: 2,
          tone: 'professional'
        },
        {
          id: 'findings',
          name: 'Key Findings',
          type: 'content',
          prompt: 'Present detailed findings with supporting data and analysis. Use clear headings and bullet points.',
          required: true,
          order: 3,
          tone: 'analytical'
        },
        {
          id: 'recommendations',
          name: 'Recommendations',
          type: 'content',
          prompt: 'Provide actionable recommendations based on findings. Include implementation considerations and expected outcomes.',
          required: true,
          order: 4,
          tone: 'persuasive'
        },
        {
          id: 'conclusion',
          name: 'Conclusion',
          type: 'footer',
          prompt: 'Summarize the report and reiterate the most important points and next steps.',
          required: true,
          order: 5,
          tone: 'professional'
        }
      ],
      variables: [
        {
          name: 'company',
          type: 'text',
          description: 'Company name',
          required: true
        },
        {
          name: 'reportTitle',
          type: 'text',
          description: 'Report title',
          required: true
        },
        {
          name: 'dateRange',
          type: 'text',
          description: 'Analysis period',
          required: true
        },
        {
          name: 'keyMetrics',
          type: 'array',
          description: 'Key performance metrics to analyze',
          required: true
        }
      ],
      style: {
        tone: 'professional',
        format: 'markdown',
        language: 'en',
        complexity: 'intermediate',
        length: 'medium'
      }
    })

    // Email Template
    this.templates.set('professional-email', {
      id: 'professional-email',
      name: 'Professional Email',
      type: 'email',
      description: 'Professional email for business communication',
      sections: [
        {
          id: 'subject',
          name: 'Subject Line',
          type: 'header',
          prompt: 'Write a clear, compelling subject line that captures attention and summarizes the email purpose.',
          required: true,
          order: 1,
          maxLength: 100,
          tone: 'professional'
        },
        {
          id: 'greeting',
          name: 'Greeting',
          type: 'header',
          prompt: 'Write an appropriate greeting based on the relationship and context.',
          required: true,
          order: 2,
          tone: 'professional'
        },
        {
          id: 'body',
          name: 'Email Body',
          type: 'content',
          prompt: 'Write the main message with clear structure, proper formatting, and appropriate tone for the audience.',
          required: true,
          order: 3,
          tone: 'professional'
        },
        {
          id: 'closing',
          name: 'Closing',
          type: 'footer',
          prompt: 'Write an appropriate closing with call to action if needed.',
          required: true,
          order: 4,
          tone: 'professional'
        }
      ],
      variables: [
        {
          name: 'recipient',
          type: 'text',
          description: 'Recipient name and title',
          required: true
        },
        {
          name: 'purpose',
          type: 'text',
          description: 'Email purpose',
          required: true
        },
        {
          name: 'keyPoints',
          type: 'array',
          description: 'Key points to include',
          required: true
        },
        {
          name: 'urgency',
          type: 'text',
          description: 'Urgency level (low/medium/high)',
          required: false,
          default: 'medium'
        }
      ],
      style: {
        tone: 'professional',
        format: 'plain',
        language: 'en',
        complexity: 'simple',
        length: 'short'
      }
    })

    // Presentation Template
    this.templates.set('business-presentation', {
      id: 'business-presentation',
      name: 'Business Presentation',
      type: 'presentation',
      description: 'Professional business presentation slides',
      sections: [
        {
          id: 'title-slide',
          name: 'Title Slide',
          type: 'header',
          prompt: 'Create an engaging title slide with presentation title, subtitle, and presenter information.',
          required: true,
          order: 1,
          tone: 'professional'
        },
        {
          id: 'agenda',
          name: 'Agenda',
          type: 'content',
          prompt: 'Create a clear agenda slide outlining the presentation structure and key topics.',
          required: true,
          order: 2,
          tone: 'professional'
        },
        {
          id: 'problem-statement',
          name: 'Problem Statement',
          type: 'content',
          prompt: 'Articulate the problem or opportunity with compelling data and context.',
          required: true,
          order: 3,
          tone: 'analytical'
        },
        {
          id: 'solution',
          name: 'Solution',
          type: 'content',
          prompt: 'Present the proposed solution with clear benefits and implementation approach.',
          required: true,
          order: 4,
          tone: 'persuasive'
        },
        {
          id: 'results',
          name: 'Expected Results',
          type: 'content',
          prompt: 'Showcase expected outcomes, ROI, and success metrics.',
          required: true,
          order: 5,
          tone: 'persuasive'
        },
        {
          id: 'next-steps',
          name: 'Next Steps',
          type: 'footer',
          prompt: 'Outline clear next steps, timeline, and required resources.',
          required: true,
          order: 6,
          tone: 'professional'
        }
      ],
      variables: [
        {
          name: 'presentationTitle',
          type: 'text',
          description: 'Presentation title',
          required: true
        },
        {
          name: 'presenter',
          type: 'text',
          description: 'Presenter name and title',
          required: true
        },
        {
          name: 'audience',
          type: 'text',
          description: 'Target audience',
          required: true
        },
        {
          name: 'duration',
          type: 'number',
          description: 'Presentation duration in minutes',
          required: true,
          validation: { min: 5, max: 120 }
        }
      ],
      style: {
        tone: 'professional',
        format: 'markdown',
        language: 'en',
        complexity: 'intermediate',
        length: 'medium'
      }
    })

    // Creative Writing Template
    this.templates.set('creative-story', {
      id: 'creative-story',
      name: 'Creative Story',
      type: 'creative',
      description: 'Creative story or narrative content',
      sections: [
        {
          id: 'opening',
          name: 'Opening',
          type: 'header',
          prompt: 'Write a compelling opening that hooks the reader and establishes the setting and tone.',
          required: true,
          order: 1,
          tone: 'creative'
        },
        {
          id: 'development',
          name: 'Story Development',
          type: 'content',
          prompt: 'Develop the plot with engaging characters, conflict, and rising action.',
          required: true,
          order: 2,
          tone: 'creative'
        },
        {
          id: 'climax',
          name: 'Climax',
          type: 'content',
          prompt: 'Build to a powerful climax that resolves the central conflict.',
          required: true,
          order: 3,
          tone: 'dramatic'
        },
        {
          id: 'resolution',
          name: 'Resolution',
          type: 'footer',
          prompt: 'Provide a satisfying resolution that ties up loose ends and delivers the story theme.',
          required: true,
          order: 4,
          tone: 'reflective'
        }
      ],
      variables: [
        {
          name: 'genre',
          type: 'text',
          description: 'Story genre (fantasy, sci-fi, romance, mystery, etc.)',
          required: true
        },
        {
          name: 'protagonist',
          type: 'text',
          description: 'Main character description',
          required: true
        },
        {
          name: 'setting',
          type: 'text',
          description: 'Story setting and time period',
          required: true
        },
        {
          name: 'theme',
          type: 'text',
          description: 'Central theme or message',
          required: true
        }
      ],
      style: {
        tone: 'creative',
        format: 'markdown',
        language: 'en',
        complexity: 'intermediate',
        length: 'long'
      }
    })

    this.emit('templates_initialized', Array.from(this.templates.keys()))
  }

  // CONTENT GENERATION

  async generateContent(request: GenerationRequest): Promise<GeneratedContent> {
    const template = this.templates.get(request.templateId)
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`)
    }

    this.emit('generation_started', { templateId: request.templateId, variables: request.variables })

    try {
      const generatedSections: GeneratedSection[] = []
      
      // Generate each section
      for (const section of template.sections.sort((a, b) => a.order - b.order)) {
        const sectionContent = await this.generateSection(section, template, request)
        generatedSections.push(sectionContent)
      }

      // Combine sections into full content
      const fullContent = this.combineSections(generatedSections, template.style.format)
      
      // Generate metadata
      const metadata = await this.generateMetadata(fullContent)
      
      // Assess quality
      const quality = await this.assessQuality(generatedSections, fullContent, template)

      const generatedContent: GeneratedContent = {
        id: uuidv4(),
        templateId: request.templateId,
        title: this.generateTitle(template, request.variables),
        content: fullContent,
        metadata,
        sections: generatedSections,
        variables: request.variables,
        createdAt: new Date(),
        quality
      }

      this.content.set(generatedContent.id, generatedContent)
      await this.saveContent(generatedContent)
      
      this.emit('generation_completed', generatedContent)
      return generatedContent

    } catch (error) {
      this.emit('generation_error', { templateId: request.templateId, error })
      throw error
    }
  }

  private async generateSection(
    section: TemplateSection,
    template: ContentTemplate,
    request: GenerationRequest
  ): Promise<GeneratedSection> {
    const model = this.selectBestModel(request.priority)
    const prompt = this.buildSectionPrompt(section, template, request)
    
    try {
      const content = await this.callModel(model, prompt, section.maxLength)
      
      return {
        id: section.id,
        name: section.name,
        content: content.trim(),
        wordCount: this.countWords(content),
        confidence: this.calculateConfidence(content, section),
        sources: request.constraints?.includeSources ? await this.extractSources(content) : undefined
      }
    } catch (error) {
      throw new Error(`Failed to generate section ${section.name}: ${error}`)
    }
  }

  private buildSectionPrompt(
    section: TemplateSection,
    template: ContentTemplate,
    request: GenerationRequest
  ): string {
    let prompt = `You are generating content for a ${template.type} with a ${template.style.tone} tone.\n\n`
    
    prompt += `Section: ${section.name}\n`
    prompt += `Type: ${section.type}\n`
    prompt += `Instructions: ${section.prompt}\n\n`
    
    if (section.tone) {
      prompt += `Tone: ${section.tone}\n`
    }
    
    if (section.maxLength) {
      prompt += `Maximum length: ${section.maxLength} words\n`
    }
    
    prompt += '\nContext:\n'
    Object.entries(request.variables).forEach(([key, value]) => {
      prompt += `- ${key}: ${JSON.stringify(value)}\n`
    })
    
    if (request.constraints) {
      prompt += '\nConstraints:\n'
      if (request.constraints.maxWords) {
        prompt += `- Maximum words: ${request.constraints.maxWords}\n`
      }
      if (request.constraints.minWords) {
        prompt += `- Minimum words: ${request.constraints.minWords}\n`
      }
      if (request.constraints.focusTopics?.length) {
        prompt += `- Focus on topics: ${request.constraints.focusTopics.join(', ')}\n`
      }
      if (request.constraints.avoidTopics?.length) {
        prompt += `- Avoid topics: ${request.constraints.avoidTopics.join(', ')}\n`
      }
    }
    
    prompt += '\nGenerate the content now:'
    return prompt
  }

  private selectBestModel(priority: string): ModelConfig {
    // Try local model first, fallback to API models
    const models = ['mistral-7b', 'claude-3', 'gpt-4']
    
    for (const modelName of models) {
      const model = this.models.get(modelName)
      if (model && this.isModelAvailable(model)) {
        return model
      }
    }
    
    throw new Error('No available models found')
  }

  private isModelAvailable(model: ModelConfig): boolean {
    if (model.type === 'api') {
      return !!model.apiKey
    }
    return true // Assume local models are available if configured
  }

  private async callModel(model: ModelConfig, prompt: string, maxLength?: number): Promise<string> {
    if (model.type === 'local') {
      return await this.callLocalModel(model, prompt, maxLength)
    } else {
      return await this.callApiModel(model, prompt, maxLength)
    }
  }

  private async callLocalModel(model: ModelConfig, prompt: string, maxLength?: number): Promise<string> {
    // Use llama.cpp or similar for local model inference
    const modelPath = model.modelPath
    if (!modelPath || !await this.fileExists(modelPath)) {
      throw new Error(`Local model not found at: ${modelPath}`)
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-m', modelPath,
        '-p', prompt,
        '--temp', model.temperature.toString(),
        '--top-p', model.topP.toString(),
        '-n', (maxLength || 2048).toString()
      ]

      const process = spawn('./main', args, { cwd: path.join(this.workspace, 'models') })
      
      let output = ''
      process.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        console.error('Model error:', data.toString())
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim())
        } else {
          reject(new Error(`Model process exited with code ${code}`))
        }
      })
      
      process.on('error', (error) => {
        reject(error)
      })
    })
  }

  private async callApiModel(model: ModelConfig, prompt: string, maxLength?: number): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    let body: any = {}
    let url = model.apiUrl!

    if (model.name.includes('GPT')) {
      headers['Authorization'] = `Bearer ${model.apiKey}`
      body = {
        model: model.name.toLowerCase(),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxLength || model.maxTokens,
        temperature: model.temperature,
        top_p: model.topP,
        frequency_penalty: model.frequencyPenalty,
        presence_penalty: model.presencePenalty
      }
    } else if (model.name.includes('Claude')) {
      headers['x-api-key'] = model.apiKey!
      headers['anthropic-version'] = '2023-06-01'
      body = {
        model: model.name.toLowerCase(),
        max_tokens: maxLength || model.maxTokens,
        temperature: model.temperature,
        messages: [{ role: 'user', content: prompt }]
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (model.name.includes('GPT')) {
      return result.choices[0].message.content
    } else if (model.name.includes('Claude')) {
      return result.content[0].text
    }
    
    throw new Error('Unknown API model response format')
  }

  private combineSections(sections: GeneratedSection[], format: string): string {
    const sectionContents = sections.map(section => {
      let content = `## ${section.name}\n\n${section.content}`
      
      if (section.sources?.length) {
        content += `\n\n*Sources: ${section.sources.join(', ')}*`
      }
      
      return content
    })

    return sectionContents.join('\n\n---\n\n')
  }

  private async generateMetadata(content: string): Promise<ContentMetadata> {
    const wordCount = this.countWords(content)
    const readingTime = Math.ceil(wordCount / 200) // Average reading speed
    
    return {
      wordCount,
      readingTime,
      sentiment: await this.analyzeSentiment(content),
      topics: await this.extractTopics(content),
      keywords: await this.extractKeywords(content),
      language: 'en',
      format: 'markdown'
    }
  }

  private async assessQuality(
    sections: GeneratedSection[],
    content: string,
    template: ContentTemplate
  ): Promise<ContentQuality> {
    const grammar = await this.assessGrammar(content)
    const coherence = await this.assessCoherence(sections)
    const relevance = await this.assessRelevance(content, template)
    const completeness = this.assessCompleteness(sections, template)
    const readability = await this.assessReadability(content)
    
    const score = (grammar + coherence + relevance + completeness + readability) / 5
    
    return {
      score,
      grammar,
      coherence,
      relevance,
      completeness,
      readability
    }
  }

  // UTILITY METHODS

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length
  }

  private calculateConfidence(content: string, section: TemplateSection): number {
    const wordCount = this.countWords(content)
    const targetLength = section.maxLength || 500
    const lengthScore = Math.min(1, wordCount / (targetLength * 0.8))
    
    // Simple confidence calculation based on length and basic heuristics
    return Math.max(0.1, Math.min(1, lengthScore * 0.8 + 0.2))
  }

  private generateTitle(template: ContentTemplate, variables: Record<string, any>): string {
    const titleVar = variables.title || variables.reportTitle || variables.presentationTitle || variables.subject
    if (titleVar) {
      return titleVar.toString()
    }
    
    return `${template.name} - ${new Date().toLocaleDateString()}`
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple sentiment analysis based on keyword counting
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'successful', 'effective']
    const negativeWords = ['bad', 'poor', 'negative', 'failed', 'ineffective', 'problem']
    
    const words = content.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => positiveWords.includes(word)).length
    const negativeCount = words.filter(word => negativeWords.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private async extractTopics(content: string): Promise<string[]> {
    // Simple topic extraction based on keyword frequency
    const commonTopics = ['business', 'technology', 'finance', 'marketing', 'strategy', 'development', 'research']
    const words = content.toLowerCase().split(/\s+/)
    
    return commonTopics
      .filter(topic => words.includes(topic))
      .slice(0, 5)
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private async extractSources(content: string): Promise<string[]> {
    // Extract potential sources from content (URLs, references relationships)
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = content.match(urlRegex) || []
    
    return urls.slice(0, 5)
  }

  private async assessGrammar(content: string): Promise<number> {
    // Simple grammar assessment based on common patterns
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    
    // Score based on sentence length variation and basic patterns
    const idealLength = 15
    const lengthScore = 1 - Math.abs(avgSentenceLength - idealLength) / idealLength
    
    return Math.max(0, Math.min(1, lengthScore))
  }

  private async assessCoherence(sections: GeneratedSection[]): Promise<number> {
    // Simple coherence assessment based on section transitions
    if (sections.length < 2) return 1
    
    let coherenceScore = 1
    for (let i = 1; i < sections.length; i++) {
      const prevContent = sections[i - 1].content.toLowerCase()
      const currContent = sections[i].content.toLowerCase()
      
      // Check for transition words and topic continuity
      const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'consequently']
      const hasTransition = transitionWords.some(word => currContent.includes(word))
      
      if (hasTransition) {
        coherenceScore += 0.1
      }
    }
    
    return Math.max(0, Math.min(1, coherenceScore / sections.length))
  }

  private async assessRelevance(content: string, template: ContentTemplate): Promise<number> {
    // Simple relevance assessment based on template type and keywords
    const typeKeywords = {
      'report': ['analysis', 'findings', 'recommendations', 'conclusion', 'data'],
      'email': ['dear', 'sincerely', 'regards', 'best', 'thank'],
      'presentation': ['slide', 'audience', 'visual', 'key', 'point'],
      'creative': ['story', 'character', 'plot', 'narrative', 'theme']
    }
    
    const keywords = typeKeywords[template.type] || []
    const contentLower = content.toLowerCase()
    
    const keywordCount = keywords.reduce((count, keyword) => {
      return count + (contentLower.includes(keyword) ? 1 : 0)
    }, 0)
    
    return Math.max(0, Math.min(1, keywordCount / keywords.length))
  }

  private assessCompleteness(sections: GeneratedSection[], template: ContentTemplate): number {
    const requiredSections = template.sections.filter(s => s.required).length
    const completedSections = sections.filter(s => s.content.length > 50).length
    
    return completedSections / requiredSections
  }

  private assessReadability(content: string): Promise<number> {
    // Simple readability assessment based on sentence complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    
    // Flesch Reading Ease approximation
    const ease = 206.835 - 1.015 * avgSentenceLength
    return Promise.resolve(Math.max(0, Math.min(1, ease / 100)))
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  private async saveContent(content: GeneratedContent): Promise<void> {
    const filePath = path.join(this.workspace, 'content', `${content.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(content, null, 2))
  }

  // PUBLIC API

  getTemplates(): ContentTemplate[] {
    return Array.from(this.templates.values())
  }

  getTemplate(id: string): ContentTemplate | undefined {
    return this.templates.get(id)
  }

  getContent(id: string): GeneratedContent | undefined {
    return this.content.get(id)
  }

  getAllContent(): GeneratedContent[] {
    return Array.from(this.content.values())
  }

  getModels(): string[] {
    return Array.from(this.models.keys())
  }

  async exportContent(contentId: string, format: 'markdown' | 'html' | 'pdf'): Promise<string> {
    const content = this.content.get(contentId)
    if (!content) {
      throw new Error(`Content not found: ${contentId}`)
    }

    const exportPath = path.join(this.workspace, 'exports', `${contentId}.${format}`)
    
    if (format === 'markdown') {
      await fs.writeFile(exportPath, content.content)
    } else if (format === 'html') {
      const html = this.markdownToHtml(content.content)
      await fs.writeFile(exportPath, html)
    } else if (format === 'pdf') {
      // PDF export would require additional library
      throw new Error('PDF export not yet implemented')
    }
    
    return exportPath
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  }

  async deleteContent(contentId: string): Promise<void> {
    this.content.delete(contentId)
    
    const filePath = path.join(this.workspace, 'content', `${contentId}.json`)
    try {
      await fs.unlink(filePath)
    } catch {
      // File might not exist
    }
  }

  async updateTemplate(template: ContentTemplate): Promise<void> {
    this.templates.set(template.id, template)
    
    const templatePath = path.join(this.workspace, 'templates', `${template.id}.json`)
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2))
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

export default SuperCreatorEngine

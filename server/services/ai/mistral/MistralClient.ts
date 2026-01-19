import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface MistralConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
  ollamaUrl?: string
}

export interface MistralResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class MistralClient {
  private config: MistralConfig
  private localModelPath: string

  constructor(config?: Partial<MistralConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.MISTRAL_API_KEY,
      baseUrl: config?.baseUrl || process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
      model: config?.model || process.env.MISTRAL_MODEL || 'mistral',
      temperature: config?.temperature || 0.7,
      maxTokens: config?.maxTokens || 4000,
      ollamaUrl: config?.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434'
    }

    // Local model path for offline usage
    this.localModelPath = process.env.LOCAL_MISTRAL_PATH || path.join(process.cwd(), 'data', 'models', 'mistral-7b-instruct')
  }

  async generate(systemPrompt: string, userPrompt: string, options?: Partial<MistralConfig>): Promise<string> {
    const config = { ...this.config, ...options }

    try {
      // 1. Try API if key is present
      if (config.apiKey) {
        return await this.generateAPI(systemPrompt, userPrompt, config)
      }

      // 2. Try Ollama (Local)
      if (await this.isOllamaAvailable(config.ollamaUrl!)) {
        return await this.generateOllama(systemPrompt, userPrompt, config)
      }

      // 3. Try Local Model File (Real implementation would go here)
      if (await this.isLocalModelAvailable()) {
        throw new Error(`Direct local model file execution not yet implemented in production. Please use Ollama at ${config.ollamaUrl}`)
      }

      throw new Error(`No real AI engine available. Please set MISTRAL_API_KEY or start Ollama at ${config.ollamaUrl}`)
    } catch (error) {
      console.error(`[MistralClient] Fatal error: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error(`Mistral generation failed: No simulation fallback allowed in Production. ${error instanceof Error ? error.message : String(error)}`)
    }
  }


  private async isLocalModelAvailable(): Promise<boolean> {
    try {
      await fs.access(this.localModelPath)
      return true
    } catch {
      return false
    }
  }

  private async generateAPI(systemPrompt: string, userPrompt: string, config: MistralConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Mistral API key not configured')
    }

    const response = await axios.post(
      `${config.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data: MistralResponse = response.data
    return data.choices[0]?.message?.content || ''
  }

  private async isOllamaAvailable(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${url}/api/tags`, { timeout: 2000 })
      return response.status === 200
    } catch {
      return false
    }
  }

  private async generateOllama(systemPrompt: string, userPrompt: string, config: MistralConfig): Promise<string> {
    const url = `${config.ollamaUrl}/api/generate`
    const model = config.model || 'mistral'

    try {
      const response = await axios.post(url, {
        model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false
      }, {
        timeout: 300000 // 5 minutes for local inference
      })

      return response.data.response || ''
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama request failed [${error.code}]: ${error.message}`)
      }
      throw error
    }
  }


  async expandPrompt(prompt: string, context?: string): Promise<string> {
    const systemPrompt = `You are an expert content strategist. Expand the user's brief prompt into a detailed, comprehensive request that includes:
1. Clear objectives and goals
2. Target audience considerations
3. Key topics and sections to cover
4. Desired tone and style
5. Visual and formatting preferences
6. Any constraints or requirements

Return the expanded prompt as a detailed specification.`

    const userPrompt = `Original prompt: "${prompt}"
${context ? `Additional context: ${context}` : ''}

Please expand this into a comprehensive content specification.`

    return await this.generate(systemPrompt, userPrompt, { temperature: 0.8 })
  }

  async generateOutline(topic: string, style: string = 'professional'): Promise<string> {
    const systemPrompt = `You are an expert content creator. Generate a detailed outline for ${topic}.
The outline should include:
1. Clear title
2. Introduction/overview
3. Main sections with bullet points
4. Conclusion
5. Visual elements suggestions
6. Estimated time/length

Style: ${style}
Format: JSON structure with title, sections, and visualElements fields.`

    return await this.generate(systemPrompt, `Create an outline for: ${topic}`)
  }

  async improveContent(content: string, feedback: string): Promise<string> {
    const systemPrompt = `You are an expert editor. Improve the given content based on the feedback.
Focus on:
1. Clarity and readability
2. Structure and flow
3. Tone and style consistency
4. Completeness and accuracy
5. Engagement and impact

Return the improved content maintaining the original format and structure.`

    return await this.generate(systemPrompt, `Content: ${content}\n\nFeedback: ${feedback}`)
  }
}

export const mistralClient = new MistralClient()

// Helper function for backward compatibility
export async function generateWithMistral(
  systemPrompt: string,
  userPrompt: string,
  options?: Partial<MistralConfig>
): Promise<string> {
  return await mistralClient.generate(systemPrompt, userPrompt, options)
}

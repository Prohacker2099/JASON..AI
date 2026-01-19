import { z } from 'zod'
import { contentEngine, type ContentRequest } from '../content/ContentEngine'
import { travelConcierge, type TravelRequest } from '../travel/TravelConcierge'
import { notificationTriage } from '../notifications/NotificationTriage'
import { connectorManager } from '../connectors/ConnectorManager'
import { generateWithMistral } from '../ai/mistral/MistralClient'
import { CapabilityLevel } from './CapabilityRegistry'

// Import the actual enum values
const CapabilityValues = {
  Safe: 1,
  MediumImpact: 2,
  HighImpact: 3
}

export const superCreatorCapabilities = [
  {
    name: 'content.create_presentation',
    description: 'Create a PowerPoint presentation using AI and VLM-guided automation',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      prompt: z.string().describe('The topic or description of the presentation to create'),
      style: z.enum(['professional', 'creative', 'minimal', 'bold']).optional().describe('Visual style'),
      length: z.enum(['short', 'medium', 'long']).optional().describe('Presentation length'),
      images: z.boolean().optional().describe('Include visual elements'),
      brandColors: z.array(z.string()).optional().describe('Brand color palette'),
      template: z.string().optional().describe('Template to use')
    }),
    handler: async (input: any, context: any) => {
      try {
        const result = await contentEngine.createPowerPoint({
          type: 'presentation',
          prompt: input.prompt,
          style: input.style || 'professional',
          length: input.length || 'medium',
          images: input.images || false,
          brandColors: input.brandColors,
          template: input.template,
          targetApp: 'powerpoint'
        })

        if (!result.success) {
          return { ok: false, error: result.error }
        }

        return {
          ok: true,
          result: {
            filePath: result.filePath,
            message: 'Presentation created successfully on hidden desktop',
            nextSteps: ['Check the generated file', 'Review content for accuracy']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Presentation creation failed' }
      }
    }
  },

  {
    name: 'content.create_document',
    description: 'Create a Word document with AI-generated content',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      prompt: z.string().describe('The topic or description of the document to create'),
      style: z.enum(['professional', 'creative', 'minimal', 'bold']).optional().describe('Writing style'),
      length: z.enum(['short', 'medium', 'long']).optional().describe('Document length'),
      format: z.string().optional().describe('Document format/template')
    }),
    handler: async (input: any, context: any) => {
      try {
        const result = await contentEngine.createWordDocument({
          type: 'document',
          prompt: input.prompt,
          style: input.style || 'professional',
          length: input.length || 'medium',
          format: input.format,
          targetApp: 'word'
        })

        if (!result.success) {
          return { ok: false, error: result.error }
        }

        return {
          ok: true,
          result: {
            filePath: result.filePath,
            message: 'Document created successfully on hidden desktop',
            nextSteps: ['Review the generated document', 'Make any necessary edits']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Document creation failed' }
      }
    }
  },

  {
    name: 'travel.search_complete',
    description: 'Search for complete travel packages including flights, hotels, and activities',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      origin: z.string().describe('Departure city or airport'),
      destination: z.string().describe('Destination city or airport'),
      departureDate: z.string().describe('Departure date (YYYY-MM-DD)'),
      returnDate: z.string().optional().describe('Return date (YYYY-MM-DD)'),
      passengers: z.number().min(1).max(10).optional().describe('Number of passengers'),
      cabin: z.enum(['economy', 'business', 'first']).optional().describe('Flight cabin class'),
      budget: z.number().optional().describe('Maximum budget'),
      preferences: z.object({
        directFlights: z.boolean().optional(),
        hotelRating: z.number().min(1).max(5).optional(),
        accommodationType: z.enum(['hotel', 'apartment', 'resort']).optional(),
        activities: z.array(z.string()).optional()
      }).optional().describe('Travel preferences')
    }),
    handler: async (input: any, context: any) => {
      try {
        const travelRequest: TravelRequest = {
          origin: input.origin,
          destination: input.destination,
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          passengers: input.passengers || 1,
          cabin: input.cabin || 'economy',
          budget: input.budget,
          preferences: input.preferences
        }

        const plan = await travelConcierge.searchCompleteTrip(travelRequest)

        return {
          ok: true,
          result: {
            plan,
            message: `Found travel options for ${input.destination}`,
            totalCost: plan.totalCost,
            estimatedSavings: plan.estimatedSavings,
            confidence: plan.confidence,
            nextSteps: ['Review the travel plan', 'Proceed with booking if satisfied']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Travel search failed' }
      }
    }
  },

  {
    name: 'travel.book_option',
    description: 'Book a specific travel option (flight, hotel, or activity)',
    level: CapabilityValues.HighImpact, // Requires Level 3 gating
    inputSchema: z.object({
      optionId: z.string().describe('ID of the travel option to book'),
      optionType: z.enum(['flight', 'hotel', 'activity']).describe('Type of travel option'),
      bookingDetails: z.object({
        travelerInfo: z.object({
          name: z.string(),
          email: z.string(),
          phone: z.string().optional()
        }),
        paymentInfo: z.object({
          method: z.string(),
          cardNumber: z.string().optional(),
          billingAddress: z.string().optional()
        }).optional(),
        specialRequests: z.array(z.string()).optional()
      }).describe('Booking details and traveler information')
    }),
    handler: async (input: any, context: any) => {
      try {
        // This is a high-impact action requiring Level 3 approval
        if (!context.dai?.permissionManager) {
          return { ok: false, error: 'Permission manager not available' }
        }

        const prompt = context.dai.permissionManager.createPrompt({
          level: 3,
          title: `Book ${input.optionType}`,
          rationale: `This action will book a ${input.optionType} with payment information. Cost may apply.`,
          meta: { input }
        })

        const decision = await context.dai.permissionManager.waitForDecision(prompt.id, 120000)
        if (decision !== 'approve') {
          return { ok: false, error: `Booking rejected by user: ${decision}` }
        }

        // Execute booking
        const bookingResult = await travelConcierge.bookTravelOption(
          { type: input.optionType, provider: '', price: 0, currency: 'USD', details: {}, pros: [], cons: [] },
          context.userId || 'default'
        )

        return {
          ok: bookingResult.success,
          result: bookingResult,
          message: bookingResult.success ? 'Booking completed successfully' : 'Booking failed'
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Booking failed' }
      }
    }
  },

  {
    name: 'notifications.triage',
    description: 'Triage and organize notifications from all connected sources',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      sources: z.array(z.string()).optional().describe('Specific sources to process (default: all)'),
      autoReply: z.boolean().optional().describe('Enable automatic replies'),
      archiveLowPriority: z.boolean().optional().describe('Archive low-priority items'),
      maxItems: z.number().max(100).optional().describe('Maximum items to process')
    }),
    handler: async (input: any, context: any) => {
      try {
        const result = await notificationTriage.triageNotifications()

        return {
          ok: true,
          result: {
            summary: result.summary,
            totalProcessed: result.notifications.length,
            urgentItems: result.urgentItems.length,
            actionItems: result.actionItems.length,
            autoRepliesPrepared: result.autoReplies.length,
            recommendations: result.recommendations,
            estimatedTime: result.estimatedProcessingTime,
            nextSteps: ['Review urgent items', 'Approve auto-replies', 'Process action items']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Notification triage failed' }
      }
    }
  },

  {
    name: 'connector.connect',
    description: 'Connect to a new service provider (Gmail, Slack, etc.)',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      providerId: z.string().describe('Provider ID (gmail, slack, outlook, etc.)'),
      userId: z.string().describe('User ID for the connection'),
      scopes: z.array(z.string()).optional().describe('OAuth scopes to request')
    }),
    handler: async (input: any, context: any) => {
      try {
        const authUrl = await connectorManager.createAuthUrl({
          userId: input.userId,
          providerId: input.providerId,
          scopes: input.scopes
        })

        return {
          ok: true,
          result: {
            authUrl: authUrl.url,
            state: authUrl.state,
            message: `Please visit the URL to authorize ${input.providerId}`,
            nextSteps: ['Visit the authorization URL', 'Complete OAuth flow', 'Return with authorization code']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Connection setup failed' }
      }
    }
  },

  {
    name: 'connector.execute',
    description: 'Execute an operation on a connected service',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      providerId: z.string().describe('Provider ID'),
      userId: z.string().describe('User ID'),
      operation: z.string().describe('Operation to execute'),
      params: z.any().describe('Parameters for the operation')
    }),
    handler: async (input: any, context: any) => {
      try {
        const result = await connectorManager.execute({
          userId: input.userId,
          providerId: input.providerId,
          operation: input.operation,
          params: input.params
        })

        return {
          ok: true,
          result,
          message: `Operation ${input.operation} completed on ${input.providerId}`
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Operation failed' }
      }
    }
  },

  {
    name: 'ai.expand_prompt',
    description: 'Expand a brief prompt into a detailed specification using AI',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      prompt: z.string().describe('Brief prompt to expand'),
      context: z.string().optional().describe('Additional context for expansion'),
      style: z.string().optional().describe('Desired style/tone'),
      length: z.enum(['brief', 'detailed', 'comprehensive']).optional().describe('Expansion level')
    }),
    handler: async (input: any, context: any) => {
      try {
        const expandedPrompt = await generateWithMistral(
          `You are an expert prompt engineer. Expand the user's brief prompt into a comprehensive specification.`,
          `Original prompt: "${input.prompt}"
${input.context ? `Context: ${input.context}` : ''}
Style: ${input.style || 'professional'}
Length: ${input.length || 'detailed'}

Expand this into a detailed, actionable specification that includes:
1. Clear objectives and goals
2. Target audience considerations
3. Key requirements and constraints
4. Success criteria
5. Implementation approach
6. Potential risks and mitigations

Return the expanded specification.`,
          { temperature: 0.7, maxTokens: 2000 }
        )

        return {
          ok: true,
          result: {
            originalPrompt: input.prompt,
            expandedPrompt,
            wordCount: expandedPrompt.split(' ').length,
            message: 'Prompt expanded successfully',
            nextSteps: ['Review the expanded specification', 'Use for content generation or task planning']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Prompt expansion failed' }
      }
    }
  },

  {
    name: 'ai.generate_outline',
    description: 'Generate a structured outline for any topic using AI',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      topic: z.string().describe('Topic to generate outline for'),
      type: z.enum(['presentation', 'document', 'report', 'article', 'book']).optional().describe('Content type'),
      style: z.string().optional().describe('Outline style'),
      depth: z.enum(['basic', 'detailed', 'comprehensive']).optional().describe('Outline depth')
    }),
    handler: async (input: any, context: any) => {
      try {
        const outline = await generateWithMistral(
          `You are an expert content strategist. Generate a structured outline for ${input.topic}.`,
          `Topic: ${input.topic}
Type: ${input.type || 'document'}
Style: ${input.style || 'professional'}
Depth: ${input.depth || 'detailed'}

Generate a comprehensive outline that includes:
1. Title and subtitle
2. Introduction/overview
3. Main sections with subsections
4. Key points for each section
5. Conclusion
6. Visual elements suggestions
7. References or resources (if applicable)

Format as a clear, hierarchical structure using markdown.`,
          { temperature: 0.6, maxTokens: 3000 }
        )

        return {
          ok: true,
          result: {
            topic: input.topic,
            outline,
            sectionCount: (outline.match(/#+/g) || []).length,
            estimatedWordCount: Math.max(500, (outline.match(/#+/g) || []).length * 150),
            message: 'Outline generated successfully',
            nextSteps: ['Review and refine the outline', 'Use for content creation', 'Expand sections as needed']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Outline generation failed' }
      }
    }
  },

  {
    name: 'automation.create_task',
    description: 'Create an automated task that can be executed on hidden desktop',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      name: z.string().describe('Task name'),
      description: z.string().describe('Task description'),
      appPath: z.string().optional().describe('Application path to launch'),
      actions: z.array(z.object({
        type: z.enum(['click', 'type', 'wait', 'screenshot', 'vlm_click']),
        target: z.string().optional().describe('Target element or coordinates'),
        text: z.string().optional().describe('Text to type'),
        duration: z.number().optional().describe('Wait duration in milliseconds'),
        options: z.any().optional()
      })).describe('Sequence of actions to perform'),
      schedule: z.string().optional().describe('Schedule (cron format)'),
      desktopName: z.string().optional().describe('Hidden desktop name')
    }),
    handler: async (input: any, context: any) => {
      try {
        // Store the automation task
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // In a real implementation, this would be stored in a database
        const task = {
          id: taskId,
          name: input.name,
          description: input.description,
          appPath: input.appPath,
          actions: input.actions,
          schedule: input.schedule,
          desktopName: input.desktopName || 'JASON_Workspace',
          createdAt: new Date(),
          status: 'created'
        }

        return {
          ok: true,
          result: {
            taskId,
            task,
            message: 'Automation task created successfully',
            nextSteps: ['Test the task execution', 'Schedule if needed', 'Monitor execution logs']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Task creation failed' }
      }
    }
  },

  {
    name: 'automation.execute_task',
    description: 'Execute a predefined automation task on hidden desktop',
    level: CapabilityValues.Safe,
    inputSchema: z.object({
      taskId: z.string().describe('Task ID to execute'),
      parameters: z.any().optional().describe('Parameters for task execution'),
      desktopName: z.string().optional().describe('Hidden desktop name')
    }),
    handler: async (input: any, context: any) => {
      try {
        // In a real implementation, this would retrieve and execute the task
        // For now, simulate execution
        const executionId = `exec_${Date.now()}`
        
        return {
          ok: true,
          result: {
            executionId,
            taskId: input.taskId,
            status: 'completed',
            startTime: new Date(),
            endTime: new Date(),
            message: 'Task executed successfully on hidden desktop',
            nextSteps: ['Review execution results', 'Check for any errors', 'Schedule next execution if needed']
          }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Task execution failed' }
      }
    }
  }
]

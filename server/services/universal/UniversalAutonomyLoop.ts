import { UniversalAppController, UniversalCommand, VLMResult } from './UniversalAppController'
import { mistralClient } from '../ai/mistral/MistralClient'
import { EventEmitter } from 'events'
import { SCRLEngine, SCRLState } from '../ai/selfLearning/SCRL'
import { SelfLearningEngine } from '../ai/selfLearning/Engine'

interface AutonomyStep {
    goal: string
    currentReasoning: string
    nextAction: {
        type: 'click' | 'type' | 'scroll' | 'done' | 'fail' | 'narrate' | 'wait_for_user'
        target?: string
        text?: string
        reason: string
        message?: string // For narration
    }
}

export class UniversalAutonomyLoop extends EventEmitter {
    private appController: UniversalAppController
    private scrl: SCRLEngine
    private maxSteps: number = 20
    private running: boolean = false

    constructor(appController: UniversalAppController) {
        super()
        this.appController = appController
        // Initialize SCRL with a generic engine for now
        const sle = new SelfLearningEngine()
        this.scrl = new SCRLEngine(sle)
    }

    async executeGoal(goal: string): Promise<boolean> {
        if (this.running) throw new Error("Autonomy loop already running")
        this.running = true
        console.log(`[AutonomyLoop] Starting goal: "${goal}"`)

        try {
            for (let stepCount = 0; stepCount < this.maxSteps; stepCount++) {
                // 1. Capture & Analyze State (See)
                console.log(`[AutonomyLoop] Step ${stepCount + 1}: Analyzing screen...`)
                const screenContext = await this.appController.describeScreen()
                console.log(`[AutonomyLoop] Screen describes: "${screenContext}"`)

                // 2. Reason (Think)
                const plan: AutonomyStep = await this.askLLM(goal, stepCount, screenContext)

                console.log(`[AutonomyLoop] reasoning: ${plan.currentReasoning}`)
                console.log(`[AutonomyLoop] verification: Action=${plan.nextAction.type} Target=${plan.nextAction.target}`)

                if (plan.nextAction.type === 'done') {
                    console.log(`[AutonomyLoop] Goal completed!`)
                    return true
                }

                if (plan.nextAction.type === 'narrate') {
                    console.log(`[AutonomyLoop] JASON: ${plan.nextAction.message}`)
                    // Broadcast to UI via SSE or similar if available
                    continue
                }

                if (plan.nextAction.type === 'wait_for_user') {
                    console.log(`[AutonomyLoop] Waiting for user input/action: ${plan.nextAction.message}`)
                    // In a production loop, we'd pause and wait for a signal
                    await new Promise(r => setTimeout(r, 5000))
                    continue
                }

                // 3. Execute (Act)
                const preActionPerformance = this.measureSystemPerformance();
                await this.executeAction(plan.nextAction)

                // Wait for UI to settle
                await new Promise(r => setTimeout(r, 2000))

                // 4. Learn (Reinforce)
                const postScreenContext = await this.appController.describeScreen()
                const alignmentScore = this.calculateAlignment(plan.nextAction, screenContext, postScreenContext)

                const currentState: SCRLState = {
                    domain: 'universal_autonomy',
                    context: [screenContext],
                    securityLevel: 1,
                    timestamp: Date.now(),
                    performance: preActionPerformance
                }

                const nextState: SCRLState = {
                    domain: 'universal_autonomy',
                    context: [postScreenContext],
                    securityLevel: 1,
                    timestamp: Date.now(),
                    performance: this.measureSystemPerformance()
                }

                await this.scrl.reviewExecution(
                    plan.nextAction.reason,
                    plan.nextAction.target || 'none',
                    currentState,
                    nextState,
                    alignmentScore
                )
            }

            throw new Error("Max steps reached without completion")

        } catch (e) {
            console.error(`[AutonomyLoop] Error: ${e}`)
            return false
        } finally {
            this.running = false
        }
    }

    private async askLLM(goal: string, stepIndex: number, screenContext: string): Promise<AutonomyStep> {
        // In a full implementation, we would feed back the history of previous steps/results.
        // For this streamlined version, we prompt for the NEXT logical logical step.

        const systemPrompt = `You are an autonomous GUI agent.
        Goal: "${goal}"
        Step: ${stepIndex + 1}
        Current Screen State: "${screenContext}"
        Reflect on the goal. What is the immediate next physical UI action required?
        If the goal implies opening an app, search for it or click its icon.
        If the goal implies typing, click the field then type.
        
        PRODUCTION REALITY:
        - If the user needs to confirm a high-risk action (payment, booking), use "narrate" to explain and "wait_for_user" to get confirmation.
        - NEVER simulate. If you can't see the element, narrate the problem.
        
        Respond ONLY in JSON format:
        {
            "currentReasoning": "Why this action is needed",
            "nextAction": {
                "type": "click" | "type" | "scroll" | "narrate" | "wait_for_user" | "done" | "fail",
                "target": "text description of element to interact with",
                "text": "text to type if type action",
                "message": "message to user for narrate/wait_for_user",
                "reason": "short rationale"
            }
        }`

        // We use the Mistral Client
        const responseText = await mistralClient.generate(systemPrompt, `Goal: ${goal}`)

        // Clean markdown if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            return JSON.parse(jsonStr)
        } catch (e) {
            // Fallback for malformed JSON - rudimentary repair or fail
            console.warn("LLM returned invalid JSON, retrying or failing gracefully.")
            throw new Error("Invalid LLM JSON response")
        }
    }

    private async executeAction(action: AutonomyStep['nextAction']): Promise<void> {
        const cmd: UniversalCommand = {
            id: `auto_${Date.now()}`,
            intent: 'autonomy_step',
            app: 'desktop', // Generic context
            action: action.type,
            parameters: {
                target: action.target,
                text: action.text
            },
            priority: 'high',
            permissions: ['ui_control'],
            execution: {
                type: 'vlm', // Force VLM usage to find elements visually
                confidence: 0.8
            }
        }

        if (action.type === 'click' || action.type === 'type') {
            // UniversalAppController handles the "VLM find -> Click" logic via executeUniversalCommand
            await this.appController.executeUniversalCommand(cmd)
        }
    }

    private measureSystemPerformance(): number {
        // Mock performance metric (e.g., system load or response latency)
        return 0.9
    }

    private calculateAlignment(action: AutonomyStep['nextAction'], before: string, after: string): number {
        // Rudimentary alignment check: did the screen change?
        if (action.type === 'click' || action.type === 'type') {
            return before !== after ? 1.0 : 0.2
        }
        return 0.5
    }
}

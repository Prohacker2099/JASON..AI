// core/LocalAI.ts

import { EventEmitter } from 'events';
import { behavioralLearningService } from '../server/services/ai/behavioral-learning';
import { predictiveAutomationEngine } from '../server/services/ai/predictive-automation-engine';
import { aiSceneCreator } from '../server/services/ai/ai-scene-creator';
import { localVoiceAssistant } from './VoiceAssistant'; // Assuming LocalVoiceAssistant is defined

export class LocalAI extends EventEmitter {
  constructor() {
    super();
    console.log('LocalAI initialized: The privacy-first, on-device AI brain.');
    this.initializeListeners();
  }

  private initializeListeners() {
    // Listen for insights from behavioral learning
    behavioralLearningService.on('newInsight', (insight) => {
      console.log('LocalAI received new insight from BehavioralLearningService:', insight);
      // LocalAI can decide to trigger proactive actions or inform the user
      if (insight.type === 'morningRoutineDetected') {
        localVoiceAssistant.initiateProactiveConversation('Alex', "I've noticed your morning routine is consistent. Would you like me to prepare your coffee?");
      }
    });

    // Listen for new predictions from the predictive automation engine
    predictiveAutomationEngine.on('newPrediction', (prediction) => {
      console.log('LocalAI received new prediction from PredictiveAutomationEngine:', prediction);
      // LocalAI can decide to execute the prediction or ask for user confirmation
      if (prediction.type === 'carPreheating' && prediction.confidence > 0.7) {
        localVoiceAssistant.initiateProactiveConversation('Alex', `I predict you'll be leaving soon. Shall I start pre-heating your car for your ${prediction.details.reason} trip?`);
        // In a real app, wait for user confirmation before executing:
        // predictiveAutomationEngine.executePrediction(prediction);
      }
    });

    // Listen for scene activations
    aiSceneCreator.on('sceneActivated', (scene) => {
      console.log('LocalAI received scene activation:', scene);
      localVoiceAssistant.speak(`Scene "${scene.name}" has been activated.`);
    });

    // Listen for voice commands from the local voice assistant
    localVoiceAssistant.on('commandProcessed', (command) => {
      console.log('LocalAI received processed command from LocalVoiceAssistant:', command);
      // LocalAI can further process complex commands or route to LLMService
    });
  }

  /**
   * Processes a query locally using its internal models and learned data.
   * For complex queries, it might route to an external LLM.
   * @param query The user's query.
   * @param userId The ID of the user.
   * @returns A promise resolving to the response.
   */
  public async processQuery(query: string, userId: string): Promise<string> {
    console.log(`LocalAI processing query for ${userId}: "${query}"`);

    // Example of local processing:
    if (query.toLowerCase().includes('what is my sleep score')) {
      // In a real app, integrate with DigitalWellnessManager
      return "Your sleep score last night was 8.5, indicating good restorative sleep.";
    }

    // Example of routing to external LLM for complex queries
    if (query.toLowerCase().includes('summarize today\'s news') || query.toLowerCase().includes('implications of ai advancements')) {
      // This would typically involve calling LLMService
      // For now, simulate a response
      return "That's a complex query. I'll need to consult my external knowledge base for that.";
    }

    // Default response if not handled locally
    return "I'm still learning, but I can help with smart home controls and proactive suggestions.";
  }

  /**
   * Provides personalized phrasing and adaptive tones for responses.
   * @param baseResponse The base response text.
   * @param userId The ID of the user.
   * @returns The personalized response.
   */
  public personalizeResponse(baseResponse: string, userId: string): string {
    // In a real app, this would use user profile data and learned communication styles
    const personalizedPrefixes = [
      "Just for you, here's what I found:",
      "Based on your preferences:",
      "Thinking of you, I'd say:",
    ];
    const randomPrefix = personalizedPrefixes[Math.floor(Math.random() * personalizedPrefixes.length)];
    return `${randomPrefix} ${baseResponse}`;
  }
}

export const localAI = new LocalAI();
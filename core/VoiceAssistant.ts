
      this.processVoiceInput();
    }, 2000);
  }

  
  private async processVoiceInput(text: string) {
    this.stopListening();
    this.isProcessing = true;
    this.emit('processingStart');
    console.log(`Voice Assistant: Processing "${text}"...`);

    

    console.log('Voice Assistant: LLM Response:', llmResponse);

    
          const thermostatId = 'thermostat'; // Assuming a generic thermostat ID
          await deviceManager.sendDeviceCommand(thermostatId, 'setTemperature', { temperature });
          this.speak(`Setting the temperature to ${temperature} degrees Celsius.`);
        } else {
          this.speak('Please specify the temperature you would like to set.');
        }
        break;
      case 'suggestScene':
        const sceneType = llmResponse.entities.sceneType;
        if (sceneType) {
          const suggestions = await aiSceneCreator.suggestScenes('user-123', sceneType);
          if (suggestions.length > 0) {
            this.speak(`I found a scene called "${suggestions[0].name}". Would you like me to activate it?`);
          } else {
            this.speak(`I couldn't find any scenes for "${sceneType}".`);
          }
        } else {
          this.speak('Please specify what kind of scene you are looking for.');
        }
        break;
      case 'getWeather':
      case 'summarizeNews':
      case 'tellJoke':
      case 'getName':
        this.speak(llmResponse.responseText);
        break;
      case 'generalQuery':
      default:
        // If LLM doesn't have a specific intent, route to LocalAI for further processing
        console.log('Voice Assistant: Routing general query to LocalAI.');
        const localAIResponse = await localAI.processQuery(text, 'user-123');
        this.speak(localAIResponse);
        break;
    }

    this.isProcessing = false;
    this.emit('processingEnd');
    this.emit('commandProcessed', { text, command: llmResponse }); // Emit LLM response as command
  }

  /**
   * Speaks a response using Natural Language Generation (NLG).
   * @param text The text to speak.
   */
  public speak(text: string) {
    console.log(`JASON: ${text}`);
    this.emit('speak', text);
    // In a real app, this would use a Text-to-Speech (TTS) engine
  }

  /**
   * Initiates a proactive conversation with the user.
   * @param userName The name of the user.
   * @param suggestion A proactive suggestion or question.
   */
  public initiateProactiveConversation(userName: string, suggestion: string) {
    const proactiveMessage = `Good evening, ${userName}. ${suggestion}`;
    this.speak(proactiveMessage);
  }
}

export const localVoiceAssistant = new LocalVoiceAssistant();
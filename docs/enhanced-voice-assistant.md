# Enhanced Voice Assistant with Emotional Intelligence

JASON now includes an enhanced voice assistant with emotional intelligence that integrates with Alexa and Google Assistant. This document explains how to use and configure this feature.

## Overview

The enhanced voice assistant provides the following capabilities:

1. **Emotional Intelligence**: Detects and responds to user emotions, adapting its responses accordingly
2. **Multi-Platform Integration**: Works with Alexa, Google Assistant, and JASON's own voice interface
3. **Contextual Understanding**: Maintains conversation context for more natural interactions
4. **Personalized Suggestions**: Provides relevant suggestions based on user preferences and history
5. **Voice Modulation**: Uses SSML to express emotions through voice tone and pacing

## Supported Emotions

The voice assistant can detect and respond to the following emotions:

- **Neutral**: Default emotional state
- **Happy**: Detected when users express joy or satisfaction
- **Sad**: Detected when users express disappointment or sadness
- **Angry**: Detected when users express frustration or anger
- **Frustrated**: Detected when users encounter problems or difficulties
- **Confused**: Detected when users express uncertainty or lack of understanding
- **Excited**: Detected when users express enthusiasm or anticipation
- **Tired**: Detected when users express fatigue or weariness
- **Urgent**: Detected when users need immediate assistance

## Integration with Alexa

### Setup

1. Create an Alexa Skill in the Amazon Developer Console
2. Configure the skill to use your JASON server as the endpoint
3. Set the following environment variables in your JASON server:
   ```
   ENABLE_ALEXA=true
   ALEXA_CLIENT_ID=your_client_id
   ALEXA_CLIENT_SECRET=your_client_secret
   ALEXA_SKILL_ID=your_skill_id
   ALEXA_ACCOUNT_LINKING_URL=your_account_linking_url
   ```

### Usage

Once configured, you can interact with JASON through Alexa using commands like:

- "Alexa, ask JASON to turn on the living room lights"
- "Alexa, tell JASON I'm feeling tired"
- "Alexa, ask JASON what's the temperature in the bedroom"

The voice assistant will detect your emotional state from your voice and adapt its responses accordingly.

## Integration with Google Assistant

### Setup

1. Create a Google Actions project in the Google Actions Console
2. Configure the project to use your JASON server as the fulfillment endpoint
3. Set the following environment variables in your JASON server:
   ```
   ENABLE_GOOGLE_ASSISTANT=true
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_PROJECT_ID=your_project_id
   GOOGLE_ACCOUNT_LINKING_URL=your_account_linking_url
   ```

### Usage

Once configured, you can interact with JASON through Google Assistant using commands like:

- "Hey Google, ask JASON to turn on the kitchen lights"
- "Hey Google, tell JASON I'm feeling excited"
- "Hey Google, ask JASON what's the humidity in the bathroom"

The voice assistant will detect your emotional state from your voice and adapt its responses accordingly.

## JASON's Native Voice Interface

JASON includes its own voice interface that can be accessed through the web UI or mobile app.

### Usage

1. Click the microphone icon or use the "Listen" button in the voice assistant panel
2. Speak your command clearly
3. JASON will process your command and respond with an emotionally appropriate response

You can also manually select your emotional state from the dropdown menu to see how JASON adapts its responses.

## Emotional Response Adaptation

The voice assistant adapts its responses based on the detected emotional state:

- For **urgent** requests, responses are quick and direct
- For **happy** or **excited** users, responses match the positive energy
- For **sad** or **angry** users, responses are empathetic and calming
- For **confused** users, responses provide additional clarity
- For **frustrated** users, responses focus on problem-solving
- For **tired** users, responses are concise and straightforward

## Voice Modulation with SSML

The voice assistant uses Speech Synthesis Markup Language (SSML) to express emotions through voice:

- **Happy/Excited**: Higher pitch, faster pace
- **Sad**: Lower pitch, slower pace
- **Angry**: Slightly higher pitch, faster pace, louder volume
- **Urgent**: Higher pitch, faster pace, much louder volume
- **Confused**: Slightly lower pitch, normal pace
- **Frustrated**: Slightly higher pitch, normal pace
- **Tired**: Lower pitch, slower pace

## Developer API

Developers can integrate with the enhanced voice assistant using the following API endpoints:

### Process a Voice Command

```
POST /api/voice-assistant/jason

{
  "command": "Turn on the living room lights",
  "userId": "user123",
  "deviceId": "device456",
  "emotion": "happy",
  "confidence": 0.9
}
```

Response:

```json
{
  "response": "I'm happy to help! Turning on the living room lights now.",
  "ssml": "<speak><prosody rate=\"medium\" pitch=\"+10%\">I'm happy to help! Turning on the living room lights now.</prosody></speak>",
  "emotion": "happy",
  "suggestions": [
    "Turn off the living room lights",
    "Dim the living room lights",
    "What's the weather like?",
    "Play some music",
    "Tell me a joke"
  ],
  "actions": [
    {
      "type": "device_control",
      "deviceId": "device456",
      "command": "Turn on the living room lights"
    }
  ]
}
```

## Learning and Improvement

The voice assistant continuously learns from interactions to improve its responses:

1. **Command History**: Stores command history to learn user preferences
2. **Emotional Patterns**: Identifies patterns in emotional states
3. **Context Awareness**: Maintains conversation context for more natural interactions
4. **Suggestion Refinement**: Improves suggestions based on user choices

## Troubleshooting

If you encounter issues with the voice assistant:

1. **Voice Recognition Issues**: Ensure you're speaking clearly and in a quiet environment
2. **Emotion Detection Issues**: Try manually selecting your emotion from the dropdown
3. **Integration Issues**: Check your environment variables and network connectivity
4. **Response Issues**: Check the server logs for error messages

For additional help, refer to the server logs or contact support.

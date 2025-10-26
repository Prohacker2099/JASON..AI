import { Insight } from '../types/Insight';

class AIInsightsService {
  private insights: Insight[] = [
    {
      id: 'energy-1',
      type: 'energy',
      message: 'Your energy consumption is 15% lower than last week. Great job!',
      actionable: true,
      priority: 2
    },
    {
      id: 'wellness-1',
      type: 'wellness',
      message: 'Your sleep score last night was 8.2 - consider adjusting your evening routine.',
      actionable: false,
      priority: 1
    },
    {
      id: 'productivity-1',
      type: 'productivity',
      message: 'You have been very focused this week. Keep up the great work!',
      actionable: true,
      priority: 3
    }
  ];

  async generateInsight(context: string): Promise<string> {
    const contextInsights: Record<string, string[]> = {
      'energy': [
        'Your energy consumption is trending downward.',
        'Consider using smart power strips to reduce standby power.',
        'Peak energy usage occurs during evening hours.'
      ],
      'wellness': [
        'Maintain a consistent sleep schedule for better rest.',
        'Your activity levels suggest good overall health.',
        'Consider adding more mindfulness practices to your routine.'
      ],
      'productivity': [
        'You are most productive in the morning hours.',
        'Try the Pomodoro technique to maintain focus.',
        'Regular breaks can improve overall productivity.'
      ]
    };

    const insights = contextInsights[context] || [];
    return insights[Math.floor(Math.random() * insights.length)] || 'No specific insight available.';
  }

  async processVoiceCommand(transcript: string): Promise<{
    type: 'device_control' | 'query';
    deviceId?: string;
    action?: string;
    context?: string;
  }> {
    // Simple voice command processing
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes('lights') && lowerTranscript.includes('on')) {
      return { type: 'device_control', deviceId: 'light-1', action: 'on' };
    }

    if (lowerTranscript.includes('lights') && lowerTranscript.includes('off')) {
      return { type: 'device_control', deviceId: 'light-1', action: 'off' };
    }

    if (lowerTranscript.includes('energy') || lowerTranscript.includes('wellness')) {
      return { type: 'query', context: lowerTranscript.includes('energy') ? 'energy' : 'wellness' };
    }

    return { type: 'query', context: 'productivity' };
  }
}

export default new AIInsightsService();

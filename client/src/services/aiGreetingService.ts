import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api'; // Assuming your server runs on port 3001

export const aiGreetingService = {
  getGreeting: async (userName: string, context: string): Promise<{ greeting: string; insight: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/greeting`, { userName, context });
      // Assuming the backend now returns an object with greeting and insight
      return response.data;
    } catch (error) {
      console.error('Error fetching AI greeting:', error);
      // Fallback greeting and insight
      const fallbackInsights = [
        'Your coffee machine is pre-heating.',
        'Traffic looks clear for your commute.',
        'The living room lights are on.',
        'Your car is pre-heating for your 8 AM appointment.'
      ];
      const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
      return {
        greeting: `Hello, ${userName}!`,
        insight: randomInsight
      };
    }
  },
};
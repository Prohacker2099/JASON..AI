// shared/types/user.ts

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    temperatureUnit: 'C' | 'F';
    timeFormat: '12h' | '24h';
    // Add more user preferences here
  };
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  // Add more user-related properties as needed
}
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    preferences: {
        temperatureUnit: 'C' | 'F';
        timeFormat: '12h' | '24h';
    };
    location: {
        latitude: number;
        longitude: number;
        timezone: string;
    };
}

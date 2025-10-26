import { Device, CalendarEvent, CarStatus, SceneSuggestion, PredictiveAutomation, DeviceType } from '../lib/types';

// Local light-weight types for endpoints not defined in lib/types
export interface InsightsData { [key: string]: any }
export interface AutomationRule { id: string; name: string; description?: string; active?: boolean }
export interface SharingSettings { [key: string]: any }
export interface Nudge { id: string; message: string; severity?: 'info'|'warning'|'error' }
export interface Activity { id: string; time: string; type: string; details?: any }

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed: ${response.statusText}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error(`Error in API request to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all devices from the backend.
   */
  public async fetchDevices(): Promise<Device[]> {
    return this.request<Device[]>('/devices');
  }

  /**
   * Updates the state of a specific device on the backend.
   * Attempts to map state updates onto the unified control endpoint.
   * @param deviceId The ID of the device to update.
   * @param updates The partial state to apply to the device.
   */
  public async updateDevice(deviceId: string, updates: any): Promise<void> {
    // Map common updates to control actions used by the backend
    if (typeof updates?.on === 'boolean') {
      await this.request(`/devices/control`, 'POST', { deviceId, action: 'toggle', value: updates.on });
      return;
    }
    if (typeof updates?.power === 'number') {
      await this.request(`/devices/control`, 'POST', { deviceId, action: 'setPower', value: updates.power });
      return;
    }
    if (typeof updates?.brightness === 'number') {
      await this.request(`/devices/control`, 'POST', { deviceId, action: 'setBrightness', value: updates.brightness });
      return;
    }
    if (typeof updates?.temperature === 'number') {
      await this.request(`/devices/control`, 'POST', { deviceId, action: 'setTemperature', value: updates.temperature });
      return;
    }
    // Fallback: send raw payload if specific mapping not found (backend may ignore unsupported keys)
    await this.request<void>(`/devices/control`, 'POST', { deviceId, action: 'update', value: updates });
  }

  /**
   * Fetches insights data from the backend.
   */
  public async fetchInsights(): Promise<InsightsData> {
    return this.request<InsightsData>('/insights');
  }

  /**
   * Fetches automation rules from the backend.
   */
  public async fetchAutomationRules(): Promise<AutomationRule[]> {
    return this.request<AutomationRule[]>('/automations');
  }

  /**
   * Fetches sharing settings from the backend.
   */
  public async fetchSharingSettings(): Promise<SharingSettings> {
    return this.request<SharingSettings>('/sharing');
  }

  /**
   * Fetches proactive nudges from the backend.
   */
  public async fetchNudges(): Promise<Nudge[]> {
    return this.request<Nudge[]>('/nudges');
  }

  /**
   * Fetches recent activity stream from the backend.
   */
  public async fetchActivities(): Promise<Activity[]> {
    return this.request<Activity[]>('/activities');
  }

  /**
   * Fetches calendar events for intelligent integration.
   */
  public async fetchCalendarEvents(): Promise<CalendarEvent[]> {
    return this.request<CalendarEvent[]>('/calendar/events');
  }

  /**
   * Fetches current car status for proactive readiness.
   */
  public async fetchCarStatus(): Promise<CarStatus> {
    return this.request<CarStatus>('/car/status');
  }

  /**
   * Fetches AI-suggested scenes.
   */
  public async fetchSceneSuggestions(): Promise<SceneSuggestion[]> {
    return this.request<SceneSuggestion[]>('/scenes/suggestions');
  }

  /**
   * Fetches predictive automation insights.
   */
  public async fetchPredictiveAutomations(): Promise<PredictiveAutomation[]> {
    return this.request<PredictiveAutomation[]>('/automations/predictive');
  }
}

export const apiService = new ApiService();
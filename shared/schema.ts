export interface UserContext {
  recentInteractions: Array<{
    input: string;
    response: AIResponse;
    timestamp: Date;
  }>;
  preferences: Record<string, any>;
  goals: Array<{
    id: string;
    description: string;
    progress: number;
    subgoals?: Array<any>;
  }>;
  lastActivity: Date;
  emotionalState?: EmotionalState;
  patterns?: Pattern[];
}

export interface AIResponse {
  text: string;
  confidence: number;
  suggestions?: Array<any>;
  emotionalContext?: EmotionalState | null;
  intent?: string;
  insights?: AIInsight[];
}

export interface AIModel {
  generate(params: {
    input: string;
    context: UserContext;
    emotional: any;
    intent: string;
    suggestions: any[];
    temperature: number;
  }): Promise<{
    text: string;
    confidence: number;
  }>;
  analyze?(input: string): Promise<any>;
  classifyIntent?(input: string): Promise<string>;
  generateSuggestions?(context: UserContext): Promise<any[]>;
}

export interface DynamicTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  mode: "light" | "dark" | "auto";
}

export interface UserPreferences {
  theme: DynamicTheme;
  layout: {
    widgets: Array<{
      id: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      type: string;
      config: Record<string, any>;
    }>;
    mode: "work" | "relax" | "creative" | "custom";
  };
  notifications: {
    enabled: boolean;
    types: Record<string, boolean>;
    quiet_hours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  privacy: {
    data_collection: Record<string, boolean>;
    sharing_preferences: Record<string, boolean>;
  };
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  category: "core" | "vision" | "voice" | "nlp" | "custom";
  status: "active" | "loading" | "error" | "disabled";
  config: Record<string, any>;
}

export interface SystemMetrics {
  performance: {
    cpu_usage: number;
    memory_usage: number;
    latency: number;
    requests_per_second: number;
  };
  ai: {
    model_performance: Record<string, number>;
    accuracy_metrics: Record<string, number>;
    active_sessions: number;
  };
  network: {
    connected_devices: number;
    bandwidth_usage: number;
    connection_quality: number;
  };
}

// New interfaces for enhanced AI capabilities

export interface EmotionalState {
  primary: string;
  intensity: number;
  valence: number;
  arousal: number;
  spectrum?: Record<string, number>;
  confidence: number;
  timestamp?: Date;
}

export interface Pattern {
  id: string;
  userId: string;
  type: string;
  confidence: number;
  data: any;
  timestamp: Date;
}

export interface AIInsight {
  id: string;
  type: "prediction" | "suggestion" | "alert" | "optimization";
  content: string;
  confidence: number;
  category: string;
  priority: number;
  actionable: boolean;
  source?: string;
}

export interface Catalyst {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  impact: "low" | "medium" | "high";
  type: "automation" | "creativity" | "productivity" | "wellness";
}

export interface APIClient {
  id: string;
  name: string;
  apiKey: string;
  permissions: string[];
  rateLimit: number;
  createdAt: Date;
  lastAccess?: Date;
}

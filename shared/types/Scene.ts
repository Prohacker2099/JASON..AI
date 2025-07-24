/**
 * Scene Types
 *
 * This module defines the types for scenes, scene templates, schedules, and automations.
 */

export interface Scene {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  owner?: string;
  isTemplate?: boolean;
  templateId?: string;
  shared?: boolean;
  deviceStates: Array<{
    deviceId: string;
    state: Record<string, any>;
  }>;
  schedule?: SceneSchedule;
  automation?: SceneAutomation;
  sharedWith?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastActivatedAt?: string;
  tags?: string[];
}

export interface SceneTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  popularity?: number;
  previewImage?: string;
  deviceStates: Array<{
    deviceId: string;
    state: Record<string, any>;
  }>;
}

export interface SceneSchedule {
  id: string;
  type: "time" | "sunrise" | "sunset" | "interval";
  time?: string;
  days?: string[];
  date?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface SceneAutomation {
  id: string;
  type: "device" | "time" | "location" | "weather";
  trigger: Record<string, any>;
  enabled: boolean;
  lastTriggered?: string;
}

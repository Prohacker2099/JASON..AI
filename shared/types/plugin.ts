// shared/types/plugin.ts

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  entryPoint: string; // Path to the main file of the plugin
  configSchema?: Record<string, any>; // JSON schema for plugin configuration
  capabilities: string[]; // e.g., 'deviceControl', 'dataProcessing', 'automation'
  dependencies?: string[]; // Other plugins or external libraries
  installationGuideUrl?: string;
  repositoryUrl?: string;
}

export interface PluginManifest {
  plugins: Plugin[];
}
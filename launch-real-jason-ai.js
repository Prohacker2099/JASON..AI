#!/usr/bin/env node
// Real JASON AI Launcher - Functional Self-Learning AI

import { RealTextInterface, TextInterfaceConfig } from './core/RealAI/RealTextInterface';
import { logger } from './server/src/utils/logger';
import * as path from 'path';
import * as fs from 'fs';

async function launchRealJASONAI() {
  console.log('🚀 Launching Real JASON AI...\n');
  
  try {
    // Create data directory
    const dataPath = path.join(process.cwd(), 'data', 'real-ai');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
      console.log('📁 Created AI data directory:', dataPath);
    }
    
    // Configure Real AI
    const config: TextInterfaceConfig = {
      userId: 'jason_user',
      dataPath: dataPath,
      enableLearning: true,
      enableConsciousness: true,
      enableMemoryReinforcement: true,
      maxMemories: 1000,
      learningThreshold: 0.5,
      consciousnessUpdateInterval: 5000, // 5 seconds
      prompt: 'JASON',
      enableHistory: true,
      enableAutoSave: true,
      autoSaveInterval: 30000 // 30 seconds
    };
    
    console.log('⚙️  Configuration:');
    console.log(`   Data Path: ${config.dataPath}`);
    console.log(`   Learning: ${config.enableLearning ? 'Enabled' : 'Disabled'}`);
    console.log(`   Consciousness: ${config.enableConsciousness ? 'Enabled' : 'Disabled'}`);
    console.log(`   Memory Reinforcement: ${config.enableMemoryReinforcement ? 'Enabled' : 'Disabled'}`);
    console.log(`   Max Memories: ${config.maxMemories}`);
    console.log(`   Auto-Save: ${config.enableAutoSave ? 'Enabled' : 'Disabled'}`);
    console.log('');
    
    // Initialize Real AI
    console.log('🧠 Initializing Real JASON AI...');
    const realAI = new RealTextInterface(config);
    
    // Wait for initialization
    await new Promise(resolve => {
      realAI.once('initialized', resolve);
    });
    
    console.log('✅ Real JASON AI initialized successfully!');
    console.log('🎯 Ready for conversation and learning!\n');
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      console.log('\n\n🔄 Received shutdown signal...');
      await realAI.shutdown();
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n\n🔄 Received termination signal...');
      await realAI.shutdown();
    });
    
    // Keep the process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Failed to launch Real JASON AI:', error);
    process.exit(1);
  }
}

// Run the launcher
if (require.main === module) {
  launchRealJASONAI().catch(error => {
    console.error('❌ Launcher error:', error);
    process.exit(1);
  });
}

export { launchRealJASONAI };

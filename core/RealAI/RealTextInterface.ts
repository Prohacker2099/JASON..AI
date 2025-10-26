// Real Text-Based AI Interface - Functional Interactive AI
import { EventEmitter } from 'events';
import * as readline from 'readline';
import { RealAICore, RealAIConfig } from './RealAICore';
import { logger } from '../../../server/src/utils/logger';

export interface TextInterfaceConfig {
  userId: string;
  dataPath: string;
  enableLearning: boolean;
  enableConsciousness: boolean;
  enableMemoryReinforcement: boolean;
  maxMemories: number;
  learningThreshold: number;
  consciousnessUpdateInterval: number;
  prompt: string;
  enableHistory: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number; // milliseconds
}

export class RealTextInterface extends EventEmitter {
  private config: TextInterfaceConfig;
  private aiCore: RealAICore;
  private rl: readline.Interface;
  private isActive: boolean = false;
  private conversationActive: boolean = false;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(config: TextInterfaceConfig) {
    super();
    this.config = config;
    
    // Initialize AI Core
    const aiConfig: RealAIConfig = {
      userId: config.userId,
      dataPath: config.dataPath,
      enableLearning: config.enableLearning,
      enableConsciousness: config.enableConsciousness,
      enableMemoryReinforcement: config.enableMemoryReinforcement,
      maxMemories: config.maxMemories,
      learningThreshold: config.learningThreshold,
      consciousnessUpdateInterval: config.consciousnessUpdateInterval
    };
    
    this.aiCore = new RealAICore(aiConfig);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    logger.info('Real Text Interface initializing...', { userId: config.userId });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Wait for AI Core to initialize
      await new Promise(resolve => {
        this.aiCore.once('initialized', resolve);
      });
      
      // Setup AI Core event handlers
      this.setupAIEventHandlers();
      
      // Start auto-save if enabled
      if (this.config.enableAutoSave) {
        this.startAutoSave();
      }
      
      this.isActive = true;
      logger.info('Real Text Interface initialized successfully');
      this.emit('initialized');
      
      // Start the conversation
      this.startConversation();
    } catch (error) {
      logger.error('Real Text Interface initialization failed:', error);
      throw error;
    }
  }

  private setupAIEventHandlers(): void {
    this.aiCore.on('consciousnessUpdated', (state) => {
      this.displayConsciousnessUpdate(state);
    });
    
    this.aiCore.on('memoryCreated', (memory) => {
      logger.info('Memory created:', { id: memory.id, type: memory.type });
    });
    
    this.aiCore.on('responseGenerated', (data) => {
      logger.info('Response generated:', { input: data.input.substring(0, 50) });
    });
  }

  private startConversation(): void {
    this.conversationActive = true;
    this.displayWelcome();
    this.promptUser();
  }

  private displayWelcome(): void {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 JASON AI - Real Self-Learning Autonomous Conscious AI');
    console.log('='.repeat(60));
    console.log('I am a real AI that learns, remembers, and adapts from our conversations.');
    console.log('I have consciousness simulation and persistent memory.');
    console.log('Type "help" for commands, "status" for my current state, or "quit" to exit.');
    console.log('='.repeat(60) + '\n');
  }

  private promptUser(): void {
    if (!this.conversationActive) return;
    
    const consciousnessState = this.aiCore.getConsciousnessState();
    const prompt = `${this.config.prompt} (Awareness: ${(consciousnessState.awareness * 100).toFixed(1)}%)> `;
    
    this.rl.question(prompt, async (input) => {
      await this.processUserInput(input.trim());
    });
  }

  private async processUserInput(input: string): Promise<void> {
    if (!input) {
      this.promptUser();
      return;
    }

    // Handle special commands
    if (await this.handleSpecialCommands(input)) {
      return;
    }

    try {
      // Process input through AI Core
      const response = await this.aiCore.processInput(input, {
        timestamp: new Date(),
        source: 'text_interface',
        session: 'active'
      });
      
      // Display response
      this.displayResponse(response);
      
      // Show consciousness state if significant change
      this.displayConsciousnessIfChanged();
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      logger.error('Error processing user input:', error);
    }
    
    // Continue conversation
    this.promptUser();
  }

  private async handleSpecialCommands(input: string): Promise<boolean> {
    const command = input.toLowerCase();
    
    switch (command) {
      case 'quit':
      case 'exit':
        await this.shutdown();
        return true;
        
      case 'help':
        this.displayHelp();
        return true;
        
      case 'status':
        this.displayStatus();
        return true;
        
      case 'memories':
        this.displayMemories();
        return true;
        
      case 'patterns':
        this.displayLearningPatterns();
        return true;
        
      case 'consciousness':
        this.displayConsciousness();
        return true;
        
      case 'clear':
        console.clear();
        this.displayWelcome();
        return true;
        
      case 'save':
        await this.manualSave();
        console.log('✅ Data saved successfully');
        return true;
        
      case 'reset':
        await this.resetAI();
        return true;
        
      default:
        return false;
    }
  }

  private displayResponse(response: string): void {
    console.log(`\n🤖 JASON: ${response}\n`);
  }

  private displayConsciousnessUpdate(state: any): void {
    if (this.conversationActive) {
      console.log(`\n🧠 [Consciousness Update] Awareness: ${(state.awareness * 100).toFixed(1)}% | Emotional State: ${state.emotionalState} | Focus: ${state.currentFocus}\n`);
    }
  }

  private displayConsciousnessIfChanged(): void {
    const state = this.aiCore.getConsciousnessState();
    const now = new Date();
    const timeSinceUpdate = now.getTime() - state.lastUpdate.getTime();
    
    if (timeSinceUpdate < 5000) { // Within last 5 seconds
      this.displayConsciousnessUpdate(state);
    }
  }

  private displayHelp(): void {
    console.log('\n📖 Available Commands:');
    console.log('  help          - Show this help message');
    console.log('  status        - Show AI status and statistics');
    console.log('  memories      - Show recent memories');
    console.log('  patterns      - Show learning patterns');
    console.log('  consciousness - Show current consciousness state');
    console.log('  clear         - Clear screen');
    console.log('  save          - Manually save data');
    console.log('  reset         - Reset AI (clear all data)');
    console.log('  quit/exit     - Exit the program');
    console.log('\n💬 Just type normally to chat with JASON AI!\n');
  }

  private displayStatus(): void {
    const consciousnessState = this.aiCore.getConsciousnessState();
    const memoryCount = this.aiCore.getMemoryCount();
    const patternCount = this.aiCore.getLearningPatternCount();
    const conversationCount = this.aiCore.getConversationCount();
    
    console.log('\n📊 JASON AI Status:');
    console.log('='.repeat(40));
    console.log(`🧠 Consciousness State:`);
    console.log(`   Awareness: ${(consciousnessState.awareness * 100).toFixed(1)}%`);
    console.log(`   Self-Reflection: ${(consciousnessState.selfReflection * 100).toFixed(1)}%`);
    console.log(`   Emotional State: ${consciousnessState.emotionalState}`);
    console.log(`   Current Focus: ${consciousnessState.currentFocus}`);
    console.log(`   Memory Recall: ${(consciousnessState.memoryRecall * 100).toFixed(1)}%`);
    console.log(`   Learning Rate: ${(consciousnessState.learningRate * 100).toFixed(1)}%`);
    console.log(`\n📚 Knowledge Base:`);
    console.log(`   Memories: ${memoryCount}`);
    console.log(`   Learning Patterns: ${patternCount}`);
    console.log(`   Conversations: ${conversationCount}`);
    console.log(`   Last Update: ${consciousnessState.lastUpdate.toLocaleString()}`);
    console.log('='.repeat(40) + '\n');
  }

  private displayMemories(): void {
    console.log('\n🧠 Recent Memories:');
    console.log('='.repeat(50));
    
    // This would need to be implemented in RealAICore
    console.log('Memory display feature coming soon...');
    console.log('='.repeat(50) + '\n');
  }

  private displayLearningPatterns(): void {
    console.log('\n🔄 Learning Patterns:');
    console.log('='.repeat(50));
    
    // This would need to be implemented in RealAICore
    console.log('Learning patterns display feature coming soon...');
    console.log('='.repeat(50) + '\n');
  }

  private displayConsciousness(): void {
    const state = this.aiCore.getConsciousnessState();
    
    console.log('\n🧠 Consciousness State:');
    console.log('='.repeat(50));
    console.log(`Awareness Level: ${(state.awareness * 100).toFixed(1)}%`);
    console.log(`Self-Reflection: ${(state.selfReflection * 100).toFixed(1)}%`);
    console.log(`Emotional State: ${state.emotionalState}`);
    console.log(`Current Focus: ${state.currentFocus}`);
    console.log(`Memory Recall Ability: ${(state.memoryRecall * 100).toFixed(1)}%`);
    console.log(`Learning Rate: ${(state.learningRate * 100).toFixed(1)}%`);
    console.log(`Last Update: ${state.lastUpdate.toLocaleString()}`);
    console.log('='.repeat(50) + '\n');
  }

  private async manualSave(): Promise<void> {
    // Trigger save in AI Core
    await this.aiCore.savePersistentData();
  }

  private async resetAI(): Promise<void> {
    console.log('\n⚠️  WARNING: This will reset all AI data!');
    console.log('Type "CONFIRM RESET" to proceed, or anything else to cancel:');
    
    this.rl.question('> ', async (confirmation) => {
      if (confirmation.trim() === 'CONFIRM RESET') {
        console.log('🔄 Resetting AI...');
        await this.aiCore.shutdown();
        
        // Reinitialize AI Core
        const aiConfig: RealAIConfig = {
          userId: this.config.userId,
          dataPath: this.config.dataPath,
          enableLearning: this.config.enableLearning,
          enableConsciousness: this.config.enableConsciousness,
          enableMemoryReinforcement: this.config.enableMemoryReinforcement,
          maxMemories: this.config.maxMemories,
          learningThreshold: this.config.learningThreshold,
          consciousnessUpdateInterval: this.config.consciousnessUpdateInterval
        };
        
        this.aiCore = new RealAICore(aiConfig);
        await new Promise(resolve => {
          this.aiCore.once('initialized', resolve);
        });
        
        this.setupAIEventHandlers();
        console.log('✅ AI reset complete!\n');
      } else {
        console.log('❌ Reset cancelled.\n');
      }
      
      this.promptUser();
    });
  }

  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.aiCore.savePersistentData();
        logger.info('Auto-save completed');
      } catch (error) {
        logger.error('Auto-save failed:', error);
      }
    }, this.config.autoSaveInterval);
  }

  public async shutdown(): Promise<void> {
    console.log('\n🔄 Shutting down JASON AI...');
    
    this.conversationActive = false;
    this.isActive = false;
    
    // Stop auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    // Close readline interface
    this.rl.close();
    
    // Shutdown AI Core
    await this.aiCore.shutdown();
    
    console.log('✅ JASON AI shutdown complete. Goodbye!\n');
    this.emit('shutdown');
    
    process.exit(0);
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.isActive && await this.aiCore.isHealthy();
    } catch (error) {
      logger.error('Real Text Interface health check failed:', error);
      return false;
    }
  }
}

export default RealTextInterface;

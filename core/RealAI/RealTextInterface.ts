// Real Text-Based AI Interface - Functional Interactive AI
import { EventEmitter } from 'events';
import * as readline from 'readline';
import { RealAICore, RealAIConfig } from './RealAICore';
import { logger } from '../../server/src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { AdapterRegistry, ActionDefinition } from '../../server/services/ai/selfLearning/Adapters';

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
  private webEnabled: boolean = false;
  private webAllow = new Set<string>(['wikipedia.org','arxiv.org','nasa.gov','ibm.com','qiskit.org']);
  private lastFetchAt: number = 0;
  private minFetchIntervalMs: number = 3000;
  private maxIngestChars: number = 200000;
  private crawlerEnabled: boolean = false;
  private crawlerIntervalMs: number = 60000;
  private crawlerMaxPerTick: number = 2;
  private crawlerTimer: NodeJS.Timeout | null = null;
  private crawlerSeeds: string[] = [];
  private crawlerConfigPath: string = '';
  private profilePath: string = '';
  private userProfile: any = { likes: {}, favorites: {}, facts: {} };
  private systemEnabled: boolean = false;
  private systemIntervalMs: number = 120000;
  private systemTimer: NodeJS.Timeout | null = null;
  private systemConfigPath: string = '';
  private systemAllowList: Set<string> = new Set();
  private adapters: AdapterRegistry = new AdapterRegistry();
  private bgEnabled: boolean = false;
  private bgIntervalMs: number = 60000;
  private bgTimer: NodeJS.Timeout | null = null;
  private bgTasks: string[] = [];
  private bgConfigPath: string = '';

  constructor(config: TextInterfaceConfig) {
    super();
    this.config = config;
    this.crawlerConfigPath = path.join(config.dataPath, 'crawler.json');
    this.profilePath = path.join(config.dataPath, 'user_profile.json');
    this.systemConfigPath = path.join(config.dataPath, 'system_scan.json');
    this.bgConfigPath = path.join(config.dataPath, 'bg.json');
    
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
    console.log('\nWeb ingestion: web help');
    console.log('Crawler:       crawl help');
    console.log('System scan:   system help');
    console.log('Actions:       act help');
    console.log('Background:    bg help\n');
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
      await this.loadCrawlerConfig();
      await this.loadUserProfile();
      if (this.crawlerEnabled) this.startCrawler();
      await this.loadSystemConfig();
      if (this.systemEnabled) this.startSystemScan();
      await this.loadBgConfig();
      if (this.bgEnabled) this.startBg();
      
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
      this.updateUserProfileFromInput(input);
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
      const msg = (error && (error as any).message) || String(error);
      console.log(`❌ Error: ${msg}`);
      logger.error('Error processing user input:', error as any);
    }
    
    // Continue conversation
    this.promptUser();
  }

  private async handleSpecialCommands(input: string): Promise<boolean> {
    const command = input.toLowerCase();
    if (command.startsWith('web ')) {
      await this.handleWebCommand(input);
      return true;
    }
    if (command.startsWith('crawl ')) {
      await this.handleCrawlCommand(input);
      return true;
    }
    if (command.startsWith('profile ')) {
      await this.handleProfileCommand(input);
      return true;
    }
    if (command.startsWith('system ')) {
      await this.handleSystemCommand(input);
      return true;
    }
    if (command.startsWith('act ')) {
      await this.handleActCommand(input);
      return true;
    }
    if (command.startsWith('bg ')) {
      await this.handleBgCommand(input);
      return true;
    }
    
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

  private async handleWebCommand(input: string): Promise<void> {
    const raw = input.trim();
    const parts = raw.split(/\s+/);
    if (parts.length < 2) { console.log('\nUsage: web help\n'); return; }
    const sub = parts[1].toLowerCase();
    if (sub === 'help') {
      console.log('\nweb on|off');
      console.log('web allow list');
      console.log('web allow add <domain>');
      console.log('web allow remove <domain>');
      console.log('web fetch <url>');
      console.log('');
      return;
    }
    if (sub === 'on') { this.webEnabled = true; console.log('\nWeb ingestion enabled\n'); return; }
    if (sub === 'off') { this.webEnabled = false; console.log('\nWeb ingestion disabled\n'); return; }
    if (sub === 'allow' && parts[2]) {
      const action = (parts[2] || '').toLowerCase();
      if (action === 'list') { console.log('\nAllowed domains:', Array.from(this.webAllow).join(', ') || '(none)', '\n'); return; }
      if (action === 'add' && parts[3]) { this.webAllow.add(parts[3].toLowerCase()); console.log('\nAdded:', parts[3], '\n'); return; }
      if (action === 'remove' && parts[3]) { this.webAllow.delete(parts[3].toLowerCase()); console.log('\nRemoved:', parts[3], '\n'); return; }
      console.log('\nUsage: web allow list|add <domain>|remove <domain>\n');
      return;
    }
    if (sub === 'fetch' && parts[2]) {
      if (!this.webEnabled) { console.log('\nEnable first: web on\n'); return; }
      const url = parts.slice(2).join(' ');
      try { await this.fetchAndIngest(url); } catch (e: any) { console.log(`\nFailed: ${e?.message || 'error'}\n`); }
      return;
    }
    console.log('\nUnknown web command. Use: web help\n');
  }

  private isAllowedHost(host: string): boolean {
    const h = (host || '').toLowerCase();
    for (const d of this.webAllow) { if (h === d || h.endsWith('.' + d)) return true; }
    return false;
  }

  private stripHtml(input: string): string {
    const noScripts = input.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const text = noScripts.replace(/<[^>]+>/g, ' ');
    return text.replace(/\s+/g, ' ').trim();
  }

  private async fetchAndIngest(url: string): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetchAt < this.minFetchIntervalMs) throw new Error('rate_limited');
    this.lastFetchAt = now;
    let u: URL;
    try { u = new URL(url); } catch { throw new Error('invalid_url'); }
    if (!this.isAllowedHost(u.hostname)) throw new Error('domain_not_allowed');
    const fetchFn: any = (globalThis as any).fetch || (await import('node-fetch')).default;
    const res = await fetchFn(u.toString(), { headers: { 'user-agent': 'JASON-AI/1.0' } });
    if (!res.ok) throw new Error('http_' + res.status);
    const ct = (res.headers.get ? res.headers.get('content-type') : res.headers.get('Content-Type')) || '';
    let body = await res.text();
    if (/html/i.test(String(ct))) body = this.stripHtml(body);
    if (body.length > this.maxIngestChars) body = body.slice(0, this.maxIngestChars);
    await this.aiCore.ingestExternalKnowledge(u.toString(), body, { contentType: ct, length: body.length });
    console.log(`\nIngested ${body.length} chars from ${u.host}\n`);
  }

  private startCrawler(): void {
    if (this.crawlerTimer) return;
    this.crawlerTimer = setInterval(() => { void this.tickCrawler(); }, Math.max(5000, this.crawlerIntervalMs));
  }

  private stopCrawler(): void {
    if (this.crawlerTimer) clearInterval(this.crawlerTimer);
    this.crawlerTimer = null;
  }

  private async tickCrawler(): Promise<void> {
    if (!this.crawlerEnabled || this.crawlerSeeds.length === 0) return;
    const seeds = this.crawlerSeeds.slice(0, this.crawlerMaxPerTick);
    for (const url of seeds) {
      try {
        await this.fetchAndIngest(url);
        await new Promise(r => setTimeout(r, Math.max(250, Math.floor(this.minFetchIntervalMs / 2))));
      } catch {}
    }
  }

  private async loadCrawlerConfig(): Promise<void> {
    try {
      if (!fs.existsSync(this.crawlerConfigPath)) return;
      const raw = fs.readFileSync(this.crawlerConfigPath, 'utf8');
      const cfg = JSON.parse(raw || '{}');
      this.crawlerEnabled = Boolean(cfg.enabled);
      this.crawlerIntervalMs = Number(cfg.intervalMs ?? this.crawlerIntervalMs);
      this.crawlerMaxPerTick = Number(cfg.maxPerTick ?? this.crawlerMaxPerTick);
      this.crawlerSeeds = Array.isArray(cfg.seeds) ? cfg.seeds.filter((s: any) => typeof s === 'string') : [];
    } catch {}
  }

  private saveCrawlerConfig(): void {
    try {
      const payload = {
        enabled: this.crawlerEnabled,
        intervalMs: this.crawlerIntervalMs,
        maxPerTick: this.crawlerMaxPerTick,
        seeds: this.crawlerSeeds
      };
      fs.writeFileSync(this.crawlerConfigPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch {}
  }

  private async handleCrawlCommand(input: string): Promise<void> {
    const parts = input.trim().split(/\s+/);
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'help' || !sub) {
      console.log('\ncrawl on|off');
      console.log('crawl add <url>');
      console.log('crawl remove <url>');
      console.log('crawl list');
      console.log('crawl interval <ms>');
      console.log('crawl max <n>');
      console.log('crawl status\n');
      return;
    }
    if (sub === 'on') { this.crawlerEnabled = true; this.startCrawler(); this.saveCrawlerConfig(); console.log('\nCrawler enabled\n'); return; }
    if (sub === 'off') { this.crawlerEnabled = false; this.stopCrawler(); this.saveCrawlerConfig(); console.log('\nCrawler disabled\n'); return; }
    if (sub === 'add' && parts[2]) {
      try {
        const u = new URL(parts.slice(2).join(' '));
        if (!this.isAllowedHost(u.hostname)) { console.log('\nDomain not allowed. Use: web allow add <domain>\n'); return; }
        if (!this.crawlerSeeds.includes(u.toString())) this.crawlerSeeds.push(u.toString());
        this.saveCrawlerConfig();
        console.log('\nAdded seed\n');
      } catch { console.log('\nInvalid URL\n'); }
      return;
    }
    if (sub === 'remove' && parts[2]) {
      const url = parts.slice(2).join(' ');
      this.crawlerSeeds = this.crawlerSeeds.filter(s => s !== url);
      this.saveCrawlerConfig();
      console.log('\nRemoved seed\n');
      return;
    }
    if (sub === 'list') { console.log('\nSeeds:', this.crawlerSeeds.length ? this.crawlerSeeds.join('\n') : '(none)', '\n'); return; }
    if (sub === 'interval' && parts[2]) { this.crawlerIntervalMs = Math.max(5000, Number(parts[2])); if (this.crawlerTimer) { this.stopCrawler(); if (this.crawlerEnabled) this.startCrawler(); } this.saveCrawlerConfig(); console.log('\nInterval updated\n'); return; }
    if (sub === 'max' && parts[2]) { this.crawlerMaxPerTick = Math.max(1, Math.floor(Number(parts[2]))); this.saveCrawlerConfig(); console.log('\nMax per tick updated\n'); return; }
    if (sub === 'status') { console.log(`\nEnabled: ${this.crawlerEnabled}\nInterval: ${this.crawlerIntervalMs} ms\nMax per tick: ${this.crawlerMaxPerTick}\nSeeds: ${this.crawlerSeeds.length}\n`); return; }
    console.log('\nUnknown crawl command. Use: crawl help\n');
  }

  private async loadUserProfile(): Promise<void> {
    try {
      if (fs.existsSync(this.profilePath)) {
        const raw = fs.readFileSync(this.profilePath, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        if (parsed && typeof parsed === 'object') this.userProfile = parsed;
      }
    } catch {}
  }

  private saveUserProfile(): void {
    try { fs.writeFileSync(this.profilePath, JSON.stringify(this.userProfile, null, 2), 'utf8'); } catch {}
  }

  private updateUserProfileFromInput(input: string): void {
    const s = String(input || '');
    const lower = s.toLowerCase();
    let changed = false;
    const likeMatch = lower.match(/\bi like\s+([a-z0-9 \-_,\.]+)/i);
    if (likeMatch && likeMatch[1]) { const item = likeMatch[1].trim(); (this.userProfile.likes[item] = true); changed = true; }
    const favMatch = lower.match(/\bmy favorite\s+([a-z ]+)\s+is\s+([a-z0-9 \-_,\.]+)/i);
    if (favMatch && favMatch[1] && favMatch[2]) { const key = favMatch[1].trim(); const val = favMatch[2].trim(); (this.userProfile.favorites[key] = val); changed = true; }
    const nameMatch = lower.match(/\bmy name is\s+([a-z0-9 \-_,\.]+)/i);
    if (nameMatch && nameMatch[1]) { this.userProfile.facts.name = nameMatch[1].trim(); changed = true; }
    if (changed) { this.saveUserProfile(); void this.aiCore.addKnowledge('user_profile', this.userProfile); }
  }

  private async handleProfileCommand(input: string): Promise<void> {
    const parts = input.trim().split(/\s+/);
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'show' || !sub) { this.displayProfile(); return; }
    if (sub === 'reset') { this.userProfile = { likes: {}, favorites: {}, facts: {} }; this.saveUserProfile(); console.log('\nProfile reset\n'); return; }
    console.log('\nprofile show|reset\n');
  }

  private displayProfile(): void {
    try { console.log('\nUser Profile:', JSON.stringify(this.userProfile, null, 2), '\n'); } catch { console.log('\n(no profile)\n'); }
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
    console.log('Memory display feature coming soon...');
    console.log('='.repeat(50) + '\n');
  }

  private displayLearningPatterns(): void {
    console.log('\n🔄 Learning Patterns:');
    console.log('='.repeat(50));
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
    await this.aiCore.savePersistentData();
  }

  private async resetAI(): Promise<void> {
    console.log('\n⚠️  WARNING: This will reset all AI data!');
    console.log('Type "CONFIRM RESET" to proceed, or anything else to cancel:');
    
    this.rl.question('> ', async (confirmation) => {
      if (confirmation.trim() === 'CONFIRM RESET') {
        console.log('🔄 Resetting AI...');
        await this.aiCore.shutdown();
        
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
        logger.error('Auto-save failed:', error as any);
      }
    }, this.config.autoSaveInterval);
  }

  private saveSystemConfig(): void {
    try {
      const payload = {
        enabled: this.systemEnabled,
        intervalMs: this.systemIntervalMs,
        allow: Array.from(this.systemAllowList)
      };
      fs.writeFileSync(this.systemConfigPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch {}
  }

  private async loadSystemConfig(): Promise<void> {
    try {
      if (!fs.existsSync(this.systemConfigPath)) return;
      const raw = fs.readFileSync(this.systemConfigPath, 'utf8');
      const cfg = JSON.parse(raw || '{}');
      this.systemEnabled = Boolean(cfg.enabled);
      this.systemIntervalMs = Number(cfg.intervalMs ?? this.systemIntervalMs);
      const allow: string[] = Array.isArray(cfg.allow) ? cfg.allow : [];
      this.systemAllowList = new Set(allow.map(s => String(s).toLowerCase()));
    } catch {}
  }

  private async handleSystemCommand(input: string): Promise<void> {
    const parts = input.trim().split(/\s+/);
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'help' || !sub) {
      console.log('\nsystem on|off');
      console.log('system allow list');
      console.log('system allow add <category>');
      console.log('system allow remove <category>');
      console.log('system scan');
      console.log('system status');
      console.log('system interval <ms>\n');
      return;
    }
    if (sub === 'on') {
      this.systemEnabled = true;
      this.startSystemScan();
      this.saveSystemConfig();
      console.log('\nSystem scan enabled\n');
      return;
    }
    if (sub === 'off') {
      this.systemEnabled = false;
      this.stopSystemScan();
      this.saveSystemConfig();
      console.log('\nSystem scan disabled\n');
      return;
    }
    if (sub === 'allow' && parts[2]) {
      const action = (parts[2] || '').toLowerCase();
      if (action === 'list') {
        console.log('\nAllowed categories:', Array.from(this.systemAllowList).join(', ') || '(none)', '\n');
        return;
      }
      if (action === 'add' && parts[3]) {
        this.systemAllowList.add(parts[3].toLowerCase());
        this.saveSystemConfig();
        console.log('\nAdded:', parts[3], '\n');
        return;
      }
      if (action === 'remove' && parts[3]) {
        this.systemAllowList.delete(parts[3].toLowerCase());
        this.saveSystemConfig();
        console.log('\nRemoved:', parts[3], '\n');
        return;
      }
      console.log('\nUsage: system allow list|add <category>|remove <category>\n');
      return;
    }
    if (sub === 'scan') {
      if (!this.systemEnabled) {
        console.log('\nEnable first: system on\n');
        return;
      }
      await this.scanSystem();
      return;
    }
    if (sub === 'status') {
      console.log(`\nEnabled: ${this.systemEnabled}\nInterval: ${this.systemIntervalMs} ms\nAllowed categories: ${Array.from(this.systemAllowList).join(', ') || '(none)'}\n`);
      return;
    }
    if (sub === 'interval' && parts[2]) {
      this.systemIntervalMs = Math.max(10000, Number(parts[2]));
      if (this.systemTimer) {
        this.stopSystemScan();
        if (this.systemEnabled) this.startSystemScan();
      }
      console.log('\nInterval updated\n');
      this.saveSystemConfig();
      return;
    }
    console.log('\nUnknown system command. Use: system help\n');
  }

  private async scanSystem(): Promise<void> {
    const items: any[] = [];
    if (this.systemAllowList.has('processes')) {
      const procs = await this.getWindowsProcesses().catch(() => []);
      items.push(...procs.map((p: any) => ({ ...p, category: 'processes' })));
    }
    if (this.systemAllowList.has('apps')) {
      const apps = await this.getWindowsApps().catch(() => []);
      items.push(...apps.map((a: any) => ({ ...a, category: 'apps' })));
    }
    for (const it of items) {
      const key = it.category === 'processes' && it.pid ? `system_process:${it.name || 'unknown'}:${it.pid}` :
                  it.category === 'apps' && it.name ? `system_app:${it.name}` :
                  `system_item:${Date.now()}`;
      await this.aiCore.addKnowledge(key, { ...it, t: Date.now() });
    }
  }

  private execPowerShellJson(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ps = process.env.SystemRoot ? `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe` : 'powershell.exe';
      execFile(ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout: 15000 }, (err, stdout, stderr) => {
        if (err) return reject(err);
        const out = stdout && stdout.trim();
        if (!out) return resolve([]);
        try { resolve(JSON.parse(out)); } catch (e) { resolve([]); }
      });
    });
  }

  private async getWindowsProcesses(): Promise<any[]> {
    const script = "Get-Process | Select-Object Name,Id,StartTime,Path -ErrorAction SilentlyContinue | ConvertTo-Json -Depth 2";
    const data = await this.execPowerShellJson(script);
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return arr.map((p: any) => ({ name: p.Name, pid: p.Id, path: p.Path, startTime: p.StartTime })).filter((x: any) => x.name);
  }

  private async getWindowsApps(): Promise<any[]> {
    const script = "$apps=@();$paths=@('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*');foreach($p in $paths){if(Test-Path $p){$apps+=Get-ItemProperty $p | Where-Object {$_.DisplayName} | Select-Object @{n='Name';e={$_.DisplayName}},@{n='Version';e={$_.DisplayVersion}},@{n='Publisher';e={$_.Publisher}},@{n='InstallDate';e={$_.InstallDate}}}};$apps | Sort-Object Name -Unique | ConvertTo-Json -Depth 2";
    const data = await this.execPowerShellJson(script);
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return arr.map((a: any) => ({ name: a.Name, version: a.Version, publisher: a.Publisher, installDate: a.InstallDate })).filter((x: any) => x.name);
  }

  private startSystemScan(): void {
    if (this.systemTimer) return;
    this.systemTimer = setInterval(() => {
      void this.scanSystem();
    }, this.systemIntervalMs);
  }

  private stopSystemScan(): void {
    if (this.systemTimer) {
      clearInterval(this.systemTimer);
      this.systemTimer = null;
    }
  }

  private async handleActCommand(input: string): Promise<void> {
    const parts = input.trim().split(/\s+/);
    if (parts.length < 2 || parts[1].toLowerCase() === 'help') {
      console.log('\nact process <command> [args...]');
      console.log('act app <path> [args...]');
      console.log('act powershell <script>');
      console.log('act http <method> <url> [json]');
      console.log('');
      return;
    }
    const def = this.parseAction(parts);
    if (!def) { console.log('\nInvalid act command\n'); return; }
    const res = await this.adapters.execute(def);
    if (res.ok) console.log('\n✅ Action executed\n'); else console.log(`\n❌ Action failed: ${res.error || 'error'}\n`);
  }

  private parseAction(parts: string[]): ActionDefinition | null {
    const kind = (parts[1] || '').toLowerCase();
    if (kind === 'process' && parts[2]) {
      const command = parts[2];
      const args = parts.slice(3);
      return { type: 'process', name: 'process', payload: { command, args }, riskLevel: 0.6, tags: ['process'] };
    }
    if (kind === 'app' && parts[2]) {
      const appPath = parts[2];
      const args = parts.slice(3);
      return { type: 'app', name: 'app', payload: { path: appPath, args }, riskLevel: 0.6, tags: ['app'] };
    }
    if (kind === 'powershell' && parts[2]) {
      const script = parts.slice(2).join(' ');
      return { type: 'powershell', name: 'powershell', payload: { script }, riskLevel: 0.8, tags: ['powershell'] };
    }
    if (kind === 'http' && parts[2] && parts[3]) {
      const method = parts[2].toUpperCase();
      const url = parts[3];
      let body: any = undefined;
      if (parts[4]) {
        try { body = JSON.parse(parts.slice(4).join(' ')); } catch { body = parts.slice(4).join(' '); }
      }
      return { type: 'http', name: 'http', payload: { method, url, body }, riskLevel: 0.4, tags: ['http'] };
    }
    return null;
  }

  private async handleBgCommand(input: string): Promise<void> {
    const parts = input.trim().split(/\s+/);
    const sub = (parts[1] || '').toLowerCase();
    if (!sub || sub === 'help') {
      console.log('\nbg on|off');
      console.log('bg add <act ...>');
      console.log('bg remove <index>');
      console.log('bg list');
      console.log('bg interval <ms>');
      console.log('bg run');
      console.log('bg status\n');
      return;
    }
    if (sub === 'on') { this.bgEnabled = true; this.startBg(); this.saveBgConfig(); console.log('\nBackground enabled\n'); return; }
    if (sub === 'off') { this.bgEnabled = false; this.stopBg(); this.saveBgConfig(); console.log('\nBackground disabled\n'); return; }
    if (sub === 'add' && parts[2]) {
      const cmd = input.trim().slice(input.toLowerCase().indexOf('bg add') + 6);
      if (!cmd.toLowerCase().startsWith('act ')) { console.log('\nUse: bg add act <...>\n'); return; }
      this.bgTasks.push(cmd);
      this.saveBgConfig();
      console.log('\nAdded background task\n');
      return;
    }
    if (sub === 'remove' && parts[2]) {
      const idx = Math.max(0, Math.floor(Number(parts[2])));
      if (idx >= 0 && idx < this.bgTasks.length) { this.bgTasks.splice(idx, 1); this.saveBgConfig(); console.log('\nRemoved\n'); }
      else console.log('\nInvalid index\n');
      return;
    }
    if (sub === 'list') { console.log('\nTasks:'); this.bgTasks.forEach((t,i)=>console.log(`${i}: ${t}`)); console.log(''); return; }
    if (sub === 'interval' && parts[2]) { this.bgIntervalMs = Math.max(5000, Number(parts[2])); if (this.bgTimer) { this.stopBg(); if (this.bgEnabled) this.startBg(); } this.saveBgConfig(); console.log('\nInterval updated\n'); return; }
    if (sub === 'run') { await this.tickBg(); return; }
    if (sub === 'status') { console.log(`\nEnabled: ${this.bgEnabled}\nInterval: ${this.bgIntervalMs} ms\nTasks: ${this.bgTasks.length}\n`); return; }
    console.log('\nUnknown bg command. Use: bg help\n');
  }

  private startBg(): void {
    if (this.bgTimer) return;
    this.bgTimer = setInterval(() => { void this.tickBg(); }, this.bgIntervalMs);
  }

  private stopBg(): void {
    if (this.bgTimer) { clearInterval(this.bgTimer); this.bgTimer = null; }
  }

  private async tickBg(): Promise<void> {
    if (!this.bgEnabled || this.bgTasks.length === 0) return;
    for (const cmd of this.bgTasks) {
      const parts = cmd.trim().split(/\s+/);
      if (parts[0].toLowerCase() !== 'act') continue;
      const def = this.parseAction(parts);
      if (!def) continue;
      try { await this.adapters.execute(def); } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
  }

  private async loadBgConfig(): Promise<void> {
    try {
      if (!fs.existsSync(this.bgConfigPath)) return;
      const raw = fs.readFileSync(this.bgConfigPath, 'utf8');
      const cfg = JSON.parse(raw || '{}');
      this.bgEnabled = Boolean(cfg.enabled);
      this.bgIntervalMs = Number(cfg.intervalMs ?? this.bgIntervalMs);
      this.bgTasks = Array.isArray(cfg.tasks) ? cfg.tasks.filter((s: any) => typeof s === 'string') : [];
    } catch {}
  }

  private saveBgConfig(): void {
    try {
      const payload = { enabled: this.bgEnabled, intervalMs: this.bgIntervalMs, tasks: this.bgTasks };
      fs.writeFileSync(this.bgConfigPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch {}
  }

  public async shutdown(): Promise<void> {
    console.log('\n🔄 Shutting down JASON AI...')

    this.conversationActive = false;
    this.isActive = false;

    // Stop auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    if (this.crawlerTimer) {
      clearInterval(this.crawlerTimer);
      this.crawlerTimer = null;
    }
    if (this.systemTimer) {
      clearInterval(this.systemTimer);
      this.systemTimer = null;
    }

    // Close readline interface
    this.rl.close();

    // Shutdown AI Core
    await this.aiCore.shutdown();

    console.log('✅ JASON AI shutdown complete. Goodbye!\n');
    this.emit('shutdown')

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

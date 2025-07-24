import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import cors from 'cors';

// Import services
import { deviceDiscovery } from './server/services/deviceDiscovery.js';
import storage from './server/app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    await storage.addConsoleMessage({
      text: command,
      type: 'user'
    });
    
    // Use the NLP agent to parse the command
    const nlpResult = await agentOrchestrator.agents.nlp.parse_command(command);
    if (!nlpResult.success) {
      throw new Error(nlpResult.error);
    }
    
    const goal = await nlpService.parseCommandToGoal(command);/ Import AgentOrchestrator and NlpService
import { AgentOrchestrator } from './server/services/agentOrchestrator.js';
import { nlpService } from './server/services/nlpService.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define port first to avoid any reference issues
const PORT = process.env.PORT || 8000; // Changed to port 8000

// Initialize Agent Orchestrator
const agentOrchestrator = new AgentOrchestrator({ deviceDiscovery, storage });

// Create Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Fix MIME type issues
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database and services
async function initializeApp() {
  try {
    // Initialize storage
    await storage.initialize();
    console.log('Storage initialized successfully');
    
    // Start device discovery
    await deviceDiscovery.startScan();
    console.log('Device discovery started');
    
    // Listen for device state changes and inform the agent
    deviceDiscovery.on('deviceStateChanged', (eventPayload) => {
      agentOrchestrator.receiveEvent({ type: 'deviceUpdate', ...eventPayload });
      // Also broadcast to clients
      const message = JSON.stringify({ type: 'deviceStateChanged', ...eventPayload });
      wss.clients.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(message);
      });
    });
    
    // Listen for agent actions to provide feedback via WebSockets
    agentOrchestrator.on('actionCompleted', (actionResult) => {
      console.log('Agent action completed:', actionResult);
      const message = JSON.stringify({ type: 'agentActionCompleted', ...actionResult });
      wss.clients.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(message);
      });
      storage.addConsoleMessage({ text: `Agent action success: ${JSON.stringify(actionResult)}`, type: 'agent' });
    });

    agentOrchestrator.on('actionFailed', (failureDetails) => {
      console.error('Agent action failed:', failureDetails);
      const message = JSON.stringify({ type: 'agentActionFailed', ...failureDetails });
      wss.clients.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(message);
      });
      storage.addConsoleMessage({ text: `Agent action failed: ${JSON.stringify(failureDetails)}`, type: 'agent', level: 'error' });
    });
    
    agentOrchestrator.on('goalReceived', (goal) => {
      storage.addConsoleMessage({ text: `Agent received goal: ${JSON.stringify(goal)}`, type: 'agent' });
    });
    
    // Add initial system activity
    await storage.addActivity({
      type: 'system',
      title: 'System Started',
      description: 'JASON system initialized successfully with Agent Orchestrator'
    });
    
    // Add initial console message
    await storage.addConsoleMessage({
      text: 'JASON v1.0 (Agentic) initialized. Ready for commands.',
      type: 'system'
    });
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Command processing is now handled by nlpService and agentOrchestrator

// API routes
app.get('/api/devices', async (req, res) => {
  try {
    // Get devices from both database and discovery service
    const dbDevices = await storage.getAllDevices();
    const discoveredDevices = deviceDiscovery.getDevices();
    
    // Convert discovered devices to the expected format
    const formattedDiscoveredDevices = discoveredDevices.map(device => ({
      deviceId: device.id,
      name: device.name,
      type: device.type,
      icon: device.type || 'device',
      status: device.online ? 'Online' : 'Offline',
      isActive: device.state?.on || false,
      details: {
        manufacturer: device.manufacturer,
        model: device.model,
        protocol: device.protocol,
        address: device.address,
        location: device.details?.location || 'Unknown',
        ...device.state
      },
      metrics: []
    }));
    
    // Combine devices, preferring database versions
    const deviceMap = new Map();
    
    // Add discovered devices first
    formattedDiscoveredDevices.forEach(device => {
      deviceMap.set(device.deviceId, device);
    });
    
    // Then override with database devices
    dbDevices.forEach(device => {
      deviceMap.set(device.deviceId, device);
    });
    
    // Convert map to array
    const devices = Array.from(deviceMap.values());
    
    res.json(devices);
  } catch (error) {
    console.error('Error getting devices:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

app.get('/api/scenes', async (req, res) => {
  const scenes = [
    { 
      id: 'scene-1', 
      name: 'Movie Night', 
      description: 'Dim lights, lower blinds, turn on TV',
      devices: [
        { deviceId: 'light-1', state: { on: true, brightness: 30 } },
        { deviceId: 'light-2', state: { on: true, brightness: 20 } }
      ]
    },
    { 
      id: 'scene-2', 
      name: 'Good Morning', 
      description: 'Raise blinds, turn on lights, start coffee maker',
      devices: [
        { deviceId: 'light-1', state: { on: true, brightness: 100 } },
        { deviceId: 'light-2', state: { on: true, brightness: 100 } }
      ]
    },
    { 
      id: 'scene-3', 
      name: 'Away Mode', 
      description: 'Turn off lights, lock doors, arm security system',
      devices: [
        { deviceId: 'light-1', state: { on: false } },
        { deviceId: 'light-2', state: { on: false } },
        { deviceId: 'lock-1', state: { locked: true } }
      ]
    },
    {
      id: 'scene-4',
      name: 'Night Mode',
      description: 'Dim lights, lock doors, set thermostat',
      devices: [
        { deviceId: 'light-1', state: { on: true, brightness: 10 } },
        { deviceId: 'light-2', state: { on: false } },
        { deviceId: 'lock-1', state: { locked: true } },
        { deviceId: 'thermostat-1', state: { target: 68 } }
      ]
    },
    {
      id: 'scene-5',
      name: 'Party Mode',
      description: 'Colorful lights, music, and fun atmosphere',
      devices: [
        { deviceId: 'light-1', state: { on: true, brightness: 100, color: { r: 255, g: 0, b: 0 } } },
        { deviceId: 'light-2', state: { on: true, brightness: 100, color: { r: 0, g: 0, b: 255 } } },
        { deviceId: 'speaker-1', state: { on: true, volume: 80 } }
      ]
    },
    {
      id: 'scene-6',
      name: 'Focus Mode',
      description: 'Optimal lighting and temperature for productivity',
      devices: [
        { deviceId: 'light-1', state: { on: true, brightness: 100, temperature: 5000 } },
        { deviceId: 'light-2', state: { on: true, brightness: 80, temperature: 5000 } },
        { deviceId: 'thermostat-1', state: { target: 72 } }
      ]
    }
  ];
  res.json(scenes);
});

app.get('/api/activities', async (req, res) => {
  try {
    const activities = await storage.getRecentActivities(10);
    res.json(activities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

app.get('/api/console-messages', async (req, res) => {
  try {
    const messages = await storage.getRecentConsoleMessages(20);
    res.json(messages);
  } catch (error) {
    console.error('Error getting console messages:', error);
    res.status(500).json({ error: 'Failed to get console messages' });
  }
});

app.get('/api/analytics', async (req, res) => {
  // Simulated analytics data
  const analytics = {
    energyUsage: {
      today: 12.4, // kWh
      yesterday: 14.2,
      thisWeek: 82.5,
      lastWeek: 89.3,
      savings: 7.6, // %
      devices: [
        { name: 'Living Room Light', usage: 1.2 },
        { name: 'Bedroom Light', usage: 0.8 },
        { name: 'Thermostat', usage: 8.5 },
        { name: 'Other Devices', usage: 1.9 }
      ]
    },
    securityEvents: [
      { time: '08:23 AM', event: 'Front door unlocked', severity: 'info' },
      { time: '10:45 AM', event: 'Motion detected - Front yard', severity: 'info' },
      { time: '02:30 PM', event: 'Window sensor triggered - Kitchen', severity: 'warning' },
      { time: '09:15 PM', event: 'System armed', severity: 'info' }
    ],
    deviceUsage: [
      { name: 'Living Room Light', hoursOn: 6.2 },
      { name: 'Bedroom Light', hoursOn: 4.5 },
      { name: 'Front Door Lock', timesUsed: 8 },
      { name: 'Thermostat', adjustments: 3 }
    ]
  };
  
  res.json(analytics);
});

app.get('/api/weather', async (req, res) => {
  // Simulated weather data
  const weather = {
    current: {
      temperature: 72,
      condition: 'Partly Cloudy',
      humidity: 45,
      windSpeed: 8,
      windDirection: 'NW',
      feelsLike: 74,
      uvIndex: 4
    },
    forecast: [
      { day: 'Today', high: 75, low: 62, condition: 'Partly Cloudy', precipitation: 20 },
      { day: 'Tomorrow', high: 78, low: 64, condition: 'Sunny', precipitation: 0 },
      { day: 'Wednesday', high: 80, low: 66, condition: 'Sunny', precipitation: 0 },
      { day: 'Thursday', high: 82, low: 68, condition: 'Partly Cloudy', precipitation: 10 },
      { day: 'Friday', high: 79, low: 65, condition: 'Scattered Showers', precipitation: 40 }
    ]
  };
  
  res.json(weather);
});

app.post('/api/devices/:deviceId/toggle', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { state, brightness, target } = req.body;
    
    const goal = {
      type: 'device',
      deviceId,
      action: 'toggle',
      params: { state, brightness, target }
    };
    agentOrchestrator.receiveGoal(goal);
    
    // The agent will handle storage updates and activities internally or via events.
    // Send immediate feedback to the client. Agent events will provide detailed outcome.
    res.json({ success: true, message: 'Toggle goal received by agent.' });
  } catch (error) {
    console.error('Error toggling device via agent:', error);
    res.status(500).json({ error: 'Failed to toggle device via agent' });
  }
});

app.post('/api/command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    await storage.addConsoleMessage({
      text: command,
      type: 'user'
    });
    
    const goal = await nlpService.parseCommandToGoal(command);

    if (goal.type === 'error') {
      await storage.addConsoleMessage({ text: goal.message, type: 'system', level: 'error' });
      return res.status(400).json({ response: goal.message });
    }
    
    agentOrchestrator.receiveGoal(goal);
    // Response indicates goal received; actual outcome via agent events (WebSockets)
    const agentResponse = `Agent received goal: ${JSON.stringify(goal)}. Processing...`;
    await storage.addConsoleMessage({ text: agentResponse, type: 'agent' });
    res.json({ response: agentResponse });
  } catch (error) {
    console.error('Error processing command via agent:', error);
    await storage.addConsoleMessage({ text: 'Error processing command via agent.', type: 'system', level: 'error' });
    res.status(500).json({ error: 'Failed to process command' });
  }
});

app.post('/api/scenes/:sceneId/activate', async (req, res) => {
  try {
    const { sceneId } = req.params;
    
    // Try to get scene name from storage if available
    const scene = await storage.getSceneById?.(sceneId);
    const sceneName = scene ? scene.name : sceneId; // Fallback to ID if name not found
    
    const goal = {
      type: 'scene',
      name: sceneName,
      sceneId: sceneId
    };
    agentOrchestrator.receiveGoal(goal);
    
    res.json({ success: true, message: `Scene activation goal '${sceneName}' received by agent.` });
  } catch (error) {
    console.error('Error activating scene via agent:', error);
    res.status(500).json({ error: 'Failed to activate scene via agent' });
  }
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected to Agentic JASON');
  
  ws.on('message', async (message) => {
    const commandText = message.toString();
    console.log(`Agentic JASON Received WS Command: ${commandText}`);
    
    try {
      await storage.addConsoleMessage({ text: commandText, type: 'user' });
      
      // Process through AutoGen agent network
      const result = await agentOrchestrator.process_command(commandText);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const goal = await nlpService.parseCommandToGoal(commandText);

      let feedback;
      if (goal.type === 'error') {
        feedback = goal.message;
        await storage.addConsoleMessage({ text: feedback, type: 'system', level: 'error' });
      } else {
        agentOrchestrator.receiveGoal(goal);
        feedback = `Agent received goal: ${JSON.stringify(goal)}. Processing...`;
        await storage.addConsoleMessage({ text: feedback, type: 'agent' });
      }
      ws.send(JSON.stringify({ type: 'commandFeedback', message: feedback, originalCommand: commandText }));
    } catch (error) {
      console.error('Error processing WebSocket command via agent:', error);
      ws.send(JSON.stringify({ type: 'commandFeedback', message: "I encountered an error processing your command.", originalCommand: commandText, error: true }));
      await storage.addConsoleMessage({ text: 'Error processing WebSocket command via agent.', type: 'system', level: 'error' });
    }
  });
  
  // Send initial message
  ws.send(JSON.stringify({ type: 'systemMessage', message: "Hello! I'm JASON (Agentic). How can I help you today?"}));
});

// Serve HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down JASON (Agentic)...');
  
  // Stop device discovery
  deviceDiscovery.stopScan();
  
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
  console.log(`JASON (Agentic) server running on http://localhost:${PORT}`);
  
  // Initialize app
  initializeApp();
});

export default app;

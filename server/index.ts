import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket from 'ws';
import { marketplaceManager } from './services/marketplace/marketplace-manager';
import { pluginMarketplace } from './services/marketplace/plugin-marketplace';
import { aiLearningEngine } from './services/aiLearningEngine';
import { sseBroker, hookAiEngine, hookDeviceManager } from './services/websocket-service';
import { importAllFromDirs, type ImportResult } from './utils/importAll';
import { z } from 'zod';
import { validate } from './middleware/validate';
import { energyOptimizer, EnergyPolicySchema } from './services/energy/energy-optimizer';
import { realEnergyMonitor } from './services/energy/RealEnergyMonitor';
import { realDeviceController } from './services/energy/RealDeviceController';
import { energyCostCalculator } from './services/energy/EnergyCostCalculator';
import { scraperManager } from './services/scrapers/ScraperManager';
import energyRoutes from './routes/energy';
import scrapersRoutes from './routes/scrapers';
import { selfLearningEngine } from './services/ai/selfLearning/Engine';
import { dailyTrainer } from './services/ai/selfLearning/DailyTrainer';
import { alignmentModel } from './services/ai/selfLearning/Alignment';
import { permissionManager } from './services/trust/PermissionManager';
import { getTopContext } from './services/context/TCG';
import { compilePlan, executePlan } from './services/planner/HTNPlanner';
import { daiSandbox, getDAIConfig, setDAIConfig } from './services/execution/DAI';
import { scrl } from './services/intelligence/SCRL';
import { uspt } from './services/intelligence/USPT';
import { ethics } from './services/intelligence/Ethics';
import { consciousness } from './services/ai/selfLearning/Consciousness';
import fs from 'fs';
import path from 'path';
import { prisma } from './utils/prisma';
// Dev auth middleware: attaches req.userId from header or defaults for dev
type Next = (err?: any) => void;
function devAuth(req: Request & { userId?: string }, _res: Response, next: Next) {
  req.userId = (req.headers['x-user-id'] as string) || 'demo-user';
  next();
}

// Cast express to any to satisfy TS in mixed CJS/ESM setups
const app = (express as unknown as any)();
const server = createServer(app);
const wss = new (WebSocket as any).Server({ server });
const PORT = Number(process.env.PORT) || 3001;
const IMPORT_ALL_SERVER = process.env.IMPORT_ALL_SERVER === 'true';
const LIGHT_MODE = process.env.LIGHT_MODE === 'true' || process.env.RESOURCE_LIGHT === 'true';

app.use(cors());
app.use((express as any).json());
app.use(devAuth);

// Mount energy routes
app.use('/api/energy', energyRoutes);

// Mount scraper routes - NO PAID APIS NEEDED
app.use('/api/scrapers', scrapersRoutes);

// Root and health endpoints for runtime verification
app.get('/', (_req: Request, res: Response) => {
  res.type('text/plain').send('JASON Server OK (server/index.ts)');
});

// Power control: sockets and lights
app.get('/api/power/devices', (_req: Request, res: Response) => {
  const uc = getUnifiedDeviceControl();
  if (!uc) return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
  try {
    const all = uc.listDevices();
    const devices = all
      .filter((d: any) => typeof d?.type === 'string' && (d.type.includes('plug') || d.type.includes('light')))
      .map((d: any) => ({
        id: d.id,
        name: d.name || d.id,
        type: d.type,
        zone: d.zone || d.room || 'default',
        state: uc.getDeviceState(d.id) || {},
      }));
    res.json({ devices });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to list devices' });
  }
});

app.post('/api/power/socket/:id/toggle', async (req: Request, res: Response) => {
  const uc = getUnifiedDeviceControl();
  if (!uc) return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
  const { id } = req.params as any;
  try {
    await Promise.resolve(uc.sendCommand(id, 'toggle'));
    const state = uc.getDeviceState(id) || {};
    try { sseBroker.broadcast('device:update', { deviceId: id, state }); } catch {}
    res.json({ ok: true, deviceId: id, state });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'toggle failed' });
  }
});

const BrightnessSchema = z.object({ brightness: z.number().min(0).max(100) });
app.post('/api/power/light/:id/brightness', validate(BrightnessSchema), async (req: Request, res: Response) => {
  const uc = getUnifiedDeviceControl();
  if (!uc) return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
  const { id } = req.params as any;
  const { brightness } = (req as any).validated || req.body;
  try {
    await Promise.resolve(uc.sendCommand(id, 'setBrightness', { brightness }));
    const state = uc.getDeviceState(id) || {};
    try { sseBroker.broadcast('device:update', { deviceId: id, state }); } catch {}
    res.json({ ok: true, deviceId: id, state });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'setBrightness failed' });
  }
});

// Energy optimizer routes
app.get('/api/energy/policy', (_req: Request, res: Response) => {
  try {
    res.json(energyOptimizer.getPolicy());
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to get policy' });
  }
});

const SetPolicySchema = EnergyPolicySchema.partial() as any;
app.post('/api/energy/policy', validate(SetPolicySchema as any), (req: Request, res: Response) => {
  try {
    const next = (req as any).validated || req.body || {};
    energyOptimizer.setPolicy(next);
    res.json({ ok: true, policy: energyOptimizer.getPolicy() });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'invalid policy' });
  }
});

app.post('/api/energy/optimize', async (_req: Request, res: Response) => {
  try {
    // Ensure UC is attached
    const uc = getUnifiedDeviceControl();
    if (!uc) return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
    const result = await energyOptimizer.optimize();
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'optimize failed' });
  }
});

// Start periodic optimization (5 min) if UC available later
if (!LIGHT_MODE) {
  setTimeout(() => {
    try {
      const uc = getUnifiedDeviceControl();
      if (uc) {
        energyOptimizer.start(5 * 60 * 1000);
        console.log('⚡ Energy optimization scheduler started (5 min intervals)');
      }
    } catch {}
  }, 2000);
}

// Setup WebSocket for real-time energy monitoring
wss.on('connection', (ws: any) => {
  console.log('🔌 Energy WebSocket client connected');
  
  // Send initial device list
  const devices = realEnergyMonitor.getDevices();
  ws.send(JSON.stringify({ type: 'initial', devices }));
  
  // Real-time energy reading handler
  const onEnergyReading = (reading: any) => {
    const usage = energyCostCalculator.calculateRealTimeCost(
      reading.deviceId,
      reading.powerWatts,
      reading.energyKwh
    );
    ws.send(JSON.stringify({ type: 'energy_reading', reading, usage }));
  };
  
  const onDeviceDiscovered = (device: any) => {
    ws.send(JSON.stringify({ type: 'device_discovered', device }));
  };
  
  const onDeviceUpdated = (device: any) => {
    ws.send(JSON.stringify({ type: 'device_updated', device }));
  };
  
  const onEnergyOptimized = (result: any) => {
    ws.send(JSON.stringify({ type: 'energy_optimized', result }));
  };
  
  // Subscribe to events
  realEnergyMonitor.on('energyReading', onEnergyReading);
  realEnergyMonitor.on('deviceDiscovered', onDeviceDiscovered);
  realDeviceController.on('deviceUpdated', onDeviceUpdated);
  realDeviceController.on('energyOptimized', onEnergyOptimized);

  const onAiEvent = (ev: any) => {
    try { ws.send(JSON.stringify({ type: 'ai_self_event', event: ev })); } catch {}
  };
  const onAiTrained = (payload: any) => {
    try { ws.send(JSON.stringify({ type: 'ai_self_trained', payload })); } catch {}
  };
  try {
    selfLearningEngine.on('event', onAiEvent);
    (selfLearningEngine as any).on('trained', onAiTrained);
  } catch {}

  ws.on('message', async (raw: any) => {
    try {
      const msg = JSON.parse(String(raw || ''));
      if (!msg || typeof msg !== 'object') return;
      switch (msg.type) {
        case 'ai_self_train_start': {
          const intervalMs = Number(msg.intervalMs ?? 1000);
          (selfLearningEngine as any).startTrainer(intervalMs);
          ws.send(JSON.stringify({ type: 'ai_self_ack', cmd: 'train_start', ok: true, intervalMs }));
          break;
        }
        case 'ai_self_train_stop': {
          (selfLearningEngine as any).stopTrainer();
          ws.send(JSON.stringify({ type: 'ai_self_ack', cmd: 'train_stop', ok: true }));
          break;
        }
        case 'ai_self_set_weights': {
          const weights = (selfLearningEngine as any).setWeights(msg.weights || {});
          ws.send(JSON.stringify({ type: 'ai_self_ack', cmd: 'set_weights', ok: true, weights }));
          break;
        }
        case 'ai_self_config': {
          (selfLearningEngine as any).configure(msg.config || {});
          ws.send(JSON.stringify({ type: 'ai_self_ack', cmd: 'config', ok: true, status: (selfLearningEngine as any).getStatus() }));
          break;
        }
        case 'ai_self_resource': {
          (selfLearningEngine as any).setResourcePolicy(msg.policy || {});
          ws.send(JSON.stringify({ type: 'ai_self_ack', cmd: 'resource', ok: true, status: (selfLearningEngine as any).getStatus() }));
          break;
        }
        default:
          break;
      }
    } catch {}
  });
  
  ws.on('close', () => {
    console.log('🔌 Energy WebSocket client disconnected');
    realEnergyMonitor.off('energyReading', onEnergyReading);
    realEnergyMonitor.off('deviceDiscovered', onDeviceDiscovered);
    realDeviceController.off('deviceUpdated', onDeviceUpdated);
    realDeviceController.off('energyOptimized', onEnergyOptimized);
    try {
      selfLearningEngine.off('event', onAiEvent);
      (selfLearningEngine as any).off?.('trained', onAiTrained);
    } catch {}
  });
});

// Hook AI engine and (optionally) device manager into SSE broker
hookAiEngine(aiLearningEngine);
// Broadcast service events via SSE
marketplaceManager.on('itemPurchased', (payload: any) => {
  try { sseBroker.broadcast('marketplace:itemPurchased', payload); } catch {}
});
marketplaceManager.on('newItemSubmitted', (item: any) => {
  try { sseBroker.broadcast('marketplace:newItem', item); } catch {}
});
aiLearningEngine.on('insight', (ins: any) => {
  try { sseBroker.broadcast('ai:insight', ins); } catch {}
});
aiLearningEngine.on('event', (ev: any) => {
  try { sseBroker.broadcast('ai:event', ev); } catch {}
});
// Energy optimizer SSE hooks
energyOptimizer.on('action', (payload: any) => { try { sseBroker.broadcast('energy:action', payload); } catch {} });
energyOptimizer.on('optimize', (payload: any) => { try { sseBroker.broadcast('energy:optimize', payload); } catch {} });
energyOptimizer.on('policy', (payload: any) => { try { sseBroker.broadcast('energy:policy', payload); } catch {} });

// Real-time energy monitoring SSE hooks
realEnergyMonitor.on('energyReading', (reading: any) => {
  try { sseBroker.broadcast('energy:reading', reading); } catch {}
});
realEnergyMonitor.on('deviceDiscovered', (device: any) => {
  try { sseBroker.broadcast('energy:deviceDiscovered', device); } catch {}
});
realDeviceController.on('deviceUpdated', (device: any) => {
  try { sseBroker.broadcast('energy:deviceUpdated', device); } catch {}
});
realDeviceController.on('energyOptimized', (result: any) => {
  try { sseBroker.broadcast('energy:optimized', result); } catch {}
});
try {
  // Avoid hard crash if core device stack has optional deps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { deviceManager } = require('./core/device/deviceManager');
  hookDeviceManager(deviceManager);
} catch {
  // device manager not available; continue without mocks
}

// Self-learning engine SSE hooks
try {
  selfLearningEngine.on('event', (ev: any) => { try { sseBroker.broadcast('ai:self:event', ev); } catch {} });
  (selfLearningEngine as any).on('trained', (payload: any) => { try { sseBroker.broadcast('ai:self:trained', payload); } catch {} });
} catch {}

try { dailyTrainer.start(selfLearningEngine) } catch {}
try {
  if (LIGHT_MODE) {
    (selfLearningEngine as any).setResourcePolicy({ maxRps: 0.5, maxConcurrent: 1, maxHeapMB: 256 })
    ;(dailyTrainer as any).configure({ microIntervalMinutes: 10, batchSize: 64, maxBatchesPerRun: 2 })
  }
} catch {}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), source: 'server/index.ts' });
});

// System metrics for performance/resource tests
app.get('/api/dev/sys-metrics', (_req: Request, res: Response) => {
  try {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const heapMB = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
    res.json({ heapMB, rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100, cpu, pid: process.pid, uptime: process.uptime() });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'metric_failed' });
  }
});

// SSE endpoint for real-time events
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`event: hello\n` + `data: {"ok":true}\n\n`);
  const id = sseBroker.addClient(res);
  req.on('close', () => {
    sseBroker.removeClient(id);
    try { res.end(); } catch {}
  });
});

// Optionally import all server files on startup (guarded by IMPORT_ALL_SERVER)
let lastImportReport: ImportResult | null = null;
if (IMPORT_ALL_SERVER) {
  try {
    lastImportReport = importAllFromDirs(__dirname, [
      './services',
      './core',
      './utils',
    ], [
      '_corrupted_quarantine',
      'node_modules',
      'dist',
      'scripts',
      'tests',
    ]);
    sseBroker.broadcast('importAll', { imported: lastImportReport.imported.length, failed: lastImportReport.failed.length });
  } catch (e: any) {
    lastImportReport = { imported: [], failed: [{ file: 'importAll:init', error: String(e?.message || e) }], skipped: [] };
  }
}

// Report endpoint for import-all results
app.get('/api/dev/import-report', (_req: Request, res: Response) => {
  if (!IMPORT_ALL_SERVER) return res.status(400).json({ error: 'IMPORT_ALL_SERVER is disabled' });
  res.json(lastImportReport ?? { imported: [], failed: [], skipped: [] });
});

// Validation schemas
const SubmitItemSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  developerId: z.string().min(1),
  price: z.number().nonnegative().optional(),
});

const PurchaseSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  itemId: z.string().min(1),
});

const LearnSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
});

// Self-learning engine schemas
const SelfConfigSchema = z.object({
  stateSize: z.number().int().positive().optional(),
  actionSize: z.number().int().positive().optional(),
  gamma: z.number().positive().max(1).optional(),
  learningRate: z.number().positive().optional(),
  epsilonStart: z.number().min(0).max(1).optional(),
  epsilonMin: z.number().min(0).max(1).optional(),
  epsilonDecay: z.number().min(0.5).max(1).optional(),
  batchSize: z.number().int().positive().max(256).optional(),
  targetUpdateEvery: z.number().int().positive().optional(),
});

const ValueWeightsSchema = z.object({
  morality: z.number().min(0).max(10).optional(),
  kindness: z.number().min(0).max(10).optional(),
  courage: z.number().min(0).max(10).optional(),
  determination: z.number().min(0).max(10).optional(),
  empathy: z.number().min(0).max(10).optional(),
  helpfulness: z.number().min(0).max(10).optional(),
});

const ActionDefSchema = z.object({
  type: z.enum(['http', 'process', 'device', 'file', 'powershell', 'app']),
  name: z.string().optional(),
  payload: z.any().optional(),
  riskLevel: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
});

const DecideSchema = z.object({
  state: z.array(z.number()),
  actions: z.array(ActionDefSchema).optional(),
  explore: z.boolean().optional(),
});

const ActSchema = z.object({
  state: z.array(z.number()),
  actions: z.array(ActionDefSchema).min(1),
  explore: z.boolean().optional(),
});

const TrainerSchema = z.object({ intervalMs: z.number().int().positive().max(60000).optional() });

const TrustDecideSchema = z.object({ id: z.string().min(1), decision: z.enum(['approve','reject','delay']) });
const KillSchema = z.object({ paused: z.boolean() });

const PlanCompileSchema = z.object({
  goal: z.string().min(1),
  context: z.record(z.string(), z.any()).optional(),
});

const PlanExecuteSchema = z.object({
  plan: z.any(),
  simulate: z.boolean().optional(),
  sandbox: z.object({
    allowedHosts: z.array(z.string()).optional(),
    allowProcess: z.boolean().optional(),
    allowPowershell: z.boolean().optional(),
  }).optional(),
});

const DAIExecSchema = z.object({
  action: z.object({
    type: z.enum(['http', 'process', 'device', 'file', 'powershell', 'app']),
    name: z.string().optional(),
    payload: z.any().optional(),
    riskLevel: z.number().min(0).max(1).optional(),
    tags: z.array(z.string()).optional(),
  }),
  options: z.object({
    simulate: z.boolean().optional(),
    allowedHosts: z.array(z.string()).optional(),
    allowProcess: z.boolean().optional(),
    allowPowershell: z.boolean().optional(),
  }).optional(),
});

// Alignment schemas
const AlignIngestSchema = z.object({
  label: z.number().min(0).max(1),
  action: ActionDefSchema.optional(),
  features: z.array(z.number()).optional(),
}).refine(d => !!(d as any).action || !!(d as any).features, { message: 'action or features required' });

const AlignTrainSchema = z.object({
  epochs: z.number().int().min(1).max(500).optional(),
  batchSize: z.number().int().min(4).max(512).optional(),
});

const AlignScoreSchema = z.object({
  action: ActionDefSchema.optional(),
  features: z.array(z.number()).optional(),
}).refine(d => !!(d as any).action || !!(d as any).features, { message: 'action or features required' });

// USPT (User Style & Preference Trainer) schemas
const USPTLabelSchema = z.object({
  tone: z.number().min(0).max(1).optional(),
  format: z.number().min(0).max(1).optional(),
  bias: z.number().min(0).max(1).optional(),
})
const USPTIngestSchema = z.object({
  text: z.string().min(1).optional(),
  features: z.array(z.number()).optional(),
  label: USPTLabelSchema.optional(),
  meta: z.any().optional(),
}).refine(d => !!(d as any).text || !!(d as any).features, { message: 'text or features required' })
const USPTTrainSchema = z.object({
  epochs: z.number().int().min(1).max(500).optional(),
  batchSize: z.number().int().min(4).max(512).optional(),
})
const USPTScoreSchema = z.object({
  text: z.string().min(1).optional(),
  features: z.array(z.number()).optional(),
}).refine(d => !!(d as any).text || !!(d as any).features, { message: 'text or features required' })
const VisionScreenshotSchema = z.object({
  imageBase64: z.string().min(10),
  meta: z.any().optional(),
})

// Ethics schemas
const EthicsConfigSchema = z.object({
  ethicalMode: z.boolean().optional(),
  blockHateSpeech: z.boolean().optional(),
  blockHarassment: z.boolean().optional(),
  blockManipulation: z.boolean().optional(),
  requireConsentForSensitive: z.boolean().optional(),
  riskPromptThreshold: z.number().min(0).max(1).optional(),
})
const EthicsScanSchema = z.object({ text: z.string().min(1) })

// Consciousness schemas
const ConsciousStartSchema = z.object({
  goal: z.string().min(1).optional(),
  simulate: z.boolean().optional(),
  intervalMs: z.number().int().min(200).max(20000).optional(),
})
const ConsciousObserveSchema = z.object({ text: z.string().min(1), tags: z.array(z.string()).optional() })

// SCRL reviews endpoint
app.get('/api/scrl/reviews', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(200, Number((req.query as any).limit || 50)))
    const planId = (req.query as any).planId ? String((req.query as any).planId) : undefined
    const reviews = await scrl.getReviews(planId, limit)
    res.json(reviews)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to get reviews' })
  }
})

// Consciousness endpoints
app.get('/api/ai/conscious/status', (_req: Request, res: Response) => {
  try { res.json(consciousness.status()) } catch (e: any) { res.status(500).json({ error: e?.message || 'status_failed' }) }
})

app.post('/api/ai/conscious/start', validate(ConsciousStartSchema as any), (req: Request, res: Response) => {
  try {
    const opts = (req as any).validated || req.body || {}
    const st = consciousness.start(opts)
    res.json({ ok: true, status: st })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'start_failed' })
  }
})

app.post('/api/ai/conscious/stop', (_req: Request, res: Response) => {
  try { res.json({ ok: true, status: consciousness.stop() }) } catch (e: any) { res.status(500).json({ error: e?.message || 'stop_failed' }) }
})

app.post('/api/ai/conscious/observe', validate(ConsciousObserveSchema as any), (req: Request, res: Response) => {
  try {
    const { text, tags } = (req as any).validated || req.body || {}
    consciousness.observe(String(text), Array.isArray(tags) ? tags.map(String) : [])
    res.json({ ok: true })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'observe_failed' })
  }
})

app.get('/api/ai/conscious/logs', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(200, Number((req.query as any).limit || 50)))
    const rows = await consciousness.getLogs(limit)
    res.json(rows)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'logs_failed' })
  }
})

// Ethics endpoints
app.get('/api/ethics/status', (_req: Request, res: Response) => {
  try { res.json(ethics.getConfig()) } catch (e: any) { res.status(500).json({ error: e?.message || 'status failed' }) }
})

app.post('/api/ethics/config', validate(EthicsConfigSchema as any), (req: Request, res: Response) => {
  try {
    const next = (req as any).validated || req.body || {}
    const cfg = ethics.setConfig(next)
    res.json({ ok: true, config: cfg })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'config failed' })
  }
})

app.post('/api/ethics/scan', validate(EthicsScanSchema as any), async (req: Request, res: Response) => {
  try {
    const { text } = (req as any).validated || req.body || {}
    const scan = ethics.scanText(String(text))
    try { await ethics.logAudit({ type: 'ethics_scan', text, scan }) } catch {}
    res.json({ scan })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'scan failed' })
  }
})

app.get('/api/ethics/audit', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(200, Number((req.query as any).limit || 50)))
    const rows = await prisma.learningEvent.findMany({ where: { event: 'ethics_audit' }, orderBy: { timestamp: 'desc' }, take: limit })
    res.json(rows.map(r => r.data))
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'audit_failed' })
  }
})

// USPT endpoints (status/ingest/train/score)
app.get('/api/uspt/status', (_req: Request, res: Response) => {
  try { res.json(uspt.getStatus()) } catch (e: any) { res.status(500).json({ error: e?.message || 'status failed' }) }
})

app.post('/api/uspt/ingest', validate(USPTIngestSchema as any), (req: Request, res: Response) => {
  try {
    const { text, features, label, meta } = (req as any).validated || req.body || {}
    const status = text
      ? uspt.ingestFromText(String(text), label, meta)
      : uspt.ingest({ features: Array.isArray(features) ? features.map(Number) : [], label, meta })
    res.json({ ok: true, status })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'ingest failed' })
  }
})

app.post('/api/uspt/train', validate(USPTTrainSchema as any), async (req: Request, res: Response) => {
  try {
    const { epochs = 15, batchSize = 32 } = (req as any).validated || req.body || {}
    const result = await uspt.train(Number(epochs), Number(batchSize))
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'train failed' })
  }
})

app.post('/api/uspt/score', validate(USPTScoreSchema as any), (req: Request, res: Response) => {
  try {
    const { text, features } = (req as any).validated || req.body || {}
    const score = text
      ? uspt.scoreForText(String(text))
      : uspt.score(Array.isArray(features) ? features.map(Number) : [])
    res.json({ score })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'score failed' })
  }
})

// Vision endpoint
app.post('/api/vision/screenshot', validate(VisionScreenshotSchema as any), async (req: Request, res: Response) => {
  try {
    const { imageBase64, meta } = (req as any).validated || req.body || {}
    const outDir = path.join(process.cwd(), 'data', 'vision')
    fs.mkdirSync(outDir, { recursive: true })
    const id = `shot_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    const filePath = path.join(outDir, `${id}.png`)
    let b64 = String(imageBase64)
    if (b64.startsWith('data:')) b64 = b64.split(',')[1]
    const buf = Buffer.from(b64, 'base64')
    fs.writeFileSync(filePath, buf)
    try { await prisma.learningEvent.create({ data: { event: 'vision_screenshot', data: { id, path: filePath, size: buf.length, meta } as any } }) } catch {}
    res.json({ ok: true, id, path: filePath, size: buf.length })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'ingest failed' })
  }
})

// Device APIs: require Unified Device Control; no mocks
app.get('/api/devices', (_req: Request, res: Response) => {
  const USE_UNIFIED_DEVICE_CONTROL = process.env.USE_UNIFIED_DEVICE_CONTROL === 'true';
  if (!USE_UNIFIED_DEVICE_CONTROL) return res.status(503).json({ error: 'UnifiedDeviceControl disabled' });
  const uc = getUnifiedDeviceControl();
  if (!uc || typeof uc.listDevices !== 'function') return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
  try {
    const list = uc.listDevices();
    return res.json(list);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'failed to list devices' });
  }
});

app.post('/api/devices/control', async (req: Request, res: Response) => {
  const { deviceId, action, value } = req.body || {};
  if (!deviceId || !action) return res.status(400).json({ error: 'deviceId and action are required' });
  const USE_UNIFIED_DEVICE_CONTROL = process.env.USE_UNIFIED_DEVICE_CONTROL === 'true';
  if (!USE_UNIFIED_DEVICE_CONTROL) return res.status(503).json({ error: 'UnifiedDeviceControl disabled' });
  const uc = getUnifiedDeviceControl();
  if (!uc) return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
  try {
    await uc.sendCommand(String(deviceId), String(action), value);
    const updated = uc.getDeviceState(String(deviceId));
    return res.json({ ok: true, device: { id: deviceId, state: updated } });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'control failed' });
  }
});

// --- Marketplace and Plugin endpoints (wire services in use) ---
app.get('/api/marketplace/items', async (_req: Request, res: Response) => {
  try {
    const items = await marketplaceManager.listAll();
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to list marketplace items' });
  }
});

app.post('/api/marketplace/items', validate(SubmitItemSchema), async (req: Request, res: Response) => {
  const { name, type, developerId, price = 0 } = (req as any).validated || req.body || {};
  try {
    const created = await marketplaceManager.submitItem({
      id: '',
      name: String(name),
      type: String(type) as any,
      developerId: String(developerId),
      price: Number(price) || 0,
      downloads: 0,
      rating: 0,
    });
    res.status(201).json(created);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to submit item' });
  }
});

app.post('/api/marketplace/purchase', validate(PurchaseSchema), async (req: Request, res: Response) => {
  const { userId = 'demo-user', itemId } = (req as any).validated || req.body || {};
  try {
    const ok = await marketplaceManager.purchaseItem(String(userId), String(itemId));
    res.json({ ok });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'purchase failed' });
  }
});

app.get('/api/plugins', (_req: Request, res: Response) => {
  try {
    const plugins = pluginMarketplace.getInstalledPlugins();
    res.json(plugins);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to list plugins' });
  }
});

app.post('/api/plugins/install', async (req: Request, res: Response) => {
  const { id, name, capabilities = [] } = req.body || {};
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  try {
    const ok = await pluginMarketplace.installPlugin({ id: String(id), name: String(name), capabilities });
    res.json({ ok });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'install failed' });
  }
});

app.post('/api/plugins/uninstall', async (req: Request, res: Response) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const ok = await pluginMarketplace.uninstallPlugin(String(id));
    res.json({ ok });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'uninstall failed' });
  }
});

// AI Learning Engine endpoints
app.post('/api/ai/learn', validate(LearnSchema), async (req: Request, res: Response) => {
  const { event, data } = (req as any).validated || req.body || {};
  try {
    const ev = await aiLearningEngine.record(String(event), data);
    res.json({ ok: true, event: ev });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'learn failed' });
  }
});

app.get('/api/ai/insights', async (_req: Request, res: Response) => {
  try {
    const insights = await aiLearningEngine.getInsights();
    res.json(insights);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to get insights' });
  }
});

// Self-learning engine endpoints (no API keys, fully local)
app.get('/api/ai/self/status', async (_req: Request, res: Response) => {
  try {
    res.json(selfLearningEngine.getStatus());
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'status failed' });
  }
});

app.post('/api/ai/self/configure', validate(SelfConfigSchema as any), (req: Request, res: Response) => {
  try {
    const cfg = (req as any).validated || req.body || {};
    selfLearningEngine.configure(cfg);
    res.json({ ok: true, status: selfLearningEngine.getStatus() });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'configure failed' });
  }
});

app.get('/api/ai/self/weights', (_req: Request, res: Response) => {
  try { res.json(selfLearningEngine.getWeights()); } catch (e: any) { res.status(500).json({ error: e?.message || 'weights failed' }); }
});

app.post('/api/ai/self/weights', validate(ValueWeightsSchema as any), (req: Request, res: Response) => {
  try {
    const next = (req as any).validated || req.body || {};
    const w = selfLearningEngine.setWeights(next);
    res.json({ ok: true, weights: w });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'set weights failed' });
  }
});

app.post('/api/ai/self/resource', (req: Request, res: Response) => {
  try {
    const { maxRps, maxConcurrent, maxHeapMB } = req.body || {};
    (selfLearningEngine as any).setResourcePolicy({ maxRps, maxConcurrent, maxHeapMB });
    res.json({ ok: true, resourcePolicy: (selfLearningEngine as any).getStatus().resourcePolicy });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'resource policy failed' });
  }
});

const DailyTrainerSchema = z.object({
  enabled: z.boolean().optional(),
  dailyHour: z.number().int().min(0).max(23).optional(),
  windowMinutes: z.number().int().min(1).max(180).optional(),
  microIntervalMinutes: z.number().int().min(1).max(60).optional(),
  batchSize: z.number().int().min(16).max(2048).optional(),
  maxBatchesPerRun: z.number().int().min(1).max(100).optional(),
  maxHeapMB: z.number().int().min(64).max(4096).optional()
});

app.get('/api/ai/self/scheduler/status', (_req: Request, res: Response) => {
  try { res.json((dailyTrainer as any).getStatus()) } catch (e: any) { res.status(500).json({ error: e?.message || 'status_failed' }) }
});

app.post('/api/ai/self/scheduler/config', validate(DailyTrainerSchema as any), (req: Request, res: Response) => {
  try {
    const next = (req as any).validated || req.body || {};
    (dailyTrainer as any).configure(next);
    res.json({ ok: true, status: (dailyTrainer as any).getStatus() });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'invalid_cfg' });
  }
});

app.post('/api/ai/self/scheduler/run', async (req: Request, res: Response) => {
  try {
    const maxBatches = Number((req.body || {}).maxBatches || 3);
    await (dailyTrainer as any).runOnce(maxBatches);
    res.json({ ok: true, status: (dailyTrainer as any).getStatus() });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'run_failed' });
  }
});

app.post('/api/ai/self/decide', validate(DecideSchema as any), async (req: Request, res: Response) => {
  const { state = [], actions = [], explore = true } = (req as any).validated || req.body || {};
  try {
    const out = await selfLearningEngine.decide(state, actions, explore);
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'decide failed' });
  }
});

app.post('/api/ai/self/act', validate(ActSchema as any), async (req: Request, res: Response) => {
  const { state = [], actions = [], explore = true } = (req as any).validated || req.body || {};
  try {
    const out = await selfLearningEngine.decideAndExecute(state, actions, explore);
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'act failed' });
  }
});

app.post('/api/ai/self/train/start', validate(TrainerSchema as any), (req: Request, res: Response) => {
  try {
    const { intervalMs = 1000 } = (req as any).validated || req.body || {};
    selfLearningEngine.startTrainer(Number(intervalMs));
    res.json({ ok: true, training: true, intervalMs });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'start trainer failed' });
  }
});

app.post('/api/ai/self/train/stop', (_req: Request, res: Response) => {
  try { selfLearningEngine.stopTrainer(); res.json({ ok: true, training: false }); }
  catch (e: any) { res.status(400).json({ error: e?.message || 'stop trainer failed' }); }
});

app.post('/api/ai/self/save', async (_req: Request, res: Response) => {
  try { await (selfLearningEngine as any).save(); res.json({ ok: true }); }
  catch (e: any) { res.status(500).json({ error: e?.message || 'save failed' }); }
});

app.post('/api/ai/self/load', async (_req: Request, res: Response) => {
  try { await (selfLearningEngine as any).load(); res.json({ ok: true, status: selfLearningEngine.getStatus() }); }
  catch (e: any) { res.status(500).json({ error: e?.message || 'load failed' }); }
});

app.get('/api/trust/status', (_req: Request, res: Response) => {
  try {
    res.json({ paused: (permissionManager as any).isPaused?.(), pending: (permissionManager as any).listPending?.() || [] })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'status failed' })
  }
});

app.get('/api/trust/prompts', (_req: Request, res: Response) => {
  try { res.json((permissionManager as any).listPending?.() || []) } catch (e: any) { res.status(500).json({ error: e?.message || 'list failed' }) }
});

app.post('/api/trust/decide', validate(TrustDecideSchema as any), (req: Request, res: Response) => {
  try {
    const { id, decision } = (req as any).validated || req.body || {};
    const r = (permissionManager as any).decide(String(id), decision)
    if (!r?.ok) return res.status(404).json({ error: 'not_found' })
    res.json({ ok: true })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'decide failed' })
  }
});

app.post('/api/trust/kill', validate(KillSchema as any), (req: Request, res: Response) => {
  try {
    const { paused } = (req as any).validated || req.body || {};
    (permissionManager as any).setPaused(!!paused)
    res.json({ ok: true, paused: (permissionManager as any).isPaused?.() })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'kill failed' })
  }
});

// Context (TCG) endpoint
app.get('/api/context/top', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(100, Number((req.query as any).limit || 20)))
    const types = (req.query as any).types ? String((req.query as any).types).split(',').map(s => s.trim()) : undefined
    const items = await getTopContext(limit, types as any)
    res.json(items)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'context_failed' })
  }
});

// Planner endpoints
app.post('/api/plan/compile', validate(PlanCompileSchema as any), (req: Request, res: Response) => {
  try {
    const { goal, context } = (req as any).validated || req.body || {}
    const plan = compilePlan(String(goal), context)
    res.json({ ok: true, plan })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'compile_failed' })
  }
});

app.post('/api/plan/execute', validate(PlanExecuteSchema as any), async (req: Request, res: Response) => {
  try {
    const { plan, simulate = true, sandbox = {} } = (req as any).validated || req.body || {}
    const result = await executePlan(plan, { simulate: !!simulate, sandbox })
    res.json({ ok: true, result })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'execute_failed' })
  }
});

// DAI sandbox execute endpoint
app.post('/api/dai/execute', validate(DAIExecSchema as any), async (req: Request, res: Response) => {
  try {
    const { action, options = {} } = (req as any).validated || req.body || {}
    const out = await daiSandbox.execute(action, options)
    res.json(out)
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'dai_failed' })
  }
});

// DAI config endpoints (spending cap override)
app.get('/api/dai/config', (_req: Request, res: Response) => {
  try { res.json(getDAIConfig()) } catch (e: any) { res.status(500).json({ error: e?.message || 'config_failed' }) }
})

app.post('/api/dai/config', (req: Request, res: Response) => {
  try {
    const { overrideCapUSD = null } = req.body || {}
    const cfg = setDAIConfig({ overrideCapUSD: overrideCapUSD === null ? null : Number(overrideCapUSD) })
    res.json({ ok: true, config: cfg })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'config_failed' })
  }
})

// Alignment endpoints (value-aligned learning)
app.get('/api/ai/self/alignment/status', (_req: Request, res: Response) => {
  try { res.json(alignmentModel.getStatus()); } catch (e: any) { res.status(500).json({ error: e?.message || 'status failed' }); }
});

app.post('/api/ai/self/alignment/ingest', validate(AlignIngestSchema as any), (req: Request, res: Response) => {
  try {
    const { label, action, features } = (req as any).validated || req.body || {};
    const status = action
      ? alignmentModel.ingestFromAction(action, Number(label) || 0, (selfLearningEngine as any).getWeights?.())
      : alignmentModel.ingest({ features: Array.isArray(features) ? features.map(Number) : [], label: Number(label) || 0 });
    res.json({ ok: true, status });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'ingest failed' });
  }
});

app.post('/api/ai/self/alignment/train', validate(AlignTrainSchema as any), async (req: Request, res: Response) => {
  try {
    const { epochs = 15, batchSize = 32 } = (req as any).validated || req.body || {};
    const result = await alignmentModel.train(Number(epochs), Number(batchSize));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'train failed' });
  }
});

app.post('/api/ai/self/alignment/score', validate(AlignScoreSchema as any), (req: Request, res: Response) => {
  try {
    const { action, features } = (req as any).validated || req.body || {};
    const score = action
      ? alignmentModel.scoreForAction(action, (selfLearningEngine as any).getWeights?.())
      : alignmentModel.score(Array.isArray(features) ? features.map(Number) : []);
    res.json({ score });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'score failed' });
  }
});

// WebSocket/SSE status
app.get('/api/ws/status', (_req: Request, res: Response) => {
  // If SSE has any clients, report active
  const hasClients = (sseBroker as any).clients?.size ?? undefined;
  res.json({ transport: 'sse', clients: hasClients });
});

// Unified Device Control facade (feature-flag)
const USE_UNIFIED_DEVICE_CONTROL = process.env.USE_UNIFIED_DEVICE_CONTROL === 'true';
// Lazy loader for unified device control to avoid hard import failures at startup
let _unifiedDeviceControl: any | null = null;
function getUnifiedDeviceControl() {
  if (_unifiedDeviceControl) return _unifiedDeviceControl;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./services/unifiedDeviceControl');
    _unifiedDeviceControl = mod.unifiedDeviceControl || mod.default || mod;
    // Attach UC to energy optimizer when available
    if (_unifiedDeviceControl && typeof _unifiedDeviceControl.listDevices === 'function') {
      try { energyOptimizer.attachUnifiedControl(_unifiedDeviceControl); } catch {}
    }
  } catch {
    _unifiedDeviceControl = null;
  }
  return _unifiedDeviceControl;
}

app.post('/api/devices/uc/sendCommand', async (req: Request, res: Response) => {
  const { deviceId, command, payload } = req.body || {};
  if (!deviceId || !command) return res.status(400).json({ error: 'deviceId and command required' });
  try {
    if (!USE_UNIFIED_DEVICE_CONTROL) return res.status(503).json({ error: 'UnifiedDeviceControl disabled' });
    const uc = getUnifiedDeviceControl();
    if (!uc) return res.status(503).json({ error: 'UnifiedDeviceControl unavailable' });
    await uc.sendCommand(String(deviceId), String(command), payload);
    const updated = uc.getDeviceState(String(deviceId));
    return res.json({ ok: true, device: { id: deviceId, state: updated } });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'uc command failed' });
  }
});

// Initialize real-time energy monitoring with ULTRA-AGGRESSIVE scraping
async function initializeEnergySystem() {
  try {
    console.log('🚀 Initializing ULTRA-AGGRESSIVE REAL-TIME SCRAPING SYSTEM...');
    
    // Start ULTRA-AGGRESSIVE scraper manager (1-second intervals)
    await scraperManager.initialize();
    console.log('✅ ULTRA-AGGRESSIVE scraper system started - 1 SECOND UPDATES');
    
    // Start REAL energy monitoring
    await realEnergyMonitor.startMonitoring();
    console.log('✅ REAL energy monitoring started');
    
    // Start REAL device controller
    await realDeviceController.initialize();
    console.log('✅ REAL device controller started');
    
    // Setup real-time scraper broadcasting
    scraperManager.on('realTimeUpdate', (data: any) => {
      try { 
        sseBroker.broadcast('scraper:realtime', data); 
        // Also broadcast via WebSocket for immediate updates
        wss.clients.forEach((client: any) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
              type: 'scraper_update',
              ...data
            }));
          }
        });
      } catch {}
    });
    
    console.log('⚡ JASON AI - ULTRA-AGGRESSIVE REAL-TIME SCRAPING ACTIVE');
    console.log('🕷️ SCRAPING EVERY 1 SECOND - MAXIMUM DATA VELOCITY');
    console.log('📊 100% REAL device integration - NO SIMULATION OR MOCKING');
    console.log('🔌 Supporting: WiFi (Tasmota/Shelly/Kasa), Zigbee, Modbus, Serial');
    console.log('💰 REAL device control and energy optimization enabled');
    console.log('🚀 LIVE DATA: Energy, Weather, Crypto, Stocks, Commodities');
    
  } catch (error) {
    console.error('❌ Failed to initialize ultra-aggressive system:', error);
  }
}

// Start server with real energy system
server.listen(PORT, async () => {
  console.log(`[server/index.ts] JASON AI Server listening on port ${PORT}`);
  console.log('🌟 REAL-TIME ENERGY CONTROL SYSTEM ENABLED');
  
  // Initialize energy system after server starts
  if (!LIGHT_MODE) setTimeout(initializeEnergySystem, 1000);
});

import { Router, Request, Response } from 'express';
import { taskOrchestrator } from '../../../services/orchestrator/TaskOrchestrator';
import type { Plan } from '../../../services/planner/HTNPlanner';
import { uspt } from '../../../services/personalization/USPT';
import { listArchitectures, getArchitectureById, listArchitecturesByCategory } from '../../../services/knowledge/NeuralArchitectures';
import { compilePlan } from '../../../services/planner/HTNPlanner';

const router = Router();

router.post('/greeting', (req: Request, res: Response) => {
  const { userName, context } = req.body;

  // Simple AI-like greeting logic for demonstration
  let greeting = `Hello, ${userName}!`;
  if (context.includes('dashboard')) {
    greeting = `Welcome back to your dashboard, ${userName}!`;
  } else if (new Date().getHours() < 12) {
    greeting = `Good morning, ${userName}!`;
  } else if (new Date().getHours() < 18) {
    greeting = `Good afternoon, ${userName}!`;
  } else {
    greeting = `Good evening, ${userName}!`;
  }

  res.json({ greeting });
});

router.post('/flight/arbitrage', async (req: Request, res: Response, next) => {
  try {
    const body = req.body || {};
    const origin = String(body.origin || 'LHR');
    const destination = String(body.destination || 'BGI');
    const departureDate = body.departureDate ? String(body.departureDate) : '';
    const returnDate = body.returnDate ? String(body.returnDate) : undefined;
    const passengers = typeof body.passengers === 'number' ? body.passengers : 1;
    const cabin = body.cabin ? String(body.cabin) : undefined;
    const currencies = Array.isArray(body.currencies) ? body.currencies.map((c: any) => String(c)) : undefined;
    const resultCurrency = body.resultCurrency ? String(body.resultCurrency) : undefined;

    const goal = `Flight arbitrage from ${origin} to ${destination}`;
    const planId = `plan_flight_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const taskId = `task_flight_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const plan: Plan = {
      id: planId,
      goal,
      tasks: [
        {
          id: taskId,
          name: 'Search cheapest flight',
          riskLevel: 0.7,
          tags: ['help', 'travel', 'flight', 'book'],
          action: {
            type: 'web',
            name: 'flight_arbitrage',
            riskLevel: 0.7,
            tags: ['help', 'travel', 'flight', 'book'],
            payload: {
              mode: 'flight_arbitrage',
              origin,
              destination,
              departureDate,
              returnDate,
              passengers,
              cabin,
              currencies,
              resultCurrency,
            },
          },
        },
      ],
    };

    const job = await taskOrchestrator.enqueue({ plan, priority: 9, simulate: false });
    res.status(202).json({ jobId: job.id, goal: job.goal, planId: job.plan.id });
  } catch (e) {
    next(e);
  }
});

router.post('/travel/cambodia-15d', async (req: Request, res: Response, next) => {
  try {
    const body = req.body || {};
    const originRaw = typeof body.origin === 'string' ? body.origin.trim() : 'LHR';
    const origin = originRaw ? originRaw.toUpperCase() : 'LHR';
    const departureDate = typeof body.departureDate === 'string' ? body.departureDate : '';
    const passengers = typeof body.passengers === 'number' ? body.passengers : 5;
    const cabin = typeof body.cabin === 'string' ? body.cabin : undefined;

    const goal = 'Plan 15 day luxury-on-a-budget Cambodia holiday';
    const plan: Plan = await compilePlan(goal, {
      scenario: 'cambodia_15d_luxury_budget',
      origin,
      destination: 'PNH',
      departureDate,
      passengers,
      cabin,
      days: 15,
    });

    const sandboxHosts = [
      'api.weather.gov',
      'www.google.com',
      'www.booking.com',
      'www.skyscanner.net',
      'www.kayak.com',
      'www.expedia.co.uk',
      'www.momondo.co.uk',
      'www.tripadvisor.com',
    ];

    const job = await taskOrchestrator.enqueue({
      plan,
      priority: 9,
      simulate: false,
      sandbox: { allowedHosts: sandboxHosts },
    });

    res.status(202).json({ jobId: job.id, goal: job.goal, planId: job.plan.id, sandboxHosts });
  } catch (e) {
    next(e);
  }
});

router.get('/style/profile', async (req: Request, res: Response, next) => {
  try {
    const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
    const recipient = typeof req.query.recipient === 'string' ? req.query.recipient : undefined;
    const taskType = typeof req.query.taskType === 'string' ? req.query.taskType : undefined;

    const profile = await uspt.getToneProfile({
      channel: channel as any,
      recipient,
      taskType,
    });

    res.json({ profile });
  } catch (e) {
    next(e);
  }
});

router.post('/style/ingest', async (req: Request, res: Response, next) => {
  try {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text : '';
    const channel = typeof body.channel === 'string' ? body.channel : undefined;
    const recipient = typeof body.recipient === 'string' ? body.recipient : undefined;
    const taskType = typeof body.taskType === 'string' ? body.taskType : undefined;

    await uspt.ingestExample(text, {
      channel: channel as any,
      recipient,
      taskType,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/architectures', async (req: Request, res: Response, next) => {
  try {
    const id = typeof req.query.id === 'string' ? req.query.id : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    if (id) {
      const arch = getArchitectureById(id);
      if (!arch) return res.status(404).json({ error: 'not_found' });
      return res.json({ architecture: arch });
    }

    if (category) {
      const list = listArchitecturesByCategory(category as any);
      return res.json({ architectures: list });
    }

    const all = listArchitectures();
    res.json({ architectures: all });
  } catch (e) {
    next(e);
  }
});

export default router;
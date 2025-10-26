import { Router, Request, Response } from 'express';

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

export default router;
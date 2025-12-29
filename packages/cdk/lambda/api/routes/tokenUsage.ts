import { Router, Request, Response } from 'express';
import { handler as getTokenUsageHandler } from '../../getTokenUsage';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getTokenUsageHandler(createEvent(req) as any);
    sendResponse(res, result);
  } catch (error) {
    console.error('Get token usage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

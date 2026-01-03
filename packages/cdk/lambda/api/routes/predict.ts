import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as predictHandler } from '../services/predict';
import { handler as predictTitleHandler } from '../services/predictTitle';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await predictHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Predict error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/title', async (req: Request, res: Response) => {
  try {
    const result = await predictTitleHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Predict title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

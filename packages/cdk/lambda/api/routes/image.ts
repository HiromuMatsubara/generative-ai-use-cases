import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as generateImageHandler } from '../services/generateImage';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const result = await generateImageHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

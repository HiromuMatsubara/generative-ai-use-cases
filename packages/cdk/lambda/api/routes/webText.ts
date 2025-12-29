import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as getWebTextHandler } from '../../getWebText';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await getWebTextHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Get web text error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { createEvent, sendResponse } from './helpers';

// Import handlers - converted to ES modules
import { handler as queryKendraHandler } from '../../queryKendra';
import { handler as retrieveKendraHandler } from '../../retrieveKendra';

export const router = Router();

router.post('/query', async (req: Request, res: Response) => {
  try {
    const result = await queryKendraHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Query Kendra error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/retrieve', async (req: Request, res: Response) => {
  try {
    const result = await retrieveKendraHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Retrieve Kendra error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

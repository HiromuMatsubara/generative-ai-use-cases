import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { createEvent, sendResponse } from './helpers';
import { handler as retrieveKnowledgeBaseHandler } from '../../retrieveKnowledgeBase';

export const router = Router();

router.post('/retrieve', async (req: Request, res: Response) => {
  try {
    const result = await retrieveKnowledgeBaseHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Retrieve Knowledge Base error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

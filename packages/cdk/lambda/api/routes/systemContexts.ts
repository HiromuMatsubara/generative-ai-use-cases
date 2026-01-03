import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as listSystemContextsHandler } from '../services/listSystemContexts';
import { handler as createSystemContextHandler } from '../services/createSystemContext';
import { handler as deleteSystemContextHandler } from '../services/deleteSystemContext';
import { handler as updateSystemContextTitleHandler } from '../services/updateSystemContextTitle';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await createSystemContextHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Create system context error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await listSystemContextsHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List system contexts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:systemContextId', async (req: Request, res: Response) => {
  try {
    const result = await deleteSystemContextHandler(
      createEvent(req, {
        systemContextId: req.params.systemContextId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Delete system context error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:systemContextId/title', async (req: Request, res: Response) => {
  try {
    const result = await updateSystemContextTitleHandler(
      createEvent(req, {
        systemContextId: req.params.systemContextId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Update system context title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

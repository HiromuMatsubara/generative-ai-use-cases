import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as findShareIdHandler } from '../services/findShareId';
import { handler as createShareIdHandler } from '../services/createShareId';
import { handler as getSharedChatHandler } from '../services/getSharedChat';
import { handler as deleteShareIdHandler } from '../services/deleteShareId';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.get('/chat/:chatId', async (req: Request, res: Response) => {
  try {
    const result = await findShareIdHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Find share ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/chat/:chatId', async (req: Request, res: Response) => {
  try {
    const result = await createShareIdHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Create share ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/share/:shareId', async (req: Request, res: Response) => {
  try {
    const result = await getSharedChatHandler(
      createEvent(req, { shareId: req.params.shareId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Get shared chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/share/:shareId', async (req: Request, res: Response) => {
  try {
    const result = await deleteShareIdHandler(
      createEvent(req, { shareId: req.params.shareId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Delete share ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

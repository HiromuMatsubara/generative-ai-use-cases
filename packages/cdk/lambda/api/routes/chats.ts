import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as createChatHandler } from '../../createChat';
import { handler as listChatsHandler } from '../../listChats';
import { handler as findChatByIdHandler } from '../../findChatById';
import { handler as deleteChatHandler } from '../../deleteChat';
import { handler as updateTitleHandler } from '../../updateTitle';
import { handler as listMessagesHandler } from '../../listMessages';
import { handler as createMessagesHandler } from '../../createMessages';
import { handler as updateFeedbackHandler } from '../../updateFeedback';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await createChatHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await listChatsHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:chatId', async (req: Request, res: Response) => {
  try {
    const result = await findChatByIdHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Find chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:chatId', async (req: Request, res: Response) => {
  try {
    const result = await deleteChatHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:chatId/title', async (req: Request, res: Response) => {
  try {
    const result = await updateTitleHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Update title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const result = await listMessagesHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const result = await createMessagesHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Create messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:chatId/feedbacks', async (req: Request, res: Response) => {
  try {
    const result = await updateFeedbackHandler(
      createEvent(req, { chatId: req.params.chatId }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

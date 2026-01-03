import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as listUseCasesHandler } from '../services/useCaseBuilder/listUseCases';
import { handler as listFavoriteUseCasesHandler } from '../services/useCaseBuilder/listFavoriteUseCases';
import { handler as getUseCaseHandler } from '../services/useCaseBuilder/getUseCase';
import { handler as createUseCaseHandler } from '../services/useCaseBuilder/createUseCase';
import { handler as updateUseCaseHandler } from '../services/useCaseBuilder/updateUseCase';
import { handler as deleteUseCaseHandler } from '../services/useCaseBuilder/deleteUseCase';
import { handler as toggleFavoriteHandler } from '../services/useCaseBuilder/toggleFavorite';
import { handler as toggleSharedHandler } from '../services/useCaseBuilder/toggleShared';
import { handler as listRecentlyUsedUseCasesHandler } from '../services/useCaseBuilder/listRecentlyUsedUseCases';
import { handler as updateRecentlyUsedUseCaseHandler } from '../services/useCaseBuilder/updateRecentlyUsedUseCase';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await listUseCasesHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List use cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/favorite', async (req: Request, res: Response) => {
  try {
    const result = await listFavoriteUseCasesHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List favorite use cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/recent', async (req: Request, res: Response) => {
  try {
    const result = await listRecentlyUsedUseCasesHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List recently used use cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/recent/:useCaseId', async (req: Request, res: Response) => {
  try {
    const result = await updateRecentlyUsedUseCaseHandler(
      createEvent(req, {
        useCaseId: req.params.useCaseId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Update recently used use case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:useCaseId', async (req: Request, res: Response) => {
  try {
    const result = await getUseCaseHandler(
      createEvent(req, {
        useCaseId: req.params.useCaseId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Get use case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await createUseCaseHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Create use case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:useCaseId', async (req: Request, res: Response) => {
  try {
    const result = await updateUseCaseHandler(
      createEvent(req, {
        useCaseId: req.params.useCaseId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Update use case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:useCaseId', async (req: Request, res: Response) => {
  try {
    const result = await deleteUseCaseHandler(
      createEvent(req, {
        useCaseId: req.params.useCaseId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Delete use case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:useCaseId/favorite', async (req: Request, res: Response) => {
  try {
    const result = await toggleFavoriteHandler(
      createEvent(req, {
        useCaseId: req.params.useCaseId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:useCaseId/shared', async (req: Request, res: Response) => {
  try {
    const result = await toggleSharedHandler(
      createEvent(req, {
        useCaseId: req.params.useCaseId,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Toggle shared error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  handleCreateAgent,
  handleGetAgent,
  handleUpdateAgent,
  handleDeleteAgent,
  handleListUserAgents,
  handleListPublicAgents,
  handleCloneAgent,
  handleListFavoriteAgents,
  handleToggleAgentFavorite,
} from '../services/agentBuilder/handlers/agent-handlers';
import { validateAndParseRequestBody } from '../services/agentBuilder/validation/request-validation';
import { getUserIdFromEvent } from '../services/agentBuilder/utils/auth-utils';
import { createEvent } from './helpers';
import {
  CreateAgentRequest,
  CloneAgentRequest,
  UpdateAgentRequest,
} from 'generative-ai-use-cases';

export const router = Router();

// List public agents
router.get('/public', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const exclusiveStartKey =
      (req.query.exclusiveStartKey as string) ||
      (req.query.nextToken as string);
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined;

    const result = await handleListPublicAgents(
      userId,
      exclusiveStartKey,
      limit
    );
    console.log(userId, exclusiveStartKey, limit, result);
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('List public agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List favorite agents
router.get('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const exclusiveStartKey =
      (req.query.exclusiveStartKey as string) ||
      (req.query.nextToken as string);
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined;

    const result = await handleListFavoriteAgents(
      userId,
      exclusiveStartKey,
      limit
    );
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('List favorite agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List user's agents
router.get('/my', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const exclusiveStartKey =
      (req.query.exclusiveStartKey as string) ||
      (req.query.nextToken as string);
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined;

    const result = await handleListUserAgents(userId, exclusiveStartKey, limit);
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('List user agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clone agent
router.post('/clone', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const parseResult = validateAndParseRequestBody(JSON.stringify(req.body));
    if (!parseResult.isValid) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await handleCloneAgent(
      userId,
      parseResult.data as CloneAgentRequest
    );
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Clone agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import agent (same as clone)
router.post('/import', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const parseResult = validateAndParseRequestBody(JSON.stringify(req.body));
    if (!parseResult.isValid) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await handleCloneAgent(
      userId,
      parseResult.data as CloneAgentRequest
    );
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Import agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle favorite
router.post('/:agentId/favorite', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const result = await handleToggleAgentFavorite(userId, req.params.agentId);
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent
router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const result = await handleGetAgent(userId, req.params.agentId);
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update agent
router.put('/:agentId', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const parseResult = validateAndParseRequestBody(JSON.stringify(req.body));
    if (!parseResult.isValid) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await handleUpdateAgent(
      userId,
      req.params.agentId,
      parseResult.data as UpdateAgentRequest
    );
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete agent
router.delete('/:agentId', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const result = await handleDeleteAgent(userId, req.params.agentId);
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const parseResult = validateAndParseRequestBody(JSON.stringify(req.body));
    if (!parseResult.isValid) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await handleCreateAgent(
      userId,
      parseResult.data as CreateAgentRequest
    );
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List user agents (default)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromEvent(createEvent(req) as APIGatewayProxyEvent);
    const exclusiveStartKey =
      (req.query.exclusiveStartKey as string) ||
      (req.query.nextToken as string);
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined;

    const result = await handleListUserAgents(userId, exclusiveStartKey, limit);
    res.status(result.statusCode).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('List user agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

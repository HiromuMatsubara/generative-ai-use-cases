import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as generateVideoHandler } from '../../generateVideo';
import { handler as listVideoJobsHandler } from '../../listVideoJobs';
import { handler as deleteVideoJobHandler } from '../../deleteVideoJob';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const result = await generateVideoHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Generate video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/generate', async (req: Request, res: Response) => {
  try {
    const result = await listVideoJobsHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('List video jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/generate/:createdDate', async (req: Request, res: Response) => {
  try {
    const result = await deleteVideoJobHandler(
      createEvent(req, {
        createdDate: req.params.createdDate,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Delete video job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

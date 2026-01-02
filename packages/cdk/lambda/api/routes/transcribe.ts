import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as startTranscriptionHandler } from '../../startTranscription';
import { handler as getTranscriptionHandler } from '../../getTranscription';
import { handler as getSignedUrlHandler } from '../../getFileUploadSignedUrl';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

router.post('/start', async (req: Request, res: Response) => {
  try {
    const result = await startTranscriptionHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Start transcription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/url', async (req: Request, res: Response) => {
  try {
    const result = await getSignedUrlHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Get signed URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/result/:jobName', async (req: Request, res: Response) => {
  try {
    const result = await getTranscriptionHandler(
      createEvent(req, { jobName: req.params.jobName }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Get transcription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

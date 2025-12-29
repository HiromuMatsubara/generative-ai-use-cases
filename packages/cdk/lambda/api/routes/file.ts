import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as getSignedUrlHandler } from '../../getFileUploadSignedUrl';
import { handler as getFileDownloadSignedUrlHandler } from '../../getFileDownloadSignedUrl';
import { handler as deleteFileHandler } from '../../deleteFile';
import { createEvent, sendResponse } from './helpers';

export const router = Router();

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

router.get('/url', async (req: Request, res: Response) => {
  try {
    const result = await getFileDownloadSignedUrlHandler(
      createEvent(req) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Get file download signed URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:fileName', async (req: Request, res: Response) => {
  try {
    const result = await deleteFileHandler(
      createEvent(req, {
        fileName: req.params.fileName,
      }) as APIGatewayProxyEvent
    );
    sendResponse(res, result);
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

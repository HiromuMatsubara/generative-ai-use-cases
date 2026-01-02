import { Router, Request, Response } from 'express';
import {
  LambdaClient,
  InvokeCommand,
  InvocationType,
} from '@aws-sdk/client-lambda';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { channel, model } = req.body;
    const lambda = new LambdaClient({});

    await lambda.send(
      new InvokeCommand({
        FunctionName: process.env.SPEECH_TO_SPEECH_TASK_FUNCTION_ARN,
        InvocationType: InvocationType.Event,
        Payload: JSON.stringify({ channelId: channel, model }),
      })
    );
    return res.json({ channel });
  } catch (error) {
    console.error('[SpeechToSpeech] Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

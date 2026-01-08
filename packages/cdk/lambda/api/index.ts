import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Extract API Gateway event from Lambda Web Adapter
app.use(
  (
    req: express.Request & {
      apiGateway?: { event?: { requestContext?: unknown } };
    },
    res,
    next
  ) => {
    // Lambda Web Adapter passes the API Gateway request context in x-amzn-request-context header
    const requestContextHeader = req.headers['x-amzn-request-context'];

    if (requestContextHeader) {
      try {
        const requestContext = JSON.parse(requestContextHeader as string);
        req.apiGateway = {
          event: {
            requestContext: requestContext,
          },
        };
      } catch (e) {
        console.error('Failed to parse request context:', e);
      }
    } else {
      // Local development: Mock API Gateway event
      req.apiGateway = {
        event: {
          requestContext: {
            authorizer: {
              claims: {
                sub: 'local-user-id',
                'cognito:username': 'local-user',
                email: 'local@example.com',
              },
            },
          },
        },
      };
    }
    next();
  }
);

app.use(express.json({ limit: '10mb' }));

// Import route handlers
import { router as predictRouter } from './routes/predict';
import { router as chatsRouter } from './routes/chats';
import { router as systemContextsRouter } from './routes/systemContexts';
import { router as imageRouter } from './routes/image';
import { router as videoRouter } from './routes/video';
import { router as webTextRouter } from './routes/webText';
import { router as sharesRouter } from './routes/shares';
import { router as fileRouter } from './routes/file';
import { router as tokenUsageRouter } from './routes/tokenUsage';
import { router as useCasesRouter } from './routes/useCases';
import { router as ragRouter } from './routes/rag';
import { router as ragKnowledgeBaseRouter } from './routes/ragKnowledgeBase';
import { router as agentBuilderRouter } from './routes/agentBuilder';
import { router as transcribeRouter } from './routes/transcribe';
import { router as speechToSpeechRouter } from './routes/speechToSpeech';

// Mount routes
app.use('/predict', predictRouter);
app.use('/chats', chatsRouter);
app.use('/systemcontexts', systemContextsRouter);
app.use('/image', imageRouter);
app.use('/video', videoRouter);
app.use('/web-text', webTextRouter);
app.use('/shares', sharesRouter);
app.use('/file', fileRouter);
app.use('/token-usage', tokenUsageRouter);
app.use('/usecases', useCasesRouter);
app.use('/rag', ragRouter);
app.use('/rag-knowledge-base', ragKnowledgeBaseRouter);
app.use('/agents', agentBuilderRouter);
app.use('/transcribe', transcribeRouter);
app.use('/speech-to-speech', speechToSpeechRouter);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error('Express error:', err);
    res
      .status(500)
      .json({ error: 'Internal server error', message: err.message });
  }
);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

import { Request, Response } from 'express';
import {
  APIGatewayProxyEvent,
  APIGatewayEventRequestContext,
} from 'aws-lambda';

export interface RequestWithApiGateway extends Request {
  apiGateway?: {
    event?: {
      requestContext?: APIGatewayEventRequestContext;
    };
  };
}

export const createEvent = (
  req: Request,
  pathParams: Record<string, string> = {}
): Partial<APIGatewayProxyEvent> => ({
  requestContext: (req as RequestWithApiGateway)?.apiGateway?.event
    ?.requestContext,
  httpMethod: req.method,
  pathParameters: pathParams,
  queryStringParameters: req.query as Record<string, string>,
  body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
});

export const sendResponse = (
  res: Response,
  result: {
    statusCode: number;
    body?: string;
    headers?:
      | Record<string, string>
      | { [key: string]: boolean | number | string };
  }
) => {
  // Apply any headers provided by the Lambda-style result
  if (result.headers) {
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, String(value));
    });
  }

  if (result.statusCode === 204 || !result.body) {
    res.status(result.statusCode).send();
  } else {
    // Try to parse as JSON, if it fails, send as plain text
    try {
      // If body is already an object, send it directly as JSON
      if (typeof result.body !== 'string') {
        res.status(result.statusCode).json(result.body);
        return;
      }

      const body = JSON.parse(result.body);
      res.status(result.statusCode).json(body);
    } catch {
      // Plain text response
      // Force a safe content type to prevent executing user-controlled content as HTML
      res.type('text/plain; charset=utf-8');
      res.status(result.statusCode).send(result.body);
    }
  }
};

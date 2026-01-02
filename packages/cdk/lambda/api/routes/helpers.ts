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
  if (result.statusCode === 204 || !result.body) {
    res.status(result.statusCode).send();
  } else {
    // Try to parse as JSON, if it fails, send as plain text
    try {
      const body =
        typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      res.status(result.statusCode).json(body);
    } catch {
      // Plain text response
      res.status(result.statusCode).send(result.body);
    }
  }
};

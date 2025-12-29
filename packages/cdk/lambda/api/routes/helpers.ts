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
  pathParameters: pathParams,
  queryStringParameters: req.query as Record<string, string>,
  body: req.body,
});

export const sendResponse = (
  res: Response,
  result: { statusCode: number; body?: string }
) => {
  if (result.statusCode === 204 || !result.body) {
    res.status(result.statusCode).send();
  } else {
    res.status(result.statusCode).json(JSON.parse(result.body));
  }
};

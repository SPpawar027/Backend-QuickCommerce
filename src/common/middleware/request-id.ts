/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get request ID from header or generate new one
  const requestId = (req.get('X-Request-ID') as string) || uuidv4();

  // Attach to request object
  req.requestId = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
};

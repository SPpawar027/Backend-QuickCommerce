import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

type AsyncRequestHandler = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncWrapper = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

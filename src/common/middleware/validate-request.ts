import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = schema.parse({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      req.body = result.body;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      req.query = result.query;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      req.params = result.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return next(AppError.validation(messages.join(', ')));
      }
      next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return next(AppError.validation(messages.join(', ')));
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return next(AppError.validation(messages.join(', ')));
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return next(AppError.validation(messages.join(', ')));
      }
      next(error);
    }
  };
};

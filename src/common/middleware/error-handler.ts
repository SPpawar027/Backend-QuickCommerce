import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    stack?: string;
    details?: unknown;
  };
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: unknown = null;

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;

    // Log operational errors
    if (!err.isOperational) {
      logger.error('Non-operational error:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
      });
    }
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.message;
  }
  // Handle Mongoose duplicate key errors
  else if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    code = 'DUPLICATE_ERROR';
    details = (err as { keyValue?: Record<string, unknown> }).keyValue;
  }
  // Handle Mongoose cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle syntax errors (malformed JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format';
    code = 'INVALID_JSON';
  }
  // Handle unknown errors
  else {
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  // Add stack trace in development
  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  // Add details if available
  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

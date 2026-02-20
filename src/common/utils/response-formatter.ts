import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    stack?: string;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
  meta?: Record<string, unknown>
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  stack?: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  if (stack && process.env.NODE_ENV !== 'production') {
    response.error.stack = stack;
  }

  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, 201, message);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

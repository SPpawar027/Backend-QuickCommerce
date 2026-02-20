export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST'): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED'): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message: string = 'Forbidden', code: string = 'FORBIDDEN'): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message: string = 'Resource not found', code: string = 'NOT_FOUND'): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message: string, code: string = 'CONFLICT'): AppError {
    return new AppError(message, 409, code);
  }

  static validation(message: string, code: string = 'VALIDATION_ERROR'): AppError {
    return new AppError(message, 422, code);
  }

  static tooManyRequests(
    message: string = 'Too many requests',
    code: string = 'RATE_LIMIT'
  ): AppError {
    return new AppError(message, 429, code);
  }

  static internal(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR'): AppError {
    return new AppError(message, 500, code, false);
  }
}

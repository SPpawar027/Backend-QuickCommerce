import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../constants';
import { AppError } from '../errors';
import { RequestHandler } from 'express';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw AppError.tooManyRequests(
      `Too many requests, please try again after ${Math.ceil(options.windowMs / 60000)} minutes`
    );
  },
  keyGenerator: req => {
    return req.ip ?? 'unknown';
  },
  skip: req => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH_WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw AppError.tooManyRequests(
      `Too many authentication attempts, please try again after ${Math.ceil(options.windowMs / 60000)} minutes`
    );
  },
  keyGenerator: req => {
    return req.ip ?? 'unknown';
  },
  skipSuccessfulRequests: false,
});

// Custom rate limiter factory
export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  message?: string
): RequestHandler => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, _next, options) => {
      throw AppError.tooManyRequests(
        message ??
          `Too many requests, please try again after ${Math.ceil(options.windowMs / 60000)} minutes`
      );
    },
  });
};

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { env } from './config/env';
import { errorHandler, apiRateLimiter, requestIdMiddleware } from './common/middleware';
import { morganStream } from './common/utils/logger';
import { sendSuccess } from './common/utils/response-formatter';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS?.split(',') ?? [])
        : env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// Compression middleware
app.use(compression());

// Request ID middleware
app.use(requestIdMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP request logging
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: morganStream,
    skip: req => req.path === '/health',
  })
);

// Rate limiting
app.use(apiRateLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;

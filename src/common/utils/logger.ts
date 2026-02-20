import winston from 'winston';
import { env } from '../../config/env';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'quick-delivery-api' },
  transports: [
    new winston.transports.Console({
      format:
        env.NODE_ENV === 'production'
          ? combine(timestamp(), json(), errors({ stack: true }))
          : combine(
              colorize(),
              timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              devFormat
            ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
});

// Stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

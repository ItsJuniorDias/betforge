import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  })
);

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: consoleFormat }),
];

if (env.NODE_ENV !== 'test') {
  transports.push(
    new DailyRotateFile({
      filename: `${env.LOG_DIR}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: `${env.LOG_DIR}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports,
  exitOnError: false,
});

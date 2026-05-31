import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'headers.cookie',
      'headers.authorization',
      'password',
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
    ],
    censor: '[REDACTED]',
  },
});

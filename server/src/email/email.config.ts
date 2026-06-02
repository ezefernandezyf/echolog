import { Resend } from 'resend';
import { logger } from '../infra/logger.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY not set — email sending will fail via error wrapper');
}

export const emailConfig = {
  apiKey: RESEND_API_KEY,
  from: process.env.EMAIL_FROM ?? 'delivered@resend.dev',
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3001',
} as const;

export const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

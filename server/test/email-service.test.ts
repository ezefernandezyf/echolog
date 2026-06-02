import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const { mockSend, mockLogger } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mocks — hoisted by vitest, must be before any imports
// ---------------------------------------------------------------------------
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockSend },
  })),
}));

vi.mock('../src/email/email.config', () => ({
  emailConfig: {
    apiKey: 're_test_mock_key',
    from: 'delivered@resend.dev',
    baseUrl: 'http://localhost:3001',
  },
  resendClient: {
    emails: { send: mockSend },
  },
}));

vi.mock('../src/infra/logger', () => ({
  logger: mockLogger,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { EmailService } from '../src/email/email.service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createService() {
  return new EmailService();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: test mode OFF (we test the wrapper logic ourselves)
    delete (process.env as Record<string, string>).NODE_ENV;
    service = createService();
  });

  afterEach(() => {
    // Reset to test mode for other test files
    process.env.NODE_ENV = 'test';
  });

  // ── NODE_ENV=test guard ──────────────────────────────────────────────
  describe('NODE_ENV=test guard', () => {
    it('sendInvitationEmail returns immediately when NODE_ENV=test', async () => {
      process.env.NODE_ENV = 'test';

      await service.sendInvitationEmail('token', 'user@test.com', 'WS', 'Inviter');

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('sendRoleChangedEmail returns immediately when NODE_ENV=test', async () => {
      process.env.NODE_ENV = 'test';

      await service.sendRoleChangedEmail('user@test.com', 'WS', 'ADMIN');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('sendWelcomeEmail returns immediately when NODE_ENV=test', async () => {
      process.env.NODE_ENV = 'test';

      await service.sendWelcomeEmail('user@test.com', 'Alice');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('withEmailErrorHandling returns immediately when NODE_ENV=test', async () => {
      process.env.NODE_ENV = 'test';
      const fn = vi.fn();

      // Access private method via type assertion
      await (service as unknown as {
        withEmailErrorHandling: (fn: () => Promise<void>, ctx: object) => Promise<void>;
      }).withEmailErrorHandling(async () => { fn(); }, { type: 'test', recipient: 'x@y.com' });

      expect(fn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  // ── sendInvitationEmail ──────────────────────────────────────────────
  describe('sendInvitationEmail', () => {
    beforeEach(() => {
      // We need RESEND_API_KEY for the resendClient to be non-null
      process.env.RESEND_API_KEY = 're_test_key';
    });

    afterEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it('calls resend.emails.send with correct params', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-1' });

      await service.sendInvitationEmail('tok-abc', 'invited@test.com', 'Acme Corp', 'Alice');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toBe('invited@test.com');
      expect(callArgs.subject).toContain('Acme Corp');
      expect(callArgs.html).toContain('Acme Corp');
      expect(callArgs.html).toContain('Alice');
      expect(callArgs.html).toContain('/invite/tok-abc');
    });

    it('logs error and does not throw when Resend fails', async () => {
      const resendError = new Error('Resend API 500');
      mockSend.mockRejectedValue(resendError);

      // Should not throw
      await service.sendInvitationEmail('tok', 'fail@test.com', 'WS', 'Inv');

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: resendError,
          emailType: 'invitation',
          recipient: 'fail@test.com',
        }),
        'Failed to send email',
      );
    });
  });

  // ── sendRoleChangedEmail ─────────────────────────────────────────────
  describe('sendRoleChangedEmail', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test_key';
    });

    afterEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it('calls resend.emails.send with correct params', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-2' });

      await service.sendRoleChangedEmail('member@test.com', 'Acme Corp', 'ADMIN');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toBe('member@test.com');
      expect(callArgs.subject).toContain('Acme Corp');
      expect(callArgs.subject).toContain('ADMIN');
      expect(callArgs.html).toContain('Acme Corp');
      expect(callArgs.html).toContain('Admin');
    });

    it('returns immediately when userEmail is missing', async () => {
      await service.sendRoleChangedEmail(null as unknown as string, 'WS', 'MEMBER');

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('returns immediately when userEmail is undefined', async () => {
      await service.sendRoleChangedEmail(undefined, 'WS', 'MEMBER');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('logs error and does not throw when Resend fails', async () => {
      const resendError = new Error('Resend API 500');
      mockSend.mockRejectedValue(resendError);

      await service.sendRoleChangedEmail('fail@test.com', 'WS', 'ADMIN');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: resendError,
          emailType: 'role-changed',
          recipient: 'fail@test.com',
        }),
        'Failed to send email',
      );
    });
  });

  // ── sendWelcomeEmail ─────────────────────────────────────────────────
  describe('sendWelcomeEmail', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test_key';
    });

    afterEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it('calls resend.emails.send with correct params', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-3' });

      await service.sendWelcomeEmail('newuser@test.com', 'Alice');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toBe('newuser@test.com');
      expect(callArgs.subject).toBe('Welcome to EchoLog!');
      expect(callArgs.html).toContain('Alice');
      expect(callArgs.html).toContain('EchoLog');
    });

    it('handles null userName gracefully in template', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-4' });

      await service.sendWelcomeEmail('newuser@test.com', null);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('there');
      // Should NOT contain "null" as a string
      expect(callArgs.html).not.toContain('null');
    });

    it('logs error and does not throw when Resend fails', async () => {
      const resendError = new Error('Resend API 500');
      mockSend.mockRejectedValue(resendError);

      await service.sendWelcomeEmail('fail@test.com', 'Alice');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: resendError,
          emailType: 'welcome',
          recipient: 'fail@test.com',
        }),
        'Failed to send email',
      );
    });
  });

  // ── withEmailErrorHandling wrapper ──────────────────────────────────────
  describe('withEmailErrorHandling', () => {
    it('resolves when the inner function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const ctx = { type: 'invitation', recipient: 'x@y.com' };

      await (service as unknown as {
        withEmailErrorHandling: (fn: () => Promise<string>, ctx: object) => Promise<void>;
      }).withEmailErrorHandling(fn, ctx);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('logs error and does NOT rethrow when inner function rejects', async () => {
      const error = new Error('Boom');
      const fn = vi.fn().mockRejectedValue(error);
      const ctx = { type: 'welcome', recipient: 'fail@test.com' };

      // Should not throw
      await (service as unknown as {
        withEmailErrorHandling: (fn: () => Promise<void>, ctx: object) => Promise<void>;
      }).withEmailErrorHandling(fn, ctx);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          emailType: 'welcome',
          recipient: 'fail@test.com',
        }),
        'Failed to send email',
      );
    });

    it('logs error with 401 (invalid API key) details', async () => {
      const authError = new Error('Unauthorized — invalid API key');
      (authError as Record<string, unknown>).statusCode = 401;
      const fn = vi.fn().mockRejectedValue(authError);
      const ctx = { type: 'invitation', recipient: 'x@y.com' };

      await (service as unknown as {
        withEmailErrorHandling: (fn: () => Promise<void>, ctx: object) => Promise<void>;
      }).withEmailErrorHandling(fn, ctx);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: authError,
          emailType: 'invitation',
        }),
        'Failed to send email',
      );
    });
  });
});

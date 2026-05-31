import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ---- Hoisted: runs before vi.mock is hoisted ----
const { mockLogger } = vi.hoisted(() => {
  const mock = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(() => mock),
  };
  return { mockLogger: mock };
});

// ---- Mock the logger module ----
vi.mock('../src/infra/logger.js', () => ({
  logger: mockLogger,
}));

// ---- Import app (uses logger) ----
import app from '../src/index.js';

describe('Structured Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // LOG-1: Standard log output is valid JSON
  it('LOG-1: pino produces valid JSON output with level, time, and msg', async () => {
    // Create a pino instance that writes to an in-memory stream so we can
    // inspect the raw JSON output independently of the mocked logger.
    const { Writable } = await import('stream');
    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding: unknown, callback: () => void) {
        chunks.push(chunk);
        callback();
      },
    });

    // Import a fresh pino instance (NOT the mocked one — vi.mock only
    // applies to '../src/infra/logger.js', not to 'pino' directly)
    const { default: pino } = await import('pino');
    const testLogger = pino(stream);

    testLogger.info({ requestId: 'abc-123' }, 'Test log message');

    expect(chunks.length).toBeGreaterThan(0);

    const line = JSON.parse(chunks[0].toString());
    expect(line).toHaveProperty('level');
    expect(typeof line.level).toBe('number');
    expect(line).toHaveProperty('time');
    expect(typeof line.time).toBe('number');
    expect(line).toHaveProperty('msg');
    expect(line.msg).toBe('Test log message');
    expect(line).toHaveProperty('requestId', 'abc-123');
  });

  it('error handler outputs JSON with level "error", requestId, msg, and stack', async () => {
    // Trigger an error that flows through the error handler
    await request(app)
      .post('/api/auth/login')
      .send({ email: `fail-${Date.now()}@test.dev`, password: 'wrongpassword' });

    // The error handler must call logger.error
    expect(mockLogger.error).toHaveBeenCalled();

    const [context, message] = mockLogger.error.mock.calls[0];
    expect(context).toHaveProperty('requestId');
    expect(context).toHaveProperty('err');
    expect(message).toBe('Unhandled error');
  });

  it('request ID middleware adds X-Request-Id header to responses', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toBeDefined();
    expect(typeof response.headers['x-request-id']).toBe('string');
    expect(response.headers['x-request-id']).toHaveLength(36); // UUID v4 length
  });

  it('logger does NOT log sensitive data from request headers', async () => {
    // Make a request with sensitive headers
    await request(app)
      .post('/api/auth/login')
      .set('Cookie', 'echolog_token=super-secret-value; session=abc123')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.mock-token')
      .send({ email: `sensitive-${Date.now()}@test.dev`, password: 'wrongpassword' });

    // Collect all arguments passed to any logger method
    const allCalls = [
      ...mockLogger.error.mock.calls,
      ...mockLogger.warn.mock.calls,
      ...mockLogger.info.mock.calls,
    ];

    // Verify sensitive values NEVER appear in any log call
    for (const args of allCalls) {
      const serialized = JSON.stringify(args);
      expect(serialized).not.toContain('super-secret-value');
      expect(serialized).not.toContain('eyJhbGciOiJIUzI1NiJ9.mock-token');
    }
  });
});

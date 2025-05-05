import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger.middleware';

// Mock encore.dev/log module
vi.mock('encore.dev/log', () => ({
  default: {
    info: vi.fn(),
  },
}));

// Mock encore.dev/api module
vi.mock('encore.dev/api', () => ({
  middleware: (_: unknown, handler: unknown) => handler,
}));

// Import mocked modules after mocking
import log from 'encore.dev/log';

// Define interfaces for test objects to avoid 'any' types
interface MockRequestMeta {
  pathAndQuery: string;
  method: string;
  api: {
    service: string;
    endpoint: string;
  };
  headers: Record<string, string>;
}

interface MockRequest {
  requestMeta: MockRequestMeta;
  data: Record<string, unknown>;
}

type NextFunction = (req: MockRequest) => Promise<unknown>;

describe('logger middleware', () => {
  let req: MockRequest;
  let next: NextFunction;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock request object
    req = {
      requestMeta: {
        pathAndQuery: '/api/test',
        method: 'GET',
        api: {
          service: 'test-service',
          endpoint: 'test-endpoint',
        },
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'user-agent': 'TestAgent/1.0',
        },
      },
      data: {},
    };

    // Mock next function
    next = vi.fn().mockResolvedValue('nextResult');
  });

  it('should log request information including IP and user-agent', async () => {
    // Call middleware
    const result = await logger(req, next);

    // Verify next was called
    expect(next).toHaveBeenCalledWith(req);

    // Verify result
    expect(result).toBe('nextResult');

    // Verify log was called with correct parameters
    expect(log.info).toHaveBeenCalledWith('middleware received request', {
      path: '/api/test',
      service: 'test-service',
      method: 'GET',
      ip: '192.168.1.1',
      user_agent: 'TestAgent/1.0',
    });
  });

  it('should handle missing headers gracefully', async () => {
    // Mock request with missing headers
    req.requestMeta.headers = {};

    // Call middleware
    await logger(req, next);

    // Verify log was called with fallback values
    expect(log.info).toHaveBeenCalledWith('middleware received request', {
      path: '/api/test',
      service: 'test-service',
      method: 'GET',
      ip: 'unknown',
      user_agent: 'unknown',
    });
  });
});

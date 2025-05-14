import { MiddlewareRequest, Next, middleware } from 'encore.dev/api';
import log from 'encore.dev/log';
import { APICallMeta } from 'encore.dev';

/**
 * Middleware to log request information including IP and User-Agent
 * - Logs request details before processing
 * - Adds structured information about the request for monitoring
 */
export const logger = middleware(
  {},
  async (req: MiddlewareRequest, next: Next) => {
    const apiCallMeta = req.requestMeta as APICallMeta;

    // Extract request information
    const service = apiCallMeta.api.service;
    const method = apiCallMeta.method;

    // Get IP address (might be behind proxies in X-Forwarded-For)
    const forwardedFor = apiCallMeta.headers['x-forwarded-for'] as
      | string
      | undefined;
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // Get User-Agent header
    const userAgent =
      (apiCallMeta.headers['user-agent'] as string | undefined) ?? 'unknown';

    // Log request information
    log.info('middleware received request', {
      path: apiCallMeta.pathAndQuery,
      service,
      method,
      ip,
      user_agent: userAgent,
    });

    // Add request data to the request object
    req.data.ip = ip;
    req.data.userAgent = userAgent;

    // Continue to the next middleware or controller
    return await next(req);
  },
);

import { APICallMeta } from 'encore.dev';
import { middleware, MiddlewareRequest, Next } from 'encore.dev/api';
import log from 'encore.dev/log';
import { parseApiError } from './errors';

/**
 * Logs controller errors with structured metadata
 */
function logError(
  error: Error | unknown,
  endpoint: string,
  service: string,
  host: string | undefined,
) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  log.error('middleware caught error', {
    error_name: error instanceof Error ? error.name : 'Unknown',
    error_message: error instanceof Error ? error.message : 'Unknown error',
    endpoint,
    service: service || 'unknown',
    host,
  });
}

/**
 * Middleware to handle errors in the application
 * - Catches errors thrown by controllers and other middleware
 * - Transforms domain errors to appropriate API errors
 * - Logs detailed information for debugging and monitoring
 * - Returns standardized error responses
 */
export const errorsMiddleware = middleware(
  {},
  async (req: MiddlewareRequest, next: Next) => {
    try {
      // Continue to the next middleware or controller
      return await next(req);
    } catch (error) {
      // Get request metadata for logging
      const apiCallMeta = req.requestMeta as APICallMeta;
      const endpoint = apiCallMeta.pathAndQuery || 'unknown';

      const service = apiCallMeta.api.service;
      const host = apiCallMeta.headers.host as string | undefined;
      // Log the error with structured metadata
      logError(error, endpoint, service, host);

      // If the error is already an APIError, rethrow it
      if (error instanceof Error && error.name === 'APIError') {
        throw error;
      }

      // Otherwise, transform it to the appropriate APIError
      throw parseApiError(error);
    }
  },
);

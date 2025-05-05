import { APICallMeta } from 'encore.dev';
import { middleware, MiddlewareRequest, Next } from 'encore.dev/api';
import log from 'encore.dev/log';
import { parseApiError } from './errors';
import { captureException } from './sentry';

/**
 * List of error types that should not be sent to Sentry
 * These errors will still be logged in normal application logs
 */
const EXCLUDED_SENTRY_ERRORS = [
  'NotFoundError', // Resource not found errors (404)
  'ValidationError', // Validation errors (400)
  'DuplicateError', // Duplicate resource errors (409)
];

/**
 * Checks if an error should be excluded from Sentry reporting
 */
function shouldExcludeFromSentry(error: Error | unknown): boolean {
  if (!(error instanceof Error)) return false;
  return EXCLUDED_SENTRY_ERRORS.includes(error.name);
}

/**
 * Logs controller errors with structured metadata
 */
function logError(
  error: Error | unknown,
  path: string,
  service: string,
  host: string | undefined,
) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  log.error('middleware caught error', {
    error_type: error instanceof Error ? error.name : 'Unknown',
    error_message: error instanceof Error ? error.message : 'Unknown error',
    path,
    service: service || 'unknown',
    host,
  });
}

/**
 * Middleware to handle errors in the application
 * - Catches errors thrown by controllers and other middleware
 * - Transforms domain errors to appropriate API errors
 * - Logs detailed information for debugging and monitoring
 * - Reports errors to Sentry for error tracking (except excluded types)
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
      const path = apiCallMeta.pathAndQuery || 'unknown';

      const service = apiCallMeta.api.service;
      const host = apiCallMeta.headers.host as string | undefined;

      // Log the error with structured metadata (all errors)
      logError(error, path, service, host);

      // Capture error in Sentry only if not excluded
      if (!shouldExcludeFromSentry(error)) {
        captureException(error, {
          path,
          service,
          host,
          method: apiCallMeta.method,
          headers: apiCallMeta.headers,
        });
      }

      // If the error is already an APIError, rethrow it
      if (error instanceof Error && error.name === 'APIError') {
        throw error;
      }

      // Otherwise, transform it to the appropriate APIError
      throw parseApiError(error);
    }
  },
);

import { middleware, MiddlewareRequest, Next } from 'encore.dev/api';
import { initializeSentry } from './sentry';

/**
 * Initialize Sentry on app startup
 * This middleware will run once at initialization time
 */
export const sentryMiddleware = middleware(
  (req: MiddlewareRequest, next: Next) => {
    // Initialize Sentry
    initializeSentry();

    return next(req);
  },
);

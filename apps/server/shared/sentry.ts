import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { appMeta } from 'encore.dev';
import log from 'encore.dev/log';
import { getSentryDSN } from '../inventory/secrets';

let isInitialized = false;

/**
 * Initialize Sentry for error tracking
 */
export function initializeSentry() {
  // Prevent multiple initializations
  if (isInitialized) {
    return;
  }

  try {
    // Get environment from appMeta
    const environment = appMeta().environment.type;

    // Skip Sentry initialization in development environments
    if (environment === 'development') {
      return;
    }

    // Get Sentry DSN from the inventory service
    const sentryDsn = getSentryDSN();

    // Only initialize if DSN is provided
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        environment: environment,
        integrations: [nodeProfilingIntegration()],
        // Tracing
        tracesSampleRate: 0.1, // Capture 10% of the transactions
        // Set sampling rate for profiling - this is evaluated once per SDK.init call
        profileSessionSampleRate: 0.1, // Capture 10% of the profiling sessions
        // Trace lifecycle automatically enables profiling during active traces
        profileLifecycle: 'trace',
        // Setting this option to true will send default PII data to Sentry
        sendDefaultPii: true,
      });

      isInitialized = true;
    } else {
      log.info('Sentry DSN not provided, skipping initialization');
    }
  } catch (error) {
    log.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Capture an exception in Sentry with additional context
 */
export function captureException(
  error: Error | unknown,
  additionalContext?: Record<string, unknown>,
) {
  try {
    // Get environment from appMeta
    const environment = appMeta().environment.type;

    // Skip capturing exceptions in development environments
    if (environment === 'development') {
      return;
    }

    // Initialize Sentry if it hasn't been initialized yet
    if (!isInitialized) {
      initializeSentry();
    }

    Sentry.captureException(error, {
      extra: additionalContext,
    });
  } catch (sentryError) {
    log.error('Failed to capture exception in Sentry:', sentryError);
  }
}

/**
 * Create and execute a traced span with profiling
 * @param name Name of the span to create
 * @param callback Function to execute within the span
 * @returns The result of the callback
 */
export function createTracedSpan<T>(name: string, callback: () => T): T {
  try {
    return Sentry.startSpan(
      {
        name,
      },
      () => {
        return callback();
      },
    );
  } catch (error) {
    log.error('Failed to create traced span:', error);
    // Execute the callback without tracing as fallback
    return callback();
  }
}
